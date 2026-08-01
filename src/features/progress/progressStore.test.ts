import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { createVerifiedRunSnapshot } from "../evidence/evidenceSnapshot";
import {
  calculateStreak,
  createDefaultProgress,
  DEFAULT_PROFILE_DISPLAY_NAME,
  exportProgress,
  getProgressPersistenceIssue,
  importProgress,
  loadProgress,
  MAX_DECISION_NOTE_FIELD_CHARS,
  normalizeProfileName,
  recordAttempt,
  recordVerifiedRun,
  saveProgress,
  saveDecisionNote,
  updateProfileName,
  validateProfileName,
} from "./progressStore";

async function putRawProgress(value: unknown): Promise<void> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("queryvale", 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("workspace")) {
        request.result.createObjectStore("workspace");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction("workspace", "readwrite");
    transaction.objectStore("workspace").put(value, "progress");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function readRawProgress(): Promise<unknown> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("queryvale", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const value = await new Promise<unknown>((resolve, reject) => {
    const transaction = database.transaction("workspace", "readonly");
    const request = transaction.objectStore("workspace").get("progress");
    request.onsuccess = () => resolve(request.result as unknown);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return value;
}

function createLegacyV1Progress() {
  const current = recordAttempt(
    createDefaultProgress(),
    "m1-t1",
    "SELECT product_name, category FROM products",
    true,
    37,
  );
  return {
    version: 1 as const,
    startedAt: current.startedAt,
    lastOpenedTaskId: current.lastOpenedTaskId,
    activityDates: current.activityDates,
    tasks: current.tasks,
    settings: current.settings,
  };
}

function createLegacyV2Progress() {
  const current = updateProfileName(
    recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      "SELECT product_name, category FROM products",
      true,
      37,
    ),
    "Ada Analist",
  );
  return {
    version: 2 as const,
    profile: current.profile,
    startedAt: current.startedAt,
    lastOpenedTaskId: current.lastOpenedTaskId,
    activityDates: current.activityDates,
    tasks: current.tasks,
    settings: current.settings,
  };
}

function createLegacyV3Progress() {
  const current = recordAttempt(
    createDefaultProgress(),
    "m1-t3",
    "SELECT category, COUNT(*) FROM products GROUP BY category",
    false,
    0,
  );
  return {
    version: 3 as const,
    profile: current.profile,
    startedAt: current.startedAt,
    lastOpenedTaskId: "m1-t1",
    activityDates: current.activityDates,
    tasks: current.tasks,
    settings: current.settings,
    evidenceByTaskId: current.evidenceByTaskId,
  };
}

function createFirstTaskSnapshot(query = "SELECT product_name FROM products") {
  return createVerifiedRunSnapshot(
    "m1-t1",
    query,
    {
      columns: ["product_name"],
      rows: [{ product_name: "Desk Lamp" }],
      rowCount: 1,
      truncated: false,
    },
    "2026-07-31T09:00:00.000Z",
  );
}

describe("progressStore", () => {
  beforeEach(async () => {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase("queryvale");
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
    await loadProgress();
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
    expect(restored.version).toBe(4);
    expect(restored.lastOpenedTaskIdTrusted).toBe(true);
    expect(restored.profile.id).toBe(state.profile.id);
    expect(restored.profile.displayName).toBe(DEFAULT_PROFILE_DISPLAY_NAME);
    expect(restored.tasks["m1-t1"].completed).toBe(true);
    expect(restored.tasks["m1-t1"].lastQuery).toContain("SELECT");
    expect(restored.evidenceByTaskId).toEqual({});
  });

  it("exports and validates imported state", () => {
    const state = createDefaultProgress();
    expect(importProgress(exportProgress(state))).toEqual(state);
    expect(importProgress(exportProgress(state)).profile.id).toBe(
      state.profile.id,
    );
    expect(() => importProgress('{"version":4}')).toThrow(/geçerli/);
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
    expect(() =>
      importProgress(
        JSON.stringify({
          ...state,
          profile: { ...state.profile, displayName: "A" },
        }),
      ),
    ).toThrow(/geçerli/);
  });

  it("migrates a v1 import without losing learning data", () => {
    const legacy = createLegacyV1Progress();
    const migrated = importProgress(JSON.stringify(legacy));

    expect(migrated.version).toBe(4);
    expect(migrated.lastOpenedTaskIdTrusted).toBe(false);
    expect(migrated.profile.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu,
    );
    expect(migrated.profile.displayName).toBe(DEFAULT_PROFILE_DISPLAY_NAME);
    expect(migrated.startedAt).toBe(legacy.startedAt);
    expect(migrated.lastOpenedTaskId).toBe(legacy.lastOpenedTaskId);
    expect(migrated.activityDates).toEqual(legacy.activityDates);
    expect(migrated.tasks).toEqual(legacy.tasks);
    expect(migrated.settings).toEqual(legacy.settings);
    expect(migrated.evidenceByTaskId).toEqual({});
    expect(JSON.parse(exportProgress(migrated))).toMatchObject({ version: 4 });
  });

  it("loads and persists an IndexedDB v1 record as v4", async () => {
    const legacy = createLegacyV1Progress();
    await putRawProgress(legacy);

    const loaded = await loadProgress();
    const persisted = (await readRawProgress()) as {
      version?: number;
      profile?: { id?: string; displayName?: string };
      tasks?: unknown;
    };

    expect(loaded.version).toBe(4);
    expect(loaded.lastOpenedTaskIdTrusted).toBe(false);
    expect(loaded.tasks).toEqual(legacy.tasks);
    expect(loaded.evidenceByTaskId).toEqual({});
    expect(persisted.version).toBe(4);
    expect(persisted.profile?.id).toBe(loaded.profile.id);
    expect(persisted.profile?.displayName).toBe(DEFAULT_PROFILE_DISPLAY_NAME);
    expect(persisted.tasks).toEqual(legacy.tasks);
    expect((await loadProgress()).profile.id).toBe(loaded.profile.id);
  });

  it("migrates and persists a v2 profile without losing learning data", async () => {
    const legacy = createLegacyV2Progress();
    await putRawProgress(legacy);

    const loaded = await loadProgress();
    const persisted = (await readRawProgress()) as {
      version?: number;
      profile?: unknown;
      tasks?: unknown;
      evidenceByTaskId?: unknown;
    };

    expect(loaded.version).toBe(4);
    expect(loaded.lastOpenedTaskIdTrusted).toBe(false);
    expect(loaded.profile).toEqual(legacy.profile);
    expect(loaded.tasks).toEqual(legacy.tasks);
    expect(loaded.evidenceByTaskId).toEqual({});
    expect(persisted.version).toBe(4);
    expect(persisted.profile).toEqual(legacy.profile);
    expect(persisted.tasks).toEqual(legacy.tasks);
    expect(persisted.evidenceByTaskId).toEqual({});
  });

  it("migrates a v3 pointer as untrusted so the app can recover it once", async () => {
    const legacy = createLegacyV3Progress();
    await putRawProgress(legacy);

    const loaded = await loadProgress();
    const persisted = (await readRawProgress()) as {
      version?: number;
      lastOpenedTaskIdTrusted?: boolean;
      tasks?: unknown;
    };

    expect(loaded).toMatchObject({
      version: 4,
      lastOpenedTaskId: "m1-t1",
      lastOpenedTaskIdTrusted: false,
    });
    expect(loaded.tasks).toEqual(legacy.tasks);
    expect(persisted).toMatchObject({
      version: 4,
      lastOpenedTaskIdTrusted: false,
      tasks: legacy.tasks,
    });
  });

  it("preserves an incompatible stored record instead of overwriting it", async () => {
    const futureRecord = { version: 5, marker: "future-progress" };
    await putRawProgress(futureRecord);

    const fallback = await loadProgress();
    expect(fallback.version).toBe(4);
    expect(getProgressPersistenceIssue()).toBe("incompatible");
    await expect(saveProgress(fallback)).rejects.toThrow(/korunuyor/);
    expect(await readRawProgress()).toEqual(futureRecord);

    await saveProgress(fallback, { replaceIncompatible: true });
    expect(await readRawProgress()).toEqual(fallback);
    expect(getProgressPersistenceIssue()).toBeUndefined();
  });

  it("records only completed-task evidence and preserves the first verified run", () => {
    const initial = createDefaultProgress();
    const firstSnapshot = createFirstTaskSnapshot();
    expect(() => recordVerifiedRun(initial, firstSnapshot)).toThrow(
      /doğru değerlendirmeyle tamamlanan/,
    );

    const completed = recordAttempt(
      initial,
      "m1-t1",
      firstSnapshot.query,
      true,
      18,
    );
    const withEvidence = recordVerifiedRun(completed, firstSnapshot);
    expect(withEvidence).not.toBe(completed);
    expect(withEvidence.evidenceByTaskId["m1-t1"].verifiedRun).toEqual(
      firstSnapshot,
    );

    firstSnapshot.columns.push("sonradan-eklenen");
    firstSnapshot.previewRows[0].push("sonradan-eklenen");
    expect(withEvidence.evidenceByTaskId["m1-t1"].verifiedRun.columns).toEqual([
      "product_name",
    ]);

    const replacement = createFirstTaskSnapshot(
      "SELECT product_name FROM products ORDER BY product_name",
    );
    expect(recordVerifiedRun(withEvidence, replacement)).toBe(withEvidence);

    const replaced = recordVerifiedRun(withEvidence, replacement, {
      replace: true,
    });
    expect(replaced.evidenceByTaskId["m1-t1"].verifiedRun.query).toContain(
      "ORDER BY",
    );
  });

  it("saves a bounded decision note only when verified evidence exists", () => {
    const completed = recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      "SELECT product_name FROM products",
      true,
      18,
    );
    expect(() =>
      saveDecisionNote(completed, "m1-t1", {
        finding: "Stok azalmış.",
        recommendation: "Tedarik aç.",
      }),
    ).toThrow(/doğrulanmış bir sorgu kanıtı/);

    const withEvidence = recordVerifiedRun(
      completed,
      createFirstTaskSnapshot(),
    );
    const withNote = saveDecisionNote(withEvidence, "m1-t1", {
      finding: "  En düşük stok Desk Lamp ürününde.  ",
      recommendation: "  Yenileme siparişini önceliklendir. ",
      caveat: "   Tedarik süresi veri setinde bulunmuyor.   ",
    });

    expect(withNote.evidenceByTaskId["m1-t1"].note).toMatchObject({
      finding: "En düşük stok Desk Lamp ürününde.",
      recommendation: "Yenileme siparişini önceliklendir.",
      caveat: "Tedarik süresi veri setinde bulunmuyor.",
    });
    expect(
      Date.parse(
        withNote.evidenceByTaskId["m1-t1"].note?.updatedAt ?? "geçersiz",
      ),
    ).not.toBeNaN();
    expect(() =>
      saveDecisionNote(withEvidence, "m1-t1", {
        finding: "   ",
        recommendation: "Sipariş aç.",
      }),
    ).toThrow(/Bulgu boş/);
    expect(() =>
      saveDecisionNote(withEvidence, "m1-t1", {
        finding: "x".repeat(MAX_DECISION_NOTE_FIELD_CHARS + 1),
        recommendation: "Sipariş aç.",
      }),
    ).toThrow(/en fazla/);
  });

  it("round-trips valid evidence and rejects malformed notebook fields", () => {
    const completed = recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      "SELECT product_name FROM products",
      true,
      18,
    );
    const withEvidence = saveDecisionNote(
      recordVerifiedRun(completed, createFirstTaskSnapshot()),
      "m1-t1",
      {
        finding: "Desk Lamp sonuçta yer alıyor.",
        recommendation: "Katalog görünümünü paylaş.",
      },
    );

    expect(importProgress(exportProgress(withEvidence))).toEqual(withEvidence);

    const invalidColumns = {
      ...withEvidence,
      evidenceByTaskId: {
        "m1-t1": {
          ...withEvidence.evidenceByTaskId["m1-t1"],
          verifiedRun: {
            ...withEvidence.evidenceByTaskId["m1-t1"].verifiedRun,
            columns: Array.from({ length: 33 }, (_, index) => `c${index}`),
          },
        },
      },
    };
    expect(() => importProgress(JSON.stringify(invalidColumns))).toThrow(
      /geçerli/,
    );

    const invalidNote = {
      ...withEvidence,
      evidenceByTaskId: {
        "m1-t1": {
          ...withEvidence.evidenceByTaskId["m1-t1"],
          note: {
            ...withEvidence.evidenceByTaskId["m1-t1"].note,
            finding: "x".repeat(MAX_DECISION_NOTE_FIELD_CHARS + 1),
          },
        },
      },
    };
    expect(() => importProgress(JSON.stringify(invalidNote))).toThrow(
      /geçerli/,
    );

    const incompleteTask = {
      ...withEvidence,
      tasks: {
        "m1-t1": {
          ...withEvidence.tasks["m1-t1"],
          completed: false,
        },
      },
    };
    expect(() => importProgress(JSON.stringify(incompleteTask))).toThrow(
      /geçerli/,
    );
  });

  it("normalizes, validates and immutably updates the local profile name", () => {
    const state = recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      "SELECT product_name FROM products",
      true,
      12,
    );
    const input = "  ＳＱＬ   Ustası  ";

    expect(normalizeProfileName(input)).toBe("SQL Ustası");
    expect(validateProfileName(input)).toEqual({
      valid: true,
      normalizedName: "SQL Ustası",
    });

    const updated = updateProfileName(state, input);
    expect(updated).not.toBe(state);
    expect(updated.profile).not.toBe(state.profile);
    expect(updated.profile.id).toBe(state.profile.id);
    expect(updated.profile.displayName).toBe("SQL Ustası");
    expect(updated.tasks).toBe(state.tasks);
    expect(updated.settings).toBe(state.settings);
    expect(state.profile.displayName).toBe(DEFAULT_PROFILE_DISPLAY_NAME);
    expect(updateProfileName(updated, "SQL Ustası")).toBe(updated);
  });

  it("rejects unsafe or out-of-range profile names", () => {
    expect(validateProfileName("A").valid).toBe(false);
    expect(validateProfileName("x".repeat(33)).valid).toBe(false);
    expect(validateProfileName("Ada\nYılmaz").valid).toBe(false);
    expect(validateProfileName("Ada\u202eYılmaz").valid).toBe(false);
    expect(validateProfileName("Ada\u2066Yılmaz").valid).toBe(false);
    expect(validateProfileName("\u200B\u200B").valid).toBe(false);
    expect(validateProfileName("\uFE0F\uFE0F").valid).toBe(false);
    expect(validateProfileName("\u034F\u034F").valid).toBe(false);
    expect(validateProfileName("--").valid).toBe(false);
    expect(validateProfileName("🧭").valid).toBe(false);
    expect(validateProfileName("🧭 SQL").valid).toBe(true);
    expect(validateProfileName("Çağrı O'Neill-Demir").valid).toBe(true);
    expect(() => updateProfileName(createDefaultProgress(), "\tA")).toThrow(
      /Kullanıcı adı/,
    );
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
