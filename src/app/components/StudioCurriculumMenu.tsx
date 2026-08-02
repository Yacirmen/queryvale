"use client";

import { Check, CheckCircle2, ChevronDown, Layers3, Play } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

export interface StudioCurriculumTaskItem {
  id: string;
  title: string;
  meta: string;
  accessible: boolean;
  complete: boolean;
}

export interface StudioCurriculumModuleItem {
  id: string;
  order: number;
  title: string;
  status: string;
  complete: boolean;
  tasks: StudioCurriculumTaskItem[];
}

interface StudioCurriculumMenuProps {
  variant: "sql" | "python";
  label: string;
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  activeTaskId: string;
  modules: StudioCurriculumModuleItem[];
  onSelectTask: (taskId: string) => void;
}

export function StudioCurriculumMenu({
  variant,
  label,
  title,
  subtitle,
  completedCount,
  totalCount,
  activeTaskId,
  modules,
  onSelectTask,
}: StudioCurriculumMenuProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const activeTaskRef = useRef<HTMLButtonElement>(null);
  const completionRate = totalCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  const revealActiveTask = useCallback(() => {
    if (!menuRef.current?.open) return;
    window.requestAnimationFrame(() => {
      activeTaskRef.current?.scrollIntoView?.({
        block: "nearest",
        inline: "nearest",
      });
    });
  }, []);

  const closeMenu = useCallback(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, []);

  useEffect(() => {
    const handleOutsidePointer = (event: PointerEvent) => {
      if (!menuRef.current?.open) return;
      if (
        event.target instanceof Node &&
        menuRef.current.contains(event.target)
      )
        return;
      closeMenu();
    };

    document.addEventListener("pointerdown", handleOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", handleOutsidePointer);
  }, [closeMenu]);

  return (
    <details
      ref={menuRef}
      className="studio-curriculum-menu"
      data-variant={variant}
      onToggle={revealActiveTask}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !menuRef.current?.open) return;
        event.preventDefault();
        closeMenu();
        summaryRef.current?.focus();
      }}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (
          nextTarget instanceof Node &&
          event.currentTarget.contains(nextTarget)
        )
          return;
        closeMenu();
      }}
    >
      <summary ref={summaryRef}>
        <Layers3 size={15} aria-hidden="true" />
        <span>{label}</span>
        <small>
          {completedCount}/{totalCount}
        </small>
        <ChevronDown size={14} aria-hidden="true" />
      </summary>

      <div className="studio-curriculum-popover">
        <div className="studio-curriculum-head">
          <div>
            <strong>{title}</strong>
            <span>{subtitle}</span>
          </div>
          <b>{completionRate}%</b>
        </div>
        <div
          className="studio-curriculum-progress"
          role="progressbar"
          aria-label={`${label} yüzde ${completionRate} tamamlandı`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionRate}
        >
          <span style={{ width: `${completionRate}%` }} />
        </div>

        <div className="studio-module-list">
          {modules.map((module) => (
            <details
              key={module.id}
              open={module.tasks.some((task) => task.id === activeTaskId)}
            >
              <summary>
                <span>{String(module.order).padStart(2, "0")}</span>
                <div>
                  <strong>{module.title}</strong>
                  <small>{module.status}</small>
                </div>
                {module.complete ? (
                  <CheckCircle2 size={15} aria-label="Tamamlandı" />
                ) : null}
              </summary>
              <div>
                {module.tasks.map((task) => {
                  const active = task.id === activeTaskId;
                  return (
                    <button
                      key={task.id}
                      ref={active ? activeTaskRef : undefined}
                      type="button"
                      className={active ? "active" : ""}
                      disabled={!task.accessible}
                      onClick={() => {
                        closeMenu();
                        if (active) {
                          summaryRef.current?.focus();
                          return;
                        }
                        onSelectTask(task.id);
                      }}
                      aria-current={active ? "page" : undefined}
                    >
                      <span aria-hidden="true">
                        {task.complete ? (
                          <Check size={12} />
                        ) : (
                          <Play size={10} />
                        )}
                      </span>
                      <div>
                        <strong>{task.title}</strong>
                        <small>{task.meta}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </div>
    </details>
  );
}
