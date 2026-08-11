import {
  isDrillTaskType,
  type CoachingStatus,
  type DrillTaskType,
  type LessonTask,
  type LessonTaskType,
} from "../../types/lesson";

export type ContentIssueSeverity = "error" | "warning";

export interface ContentValidationIssue {
  severity: ContentIssueSeverity;
  path: string;
  message: string;
}

type UnknownRecord = Record<string, unknown>;

function record(task: LessonTask): UnknownRecord {
  return task as unknown as UnknownRecord;
}

function requireString(
  source: UnknownRecord,
  property: string,
  issues: ContentValidationIssue[],
): void {
  if (
    typeof source[property] !== "string" ||
    (source[property] as string).trim().length === 0
  ) {
    issues.push({
      severity: "error",
      path: property,
      message: `${property} boş olmayan bir metin olmalıdır.`,
    });
  }
}

function requireStringArray(
  value: unknown,
  path: string,
  issues: ContentValidationIssue[],
  minimumItems = 1,
): void {
  if (
    !Array.isArray(value) ||
    value.length < minimumItems ||
    value.some((item) => typeof item !== "string" || item.trim().length === 0)
  ) {
    issues.push({
      severity: "error",
      path,
      message: `${path} en az ${minimumItems} boş olmayan metin içermelidir.`,
    });
  }
}

function requireNestedString(
  source: UnknownRecord | undefined,
  property: string,
  path: string,
  issues: ContentValidationIssue[],
): void {
  if (
    !source ||
    typeof source[property] !== "string" ||
    (source[property] as string).trim().length === 0
  ) {
    issues.push({
      severity: "error",
      path,
      message: `${path} boş olmayan bir metin olmalıdır.`,
    });
  }
}

const failureEvaluationStatuses: readonly CoachingStatus[] = [
  "execution-error",
  "columns-wrong",
  "rows-wrong",
  "order-wrong",
  "required-concept-missing",
];

const drillDurations: Readonly<
  Record<DrillTaskType, readonly [number, number]>
> = {
  drill_intro: [2, 3],
  drill_practice: [2, 3],
  drill_mix: [5, 5],
};

function nestedRecord(value: unknown): UnknownRecord | undefined {
  return value && typeof value === "object"
    ? (value as UnknownRecord)
    : undefined;
}

function validateLearningContent(
  source: UnknownRecord,
  issues: ContentValidationIssue[],
): void {
  const brief = nestedRecord(source.learningBrief);
  if (!brief) {
    issues.push({
      severity: "error",
      path: "learningBrief",
      message: "Görev bir öğrenme özeti tanımlamalıdır.",
    });
  } else {
    requireNestedString(
      brief,
      "conceptAnchor",
      "learningBrief.conceptAnchor",
      issues,
    );
    requireNestedString(
      brief,
      "outputGrain",
      "learningBrief.outputGrain",
      issues,
    );
    requireStringArray(
      brief.acceptanceChecks,
      "learningBrief.acceptanceChecks",
      issues,
      3,
    );
    requireStringArray(brief.dataNotes, "learningBrief.dataNotes", issues);
  }

  const coaching = nestedRecord(source.coaching);
  if (!coaching) {
    issues.push({
      severity: "error",
      path: "coaching",
      message:
        "Görev başarısız değerlendirme durumlarına özel koçluk tanımlamalıdır.",
    });
  } else {
    for (const status of failureEvaluationStatuses) {
      if (!coaching[status]) {
        issues.push({
          severity: "error",
          path: `coaching.${status}`,
          message: `"${status}" durumu için görev koçluğu tanımlanmalıdır.`,
        });
      }
    }
    for (const [status, rawEntry] of Object.entries(coaching)) {
      if (!failureEvaluationStatuses.includes(status as CoachingStatus)) {
        issues.push({
          severity: "error",
          path: `coaching.${status}`,
          message: `"${status}" geçerli bir değerlendirme durumu değildir.`,
        });
        continue;
      }
      const entry = nestedRecord(rawEntry);
      requireNestedString(entry, "title", `coaching.${status}.title`, issues);
      requireStringArray(entry?.checks, `coaching.${status}.checks`, issues, 2);
    }
  }

  const debrief = nestedRecord(source.debrief);
  if (!debrief) {
    issues.push({
      severity: "error",
      path: "debrief",
      message:
        "Görev yapılandırılmış bir çözüm değerlendirmesi tanımlamalıdır.",
    });
    return;
  }
  requireStringArray(debrief.steps, "debrief.steps", issues, 3);
  requireNestedString(debrief, "whyItWorks", "debrief.whyItWorks", issues);
  requireStringArray(debrief.edgeCases, "debrief.edgeCases", issues, 2);
  requireNestedString(
    debrief,
    "workplaceImpact",
    "debrief.workplaceImpact",
    issues,
  );
  const transfer = nestedRecord(debrief.transfer);
  requireNestedString(transfer, "prompt", "debrief.transfer.prompt", issues);
  requireNestedString(transfer, "reveal", "debrief.transfer.reveal", issues);
}

