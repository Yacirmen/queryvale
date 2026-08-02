import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { createVerifiedRunSnapshot } from "../evidence/evidenceSnapshot";
import {
  activateLocalProfileSession,
  calculateStreak,
  createActiveLocalProfileSession,
  createLocalAccount,
  createDefaultProgress,
  createSignedOutLocalProfileSession,
  DEFAULT_PROFILE_DISPLAY_NAME,
  eraseLocalProfileAndProgress,
  exportProgress,
  getProgressPersistenceIssue,
  hasLocalAccount,
  importProgress,
  loadLocalProfileSession,
  loadProgress,
  localDateKey,
  MAX_DECISION_NOTE_FIELD_CHARS,
  MAX_PYTHON_CODE_CHARS,
  MAX_PYTHON_EVIDENCE_COLUMNS,
  MAX_PYTHON_EVIDENCE_PREVIEW_ROWS,
  MAX_PYTHON_EVIDENCE_STDOUT_CHARS,
  normalizeProfileName,
  recordAttempt,
  recordHint,
  recordPracticeActivity,
  recordPythonAttempt,
  recordPythonDraft,
  recordPythonEvidence,
  recordPythonHint,
  recordPythonSolutionReveal,
  recordPythonTaskOpen,
  recordSolutionReveal,
  recordVerifiedRun,
  resetProgress,
  resolveLocalProfileAccess,
  saveProgress,
  saveProgressWithLocalProfileSession,
  saveDecisionNote,
  signOutLocalProfileSession,
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

function replaceIndexedDB(value: IDBFactory | undefined): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    value,
  });
  return () => {
    if (descriptor) Object.defineProperty(globalThis, "indexedDB", descriptor);
  };
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
    tasks: withoutV5ScoreFields(current.tasks),
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
    tasks: withoutV5ScoreFields(current.tasks),
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
    tasks: withoutV5ScoreFields(current.tasks),
    settings: current.settings,
    evidenceByTaskId: current.evidenceByTaskId,
  };
}

function createLegacyV4Progress() {
  const withHint = recordHint(createDefaultProgress(), "m1-t1", 0);
  const current = recordAttempt(
    withHint,
    "m1-t1",
    "SELECT product_name, category FROM products",
    true,
    37,
  );
  const legacyTasks = withoutV5ScoreFields(current.tasks);
  return {
    version: 4 as const,
    profile: current.profile,
    startedAt: current.startedAt,
    lastOpenedTaskId: current.lastOpenedTaskId,
    lastOpenedTaskIdTrusted: true,
    activityDates: current.activityDates,
    tasks: legacyTasks,
    settings: current.settings,
    evidenceByTaskId: current.evidenceByTaskId,
  };
}

function createLegacyV5Progress() {
  const current = createLocalAccount(
    recordAttempt(
      recordHint(createDefaultProgress(), "m1-t2", 0),
      "m1-t2",
      "SELECT DISTINCT category FROM products",
      true,
      24,
    ),
    "Ada Analist",
  );
  return {
    version: 5 as const,
    profile: current.profile,
    startedAt: current.startedAt,
    lastOpenedTaskId: "m1-t2",
    lastOpenedTaskIdTrusted: true,
    activityDates: current.activityDates,
    tasks: current.tasks,
    settings: current.settings,
    evidenceByTaskId: current.evidenceByTaskId,
  };
}

