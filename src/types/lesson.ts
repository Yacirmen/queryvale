export type SqlScalar = string | number | boolean | null;

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type ValidationMode =
  "result" | "result-and-concepts" | "schema" | "mutation";

/**
 * Ordered evaluation states returned by the lesson validator. Keeping this
 * union in the domain contract lets task content provide contextual coaching
 * without importing the validation implementation.
 */
export type EvaluationStatus =
  | "execution-error"
  | "columns-wrong"
  | "rows-wrong"
  | "order-wrong"
  | "required-concept-missing"
  | "correct";

export type SQLConcept =
  | "SELECT"
  | "DISTINCT"
  | "LIMIT"
  | "ORDER_BY"
  | "WHERE"
  | "COMPARISON"
  | "AND"
  | "OR"
  | "NOT"
  | "IN"
  | "BETWEEN"
  | "LIKE"
  | "IS_NULL"
  | "ALIAS"
  | "ARITHMETIC"
  | "STRING_FUNCTION"
  | "DATE_FUNCTION"
  | "CASE"
  | "CAST"
  | "COUNT"
  | "SUM"
  | "AVG"
  | "MIN"
  | "MAX"
  | "GROUP_BY"
  | "HAVING"
  | "CONDITIONAL_AGGREGATION"
  | "PRIMARY_KEY"
  | "FOREIGN_KEY"
  | "INNER_JOIN"
  | "LEFT_JOIN"
  | "MULTI_JOIN"
  | "SELF_JOIN"
  | "SUBQUERY"
  | "EXISTS"
  | "CTE"
  | "RECURSIVE_CTE"
  | "ROW_NUMBER"
  | "RANK"
  | "DENSE_RANK"
  | "LAG"
  | "LEAD"
  | "PARTITION_BY"
  | "RUNNING_TOTAL"
  | "MOVING_AVERAGE"
  | "CREATE_TABLE"
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "CONSTRAINT"
  | "TRANSACTION"
  | "NORMALIZATION"
  | "STAR_SCHEMA"
  | "DATA_MART"
  | "DATA_QUALITY"
  | "REPORTING";

export type ForbiddenOperation =
  | "DROP_DATABASE"
  | "DROP_TABLE"
  | "ALTER_TABLE"
  | "CREATE_TABLE"
  | "TRUNCATE"
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "SYSTEM_CATALOG_ACCESS"
  | "MULTIPLE_STATEMENTS";

export interface SchemaColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  primaryKey?: boolean;
  references?: {
    table: string;
    column: string;
  };
  description?: string;
}

export interface TaskTableSchema {
  name: string;
  description: string;
  columns: SchemaColumn[];
}

export interface TaskSchema {
  tables: TaskTableSchema[];
  relationships?: Array<{
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
    label?: string;
  }>;
}

export interface TaskSampleData {
  tableName: string;
  rows: Array<Record<string, SqlScalar>>;
}

export interface ValidationOptions {
  /** Absolute tolerance used while comparing finite numeric values. */
  numericTolerance: number;
  /** Whether returned column aliases must preserve letter casing. */
  columnNameCaseSensitive: boolean;
  /** Whether string cell values are compared case-sensitively. */
  textCaseSensitive: boolean;
  /** Whether leading and trailing whitespace is ignored for string cells. */
  trimText: boolean;
  /** Whether the returned column names must match expectedColumns. */
  aliasesMustMatch: boolean;
}

export interface TaskLearningBrief {
  /** The one transferable SQL idea the learner should practise. */
  conceptAnchor: string;
  /** What one row in the expected result represents. */
  outputGrain: string;
  /** Observable checks the learner can make without seeing the answer. */
  acceptanceChecks: string[];
  /** Dataset caveats that affect interpretation, such as NULL or duplicates. */
  dataNotes: string[];
}

export interface TaskCoachingEntry {
  title: string;
  checks: string[];
}

export type CoachingStatus = Exclude<EvaluationStatus, "correct">;

export type TaskCoaching = Record<CoachingStatus, TaskCoachingEntry>;

export interface TaskDebrief {
  steps: string[];
  whyItWorks: string;
  edgeCases: string[];
  workplaceImpact: string;
  transfer: {
    prompt: string;
    reveal: string;
  };
}

export interface LessonLearningContent {
  learningBrief: TaskLearningBrief;
  coaching: TaskCoaching;
  debrief: TaskDebrief;
}

export interface LessonTask extends LessonLearningContent {
  id: string;
  slug: string;
  moduleId: string;
  title: string;
  subtitle: string;
  scenario: string;
  objective: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  prerequisites: string[];
  concepts: SQLConcept[];
  setupSql: string;
  schema: TaskSchema;
  sampleRows: TaskSampleData[];
  expectedColumns: string[];
  validationMode: ValidationMode;
  expectedResult: SqlScalar[][];
  orderSensitive: boolean;
  requiredConcepts: SQLConcept[];
  forbiddenOperations: ForbiddenOperation[];
  validationOptions: ValidationOptions;
  hints: [string, string, string];
  /** A learner-visible, executable example revealed only on explicit request. */
  solutionSql: string;
  explanation: string;
  completionMessage: string;
  nextTaskId: string | null;
}

export interface CurriculumModule {
  id: string;
  slug: string;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  topics: string[];
  prerequisites: string[];
  tasks: LessonTask[];
}

/** Short alias for consumers that prefer the domain term used in the UI. */
export type Task = LessonTask;

export const DEFAULT_VALIDATION_OPTIONS: Readonly<ValidationOptions> = {
  numericTolerance: 0.0001,
  columnNameCaseSensitive: false,
  textCaseSensitive: true,
  trimText: true,
  aliasesMustMatch: true,
};

/**
 * Identity helpers preserve narrow literal values while checking the complete
 * content contract at compile time.
 */
export const defineTask = <T extends LessonTask>(task: T): T => task;

export const defineModule = <T extends CurriculumModule>(module: T): T =>
  module;
