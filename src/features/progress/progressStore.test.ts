import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  calculateStreak,
  createDefaultProgress,
  exportProgress,
  importProgress,
  loadProgress,
  recordAttempt,
  saveProgress,
} from "./progressStore";

describe("progressStore", () => {
  beforeEach(async () => {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase("queryvale");
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  });

  it("saves and restores progress from IndexedDB", async () => {
    const state = recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      "SELECT * FROM branches",
      true,
      42,
    );
    await saveProgress(state);
    const restored = await loadProgress();
    expect(restored.tasks["m1-t1"].completed).toBe(true);
    expect(restored.tasks["m1-t1"].lastQuery).toContain("SELECT");
  });

  it("exports and validates imported state", () => {
    const state = createDefaultProgress();
    expect(importProgress(exportProgress(state))).toEqual(state);
    expect(() => importProgress('{"version":2}')).toThrow(/geçerli/);
    expect(() =>
      importProgress(
        JSON.stringify({
          ...state,
          tasks: { "m1-t1": null },
        }),
      ),
    ).toThrow(/geçerli/);
    expect(() =>
      importProgress(
        JSON.stringify({
          ...state,
          settings: { ...state.settings, lineHeight: "yüksek" },
        }),
      ),
    ).toThrow(/geçerli/);
  });

  it("calculates a continuous activity streak", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);
    expect(
      calculateStreak([
        yesterday.toISOString().slice(0, 10),
        today.toISOString().slice(0, 10),
      ]),
    ).toBe(2);
  });
});
