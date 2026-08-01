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
 * Builds a strict prefix lock: the first module is always open and each later
 * module opens only after every task in every preceding module is complete.
 * Completion data in a locked later module is intentionally left untouched.
 */
export function buildModuleAccessStates<
  Module extends ModuleAccessModule,
  Task extends ModuleAccessTask,
>(
  modules: readonly Module[],
  tasks: readonly Task[],
  taskProgress: TaskCompletionById,
): ModuleAccessState[] {
  let firstIncompleteModule: BlockingModule | undefined;

  return modules.map((module, index) => {
    const moduleTasks = tasks.filter((task) => task.moduleId === module.id);
    const isComplete = moduleTasks.every(
      (task) => taskProgress[task.id]?.completed === true,
    );
    const isUnlocked = index === 0 || firstIncompleteModule === undefined;
    const state: ModuleAccessState = {
      moduleId: module.id,
      isUnlocked,
      isComplete,
      ...(!isUnlocked && firstIncompleteModule
        ? { blockingModule: firstIncompleteModule }
        : {}),
    };

    if (!isComplete && !firstIncompleteModule) {
      firstIncompleteModule = { id: module.id, title: module.title };
    }

    return state;
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

/** Resolves a requested task without ever discarding stored later progress. */
export function resolveAccessibleTask<
  Module extends ModuleAccessModule,
  Task extends ModuleAccessTask,
>(
  requestedTaskId: string | undefined,
  modules: readonly Module[],
  tasks: readonly Task[],
  taskProgress: TaskCompletionById,
): TaskAccessResolution<Task> {
  const requestedTask = tasks.find((task) => task.id === requestedTaskId);
  const accessStates = buildModuleAccessStates(modules, tasks, taskProgress);
  const accessByModuleId = new Map(
    accessStates.map((state) => [state.moduleId, state]),
  );
  const requestedAccess = requestedTask
    ? accessByModuleId.get(requestedTask.moduleId)
    : undefined;

  if (requestedTask && requestedAccess?.isUnlocked) {
    return {
      task: requestedTask,
      requestedTask,
      wasRedirected: false,
    };
  }

  const fallback =
    findFirstAccessibleIncompleteTask(modules, tasks, taskProgress) ??
    modules
      .filter((module) => accessByModuleId.get(module.id)?.isUnlocked)
      .flatMap((module) => tasks.filter((task) => task.moduleId === module.id))
      .at(-1) ??
    tasks[0];

  return {
    task: fallback,
    requestedTask,
    wasRedirected: Boolean(
      requestedTask && requestedAccess && !requestedAccess.isUnlocked,
    ),
    ...(requestedAccess?.blockingModule
      ? { blockingModule: requestedAccess.blockingModule }
      : {}),
  };
}
