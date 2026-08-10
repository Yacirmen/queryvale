import type { ProgressState, TaskProgress } from "./progressStore";

export interface ResumeTaskCandidate {
  id: string;
  prerequisites: readonly string[];
  nextTaskId: string | null;
  /** Optional for legacy callers; present on current SQL curriculum tasks. */
  routeOrder?: number;
}

export type ResumeTaskReason =
  | "new-learner"
  | "last-opened-location"
  | "last-opened-activity"
  | "recovered-activity"
  | "next-after-completion"
  | "first-available-incomplete"
  | "first-incomplete"
  | "curriculum-complete"
  | "empty-curriculum";

export interface ResumeTaskSelection<
  Task extends ResumeTaskCandidate = ResumeTaskCandidate,
> {
  task: Task | undefined;
  isReturningLearner: boolean;
  shouldShowOnboarding: boolean;
  reason: ResumeTaskReason;
}

function hasStoredTaskActivity(task: TaskProgress | undefined): boolean {
  return Boolean(
    task &&
    (task.completed ||
      task.attempts > 0 ||
      task.hintsUsed.length > 0 ||
      task.lastQuery.trim().length > 0),
  );
}

/**
 * Selects the most useful task to resume without trusting `lastOpenedTaskId`
 * alone. Older landing CTAs could overwrite that pointer with the first task,
 * so stored work remains the stronger recovery signal.
 */
export function selectResumeTask<Task extends ResumeTaskCandidate>(
  tasks: readonly Task[],
  progress: ProgressState,
): ResumeTaskSelection<Task> {
  const routeTasks = [...tasks].toSorted(
    (left, right) => (left.routeOrder ?? 0) - (right.routeOrder ?? 0),
  );
  const firstTask = routeTasks[0];
  if (!firstTask) {
    return {
      task: undefined,
      isReturningLearner: false,
      shouldShowOnboarding: true,
      reason: "empty-curriculum",
    };
  }

  const taskById = new Map(routeTasks.map((task) => [task.id, task]));
  const hasActivity = (task: Task) =>
    hasStoredTaskActivity(progress.tasks[task.id]) ||
    Boolean(progress.evidenceByTaskId[task.id]);
  const activeTasks = routeTasks.filter(hasActivity);
  const lastOpened = taskById.get(progress.lastOpenedTaskId);
  const hasSavedLocation = Boolean(
    lastOpened && lastOpened.id !== firstTask.id,
  );
  const isReturningLearner = activeTasks.length > 0 || hasSavedLocation;

  if (!isReturningLearner) {
    return {
      task: firstTask,
      isReturningLearner: false,
      shouldShowOnboarding: true,
      reason: "new-learner",
    };
  }

  const isCompleted = (task: Task) =>
    progress.tasks[task.id]?.completed === true;
  const nextIncompleteAfter = (task: Task) => {
    const currentIndex = routeTasks.findIndex(
      (candidate) => candidate.id === task.id,
    );
    const nextTask = routeTasks[currentIndex + 1];
    return nextTask && !isCompleted(nextTask) ? nextTask : undefined;
  };
  const returnLastOpened = (task: Task) => {
    if (!isCompleted(task)) {
      return returning(
        task,
        hasActivity(task) ? "last-opened-activity" : "last-opened-location",
      );
    }
    const nextTask = nextIncompleteAfter(task);
    return nextTask ? returning(nextTask, "next-after-completion") : undefined;
  };

  if (
    lastOpened &&
    (progress.lastOpenedTaskIdTrusted || lastOpened.id !== firstTask.id)
  ) {
    const selection = returnLastOpened(lastOpened);
    if (selection) return selection;
  }

  if (!progress.lastOpenedTaskIdTrusted) {
    const recoveredAnchor = activeTasks.findLast(
      (task) => task.id !== firstTask.id,
    );
    if (recoveredAnchor) {
      if (!isCompleted(recoveredAnchor)) {
        return returning(recoveredAnchor, "recovered-activity");
      }
      const recoveredNext = nextIncompleteAfter(recoveredAnchor);
      if (recoveredNext) {
        return returning(recoveredNext, "next-after-completion");
      }
    }
  }

  if (lastOpened) {
    const selection = returnLastOpened(lastOpened);
    if (selection) return selection;
  }

  const furthestActiveIncomplete = activeTasks.findLast(
    (task) => !isCompleted(task),
  );
  if (furthestActiveIncomplete) {
    return returning(furthestActiveIncomplete, "recovered-activity");
  }

  const completionAnchor = activeTasks.findLast(isCompleted);
  const nextTask = completionAnchor
    ? nextIncompleteAfter(completionAnchor)
    : undefined;
  if (nextTask && !isCompleted(nextTask)) {
    return returning(nextTask, "next-after-completion");
  }

  const firstAvailableIncomplete = routeTasks.find(
    (task) =>
      !isCompleted(task) &&
      task.prerequisites.every(
        (prerequisite) => progress.tasks[prerequisite]?.completed,
      ),
  );
  if (firstAvailableIncomplete) {
    return returning(firstAvailableIncomplete, "first-available-incomplete");
  }

  const firstIncomplete = routeTasks.find((task) => !isCompleted(task));
  if (firstIncomplete) {
    return returning(firstIncomplete, "first-incomplete");
  }

  return returning(routeTasks.at(-1) ?? firstTask, "curriculum-complete");
}

function returning<Task extends ResumeTaskCandidate>(
  task: Task,
  reason: ResumeTaskReason,
): ResumeTaskSelection<Task> {
  return {
    task,
    isReturningLearner: true,
    shouldShowOnboarding: false,
    reason,
  };
}