function isNonEmptyConceptList(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (concept) => typeof concept === "string" && concept.trim().length > 0,
    )
  );
}

function validateTaskFormat(
  task: LessonTask,
  source: UnknownRecord,
  issues: ContentValidationIssue[],
): void {
  const rawType = source.type;
  const isCase = rawType === "case";
  const isDrill =
    typeof rawType === "string" && isDrillTaskType(rawType as LessonTaskType);

  if (!isCase && !isDrill) {
    issues.push({
      severity: "error",
      path: "type",
      message:
        "type case, drill_intro, drill_practice veya drill_mix olmalıdır.",
    });
    return;
  }

  if (isCase) {
    if (task.hints.length !== 3 || task.scored !== true) {
      issues.push({
        severity: "error",
        path: "case",
        message: "Vaka üç aşamalı ipucu ve puanlı sözleşme içermelidir.",
      });
    }
    return;
  }

  const type = rawType as DrillTaskType;
  const [minimumMinutes, maximumMinutes] = drillDurations[type];
  const commonInvalid =
    task.hints.length !== 3 ||
    task.scored !== false ||
    !isNonEmptyConceptList(source.conceptsReinforced) ||
    typeof task.drillConcept !== "string" ||
    task.drillConcept.trim().length === 0 ||
    task.estimatedMinutes < minimumMinutes ||
    task.estimatedMinutes > maximumMinutes;

  if (commonInvalid) {
    const durationLabel =
      minimumMinutes === maximumMinutes
        ? `${minimumMinutes} dakika`
        : `${minimumMinutes}–${maximumMinutes} dakika`;
    issues.push({
      severity: "error",
      path: type,
      message: `${type} üç aşamalı ücretsiz ipucu, puansız sözleşme, pekiştirilen kavramlar, vaka yardım yüzeyi ve ${durationLabel} taşımalıdır.`,
    });
  }

  if (
    !Array.isArray(source.prerequisites) ||
    source.prerequisites.length !== 0
  ) {
    issues.push({
      severity: "error",
      path: `${type}.prerequisites`,
      message:
        "Alıştırmalar rota kilidi oluşturmaz; prerequisites alanı boş bir dizi olmalıdır.",
    });
  }

  if (type === "drill_intro") {
    if (
      typeof task.conceptNew !== "string" ||
      task.conceptNew.trim().length === 0
    ) {
      issues.push({
        severity: "error",
        path: "drill_intro.conceptNew",
        message:
          "drill_intro tam bir yeni kavramı conceptNew alanında tanımlamalıdır.",
      });
    } else if (
      Array.isArray(task.curriculumConcepts) &&
      !task.curriculumConcepts.includes(task.conceptNew)
    ) {
      issues.push({
        severity: "error",
        path: "drill_intro.conceptNew",
        message:
          "drill_intro conceptNew değeri tanımlı curriculumConcepts haritasında yer almalıdır.",
      });
    }
    return;
  }

  if (task.conceptNew !== undefined) {
    issues.push({
      severity: "error",
      path: `${type}.conceptNew`,
      message: `${type} yeni kavram getiremez; conceptNew alanı tanımlanmamalıdır.`,
    });
  }
}

