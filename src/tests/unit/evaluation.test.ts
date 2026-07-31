import { describe, expect, it } from "vitest";
import {
  evaluateQuery,
  valuesEqual,
} from "../../features/validation/evaluate-query";

const result = (
  columns: string[],
  rows: Array<Record<string, string | number | boolean | Date | null>>,
) => ({ columns, rows });

describe("evaluateQuery", () => {
  it("returns all six pedagogical levels distinctly", () => {
    expect(
      evaluateQuery({
        sql: "SELECT id FROM sales",
        executionError: new Error("syntax error"),
        expectedColumns: ["id"],
        expectedRows: [[1]],
      }).level,
    ).toBe(1);

    expect(
      evaluateQuery({
        sql: "SELECT name FROM sales",
        actualResult: result(["name"], [{ name: "Ada" }]),
        expectedColumns: ["id"],
        expectedRows: [[1]],
      }).level,
    ).toBe(2);

    expect(
      evaluateQuery({
        sql: "SELECT id FROM sales",
        actualResult: result(["id"], [{ id: 2 }]),
        expectedColumns: ["id"],
        expectedRows: [[1]],
      }).level,
    ).toBe(3);

    expect(
      evaluateQuery({
        sql: "SELECT id FROM sales",
        actualResult: result(["id"], [{ id: 2 }, { id: 1 }]),
        expectedColumns: ["id"],
        expectedRows: [[1], [2]],
        orderSensitive: true,
      }).level,
    ).toBe(4);

    expect(
      evaluateQuery({
        sql: "SELECT id FROM sales",
        actualResult: result(["id"], [{ id: 1 }]),
        expectedColumns: ["id"],
        expectedRows: [[1]],
        requiredConcepts: ["WHERE"],
      }).level,
    ).toBe(5);

    expect(
      evaluateQuery({
        sql: "SELECT id FROM sales WHERE id = 1",
        actualResult: result(["id"], [{ id: 1 }]),
        expectedColumns: ["id"],
        expectedRows: [[1]],
        requiredConcepts: ["SELECT", "WHERE"],
      }),
    ).toMatchObject({ level: 6, status: "correct", correct: true });
  });

  it("accepts unordered results but preserves duplicate cardinality", () => {
    const accepted = evaluateQuery({
      sql: "SELECT amount FROM sales",
      actualResult: result(
        ["amount"],
        [{ amount: 20 }, { amount: 10 }, { amount: 10 }],
      ),
      expectedColumns: ["amount"],
      expectedRows: [[10], [10], [20]],
      orderSensitive: false,
    });
    expect(accepted.status).toBe("correct");

    const rejected = evaluateQuery({
      sql: "SELECT amount FROM sales",
      actualResult: result(
        ["amount"],
        [{ amount: 20 }, { amount: 20 }, { amount: 10 }],
      ),
      expectedColumns: ["amount"],
      expectedRows: [[10], [10], [20]],
      orderSensitive: false,
    });
    expect(rejected.status).toBe("rows-wrong");
  });

  it("normalizes nulls, numbers, dates and text using explicit policies", () => {
    expect(valuesEqual(null, null)).toBe(true);
    expect(valuesEqual(null, 0)).toBe(false);
    expect(valuesEqual(0.3, 0.1 + 0.2)).toBe(true);
    expect(valuesEqual(100, "100.0000001")).toBe(true);
    expect(valuesEqual("2026-07-31", new Date("2026-07-31T00:00:00Z"))).toBe(
      true,
    );
    expect(valuesEqual("  İstanbul\r\n", "İstanbul")).toBe(true);
    expect(valuesEqual("ANKARA", "ankara")).toBe(false);
    expect(
      valuesEqual("ANKARA", "ankara", { textCasePolicy: "case-insensitive" }),
    ).toBe(true);
  });

  it("supports task-specific alias and column-case policies", () => {
    const strict = evaluateQuery({
      sql: "SELECT total AS toplam FROM sales",
      actualResult: result(["TOPLAM"], [{ TOPLAM: 42 }]),
      expectedColumns: ["toplam"],
      expectedRows: [[42]],
      options: { aliasPolicy: "exact" },
    });
    expect(strict.status).toBe("columns-wrong");

    const caseInsensitive = evaluateQuery({
      sql: "SELECT total AS toplam FROM sales",
      actualResult: result(["TOPLAM"], [{ TOPLAM: 42 }]),
      expectedColumns: ["toplam"],
      expectedRows: [[42]],
      options: { aliasPolicy: "case-insensitive" },
    });
    expect(caseInsensitive.status).toBe("correct");

    const ignored = evaluateQuery({
      sql: "SELECT total FROM sales",
      actualResult: result(["anything"], [{ anything: 42 }]),
      expectedColumns: ["toplam"],
      expectedRows: [[42]],
      options: { aliasPolicy: "ignore" },
    });
    expect(ignored.status).toBe("correct");
  });

  it("maps column values correctly when column order is not significant", () => {
    const evaluation = evaluateQuery({
      sql: "SELECT total, city FROM sales",
      actualResult: result(
        ["total", "city"],
        [{ total: 100, city: "İzmir" }],
      ),
      expectedColumns: ["city", "total"],
      expectedRows: [["İzmir", 100]],
      options: { columnOrderSensitive: false },
    });
    expect(evaluation.status).toBe("correct");
  });
});

