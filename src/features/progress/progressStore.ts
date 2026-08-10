import {
  isVerifiedRunSnapshot,
  type VerifiedRunSnapshot,
} from "../evidence/evidenceSnapshot";
import { calculateCaseScore, isValidCaseScore } from "./scoring";

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
  solutionRevealed: boolean;
  /** Present only for a completed, deliberately unscored SQL drill. */
  scored?: false;
  scoreAwarded?: number;
  solveTimeSeconds: number;
  firstTry: boolean;
}

export interface PythonTaskProgress {
  taskId: string;
  attempts: number;
  completed: boolean;
  firstCompletedAt?: string;
  lastCompletedAt?: string;
  lastCode: string;
  hintsUsed: number[];
  solutionRevealed: boolean;
  scoreAwarded?: number;
  solveTimeSeconds: number;
  firstTry: boolean;
}

export type PythonEvidenceCell = string | number | boolean | null;

export interface PythonEvidenceEntry {
  taskId: string;
  runtimeVersion: string;
  contentVersion: string;
  verifiedAt: string;
  columns: string[];
  dtypes: string[];
  previewRows: PythonEvidenceCell[][];
  rowCount: number;
  stdout: string;
}

type LegacyTaskProgress = Omit<
  TaskProgress,
  "solutionRevealed" | "scored" | "scoreAwarded"
> &
  Partial<Pick<TaskProgress, "solutionRevealed" | "scored" | "scoreAwarded">>;

export interface ProgressProfile {
  id: string;
  displayName: string;
  localAccountCreatedAt?: string;
}

export type LocalProfileAccess = "guest" | "signed-out" | "active";

export interface LocalProfileSession {
  version: 1;
  status: "active" | "signed-out";
  profileId: string;
  updatedAt: string;
}

export interface LoadedLocalProfileSession {
  access: LocalProfileAccess;
  session?: LocalProfileSession;
}

export interface DecisionNote {
  finding: string;
  recommendation: string;
  caveat?: string;
  updatedAt: string;
}

export interface DecisionNoteInput {
  finding: string;
  recommendation: string;
  caveat?: string;
}

export interface EvidenceNotebookEntry {
  taskId: string;
  verifiedRun: VerifiedRunSnapshot;
  note?: DecisionNote;
}

export interface ProgressState {
  version: 6;
  profile: ProgressProfile;
  startedAt: string;
  lastOpenedTaskId: string;
  lastOpenedTaskIdTrusted: boolean;
  lastOpenedPythonTaskId: string;
  activityDates: string[];
  tasks: Record<string, TaskProgress>;
  pythonTasks: Record<string, PythonTaskProgress>;
  settings: EditorSettings;
  evidenceByTaskId: Record<string, EvidenceNotebookEntry>;
  pythonEvidenceByTaskId: Record<string, PythonEvidenceEntry>;
}

type ProgressData = Pick<
  ProgressState,
  "startedAt" | "lastOpenedTaskId" | "activityDates" | "tasks" | "settings"
>;

type LegacyProgressData = Omit<ProgressData, "tasks"> & {
  tasks: Record<string, LegacyTaskProgress>;
};

interface ProgressStateV2 extends LegacyProgressData {
  version: 2;
  profile: ProgressProfile;
}

interface ProgressStateV3 extends LegacyProgressData {
  version: 3;
  profile: ProgressProfile;
  evidenceByTaskId: Record<string, EvidenceNotebookEntry>;
}

interface ProgressStateV4 extends LegacyProgressData {
  version: 4;
  profile: ProgressProfile;
  lastOpenedTaskIdTrusted: boolean;
  evidenceByTaskId: Record<string, EvidenceNotebookEntry>;
}

interface ProgressStateV5 extends ProgressData {
  version: 5;
  profile: ProgressProfile;
  lastOpenedTaskIdTrusted: boolean;
  evidenceByTaskId: Record<string, EvidenceNotebookEntry>;
}

interface ProgressStateV1 extends LegacyProgressData {
  version: 1;
}

export interface ProfileNameValidation {
  valid: boolean;
  normalizedName: string;
  error?: string;
}

export interface AttemptAssistanceSnapshot {
  hintsUsed: readonly number[];
  solutionRevealed: boolean;
}

const DATABASE_NAME = "queryvale";
const STORE_NAME = "workspace";
const STATE_KEY = "progress";
const LOCAL_PROFILE_SESSION_KEY = "local-profile-session";
export const MAX_PROGRESS_IMPORT_BYTES = 2_000_000;
export const MAX_DECISION_NOTE_FIELD_CHARS = 2_000;
export const MAX_PYTHON_CODE_CHARS = 200_000;
export const MAX_PYTHON_EVIDENCE_COLUMNS = 32;
export const MAX_PYTHON_EVIDENCE_PREVIEW_ROWS = 10;
export const MAX_PYTHON_EVIDENCE_CELL_CHARS = 10_000;
export const MAX_PYTHON_EVIDENCE_STDOUT_CHARS = 50_000;
export const MAX_PYTHON_EVIDENCE_ROW_COUNT = 1_000_000;
const MAX_EVIDENCE_ENTRIES = 500;
const MAX_PYTHON_TASKS = 500;
const MAX_PYTHON_EVIDENCE_ENTRIES = 500;
const MAX_PYTHON_TASK_ID_CHARS = 200;
const MAX_PYTHON_COLUMN_NAME_CHARS = 256;
const MAX_PYTHON_DTYPE_CHARS = 64;
const MAX_PYTHON_VERSION_CHARS = 64;
const PYTHON_DTYPE_PATTERN = /^[A-Za-z][A-Za-z0-9_.,<>\[\] ()|:+-]{0,63}$/u;
const PYTHON_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._+-]{0,63}$/u;
const PROFILE_NAME_MIN_LENGTH = 2;
const PROFILE_NAME_MAX_LENGTH = 32;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/u;
const BIDI_CONTROL_PATTERN = /[\u202a-\u202e\u2066-\u2069]/u;
const DEFAULT_IGNORABLE_PATTERN = /\p{Default_Ignorable_Code_Point}/u;
const VISIBLE_PROFILE_CHARACTER_PATTERN = /[\p{L}\p{N}\p{S}]/u;
const PROFILE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
let persistenceAvailable = true;
let persistenceIssue: "unavailable" | "incompatible" | undefined;
let progressRecordReadFailed = false;

export const DEFAULT_PROFILE_DISPLAY_NAME = "SQL Kaşifi";

export const defaultSettings: EditorSettings = {
  theme: "dark",
  fontSize: 15,
  lineHeight: 1.65,
  autocomplete: true,
  reducedMotion: false,
};

export function normalizeProfileName(name: string): string {
  return name.normalize("NFKC").trim().replace(/\s+/gu, " ");
}

