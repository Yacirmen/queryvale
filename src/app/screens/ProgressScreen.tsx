"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  Flame,
  Lightbulb,
  Radar,
  Save,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { CurriculumModule, LessonTask } from "../../types/lesson";
import {
  calculateStreak,
  type ProgressState,
  validateProfileName,
} from "../../features/progress/progressStore";
import type { Navigate } from "../appTypes";

interface ProgressScreenProps {
  modules: CurriculumModule[];
  tasks: LessonTask[];
  progress: ProgressState;
  profileName: string;
  onProfileNameChange: (name: string) => void;
  onNavigate: Navigate;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds} sn`;
  return `${Math.round(seconds / 60)} dk`;
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

export function ProgressScreen({
  modules,
  tasks,
  progress,
  profileName,
  onProfileNameChange,
  onNavigate,
}: ProgressScreenProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(profileName);
  const [nameError, setNameError] = useState<string>();
  const [nameStatus, setNameStatus] = useState<string>();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const editNameButtonRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreNameFocusRef = useRef(false);
  const evidenceByTaskId = progress.evidenceByTaskId;

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus();
    else if (shouldRestoreNameFocusRef.current) {
      editNameButtonRef.current?.focus();
      shouldRestoreNameFocusRef.current = false;
    }
  }, [isEditingName]);

  const metrics = useMemo(() => {
    const taskProgress = tasks.flatMap((task) => {
      const taskState = progress.tasks[task.id];
      return taskState ? [taskState] : [];
    });
    const completed = taskProgress.filter((task) => task.completed);
    const attempts = taskProgress.reduce(
      (total, task) => total + task.attempts,
      0,
    );
    const averageTime = completed.length
      ? Math.round(
          completed.reduce((total, task) => total + task.solveTimeSeconds, 0) /
            completed.length,
        )
      : 0;
    const hintsUsed = taskProgress.reduce(
      (total, task) => total + task.hintsUsed.length,
      0,
    );
    const verifiedEvidence = Object.values(evidenceByTaskId);
    const decisionNotes = verifiedEvidence.filter((evidence) =>
      Boolean(evidence.note),
    ).length;

    return {
      completed: completed.length,
      attempts,
      averageTime,
      hintsUsed,
      verifiedEvidence: verifiedEvidence.length,
      decisionNotes,
      streak: calculateStreak(progress.activityDates),
      completionRate: tasks.length
        ? Math.min(100, Math.round((completed.length / tasks.length) * 100))
        : 0,
    };
  }, [evidenceByTaskId, progress.activityDates, progress.tasks, tasks]);

  const recommendedTask = useMemo(
    () =>
      tasks.find(
        (task) =>
          !progress.tasks[task.id]?.completed &&
          task.prerequisites.every(
            (prerequisite) => progress.tasks[prerequisite]?.completed,
          ),
      ) ?? tasks.find((task) => !progress.tasks[task.id]?.completed),
    [progress.tasks, tasks],
  );

  const moduleProgress = useMemo(() => {
    const taskIndex = new Map(tasks.map((task, index) => [task.id, index]));
    const furthestActivityIndex = tasks.reduce(
      (furthest, task, index) =>
        hasTaskActivity(task.id, progress) ? index : furthest,
      -1,
    );

    return modules.map((module, index) => {
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
      const isComplete = rate === 100;
      const state = isComplete
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
        rate,
        next: isComplete ? module.tasks[0] : suggested,
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
  }, [modules, progress, recommendedTask?.id, tasks]);

  const recentCompletions = useMemo(
    () =>
      tasks
        .flatMap((task) => {
          const taskState = progress.tasks[task.id];
          if (!taskState?.completed || !taskState.lastCompletedAt) return [];
          const curriculumModule = modules.find((item) =>
            item.tasks.some((moduleTask) => moduleTask.id === task.id),
          );
          return [
            {
              task,
              moduleTitle: curriculumModule?.title ?? "Öğrenme yolu",
              completedAt: taskState.lastCompletedAt,
              attempts: taskState.attempts,
            },
          ];
        })
        .sort(
          (left, right) =>
            Date.parse(right.completedAt) - Date.parse(left.completedAt),
        )
        .slice(0, 4),
    [modules, progress.tasks, tasks],
  );

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
              moduleTitle: curriculumModule?.title ?? "Öğrenme yolu",
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

  const conceptSignals = useMemo(() => {
    const conceptMap = new Map<
      string,
      { total: number; completed: number; attempts: number; hints: number }
    >();

    tasks.forEach((task) => {
      const taskState = progress.tasks[task.id];
      if (!hasTaskActivity(task.id, progress)) return;
      task.concepts.forEach((concept) => {
        const current = conceptMap.get(concept) ?? {
          total: 0,
          completed: 0,
          attempts: 0,
          hints: 0,
        };
        conceptMap.set(concept, {
          total: current.total + 1,
          completed: current.completed + (taskState?.completed ? 1 : 0),
          attempts: current.attempts + (taskState?.attempts ?? 0),
          hints: current.hints + (taskState?.hintsUsed.length ?? 0),
        });
      });
    });

    const signals = Array.from(conceptMap.entries()).map(
      ([concept, values]) => ({
        concept,
        ...values,
        rate: Math.round((values.completed / values.total) * 100),
      }),
    );

    const strengths = signals
      .filter((signal) => signal.completed > 0 && signal.rate >= 60)
      .sort(
        (left, right) =>
          right.rate - left.rate || right.completed - left.completed,
      )
      .slice(0, 3);

    const strengthConcepts = new Set(
      signals
        .filter((signal) => signal.completed > 0 && signal.rate >= 60)
        .map((signal) => signal.concept),
    );

    const focus = signals
      .filter(
        (signal) =>
          !strengthConcepts.has(signal.concept) &&
          (signal.rate < 100 ||
            signal.attempts > signal.completed ||
            signal.hints > 0),
      )
      .sort(
        (left, right) =>
          left.rate - right.rate || right.attempts - left.attempts,
      )
      .slice(0, 3);

    return { strengths, focus };
  }, [progress, tasks]);

  const activityCells = useMemo(
    () =>
      Array.from({ length: 35 }, (_, index) => {
        const date = new Date();
        date.setUTCDate(date.getUTCDate() - (34 - index));
        const key = date.toISOString().slice(0, 10);
        return { key, active: progress.activityDates.includes(key) };
      }),
    [progress.activityDates],
  );

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

  return (
    <main className="page progress-dashboard-page">
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
              <span className="profile-kicker">Bu cihazdaki profil</span>
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

          <div className="progress-overview" aria-label="Genel ilerleme">
            <div
              className="progress-ring"
              role="progressbar"
              aria-label="Tamamlanan görev oranı"
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
                {metrics.completed} / {tasks.length} görev
              </strong>
              <p>
                {metrics.completed
                  ? `${modules.filter((module) => module.tasks.every((task) => progress.tasks[task.id]?.completed)).length} modülü tamamen kapattın.`
                  : "İlk doğru sorguyla kişisel ilerleme haritan oluşacak."}
              </p>
            </div>
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
              {recommendedTask?.title ?? "Rotayı tamamladın"}
            </h2>
            <p>
              {recommendedTask?.subtitle ??
                "Bütün görevler tamamlandı. İstersen zorlandığın konulara dönüp farklı sorgular deneyebilirsin."}
            </p>
          </div>
          {recommendedTask && (
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                onNavigate("workspace", { taskId: recommendedTask.id })
              }
            >
              Göreve devam et <ArrowRight size={15} />
            </button>
          )}
        </section>

        <section className="progress-signal-strip" aria-label="Öğrenme özeti">
          <article>
            <CheckCircle2 size={16} />
            <span>Tamamlanan</span>
            <strong>{metrics.completed}</strong>
            <small>{tasks.length} görevden</small>
          </article>
          <article>
            <Target size={16} />
            <span>Karar notu</span>
            <strong>{metrics.decisionNotes}</strong>
            <small>{metrics.verifiedEvidence} doğrulanmış kanıtta</small>
          </article>
          <article>
            <Clock3 size={16} />
            <span>Ortalama çözüm</span>
            <strong>{formatDuration(metrics.averageTime)}</strong>
            <small>görev başına</small>
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
                </div>
                {evidenceRecords.length > 0 && (
                  <span className="module-progress-state complete">
                    {metrics.decisionNotes} karar notu ·{" "}
                    {evidenceRecords.length} kanıt
                  </span>
                )}
              </div>

              {evidenceRecords.length ? (
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
                              önerisine dönüştürmek için vakaya dön.
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
                          aria-label={`Vakayı aç: ${task.title}`}
                        >
                          Vakayı aç <ArrowRight size={14} />
                        </button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="progress-empty-state">
                  <Target size={22} aria-hidden="true" />
                  <div>
                    <strong>İlk doğrulanmış kanıtın burada görünecek</strong>
                    <p>
                      Bir sorguyu doğru tamamladığında SQL’in ve çıktı özeti
                      kaydedilir. Bulguyu yorumladığında karar notun da bu
                      deftere eklenir.
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
                  <h2 id="module-progress-title">Modüller nerede kaldı?</h2>
                </div>
                <button
                  className="soft-button"
                  type="button"
                  onClick={() => onNavigate("learn")}
                >
                  Öğrenme yolunu aç <ArrowRight size={14} />
                </button>
              </div>

              <div className="module-progress-list">
                {moduleProgress.map((module) => (
                  <article className="module-progress-row" key={module.id}>
                    <span className="module-progress-index">
                      {String(module.index).padStart(2, "0")}
                    </span>
                    <div className="module-progress-copy">
                      <div>
                        <h3>{module.title}</h3>
                        <span
                          className={`module-progress-state ${module.rate === 100 ? "complete" : ""} ${module.state === "Eksik adım var" ? "attention" : ""} ${module.state === "Sıradaki" ? "next" : ""}`}
                        >
                          {module.rate === 100 && <Check size={12} />}
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
                          {module.completed}/{module.total} görev
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
                    ) : (
                      <span
                        className="module-progress-done"
                        aria-label="Tamamlandı"
                      >
                        <CheckCircle2 size={18} />
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
                        onNavigate("workspace", { taskId: item.task.id })
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
                        <small>{item.moduleTitle}</small>
                      </span>
                      <span className="recent-progress-meta">
                        {formatDate(item.completedAt)} · {item.attempts} deneme
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
                      Bir görevi doğru tamamladığında tarihini ve kaç denemede
                      çözdüğünü kaydedeceğiz.
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
                <strong>{activeDaysInWindow} aktif gün</strong>
                <span>{metrics.streak} günlük güncel seri</span>
              </div>
              <div
                className="profile-activity-grid"
                role="img"
                aria-label={`Son 35 günde ${activeDaysInWindow} gün çalışıldı.`}
              >
                {activityCells.map((cell) => (
                  <span
                    className={`profile-activity-cell ${cell.active ? "active" : ""}`}
                    key={cell.key}
                    aria-hidden="true"
                  />
                ))}
              </div>
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

              {conceptSignals.strengths.length ? (
                <div className="concept-signal-group">
                  <span className="concept-signal-label">
                    <TrendingUp size={13} /> Doğrulanan pratikler
                  </span>
                  <div className="concept-chip-list">
                    {conceptSignals.strengths.map((signal) => (
                      <span
                        className="concept-chip strong"
                        key={signal.concept}
                      >
                        {formatConcept(signal.concept)}
                        <small>
                          {signal.completed}/{signal.total} tamamlanan görev
                        </small>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="concept-empty-copy">
                  SQL görevlerini tamamladıkça çalıştığın kavramlar burada
                  görünür olacak.
                </p>
              )}

              {conceptSignals.focus.length > 0 && (
                <div className="concept-signal-group">
                  <span className="concept-signal-label focus">
                    <Lightbulb size={13} /> Sıradaki pratik alanı
                  </span>
                  <div className="concept-chip-list">
                    {conceptSignals.focus.map((signal) => (
                      <span className="concept-chip focus" key={signal.concept}>
                        {formatConcept(signal.concept)}
                        <small>
                          {signal.total - signal.completed} görev kaldı
                        </small>
                      </span>
                    ))}
                  </div>
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
                Adın, sorguların ve ilerlemen bu cihazda tutulur. Diğer cihaza
                geçirmek için JSON yedeğini kullanabilirsin.
              </p>
              <button
                className="ghost-button"
                type="button"
                onClick={() => onNavigate("settings")}
              >
                Yedekleme ayarları <ArrowRight size={14} />
              </button>
              {metrics.hintsUsed > 0 && (
                <small>
                  {metrics.hintsUsed} ipucu açıldı; bu bir ceza puanı değil.
                </small>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
