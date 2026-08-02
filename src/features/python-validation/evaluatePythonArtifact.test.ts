import { describe, expect, it } from "vitest";

import { pythonTasks } from "../../content/pythonCurriculum";
import type { PythonLessonTask, PythonScalar } from "../../types/pythonLesson";
import type {
  PythonExecutionResult,
  PythonTableArtifact,
} from "../python-engine";
import { evaluatePythonArtifact } from "./evaluatePythonArtifact";

function tableExecution(
  task: PythonLessonTask,
  overrides: Partial<PythonTableArtifact> = {},
): PythonExecutionResult {
  const columns = overrides.columns ?? [...task.expectedColumns];
  return {
    kind: "success",
    artifact: {
      kind: "table",
      columns,
      dtypes:
        overrides.dtypes ??
        columns.map((column) => task.expectedDtypes?.[column] ?? "object"),
      rows:
        overrides.rows ??
        task.expectedRows.map((row) => [...row] as PythonScalar[]),
      rowCount: overrides.rowCount ?? task.expectedRows.length,
    },
    stdout: "",
    durationMs: 1,
  };
}

describe("evaluatePythonArtifact", () => {
  const task = pythonTasks[1];

  it("separates execution and artifact shape failures", () => {
    expect(
      evaluatePythonArtifact(task, {
        kind: "execution-error",
        message: "NameError: result",
        traceback: "trace",
        stdout: "",
        durationMs: 1,
      }).status,
    ).toBe("execution-error");

    expect(
      evaluatePythonArtifact(task, {
        kind: "success",
        artifact: { kind: "scalar", value: 4 },
        stdout: "",
        durationMs: 1,
      }).status,
    ).toBe("artifact-wrong");
  });

  it("reports columns before dtype or row differences", () => {
    const execution = tableExecution(task, {
      columns: [...task.expectedColumns].reverse(),
      dtypes: ["object", "int64", "int64", "int64"],
      rows: [],
      rowCount: 0,
    });
    expect(evaluatePythonArtifact(task, execution).status).toBe(
      "columns-wrong",
    );
  });

  it("compares pandas dtype families instead of exact spellings", () => {
    const accepted = tableExecution(task, {
      dtypes: ["string[python]", "Int64", "int32", "int64"],
    });
    expect(evaluatePythonArtifact(task, accepted).status).toBe("correct");

    const rejected = tableExecution(task, {
      dtypes: ["object", "float64", "int64", "int64"],
    });
    expect(evaluatePythonArtifact(task, rejected).status).toBe("dtypes-wrong");
  });

  it("distinguishes a correct row set in the wrong order", () => {
    const execution = tableExecution(task, {
      rows: [...task.expectedRows].reverse(),
    });
    expect(evaluatePythonArtifact(task, execution).status).toBe("order-wrong");
  });

  it("accepts unordered rows when the task contract allows it", () => {
    const unorderedTask: PythonLessonTask = {
      ...task,
      orderSensitive: false,
    };
    const execution = tableExecution(unorderedTask, {
      rows: [...unorderedTask.expectedRows].reverse(),
    });
    expect(evaluatePythonArtifact(unorderedTask, execution).status).toBe(
      "correct",
    );
  });

  it("finds a valid non-greedy row match across tolerance windows", () => {
    const toleranceTask: PythonLessonTask = {
      ...task,
      expectedColumns: ["metric"],
      expectedRows: [[0.1], [0]],
      expectedDtypes: { metric: "float64" },
      numericTolerance: 0.11,
      orderSensitive: false,
    };
    const execution = tableExecution(toleranceTask, {
      columns: ["metric"],
      dtypes: ["float64"],
      rows: [[0], [0.2]],
      rowCount: 2,
    });
    expect(evaluatePythonArtifact(toleranceTask, execution).status).toBe(
      "correct",
    );
  });

  it("reports row differences after the schema contract passes", () => {
    const execution = tableExecution(task, {
      rows: [["unexpected", 1, 2, 3]],
      rowCount: 1,
    });
    expect(evaluatePythonArtifact(task, execution).status).toBe("rows-wrong");
  });
});
