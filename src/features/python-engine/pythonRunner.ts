import type { PyodideAPI } from "pyodide";
import {
  isPythonExecutionResult,
  MAX_PYTHON_ERROR_MESSAGE_CHARS,
  MAX_PYTHON_RESULT_CELL_CHARS,
  MAX_PYTHON_RESULT_COLUMN_CHARS,
  MAX_PYTHON_RESULT_COLUMNS,
  MAX_PYTHON_RESULT_DTYPE_CHARS,
  MAX_PYTHON_RESULT_JSON_CHARS,
  MAX_PYTHON_RESULT_ROWS,
  MAX_PYTHON_STDOUT_CHARS,
  MAX_PYTHON_TRACEBACK_CHARS,
  type PythonExecutionResult,
  type PythonRunInput,
} from "./types";

const PYTHON_RUNNER = String.raw`
import json
import math
import traceback
import builtins
from contextlib import redirect_stdout, redirect_stderr

import numpy as np
import pandas as pd

_started = __import__("time").perf_counter()

class _LimitedTextIO:
    encoding = "utf-8"

    def __init__(self, limit):
        self._limit = max(0, int(limit))
        self._parts = []
        self._size = 0

    def write(self, value):
        text = str(value)
        remaining = self._limit - self._size
        if remaining > 0:
            part = text[:remaining]
            self._parts.append(part)
            self._size += len(part)
        return len(text)

    def flush(self):
        return None

    def isatty(self):
        return False

    def getvalue(self):
        return "".join(self._parts)

_stdout = _LimitedTextIO(max_stdout_chars)
_stderr = _LimitedTextIO(max_stdout_chars)
_scope = {
    "pd": pd,
    "np": np,
    "__name__": "__main__",
    "__builtins__": dict(vars(builtins)),
}
_tables = json.loads(dataset_json)
for _table in _tables:
    _scope[_table["variableName"]] = pd.DataFrame(_table["rows"])

def _bounded_text(value, limit):
    return str(value)[:max(0, int(limit))]

def _safe_cell(value):
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(value, np.generic):
        value = value.item()
    if isinstance(value, bool) or value is None:
        return value
    if isinstance(value, int):
        return value if abs(value) <= 9007199254740991 else _bounded_text(value, max_result_cell_chars)
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if hasattr(value, "isoformat"):
        return _bounded_text(value.isoformat(), max_result_cell_chars)
    return _bounded_text(value, max_result_cell_chars)

try:
    with redirect_stdout(_stdout), redirect_stderr(_stderr):
        exec(compile(learner_code, "analysis.py", "exec"), _scope)
    if result_variable not in _scope:
        raise NameError(f"Beklenen çıktı değişkeni oluşturulmadı: {result_variable}")
    _value = _scope[result_variable]
    if isinstance(_value, pd.Series):
        _value = _value.to_frame()
    if isinstance(_value, pd.DataFrame):
        if len(_value.columns) > max_result_columns:
            raise ValueError(f"Çıktı en fazla {max_result_columns} kolon içerebilir")
        if len(_value) > max_result_rows:
            raise ValueError(f"Çıktı en fazla {max_result_rows} satır içerebilir")
        _artifact = {
            "kind": "table",
            "columns": [
                _bounded_text(column, max_result_column_chars)
                for column in _value.columns.tolist()
            ],
            "dtypes": [
                _bounded_text(dtype, max_result_dtype_chars)
                for dtype in _value.dtypes.tolist()
            ],
            "rows": [
                [_safe_cell(cell) for cell in row]
                for row in _value.itertuples(index=False, name=None)
            ],
            "rowCount": int(len(_value)),
        }
    else:
        _artifact = {"kind": "scalar", "value": _safe_cell(_value)}
    _payload = {
        "kind": "success",
        "artifact": _artifact,
        "stdout": (_stdout.getvalue() + _stderr.getvalue())[:max_stdout_chars],
        "durationMs": round((__import__("time").perf_counter() - _started) * 1000, 1),
    }
except BaseException as _error:
    _payload = {
        "kind": "execution-error",
        "message": _bounded_text(f"{type(_error).__name__}: {_error}", max_error_message_chars),
        "traceback": traceback.format_exc()[-max_traceback_chars:],
        "stdout": (_stdout.getvalue() + _stderr.getvalue())[:max_stdout_chars],
        "durationMs": round((__import__("time").perf_counter() - _started) * 1000, 1),
    }

_serialized = json.dumps(_payload, ensure_ascii=False, allow_nan=False)
if len(_serialized) > max_result_json_chars:
    _payload = {
        "kind": "execution-error",
        "message": "ValueError: Çıktı güvenli aktarım boyutu sınırını aşıyor",
        "traceback": "",
        "stdout": (_stdout.getvalue() + _stderr.getvalue())[:max_stdout_chars],
        "durationMs": round((__import__("time").perf_counter() - _started) * 1000, 1),
    }
    _serialized = json.dumps(_payload, ensure_ascii=False, allow_nan=False)

_serialized
`;

export type PythonAnalysisInput = Pick<
  PythonRunInput,
  "code" | "datasets" | "resultVariable"
>;

/** Executes one isolated learner namespace and returns only bounded JSON data. */
export async function executePythonAnalysis(
  runtime: PyodideAPI,
  input: PythonAnalysisInput,
): Promise<PythonExecutionResult> {
  const dictionaryFactory = runtime.globals.get("dict");
  const globals = dictionaryFactory();
  dictionaryFactory.destroy();
  try {
    globals.set("learner_code", input.code);
    globals.set("dataset_json", JSON.stringify(input.datasets));
    globals.set("result_variable", input.resultVariable);
    globals.set("max_result_rows", MAX_PYTHON_RESULT_ROWS);
    globals.set("max_result_columns", MAX_PYTHON_RESULT_COLUMNS);
    globals.set("max_result_cell_chars", MAX_PYTHON_RESULT_CELL_CHARS);
    globals.set("max_result_column_chars", MAX_PYTHON_RESULT_COLUMN_CHARS);
    globals.set("max_result_dtype_chars", MAX_PYTHON_RESULT_DTYPE_CHARS);
    globals.set("max_result_json_chars", MAX_PYTHON_RESULT_JSON_CHARS);
    globals.set("max_stdout_chars", MAX_PYTHON_STDOUT_CHARS);
    globals.set("max_traceback_chars", MAX_PYTHON_TRACEBACK_CHARS);
    globals.set("max_error_message_chars", MAX_PYTHON_ERROR_MESSAGE_CHARS);
    const serialized = await runtime.runPythonAsync(PYTHON_RUNNER, { globals });
    const parsed: unknown = JSON.parse(String(serialized));
    if (!isPythonExecutionResult(parsed)) {
      throw new Error("Python çalışma ortamı geçersiz bir sonuç üretti.");
    }
    return parsed;
  } finally {
    globals.destroy();
  }
}
