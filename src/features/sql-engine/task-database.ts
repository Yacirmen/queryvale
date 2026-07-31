import {
  assertQueryAllowed,
  maskSqlLiteralsAndComments,
} from "./security";
import type {
  QueryExecutionResult,
  SqlRow,
  TaskDatabaseConfig,
  TaskDatabaseState,
} from "./types";

const DEFAULT_MAX_ROWS = 200;
const HARD_MAX_ROWS = 200;
const DEFAULT_TIMEOUT_MS = 8_000;
const MIN_TIMEOUT_MS = 250;
const MAX_TIMEOUT_MS = 30_000;

interface PGliteField {
  name: string;
}

interface PGliteResult {
  rows?: SqlRow[];
  fields?: PGliteField[];
  affectedRows?: number;
}

interface PGliteDatabase {
  exec(sql: string): Promise<PGliteResult[]>;
  query(sql: string): Promise<PGliteResult>;
  close(): Promise<void>;
}

interface PGliteConstructor {
  create(): Promise<PGliteDatabase>;
}

interface PGliteModule {
  PGlite: PGliteConstructor;
}

let pgliteModulePromise: Promise<PGliteModule> | undefined;

function loadPGlite(): Promise<PGliteModule> {
  pgliteModulePromise ??= import("@electric-sql/pglite") as Promise<PGliteModule>;
  return pgliteModulePromise;
}

function requireBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error(
      "Görev veritabanı yalnızca tarayıcıda başlatılabilir. Bu koruma PGlite paketinin sunucu paketine eklenmesini önler.",
    );
  }
}

function clampInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(maximum, Math.max(minimum, Math.trunc(value as number)));
}

function stripFinalSemicolon(sql: string): string {
  return sql.trim().replace(/;+\s*$/, "");
}

function isWrappableReadQuery(sql: string): boolean {
  const masked = maskSqlLiteralsAndComments(sql).trimStart();
  return /^(?:select|with|values|table)\b/i.test(masked);
}

function withResultLimit(sql: string, maxRows: number): string {
  const statement = stripFinalSemicolon(sql);
  return `SELECT * FROM (${statement}) AS __sqlforge_result LIMIT ${maxRows + 1}`;
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout: () => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      onTimeout();
      reject(
        new Error(
          `Sorgu ${timeoutMs} ms sınırını aştığı için durduruldu. Daha küçük bir veri kümesi veya daha seçici bir koşul dene.`,
        ),
      );
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

/**
 * An ephemeral, one-task/one-database wrapper. PGlite is dynamically imported
 * only after this browser-only class is initialized.
 */
export class TaskDatabase {
  readonly taskId: string;
  readonly maxRows: number;
  readonly timeoutMs: number;

  private readonly setupSql: string;
  private readonly forbiddenOperations: readonly string[];
  private database: PGliteDatabase | undefined;
  private operationQueue: Promise<unknown> = Promise.resolve();
  private _state: TaskDatabaseState = "idle";
  private generation = 0;

  constructor(config: TaskDatabaseConfig) {
    if (!config.taskId.trim()) {
      throw new Error("TaskDatabase için taskId gereklidir.");
    }
    if (!config.setupSql.trim()) {
      throw new Error("TaskDatabase için setupSql gereklidir.");
    }

    this.taskId = config.taskId;
    this.setupSql = config.setupSql;
    this.forbiddenOperations = config.forbiddenOperations ?? [];
    this.maxRows = clampInteger(
      config.maxRows,
      DEFAULT_MAX_ROWS,
      1,
      HARD_MAX_ROWS,
    );
    this.timeoutMs = clampInteger(
      config.timeoutMs,
      DEFAULT_TIMEOUT_MS,
      MIN_TIMEOUT_MS,
      MAX_TIMEOUT_MS,
    );
  }

  get state(): TaskDatabaseState {
    return this._state;
  }

  initialize(): Promise<void> {
    return this.enqueue(async () => {
      requireBrowser();
      if (this._state === "disposed") {
        throw new Error("Kapatılmış görev veritabanı yeniden başlatılamaz.");
      }
      if (this.database && this._state === "ready") {
        return;
      }
      await this.createFreshDatabase("initializing");
    });
  }

  run(sql: string): Promise<QueryExecutionResult> {
    return this.enqueue(async () => {
      requireBrowser();
      if (this._state === "disposed") {
        throw new Error("Kapatılmış görev veritabanında sorgu çalıştırılamaz.");
      }
      assertQueryAllowed(sql, this.forbiddenOperations);

      if (!this.database) {
        await this.createFreshDatabase("initializing");
      }

      const database = this.database;
      if (!database) {
        throw new Error("Görev veritabanı başlatılamadı.");
      }

      this._state = "running";
      const startedAt = performance.now();
      const generationAtStart = this.generation;
      const statement = isWrappableReadQuery(sql)
        ? withResultLimit(sql, this.maxRows)
        : stripFinalSemicolon(sql);

      try {
        // PostgreSQL enforces this inside the engine; Promise timeout is a
        // second guard for initialization/bridge failures.
        await database.query(`SET statement_timeout = ${this.timeoutMs}`);
        const rawResult = await withTimeout(
          database.query(statement),
          this.timeoutMs + 250,
          () => {
            if (generationAtStart === this.generation) {
              this._state = "failed";
              void database.close().catch(() => undefined);
              this.database = undefined;
              this.generation += 1;
            }
          },
        );

        const allRows = rawResult.rows ?? [];
        const truncated = allRows.length > this.maxRows;
        const rows = allRows.slice(0, this.maxRows);
        const columns =
          rawResult.fields?.map((field) => field.name) ??
          (rows[0] ? Object.keys(rows[0]) : []);

        this._state = "ready";
        return {
          columns,
          rows,
          rowCount: rows.length,
          affectedRows: rawResult.affectedRows ?? 0,
          truncated,
          durationMs: performance.now() - startedAt,
        };
      } catch (error) {
        if (this.database) {
          this._state = "ready";
        }
        throw error;
      }
    });
  }

  reset(): Promise<void> {
    return this.enqueue(async () => {
      requireBrowser();
      if (this._state === "disposed") {
        throw new Error("Kapatılmış görev veritabanı sıfırlanamaz.");
      }
      await this.closeCurrentDatabase();
      await this.createFreshDatabase("resetting");
    });
  }

  dispose(): Promise<void> {
    return this.enqueue(async () => {
      await this.closeCurrentDatabase();
      this._state = "disposed";
    });
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.operationQueue.then(operation, operation);
    this.operationQueue = next.catch(() => undefined);
    return next;
  }

  private async createFreshDatabase(
    loadingState: "initializing" | "resetting",
  ): Promise<void> {
    this._state = loadingState;
    try {
      const { PGlite } = await loadPGlite();
      const database = await PGlite.create();
      try {
        await database.exec(this.setupSql);
      } catch (error) {
        await database.close().catch(() => undefined);
        throw error;
      }
      this.database = database;
      this.generation += 1;
      this._state = "ready";
    } catch (error) {
      this._state = "failed";
      throw error;
    }
  }

  private async closeCurrentDatabase(): Promise<void> {
    const database = this.database;
    this.database = undefined;
    this.generation += 1;
    if (database) {
      await database.close();
    }
  }
}

export function createTaskDatabase(config: TaskDatabaseConfig): TaskDatabase {
  return new TaskDatabase(config);
}

export function resetPGliteModuleForTests(): void {
  pgliteModulePromise = undefined;
}
