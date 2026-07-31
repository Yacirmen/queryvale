"use client";

import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";

loader.config({ monaco });

const workerScope = globalThis as typeof globalThis & {
  monaco?: typeof monaco;
  MonacoEnvironment?: {
    getWorker?: () => Worker;
  };
};

workerScope.monaco = monaco;
workerScope.MonacoEnvironment = {
  ...workerScope.MonacoEnvironment,
  getWorker: () => new EditorWorker(),
};

export default Editor;
