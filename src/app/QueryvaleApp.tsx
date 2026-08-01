"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { modules, tasks } from "../content/curriculum";
import {
  createLocalAccount,
  createDefaultProgress,
  exportProgress,
  getProgressPersistenceIssue,
  hasLocalAccount,
  importProgress,
  isProgressPersistenceAvailable,
  loadProgress,
  MAX_PROGRESS_IMPORT_BYTES,
  saveProgress,
  type EditorSettings,
  type ProgressState,
  updateProfileName,
} from "../features/progress/progressStore";
import {
  resolveAccessibleTask,
  type TaskAccessResolution,
} from "../features/progress/moduleAccess";
import { selectResumeTask } from "../features/progress/resumeTask";
import type { AppScreen, Navigate, NavigateOptions } from "./appTypes";
import { AppHeader } from "./components/AppHeader";
import { AccountScreen } from "./screens/AccountScreen";
import { LandingScreen } from "./screens/LandingScreen";
import { LearningPathScreen } from "./screens/LearningPathScreen";
import { ProgressScreen } from "./screens/ProgressScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { WorkspaceScreen } from "./screens/WorkspaceScreen";

function routeFor(screen: AppScreen, taskId?: string): string {
  if (screen === "home") return "#/";
  if (screen === "account") return "#/giris";
  if (screen === "workspace") return `#/lab/${taskId ?? tasks[0]?.id ?? ""}`;
  return `#/${screen}`;
}

function screenFromHash(hash: string): AppScreen {
  if (hash.startsWith("#/lab/")) return "workspace";
  if (hash === "#/giris") return "account";
  if (hash === "#/learn") return "learn";
  if (hash === "#/progress") return "progress";
  if (hash === "#/settings") return "settings";
  return "home";
}

function taskIdFromHash(hash: string): string | undefined {
  if (!hash.startsWith("#/lab/")) return undefined;
  return decodeURIComponent(hash.slice("#/lab/".length));
}

function moduleLockMessage(
  resolution: TaskAccessResolution<(typeof tasks)[number]>,
): string {
  const requestedModule = modules.find(
    (module) => module.id === resolution.requestedTask?.moduleId,
  );
  return `“${requestedModule?.title ?? "Bu modül"}” henüz kilitli. Önce “${
    resolution.blockingModule?.title ?? "önceki"
  }” modülündeki tüm vakaları tamamla. Seni ilk açık eksik vakaya yönlendirdik.`;
}

