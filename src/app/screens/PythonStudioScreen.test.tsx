import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { pythonModules, pythonTasks } from "../../content/pythonCurriculum";
import {
  MAX_PYTHON_CODE_CHARS,
  createDefaultProgress,
  type ProgressState,
} from "../../features/progress/progressStore";
import {
  PythonRuntimeClient,
  type PythonExecutionResult,
} from "../../features/python-engine";
import type {
  PythonCurriculumModule,
  PythonLessonTask,
} from "../../types/pythonLesson";
import { PythonStudioScreen } from "./PythonStudioScreen";

const runtimeHarness = vi.hoisted(() => ({
  run: vi.fn(),
  stop: vi.fn(),
  reset: vi.fn(),
  dispose: vi.fn(),
}));

const editorHarness = vi.hoisted(() => ({
  actions: new Map<number, () => void>(),
  ctrlCmd: 2_048,
  enter: 3,
  keyS: 49,
}));

vi.mock("../../features/python-engine", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../features/python-engine")>();

  class MockPythonRuntimeClient {
    run = runtimeHarness.run;
    stop = runtimeHarness.stop;
    reset = runtimeHarness.reset;
    dispose = runtimeHarness.dispose;
  }

  return { ...actual, PythonRuntimeClient: MockPythonRuntimeClient };
});

vi.mock("../components/LocalMonacoEditor", () => {
  interface MockEditorProps {
    value?: string;
    onChange?: (value?: string) => void;
    onMount?: (
      editor: {
        focus: () => void;
        addAction: (descriptor: {
          keybindings?: number[];
          run: () => void;
        }) => { dispose: () => void };
      },
      monaco: {
        KeyMod: { CtrlCmd: number };
        KeyCode: { Enter: number; KeyS: number };
      },
    ) => void;
    theme?: string;
    "aria-label"?: string;
  }

  function MockMonacoEditor({
    value,
    onChange,
    onMount,
    theme,
    "aria-label": ariaLabel,
  }: MockEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const onMountRef = useRef(onMount);

    useEffect(() => {
      onMountRef.current?.(
        {
          focus: () => textareaRef.current?.focus(),
          addAction: (descriptor) => {
            const keybindings = descriptor.keybindings ?? [];
            keybindings.forEach((keybinding) =>
              editorHarness.actions.set(keybinding, descriptor.run),
            );
            return {
              dispose: () => {
                keybindings.forEach((keybinding) => {
                  if (
                    editorHarness.actions.get(keybinding) === descriptor.run
                  ) {
                    editorHarness.actions.delete(keybinding);
                  }
                });
              },
            };
          },
        },
        {
          KeyMod: { CtrlCmd: editorHarness.ctrlCmd },
          KeyCode: {
            Enter: editorHarness.enter,
            KeyS: editorHarness.keyS,
          },
        },
      );
    }, []);

    return (
      <textarea
        ref={textareaRef}
        aria-label={ariaLabel}
        data-editor-theme={theme}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
      />
    );
  }

  return { default: MockMonacoEditor };
});

const task = pythonTasks[0]!;
const moduleFixture: PythonCurriculumModule = {
  ...pythonModules[0]!,
  tasks: [task],
};
const accessibleNextTask: PythonLessonTask = {
  ...pythonTasks[1]!,
  prerequisites: [],
};

function correctExecution(): PythonExecutionResult {
  return {
    kind: "success",
    artifact: {
      kind: "table",
      columns: [...task.expectedColumns],
      dtypes: task.expectedColumns.map(
        (column) => task.expectedDtypes?.[column] ?? "object",
      ),
      rows: task.expectedRows.map((row) => [...row]),
      rowCount: task.expectedRows.length,
    },
    stdout: "",
    durationMs: 7,
  };
}

function wrongExecution(): PythonExecutionResult {
  return {
    kind: "success",
    artifact: {
      kind: "table",
      columns: [...task.expectedColumns],
      dtypes: task.expectedColumns.map(
        (column) => task.expectedDtypes?.[column] ?? "object",
      ),
      rows: [[0, 0, 0, 0]],
      rowCount: 1,
    },
    stdout: "",
    durationMs: 5,
  };
}

function installMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderStudio(
  options: {
    mobile?: boolean;
    tasks?: PythonLessonTask[];
    progress?: ProgressState;
  } = {},
) {
  installMatchMedia(Boolean(options.mobile));
  let progress = options.progress ?? createDefaultProgress();
  const taskList = options.tasks ?? [task];
  const modules = [
    {
      ...moduleFixture,
      tasks: taskList.filter(
        (candidate) => candidate.moduleId === task.moduleId,
      ),
    },
  ];
  const onProgressChange = vi.fn(
    (update: (current: ProgressState) => ProgressState) => {
      progress = update(progress);
    },
  );
  const onSelectTask = vi.fn();
  const runtime = new PythonRuntimeClient();

  const view = render(
    <PythonStudioScreen
      task={task}
      modules={modules}
      tasks={taskList}
      runtime={runtime}
      progress={progress}
      settings={progress.settings}
      persistenceAvailable
      onProgressChange={onProgressChange}
      onSelectTask={onSelectTask}
    />,
  );

  return {
    ...view,
    getProgress: () => progress,
    onProgressChange,
    onSelectTask,
    runtime,
  };
}

