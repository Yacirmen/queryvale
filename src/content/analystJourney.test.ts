import { describe, expect, it } from "vitest";
import { modules, tasks } from "./curriculum";
import {
  analystJourneyChapters,
  analystJourneyModuleCount,
  analystJourneyTaskCount,
  buildAnalystJourneyProgress,
} from "./analystJourney";

describe("analyst journey", () => {
  it("groups the real curriculum into four ordered career chapters", () => {
    expect(
      analystJourneyChapters.map((chapter) => ({
        title: chapter.title,
        moduleIds: chapter.moduleIds,
      })),
    ).toEqual([
      {
        title: "Temeli kur",
        moduleIds: ["module-1", "module-2", "module-3"],
      },
      {
        title: "İş sorusunu çöz",
        moduleIds: ["module-4", "module-5"],
      },
      {
        title: "Örüntüyü keşfet",
        moduleIds: ["module-6", "module-7"],
      },
      {
        title: "Karara dönüştür",
        moduleIds: ["module-8", "module-9", "module-10"],
      },
    ]);

    const journeyModuleIds = analystJourneyChapters.flatMap(
      (chapter) => chapter.moduleIds,
    );
    expect(new Set(journeyModuleIds).size).toBe(journeyModuleIds.length);
    expect(new Set(journeyModuleIds)).toEqual(
      new Set(modules.map((module) => module.id)),
    );
    expect(analystJourneyModuleCount).toBe(modules.length);
  });

  it("covers every real task exactly once", () => {
    const journeyTaskIds = analystJourneyChapters.flatMap(
      (chapter) => chapter.taskIds,
    );

    expect(new Set(journeyTaskIds).size).toBe(journeyTaskIds.length);
    expect(new Set(journeyTaskIds)).toEqual(
      new Set(tasks.map((task) => task.id)),
    );
    expect(analystJourneyTaskCount).toBe(tasks.length);

    analystJourneyChapters.forEach((chapter) => {
      expect(chapter.learnerPromise.trim()).not.toBe("");
      expect(chapter.workplaceOutcome.trim()).not.toBe("");
      expect(chapter.taskIds.length).toBeGreaterThan(0);
      expect(
        chapter.taskIds.every((taskId) =>
          tasks.some(
            (task) =>
              task.id === taskId && chapter.moduleIds.includes(task.moduleId),
          ),
        ),
      ).toBe(true);
    });
  });

  it("derives chapter progress only from completed task ids", () => {
    const firstFoundationTask = analystJourneyChapters[0].taskIds[0];
    const firstDecisionTask = analystJourneyChapters[3].taskIds[0];
    const progress = buildAnalystJourneyProgress(
      new Set([firstFoundationTask, firstDecisionTask, "not-a-real-task"]),
    );

    expect(progress[0]).toMatchObject({
      completedTaskCount: 1,
      totalTaskCount: 12,
      status: "active",
    });
    expect(progress[1]).toMatchObject({
      completedTaskCount: 0,
      totalTaskCount: 8,
      status: "open",
    });
    expect(progress[2]).toMatchObject({
      completedTaskCount: 0,
      totalTaskCount: 8,
      status: "open",
    });
    expect(progress[3]).toMatchObject({
      completedTaskCount: 1,
      totalTaskCount: 3,
      status: "active",
    });
  });

  it("recommends the first incomplete chapter without locking later work", () => {
    const completedFoundation = new Set(analystJourneyChapters[0].taskIds);
    const progress = buildAnalystJourneyProgress(completedFoundation);

    expect(progress[0].status).toBe("completed");
    expect(progress[1].status).toBe("recommended");
    expect(progress[2].status).toBe("open");
    expect(progress[3].status).toBe("open");
  });
});
