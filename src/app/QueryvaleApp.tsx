"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { modules, tasks } from "../content/curriculum";
import {
  createDefaultProgress,
  exportProgress,
  importProgress,
  isProgressPersistenceAvailable,
  loadProgress,
  resetProgress,
  saveProgress,
  type EditorSettings,
  type ProgressState,
} from "../features/progress/progressStore";
import type { AppScreen, Navigate, NavigateOptions } from "./appTypes";
import { AppHeader } from "./components/AppHeader";
import { OnboardingDialog } from "./components/Dialogs";
import { LandingScreen } from "./screens/LandingScreen";
import { LearningPathScreen } from "./screens/LearningPathScreen";
import { ProgressScreen } from "./screens/ProgressScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { WorkspaceScreen } from "./screens/WorkspaceScreen";

function routeFor(screen: AppScreen, taskId?: string): string {
  if (screen === "home") return "#/";
  if (screen === "workspace") return `#/lab/${taskId ?? tasks[0]?.id ?? ""}`;
  return `#/${screen}`;
}

function screenFromHash(hash: string): AppScreen {
  if (hash.startsWith("#/lab/")) return "workspace";
  if (hash === "#/learn") return "learn";
  if (hash === "#/progress") return "progress";
  if (hash === "#/settings") return "settings";
  return "home";
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    message: string;
  }>();

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? tasks[0],
    [activeTaskId],
  );

  useEffect(() => {
    let current = true;
    void loadProgress().then((stored) => {
      if (!current) return;
      const hashTask = taskIdFromHash(window.location.hash);
      const candidateTask =
        tasks.find((task) => task.id === hashTask) ??
        tasks.find((task) => task.id === stored.lastOpenedTaskId) ??
        tasks[0];
      setProgress(stored);
      setActiveTaskId(candidateTask?.id ?? "");
      setScreen(screenFromHash(window.location.hash));
      setIsLoaded(true);
      if (!isProgressPersistenceAvailable()) {
        setNotice({
          tone: "error",
          message:
            "Kalıcı depolama kullanılamıyor; ilerleme bu oturum boyunca bellekte tutulacak.",
        });
      }
    });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    const listener = () => {
      const nextScreen = screenFromHash(window.location.hash);
      const hashTask = taskIdFromHash(window.location.hash);
      if (hashTask && tasks.some((task) => task.id === hashTask)) {
        setActiveTaskId(hashTask);
      }
      setScreen(nextScreen);
    };
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = progress.settings.theme;
    document.documentElement.dataset.reducedMotion = String(
      progress.settings.reducedMotion,
    );
  }, [progress.settings.reducedMotion, progress.settings.theme]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(undefined), 2800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const persist = useCallback((next: ProgressState) => {
    setProgress(next);
    void saveProgress(next).catch(() =>
      setNotice({
        tone: "error",
        message: "İlerleme bu cihazda kaydedilemedi.",
      }),
    );
  }, []);

  const navigate = useCallback<Navigate>(
    (nextScreen: AppScreen, options?: NavigateOptions) => {
      let nextTaskId = activeTaskId || tasks[0]?.id;
      if (nextScreen === "workspace") {
        const requested = tasks.find((task) => task.id === options?.taskId);
        nextTaskId = requested?.id ?? nextTaskId;
        if (nextTaskId) {
          setActiveTaskId(nextTaskId);
          const nextProgress = {
            ...progress,
            lastOpenedTaskId: nextTaskId,
          };
          persist(nextProgress);
        }
      }
      if (options?.onboarding) setShowOnboarding(true);
      const nextRoute = routeFor(nextScreen, nextTaskId);
      setScreen(nextScreen);
      if (window.location.hash !== nextRoute) window.location.hash = nextRoute;
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [activeTaskId, persist, progress],
  );

  const updateSettings = useCallback(
    (settings: EditorSettings) => {
      persist({ ...progress, settings });
    },
    [persist, progress],
  );

  const handleExport = () => {
    const blob = new Blob([exportProgress(progress)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `queryvale-progress-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice({
      tone: "success",
      message: "İlerleme dosyası dışa aktarıldı.",
    });
  };

  const handleImport = async (contents: string) => {
    try {
      const imported = importProgress(contents);
      await saveProgress(imported);
      setProgress(imported);
      setActiveTaskId(
        tasks.some((task) => task.id === imported.lastOpenedTaskId)
          ? imported.lastOpenedTaskId
          : tasks[0]?.id ?? "",
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
            : "İlerleme dosyası okunamadı.",
      });
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      "Tüm görev geçmişi, sorgular ve ayarlar kalıcı olarak sıfırlansın mı?",
    );
    if (!confirmed) return;
    const reset = await resetProgress();
    setProgress(reset);
    setActiveTaskId(tasks[0]?.id ?? "");
    setNotice({
      tone: "success",
      message: "İlerleme başlangıç durumuna döndü.",
    });
  };

  return (
    <div className="app-shell" aria-busy={!isLoaded}>
      <AppHeader
        screen={screen}
        settings={progress.settings}
        onNavigate={navigate}
        onSettingsChange={updateSettings}
      />

      {screen === "home" && <LandingScreen onNavigate={navigate} />}
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
          tasks={tasks}
          progress={progress}
          settings={progress.settings}
          onProgressChange={persist}
          onNavigate={navigate}
        />
      )}
      {screen === "progress" && (
        <ProgressScreen
          modules={modules}
          tasks={tasks}
          progress={progress}
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

      {showOnboarding && (
        <OnboardingDialog
          onClose={() => setShowOnboarding(false)}
          onStart={() => setShowOnboarding(false)}
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
  );
}
