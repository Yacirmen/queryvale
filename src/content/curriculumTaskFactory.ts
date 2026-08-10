import {
  DEFAULT_VALIDATION_OPTIONS,
  defineTask,
  type ForbiddenOperation,
  type LessonLearningContent,
  type LessonTask,
  type ValidationOptions,
} from "../types/lesson";
import { createDefaultLearningContent } from "./createDefaultLearningContent";
import { AUTHORED_TASK_LEARNING_CONTENT } from "./learningContentCatalog";
import { getTaskSolution } from "./taskSolutions";

export const READ_ONLY_FORBIDDEN: ForbiddenOperation[] = [
  "DROP_DATABASE",
  "DROP_TABLE",
  "ALTER_TABLE",
  "CREATE_TABLE",
  "TRUNCATE",
  "INSERT",
  "UPDATE",
  "DELETE",
  "SYSTEM_CATALOG_ACCESS",
  "MULTIPLE_STATEMENTS",
];

export type AuthoredTask = Omit<
  LessonTask,
  | "solutionSql"
  | "validationOptions"
  | keyof LessonLearningContent
  | "routeOrder"
  | "type"
  | "scored"
> & {
  validationOptions?: Partial<ValidationOptions>;
  routeOrder?: number;
  type?: LessonTask["type"];
  scored?: boolean;
};

export const createTask = (task: AuthoredTask): LessonTask => {
  const { validationOptions, ...baseTask } = task;
  const type = task.type ?? "case";
  const learningContent =
    AUTHORED_TASK_LEARNING_CONTENT[task.id] ??
    createDefaultLearningContent(baseTask);

  return defineTask({
    ...baseTask,
    ...learningContent,
    // Legacy authored cases keep their current behaviour without repeating
    // these fields 52 times. Drill authors opt in explicitly; the factory
    // defaults every drill to unscored so a missing field cannot leak points.
    routeOrder: task.routeOrder ?? 0,
    type,
    scored: task.scored ?? type === "case",
    solutionSql: getTaskSolution(task.id),
    validationOptions: {
      ...DEFAULT_VALIDATION_OPTIONS,
      ...validationOptions,
    },
  });
};
