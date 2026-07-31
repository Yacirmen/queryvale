import type {
  QueryExecutionResult,
  SqlScalar,
} from "../sql-engine/types";
import { checkRequiredConcepts } from "./sql-concepts";

export type EvaluationStatus =
  | "execution-error"
  | "columns-wrong"
  | "rows-wrong"
  | "order-wrong"
  | "required-concept-missing"
  | "correct";

export type AliasPolicy = "exact" | "case-insensitive" | "ignore";
export type TextCasePolicy = "exact" | "case-insensitive";

export type ExpectedRow =
  | Readonly<Record<string, unknown>>
  | readonly unknown[];

export interface EvaluationOptions {
  aliasPolicy?: AliasPolicy;
  columnOrderSensitive?: boolean;
  textCasePolicy?: TextCasePolicy;
  trimText?: boolean;
  coerceNumericStrings?: boolean;
  numericAbsoluteTolerance?: number;
  numericRelativeTolerance?: number;
}

export interface QueryEvaluationInput {
  sql: string;
  actualResult?: Pick<QueryExecutionResult, "columns" | "rows">;
  executionError?: unknown;
  expectedColumns: readonly string[];
  expectedRows: readonly ExpectedRow[];
  orderSensitive?: boolean;
  requiredConcepts?: readonly string[];
  options?: EvaluationOptions;
}

export interface QueryEvaluation {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  status: EvaluationStatus;
  correct: boolean;
  title: string;
  message: string;
  expectedRowCount?: number;
  actualRowCount?: number;
  missingConcepts?: string[];
  expectedColumns?: string[];
  actualColumns?: string[];
}

interface ResolvedOptions {
  aliasPolicy: AliasPolicy;
  columnOrderSensitive: boolean;
  textCasePolicy: TextCasePolicy;
  trimText: boolean;
  coerceNumericStrings: boolean;
  numericAbsoluteTolerance: number;
  numericRelativeTolerance: number;
}

function resolveOptions(options: EvaluationOptions = {}): ResolvedOptions {
  return {
    aliasPolicy: options.aliasPolicy ?? "exact",
    columnOrderSensitive: options.columnOrderSensitive ?? true,
    textCasePolicy: options.textCasePolicy ?? "exact",
    trimText: options.trimText ?? true,
    coerceNumericStrings: options.coerceNumericStrings ?? true,
    numericAbsoluteTolerance: Math.max(
      0,
      options.numericAbsoluteTolerance ?? 1e-6,
    ),
    numericRelativeTolerance: Math.max(
      0,
      options.numericRelativeTolerance ?? 1e-9,
    ),
  };
}

function normalizedColumn(column: string, policy: AliasPolicy): string {
  const normalized = column.normalize("NFC").trim();
  return policy === "case-insensitive"
    ? normalized.toLocaleLowerCase("en-US")
    : normalized;
}

function consumeMatchingIndices(
  expected: readonly string[],
  actual: readonly string[],
  policy: AliasPolicy,
): number[] | null {
  if (expected.length !== actual.length) {
    return null;
  }
  if (policy === "ignore") {
    return expected.map((_, index) => index);
  }

  const consumed = new Set<number>();
  const indices: number[] = [];
  for (const expectedColumn of expected) {
    const normalizedExpected = normalizedColumn(expectedColumn, policy);
    const found = actual.findIndex(
      (actualColumn, index) =>
        !consumed.has(index) &&
        normalizedColumn(actualColumn, policy) === normalizedExpected,
    );
    if (found < 0) {
      return null;
    }
    consumed.add(found);
    indices.push(found);
  }
  return indices;
}

function columnMapping(
  expected: readonly string[],
  actual: readonly string[],
  options: ResolvedOptions,
): number[] | null {
  if (expected.length !== actual.length) {
    return null;
  }
  if (options.aliasPolicy === "ignore") {
    return expected.map((_, index) => index);
  }
  if (!options.columnOrderSensitive) {
    return consumeMatchingIndices(expected, actual, options.aliasPolicy);
  }

  const matches = expected.every(
    (column, index) =>
      normalizedColumn(column, options.aliasPolicy) ===
      normalizedColumn(actual[index] ?? "", options.aliasPolicy),
  );
  return matches ? expected.map((_, index) => index) : null;
}

