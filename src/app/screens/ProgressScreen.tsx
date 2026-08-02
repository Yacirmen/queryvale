"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Edit3,
  Flame,
  Lightbulb,
  Lock,
  Radar,
  Save,
  Sparkles,
  Target,
  TrendingUp,
  LogOut,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { CurriculumModule, LessonTask } from "../../types/lesson";
import type {
  PythonCurriculumModule,
  PythonLessonTask,
} from "../../types/pythonLesson";
import {
  calculateStreak,
  localDateKey,
  type PythonEvidenceCell,
  type ProgressState,
  validateProfileName,
} from "../../features/progress/progressStore";
import {
  getAwardedCaseScore,
  summarizeScores,
  type ScoreSummary,
} from "../../features/progress/scoring";
import {
  buildModuleAccessStates,
  findFirstAccessibleIncompleteTask,
} from "../../features/progress/moduleAccess";
import type { Navigate } from "../appTypes";
import { ConfirmationDialog } from "../components/Dialogs";

interface ProgressScreenProps {
  modules: CurriculumModule[];
  tasks: LessonTask[];
  pythonModules: PythonCurriculumModule[];
  pythonTasks: PythonLessonTask[];
  progress: ProgressState;
  profileName: string;
  onProfileNameChange: (name: string) => void;
  onSignOut: () => Promise<boolean>;
  canSignOut?: boolean;
  profileActionPending?: boolean;
  onNavigate: Navigate;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function formatConcept(concept: string): string {
  return concept.replaceAll("_", " ");
}

function formatPythonEvidenceCell(value: PythonEvidenceCell): string {
  if (value === null) return "NULL";
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
}

function combineScoreSummaries(
  sql: ScoreSummary,
  python: ScoreSummary,
): ScoreSummary {
  return {
    earned: sql.earned + python.earned,
    possible: sql.possible + python.possible,
    completedPossible: sql.completedPossible + python.completedPossible,
    completed: sql.completed + python.completed,
    independent: sql.independent + python.independent,
    hintAssisted: sql.hintAssisted + python.hintAssisted,
    solutionAssisted: sql.solutionAssisted + python.solutionAssisted,
  };
}

function profileInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase("tr-TR") ?? "")
    .join("");
  return initials || "Q";
}

function hasTaskActivity(taskId: string, progress: ProgressState): boolean {
  const taskState = progress.tasks[taskId];
  return Boolean(
    taskState &&
    (taskState.completed ||
      taskState.attempts > 0 ||
      taskState.hintsUsed.length > 0 ||
      taskState.lastQuery.trim().length > 0),
  );
}

function hasPythonTaskActivity(
  taskId: string,
  progress: ProgressState,
): boolean {
  const taskState = progress.pythonTasks[taskId];
  return Boolean(
    taskState &&
    (taskState.completed ||
      taskState.attempts > 0 ||
      taskState.hintsUsed.length > 0 ||
      taskState.lastCode.trim().length > 0),
  );
}

interface ConceptSignal {
  concept: string;
  verified: number;
  inProgress: number;
  attempts: number;
  hints: number;
}

export function buildProfileConceptSignals(
  tasks: LessonTask[],
  progress: ProgressState,
): { verified: ConceptSignal[]; inProgress: ConceptSignal[] } {
  const conceptMap = new Map<string, Omit<ConceptSignal, "concept">>();

  tasks.forEach((task) => {
    const taskState = progress.tasks[task.id];
    if (!hasTaskActivity(task.id, progress)) return;
    const concepts = taskState?.completed
      ? task.concepts
      : task.requiredConcepts;

    concepts.forEach((concept) => {
      const current = conceptMap.get(concept) ?? {
        verified: 0,
        inProgress: 0,
        attempts: 0,
        hints: 0,
      };
      conceptMap.set(concept, {
        verified: current.verified + (taskState?.completed ? 1 : 0),
        inProgress: current.inProgress + (taskState?.completed ? 0 : 1),
        attempts: current.attempts + (taskState?.attempts ?? 0),
        hints: current.hints + (taskState?.hintsUsed.length ?? 0),
      });
    });
  });

  const signals = Array.from(conceptMap.entries()).map(([concept, values]) => ({
    concept,
    ...values,
  }));

  return {
    verified: signals
      .filter((signal) => signal.verified > 0)
      .sort(
        (left, right) =>
          right.verified - left.verified ||
          right.inProgress - left.inProgress ||
          left.concept.localeCompare(right.concept),
      )
      .slice(0, 3),
    inProgress: signals
      .filter((signal) => signal.inProgress > 0)
      .sort(
        (left, right) =>
          right.attempts - left.attempts ||
          right.hints - left.hints ||
          right.inProgress - left.inProgress ||
          left.concept.localeCompare(right.concept),
      )
      .slice(0, 3),
  };
}

