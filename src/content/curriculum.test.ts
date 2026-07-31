import { describe, expect, it } from "vitest";
import {
  assertCurriculumIsValid,
  curriculum,
  modules,
  tasks,
} from "./curriculum";
import { validateTaskCollection } from "../features/validation";

describe("curriculum", () => {
  it("ships ten modules and nineteen linked tasks", () => {
    expect(modules).toHaveLength(10);
    expect(tasks).toHaveLength(19);
    expect(modules.slice(0, 3).map((module) => module.tasks.length)).toEqual([
      4, 4, 4,
    ]);
    expect(modules.slice(3).every((module) => module.tasks.length >= 1)).toBe(
      true,
    );
  });

  it("passes both curriculum and task-contract validation", () => {
    expect(() => assertCurriculumIsValid(curriculum)).not.toThrow();
    expect(
      validateTaskCollection(tasks).filter((issue) => issue.severity === "error"),
    ).toEqual([]);
  });

  it("provides three progressive hints and deterministic output metadata", () => {
    for (const task of tasks) {
      expect(task.hints).toHaveLength(3);
      expect(task.expectedColumns.length).toBeGreaterThan(0);
      expect(
        task.expectedResult.every(
          (row) => row.length === task.expectedColumns.length,
        ),
      ).toBe(true);
      expect(task.setupSql).toMatch(/CREATE TABLE/i);
    }
  });
});