export function validateProfileName(name: string): ProfileNameValidation {
  const compatibilityNormalized = name.normalize("NFKC");
  const normalizedName = normalizeProfileName(compatibilityNormalized);

  if (
    CONTROL_CHARACTER_PATTERN.test(compatibilityNormalized) ||
    BIDI_CONTROL_PATTERN.test(compatibilityNormalized) ||
    DEFAULT_IGNORABLE_PATTERN.test(compatibilityNormalized)
  ) {
    return {
      valid: false,
      normalizedName,
      error: "Kullanıcı adı kontrol veya görünmez yön karakteri içeremez.",
    };
  }

  if (!VISIBLE_PROFILE_CHARACTER_PATTERN.test(normalizedName)) {
    return {
      valid: false,
      normalizedName,
      error:
        "Kullanıcı adı en az bir görünür harf, sayı veya simge içermelidir.",
    };
  }

  const characterCount = Array.from(normalizedName).length;
  if (
    characterCount < PROFILE_NAME_MIN_LENGTH ||
    characterCount > PROFILE_NAME_MAX_LENGTH
  ) {
    return {
      valid: false,
      normalizedName,
      error: `Kullanıcı adı ${PROFILE_NAME_MIN_LENGTH}–${PROFILE_NAME_MAX_LENGTH} karakter arasında olmalıdır.`,
    };
  }

  return { valid: true, normalizedName };
}

export function updateProfileName(
  state: ProgressState,
  name: string,
): ProgressState {
  const validation = validateProfileName(name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  const shouldMarkLocalAccount =
    state.profile.localAccountCreatedAt !== undefined ||
    state.profile.displayName !== DEFAULT_PROFILE_DISPLAY_NAME ||
    validation.normalizedName !== DEFAULT_PROFILE_DISPLAY_NAME;
  const localAccountCreatedAt = shouldMarkLocalAccount
    ? (state.profile.localAccountCreatedAt ?? new Date().toISOString())
    : undefined;
  if (
    validation.normalizedName === state.profile.displayName &&
    localAccountCreatedAt === state.profile.localAccountCreatedAt
  ) {
    return state;
  }

  return {
    ...state,
    profile: {
      ...state.profile,
      displayName: validation.normalizedName,
      ...(localAccountCreatedAt ? { localAccountCreatedAt } : {}),
    },
  };
}

export function hasLocalAccount(state: ProgressState): boolean {
  return (
    state.profile.localAccountCreatedAt !== undefined ||
    state.profile.displayName !== DEFAULT_PROFILE_DISPLAY_NAME
  );
}

function isLocalProfileSession(value: unknown): value is LocalProfileSession {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<LocalProfileSession>;
  return (
    candidate.version === 1 &&
    (candidate.status === "active" || candidate.status === "signed-out") &&
    typeof candidate.profileId === "string" &&
    PROFILE_ID_PATTERN.test(candidate.profileId) &&
    typeof candidate.updatedAt === "string" &&
    Number.isFinite(Date.parse(candidate.updatedAt))
  );
}

/**
 * Resolves presentation access for the single device workspace. An absent
 * session keeps existing named profiles open for backwards compatibility,
 * while malformed or profile-mismatched session data fails closed.
 */
export function resolveLocalProfileAccess(
  state: ProgressState,
  storedSession: unknown,
): LocalProfileAccess {
  if (!hasLocalAccount(state)) return "guest";
  if (storedSession === undefined) return "active";
  if (!isLocalProfileSession(storedSession)) return "signed-out";
  if (storedSession.profileId !== state.profile.id) return "signed-out";
  return storedSession.status;
}

function createLocalProfileSession(
  state: ProgressState,
  status: LocalProfileSession["status"],
): LocalProfileSession {
  if (!hasLocalAccount(state)) {
    throw new Error("Bu cihazda açılabilecek bir yerel profil bulunamadı.");
  }
  return {
    version: 1,
    status,
    profileId: state.profile.id,
    updatedAt: new Date().toISOString(),
  };
}

export function createActiveLocalProfileSession(
  state: ProgressState,
): LocalProfileSession {
  return createLocalProfileSession(state, "active");
}

export function createSignedOutLocalProfileSession(
  state: ProgressState,
): LocalProfileSession {
  return createLocalProfileSession(state, "signed-out");
}

export function createLocalAccount(
  state: ProgressState,
  name: string,
): ProgressState {
  const validation = validateProfileName(name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return {
    ...state,
    profile: {
      ...state.profile,
      displayName: validation.normalizedName,
      localAccountCreatedAt:
        state.profile.localAccountCreatedAt ?? new Date().toISOString(),
    },
  };
}

export function createDefaultProgress(): ProgressState {
  return {
    version: 6,
    profile: {
      id: globalThis.crypto.randomUUID(),
      displayName: DEFAULT_PROFILE_DISPLAY_NAME,
    },
    startedAt: new Date().toISOString(),
    lastOpenedTaskId: "m1-t1",
    lastOpenedTaskIdTrusted: true,
    lastOpenedPythonTaskId: "py-m1-t1",
    activityDates: [],
    tasks: {},
    pythonTasks: {},
    settings: { ...defaultSettings },
    evidenceByTaskId: {},
    pythonEvidenceByTaskId: {},
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

async function readStoredState(): Promise<unknown> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(STATE_KEY);
    let storedState: unknown;
    request.onsuccess = () => {
      storedState = request.result as unknown;
    };
    transaction.oncomplete = () => {
      database.close();
      resolve(storedState);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? request.error);
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("İlerleme kaydı okunamadı."));
    };
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

async function readStoredLocalProfileSession(): Promise<unknown> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction
      .objectStore(STORE_NAME)
      .get(LOCAL_PROFILE_SESSION_KEY);
    let storedSession: unknown;
    request.onsuccess = () => {
      storedSession = request.result as unknown;
    };
    transaction.oncomplete = () => {
      database.close();
      resolve(storedSession);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? request.error);
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Profil oturumu okunamadı."));
    };
  });
}

async function writeStoredLocalProfileSession(
  session: LocalProfileSession,
): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(session, LOCAL_PROFILE_SESSION_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Profil oturumu kaydedilemedi."));
    };
  });
}

async function writeStoredProgressWithLocalProfileSession(
  state: ProgressState,
  session: LocalProfileSession | undefined,
): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(state, STATE_KEY);
    if (session) store.put(session, LOCAL_PROFILE_SESSION_KEY);
    else store.delete(LOCAL_PROFILE_SESSION_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      database.close();
      reject(
        transaction.error ?? new Error("Yerel çalışma alanı kaydedilemedi."),
      );
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

function hasValidTaskProgressBase(
  value: unknown,
  key: string,
): value is LegacyTaskProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const task = value as Partial<LegacyTaskProgress>;
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

function isLegacyTaskProgress(
  value: unknown,
  key: string,
): value is LegacyTaskProgress {
  return hasValidTaskProgressBase(value, key);
}

function isTaskProgress(value: unknown, key: string): value is TaskProgress {
  if (!hasValidTaskProgressBase(value, key)) return false;
  const task = value as Partial<TaskProgress>;
  return (
    typeof task.solutionRevealed === "boolean" &&
    (task.scored === undefined || task.scored === false) &&
    (task.completed
      ? task.scored === false
        ? task.scoreAwarded === undefined
        : isValidCaseScore(task.scoreAwarded)
      : task.scoreAwarded === undefined)
  );
}

function isValidPythonTaskId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Boolean(value) &&
    value === value.trim() &&
    characterCount(value) <= MAX_PYTHON_TASK_ID_CHARS &&
    !CONTROL_CHARACTER_PATTERN.test(value) &&
    !BIDI_CONTROL_PATTERN.test(value)
  );
}

