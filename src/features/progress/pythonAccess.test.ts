import { describe, expect, it } from "vitest";
import type {
  PythonCurriculumModule,
  PythonLessonTask,
} from "../../types/pythonLesson";
import {
  isPythonTaskAccessible,
  resolveAccessiblePythonTask,
} from "./pythonAccess";

function task(
  id: string,
  moduleId: string,
  prerequisites: string[] = [],
): PythonLessonTask {
  return { id, moduleId, prerequisites } as PythonLessonTask;
}

describe("Python task access", () => {
  const tasks = [
    task("py-m1-t1", "py-m1"),
    task("py-m1-t2", "py-m1", ["py-m1-t1"]),
    task("py-m2-t1", "py-m2", ["py-m1-t2"]),
  ];
  const modules = [
    { id: "py-m1", title: "EDA" },
    { id: "py-m2", title: "Temizlik" },
  ] as PythonCurriculumModule[];

  it("keeps every valid case open while prerequisites remain guidance", () => {
    expect(isPythonTaskAccessible(tasks[0], modules, tasks, {})).toBe(true);
    expect(isPythonTaskAccessible(tasks[1], modules, tasks, {})).toBe(true);
    expect(isPythonTaskAccessible(tasks[2], modules, tasks, {})).toBe(true);
  });

  it("opens a later deep link without redirecting", () => {
    const resolution = resolveAccessiblePythonTask(
      "py-m2-t1",
      modules,
      tasks,
      {},
    );
    expect(resolution.wasRedirected).toBe(false);
    expect(resolution.task?.id).toBe("py-m2-t1");
  });

  it("continues to resolve recommended-order cases after progress changes", () => {
    const progress = { "py-m1-t1": { completed: true } };
    expect(isPythonTaskAccessible(tasks[1], modules, tasks, progress)).toBe(
      true,
    );
    expect(
      resolveAccessiblePythonTask("py-m1-t2", modules, tasks, progress).task
        ?.id,
    ).toBe("py-m1-t2");
  });
});
