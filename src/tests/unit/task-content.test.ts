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
    learningBrief: {
      conceptAnchor: "SELECT ile hedef kolonu seçmek",
      outputGrain: "Her satır bir satışı temsil eder.",
      acceptanceChecks: [
        "Sonuç yalnızca id kolonunu içerir.",
        "Kolon adı id olarak korunur.",
        "Satış satırları filtrelenmeden gelir.",
      ],
      dataNotes: ["Örnek veri tek satış satırı içerir."],
    },
    coaching: {
      "execution-error": {
        title: "Sorgu yapısını yeniden kontrol et",
        checks: ["SELECT anahtar kelimesini yazdın mı?", "Tablo adı sales mı?"],
      },
      "columns-wrong": {
        title: "Kolon sözleşmesini yeniden kontrol et",
        checks: [
          "SELECT listesinde yalnızca id olmalı.",
          "Kolona farklı bir alias verilmemeli.",
        ],
      },
      "rows-wrong": {
        title: "Satır kümesini yeniden kontrol et",
        checks: [
          "sales tablosunda filtre gerekmiyor.",
          "Tüm satış satırları korunmalı.",
        ],
      },
      "order-wrong": {
        title: "Satır sırasını yeniden kontrol et",
        checks: ["Beklenen sıralamayı oku.", "Gerekirse ORDER BY kullan."],
      },
      "required-concept-missing": {
        title: "Hedef kavramı sorgunda görünür kıl",
        checks: ["SELECT kullandın mı?", "Aynı sonucu sabit değerle üretme."],
      },
    },
    debrief: {
      steps: [
        "İstenen çıktı sözleşmesini oku.",
        "sales tablosunu veri kaynağı olarak seç.",
        "id kolonunu getir.",
      ],
      whyItWorks: "SELECT listesi sonuç şemasını belirler.",
      edgeCases: [
        "Gereksiz kolon seçmek çıktı sözleşmesini bozar.",
        "Alias kullanmak beklenen kolon adını değiştirebilir.",
      ],
      workplaceImpact: "Dar bir çıktı, tüketicinin veri sözleşmesini korur.",
      transfer: {
        prompt: "Aynı tablodan yalnızca tarih kolonunu nasıl getirirdin?",
        reveal: "SELECT listesinde id yerine tarih kolonunu seçerdin.",
      },
    },
    hints: ["SELECT ile başla.", "sales tablosunu kullan.", "id kolonunu seç."],
    solutionSql: "SELECT id FROM sales;",
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

  it("reports malformed expected rows, insufficient hints and a missing solution", () => {
    const issues = validateTaskDefinition(
      genericTask({
        expectedColumns: ["id", "total"],
        expectedResult: [[1]],
        hints: ["Bir", "İki"] as unknown as [string, string, string],
        solutionSql: "",
      }),
    );
    expect(issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining(["expectedResult[0]", "hints", "solutionSql"]),
    );
  });

  it("reports incomplete learning brief, coaching and debrief content", () => {
    const issues = validateTaskDefinition(
      genericTask({
        learningBrief: {
          conceptAnchor: "",
          outputGrain: "Her satır bir satıştır.",
          acceptanceChecks: [],
          dataNotes: [""],
        },
        coaching: {
          "rows-wrong": { title: "", checks: [] },
        } as unknown as LessonTask["coaching"],
        debrief: {
          steps: [],
          whyItWorks: "",
          edgeCases: [],
          workplaceImpact: "",
          transfer: { prompt: "", reveal: "" },
        },
      }),
    );

    expect(issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining([
        "learningBrief.conceptAnchor",
        "learningBrief.acceptanceChecks",
        "learningBrief.dataNotes",
        "coaching.rows-wrong.title",
        "coaching.rows-wrong.checks",
        "debrief.steps",
        "debrief.whyItWorks",
        "debrief.edgeCases",
        "debrief.workplaceImpact",
        "debrief.transfer.prompt",
        "debrief.transfer.reveal",
      ]),
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
      assertValidTaskCollection([genericTask({ slug: "Not A Valid Slug" })]),
    ).toThrowError(/Görev içeriği geçersiz/);
  });
});