function isValidPythonHints(value: unknown): value is number[] {
  if (!Array.isArray(value) || value.length > 3) return false;
  // The UI reveals hints strictly in order and derives the next hint from the
  // current length. Persist only canonical prefixes so an imported workspace
  // cannot skip, reorder or duplicate a rung in that state machine.
  return value.every((hint, index) => hint === index);
}

function isPythonTaskProgress(
  value: unknown,
  key: string,
): value is PythonTaskProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const task = value as Partial<PythonTaskProgress>;
  return (
    isValidPythonTaskId(key) &&
    task.taskId === key &&
    isFiniteNumberInRange(task.attempts, 0, 1_000_000) &&
    Number.isInteger(task.attempts) &&
    typeof task.completed === "boolean" &&
    isOptionalDate(task.firstCompletedAt) &&
    isOptionalDate(task.lastCompletedAt) &&
    typeof task.lastCode === "string" &&
    task.lastCode.length <= MAX_PYTHON_CODE_CHARS &&
    isValidPythonHints(task.hintsUsed) &&
    typeof task.solutionRevealed === "boolean" &&
    (task.completed
      ? isValidCaseScore(task.scoreAwarded)
      : task.scoreAwarded === undefined) &&
    isFiniteNumberInRange(task.solveTimeSeconds, 0, 100_000_000) &&
    typeof task.firstTry === "boolean"
  );
}

function isPythonTaskProgressRecord(
  value: unknown,
): value is Record<string, PythonTaskProgress> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length <= MAX_PYTHON_TASKS &&
    entries.every(([key, task]) => isPythonTaskProgress(task, key))
  );
}

function characterCount(value: string): number {
  return Array.from(value).length;
}

function isPythonEvidenceCell(value: unknown): value is PythonEvidenceCell {
  return (
    value === null ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "string" &&
      characterCount(value) <= MAX_PYTHON_EVIDENCE_CELL_CHARS)
  );
}

function isPythonEvidenceEntry(
  value: unknown,
  key: string,
  tasks: Record<string, { completed: boolean }>,
): value is PythonEvidenceEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as Partial<PythonEvidenceEntry>;
  if (
    !isValidPythonTaskId(key) ||
    entry.taskId !== key ||
    typeof entry.runtimeVersion !== "string" ||
    characterCount(entry.runtimeVersion) > MAX_PYTHON_VERSION_CHARS ||
    !PYTHON_VERSION_PATTERN.test(entry.runtimeVersion) ||
    typeof entry.contentVersion !== "string" ||
    characterCount(entry.contentVersion) > MAX_PYTHON_VERSION_CHARS ||
    !PYTHON_VERSION_PATTERN.test(entry.contentVersion) ||
    typeof entry.verifiedAt !== "string" ||
    entry.verifiedAt.length > 64 ||
    !Number.isFinite(Date.parse(entry.verifiedAt)) ||
    !Array.isArray(entry.columns) ||
    entry.columns.length > MAX_PYTHON_EVIDENCE_COLUMNS ||
    entry.columns.some(
      (column) =>
        typeof column !== "string" ||
        characterCount(column) > MAX_PYTHON_COLUMN_NAME_CHARS,
    ) ||
    !Array.isArray(entry.dtypes) ||
    entry.dtypes.length !== entry.columns.length ||
    entry.dtypes.some(
      (dtype) =>
        typeof dtype !== "string" ||
        characterCount(dtype) > MAX_PYTHON_DTYPE_CHARS ||
        !PYTHON_DTYPE_PATTERN.test(dtype),
    ) ||
    !Array.isArray(entry.previewRows) ||
    entry.previewRows.length > MAX_PYTHON_EVIDENCE_PREVIEW_ROWS ||
    entry.previewRows.some(
      (row) =>
        !Array.isArray(row) ||
        row.length !== entry.columns?.length ||
        row.some((cell) => !isPythonEvidenceCell(cell)),
    ) ||
    typeof entry.rowCount !== "number" ||
    !Number.isInteger(entry.rowCount) ||
    entry.rowCount < entry.previewRows.length ||
    entry.rowCount > MAX_PYTHON_EVIDENCE_ROW_COUNT ||
    typeof entry.stdout !== "string" ||
    characterCount(entry.stdout) > MAX_PYTHON_EVIDENCE_STDOUT_CHARS ||
    tasks[key]?.completed !== true
  ) {
    return false;
  }
  return true;
}

function isPythonEvidenceNotebook(
  value: unknown,
  tasks: Record<string, { completed: boolean }>,
): value is Record<string, PythonEvidenceEntry> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length <= MAX_PYTHON_EVIDENCE_ENTRIES &&
    entries.every(([key, entry]) => isPythonEvidenceEntry(entry, key, tasks))
  );
}

function isDecisionNote(value: unknown): value is DecisionNote {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const note = value as Partial<DecisionNote>;
  return (
    typeof note.finding === "string" &&
    Boolean(note.finding.trim()) &&
    note.finding === note.finding.trim() &&
    characterCount(note.finding) <= MAX_DECISION_NOTE_FIELD_CHARS &&
    typeof note.recommendation === "string" &&
    Boolean(note.recommendation.trim()) &&
    note.recommendation === note.recommendation.trim() &&
    characterCount(note.recommendation) <= MAX_DECISION_NOTE_FIELD_CHARS &&
    (note.caveat === undefined ||
      (typeof note.caveat === "string" &&
        Boolean(note.caveat.trim()) &&
        note.caveat === note.caveat.trim() &&
        characterCount(note.caveat) <= MAX_DECISION_NOTE_FIELD_CHARS)) &&
    typeof note.updatedAt === "string" &&
    Number.isFinite(Date.parse(note.updatedAt))
  );
}

function isEvidenceNotebookEntry(
  value: unknown,
  key: string,
  tasks: Record<string, { completed: boolean }>,
): value is EvidenceNotebookEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as Partial<EvidenceNotebookEntry>;
  return (
    entry.taskId === key &&
    isVerifiedRunSnapshot(entry.verifiedRun) &&
    entry.verifiedRun.taskId === key &&
    tasks[key]?.completed === true &&
    (entry.note === undefined || isDecisionNote(entry.note))
  );
}

function isEvidenceNotebook(
  value: unknown,
  tasks: Record<string, { completed: boolean }>,
): value is Record<string, EvidenceNotebookEntry> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length <= MAX_EVIDENCE_ENTRIES &&
    entries.every(([key, entry]) => isEvidenceNotebookEntry(entry, key, tasks))
  );
}

