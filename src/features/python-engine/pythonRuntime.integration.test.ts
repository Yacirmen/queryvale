// @vitest-environment jsdom

import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { loadPyodide, type PyodideAPI } from "pyodide";
import { beforeAll, describe, expect, it } from "vitest";

import { pythonCurriculum } from "../../content/pythonCurriculum";
import { evaluatePythonArtifact } from "../python-validation/evaluatePythonArtifact";
import { executePythonAnalysis } from "./pythonRunner";
import {
  MAX_PYTHON_RESULT_ROWS,
  MAX_PYTHON_STDOUT_CHARS,
  PYODIDE_RUNTIME_VERSION,
} from "./types";

const runtimeDirectory = resolve(
  process.cwd(),
  "public",
  "vendor",
  "pyodide",
  PYODIDE_RUNTIME_VERSION,
);
const localWheelPaths = existsSync(runtimeDirectory)
  ? readdirSync(runtimeDirectory)
      .filter((fileName) => fileName.endsWith(".whl"))
      .sort()
      .map((fileName) => resolve(runtimeDirectory, fileName))
  : [];
const hasPreparedPandasRuntime = localWheelPaths.some((wheelPath) =>
  /\/pandas-[^/]+\.whl$/u.test(wheelPath),
);

describe.skipIf(!hasPreparedPandasRuntime)(
  "Python curriculum with real Pyodide and pandas",
  () => {
    let runtime: PyodideAPI;

    beforeAll(async () => {
      // Node's Pyodide core comes from the pinned npm package. Prepared wheels
      // are loaded by absolute filesystem path so the test never hits a CDN or
      // creates a bogus `file:` directory inside the repository.
      runtime = await loadPyodide();
      await runtime.loadPackage(localWheelPaths, {
        messageCallback: () => undefined,
      });
    }, 60_000);

    it("contains the twelve production reference solutions", () => {
      expect(pythonCurriculum.tasks).toHaveLength(12);
    });

    it.each(pythonCurriculum.tasks.map((task) => [task.id, task] as const))(
      "%s evaluates its reference solution as correct",
      async (_taskId, task) => {
        const execution = await executePythonAnalysis(runtime, {
          code: task.solutionCode,
          datasets: task.datasets,
          resultVariable: task.resultVariable,
        });
        if (execution.kind === "execution-error") {
          throw new Error(
            `${task.id} reference solution failed: ${execution.message}\n${execution.traceback}`,
          );
        }

        const evaluation = evaluatePythonArtifact(task, execution);
        expect(
          evaluation.status,
          `${task.id}: ${evaluation.title} — ${evaluation.message}`,
        ).toBe("correct");
      },
      20_000,
    );

    it("isolates learner globals between executions", async () => {
      const first = await executePythonAnalysis(runtime, {
        code: 'secret_from_previous_run = 42\nresult = pd.DataFrame([{"value": 1}])',
        datasets: [],
        resultVariable: "result",
      });
      expect(first.kind).toBe("success");

      const second = await executePythonAnalysis(runtime, {
        code: 'result = pd.DataFrame([{"value": secret_from_previous_run}])',
        datasets: [],
        resultVariable: "result",
      });
      expect(second).toMatchObject({ kind: "execution-error" });
      if (second.kind === "execution-error") {
        expect(second.message).toContain("NameError");
      }
    });

    it("bounds captured output before it crosses the worker protocol", async () => {
      const execution = await executePythonAnalysis(runtime, {
        code: `print("x" * ${MAX_PYTHON_STDOUT_CHARS + 5_000})\nresult = pd.DataFrame([{"value": 1}])`,
        datasets: [],
        resultVariable: "result",
      });
      expect(execution.kind).toBe("success");
      expect(execution.stdout).toHaveLength(MAX_PYTHON_STDOUT_CHARS);
    });

    it("returns a bounded execution error for oversized result tables", async () => {
      const execution = await executePythonAnalysis(runtime, {
        code: `result = pd.DataFrame({"value": range(${MAX_PYTHON_RESULT_ROWS + 1})})`,
        datasets: [],
        resultVariable: "result",
      });
      expect(execution).toMatchObject({ kind: "execution-error" });
      if (execution.kind === "execution-error") {
        expect(execution.message).toContain(
          `en fazla ${MAX_PYTHON_RESULT_ROWS} satır`,
        );
      }
    });
  },
);
