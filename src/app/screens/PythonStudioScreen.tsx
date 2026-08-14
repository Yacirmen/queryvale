"use client";

import type { OnMount } from "@monaco-editor/react";
import {
  Braces,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Copy,
  Database,
  Lightbulb,
  LoaderCircle,
  Play,
  RotateCcw,
  Save,
  Square,
  Table2,
  Target,
  TerminalSquare,
} from "lucide-react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  PythonCurriculumModule,
  PythonDatasetFixture,
  PythonLessonTask,
  PythonScalar,
} from "../../types/pythonLesson";
import {
  PYODIDE_RUNTIME_VERSION,
  PYTHON_CONTENT_VERSION,
  PythonRuntimeClient,
  PythonRuntimeError,
  type PythonExecutionResult,
  type PythonRuntimePhase,
  type PythonTableArtifact,
} from "../../features/python-engine";
import {
  evaluatePythonArtifact,
  type PythonEvaluation,
} from "../../features/python-validation";
import {
  MAX_PYTHON_CODE_CHARS,
  recordPythonAttempt,
  recordPythonDraft,
  recordPythonEvidence,
  recordPythonHint,
  recordPythonSolutionReveal,
  type EditorSettings,
  type ProgressState,
} from "../../features/progress/progressStore";
import {
  getAwardedCaseScore,
  getCurrentCaseScore,
  MAX_CASE_SCORE,
} from "../../features/progress/scoring";
import { ConfirmationDialog } from "../components/Dialogs";
import { EDITOR_FONT_STACK } from "./WorkspaceScreen";
import {
  StudioActionRail,
  StudioResultStrip,
  type StudioRouteModuleItem,
} from "../components/StudioActionRail";

const MonacoEditor = lazy(() => import("../components/LocalMonacoEditor"));

const AUTOSAVE_DELAY_MS = 700;
const MOBILE_VIEWS = [
  { id: "brief", label: "Vaka" },
  { id: "data", label: "Veri" },
  { id: "code", label: "Python" },
  { id: "results", label: "Sonuç" },
] as const;
const SIDE_PANEL_TABS = ["brief", "data"] as const;

type MobileView = (typeof MOBILE_VIEWS)[number]["id"];
type SidePanelTab = (typeof SIDE_PANEL_TABS)[number];

interface PythonStudioScreenProps {
  task: PythonLessonTask;
  modules: PythonCurriculumModule[];
  tasks: PythonLessonTask[];
  runtime: PythonRuntimeClient;
  progress: ProgressState;
  settings: EditorSettings;
  persistenceAvailable: boolean;
  onProgressChange: (update: (current: ProgressState) => ProgressState) => void;
  onSelectTask: (taskId: string) => void;
  onCompleteRoute: () => void;
}

function formatCell(value: PythonScalar): string {
  if (value === null) return "NULL";
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? String(value)
      : new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 4 }).format(
          value,
        );
  }
  return String(value);
}

function difficultyLabel(task: PythonLessonTask): string {
  return task.difficulty === "beginner" ? "Başlangıç" : "Orta";
}

function phaseLabel(phase?: PythonRuntimePhase): string {
  if (phase === "loading-runtime") return "Python hazırlanıyor";
  if (phase === "loading-packages") return "Pandas hazırlanıyor";
  if (phase === "running") return "Kod çalışıyor";
  return "Çalıştırmaya hazır";
}

function datasetColumns(dataset: PythonDatasetFixture): string[] {
  return Object.keys(dataset.rows[0] ?? {});
}

