import { describe, expect, it } from "vitest";

import {
  getPythonModuleById,
  getPythonTaskById,
  pythonCurriculum,
  pythonModules,
  pythonTasks,
} from "./pythonCurriculum";

describe("python curriculum catalog", () => {
  it("ships four ordered modules and twelve lessons", () => {
    expect(pythonModules).toHaveLength(4);
    expect(pythonTasks).toHaveLength(12);
    expect(pythonCurriculum).toEqual({
      modules: pythonModules,
      tasks: pythonTasks,
    });
    expect(pythonModules.map((module) => module.order)).toEqual([1, 2, 3, 4]);
    expect(pythonModules.map((module) => module.tasks.length)).toEqual([
      3, 3, 3, 3,
    ]);
  });

  it("starts with data inspection rather than transformation", () => {
    const firstModule = pythonModules[0];
    const firstTask = pythonTasks[0];

    expect(firstModule.slug).toBe("veriyi-tani-eda");
    expect(firstModule.topics).toEqual(
      expect.arrayContaining([
        "shape",
        "eksik ve tekrar",
        "kolon profili",
        "IQR",
      ]),
    );
    expect(firstTask.id).toBe("py-m1-t1");
    expect(firstTask.concepts).toEqual(
      expect.arrayContaining(["DataFrame.shape", "isna", "duplicated"]),
    );
    expect(firstTask.solutionCode).not.toMatch(/dropna|fillna|drop_duplicates/);
  });

  it("keeps task and module identities unique and queryable", () => {
    const taskIds = pythonTasks.map((task) => task.id);
    const taskSlugs = pythonTasks.map((task) => task.slug);
    const moduleIds = pythonModules.map((module) => module.id);
    const moduleSlugs = pythonModules.map((module) => module.slug);

    expect(new Set(taskIds).size).toBe(taskIds.length);
    expect(new Set(taskSlugs).size).toBe(taskSlugs.length);
    expect(new Set(moduleIds).size).toBe(moduleIds.length);
    expect(new Set(moduleSlugs).size).toBe(moduleSlugs.length);

    for (const task of pythonTasks) {
      expect(task.id).toMatch(/^py-m[1-4]-t[1-3]$/);
      expect(getPythonTaskById(task.id)).toBe(task);
    }

    for (const curriculumModule of pythonModules) {
      expect(curriculumModule.id).toMatch(/^py-module-[1-4]$/);
      expect(getPythonModuleById(curriculumModule.id)).toBe(curriculumModule);
    }
  });

  it("uses small deterministic scalar-only fixtures", () => {
    for (const task of pythonTasks) {
      expect(task.datasets.length).toBeGreaterThan(0);
      expect(task.datasets.length).toBeLessThanOrEqual(2);

      for (const dataset of task.datasets) {
        expect(dataset.variableName).toMatch(/^[a-z][a-z0-9_]*$/);
        expect(dataset.description.trim().length).toBeGreaterThan(20);
        expect(dataset.rows.length).toBeGreaterThanOrEqual(4);
        expect(dataset.rows.length).toBeLessThanOrEqual(20);

        const columns = Object.keys(dataset.rows[0] ?? {});
        expect(columns.length).toBeGreaterThanOrEqual(2);
        expect(columns.length).toBeLessThanOrEqual(8);

        for (const row of dataset.rows) {
          expect(Object.keys(row)).toEqual(columns);
          for (const value of Object.values(row)) {
            const isScalar =
              value === null ||
              typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean";
            expect(isScalar).toBe(true);
            if (typeof value === "number") {
              expect(Number.isFinite(value)).toBe(true);
            }
          }
        }
      }
    }
  });

  it("provides complete teaching and artifact validation contracts", () => {
    for (const task of pythonTasks) {
      expect(task.track).toBe("python");
      expect(task.packages).toEqual(["pandas"]);
      expect(task.resultVariable).toBe("result");
      expect(task.starterCode).toContain("result");
      expect(task.solutionCode).toMatch(/\bresult\s*=/);
      expect(task.solutionCode).not.toMatch(/print\s*\(/);
      expect(task.expectedColumns.length).toBeGreaterThanOrEqual(3);
      expect(task.expectedRows.length).toBeGreaterThan(0);
      expect(task.numericTolerance).toBeGreaterThan(0);
      expect(task.acceptanceChecks).toHaveLength(3);
      expect(task.hints).toHaveLength(3);
      expect(new Set(task.hints.map((hint) => hint.body)).size).toBe(3);
      expect(task.dataNotes.length).toBeGreaterThanOrEqual(2);
      expect(task.concepts.length).toBeGreaterThanOrEqual(3);
      expect(task.scenario.trim().length).toBeGreaterThan(80);
      expect(task.objective.trim().length).toBeGreaterThan(60);
      expect(task.explanation.trim().length).toBeGreaterThan(100);
      expect(task.completionMessage.trim().length).toBeGreaterThan(30);
      expect(task.debrief.steps).toHaveLength(3);
      expect(task.debrief.edgeCases.length).toBeGreaterThanOrEqual(2);
      expect(task.debrief.whyItWorks.trim().length).toBeGreaterThan(60);
      expect(task.debrief.workplaceImpact.trim().length).toBeGreaterThan(60);
      expect(task.debrief.transfer.prompt.trim().length).toBeGreaterThan(30);
      expect(task.debrief.transfer.reveal.trim().length).toBeGreaterThan(40);

      for (const hint of task.hints) {
        expect(hint.title.trim().length).toBeGreaterThan(5);
        expect(hint.body.trim().length).toBeGreaterThan(35);
      }

      for (const check of task.acceptanceChecks) {
        expect(check.trim().length).toBeGreaterThan(35);
      }
    }
  });

  it("keeps expected artifacts rectangular and dtype keys valid", () => {
    for (const task of pythonTasks) {
      expect(new Set(task.expectedColumns).size).toBe(
        task.expectedColumns.length,
      );

      for (const row of task.expectedRows) {
        expect(row).toHaveLength(task.expectedColumns.length);
        for (const value of row) {
          const isScalar =
            value === null ||
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean";
          expect(isScalar).toBe(true);
          if (typeof value === "number") {
            expect(Number.isFinite(value)).toBe(true);
          }
        }
      }

      for (const column of Object.keys(task.expectedDtypes ?? {})) {
        expect(task.expectedColumns).toContain(column);
      }
    }
  });

  it("chains every module and task in one honest prerequisite path", () => {
    for (let index = 0; index < pythonModules.length; index += 1) {
      const curriculumModule = pythonModules[index];
      const expectedModulePrerequisite =
        index === 0 ? [] : [pythonModules[index - 1].id];

      expect(curriculumModule.prerequisites).toEqual(
        expectedModulePrerequisite,
      );
      expect(
        curriculumModule.tasks.every(
          (task) => task.moduleId === curriculumModule.id,
        ),
      ).toBe(true);
    }

    for (let index = 0; index < pythonTasks.length; index += 1) {
      const task = pythonTasks[index];
      const previousTask = pythonTasks[index - 1];
      const nextTask = pythonTasks[index + 1];

      expect(task.prerequisites).toEqual(previousTask ? [previousTask.id] : []);
      expect(task.nextTaskId).toBe(nextTask?.id ?? null);
    }
  });
});
