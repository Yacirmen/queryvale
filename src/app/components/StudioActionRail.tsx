"use client";

import {
  Check,
  ChevronUp,
  Circle,
  CircleDot,
  GitMerge,
  Layers3,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  isDrillTaskType,
  type DrillTaskType,
  type LessonTaskType,
} from "../../types/lesson";

export type StudioRouteTaskStatus = "unstarted" | "attempted" | "completed";

export interface StudioRouteTaskItem {
  id: string;
  index: number;
  title: string;
  status: StudioRouteTaskStatus;
  type?: LessonTaskType;
  scored?: boolean;
  score?: number;
}

export interface StudioRouteModuleItem {
  id: string;
  order: number;
  title: string;
  tasks: StudioRouteTaskItem[];
}

interface StudioActionRailProps {
  variant: "sql" | "python";
  activeTaskId: string;
  activeIndex: number;
  totalCount: number;
  modules: StudioRouteModuleItem[];
  previousTaskId?: string;
  nextTaskId?: string;
  currentTaskCorrect: boolean;
  activeTaskType?: LessonTaskType;
  routeMenuOpen: boolean;
  onRouteMenuOpenChange: (open: boolean) => void;
  onSelectTask: (taskId: string) => void;
  onCompleteRoute: () => void;
}

function StatusMark({ status }: { status: StudioRouteTaskStatus }) {
  if (status === "completed") return <Check size={13} aria-hidden="true" />;
  if (status === "attempted") return <CircleDot size={13} aria-hidden="true" />;
  return <Circle size={13} aria-hidden="true" />;
}

function statusLabel(status: StudioRouteTaskStatus): string {
  if (status === "completed") return "Tamamlandı";
  if (status === "attempted") return "Deneniyor";
  return "Başlanmadı";
}

const DRILL_ROUTE_PRESENTATIONS: Readonly<
  Record<DrillTaskType, { label: string; badge: string }>
> = {
  drill_intro: { label: "Alıştırma", badge: "ALIŞTIRMA · 3 DK" },
  drill_practice: { label: "Tekrar", badge: "TEKRAR · 3 DK" },
  drill_mix: { label: "Birleştir", badge: "BİRLEŞTİR · 5 DK" },
};

function taskTypePresentation(type: LessonTaskType = "case") {
  if (!isDrillTaskType(type)) {
    return { label: "Vaka", badge: "VAKA · 10 DK" };
  }
  return DRILL_ROUTE_PRESENTATIONS[type];
}

function DrillRouteIcon({ type }: { type: LessonTaskType }) {
  if (!isDrillTaskType(type)) return null;
  if (type === "drill_practice") {
    return <RotateCcw size={13} aria-hidden="true" />;
  }
  if (type === "drill_mix") {
    return <GitMerge size={13} aria-hidden="true" />;
  }
  return <Sparkles size={13} aria-hidden="true" />;
}