export function PythonStudioScreen({
  task,
  modules,
  tasks,
  runtime,
  progress,
  settings,
  persistenceAvailable,
  onProgressChange,
  onSelectTask,
  onCompleteRoute,
}: PythonStudioScreenProps) {
  const initialCode =
    progress.pythonTasks[task.id]?.lastCode || task.starterCode;
  const [sidePanelTab, setSidePanelTab] = useState<SidePanelTab>("brief");
  const [mobileView, setMobileView] = useState<MobileView>("brief");
  const [isCompact, setIsCompact] = useState(false);
  const [code, setCode] = useState(() =>
    initialCode.slice(0, MAX_PYTHON_CODE_CHARS),
  );
  const [codeLimitError, setCodeLimitError] = useState<string | undefined>(
    () =>
      initialCode.length > MAX_PYTHON_CODE_CHARS
        ? `Python kodu en fazla ${MAX_PYTHON_CODE_CHARS.toLocaleString("tr-TR")} karakter olabilir. Sınırı aşan bölüm kaydedilmedi.`
        : undefined,
  );
  const [selectedDatasetName, setSelectedDatasetName] = useState(
    task.datasets[0]?.name ?? "",
  );
  const [runtimePhase, setRuntimePhase] = useState<PythonRuntimePhase>();
  const [isRunning, setIsRunning] = useState(false);
  const [execution, setExecution] = useState<PythonExecutionResult>();
  const [evaluation, setEvaluation] = useState<PythonEvaluation>();
  const [systemError, setSystemError] = useState<string>();
  const [visibleHints, setVisibleHints] = useState<number[]>(
    () => progress.pythonTasks[task.id]?.hintsUsed ?? [],
  );
  const [solutionVisible, setSolutionVisible] = useState(false);
  const [solutionConfirmVisible, setSolutionConfirmVisible] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [routeMenuOpen, setRouteMenuOpen] = useState(false);
  const codeRef = useRef(code);
  const runCodeRef = useRef<() => void>(() => undefined);
  const saveDraftRef = useRef<() => void>(() => undefined);
  const navigatePreviousRef = useRef<() => void>(() => undefined);
  const navigateNextRef = useRef<() => void>(() => undefined);
  const openRouteRef = useRef<() => void>(() => undefined);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const editorActionsRef = useRef<Array<{ dispose: () => void }>>([]);
  const mobileTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const sidePanelTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const resultPanelRef = useRef<HTMLDivElement>(null);
  const activeModule = modules.find((module) => module.id === task.moduleId);
  const activeIndex = tasks.findIndex((candidate) => candidate.id === task.id);
  const previousTask = activeIndex > 0 ? tasks[activeIndex - 1] : undefined;
  const nextTask = tasks[activeIndex + 1];
  const routeModules = useMemo<StudioRouteModuleItem[]>(
    () =>
      modules.map((module) => {
        return {
          id: module.id,
          order: module.order,
          title: module.title,
          tasks: module.tasks.map((candidate) => ({
            id: candidate.id,
            index: tasks.findIndex((item) => item.id === candidate.id),
            title: candidate.title,
            status: progress.pythonTasks[candidate.id]?.completed
              ? "completed"
              : (progress.pythonTasks[candidate.id]?.attempts ?? 0) > 0
                ? "attempted"
                : "unstarted",
            score: progress.pythonTasks[candidate.id]?.completed
              ? getAwardedCaseScore(progress.pythonTasks[candidate.id])
              : undefined,
          })),
        };
      }),
    [modules, progress.pythonTasks, tasks],
  );
  const taskProgress = progress.pythonTasks[task.id];
  const taskCompleted = Boolean(taskProgress?.completed);
  const score = taskCompleted
    ? getAwardedCaseScore(taskProgress)
    : getCurrentCaseScore(taskProgress);
  const selectedDataset =
    task.datasets.find((dataset) => dataset.name === selectedDatasetName) ??
    task.datasets[0];
  const tableArtifact =
    execution?.kind === "success" && execution.artifact.kind === "table"
      ? execution.artifact
      : undefined;

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }
    const query = window.matchMedia("(max-width: 820px)");
    const sync = () => setIsCompact(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    codeRef.current = code;
    const timeout = window.setTimeout(() => {
      onProgressChange((current) => recordPythonDraft(current, task.id, code));
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [code, onProgressChange, task.id]);

  useEffect(
    () => () => {
      // A task change remounts this screen to reset its authored UI state, but
      // the parent keeps the already-booted Pyodide runtime for the next case.
      // stop() is a no-op after a completed run and only tears down a worker
      // when the learner navigates away while code is still executing.
      runtime.stop();
      editorActionsRef.current.forEach((action) => action.dispose());
      editorActionsRef.current = [];
      onProgressChange((current) =>
        recordPythonDraft(current, task.id, codeRef.current),
      );
    },
    [onProgressChange, runtime, task.id],
  );

  const saveDraft = useCallback(() => {
    onProgressChange((current) => recordPythonDraft(current, task.id, code));
    setAnnouncement(
      persistenceAvailable
        ? "Python taslağı bu cihazda kaydedildi."
        : "Taslak bu oturum için bellekte tutuluyor.",
    );
  }, [code, onProgressChange, persistenceAvailable, task.id]);

  const navigateToTask = useCallback(
    (taskId: string) => {
      runtime.stop();
      onProgressChange((current) =>
        recordPythonDraft(current, task.id, codeRef.current),
      );
      setRouteMenuOpen(false);
      onSelectTask(taskId);
    },
    [onProgressChange, onSelectTask, runtime, task.id],
  );

  const updateCode = (value?: string) => {
    const requestedCode = value ?? "";
    const boundedCode = requestedCode.slice(0, MAX_PYTHON_CODE_CHARS);
    setCode(boundedCode);
    codeRef.current = boundedCode;
    if (requestedCode.length > MAX_PYTHON_CODE_CHARS) {
      const message = `Python kodu en fazla ${MAX_PYTHON_CODE_CHARS.toLocaleString("tr-TR")} karakter olabilir. Sınırı aşan bölüm kaydedilmedi.`;
      setCodeLimitError(message);
      setAnnouncement(message);
      return;
    }
    setCodeLimitError(undefined);
  };

  const showResults = useCallback(() => {
    if (isCompact) setMobileView("results");
    window.setTimeout(() => {
      if (isCompact) {
        const resultsIndex = MOBILE_VIEWS.findIndex(
          (view) => view.id === "results",
        );
        mobileTabRefs.current[resultsIndex]?.focus();
      }
    }, 0);
  }, [isCompact]);

  const runCode = useCallback(async () => {
    if (isRunning || !code.trim()) return;
    setIsRunning(true);
    setRuntimePhase("loading-runtime");
    setSystemError(undefined);
    setAnnouncement("Python çalışma ortamı hazırlanıyor.");
    const startedAt = performance.now();
    const assistance = {
      hintsUsed: [...visibleHints],
      solutionRevealed: Boolean(taskProgress?.solutionRevealed),
    };
    try {
      const result = await runtime.run(
        {
          taskId: task.id,
          code,
          datasets: task.datasets,
          resultVariable: task.resultVariable,
          packages: task.packages,
          runtimeBaseUrl: new URL(
            `vendor/pyodide/${PYODIDE_RUNTIME_VERSION}/`,
            document.baseURI,
          ).href,
        },
        (phase) => {
          setRuntimePhase(phase);
          setAnnouncement(`${phaseLabel(phase)}.`);
        },
      );
      const nextEvaluation = evaluatePythonArtifact(task, result);
      setExecution(result);
      setEvaluation(nextEvaluation);
      const completed = nextEvaluation.status === "correct";
      onProgressChange((current) => {
        let next = recordPythonAttempt(
          current,
          task.id,
          code,
          completed,
          Math.max(0, Math.round((performance.now() - startedAt) / 1000)),
          new Date(),
          assistance,
        );
        if (
          completed &&
          result.kind === "success" &&
          result.artifact.kind === "table"
        ) {
          next = recordPythonEvidence(next, {
            taskId: task.id,
            runtimeVersion: PYODIDE_RUNTIME_VERSION,
            contentVersion: String(PYTHON_CONTENT_VERSION),
            verifiedAt: new Date().toISOString(),
            columns: [...result.artifact.columns],
            dtypes: [...result.artifact.dtypes],
            previewRows: result.artifact.rows
              .slice(0, 10)
              .map((row) => [...row]),
            rowCount: result.artifact.rowCount,
            stdout: result.stdout,
          });
        }
        return next;
      });
      setAnnouncement(
        completed
          ? `Analiz çıktısı doğrulandı. ${score} puanlık yardım durumu kaydedildi.`
          : nextEvaluation.message,
      );
      showResults();
    } catch (error) {
      if (error instanceof PythonRuntimeError && error.code === "cancelled") {
        setSystemError(undefined);
        setAnnouncement(error.message);
        return;
      }
      const message =
        error instanceof PythonRuntimeError
          ? error.message
          : "Python ortamı çalıştırılamadı; kodun kaydedildi.";
      setSystemError(message);
      setAnnouncement(message);
      showResults();
    } finally {
      setIsRunning(false);
      setRuntimePhase(undefined);
    }
  }, [
    code,
    isRunning,
    onProgressChange,
    runtime,
    score,
    showResults,
    task,
    taskProgress?.solutionRevealed,
    visibleHints,
  ]);

  const stopRun = () => {
    runtime.stop();
    setAnnouncement("Python çalışması durduruluyor; kodun korunuyor.");
  };

  useEffect(() => {
    runCodeRef.current = () => void runCode();
    saveDraftRef.current = saveDraft;
    navigatePreviousRef.current = () => {
      if (previousTask) navigateToTask(previousTask.id);
    };
    navigateNextRef.current = () => {
      if (nextTask) navigateToTask(nextTask.id);
      else onCompleteRoute();
    };
    openRouteRef.current = () => setRouteMenuOpen(true);
  }, [
    navigateToTask,
    nextTask,
    onCompleteRoute,
    previousTask,
    runCode,
    saveDraft,
  ]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) {
        if (event.key === "Escape") setRouteMenuOpen(false);
        return;
      }
      if (event.shiftKey && event.key === "ArrowLeft") {
        event.preventDefault();
        navigatePreviousRef.current();
        return;
      }
      if (event.shiftKey && event.key === "ArrowRight") {
        event.preventDefault();
        navigateNextRef.current();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        runCodeRef.current();
        return;
      }
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveDraftRef.current();
        return;
      }
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        setRouteMenuOpen(true);
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);

  const resetTask = () => {
    runtime.reset();
    const boundedStarterCode = task.starterCode.slice(0, MAX_PYTHON_CODE_CHARS);
    setCode(boundedStarterCode);
    codeRef.current = boundedStarterCode;
    setCodeLimitError(undefined);
    setExecution(undefined);
    setEvaluation(undefined);
    setSystemError(undefined);
    onProgressChange((current) =>
      recordPythonDraft(current, task.id, boundedStarterCode),
    );
    setAnnouncement("Editör bu vakanın başlangıç iskeletine döndü.");
  };

  const revealNextHint = () => {
    const nextIndex = visibleHints.length;
    if (nextIndex >= task.hints.length) return;
    setVisibleHints((current) => [...current, nextIndex]);
    onProgressChange((current) =>
      recordPythonHint(current, task.id, nextIndex),
    );
    setAnnouncement(
      `${nextIndex + 1}. ipucu açıldı. Bu vaka için ${Math.max(
        0,
        MAX_CASE_SCORE - (nextIndex + 1) * 3,
      )} puan kaldı.`,
    );
  };

  const confirmSolution = () => {
    setSolutionConfirmVisible(false);
    setSolutionVisible(true);
    onProgressChange((current) => recordPythonSolutionReveal(current, task.id));
    setAnnouncement(
      "Tam çözüm açıldı; editördeki kodun değişmedi ve bu vaka için 0 puan kaydedilecek.",
    );
  };

  const copySolution = async () => {
    try {
      await navigator.clipboard.writeText(task.solutionCode);
      setAnnouncement("Çalışan Python çözümü panoya kopyalandı.");
    } catch {
      setAnnouncement("Panoya erişilemedi; çözümü elle kopyalayabilirsin.");
    }
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editorActionsRef.current.forEach((action) => action.dispose());
    editorActionsRef.current = [
      editor.addAction({
        id: "queryvale-python-run",
        label: "Python kodunu çalıştır",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => runCodeRef.current(),
      }),
      editor.addAction({
        id: "queryvale-python-save",
        label: "Python taslağını kaydet",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: () => saveDraftRef.current(),
      }),
      editor.addAction({
        id: "queryvale-python-route",
        label: "Python rotasını aç",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
        run: () => openRouteRef.current(),
      }),
      editor.addAction({
        id: "queryvale-python-previous-case",
        label: "Önceki Python vakasına geç",
        keybindings: [
          monaco.KeyMod.CtrlCmd |
            monaco.KeyMod.Shift |
            monaco.KeyCode.LeftArrow,
        ],
        run: () => navigatePreviousRef.current(),
      }),
      editor.addAction({
        id: "queryvale-python-next-case",
        label: "Sonraki Python vakasına geç",
        keybindings: [
          monaco.KeyMod.CtrlCmd |
            monaco.KeyMod.Shift |
            monaco.KeyCode.RightArrow,
        ],
        run: () => navigateNextRef.current(),
      }),
    ];
  };

  const activateMobileView = (nextView: MobileView, focus = false) => {
    setMobileView(nextView);
    if (nextView === "brief" || nextView === "data") {
      setSidePanelTab(nextView);
    }
    if (focus) {
      const index = MOBILE_VIEWS.findIndex((view) => view.id === nextView);
      window.setTimeout(() => mobileTabRefs.current[index]?.focus(), 0);
    }
  };

  const activateSidePanelTab = (nextTab: SidePanelTab, focus = false) => {
    setSidePanelTab(nextTab);
    if (focus) {
      const index = SIDE_PANEL_TABS.indexOf(nextTab);
      window.setTimeout(() => sidePanelTabRefs.current[index]?.focus(), 0);
    }
  };

  const handleMobileKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      nextIndex = (index + 1) % MOBILE_VIEWS.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      nextIndex = (index - 1 + MOBILE_VIEWS.length) % MOBILE_VIEWS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = MOBILE_VIEWS.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    activateMobileView(MOBILE_VIEWS[nextIndex].id, true);
  };

  const handleSidePanelKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      nextIndex = (index + 1) % SIDE_PANEL_TABS.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      nextIndex = (index - 1 + SIDE_PANEL_TABS.length) % SIDE_PANEL_TABS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = SIDE_PANEL_TABS.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    activateSidePanelTab(SIDE_PANEL_TABS[nextIndex], true);
  };

  return (
    <>
      <main id="main-content" className="python-studio-page" tabIndex={-1}>
        <div className="python-studio-topbar">
          <div className="python-studio-breadcrumb">
            <span className="python-language-mark" aria-hidden="true">
              <Braces size={15} /> PY
            </span>
            <span>{activeModule?.title}</span>
            <strong>{task.title}</strong>
          </div>

          <div className="python-studio-top-actions">
            <span className="python-mission-counter">
              {String(activeIndex + 1).padStart(2, "0")} / {tasks.length}
            </span>
          </div>
        </div>

        <div
          className="python-mobile-tabs"
          role="tablist"
          aria-label="Python çalışma alanı"
        >
          {MOBILE_VIEWS.map((view, index) => (
            <button
              key={view.id}
              id={`python-${task.id}-${view.id}-tab`}
              ref={(node) => {
                mobileTabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              aria-selected={mobileView === view.id}
              aria-controls={`python-${task.id}-${view.id}-panel`}
              tabIndex={mobileView === view.id ? 0 : -1}
              onClick={() => activateMobileView(view.id)}
              onKeyDown={(event) => handleMobileKeyDown(event, index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{view.label}</strong>
            </button>
          ))}
        </div>

        <div className="python-studio-body" data-mobile-view={mobileView}>
          <aside className="python-side-panel" aria-label="Python vaka paneli">
            <div
              className="python-panel-tabs"
              role="tablist"
              aria-label="Vaka içeriği"
            >
              <button
                id={`python-${task.id}-side-brief-tab`}
                ref={(node) => {
                  sidePanelTabRefs.current[0] = node;
                }}
                type="button"
                role="tab"
                aria-selected={sidePanelTab === "brief"}
                aria-controls={`python-${task.id}-brief-panel`}
                tabIndex={sidePanelTab === "brief" ? 0 : -1}
                className={sidePanelTab === "brief" ? "active" : ""}
                onClick={() => activateSidePanelTab("brief")}
                onKeyDown={(event) => handleSidePanelKeyDown(event, 0)}
              >
                Vaka
              </button>
              <button
                id={`python-${task.id}-side-data-tab`}
                ref={(node) => {
                  sidePanelTabRefs.current[1] = node;
                }}
                type="button"
                role="tab"
                aria-selected={sidePanelTab === "data"}
                aria-controls={`python-${task.id}-data-panel`}
                tabIndex={sidePanelTab === "data" ? 0 : -1}
                className={sidePanelTab === "data" ? "active" : ""}
                onClick={() => activateSidePanelTab("data")}
                onKeyDown={(event) => handleSidePanelKeyDown(event, 1)}
              >
                Veri
              </button>
            </div>

            <div
              id={`python-${task.id}-brief-panel`}
              className="python-panel-scroll python-brief-content"
              role="tabpanel"
              aria-labelledby={
                isCompact
                  ? `python-${task.id}-brief-tab`
                  : `python-${task.id}-side-brief-tab`
              }
              hidden={sidePanelTab !== "brief"}
            >
              <div className="python-brief-meta">
                <span>{difficultyLabel(task)}</span>
                <span>
                  <Clock3 size={13} aria-hidden="true" />
                  {task.estimatedMinutes} dk
                </span>
                <b>
                  {taskCompleted ? `${score} puan` : `${score} puan mümkün`}
                </b>
              </div>
              <h1>{task.title}</h1>
              <p className="python-brief-subtitle">{task.subtitle}</p>

              <section className="python-brief-section">
                <h2>
                  <Target size={14} aria-hidden="true" /> İş sorusu
                </h2>
                <p>{task.scenario}</p>
              </section>

              <section className="python-delivery-card">
                <span>Beklenen teslim</span>
                <strong>{task.objective}</strong>
                <code>
                  {task.resultVariable} → {task.expectedColumns.join(" + ")}
                </code>
              </section>

              <section className="python-brief-section">
                <h2>
                  <CheckCircle2 size={14} aria-hidden="true" /> Kabul kontrolü
                </h2>
                <ul className="python-check-list">
                  {task.acceptanceChecks.map((check) => (
                    <li key={check}>
                      <Check size={13} aria-hidden="true" /> {check}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="python-help-card">
                <div>
                  <span>
                    <Lightbulb size={14} aria-hidden="true" /> Yardım merdiveni
                  </span>
                  <small>İpucu başına −3 puan</small>
                </div>
                {visibleHints.map((hintIndex) => (
                  <article key={hintIndex}>
                    <b>{task.hints[hintIndex].title}</b>
                    <p>{task.hints[hintIndex].body}</p>
                  </article>
                ))}
                {visibleHints.length < task.hints.length ? (
                  <button type="button" onClick={revealNextHint}>
                    {visibleHints.length + 1}. ipucunu aç
                  </button>
                ) : null}
                <button
                  className="python-solution-trigger"
                  type="button"
                  onClick={() =>
                    taskCompleted || taskProgress?.solutionRevealed
                      ? setSolutionVisible((current) => !current)
                      : setSolutionConfirmVisible(true)
                  }
                >
                  {solutionVisible ? "Tam çözümü kapat" : "Tam çözümü gör"}
                </button>
                {solutionVisible ? (
                  <div className="python-solution-block">
                    <div>
                      <strong>Çalışan çözüm</strong>
                      <button
                        type="button"
                        onClick={() => void copySolution()}
                        aria-label="Python çözümünü kopyala"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                    <pre>
                      <code>{task.solutionCode}</code>
                    </pre>
                  </div>
                ) : null}
              </section>

              {!persistenceAvailable ? (
                <p className="python-persistence-warning">
                  <CircleAlert size={14} aria-hidden="true" /> Bu oturumda
                  kalıcı depolama kullanılamıyor.
                </p>
              ) : null}
            </div>
            <div
              id={`python-${task.id}-data-panel`}
              className="python-panel-scroll python-data-content"
              role="tabpanel"
              aria-labelledby={
                isCompact
                  ? `python-${task.id}-data-tab`
                  : `python-${task.id}-side-data-tab`
              }
              hidden={sidePanelTab !== "data"}
            >
              <div className="python-data-intro">
                <Database size={18} aria-hidden="true" />
                <div>
                  <strong>Vaka verisi hazır</strong>
                  <span>
                    Kodunda tabloyu değişken adıyla doğrudan kullanabilirsin.
                  </span>
                </div>
              </div>
              {task.datasets.length > 1 ? (
                <div className="python-dataset-tabs" role="tablist">
                  {task.datasets.map((dataset) => (
                    <button
                      key={dataset.name}
                      type="button"
                      role="tab"
                      aria-selected={selectedDataset?.name === dataset.name}
                      className={
                        selectedDataset?.name === dataset.name ? "active" : ""
                      }
                      onClick={() => setSelectedDatasetName(dataset.name)}
                    >
                      {dataset.variableName}
                    </button>
                  ))}
                </div>
              ) : null}
              {selectedDataset ? (
                <DatasetPreview dataset={selectedDataset} />
              ) : null}
              <section className="python-data-notes">
                <h2>Veri notları</h2>
                <ul>
                  {task.dataNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </section>
            </div>
          </aside>

          <section
            className="python-workbench"
            aria-label="Python editörü ve çıktı"
          >
            <div
              id={`python-${task.id}-code-panel`}
              className="python-editor-section"
              role={isCompact ? "tabpanel" : undefined}
              aria-labelledby={
                isCompact ? `python-${task.id}-code-tab` : undefined
              }
            >
              <div className="python-editor-toolbar">
                <div className="python-file-label">
                  <Braces size={15} aria-hidden="true" />
                  <strong>analysis.py</strong>
                  <span className={isRunning ? "busy" : ""}>
                    {isRunning ? <LoaderCircle size={12} /> : null}
                    {phaseLabel(runtimePhase)}
                  </span>
                </div>
                <div className="python-editor-actions">
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={isRunning}
                  >
                    <Save size={14} /> <span>Kaydet</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetTask}
                    disabled={isRunning}
                  >
                    <RotateCcw size={14} /> <span>Sıfırla</span>
                  </button>
                  {isRunning ? (
                    <button
                      className="python-stop-button"
                      type="button"
                      onClick={stopRun}
                    >
                      <Square size={13} fill="currentColor" /> Durdur
                    </button>
                  ) : (
                    <button
                      className="python-run-button"
                      type="button"
                      disabled={!code.trim()}
                      onClick={() => void runCode()}
                    >
                      <Play size={14} fill="currentColor" /> Çalıştır
                      <kbd>⌘↵</kbd>
                    </button>
                  )}
                </div>
              </div>
              {codeLimitError ? (
                <p className="python-code-limit-error" role="alert">
                  <CircleAlert size={14} aria-hidden="true" /> {codeLimitError}
                </p>
              ) : null}
              <div className="python-editor-frame">
                <Suspense
                  fallback={
                    <div className="python-editor-loading" role="status">
                      <LoaderCircle size={18} /> Editör hazırlanıyor…
                    </div>
                  }
                >
                  <MonacoEditor
                    height="100%"
                    language="python"
                    value={code}
                    onChange={updateCode}
                    onMount={handleEditorMount}
                    theme={settings.theme === "dark" ? "vs-dark" : "light"}
                    aria-label={`Python kod editörü — ${task.title}`}
                    options={{
                      fontSize: settings.fontSize,
                      lineHeight: Math.round(
                        settings.fontSize * settings.lineHeight,
                      ),
                      fontFamily: EDITOR_FONT_STACK,
                      fontLigatures: false,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      wordWrap: "on",
                      padding: { top: 18, bottom: 18 },
                      quickSuggestions: settings.autocomplete,
                      suggestOnTriggerCharacters: settings.autocomplete,
                      tabSize: 4,
                    }}
                  />
                </Suspense>
              </div>
            </div>

            <div
              id={`python-${task.id}-results-panel`}
              ref={resultPanelRef}
              className="python-results-section"
              role={isCompact ? "tabpanel" : undefined}
              aria-labelledby={
                isCompact ? `python-${task.id}-results-tab` : undefined
              }
              aria-busy={isRunning}
            >
              <div className="python-results-toolbar">
                <div>
                  <TerminalSquare size={15} aria-hidden="true" />
                  <strong>Çıktı</strong>
                  {tableArtifact ? (
                    <span>
                      {tableArtifact.rowCount} satır ·{" "}
                      {tableArtifact.columns.length} kolon
                    </span>
                  ) : null}
                </div>
              </div>
              {evaluation ? (
                <StudioResultStrip
                  status={evaluation.status === "correct" ? "correct" : "wrong"}
                  summary={
                    evaluation.status === "correct"
                      ? `${tableArtifact?.rowCount ?? 0} satır · beklenen çıktıyla eşleşti · ${score}/10 puan`
                      : evaluation.actual && evaluation.expected
                        ? `${evaluation.actual}; beklenen ${evaluation.expected}`
                        : evaluation.title
                  }
                  detail={
                    evaluation.status === "correct"
                      ? undefined
                      : evaluation.message
                  }
                />
              ) : null}
              <div className="python-results-content">
                {isRunning && !execution ? (
                  <div className="python-result-empty">
                    <LoaderCircle className="spin" size={26} />
                    <strong>{phaseLabel(runtimePhase)}</strong>
                    <p>
                      İlk açılışta yaklaşık 19,4 MiB Python ve Pandas dosyası
                      hazırlanır; sonraki çalışmalarda tarayıcı önbelleği
                      kullanılır.
                    </p>
                  </div>
                ) : systemError ? (
                  <div className="python-system-error" role="alert">
                    <CircleAlert size={22} />
                    <div>
                      <strong>Python çalışması tamamlanamadı</strong>
                      <p>{systemError}</p>
                      <button type="button" onClick={() => void runCode()}>
                        Yeniden dene
                      </button>
                    </div>
                  </div>
                ) : execution?.kind === "execution-error" ? (
                  <div className="python-execution-error" role="alert">
                    <div>
                      <CircleAlert size={18} />
                      <div>
                        <strong>{evaluation?.title}</strong>
                        <p>{execution.message}</p>
                      </div>
                    </div>
                    {execution.stdout ? (
                      <pre className="python-stdout">{execution.stdout}</pre>
                    ) : null}
                    <details>
                      <summary>Teknik ayrıntıyı gör</summary>
                      <pre>{execution.traceback}</pre>
                    </details>
                  </div>
                ) : tableArtifact ? (
                  <>
                    <ResultTable
                      artifact={tableArtifact}
                      taskTitle={task.title}
                    />
                    {execution?.kind === "success" && execution.stdout ? (
                      <details className="python-console-output">
                        <summary>Konsol çıktısı</summary>
                        <pre>{execution.stdout}</pre>
                      </details>
                    ) : null}
                    {evaluation?.status === "correct" ? (
                      <div className="python-evaluation-card correct">
                        <CheckCircle2 size={20} aria-hidden="true" />
                        <section
                          className="python-learning-debrief"
                          aria-labelledby={`python-${task.id}-debrief-title`}
                        >
                          <div className="python-learning-debrief-head">
                            <span>Öğrenme özeti</span>
                            <h3 id={`python-${task.id}-debrief-title`}>
                              Neden çalıştı?
                            </h3>
                          </div>
                          <p>{task.explanation}</p>
                          <ol>
                            {task.debrief.steps.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ol>
                          <details>
                            <summary>İş etkisi ve dikkat noktaları</summary>
                            <p>{task.debrief.whyItWorks}</p>
                            <p>{task.debrief.workplaceImpact}</p>
                            <ul>
                              {task.debrief.edgeCases.map((edgeCase) => (
                                <li key={edgeCase}>{edgeCase}</li>
                              ))}
                            </ul>
                          </details>
                          <details className="python-transfer-debrief">
                            <summary>Transfer sorusu</summary>
                            <p>{task.debrief.transfer.prompt}</p>
                            <details>
                              <summary>Yaklaşımı gör</summary>
                              <p>{task.debrief.transfer.reveal}</p>
                            </details>
                          </details>
                        </section>
                      </div>
                    ) : evaluation &&
                      (evaluation.expected || evaluation.actual) ? (
                      <details className="python-evaluation-details">
                        <summary>Beklenen ve üretilen farkını incele</summary>
                        <dl>
                          {evaluation.expected ? (
                            <div>
                              <dt>Beklenen</dt>
                              <dd>{evaluation.expected}</dd>
                            </div>
                          ) : null}
                          {evaluation.actual ? (
                            <div>
                              <dt>Üretilen</dt>
                              <dd>{evaluation.actual}</dd>
                            </div>
                          ) : null}
                        </dl>
                      </details>
                    ) : null}
                  </>
                ) : (
                  <div className="python-result-empty">
                    <Table2 size={28} />
                    <strong>Analiz çıktın burada oluşacak</strong>
                    <p>
                      Kodunu çalıştırdığında gerçek DataFrame, konsol ve
                      değerlendirme bu panelde görünür. İstersen alt vaka
                      gezintisinden rotanın başka bir adımına da geçebilirsin.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <StudioActionRail
          variant="python"
          activeTaskId={task.id}
          activeIndex={activeIndex}
          totalCount={tasks.length}
          modules={routeModules}
          previousTaskId={previousTask?.id}
          nextTaskId={nextTask?.id}
          currentTaskCorrect={
            evaluation ? evaluation.status === "correct" : taskCompleted
          }
          routeMenuOpen={routeMenuOpen}
          onRouteMenuOpenChange={setRouteMenuOpen}
          onSelectTask={navigateToTask}
          onCompleteRoute={onCompleteRoute}
        />
      </main>

      <span className="sr-only" role="status" aria-live="polite" aria-atomic>
        {announcement}
      </span>

      <ConfirmationDialog
        open={solutionConfirmVisible}
        title="Tam çözümü açmak istiyor musun?"
        description="Çözüm yalnız isteğinle görünür. Editördeki kodun değişmez; bu vaka tamamlandığında 0 puan kazanırsın."
        confirmLabel="Çözümü göster"
        onConfirm={confirmSolution}
        onClose={() => setSolutionConfirmVisible(false)}
      />
    </>
  );
}

function DatasetPreview({ dataset }: { dataset: PythonDatasetFixture }) {
  const columns = datasetColumns(dataset);
  return (
    <section className="python-dataset-card">
      <div className="python-dataset-head">
        <div>
          <code>{dataset.variableName}</code>
          <span>{dataset.description}</span>
        </div>
        <b>
          {dataset.rows.length} × {columns.length}
        </b>
      </div>
      <div
        className="python-table-scroll"
        role="region"
        aria-label={`${dataset.name} veri tablosu; yatay kaydırılabilir`}
        tabIndex={0}
      >
        <table>
          <caption>
            {dataset.name} veri setinden ilk {Math.min(dataset.rows.length, 8)}{" "}
            satır
          </caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataset.rows.slice(0, 8).map((row, rowIndex) => (
              <tr key={`${dataset.name}-${rowIndex}`}>
                {columns.map((column) => (
                  <td key={column}>{formatCell(row[column] ?? null)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ResultTable({
  artifact,
  taskTitle,
}: {
  artifact: PythonTableArtifact;
  taskTitle: string;
}) {
  return (
    <div
      className="python-output-table-wrap"
      role="region"
      aria-label={`${taskTitle} sonuç tablosu; yatay kaydırılabilir`}
      tabIndex={0}
    >
      <table className="python-output-table">
        <caption>{taskTitle} için üretilen result DataFrame</caption>
        <thead>
          <tr>
            {artifact.columns.map((column, index) => (
              <th key={`${column}-${index}`} scope="col">
                <span>{column}</span>
                <small>{artifact.dtypes[index]}</small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {artifact.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((value, columnIndex) => (
                <td key={columnIndex}>{formatCell(value)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