export function validateTaskDefinition(
  task: LessonTask,
): ContentValidationIssue[] {
  const source = record(task);
  const issues: ContentValidationIssue[] = [];

  for (const property of [
    "id",
    "slug",
    "moduleId",
    "title",
    "scenario",
    "objective",
    "setupSql",
    "solutionSql",
    "explanation",
    "completionMessage",
  ]) {
    requireString(source, property, issues);
  }

  validateLearningContent(source, issues);

  if (
    typeof source.slug === "string" &&
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.slug)
  ) {
    issues.push({
      severity: "error",
      path: "slug",
      message: "slug küçük harf, rakam ve tek tire ayraçlarından oluşmalıdır.",
    });
  }

  if (
    typeof source.estimatedMinutes !== "number" ||
    !Number.isInteger(source.estimatedMinutes) ||
    source.estimatedMinutes <= 0
  ) {
    issues.push({
      severity: "error",
      path: "estimatedMinutes",
      message: "estimatedMinutes pozitif bir tam sayı olmalıdır.",
    });
  }

  if (
    !Array.isArray(task.expectedColumns) ||
    task.expectedColumns.length === 0 ||
    task.expectedColumns.some(
      (column) => typeof column !== "string" || column.trim().length === 0,
    )
  ) {
    issues.push({
      severity: "error",
      path: "expectedColumns",
      message: "En az bir geçerli beklenen kolon tanımlanmalıdır.",
    });
  } else {
    const normalizedColumns = task.expectedColumns.map((column) =>
      column.toLocaleLowerCase("en-US"),
    );
    if (new Set(normalizedColumns).size !== normalizedColumns.length) {
      issues.push({
        severity: "error",
        path: "expectedColumns",
        message: "Beklenen kolon adları benzersiz olmalıdır.",
      });
    }
  }

  if (!Array.isArray(task.expectedResult)) {
    issues.push({
      severity: "error",
      path: "expectedResult",
      message: "expectedResult bir satır dizisi olmalıdır.",
    });
  } else {
    task.expectedResult.forEach((row, index) => {
      if (!Array.isArray(row) || row.length !== task.expectedColumns.length) {
        issues.push({
          severity: "error",
          path: `expectedResult[${index}]`,
          message: `Her sonuç satırı ${task.expectedColumns.length} değer içermelidir.`,
        });
      }
    });
  }

  if (source.curriculumConcepts !== undefined) {
    if (!isNonEmptyConceptList(source.curriculumConcepts)) {
      issues.push({
        severity: "error",
        path: "curriculumConcepts",
        message:
          "curriculumConcepts tanımlandığında boş olmayan kavram kodları içermelidir.",
      });
    } else if (
      new Set(source.curriculumConcepts.map((concept) => concept.trim()))
        .size !== source.curriculumConcepts.length
    ) {
      issues.push({
        severity: "error",
        path: "curriculumConcepts",
        message:
          "curriculumConcepts içindeki kavram kodları benzersiz olmalıdır.",
      });
    }
  }

  if (task.validationMode === "mutation") {
    const verification = source.mutationVerification as
      UnknownRecord | undefined;
    if (!verification || typeof verification !== "object") {
      issues.push({
        severity: "error",
        path: "mutationVerification",
        message:
          "Mutation görevleri RETURNING çıktısına ek olarak gerçek tablo durumunu doğrulamalıdır.",
      });
    } else {
      if (
        typeof verification.sql !== "string" ||
        verification.sql.trim().length === 0
      ) {
        issues.push({
          severity: "error",
          path: "mutationVerification.sql",
          message: "Mutation doğrulaması boş olmayan bir SELECT içermelidir.",
        });
      }
      if (
        !Array.isArray(verification.expectedColumns) ||
        verification.expectedColumns.length === 0
      ) {
        issues.push({
          severity: "error",
          path: "mutationVerification.expectedColumns",
          message: "Mutation doğrulaması beklenen kolonları tanımlamalıdır.",
        });
      }
      if (!Array.isArray(verification.expectedResult)) {
        issues.push({
          severity: "error",
          path: "mutationVerification.expectedResult",
          message:
            "Mutation doğrulaması beklenen tablo durumunu tanımlamalıdır.",
        });
      }
      if (typeof verification.orderSensitive !== "boolean") {
        issues.push({
          severity: "error",
          path: "mutationVerification.orderSensitive",
          message: "Mutation doğrulamasının sıra politikası açık olmalıdır.",
        });
      }
    }
  } else if (source.mutationVerification !== undefined) {
    issues.push({
      severity: "error",
      path: "mutationVerification",
      message:
        "Gizli tablo durumu doğrulaması yalnız mutation görevlerinde kullanılır.",
    });
  }

  if (!Array.isArray(source.hints)) {
    issues.push({
      severity: "error",
      path: "hints",
      message: "Görev ipucu listesi içermelidir.",
    });
  } else {
    validateTaskFormat(task, source, issues);
  }

  const schema = source.schema as UnknownRecord | undefined;
  if (
    !schema ||
    typeof schema !== "object" ||
    !Array.isArray(schema.tables) ||
    schema.tables.length === 0
  ) {
    issues.push({
      severity: "error",
      path: "schema",
      message: "Görev en az bir tablo şeması tanımlamalıdır.",
    });
  }

  if (
    !Array.isArray(task.requiredConcepts) ||
    (task.validationMode === "result-and-concepts" &&
      task.requiredConcepts.length === 0)
  ) {
    issues.push({
      severity: "error",
      path: "requiredConcepts",
      message:
        "result-and-concepts doğrulaması en az bir gerekli kavram içermelidir.",
    });
  }

  const validation = source.validationOptions;
  if (!validation || typeof validation !== "object") {
    issues.push({
      severity: "error",
      path: "validationOptions",
      message: "Görev açık sonuç karşılaştırma seçenekleri tanımlamalıdır.",
    });
  } else {
    const tolerance = (validation as UnknownRecord).numericTolerance;
    if (
      typeof tolerance !== "number" ||
      !Number.isFinite(tolerance) ||
      tolerance < 0
    ) {
      issues.push({
        severity: "error",
        path: "validationOptions.numericTolerance",
        message: "Sayısal tolerans sıfır veya pozitif bir sayı olmalıdır.",
      });
    }
  }

  return issues;
}