export function QueryvaleApp() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [progress, setProgress] = useState<ProgressState>(() =>
    createDefaultProgress(),
  );
  const [activeTaskId, setActiveTaskId] = useState(tasks[0]?.id ?? "");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReplacingProgress, setIsReplacingProgress] = useState(false);
  const [isCreatingLocalAccount, setIsCreatingLocalAccount] = useState(false);
  const [persistenceAvailable, setPersistenceAvailable] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingAnchor, setPendingAnchor] =
    useState<NavigateOptions["anchor"]>();
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    message: string;
  }>();
  const progressRef = useRef(progress);
  const isLoadedRef = useRef(false);
  const isReplacingProgressRef = useRef(false);
  const shouldFocusScreenRef = useRef(false);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const localAccountWriteRef = useRef<Promise<boolean> | undefined>(undefined);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? tasks[0],
    [activeTaskId],
  );
  const resumeSelection = useMemo(() => {
    const selection = selectResumeTask(tasks, progress);
    const access = resolveAccessibleTask(
      selection.task?.id,
      modules,
      tasks,
      progress.tasks,
    );
    return access.wasRedirected
      ? { ...selection, task: access.task }
      : selection;
  }, [progress]);
  const completedTaskCount = useMemo(
    () => tasks.filter((task) => progress.tasks[task.id]?.completed).length,
    [progress.tasks],
  );
  const localAccountExists = hasLocalAccount(progress);

  useEffect(() => {
    let current = true;
    void loadProgress().then((stored) => {
      if (!current) return;
      const hashTask = taskIdFromHash(window.location.hash);
      const hashCandidate = tasks.find((task) => task.id === hashTask);
      const resumeCandidate = selectResumeTask(tasks, stored).task;
      const requestedTask = hashCandidate ?? resumeCandidate ?? tasks[0];
      const access = resolveAccessibleTask(
        requestedTask?.id,
        modules,
        tasks,
        stored.tasks,
      );
      const candidateTask = access.task;
      if (hashCandidate && access.wasRedirected && candidateTask) {
        window.history.replaceState(
          null,
          "",
          routeFor("workspace", candidateTask.id),
        );
      }
      const hydratedProgress =
        candidateTask &&
        (!stored.lastOpenedTaskIdTrusted ||
          stored.lastOpenedTaskId !== candidateTask.id)
          ? {
              ...stored,
              lastOpenedTaskId: candidateTask.id,
              lastOpenedTaskIdTrusted: true,
            }
          : stored;
      if (hydratedProgress !== stored) {
        const hydrationWrite = saveProgress(hydratedProgress);
        saveQueueRef.current = hydrationWrite.catch(() => undefined);
        void hydrationWrite.catch(() => {
          setPersistenceAvailable(false);
          setNotice({
            tone: "error",
            message: "Kaldığın vaka bu cihazda kaydedilemedi.",
          });
        });
      }
      progressRef.current = hydratedProgress;
      isLoadedRef.current = true;
      setProgress(hydratedProgress);
      setActiveTaskId(candidateTask?.id ?? "");
      setScreen(screenFromHash(window.location.hash));
      setIsLoaded(true);
      const canPersist = isProgressPersistenceAvailable();
      setPersistenceAvailable(canPersist);
      if (!canPersist) {
        const persistenceIssue = getProgressPersistenceIssue();
        setNotice({
          tone: "error",
          message:
            persistenceIssue === "incompatible"
              ? "Mevcut ilerleme kaydı bu sürümle uyumlu değil; korunuyor ve yeni değişiklikler kaydedilmeyecek. Geçerli bir yedeği Ayarlar’dan içe aktarabilir veya ilerlemeyi açıkça sıfırlayabilirsin."
              : "Kalıcı depolama kullanılamıyor; ilerleme bu oturum boyunca bellekte tutulacak.",
        });
      }
      if (access.wasRedirected) {
        setNotice({ tone: "error", message: moduleLockMessage(access) });
      }
    });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !shouldFocusScreenRef.current) return;
    shouldFocusScreenRef.current = false;
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [isLoaded, screen]);

  useEffect(() => {
    document.documentElement.dataset.theme = progress.settings.theme;
    document.documentElement.dataset.reducedMotion = String(
      progress.settings.reducedMotion,
    );
  }, [progress.settings.reducedMotion, progress.settings.theme]);

  useEffect(() => {
    if (!isLoaded || screen !== "home" || !pendingAnchor) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(pendingAnchor);
      if (!target) return;
      const reduceMotion =
        progress.settings.reducedMotion ||
        (typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
      target.focus({ preventScroll: true });
      setPendingAnchor(undefined);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isLoaded, pendingAnchor, progress.settings.reducedMotion, screen]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(
      () => setNotice(undefined),
      notice.tone === "error" ? 8_000 : 2_800,
    );
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const enqueueSave = useCallback(
    (
      next: ProgressState,
      options: { replaceIncompatible?: boolean } = {},
    ): Promise<void> => {
      const write = saveQueueRef.current
        .catch(() => undefined)
        .then(() => saveProgress(next, options));
      saveQueueRef.current = write.catch(() => undefined);
      return write;
    },
    [],
  );

  const persist = useCallback(
    (next: ProgressState) => {
      if (!isLoadedRef.current || isReplacingProgressRef.current) return;
      progressRef.current = next;
      setProgress(next);
      void enqueueSave(next)
        .then(() => setPersistenceAvailable(isProgressPersistenceAvailable()))
        .catch(() => {
          setPersistenceAvailable(false);
          setNotice({
            tone: "error",
            message: "İlerleme bu cihazda kaydedilemedi.",
          });
        });
    },
    [enqueueSave],
  );

  useEffect(() => {
    const listener = () => {
      const nextScreen = screenFromHash(window.location.hash);
      const hashTask = taskIdFromHash(window.location.hash);
      const requestedTask = tasks.find((task) => task.id === hashTask);
      if (requestedTask) {
        const access = resolveAccessibleTask(
          requestedTask.id,
          modules,
          tasks,
          progressRef.current.tasks,
        );
        const accessibleTask = access.task ?? tasks[0];
        if (access.wasRedirected && accessibleTask) {
          window.history.replaceState(
            null,
            "",
            routeFor("workspace", accessibleTask.id),
          );
          setNotice({ tone: "error", message: moduleLockMessage(access) });
        }
        setActiveTaskId(accessibleTask?.id ?? "");
        if (isLoadedRef.current) {
          const current = progressRef.current;
          if (
            current.lastOpenedTaskId !== accessibleTask?.id ||
            !current.lastOpenedTaskIdTrusted
          ) {
            persist({
              ...current,
              lastOpenedTaskId: accessibleTask?.id ?? current.lastOpenedTaskId,
              lastOpenedTaskIdTrusted: true,
            });
          }
        }
      }
      if (isLoadedRef.current) shouldFocusScreenRef.current = true;
      setScreen(nextScreen);
    };
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, [persist]);

  const persistWorkspaceProgress = useCallback(
    (update: (current: ProgressState) => ProgressState) => {
      const current = progressRef.current;
      const next = update(current);
      if (next.profile.id !== current.profile.id) return;
      persist({
        ...current,
        lastOpenedTaskId: next.lastOpenedTaskId,
        lastOpenedTaskIdTrusted: next.lastOpenedTaskIdTrusted,
        activityDates: next.activityDates,
        tasks: next.tasks,
        evidenceByTaskId: next.evidenceByTaskId,
      });
    },
    [persist],
  );

  const replaceProgress = useCallback(
    async (next: ProgressState): Promise<void> => {
      const previous = progressRef.current;
      isReplacingProgressRef.current = true;
      setIsReplacingProgress(true);
      progressRef.current = next;
      setProgress(next);
      try {
        await enqueueSave(next, { replaceIncompatible: true });
        setPersistenceAvailable(isProgressPersistenceAvailable());
      } catch (error) {
        setPersistenceAvailable(false);
        progressRef.current = previous;
        setProgress(previous);
        throw error;
      } finally {
        isReplacingProgressRef.current = false;
        setIsReplacingProgress(false);
      }
    },
    [enqueueSave],
  );

  const navigate = useCallback<Navigate>(
    (nextScreen: AppScreen, options?: NavigateOptions) => {
      let nextTaskId = activeTaskId || tasks[0]?.id;
      if (nextScreen === "workspace") {
        const requested = tasks.find((task) => task.id === options?.taskId);
        const access = resolveAccessibleTask(
          requested?.id ?? nextTaskId,
          modules,
          tasks,
          progressRef.current.tasks,
        );
        nextTaskId = access.task?.id ?? nextTaskId;
        if (access.wasRedirected) {
          setNotice({ tone: "error", message: moduleLockMessage(access) });
        }
        if (nextTaskId) {
          setActiveTaskId(nextTaskId);
          const nextProgress = {
            ...progressRef.current,
            lastOpenedTaskId: nextTaskId,
            lastOpenedTaskIdTrusted: true,
          };
          persist(nextProgress);
        }
      }
      setShowOnboarding(Boolean(options?.onboarding));
      setPendingAnchor(options?.anchor);
      const nextRoute = routeFor(nextScreen, nextTaskId);
      shouldFocusScreenRef.current = !options?.anchor;
      setScreen(nextScreen);
      if (window.location.hash !== nextRoute) window.location.hash = nextRoute;
      const reduceMotion =
        progressRef.current.settings.reducedMotion ||
        (typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      if (!options?.anchor) {
        window.scrollTo({
          top: 0,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      }
    },
    [activeTaskId, persist],
  );

  const updateSettings = useCallback(
    (settings: EditorSettings) => {
      persist({ ...progressRef.current, settings });
    },
    [persist],
  );

  const handleProfileNameChange = useCallback(
    (name: string) => {
      try {
        const next = updateProfileName(progressRef.current, name);
        persist(next);
        setNotice({
          tone: "success",
          message: `Profil adı ${next.profile.displayName} olarak kaydedildi.`,
        });
      } catch (error) {
        setNotice({
          tone: "error",
          message:
            error instanceof Error
              ? error.message
              : "Profil adı kaydedilemedi.",
        });
      }
    },
    [persist],
  );

  const openResumeWorkspace = useCallback(() => {
    navigate("workspace", {
      taskId: resumeSelection.task?.id,
      onboarding: resumeSelection.shouldShowOnboarding,
    });
  }, [navigate, resumeSelection]);

  const handleCreateLocalProfile = useCallback(
    (name: string): Promise<boolean> => {
      if (localAccountWriteRef.current) {
        return localAccountWriteRef.current;
      }
      setIsCreatingLocalAccount(true);
      const operation = (async () => {
        try {
          const accountBase = progressRef.current;
          const accountSnapshot = createLocalAccount(accountBase, name);
          await enqueueSave(accountSnapshot);

          let finalProgress = accountSnapshot;
          if (progressRef.current !== accountBase) {
            let mergedWithoutLosingActivity = false;
            for (let attempt = 0; attempt < 4; attempt += 1) {
              const current = progressRef.current;
              const merged = { ...current, profile: accountSnapshot.profile };
              await enqueueSave(merged);
              if (progressRef.current === current) {
                finalProgress = merged;
                mergedWithoutLosingActivity = true;
                break;
              }
            }
            if (!mergedWithoutLosingActivity) {
              throw new Error(
                "Profil kaydı sırasında çalışma değişmeye devam etti. Lütfen tekrar dene.",
              );
            }
          }

          if (!isProgressPersistenceAvailable()) {
            throw new Error(
              "Yerel profil bu cihazda kalıcı olarak kaydedilemedi.",
            );
          }
          progressRef.current = finalProgress;
          setProgress(finalProgress);
          setPersistenceAvailable(true);
          setNotice({
            tone: "success",
            message: `Yerel profil ${finalProgress.profile.displayName} adıyla hazır.`,
          });
          return true;
        } catch (error) {
          setPersistenceAvailable(isProgressPersistenceAvailable());
          setNotice({
            tone: "error",
            message:
              error instanceof Error
                ? error.message
                : "Yerel profil bu cihazda kaydedilemedi.",
          });
          return false;
        }
      })();
      localAccountWriteRef.current = operation;
      void operation.finally(() => {
        if (localAccountWriteRef.current === operation) {
          localAccountWriteRef.current = undefined;
          setIsCreatingLocalAccount(false);
        }
      });
      return operation;
    },
    [enqueueSave],
  );

  const handleExport = () => {
    const currentProgress = progressRef.current;
    const blob = new Blob([exportProgress(currentProgress)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const profileSlug = currentProgress.profile.displayName
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLocaleLowerCase("tr-TR");
    link.download = `queryvale-${profileSlug || "profil"}-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice({
      tone: "success",
      message: "İlerleme dosyası dışa aktarıldı.",
    });
  };

  const handleImport = async (file: File) => {
    if (file.size > MAX_PROGRESS_IMPORT_BYTES) {
      setNotice({
        tone: "error",
        message: "İlerleme dosyası güvenli boyut sınırını aşıyor.",
      });
      return;
    }

    let contents: string;
    try {
      contents = await file.text();
    } catch {
      setNotice({
        tone: "error",
        message: "İlerleme dosyası bu tarayıcıda okunamadı.",
      });
      return;
    }

    try {
      const imported = importProgress(contents);
      const currentProgress = progressRef.current;
      const sameProfile = imported.profile.id === currentProgress.profile.id;
      const currentCompleted = tasks.filter(
        (task) => currentProgress.tasks[task.id]?.completed,
      ).length;
      const importedCompleted = tasks.filter(
        (task) => imported.tasks[task.id]?.completed,
      ).length;
      const sourceSummary = sameProfile
        ? `Bu dosya mevcut “${imported.profile.displayName}” profilinin bir yedeği.`
        : `Bu dosya “${imported.profile.displayName}” profiline ait.`;
      const confirmed = window.confirm(
        `${sourceSummary} Mevcut kayıtta ${currentCompleted}, yedekte ${importedCompleted} tamamlanmış vaka var; yedek ${new Intl.DateTimeFormat(
          "tr-TR",
          { dateStyle: "medium" },
        ).format(
          new Date(imported.startedAt),
        )} tarihinde başlatılmış. “${currentProgress.profile.displayName}” profilindeki mevcut ilerlemenin tamamı bu yedekle değiştirilsin mi?`,
      );
      if (!confirmed) {
        return;
      }
      const importedResumeTask = selectResumeTask(tasks, imported).task;
      const importedAccess = resolveAccessibleTask(
        importedResumeTask?.id,
        modules,
        tasks,
        imported.tasks,
      );
      const normalizedImport = {
        ...imported,
        lastOpenedTaskId: importedAccess.task?.id ?? imported.lastOpenedTaskId,
        lastOpenedTaskIdTrusted: true,
      };
      await replaceProgress(normalizedImport);
      setActiveTaskId(
        tasks.some((task) => task.id === normalizedImport.lastOpenedTaskId)
          ? normalizedImport.lastOpenedTaskId
          : (tasks[0]?.id ?? ""),
      );
      setNotice({
        tone: "success",
        message: "İlerleme kaydı güvenle içe aktarıldı.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "İlerleme dosyası okunamadı veya içe aktarılamadı.",
      });
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      "Tüm vaka geçmişi ve sorgular kalıcı olarak sıfırlansın mı? Profil adın ve çalışma tercihlerin korunacak.",
    );
    if (!confirmed) return;
    const currentProgress = progressRef.current;
    const reset = {
      ...createDefaultProgress(),
      profile: currentProgress.profile,
      settings: currentProgress.settings,
    };
    try {
      await replaceProgress(reset);
      setActiveTaskId(tasks[0]?.id ?? "");
      setNotice({
        tone: "success",
        message: "İlerleme başlangıç durumuna döndü.",
      });
    } catch {
      setNotice({
        tone: "error",
        message: "İlerleme sıfırlanamadı; mevcut kaydın korunuyor.",
      });
    }
  };

  return (
    <>
      {isCreatingLocalAccount ? (
        <span className="sr-only" role="status" aria-live="polite" aria-atomic>
          Yerel profil hazırlanıyor ve güvenle kaydediliyor.
        </span>
      ) : null}
      <div
        className="app-shell"
        data-screen={screen}
        aria-busy={!isLoaded || isReplacingProgress || isCreatingLocalAccount}
        inert={!isLoaded || isReplacingProgress || isCreatingLocalAccount}
      >
        <AppHeader
          screen={screen}
          onNavigate={navigate}
          onStudio={openResumeWorkspace}
          onHowItWorks={() => navigate("home", { anchor: "queryvale-studio" })}
          onStart={() => navigate("account")}
          disabled={isCreatingLocalAccount}
          startLabel={
            localAccountExists
              ? "Profiline gir ve kaldığın vakaya devam et"
              : resumeSelection.isReturningLearner
                ? "Yerel profil oluştur veya kaldığın vakaya devam et"
                : "Hesap oluştur ve ilk vakaya başla"
          }
        />

        {screen === "home" && (
          <LandingScreen
            onStart={() => navigate("account")}
            resumeTask={resumeSelection.task}
            isReturningLearner={resumeSelection.isReturningLearner}
            hasLocalAccount={localAccountExists}
            startDisabled={isCreatingLocalAccount}
            reducedMotion={progress.settings.reducedMotion}
          />
        )}
        {screen === "account" && (
          <AccountScreen
            profileName={progress.profile.displayName}
            hasLocalAccount={localAccountExists}
            hasLearningProgress={resumeSelection.isReturningLearner}
            completedCount={completedTaskCount}
            totalCount={tasks.length}
            resumeTaskTitle={resumeSelection.task?.title}
            persistenceAvailable={persistenceAvailable}
            writePending={isCreatingLocalAccount}
            onCreateProfile={handleCreateLocalProfile}
            onContinue={openResumeWorkspace}
            onGuestContinue={openResumeWorkspace}
          />
        )}
        {screen === "learn" && (
          <LearningPathScreen
            modules={modules}
            tasks={tasks}
            progress={progress}
            onNavigate={navigate}
          />
        )}
        {screen === "workspace" && activeTask && (
          <WorkspaceScreen
            key={activeTask.id}
            task={activeTask}
            modules={modules}
            tasks={tasks}
            progress={progress}
            settings={progress.settings}
            persistenceAvailable={persistenceAvailable}
            showFirstCaseGuide={showOnboarding}
            onDismissFirstCaseGuide={() => setShowOnboarding(false)}
            onProgressChange={persistWorkspaceProgress}
            onNavigate={navigate}
          />
        )}
        {screen === "progress" && (
          <ProgressScreen
            modules={modules}
            tasks={tasks}
            progress={progress}
            profileName={progress.profile.displayName}
            onProfileNameChange={handleProfileNameChange}
            onNavigate={navigate}
          />
        )}
        {screen === "settings" && (
          <SettingsScreen
            settings={progress.settings}
            onChange={updateSettings}
            onExport={handleExport}
            onImport={handleImport}
            onReset={handleReset}
          />
        )}

        {notice && (
          <div className="toast" role="status">
            {notice.tone === "success" ? (
              <CheckCircle2 size={14} />
            ) : (
              <CircleAlert size={14} />
            )}
            {notice.message}
          </div>
        )}
      </div>
    </>
  );
}
