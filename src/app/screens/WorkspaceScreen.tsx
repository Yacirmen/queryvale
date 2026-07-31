"use client";

import {
  ArrowLeft,
  ArrowRight,
  Braces,
  CheckCircle2,
  ChevronsUpDown,
  CircleAlert,
  Clock3,
  Columns3,
  Database,
  KeyRound,
  Lightbulb,
  LoaderCircle,
  Play,
  RotateCcw,
  Save,
  Table2,
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
import type { LessonTask, SqlScalar } from "../../types/lesson";
import {
  createTaskDatabaseForLesson,
  type QueryExecutionResult,
  type TaskDatabase,
} from "../../features/sql-engine";
import {
  evaluateLessonQuery,
  type QueryEvaluation,
} from "../../features/validation";
import {
  recordAttempt,
  recordHint,
  type EditorSettings,
  type ProgressState,
  type TaskProgress,
} from "../../features/progress/progressStore";
import type { Navigate } from "../appTypes";
import {
  CommandDialog,
  CompletionDialog,
} from "../components/Dialogs";

const MonacoEditor = lazy(() => import("../components/LocalMonacoEditor"));

interface WorkspaceScreenProps {
  task: LessonTask;
  tasks: LessonTask[];
  progress: ProgressState;
  settings: EditorSettings;
  onProgressChange: (progress: ProgressState) => void;
  onNavigate: Navigate;
}

function createDraftProgress(taskId: string, query: string): TaskProgress {
  return {
    taskId,
    attempts: 0,
    completed: false,
    lastQuery: query,
    hintsUsed: [],
    solveTimeSeconds: 0,
    firstTry: false,
  };
}

function createStarterQuery(task: LessonTask): string {
  const table = task.schema.tables[0]?.name ?? "table_name";
  return `-- İş sorusunu ve şemayı inceleyerek sorgunu düzenle\nSELECT\n  *\nFROM ${table}\nLIMIT 10;`;
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

export function WorkspaceScreen({
  task,
  tasks,
  progress,
  settings,
  onProgressChange,
  onNavigate,
}: WorkspaceScreenProps) {
  const [panelTab, setPanelTab] = useState<"brief" | "schema">("brief");
  const [query, setQuery] = useState(
    () => progress.tasks[task.id]?.lastQuery || createStarterQuery(task),
  );
  const [engineState, setEngineState] = useState<
    "loading" | "ready" | "failed"
  >("loading");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<QueryExecutionResult>();
  const [evaluation, setEvaluation] = useState<QueryEvaluation>();
  const [visibleHints, setVisibleHints] = useState<number[]>(
    () => progress.tasks[task.id]?.hintsUsed ?? [],
  );
  const [briefWidth, setBriefWidth] = useState(370);
  const [editorHeight, setEditorHeight] = useState(56);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [toast, setToast] = useState<string>();
  const databaseRef = useRef<TaskDatabase | undefined>(undefined);
  const runGenerationRef = useRef(0);
  const openedAtRef = useRef(0);
  const workbenchRef = useRef<HTMLDivElement>(null);

  const taskIndex = tasks.findIndex((candidate) => candidate.id === task.id);
  const previousTask = taskIndex > 0 ? tasks[taskIndex - 1] : undefined;
  const nextTask =
    task.nextTaskId !== null
      ? tasks.find((candidate) => candidate.id === task.nextTaskId)
      : tasks[taskIndex + 1];
  const nextTaskLocked = Boolean(
    nextTask?.prerequisites.some(
      (prerequisite) => !progress.tasks[prerequisite]?.completed,
    ),
  );

  useEffect(() => {
    let current = true;
    runGenerationRef.current += 1;
    const database = createTaskDatabaseForLesson(task);
    databaseRef.current = database;
    openedAtRef.current = Date.now();

    void database
      .initialize()
      .then(() => {
        if (current) setEngineState("ready");
      })
      .catch((error: unknown) => {
        if (!current) return;
        setEngineState("failed");
        setEvaluation(
          evaluateLessonQuery(task, query, undefined, error),
        );
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

  const saveDraft = useCallback(() => {
    const previous =
      progress.tasks[task.id] ?? createDraftProgress(task.id, query);
    onProgressChange({
      ...progress,
      lastOpenedTaskId: task.id,
      tasks: {
        ...progress.tasks,
        [task.id]: { ...previous, lastQuery: query },
      },
    });
    setToast("Sorgu ve ilerleme bu cihaza kaydedildi.");
  }, [onProgressChange, progress, query, task.id]);

  const runQuery = useCallback(async () => {
    if (!query.trim() || isRunning) return;
    const database = databaseRef.current;
    if (!database) {
      setToast("SQL motoru henüz hazırlanıyor.");
      return;
    }

    setIsRunning(true);
    setEvaluation(undefined);
    const runGeneration = runGenerationRef.current + 1;
    runGenerationRef.current = runGeneration;
    const isCurrentRun = () =>
      runGenerationRef.current === runGeneration &&
      databaseRef.current === database;
    try {
      const execution = await database.run(query);
      if (!isCurrentRun()) return;
      const nextEvaluation = evaluateLessonQuery(task, query, execution);
      const elapsed = Math.max(
        1,
        Math.round((Date.now() - openedAtRef.current) / 1000),
      );
      const nextProgress = recordAttempt(
        progress,
        task.id,
        query,
        nextEvaluation.correct,
        elapsed,
      );
      setResult(execution);
      setEvaluation(nextEvaluation);
      onProgressChange({ ...nextProgress, lastOpenedTaskId: task.id });
      if (nextEvaluation.correct) {
        window.setTimeout(() => {
          if (isCurrentRun()) setShowCompletion(true);
        }, 260);
      }
    } catch (error: unknown) {
      if (!isCurrentRun()) return;
      const nextEvaluation = evaluateLessonQuery(
        task,
        query,
        undefined,
        error,
      );
      const nextProgress = recordAttempt(
        progress,
        task.id,
        query,
        false,
        0,
      );
      setResult(undefined);
      setEvaluation(nextEvaluation);
      onProgressChange({ ...nextProgress, lastOpenedTaskId: task.id });
    } finally {
      if (isCurrentRun()) {
        setIsRunning(false);
        setEngineState(database.state === "ready" ? "ready" : "failed");
      }
    }
  }, [isRunning, onProgressChange, progress, query, task]);

  const resetTask = useCallback(async () => {
    const database = databaseRef.current;
    if (!database) return;
    runGenerationRef.current += 1;
    setEngineState("loading");
    setResult(undefined);
    setEvaluation(undefined);
    try {
      await database.reset();
      setQuery(createStarterQuery(task));
      setEngineState("ready");
      setToast("Görev verisi başlangıç durumuna döndü.");
    } catch (error: unknown) {
      setEngineState("failed");
      setEvaluation(evaluateLessonQuery(task, query, undefined, error));
    }
  }, [query, task]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) {
        if (event.key === "Escape") setShowCommands(false);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        void runQuery();
      }
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveDraft();
      }
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowCommands(true);
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [runQuery, saveDraft]);

  const revealHint = (index: number) => {
    if (visibleHints.includes(index)) return;
    const nextProgress = recordHint(progress, task.id, index);
    setVisibleHints((current) => [...current, index].sort());
    onProgressChange(nextProgress);
  };

  const beginHorizontalResize = (event: React.PointerEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = briefWidth;
    const move = (pointerEvent: PointerEvent) => {
      setBriefWidth(
        Math.max(300, Math.min(540, startWidth + pointerEvent.clientX - startX)),
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
      const percentage = ((pointerEvent.clientY - bounds.top) / bounds.height) * 100;
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

  const editorOptions = useMemo(
    () => ({
      fontSize: settings.fontSize,
      lineHeight: Math.round(settings.fontSize * settings.lineHeight),
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: "on" as const,
      padding: { top: 18, bottom: 18 },
      renderLineHighlight: "line" as const,
      cursorBlinking: settings.reducedMotion ? ("solid" as const) : ("smooth" as const),
      quickSuggestions: settings.autocomplete,
      suggestOnTriggerCharacters: settings.autocomplete,
      tabSize: 2,
      insertSpaces: true,
      roundedSelection: true,
      fixedOverflowWidgets: true,
    }),
    [settings],
  );

  return (
    <main className="workspace-page">
      <div className="workspace-topbar">
        <div className="workspace-breadcrumb">
          <span>{task.moduleId.replace("module-", "Modül ")}</span>
          <ArrowRight size={11} />
          <strong>{task.title}</strong>
        </div>
        <div className="workspace-topbar-actions">
          <span className="mission-counter">
            Görev {String(taskIndex + 1).padStart(2, "0")} / {tasks.length}
          </span>
          <button
            className="icon-button"
            type="button"
            disabled={!previousTask}
            onClick={() =>
              previousTask &&
              onNavigate("workspace", { taskId: previousTask.id })
            }
            aria-label="Önceki görev"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            className="icon-button"
            type="button"
            disabled={!nextTask || nextTaskLocked}
            onClick={() =>
              nextTask && onNavigate("workspace", { taskId: nextTask.id })
            }
            aria-label="Sonraki görev"
          >
            <ArrowRight size={14} />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => setShowCommands(true)}
            aria-label="Komut panelini aç"
          >
            <ChevronsUpDown size={14} />
          </button>
        </div>
      </div>

      <div
        className="workspace-body"
        style={{ "--brief-width": `${briefWidth}px` } as React.CSSProperties}
      >
        <aside className="brief-panel">
          <div className="panel-tabs" role="tablist" aria-label="Görev bilgileri">
            <button
              className={`panel-tab ${panelTab === "brief" ? "active" : ""}`}
              type="button"
              role="tab"
              aria-selected={panelTab === "brief"}
              onClick={() => setPanelTab("brief")}
            >
              Görev notu
            </button>
            <button
              className={`panel-tab ${panelTab === "schema" ? "active" : ""}`}
              type="button"
              role="tab"
              aria-selected={panelTab === "schema"}
              onClick={() => setPanelTab("schema")}
            >
              Şema &amp; veri
            </button>
          </div>

          {panelTab === "brief" ? (
            <div className="brief-scroll" role="tabpanel">
              <div className="brief-kicker">
                <span>{difficultyLabel(task)} vaka</span>
                <span>
                  <Clock3 size={10} /> {task.estimatedMinutes} dk
                </span>
              </div>
              <h1>{task.title}</h1>
              <p className="brief-subtitle">{task.subtitle}</p>

              <section className="brief-section">
                <h2>
                  <TerminalSquare size={12} /> İş senaryosu
                </h2>
                <p>{task.scenario}</p>
              </section>

              <section className="brief-section">
                <h2>
                  <CheckCircle2 size={12} /> Beklenen karar
                </h2>
                <div className="objective-box">{task.objective}</div>
              </section>

              <section className="brief-section">
                <h2>
                  <Columns3 size={12} /> Beklenen kolonlar
                </h2>
                <div className="expected-columns">
                  {task.expectedColumns.map((column) => (
                    <code className="expected-column" key={column}>
                      {column}
                    </code>
                  ))}
                </div>
              </section>

              <section className="brief-section">
                <h2>
                  <Lightbulb size={12} /> Kademeli ipuçları
                </h2>
                <div className="hint-stack">
                  {task.hints.map((hint, index) =>
                    visibleHints.includes(index) ? (
                      <div className="revealed-hint" key={hint}>
                        <Lightbulb size={13} />
                        <span>
                          <strong>İpucu {index + 1}</strong>
                          <br />
                          {hint}
                        </span>
                      </div>
                    ) : (
                      <button
                        className="hint-button"
                        type="button"
                        key={hint}
                        disabled={
                          index > 0 && !visibleHints.includes(index - 1)
                        }
                        onClick={() => revealHint(index)}
                      >
                        <Lightbulb size={13} />
                        İpucu {index + 1}’i aç
                      </button>
                    ),
                  )}
                </div>
              </section>
            </div>
          ) : (
            <div className="brief-scroll" role="tabpanel">
              <div className="brief-kicker">
                <span>{task.schema.tables.length} tablo</span>
                <span>İzole görev verisi</span>
              </div>
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
                                    {Object.keys(samples.rows[0]).map((column) => (
                                      <td key={column}>
                                        {formatCell(row[column] as SqlScalar)}
                                      </td>
                                    ))}
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
          )}
        </aside>

        <div
          className="resize-rail"
          role="separator"
          aria-label="Görev panelini yeniden boyutlandır"
          aria-orientation="vertical"
          onPointerDown={beginHorizontalResize}
        />

        <div
          className="workbench"
          ref={workbenchRef}
          style={
            { "--editor-height": `${editorHeight}%` } as React.CSSProperties
          }
        >
          <section className="editor-section">
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
                disabled={isRunning || engineState === "loading"}
                onClick={() => void runQuery()}
                aria-label={isRunning ? "Sorgu çalışıyor" : "Çalıştır"}
              >
                {isRunning ? (
                  <LoaderCircle size={13} className="spin" />
                ) : (
                  <Play size={13} fill="currentColor" />
                )}
                <span className="button-label">
                  {isRunning ? "Çalışıyor" : "Çalıştır"}
                </span>
                <span className="keycap">⌘ ↵</span>
              </button>
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
                  onChange={(value) => setQuery(value ?? "")}
                  theme={
                    settings.theme === "dark"
                      ? "queryvale-dark"
                      : "queryvale-light"
                  }
                  options={editorOptions}
                  beforeMount={(monaco) => {
                    monaco.editor.defineTheme("queryvale-dark", {
                      base: "vs-dark",
                      inherit: true,
                      rules: [
                        { token: "keyword.sql", foreground: "C7F36B" },
                        { token: "string.sql", foreground: "F0AA73" },
                        { token: "number.sql", foreground: "69D4C7" },
                        { token: "comment.sql", foreground: "66736D" },
                      ],
                      colors: {
                        "editor.background": "#0A0F0D",
                        "editor.foreground": "#DBE5E0",
                        "editor.lineHighlightBackground": "#111815",
                        "editorLineNumber.foreground": "#46514C",
                        "editorLineNumber.activeForeground": "#95A19B",
                        "editorCursor.foreground": "#C7F36B",
                        "editor.selectionBackground": "#315044",
                      },
                    });
                    monaco.editor.defineTheme("queryvale-light", {
                      base: "vs",
                      inherit: true,
                      rules: [
                        { token: "keyword.sql", foreground: "315E47" },
                        { token: "string.sql", foreground: "A35B30" },
                        { token: "number.sql", foreground: "14756C" },
                        { token: "comment.sql", foreground: "7C8781" },
                      ],
                      colors: {
                        "editor.background": "#FFFDF8",
                        "editor.foreground": "#17201D",
                        "editor.lineHighlightBackground": "#F1EEE6",
                        "editorLineNumber.foreground": "#A2AAA5",
                        "editorCursor.foreground": "#315E47",
                        "editor.selectionBackground": "#DCEBD9",
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
            aria-label="Editör ve sonuçları yeniden boyutlandır"
            aria-orientation="horizontal"
            onPointerDown={beginVerticalResize}
          />

          <section className="results-section" aria-live="polite">
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
              {evaluation && (
                <span className={`evaluation-pill ${tone}`}>
                  {evaluation.correct ? (
                    <CheckCircle2 size={10} />
                  ) : (
                    <CircleAlert size={10} />
                  )}
                  {evaluation.title}
                </span>
              )}
            </div>
            {evaluation && (
              <div className={`feedback-banner ${tone}`} role="status">
                {evaluation.correct ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <CircleAlert size={14} />
                )}
                <span>{evaluation.message}</span>
              </div>
            )}
            <div className="results-content">
              {result && resultColumns.length ? (
                <table className="data-table">
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
                      Sorgunu çalıştırdığında gerçek satırlar, değerlendirme ve
                      bir sonraki öğrenme adımı bu panelde görünür.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {showCompletion && (
        <CompletionDialog
          task={task}
          attempts={taskAttempts}
          onClose={() => setShowCompletion(false)}
          onNext={() => {
            setShowCompletion(false);
            if (nextTask) {
              onNavigate("workspace", { taskId: nextTask.id });
            } else {
              onNavigate("progress");
            }
          }}
        />
      )}

      {showCommands && (
        <CommandDialog
          onClose={() => setShowCommands(false)}
          onRun={() => void runQuery()}
          onSave={saveDraft}
          onReset={() => void resetTask()}
          onSchema={() => setPanelTab("schema")}
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
