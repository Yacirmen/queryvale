import {
  isPythonWorkerMessage,
  isPythonWorkerRequest,
  MAX_PYTHON_CODE_CHARS,
  MAX_PYTHON_DATASET_ROWS,
  PYTHON_BOOT_TIMEOUT_MS,
  PYTHON_RUN_TIMEOUT_MS,
  PythonRuntimeError,
  type PythonExecutionResult,
  type PythonRunInput,
  type PythonRuntimePhase,
  type PythonWorkerRunRequest,
} from "./types";

interface PendingRun {
  requestId: number;
  generation: number;
  resolve: (result: PythonExecutionResult) => void;
  reject: (error: PythonRuntimeError) => void;
  onPhase?: (phase: PythonRuntimePhase) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export interface PythonWorkerPort {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  addEventListener(type: "error", listener: () => void): void;
  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
  removeEventListener(type: "error", listener: () => void): void;
  postMessage(message: PythonWorkerRunRequest): void;
  terminate(): void;
}

type WorkerFactory = () => PythonWorkerPort;

export class PythonRuntimeClient {
  private worker: PythonWorkerPort | undefined;
  private pending: PendingRun | undefined;
  private requestId = 0;
  private generation = 0;

  constructor(
    private readonly createWorker: WorkerFactory = () =>
      new Worker(new URL("./python.worker.ts", import.meta.url), {
        type: "module",
        name: "queryvale-python-runtime",
      }),
  ) {}

  private ensureWorker(): PythonWorkerPort {
    if (this.worker) return this.worker;
    const worker = this.createWorker();
    try {
      worker.addEventListener("message", this.handleMessage);
      worker.addEventListener("error", this.handleWorkerError);
    } catch (error) {
      worker.removeEventListener("message", this.handleMessage);
      worker.removeEventListener("error", this.handleWorkerError);
      worker.terminate();
      throw error;
    }
    this.worker = worker;
    return worker;
  }

  private armTimeout(durationMs: number): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
      this.cancelPending(
        new PythonRuntimeError(
          durationMs === PYTHON_RUN_TIMEOUT_MS
            ? "Kod süre sınırını aştı; Python ortamı güvenle yeniden başlatıldı."
            : "Python ortamı zamanında hazırlanamadı. Bağlantını kontrol edip tekrar dene.",
          "timeout",
        ),
      );
    }, durationMs);
  }

  private readonly handleMessage = (event: MessageEvent<unknown>) => {
    const message = event.data;
    const pending = this.pending;
    if (!isPythonWorkerMessage(message)) {
      if (pending) {
        this.cancelPending(
          new PythonRuntimeError(
            "Python çalışma ortamı geçersiz bir yanıt üretti.",
            "runtime-unavailable",
          ),
        );
      }
      return;
    }
    if (
      !pending ||
      message.generation !== pending.generation ||
      message.requestId !== pending.requestId
    ) {
      return;
    }

    if (message.type === "phase") {
      pending.onPhase?.(message.phase);
      if (message.phase === "running") {
        clearTimeout(pending.timeout);
        pending.timeout = this.armTimeout(PYTHON_RUN_TIMEOUT_MS);
      }
      return;
    }

    clearTimeout(pending.timeout);
    this.pending = undefined;
    if (message.type === "result") {
      pending.resolve(message.result);
      return;
    }
    pending.reject(
      new PythonRuntimeError(
        `Python ortamı başlatılamadı: ${message.message}`,
        "runtime-unavailable",
      ),
    );
    this.resetWorker();
  };

  private readonly handleWorkerError = () => {
    this.cancelPending(
      new PythonRuntimeError(
        "Python çalışma ortamı beklenmedik biçimde durdu; yeniden deneyebilirsin.",
        "runtime-unavailable",
      ),
    );
  };

  private resetWorker(): void {
    if (!this.worker) return;
    this.worker.removeEventListener("message", this.handleMessage);
    this.worker.removeEventListener("error", this.handleWorkerError);
    this.worker.terminate();
    this.worker = undefined;
    this.generation += 1;
  }

  private cancelPending(error: PythonRuntimeError): void {
    const pending = this.pending;
    if (pending) {
      clearTimeout(pending.timeout);
      this.pending = undefined;
      pending.reject(error);
    }
    this.resetWorker();
  }

  run(
    input: PythonRunInput,
    onPhase?: (phase: PythonRuntimePhase) => void,
  ): Promise<PythonExecutionResult> {
    if (this.pending) {
      return Promise.reject(
        new PythonRuntimeError("Bir Python çalışması zaten sürüyor.", "busy"),
      );
    }
    if (!input.code.trim() || input.code.length > MAX_PYTHON_CODE_CHARS) {
      return Promise.reject(
        new PythonRuntimeError(
          input.code.trim()
            ? `Python kodu ${MAX_PYTHON_CODE_CHARS.toLocaleString("tr-TR")} karakter sınırını aşıyor.`
            : "Çalıştırmak için editöre Python kodu yaz.",
          "input-limit",
        ),
      );
    }
    const datasetRows = input.datasets.reduce(
      (total, dataset) => total + dataset.rows.length,
      0,
    );
    if (datasetRows > MAX_PYTHON_DATASET_ROWS) {
      return Promise.reject(
        new PythonRuntimeError(
          "Vaka veri seti güvenli satır sınırını aşıyor.",
          "input-limit",
        ),
      );
    }

    const candidateRequest = {
      type: "run" as const,
      requestId: this.requestId + 1,
      generation: this.generation,
      ...input,
    };
    if (!isPythonWorkerRequest(candidateRequest)) {
      return Promise.reject(
        new PythonRuntimeError(
          "Python vakasının veri veya çalışma sözleşmesi geçerli değil.",
          "input-limit",
        ),
      );
    }

    let worker: PythonWorkerPort;
    try {
      worker = this.ensureWorker();
    } catch {
      return Promise.reject(
        new PythonRuntimeError(
          "Python çalışma ortamı başlatılamadı.",
          "runtime-unavailable",
        ),
      );
    }
    this.requestId += 1;
    const requestId = this.requestId;
    const generation = this.generation;
    return new Promise((resolve, reject) => {
      const pending: PendingRun = {
        requestId,
        generation,
        resolve,
        reject,
        onPhase,
        timeout: this.armTimeout(PYTHON_BOOT_TIMEOUT_MS),
      };
      this.pending = pending;
      const request: PythonWorkerRunRequest = {
        type: "run",
        requestId,
        generation,
        ...input,
      };
      try {
        worker.postMessage(request);
      } catch {
        clearTimeout(pending.timeout);
        this.pending = undefined;
        this.resetWorker();
        reject(
          new PythonRuntimeError(
            "Python vakası çalışma ortamına aktarılamadı.",
            "input-limit",
          ),
        );
      }
    });
  }

  stop(): void {
    if (!this.pending) return;
    this.cancelPending(
      new PythonRuntimeError(
        "Python çalışması durduruldu; kodun korunuyor.",
        "cancelled",
      ),
    );
  }

  reset(): void {
    if (this.pending) {
      this.cancelPending(
        new PythonRuntimeError(
          "Python ortamı sıfırlandı; kodun korunuyor.",
          "cancelled",
        ),
      );
      return;
    }
    this.resetWorker();
  }

  dispose(): void {
    if (this.pending) {
      this.cancelPending(
        new PythonRuntimeError("Python çalışma alanı kapatıldı.", "cancelled"),
      );
      return;
    }
    this.resetWorker();
  }
}
