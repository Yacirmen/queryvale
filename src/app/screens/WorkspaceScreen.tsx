"use client";

import {
  ArrowRight,
  Braces,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Columns3,
  Copy,
  Database,
  GitMerge,
  KeyRound,
  Lightbulb,
  LoaderCircle,
  Play,
  RotateCcw,
  Save,
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
import type { OnMount } from "@monaco-editor/react";
import type {
  CurriculumModule,
  DrillTaskType,
  LessonTask,
  SqlScalar,
} from "../../types/lesson";
import { isDrillTask } from "../../types/lesson";
import {
  createTaskDatabaseForLesson,
  type QueryExecutionResult,
  type TaskDatabase,
} from "../../features/sql-engine";
import {
  evaluateLessonQuery,
  type QueryEvaluation,
} from "../../features/validation";
import { createVerifiedRunSnapshot } from "../../features/evidence/evidenceSnapshot";
import {
  recordAttempt,
  recordHint,
  recordPracticeActivity,
  recordSolutionReveal,
  recordVerifiedRun,
  saveDecisionNote,
  type EditorSettings,
  type ProgressState,
  type TaskProgress,
} from "../../features/progress/progressStore";
import {
  calculateCaseScore,
  getAwardedCaseScore,
  getCurrentCaseScore,
  MAX_CASE_SCORE,
} from "../../features/progress/scoring";
import type { Navigate } from "../appTypes";
import { CommandDialog } from "../components/Dialogs";
import { FirstCaseGuide } from "../components/FirstCaseGuide";
import { ResultCompletion } from "../components/ResultCompletion";
import {
  StudioActionRail,
  StudioResultStrip,
  type StudioRouteModuleItem,
} from "../components/StudioActionRail";

const MonacoEditor = lazy(() => import("../components/LocalMonacoEditor"));

/**
 * Editör, uygulamanın geri kalanıyla aynı paketlenmiş mono aileyi kullanır.
 * Monaco CSS değişkeni okumadığı için yığın burada düz metin olarak verilir.
 */
export const EDITOR_FONT_STACK =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

interface WorkspaceScreenProps {
  task: LessonTask;
  modules: CurriculumModule[];
  tasks: LessonTask[];
  progress: ProgressState;
  settings: EditorSettings;
  persistenceAvailable: boolean;
  showFirstCaseGuide: boolean;
  onDismissFirstCaseGuide: () => void;
  onProgressChange: (update: (current: ProgressState) => ProgressState) => void;
  onNavigate: Navigate;
}

function createDraftProgress(taskId: string, query: string): TaskProgress {
  return {
    taskId,
    attempts: 0,
    completed: false,
    lastQuery: query,
    hintsUsed: [],
    solutionRevealed: false,
    solveTimeSeconds: 0,
    firstTry: false,
  };
}

function createLegacyStarterQuery(task: LessonTask): string {
  const table = task.schema.tables[0]?.name ?? "table_name";
  return `-- İş sorusunu ve şemayı inceleyerek sorgunu düzenle\nSELECT\n  *\nFROM ${table}\nLIMIT 10;`;
}

function getInitialQuery(task: LessonTask, progress: ProgressState): string {
  const savedQuery = progress.tasks[task.id]?.lastQuery ?? "";
  // Eski sürümün her göreve verdiği tek tip "SELECT * ... LIMIT 10" taslağı
  // kaydedilmiş olabilir; onu iskelet saymayıp temizliyoruz.
  if (savedQuery.trim() === createLegacyStarterQuery(task).trim()) {
    return task.starterSql ?? "";
  }
  return savedQuery.trim() ? savedQuery : (task.starterSql ?? "");
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Uint8Array) return `[${value.byteLength} byte]`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function difficultyLabel(task: LessonTask): string {
  if (task.difficulty === "beginner") return "Başlangıç";
  if (task.difficulty === "intermediate") return "Orta";
  return "İleri";
}

function evaluationTone(evaluation?: QueryEvaluation): string {
  if (!evaluation) return "";
  if (evaluation.correct) return "success";
  if (evaluation.status === "execution-error") return "error";
  return "warning";
}

const HINT_STAGE_LABELS = ["Mantık", "Parçalar", "Sorgu iskeleti"] as const;
const HINT_ACTION_LABELS = [
  "Mantığı göster",
  "Gerekli parçaları göster",
  "Sorgu iskeletini göster",
] as const;

const DRILL_PRESENTATIONS: Readonly<
  Record<
    DrillTaskType,
    {
      badge: string;
      label: string;
      completionLabel: string;
      Icon: typeof Lightbulb;
    }
  >
> = {
  drill_intro: {
    badge: "ALIŞTIRMA · 3 DK",
    label: "Alıştırma",
    completionLabel: "Alıştırma tamamlandı",
    Icon: Lightbulb,
  },
  drill_practice: {
    badge: "TEKRAR · 3 DK",
    label: "Tekrar",
    completionLabel: "Tekrar tamamlandı",
    Icon: RotateCcw,
  },
  drill_mix: {
    badge: "BİRLEŞTİR · 5 DK",
    label: "Birleştir",
    completionLabel: "Birleştirme tamamlandı",
    Icon: GitMerge,
  },
};

function drillPresentation(type: DrillTaskType) {
  return DRILL_PRESENTATIONS[type];
}

function taskKindLabel(task: LessonTask): string {
  return isDrillTask(task) ? drillPresentation(task.type).label : "Vaka";
}

function DrillExpectedResultHint({ task }: { task: LessonTask }) {
  const titleId = `${task.id}-expected-result-title`;
  const rowOrderNote = task.orderSensitive
    ? "Satırları bu sırayla karşılaştır."
    : "Satır sırası önemli değil.";

  return (
    <section className="drill-expected-result" aria-labelledby={titleId}>
      <div className="drill-expected-result-heading" aria-live="polite">
        <Table2 size={14} aria-hidden="true" />
        <div>
          <h3 id={titleId}>Doğru sonuç</h3>
          <p>
            {task.expectedResult.length} satır · {rowOrderNote}
          </p>
        </div>
      </div>
      <div className="drill-expected-result-table-wrap">
        <table aria-label={`${task.title} için doğru sonuç`}>
          <thead>
            <tr>
              {task.expectedColumns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {task.expectedResult.map((row, rowIndex) => (
              <tr key={`${task.id}-expected-row-${rowIndex}`}>
                {task.expectedColumns.map((column, columnIndex) => (
                  <td key={`${task.id}-${column}-${rowIndex}`}>
                    {formatCell(row[columnIndex])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const DRAFT_AUTOSAVE_DELAY_MS = 700;
const MOBILE_WORKSPACE_VIEWS = [
  { id: "brief", label: "Vaka" },
  { id: "schema", label: "Veri" },
  { id: "editor", label: "SQL" },
  { id: "results", label: "Sonuç" },
] as const;

type MobileWorkspaceView = (typeof MOBILE_WORKSPACE_VIEWS)[number]["id"];

export function WorkspaceScreen({
  task,
  modules,
  tasks,
  progress,
  settings,
  persistenceAvailable,
  showFirstCaseGuide,
  onDismissFirstCaseGuide,
  onProgressChange,
  onNavigate,
}: WorkspaceScreenProps) {
  const [panelTab, setPanelTab] = useState<"brief" | "schema">("brief");
  const [mobileView, setMobileView] = useState<MobileWorkspaceView>("brief");
  const [isCompactWorkspace, setIsCompactWorkspace] = useState(false);
  const [query, setQuery] = useState(() => getInitialQuery(task, progress));
  const [engineState, setEngineState] = useState<
    "loading" | "ready" | "failed"
  >("loading");
  const [engineSetupError, setEngineSetupError] = useState<string>();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<QueryExecutionResult>();
  const [evaluation, setEvaluation] = useState<QueryEvaluation>();
  const [visibleHints, setVisibleHints] = useState<number[]>(
    () => progress.tasks[task.id]?.hintsUsed ?? [],
  );
  /*
   * Yardım merdiveni açık başlar. Kapalı hâl, kullanıcıyı ilk ipucuna
   * ulaşmak için hiçbir şey göstermeyen bir kapıya tıklatıyordu; bu bir
   * gezinme vergisiydi. Kapatma seçeneği duruyor, varsayılan tersine döndü.
   */
  const [helpExpanded, setHelpExpanded] = useState(true);
  const [solutionVisible, setSolutionVisible] = useState(false);
  const [solutionConfirmVisible, setSolutionConfirmVisible] = useState(false);
  const [solutionUsed, setSolutionUsed] = useState(
    () => progress.tasks[task.id]?.solutionRevealed ?? false,
  );
  const [solutionAnnouncement, setSolutionAnnouncement] = useState("");
  const [scoreAnnouncement, setScoreAnnouncement] = useState("");
  const [briefWidth, setBriefWidth] = useState(370);
  const [editorHeight, setEditorHeight] = useState(56);
  const [showCommands, setShowCommands] = useState(false);
  const [routeMenuOpen, setRouteMenuOpen] = useState(false);
  const [toast, setToast] = useState<string>();
  const databaseRef = useRef<TaskDatabase | undefined>(undefined);
  const runGenerationRef = useRef(0);
  const draftRevisionRef = useRef(0);
  const queryRef = useRef(query);
  const lastPersistedQueryRef = useRef(query);
  const draftDirtyRef = useRef(false);
  const openedAtRef = useRef(0);
  const workbenchRef = useRef<HTMLDivElement>(null);
  const resultsContentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const editorShortcutActionsRef = useRef<Array<{ dispose: () => void }>>([]);
  const runQueryShortcutRef = useRef<() => void>(() => undefined);
  const saveDraftShortcutRef = useRef<() => void>(() => undefined);
  const navigatePreviousShortcutRef = useRef<() => void>(() => undefined);
  const navigateNextShortcutRef = useRef<() => void>(() => undefined);
  const openRouteShortcutRef = useRef<() => void>(() => undefined);
  const pendingEditorFocusRef = useRef(false);
  const briefTabRef = useRef<HTMLButtonElement>(null);
  const schemaTabRef = useRef<HTMLButtonElement>(null);
  const briefPanelRef = useRef<HTMLDivElement>(null);
  const solutionTriggerRef = useRef<HTMLButtonElement>(null);
  const solutionCancelRef = useRef<HTMLButtonElement>(null);
  const mobileViewRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const showResultsAndFocus = useCallback(() => {
    setMobileView("results");
    window.setTimeout(() => mobileViewRefs.current[3]?.focus(), 0);
  }, []);

  const taskIndex = tasks.findIndex((candidate) => candidate.id === task.id);
  const previousTask = taskIndex > 0 ? tasks[taskIndex - 1] : undefined;
  const nextTask = tasks[taskIndex + 1];
  const currentModule = modules.find((module) => module.id === task.moduleId);
  const isProject = currentModule?.contentKind === "projects";
  const isDrill = isDrillTask(task);
  const activeDrillPresentation = isDrill
    ? drillPresentation(task.type)
    : undefined;
  const ActiveDrillIcon = activeDrillPresentation?.Icon;
  const routeModules = useMemo<StudioRouteModuleItem[]>(
    () =>
      modules.map((module) => {
        return {
          id: module.id,
          order: module.order,
          title: module.title,
          tasks: [...module.tasks]
            .toSorted((left, right) => left.routeOrder - right.routeOrder)
            .map((candidate) => ({
              id: candidate.id,
              index: tasks.findIndex((item) => item.id === candidate.id),
              title: candidate.title,
              type: candidate.type,
              scored: candidate.scored,
              status: progress.tasks[candidate.id]?.completed
                ? "completed"
                : (progress.tasks[candidate.id]?.attempts ?? 0) > 0
                  ? "attempted"
                  : "unstarted",
              score:
                candidate.scored && progress.tasks[candidate.id]?.completed
                  ? getAwardedCaseScore(progress.tasks[candidate.id])
                  : undefined,
            })),
        };
      }),
    [modules, progress.tasks, tasks],
  );
  const revealedHintCount = visibleHints.filter(
    (index) => index >= 0 && index < task.hints.length,
  ).length;
  const nextHintIndex = task.hints.findIndex(
    (_, index) => !visibleHints.includes(index),
  );
  const taskProgress = progress.tasks[task.id];
  const taskCompleted = taskProgress?.completed ?? false;
  const currentCaseScore = getCurrentCaseScore(taskProgress);
  const awardedCaseScore = getAwardedCaseScore(taskProgress);
  const scoreAfterNextHint =
    nextHintIndex >= 0
      ? calculateCaseScore([...visibleHints, nextHintIndex], solutionUsed)
      : currentCaseScore;

  useEffect(() => {
    if (!solutionConfirmVisible) return;
    window.setTimeout(() => solutionCancelRef.current?.focus(), 0);
  }, [solutionConfirmVisible]);

  useEffect(() => {
    const updateCompactWorkspace = () =>
      setIsCompactWorkspace(window.innerWidth <= 820);
    updateCompactWorkspace();
    window.addEventListener("resize", updateCompactWorkspace);
    return () => window.removeEventListener("resize", updateCompactWorkspace);
  }, []);

  useEffect(() => {
    let current = true;
    runGenerationRef.current += 1;
    const database = createTaskDatabaseForLesson(task);
    databaseRef.current = database;
    openedAtRef.current = Date.now();

    void database
      .initialize()
      .then(() => {
        if (!current) return;
        setEngineSetupError(undefined);
        setEngineState("ready");
      })
      .catch(() => {
        if (!current) return;
        setEngineState("failed");
        setEngineSetupError(
          "Yerel PostgreSQL motoru hazırlanamadı. Bu sistem hatası sorgunla ilgili değil; Sıfırla ile yeniden dene veya sayfayı yenile.",
        );
        setEvaluation(undefined);
        showResultsAndFocus();
      });

    return () => {
      current = false;
      runGenerationRef.current += 1;
      if (databaseRef.current === database) databaseRef.current = undefined;
      void database.dispose();
    };
    // The progress snapshot is intentionally not a dependency: task switches
    // establish a new isolated database, keystrokes do not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.reducedMotion = String(settings.reducedMotion);
  }, [settings.reducedMotion, settings.theme]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(undefined), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const persistDraft = useCallback(
    (
      nextQuery: string,
      options: { announce?: boolean; preserveLocation?: boolean } = {},
    ) => {
      if (
        draftDirtyRef.current ||
        nextQuery !== lastPersistedQueryRef.current
      ) {
        draftRevisionRef.current += 1;
        onProgressChange((current) => {
          const previous =
            current.tasks[task.id] ?? createDraftProgress(task.id, nextQuery);
          const nextProgress = {
            ...current,
            lastOpenedTaskId: options.preserveLocation
              ? current.lastOpenedTaskId
              : task.id,
            lastOpenedTaskIdTrusted: options.preserveLocation
              ? current.lastOpenedTaskIdTrusted
              : true,
            tasks: {
              ...current.tasks,
              [task.id]: { ...previous, lastQuery: nextQuery },
            },
          };
          return nextQuery.trim()
            ? recordPracticeActivity(nextProgress)
            : nextProgress;
        });
        lastPersistedQueryRef.current = nextQuery;
        draftDirtyRef.current = false;
      }
      if (options.announce) {
        setToast(
          persistenceAvailable
            ? "Sorgu ve ilerleme bu cihaza kaydedildi."
            : "Taslak yalnız bu oturum için tutuldu.",
        );
      }
    },
    [onProgressChange, persistenceAvailable, task.id],
  );

  const saveDraft = useCallback(() => {
    persistDraft(queryRef.current, { announce: true });
  }, [persistDraft]);

  const navigateToTask = useCallback(
    (taskId: string) => {
      persistDraft(queryRef.current, { preserveLocation: true });
      runGenerationRef.current += 1;
      setRouteMenuOpen(false);
      onNavigate("workspace", { taskId });
    },
    [onNavigate, persistDraft],
  );

  const updateQuery = useCallback((nextQuery: string) => {
    queryRef.current = nextQuery;
    draftDirtyRef.current = true;
    setQuery(nextQuery);
  }, []);

  useEffect(() => {
    if (!draftDirtyRef.current && query === lastPersistedQueryRef.current) {
      return;
    }
    const timeout = window.setTimeout(
      () => persistDraft(query),
      DRAFT_AUTOSAVE_DELAY_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [persistDraft, query]);

  useEffect(
    () => () => {
      persistDraft(queryRef.current, { preserveLocation: true });
    },
    [persistDraft],
  );

  const runQuery = useCallback(async () => {
    if (!query.trim() || isRunning) return;
    const database = databaseRef.current;
    if (!database || engineState !== "ready") {
      setToast("SQL motoru hazır değil; önce motor durumunu kontrol et.");
      return;
    }
    const draftRevisionAtRunStart = draftRevisionRef.current;
    const assistanceAtRunStart = {
      hintsUsed: [...visibleHints],
      solutionRevealed: solutionUsed,
    };

    setIsRunning(true);
    setEvaluation(undefined);
    const runGeneration = runGenerationRef.current + 1;
    runGenerationRef.current = runGeneration;
    const isCurrentRun = () =>
      runGenerationRef.current === runGeneration &&
      databaseRef.current === database;
    let runPhase: "prepare-mutation" | "execute-query" =
      task.validationMode === "mutation" ? "prepare-mutation" : "execute-query";
    try {
      if (runPhase === "prepare-mutation") {
        await database.reset();
        if (!isCurrentRun()) return;
        runPhase = "execute-query";
      }
      const execution = await database.run(query);
      if (!isCurrentRun()) return;
      const mutationVerificationResult = task.mutationVerification
        ? await database.run(task.mutationVerification.sql)
        : undefined;
      if (!isCurrentRun()) return;
      const nextEvaluation = evaluateLessonQuery(
        task,
        query,
        execution,
        undefined,
        mutationVerificationResult,
      );
      const elapsed = Math.max(
        1,
        Math.round((Date.now() - openedAtRef.current) / 1000),
      );
      setResult(execution);
      setEvaluation(nextEvaluation);
      showResultsAndFocus();
      const hasNewerSavedDraft =
        draftRevisionRef.current !== draftRevisionAtRunStart;
      const verifiedSnapshot =
        nextEvaluation.correct && task.scored
          ? createVerifiedRunSnapshot(task.id, query, execution)
          : undefined;
      onProgressChange((current) => {
        const latestQuery = current.tasks[task.id]?.lastQuery ?? "";
        let nextProgress = recordAttempt(
          current,
          task.id,
          query,
          nextEvaluation.correct,
          elapsed,
          new Date(),
          assistanceAtRunStart,
          { scored: task.scored },
        );
        if (verifiedSnapshot) {
          nextProgress = recordVerifiedRun(nextProgress, verifiedSnapshot);
        }
        const attemptedTask = nextProgress.tasks[task.id];
        return {
          ...nextProgress,
          lastOpenedTaskId: task.id,
          lastOpenedTaskIdTrusted: true,
          tasks: {
            ...nextProgress.tasks,
            [task.id]: {
              ...attemptedTask,
              lastQuery: hasNewerSavedDraft ? latestQuery : query,
            },
          },
        };
      });
    } catch (error: unknown) {
      if (!isCurrentRun()) return;
      if (runPhase === "prepare-mutation") {
        setResult(undefined);
        setEvaluation(undefined);
        setEngineState("failed");
        setEngineSetupError(
          "Vaka verisi bu deneme için hazırlanamadı. Bu sistem hatası sorgunla ilgili değil; Sıfırla ile yeniden dene veya sayfayı yenile.",
        );
        showResultsAndFocus();
        return;
      }
      const nextEvaluation = evaluateLessonQuery(task, query, undefined, error);
      setResult(undefined);
      setEvaluation(nextEvaluation);
      showResultsAndFocus();
      const hasNewerSavedDraft =
        draftRevisionRef.current !== draftRevisionAtRunStart;
      onProgressChange((current) => {
        const latestQuery = current.tasks[task.id]?.lastQuery ?? "";
        const nextProgress = recordAttempt(
          current,
          task.id,
          query,
          false,
          0,
          new Date(),
          undefined,
          { scored: task.scored },
        );
        const attemptedTask = nextProgress.tasks[task.id];
        return {
          ...nextProgress,
          lastOpenedTaskId: task.id,
          lastOpenedTaskIdTrusted: true,
          tasks: {
            ...nextProgress.tasks,
            [task.id]: {
              ...attemptedTask,
              lastQuery: hasNewerSavedDraft ? latestQuery : query,
            },
          },
        };
      });
    } finally {
      if (isCurrentRun()) {
        setIsRunning(false);
        if (runPhase === "execute-query") {
          setEngineState(database.state === "ready" ? "ready" : "failed");
        }
      }
    }
  }, [
    engineState,
    isRunning,
    onProgressChange,
    query,
    showResultsAndFocus,
    solutionUsed,
    task,
    visibleHints,
  ]);

  useEffect(() => {
    runQueryShortcutRef.current = () => void runQuery();
    saveDraftShortcutRef.current = saveDraft;
    navigatePreviousShortcutRef.current = () => {
      if (previousTask) navigateToTask(previousTask.id);
    };
    navigateNextShortcutRef.current = () => {
      if (nextTask) navigateToTask(nextTask.id);
      else onNavigate("progress");
    };
    openRouteShortcutRef.current = () => setRouteMenuOpen(true);
  }, [navigateToTask, nextTask, onNavigate, previousTask, runQuery, saveDraft]);

  useEffect(
    () => () => {
      editorShortcutActionsRef.current.forEach((action) => action.dispose());
      editorShortcutActionsRef.current = [];
    },
    [],
  );

  const resetTask = useCallback(async () => {
    const database = databaseRef.current;
    if (!database) return;
    runGenerationRef.current += 1;
    const resetGeneration = runGenerationRef.current;
    const isCurrentReset = () =>
      runGenerationRef.current === resetGeneration &&
      databaseRef.current === database;
    setEngineState("loading");
    setEngineSetupError(undefined);
    setResult(undefined);
    setEvaluation(undefined);
    try {
      await database.reset();
      if (!isCurrentReset()) return;
      const startingQuery = task.starterSql ?? "";
      updateQuery(startingQuery);
      onProgressChange((current) => {
        const previous =
          current.tasks[task.id] ?? createDraftProgress(task.id, "");
        return {
          ...current,
          lastOpenedTaskId: task.id,
          lastOpenedTaskIdTrusted: true,
          tasks: {
            ...current.tasks,
            [task.id]: { ...previous, lastQuery: startingQuery },
          },
        };
      });
      lastPersistedQueryRef.current = startingQuery;
      draftDirtyRef.current = false;
      setEngineSetupError(undefined);
      setEngineState("ready");
      setToast("Vaka verisi ve editör başlangıç durumuna döndü.");
    } catch {
      if (!isCurrentReset()) return;
      setEngineState("failed");
      setEngineSetupError(
        "Vaka verisi yeniden hazırlanamadı. Bu sistem hatası sorgunla ilgili değil; tekrar Sıfırla’yı dene veya sayfayı yenile.",
      );
      setEvaluation(undefined);
      showResultsAndFocus();
    }
  }, [onProgressChange, showResultsAndFocus, task, updateQuery]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) {
        if (event.key === "Escape") {
          setRouteMenuOpen(false);
          setShowCommands(false);
        }
        return;
      }
      if (event.shiftKey && event.key === "ArrowLeft") {
        event.preventDefault();
        navigatePreviousShortcutRef.current();
        return;
      }
      if (event.shiftKey && event.key === "ArrowRight") {
        event.preventDefault();
        navigateNextShortcutRef.current();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        void runQuery();
        return;
      }
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveDraft();
        return;
      }
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        setRouteMenuOpen(true);
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [runQuery, saveDraft]);

  const revealHint = (index: number) => {
    setHelpExpanded(true);
    if (visibleHints.includes(index)) return;
    setVisibleHints((current) => [...current, index].sort());
    onProgressChange((current) => recordHint(current, task.id, index));
    setScoreAnnouncement(
      isDrill
        ? "Ücretsiz alıştırma ipucu açıldı. Puanın etkilenmez."
        : taskCompleted
          ? `${index + 1}. ipucu açıldı. Kazanılmış ${awardedCaseScore} puan değişmedi.`
          : `${index + 1}. ipucu açıldı. Bu vaka için ${calculateCaseScore([...visibleHints, index], solutionUsed)} puan kaldı.`,
    );
  };

  const activatePanelTab = (nextTab: "brief" | "schema", moveFocus = false) => {
    setPanelTab(nextTab);
    setMobileView(nextTab);
    if (!moveFocus) return;
    window.setTimeout(() => {
      if (isCompactWorkspace) {
        const mobileIndex = MOBILE_WORKSPACE_VIEWS.findIndex(
          (view) => view.id === nextTab,
        );
        mobileViewRefs.current[mobileIndex]?.focus();
        return;
      }
      const target =
        nextTab === "brief" ? briefTabRef.current : schemaTabRef.current;
      target?.focus();
    }, 0);
  };

  const dismissFirstCaseGuide = () => {
    onDismissFirstCaseGuide();
    window.setTimeout(() => briefPanelRef.current?.focus(), 0);
  };

  const handlePanelTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    let nextTab: "brief" | "schema" | undefined;
    if (event.key === "ArrowLeft" || event.key === "Home") nextTab = "brief";
    if (event.key === "ArrowRight" || event.key === "End") nextTab = "schema";
    if (!nextTab) return;
    event.preventDefault();
    activatePanelTab(nextTab, true);
  };

  const copyExpectedColumn = async (column: string) => {
    try {
      await navigator.clipboard.writeText(column);
      setToast(`${column} panoya kopyalandı.`);
    } catch {
      setToast("Panoya erişilemedi; kolon adını elle kopyalayabilirsin.");
    }
  };

  const copySolution = async () => {
    try {
      await navigator.clipboard.writeText(task.solutionSql);
      setToast("Çalışan örnek sorgu panoya kopyalandı.");
    } catch {
      setToast(
        "Panoya erişilemedi; sorguyu kod bloğundan elle kopyalayabilirsin.",
      );
    }
  };

  const showSolution = () => {
    setSolutionConfirmVisible(false);
    setSolutionVisible(true);
    setSolutionAnnouncement(
      isDrill
        ? "Çalışan çözüm açıldı. Bu alıştırma puansızdır; ilerlemen etkilenmez."
        : taskCompleted
          ? `Çalışan çözüm açıldı. Kazanılmış ${awardedCaseScore} puan değişmedi.`
          : "Tam çözüm açıldı; editördeki sorgun değiştirilmedi ve bu vaka için 0 puan kaydedildi.",
    );
    window.setTimeout(() => solutionTriggerRef.current?.focus(), 0);
  };

  const confirmSolutionReveal = () => {
    if (!taskCompleted && !solutionUsed) {
      setSolutionUsed(true);
      onProgressChange((current) => recordSolutionReveal(current, task.id));
      setScoreAnnouncement(
        isDrill
          ? "Çalışan çözüm açıldı. Bu alıştırma puansızdır; puanın etkilenmez."
          : "Tam çözüm açıldı. Bu vaka tamamlandığında 0 analiz puanı kazanılacak; rota ilerlemesi etkilenmeyecek.",
      );
    }
    showSolution();
  };

  const cancelSolutionReveal = () => {
    setSolutionConfirmVisible(false);
    setSolutionAnnouncement("Tam çözüm açılmadı.");
    window.setTimeout(() => solutionTriggerRef.current?.focus(), 0);
  };

  const toggleSolution = (forceVisible?: boolean) => {
    const nextVisible = forceVisible ?? !solutionVisible;
    if (nextVisible) setHelpExpanded(true);
    if (!nextVisible) {
      setSolutionVisible(false);
      setSolutionConfirmVisible(false);
      setSolutionAnnouncement("Tam çözüm kapatıldı.");
      return;
    }
    // Onay adımı yalnız kaybedilecek bir puan varken anlamlıdır. Puansız
    // alıştırmada ve tamamlanmış vakada koruduğu bir şey yok, doğrudan açılır.
    if (taskCompleted || solutionUsed || !task.scored) {
      showSolution();
      return;
    }
    setSolutionConfirmVisible(true);
    setSolutionAnnouncement(
      isDrill
        ? "Çalışan çözümü açmadan önce yardım kullanımını onaylaman gerekiyor."
        : "Tam çözümü açmadan önce puan etkisini onaylaman gerekiyor.",
    );
  };

  const focusEditor = () => {
    setMobileView("editor");
    if (!editorRef.current) pendingEditorFocusRef.current = true;
    window.setTimeout(() => editorRef.current?.focus(), 0);
  };

  const activateMobileView = (
    nextView: MobileWorkspaceView,
    moveFocus = false,
  ) => {
    setMobileView(nextView);
    if (nextView === "brief" || nextView === "schema") {
      setPanelTab(nextView);
    }
    if (moveFocus) {
      const nextIndex = MOBILE_WORKSPACE_VIEWS.findIndex(
        (view) => view.id === nextView,
      );
      window.setTimeout(() => mobileViewRefs.current[nextIndex]?.focus(), 0);
    }
  };

  const handleMobileViewKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % MOBILE_WORKSPACE_VIEWS.length;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex =
        (index - 1 + MOBILE_WORKSPACE_VIEWS.length) %
        MOBILE_WORKSPACE_VIEWS.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = MOBILE_WORKSPACE_VIEWS.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextView = MOBILE_WORKSPACE_VIEWS[nextIndex]?.id;
    if (nextView) activateMobileView(nextView, true);
  };

  const resizeBriefWithKeyboard = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    let nextWidth: number | undefined;
    if (event.key === "ArrowLeft") nextWidth = briefWidth - 16;
    if (event.key === "ArrowRight") nextWidth = briefWidth + 16;
    if (event.key === "Home") nextWidth = 300;
    if (event.key === "End") nextWidth = 540;
    if (nextWidth === undefined) return;
    event.preventDefault();
    setBriefWidth(Math.max(300, Math.min(540, nextWidth)));
  };

  const resizeEditorWithKeyboard = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    let nextHeight: number | undefined;
    if (event.key === "ArrowUp") nextHeight = editorHeight - 3;
    if (event.key === "ArrowDown") nextHeight = editorHeight + 3;
    if (event.key === "Home") nextHeight = 34;
    if (event.key === "End") nextHeight = 72;
    if (nextHeight === undefined) return;
    event.preventDefault();
    setEditorHeight(Math.max(34, Math.min(72, nextHeight)));
  };

  const beginHorizontalResize = (event: React.PointerEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = briefWidth;
    const move = (pointerEvent: PointerEvent) => {
      setBriefWidth(
        Math.max(
          300,
          Math.min(540, startWidth + pointerEvent.clientX - startX),
        ),
      );
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  const beginVerticalResize = (event: React.PointerEvent) => {
    event.preventDefault();
    const workbench = workbenchRef.current;
    if (!workbench) return;
    const bounds = workbench.getBoundingClientRect();
    const move = (pointerEvent: PointerEvent) => {
      const percentage =
        ((pointerEvent.clientY - bounds.top) / bounds.height) * 100;
      setEditorHeight(Math.max(34, Math.min(72, percentage)));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  const resultColumns = result?.columns ?? [];
  const resultRows = result?.rows ?? [];
  const tone = evaluationTone(evaluation);
  const taskAttempts = progress.tasks[task.id]?.attempts ?? 0;
  const activeCoaching =
    evaluation && evaluation.status !== "correct"
      ? task.coaching[evaluation.status]
      : undefined;

  /**
   * Şema rayındaki bir kolona basmak adı imlecin olduğu yere yazar. Amaç
   * kısayol değil, doğruluk: kolon adları elle yazıldığında en sık yapılan
   * hata yazım hatasıdır ve bu hata sorguyu çalıştırana kadar görünmez.
   */
  const insertColumnAtCursor = (columnName: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = editor.getSelection();
    if (!selection) return;
    editor.executeEdits("queryvale-schema-rail", [
      { range: selection, text: columnName, forceMoveMarkers: true },
    ]);
    editor.focus();
  };

  const editorOptions = useMemo(
    () => ({
      fontSize: settings.fontSize,
      lineHeight: Math.round(settings.fontSize * settings.lineHeight),
      // Monaco kendi varsayılan yığınını kullanır; ürünün mono ailesini
      // açıkça vermezsek editör paketlenmiş fontun dışında kalır.
      fontFamily: EDITOR_FONT_STACK,
      fontLigatures: false,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: "on" as const,
      padding: { top: 18, bottom: 18 },
      renderLineHighlight: "line" as const,
      cursorBlinking: settings.reducedMotion
        ? ("solid" as const)
        : ("smooth" as const),
      quickSuggestions: settings.autocomplete,
      suggestOnTriggerCharacters: settings.autocomplete,
      tabSize: 2,
      insertSpaces: true,
      roundedSelection: true,
      fixedOverflowWidgets: true,
      placeholder: "SQL sorgunu burada yaz…",
    }),
    [settings],
  );

  return (
    <main id="main-content" className="workspace-page" tabIndex={-1}>
      <div className="workspace-topbar">
        <div className="workspace-breadcrumb">
          <span>{currentModule?.title}</span>
          <ArrowRight size={11} />
          <strong>{task.title}</strong>
        </div>
        <div className="workspace-topbar-actions">
          <span className="mission-counter">
            {isProject ? "Proje" : taskKindLabel(task)} {taskIndex + 1}/
            {tasks.length}
          </span>
          <button
            className="icon-button"
            type="button"
            onClick={() => setShowCommands(true)}
            aria-label="Komut panelini aç"
          >
            <TerminalSquare size={14} />
          </button>
        </div>
      </div>

      {isCompactWorkspace && (
        <nav
          className="workspace-mobile-tabs"
          role="tablist"
          aria-label={`${isDrill ? taskKindLabel(task) : "Vaka"} çalışma adımları`}
        >
          {MOBILE_WORKSPACE_VIEWS.map((view, index) => {
            const isActive = mobileView === view.id;
            const viewLabel =
              view.id === "brief" && isDrill ? taskKindLabel(task) : view.label;
            const resultStatus =
              view.id === "results" && evaluation
                ? evaluation.correct
                  ? "Doğru"
                  : "Kontrol et"
                : undefined;
            return (
              <button
                key={view.id}
                id={`mobile-${task.id}-${view.id}-tab`}
                ref={(node) => {
                  mobileViewRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                aria-label={`${viewLabel} görünümü`}
                aria-describedby={
                  resultStatus ? `mobile-${task.id}-result-status` : undefined
                }
                aria-selected={isActive}
                aria-controls={
                  view.id === "brief"
                    ? `${task.id}-brief-panel`
                    : view.id === "schema"
                      ? `${task.id}-schema-panel`
                      : view.id === "editor"
                        ? "workspace-editor-panel"
                        : "workspace-results-panel"
                }
                tabIndex={isActive ? 0 : -1}
                onClick={() => activateMobileView(view.id)}
                onKeyDown={(event) => handleMobileViewKeyDown(event, index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{viewLabel}</strong>
                {resultStatus && (
                  <small id={`mobile-${task.id}-result-status`}>
                    {resultStatus}
                  </small>
                )}
              </button>
            );
          })}
        </nav>
      )}

      {evaluation && (
        <span className="sr-only" role="status">
          {evaluation.correct
            ? "Sorgu doğru. Sonuç görünümü açıldı."
            : `Sorgu kontrol edildi: ${evaluation.title}. Sonuç görünümü açıldı.`}
        </span>
      )}

      <div
        className="workspace-body"
        data-mobile-view={mobileView}
        style={{ "--brief-width": `${briefWidth}px` } as React.CSSProperties}
      >
        <aside
          id="workspace-brief-panel"
          className="brief-panel"
          data-task-type={task.type}
          aria-label={`${task.title} ${
            isDrill ? taskKindLabel(task).toLocaleLowerCase("tr-TR") : "vaka"
          } bilgileri`}
        >
          {!isCompactWorkspace && (
            <div
              className="panel-tabs"
              role="tablist"
              aria-label={
                isDrill ? `${taskKindLabel(task)} bilgileri` : "Vaka bilgileri"
              }
            >
              <button
                id={`${task.id}-brief-tab`}
                ref={briefTabRef}
                className={`panel-tab ${panelTab === "brief" ? "active" : ""}`}
                type="button"
                role="tab"
                aria-selected={panelTab === "brief"}
                aria-controls={`${task.id}-brief-panel`}
                tabIndex={panelTab === "brief" ? 0 : -1}
                onClick={() => activatePanelTab("brief")}
                onKeyDown={handlePanelTabKeyDown}
              >
                {isDrill ? taskKindLabel(task) : "Vaka"}
              </button>
              <button
                id={`${task.id}-schema-tab`}
                ref={schemaTabRef}
                className={`panel-tab ${panelTab === "schema" ? "active" : ""}`}
                type="button"
                role="tab"
                aria-selected={panelTab === "schema"}
                aria-controls={`${task.id}-schema-panel`}
                tabIndex={panelTab === "schema" ? 0 : -1}
                onClick={() => activatePanelTab("schema")}
                onKeyDown={handlePanelTabKeyDown}
              >
                Şema &amp; veri
              </button>
            </div>
          )}

          <div
            id={`${task.id}-brief-panel`}
            ref={briefPanelRef}
            className="brief-scroll"
            data-drill-type={isDrill ? task.type : undefined}
            role="tabpanel"
            aria-labelledby={
              isCompactWorkspace
                ? `mobile-${task.id}-brief-tab`
                : `${task.id}-brief-tab`
            }
            tabIndex={0}
            hidden={panelTab !== "brief"}
          >
            {!isDrill && showFirstCaseGuide && (
              <FirstCaseGuide
                onDismiss={dismissFirstCaseGuide}
                onShowData={() => activatePanelTab("schema", true)}
                onFocusEditor={focusEditor}
              />
            )}
            <>
              <div className="brief-kicker">
                {isDrill && activeDrillPresentation && ActiveDrillIcon ? (
                  <span className="brief-drill-tag">
                    <ActiveDrillIcon size={13} aria-hidden="true" />
                    {activeDrillPresentation.badge}
                  </span>
                ) : (
                  <span className="brief-case-tag">
                    VAKA · {task.estimatedMinutes} DK
                  </span>
                )}
                <span className="brief-time">
                  {isDrill ? (
                    <>
                      <Target size={10} /> Puan yok · rehberli pratik
                    </>
                  ) : (
                    <>
                      <Clock3 size={10} /> {difficultyLabel(task)}
                    </>
                  )}
                </span>
              </div>
              <h1>{task.title}</h1>

              {/*
                Vakayı açtığı anda kullanıcının ihtiyacı iki şeydir: ne teslim
                edeceği ve hangi kolonların beklendiği. Kendini doğrulama,
                kavram ve iş bağlamı ancak bir denemeden sonra anlam kazanır;
                bu yüzden hepsi katlanmış gelir. Panelin varsayılan hâli tek
                ekrana sığmalıdır — okunmayan metin, okunmayı da caydırır.
              */}
              <section className="task-brief-block task-brief-objective">
                <h2 id={`${task.id}-objective-title`}>İstenen teslim</h2>
                <p className="task-objective">{task.objective}</p>
              </section>

              <section className="task-brief-block">
                <h2 id={`${task.id}-columns-title`}>Beklenen çıktı</h2>
                <p className="task-grain-line">
                  {task.learningBrief.outputGrain}
                </p>
                <ul
                  className="expected-columns"
                  aria-labelledby={`${task.id}-columns-title`}
                >
                  {task.expectedColumns.map((column) => (
                    <li key={column}>
                      <button
                        className="expected-column"
                        type="button"
                        onClick={() => void copyExpectedColumn(column)}
                        aria-label={`${column} kolonunu kopyala`}
                        title="Kolon adını panoya kopyala"
                      >
                        <code>{column}</code>
                        <Copy size={11} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <details className="task-disclosure task-check-disclosure">
                <summary>
                  <CheckCircle2 size={13} />
                  <span>Kendini kontrol et</span>
                  <small>
                    {task.learningBrief.acceptanceChecks.length} madde
                  </small>
                </summary>
                <ul className="task-check-list">
                  {task.learningBrief.acceptanceChecks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </details>

              <details className="task-disclosure task-concept-disclosure">
                <summary>
                  <Braces size={13} />
                  <span>
                    Bu {isDrill ? "alıştırmada" : "vakada"} ne çalışıyorsun?
                  </span>
                  <small>Kavram</small>
                </summary>
                <p className="task-concept-copy">
                  {task.learningBrief.conceptAnchor}
                </p>
              </details>

              <details className="task-disclosure task-context-disclosure">
                <summary>
                  <TerminalSquare size={13} />
                  <span>İş bağlamı</span>
                  <small>İsteğe bağlı</small>
                </summary>
                <div className="task-disclosure-copy">
                  <strong>{task.subtitle}</strong>
                  <p>{task.scenario}</p>
                </div>
              </details>

              <section
                className="task-help-console"
                aria-label={`${isDrill ? taskKindLabel(task) : "Vaka"} yardımı`}
              >
                <button
                  id={`${task.id}-help-toggle`}
                  className="task-help-toggle"
                  type="button"
                  onClick={() => setHelpExpanded((current) => !current)}
                  aria-expanded={helpExpanded}
                  aria-controls={`${task.id}-help-panel`}
                  aria-label={
                    helpExpanded
                      ? "Yardım adımlarını kapat"
                      : "Yardım adımlarını aç"
                  }
                >
                  <span className="task-help-icon" aria-hidden="true">
                    <Lightbulb size={15} />
                  </span>
                  <span className="task-help-copy">
                    <strong>Takıldın mı?</strong>
                    <small>
                      {helpExpanded ? "Yardımı kapat" : "Adım adım yardım al"}
                    </small>
                  </span>
                  <span className="hint-progress" aria-hidden="true">
                    {revealedHintCount}/{task.hints.length} ipucu
                  </span>
                  <ArrowRight
                    className={helpExpanded ? "is-open" : undefined}
                    size={13}
                    aria-hidden="true"
                  />
                </button>
                {helpExpanded && (
                  <div
                    id={`${task.id}-help-panel`}
                    className="task-help-panel"
                    role="region"
                    aria-labelledby={`${task.id}-help-toggle`}
                  >
                    {/*
                      Puan durumu tek satıra indirildi: aynı bilgi zaten her
                      ipucu butonunun altında somut karşılığıyla yazıyor
                      ("−3 puan · açınca 7 puan kalır"). Ayrı bir açıklama
                      kutusu ve mekaniği tarif eden paragraf kaldırıldı.
                    */}
                    <p className="sr-only">
                      {isDrill
                        ? "Puan yok · üç ipucu ve çalışan çözüm ücretsiz"
                        : taskCompleted
                          ? `${awardedCaseScore}/${MAX_CASE_SCORE} puan kilitlendi · yardım artık puanını değiştirmez`
                          : `${currentCaseScore}/${MAX_CASE_SCORE} puan kullanılabilir`}
                    </p>
                    <div className="hint-stack">
                      {revealedHintCount > 0 && (
                        <ol
                          key="revealed-hints"
                          className="revealed-hint-list"
                          aria-label="Açılan ipuçları"
                        >
                          {task.hints.map((hint, index) =>
                            visibleHints.includes(index) ? (
                              <li className="revealed-hint" key={hint}>
                                <span className="hint-index">{index + 1}</span>
                                <span>
                                  <strong>
                                    {index + 1}. adım ·{" "}
                                    {HINT_STAGE_LABELS[index]}
                                  </strong>
                                  <span>{hint}</span>
                                </span>
                              </li>
                            ) : null,
                          )}
                        </ol>
                      )}
                      {nextHintIndex >= 0 ? (
                        <button
                          key="next-hint"
                          className="hint-button"
                          type="button"
                          onClick={() => revealHint(nextHintIndex)}
                          aria-label={`${nextHintIndex + 1}. ipucunu aç`}
                        >
                          <span className="hint-button-icon">
                            <Lightbulb size={14} />
                          </span>
                          <span className="hint-button-copy">
                            <strong>{HINT_ACTION_LABELS[nextHintIndex]}</strong>
                            <small>
                              {isDrill
                                ? `${nextHintIndex + 1}. yardım adımı · ücretsiz`
                                : taskCompleted
                                  ? `${nextHintIndex + 1}. yardım adımı · puanın değişmez`
                                  : `−3 puan · açınca ${scoreAfterNextHint} puan kalır`}
                            </small>
                          </span>
                          <ArrowRight size={13} />
                        </button>
                      ) : (
                        <>
                          <div className="hint-complete">
                            <CheckCircle2 size={13} />
                            {isDrill
                              ? "Üç hazırlık adımını gördün · doğru sonucu ve çalışan çözümü inceleyebilirsin"
                              : taskCompleted
                                ? "Üç hazırlık adımını gördün · puanın kilitli"
                                : `Üç hazırlık adımını gördün · ${currentCaseScore} puan kaldı`}
                          </div>
                          {isDrill && <DrillExpectedResultHint task={task} />}
                          <button
                            ref={solutionTriggerRef}
                            className="hint-button solution-trigger"
                            type="button"
                            onClick={() => toggleSolution()}
                            aria-expanded={solutionVisible}
                            aria-controls={`${task.id}-solution`}
                          >
                            <span className="hint-button-icon">
                              <TerminalSquare size={14} />
                            </span>
                            <span className="hint-button-copy">
                              <strong>
                                {solutionVisible
                                  ? "Çalışan çözümü gizle"
                                  : "Bir doğru sorguyu göster"}
                              </strong>
                              <small>
                                {isDrill
                                  ? solutionUsed
                                    ? "Ücretsiz çözüm açıldı · yeniden görüntüle"
                                    : "Gerçek motorla doğrulandı · puansız alıştırma"
                                  : taskCompleted
                                    ? "İnceleme modu · kazanılmış puanın değişmez"
                                    : solutionUsed
                                      ? "0 puan kaydedildi · yeniden görüntüle"
                                      : "Tam çözüm açılır · bu vaka 0 puan olur"}
                              </small>
                            </span>
                            <ArrowRight
                              className={
                                solutionVisible ? "is-open" : undefined
                              }
                              size={13}
                            />
                          </button>
                          {solutionConfirmVisible && !solutionVisible && (
                            <div
                              className="solution-score-confirmation"
                              role="group"
                              aria-labelledby={`${task.id}-solution-confirm-title`}
                              aria-describedby={`${task.id}-solution-confirm-description`}
                              onKeyDown={(event) => {
                                if (event.key !== "Escape") return;
                                event.preventDefault();
                                cancelSolutionReveal();
                              }}
                            >
                              <div>
                                <strong
                                  id={`${task.id}-solution-confirm-title`}
                                >
                                  {isDrill
                                    ? "Çalışan çözümü açmak istiyor musun?"
                                    : "Tam çözümü açmak istiyor musun?"}
                                </strong>
                                <p
                                  id={`${task.id}-solution-confirm-description`}
                                >
                                  {isDrill
                                    ? "Bu alıştırma puansızdır. Örnek sorguyu görmen puanını, tamamlanmanı veya rota erişimini değiştirmez."
                                    : "Bu vaka 0 analiz puanı olur. Yine de doğru tamamlanır, ilerlemen ve sonraki vakalar etkilenmez."}
                                </p>
                              </div>
                              <div className="solution-score-confirmation-actions">
                                <button
                                  ref={solutionCancelRef}
                                  type="button"
                                  onClick={cancelSolutionReveal}
                                >
                                  Kendim deneyeyim
                                </button>
                                <button
                                  type="button"
                                  className="confirm"
                                  onClick={confirmSolutionReveal}
                                >
                                  {isDrill
                                    ? "Çalışan çözümü göster"
                                    : "0 puanla çözümü göster"}
                                </button>
                              </div>
                            </div>
                          )}
                          {solutionVisible && (
                            <div
                              id={`${task.id}-solution`}
                              className="solution-reveal"
                              role="region"
                              aria-labelledby={`${task.id}-solution-title`}
                            >
                              <div className="solution-reveal-heading">
                                <span className="solution-reveal-icon">
                                  <Braces size={14} />
                                </span>
                                <div>
                                  <strong id={`${task.id}-solution-title`}>
                                    Çalışan çözüm örneği
                                  </strong>
                                  <span>
                                    Tam SQL · gerçek motorla doğrulandı
                                  </span>
                                </div>
                              </div>
                              <p className="solution-reveal-note">
                                Bu, geçerli çözümlerden biridir. Aynı sonucu
                                farklı bir sorguyla da üretebilirsin.
                              </p>
                              <pre
                                className="solution-code"
                                tabIndex={0}
                                aria-label={`${task.title} için örnek SQL sorgusu`}
                              >
                                <code>{task.solutionSql}</code>
                              </pre>
                              <p className="solution-reveal-footnote">
                                {isDrill
                                  ? "Bu alıştırma puansızdır; çözümü açmak yalnız yardım kullanımını kaydeder. Sorguyu editörde yine sen çalıştırırsın."
                                  : taskCompleted
                                    ? "Vaka puanın ilk doğrulamada kilitlendi. Bu inceleme puanını veya ilerlemeni değiştirmez."
                                    : "Tam çözüm kullanımı bu vaka puanını 0 yaptı; tamamlanmanı veya rota erişimini etkilemez. Sorguyu editörde yine sen çalıştırırsın."}
                              </p>
                              <div className="solution-reveal-actions">
                                <button
                                  className="solution-action"
                                  type="button"
                                  onClick={() => void copySolution()}
                                >
                                  <Copy size={13} /> SQL’i kopyala
                                </button>
                                <button
                                  className="solution-action primary"
                                  type="button"
                                  onClick={focusEditor}
                                >
                                  Editöre dön ve kendin yaz
                                  <ArrowRight size={13} />
                                </button>
                              </div>
                            </div>
                          )}
                          <span className="sr-only" role="status">
                            {solutionAnnouncement}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="sr-only" role="status" aria-live="polite">
                      {scoreAnnouncement}
                    </span>
                  </div>
                )}
              </section>
            </>
          </div>
          <div
            id={`${task.id}-schema-panel`}
            className="brief-scroll"
            role="tabpanel"
            aria-labelledby={
              isCompactWorkspace
                ? `mobile-${task.id}-schema-tab`
                : `${task.id}-schema-tab`
            }
            tabIndex={0}
            hidden={panelTab !== "schema"}
          >
            <div className="brief-kicker">
              <span>{task.schema.tables.length} tablo</span>
              <span>İzole vaka verisi</span>
            </div>
            <details className="task-disclosure schema-notes-disclosure">
              <summary>
                <Database size={13} />
                <span>Veride dikkat et</span>
                <small>{task.learningBrief.dataNotes.length} not</small>
              </summary>
              <ul className="task-data-note-list">
                {task.learningBrief.dataNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </details>
            <section className="brief-section" style={{ marginTop: 18 }}>
              <div className="schema-list">
                {task.schema.tables.map((table) => {
                  const samples = task.sampleRows.find(
                    (sample) => sample.tableName === table.name,
                  );
                  return (
                    <div className="schema-card" key={table.name}>
                      <div className="schema-card-head">
                        <Table2 size={13} />
                        {table.name}
                      </div>
                      {table.columns.map((column) => (
                        <div className="schema-row" key={column.name}>
                          <span>
                            {column.primaryKey && (
                              <KeyRound
                                size={9}
                                aria-label="Birincil anahtar"
                              />
                            )}{" "}
                            {column.name}
                          </span>
                          <span>{column.dataType}</span>
                        </div>
                      ))}
                      {samples?.rows.length ? (
                        <div className="sample-table-wrap">
                          <table className="sample-table">
                            <thead>
                              <tr>
                                {Object.keys(samples.rows[0]).map((column) => (
                                  <th key={column}>{column}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {samples.rows.slice(0, 3).map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {Object.keys(samples.rows[0]).map(
                                    (column) => (
                                      <td key={column}>
                                        {formatCell(row[column] as SqlScalar)}
                                      </td>
                                    ),
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </aside>

        <div
          className="resize-rail"
          role="separator"
          tabIndex={0}
          aria-label={`${isDrill ? taskKindLabel(task) : "Vaka"} panelini yeniden boyutlandır`}
          aria-orientation="vertical"
          aria-controls="workspace-brief-panel"
          aria-valuemin={300}
          aria-valuemax={540}
          aria-valuenow={briefWidth}
          onPointerDown={beginHorizontalResize}
          onKeyDown={resizeBriefWithKeyboard}
        />

        <div
          className="workbench"
          ref={workbenchRef}
          style={
            { "--editor-height": `${editorHeight}%` } as React.CSSProperties
          }
        >
          <section
            id="workspace-editor-panel"
            className="editor-section"
            role={isCompactWorkspace ? "tabpanel" : undefined}
            aria-labelledby={
              isCompactWorkspace ? `mobile-${task.id}-editor-tab` : undefined
            }
          >
            <div className="editor-toolbar">
              <span className="toolbar-title">
                <Braces size={13} /> analysis.sql
              </span>
              <span
                className={`engine-state ${
                  engineState === "ready" ? "ready" : ""
                }`}
              >
                {engineState === "loading"
                  ? "PGlite hazırlanıyor"
                  : engineState === "ready"
                    ? "PostgreSQL hazır"
                    : "Motoru kontrol et"}
              </span>
              <span
                className={`draft-autosave-status ${
                  persistenceAvailable ? "" : "session-only"
                }`}
                title={
                  persistenceAvailable
                    ? "SQL taslağın yazarken otomatik kaydedilir"
                    : "Kalıcı depolama kullanılamıyor; taslak yalnız bu oturumda tutuluyor"
                }
              >
                {persistenceAvailable ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <CircleAlert size={12} />
                )}
                {persistenceAvailable
                  ? "Otomatik kayıt açık"
                  : "Yalnız bu oturum"}
              </span>
              <span className="toolbar-spacer" />
              <button
                className="ghost-button"
                type="button"
                onClick={saveDraft}
              >
                <Save size={13} /> <span>Kaydet</span>
              </button>
              <button
                className="soft-button"
                type="button"
                onClick={() => void resetTask()}
              >
                <RotateCcw size={13} /> <span>Sıfırla</span>
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={isRunning || engineState !== "ready" || !query.trim()}
                onClick={() => void runQuery()}
                aria-label={isRunning ? "Sorgu çalışıyor" : "Çalıştır"}
                title={!query.trim() ? "Önce sorgunu yaz." : undefined}
              >
                {isRunning ? (
                  <LoaderCircle size={13} className="spin" />
                ) : (
                  <Play size={13} fill="currentColor" />
                )}
                <span className="button-label">
                  {isRunning ? "Çalışıyor" : "Çalıştır"}
                </span>
                <span className="keycap">⌘/Ctrl ↵</span>
              </button>
            </div>
            <div className="editor-schema-rail">
              <span className="editor-schema-rail-label">
                <Table2 size={11} aria-hidden="true" /> Kullanabileceğin
                kolonlar
              </span>
              <div className="editor-schema-rail-tables">
                {task.schema.tables.map((table) => (
                  <span className="editor-schema-table" key={table.name}>
                    <span className="editor-schema-table-name">
                      {table.name}
                    </span>
                    {table.columns.map((column) => (
                      <button
                        className="editor-schema-column"
                        type="button"
                        key={column.name}
                        onClick={() => insertColumnAtCursor(column.name)}
                        title={`${column.dataType}${
                          column.primaryKey ? " · birincil anahtar" : ""
                        } — editöre yazmak için tıkla`}
                      >
                        {column.name}
                      </button>
                    ))}
                  </span>
                ))}
              </div>
            </div>
            <div className="editor-frame">
              <Suspense
                fallback={
                  <div className="editor-loading">
                    <LoaderCircle size={15} /> Editör yükleniyor…
                  </div>
                }
              >
                <MonacoEditor
                  height="100%"
                  language="sql"
                  value={query}
                  onChange={(value) => updateQuery(value ?? "")}
                  theme={
                    settings.theme === "dark"
                      ? "queryvale-dark"
                      : "queryvale-light"
                  }
                  options={editorOptions}
                  onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    editorShortcutActionsRef.current.forEach((action) =>
                      action.dispose(),
                    );
                    editorShortcutActionsRef.current = [
                      editor.addAction({
                        id: "queryvale.run-query",
                        label: "Sorguyu çalıştır",
                        keybindings: [
                          monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                        ],
                        run: () => runQueryShortcutRef.current(),
                      }),
                      editor.addAction({
                        id: "queryvale.save-query",
                        label: "Sorguyu kaydet",
                        keybindings: [
                          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                        ],
                        run: () => saveDraftShortcutRef.current(),
                      }),
                      editor.addAction({
                        id: "queryvale.open-route",
                        label: "SQL rotasını aç",
                        keybindings: [
                          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
                        ],
                        run: () => openRouteShortcutRef.current(),
                      }),
                      editor.addAction({
                        id: "queryvale.previous-case",
                        label: "Önceki çalışmaya geç",
                        keybindings: [
                          monaco.KeyMod.CtrlCmd |
                            monaco.KeyMod.Shift |
                            monaco.KeyCode.LeftArrow,
                        ],
                        run: () => navigatePreviousShortcutRef.current(),
                      }),
                      editor.addAction({
                        id: "queryvale.next-case",
                        label: "Sonraki çalışmaya geç",
                        keybindings: [
                          monaco.KeyMod.CtrlCmd |
                            monaco.KeyMod.Shift |
                            monaco.KeyCode.RightArrow,
                        ],
                        run: () => navigateNextShortcutRef.current(),
                      }),
                    ];
                    if (pendingEditorFocusRef.current) {
                      pendingEditorFocusRef.current = false;
                      editor.focus();
                    }
                  }}
                  beforeMount={(monaco) => {
                    // Editor teması global yüzey diliyle aynı grafit paletini
                    // kullanır: anahtar kelime metin rengiyle taşınır, renk
                    // yalnız string/sayı ayrımı ve imleç için harcanır.
                    monaco.editor.defineTheme("queryvale-dark", {
                      base: "vs-dark",
                      inherit: true,
                      rules: [
                        { token: "keyword.sql", foreground: "F0F1F5" },
                        { token: "string.sql", foreground: "4FB98A" },
                        { token: "number.sql", foreground: "C9A961" },
                        { token: "comment.sql", foreground: "6B7080" },
                      ],
                      colors: {
                        "editor.background": "#0D1018",
                        "editor.foreground": "#F0F1F5",
                        "editor.lineHighlightBackground": "#12151F",
                        "editorGutter.background": "#0D1018",
                        "editorLineNumber.foreground": "#3D4354",
                        "editorLineNumber.activeForeground": "#9BA0AE",
                        "editorCursor.foreground": "#8CA6E8",
                        "editor.selectionBackground": "#232B44",
                        "editor.inactiveSelectionBackground": "#1A1F2E",
                        "editor.placeholder.foreground": "#6B7080",
                        "editorIndentGuide.background1": "#232734",
                        "editorIndentGuide.activeBackground1": "#343A4A",
                        "scrollbar.shadow": "#00000000",
                        "scrollbarSlider.background": "#6B708040",
                        "scrollbarSlider.hoverBackground": "#6B708066",
                        "scrollbarSlider.activeBackground": "#6B708088",
                      },
                    });
                    monaco.editor.defineTheme("queryvale-light", {
                      base: "vs",
                      inherit: true,
                      rules: [
                        { token: "keyword.sql", foreground: "14161F" },
                        { token: "string.sql", foreground: "16643F" },
                        { token: "number.sql", foreground: "9A7B3F" },
                        { token: "comment.sql", foreground: "9B9DA6" },
                      ],
                      colors: {
                        "editor.background": "#FBFAF7",
                        "editor.foreground": "#14161F",
                        "editor.lineHighlightBackground": "#F1F0EB",
                        "editorGutter.background": "#FBFAF7",
                        "editorLineNumber.foreground": "#B9BAC2",
                        "editorLineNumber.activeForeground": "#575A66",
                        "editorCursor.foreground": "#1C2E63",
                        "editor.selectionBackground": "#D8DEEE",
                        "editor.inactiveSelectionBackground": "#F1F0EB",
                        "editor.placeholder.foreground": "#8A8C96",
                        "editorIndentGuide.background1": "#E4E2DA",
                        "editorIndentGuide.activeBackground1": "#CBC8BC",
                        "scrollbar.shadow": "#00000000",
                        "scrollbarSlider.background": "#8A8C9633",
                        "scrollbarSlider.hoverBackground": "#8A8C9655",
                        "scrollbarSlider.activeBackground": "#8A8C9677",
                      },
                    });
                  }}
                  aria-label="SQL sorgu editörü"
                />
              </Suspense>
            </div>
          </section>

          <div
            className="split-rail"
            role="separator"
            tabIndex={0}
            aria-label="Editör ve sonuçları yeniden boyutlandır"
            aria-orientation="horizontal"
            aria-valuemin={34}
            aria-valuemax={72}
            aria-valuenow={editorHeight}
            onPointerDown={beginVerticalResize}
            onKeyDown={resizeEditorWithKeyboard}
          />

          <section
            id="workspace-results-panel"
            className="results-section"
            role={isCompactWorkspace ? "tabpanel" : undefined}
            aria-labelledby={
              isCompactWorkspace ? `mobile-${task.id}-results-tab` : undefined
            }
          >
            <div className="results-toolbar">
              <span className="toolbar-title">
                <Database size={13} /> Sonuç
              </span>
              <span className="result-count">
                {result
                  ? `${result.rowCount} satır · ${Math.round(result.durationMs)} ms${
                      result.truncated ? " · sınırlandı" : ""
                    }`
                  : "Henüz çalıştırılmadı"}
              </span>
              <span className="toolbar-spacer" />
            </div>
            {engineSetupError && (
              <div className="feedback-banner error" role="alert">
                <CircleAlert size={14} />
                <span>{engineSetupError}</span>
              </div>
            )}
            {evaluation ? (
              <StudioResultStrip
                status={evaluation.correct ? "correct" : "wrong"}
                summary={
                  evaluation.correct
                    ? isDrill
                      ? `${result?.rowCount ?? evaluation.actualRowCount ?? 0} satır · beklenen çıktıyla eşleşti · ${activeDrillPresentation?.completionLabel.toLocaleLowerCase("tr-TR")}`
                      : `${result?.rowCount ?? evaluation.actualRowCount ?? 0} satır · beklenen çıktıyla eşleşti · ${awardedCaseScore}/10 puan`
                    : evaluation.actualRowCount !== undefined &&
                        evaluation.expectedRowCount !== undefined &&
                        evaluation.actualRowCount !==
                          evaluation.expectedRowCount
                      ? `${evaluation.title} · ${evaluation.actualRowCount} satır döndü, ${evaluation.expectedRowCount} bekleniyordu`
                      : evaluation.title
                }
              />
            ) : null}
            {activeCoaching && (
              <aside
                className={`coaching-card ${tone}`}
                aria-labelledby={`${task.id}-coaching-title`}
              >
                <div className="coaching-card-copy">
                  <strong id={`${task.id}-coaching-title`}>
                    {activeCoaching.title}
                  </strong>
                  <ul>
                    {activeCoaching.checks.map((check) => (
                      <li key={check}>{check}</li>
                    ))}
                  </ul>
                </div>
                {nextHintIndex >= 0 ? (
                  <button
                    className="coaching-hint-action"
                    type="button"
                    onClick={() => {
                      revealHint(nextHintIndex);
                      activatePanelTab("brief", true);
                    }}
                  >
                    <Lightbulb size={12} />{" "}
                    {isDrill
                      ? `${nextHintIndex + 1}. ücretsiz ipucunu aç`
                      : `${nextHintIndex + 1}. ipucunu aç`}
                  </button>
                ) : !solutionVisible ? (
                  <button
                    className="coaching-hint-action"
                    type="button"
                    onClick={() => {
                      toggleSolution(true);
                      activatePanelTab("brief", true);
                    }}
                    aria-controls={`${task.id}-solution`}
                  >
                    <TerminalSquare size={12} /> Bir doğru sorguyu göster
                  </button>
                ) : null}
              </aside>
            )}
            <div
              className="results-content"
              ref={resultsContentRef}
              role="region"
              aria-label={`${task.title} sorgu sonuçları`}
              tabIndex={0}
            >
              {result && resultColumns.length ? (
                <table className="data-table" aria-label="Sorgu sonucu">
                  <thead>
                    <tr>
                      {resultColumns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {resultColumns.map((column) => {
                          const value = row[column];
                          return (
                            <td
                              key={column}
                              className={value === null ? "null-value" : ""}
                            >
                              {formatCell(value)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-result">
                  <div>
                    <Columns3 size={24} />
                    <strong>Karar seti burada oluşacak</strong>
                    <p>
                      Sorgunu çalıştırdığında gerçek satırlar ve doğrulama bu
                      panelde görünür.
                    </p>
                  </div>
                </div>
              )}
              {evaluation?.correct &&
                result &&
                (isDrill ? (
                  <div
                    className="drill-completion"
                    data-drill-type={task.type}
                    role="status"
                  >
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <div>
                      <strong>
                        {activeDrillPresentation?.completionLabel}
                      </strong>
                      <span>
                        Bir sonraki adıma hazır olduğunda ilerleyebilirsin.
                      </span>
                    </div>
                  </div>
                ) : (
                  <ResultCompletion
                    task={task}
                    attempts={Math.max(1, taskAttempts)}
                    rowCount={result.rowCount}
                    scoreAwarded={awardedCaseScore}
                    evidence={progress.evidenceByTaskId[task.id]}
                    onSaveNote={(note) => {
                      onProgressChange((current) =>
                        saveDecisionNote(current, task.id, note),
                      );
                      setToast("Karar notu Kanıt Defteri’ne kaydedildi.");
                    }}
                  />
                ))}
            </div>
          </section>
        </div>
      </div>

      <StudioActionRail
        variant="sql"
        activeTaskId={task.id}
        activeIndex={taskIndex}
        totalCount={tasks.length}
        modules={routeModules}
        previousTaskId={previousTask?.id}
        nextTaskId={nextTask?.id}
        currentTaskCorrect={evaluation ? evaluation.correct : taskCompleted}
        activeTaskType={task.type}
        routeMenuOpen={routeMenuOpen}
        onRouteMenuOpenChange={setRouteMenuOpen}
        onSelectTask={navigateToTask}
        onCompleteRoute={() => onNavigate("progress")}
      />

      {showCommands && (
        <CommandDialog
          onClose={() => setShowCommands(false)}
          onRun={() => void runQuery()}
          onSave={saveDraft}
          onReset={() => void resetTask()}
          onSchema={() => activatePanelTab("schema", true)}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={14} /> {toast}
        </div>
      )}
    </main>
  );
}
