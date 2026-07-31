export type SqlScalar =
  | string
  | number
  | bigint
  | boolean
  | Date
  | Uint8Array
  | null;

export type SqlRow = Record<string, SqlScalar>;

export interface QueryExecutionResult {
  columns: string[];
  rows: SqlRow[];
  rowCount: number;
  affectedRows: number;
  truncated: boolean;
  durationMs: number;
}

export interface TaskDatabaseConfig {
  taskId: string;
  setupSql: string;
  forbiddenOperations?: readonly string[];
  maxRows?: number;
  timeoutMs?: number;
}

export type TaskDatabaseState =
  | "idle"
  | "initializing"
  | "ready"
  | "running"
  | "resetting"
  | "failed"
  | "disposed";