function hasValidProgressData(value: unknown): value is ProgressData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ProgressState>;
  return (
    typeof candidate.startedAt === "string" &&
    Number.isFinite(Date.parse(candidate.startedAt)) &&
    typeof candidate.lastOpenedTaskId === "string" &&
    Array.isArray(candidate.activityDates) &&
    candidate.activityDates.every(
      (date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date),
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

function hasValidLegacyProgressData(
  value: unknown,
): value is LegacyProgressData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LegacyProgressData>;
  return (
    typeof candidate.startedAt === "string" &&
    Number.isFinite(Date.parse(candidate.startedAt)) &&
    typeof candidate.lastOpenedTaskId === "string" &&
    Array.isArray(candidate.activityDates) &&
    candidate.activityDates.every(
      (date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date),
    ) &&
    Boolean(
      candidate.tasks &&
      typeof candidate.tasks === "object" &&
      !Array.isArray(candidate.tasks) &&
      Object.entries(candidate.tasks).every(([key, task]) =>
        isLegacyTaskProgress(task, key),
      ),
    ) &&
    isEditorSettings(candidate.settings)
  );
}

function isProgressStateV1(value: unknown): value is ProgressStateV1 {
  return (
    Boolean(value && typeof value === "object") &&
    (value as { version?: unknown }).version === 1 &&
    hasValidLegacyProgressData(value)
  );
}

function isProgressStateV2(value: unknown): value is ProgressStateV2 {
  return (
    Boolean(value && typeof value === "object") &&
    (value as { version?: unknown }).version === 2 &&
    hasValidLegacyProgressData(value) &&
    isProgressProfile((value as { profile?: unknown }).profile)
  );
}

function isProgressProfile(value: unknown): value is ProgressProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const profile = value as Partial<ProgressProfile>;
  return (
    typeof profile.id === "string" &&
    PROFILE_ID_PATTERN.test(profile.id) &&
    typeof profile.displayName === "string" &&
    validateProfileName(profile.displayName).valid &&
    (profile.localAccountCreatedAt === undefined ||
      (typeof profile.localAccountCreatedAt === "string" &&
        Number.isFinite(Date.parse(profile.localAccountCreatedAt))))
  );
}

function isProgressStateV5(value: unknown): value is ProgressStateV5 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<ProgressStateV5>;
  return (
    candidate.version === 5 &&
    hasValidProgressData(value) &&
    typeof candidate.lastOpenedTaskIdTrusted === "boolean" &&
    isProgressProfile(candidate.profile) &&
    isEvidenceNotebook(candidate.evidenceByTaskId, candidate.tasks ?? {})
  );
}

function isProgressState(value: unknown): value is ProgressState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<ProgressState>;
  return (
    candidate.version === 6 &&
    hasValidProgressData(value) &&
    typeof candidate.lastOpenedTaskIdTrusted === "boolean" &&
    isValidPythonTaskId(candidate.lastOpenedPythonTaskId) &&
    isProgressProfile(candidate.profile) &&
    isEvidenceNotebook(candidate.evidenceByTaskId, candidate.tasks ?? {}) &&
    isPythonTaskProgressRecord(candidate.pythonTasks) &&
    isPythonEvidenceNotebook(
      candidate.pythonEvidenceByTaskId,
      candidate.pythonTasks ?? {},
    )
  );
}

function isProgressStateV3(value: unknown): value is ProgressStateV3 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<ProgressStateV3>;
  return (
    candidate.version === 3 &&
    hasValidLegacyProgressData(value) &&
    isProgressProfile(candidate.profile) &&
    isEvidenceNotebook(candidate.evidenceByTaskId, candidate.tasks ?? {})
  );
}

function isProgressStateV4(value: unknown): value is ProgressStateV4 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<ProgressStateV4>;
  return (
    candidate.version === 4 &&
    hasValidLegacyProgressData(value) &&
    typeof candidate.lastOpenedTaskIdTrusted === "boolean" &&
    isProgressProfile(candidate.profile) &&
    isEvidenceNotebook(candidate.evidenceByTaskId, candidate.tasks ?? {})
  );
}

function cloneEvidenceNotebook(
  evidenceByTaskId: Record<string, EvidenceNotebookEntry>,
): Record<string, EvidenceNotebookEntry> {
  return Object.fromEntries(
    Object.entries(evidenceByTaskId).map(([taskId, entry]) => [
      taskId,
      {
        taskId: entry.taskId,
        verifiedRun: {
          ...entry.verifiedRun,
          columns: [...entry.verifiedRun.columns],
          previewRows: entry.verifiedRun.previewRows.map((row) => [...row]),
        },
        ...(entry.note ? { note: { ...entry.note } } : {}),
      },
    ]),
  );
}

function clonePythonTasks(
  tasks: Record<string, PythonTaskProgress>,
): Record<string, PythonTaskProgress> {
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
        lastCode: task.lastCode,
        hintsUsed: [...task.hintsUsed],
        solutionRevealed: task.solutionRevealed,
        ...(task.scoreAwarded !== undefined
          ? { scoreAwarded: task.scoreAwarded }
          : {}),
        solveTimeSeconds: task.solveTimeSeconds,
        firstTry: task.firstTry,
      },
    ]),
  );
}

function clonePythonEvidenceEntry(
  entry: PythonEvidenceEntry,
): PythonEvidenceEntry {
  return {
    taskId: entry.taskId,
    runtimeVersion: entry.runtimeVersion,
    contentVersion: entry.contentVersion,
    verifiedAt: entry.verifiedAt,
    columns: [...entry.columns],
    dtypes: [...entry.dtypes],
    previewRows: entry.previewRows.map((row) => [...row]),
    rowCount: entry.rowCount,
    stdout: entry.stdout,
  };
}

function clonePythonEvidenceNotebook(
  evidenceByTaskId: Record<string, PythonEvidenceEntry>,
): Record<string, PythonEvidenceEntry> {
  return Object.fromEntries(
    Object.entries(evidenceByTaskId).map(([taskId, entry]) => [
      taskId,
      clonePythonEvidenceEntry(entry),
    ]),
  );
}

function migrateTaskProgress(task: LegacyTaskProgress): TaskProgress {
  // v1-v4 never persisted full-solution use or awarded score. Ignore any
  // unexpected injected fields and derive the only knowable value from hints.
  const solutionRevealed = false;
  const migratedScore = calculateCaseScore(task.hintsUsed, solutionRevealed);
  return {
    taskId: task.taskId,
    attempts: task.attempts,
    completed: task.completed,
    ...(task.firstCompletedAt
      ? { firstCompletedAt: task.firstCompletedAt }
      : {}),
    ...(task.lastCompletedAt ? { lastCompletedAt: task.lastCompletedAt } : {}),
    lastQuery: task.lastQuery,
    hintsUsed: [...task.hintsUsed],
    solutionRevealed,
    ...(task.completed
      ? {
          scoreAwarded: migratedScore,
        }
      : {}),
    solveTimeSeconds: task.solveTimeSeconds,
    firstTry: task.firstTry,
  };
}