export function validateTaskCollection(
  tasks: readonly LessonTask[],
): ContentValidationIssue[] {
  const issues = tasks.flatMap((task, index) =>
    validateTaskDefinition(task).map((issue) => ({
      ...issue,
      path: `tasks[${index}].${issue.path}`,
    })),
  );
  const ids = new Map<string, number>();
  const slugs = new Map<string, number>();
  const routeOrders = new Map<number, number>();

  tasks.forEach((task, index) => {
    if (ids.has(task.id)) {
      issues.push({
        severity: "error",
        path: `tasks[${index}].id`,
        message: `"${task.id}" görev kimliği benzersiz olmalıdır.`,
      });
    } else {
      ids.set(task.id, index);
    }

    if (slugs.has(task.slug)) {
      issues.push({
        severity: "error",
        path: `tasks[${index}].slug`,
        message: `"${task.slug}" görev slug değeri benzersiz olmalıdır.`,
      });
    } else {
      slugs.set(task.slug, index);
    }

    if (!Number.isFinite(task.routeOrder) || task.routeOrder <= 0) {
      issues.push({
        severity: "error",
        path: `tasks[${index}].routeOrder`,
        message: "routeOrder pozitif ve sonlu bir sayı olmalıdır.",
      });
    } else if (routeOrders.has(task.routeOrder)) {
      issues.push({
        severity: "error",
        path: `tasks[${index}].routeOrder`,
        message: `routeOrder ${task.routeOrder} değeri benzersiz olmalıdır.`,
      });
    } else {
      routeOrders.set(task.routeOrder, index);
    }
  });

  const knownIds = new Set(ids.keys());
  tasks.forEach((task, index) => {
    const source = record(task);
    const prerequisites = Array.isArray(source.prerequisites)
      ? source.prerequisites
      : [];
    prerequisites.forEach((prerequisite, prerequisiteIndex) => {
      if (typeof prerequisite !== "string" || !knownIds.has(prerequisite)) {
        issues.push({
          severity: "error",
          path: `tasks[${index}].prerequisites[${prerequisiteIndex}]`,
          message: `"${String(prerequisite)}" görev kimliği bulunamadı.`,
        });
      } else if (prerequisite === task.id) {
        issues.push({
          severity: "error",
          path: `tasks[${index}].prerequisites[${prerequisiteIndex}]`,
          message: "Bir görev kendisini ön koşul olarak gösteremez.",
        });
      }
    });

    const nextTaskId = source.nextTaskId;
    if (
      typeof nextTaskId === "string" &&
      nextTaskId.length > 0 &&
      !knownIds.has(nextTaskId)
    ) {
      issues.push({
        severity: "error",
        path: `tasks[${index}].nextTaskId`,
        message: `"${nextTaskId}" sonraki görev kimliği bulunamadı.`,
      });
    }
  });

  return issues;
}

export function assertValidTaskCollection(tasks: readonly LessonTask[]): void {
  const errors = validateTaskCollection(tasks).filter(
    (issue) => issue.severity === "error",
  );
  if (errors.length > 0) {
    throw new Error(
      `Görev içeriği geçersiz:\n${errors
        .map((issue) => `- ${issue.path}: ${issue.message}`)
        .join("\n")}`,
    );
  }
}
