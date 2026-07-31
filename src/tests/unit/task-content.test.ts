import { describe, expect, it } from "vitest";
import type { LessonTask } from "../../types/lesson";
import {
  assertValidTaskCollection,
  validateTaskCollection,
  validateTaskDefinition,
} from "../../features/validation/task-content";

function genericTask(overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id: "generic-select",
    slug: "generic-select",
    moduleId: "module-1",
    title: "İlk sorgu",
    subtitle: "Bir sonuç kümesi üret",
    scenario: "Analiz ekibi satış kimliklerini istiyor.",
    objective: "sales tablosundaki id kolonunu getir.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    prerequisites: [],
    concepts: ["SELECT"],
    setupSql: "CREATE TABLE sales (id integer); INSERT INTO sales VALUES (1);",
    schema: {
      tables: [
        {
          name: "sales",
          description: "Satışlar",
          columns: [{ name: "id", dataType: "integer", nullable: false }],
        },
      ],
    },
    sampleRows: [{ tableName: "sales", rows: [{ id: 1 }] }],
    expectedColumns: ["id"],
    validationMode: "result",
    expectedResult: [[1]],
    orderSensitive: false,
    requiredConcepts: [],
    forbiddenOperations: ["DROP_DATABASE", "DELETE"],
    validationOptions: {
      numericTolerance: 0.0001,
      columnNameCaseSensitive: false,
      textCaseSensitive: true,
      trimText: true,
      aliasesMustMatch: true,
    },
    hints: ["SELECT ile başla.", "sales tablosunu kullan.", "id kolonunu seç."],
    explanation: "SELECT bir tablodan kolon seçer.",
    completionMessage: "İlk veri isteğini tamamladın.",
    nextTaskId: null,
    ...overrides,
  };
}

describe("task content validation", () => {
  it("accepts a complete task without importing product content", () => {
    expect(validateTaskDefinition(genericTask())).toEqual([]);
  });

  it("reports malformed expected rows and insufficient hints", () => {
    const issues = validateTaskDefinition(
      genericTask({
        expectedColumns: ["id", "total"],
        expectedResult: [[1]],
        hints: ["Bir", "İki"] as unknown as [string, string, string],
      }),
    );
    expect(issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining(["expectedResult[0]", "hints"]),
    );
  });

  it("detects duplicate and dangling cross-task references", () => {
    const first = genericTask({
      nextTaskId: "missing-task",
      prerequisites: ["missing-prerequisite"],
    });
    const duplicate = genericTask();
    const issues = validateTaskCollection([first, duplicate]);
    expect(issues.map((issue) => issue.message).join(" ")).toContain(
      "benzersiz",
    );
    expect(issues.map((issue) => issue.message).join(" ")).toContain(
      "bulunamadı",
    );
  });

  it("throws a build-friendly aggregate error", () => {
    expect(() =>
      assertValidTaskCollection([
        genericTask({ slug: "Not A Valid Slug" }),
      ]),
    ).toThrowError(/Görev içeriği geçersiz/);
  });
});

