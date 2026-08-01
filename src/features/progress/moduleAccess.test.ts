import { describe, expect, it } from "vitest";
import {
  buildModuleAccessStates,
  findFirstAccessibleIncompleteTask,
  resolveAccessibleTask,
} from "./moduleAccess";

const modules = [
  { id: "module-1", title: "Temel" },
  { id: "module-2", title: "Filtreleme" },
  { id: "module-3", title: "Birleştirme" },
];

const tasks = [
  { id: "m1-t1", moduleId: "module-1" },
  { id: "m1-t2", moduleId: "module-1" },
  { id: "m2-t1", moduleId: "module-2" },
  { id: "m2-t2", moduleId: "module-2" },
  { id: "m3-t1", moduleId: "module-3" },
];

describe("module access", () => {
  it("opens only the first module for a new learner", () => {
    expect(buildModuleAccessStates(modules, tasks, {})).toEqual([
      {
        moduleId: "module-1",
        isUnlocked: true,
        isComplete: false,
      },
      {
        moduleId: "module-2",
        isUnlocked: false,
        isComplete: false,
        blockingModule: { id: "module-1", title: "Temel" },
      },
      {
        moduleId: "module-3",
        isUnlocked: false,
        isComplete: false,
        blockingModule: { id: "module-1", title: "Temel" },
      },
    ]);
  });

  it("opens the next module only after every earlier task is complete", () => {
    const states = buildModuleAccessStates(modules, tasks, {
      "m1-t1": { completed: true },
      "m1-t2": { completed: true },
      "m2-t1": { completed: true },
    });

    expect(states[1]).toMatchObject({
      moduleId: "module-2",
      isUnlocked: true,
      isComplete: false,
    });
    expect(states[2]).toMatchObject({
      moduleId: "module-3",
      isUnlocked: false,
      blockingModule: { id: "module-2", title: "Filtreleme" },
    });
  });

  it("preserves but locks legacy completion beyond the first gap", () => {
    const states = buildModuleAccessStates(modules, tasks, {
      "m3-t1": { completed: true },
    });

    expect(states[2]).toMatchObject({
      isUnlocked: false,
      isComplete: true,
      blockingModule: { id: "module-1", title: "Temel" },
    });
  });

  it("redirects a locked request to the first accessible incomplete task", () => {
    const resolution = resolveAccessibleTask("m3-t1", modules, tasks, {
      "m3-t1": { completed: true },
    });

    expect(resolution).toMatchObject({
      task: tasks[0],
      requestedTask: tasks[4],
      wasRedirected: true,
      blockingModule: { id: "module-1", title: "Temel" },
    });
    expect(findFirstAccessibleIncompleteTask(modules, tasks, {})).toBe(
      tasks[0],
    );
  });

  it("keeps completed open modules repeatable", () => {
    const completed = Object.fromEntries(
      tasks.map((task) => [task.id, { completed: true }]),
    );
    const resolution = resolveAccessibleTask(
      "m1-t1",
      modules,
      tasks,
      completed,
    );

    expect(resolution).toMatchObject({
      task: tasks[0],
      wasRedirected: false,
    });
  });
});
