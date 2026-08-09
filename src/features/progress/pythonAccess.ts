import type {
  PythonCurriculumModule,
  PythonLessonTask,
} from "../../types/pythonLesson";
import type { BlockingModule, TaskCompletionById } from "./moduleAccess";

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
  void task;
  void modules;
  void tasks;
  void progress;
  return true;
}

export function resolveAccessiblePythonTask(
  requestedTaskId: string | undefined,
  _modules: readonly PythonCurriculumModule[],
  tasks: readonly PythonLessonTask[],
  progress: TaskCompletionById,
): PythonTaskAccessResolution {
  const requestedTask = tasks.find((task) => task.id === requestedTaskId);
  if (requestedTask) {
    return { task: requestedTask, requestedTask, wasRedirected: false };
  }

  const fallback =
    tasks.find((task) => progress[task.id]?.completed !== true) ??
    [...tasks].reverse().find((task) => progress[task.id]?.completed) ??
    tasks[0];

  return {
    task: fallback,
    requestedTask,
    wasRedirected: false,
  };
}
