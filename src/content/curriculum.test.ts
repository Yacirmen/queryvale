import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  assertCurriculumIsValid,
  curriculum,
  modules,
  tasks,
} from "./curriculum";
import { validateTaskCollection } from "../features/validation";
import {
  isDrillTask,
  type CurriculumConceptCode,
  type LessonTask,
} from "../types/lesson";

const ORIGINAL_CASE_IDS = [
  "m1-t1",
  "m1-t2",
  "m1-t3",
  "m1-t4",
  "m2-t1",
  "m2-t2",
  "m2-t3",
  "m2-t4",
  "m3-t1",
  "m3-t2",
  "m3-t3",
  "m3-t4",
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
  "m8-t1",
  "m8-t2",
  "m8-t3",
  "m8-t4",
  "m9-t1",
  "m9-t2",
  "m9-t3",
  "m9-t4",
  "m10-t1",
  "m10-t2",
  "m10-t3",
  "m10-t4",
  ...Array.from({ length: 12 }, (_, index) => `m11-t${index + 1}`),
] as const;

const FOUNDATION_CASE_IDS = new Set(ORIGINAL_CASE_IDS.slice(0, 17));
const PRESERVED_CASE_IDS = ORIGINAL_CASE_IDS.slice(17);
const PRESERVED_CASE_ID_SET = new Set<string>(PRESERVED_CASE_IDS);

/**
 * G4a's solution-SQL audit frozen as curriculum metadata, rather than making
 * this regression suite re-parse SQL syntax. This is intentionally limited to
 * the 17 cases G4b is allowed to rebalance.
 */
const ORIGINAL_FOUNDATION_CONCEPTS = {
  "m1-t1": ["K01"],
  "m1-t2": ["K01", "K13"],
  "m1-t3": ["K01", "K03", "K04", "K19"],
  "m1-t4": ["K01", "K03"],
  "m2-t1": ["K01", "K06"],
  "m2-t2": ["K01", "K05", "K07", "K10"],
  "m2-t3": ["K01", "K03", "K11"],
  "m2-t4": ["K01", "K03", "K07", "K09", "K12"],
  "m3-t1": ["K01", "K02", "K99-ARITMETIK"],
  "m3-t2": ["K01", "K02", "K29"],
  "m3-t3": ["K01", "K02", "K28"],
  "m3-t4": ["K01", "K02", "K26", "K99-ARITMETIK", "K99-TIP_DONUSUMU"],
  "m4-t3": ["K01", "K02", "K03", "K14", "K16"],
  "m4-t2": ["K01", "K02", "K03", "K14", "K15", "K16"],
  "m4-t4": ["K01", "K02", "K03", "K15", "K16", "K26", "K99-KOSULLU_OZETLEME"],
  "m4-t1": ["K01", "K02", "K03", "K05", "K14", "K15", "K16", "K18"],
  "m5-t2": [
    "K01",
    "K02",
    "K03",
    "K15",
    "K17",
    "K20",
    "K24",
    "K25",
    "K99-ARITMETIK",
  ],
} as const satisfies Record<string, readonly CurriculumConceptCode[]>;
const DRILL_TYPES = new Set([
  "drill_intro",
  "drill_practice",
  "drill_mix",
] as const);

/**
 * G4b may rebalance only the first 17 cases. These fingerprints lock the
 * semantic source fields of #18–52 without freezing their absolute route
 * positions, because inserting short drills legitimately shifts those.
 */
