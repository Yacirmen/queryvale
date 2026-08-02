import { loadPyodide, type PyodideAPI } from "pyodide";
import {
  isPythonWorkerRequest,
  MAX_PYTHON_TRACEBACK_CHARS,
  type PythonWorkerMessage,
} from "./types";
import { executePythonAnalysis } from "./pythonRunner";

interface WorkerPort {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(message: PythonWorkerMessage): void;
}

const workerPort = globalThis as unknown as WorkerPort;
let runtimePromise: Promise<PyodideAPI> | undefined;
let runtimeBaseUrl: string | undefined;
const loadedPackages = new Set<string>();

async function getRuntime(indexURL: string): Promise<PyodideAPI> {
  if (runtimePromise && runtimeBaseUrl === indexURL) return runtimePromise;
  loadedPackages.clear();
  runtimeBaseUrl = indexURL;
  runtimePromise = loadPyodide({ indexURL, packageBaseUrl: indexURL });
  return runtimePromise;
}

function post(message: PythonWorkerMessage): void {
  workerPort.postMessage(message);
}

workerPort.onmessage = async (event) => {
  const request = event.data;
  if (!isPythonWorkerRequest(request)) return;
  const envelope = {
    requestId: request.requestId,
    generation: request.generation,
  };

  try {
    post({ type: "phase", ...envelope, phase: "loading-runtime" });
    const runtime = await getRuntime(request.runtimeBaseUrl);
    const packagesToLoad = request.packages.filter(
      (packageName) => !loadedPackages.has(packageName),
    );
    if (packagesToLoad.length) {
      post({ type: "phase", ...envelope, phase: "loading-packages" });
      await runtime.loadPackage(packagesToLoad);
      packagesToLoad.forEach((packageName) => loadedPackages.add(packageName));
    }

    post({ type: "phase", ...envelope, phase: "running" });
    const result = await executePythonAnalysis(runtime, request);
    post({ type: "result", ...envelope, result });
  } catch (error) {
    post({
      type: "system-error",
      ...envelope,
      message:
        error instanceof Error
          ? error.message.slice(0, MAX_PYTHON_TRACEBACK_CHARS)
          : "Python çalışma ortamı başlatılamadı.",
    });
  }
};
