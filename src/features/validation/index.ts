export {
  evaluateQuery,
  valuesEqual,
} from "./evaluate-query";
export type {
  AliasPolicy,
  EvaluationOptions,
  EvaluationStatus,
  ExpectedRow,
  QueryEvaluation,
  QueryEvaluationInput,
  TextCasePolicy,
} from "./evaluate-query";
export { translateSqlError } from "./error-feedback";
export type { SqlErrorFeedback } from "./error-feedback";
export { evaluateLessonQuery } from "./lesson-evaluation";
export {
  checkRequiredConcepts,
  detectSqlConcepts,
  normalizeConceptName,
} from "./sql-concepts";
export type {
  RequiredConceptCheck,
  SqlConcept,
} from "./sql-concepts";
export {
  assertValidTaskCollection,
  validateTaskCollection,
  validateTaskDefinition,
} from "./task-content";
export type {
  ContentIssueSeverity,
  ContentValidationIssue,
} from "./task-content";