function parseNumeric(value: unknown, options: ResolvedOptions): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "bigint") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  if (
    options.coerceNumericStrings &&
    typeof value === "string" &&
    /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())
  ) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function parseDate(value: unknown): number | null {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  }
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(trimmed)) {
    return null;
  }

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const withTimeSeparator = trimmed.includes("T")
    ? trimmed
    : trimmed.replace(" ", "T");
  const includesTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(
    withTimeSeparator,
  );
  const normalized = dateOnly
    ? `${trimmed}T00:00:00.000Z`
    : includesTimeZone
      ? withTimeSeparator
      : `${withTimeSeparator}Z`;
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function normalizedText(value: string, options: ResolvedOptions): string {
  let normalized = value.normalize("NFC").replace(/\r\n?/g, "\n");
  if (options.trimText) {
    normalized = normalized.trim();
  }
  if (options.textCasePolicy === "case-insensitive") {
    normalized = normalized.toLocaleLowerCase("tr-TR");
  }
  return normalized;
}

function byteArraysEqual(left: Uint8Array, right: Uint8Array): boolean {
  return (
    left.byteLength === right.byteLength &&
    left.every((value, index) => value === right[index])
  );
}

export function valuesEqual(
  expected: unknown,
  actual: unknown,
  options: EvaluationOptions = {},
): boolean {
  return valuesEqualResolved(expected, actual, resolveOptions(options));
}

function valuesEqualResolved(
  expected: unknown,
  actual: unknown,
  options: ResolvedOptions,
): boolean {
  if (expected == null || actual == null) {
    return expected == null && actual == null;
  }

  const expectedNumeric = parseNumeric(expected, options);
  const actualNumeric = parseNumeric(actual, options);
  if (expectedNumeric !== null && actualNumeric !== null) {
    const difference = Math.abs(expectedNumeric - actualNumeric);
    const scale = Math.max(
      1,
      Math.abs(expectedNumeric),
      Math.abs(actualNumeric),
    );
    return (
      difference <= options.numericAbsoluteTolerance ||
      difference <= options.numericRelativeTolerance * scale
    );
  }

  const expectedDate = parseDate(expected);
  const actualDate = parseDate(actual);
  if (expectedDate !== null && actualDate !== null) {
    return expectedDate === actualDate;
  }

  if (typeof expected === "string" && typeof actual === "string") {
    return normalizedText(expected, options) === normalizedText(actual, options);
  }

  if (expected instanceof Uint8Array && actual instanceof Uint8Array) {
    return byteArraysEqual(expected, actual);
  }

  return expected === actual;
}

function expectedRowToArray(
  row: ExpectedRow,
  expectedColumns: readonly string[],
): unknown[] {
  return Array.isArray(row)
    ? [...row]
    : expectedColumns.map(
        (column) => (row as Readonly<Record<string, unknown>>)[column],
      );
}

function actualRowToArray(
  row: Readonly<Record<string, SqlScalar>>,
  actualColumns: readonly string[],
  mapping: readonly number[],
): unknown[] {
  return mapping.map((actualIndex) => row[actualColumns[actualIndex]]);
}

function rowsEqual(
  expected: readonly unknown[],
  actual: readonly unknown[],
  options: ResolvedOptions,
): boolean {
  return (
    expected.length === actual.length &&
    expected.every((value, index) =>
      valuesEqualResolved(value, actual[index], options),
    )
  );
}

function orderedRowsEqual(
  expected: readonly (readonly unknown[])[],
  actual: readonly (readonly unknown[])[],
  options: ResolvedOptions,
): boolean {
  return (
    expected.length === actual.length &&
    expected.every((row, index) =>
      rowsEqual(row, actual[index] ?? [], options),
    )
  );
}

