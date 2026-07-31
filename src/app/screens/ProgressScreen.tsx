"use client";

import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Flame,
  Radar,
  Repeat2,
  Sparkles,
  Target,
} from "lucide-react";
import { useMemo } from "react";
import type { CurriculumModule, LessonTask } from "../../types/lesson";
import {
  calculateStreak,
  type ProgressState,
} from "../../features/progress/progressStore";
import type { Navigate } from "../appTypes";

interface ProgressScreenProps {
  modules: CurriculumModule[];
  tasks: LessonTask[];
  progress: ProgressState;
  onNavigate: Navigate;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds} sn`;
  return `${Math.round(seconds / 60)} dk`;
}

export function ProgressScreen({
  modules,
  tasks,
  progress,
  onNavigate,
}: ProgressScreenProps) {
  const metrics = useMemo(() => {
    const taskProgress = Object.values(progress.tasks);
    const completed = taskProgress.filter((task) => task.completed);
    const attempts = taskProgress.reduce(
      (total, task) => total + task.attempts,
      0,
    );
    const firstTryCount = completed.filter((task) => task.firstTry).length;
    const averageTime = completed.length
      ? Math.round(
          completed.reduce(
            (total, task) => total + task.solveTimeSeconds,
            0,
          ) / completed.length,
        )
      : 0;
    return {
      completed: completed.length,
      attempts,
      firstTryRate: completed.length
        ? Math.round((firstTryCount / completed.length) * 100)
        : 0,
      averageTime,
      streak: calculateStreak(progress.activityDates),
    };
  }, [progress]);

  const topicPerformance = useMemo(() => {
    const conceptMap = new Map<string, { completed: number; attempts: number }>();
    tasks.forEach((task) => {
      const taskState = progress.tasks[task.id];
      task.concepts.forEach((concept) => {
        const current = conceptMap.get(concept) ?? {
          completed: 0,
          attempts: 0,
        };
        conceptMap.set(concept, {
          completed: current.completed + (taskState?.completed ? 1 : 0),
          attempts: current.attempts + (taskState?.attempts ?? 0),
        });
      });
    });
    return Array.from(conceptMap.entries())
      .map(([concept, values]) => ({
        concept,
        score: values.completed
          ? Math.max(
              20,
              Math.min(
                100,
                Math.round(
                  (values.completed / Math.max(1, values.attempts)) * 100,
                ),
              ),
            )
          : 0,
      }))
      .filter((topic) => topic.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 5);
  }, [progress.tasks, tasks]);

  const recommendedTask =
    tasks.find(
      (task) =>
        !progress.tasks[task.id]?.completed &&
        task.prerequisites.every(
          (prerequisite) => progress.tasks[prerequisite]?.completed,
        ),
    ) ?? tasks[0];

  const moduleProgress = modules.slice(0, 5).map((module) => {
    const complete = module.tasks.filter(
      (task) => progress.tasks[task.id]?.completed,
    ).length;
    return {
      title: module.title,
      rate: module.tasks.length
        ? Math.round((complete / module.tasks.length) * 100)
        : 0,
    };
  });

  const activityCells = Array.from({ length: 28 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (27 - index));
    const key = date.toISOString().slice(0, 10);
    return { key, active: progress.activityDates.includes(key) };
  });

  return (
    <main className="page">
      <div className="page-container">
        <div className="page-hero">
          <div>
            <div className="eyebrow">Yerel öğrenme sinyalleri</div>
            <h1>İlerleme görünümü</h1>
            <p>
              Bu göstergeler yalnızca bu cihazdaki denemelerinden hesaplanır.
              Amaç puan toplamak değil; hangi analitik kasın güçlendiğini
              görünür kılmaktır.
            </p>
          </div>
        </div>

        <section className="metrics-grid" aria-label="İlerleme metrikleri">
          <article className="metric-card span-3">
            <div className="metric-label">
              <CheckCircle2 size={14} /> Tamamlanan görev
            </div>
            <div className="metric-value">{metrics.completed}</div>
            <div className="metric-caption">toplam {tasks.length} görevden</div>
          </article>
          <article className="metric-card span-3">
            <div className="metric-label">
              <Repeat2 size={14} /> Toplam deneme
            </div>
            <div className="metric-value">{metrics.attempts}</div>
            <div className="metric-caption">sorgu çalıştırma kaydı</div>
          </article>
          <article className="metric-card span-3">
            <div className="metric-label">
              <Target size={14} /> İlk denemede çözüm
            </div>
            <div className="metric-value">%{metrics.firstTryRate}</div>
            <div className="metric-caption">tamamlanan görevlerde</div>
          </article>
          <article className="metric-card span-3">
            <div className="metric-label">
              <Clock3 size={14} /> Ortalama çözüm
            </div>
            <div className="metric-value">
              {formatDuration(metrics.averageTime)}
            </div>
            <div className="metric-caption">görev başına aktif süre</div>
          </article>

          <article className="metric-card span-8">
            <div className="metric-label">
              <BarChart3 size={14} /> Modül bazlı ilerleme
            </div>
            <div className="topic-bars">
              {moduleProgress.map((module) => (
                <div className="topic-bar-row" key={module.title}>
                  <span>{module.title}</span>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${module.rate}%` }}
                    />
                  </div>
                  <strong>%{module.rate}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="metric-card span-4">
            <div className="metric-label">
              <Flame size={14} /> Öğrenme serisi
            </div>
            <div className="metric-value">{metrics.streak} gün</div>
            <div className="activity-grid" aria-label="Son 28 gün aktivitesi">
              {activityCells.map((cell) => (
                <span
                  className={`activity-cell ${cell.active ? "active" : ""}`}
                  key={cell.key}
                  title={`${cell.key}: ${cell.active ? "çalışıldı" : "boş"}`}
                />
              ))}
            </div>
          </article>

          <article className="metric-card span-6">
            <div className="metric-label">
              <Radar size={14} /> Güçlenen konular
            </div>
            {topicPerformance.length ? (
              <div className="topic-bars">
                {topicPerformance.map((topic) => (
                  <div className="topic-bar-row" key={topic.concept}>
                    <span>{topic.concept.replaceAll("_", " ")}</span>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${topic.score}%` }}
                      />
                    </div>
                    <strong>%{topic.score}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="recommendation">
                <strong>İlk sinyalini üret</strong>
                <p>
                  Bir görevi tamamladığında kavram bazlı güçlü alanların burada
                  görünür olacak.
                </p>
              </div>
            )}
          </article>

          <article className="metric-card span-6">
            <div className="metric-label">
              <Sparkles size={14} /> Sonraki öneri
            </div>
            <div className="recommendation">
              <strong>{recommendedTask?.title ?? "İlk görev"}</strong>
              <p>
                {recommendedTask?.subtitle ??
                  "İlk sorgunu çalıştırarak öğrenme rotasını başlat."}
              </p>
              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  onNavigate("workspace", { taskId: recommendedTask?.id })
                }
              >
                Devam et <ArrowRight size={14} />
              </button>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
