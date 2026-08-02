import type {
  PythonCurriculumModule,
  PythonLessonTask,
} from "../../types/pythonLesson";
import {
  buildModuleAccessStates,
  type BlockingModule,
  type TaskCompletionById,
} from "./moduleAccess";

export interface PythonTaskAccessResolution {
  task: PythonLessonTask | undefined;
  requestedTask: PythonLessonTask | undefined;
  wasRedirected: boolean;
  blockingModule?: BlockingModule;
  blockingTask?: PythonLessonTask;
}

export function isPythonTaskAccessible(
  task: PythonLessonTask,
  modules: readonly PythonCurriculumModule[],
  tasks: readonly PythonLessonTask[],
  progress: TaskCompletionById,
): boolean {
  const moduleAccess = buildModuleAccessStates(modules, tasks, progress).find(
    (state) => state.moduleId === task.moduleId,
  );
  return Boolean(
    moduleAccess?.isUnlocked &&
    task.prerequisites.every(
      (prerequisiteId) => progress[prerequisiteId]?.completed === true,
    ),
  );
}

export function resolveAccessiblePythonTask(
  requestedTaskId: string | undefined,
  modules: readonly PythonCurriculumModule[],
  tasks: readonly PythonLessonTask[],
  progress: TaskCompletionById,
): PythonTaskAccessResolution {
  const requestedTask = tasks.find((task) => task.id === requestedTaskId);
  const moduleAccess = buildModuleAccessStates(modules, tasks, progress);
  const moduleAccessById = new Map(
    moduleAccess.map((state) => [state.moduleId, state]),
  );
  const requestedModuleAccess = requestedTask
    ? moduleAccessById.get(requestedTask.moduleId)
    : undefined;
  const blockingTask = requestedTask?.prerequisites
    .map((id) => tasks.find((task) => task.id === id))
    .find((task) => task && progress[task.id]?.completed !== true);
  const requestedAccessible = Boolean(
    requestedTask && requestedModuleAccess?.isUnlocked && !blockingTask,
  );

  if (requestedTask && requestedAccessible) {
    return { task: requestedTask, requestedTask, wasRedirected: false };
  }

  const fallback =
    tasks.find(
      (task) =>
        moduleAccessById.get(task.moduleId)?.isUnlocked &&
        progress[task.id]?.completed !== true &&
        task.prerequisites.every((id) => progress[id]?.completed === true),
    ) ??
    [...tasks]
      .reverse()
      .find((task) => moduleAccessById.get(task.moduleId)?.isUnlocked) ??
    tasks[0];

  return {
    task: fallback,
    requestedTask,
    wasRedirected: Boolean(requestedTask && !requestedAccessible),
    ...(requestedModuleAccess?.blockingModule
      ? { blockingModule: requestedModuleAccess.blockingModule }
      : {}),
    ...(blockingTask ? { blockingTask } : {}),
  };
}