/**
 * Compares row multisets without sorting or stringifying, so tolerance policies
 * remain valid and duplicate cardinality is preserved.
 */
function unorderedRowsEqual(
  expected: readonly (readonly unknown[])[],
  actual: readonly (readonly unknown[])[],
  options: ResolvedOptions,
): boolean {
  if (expected.length !== actual.length) {
    return false;
  }

  const consumed = new Set<number>();
  return expected.every((expectedRow) => {
    const matchIndex = actual.findIndex(
      (actualRow, index) =>
        !consumed.has(index) &&
        rowsEqual(expectedRow, actualRow, options),
    );
    if (matchIndex < 0) {
      return false;
    }
    consumed.add(matchIndex);
    return true;
  });
}

function executionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return "Sorgu çalıştırılırken bilinmeyen bir hata oluştu.";
}

export function evaluateQuery(input: QueryEvaluationInput): QueryEvaluation {
  if (input.executionError || !input.actualResult) {
    return {
      level: 1,
      status: "execution-error",
      correct: false,
      title: "Sorgu çalışmadı",
      message: executionErrorMessage(input.executionError),
    };
  }

  const options = resolveOptions(input.options);
  const { columns: actualColumns, rows: actualRows } = input.actualResult;
  const mapping = columnMapping(
    input.expectedColumns,
    actualColumns,
    options,
  );

  if (!mapping) {
    return {
      level: 2,
      status: "columns-wrong",
      correct: false,
      title: "Kolonları yeniden kontrol et",
      message:
        "Sorgu çalıştı ancak beklenen çıktı kolonlarıyla eşleşmedi. SELECT listesini ve alias adlarını kontrol et.",
      expectedColumns: [...input.expectedColumns],
      actualColumns: [...actualColumns],
    };
  }

  const expectedRows = input.expectedRows.map((row) =>
    expectedRowToArray(row, input.expectedColumns),
  );
  const comparableActualRows = actualRows.map((row) =>
    actualRowToArray(row, actualColumns, mapping),
  );
  const orderedMatch = orderedRowsEqual(
    expectedRows,
    comparableActualRows,
    options,
  );
  const unorderedMatch = orderedMatch
    ? true
    : unorderedRowsEqual(expectedRows, comparableActualRows, options);

  if (!unorderedMatch) {
    return {
      level: 3,
      status: "rows-wrong",
      correct: false,
      title: "Sonuç satırları henüz doğru değil",
      message:
        expectedRows.length === comparableActualRows.length
          ? "Satır sayısı doğru görünüyor ancak en az bir değer beklenen sonuçtan farklı. Filtreleri, JOIN koşullarını ve hesaplamaları kontrol et."
          : `Beklenen ${expectedRows.length} satır yerine ${comparableActualRows.length} satır döndü. Filtre veya JOIN koşullarını gözden geçir.`,
      expectedRowCount: expectedRows.length,
      actualRowCount: comparableActualRows.length,
    };
  }

  if (input.orderSensitive && !orderedMatch) {
    return {
      level: 4,
      status: "order-wrong",
      correct: false,
      title: "Satırlar doğru, sıralama farklı",
      message:
        "Doğru satırları buldun. Görevin istediği sıralamayı üretmek için ORDER BY kolonlarını ve ASC/DESC yönlerini kontrol et.",
    };
  }

  const conceptCheck = checkRequiredConcepts(
    input.sql,
    input.requiredConcepts,
  );
  if (!conceptCheck.satisfied) {
    return {
      level: 5,
      status: "required-concept-missing",
      correct: false,
      title: "Sonuç doğru, yöntem eksik",
      message: `Sonucun doğru. Bu görevde ayrıca şu yaklaşımı kullanman bekleniyor: ${conceptCheck.missing.join(", ")}.`,
      missingConcepts: conceptCheck.missing,
    };
  }

  return {
    level: 6,
    status: "correct",
    correct: true,
    title: "Doğru çözüm",
    message:
      "Sorgun beklenen kolonları, satırları ve görevde istenen SQL yaklaşımını doğru biçimde karşılıyor.",
  };
}
