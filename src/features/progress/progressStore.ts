export type ThemePreference = "light" | "dark";

export interface EditorSettings {
  theme: ThemePreference;
  fontSize: number;
  lineHeight: number;
  autocomplete: boolean;
  reducedMotion: boolean;
}

export interface TaskProgress {
  taskId: string;
  attempts: number;
  completed: boolean;
  firstCompletedAt?: string;
  lastCompletedAt?: string;
  lastQuery: string;
  hintsUsed: number[];
  solveTimeSeconds: number;
  firstTry: boolean;
}

export interface ProgressState {
  version: 1;
  startedAt: string;
  lastOpenedTaskId: string;
  activityDates: string[];
  tasks: Record<string, TaskProgress>;
  settings: EditorSettings;
}

const DATABASE_NAME = "queryvale";
const STORE_NAME = "workspace";
const STATE_KEY = "progress";
const MAX_IMPORT_BYTES = 2_000_000;
let persistenceAvailable = true;

export const defaultSettings: EditorSettings = {
  theme: "dark",
  fontSize: 15,
  lineHeight: 1.65,
  autocomplete: true,
  reducedMotion: false,
};

export function createDefaultProgress(): ProgressState {
  return {
    version: 1,
    startedAt: new Date().toISOString(),
    lastOpenedTaskId: "m1-t1",
    activityDates: [],
    tasks: {},
    settings: { ...defaultSettings },
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readStoredState(): Promise<ProgressState | undefined> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(STATE_KEY);
    request.onsuccess = () => resolve(request.result as ProgressState | undefined);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

async function writeStoredState(state: ProgressState): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(state, STATE_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

function isFiniteNumberInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function isOptionalDate(value: unknown): boolean {
  return (
    value === undefined ||
    (typeof value === "string" && Number.isFinite(Date.parse(value)))
  );
}

function isEditorSettings(value: unknown): value is EditorSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const settings = value as Partial<EditorSettings>;
  return (
    (settings.theme === "light" || settings.theme === "dark") &&
    isFiniteNumberInRange(settings.fontSize, 12, 24) &&
    isFiniteNumberInRange(settings.lineHeight, 1.2, 2.2) &&
    typeof settings.autocomplete === "boolean" &&
    typeof settings.reducedMotion === "boolean"
  );
}

function isTaskProgress(value: unknown, key: string): value is TaskProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const task = value as Partial<TaskProgress>;
  return (
    task.taskId === key &&
    isFiniteNumberInRange(task.attempts, 0, 1_000_000) &&
    Number.isInteger(task.attempts) &&
    typeof task.completed === "boolean" &&
    isOptionalDate(task.firstCompletedAt) &&
    isOptionalDate(task.lastCompletedAt) &&
    typeof task.lastQuery === "string" &&
    task.lastQuery.length <= 200_000 &&
    Array.isArray(task.hintsUsed) &&
    task.hintsUsed.every(
      (hint) => Number.isInteger(hint) && hint >= 0 && hint <= 2,
    ) &&
    isFiniteNumberInRange(task.solveTimeSeconds, 0, 100_000_000) &&
    typeof task.firstTry === "boolean"
  );
}

function isProgressState(value: unknown): value is ProgressState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ProgressState>;
  return (
    candidate.version === 1 &&
    typeof candidate.startedAt === "string" &&
    Number.isFinite(Date.parse(candidate.startedAt)) &&
    typeof candidate.lastOpenedTaskId === "string" &&
    Array.isArray(candidate.activityDates) &&
    candidate.activityDates.every(
      (date) =>
        typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date),
    ) &&
    Boolean(
      candidate.tasks &&
        typeof candidate.tasks === "object" &&
        !Array.isArray(candidate.tasks) &&
        Object.entries(candidate.tasks).every(([key, task]) =>
          isTaskProgress(task, key),
        ),
    ) &&
    isEditorSettings(candidate.settings)
  );
}

export async function loadProgress(): Promise<ProgressState> {
  if (typeof indexedDB === "undefined") {
    persistenceAvailable = false;
    return createDefaultProgress();
  }
  try {
    const stored = await readStoredState();
    persistenceAvailable = true;
    if (!stored || !isProgressState(stored)) return createDefaultProgress();
    return {
      ...stored,
      settings: { ...defaultSettings, ...stored.settings },
    };
  } catch {
    persistenceAvailable = false;
    return createDefaultProgress();
  }
}

export async function saveProgress(state: ProgressState): Promise<void> {
  if (typeof indexedDB === "undefined") {
    persistenceAvailable = false;
    return;
  }
  try {
    await writeStoredState(state);
    persistenceAvailable = true;
  } catch (error) {
    persistenceAvailable = false;
    throw error;
  }
}

export function isProgressPersistenceAvailable(): boolean {
  return persistenceAvailable;
}

export function exportProgress(state: ProgressState): string {
  return JSON.stringify(state, null, 2);
}

export function importProgress(serialized: string): ProgressState {
  if (new Blob([serialized]).size > MAX_IMPORT_BYTES) {
    throw new Error("İlerleme dosyası güvenli boyut sınırını aşıyor.");
  }
  const parsed: unknown = JSON.parse(serialized);
  if (!isProgressState(parsed)) {
    throw new Error("Bu dosya geçerli bir Queryvale ilerleme kaydı değil.");
  }
  return {
    ...parsed,
    settings: { ...defaultSettings, ...parsed.settings },
  };
}

export async function resetProgress(): Promise<ProgressState> {
  const next = createDefaultProgress();
  await saveProgress(next);
  return next;
}

export function recordTaskOpen(
  state: ProgressState,
  taskId: string,
): ProgressState {
  return { ...state, lastOpenedTaskId: taskId };
}

export function recordAttempt(
  state: ProgressState,
  taskId: string,
  query: string,
  completed: boolean,
  solveTimeSeconds: number,
): ProgressState {
  const previous = state.tasks[taskId];
  const attempts = (previous?.attempts ?? 0) + 1;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const firstCompletion = completed && !previous?.completed;
  const task: TaskProgress = {
    taskId,
    attempts,
    completed: Boolean(previous?.completed || completed),
    firstCompletedAt: firstCompletion
      ? now.toISOString()
      : previous?.firstCompletedAt,
    lastCompletedAt: completed
      ? now.toISOString()
      : previous?.lastCompletedAt,
    lastQuery: query,
    hintsUsed: previous?.hintsUsed ?? [],
    solveTimeSeconds: completed
      ? solveTimeSeconds
      : previous?.solveTimeSeconds ?? 0,
    firstTry: firstCompletion ? attempts === 1 : previous?.firstTry ?? false,
  };

  return {
    ...state,
    activityDates: Array.from(new Set([...state.activityDates, today])).sort(),
    tasks: { ...state.tasks, [taskId]: task },
  };
}

export function recordHint(
  state: ProgressState,
  taskId: string,
  hintIndex: number,
): ProgressState {
  const previous = state.tasks[taskId] ?? {
    taskId,
    attempts: 0,
    completed: false,
    lastQuery: "",
    hintsUsed: [],
    solveTimeSeconds: 0,
    firstTry: false,
  };
  return {
    ...state,
    tasks: {
      ...state.tasks,
      [taskId]: {
        ...previous,
        hintsUsed: Array.from(
          new Set([...previous.hintsUsed, hintIndex]),
        ).sort(),
      },
    },
  };
}

export function calculateStreak(activityDates: string[]): number {
  if (!activityDates.length) return 0;
  const dates = new Set(activityDates);
  const cursor = new Date();
  const today = cursor.toISOString().slice(0, 10);
  if (!dates.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);

  let streak = 0;
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