function migrateTasks(
  tasks: Record<string, LegacyTaskProgress>,
): Record<string, TaskProgress> {
  return Object.fromEntries(
    Object.entries(tasks).map(([taskId, task]) => [
      taskId,
      migrateTaskProgress(task),
    ]),
  );
}

/**
 * Converts validated legacy/local records into the current local-only model.
 * Existing learning data is copied verbatim. V1 gains a local profile, while
 * V1 and V2 both start with an empty evidence notebook.
 */
export function migrateProgressState(
  value: unknown,
): ProgressState | undefined {
  if (isProgressState(value)) {
    const profileName = validateProfileName(value.profile.displayName);
    return {
      version: 6,
      profile: {
        id: value.profile.id,
        displayName: profileName.normalizedName,
        ...(value.profile.localAccountCreatedAt
          ? { localAccountCreatedAt: value.profile.localAccountCreatedAt }
          : {}),
      },
      startedAt: value.startedAt,
      lastOpenedTaskId: value.lastOpenedTaskId,
      lastOpenedTaskIdTrusted: value.lastOpenedTaskIdTrusted,
      lastOpenedPythonTaskId: value.lastOpenedPythonTaskId,
      activityDates: [...value.activityDates],
      tasks: Object.fromEntries(
        Object.entries(value.tasks).map(([taskId, task]) => [
          taskId,
          { ...task, hintsUsed: [...task.hintsUsed] },
        ]),
      ),
      pythonTasks: clonePythonTasks(value.pythonTasks),
      settings: { ...defaultSettings, ...value.settings },
      evidenceByTaskId: cloneEvidenceNotebook(value.evidenceByTaskId),
      pythonEvidenceByTaskId: clonePythonEvidenceNotebook(
        value.pythonEvidenceByTaskId,
      ),
    };
  }

  if (isProgressStateV5(value)) {
    return {
      version: 6,
      profile: {
        id: value.profile.id,
        displayName: validateProfileName(value.profile.displayName)
          .normalizedName,
        ...(value.profile.localAccountCreatedAt
          ? { localAccountCreatedAt: value.profile.localAccountCreatedAt }
          : {}),
      },
      startedAt: value.startedAt,
      lastOpenedTaskId: value.lastOpenedTaskId,
      lastOpenedTaskIdTrusted: value.lastOpenedTaskIdTrusted,
      lastOpenedPythonTaskId: "py-m1-t1",
      activityDates: [...value.activityDates],
      tasks: Object.fromEntries(
        Object.entries(value.tasks).map(([taskId, task]) => [
          taskId,
          { ...task, hintsUsed: [...task.hintsUsed] },
        ]),
      ),
      pythonTasks: {},
      settings: { ...defaultSettings, ...value.settings },
      evidenceByTaskId: cloneEvidenceNotebook(value.evidenceByTaskId),
      pythonEvidenceByTaskId: {},
    };
  }

  if (isProgressStateV4(value)) {
    return {
      version: 6,
      profile: {
        id: value.profile.id,
        displayName: validateProfileName(value.profile.displayName)
          .normalizedName,
        ...(value.profile.localAccountCreatedAt
          ? { localAccountCreatedAt: value.profile.localAccountCreatedAt }
          : {}),
      },
      startedAt: value.startedAt,
      lastOpenedTaskId: value.lastOpenedTaskId,
      lastOpenedTaskIdTrusted: value.lastOpenedTaskIdTrusted,
      lastOpenedPythonTaskId: "py-m1-t1",
      activityDates: [...value.activityDates],
      tasks: migrateTasks(value.tasks),
      pythonTasks: {},
      settings: { ...defaultSettings, ...value.settings },
      evidenceByTaskId: cloneEvidenceNotebook(value.evidenceByTaskId),
      pythonEvidenceByTaskId: {},
    };
  }

  if (isProgressStateV3(value)) {
    return {
      version: 6,
      profile: {
        id: value.profile.id,
        displayName: validateProfileName(value.profile.displayName)
          .normalizedName,
        ...(value.profile.localAccountCreatedAt
          ? { localAccountCreatedAt: value.profile.localAccountCreatedAt }
          : {}),
      },
      startedAt: value.startedAt,
      lastOpenedTaskId: value.lastOpenedTaskId,
      lastOpenedTaskIdTrusted: false,
      lastOpenedPythonTaskId: "py-m1-t1",
      activityDates: [...value.activityDates],
      tasks: migrateTasks(value.tasks),
      pythonTasks: {},
      settings: { ...defaultSettings, ...value.settings },
      evidenceByTaskId: cloneEvidenceNotebook(value.evidenceByTaskId),
      pythonEvidenceByTaskId: {},
    };
  }

  if (isProgressStateV2(value)) {
    return {
      version: 6,
      profile: {
        id: value.profile.id,
        displayName: validateProfileName(value.profile.displayName)
          .normalizedName,
        ...(value.profile.localAccountCreatedAt
          ? { localAccountCreatedAt: value.profile.localAccountCreatedAt }
          : {}),
      },
      startedAt: value.startedAt,
      lastOpenedTaskId: value.lastOpenedTaskId,
      lastOpenedTaskIdTrusted: false,
      lastOpenedPythonTaskId: "py-m1-t1",
      activityDates: [...value.activityDates],
      tasks: migrateTasks(value.tasks),
      pythonTasks: {},
      settings: { ...defaultSettings, ...value.settings },
      evidenceByTaskId: {},
      pythonEvidenceByTaskId: {},
    };
  }

  if (isProgressStateV1(value)) {
    return {
      version: 6,
      profile: {
        id: globalThis.crypto.randomUUID(),
        displayName: DEFAULT_PROFILE_DISPLAY_NAME,
      },
      startedAt: value.startedAt,
      lastOpenedTaskId: value.lastOpenedTaskId,
      lastOpenedTaskIdTrusted: false,
      lastOpenedPythonTaskId: "py-m1-t1",
      activityDates: [...value.activityDates],
      tasks: migrateTasks(value.tasks),
      pythonTasks: {},
      settings: { ...defaultSettings, ...value.settings },
      evidenceByTaskId: {},
      pythonEvidenceByTaskId: {},
    };
  }

  return undefined;
}

export async function loadProgress(): Promise<ProgressState> {
  if (typeof indexedDB === "undefined") {
    persistenceAvailable = false;
    persistenceIssue = "unavailable";
    progressRecordReadFailed = true;
    return createDefaultProgress();
  }
  try {
    const stored = await readStoredState();
    progressRecordReadFailed = false;
    persistenceAvailable = true;
    persistenceIssue = undefined;
    if (stored === undefined) return createDefaultProgress();
    const migrated = migrateProgressState(stored);
    if (!migrated) {
      persistenceAvailable = false;
      persistenceIssue = "incompatible";
      return createDefaultProgress();
    }

    if (
      isProgressStateV1(stored) ||
      isProgressStateV2(stored) ||
      isProgressStateV3(stored) ||
      isProgressStateV4(stored) ||
      isProgressStateV5(stored)
    ) {
      try {
        await writeStoredState(migrated);
      } catch {
        // A readable legacy record still has value even if its upgrade cannot
        // be persisted in this session (for example, private browsing quotas).
        persistenceAvailable = false;
        persistenceIssue = "unavailable";
      }
    }

    return migrated;
  } catch {
    persistenceAvailable = false;
    persistenceIssue = "unavailable";
    progressRecordReadFailed = true;
    return createDefaultProgress();
  }
}

