"use client";

import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  LockKeyhole,
  Route,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { CurriculumModule, LessonTask } from "../../types/lesson";
import type { ProgressState } from "../../features/progress/progressStore";
import type { Navigate } from "../appTypes";

interface LearningPathScreenProps {
  modules: CurriculumModule[];
  tasks: LessonTask[];
  progress: ProgressState;
  onNavigate: Navigate;
}

const difficultyLabel = {
  beginner: "Başlangıç",
  intermediate: "Orta",
  advanced: "İleri",
} as const;

function taskIsLocked(task: LessonTask, progress: ProgressState): boolean {
  return task.prerequisites.some(
    (prerequisite) => !progress.tasks[prerequisite]?.completed,
  );
}

export function LearningPathScreen({
  modules,
  tasks,
  progress,
  onNavigate,
}: LearningPathScreenProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    () => new Set(modules.slice(0, 3).map((module) => module.id)),
  );
  const completedCount = useMemo(
    () => tasks.filter((task) => progress.tasks[task.id]?.completed).length,
    [progress.tasks, tasks],
  );
  const completionRate = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  const toggleModule = (moduleId: string) => {
    setExpandedModules((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  return (
    <main className="page">
      <div className="page-container">
        <div className="page-hero">
          <div>
            <div className="eyebrow">10 duraklı analitik rota</div>
            <h1>Öğrenme yolu</h1>
            <p>
              Basit seçimlerden iş analistliği projelerine ilerleyen rota.
              Kilitler yalnızca gerekli temeli korur; her görev bir öncekinin
              üzerine somut bir analitik karar ekler.
            </p>
          </div>
          <div className="overall-progress" aria-label={`Yüzde ${completionRate} tamamlandı`}>
            <strong>%{completionRate}</strong>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="module-stack">
          {modules.map((module) => {
            const completedTasks = module.tasks.filter(
              (task) => progress.tasks[task.id]?.completed,
            ).length;
            const moduleRate = module.tasks.length
              ? Math.round((completedTasks / module.tasks.length) * 100)
              : 0;
            const isExpanded = expandedModules.has(module.id);
            const moduleLocked =
              module.tasks.length > 0 &&
              module.tasks.every((task) => taskIsLocked(task, progress));

            return (
              <section
                className={`module-card ${moduleLocked ? "locked" : ""}`}
                key={module.id}
              >
                <button
                  type="button"
                  className="module-summary"
                  onClick={() => toggleModule(module.id)}
                  aria-expanded={isExpanded}
                >
                  <span className="module-index">
                    {String(module.order).padStart(2, "0")}
                  </span>
                  <span className="module-title">
                    <h2>{module.title}</h2>
                    <p>
                      {module.subtitle} · {module.estimatedMinutes} dk
                    </p>
                  </span>
                  <span className="module-concepts">
                    {module.topics.slice(0, 5).map((topic) => (
                      <span className="concept-chip" key={topic}>
                        {topic}
                      </span>
                    ))}
                  </span>
                  <span className="module-progress-label">
                    {moduleLocked ? (
                      <>
                        <LockKeyhole size={11} /> Önceki modülü tamamla
                      </>
                    ) : (
                      <>
                        {completedTasks}/{module.tasks.length} görev
                        <span className="progress-track">
                          <span
                            className="progress-fill"
                            style={{ width: `${moduleRate}%` }}
                          />
                        </span>
                      </>
                    )}
                  </span>
                  {isExpanded ? (
                    <ChevronDown size={17} />
                  ) : (
                    <ChevronRight size={17} />
                  )}
                </button>

                {isExpanded && (
                  <div className="task-list">
                    {module.tasks.map((task) => {
                      const isComplete =
                        progress.tasks[task.id]?.completed ?? false;
                      const isLocked = taskIsLocked(task, progress);
                      return (
                        <button
                          className="task-row"
                          key={task.id}
                          type="button"
                          disabled={isLocked}
                          onClick={() =>
                            onNavigate("workspace", { taskId: task.id })
                          }
                        >
                          <span
                            className={`task-state ${
                              isComplete ? "complete" : ""
                            }`}
                          >
                            {isComplete ? (
                              <Check size={13} />
                            ) : isLocked ? (
                              <LockKeyhole size={11} />
                            ) : (
                              <Route size={11} />
                            )}
                          </span>
                          <span className="task-name">
                            <strong>{task.title}</strong>
                            <span>{task.subtitle}</span>
                          </span>
                          <span className="task-concepts">
                            {task.concepts.slice(0, 3).join(" · ")}
                          </span>
                          <span className="task-time">
                            <Clock3 size={11} />
                            {task.estimatedMinutes} dk ·{" "}
                            {difficultyLabel[task.difficulty]}
                          </span>
                          <ArrowRight size={13} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
