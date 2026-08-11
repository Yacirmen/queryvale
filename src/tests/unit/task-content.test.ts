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
    routeOrder: 1,
    type: "case",
    scored: true,
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

function genericDrill(
  type: Extract<LessonTask["type"], `drill_${string}`>,
  overrides: Partial<LessonTask> = {},
): LessonTask {
  const isIntroduction = type === "drill_intro";
  return genericTask({
    id: `generic-${type}`,
    slug: `generic-${type.replaceAll("_", "-")}`,
    routeOrder: 1.5,
    type,
    scored: false,
    estimatedMinutes: type === "drill_mix" ? 5 : 3,
    ...(isIntroduction ? { conceptNew: "K14" } : { conceptNew: undefined }),
    conceptsReinforced: ["K01"],
    curriculumConcepts: isIntroduction ? ["K01", "K14"] : ["K01"],
    drillConcept:
      "Kısa alıştırma, tek bir yapı taşını gereksiz iş bağlamı olmadan görünür kılar.",
    hints: [
      "Önce istenen çıktı tanesini düşün.",
      "Gerekli SQL parçalarını sıraya koy.",
      "İskeleti kendi alanlarınla tamamla.",
    ],
    ...overrides,
  });
}

describe("task content validation", () => {
  it("accepts a complete task without importing product content", () => {
    expect(validateTaskDefinition(genericTask())).toEqual([]);
  });

  it("reports malformed expected rows, invalid case guidance and a missing solution", () => {
    const issues = validateTaskDefinition(
      genericTask({
        expectedColumns: ["id", "total"],
        expectedResult: [[1]],
        hints: ["Bir", "İki"],
        solutionSql: "",
      }),
    );
    expect(issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining(["expectedResult[0]", "case", "solutionSql"]),
    );
  });

  it.each(["drill_intro", "drill_practice", "drill_mix"] as const)(
    "accepts a concise, unscored %s contract",
    (type) => {
      expect(validateTaskDefinition(genericDrill(type))).toEqual([]);
    },
  );

  it("requires exactly one new concept only on an introduction drill", () => {
    const missingIntroductionConcept = validateTaskDefinition(
      genericDrill("drill_intro", { conceptNew: undefined }),
    );
    const practiceLeaksNewConcept = validateTaskDefinition(
      genericDrill("drill_practice", { conceptNew: "K14" }),
    );
    const mixLeaksNewConcept = validateTaskDefinition(
      genericDrill("drill_mix", { conceptNew: "K14" }),
    );

    expect(missingIntroductionConcept.map((issue) => issue.path)).toContain(
      "drill_intro.conceptNew",
    );
    expect(practiceLeaksNewConcept.map((issue) => issue.path)).toContain(
      "drill_practice.conceptNew",
    );
    expect(mixLeaksNewConcept.map((issue) => issue.path)).toContain(
      "drill_mix.conceptNew",
    );
  });

  it("rejects scoring, missing or excessive hint steps and an invalid duration for each drill subtype", () => {
    const introIssues = validateTaskDefinition(
      genericDrill("drill_intro", {
        scored: true,
        hints: ["Bir", "İki"],
        estimatedMinutes: 4,
      }),
    );
    const tooManyHintIssues = validateTaskDefinition(
      genericDrill("drill_intro", {
        hints: ["Bir", "İki", "Üç", "Dört"],
      }),
    );
    const practiceIssues = validateTaskDefinition(
      genericDrill("drill_practice", { estimatedMinutes: 4 }),
    );
    const mixIssues = validateTaskDefinition(
      genericDrill("drill_mix", { estimatedMinutes: 3 }),
    );

    expect(introIssues.map((issue) => issue.path)).toContain("drill_intro");
    expect(tooManyHintIssues.map((issue) => issue.path)).toContain(
      "drill_intro",
    );
    expect(practiceIssues.map((issue) => issue.path)).toContain(
      "drill_practice",
    );
    expect(mixIssues.map((issue) => issue.path)).toContain("drill_mix");
  });

  it("rejects a duplicate or empty curriculum concept map", () => {
    const duplicateConcepts = validateTaskDefinition(
      genericTask({ curriculumConcepts: ["K01", "K01"] }),
    );
    const emptyConcepts = validateTaskDefinition(
      genericTask({ curriculumConcepts: [] }),
    );

    expect(duplicateConcepts.map((issue) => issue.path)).toContain(
      "curriculumConcepts",
    );
    expect(emptyConcepts.map((issue) => issue.path)).toContain(
      "curriculumConcepts",
    );
  });

  it("requires a trusted post-state contract for mutation tasks", () => {
    const missingVerification = validateTaskDefinition(
      genericTask({
        validationMode: "mutation",
        concepts: ["UPDATE"],
        requiredConcepts: ["UPDATE"],
        solutionSql: "UPDATE sales SET id = id + 1 RETURNING id;",
      }),
    );
    expect(missingVerification.map((issue) => issue.path)).toContain(
      "mutationVerification",
    );

    const completeMutation = validateTaskDefinition(
      genericTask({
        validationMode: "mutation",
        concepts: ["UPDATE"],
        requiredConcepts: ["UPDATE"],
        solutionSql: "UPDATE sales SET id = id + 1 RETURNING id;",
        mutationVerification: {
          sql: "SELECT id FROM sales ORDER BY id",
          expectedColumns: ["id"],
          expectedResult: [[2]],
          orderSensitive: true,
        },
      }),
    );
    expect(
      completeMutation.filter((issue) =>
        issue.path.startsWith("mutationVerification"),
      ),
    ).toEqual([]);
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

  it("rejects duplicate or invalid route positions", () => {
    const first = genericTask({ id: "first", slug: "first", routeOrder: 1 });
    const duplicateRoute = genericTask({
      id: "second",
      slug: "second",
      routeOrder: 1,
    });
    const invalidRoute = genericTask({
      id: "third",
      slug: "third",
      routeOrder: 0,
    });

    const issues = validateTaskCollection([
      first,
      duplicateRoute,
      invalidRoute,
    ]);

    expect(issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining(["tasks[1].routeOrder", "tasks[2].routeOrder"]),
    );
  });

  it("throws a build-friendly aggregate error", () => {
    expect(() =>
      assertValidTaskCollection([genericTask({ slug: "Not A Valid Slug" })]),
    ).toThrowError(/Görev içeriği geçersiz/);
  });
});
