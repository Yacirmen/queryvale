import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PythonRuntimeClient,
  type PythonWorkerPort,
} from "./pythonRuntimeClient";
import {
  PYTHON_RUN_TIMEOUT_MS,
  PythonRuntimeError,
  type PythonExecutionResult,
  type PythonRunInput,
  type PythonWorkerRunRequest,
} from "./types";

type MessageListener = (event: MessageEvent<unknown>) => void;
type ErrorListener = () => void;

class FakeWorker implements PythonWorkerPort {
  readonly posted: PythonWorkerRunRequest[] = [];
  readonly messageListeners = new Set<MessageListener>();
  readonly errorListeners = new Set<ErrorListener>();
  terminated = false;
  throwOnPost = false;

  addEventListener(type: "message", listener: MessageListener): void;
  addEventListener(type: "error", listener: ErrorListener): void;
  addEventListener(
    type: "message" | "error",
    listener: MessageListener | ErrorListener,
  ): void {
    if (type === "message") {
      this.messageListeners.add(listener as MessageListener);
    } else {
      this.errorListeners.add(listener as ErrorListener);
    }
  }

  removeEventListener(type: "message", listener: MessageListener): void;
  removeEventListener(type: "error", listener: ErrorListener): void;
  removeEventListener(
    type: "message" | "error",
    listener: MessageListener | ErrorListener,
  ): void {
    if (type === "message") {
      this.messageListeners.delete(listener as MessageListener);
    } else {
      this.errorListeners.delete(listener as ErrorListener);
    }
  }