export async function loadLocalProfileSession(
  state: ProgressState,
): Promise<LoadedLocalProfileSession> {
  if (typeof indexedDB === "undefined") {
    persistenceAvailable = false;
    persistenceIssue = "unavailable";
    return {
      access: resolveLocalProfileAccess(state, null),
    };
  }

  try {
    const storedSession = await readStoredLocalProfileSession();
    const access = resolveLocalProfileAccess(state, storedSession);
    const sessionMatchesProfile =
      hasLocalAccount(state) &&
      isLocalProfileSession(storedSession) &&
      storedSession.profileId === state.profile.id;
    return {
      access,
      ...(sessionMatchesProfile ? { session: storedSession } : {}),
    };
  } catch {
    if (persistenceIssue !== "incompatible") {
      persistenceAvailable = false;
      persistenceIssue = "unavailable";
    }
    return {
      access: resolveLocalProfileAccess(state, null),
    };
  }
}

async function saveValidatedLocalProfileSession(
  session: LocalProfileSession,
): Promise<void> {
  if (!isLocalProfileSession(session)) {
    throw new Error("Yerel profil oturumu geçerli değil.");
  }
  if (typeof indexedDB === "undefined") {
    persistenceAvailable = false;
    persistenceIssue = "unavailable";
    throw new Error("Yerel profil oturumu bu cihazda kaydedilemedi.");
  }

  try {
    await writeStoredLocalProfileSession(session);
  } catch (error) {
    persistenceAvailable = false;
    if (persistenceIssue !== "incompatible") persistenceIssue = "unavailable";
    throw error;
  }
}

export async function activateLocalProfileSession(
  state: ProgressState,
): Promise<LocalProfileSession> {
  const session = createActiveLocalProfileSession(state);
  await saveValidatedLocalProfileSession(session);
  return session;
}

export async function signOutLocalProfileSession(
  state: ProgressState,
): Promise<LocalProfileSession> {
  const session = createSignedOutLocalProfileSession(state);
  await saveValidatedLocalProfileSession(session);
  return session;
}

/**
 * Atomically replaces learning progress and its local profile presentation
 * state. Account-marked progress must always carry an explicit session;
 * guest progress must not carry one.
 */
export async function saveProgressWithLocalProfileSession(
  state: ProgressState,
  session: LocalProfileSession | undefined,
  options: { replaceIncompatible?: boolean } = {},
): Promise<void> {
  const accountExists = hasLocalAccount(state);
  if (accountExists && !session) {
    throw new Error("Yerel profil durumu oturum bilgisi olmadan kaydedilemez.");
  }
  if (!accountExists && session) {
    throw new Error("Misafir çalışma alanına profil oturumu bağlanamaz.");
  }
  if (
    session &&
    (!isLocalProfileSession(session) || session.profileId !== state.profile.id)
  ) {
    throw new Error("Yerel profil oturumu bu çalışma alanıyla eşleşmiyor.");
  }
  if (typeof indexedDB === "undefined") {
    persistenceAvailable = false;
    persistenceIssue = "unavailable";
    throw new Error("Yerel çalışma alanı bu cihazda kaydedilemedi.");
  }
  if (progressRecordReadFailed && !options.replaceIncompatible) {
    throw new Error(
      "Mevcut ilerleme kaydı okunamadığı için korunuyor; açıkça sıfırlamadan veya içe aktarmadan üzerine yazılmayacak.",
    );
  }
  if (persistenceIssue === "incompatible" && !options.replaceIncompatible) {
    throw new Error(
      "Mevcut ilerleme kaydı bu sürümle uyumlu olmadığı için korunuyor.",
    );
  }

  try {
    await writeStoredProgressWithLocalProfileSession(state, session);
    progressRecordReadFailed = false;
    persistenceAvailable = true;
    persistenceIssue = undefined;
  } catch (error) {
    persistenceAvailable = false;
    persistenceIssue = "unavailable";
    throw error;
  }
}

export async function eraseLocalProfileAndProgress(): Promise<ProgressState> {
  const next = createDefaultProgress();
  await saveProgressWithLocalProfileSession(next, undefined, {
    replaceIncompatible: true,
  });
  return next;
}

export async function saveProgress(
  state: ProgressState,
  options: { replaceIncompatible?: boolean } = {},
): Promise<void> {
  if (typeof indexedDB === "undefined") {
    persistenceAvailable = false;
    persistenceIssue = "unavailable";
    return;
  }
  if (progressRecordReadFailed && !options.replaceIncompatible) {
    throw new Error(
      "Mevcut ilerleme kaydı okunamadığı için korunuyor; açıkça sıfırlamadan veya içe aktarmadan üzerine yazılmayacak.",
    );
  }
  if (persistenceIssue === "incompatible" && !options.replaceIncompatible) {
    throw new Error(
      "Mevcut ilerleme kaydı bu sürümle uyumlu olmadığı için korunuyor.",
    );
  }
  try {
    await writeStoredState(state);
    progressRecordReadFailed = false;
    persistenceAvailable = true;
    persistenceIssue = undefined;
  } catch (error) {
    persistenceAvailable = false;
    persistenceIssue = "unavailable";
    throw error;
  }
}

export function isProgressPersistenceAvailable(): boolean {
  return persistenceAvailable;
}

export function getProgressPersistenceIssue():
  "unavailable" | "incompatible" | undefined {
  return persistenceIssue;
}

export function exportProgress(state: ProgressState): string {
  return JSON.stringify(state, null, 2);
}

export function importProgress(serialized: string): ProgressState {
  if (new Blob([serialized]).size > MAX_PROGRESS_IMPORT_BYTES) {
    throw new Error("İlerleme dosyası güvenli boyut sınırını aşıyor.");
  }
  const parsed: unknown = JSON.parse(serialized);
  const migrated = migrateProgressState(parsed);
  if (!migrated) {
    throw new Error("Bu dosya geçerli bir Queryvale ilerleme kaydı değil.");
  }
  return migrated;
}

export async function resetProgress(): Promise<ProgressState> {
  const next = createDefaultProgress();
  await saveProgress(next, { replaceIncompatible: true });
  return next;
}

export function recordTaskOpen(
  state: ProgressState,
  taskId: string,
): ProgressState {
  return {
    ...state,
    lastOpenedTaskId: taskId,
    lastOpenedTaskIdTrusted: true,
  };
}

function requirePythonTaskId(taskId: string): void {
  if (!isValidPythonTaskId(taskId)) {
    throw new Error("Geçerli bir Python görev kimliği gereklidir.");
  }
}

function requirePythonCode(code: string): void {
  if (typeof code !== "string" || code.length > MAX_PYTHON_CODE_CHARS) {
    throw new Error(
      `Python kodu en fazla ${MAX_PYTHON_CODE_CHARS} karakter olabilir.`,
    );
  }
}

