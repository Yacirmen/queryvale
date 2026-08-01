import { describe, expect, it } from "vitest";
import {
  createDefaultProgress,
  type ProgressState,
  type TaskProgress,
} from "./progressStore";
import { selectResumeTask, type ResumeTaskCandidate } from "./resumeTask";

const tasks: ResumeTaskCandidate[] = [
  { id: "m1-t1", prerequisites: [], nextTaskId: "m1-t2" },
  { id: "m1-t2", prerequisites: ["m1-t1"], nextTaskId: "m1-t3" },
  { id: "m1-t3", prerequisites: ["m1-t2"], nextTaskId: "m1-t4" },
  { id: "m1-t4", prerequisites: ["m1-t3"], nextTaskId: null },
];

function taskProgress(
  taskId: string,
  overrides: Partial<TaskProgress> = {},
): TaskProgress {
  return {
    taskId,
    attempts: 0,
    completed: false,
    lastQuery: "",
    hintsUsed: [],
    solutionRevealed: false,
    solveTimeSeconds: 0,
    firstTry: false,
    ...overrides,
  };
}

function withProgress(
  taskStates: Record<string, TaskProgress>,
  lastOpenedTaskId = "m1-t1",
  lastOpenedTaskIdTrusted = true,
): ProgressState {
  return {
    ...createDefaultProgress(),
    lastOpenedTaskId,
    lastOpenedTaskIdTrusted,
    tasks: taskStates,
  };
}

describe("selectResumeTask", () => {
  it("starts a learner without meaningful activity at the first task with onboarding", () => {
    const selection = selectResumeTask(tasks, createDefaultProgress());

    expect(selection).toMatchObject({
      task: tasks[0],
      isReturningLearner: false,
      shouldShowOnboarding: true,
      reason: "new-learner",
    });
  });

  it("keeps a later last-opened location even before the learner writes SQL", () => {
    const progress = {
      ...createDefaultProgress(),
      lastOpenedTaskId: "m1-t3",
    };

    expect(selectResumeTask(tasks, progress)).toMatchObject({
      task: tasks[2],
      isReturningLearner: true,
      shouldShowOnboarding: false,
      reason: "last-opened-location",
    });
  });

  it("keeps the last-opened incomplete task when it contains meaningful work", () => {
    const progress = withProgress(
      {
        "m1-t1": taskProgress("m1-t1", { completed: true }),
        "m1-t2": taskProgress("m1-t2", {
          lastQuery: "SELECT category FROM products",
        }),
      },
      "m1-t2",
    );

    expect(selectResumeTask(tasks, progress)).toMatchObject({
      task: tasks[1],
      isReturningLearner: true,
      shouldShowOnboarding: false,
      reason: "last-opened-activity",
    });
  });

  it("recovers the furthest incomplete activity after an old CTA overwrote the pointer", () => {
    const progress = withProgress(
      {
        "m1-t1": taskProgress("m1-t1", { completed: true }),
        "m1-t2": taskProgress("m1-t2", { completed: true }),
        "m1-t3": taskProgress("m1-t3", { attempts: 2 }),
      },
      "m1-t1",
      false,
    );

    expect(selectResumeTask(tasks, progress)).toMatchObject({
      task: tasks[2],
      reason: "recovered-activity",
      isReturningLearner: true,
      shouldShowOnboarding: false,
    });
  });

  it("prefers later work even when the overwritten first task also has an unfinished draft", () => {
    const progress = withProgress(
      {
        "m1-t1": taskProgress("m1-t1", { lastQuery: "SELECT *" }),
        "m1-t3": taskProgress("m1-t3", { hintsUsed: [0] }),
      },
      "m1-t1",
      false,
    );

    expect(selectResumeTask(tasks, progress)).toMatchObject({
      task: tasks[2],
      reason: "recovered-activity",
    });
  });

  it("uses the completed task's explicit nextTaskId", () => {
    const progress = withProgress(
      {
        "m1-t1": taskProgress("m1-t1", { completed: true }),
        "m1-t2": taskProgress("m1-t2", { completed: true }),
      },
      "m1-t2",
    );

    expect(selectResumeTask(tasks, progress)).toMatchObject({
      task: tasks[2],
      reason: "next-after-completion",
    });
  });

  it("honors an intentionally reopened first task after legacy recovery", () => {
    const progress = withProgress(
      {
        "m1-t1": taskProgress("m1-t1", { lastQuery: "SELECT *" }),
        "m1-t3": taskProgress("m1-t3", { attempts: 2 }),
      },
      "m1-t1",
      true,
    );

    expect(selectResumeTask(tasks, progress)).toMatchObject({
      task: tasks[0],
      reason: "last-opened-activity",
    });
  });

  it("falls back to the first prerequisite-ready incomplete task", () => {
    const disconnectedTasks: ResumeTaskCandidate[] = [
      { id: "a", prerequisites: [], nextTaskId: "missing" },
      { id: "b", prerequisites: ["a"], nextTaskId: null },
      { id: "c", prerequisites: ["never"], nextTaskId: null },
    ];
    const progress = withProgress(
      { a: taskProgress("a", { completed: true }) },
      "a",
    );

    expect(selectResumeTask(disconnectedTasks, progress)).toMatchObject({
      task: disconnectedTasks[1],
      reason: "first-available-incomplete",
    });
  });

  it("returns the last task when the curriculum is complete", () => {
    const progress = withProgress(
      Object.fromEntries(
        tasks.map((task) => [
          task.id,
          taskProgress(task.id, { completed: true }),
        ]),
      ),
      "m1-t4",
    );

    expect(selectResumeTask(tasks, progress)).toMatchObject({
      task: tasks[3],
      reason: "curriculum-complete",
      isReturningLearner: true,
      shouldShowOnboarding: false,
    });
  });

  it("treats a saved hint or verified evidence as returning activity", () => {
    const hinted = withProgress({
      "m1-t1": taskProgress("m1-t1", { hintsUsed: [0] }),
    });
    expect(selectResumeTask(tasks, hinted).isReturningLearner).toBe(true);

    const evidenced = {
      ...createDefaultProgress(),
      lastOpenedTaskIdTrusted: false,
      evidenceByTaskId: {
        "m1-t2": {
          taskId: "m1-t2",
          verifiedRun: {
            taskId: "m1-t2",
            query: "SELECT 1",
            columns: ["result"],
            previewRows: [["1"]],
            rowCount: 1,
            truncated: false,
            verifiedAt: new Date().toISOString(),
          },
        },
      },
    } satisfies ProgressState;

    expect(selectResumeTask(tasks, evidenced)).toMatchObject({
      task: tasks[1],
      reason: "recovered-activity",
      isReturningLearner: true,
    });
  });
});
