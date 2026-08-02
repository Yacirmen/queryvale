import type {
  PythonDatasetFixture,
  PythonPackage,
  PythonScalar,
} from "../../types/pythonLesson";

export const PYODIDE_RUNTIME_VERSION = "0.29.4";
export const PYTHON_CONTENT_VERSION = 1;
export const MAX_PYTHON_CODE_CHARS = 200_000;
export const MAX_PYTHON_DATASETS = 8;
export const MAX_PYTHON_DATASET_ROWS = 2_000;
export const MAX_PYTHON_DATASET_COLUMNS = 128;
export const MAX_PYTHON_DATASET_CELL_CHARS = 20_000;
export const MAX_PYTHON_DATASET_CELLS = 50_000;
export const MAX_PYTHON_DATASET_TEXT_CHARS = 2_000_000;
export const MAX_PYTHON_RESULT_ROWS = 200;
export const MAX_PYTHON_RESULT_COLUMNS = 32;
export const MAX_PYTHON_RESULT_CELL_CHARS = 2_000;
export const MAX_PYTHON_RESULT_COLUMN_CHARS = 256;
export const MAX_PYTHON_RESULT_DTYPE_CHARS = 64;
export const MAX_PYTHON_RESULT_JSON_CHARS = 2_000_000;
export const MAX_PYTHON_STDOUT_CHARS = 20_000;
export const MAX_PYTHON_TRACEBACK_CHARS = 12_000;
export const MAX_PYTHON_ERROR_MESSAGE_CHARS = 2_000;
export const PYTHON_BOOT_TIMEOUT_MS = 90_000;
export const PYTHON_RUN_TIMEOUT_MS = 10_000;

export type PythonRuntimePhase =
  "loading-runtime" | "loading-packages" | "running";

export interface PythonTableArtifact {
  kind: "table";
  columns: string[];
  dtypes: string[];
  rows: PythonScalar[][];
  rowCount: number;
}

export interface PythonScalarArtifact {
  kind: "scalar";
  value: PythonScalar;
}

export type PythonArtifact = PythonTableArtifact | PythonScalarArtifact;

export interface PythonExecutionSuccess {
  kind: "success";
  artifact: PythonArtifact;
  stdout: string;
  durationMs: number;
}

export interface PythonExecutionError {
  kind: "execution-error";
  message: string;
  traceback: string;
  stdout: string;
  durationMs: number;
}

export type PythonExecutionResult =
  PythonExecutionSuccess | PythonExecutionError;

export interface PythonRunInput {
  taskId: string;
  code: string;
  datasets: readonly PythonDatasetFixture[];
  resultVariable: string;
  packages: readonly PythonPackage[];
  runtimeBaseUrl: string;
}

export interface PythonWorkerRunRequest extends PythonRunInput {
  type: "run";
  requestId: number;
  generation: number;
}

export interface PythonWorkerPhaseMessage {
  type: "phase";
  requestId: number;
  generation: number;
  phase: PythonRuntimePhase;
}

export interface PythonWorkerResultMessage {
  type: "result";
  requestId: number;
  generation: number;
  result: PythonExecutionResult;
}

export interface PythonWorkerSystemErrorMessage {
  type: "system-error";
  requestId: number;
  generation: number;
  message: string;
}

export type PythonWorkerRequest = PythonWorkerRunRequest;
export type PythonWorkerMessage =
  | PythonWorkerPhaseMessage
  | PythonWorkerResultMessage
  | PythonWorkerSystemErrorMessage;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isBoundedString(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.length <= maximum;
}

function isPythonScalar(value: unknown, maximumStringLength: number): boolean {
  return (
    value === null ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "string" && value.length <= maximumStringLength)
  );
}

function isDataset(value: unknown): value is PythonDatasetFixture {
  if (!isRecord(value)) return false;
  if (
    !isBoundedString(value.name, 200) ||
    !value.name.trim() ||
    !isBoundedString(value.variableName, 64) ||
    !/^[A-Za-z_][A-Za-z0-9_]*$/u.test(value.variableName) ||
    !isBoundedString(value.description, 2_000) ||
    !Array.isArray(value.rows) ||
    value.rows.length > MAX_PYTHON_DATASET_ROWS
  ) {
    return false;
  }
  return value.rows.every((row) => {
    if (!isRecord(row)) return false;
    const entries = Object.entries(row);
    return (
      entries.length <= MAX_PYTHON_DATASET_COLUMNS &&
      entries.every(
        ([column, cell]) =>
          Boolean(column) &&
          column.length <= MAX_PYTHON_RESULT_COLUMN_CHARS &&
          isPythonScalar(cell, MAX_PYTHON_DATASET_CELL_CHARS),
      )
    );
  });
}

function hasValidEnvelope(value: Record<string, unknown>): boolean {
  return (
    Number.isSafeInteger(value.requestId) &&
    (value.requestId as number) > 0 &&
    Number.isSafeInteger(value.generation) &&
    (value.generation as number) >= 0
  );
}

function isSafeRuntimeBaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.username === "" &&
      url.password === ""
    );
  } catch {
    return false;
  }
}

