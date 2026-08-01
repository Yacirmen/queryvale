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
    textCasePolicy: validation.textCaseSensitive ? "exact" : "case-insensitive",
    trimText: validation.trimText,
    numericAbsoluteTolerance: validation.numericTolerance,
  };
}

export function evaluateLessonQuery(
  task: LessonTask,
  sql: string,
  result: Pick<QueryExecutionResult, "columns" | "rows"> | undefined,
  executionError?: unknown,
  mutationVerificationResult?: Pick<QueryExecutionResult, "columns" | "rows">,
): QueryEvaluation {
  const feedback = executionError
    ? translateSqlError(executionError)
    : undefined;

  const visibleEvaluation = evaluateQuery({
    sql,
    actualResult: result,
    executionError: feedback
      ? `${feedback.message} ${feedback.suggestion}`
      : undefined,
    expectedColumns: task.expectedColumns,
    expectedRows: task.expectedResult,
    orderSensitive: task.orderSensitive,
    requiredConcepts:
      task.validationMode === "result-and-concepts" ||
      task.validationMode === "mutation"
        ? task.requiredConcepts.map(String)
        : [],
    options: lessonEvaluationOptions(task),
  });

  if (!visibleEvaluation.correct || !task.mutationVerification) {
    return visibleEvaluation;
  }

  if (!mutationVerificationResult) {
    return {
      level: 1,
      status: "execution-error",
      correct: false,
      title: "Değişiklik doğrulanamadı",
      message:
        "Sorgu bir sonuç döndürdü ancak gerçek tablo durumu doğrulanamadı. Görev verisini sıfırlayıp yeniden dene.",
    };
  }

  const verification = task.mutationVerification;
  const stateEvaluation = evaluateQuery({
    sql: verification.sql,
    actualResult: mutationVerificationResult,
    expectedColumns: verification.expectedColumns,
    expectedRows: verification.expectedResult,
    orderSensitive: verification.orderSensitive,
    requiredConcepts: [],
    options: lessonEvaluationOptions(task),
  });

  if (!stateEvaluation.correct) {
    return {
      level: 3,
      status: "rows-wrong",
      correct: false,
      title: "Görünen çıktı ile gerçek değişiklik uyuşmuyor",
      message:
        "RETURNING çıktısı beklenen biçimde görünse de tablodaki gerçek durum görev sözleşmesiyle eşleşmedi. Hedef koşulunu ve yazılan değeri kontrol et.",
      expectedRowCount: verification.expectedResult.length,
      actualRowCount: mutationVerificationResult.rows.length,
    };
  }

  return visibleEvaluation;
}
