import type { LessonTask } from "../../types/lesson";
import type { QueryExecutionResult } from "../sql-engine/types";
import {
  evaluateQuery,
  type EvaluationOptions,
  type QueryEvaluation,
} from "./evaluate-query";
import { translateSqlError } from "./error-feedback";

function lessonEvaluationOptions(task: LessonTask): EvaluationOptions {
  const validation = task.validationOptions;
  return {
    aliasPolicy: validation.aliasesMustMatch
      ? validation.columnNameCaseSensitive
        ? "exact"
        : "case-insensitive"
      : "ignore",
    textCasePolicy: validation.textCaseSensitive
      ? "exact"
      : "case-insensitive",
    trimText: validation.trimText,
    numericAbsoluteTolerance: validation.numericTolerance,
  };
}

export function evaluateLessonQuery(
  task: LessonTask,
  sql: string,
  result: Pick<QueryExecutionResult, "columns" | "rows"> | undefined,
  executionError?: unknown,
): QueryEvaluation {
  const feedback = executionError
    ? translateSqlError(executionError)
    : undefined;

  return evaluateQuery({
    sql,
    actualResult: result,
    executionError: feedback
      ? `${feedback.message} ${feedback.suggestion}`
      : undefined,
    expectedColumns: task.expectedColumns,
    expectedRows: task.expectedResult,
    orderSensitive: task.orderSensitive,
    requiredConcepts:
      task.validationMode === "result-and-concepts"
        ? task.requiredConcepts.map(String)
        : [],
    options: lessonEvaluationOptions(task),
  });
}

