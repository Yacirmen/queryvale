import { tasks } from "./curriculum";

export type AnalystJourneyChapterId =
  | "build-the-foundation"
  | "solve-the-business-question"
  | "discover-the-pattern"
  | "turn-into-a-decision";

export interface AnalystJourneyChapter {
  id: AnalystJourneyChapterId;
  order: number;
  title: string;
  learnerPromise: string;
  workplaceOutcome: string;
  moduleIds: readonly string[];
  taskIds: readonly string[];
}

export type AnalystJourneyChapterStatus =
  "completed" | "active" | "recommended" | "open";

export interface AnalystJourneyChapterProgress extends AnalystJourneyChapter {
  completedTaskCount: number;
  totalTaskCount: number;
  completionRate: number;
  status: AnalystJourneyChapterStatus;
}

type AnalystJourneyChapterDefinition = Omit<AnalystJourneyChapter, "taskIds">;

const chapterDefinitions: readonly AnalystJourneyChapterDefinition[] = [
  {
    id: "build-the-foundation",
    order: 1,
    title: "Temeli kur",
    learnerPromise:
      "Tabloyu okuyup doğru kolonları seçer, iş koşullarını güvenilir bir sorguya çevirirsin.",
    workplaceOutcome:
      "Tek tablodan temiz, filtrelenmiş ve raporlanabilir bir karar seti çıkarırsın.",
    moduleIds: ["module-1", "module-2", "module-3"],
  },
  {
    id: "solve-the-business-question",
    order: 2,
    title: "İş sorusunu çöz",
    learnerPromise:
      "İşlem satırlarını metriklere indirger, farklı tablolardaki parçaları doğru tanede birleştirirsin.",
    workplaceOutcome:
      "Operasyon ve yönetim sorularını özetleyen, kapsamı korunmuş analiz tabloları üretirsin.",
    moduleIds: ["module-4", "module-5"],
  },
  {
    id: "discover-the-pattern",
    order: 3,
    title: "Örüntüyü keşfet",
    learnerPromise:
      "Çok adımlı analizleri okunaklı parçalara ayırır; sıra, değişim ve hareketli eğilimleri bulursun.",
    workplaceOutcome:
      "Ham satırların içindeki liderleri, dönemsel değişimi ve davranış örüntülerini görünür kılarsın.",
    moduleIds: ["module-6", "module-7"],
  },
  {
    id: "turn-into-a-decision",
    order: 4,
    title: "Karara dönüştür",
    learnerPromise:
      "Güvenli veri işlemi, analitik model ve çok kaynaklı karar projelerini aynı kanıt zincirinde birleştirirsin.",
    workplaceOutcome:
      "Veri güvenini koruyarak risk, kârlılık ve operasyon önceliğini açıklayan yöneticiye hazır karar setleri teslim edersin.",
    moduleIds: ["module-8", "module-9", "module-10"],
  },
] as const;

function taskIdsForModules(moduleIds: readonly string[]): string[] {
  const moduleIdSet = new Set(moduleIds);
  return tasks
    .filter((task) => moduleIdSet.has(task.moduleId))
    .map((task) => task.id);
}

/**
 * Career chapters are a presentation layer over the real curriculum. They do
 * not introduce parallel lessons, prerequisites, or synthetic progress.
 */
export const analystJourneyChapters: readonly AnalystJourneyChapter[] =
  chapterDefinitions.map((chapter) => ({
    ...chapter,
    taskIds: taskIdsForModules(chapter.moduleIds),
  }));

export function buildAnalystJourneyProgress(
  completedTaskIds: ReadonlySet<string>,
): AnalystJourneyChapterProgress[] {
  const completedCounts = analystJourneyChapters.map(
    (chapter) =>
      chapter.taskIds.filter((taskId) => completedTaskIds.has(taskId)).length,
  );
  const recommendedChapterIndex = completedCounts.findIndex(
    (count, index) => count < analystJourneyChapters[index].taskIds.length,
  );

  return analystJourneyChapters.map((chapter, index) => {
    const completedTaskCount = completedCounts[index];
    const totalTaskCount = chapter.taskIds.length;
    const isComplete =
      totalTaskCount > 0 && completedTaskCount === totalTaskCount;
    const status: AnalystJourneyChapterStatus = isComplete
      ? "completed"
      : completedTaskCount > 0
        ? "active"
        : index === recommendedChapterIndex
          ? "recommended"
          : "open";

    return {
      ...chapter,
      completedTaskCount,
      totalTaskCount,
      completionRate: totalTaskCount
        ? Math.round((completedTaskCount / totalTaskCount) * 100)
        : 0,
      status,
    };
  });
}

/** Useful for content validation and UI labels without duplicating counts. */
export const analystJourneyModuleCount = new Set(
  analystJourneyChapters.flatMap((chapter) => chapter.moduleIds),
).size;

export const analystJourneyTaskCount = new Set(
  analystJourneyChapters.flatMap((chapter) => chapter.taskIds),
).size;