  postMessage(message: PythonWorkerRunRequest): void {
    if (this.throwOnPost)
      throw new DOMException("clone failed", "DataCloneError");
    this.posted.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  emitMessage(data: unknown): void {
    for (const listener of this.messageListeners) {
      listener({ data } as MessageEvent<unknown>);
    }
  }

  emitError(): void {
    for (const listener of this.errorListeners) listener();
  }
}

const validInput = (): PythonRunInput => ({
  taskId: "py-m1-t1",
  code: "result = orders.copy()",
  datasets: [
    {
      name: "Siparişler",
      variableName: "orders",
      description: "Deterministik test siparişleri.",
      rows: [{ order_id: 1, amount: 25 }],
    },
  ],
  resultVariable: "result",
  packages: ["pandas"],
  runtimeBaseUrl: "https://example.test/vendor/pyodide/0.29.4/",
});

const successResult: PythonExecutionResult = {
  kind: "success",
  artifact: {
    kind: "table",
    columns: ["order_id", "amount"],
    dtypes: ["int64", "int64"],
    rows: [[1, 25]],
    rowCount: 1,
  },
  stdout: "",
  durationMs: 4,
};

function resultEnvelope(
  request: PythonWorkerRunRequest,
  result: PythonExecutionResult = successResult,
) {
  return {
    type: "result" as const,
    requestId: request.requestId,
    generation: request.generation,
    result,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("PythonRuntimeClient", () => {
  it("forwards phases and resolves only the matching worker result", async () => {
    const worker = new FakeWorker();
    const phases = vi.fn();
    const client = new PythonRuntimeClient(() => worker);

    const run = client.run(validInput(), phases);
    const request = worker.posted[0];
    expect(request).toMatchObject({
      type: "run",
      requestId: 1,
      generation: 0,
      taskId: "py-m1-t1",
    });

    worker.emitMessage({
      type: "phase",
      requestId: request.requestId,
      generation: request.generation,
      phase: "loading-packages",
    });
    worker.emitMessage({
      type: "phase",
      requestId: request.requestId,
      generation: request.generation,
      phase: "running",
    });
    worker.emitMessage({
      ...resultEnvelope(request),
      requestId: request.requestId + 99,
    });
    worker.emitMessage(resultEnvelope(request));

    await expect(run).resolves.toEqual(successResult);
    expect(phases.mock.calls.map(([phase]) => phase)).toEqual([
      "loading-packages",
      "running",
    ]);
    expect(worker.terminated).toBe(false);
    client.dispose();
    expect(worker.terminated).toBe(true);
  });

  it("rejects overlapping runs without replacing the active request", async () => {
    const worker = new FakeWorker();
    const client = new PythonRuntimeClient(() => worker);
    const firstRun = client.run(validInput());

    await expect(client.run(validInput())).rejects.toMatchObject({
      code: "busy",
    });
    expect(worker.posted).toHaveLength(1);

    worker.emitMessage(resultEnvelope(worker.posted[0]));
    await expect(firstRun).resolves.toEqual(successResult);
    client.dispose();
  });

  it("terminates a stopped generation and ignores its late messages", async () => {
    const firstWorker = new FakeWorker();
    const secondWorker = new FakeWorker();
    const workers = [firstWorker, secondWorker];
    const client = new PythonRuntimeClient(() => workers.shift()!);
    const firstRun = client.run(validInput());
    const firstRejection = expect(firstRun).rejects.toMatchObject({
      code: "cancelled",
    });

    client.stop();
    await firstRejection;
    expect(firstWorker.terminated).toBe(true);
    expect(firstWorker.messageListeners.size).toBe(0);

    firstWorker.emitMessage(resultEnvelope(firstWorker.posted[0]));
    const secondRun = client.run(validInput());
    expect(secondWorker.posted[0].generation).toBe(1);
    secondWorker.emitMessage(resultEnvelope(secondWorker.posted[0]));
    await expect(secondRun).resolves.toEqual(successResult);
    client.dispose();
  });

  it("re-arms a short execution timeout once Python starts running", async () => {
    vi.useFakeTimers();
    const worker = new FakeWorker();
    const client = new PythonRuntimeClient(() => worker);
    const run = client.run(validInput());
    const request = worker.posted[0];
    const rejection = expect(run).rejects.toMatchObject({ code: "timeout" });

    worker.emitMessage({
      type: "phase",
      requestId: request.requestId,
      generation: request.generation,
      phase: "running",
    });
    await vi.advanceTimersByTimeAsync(PYTHON_RUN_TIMEOUT_MS - 1);
    expect(worker.terminated).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    await rejection;
    expect(worker.terminated).toBe(true);
  });

  it("recovers from structured-clone failures without staying busy", async () => {
    const firstWorker = new FakeWorker();
    firstWorker.throwOnPost = true;
    const secondWorker = new FakeWorker();
    const workers = [firstWorker, secondWorker];
    const client = new PythonRuntimeClient(() => workers.shift()!);

    await expect(client.run(validInput())).rejects.toMatchObject({
      code: "input-limit",
    });
    expect(firstWorker.terminated).toBe(true);

    const secondRun = client.run(validInput());
    secondWorker.emitMessage(resultEnvelope(secondWorker.posted[0]));
    await expect(secondRun).resolves.toEqual(successResult);
    client.dispose();
  });

  it("fails closed and resets after malformed worker output", async () => {
    const worker = new FakeWorker();
    const client = new PythonRuntimeClient(() => worker);
    const run = client.run(validInput());
    const request = worker.posted[0];

    worker.emitMessage({
      type: "result",
      requestId: request.requestId,
      generation: request.generation,
      result: {
        ...successResult,
        artifact: {
          kind: "table",
          columns: ["order_id"],
          dtypes: [],
          rows: [[1]],
          rowCount: 1,
        },
      },
    });

    await expect(run).rejects.toMatchObject({ code: "runtime-unavailable" });
    expect(worker.terminated).toBe(true);
  });

  it("maps worker creation and worker crashes to recoverable runtime errors", async () => {
    const constructionError = new PythonRuntimeClient(() => {
      throw new Error("worker unavailable");
    });
    await expect(constructionError.run(validInput())).rejects.toMatchObject({
      code: "runtime-unavailable",
    });

    const worker = new FakeWorker();
    const client = new PythonRuntimeClient(() => worker);
    const run = client.run(validInput());
    worker.emitError();
    await expect(run).rejects.toMatchObject({ code: "runtime-unavailable" });
    expect(worker.terminated).toBe(true);
  });

  it("rejects unsafe dataset contracts before allocating a worker", async () => {
    const createWorker = vi.fn(() => new FakeWorker());
    const client = new PythonRuntimeClient(createWorker);
    const reservedVariable = validInput();
    reservedVariable.datasets[0].variableName = "pd";

    await expect(client.run(reservedVariable)).rejects.toBeInstanceOf(
      PythonRuntimeError,
    );
    await expect(client.run(reservedVariable)).rejects.toMatchObject({
      code: "input-limit",
    });
    expect(createWorker).not.toHaveBeenCalled();
  });
});
