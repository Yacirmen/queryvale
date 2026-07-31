import { describe, expect, it } from "vitest";
import {
  assertCurriculumIsValid,
  curriculum,
  modules,
  tasks,
} from "./curriculum";
import { validateTaskCollection } from "../features/validation";

describe("curriculum", () => {
  it("ships ten modules and thirty-one linked tasks", () => {
    expect(modules).toHaveLength(10);
    expect(tasks).toHaveLength(31);
    expect(modules.slice(0, 7).map((module) => module.tasks.length)).toEqual([
      4, 4, 4, 4, 4, 4, 4,
    ]);
    expect(modules.slice(7).every((module) => module.tasks.length >= 1)).toBe(
      true,
    );
  });

  it("keeps the expanded module 4–7 learning chain continuous", () => {
    const expandedTaskIds = modules
      .slice(3, 7)
      .flatMap((module) => module.tasks.map((task) => task.id));

    expect(expandedTaskIds).toEqual([
      "m4-t2",
      "m4-t3",
      "m4-t4",
      "m4-t1",
      "m5-t2",
      "m5-t3",
      "m5-t4",
      "m5-t1",
      "m6-t2",
      "m6-t3",
      "m6-t4",
      "m6-t1",
      "m7-t2",
      "m7-t3",
      "m7-t4",
      "m7-t1",
    ]);

    for (let index = 0; index < expandedTaskIds.length - 1; index += 1) {
      const task = tasks.find(
        (candidate) => candidate.id === expandedTaskIds[index],
      );
      expect(task?.nextTaskId).toBe(expandedTaskIds[index + 1]);
    }

    expect(tasks.find((task) => task.id === "m3-t4")?.nextTaskId).toBe("m4-t2");
    expect(tasks.find((task) => task.id === "m7-t1")?.nextTaskId).toBe("m8-t1");
  });

  it("keeps every module duration aligned with its shipped tasks", () => {
    for (const curriculumModule of modules) {
      expect(curriculumModule.estimatedMinutes, curriculumModule.id).toBe(
        curriculumModule.tasks.reduce(
          (total, task) => total + task.estimatedMinutes,
          0,
        ),
      );
    }
  });

  it("passes both curriculum and task-contract validation", () => {
    expect(() => assertCurriculumIsValid(curriculum)).not.toThrow();
    expect(
      validateTaskCollection(tasks).filter(
        (issue) => issue.severity === "error",
      ),
    ).toEqual([]);
  });

  it("keeps three progressive hints separate from a complete working solution", () => {
    const copyableAnswerPatterns = [
      /\bSELECT\s+DISTINCT\s+[a-z_][\w.]*\s+FROM\s+[a-z_][\w.]*/i,
      /\bSELECT\s+[a-z_*][\w.*]*(?:\s*,\s*[a-z_*][\w.*]*)+\s+FROM\s+[a-z_][\w.]*/i,
      /\bUPDATE\s+[a-z_][\w.]*\s+SET\s+[\s\S]+\bWHERE\b[\s\S]+\bRETURNING\b/i,
    ];

    for (const task of tasks) {
      expect(task.hints).toHaveLength(3);
      expect(task.solutionSql.trim()).toMatch(/^(?:SELECT|WITH|UPDATE)\b/i);
      expect(task.expectedColumns.length).toBeGreaterThan(0);
      expect(
        task.expectedResult.every(
          (row) => row.length === task.expectedColumns.length,
        ),
      ).toBe(true);
      expect(task.setupSql).toMatch(/CREATE TABLE/i);
      for (const hint of task.hints) {
        expect(hint.trim()).not.toBe(task.solutionSql.trim());
        for (const pattern of copyableAnswerPatterns) {
          expect(hint, `${task.id} ipucunda tam SQL cevabı var`).not.toMatch(
            pattern,
          );
        }
      }
    }
  });

  it("requires ORDER BY whenever row order is part of the answer", () => {
    for (const task of tasks.filter((candidate) => candidate.orderSensitive)) {
      expect(task.concepts, task.id).toContain("ORDER_BY");
      expect(task.requiredConcepts, task.id).toContain("ORDER_BY");
    }
  });
});
