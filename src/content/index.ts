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

export {
  analystJourneyChapters,
  analystJourneyModuleCount,
  analystJourneyTaskCount,
  buildAnalystJourneyProgress,
} from "./analystJourney";

export type {
  AnalystJourneyChapter,
  AnalystJourneyChapterId,
  AnalystJourneyChapterProgress,
  AnalystJourneyChapterStatus,
} from "./analystJourney";

export type {
  CoachingStatus,
  CurriculumModule,
  Difficulty,
  EvaluationStatus,
  ForbiddenOperation,
  LessonLearningContent,
  LessonTask,
  SchemaColumn,
  SQLConcept,
  SqlScalar,
  Task,
  TaskCoaching,
  TaskCoachingEntry,
  TaskDebrief,
  TaskLearningBrief,
  TaskSampleData,
  TaskSchema,
  TaskTableSchema,
  ValidationMode,
  ValidationOptions,
} from "../types/lesson";

export {
  getPythonModuleById,
  getPythonTaskById,
  pythonCurriculum,
  pythonModuleById,
  pythonModules,
  pythonTaskById,
  pythonTasks,
} from "./pythonCurriculum";

export type {
  PythonCurriculum,
  PythonCurriculumModule,
  PythonDataFrameDtype,
  PythonDatasetFixture,
  PythonDifficulty,
  PythonHint,
  PythonLessonTask,
  PythonPackage,
  PythonScalar,
  PythonTaskDebrief,
  PythonTaskTransfer,
} from "../types/pythonLesson";
