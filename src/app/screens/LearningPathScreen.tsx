"use client";

import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Play,
  RotateCcw,
  Route,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  analystJourneyChapters,
  buildAnalystJourneyProgress,
} from "../../content";
import type { CurriculumModule, LessonTask } from "../../types/lesson";
import type { ProgressState } from "../../features/progress/progressStore";
import {
  getAwardedCaseScore,
  summarizeScores,
} from "../../features/progress/scoring";
import type { Navigate } from "../appTypes";

interface LearningPathScreenProps {
  modules: CurriculumModule[];
  tasks: LessonTask[];
  progress: ProgressState;
  onNavigate: Navigate;
}

export type LearningPathTaskStatus =
  "completed" | "in-progress" | "retry" | "skipped" | "next" | "upcoming";

export interface LearningPathTaskState {
  task: LessonTask;
  status: LearningPathTaskStatus;
  isCurrent: boolean;
}

const difficultyLabel = {
  beginner: "Başlangıç",
  intermediate: "Orta",
  advanced: "İleri",
} as const;

const taskStatusCopy: Record<
  LearningPathTaskStatus,
  { label: string; action: string }
> = {
  completed: { label: "Tamamlandı", action: "Tekrar çalış" },
  "in-progress": { label: "Devam ediyor", action: "Devam et" },
  retry: { label: "Tekrar bekliyor", action: "Yeniden dene" },
  skipped: { label: "Atlandı", action: "Eksik adımı aç" },
  next: { label: "Sıradaki", action: "Başla" },
  upcoming: { label: "Başlamadı", action: "Göz at" },
};

const chapterStatusCopy = {
  completed: "Bölüm tamamlandı",
  active: "İlerliyorsun",
  recommended: "Önerilen odak",
  open: "Serbest erişim",
} as const;

function hasMeaningfulActivity(
  taskId: string,
  progress: ProgressState,
): boolean {
  const taskProgress = progress.tasks[taskId];
  return Boolean(
    taskProgress &&
    (taskProgress.completed ||
      taskProgress.attempts > 0 ||
      taskProgress.hintsUsed.length > 0 ||
      taskProgress.lastQuery.trim().length > 0),
  );
}

export function buildLearningPathTaskStates(
  tasks: LessonTask[],
  progress: ProgressState,
): LearningPathTaskState[] {
  const furthestActivityIndex = tasks.reduce(
    (furthest, task, index) =>
      hasMeaningfulActivity(task.id, progress) ? index : furthest,
    -1,
  );
  const nextTask =
    tasks.find(
      (task) =>
        !progress.tasks[task.id]?.completed &&
        task.prerequisites.every(
          (prerequisite) => progress.tasks[prerequisite]?.completed,
        ),
    ) ?? tasks.find((task) => !progress.tasks[task.id]?.completed);

  return tasks.map((task, index) => {
    const taskProgress = progress.tasks[task.id];
    const isCurrent = task.id === progress.lastOpenedTaskId;
    let status: LearningPathTaskStatus = "upcoming";

    if (taskProgress?.completed) status = "completed";
    else if ((taskProgress?.attempts ?? 0) > 0) status = "retry";
    else if (hasMeaningfulActivity(task.id, progress)) status = "in-progress";
    else if (index < furthestActivityIndex) status = "skipped";
    else if (task.id === nextTask?.id) status = "next";

    return { task, status, isCurrent };
  });
}

function statusIcon(status: LearningPathTaskStatus) {
  if (status === "completed") return <Check size={14} />;
  if (status === "retry") return <RotateCcw size={13} />;
  if (status === "skipped") return <CircleAlert size={13} />;
  if (status === "next") return <Play size={12} fill="currentColor" />;
  return <Route size={12} />;
}

