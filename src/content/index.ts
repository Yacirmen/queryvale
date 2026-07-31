export {
  assertCurriculumIsValid,
  curriculum,
  default,
  getModuleById,
  getTaskById,
  getTaskBySlug,
  moduleById,
  modules,
  taskById,
  tasks,
} from "./curriculum";

export type {
  CurriculumModule,
  Difficulty,
  ForbiddenOperation,
  LessonTask,
  SchemaColumn,
  SQLConcept,
  SqlScalar,
  Task,
  TaskSampleData,
  TaskSchema,
  TaskTableSchema,
  ValidationMode,
  ValidationOptions,
} from "../types/lesson";