function withoutV5ScoreFields(
  tasks: ReturnType<typeof createDefaultProgress>["tasks"],
) {
  return Object.fromEntries(
    Object.entries(tasks).map(([taskId, task]) => [
      taskId,
      {
        taskId: task.taskId,
        attempts: task.attempts,
        completed: task.completed,
        ...(task.firstCompletedAt
          ? { firstCompletedAt: task.firstCompletedAt }
          : {}),
        ...(task.lastCompletedAt
          ? { lastCompletedAt: task.lastCompletedAt }
          : {}),
        lastQuery: task.lastQuery,
        hintsUsed: [...task.hintsUsed],
        solveTimeSeconds: task.solveTimeSeconds,
        firstTry: task.firstTry,
      },
    ]),
  );
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

function createPythonEvidence(taskId = "py-m1-t1") {
  return {
    taskId,
    runtimeVersion: "0.29.4",
    contentVersion: "2026.08.02",
    verifiedAt: "2026-08-02T09:00:00.000Z",
    columns: ["region", "orders", "conversion_rate"],
    dtypes: ["string", "int64", "float64"],
    previewRows: [
      ["Marmara", 42, 0.18],
      ["Ege", 31, null],
    ],
    rowCount: 2,
    stdout: "2 satır üretildi\n",
  };
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
    expect(restored.version).toBe(6);
    expect(restored.lastOpenedTaskIdTrusted).toBe(true);
    expect(restored.profile.id).toBe(state.profile.id);
    expect(restored.profile.displayName).toBe(DEFAULT_PROFILE_DISPLAY_NAME);
    expect(restored.tasks["m1-t1"].completed).toBe(true);
    expect(restored.tasks["m1-t1"].lastQuery).toContain("SELECT");
    expect(restored.evidenceByTaskId).toEqual({});
    expect(restored.lastOpenedPythonTaskId).toBe("py-m1-t1");
    expect(restored.pythonTasks).toEqual({});
    expect(restored.pythonEvidenceByTaskId).toEqual({});
  });

  it("exports and validates imported state", () => {
    const state = createDefaultProgress();
    expect(importProgress(exportProgress(state))).toEqual(state);
    expect(importProgress(exportProgress(state)).profile.id).toBe(
      state.profile.id,
    );
    expect(() => importProgress('{"version":6}')).toThrow(/geçerli/);
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

    expect(migrated.version).toBe(6);
    expect(migrated.lastOpenedTaskIdTrusted).toBe(false);
    expect(migrated.profile.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu,
    );
    expect(migrated.profile.displayName).toBe(DEFAULT_PROFILE_DISPLAY_NAME);
    expect(migrated.startedAt).toBe(legacy.startedAt);
    expect(migrated.lastOpenedTaskId).toBe(legacy.lastOpenedTaskId);
    expect(migrated.activityDates).toEqual(legacy.activityDates);
    expect(migrated.tasks["m1-t1"]).toMatchObject({
      completed: true,
      solutionRevealed: false,
      scoreAwarded: 10,
    });
    expect(migrated.settings).toEqual(legacy.settings);
    expect(migrated.evidenceByTaskId).toEqual({});
    expect(migrated.lastOpenedPythonTaskId).toBe("py-m1-t1");
    expect(migrated.pythonTasks).toEqual({});
    expect(migrated.pythonEvidenceByTaskId).toEqual({});
    expect(JSON.parse(exportProgress(migrated))).toMatchObject({ version: 6 });
  });

  it("loads and persists an IndexedDB v1 record as v6", async () => {
    const legacy = createLegacyV1Progress();
    await putRawProgress(legacy);

    const loaded = await loadProgress();
    const persisted = (await readRawProgress()) as {
      version?: number;
      profile?: { id?: string; displayName?: string };
      tasks?: unknown;
    };

    expect(loaded.version).toBe(6);
    expect(loaded.lastOpenedTaskIdTrusted).toBe(false);
    expect(loaded.tasks["m1-t1"]).toMatchObject({
      completed: true,
      solutionRevealed: false,
      scoreAwarded: 10,
    });
    expect(loaded.evidenceByTaskId).toEqual({});
    expect(persisted.version).toBe(6);
    expect(persisted.profile?.id).toBe(loaded.profile.id);
    expect(persisted.profile?.displayName).toBe(DEFAULT_PROFILE_DISPLAY_NAME);
    expect(persisted.tasks).toEqual(loaded.tasks);
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

    expect(loaded.version).toBe(6);
    expect(loaded.lastOpenedTaskIdTrusted).toBe(false);
    expect(loaded.profile).toEqual(legacy.profile);
    expect(loaded.tasks["m1-t1"]).toMatchObject({
      completed: true,
      solutionRevealed: false,
      scoreAwarded: 10,
    });
    expect(loaded.evidenceByTaskId).toEqual({});
    expect(persisted.version).toBe(6);
    expect(persisted.profile).toEqual(legacy.profile);
    expect(persisted.tasks).toEqual(loaded.tasks);
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
      version: 6,
      lastOpenedTaskId: "m1-t1",
      lastOpenedTaskIdTrusted: false,
    });
    expect(loaded.tasks["m1-t3"]).toMatchObject({
      completed: false,
      solutionRevealed: false,
    });
    expect(loaded.tasks["m1-t3"].scoreAwarded).toBeUndefined();
    expect(persisted).toMatchObject({
      version: 6,
      lastOpenedTaskIdTrusted: false,
      tasks: {
        "m1-t3": {
          taskId: "m1-t3",
          attempts: 1,
          completed: false,
          solutionRevealed: false,
        },
      },
    });
  });

  it("migrates v4 cases to locked scores without inventing solution use", async () => {
    const legacy = createLegacyV4Progress();
    const legacyWithInjectedV5Fields = {
      ...legacy,
      tasks: {
        ...legacy.tasks,
        "m1-t1": {
          ...legacy.tasks["m1-t1"],
          solutionRevealed: true,
          scoreAwarded: 10,
        },
      },
    };
    await putRawProgress(legacyWithInjectedV5Fields);

    const loaded = await loadProgress();
    const persisted = (await readRawProgress()) as {
      version?: number;
      tasks?: Record<
        string,
        { solutionRevealed?: boolean; scoreAwarded?: number }
      >;
    };

    expect(loaded.version).toBe(6);
    expect(loaded.tasks["m1-t1"]).toMatchObject({
      completed: true,
      hintsUsed: [0],
      solutionRevealed: false,
      scoreAwarded: 7,
    });
    expect(persisted.version).toBe(6);
    expect(persisted.tasks?.["m1-t1"]).toMatchObject({
      solutionRevealed: false,
      scoreAwarded: 7,
    });
  });

  it("migrates and persists v5 SQL progress without data loss", async () => {
    const legacy = createLegacyV5Progress();
    await putRawProgress(legacy);

    const loaded = await loadProgress();
    const persisted = await readRawProgress();

    expect(loaded).toMatchObject({
      version: 6,
      profile: legacy.profile,
      startedAt: legacy.startedAt,
      lastOpenedTaskId: legacy.lastOpenedTaskId,
      lastOpenedTaskIdTrusted: legacy.lastOpenedTaskIdTrusted,
      activityDates: legacy.activityDates,
      tasks: legacy.tasks,
      settings: legacy.settings,
      evidenceByTaskId: legacy.evidenceByTaskId,
      lastOpenedPythonTaskId: "py-m1-t1",
      pythonTasks: {},
      pythonEvidenceByTaskId: {},
    });
    expect(persisted).toEqual(loaded);
  });

  it("preserves an incompatible stored record instead of overwriting it", async () => {
    const futureRecord = { version: 7, marker: "future-progress" };
    await putRawProgress(futureRecord);

    const fallback = await loadProgress();
    expect(fallback.version).toBe(6);
    expect(getProgressPersistenceIssue()).toBe("incompatible");
    await expect(saveProgress(fallback)).rejects.toThrow(/korunuyor/);
    expect(await readRawProgress()).toEqual(futureRecord);

    await saveProgress(fallback, { replaceIncompatible: true });
    expect(await readRawProgress()).toEqual(fallback);
    expect(getProgressPersistenceIssue()).toBeUndefined();
  });

  it("does not overwrite a real record after a non-authoritative read failure", async () => {
    const preserved = recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      "SELECT product_name FROM products",
      true,
      21,
    );
    await saveProgress(preserved);

    const restoreIndexedDB = replaceIndexedDB({
      open: () => {
        throw new Error("temporary read failure");
      },
    } as unknown as IDBFactory);
    const fallback = await loadProgress();
    restoreIndexedDB();

    expect(getProgressPersistenceIssue()).toBe("unavailable");
    await expect(saveProgress(fallback)).rejects.toThrow(
      /okunamadığı için korunuyor/,
    );
    expect(await readRawProgress()).toEqual(preserved);

    await saveProgress(fallback, { replaceIncompatible: true });
    expect(await readRawProgress()).toEqual(fallback);
  });

  it("does not mark progress storage healthy after only a session write succeeds", async () => {
    const account = createLocalAccount(createDefaultProgress(), "Ada Analist");
    const restoreIndexedDB = replaceIndexedDB(undefined);
    await loadProgress();
    restoreIndexedDB();

    await activateLocalProfileSession(account);
    expect(getProgressPersistenceIssue()).toBe("unavailable");
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

  it("records Python drafts, attempts and a score locked on first completion", () => {
    const initial = createDefaultProgress();
    const opened = recordPythonTaskOpen(initial, "py-m2-t3");
    const drafted = recordPythonDraft(
      opened,
      "py-m2-t3",
      "orders.groupby('region').size()",
    );
    const failed = recordPythonAttempt(
      drafted,
      "py-m2-t3",
      "orders.groupby('region')",
      false,
      4,
      new Date("2026-08-02T09:00:00.000Z"),
    );
    const hinted = recordPythonHint(
      failed,
      "py-m2-t3",
      0,
      new Date("2026-08-02T09:01:00.000Z"),
    );
    const completed = recordPythonAttempt(
      hinted,
      "py-m2-t3",
      "orders.groupby('region').size()",
      true,
      33,
      new Date("2026-08-02T09:02:00.000Z"),
    );
    const reviewed = recordPythonAttempt(
      recordPythonHint(completed, "py-m2-t3", 1),
      "py-m2-t3",
      "orders.groupby('region').size().sort_values()",
      true,
      12,
    );

    expect(opened.lastOpenedPythonTaskId).toBe("py-m2-t3");
    expect(opened.lastOpenedTaskId).toBe(initial.lastOpenedTaskId);
    expect(drafted.pythonTasks["py-m2-t3"].lastCode).toContain("groupby");
    expect(completed.pythonTasks["py-m2-t3"]).toMatchObject({
      attempts: 2,
      completed: true,
      hintsUsed: [0],
      solutionRevealed: false,
      scoreAwarded: 7,
      solveTimeSeconds: 33,
      firstTry: false,
    });
    expect(reviewed.pythonTasks["py-m2-t3"]).toMatchObject({
      attempts: 3,
      hintsUsed: [0, 1],
      scoreAwarded: 7,
    });
    expect(recordPythonSolutionReveal(reviewed, "py-m2-t3")).toBe(reviewed);
    expect(reviewed.tasks).toBe(initial.tasks);

    expect(() =>
      recordPythonDraft(
        initial,
        "py-m1-t1",
        "x".repeat(MAX_PYTHON_CODE_CHARS + 1),
      ),
    ).toThrow(/en fazla/);
    expect(() => recordPythonHint(initial, "py-m1-t1", 3)).toThrow(/0 ile 2/);
  });

  it("awards zero to Python work after the full solution is revealed", () => {
    const assisted = recordPythonSolutionReveal(
      createDefaultProgress(),
      "py-m1-t1",
    );
    const completed = recordPythonAttempt(
      assisted,
      "py-m1-t1",
      "print('merhaba')",
      true,
      8,
    );

    expect(completed.pythonTasks["py-m1-t1"]).toMatchObject({
      completed: true,
      firstTry: true,
      solutionRevealed: true,
      scoreAwarded: 0,
    });
  });

  it("accepts only canonical Python hint prefixes during import", () => {
    const onceHinted = recordPythonHint(createDefaultProgress(), "py-m1-t1", 0);
    const twiceHinted = recordPythonHint(onceHinted, "py-m1-t1", 1);
    const fullyHinted = recordPythonHint(twiceHinted, "py-m1-t1", 2);

    for (const state of [
      recordPythonDraft(createDefaultProgress(), "py-m1-t1", "result = None"),
      onceHinted,
      twiceHinted,
      fullyHinted,
    ]) {
      expect(importProgress(exportProgress(state))).toEqual(state);
    }

    for (const malformedHints of [[1], [2], [0, 2], [1, 0], [0, 1, 1]]) {
      const malformed = {
        ...onceHinted,
        pythonTasks: {
          ...onceHinted.pythonTasks,
          "py-m1-t1": {
            ...onceHinted.pythonTasks["py-m1-t1"],
            hintsUsed: malformedHints,
          },
        },
      };
      expect(
        () => importProgress(JSON.stringify(malformed)),
        `hintsUsed=${JSON.stringify(malformedHints)}`,
      ).toThrow(/geçerli/);
    }
  });

  it("stores bounded Python evidence only for completed work and clones it", () => {
    const entry = createPythonEvidence();
    expect(() => recordPythonEvidence(createDefaultProgress(), entry)).toThrow(
      /tamamlanan bir görev/,
    );

    const completed = recordPythonAttempt(
      createDefaultProgress(),
      "py-m1-t1",
      "summary = orders.groupby('region').size()",
      true,
      18,
    );
    const withEvidence = recordPythonEvidence(completed, entry);

    entry.columns[0] = "mutated";
    entry.dtypes[0] = "object";
    entry.previewRows[0][0] = "mutated";
    expect(withEvidence.pythonEvidenceByTaskId["py-m1-t1"]).toMatchObject({
      taskId: "py-m1-t1",
      columns: ["region", "orders", "conversion_rate"],
      dtypes: ["string", "int64", "float64"],
      previewRows: [
        ["Marmara", 42, 0.18],
        ["Ege", 31, null],
      ],
    });
    expect(recordPythonEvidence(withEvidence, createPythonEvidence())).toBe(
      withEvidence,
    );
  });

  it("round-trips v6 Python data and rejects unsafe evidence limits", () => {
    const completed = recordPythonAttempt(
      createDefaultProgress(),
      "py-m1-t1",
      "summary = orders.groupby('region').size()",
      true,
      18,
    );
    const state = recordPythonEvidence(completed, createPythonEvidence());

    expect(importProgress(exportProgress(state))).toEqual(state);

    const oversizedCode = {
      ...state,
      pythonTasks: {
        ...state.pythonTasks,
        "py-m1-t1": {
          ...state.pythonTasks["py-m1-t1"],
          lastCode: "x".repeat(MAX_PYTHON_CODE_CHARS + 1),
        },
      },
    };
    expect(() => importProgress(JSON.stringify(oversizedCode))).toThrow(
      /geçerli/,
    );

    const tooManyColumns = Array.from(
      { length: MAX_PYTHON_EVIDENCE_COLUMNS + 1 },
      (_, index) => `c${index}`,
    );
    const invalidColumns = {
      ...state,
      pythonEvidenceByTaskId: {
        "py-m1-t1": {
          ...createPythonEvidence(),
          columns: tooManyColumns,
          dtypes: tooManyColumns.map(() => "string"),
          previewRows: [],
        },
      },
    };
    expect(() => importProgress(JSON.stringify(invalidColumns))).toThrow(
      /geçerli/,
    );

    const invalidRows = {
      ...state,
      pythonEvidenceByTaskId: {
        "py-m1-t1": {
          ...createPythonEvidence(),
          previewRows: Array.from(
            { length: MAX_PYTHON_EVIDENCE_PREVIEW_ROWS + 1 },
            () => ["Marmara", 42, 0.18],
          ),
          rowCount: MAX_PYTHON_EVIDENCE_PREVIEW_ROWS + 1,
        },
      },
    };
    expect(() => importProgress(JSON.stringify(invalidRows))).toThrow(
      /geçerli/,
    );

    const invalidDtype = {
      ...state,
      pythonEvidenceByTaskId: {
        "py-m1-t1": {
          ...createPythonEvidence(),
          dtypes: ["string", "int64\n", "float64"],
        },
      },
    };
    expect(() => importProgress(JSON.stringify(invalidDtype))).toThrow(
      /geçerli/,
    );

    const invalidCell = {
      ...state,
      pythonEvidenceByTaskId: {
        "py-m1-t1": {
          ...createPythonEvidence(),
          previewRows: [["Marmara", Number.POSITIVE_INFINITY, 0.18]],
          rowCount: 1,
        },
      },
    };
    expect(() =>
      recordPythonEvidence(
        completed,
        invalidCell.pythonEvidenceByTaskId["py-m1-t1"],
      ),
    ).toThrow(/geçerli/);

    const invalidStdout = {
      ...state,
      pythonEvidenceByTaskId: {
        "py-m1-t1": {
          ...createPythonEvidence(),
          stdout: "x".repeat(MAX_PYTHON_EVIDENCE_STDOUT_CHARS + 1),
        },
      },
    };
    expect(() => importProgress(JSON.stringify(invalidStdout))).toThrow(
      /geçerli/,
    );
  });

  it("resets Python progress and evidence together with the current workspace", async () => {
    const progressed = recordPythonEvidence(
      recordPythonAttempt(
        createDefaultProgress(),
        "py-m1-t1",
        "print('hazır')",
        true,
        7,
      ),
      createPythonEvidence(),
    );
    await saveProgress(progressed);

    const reset = await resetProgress();
    const reloaded = await loadProgress();

    expect(reloaded).toEqual(reset);
    expect(reset.lastOpenedPythonTaskId).toBe("py-m1-t1");
    expect(reset.pythonTasks).toEqual({});
    expect(reset.pythonEvidenceByTaskId).toEqual({});
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
    expect(updated.profile.localAccountCreatedAt).toEqual(expect.any(String));
    expect(updated.tasks).toBe(state.tasks);
    expect(updated.settings).toBe(state.settings);
    expect(state.profile.displayName).toBe(DEFAULT_PROFILE_DISPLAY_NAME);
    expect(updateProfileName(updated, "SQL Ustası")).toBe(updated);
  });

  it("distinguishes an explicitly created local account from guest activity", () => {
    const guest = recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      "SELECT product_name FROM products",
      false,
      8,
    );

    expect(hasLocalAccount(guest)).toBe(false);

    const account = createLocalAccount(guest, DEFAULT_PROFILE_DISPLAY_NAME);
    expect(hasLocalAccount(account)).toBe(true);
    expect(account.profile.displayName).toBe(DEFAULT_PROFILE_DISPLAY_NAME);
    expect(account.profile.localAccountCreatedAt).toEqual(expect.any(String));
    expect(guest.profile.localAccountCreatedAt).toBeUndefined();

    expect(
      hasLocalAccount(
        updateProfileName(createDefaultProgress(), "Ada Analist"),
      ),
    ).toBe(true);

    const legacyState = createDefaultProgress();
    const legacyNamedAccount = {
      ...legacyState,
      profile: { ...legacyState.profile, displayName: "Eski Analist" },
    };
    const renamedToDefault = updateProfileName(
      legacyNamedAccount,
      DEFAULT_PROFILE_DISPLAY_NAME,
    );
    expect(hasLocalAccount(renamedToDefault)).toBe(true);
    expect(renamedToDefault.profile.localAccountCreatedAt).toEqual(
      expect.any(String),
    );
  });

  it("resolves guest, legacy active, signed-out and mismatched profile sessions", () => {
    const guest = createDefaultProgress();
    const account = createLocalAccount(guest, "Ada Analist");

    expect(resolveLocalProfileAccess(guest, undefined)).toBe("guest");
    expect(resolveLocalProfileAccess(account, undefined)).toBe("active");

    const active = createActiveLocalProfileSession(account);
    const signedOut = createSignedOutLocalProfileSession(account);
    expect(resolveLocalProfileAccess(account, active)).toBe("active");
    expect(resolveLocalProfileAccess(account, signedOut)).toBe("signed-out");
    expect(
      resolveLocalProfileAccess(account, {
        ...active,
        profileId: crypto.randomUUID(),
      }),
    ).toBe("signed-out");
    expect(resolveLocalProfileAccess(account, { status: "active" })).toBe(
      "signed-out",
    );
  });

  it("keeps a legacy local profile active until an explicit sign-out persists", async () => {
    const progressed = recordAttempt(
      createLocalAccount(createDefaultProgress(), "Ada Analist"),
      "m1-t1",
      "SELECT product_name FROM products",
      true,
      16,
    );
    await saveProgress(progressed);

    expect(await loadLocalProfileSession(progressed)).toEqual({
      access: "active",
    });

    const signedOut = await signOutLocalProfileSession(progressed);
    expect(signedOut).toMatchObject({
      version: 1,
      status: "signed-out",
      profileId: progressed.profile.id,
    });

    const reloadedProgress = await loadProgress();
    expect(await loadLocalProfileSession(reloadedProgress)).toMatchObject({
      access: "signed-out",
      session: signedOut,
    });
    expect(reloadedProgress.tasks).toEqual(progressed.tasks);

    const active = await activateLocalProfileSession(reloadedProgress);
    expect(active.status).toBe("active");
    expect(await loadLocalProfileSession(reloadedProgress)).toMatchObject({
      access: "active",
      session: active,
    });
    expect((await loadProgress()).tasks).toEqual(progressed.tasks);
  });

  it("atomically replaces progress together with an explicit profile session", async () => {
    const importedAccount = createLocalAccount(
      recordAttempt(
        createDefaultProgress(),
        "m1-t1",
        "SELECT product_name, category FROM products",
        true,
        28,
      ),
      "Ayşe Analist",
    );
    const importedSession = createActiveLocalProfileSession(importedAccount);

    await saveProgressWithLocalProfileSession(importedAccount, importedSession);

    expect(await loadProgress()).toEqual(importedAccount);
    expect(await loadLocalProfileSession(importedAccount)).toMatchObject({
      access: "active",
      session: importedSession,
    });
    expect(exportProgress(importedAccount)).not.toContain(
      "local-profile-session",
    );

    const guestImport = recordAttempt(
      createDefaultProgress(),
      "m1-t2",
      "SELECT DISTINCT category FROM products",
      false,
      9,
    );
    await saveProgressWithLocalProfileSession(guestImport, undefined);

    expect(await loadProgress()).toEqual(guestImport);
    expect(await loadLocalProfileSession(guestImport)).toEqual({
      access: "guest",
    });
  });

  it("rejects profile and session combinations that cannot describe one workspace", async () => {
    const account = createLocalAccount(createDefaultProgress(), "Ada Analist");
    const active = createActiveLocalProfileSession(account);

    await expect(
      saveProgressWithLocalProfileSession(account, undefined),
    ).rejects.toThrow(/oturum bilgisi olmadan/);
    await expect(
      saveProgressWithLocalProfileSession(createDefaultProgress(), active),
    ).rejects.toThrow(/Misafir çalışma alanına/);
    await expect(
      saveProgressWithLocalProfileSession(account, {
        ...active,
        profileId: crypto.randomUUID(),
      }),
    ).rejects.toThrow(/eşleşmiyor/);

    await saveProgressWithLocalProfileSession(account, active);
    const otherAccount = createLocalAccount(
      createDefaultProgress(),
      "Başka Analist",
    );
    await saveProgress(otherAccount);
    expect(await loadLocalProfileSession(otherAccount)).toMatchObject({
      access: "signed-out",
    });
  });

  it("erases the profile, session and learning data as one guest transition", async () => {
    const withSqlProgress = recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      "SELECT product_name FROM products",
      true,
      14,
    );
    const withPythonProgress = recordPythonEvidence(
      recordPythonAttempt(
        withSqlProgress,
        "py-m1-t1",
        "print('hazır')",
        true,
        9,
      ),
      createPythonEvidence(),
    );
    const account = createLocalAccount(withPythonProgress, "Ada Analist");
    const personalized = {
      ...account,
      settings: { ...account.settings, theme: "light" as const },
    };
    await saveProgressWithLocalProfileSession(
      personalized,
      createActiveLocalProfileSession(personalized),
    );

    const emptyGuest = await eraseLocalProfileAndProgress();
    const reloaded = await loadProgress();

    expect(reloaded).toEqual(emptyGuest);
    expect(hasLocalAccount(reloaded)).toBe(false);
    expect(reloaded.tasks).toEqual({});
    expect(reloaded.evidenceByTaskId).toEqual({});
    expect(reloaded.pythonTasks).toEqual({});
    expect(reloaded.pythonEvidenceByTaskId).toEqual({});
    expect(reloaded.lastOpenedPythonTaskId).toBe("py-m1-t1");
    expect(reloaded.settings).not.toEqual(personalized.settings);
    expect(await loadLocalProfileSession(reloaded)).toEqual({
      access: "guest",
    });
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

  it("records meaningful practice once per local calendar day", () => {
    const firstDay = new Date(2026, 7, 1, 0, 30);
    const secondDay = new Date(2026, 7, 2, 0, 15);
    const drafted = recordPracticeActivity(createDefaultProgress(), firstDay);
    const withHint = recordHint(drafted, "m1-t1", 0, firstDay);
    const attempted = recordAttempt(
      withHint,
      "m1-t1",
      "SELECT product_name FROM products",
      false,
      0,
      firstDay,
    );
    const nextDay = recordHint(attempted, "m1-t1", 1, secondDay);

    expect(localDateKey(firstDay)).toBe("2026-08-01");
    expect(nextDay.activityDates).toEqual(["2026-08-01", "2026-08-02"]);
    expect(nextDay.tasks["m1-t1"]).toMatchObject({
      attempts: 1,
      hintsUsed: [0, 1],
    });
    expect(calculateStreak(nextDay.activityDates, secondDay)).toBe(2);
  });

  it("locks the analysis score on the first correct run", () => {
    const firstHint = recordHint(createDefaultProgress(), "m1-t1", 0);
    const completed = recordAttempt(
      firstHint,
      "m1-t1",
      "SELECT product_name FROM products",
      true,
      18,
    );
    expect(completed.tasks["m1-t1"].scoreAwarded).toBe(7);

    const reviewedHint = recordHint(completed, "m1-t1", 1);
    const reviewedSolution = recordSolutionReveal(reviewedHint, "m1-t1");
    const repeated = recordAttempt(
      reviewedSolution,
      "m1-t1",
      "SELECT product_name FROM products ORDER BY product_name",
      true,
      8,
    );

    expect(repeated.tasks["m1-t1"]).toMatchObject({
      completed: true,
      hintsUsed: [0, 1],
      solutionRevealed: false,
      scoreAwarded: 7,
    });
  });

  it("awards zero after a requested full solution", () => {
    const solutionAssisted = recordSolutionReveal(
      createDefaultProgress(),
      "m1-t1",
    );
    const completed = recordAttempt(
      solutionAssisted,
      "m1-t1",
      "SELECT product_name FROM products",
      true,
      18,
    );

    expect(completed.tasks["m1-t1"]).toMatchObject({
      solutionRevealed: true,
      scoreAwarded: 0,
    });
  });

  it("uses the assistance snapshot from query submission time", () => {
    const hintOpenedWhileRunning = recordHint(
      createDefaultProgress(),
      "m1-t1",
      0,
    );
    const completed = recordAttempt(
      hintOpenedWhileRunning,
      "m1-t1",
      "SELECT product_name FROM products",
      true,
      18,
      new Date("2026-08-01T10:00:00.000Z"),
      { hintsUsed: [], solutionRevealed: false },
    );

    expect(completed.tasks["m1-t1"]).toMatchObject({
      hintsUsed: [0],
      scoreAwarded: 10,
    });
  });

  it("rejects invalid v6 score fields on import", () => {
    const completed = recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      "SELECT product_name FROM products",
      true,
      18,
    );
    expect(() =>
      importProgress(
        JSON.stringify({
          ...completed,
          tasks: {
            ...completed.tasks,
            "m1-t1": { ...completed.tasks["m1-t1"], scoreAwarded: 11 },
          },
        }),
      ),
    ).toThrow(/geçerli/);

    expect(() =>
      importProgress(
        JSON.stringify({
          ...completed,
          tasks: {
            ...completed.tasks,
            "m1-t1": { ...completed.tasks["m1-t1"], scoreAwarded: 9 },
          },
        }),
      ),
    ).toThrow(/geçerli/);

    expect(() =>
      importProgress(
        JSON.stringify({
          ...completed,
          tasks: {
            ...completed.tasks,
            "m1-t1": {
              ...completed.tasks["m1-t1"],
              completed: false,
              scoreAwarded: 10,
            },
          },
          evidenceByTaskId: {},
        }),
      ),
    ).toThrow(/geçerli/);
  });

  it("calculates a continuous activity streak", () => {
    const today = new Date(2026, 7, 1, 12);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    expect(
      calculateStreak([localDateKey(yesterday), localDateKey(today)], today),
    ).toBe(2);
  });
});