export function LearningPathScreen({
  modules,
  tasks,
  progress,
  onNavigate,
}: LearningPathScreenProps) {
  const taskStates = useMemo(
    () => buildLearningPathTaskStates(tasks, progress),
    [progress, tasks],
  );
  const taskStateById = useMemo(
    () => new Map(taskStates.map((item) => [item.task.id, item])),
    [taskStates],
  );
  const accessibleTaskStates = taskStates;
  const completedTaskIds = useMemo(
    () =>
      new Set(
        tasks
          .filter((task) => progress.tasks[task.id]?.completed === true)
          .map((task) => task.id),
      ),
    [progress.tasks, tasks],
  );
  const journeyProgress = useMemo(
    () => buildAnalystJourneyProgress(completedTaskIds),
    [completedTaskIds],
  );
  const currentItem = accessibleTaskStates.find((item) => item.isCurrent);
  const focusItem =
    accessibleTaskStates.find((item) => item.status === "retry") ??
    accessibleTaskStates.find((item) => item.status === "skipped") ??
    accessibleTaskStates.find(
      (item) => item.isCurrent && item.status === "in-progress",
    ) ??
    accessibleTaskStates.find((item) => item.status === "in-progress") ??
    accessibleTaskStates.find((item) => item.status === "next") ??
    accessibleTaskStates.find(
      (item) => item.isCurrent && item.status !== "completed",
    ) ??
    accessibleTaskStates.find((item) => item.status !== "completed");
  const focusModule = focusItem
    ? modules.find((module) => module.id === focusItem.task.moduleId)
    : undefined;
  const focusChapter = focusItem
    ? analystJourneyChapters.find((chapter) =>
        chapter.moduleIds.includes(focusItem.task.moduleId),
      )
    : undefined;
  const currentModule = currentItem
    ? modules.find((module) => module.id === currentItem.task.moduleId)
    : undefined;
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (focusModule) initial.add(focusModule.id);
    if (currentModule) initial.add(currentModule.id);
    if (initial.size === 0 && modules[0]) initial.add(modules[0].id);
    return initial;
  });

  const statusCounts = taskStates.reduce(
    (counts, item) => ({
      ...counts,
      [item.status]: counts[item.status] + 1,
    }),
    {
      completed: 0,
      "in-progress": 0,
      retry: 0,
      skipped: 0,
      next: 0,
      upcoming: 0,
    } satisfies Record<LearningPathTaskStatus, number>,
  );
  const completedCount = statusCounts.completed;
  const completionRate = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;
  const remainingMinutes = tasks.reduce(
    (total, task) =>
      total + (progress.tasks[task.id]?.completed ? 0 : task.estimatedMinutes),
    0,
  );
  const routeScore = useMemo(
    () =>
      summarizeScores(
        tasks.map((task) => task.id),
        progress.tasks,
      ),
    [progress.tasks, tasks],
  );
  const unlockedModules = modules;
  const allExpanded = unlockedModules.every((module) =>
    expandedModules.has(module.id),
  );
  const focusReason =
    focusItem?.status === "retry"
      ? "Tekrar bekleyen adım"
      : focusItem?.status === "skipped"
        ? "Rotadaki ilk eksik"
        : focusItem?.status === "in-progress" && focusItem.isCurrent
          ? "Kaldığın yer"
          : focusItem?.status === "in-progress"
            ? "Devam eden vaka"
            : focusItem?.status === "next"
              ? completedCount === 0
                ? "Önerilen başlangıç"
                : "Önerilen sonraki adım"
              : focusItem?.isCurrent
                ? "Son açtığın vaka"
                : "Önerilen sonraki adım";

  const toggleModule = (moduleId: string) => {
    setExpandedModules((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const toggleAllModules = () => {
    setExpandedModules(
      allExpanded
        ? new Set()
        : new Set(unlockedModules.map((module) => module.id)),
    );
  };

  return (
    <main id="main-content" className="page learning-path-page" tabIndex={-1}>
      <div className="page-container">
        <section
          className="learning-hero"
          aria-labelledby="learning-path-title"
        >
          <div className="learning-hero-copy">
            <div className="eyebrow">Veri analisti rotası</div>
            <h1 id="learning-path-title">Rota</h1>
            <p>
              SQL temellerinden güvenilir bir yönetici çıktısına uzanan dört
              bölümde ilerle. Nerede kaldığını ve işte hangi sonucu üretebilir
              hâle geldiğini gör. Önerilen sırayı takip et veya ihtiyaç duyduğun
              herhangi bir vakaya doğrudan geç.
            </p>
          </div>

          <div className="learning-overview">
            <article className="path-progress-card">
              <div className="path-progress-heading">
                <span>Rota ilerlemesi</span>
                <strong>%{completionRate}</strong>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Veri analisti rota ilerlemesi"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completionRate}
              >
                <div
                  className="progress-fill"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p>
                <strong>
                  {completedCount}/{tasks.length}
                </strong>{" "}
                çalışma tamamlandı
                <span>{remainingMinutes} dk kaldı</span>
              </p>
              <div className="path-score-line">
                <Target size={13} aria-hidden="true" />
                <strong>
                  {routeScore.earned}/{routeScore.possible}
                </strong>
                <span>analiz puanı</span>
              </div>
            </article>

            <article className="path-focus-card">
              {focusItem ? (
                <>
                  <span className={`path-focus-kicker ${focusItem.status}`}>
                    {statusIcon(focusItem.status)} {focusReason}
                  </span>
                  <strong>{focusItem.task.title}</strong>
                  <p>
                    {focusChapter?.title} · {focusModule?.title} ·{" "}
                    {focusItem.task.estimatedMinutes} dk ·{" "}
                    {difficultyLabel[focusItem.task.difficulty]}
                  </p>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() =>
                      onNavigate("workspace", { taskId: focusItem.task.id })
                    }
                  >
                    {taskStatusCopy[focusItem.status].action}
                    <ArrowRight size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="path-focus-kicker completed">
                    <Check size={14} /> Rota tamamlandı
                  </span>
                  <strong>Tüm çalışmalar tamam.</strong>
                  <p>
                    İlerlemeni ve ürettiğin kanıtları ayrıntılı
                    inceleyebilirsin.
                  </p>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => onNavigate("progress")}
                  >
                    İlerlemeyi incele <ArrowRight size={14} />
                  </button>
                </>
              )}
            </article>
          </div>
        </section>

        <section
          className="career-chapter-overview"
          aria-labelledby="career-chapter-overview-title"
        >
          <div className="career-chapter-overview-heading">
            <span className="path-section-kicker">
              {journeyProgress.length} bölüm
            </span>
            <h2 id="career-chapter-overview-title">
              Sorgudan karara ilerlediğin yol
            </h2>
            <p>
              Bölüm yüzdeleri yalnız doğru sonuçla tamamlanan gerçek
              çalışmalardan hesaplanır. Bir çalışmaya göz atmak veya ipucu açmak
              ilerleme sayılmaz.
            </p>
          </div>
          <div
            className="career-chapter-progress-grid"
            aria-label="Veri analisti rota bölümleri"
          >
            {journeyProgress.map((chapter) => {
              const chapterModuleNames = chapter.moduleIds.flatMap(
                (moduleId) => {
                  const matchedModule = modules.find(
                    (candidate) => candidate.id === moduleId,
                  );
                  return matchedModule ? [matchedModule.title] : [];
                },
              );

              return (
                <article
                  className={`career-chapter-progress-card ${chapter.status}`}
                  key={chapter.id}
                  aria-label={`${chapter.title} bölümü`}
                >
                  <div className="career-chapter-progress-topline">
                    <span>Bölüm {String(chapter.order).padStart(2, "0")}</span>
                    <span className={`career-chapter-status ${chapter.status}`}>
                      {chapterStatusCopy[chapter.status]}
                    </span>
                  </div>
                  <h3>{chapter.title}</h3>
                  <p className="career-chapter-promise">
                    {chapter.learnerPromise}
                  </p>
                  <div className="career-chapter-outcome">
                    <span>İş yerinde üreteceğin sonuç</span>
                    <p>{chapter.workplaceOutcome}</p>
                  </div>
                  <p className="career-chapter-module-names">
                    {chapterModuleNames.join(" · ")}
                  </p>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-label={`${chapter.title} bölüm ilerlemesi`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={chapter.completionRate}
                  >
                    <div
                      className="progress-fill"
                      style={{ width: `${chapter.completionRate}%` }}
                    />
                  </div>
                  <p className="career-chapter-progress-count">
                    <strong>{chapter.completedTaskCount}</strong>/
                    {chapter.totalTaskCount} çalışma tamamlandı
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="path-status-grid" aria-label="Çalışma durum özeti">
          {(
            [
              ["completed", "Tamamlandı", statusCounts.completed],
              ["in-progress", "Devam ediyor", statusCounts["in-progress"]],
              ["retry", "Tekrar bekliyor", statusCounts.retry],
              ["skipped", "Atlandı", statusCounts.skipped],
              [
                "upcoming",
                "Başlamadı",
                statusCounts.upcoming + statusCounts.next,
              ],
            ] as const
          ).map(([status, label, count]) => (
            <article className={`path-status-card ${status}`} key={status}>
              <span className="path-status-icon">{statusIcon(status)}</span>
              <span>
                <strong>{count}</strong>
                <small>{label}</small>
              </span>
            </article>
          ))}
        </section>

        <div className="path-list-heading">
          <div>
            <span className="path-section-kicker">
              {journeyProgress.length} bölüm · {modules.length} SQL konusu ·{" "}
              {tasks.length} çalışma
            </span>
            <h2>Bölümler ve SQL konuları</h2>
            <p>
              Bölümler iş sonucunu, SQL konuları o sonuca götüren becerileri
              gösterir. İlk konu açıktır; sonraki konu, önceki konuların tüm
              çalışmaları tamamlanınca açılır.
            </p>
          </div>
          <button
            className="soft-button"
            type="button"
            onClick={toggleAllModules}
          >
            {allExpanded ? "Tümünü daralt" : "Tüm konuları aç"}
            {allExpanded ? (
              <ChevronDown size={15} />
            ) : (
              <ChevronRight size={15} />
            )}
          </button>
        </div>

        <div className="module-stack">
          {journeyProgress.map((chapter) => {
            const chapterModules = modules.filter((module) =>
              chapter.moduleIds.includes(module.id),
            );

            return (
              <section
                className={`career-chapter-module-group ${chapter.status}`}
                key={chapter.id}
                aria-labelledby={`${chapter.id}-module-group-title`}
              >
                <header className="career-chapter-module-heading">
                  <span className="career-chapter-module-index">
                    Bölüm {String(chapter.order).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 id={`${chapter.id}-module-group-title`}>
                      {chapter.title}
                    </h2>
                    <p>{chapter.workplaceOutcome}</p>
                  </div>
                  <span className="career-chapter-module-progress">
                    {chapter.completedTaskCount}/{chapter.totalTaskCount}{" "}
                    çalışma
                  </span>
                </header>
                <div className="career-chapter-module-list">
                  {chapterModules.map((module) => {
                    const itemLabel =
                      module.contentKind === "projects" ? "proje" : "vaka";
                    const itemLabelPlural =
                      module.contentKind === "projects"
                        ? "projelerini"
                        : "vakalarını";
                    const moduleItems = module.tasks.flatMap((task) => {
                      const item = taskStateById.get(task.id);
                      return item ? [item] : [];
                    });
                    const completedTasks = moduleItems.filter(
                      (item) => item.status === "completed",
                    ).length;
                    const retryTasks = moduleItems.filter(
                      (item) => item.status === "retry",
                    ).length;
                    const skippedTasks = moduleItems.filter(
                      (item) => item.status === "skipped",
                    ).length;
                    const activeTasks = moduleItems.filter(
                      (item) => item.status === "in-progress",
                    ).length;
                    const containsNext = moduleItems.some(
                      (item) => item.status === "next",
                    );
                    const moduleRate = module.tasks.length
                      ? Math.round((completedTasks / module.tasks.length) * 100)
                      : 0;
                    const moduleScore = summarizeScores(
                      module.tasks.map((task) => task.id),
                      progress.tasks,
                    );
                    const isExpanded = expandedModules.has(module.id);
                    const isComplete = completedTasks === module.tasks.length;
                    const isCurrent = moduleItems.some(
                      (item) => item.isCurrent,
                    );
                    const hasAttention = retryTasks + skippedTasks > 0;
                    const moduleState = isComplete
                      ? "completed"
                      : isCurrent
                        ? "current"
                        : hasAttention
                          ? "attention"
                          : completedTasks + activeTasks > 0
                            ? "active"
                            : containsNext
                              ? "next"
                              : "upcoming";
                    const moduleStateLabel = isComplete
                      ? "Tamamlandı"
                      : isCurrent
                        ? "Şu an buradasın"
                        : hasAttention
                          ? "Eksik adımlar var"
                          : completedTasks + activeTasks > 0
                            ? "Devam ediyor"
                            : containsNext
                              ? "Sıradaki konu"
                              : "Başlamadı";
                    const moduleSignals = [
                      retryTasks ? `${retryTasks} tekrar` : "",
                      skippedTasks ? `${skippedTasks} atlandı` : "",
                      activeTasks ? `${activeTasks} devam ediyor` : "",
                      containsNext ? `sıradaki ${itemLabel} hazır` : "",
                    ].filter(Boolean);

                    return (
                      <section
                        className={`module-card ${moduleState}`}
                        key={module.id}
                      >
                        <div className="module-summary">
                          <button
                            type="button"
                            className="module-summary-toggle"
                            onClick={() => toggleModule(module.id)}
                            aria-expanded={isExpanded}
                            aria-controls={`${module.id}-tasks`}
                            aria-label={`${module.title} ${itemLabelPlural} ${
                              isExpanded ? "daralt" : "aç"
                            }`}
                          />
                          <span className="module-index">
                            {isComplete ? (
                              <Check size={17} />
                            ) : (
                              String(module.order).padStart(2, "0")
                            )}
                          </span>
                          <span className="module-title">
                            <span className="module-title-line">
                              <h2>{module.title}</h2>
                              <span
                                className={`module-state-badge ${moduleState}`}
                              >
                                {moduleStateLabel}
                              </span>
                            </span>
                            <p>{module.subtitle}</p>
                          </span>
                          <span className="module-concepts">
                            {module.topics.slice(0, 4).map((topic) => (
                              <span className="concept-chip" key={topic}>
                                {topic}
                              </span>
                            ))}
                          </span>
                          <span className="module-progress-label">
                            <span>
                              <strong>{completedTasks}</strong>/
                              {module.tasks.length} tamamlandı
                            </span>
                            <small>
                              {moduleSignals.join(" · ") ||
                                (isComplete
                                  ? "Tüm adımlar hazır"
                                  : `${module.tasks.length - completedTasks} ${itemLabel} kaldı`)}
                            </small>
                            <small className="module-score-note">
                              {moduleScore.earned}/{moduleScore.possible} analiz
                              puanı
                            </small>
                            <span className="progress-track">
                              <span
                                className="progress-fill"
                                style={{ width: `${moduleRate}%` }}
                              />
                            </span>
                          </span>
                          <span
                            className="module-toggle-icon"
                            aria-hidden="true"
                          >
                            {isExpanded ? (
                              <ChevronDown size={17} />
                            ) : (
                              <ChevronRight size={17} />
                            )}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="task-list" id={`${module.id}-tasks`}>
                            <div className="module-detail-intro">
                              <p>{module.description}</p>
                              <span>
                                {module.estimatedMinutes} dk ·{" "}
                                {difficultyLabel[module.difficulty]}
                              </span>
                            </div>
                            {moduleItems.map(
                              ({ task, status, isCurrent: taskIsCurrent }) => {
                                const taskProgress = progress.tasks[task.id];
                                const taskScore =
                                  getAwardedCaseScore(taskProgress);
                                const unmetPrerequisite = task.prerequisites
                                  .map((id) =>
                                    tasks.find(
                                      (candidate) => candidate.id === id,
                                    ),
                                  )
                                  .find(
                                    (prerequisite) =>
                                      prerequisite &&
                                      !progress.tasks[prerequisite.id]
                                        ?.completed,
                                  );
                                const progressNote = taskProgress?.completed
                                  ? `${taskScore}/10 puan`
                                  : taskProgress?.attempts
                                    ? `${taskProgress.attempts} deneme`
                                    : taskProgress?.lastQuery.trim()
                                      ? "Taslak kayıtlı"
                                      : taskProgress?.hintsUsed.length
                                        ? `${taskProgress.hintsUsed.length} ipucu kullanıldı`
                                        : undefined;
                                const copy = taskStatusCopy[status];

                                return (
                                  <button
                                    className={`task-row ${status} ${
                                      taskIsCurrent ? "is-current" : ""
                                    }`}
                                    key={task.id}
                                    type="button"
                                    onClick={() =>
                                      onNavigate("workspace", {
                                        taskId: task.id,
                                      })
                                    }
                                    aria-current={
                                      taskIsCurrent ? "step" : undefined
                                    }
                                  >
                                    <span className={`task-state ${status}`}>
                                      {statusIcon(status)}
                                    </span>
                                    <span className="task-name">
                                      <span className="task-title-line">
                                        <strong>{task.title}</strong>
                                        {taskIsCurrent && (
                                          <span className="current-task-badge">
                                            Buradasın
                                          </span>
                                        )}
                                      </span>
                                      <span>{task.subtitle}</span>
                                      {unmetPrerequisite && (
                                        <span className="task-prerequisite-note">
                                          Önce “{unmetPrerequisite.title}”
                                          önerilir
                                        </span>
                                      )}
                                    </span>
                                    <span className="task-row-meta">
                                      <span
                                        className={`task-status-label ${status}`}
                                      >
                                        {copy.label}
                                      </span>
                                      {progressNote && (
                                        <span className="task-progress-note">
                                          {progressNote}
                                        </span>
                                      )}
                                      <span className="task-time">
                                        <Clock3 size={11} />{" "}
                                        {task.estimatedMinutes} dk ·{" "}
                                        {difficultyLabel[task.difficulty]}
                                      </span>
                                    </span>
                                    <span className="task-row-action">
                                      {copy.action} <ArrowRight size={13} />
                                    </span>
                                  </button>
                                );
                              },
                            )}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
