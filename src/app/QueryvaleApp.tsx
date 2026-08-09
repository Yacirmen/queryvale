"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { modules, tasks } from "../content/curriculum";
import { pythonModules, pythonTasks } from "../content/pythonCurriculum";
import {
  activateLocalProfileSession,
  createActiveLocalProfileSession,
  createSignedOutLocalProfileSession,
  createLocalAccount,
  createDefaultProgress,
  eraseLocalProfileAndProgress,
  exportProgress,
  getProgressPersistenceIssue,
  hasLocalAccount,
  importProgress,
  isProgressPersistenceAvailable,
  loadLocalProfileSession,
  loadProgress,
  MAX_PROGRESS_IMPORT_BYTES,
  saveProgress,
  saveProgressWithLocalProfileSession,
  signOutLocalProfileSession,
  type EditorSettings,
  type LocalProfileAccess,
  type LocalProfileSession,
  type ProgressState,
  updateProfileName,
} from "../features/progress/progressStore";
import { resolveAccessibleTask } from "../features/progress/moduleAccess";
import { selectResumeTask } from "../features/progress/resumeTask";
import { resolveAccessiblePythonTask } from "../features/progress/pythonAccess";
import { PythonRuntimeClient } from "../features/python-engine";
import type { AppScreen, Navigate, NavigateOptions } from "./appTypes";
import { AppHeader } from "./components/AppHeader";
import { AccountScreen } from "./screens/AccountScreen";
import { LandingScreen } from "./screens/LandingScreen";
import { LearningPathScreen } from "./screens/LearningPathScreen";
import { ProgressScreen } from "./screens/ProgressScreen";
import { PythonStudioScreen } from "./screens/PythonStudioScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { WorkspaceScreen } from "./screens/WorkspaceScreen";

function routeFor(screen: AppScreen, taskId?: string): string {
  if (screen === "home") return "#/";
  if (screen === "account") return "#/giris";
  if (screen === "workspace") return `#/lab/${taskId ?? tasks[0]?.id ?? ""}`;
  if (screen === "python")
    return `#/python/${taskId ?? pythonTasks[0]?.id ?? ""}`;
  return `#/${screen}`;
}

function screenFromHash(hash: string): AppScreen {
  if (hash.startsWith("#/lab/")) return "workspace";
  if (hash.startsWith("#/python/")) return "python";
  if (hash === "#/giris") return "account";
  if (hash === "#/learn") return "learn";
  if (hash === "#/progress") return "progress";
  if (hash === "#/settings") return "settings";
  return "home";
}

function pythonTaskIdFromHash(hash: string): string | undefined {
  if (!hash.startsWith("#/python/")) return undefined;
  return decodeURIComponent(hash.slice("#/python/".length));
}

function taskIdFromHash(hash: string): string | undefined {
  if (!hash.startsWith("#/lab/")) return undefined;
  return decodeURIComponent(hash.slice("#/lab/".length));
}