export function StudioActionRail({
  variant,
  activeTaskId,
  activeIndex,
  totalCount,
  modules,
  previousTaskId,
  nextTaskId,
  currentTaskCorrect,
  activeTaskType = "case",
  routeMenuOpen,
  onRouteMenuOpenChange,
  onSelectTask,
  onCompleteRoute,
}: StudioActionRailProps) {
  const activePresentation = taskTypePresentation(activeTaskType);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const taskRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const flatTasks = useMemo(
    () => modules.flatMap((module) => module.tasks),
    [modules],
  );
  const activeFlatIndex = Math.max(
    0,
    flatTasks.findIndex((task) => task.id === activeTaskId),
  );
  const [focusedIndex, setFocusedIndex] = useState(activeFlatIndex);

  useEffect(() => {
    if (!routeMenuOpen) return;
    const nextIndex = Math.max(
      0,
      flatTasks.findIndex((task) => task.id === activeTaskId),
    );
    const frame = window.requestAnimationFrame(() => {
      setFocusedIndex(nextIndex);
      const target = taskRefs.current[nextIndex];
      target?.focus({ preventScroll: true });
      target?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTaskId, flatTasks, routeMenuOpen]);

  useEffect(() => {
    if (!routeMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const rail = triggerRef.current?.closest(".studio-action-zone");
      if (rail?.contains(target)) return;
      onRouteMenuOpenChange(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onRouteMenuOpenChange, routeMenuOpen]);

  const moveFocus = (nextIndex: number) => {
    const bounded = (nextIndex + flatTasks.length) % flatTasks.length;
    setFocusedIndex(bounded);
    taskRefs.current[bounded]?.focus();
  };

  const selectTask = (taskId: string) => {
    onRouteMenuOpenChange(false);
    onSelectTask(taskId);
  };

  return (
    <nav
      className="studio-action-zone"
      data-variant={variant}
      data-task-type={activeTaskType}
      data-verified={String(currentTaskCorrect)}
      aria-label={`${variant === "sql" ? "SQL" : "Python"} çalışma gezintisi`}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !routeMenuOpen) return;
        event.preventDefault();
        onRouteMenuOpenChange(false);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
      }}
    >
      {routeMenuOpen ? (
        <section
          id={`${variant}-studio-route-drawer`}
          className="studio-route-drawer"
          aria-label={`${variant === "sql" ? "SQL" : "Python"} rotası`}
        >
          <div className="studio-route-drawer-head">
            <div>
              <span>{variant === "sql" ? "SQL ROTASI" : "PYTHON ROTASI"}</span>
              <strong>Tüm çalışmalar açık</strong>
            </div>
            <small>
              {activeIndex + 1}/{totalCount}
            </small>
          </div>
          <div
            ref={listRef}
            className="studio-route-list"
            role="list"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                onRouteMenuOpenChange(false);
                triggerRef.current?.focus();
                return;
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                moveFocus(focusedIndex + 1);
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                moveFocus(focusedIndex - 1);
              }
              if (event.key === "Home") {
                event.preventDefault();
                moveFocus(0);
              }
              if (event.key === "End") {
                event.preventDefault();
                moveFocus(flatTasks.length - 1);
              }
            }}
          >
            {modules.map((module) => (
              <section key={module.id} className="studio-route-group">
                <h3>
                  <span>{String(module.order).padStart(2, "0")}</span>
                  {module.title}
                </h3>
                <div>
                  {module.tasks.map((routeTask) => {
                    const routeTaskType = routeTask.type ?? "case";
                    const routeTaskPresentation =
                      taskTypePresentation(routeTaskType);
                    const flatIndex = flatTasks.findIndex(
                      (candidate) => candidate.id === routeTask.id,
                    );
                    const active = routeTask.id === activeTaskId;
                    return (
                      <button
                        key={routeTask.id}
                        ref={(node) => {
                          taskRefs.current[flatIndex] = node;
                        }}
                        type="button"
                        className="studio-route-task"
                        data-status={routeTask.status}
                        data-type={routeTaskType}
                        aria-current={active ? "page" : undefined}
                        tabIndex={focusedIndex === flatIndex ? 0 : -1}
                        onFocus={() => setFocusedIndex(flatIndex)}
                        onClick={() => selectTask(routeTask.id)}
                      >
                        <span className="studio-route-status">
                          <StatusMark status={routeTask.status} />
                          <span className="sr-only">
                            {statusLabel(routeTask.status)}
                          </span>
                        </span>
                        <span className="studio-route-number">
                          {String(routeTask.index + 1).padStart(2, "0")}
                        </span>
                        <span className="studio-route-kind" aria-hidden="true">
                          <DrillRouteIcon type={routeTaskType} />
                        </span>
                        <strong>{routeTask.title}</strong>
                        <small>
                          {routeTask.scored === false
                            ? "—"
                            : routeTask.status === "completed"
                              ? `${routeTask.score ?? 0}/10`
                              : "—"}
                        </small>
                        {isDrillTaskType(routeTaskType) ? (
                          <span className="sr-only">
                            {routeTaskPresentation.badge} · puanlanmaz
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      ) : null}

      <div className="studio-action-row">
        <button
          type="button"
          className="studio-action-previous"
          aria-label="Önceki çalışma"
          aria-disabled={!previousTaskId}
          onClick={() => previousTaskId && onSelectTask(previousTaskId)}
        >
          <span className="studio-action-desktop-label">← Önceki çalışma</span>
          <span className="studio-action-mobile-label" aria-hidden="true">
            ←
          </span>
        </button>

        <button
          ref={triggerRef}
          type="button"
          className="studio-route-trigger"
          aria-label={`Rota · ${activePresentation.label} ${activeIndex + 1}/${totalCount}`}
          aria-expanded={routeMenuOpen}
          aria-controls={`${variant}-studio-route-drawer`}
          onClick={() => onRouteMenuOpenChange(!routeMenuOpen)}
        >
          <Layers3 size={15} aria-hidden="true" />
          <span className="studio-action-desktop-label">
            Rota · {activePresentation.label} {activeIndex + 1}/{totalCount}
          </span>
          <span className="studio-action-mobile-label" aria-hidden="true">
            {activeIndex + 1}/{totalCount}
          </span>
          <ChevronUp
            size={14}
            className={routeMenuOpen ? "is-open" : ""}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          className="studio-action-next"
          aria-label={
            nextTaskId
              ? "Sonraki çalışma"
              : currentTaskCorrect
                ? "Rotayı tamamla"
                : "Rota özeti"
          }
          onClick={() =>
            nextTaskId ? onSelectTask(nextTaskId) : onCompleteRoute()
          }
        >
          <span className="studio-action-desktop-label">
            {nextTaskId
              ? "Sonraki çalışma →"
              : currentTaskCorrect
                ? "Rotayı tamamla →"
                : "Rota özeti →"}
          </span>
          <span className="studio-action-mobile-label" aria-hidden="true">
            {nextTaskId ? "Sonraki →" : "Özet →"}
          </span>
        </button>
      </div>

      <div className="studio-shortcut-row" aria-hidden="true">
        <span>⌘/Ctrl ↵ Çalıştır</span>
        <span>⇧ ⌘/Ctrl ←/→ Çalışma</span>
        <span>⌘/Ctrl K Rota</span>
      </div>
    </nav>
  );
}

interface StudioResultStripProps {
  status: "correct" | "wrong";
  summary: string;
  detail?: string;
}

export function StudioResultStrip({
  status,
  summary,
  detail,
}: StudioResultStripProps) {
  const fullMessage = `${status === "correct" ? "Doğru" : "Eşleşmedi"} — ${summary}${detail ? ` · ${detail}` : ""}`;
  return (
    <div
      className={`studio-result-strip ${status}`}
      role="status"
      aria-label={fullMessage}
    >
      <span aria-hidden="true">{status === "correct" ? "✓" : "✕"}</span>
      <strong>{status === "correct" ? "Doğru" : "Eşleşmedi"}</strong>
      <span aria-hidden="true">—</span>
      <span className="studio-result-strip-summary">{summary}</span>
      {detail ? (
        <>
          <span aria-hidden="true">·</span>
          <small>{detail}</small>
        </>
      ) : null}
    </div>
  );
}
