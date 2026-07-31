import type { QueryExecutionResult } from "../sql-engine/types";

export const MAX_EVIDENCE_TASK_ID_CHARS = 200;
export const MAX_EVIDENCE_QUERY_CHARS = 200_000;
export const MAX_EVIDENCE_COLUMNS = 32;
export const MAX_EVIDENCE_COLUMN_NAME_CHARS = 256;
export const MAX_EVIDENCE_PREVIEW_ROWS = 10;
export const MAX_EVIDENCE_CELL_CHARS = 10_000;
export const MAX_EVIDENCE_ROW_COUNT = 1_000_000;

export interface VerifiedRunSnapshot {
  taskId: string;
  verifiedAt: string;
  query: string;
  columns: string[];
  previewRows: string[][];
  rowCount: number;
  truncated: boolean;
}

function characterCount(value: string): number {
  return Array.from(value).length;
}

function limitText(value: string, maximum: number): string {
  const characters = Array.from(value);
  if (characters.length <= maximum) return value;
  if (maximum <= 1) return characters.slice(0, maximum).join("");
  return `${characters.slice(0, maximum - 1).join("")}…`;
}

function isValidTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 64 &&
    Number.isFinite(Date.parse(value))
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? "Geçersiz tarih"
      : value.toISOString();
  }
  if (value instanceof Uint8Array) return `[${value.byteLength} bayt]`;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint" ||
    typeof value === "boolean"
  ) {
    return limitText(String(value), MAX_EVIDENCE_CELL_CHARS);
  }

  try {
    return limitText(JSON.stringify(value), MAX_EVIDENCE_CELL_CHARS);
  } catch {
    return limitText(String(value), MAX_EVIDENCE_CELL_CHARS);
  }
}

/**
 * Converts a successful SQL execution into a small, JSON-safe display record.
 * The snapshot is evidence of the evaluated run, not a second database dump.
 */
export function createVerifiedRunSnapshot(
  taskId: string,
  query: string,
  execution: Pick<
    QueryExecutionResult,
    "columns" | "rows" | "rowCount" | "truncated"
  >,
  verifiedAt = new Date().toISOString(),
): VerifiedRunSnapshot {
  const normalizedTaskId = taskId.trim();
  if (
    !normalizedTaskId ||
    characterCount(normalizedTaskId) > MAX_EVIDENCE_TASK_ID_CHARS
  ) {
    throw new Error("Kanıt kaydı için geçerli bir görev kimliği gereklidir.");
  }
  if (!query.trim()) {
    throw new Error("Kanıt kaydı için doğrulanmış sorgu gereklidir.");
  }
  if (!isValidTimestamp(verifiedAt)) {
    throw new Error("Kanıt kaydının doğrulama zamanı geçerli değil.");
  }

  const sourceColumns = execution.columns.slice(0, MAX_EVIDENCE_COLUMNS);
  const columns = sourceColumns.map((column) =>
    limitText(column, MAX_EVIDENCE_COLUMN_NAME_CHARS),
  );
  const previewRows = execution.rows
    .slice(0, MAX_EVIDENCE_PREVIEW_ROWS)
    .map((row) => sourceColumns.map((column) => formatCell(row[column])));
  const reportedRowCount = Number.isFinite(execution.rowCount)
    ? Math.max(0, Math.trunc(execution.rowCount))
    : previewRows.length;

  return {
    taskId: normalizedTaskId,
    verifiedAt,
    query: limitText(query, MAX_EVIDENCE_QUERY_CHARS),
    columns,
    previewRows,
    rowCount: Math.min(
      MAX_EVIDENCE_ROW_COUNT,
      Math.max(reportedRowCount, previewRows.length),
    ),
    truncated: Boolean(execution.truncated),
  };
}

export function isVerifiedRunSnapshot(
  value: unknown,
): value is VerifiedRunSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const snapshot = value as Partial<VerifiedRunSnapshot>;
  if (
    typeof snapshot.taskId !== "string" ||
    !snapshot.taskId.trim() ||
    snapshot.taskId !== snapshot.taskId.trim() ||
    characterCount(snapshot.taskId) > MAX_EVIDENCE_TASK_ID_CHARS ||
    !isValidTimestamp(snapshot.verifiedAt) ||
    typeof snapshot.query !== "string" ||
    !snapshot.query.trim() ||
    characterCount(snapshot.query) > MAX_EVIDENCE_QUERY_CHARS ||
    !Array.isArray(snapshot.columns) ||
    snapshot.columns.length > MAX_EVIDENCE_COLUMNS ||
    snapshot.columns.some(
      (column) =>
        typeof column !== "string" ||
        characterCount(column) > MAX_EVIDENCE_COLUMN_NAME_CHARS,
    ) ||
    !Array.isArray(snapshot.previewRows) ||
    snapshot.previewRows.length > MAX_EVIDENCE_PREVIEW_ROWS ||
    snapshot.previewRows.some(
      (row) =>
        !Array.isArray(row) ||
        row.length !== snapshot.columns?.length ||
        row.some(
          (cell) =>
            typeof cell !== "string" ||
            characterCount(cell) > MAX_EVIDENCE_CELL_CHARS,
        ),
    ) ||
    typeof snapshot.rowCount !== "number" ||
    !Number.isInteger(snapshot.rowCount) ||
    snapshot.rowCount < snapshot.previewRows.length ||
    snapshot.rowCount > MAX_EVIDENCE_ROW_COUNT ||
    typeof snapshot.truncated !== "boolean"
  ) {
    return false;
  }

  return true;
}