function requirePythonTaskCapacity(state: ProgressState, taskId: string): void {
  if (
    !state.pythonTasks[taskId] &&
    Object.keys(state.pythonTasks).length >= MAX_PYTHON_TASKS
  ) {
    throw new Error("Python görev kaydı güvenli sayı sınırını aşıyor.");
  }
}

function createEmptyPythonTaskProgress(taskId: string): PythonTaskProgress {
  return {
    taskId,
    attempts: 0,
    completed: false,
    lastCode: "",
    hintsUsed: [],
    solutionRevealed: false,
    solveTimeSeconds: 0,
    firstTry: false,
  };
}

export function recordPythonTaskOpen(
  state: ProgressState,
  taskId: string,
): ProgressState {
  requirePythonTaskId(taskId);
  if (state.lastOpenedPythonTaskId === taskId) return state;
  return { ...state, lastOpenedPythonTaskId: taskId };
}

export function recordPythonDraft(
  state: ProgressState,
  taskId: string,
  code: string,
): ProgressState {
  requirePythonTaskId(taskId);
  requirePythonCode(code);
  requirePythonTaskCapacity(state, taskId);
  const previous = state.pythonTasks[taskId];
  if (previous?.lastCode === code) return state;
  const task = previous ?? createEmptyPythonTaskProgress(taskId);
  return {
    ...state,
    pythonTasks: {
      ...state.pythonTasks,
      [taskId]: { ...task, lastCode: code, hintsUsed: [...task.hintsUsed] },
    },
  };
}

export function recordPythonAttempt(
  state: ProgressState,
  taskId: string,
  code: string,
  completed: boolean,
  solveTimeSeconds: number,
  now = new Date(),
  assistanceAtRunStart?: AttemptAssistanceSnapshot,
): ProgressState {
  requirePythonTaskId(taskId);
  requirePythonCode(code);
  requirePythonTaskCapacity(state, taskId);
  if (typeof completed !== "boolean") {
    throw new Error("Python denemesinin tamamlanma durumu geçerli değil.");
  }
  if (
    !isFiniteNumberInRange(solveTimeSeconds, 0, 100_000_000) ||
    !Number.isFinite(now.getTime())
  ) {
    throw new Error("Python denemesinin çözüm süresi geçerli değil.");
  }
  if (
    assistanceAtRunStart &&
    (!isValidPythonHints([...assistanceAtRunStart.hintsUsed]) ||
      typeof assistanceAtRunStart.solutionRevealed !== "boolean")
  ) {
    throw new Error("Python denemesinin yardım kaydı geçerli değil.");
  }

  const previous = state.pythonTasks[taskId];
  const attempts = (previous?.attempts ?? 0) + 1;
  if (attempts > 1_000_000) {
    throw new Error("Python deneme sayısı güvenli sınırı aşıyor.");
  }
  const firstCompletion = completed && !previous?.completed;
  const solutionRevealed = previous?.solutionRevealed ?? false;
  const scoreAwarded = firstCompletion
    ? calculateCaseScore(
        assistanceAtRunStart?.hintsUsed ?? previous?.hintsUsed ?? [],
        assistanceAtRunStart?.solutionRevealed ?? solutionRevealed,
      )
    : previous?.scoreAwarded;
  const task: PythonTaskProgress = {
    taskId,
    attempts,
    completed: Boolean(previous?.completed || completed),
    ...(firstCompletion
      ? { firstCompletedAt: now.toISOString() }
      : previous?.firstCompletedAt
        ? { firstCompletedAt: previous.firstCompletedAt }
        : {}),
    ...(completed
      ? { lastCompletedAt: now.toISOString() }
      : previous?.lastCompletedAt
        ? { lastCompletedAt: previous.lastCompletedAt }
        : {}),
    lastCode: code,
    hintsUsed: [...(previous?.hintsUsed ?? [])],
    solutionRevealed,
    ...(scoreAwarded !== undefined ? { scoreAwarded } : {}),
    solveTimeSeconds: completed
      ? solveTimeSeconds
      : (previous?.solveTimeSeconds ?? 0),
    firstTry: firstCompletion ? attempts === 1 : (previous?.firstTry ?? false),
  };

  return recordPracticeActivity(
    {
      ...state,
      pythonTasks: { ...state.pythonTasks, [taskId]: task },
    },
    now,
  );
}

export function recordPythonHint(
  state: ProgressState,
  taskId: string,
  hintIndex: number,
  now = new Date(),
): ProgressState {
  requirePythonTaskId(taskId);
  requirePythonTaskCapacity(state, taskId);
  if (!Number.isInteger(hintIndex) || hintIndex < 0 || hintIndex > 2) {
    throw new Error("Python ipucu sırası 0 ile 2 arasında olmalıdır.");
  }
  const previous =
    state.pythonTasks[taskId] ?? createEmptyPythonTaskProgress(taskId);
  const hintsUsed = Array.from(
    new Set([...previous.hintsUsed, hintIndex]),
  ).sort((left, right) => left - right);
  if (
    hintsUsed.length === previous.hintsUsed.length &&
    previous.hintsUsed.every((hint, index) => hint === hintsUsed[index])
  ) {
    return state;
  }
  return recordPracticeActivity(
    {
      ...state,
      pythonTasks: {
        ...state.pythonTasks,
        [taskId]: { ...previous, hintsUsed },
      },
    },
    now,
  );
}

export function recordPythonSolutionReveal(
  state: ProgressState,
  taskId: string,
  now = new Date(),
): ProgressState {
  requirePythonTaskId(taskId);
  requirePythonTaskCapacity(state, taskId);
  const previous =
    state.pythonTasks[taskId] ?? createEmptyPythonTaskProgress(taskId);
  if (previous.completed || previous.solutionRevealed) return state;
  return recordPracticeActivity(
    {
      ...state,
      pythonTasks: {
        ...state.pythonTasks,
        [taskId]: {
          ...previous,
          hintsUsed: [...previous.hintsUsed],
          solutionRevealed: true,
        },
      },
    },
    now,
  );
}

export function recordPythonEvidence(
  state: ProgressState,
  entry: PythonEvidenceEntry,
  options: { replace?: boolean } = {},
): ProgressState {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error("Doğrulanmış Python kanıtı geçerli değil.");
  }
  requirePythonTaskId(entry.taskId);
  if (!state.pythonTasks[entry.taskId]?.completed) {
    throw new Error(
      "Python kanıtı yalnızca doğru değerlendirmeyle tamamlanan bir görev için kaydedilebilir.",
    );
  }
  if (!isPythonEvidenceEntry(entry, entry.taskId, state.pythonTasks)) {
    throw new Error("Doğrulanmış Python kanıtı geçerli değil.");
  }
  if (state.pythonEvidenceByTaskId[entry.taskId] && !options.replace) {
    return state;
  }
  if (
    !state.pythonEvidenceByTaskId[entry.taskId] &&
    Object.keys(state.pythonEvidenceByTaskId).length >=
      MAX_PYTHON_EVIDENCE_ENTRIES
  ) {
    throw new Error("Python kanıt kaydı güvenli sayı sınırını aşıyor.");
  }
  return {
    ...state,
    pythonEvidenceByTaskId: {
      ...state.pythonEvidenceByTaskId,
      [entry.taskId]: clonePythonEvidenceEntry(entry),
    },
  };
}

