import { describe, expect, it } from "vitest";
import { tasks } from "./curriculum";
import { AUTHORED_TASK_LEARNING_CONTENT } from "./learningContentCatalog";

function leafStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(leafStrings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(leafStrings);
  }
  return [];
}

describe("task learning content", () => {
  it("covers every shipped task exactly once", () => {
    const shippedTaskIds = tasks.map((task) => task.id);
    const authoredTaskIds = Object.keys(AUTHORED_TASK_LEARNING_CONTENT);

    expect(new Set(shippedTaskIds).size).toBe(shippedTaskIds.length);
    expect(authoredTaskIds).toHaveLength(shippedTaskIds.length);
    expect(authoredTaskIds.sort()).toEqual([...shippedTaskIds].sort());
  });

  it("keeps the rich learning contract deep enough for every authored task", () => {
    for (const [taskId, content] of Object.entries(
      AUTHORED_TASK_LEARNING_CONTENT,
    )) {
      expect(content.learningBrief.acceptanceChecks, taskId).toHaveLength(3);
      expect(content.learningBrief.dataNotes.length, taskId).toBeGreaterThan(0);
      expect(Object.keys(content.coaching).sort(), taskId).toEqual(
        [
          "columns-wrong",
          "execution-error",
          "order-wrong",
          "required-concept-missing",
          "rows-wrong",
        ].sort(),
      );
      for (const coaching of Object.values(content.coaching)) {
        expect(coaching.checks.length, taskId).toBeGreaterThanOrEqual(2);
      }
      expect(content.debrief.steps, taskId).toHaveLength(3);
      expect(content.debrief.edgeCases.length, taskId).toBeGreaterThanOrEqual(
        2,
      );
    }
  });

  it("teaches an approach without embedding a copyable SQL answer", () => {
    const copyableQuery =
      /\b(?:select\s+distinct\s+(?!ve\b)[a-z_*][\w.*]*\s+from\s+[a-z_][\w.]*|select\s+[a-z_*][\w.*]*(?:\s*,\s*[a-z_*][\w.*]*)+\s+from\s+[a-z_][\w.]*|update\s+[a-z_][\w.]*\s+set\s+[\s\S]+\bwhere\b[\s\S]+\breturning\b)/i;

    for (const [taskId, content] of Object.entries(
      AUTHORED_TASK_LEARNING_CONTENT,
    )) {
      for (const sentence of leafStrings(content)) {
        expect(sentence, `${taskId} exposes a full SQL answer`).not.toMatch(
          copyableQuery,
        );
      }
    }
  });
});