export function isPythonWorkerRequest(
  value: unknown,
): value is PythonWorkerRequest {
  if (!isRecord(value) || value.type !== "run" || !hasValidEnvelope(value)) {
    return false;
  }
  if (
    !isBoundedString(value.taskId, 200) ||
    !value.taskId.trim() ||
    value.taskId !== value.taskId.trim() ||
    !isBoundedString(value.code, MAX_PYTHON_CODE_CHARS) ||
    !value.code.trim() ||
    !Array.isArray(value.datasets) ||
    value.datasets.length > MAX_PYTHON_DATASETS ||
    !value.datasets.every(isDataset) ||
    value.datasets.reduce((total, dataset) => total + dataset.rows.length, 0) >
      MAX_PYTHON_DATASET_ROWS ||
    !isBoundedString(value.resultVariable, 64) ||
    !/^[A-Za-z_][A-Za-z0-9_]*$/u.test(value.resultVariable) ||
    !Array.isArray(value.packages) ||
    value.packages.length !== 1 ||
    value.packages[0] !== "pandas" ||
    !isBoundedString(value.runtimeBaseUrl, 2_048) ||
    !isSafeRuntimeBaseUrl(value.runtimeBaseUrl)
  ) {
    return false;
  }

  const variableNames = value.datasets.map((dataset) => dataset.variableName);
  const reservedNames = new Set([
    "pd",
    "np",
    "__name__",
    "__builtins__",
    value.resultVariable,
  ]);
  if (
    new Set(variableNames).size !== variableNames.length ||
    variableNames.some((name) => reservedNames.has(name))
  ) {
    return false;
  }

  let cellCount = 0;
  let textChars = 0;
  for (const dataset of value.datasets) {
    textChars += dataset.name.length + dataset.description.length;
    for (const row of dataset.rows) {
      for (const [column, cell] of Object.entries(row)) {
        cellCount += 1;
        textChars += column.length;
        if (typeof cell === "string") textChars += cell.length;
        if (
          cellCount > MAX_PYTHON_DATASET_CELLS ||
          textChars > MAX_PYTHON_DATASET_TEXT_CHARS
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

export function isPythonExecutionResult(
  value: unknown,
): value is PythonExecutionResult {
  if (!isRecord(value)) return false;
  if (
    !isBoundedString(value.stdout, MAX_PYTHON_STDOUT_CHARS) ||
    typeof value.durationMs !== "number" ||
    !Number.isFinite(value.durationMs) ||
    value.durationMs < 0 ||
    value.durationMs > 3_600_000
  ) {
    return false;
  }
  if (value.kind === "execution-error") {
    return (
      isBoundedString(value.message, MAX_PYTHON_ERROR_MESSAGE_CHARS) &&
      isBoundedString(value.traceback, MAX_PYTHON_TRACEBACK_CHARS)
    );
  }
  if (value.kind !== "success" || !isRecord(value.artifact)) return false;
  const artifact = value.artifact;
  if (artifact.kind === "scalar") {
    return isPythonScalar(artifact.value, MAX_PYTHON_RESULT_CELL_CHARS);
  }
  if (artifact.kind !== "table" || !Array.isArray(artifact.columns)) {
    return false;
  }
  const columns = artifact.columns;
  if (
    columns.length > MAX_PYTHON_RESULT_COLUMNS ||
    !columns.every((column) =>
      isBoundedString(column, MAX_PYTHON_RESULT_COLUMN_CHARS),
    ) ||
    !Array.isArray(artifact.dtypes) ||
    artifact.dtypes.length !== columns.length ||
    !artifact.dtypes.every((dtype) =>
      isBoundedString(dtype, MAX_PYTHON_RESULT_DTYPE_CHARS),
    ) ||
    !Array.isArray(artifact.rows)
  ) {
    return false;
  }
  const rows = artifact.rows;
  if (
    rows.length > MAX_PYTHON_RESULT_ROWS ||
    !rows.every(
      (row) =>
        Array.isArray(row) &&
        row.length === columns.length &&
        row.every((cell) => isPythonScalar(cell, MAX_PYTHON_RESULT_CELL_CHARS)),
    ) ||
    typeof artifact.rowCount !== "number" ||
    !Number.isInteger(artifact.rowCount) ||
    artifact.rowCount !== rows.length
  ) {
    return false;
  }
  return true;
}

export function isPythonWorkerMessage(
  value: unknown,
): value is PythonWorkerMessage {
  if (!isRecord(value) || !hasValidEnvelope(value)) return false;
  if (value.type === "phase") {
    return (
      value.phase === "loading-runtime" ||
      value.phase === "loading-packages" ||
      value.phase === "running"
    );
  }
  if (value.type === "result") return isPythonExecutionResult(value.result);
  return (
    value.type === "system-error" &&
    isBoundedString(value.message, MAX_PYTHON_TRACEBACK_CHARS)
  );
}

export class PythonRuntimeError extends Error {
  constructor(
    message: string,
    readonly code:
      "busy" | "cancelled" | "timeout" | "runtime-unavailable" | "input-limit",
  ) {
    super(message);
    this.name = "PythonRuntimeError";
  }
}
