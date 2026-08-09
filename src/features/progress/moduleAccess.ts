export interface ModuleAccessModule {
  id: string;
  title: string;
}

export interface ModuleAccessTask {
  id: string;
  moduleId: string;
}

export type TaskCompletionById = Record<
  string,
  { completed?: boolean } | undefined
>;

export interface BlockingModule {
  id: string;
  title: string;
}

export interface ModuleAccessState {
  moduleId: string;
  isUnlocked: boolean;
  isComplete: boolean;
  blockingModule?: BlockingModule;
}

export interface TaskAccessResolution<Task extends ModuleAccessTask> {
  task: Task | undefined;
  requestedTask: Task | undefined;
  wasRedirected: boolean;
  blockingModule?: BlockingModule;
}

/**
 * Builds progress metadata without using curriculum order as an access gate.
 * Module order remains the recommended sequence; every valid case stays open.
 */
export function buildModuleAccessStates<
  Module extends ModuleAccessModule,
  Task extends ModuleAccessTask,
>(
  modules: readonly Module[],
  tasks: readonly Task[],
  taskProgress: TaskCompletionById,
): ModuleAccessState[] {
  return modules.map((module) => {
    const moduleTasks = tasks.filter((task) => task.moduleId === module.id);
    const isComplete = moduleTasks.every(
      (task) => taskProgress[task.id]?.completed === true,
    );
    return {
      moduleId: module.id,
      isUnlocked: true,
      isComplete,
    };
  });
}

export function findFirstAccessibleIncompleteTask<
  Module extends ModuleAccessModule,
  Task extends ModuleAccessTask,
>(
  modules: readonly Module[],
  tasks: readonly Task[],
  taskProgress: TaskCompletionById,
): Task | undefined {
  const accessByModuleId = new Map(
    buildModuleAccessStates(modules, tasks, taskProgress).map((state) => [
      state.moduleId,
      state,
    ]),
  );

  for (const curriculumModule of modules) {
    if (!accessByModuleId.get(curriculumModule.id)?.isUnlocked) continue;
    const incompleteTask = tasks.find(
      (task) =>
        task.moduleId === curriculumModule.id &&
        taskProgress[task.id]?.completed !== true,
    );
    if (incompleteTask) return incompleteTask;
  }

  return undefined;
}

/** Resolves any valid task; curriculum order is guidance rather than a guard. */
export function resolveAccessibleTask<
  Module extends ModuleAccessModule,
  Task extends ModuleAccessTask,
>(
  requestedTaskId: string | undefined,
  _modules: readonly Module[],
  tasks: readonly Task[],
  taskProgress: TaskCompletionById,
): TaskAccessResolution<Task> {
  const requestedTask = tasks.find((task) => task.id === requestedTaskId);
  if (requestedTask) {
    return {
      task: requestedTask,
      requestedTask,
      wasRedirected: false,
    };
  }

  const fallback =
    tasks.find((task) => taskProgress[task.id]?.completed !== true) ??
    [...tasks].reverse().find((task) => taskProgress[task.id]?.completed) ??
    tasks[0];

  return {
    task: fallback,
    requestedTask,
    wasRedirected: false,
  };
}