export function QueryvaleApp() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [progress, setProgress] = useState<ProgressState>(() =>
    createDefaultProgress(),
  );
  const [activeTaskId, setActiveTaskId] = useState(tasks[0]?.id ?? "");
  const [activePythonTaskId, setActivePythonTaskId] = useState(
    pythonTasks[0]?.id ?? "",
  );
  const [pythonRuntime] = useState(() => new PythonRuntimeClient());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReplacingProgress, setIsReplacingProgress] = useState(false);
  const [isCreatingLocalAccount, setIsCreatingLocalAccount] = useState(false);
  const [isUpdatingLocalProfile, setIsUpdatingLocalProfile] = useState(false);
  const [localProfileAccess, setLocalProfileAccess] =
    useState<LocalProfileAccess>("guest");
  const [persistenceAvailable, setPersistenceAvailable] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [landingStudiosUnlocked, setLandingStudiosUnlocked] = useState(false);
  const [landingUnlockAnnounced, setLandingUnlockAnnounced] = useState(false);
  const [pendingAnchor, setPendingAnchor] =
    useState<NavigateOptions["anchor"]>();
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    message: string;
  }>();
  const progressRef = useRef(progress);
  const isLoadedRef = useRef(false);
  const isReplacingProgressRef = useRef(false);
  const localProfileAccessRef = useRef<LocalProfileAccess>("guest");
  const landingStudiosUnlockedRef = useRef(false);
  const shouldFocusScreenRef = useRef(false);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const localAccountWriteRef = useRef<Promise<boolean> | undefined>(undefined);
  const profileSessionWriteRef = useRef<Promise<boolean> | undefined>(
    undefined,
  );
  const previousScreenRef = useRef<AppScreen>("home");

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? tasks[0],
    [activeTaskId],
  );
  const activePythonTask = useMemo(
    () =>
      pythonTasks.find((task) => task.id === activePythonTaskId) ??
      pythonTasks[0],
    [activePythonTaskId],
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
  const resumePythonTask = useMemo(
    () =>
      resolveAccessiblePythonTask(
        progress.lastOpenedPythonTaskId,
        pythonModules,
        pythonTasks,
        progress.pythonTasks,
      ).task,
    [progress.lastOpenedPythonTaskId, progress.pythonTasks],
  );
  const hasPythonLearningProgress = useMemo(
    () =>
      Object.values(progress.pythonTasks).some(
        (task) =>
          task.completed ||
          task.attempts > 0 ||
          task.hintsUsed.length > 0 ||
          task.solutionRevealed ||
          task.lastCode.trim().length > 0,
      ),
    [progress.pythonTasks],
  );
  const hasAnyLearningProgress =
    resumeSelection.isReturningLearner || hasPythonLearningProgress;
  const completedTaskCount = useMemo(
    () =>
      tasks.filter((task) => progress.tasks[task.id]?.completed).length +
      pythonTasks.filter((task) => progress.pythonTasks[task.id]?.completed)
        .length,
    [progress.pythonTasks, progress.tasks],
  );
  const localAccountExists = hasLocalAccount(progress);
  const localProfileActive =
    localAccountExists && localProfileAccess === "active";

  const unlockLandingStudios = useCallback(() => {
    if (landingStudiosUnlockedRef.current) return;
    landingStudiosUnlockedRef.current = true;
    setLandingStudiosUnlocked(true);
    setLandingUnlockAnnounced(true);
  }, []);

  useEffect(() => {
    let current = true;
    void loadProgress().then(async (stored) => {
      const loadedProfileSession = await loadLocalProfileSession(stored);
      if (!current) return;
      const hydratedProfileAccess = loadedProfileSession.access;
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
      const hashPythonTask = pythonTaskIdFromHash(window.location.hash);
      const hashPythonCandidate = pythonTasks.find(
        (task) => task.id === hashPythonTask,
      );
      const pythonAccess = resolveAccessiblePythonTask(
        hashPythonCandidate?.id ?? stored.lastOpenedPythonTaskId,
        pythonModules,
        pythonTasks,
        stored.pythonTasks,
      );
      const candidatePythonTask = pythonAccess.task;
      if (
        window.location.hash.startsWith("#/python/") &&
        (!hashPythonCandidate || pythonAccess.wasRedirected) &&
        candidatePythonTask
      ) {
        window.history.replaceState(
          null,
          "",
          routeFor("python", candidatePythonTask.id),
        );
      }
      const sqlHydratedProgress =
        candidateTask &&
        (!stored.lastOpenedTaskIdTrusted ||
          stored.lastOpenedTaskId !== candidateTask.id)
          ? {
              ...stored,
              lastOpenedTaskId: candidateTask.id,
              lastOpenedTaskIdTrusted: true,
            }
          : stored;
      const hydratedProgress =
        candidatePythonTask &&
        sqlHydratedProgress.lastOpenedPythonTaskId !== candidatePythonTask.id
          ? {
              ...sqlHydratedProgress,
              lastOpenedPythonTaskId: candidatePythonTask.id,
            }
          : sqlHydratedProgress;
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
      localProfileAccessRef.current = hydratedProfileAccess;
      isLoadedRef.current = true;
      setProgress(hydratedProgress);
      setLocalProfileAccess(hydratedProfileAccess);
      setActiveTaskId(candidateTask?.id ?? "");
      setActivePythonTaskId(candidatePythonTask?.id ?? "");
      const requestedScreen = screenFromHash(window.location.hash);
      const hydratedScreen =
        requestedScreen === "progress" && hydratedProfileAccess === "signed-out"
          ? "account"
          : requestedScreen === "account" && hydratedProfileAccess === "active"
            ? "progress"
            : requestedScreen;
      if (hydratedScreen !== requestedScreen) {
        window.history.replaceState(null, "", routeFor(hydratedScreen));
      }
      setScreen(hydratedScreen);
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
    });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !shouldFocusScreenRef.current) return;
    shouldFocusScreenRef.current = false;
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [activePythonTaskId, activeTaskId, isLoaded, screen]);

  useEffect(() => {
    if (previousScreenRef.current === "python" && screen !== "python") {
      pythonRuntime.dispose();
    }
    previousScreenRef.current = screen;
  }, [pythonRuntime, screen]);

  useEffect(
    () => () => {
      pythonRuntime.dispose();
    },
    [pythonRuntime],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = progress.settings.theme;
    document.documentElement.dataset.reducedMotion = String(
      progress.settings.reducedMotion,
    );
  }, [progress.settings.reducedMotion, progress.settings.theme]);

  useEffect(() => {
    if (!isLoaded || !pendingAnchor) return;
    const anchorScreen =
      pendingAnchor === "settings-help" ? "settings" : "home";
    if (screen !== anchorScreen) return;
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

  const enqueueSaveWithProfileSession = useCallback(
    (
      next: ProgressState,
      session: LocalProfileSession | undefined,
      options: { replaceIncompatible?: boolean } = {},
    ): Promise<void> => {
      const write = saveQueueRef.current
        .catch(() => undefined)
        .then(() =>
          saveProgressWithLocalProfileSession(next, session, options),
        );
      saveQueueRef.current = write.catch(() => undefined);
      return write;
    },
    [],
  );

  const persist = useCallback(
    (next: ProgressState) => {
      if (
        !isLoadedRef.current ||
        isReplacingProgressRef.current ||
        profileSessionWriteRef.current
      )
        return;
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
      // Initial hydration resolves the current hash against persisted module
      // access. A queued hashchange must not evaluate that route against the
      // temporary empty progress state and incorrectly send returning users
      // back to the first case.
      if (!isLoadedRef.current) return;
      const requestedScreen = screenFromHash(window.location.hash);
      const nextScreen =
        requestedScreen === "progress" &&
        localProfileAccessRef.current === "signed-out"
          ? "account"
          : requestedScreen === "account" &&
              localProfileAccessRef.current === "active"
            ? "progress"
            : requestedScreen;
      if (nextScreen !== requestedScreen) {
        window.history.replaceState(null, "", routeFor(nextScreen));
      }
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
      if (nextScreen === "python") {
        const hashPythonTask = pythonTaskIdFromHash(window.location.hash);
        const requestedPythonTask = pythonTasks.find(
          (task) => task.id === hashPythonTask,
        );
        const access = resolveAccessiblePythonTask(
          requestedPythonTask?.id ?? progressRef.current.lastOpenedPythonTaskId,
          pythonModules,
          pythonTasks,
          progressRef.current.pythonTasks,
        );
        const accessibleTask = access.task ?? pythonTasks[0];
        if ((!requestedPythonTask || access.wasRedirected) && accessibleTask) {
          window.history.replaceState(
            null,
            "",
            routeFor("python", accessibleTask.id),
          );
        }
        setActivePythonTaskId(accessibleTask?.id ?? "");
        if (
          accessibleTask &&
          progressRef.current.lastOpenedPythonTaskId !== accessibleTask.id
        ) {
          persist({
            ...progressRef.current,
            lastOpenedPythonTaskId: accessibleTask.id,
          });
        }
      }
      shouldFocusScreenRef.current = true;
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

  const persistPythonProgress = useCallback(
    (update: (current: ProgressState) => ProgressState) => {
      const current = progressRef.current;
      const next = update(current);
      if (next.profile.id !== current.profile.id) return;
      persist({
        ...current,
        lastOpenedPythonTaskId: next.lastOpenedPythonTaskId,
        activityDates: next.activityDates,
        pythonTasks: next.pythonTasks,
        pythonEvidenceByTaskId: next.pythonEvidenceByTaskId,
      });
    },
    [persist],
  );

  const replaceProgress = useCallback(
    async (
      next: ProgressState,
      nextProfileAccess: LocalProfileAccess = hasLocalAccount(next)
        ? localProfileAccessRef.current
        : "guest",
    ): Promise<void> => {
      const previous = progressRef.current;
      const previousProfileAccess = localProfileAccessRef.current;
      const nextSession =
        nextProfileAccess === "active"
          ? createActiveLocalProfileSession(next)
          : nextProfileAccess === "signed-out"
            ? createSignedOutLocalProfileSession(next)
            : undefined;
      isReplacingProgressRef.current = true;
      setIsReplacingProgress(true);
      progressRef.current = next;
      setProgress(next);
      try {
        await enqueueSaveWithProfileSession(next, nextSession, {
          replaceIncompatible: true,
        });
        localProfileAccessRef.current = nextProfileAccess;
        setLocalProfileAccess(nextProfileAccess);
        setPersistenceAvailable(isProgressPersistenceAvailable());
      } catch (error) {
        setPersistenceAvailable(false);
        progressRef.current = previous;
        localProfileAccessRef.current = previousProfileAccess;
        setProgress(previous);
        setLocalProfileAccess(previousProfileAccess);
        throw error;
      } finally {
        isReplacingProgressRef.current = false;
        setIsReplacingProgress(false);
      }
    },
    [enqueueSaveWithProfileSession],
  );

  const navigate = useCallback<Navigate>(
    (requestedScreen: AppScreen, options?: NavigateOptions) => {
      const nextScreen =
        requestedScreen === "progress" &&
        localProfileAccessRef.current === "signed-out"
          ? "account"
          : requestedScreen === "account" &&
              localProfileAccessRef.current === "active"
            ? "progress"
            : requestedScreen;
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
      if (nextScreen === "python") {
        const requested = pythonTasks.find(
          (task) => task.id === options?.taskId,
        );
        const access = resolveAccessiblePythonTask(
          requested?.id ??
            activePythonTaskId ??
            progressRef.current.lastOpenedPythonTaskId,
          pythonModules,
          pythonTasks,
          progressRef.current.pythonTasks,
        );
        nextTaskId = access.task?.id ?? pythonTasks[0]?.id;
        if (nextTaskId) {
          setActivePythonTaskId(nextTaskId);
          persist({
            ...progressRef.current,
            lastOpenedPythonTaskId: nextTaskId,
          });
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
    [activePythonTaskId, activeTaskId, persist],
  );

  const updateSettings = useCallback(
    (settings: EditorSettings) => {
      persist({ ...progressRef.current, settings });
    },
    [persist],
  );

  const handleProfileNameChange = useCallback(
    (name: string) => {
      if (profileSessionWriteRef.current) return;
      try {
        const current = progressRef.current;
        const next = updateProfileName(current, name);
        if (!hasLocalAccount(current) && hasLocalAccount(next)) {
          progressRef.current = next;
          setProgress(next);
          setIsUpdatingLocalProfile(true);
          void enqueueSaveWithProfileSession(
            next,
            createActiveLocalProfileSession(next),
          )
            .then(() => {
              localProfileAccessRef.current = "active";
              setLocalProfileAccess("active");
              setPersistenceAvailable(isProgressPersistenceAvailable());
              setNotice({
                tone: "success",
                message: `Profil adı ${next.profile.displayName} olarak kaydedildi.`,
              });
            })
            .catch(() => {
              progressRef.current = current;
              setProgress(current);
              setPersistenceAvailable(isProgressPersistenceAvailable());
              setNotice({
                tone: "error",
                message: "Profil adı bu cihazda kalıcı olarak kaydedilemedi.",
              });
            })
            .finally(() => setIsUpdatingLocalProfile(false));
          return;
        }
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
    [enqueueSaveWithProfileSession, persist],
  );

  const openResumeWorkspace = useCallback(() => {
    navigate("workspace", {
      taskId: resumeSelection.task?.id,
      onboarding: resumeSelection.shouldShowOnboarding,
    });
  }, [navigate, resumeSelection]);

  const openResumePythonStudio = useCallback(() => {
    navigate("python", {
      taskId: resumePythonTask?.id ?? pythonTasks[0]?.id,
    });
  }, [navigate, resumePythonTask?.id]);

  const openResumeLearning = useCallback(() => {
    if (!resumeSelection.isReturningLearner && hasPythonLearningProgress) {
      openResumePythonStudio();
      return;
    }
    openResumeWorkspace();
  }, [
    hasPythonLearningProgress,
    openResumePythonStudio,
    openResumeWorkspace,
    resumeSelection.isReturningLearner,
  ]);

  const handleCreateLocalProfile = useCallback(
    (name: string): Promise<boolean> => {
      if (profileSessionWriteRef.current) return Promise.resolve(false);
      if (localAccountWriteRef.current) {
        return localAccountWriteRef.current;
      }
      setIsCreatingLocalAccount(true);
      const operation = (async () => {
        try {
          const accountBase = progressRef.current;
          const accountSnapshot = createLocalAccount(accountBase, name);
          await enqueueSaveWithProfileSession(
            accountSnapshot,
            createActiveLocalProfileSession(accountSnapshot),
          );

          let finalProgress = accountSnapshot;
          if (progressRef.current !== accountBase) {
            let mergedWithoutLosingActivity = false;
            for (let attempt = 0; attempt < 4; attempt += 1) {
              const current = progressRef.current;
              const merged = { ...current, profile: accountSnapshot.profile };
              await enqueueSaveWithProfileSession(
                merged,
                createActiveLocalProfileSession(merged),
              );
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
          localProfileAccessRef.current = "active";
          setProgress(finalProgress);
          setLocalProfileAccess("active");
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
    [enqueueSaveWithProfileSession],
  );

  const handleLocalProfileSignIn = useCallback((): Promise<boolean> => {
    if (profileSessionWriteRef.current) {
      return profileSessionWriteRef.current;
    }
    setIsUpdatingLocalProfile(true);
    const operation = (async () => {
      try {
        const current = progressRef.current;
        if (!hasLocalAccount(current)) {
          throw new Error("Bu cihazda açılabilecek bir yerel profil yok.");
        }
        await activateLocalProfileSession(current);
        localProfileAccessRef.current = "active";
        setLocalProfileAccess("active");
        setPersistenceAvailable(isProgressPersistenceAvailable());
        setNotice({
          tone: "success",
          message: `${current.profile.displayName} profili açıldı.`,
        });
        openResumeLearning();
        return true;
      } catch (error) {
        setPersistenceAvailable(isProgressPersistenceAvailable());
        setNotice({
          tone: "error",
          message:
            error instanceof Error
              ? error.message
              : "Yerel profil bu cihazda açılamadı.",
        });
        return false;
      }
    })();
    profileSessionWriteRef.current = operation;
    void operation.finally(() => {
      if (profileSessionWriteRef.current === operation) {
        profileSessionWriteRef.current = undefined;
        setIsUpdatingLocalProfile(false);
      }
    });
    return operation;
  }, [openResumeLearning]);

  const handleLocalProfileSignOut = useCallback((): Promise<boolean> => {
    if (profileSessionWriteRef.current) {
      return profileSessionWriteRef.current;
    }
    setIsUpdatingLocalProfile(true);
    const operation = (async () => {
      try {
        const current = progressRef.current;
        await signOutLocalProfileSession(current);
        localProfileAccessRef.current = "signed-out";
        setLocalProfileAccess("signed-out");
        setPersistenceAvailable(isProgressPersistenceAvailable());
        setNotice({
          tone: "success",
          message: "Profilden çıktın; ilerlemen bu cihazda korunuyor.",
        });
        navigate("home");
        return true;
      } catch {
        setPersistenceAvailable(isProgressPersistenceAvailable());
        setNotice({
          tone: "error",
          message: "Profilden çıkış kaydedilemedi; profil açık kalıyor.",
        });
        return false;
      }
    })();
    profileSessionWriteRef.current = operation;
    void operation.finally(() => {
      if (profileSessionWriteRef.current === operation) {
        profileSessionWriteRef.current = undefined;
        setIsUpdatingLocalProfile(false);
      }
    });
    return operation;
  }, [navigate]);

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
    if (profileSessionWriteRef.current || isReplacingProgressRef.current) {
      setNotice({
        tone: "error",
        message: "Profil işlemi tamamlandıktan sonra yedeği tekrar seç.",
      });
      return;
    }
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
      const currentCompleted =
        tasks.filter((task) => currentProgress.tasks[task.id]?.completed)
          .length +
        pythonTasks.filter(
          (task) => currentProgress.pythonTasks[task.id]?.completed,
        ).length;
      const importedCompleted =
        tasks.filter((task) => imported.tasks[task.id]?.completed).length +
        pythonTasks.filter((task) => imported.pythonTasks[task.id]?.completed)
          .length;
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
      const importedPythonAccess = resolveAccessiblePythonTask(
        imported.lastOpenedPythonTaskId,
        pythonModules,
        pythonTasks,
        imported.pythonTasks,
      );
      const normalizedImport = {
        ...imported,
        lastOpenedTaskId: importedAccess.task?.id ?? imported.lastOpenedTaskId,
        lastOpenedTaskIdTrusted: true,
        lastOpenedPythonTaskId:
          importedPythonAccess.task?.id ?? imported.lastOpenedPythonTaskId,
      };
      await replaceProgress(
        normalizedImport,
        hasLocalAccount(normalizedImport) ? "active" : "guest",
      );
      setActiveTaskId(
        tasks.some((task) => task.id === normalizedImport.lastOpenedTaskId)
          ? normalizedImport.lastOpenedTaskId
          : (tasks[0]?.id ?? ""),
      );
      setActivePythonTaskId(
        pythonTasks.some(
          (task) => task.id === normalizedImport.lastOpenedPythonTaskId,
        )
          ? normalizedImport.lastOpenedPythonTaskId
          : (pythonTasks[0]?.id ?? ""),
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
    if (profileSessionWriteRef.current || isReplacingProgressRef.current)
      return;
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
      await replaceProgress(reset, localProfileAccessRef.current);
      setActiveTaskId(tasks[0]?.id ?? "");
      setActivePythonTaskId(pythonTasks[0]?.id ?? "");
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

  const handleShowFirstGuide = () => {
    navigate("workspace", {
      taskId: resumeSelection.task?.id ?? tasks[0]?.id,
      onboarding: true,
    });
  };

  const handleDeleteLocalProfile = (): Promise<boolean> => {
    if (profileSessionWriteRef.current) return profileSessionWriteRef.current;
    setIsUpdatingLocalProfile(true);
    const operation = (async () => {
      const previous = progressRef.current;
      isReplacingProgressRef.current = true;
      try {
        const deletion = saveQueueRef.current
          .catch(() => undefined)
          .then(() => eraseLocalProfileAndProgress());
        saveQueueRef.current = deletion
          .then(() => undefined)
          .catch(() => undefined);
        const guestProgress = await deletion;
        progressRef.current = guestProgress;
        localProfileAccessRef.current = "guest";
        setProgress(guestProgress);
        setLocalProfileAccess("guest");
        setActiveTaskId(tasks[0]?.id ?? "");
        setActivePythonTaskId(pythonTasks[0]?.id ?? "");
        setPersistenceAvailable(isProgressPersistenceAvailable());
        setNotice({
          tone: "success",
          message:
            "Yerel profil ve bu cihaza ait tüm Queryvale verileri silindi.",
        });
        navigate("home");
        return true;
      } catch (error) {
        progressRef.current = previous;
        setProgress(previous);
        setPersistenceAvailable(isProgressPersistenceAvailable());
        setNotice({
          tone: "error",
          message:
            error instanceof Error
              ? error.message
              : "Yerel profil silinemedi; mevcut verilerin korunuyor.",
        });
        return false;
      } finally {
        isReplacingProgressRef.current = false;
        setIsUpdatingLocalProfile(false);
      }
    })();
    profileSessionWriteRef.current = operation;
    void operation.finally(() => {
      if (profileSessionWriteRef.current === operation) {
        profileSessionWriteRef.current = undefined;
      }
    });
    return operation;
  };

  return (
    <>
      {isCreatingLocalAccount || isUpdatingLocalProfile ? (
        <span className="sr-only" role="status" aria-live="polite" aria-atomic>
          {isCreatingLocalAccount
            ? "Yerel profil hazırlanıyor ve güvenle kaydediliyor."
            : "Yerel profil işlemi güvenle kaydediliyor."}
        </span>
      ) : null}
      {landingUnlockAnnounced ? (
        <span className="sr-only" role="status" aria-live="polite" aria-atomic>
          SQL Studio ve Python Studio bağlantıları açıldı.
        </span>
      ) : null}
      <div
        className="app-shell"
        data-screen={screen}
        aria-busy={
          !isLoaded ||
          isReplacingProgress ||
          isCreatingLocalAccount ||
          isUpdatingLocalProfile
        }
        inert={!isLoaded || isReplacingProgress || isCreatingLocalAccount}
      >
        <AppHeader
          screen={screen}
          onNavigate={navigate}
          onStudio={openResumeWorkspace}
          onPythonStudio={openResumePythonStudio}
          onStart={() => navigate("account")}
          accountStatus={
            !isLoaded ? "loading" : localProfileActive ? "local" : "guest"
          }
          profileName={progress.profile.displayName}
          disabled={
            !isLoaded ||
            isReplacingProgress ||
            isCreatingLocalAccount ||
            isUpdatingLocalProfile
          }
          studioNavigationLocked={
            isLoaded && screen === "home" && !landingStudiosUnlocked
          }
          startLabel={
            localProfileAccess === "signed-out"
              ? `${progress.profile.displayName} profiline gir`
              : resumeSelection.isReturningLearner
                ? "Yerel profil oluştur veya kaldığın vakaya devam et"
                : "Hesap oluştur ve ilk vakaya başla"
          }
        />

        {screen === "home" && (
          <LandingScreen
            onStart={() => navigate("account")}
            onContinue={openResumeWorkspace}
            onOpenHelp={() => navigate("settings", { anchor: "settings-help" })}
            resumeTask={resumeSelection.task}
            isReturningLearner={resumeSelection.isReturningLearner}
            hasLocalAccount={localAccountExists}
            profileActive={localProfileActive}
            startDisabled={isCreatingLocalAccount || isUpdatingLocalProfile}
            reducedMotion={progress.settings.reducedMotion}
            onJourneyComplete={unlockLandingStudios}
          />
        )}
        {screen === "account" && (
          <AccountScreen
            profileName={progress.profile.displayName}
            hasLocalAccount={localAccountExists}
            profileActive={localProfileActive}
            hasLearningProgress={hasAnyLearningProgress}
            completedCount={completedTaskCount}
            totalCount={tasks.length + pythonTasks.length}
            resumeTaskTitle={
              resumeSelection.isReturningLearner
                ? resumeSelection.task?.title
                : hasPythonLearningProgress
                  ? resumePythonTask?.title
                  : resumeSelection.task?.title
            }
            persistenceAvailable={persistenceAvailable}
            writePending={isCreatingLocalAccount || isUpdatingLocalProfile}
            onCreateProfile={handleCreateLocalProfile}
            onSignIn={handleLocalProfileSignIn}
            onContinue={openResumeLearning}
            onGuestContinue={openResumeLearning}
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
        {screen === "python" && activePythonTask && (
          <PythonStudioScreen
            key={activePythonTask.id}
            task={activePythonTask}
            modules={pythonModules}
            tasks={pythonTasks}
            runtime={pythonRuntime}
            progress={progress}
            settings={progress.settings}
            persistenceAvailable={persistenceAvailable}
            onProgressChange={persistPythonProgress}
            onSelectTask={(taskId) => navigate("python", { taskId })}
            onCompleteRoute={() => navigate("progress")}
          />
        )}
        {screen === "progress" && (
          <ProgressScreen
            modules={modules}
            tasks={tasks}
            pythonModules={pythonModules}
            pythonTasks={pythonTasks}
            progress={progress}
            profileName={progress.profile.displayName}
            onProfileNameChange={handleProfileNameChange}
            onSignOut={handleLocalProfileSignOut}
            canSignOut={localProfileActive}
            profileActionPending={isUpdatingLocalProfile}
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
            hasLocalAccount={localAccountExists}
            profileName={progress.profile.displayName}
            onShowFirstGuide={handleShowFirstGuide}
            onDeleteLocalProfile={handleDeleteLocalProfile}
            isDeletingProfile={isUpdatingLocalProfile}
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