function cloneVerifiedRunSnapshot(
  snapshot: VerifiedRunSnapshot,
): VerifiedRunSnapshot {
  return {
    ...snapshot,
    columns: [...snapshot.columns],
    previewRows: snapshot.previewRows.map((row) => [...row]),
  };
}

export function recordVerifiedRun(
  state: ProgressState,
  snapshot: VerifiedRunSnapshot,
  options: { replace?: boolean } = {},
): ProgressState {
  if (!isVerifiedRunSnapshot(snapshot)) {
    throw new Error("Doğrulanmış sorgu kanıtı geçerli değil.");
  }
  if (!state.tasks[snapshot.taskId]?.completed) {
    throw new Error(
      "Kanıt yalnızca doğru değerlendirmeyle tamamlanan bir görev için kaydedilebilir.",
    );
  }

  const existing = state.evidenceByTaskId[snapshot.taskId];
  if (existing && !options.replace) return state;

  return {
    ...state,
    evidenceByTaskId: {
      ...state.evidenceByTaskId,
      [snapshot.taskId]: {
        taskId: snapshot.taskId,
        verifiedRun: cloneVerifiedRunSnapshot(snapshot),
        ...(existing?.note ? { note: { ...existing.note } } : {}),
      },
    },
  };
}

function normalizeDecisionNoteField(value: string): string {
  return value.normalize("NFC").trim();
}

function requireDecisionNoteField(value: string, label: string): string {
  const normalized = normalizeDecisionNoteField(value);
  if (!normalized) {
    throw new Error(`${label} boş bırakılamaz.`);
  }
  if (characterCount(normalized) > MAX_DECISION_NOTE_FIELD_CHARS) {
    throw new Error(
      `${label} en fazla ${MAX_DECISION_NOTE_FIELD_CHARS} karakter olabilir.`,
    );
  }
  return normalized;
}

export function saveDecisionNote(
  state: ProgressState,
  taskId: string,
  input: DecisionNoteInput,
): ProgressState {
  const existing = state.evidenceByTaskId[taskId];
  if (!existing) {
    throw new Error(
      "Karar notu yazmadan önce görev için doğrulanmış bir sorgu kanıtı gerekir.",
    );
  }

  const finding = requireDecisionNoteField(input.finding, "Bulgu");
  const recommendation = requireDecisionNoteField(
    input.recommendation,
    "Öneri",
  );
  const normalizedCaveat = input.caveat
    ? normalizeDecisionNoteField(input.caveat)
    : "";
  if (characterCount(normalizedCaveat) > MAX_DECISION_NOTE_FIELD_CHARS) {
    throw new Error(
      `Sınırlılık en fazla ${MAX_DECISION_NOTE_FIELD_CHARS} karakter olabilir.`,
    );
  }

  const note: DecisionNote = {
    finding,
    recommendation,
    ...(normalizedCaveat ? { caveat: normalizedCaveat } : {}),
    updatedAt: new Date().toISOString(),
  };

  return recordPracticeActivity({
    ...state,
    evidenceByTaskId: {
      ...state.evidenceByTaskId,
      [taskId]: {
        ...existing,
        note,
      },
    },
  });
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function recordPracticeActivity(
  state: ProgressState,
  date = new Date(),
): ProgressState {
  const dateKey = localDateKey(date);
  if (state.activityDates.includes(dateKey)) return state;
  return {
    ...state,
    activityDates: [...state.activityDates, dateKey].sort(),
  };
}

export function recordAttempt(
  state: ProgressState,
  taskId: string,
  query: string,
  completed: boolean,
  solveTimeSeconds: number,
  now = new Date(),
  assistanceAtRunStart?: AttemptAssistanceSnapshot,
  options: { scored?: boolean } = {},
): ProgressState {
  const previous = state.tasks[taskId];
  const attempts = (previous?.attempts ?? 0) + 1;
  const firstCompletion = completed && !previous?.completed;
  const solutionRevealed = previous?.solutionRevealed ?? false;
  const isUnscored = options.scored === false || previous?.scored === false;
  const scoreAwarded = isUnscored
    ? undefined
    : firstCompletion
      ? calculateCaseScore(
          assistanceAtRunStart?.hintsUsed ?? previous?.hintsUsed ?? [],
          assistanceAtRunStart?.solutionRevealed ?? solutionRevealed,
        )
      : previous?.scoreAwarded;
  const task: TaskProgress = {
    taskId,
    attempts,
    completed: Boolean(previous?.completed || completed),
    firstCompletedAt: firstCompletion
      ? now.toISOString()
      : previous?.firstCompletedAt,
    lastCompletedAt: completed ? now.toISOString() : previous?.lastCompletedAt,
    lastQuery: query,
    hintsUsed: previous?.hintsUsed ?? [],
    solutionRevealed,
    ...(isUnscored ? { scored: false as const } : {}),
    ...(scoreAwarded !== undefined ? { scoreAwarded } : {}),
    solveTimeSeconds: completed
      ? solveTimeSeconds
      : (previous?.solveTimeSeconds ?? 0),
    firstTry: firstCompletion ? attempts === 1 : (previous?.firstTry ?? false),
  };

  return recordPracticeActivity(
    {
      ...state,
      tasks: { ...state.tasks, [taskId]: task },
    },
    now,
  );
}

export function recordHint(
  state: ProgressState,
  taskId: string,
  hintIndex: number,
  now = new Date(),
): ProgressState {
  const previous = state.tasks[taskId] ?? {
    taskId,
    attempts: 0,
    completed: false,
    lastQuery: "",
    hintsUsed: [],
    solutionRevealed: false,
    solveTimeSeconds: 0,
    firstTry: false,
  };
  return recordPracticeActivity(
    {
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
    },
    now,
  );
}

export function recordSolutionReveal(
  state: ProgressState,
  taskId: string,
  now = new Date(),
): ProgressState {
  const previous = state.tasks[taskId] ?? {
    taskId,
    attempts: 0,
    completed: false,
    lastQuery: "",
    hintsUsed: [],
    solutionRevealed: false,
    solveTimeSeconds: 0,
    firstTry: false,
  };
  if (previous.completed || previous.solutionRevealed) return state;

  return recordPracticeActivity(
    {
      ...state,
      tasks: {
        ...state.tasks,
        [taskId]: { ...previous, solutionRevealed: true },
      },
    },
    now,
  );
}

export function calculateStreak(
  activityDates: string[],
  now = new Date(),
): number {
  if (!activityDates.length) return 0;
  const dates = new Set(activityDates);
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const today = localDateKey(cursor);
  if (!dates.has(today)) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (dates.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