describe("PythonStudioScreen", () => {
  beforeEach(() => {
    cleanup();
    runtimeHarness.run.mockReset();
    runtimeHarness.stop.mockReset();
    runtimeHarness.reset.mockReset();
    runtimeHarness.dispose.mockReset();
    editorHarness.actions.clear();
    installMatchMedia(false);
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("starts with an explicit empty output while keeping the editor named", async () => {
    renderStudio();

    expect(
      await screen.findByRole("textbox", {
        name: `Python kod editörü — ${task.title}`,
      }),
    ).toHaveValue(task.starterCode);
    expect(
      screen.getByText("Analiz çıktın burada oluşacak"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Kodunu çalıştırdığında gerçek DataFrame/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Çalıştır/ })).toBeEnabled();
    expect(
      screen.queryByRole("table", { name: /üretilen result DataFrame/ }),
    ).not.toBeInTheDocument();
  });

  it("renders a correct real table before its success feedback", async () => {
    const user = userEvent.setup();
    runtimeHarness.run.mockResolvedValueOnce(correctExecution());
    renderStudio({ tasks: [task, accessibleNextTask] });

    await user.click(screen.getByRole("button", { name: /^Çalıştır/ }));

    const table = await screen.findByRole("table", {
      name: `${task.title} için üretilen result DataFrame`,
    });
    expect(within(table).getByText("row_count")).toBeInTheDocument();
    expect(within(table).getByText("6")).toBeInTheDocument();
    expect(screen.getByText("Doğrulandı")).toBeInTheDocument();
    const scrollRegion = screen.getByRole("region", {
      name: `${task.title} sonuç tablosu; yatay kaydırılabilir`,
    });
    expect(scrollRegion).toHaveAttribute("tabindex", "0");

    const feedback = screen
      .getByText("Analiz çıktısı doğrulandı", { selector: "strong" })
      .closest(".python-evaluation-card");
    if (!feedback) throw new Error("Success feedback card was not rendered.");
    expect(
      table.compareDocumentPosition(feedback) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const debrief = screen.getByRole("region", { name: "Neden çalıştı?" });
    expect(within(debrief).getByText(task.explanation)).toBeInTheDocument();
    for (const step of task.debrief.steps) {
      expect(within(debrief).getByText(step)).toBeInTheDocument();
    }
    expect(
      within(debrief).getByText(task.debrief.transfer.prompt),
    ).toBeInTheDocument();
    const nextCase = screen.getByRole("button", {
      name: /Sonraki vakaya geç/,
    });
    expect(
      debrief.compareDocumentPosition(nextCase) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("keeps the produced table visible when validation is wrong", async () => {
    const user = userEvent.setup();
    runtimeHarness.run.mockResolvedValueOnce(wrongExecution());
    renderStudio();

    await user.click(screen.getByRole("button", { name: /^Çalıştır/ }));

    const table = await screen.findByRole("table", {
      name: `${task.title} için üretilen result DataFrame`,
    });
    expect(table).toBeInTheDocument();
    expect(screen.getByText("Yeniden kontrol et")).toBeInTheDocument();
    expect(
      screen.getByText("Kod çalıştı; sonuç henüz hedef değil"),
    ).toBeInTheDocument();
  });

  it("reveals hints progressively and requires confirmation before the full solution", async () => {
    const user = userEvent.setup();
    const { getProgress } = renderStudio();
    const editor = await screen.findByRole("textbox", {
      name: `Python kod editörü — ${task.title}`,
    });

    await user.click(screen.getByRole("button", { name: "1. ipucunu aç" }));
    expect(screen.getByText(task.hints[0].body)).toBeInTheDocument();
    expect(getProgress().pythonTasks[task.id]?.hintsUsed).toEqual([0]);

    await user.click(screen.getByRole("button", { name: "Tam çözümü gör" }));
    expect(
      screen.getByRole("alertdialog", {
        name: "Tam çözümü açmak istiyor musun?",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Çalışan çözüm")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Çözümü göster" }));
    expect(screen.getByText("Çalışan çözüm")).toBeInTheDocument();
    expect(
      document.querySelector(".python-solution-block code"),
    ).toHaveTextContent("result = pd.DataFrame");
    expect(editor).toHaveValue(task.starterCode);
    expect(getProgress().pythonTasks[task.id]?.solutionRevealed).toBe(true);
  });

  it("exposes four named mobile tabs with roving keyboard selection", async () => {
    const user = userEvent.setup();
    const { container } = renderStudio({ mobile: true });
    const tablist = screen.getByRole("tablist", {
      name: "Python çalışma alanı",
    });
    const tabs = within(tablist).getAllByRole("tab");

    expect(tabs).toHaveLength(4);
    expect(
      tabs.map((tab) => tab.textContent?.replace(/\s+/gu, " ").trim()),
    ).toEqual(["01Vaka", "02Veri", "03Python", "04Sonuç"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("tabindex", "0");
    for (const tab of tabs) {
      const controlledPanel = tab.getAttribute("aria-controls");
      expect(controlledPanel).toBeTruthy();
      expect(document.getElementById(controlledPanel!)).toBeInTheDocument();
    }

    tabs[0]?.focus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(tabs[1]).toHaveFocus());
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(container.querySelector(".python-studio-body")).toHaveAttribute(
      "data-mobile-view",
      "data",
    );

    await user.keyboard("{End}");
    await waitFor(() => expect(tabs[3]).toHaveFocus());
    expect(tabs[3]).toHaveAttribute("aria-selected", "true");
    expect(container.querySelector(".python-studio-body")).toHaveAttribute(
      "data-mobile-view",
      "results",
    );
  });

  it("connects desktop tabs to panels and makes dataset overflow keyboard reachable", async () => {
    const user = userEvent.setup();
    renderStudio();
    const tablist = screen.getByRole("tablist", { name: "Vaka içeriği" });
    const tabs = within(tablist).getAllByRole("tab");

    expect(tabs[0]).toHaveAttribute(
      "aria-controls",
      `python-${task.id}-brief-panel`,
    );
    expect(tabs[1]).toHaveAttribute(
      "aria-controls",
      `python-${task.id}-data-panel`,
    );
    tabs[0]?.focus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(tabs[1]).toHaveFocus());
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");

    const datasetRegion = screen.getByRole("region", {
      name: `${task.datasets[0]!.name} veri tablosu; yatay kaydırılabilir`,
    });
    expect(datasetRegion).toHaveAttribute("tabindex", "0");
    datasetRegion.focus();
    expect(datasetRegion).toHaveFocus();
  });

  it("moves mobile focus to the visible result tab after running", async () => {
    const user = userEvent.setup();
    runtimeHarness.run.mockResolvedValueOnce(correctExecution());
    renderStudio({ mobile: true });
    const resultTab = screen.getByRole("tab", { name: "04Sonuç" });

    await user.click(screen.getByRole("button", { name: /^Çalıştır/ }));
    await screen.findByRole("table", {
      name: `${task.title} için üretilen result DataFrame`,
    });

    await waitFor(() => expect(resultTab).toHaveFocus());
    expect(resultTab).toHaveAttribute("aria-selected", "true");
    expect(resultTab).toHaveAttribute(
      "aria-controls",
      `python-${task.id}-results-panel`,
    );
  });

  it("runs and saves the current editor value through Monaco shortcuts", async () => {
    runtimeHarness.run.mockResolvedValueOnce(correctExecution());
    const { getProgress } = renderStudio();
    const editor = await screen.findByRole("textbox", {
      name: `Python kod editörü — ${task.title}`,
    });
    const currentCode = `${task.starterCode}\n# klavye ile güncel sürüm`;
    fireEvent.change(editor, { target: { value: currentCode } });

    const saveBinding = editorHarness.ctrlCmd | editorHarness.keyS;
    const runBinding = editorHarness.ctrlCmd | editorHarness.enter;
    await waitFor(() => {
      expect(editorHarness.actions.has(saveBinding)).toBe(true);
      expect(editorHarness.actions.has(runBinding)).toBe(true);
    });

    act(() => editorHarness.actions.get(saveBinding)?.());
    expect(getProgress().pythonTasks[task.id]?.lastCode).toBe(currentCode);

    act(() => editorHarness.actions.get(runBinding)?.());
    await screen.findByRole("table", {
      name: `${task.title} için üretilen result DataFrame`,
    });
    expect(runtimeHarness.run).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: task.id,
        code: currentCode,
      }),
      expect.any(Function),
    );
  });

  it("bounds oversized pasted code before autosave, manual save or unmount", async () => {
    const user = userEvent.setup();
    const { getProgress, unmount } = renderStudio();
    const editor = await screen.findByRole("textbox", {
      name: `Python kod editörü — ${task.title}`,
    });
    const oversizedCode = "x".repeat(MAX_PYTHON_CODE_CHARS + 17);

    fireEvent.change(editor, { target: { value: oversizedCode } });

    expect(editor).toHaveValue("x".repeat(MAX_PYTHON_CODE_CHARS));
    expect(screen.getByRole("alert")).toHaveTextContent(
      /Python kodu en fazla 200\.000 karakter olabilir/,
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(getProgress().pythonTasks[task.id]?.lastCode).toHaveLength(
      MAX_PYTHON_CODE_CHARS,
    );
    expect(() => unmount()).not.toThrow();
  });

  it("leaves shared runtime disposal to the parent when a case unmounts", () => {
    const { unmount } = renderStudio();

    unmount();

    expect(runtimeHarness.stop).toHaveBeenCalledTimes(1);
    expect(runtimeHarness.dispose).not.toHaveBeenCalled();
  });
});
