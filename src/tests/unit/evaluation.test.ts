import { describe, expect, it } from "vitest";
import {
  evaluateQuery,
  valuesEqual,
} from "../../features/validation/evaluate-query";
import { evaluateLessonQuery } from "../../features/validation/lesson-evaluation";
import type { LessonTask } from "../../types/lesson";

const result = (
  columns: string[],
  rows: Array<Record<string, string | number | boolean | Date | null>>,
) => ({ columns, rows });

const mutationTask = (): LessonTask => ({
  id: "mutation-post-state",
  slug: "mutation-post-state",
  moduleId: "module-8",
  title: "Stoğu güncelle",
  subtitle: "Görünen sonuç ile kalıcı durumu birlikte doğrula.",
  scenario: "Depo ekibi tek bir ürünün stoğunu azaltacak.",
  objective: "801 numaralı ürünün stoğunu üç azalt.",
  difficulty: "intermediate",
  estimatedMinutes: 8,
  routeOrder: 1,
  type: "case",
  scored: true,
  prerequisites: [],
  concepts: ["UPDATE", "ARITHMETIC"],
  setupSql:
    "CREATE TABLE inventory (product_id integer primary key, stock_quantity integer);",
  schema: {
    tables: [
      {
        name: "inventory",
        description: "Ürün stokları",
        columns: [
          {
            name: "product_id",
            dataType: "integer",
            nullable: false,
            primaryKey: true,
          },
          {
            name: "stock_quantity",
            dataType: "integer",
            nullable: false,
          },
        ],
      },
    ],
  },
  sampleRows: [
    {
      tableName: "inventory",
      rows: [
        { product_id: 801, stock_quantity: 12 },
        { product_id: 802, stock_quantity: 6 },
      ],
    },
  ],
  expectedColumns: ["product_id", "stock_quantity"],
  validationMode: "mutation",
  mutationVerification: {
    sql: "SELECT product_id, stock_quantity FROM inventory ORDER BY product_id",
    expectedColumns: ["product_id", "stock_quantity"],
    expectedResult: [
      [801, 9],
      [802, 6],
    ],
    orderSensitive: true,
  },
  expectedResult: [[801, 9]],
  orderSensitive: false,
  requiredConcepts: ["UPDATE", "ARITHMETIC"],
  forbiddenOperations: ["DELETE", "INSERT"],
  validationOptions: {
    numericTolerance: 0.0001,
    columnNameCaseSensitive: false,
    textCaseSensitive: true,
    trimText: true,
    aliasesMustMatch: true,
  },
  hints: ["Hedefi seç.", "Mevcut değeri azalt.", "Değişen satırı döndür."],
  solutionSql:
    "UPDATE inventory SET stock_quantity = stock_quantity - 3 WHERE product_id = 801 RETURNING product_id, stock_quantity;",
  learningBrief: {
    conceptAnchor: "Mutasyonu gerçek tablo durumuyla doğrulamak",
    outputGrain: "Her satır değişen bir üründür.",
    acceptanceChecks: ["801 değişir.", "802 korunur.", "Yeni stok döner."],
    dataNotes: ["Başlangıç stoğu 12'dir."],
  },
  coaching: {
    "execution-error": {
      title: "Sözdizimini kontrol et",
      checks: ["UPDATE doğru mu?", "Tablo doğru mu?"],
    },
    "columns-wrong": {
      title: "Kolonları kontrol et",
      checks: ["Kimlik var mı?", "Stok var mı?"],
    },
    "rows-wrong": {
      title: "Durumu kontrol et",
      checks: ["801 dokuz mu?", "802 altı mı?"],
    },
    "order-wrong": {
      title: "Sırayı kontrol et",
      checks: ["Kimliğe göre mi?", "Artan mı?"],
    },
    "required-concept-missing": {
      title: "Mutasyonu uygula",
      checks: ["UPDATE var mı?", "Göreli hesap var mı?"],
    },
  },
  debrief: {
    steps: ["Hedefle.", "Güncelle.", "Doğrula."],
    whyItWorks: "Post-state görünür sonuçtan bağımsız kanıt üretir.",
    edgeCases: ["Ürün bulunmayabilir.", "Stok yetersiz olabilir."],
    workplaceImpact: "Yanlış mutasyonların başarı sayılmasını önler.",
    transfer: { prompt: "Başka ürün?", reveal: "Hedef kimliği değiştir." },
  },
  explanation: "UPDATE gerçek değeri değiştirir.",
  completionMessage: "Stok doğrulandı.",
  nextTaskId: null,
});

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
      actualResult: result(["total", "city"], [{ total: 100, city: "İzmir" }]),
      expectedColumns: ["city", "total"],
      expectedRows: [["İzmir", 100]],
      options: { columnOrderSensitive: false },
    });
    expect(evaluation.status).toBe("correct");
  });

  it("requires a mutation's visible result and trusted post-state to agree", () => {
    const task = mutationTask();
    const sql = task.solutionSql;
    const visibleResult = result(
      ["product_id", "stock_quantity"],
      [{ product_id: 801, stock_quantity: 9 }],
    );
    const correctState = result(
      ["product_id", "stock_quantity"],
      [
        { product_id: 801, stock_quantity: 9 },
        { product_id: 802, stock_quantity: 6 },
      ],
    );

    expect(
      evaluateLessonQuery(task, sql, visibleResult, undefined, correctState),
    ).toMatchObject({ status: "correct", correct: true });

    const spoofedState = result(
      ["product_id", "stock_quantity"],
      [
        { product_id: 801, stock_quantity: 0 },
        { product_id: 802, stock_quantity: 6 },
      ],
    );
    expect(
      evaluateLessonQuery(task, sql, visibleResult, undefined, spoofedState),
    ).toMatchObject({
      status: "rows-wrong",
      correct: false,
      title: "Görünen çıktı ile gerçek değişiklik uyuşmuyor",
    });

    expect(evaluateLessonQuery(task, sql, visibleResult)).toMatchObject({
      status: "execution-error",
      correct: false,
      title: "Değişiklik doğrulanamadı",
    });
  });
});