export function ProgressScreen({
  modules,
  tasks,
  pythonModules,
  pythonTasks,
  progress,
  profileName,
  onProfileNameChange,
  onSignOut,
  canSignOut = false,
  profileActionPending = false,
  onNavigate,
}: ProgressScreenProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(profileName);
  const [nameError, setNameError] = useState<string>();
  const [nameStatus, setNameStatus] = useState<string>();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const editNameButtonRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreNameFocusRef = useRef(false);
  const evidenceByTaskId = progress.evidenceByTaskId;
  const pythonEvidenceByTaskId = progress.pythonEvidenceByTaskId;

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus();
    else if (shouldRestoreNameFocusRef.current) {
      editNameButtonRef.current?.focus();
      shouldRestoreNameFocusRef.current = false;
    }
  }, [isEditingName]);

  const metrics = useMemo(() => {
    const sqlTaskProgress = tasks.flatMap((task) => {
      const taskState = progress.tasks[task.id];
      return taskState ? [taskState] : [];
    });
    const pythonTaskProgress = pythonTasks.flatMap((task) => {
      const taskState = progress.pythonTasks[task.id];
      return taskState ? [taskState] : [];
    });
    const sqlCompleted = sqlTaskProgress.filter((task) => task.completed);
    const pythonCompleted = pythonTaskProgress.filter((task) => task.completed);
    const attempts = [...sqlTaskProgress, ...pythonTaskProgress].reduce(
      (total, task) => total + task.attempts,
      0,
    );
    const sqlScore = summarizeScores(
      tasks.map((task) => task.id),
      progress.tasks,
    );
    const pythonScore = summarizeScores(
      pythonTasks.map((task) => task.id),
      progress.pythonTasks,
    );
    const sqlEvidence = Object.values(evidenceByTaskId);
    const pythonEvidence = Object.values(pythonEvidenceByTaskId);
    const decisionNotes = sqlEvidence.filter((evidence) =>
      Boolean(evidence.note),
    ).length;
    const totalTasks = tasks.length + pythonTasks.length;
    const completed = sqlCompleted.length + pythonCompleted.length;

    return {
      completed,
      sqlCompleted: sqlCompleted.length,
      pythonCompleted: pythonCompleted.length,
      totalTasks,
      attempts,
      score: combineScoreSummaries(sqlScore, pythonScore),
      verifiedEvidence: sqlEvidence.length + pythonEvidence.length,
      sqlEvidence: sqlEvidence.length,
      pythonEvidence: pythonEvidence.length,
      decisionNotes,
      streak: calculateStreak(progress.activityDates),
      completionRate: totalTasks
        ? Math.min(100, Math.round((completed / totalTasks) * 100))
        : 0,
    };
  }, [
    evidenceByTaskId,
    progress.activityDates,
    progress.pythonTasks,
    progress.tasks,
    pythonEvidenceByTaskId,
    pythonTasks,
    tasks,
  ]);

  const moduleAccess = useMemo(
    () => buildModuleAccessStates(modules, tasks, progress.tasks),
    [modules, progress.tasks, tasks],
  );

  const moduleAccessById = useMemo(
    () => new Map(moduleAccess.map((state) => [state.moduleId, state])),
    [moduleAccess],
  );

  const recommendedTask = useMemo(
    () => findFirstAccessibleIncompleteTask(modules, tasks, progress.tasks),
    [modules, progress.tasks, tasks],
  );

  const moduleProgress = useMemo(() => {
    const taskIndex = new Map(tasks.map((task, index) => [task.id, index]));
    const furthestActivityIndex = tasks.reduce(
      (furthest, task, index) =>
        hasTaskActivity(task.id, progress) ? index : furthest,
      -1,
    );

    return modules.map((module, index) => {
      const access = moduleAccessById.get(module.id);
      const isUnlocked = access?.isUnlocked ?? index === 0;
      const completed = module.tasks.filter(
        (task) => progress.tasks[task.id]?.completed,
      ).length;
      const active = module.tasks.find((task) => {
        const taskState = progress.tasks[task.id];
        return (
          !taskState?.completed &&
          Boolean(
            taskState?.attempts ||
            taskState?.lastQuery ||
            taskState?.hintsUsed.length,
          )
        );
      });
      const skipped = module.tasks.find(
        (task) =>
          !progress.tasks[task.id]?.completed &&
          (taskIndex.get(task.id) ?? Number.POSITIVE_INFINITY) <
            furthestActivityIndex,
      );
      const suggested =
        active ??
        skipped ??
        module.tasks.find((task) => task.id === recommendedTask?.id) ??
        module.tasks.find((task) => !progress.tasks[task.id]?.completed);
      const rate = module.tasks.length
        ? Math.round((completed / module.tasks.length) * 100)
        : 0;
      const score = summarizeScores(
        module.tasks.map((task) => task.id),
        progress.tasks,
      );
      const isComplete = rate === 100;
      const state = !isUnlocked
        ? "Kilitli"
        : isComplete
          ? "Tamamlandı"
          : active
            ? "Devam ediyor"
            : skipped
              ? "Eksik adım var"
              : module.tasks.some((task) => task.id === recommendedTask?.id)
                ? "Sıradaki"
                : "Başlamadı";

      return {
        id: module.id,
        index: index + 1,
        title: module.title,
        completed,
        total: module.tasks.length,
        contentLabel: module.contentKind === "projects" ? "proje" : "vaka",
        rate,
        score,
        next: isUnlocked
          ? isComplete
            ? module.tasks[0]
            : suggested
          : undefined,
        isUnlocked,
        blockingModuleTitle: access?.blockingModule?.title,
        state,
        action:
          state === "Tamamlandı"
            ? "Tekrar et"
            : state === "Devam ediyor"
              ? "Devam"
              : state === "Eksik adım var"
                ? "Eksiği aç"
                : state === "Sıradaki"
                  ? "Başla"
                  : "Göz at",
      };
    });
  }, [moduleAccessById, modules, progress, recommendedTask?.id, tasks]);

  const pythonModuleAccess = useMemo(
    () =>
      buildModuleAccessStates(pythonModules, pythonTasks, progress.pythonTasks),
    [progress.pythonTasks, pythonModules, pythonTasks],
  );

  const pythonModuleAccessById = useMemo(
    () => new Map(pythonModuleAccess.map((state) => [state.moduleId, state])),
    [pythonModuleAccess],
  );

  const recommendedPythonTask = useMemo(() => {
    if (
      !pythonTasks.some(
        (task) => progress.pythonTasks[task.id]?.completed !== true,
      )
    ) {
      return undefined;
    }

    return pythonTasks.find((task) => {
      const moduleState = pythonModuleAccessById.get(task.moduleId);
      return (
        moduleState?.isUnlocked &&
        progress.pythonTasks[task.id]?.completed !== true &&
        task.prerequisites.every(
          (prerequisiteId) =>
            progress.pythonTasks[prerequisiteId]?.completed === true,
        )
      );
    });
  }, [progress.pythonTasks, pythonModuleAccessById, pythonTasks]);

  const pythonModuleProgress = useMemo(
    () =>
      pythonModules.map((module, index) => {
        const access = pythonModuleAccessById.get(module.id);
        const isUnlocked = access?.isUnlocked ?? index === 0;
        const completed = module.tasks.filter(
          (task) => progress.pythonTasks[task.id]?.completed,
        ).length;
        const active = module.tasks.find(
          (task) =>
            progress.pythonTasks[task.id]?.completed !== true &&
            hasPythonTaskActivity(task.id, progress),
        );
        const suggested = module.tasks.find(
          (task) =>
            progress.pythonTasks[task.id]?.completed !== true &&
            task.prerequisites.every(
              (prerequisiteId) =>
                progress.pythonTasks[prerequisiteId]?.completed === true,
            ),
        );
        const rate = module.tasks.length
          ? Math.round((completed / module.tasks.length) * 100)
          : 0;
        const score = summarizeScores(
          module.tasks.map((task) => task.id),
          progress.pythonTasks,
        );
        const isComplete = rate === 100;
        const state = !isUnlocked
          ? "Kilitli"
          : isComplete
            ? "Tamamlandı"
            : active
              ? "Devam ediyor"
              : module.tasks.some(
                    (task) => task.id === recommendedPythonTask?.id,
                  )
                ? "Sıradaki"
                : "Başlamadı";

        return {
          id: module.id,
          index: index + 1,
          title: module.title,
          completed,
          total: module.tasks.length,
          rate,
          score,
          next: isUnlocked
            ? isComplete
              ? module.tasks[0]
              : suggested
            : undefined,
          isUnlocked,
          blockingModuleTitle: access?.blockingModule?.title,
          state,
          action:
            state === "Tamamlandı"
              ? "Tekrar et"
              : state === "Devam ediyor"
                ? "Devam"
                : state === "Sıradaki"
                  ? "Başla"
                  : "Göz at",
        };
      }),
    [
      progress,
      pythonModuleAccessById,
      pythonModules,
      recommendedPythonTask?.id,
    ],
  );

  const recentCompletions = useMemo(() => {
    const sqlCompletions = tasks.flatMap((task) => {
      const taskState = progress.tasks[task.id];
      if (!taskState?.completed || !taskState.lastCompletedAt) return [];
      const curriculumModule = modules.find((item) =>
        item.tasks.some((moduleTask) => moduleTask.id === task.id),
      );
      return [
        {
          task,
          trackLabel: "SQL",
          moduleTitle: curriculumModule?.title ?? "SQL rotası",
          completedAt: taskState.lastCompletedAt,
          attempts: taskState.attempts,
          score: getAwardedCaseScore(taskState),
          screen: "workspace" as const,
        },
      ];
    });
    const pythonCompletions = pythonTasks.flatMap((task) => {
      const taskState = progress.pythonTasks[task.id];
      if (!taskState?.completed || !taskState.lastCompletedAt) return [];
      const curriculumModule = pythonModules.find((item) =>
        item.tasks.some((moduleTask) => moduleTask.id === task.id),
      );
      return [
        {
          task,
          trackLabel: "Python",
          moduleTitle: curriculumModule?.title ?? "Python rotası",
          completedAt: taskState.lastCompletedAt,
          attempts: taskState.attempts,
          score: getAwardedCaseScore(taskState),
          screen: "python" as const,
        },
      ];
    });

    return [...sqlCompletions, ...pythonCompletions]
      .sort(
        (left, right) =>
          Date.parse(right.completedAt) - Date.parse(left.completedAt),
      )
      .slice(0, 4);
  }, [
    modules,
    progress.pythonTasks,
    progress.tasks,
    pythonModules,
    pythonTasks,
    tasks,
  ]);

  const evidenceRecords = useMemo(
    () =>
      Object.values(evidenceByTaskId)
        .flatMap((evidence) => {
          const task = tasks.find((item) => item.id === evidence.taskId);
          if (!task) return [];
          const curriculumModule = modules.find(
            (item) => item.id === task.moduleId,
          );
          return [
            {
              evidence,
              task,
              moduleTitle: curriculumModule?.title ?? "Rota",
            },
          ];
        })
        .sort((left, right) => {
          const noteDifference =
            Number(Boolean(right.evidence.note)) -
            Number(Boolean(left.evidence.note));
          if (noteDifference) return noteDifference;
          const rightDate =
            right.evidence.note?.updatedAt ??
            right.evidence.verifiedRun.verifiedAt;
          const leftDate =
            left.evidence.note?.updatedAt ??
            left.evidence.verifiedRun.verifiedAt;
          return Date.parse(rightDate) - Date.parse(leftDate);
        }),
    [evidenceByTaskId, modules, tasks],
  );

  const pythonEvidenceRecords = useMemo(
    () =>
      Object.values(pythonEvidenceByTaskId)
        .flatMap((evidence) => {
          const task = pythonTasks.find((item) => item.id === evidence.taskId);
          if (!task) return [];
          const curriculumModule = pythonModules.find(
            (item) => item.id === task.moduleId,
          );
          return [
            {
              evidence,
              task,
              moduleTitle: curriculumModule?.title ?? "Python rotası",
            },
          ];
        })
        .sort(
          (left, right) =>
            Date.parse(right.evidence.verifiedAt) -
            Date.parse(left.evidence.verifiedAt),
        ),
    [pythonEvidenceByTaskId, pythonModules, pythonTasks],
  );

  const conceptSignals = useMemo(
    () => buildProfileConceptSignals(tasks, progress),
    [progress, tasks],
  );

  const activityCells = useMemo(() => {
    const activityDates = new Set(progress.activityDates);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return Array.from({ length: 35 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (34 - index));
      const key = localDateKey(date);
      return {
        key,
        active: activityDates.has(key),
        dateLabel: new Intl.DateTimeFormat("tr-TR", {
          day: "numeric",
          month: "short",
        }).format(date),
        weekdayLabel: new Intl.DateTimeFormat("tr-TR", {
          weekday: "short",
        }).format(date),
      };
    });
  }, [progress.activityDates]);

  const handleNameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateProfileName(draftName);
    if (!validation.valid) {
      setNameError(validation.error ?? "Geçerli bir kullanıcı adı yaz.");
      setNameStatus(undefined);
      nameInputRef.current?.focus();
      return;
    }

    onProfileNameChange(validation.normalizedName);
    setDraftName(validation.normalizedName);
    setNameError(undefined);
    setNameStatus("Kullanıcı adı kaydedildi.");
    shouldRestoreNameFocusRef.current = true;
    setIsEditingName(false);
  };

  const cancelNameEdit = () => {
    setDraftName(profileName);
    setNameError(undefined);
    shouldRestoreNameFocusRef.current = true;
    setIsEditingName(false);
  };

  const activeDaysInWindow = activityCells.filter((cell) => cell.active).length;
  const hasConceptSignals = Boolean(
    conceptSignals.verified.length || conceptSignals.inProgress.length,
  );
  const hasSqlActivity = tasks.some((task) =>
    hasTaskActivity(task.id, progress),
  );
  const hasPythonActivity = pythonTasks.some((task) =>
    hasPythonTaskActivity(task.id, progress),
  );
  const nextMission =
    recommendedPythonTask && hasPythonActivity && !hasSqlActivity
      ? {
          task: recommendedPythonTask,
          screen: "python" as const,
          trackLabel: "Python",
        }
      : recommendedTask
        ? {
            task: recommendedTask,
            screen: "workspace" as const,
            trackLabel: "SQL",
          }
        : recommendedPythonTask
          ? {
              task: recommendedPythonTask,
              screen: "python" as const,
              trackLabel: "Python",
            }
          : undefined;
  const completedSqlModules = moduleProgress.filter(
    (module) => module.state === "Tamamlandı",
  ).length;
  const completedPythonModules = pythonModuleProgress.filter(
    (module) => module.state === "Tamamlandı",
  ).length;
  const activityRange = `${activityCells[0]?.dateLabel ?? ""} – ${
    activityCells.at(-1)?.dateLabel ?? ""
  }`;

  return (
    <main
      id="main-content"
      className="page progress-dashboard-page"
      tabIndex={-1}
    >
      <div className="page-container progress-dashboard-container">
        <section
          className="progress-dashboard-hero"
          aria-labelledby="panel-title"
        >
          <div className="profile-identity">
            <div className="profile-identity-avatar" aria-hidden="true">
              {profileInitials(profileName)}
            </div>
            <div className="profile-identity-copy">
              <span className="profile-kicker">Bu site adresindeki profil</span>
              {isEditingName ? (
                <>
                  <h1 id="panel-title" className="sr-only">
                    {profileName} kullanıcı paneli
                  </h1>
                  <form
                    className="profile-name-form"
                    onSubmit={handleNameSubmit}
                    onKeyDown={(event) => {
                      if (event.key !== "Escape") return;
                      event.preventDefault();
                      cancelNameEdit();
                    }}
                  >
                    <label htmlFor="profile-name">Kullanıcı adı</label>
                    <div className="profile-name-field">
                      <input
                        ref={nameInputRef}
                        id="profile-name"
                        type="text"
                        value={draftName}
                        autoComplete="nickname"
                        maxLength={32}
                        aria-describedby={
                          nameError
                            ? "profile-name-help profile-name-error"
                            : "profile-name-help"
                        }
                        aria-invalid={Boolean(nameError)}
                        onChange={(event) => {
                          setDraftName(event.target.value);
                          setNameError(undefined);
                        }}
                      />
                      <button className="profile-name-save" type="submit">
                        <Save size={15} /> Kaydet
                      </button>
                      <button
                        className="profile-name-cancel"
                        type="button"
                        onClick={cancelNameEdit}
                        aria-label="Kullanıcı adı düzenlemesini iptal et"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <small id="profile-name-help">
                      2–32 görünür karakter; baştaki, sondaki ve tekrarlanan
                      boşluklar düzenlenir.
                    </small>
                    {nameError && (
                      <span id="profile-name-error" role="alert">
                        {nameError}
                      </span>
                    )}
                  </form>
                </>
              ) : (
                <div className="profile-name-display">
                  <h1 id="panel-title">{profileName}</h1>
                  <button
                    ref={editNameButtonRef}
                    type="button"
                    onClick={() => {
                      setNameStatus(undefined);
                      setDraftName(profileName);
                      setIsEditingName(true);
                    }}
                    aria-label={`${profileName} kullanıcı adını düzenle`}
                  >
                    <Edit3 size={14} /> Adı düzenle
                  </button>
                </div>
              )}
              <p>
                İlerlemen bu tarayıcıda sana ait. Diğer cihazdaki profil ayrı
                çalışır; istersen Ayarlar’dan JSON ile taşıyabilirsin.
              </p>
              <span className="sr-only" role="status">
                {nameStatus}
              </span>
            </div>
          </div>

          <div className="progress-hero-actions">
            <div className="progress-overview" aria-label="Genel ilerleme">
              <div
                className="progress-ring"
                role="progressbar"
                aria-label="Tamamlanan çalışma oranı"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={metrics.completionRate}
                style={{
                  background: `conic-gradient(var(--signal) ${metrics.completionRate * 3.6}deg, var(--surface-muted) 0deg)`,
                }}
              >
                <div className="progress-ring-core">
                  <strong>%{metrics.completionRate}</strong>
                  <span>tamamlandı</span>
                </div>
              </div>
              <div className="progress-overview-copy">
                <span>Genel rota</span>
                <strong>
                  {metrics.completed} / {metrics.totalTasks} çalışma
                </strong>
                <p>
                  {metrics.completed
                    ? `${completedSqlModules} SQL · ${completedPythonModules} Python modülü tamamlandı.`
                    : "İlk doğru SQL veya Python çıktınla kişisel ilerleme haritan oluşacak."}
                </p>
              </div>
            </div>
            {canSignOut ? (
              <>
                <button
                  className="profile-sign-out-button"
                  type="button"
                  disabled={profileActionPending}
                  onClick={() => setShowSignOutDialog(true)}
                >
                  <LogOut size={15} aria-hidden="true" />
                  Profilden çık
                </button>
                <small>İlerlemen silinmez.</small>
              </>
            ) : null}
          </div>
        </section>

        <section
          className="progress-next-mission"
          aria-labelledby="next-mission-title"
        >
          <div className="next-mission-signal" aria-hidden="true">
            <Sparkles size={18} />
          </div>
          <div className="next-mission-copy">
            <span>Şimdi en anlamlı adım</span>
            <h2 id="next-mission-title">
              {nextMission?.task.title ?? "Rotayı tamamladın"}
            </h2>
            <p>
              {nextMission
                ? `${nextMission.trackLabel} · ${nextMission.task.subtitle}`
                : "Bütün SQL ve Python çalışmaları tamamlandı. İstersen zorlandığın konulara dönüp farklı çözümler deneyebilirsin."}
            </p>
          </div>
          {nextMission && (
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                onNavigate(nextMission.screen, {
                  taskId: nextMission.task.id,
                })
              }
            >
              Çalışmaya devam et <ArrowRight size={15} />
            </button>
          )}
        </section>

        <section className="progress-signal-strip" aria-label="Öğrenme özeti">
          <article>
            <CheckCircle2 size={16} />
            <span>Tamamlanan</span>
            <strong>{metrics.completed}</strong>
            <small>
              {metrics.totalTasks} çalışmadan · {metrics.sqlCompleted} SQL ·{" "}
              {metrics.pythonCompleted} Python
            </small>
          </article>
          <article>
            <Target size={16} />
            <span>Doğrulanmış kanıt</span>
            <strong>{metrics.verifiedEvidence}</strong>
            <small>
              {metrics.sqlEvidence} SQL · {metrics.pythonEvidence} Python ·{" "}
              {metrics.decisionNotes} karar notu
            </small>
          </article>
          <article>
            <Sparkles size={16} />
            <span>Analiz puanı</span>
            <strong>{metrics.score.earned}</strong>
            <small>
              {metrics.score.possible} mümkün · {metrics.score.independent}
              yardımsız · {metrics.score.hintAssisted} ipucuyla ·{" "}
              {metrics.score.solutionAssisted} çözümle
            </small>
          </article>
          <article>
            <Flame size={16} />
            <span>Çalışma serisi</span>
            <strong>{metrics.streak} gün</strong>
            <small>{metrics.attempts} toplam deneme</small>
          </article>
        </section>

        <div className="progress-dashboard-grid">
          <div className="progress-dashboard-main">
            <section
              className="progress-section evidence-notebook-section"
              aria-labelledby="evidence-notebook-title"
            >
              <div className="progress-section-heading">
                <div>
                  <span className="section-kicker">Doğrulanmış çalışmalar</span>
                  <h2 id="evidence-notebook-title">Kanıt Defteri</h2>
                  <p className="evidence-notebook-description">
                    Doğrulanmış SQL sorguların, Python DataFrame çıktıları ve
                    karar notların.
                  </p>
                </div>
                {metrics.verifiedEvidence > 0 && (
                  <span className="module-progress-state complete">
                    {metrics.decisionNotes} karar notu ·{" "}
                    {metrics.verifiedEvidence} kanıt
                  </span>
                )}
              </div>

              {evidenceRecords.length || pythonEvidenceRecords.length ? (
                <div className="evidence-notebook-list">
                  {evidenceRecords.map(({ evidence, moduleTitle, task }) => {
                    const note = evidence.note;
                    const run = evidence.verifiedRun;
                    const evidenceTitleId = `${task.id}-evidence-title`;
                    const previewColumns = run.columns.slice(0, 6);
                    const previewRows = run.previewRows.slice(0, 3);

                    return (
                      <article
                        className={`evidence-record ${note ? "has-note" : "needs-note"}`}
                        key={task.id}
                        aria-labelledby={evidenceTitleId}
                      >
                        <span
                          className="recent-progress-check"
                          aria-hidden="true"
                        >
                          <Check size={14} />
                        </span>

                        <div className="evidence-record-copy">
                          <div className="evidence-record-heading">
                            <div>
                              <small>{moduleTitle}</small>
                              <h3 id={evidenceTitleId}>{task.title}</h3>
                            </div>
                            <span
                              className={`module-progress-state ${note ? "complete" : "attention"}`}
                            >
                              {note ? "Karar notu hazır" : "Yorum bekliyor"}
                            </span>
                          </div>

                          {note ? (
                            <dl className="evidence-note">
                              <div>
                                <dt>Bulgu</dt>
                                <dd>{note.finding}</dd>
                              </div>
                              <div>
                                <dt>Öneri</dt>
                                <dd>{note.recommendation}</dd>
                              </div>
                              {note.caveat && (
                                <div>
                                  <dt>Çekince</dt>
                                  <dd>{note.caveat}</dd>
                                </div>
                              )}
                            </dl>
                          ) : (
                            <p className="evidence-note-pending">
                              Sorgun doğrulandı. Çıktıyı bir bulgu ve karar
                              önerisine dönüştürmek için çalışmaya dön.
                            </p>
                          )}

                          <p className="evidence-record-meta">
                            <CheckCircle2 size={13} aria-hidden="true" />
                            {run.rowCount} satır · {run.columns.length} kolon ·{" "}
                            {formatDate(run.verifiedAt)}
                            {run.truncated ? " · önizleme sınırlandı" : ""}
                          </p>

                          <details className="evidence-record-source">
                            <summary>SQL ve çıktı kanıtını incele</summary>
                            <div className="evidence-record-source-body">
                              <pre aria-label="Doğrulanmış SQL sorgusu">
                                <code>{run.query}</code>
                              </pre>
                              {previewColumns.length > 0 &&
                              previewRows.length > 0 ? (
                                <div className="evidence-preview-table-wrap">
                                  <table
                                    aria-label={`${task.title} çıktı önizlemesi`}
                                  >
                                    <thead>
                                      <tr>
                                        {previewColumns.map(
                                          (column, columnIndex) => (
                                            <th
                                              key={`${column}-${columnIndex}`}
                                            >
                                              {column}
                                            </th>
                                          ),
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {previewRows.map((row, rowIndex) => (
                                        <tr key={`${task.id}-${rowIndex}`}>
                                          {previewColumns.map(
                                            (column, columnIndex) => (
                                              <td
                                                key={`${column}-${columnIndex}`}
                                              >
                                                {row[columnIndex]}
                                              </td>
                                            ),
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p>Bu çalıştırma satır döndürmedi.</p>
                              )}
                              <small>
                                İlk {previewRows.length} satır
                                {run.columns.length > previewColumns.length
                                  ? ` · ${run.columns.length - previewColumns.length} kolon daha var`
                                  : ""}
                              </small>
                            </div>
                          </details>
                        </div>

                        <button
                          className="module-progress-action"
                          type="button"
                          onClick={() =>
                            onNavigate("workspace", { taskId: task.id })
                          }
                          aria-label={`Çalışmayı aç: ${task.title}`}
                        >
                          Çalışmayı aç <ArrowRight size={14} />
                        </button>
                      </article>
                    );
                  })}
                  {pythonEvidenceRecords.map(
                    ({ evidence, moduleTitle, task }) => {
                      const evidenceTitleId = `${task.id}-python-evidence-title`;
                      const previewColumns = evidence.columns.slice(0, 6);
                      const previewRows = evidence.previewRows.slice(0, 3);

                      return (
                        <article
                          className="evidence-record has-note"
                          key={task.id}
                          aria-labelledby={evidenceTitleId}
                        >
                          <span
                            className="recent-progress-check"
                            aria-hidden="true"
                          >
                            <Check size={14} />
                          </span>

                          <div className="evidence-record-copy">
                            <div className="evidence-record-heading">
                              <div>
                                <small>Python · {moduleTitle}</small>
                                <h3 id={evidenceTitleId}>{task.title}</h3>
                              </div>
                              <span className="module-progress-state complete">
                                DataFrame doğrulandı
                              </span>
                            </div>

                            <p className="evidence-note-pending">
                              result DataFrame’i vaka kontratıyla eşleşti ve bu
                              cihazdaki Python kanıtlarına kaydedildi.
                            </p>

                            <p className="evidence-record-meta">
                              <CheckCircle2 size={13} aria-hidden="true" />
                              {evidence.rowCount} satır ·{" "}
                              {evidence.columns.length} kolon ·{" "}
                              {formatDate(evidence.verifiedAt)} · Python{" "}
                              {evidence.runtimeVersion}
                            </p>

                            <details className="evidence-record-source">
                              <summary>DataFrame kanıtını incele</summary>
                              <div className="evidence-record-source-body">
                                {previewColumns.length > 0 &&
                                previewRows.length > 0 ? (
                                  <div className="evidence-preview-table-wrap">
                                    <table
                                      aria-label={`${task.title} Python çıktı önizlemesi`}
                                    >
                                      <thead>
                                        <tr>
                                          {previewColumns.map(
                                            (column, columnIndex) => (
                                              <th
                                                key={`${column}-${columnIndex}`}
                                              >
                                                {column}
                                              </th>
                                            ),
                                          )}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {previewRows.map((row, rowIndex) => (
                                          <tr
                                            key={`${task.id}-python-${rowIndex}`}
                                          >
                                            {previewColumns.map(
                                              (column, columnIndex) => (
                                                <td
                                                  key={`${column}-${columnIndex}`}
                                                >
                                                  {formatPythonEvidenceCell(
                                                    row[columnIndex] ?? null,
                                                  )}
                                                </td>
                                              ),
                                            )}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p>Bu çalışma satır döndürmedi.</p>
                                )}
                                <small>
                                  İlk {previewRows.length} satır · tipler:{" "}
                                  {evidence.dtypes.slice(0, 6).join(" · ")}
                                  {evidence.columns.length >
                                  previewColumns.length
                                    ? ` · ${evidence.columns.length - previewColumns.length} kolon daha var`
                                    : ""}
                                </small>
                                {evidence.stdout.trim() ? (
                                  <pre aria-label="Kaydedilmiş Python konsol çıktısı">
                                    <code>{evidence.stdout}</code>
                                  </pre>
                                ) : null}
                              </div>
                            </details>
                          </div>

                          <button
                            className="module-progress-action"
                            type="button"
                            onClick={() =>
                              onNavigate("python", { taskId: task.id })
                            }
                            aria-label={`Python çalışmasını aç: ${task.title}`}
                          >
                            Çalışmayı aç <ArrowRight size={14} />
                          </button>
                        </article>
                      );
                    },
                  )}
                </div>
              ) : (
                <div className="progress-empty-state">
                  <Target size={22} aria-hidden="true" />
                  <div>
                    <strong>İlk doğrulanmış kanıtın burada görünecek</strong>
                    <p>
                      Bir SQL sorgusunu veya Python DataFrame çıktısını doğru
                      tamamladığında özet burada saklanır. SQL bulgunu
                      yorumladığında karar notun da bu deftere eklenir.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section
              className="progress-section module-progress-section"
              aria-labelledby="module-progress-title"
            >
              <div className="progress-section-heading">
                <div>
                  <span className="section-kicker">Rota görünümü</span>
                  <h2 id="module-progress-title">SQL konularında neredesin?</h2>
                </div>
                <button
                  className="soft-button"
                  type="button"
                  onClick={() => onNavigate("learn")}
                >
                  Rotayı aç <ArrowRight size={14} />
                </button>
              </div>

              <div className="module-progress-list">
                {moduleProgress.map((module) => (
                  <article
                    className={`module-progress-row ${module.isUnlocked ? "" : "locked"}`}
                    key={module.id}
                  >
                    <span className="module-progress-index">
                      {String(module.index).padStart(2, "0")}
                    </span>
                    <div className="module-progress-copy">
                      <div>
                        <h3>{module.title}</h3>
                        <span
                          className={`module-progress-state ${module.state === "Tamamlandı" ? "complete" : ""} ${module.state === "Eksik adım var" ? "attention" : ""} ${module.state === "Sıradaki" ? "next" : ""} ${module.state === "Kilitli" ? "locked" : ""}`}
                        >
                          {module.state === "Tamamlandı" && <Check size={12} />}
                          {module.state === "Kilitli" && <Lock size={12} />}
                          {module.state}
                        </span>
                      </div>
                      <div className="module-progress-meter">
                        <div
                          className="progress-track"
                          role="progressbar"
                          aria-label={`${module.title} ilerlemesi`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={module.rate}
                        >
                          <span
                            className="progress-fill"
                            style={{ width: `${module.rate}%` }}
                          />
                        </div>
                        <span>
                          {module.completed}/{module.total}{" "}
                          {module.contentLabel} · {module.score.earned}/
                          {module.score.possible} puan
                        </span>
                      </div>
                    </div>
                    {module.next ? (
                      <button
                        className="module-progress-action"
                        type="button"
                        onClick={() =>
                          onNavigate("workspace", { taskId: module.next?.id })
                        }
                        aria-label={`${module.title}: ${module.action} — ${module.next.title}`}
                      >
                        {module.action}
                        <ArrowRight size={14} />
                      </button>
                    ) : module.isUnlocked ? (
                      <span
                        className="module-progress-done"
                        aria-label="Tamamlandı"
                      >
                        <CheckCircle2 size={18} />
                      </span>
                    ) : (
                      <span
                        className="module-progress-locked"
                        aria-label={`${module.title} kilitli. Önce ${module.blockingModuleTitle ?? "önceki SQL konusunu"} tamamla.`}
                      >
                        <Lock size={15} aria-hidden="true" />
                        Önce {module.blockingModuleTitle ?? "önceki konu"}
                      </span>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section
              className="progress-section module-progress-section"
              aria-labelledby="python-module-progress-title"
            >
              <div className="progress-section-heading">
                <div>
                  <span className="section-kicker">Python rota görünümü</span>
                  <h2 id="python-module-progress-title">
                    Python modüllerinde neredesin?
                  </h2>
                </div>
                <button
                  className="soft-button"
                  type="button"
                  onClick={() =>
                    onNavigate("python", {
                      taskId: recommendedPythonTask?.id ?? pythonTasks[0]?.id,
                    })
                  }
                >
                  Python Studio’yu aç <ArrowRight size={14} />
                </button>
              </div>

              <div className="module-progress-list">
                {pythonModuleProgress.map((module) => (
                  <article
                    className={`module-progress-row ${module.isUnlocked ? "" : "locked"}`}
                    key={module.id}
                  >
                    <span className="module-progress-index">
                      PY {String(module.index).padStart(2, "0")}
                    </span>
                    <div className="module-progress-copy">
                      <div>
                        <h3>{module.title}</h3>
                        <span
                          className={`module-progress-state ${module.state === "Tamamlandı" ? "complete" : ""} ${module.state === "Sıradaki" ? "next" : ""} ${module.state === "Kilitli" ? "locked" : ""}`}
                        >
                          {module.state === "Tamamlandı" && <Check size={12} />}
                          {module.state === "Kilitli" && <Lock size={12} />}
                          {module.state}
                        </span>
                      </div>
                      <div className="module-progress-meter">
                        <div
                          className="progress-track"
                          role="progressbar"
                          aria-label={`${module.title} Python ilerlemesi`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={module.rate}
                        >
                          <span
                            className="progress-fill"
                            style={{ width: `${module.rate}%` }}
                          />
                        </div>
                        <span>
                          {module.completed}/{module.total} vaka ·{" "}
                          {module.score.earned}/{module.score.possible} puan
                        </span>
                      </div>
                    </div>
                    {module.next ? (
                      <button
                        className="module-progress-action"
                        type="button"
                        onClick={() =>
                          onNavigate("python", { taskId: module.next?.id })
                        }
                        aria-label={`${module.title}: ${module.action} — ${module.next.title}`}
                      >
                        {module.action}
                        <ArrowRight size={14} />
                      </button>
                    ) : module.isUnlocked ? (
                      <span
                        className="module-progress-done"
                        aria-label="Tamamlandı"
                      >
                        <CheckCircle2 size={18} />
                      </span>
                    ) : (
                      <span
                        className="module-progress-locked"
                        aria-label={`${module.title} kilitli. Önce ${module.blockingModuleTitle ?? "önceki Python modülünü"} tamamla.`}
                      >
                        <Lock size={15} aria-hidden="true" />
                        Önce {module.blockingModuleTitle ?? "önceki modül"}
                      </span>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section
              className="progress-section recent-progress-section"
              aria-labelledby="recent-progress-title"
            >
              <div className="progress-section-heading">
                <div>
                  <span className="section-kicker">Son kazanımlar</span>
                  <h2 id="recent-progress-title">
                    Yakın zamanda tamamladıkların
                  </h2>
                </div>
              </div>

              {recentCompletions.length ? (
                <div className="recent-progress-list">
                  {recentCompletions.map((item) => (
                    <button
                      className="recent-progress-row"
                      type="button"
                      key={item.task.id}
                      onClick={() =>
                        onNavigate(item.screen, { taskId: item.task.id })
                      }
                    >
                      <span
                        className="recent-progress-check"
                        aria-hidden="true"
                      >
                        <Check size={14} />
                      </span>
                      <span>
                        <strong>{item.task.title}</strong>
                        <small>
                          {item.trackLabel} · {item.moduleTitle}
                        </small>
                      </span>
                      <span className="recent-progress-meta">
                        {formatDate(item.completedAt)} · {item.attempts} deneme
                        ·{" "}
                        {item.score > 0
                          ? "+" + item.score + " puan"
                          : "0 puan · tam çözümle"}
                      </span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="progress-empty-state">
                  <TrendingUp size={22} />
                  <div>
                    <strong>İlk kazanım burada görünecek</strong>
                    <p>
                      Bir çalışmayı doğru tamamladığında tarihini ve kaç
                      denemede çözdüğünü kaydedeceğiz.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside
            className="progress-dashboard-aside"
            aria-label="Öğrenme sinyalleri"
          >
            <section
              className="progress-side-section activity-section"
              aria-labelledby="activity-title"
            >
              <div className="side-section-heading">
                <CalendarDays size={16} />
                <div>
                  <span>Son 5 hafta</span>
                  <h2 id="activity-title">Çalışma ritmi</h2>
                </div>
              </div>
              <div className="activity-summary">
                <strong>
                  {activeDaysInWindow
                    ? `${activeDaysInWindow} aktif gün`
                    : "Henüz kayıt yok"}
                </strong>
                <span>{metrics.streak} günlük seri</span>
              </div>
              <div className="profile-activity-weekdays" aria-hidden="true">
                {activityCells.slice(0, 7).map((cell) => (
                  <span key={`weekday-${cell.key}`}>{cell.weekdayLabel}</span>
                ))}
              </div>
              <div
                className="profile-activity-grid"
                role="img"
                aria-label={`${activityRange} arasında ${activeDaysInWindow} gün çalışıldı.`}
              >
                {activityCells.map((cell) => (
                  <time
                    className={`profile-activity-cell ${cell.active ? "active" : ""}`}
                    key={cell.key}
                    dateTime={cell.key}
                    title={`${cell.dateLabel}: ${cell.active ? "çalışma kaydedildi" : "kayıt yok"}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <div className="profile-activity-range" aria-hidden="true">
                <span>{activityCells[0]?.dateLabel}</span>
                <span>{activityCells.at(-1)?.dateLabel}</span>
              </div>
              {!activeDaysInWindow && (
                <p className="profile-widget-note">
                  Bu web adresinde henüz çalışma kaydı yok. SQL veya Python
                  çalıştırdığında, ipucu açtığında ya da kanıt doğruladığında
                  bugün işaretlenir.
                </p>
              )}
            </section>

            <section
              className="progress-side-section concept-section"
              aria-labelledby="concept-title"
            >
              <div className="side-section-heading">
                <Radar size={16} />
                <div>
                  <span>SQL kavram pusulası</span>
                  <h2 id="concept-title">Hangi SQL konularını çalıştın?</h2>
                </div>
              </div>

              {conceptSignals.verified.length > 0 && (
                <div className="concept-signal-group">
                  <span className="concept-signal-label">
                    <CheckCircle2 size={13} /> Doğrulanan konular
                  </span>
                  <div className="concept-chip-list">
                    {conceptSignals.verified.map((signal) => (
                      <span
                        className="concept-chip strong"
                        key={signal.concept}
                      >
                        {formatConcept(signal.concept)}
                        <small>
                          {signal.verified} çalışmada doğrulandı
                          {signal.inProgress
                            ? ` · ${signal.inProgress} çalışma sürüyor`
                            : ""}
                        </small>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {conceptSignals.inProgress.length > 0 && (
                <div className="concept-signal-group">
                  <span className="concept-signal-label focus">
                    <Lightbulb size={13} /> Üzerinde çalışılıyor
                  </span>
                  <div className="concept-chip-list">
                    {conceptSignals.inProgress.map((signal) => (
                      <span className="concept-chip focus" key={signal.concept}>
                        {formatConcept(signal.concept)}
                        <small>
                          {signal.attempts
                            ? `${signal.attempts} deneme`
                            : signal.hints
                              ? `${signal.hints} ipucu açıldı`
                              : "Taslak kaydedildi"}
                        </small>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!hasConceptSignals && (
                <div className="profile-widget-empty">
                  <strong>Henüz kavram sinyali yok</strong>
                  <p>
                    Bir SQL taslağı yazınca konu “çalışılıyor”, doğru sonucu
                    alınca “doğrulandı” olarak burada görünür.
                  </p>
                  {recommendedTask && (
                    <button
                      className="profile-widget-action"
                      type="button"
                      onClick={() =>
                        onNavigate("workspace", { taskId: recommendedTask.id })
                      }
                    >
                      İlk vakayı aç <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
            </section>

            <section className="progress-side-section local-profile-note">
              <div className="side-section-heading">
                <Sparkles size={16} />
                <div>
                  <span>Profil verisi</span>
                  <h2>Taşınabilir, ama yerel</h2>
                </div>
              </div>
              <p>
                Adın, SQL sorguların, Python kodların ve ilerlemen bu tarayıcıda
                ve bu web adresinde tutulur. Localhost’taki kayıt GitHub
                adresine otomatik gelmez; taşımak için JSON yedeğini
                kullanabilirsin.
              </p>
              <button
                className="ghost-button"
                type="button"
                onClick={() => onNavigate("settings")}
              >
                Yedekleme ayarları <ArrowRight size={14} />
              </button>
              <small>
                Analiz puanı ilk doğru çalıştırmada kilitlenir; yardım düzeyini
                gösterir, çalışma tamamlanmasını veya rota erişimini engellemez.
              </small>
            </section>
          </aside>
        </div>
      </div>

      <ConfirmationDialog
        open={showSignOutDialog}
        title="Profilden çıkılsın mı?"
        description="Profilin ve tüm öğrenme ilerlemen bu cihazda korunacak. Bu bir güvenlik kilidi değildir; aynı tarayıcıyı kullanan biri profili yeniden açabilir."
        confirmLabel="Profilden çık"
        cancelLabel="Vazgeç"
        tone="neutral"
        busy={profileActionPending}
        onClose={() => setShowSignOutDialog(false)}
        onConfirm={async () => {
          const signedOut = await onSignOut();
          if (signedOut) setShowSignOutDialog(false);
        }}
      />
    </main>
  );
}