const PRESERVED_CASE_FINGERPRINTS = {
  "m5-t3": "02af32addf9281ea7b47c87473a72863b82ffb22550b9018b8f877a7016a9f82",
  "m5-t4": "dfdbcd3d3ed8911aa68a789e776b205a1522c1a167a80a876d27b59a65b52972",
  "m5-t1": "3f47bb5e3056db2c6a51e363f5bd3afb080ae73dd27ba37004b7230d935f05e3",
  "m6-t2": "65dbbbd4f32cfc3984fbb4957ee455823167e8e642afe45df914e83470d8c243",
  "m6-t3": "01da0cfabd6fdc1efaec0a7c8db74bfd4a818e316f62c692c1af1d6cbc8b3c7a",
  "m6-t4": "5d052e2f24fb9e0a3edf3fc13c162bf0a7f2e560d4570bb0dccffada0b1e9ee3",
  "m6-t1": "5a0678b758dd9c230d4b6c1e2ea27b5b7d70d4bd9bd32594fa2d72b42768aff2",
  "m7-t2": "226e129ed475d28fbf0b4fefc419f9b2396e5ee0b6ef75982de6ab07662b6847",
  "m7-t3": "a7355b9b67e345f0f1cdf321d2f04a5173d3d244a745e844930a0c1902761368",
  "m7-t4": "c2e54e1668656d24ad5b932f023728b85e075fcaa84b7b7b6e584d445277ca41",
  "m7-t1": "5cc36584f80ff5d9c5f41454b5962a476fef7325f8e4f827067e8b9fc6890941",
  "m8-t1": "6a04eda21f2f9955f80801e408d99576a9739f479b592420d5c166e374e84bf4",
  "m8-t2": "7e5307c1923daa08a018f36ff0475379f89ec5af45419f15450cbbdb7ff66893",
  "m8-t3": "5a420432902e0c81d486cb2ee9fa563bb198ec89b0612c4fc9f2f0420d9812ca",
  "m8-t4": "9c2e59c22935ee2802cde19a8936fd6a0340ba9a5f8c701e47c529b093ff0433",
  "m9-t1": "fe427f15cc37f516c115f3fa525d0137adbf01389c6b4fa761631328a32d152b",
  "m9-t2": "b676e1a5301192e2ff26465cf21c0f1905a7ddeb5a2d9dd8dbd19b0ebd2daed3",
  "m9-t3": "054a963ba8dd370ca96029586e1ec516286dcc04c7b567e490850094dfb7efa1",
  "m9-t4": "76be5dcc334e8ff3f72eb5b5dc0538c08c0740497ef7f43f0f7ba9acc28eba6d",
  "m10-t1": "8665252f4aa66b114541bb4287fc31c49012be81a0cbafe6c69ba2ff20ade56a",
  "m10-t2": "50e596e141b9657d237dfdd3efb67168258071c0e1e8f25cf47465714d20977a",
  "m10-t3": "40dd5618ace97de14ec2e18c19dc2bcf9a1447221254c73d19e7ccc95d0c07cc",
  "m10-t4": "726cd1bafbb1faaf913ed49617218a92dbd353b0c5cd6e9636348b18d6d645bb",
  "m11-t1": "267f1b71beaf72e2f2ba60648103276c29924921212a5ac9ff7cbff0dab8fb23",
  "m11-t2": "2639513891c00c371ab04a8bbaea32f01b251ab66baf5102e69c116660f0254a",
  "m11-t3": "56f51d515d77d15c3576916702499ee43ab6f8feb91d40cc95a92f5a0ba9e549",
  "m11-t4": "0308f93de2742bbf972e859f8c0765a327340575a362177efa27f7e9d7b1218f",
  "m11-t5": "943b5224c246ba7f10399f14d1ced5c059b1e488e60e9a734075513bbf6b2ecb",
  "m11-t6": "cbf5ba0dbfa5292c4a155af6557d03e6e75151d72de86aa038643747619aebdc",
  "m11-t7": "79d296cf74890f4f0a85e2167cc53be25b5bf7396c9eff81b47e87468be2d695",
  "m11-t8": "5257ab662009c6f617d767175cfc3085609f244242d747c3da87b3f418a1670a",
  "m11-t9": "f246e787326c699fc3d3a919fdf6cad9f22094a5ac28c49818763c2ccddcdd03",
  "m11-t10": "3ad1b7d48039e84686089420bcd69139155f9f08e4993c669309cfc4f44563dc",
  "m11-t11": "ff11ba0878009d908611f46e7e3b7da94b5a63175ab6e1e6339a4fc0b4e8f64f",
  "m11-t12": "eefe544b71f4caa97b2ec14e77888a88f97fd0f32a9c0694d61d22bfadb2b446",
} as const;

