import type { LessonTask } from "../../types/lesson";

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
    "explanation",
    "completionMessage",
  ]) {
    requireString(source, property, issues);
  }

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

  if (!Array.isArray(source.hints) || source.hints.length < 3) {
    issues.push({
      severity: "error",
      path: "hints",
      message: "Her görev en az üç aşamalı ipucu içermelidir.",
    });
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