function immutableContentFingerprint(task: LessonTask): string {
  const immutableFields = {
    id: task.id,
    title: task.title,
    scenario: task.scenario,
    objective: task.objective,
    difficulty: task.difficulty,
    estimatedMinutes: task.estimatedMinutes,
    prerequisites: task.prerequisites,
    concepts: task.concepts,
    setupSql: task.setupSql,
    schema: task.schema,
    sampleRows: task.sampleRows,
    expectedColumns: task.expectedColumns,
    validationMode: task.validationMode,
    expectedResult: task.expectedResult,
    orderSensitive: task.orderSensitive,
    requiredConcepts: task.requiredConcepts,
    forbiddenOperations: task.forbiddenOperations,
    validationOptions: task.validationOptions,
    hints: task.hints,
    solutionSql: task.solutionSql,
    explanation: task.explanation,
    completionMessage: task.completionMessage,
  };

  return createHash("sha256")
    .update(JSON.stringify(immutableFields))
    .digest("hex");
}

function taskIndex(taskId: string): number {
  return tasks.findIndex((task) => task.id === taskId);
}

function taskAfterDrill(drillIndex: number) {
  return tasks.slice(drillIndex + 1).find((task) => task.type === "case");
}

describe("curriculum", () => {
  it("ships the unchanged 52 scored cases plus a derived foundation drill range", () => {
    const cases = tasks.filter((task) => task.type === "case");
    const drills = tasks.filter(isDrillTask);

    expect(modules).toHaveLength(11);
    expect(cases).toHaveLength(52);
    expect(cases.map((task) => task.id).toSorted()).toEqual(
      [...ORIGINAL_CASE_IDS].toSorted(),
    );
    expect(tasks).toHaveLength(cases.length + drills.length);
    // Coverage gaps, not a frozen total, determine the number of drills.
    // Müfredat denetimi 14 müdahale noktasına toplam 21 köprü öngörüyor;
    // 30'u erken noktalarda yayında, kalanı ileri modüllere ekleniyor.
    expect(drills.length).toBeGreaterThanOrEqual(30);
    expect(drills.length).toBeLessThanOrEqual(48);
    expect(new Set(drills.map((task) => task.type))).toEqual(DRILL_TYPES);
    expect(cases.every((task) => task.scored)).toBe(true);
    expect(modules.at(-1)).toMatchObject({
      id: "module-11",
      contentKind: "projects",
    });
  });

  it("keeps the project studio independently selectable after module ten", () => {
    const projectTasks = modules.at(-1)?.tasks ?? [];

    expect(projectTasks.map((task) => task.id)).toEqual(
      Array.from({ length: 12 }, (_, index) => `m11-t${index + 1}`),
    );
    for (const task of projectTasks) {
      expect(task.prerequisites).toEqual(["m10-t4"]);
    }
    projectTasks.forEach((task, index) => {
      expect(task.nextTaskId, task.id).toBe(
        projectTasks[index + 1]?.id ?? null,
      );
    });
    expect(tasks.find((task) => task.id === "m10-t4")?.nextTaskId).toBe(
      "m11-t1",
    );
    expect(projectTasks.at(-1)?.nextTaskId).toBeNull();
  });

  it("moves Top-N behind filtering, swaps #13/#14 and preserves cases 18–52", () => {
    const cases = tasks.filter((task) => task.type === "case");
    const topN = tasks.find((task) => task.id === "m1-t3");
    const countFirst = tasks.find((task) => task.id === "m4-t3");
    const multiMetric = tasks.find((task) => task.id === "m4-t2");
    const lastFilteringCaseIndex = Math.max(
      ...["m2-t1", "m2-t2", "m2-t3", "m2-t4"].map(taskIndex),
    );

    expect(taskIndex("m1-t3")).toBeGreaterThan(lastFilteringCaseIndex);
    expect(topN?.solutionSql).toMatch(/ORDER BY[\s\S]*LIMIT\s+3/i);
    expect(taskIndex("m4-t3")).toBeLessThan(taskIndex("m4-t2"));
    expect(countFirst?.solutionSql).toMatch(/COUNT\(coupon_code\)/i);
    expect(multiMetric?.solutionSql).toMatch(
      /COUNT\(\*\)[\s\S]*SUM\(order_amount\)[\s\S]*AVG\(order_amount\)[\s\S]*MIN\(order_amount\)[\s\S]*MAX\(order_amount\)/i,
    );
    expect(
      cases
        .filter((task) => PRESERVED_CASE_ID_SET.has(task.id))
        .map((task) => task.id),
    ).toEqual(PRESERVED_CASE_IDS);
    expect(
      cases
        .filter((task) => PRESERVED_CASE_ID_SET.has(task.id))
        .every((task) => task.scored && task.routeOrder > 0),
    ).toBe(true);
    expect(tasks.map((task) => task.routeOrder)).toEqual(
      [...tasks.map((task) => task.routeOrder)].toSorted(
        (left, right) => left - right,
      ),
    );
    expect(new Set(tasks.map((task) => task.routeOrder)).size).toBe(
      tasks.length,
    );
  });

  it("keeps cases 18–52 semantically immutable while drills shift their route", () => {
    const preservedCases = tasks.filter(
      (task) => task.type === "case" && PRESERVED_CASE_ID_SET.has(task.id),
    );

    expect(PRESERVED_CASE_IDS).toHaveLength(35);
    expect(Object.keys(PRESERVED_CASE_FINGERPRINTS)).toEqual(
      PRESERVED_CASE_IDS,
    );
    expect(preservedCases).toHaveLength(PRESERVED_CASE_IDS.length);

    for (const task of preservedCases) {
      expect(immutableContentFingerprint(task), task.id).toBe(
        PRESERVED_CASE_FINGERPRINTS[
          task.id as keyof typeof PRESERVED_CASE_FINGERPRINTS
        ],
      );
    }
  });

  it("gives every drill three paced hints, no score and the exact fixture of its following case", () => {
    for (const [drillIndex, drill] of tasks.entries()) {
      if (!isDrillTask(drill)) continue;
      const followingCase = taskAfterDrill(drillIndex);

      expect(drill.scored, drill.id).toBe(false);
      expect(drill.prerequisites, drill.id).toEqual([]);
      expect(drill.hints, drill.id).toHaveLength(3);
      expect(
        drill.hints.every((hint) => hint.trim().length > 0),
        `${drill.id} boş ipucu taşıyamaz`,
      ).toBe(true);
      expect(
        new Set(drill.hints.map((hint) => hint.trim())).size,
        `${drill.id} üç farklı yardım adımı taşımalı`,
      ).toBe(3);
      expect(
        drill.hints[2]?.trim(),
        `${drill.id} tam çözümü üçüncü ipucu olarak veremez`,
      ).not.toBe(drill.solutionSql.trim());
      expect(drill.expectedColumns, drill.id).not.toHaveLength(0);
      expect(drill.expectedResult, drill.id).not.toHaveLength(0);
      expect(
        drill.expectedResult.every(
          (row) => row.length === drill.expectedColumns.length,
        ),
        `${drill.id} doğru sonuç tablosu kolon sözleşmesiyle eşleşmeli`,
      ).toBe(true);
      expect(followingCase, `${drill.id} must lead into a case`).toBeDefined();
      expect(drill.setupSql, drill.id).toBe(followingCase?.setupSql);
      expect(drill.schema, drill.id).toStrictEqual(followingCase?.schema);
      expect(drill.sampleRows, drill.id).toStrictEqual(
        followingCase?.sampleRows,
      );

      if (drill.type === "drill_intro") {
        expect(drill.conceptNew, drill.id).toMatch(/^K(?:\d+|99-[A-Z_]+)$/);
        expect(drill.estimatedMinutes, drill.id).toBeGreaterThanOrEqual(2);
        expect(drill.estimatedMinutes, drill.id).toBeLessThanOrEqual(3);
      } else if (drill.type === "drill_practice") {
        expect(drill.conceptNew, drill.id).toBeUndefined();
        expect(drill.estimatedMinutes, drill.id).toBeGreaterThanOrEqual(2);
        expect(drill.estimatedMinutes, drill.id).toBeLessThanOrEqual(3);
      } else {
        expect(drill.type).toBe("drill_mix");
        expect(drill.conceptNew, drill.id).toBeUndefined();
        expect(drill.estimatedMinutes, drill.id).toBe(5);
      }
    }
  });

  it("gives every foundation concept three paced contacts without smuggling a new concept into practice", () => {
    const foundationEnd = taskIndex("m5-t2");
    const foundationRoute = tasks.slice(0, foundationEnd + 1);
    const foundationCases = foundationRoute.filter(
      (task) => task.type === "case",
    );
    const foundationConcepts = new Set(
      foundationCases.flatMap((task) => task.curriculumConcepts ?? []),
    );

    expect(new Set(foundationCases.map((task) => task.id))).toEqual(
      FOUNDATION_CASE_IDS,
    );
    for (const foundationCase of foundationCases) {
      expect(foundationCase.curriculumConcepts, foundationCase.id).toEqual(
        ORIGINAL_FOUNDATION_CONCEPTS[
          foundationCase.id as keyof typeof ORIGINAL_FOUNDATION_CONCEPTS
        ],
      );
    }
    expect(foundationConcepts.size).toBeGreaterThan(0);

    for (const task of foundationRoute) {
      expect(task.curriculumConcepts, task.id).toBeDefined();
      expect(task.curriculumConcepts?.length, task.id).toBeGreaterThan(0);
    }

    for (const concept of foundationConcepts) {
      const contactIndexes = foundationRoute.flatMap((task, index) =>
        task.curriculumConcepts?.includes(concept) ? [index] : [],
      );
      expect(contactIndexes.length, concept).toBeGreaterThanOrEqual(3);
      expect(
        contactIndexes[1]! - contactIndexes[0]! - 1,
        concept,
      ).toBeLessThanOrEqual(5);
    }

    for (const [index, task] of foundationRoute.entries()) {
      if (!isDrillTask(task)) continue;
      const seenBefore = new Set(
        foundationRoute
          .slice(0, index)
          .flatMap((candidate) => candidate.curriculumConcepts ?? []),
      );

      if (task.type === "drill_intro") {
        expect(seenBefore, task.id).not.toContain(task.conceptNew);
        expect(task.curriculumConcepts, task.id).toContain(task.conceptNew);
        expect(
          (task.curriculumConcepts ?? []).filter(
            (concept) => !seenBefore.has(concept),
          ),
          task.id,
        ).toEqual([task.conceptNew]);
      } else {
        expect(task.conceptNew, task.id).toBeUndefined();
        for (const concept of task.curriculumConcepts ?? []) {
          expect(seenBefore, `${task.id}:${concept}`).toContain(concept);
        }
      }

      for (const concept of task.conceptsReinforced ?? []) {
        expect(seenBefore, `${task.id}:${concept}`).toContain(concept);
      }

      if (task.type === "drill_mix") {
        const previousFourConcepts = new Set(
          foundationRoute
            .slice(Math.max(0, index - 4), index)
            .flatMap((candidate) => candidate.curriculumConcepts ?? []),
        );
        for (const concept of task.curriculumConcepts ?? []) {
          expect(previousFourConcepts, `${task.id}:${concept}`).toContain(
            concept,
          );
        }
      }
    }

    const nonMixRuns = foundationRoute.reduce<number[]>(
      (runs, task) => {
        const previous = runs.at(-1) ?? 0;
        if (task.type === "drill_mix") return [...runs, 0];
        return [...runs.slice(0, -1), previous + 1];
      },
      [0],
    );
    expect(Math.max(...nonMixRuns)).toBeLessThanOrEqual(5);

    for (const preservedCase of tasks.filter(
      (task) => task.type === "case" && PRESERVED_CASE_ID_SET.has(task.id),
    )) {
      expect(
        preservedCase.curriculumConcepts,
        preservedCase.id,
      ).toBeUndefined();
    }
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

  it("keeps case guidance separate from a complete working solution", () => {
    const copyableAnswerPatterns = [
      /\bSELECT\s+DISTINCT\s+[a-z_][\w.]*\s+FROM\s+[a-z_][\w.]*/i,
      /\bSELECT\s+[a-z_*][\w.*]*(?:\s*,\s*[a-z_*][\w.*]*)+\s+FROM\s+[a-z_][\w.]*/i,
      /\bUPDATE\s+[a-z_][\w.]*\s+SET\s+[\s\S]+\bWHERE\b[\s\S]+\bRETURNING\b/i,
    ];

    for (const task of tasks.filter((candidate) => candidate.type === "case")) {
      expect(task.hints).toHaveLength(3);
      expect(task.scored).toBe(true);
      expect(task.solutionSql.trim()).toMatch(
        /^(?:SELECT|WITH|UPDATE|INSERT|DELETE)\b/i,
      );
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
