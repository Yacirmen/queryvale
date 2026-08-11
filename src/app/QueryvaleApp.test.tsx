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
import { modules, pythonTasks, tasks } from "../content";
import {
  createActiveLocalProfileSession,
  createSignedOutLocalProfileSession,
  createLocalAccount,
  createDefaultProgress,
  exportProgress,
  hasLocalAccount,
  loadLocalProfileSession,
  loadProgress,
  localDateKey,
  recordAttempt,
  recordPythonAttempt,
  recordPythonDraft,
  saveProgress,
  saveProgressWithLocalProfileSession,
  updateProfileName,
} from "../features/progress/progressStore";
import { PythonRuntimeClient } from "../features/python-engine";
import { buildModuleAccessStates } from "../features/progress/moduleAccess";
import { QueryvaleApp } from "./QueryvaleApp";

const correctRows = [
  { product_name: "Desk Lamp", category: "Home" },
  { product_name: "Notebook", category: "Stationery" },
  { product_name: "Office Chair", category: "Furniture" },
  { product_name: "Water Bottle", category: "Lifestyle" },
  { product_name: "Standing Desk", category: "Furniture" },
  { product_name: "Pen Set", category: "Stationery" },
];

const editorShortcutHarness = vi.hoisted(() => ({
  actions: new Map<number, () => void>(),
  ctrlCmd: 2_048,
  enter: 3,
  keyK: 41,
  keyS: 49,
}));

const sqlEngineHarness = vi.hoisted(() => ({
  failInitialize: false,
  failReset: false,
  mutationResetCount: 0,
  runDelayMs: 0,
}));

const progressPersistenceHarness = vi.hoisted(() => ({
  loadGate: undefined as Promise<void> | undefined,
  loadOverride: undefined as unknown,
  saveDelays: [] as number[],
  pendingSaves: new Set<Promise<unknown>>(),
}));

async function drainPendingProgressPersistence() {
  for (let pass = 0; pass < 20; pass += 1) {
    await Promise.resolve();
    const pending = [...progressPersistenceHarness.pendingSaves];
    if (pending.length > 0) {
      await Promise.allSettled(pending);
      continue;
    }

    // Queryvale serializes writes through promise chains. Give a settled
    // queue one macrotask to enqueue its next repository write before
    // declaring the previous render fully drained.
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    if (progressPersistenceHarness.pendingSaves.size === 0) return;
  }

  throw new Error("Test ilerleme yazma kuyruğu zamanında boşalmadı.");
}

function progressWithCompletedModulesBefore(moduleId: string) {
  const targetIndex = modules.findIndex((module) => module.id === moduleId);
  return modules
    .slice(0, Math.max(0, targetIndex))
    .flatMap((module) => module.tasks)
    .reduce(
      (current, task) =>
        recordAttempt(current, task.id, task.solutionSql, true, 1),
      createDefaultProgress(),
    );
}

function progressWithSqlAndPythonHistory() {
  const sqlProgress = recordAttempt(
    updateProfileName(createDefaultProgress(), "Ada Analist"),
    "m1-t1",
    "SELECT product_name, category FROM products;",
    true,
    30,
  );
  const crossStudioProgress = recordPythonAttempt(
    sqlProgress,
    "py-m1-t1",
    pythonTasks[0]?.solutionCode ?? "result = orders.copy()",
    true,
    24,
  );

  return {
    ...crossStudioProgress,
    settings: { ...crossStudioProgress.settings, theme: "light" as const },
  };
}

function navigateToRoute(route: "progress" | "settings") {
  act(() => {
    window.history.pushState(null, "", `#/${route}`);
    window.dispatchEvent(new Event("hashchange"));
  });
}

async function openFinalRouteResetConfirmation(
  user: ReturnType<typeof userEvent.setup>,
  options: {
    triggerLabel: string;
    firstTitle: string;
    finalTitle: string;
  },
) {
  await user.click(
    await screen.findByRole("button", { name: options.triggerLabel }),
  );
  const firstDialog = await screen.findByRole("alertdialog", {
    name: options.firstTitle,
  });
  await user.click(
    within(firstDialog).getByRole("button", { name: "Devam et" }),
  );

  return screen.findByRole("alertdialog", { name: options.finalTitle });
}

function getThemeChoice(name: "Açık" | "Koyu") {
  return within(screen.getByRole("group", { name: "Tema" })).getByRole(
    "button",
    { name },
  );
}

function routeButtonName(task: (typeof tasks)[number]): string {
  const label =
    task.type === "drill_intro"
      ? "Alıştırma"
      : task.type === "drill_practice"
        ? "Tekrar"
        : task.type === "drill_mix"
          ? "Birleştir"
          : "Vaka";
  const routeIndex = tasks.findIndex((candidate) => candidate.id === task.id);
  return `Rota · ${label} ${routeIndex + 1}/${tasks.length}`;
}

vi.mock("../features/progress/progressStore", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../features/progress/progressStore")>();
  const trackPersistence = <T,>(operation: () => Promise<T>): Promise<T> => {
    const tracked = (async () => {
      const delay = progressPersistenceHarness.saveDelays.shift() ?? 0;
      if (delay) {
        await new Promise((resolve) => window.setTimeout(resolve, delay));
      }
      return operation();
    })();
    progressPersistenceHarness.pendingSaves.add(tracked);
    return tracked.finally(() => {
      progressPersistenceHarness.pendingSaves.delete(tracked);
    });
  };
  return {
    ...actual,
    loadProgress: async () => {
      const gate = progressPersistenceHarness.loadGate;
      if (gate) await gate;
      if (progressPersistenceHarness.loadOverride) {
        return progressPersistenceHarness.loadOverride as Awaited<
          ReturnType<typeof actual.loadProgress>
        >;
      }
      return actual.loadProgress();
    },
    saveProgress: (
      state: Parameters<typeof actual.saveProgress>[0],
      options?: Parameters<typeof actual.saveProgress>[1],
    ) => trackPersistence(() => actual.saveProgress(state, options)),
    saveProgressWithLocalProfileSession: (
      state: Parameters<typeof actual.saveProgressWithLocalProfileSession>[0],
      session: Parameters<typeof actual.saveProgressWithLocalProfileSession>[1],
      options?: Parameters<
        typeof actual.saveProgressWithLocalProfileSession
      >[2],
    ) =>
      trackPersistence(() =>
        actual.saveProgressWithLocalProfileSession(state, session, options),
      ),
    activateLocalProfileSession: (
      state: Parameters<typeof actual.activateLocalProfileSession>[0],
    ) => trackPersistence(() => actual.activateLocalProfileSession(state)),
    signOutLocalProfileSession: (
      state: Parameters<typeof actual.signOutLocalProfileSession>[0],
    ) => trackPersistence(() => actual.signOutLocalProfileSession(state)),
    eraseLocalProfileAndProgress: () =>
      trackPersistence(() => actual.eraseLocalProfileAndProgress()),
  };
});

vi.mock("../features/sql-engine", () => ({
  createTaskDatabaseForLesson: (task: {
    id: string;
    solutionSql?: string;
    expectedColumns?: readonly string[];
    expectedResult?: ReadonlyArray<readonly unknown[]>;
  }) => {
    let mutationStock = 12;
    return {
      state: "ready",
      initialize: vi.fn(() =>
        sqlEngineHarness.failInitialize
          ? Promise.reject(new Error("worker bootstrap failed"))
          : Promise.resolve(),
      ),
      run: vi.fn(async (sql: string) => {
        if (sqlEngineHarness.runDelayMs) {
          await new Promise((resolve) =>
            window.setTimeout(resolve, sqlEngineHarness.runDelayMs),
          );
        }
        if (task.id === "m8-t1") {
          if (/^\s*select\b/i.test(sql)) {
            return {
              columns: ["product_id", "stock_quantity"],
              rows: [
                { product_id: 801, stock_quantity: mutationStock },
                { product_id: 802, stock_quantity: 6 },
              ],
              rowCount: 2,
              affectedRows: 0,
              truncated: false,
              durationMs: 2,
            };
          }
          const decrement = Number(
            sql.match(/stock_quantity\s*-\s*(\d+)/i)?.[1] ?? 0,
          );
          mutationStock -= decrement;
          return {
            columns: ["product_id", "stock_quantity"],
            rows: [{ product_id: 801, stock_quantity: mutationStock }],
            rowCount: 1,
            affectedRows: 1,
            truncated: false,
            durationMs: 4,
          };
        }
        if (/\bwhere\s+1\s*=\s*0\b/i.test(sql)) {
          return {
            columns: ["product_name", "category"],
            rows: [],
            rowCount: 0,
            affectedRows: 0,
            truncated: false,
            durationMs: 4,
          };
        }
        if (
          task.solutionSql &&
          sql.replace(/\s+/g, " ").replace(/;\s*$/, "").trim() ===
            task.solutionSql.replace(/\s+/g, " ").replace(/;\s*$/, "").trim()
        ) {
          const columns = [...(task.expectedColumns ?? [])];
          const rows = (task.expectedResult ?? []).map((row) =>
            Object.fromEntries(
              columns.map((column, index) => [column, row[index]]),
            ),
          );
          return {
            columns,
            rows,
            rowCount: rows.length,
            affectedRows: 0,
            truncated: false,
            durationMs: 4,
          };
        }
        return {
          columns: ["product_name", "category"],
          rows: correctRows,
          rowCount: 6,
          affectedRows: 0,
          truncated: false,
          durationMs: 4,
        };
      }),
      reset: vi.fn(() => {
        if (sqlEngineHarness.failReset) {
          return Promise.reject(new Error("worker reset failed"));
        }
        if (task.id === "m8-t1") {
          mutationStock = 12;
          sqlEngineHarness.mutationResetCount += 1;
        }
        return Promise.resolve();
      }),
      dispose: vi.fn().mockResolvedValue(undefined),
    };
  },
}));

vi.mock("./components/LocalMonacoEditor", () => {
  function MockMonacoEditor({
    value,
    onChange,
    onMount,
    theme,
    "aria-label": ariaLabel,
  }: {
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
        KeyCode: { Enter: number; KeyK: number; KeyS: number };
      },
    ) => void;
    theme?: string;
    "aria-label"?: string;
  }) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      onMount?.(
        {
          focus: () => textareaRef.current?.focus(),
          addAction: (descriptor) => {
            const keybindings = descriptor.keybindings ?? [];
            keybindings.forEach((keybinding) =>
              editorShortcutHarness.actions.set(keybinding, descriptor.run),
            );
            return {
              dispose: () => {
                keybindings.forEach((keybinding) => {
                  if (
                    editorShortcutHarness.actions.get(keybinding) ===
                    descriptor.run
                  ) {
                    editorShortcutHarness.actions.delete(keybinding);
                  }
                });
              },
            };
          },
        },
        {
          KeyMod: { CtrlCmd: editorShortcutHarness.ctrlCmd },
          KeyCode: {
            Enter: editorShortcutHarness.enter,
            KeyK: editorShortcutHarness.keyK,
            KeyS: editorShortcutHarness.keyS,
          },
        },
      );
    }, [onMount]);

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

describe("QueryvaleApp", () => {
  beforeEach(async () => {
    cleanup();
    await drainPendingProgressPersistence();
    editorShortcutHarness.actions.clear();
    sqlEngineHarness.failInitialize = false;
    sqlEngineHarness.failReset = false;
    sqlEngineHarness.mutationResetCount = 0;
    sqlEngineHarness.runDelayMs = 0;
    progressPersistenceHarness.loadGate = undefined;
    progressPersistenceHarness.loadOverride = undefined;
    progressPersistenceHarness.saveDelays = [];
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 768,
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
    });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 0,
    });
    Object.defineProperty(document.body, "scrollHeight", {
      configurable: true,
      value: 0,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    window.location.hash = "#/";
    document.documentElement.dataset.theme = "";
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase("queryvale");
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
    await loadProgress();
  });

  it("unlocks both landing Studio targets only at the page end and keeps them open while navigating", async () => {
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 2400,
    });
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    await waitFor(() =>
      expect(document.querySelector(".app-shell")).toHaveAttribute(
        "aria-busy",
        "false",
      ),
    );
    const navigation = screen.getByRole("navigation", {
      name: "Ana bölümler",
    });
    const sqlStudio = within(navigation).getByRole("button", {
      name: "SQL Studio — SQL Laboratuvarı",
    });
    const pythonStudio = within(navigation).getByRole("button", {
      name: "Python Studio",
    });

    expect(sqlStudio).toHaveAttribute("aria-disabled", "true");
    expect(pythonStudio).toHaveAttribute("aria-disabled", "true");
    await user.click(pythonStudio);
    expect(window.location.hash).toBe("#/");
    expect(
      within(screen.getByRole("banner")).getByRole("button", {
        name: /^Hemen Başla/,
      }),
    ).toBeEnabled();

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 1632,
    });
    fireEvent.scroll(window);

    await waitFor(() => {
      expect(sqlStudio).not.toHaveAttribute("aria-disabled");
      expect(pythonStudio).not.toHaveAttribute("aria-disabled");
    });
    expect(
      screen.getByText("SQL Studio ve Python Studio bağlantıları açıldı."),
    ).toBeInTheDocument();

    await user.click(pythonStudio);
    expect(window.location.hash).toBe(`#/python/${pythonTasks[0].id}`);
    await screen.findByRole("heading", { name: pythonTasks[0].title });

    await user.click(
      screen.getByRole("button", { name: "Queryvale ana sayfa" }),
    );
    await screen.findByRole("heading", {
      name: /Geleceğin Veri Analistleri.*İçin İnteraktif SQL Studio/i,
    });
    expect(
      within(
        screen.getByRole("navigation", { name: "Ana bölümler" }),
      ).getByRole("button", { name: "Python Studio" }),
    ).not.toHaveAttribute("aria-disabled");
  });

  it("keeps engine initialization failures separate from query coaching", async () => {
    sqlEngineHarness.failInitialize = true;
    window.location.hash = "#/lab/m1-t1";
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 800,
    });
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Bu sistem hatası sorgunla ilgili değil");
    expect(document.querySelector(".workspace-body")).toHaveAttribute(
      "data-mobile-view",
      "results",
    );
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Sonuç görünümü" })).toHaveFocus(),
    );
    expect(
      screen.queryByText(tasks[0].coaching["execution-error"].title),
    ).not.toBeInTheDocument();

    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    await user.type(editor, "SELECT product_name, category FROM products;");
    expect(screen.getByRole("button", { name: "Çalıştır" })).toBeDisabled();
  });

  it("reports reset failures as engine setup errors without query coaching", async () => {
    window.location.hash = "#/lab/m1-t1";
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 800,
    });
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    await screen.findByText("PostgreSQL hazır");
    await user.click(screen.getByRole("tab", { name: "SQL görünümü" }));
    sqlEngineHarness.failReset = true;
    await user.click(screen.getByRole("button", { name: /Sıfırla/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Vaka verisi yeniden hazırlanamadı");
    expect(document.querySelector(".workspace-body")).toHaveAttribute(
      "data-mobile-view",
      "results",
    );
    expect(screen.getByRole("tab", { name: "Sonuç görünümü" })).toHaveFocus();
    expect(
      screen.queryByText(tasks[0].coaching["execution-error"].title),
    ).not.toBeInTheDocument();
  });

  it("starts every mutation attempt from a fresh fixture", async () => {
    window.location.hash = "#/lab/m8-t1";
    const unlockedProgress = progressWithCompletedModulesBefore("module-8");
    expect(
      buildModuleAccessStates(modules, tasks, unlockedProgress.tasks).find(
        (module) => module.moduleId === "module-8",
      ),
    ).toMatchObject({ isUnlocked: true });
    await saveProgress(unlockedProgress);
    expect(
      buildModuleAccessStates(
        modules,
        tasks,
        (await loadProgress()).tasks,
      ).find((module) => module.moduleId === "module-8"),
    ).toMatchObject({ isUnlocked: true });
    const user = userEvent.setup();
    const mutationTask = tasks.find((task) => task.id === "m8-t1");
    expect(mutationTask).toBeDefined();
    render(<QueryvaleApp />);

    expect(
      await screen.findByRole(
        "heading",
        { name: mutationTask!.title },
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument();
    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    const runButton = screen.getByRole("button", { name: "Çalıştır" });
    await screen.findByText("PostgreSQL hazır");

    await user.type(
      editor,
      "UPDATE inventory SET stock_quantity = stock_quantity - 1 WHERE product_id = 801 RETURNING product_id, stock_quantity;",
    );
    await user.click(runButton);
    expect(
      await screen.findByText(
        mutationTask!.coaching["rows-wrong"].title,
        undefined,
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();
    expect(sqlEngineHarness.mutationResetCount).toBe(1);

    await user.clear(editor);
    await user.type(
      editor,
      "UPDATE inventory SET stock_quantity = stock_quantity - 3 WHERE product_id = 801 RETURNING product_id, stock_quantity;",
    );
    await user.click(runButton);

    expect(
      await screen.findByRole("region", {
        name: mutationTask!.completionMessage,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("table", { name: "Sorgu sonucu" })).getByText(
        "9",
      ),
    ).toBeVisible();
    expect(sqlEngineHarness.mutationResetCount).toBe(2);
  }, 20_000);

  it("opens a later SQL deep link without forcing the learner backward", async () => {
    const laterTask = modules[1].tasks[0];
    window.location.hash = `#/lab/${laterTask.id}`;

    render(<QueryvaleApp />);

    await screen.findByRole("textbox", { name: "SQL sorgu editörü" });
    await waitFor(() =>
      expect(window.location.hash).toBe(`#/lab/${laterTask.id}`),
    );
    expect(
      screen.getByRole("heading", { name: laterTask.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: routeButtonName(laterTask),
      }),
    ).toBeEnabled();
    expect(screen.queryByText(/henüz kilitli/i)).not.toBeInTheDocument();
    await waitFor(async () => {
      const stored = await loadProgress();
      expect(stored.lastOpenedTaskId).toBe(laterTask.id);
    });
  });

  it("labels the final studio with its own twelve-project counter", async () => {
    const projectTask = modules.at(-1)!.tasks[0];
    const unlockedProgress = tasks
      .filter((task) => task.moduleId !== projectTask.moduleId)
      .reduce(
        (current, task) =>
          recordAttempt(current, task.id, task.solutionSql, true, 1),
        createDefaultProgress(),
      );
    expect(
      buildModuleAccessStates(modules, tasks, unlockedProgress.tasks).at(-1),
    ).toMatchObject({ isUnlocked: true });
    progressPersistenceHarness.loadOverride = unlockedProgress;
    window.history.replaceState(null, "", `#/lab/${projectTask.id}`);

    render(<QueryvaleApp />);

    await waitFor(() =>
      expect(window.location.hash).toBe(`#/lab/${projectTask.id}`),
    );
    expect(
      await screen.findByRole("heading", { name: projectTask.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: routeButtonName(projectTask),
      }),
    ).toBeInTheDocument();
  });

  it("keeps the header laboratory entry on the last opened valid task", async () => {
    const laterTask = modules[1].tasks[0];
    const savedLocation = {
      ...recordAttempt(
        createDefaultProgress(),
        laterTask.id,
        "SELECT 1",
        false,
        1,
      ),
      lastOpenedTaskId: laterTask.id,
      lastOpenedTaskIdTrusted: true,
    };
    await saveProgress(savedLocation);
    window.location.hash = "#/learn";
    const user = userEvent.setup();

    render(<QueryvaleApp />);

    await screen.findByRole("heading", { level: 1, name: "Rota" });
    await user.click(
      within(
        screen.getByRole("navigation", { name: "Ana bölümler" }),
      ).getByRole("button", { name: "SQL Studio — SQL Laboratuvarı" }),
    );

    await screen.findByRole("textbox", { name: "SQL sorgu editörü" });
    expect(
      screen.getByRole("heading", { name: laterTask.title }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe(`#/lab/${laterTask.id}`);
  });

  it("opens the first accessible Python case from the header", async () => {
    window.location.hash = "#/learn";
    const user = userEvent.setup();

    render(<QueryvaleApp />);

    await screen.findByRole("heading", { level: 1, name: "Rota" });
    await user.click(
      within(
        screen.getByRole("navigation", { name: "Ana bölümler" }),
      ).getByRole("button", { name: "Python Studio" }),
    );

    const firstPythonTask = pythonTasks[0];
    expect(firstPythonTask).toBeDefined();
    expect(
      await screen.findByRole("heading", { name: firstPythonTask.title }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("textbox", {
        name: `Python kod editörü — ${firstPythonTask.title}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Python vaka paneli")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Python editörü ve çıktı"),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe(`#/python/${firstPythonTask.id}`);
  });

  it("reuses the Python runtime between cases and disposes it on Studio exit", async () => {
    const firstPythonTask = pythonTasks[0];
    const secondPythonTask = pythonTasks[1];
    expect(firstPythonTask).toBeDefined();
    expect(secondPythonTask).toBeDefined();
    await saveProgress(
      recordPythonAttempt(
        createDefaultProgress(),
        firstPythonTask.id,
        firstPythonTask.solutionCode,
        true,
        5,
      ),
    );
    window.location.hash = `#/python/${firstPythonTask.id}`;
    const disposeSpy = vi.spyOn(PythonRuntimeClient.prototype, "dispose");
    const user = userEvent.setup();

    render(<QueryvaleApp />);

    await screen.findByRole("heading", { name: firstPythonTask.title });
    await user.click(screen.getByRole("button", { name: "Sonraki çalışma" }));
    await screen.findByRole("heading", { name: secondPythonTask.title });
    expect(disposeSpy).not.toHaveBeenCalled();

    await user.click(
      within(
        screen.getByRole("navigation", { name: "Ana bölümler" }),
      ).getByRole("button", { name: "SQL Studio — SQL Laboratuvarı" }),
    );
    await screen.findByRole("textbox", { name: "SQL sorgu editörü" });
    await waitFor(() => expect(disposeSpy).toHaveBeenCalledTimes(1));
    disposeSpy.mockRestore();
  });

  it("opens a saved later completion without deleting its record", async () => {
    const laterTask = modules[1].tasks[0];
    const legacyForwardProgress = {
      ...recordAttempt(
        createDefaultProgress(),
        laterTask.id,
        laterTask.solutionSql,
        true,
        1,
      ),
      lastOpenedTaskId: tasks[0].id,
      lastOpenedTaskIdTrusted: true,
    };
    await saveProgress(legacyForwardProgress);
    window.location.hash = "#/progress";
    const user = userEvent.setup();

    render(<QueryvaleApp />);

    const legacyCompletion = await screen.findByRole("button", {
      name: new RegExp(laterTask.title, "i"),
    });
    await user.click(legacyCompletion);

    expect(window.location.hash).toBe(`#/lab/${laterTask.id}`);
    expect(
      await screen.findByRole("heading", { name: laterTask.title }),
    ).toBeInTheDocument();
    await waitFor(async () => {
      const stored = await loadProgress();
      expect(stored.tasks[laterTask.id]).toMatchObject({ completed: true });
      expect(stored.lastOpenedTaskId).toBe(laterTask.id);
    });
  });

  it("starts blank, reveals a hint and advances after a correct query", async () => {
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    expect(
      screen.getByRole("heading", {
        name: /Geleceğin Veri Analistleri.*İçin İnteraktif SQL Studio/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Üç adımda çalışan SQL sorgusu" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "3. adım: Sorgu Çalıştırıldı, Sonuç Hazır",
      }),
    );
    expect(screen.getByText("damla_data")).toBeInTheDocument();
    expect(screen.getAllByText("Active")).toHaveLength(3);

    await user.click(
      screen.getByRole("button", { name: /Hesabını Aç & Vaka Çöz/i }),
    );
    expect(window.location.hash).toBe("#/giris");
    expect(
      screen.getByRole("heading", { name: "Analiz rotanı kaydet." }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Bu cihazda hesapsız devam et" }),
    );
    expect(
      screen.getByRole("heading", {
        name: "Bu vakada yalnız üç adımın var.",
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Başlangıç rehberini kapat" }),
    );
    await waitFor(() =>
      expect(document.getElementById("m1-t1-brief-panel")).toHaveFocus(),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Katalog görünümünü hazırla",
      }),
    ).toBeInTheDocument();
    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    const runButton = screen.getByRole("button", { name: "Çalıştır" });
    expect(editor).toHaveValue("");
    expect(runButton).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Yardım adımlarını aç" }),
    );
    await user.click(screen.getByRole("button", { name: "1. ipucunu aç" }));
    expect(
      screen.getByText(/Her ürün sonuçta bir satır olarak kalmalı/i),
    ).toBeInTheDocument();
    await user.type(editor, "SELECT product_name, category FROM products;");

    await waitFor(() =>
      expect(screen.getByText("PostgreSQL hazır")).toBeInTheDocument(),
    );
    expect(runButton).toBeEnabled();
    await user.click(runButton);
    expect(
      await screen.findByRole("status", { name: /Doğru —/i }),
    ).toBeInTheDocument();
    expect(document.querySelector(".workspace-body")).toHaveAttribute(
      "data-mobile-view",
      "results",
    );
    const resultTable = screen.getByRole("table", { name: "Sorgu sonucu" });
    expect(within(resultTable).getByText("Desk Lamp")).toBeVisible();
    expect(within(resultTable).getByText("Home")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.location.hash).toBe("#/lab/m1-t1");

    const completion = await screen.findByRole("region", {
      name: /Katalog görünümü hazır/i,
    });
    expect(within(completion).getByText("+7 analiz puanı")).toBeVisible();
    expect(
      within(completion).getByText(tasks[0].explanation),
    ).not.toBeVisible();
    await user.click(within(completion).getByText("Çözümü incele"));
    expect(within(completion).getByText(tasks[0].explanation)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Sonraki çalışma" }));
    expect(
      await screen.findByRole("heading", {
        name: "Kategori listesini tekilleştir",
      }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe("#/lab/m1-t2");
    expect(
      screen.getByRole("textbox", { name: "SQL sorgu editörü" }),
    ).toHaveValue("");
  });

  it("keeps the first-case guide scoped to the entry case", async () => {
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    await user.click(
      await screen.findByRole("button", {
        name: "Hemen Başla — Hesap oluştur ve ilk vakaya başla",
      }),
    );
    expect(window.location.hash).toBe("#/giris");
    await user.type(screen.getByLabelText("Adın"), "Ada Analist");
    await user.click(
      screen.getByRole("button", {
        name: "Yerel hesabımı oluştur ve başla",
      }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Bu vakada yalnız üç adımın var.",
      }),
    ).toBeInTheDocument();
    await waitFor(async () =>
      expect((await loadProgress()).profile).toMatchObject({
        displayName: "Ada Analist",
        localAccountCreatedAt: expect.any(String),
      }),
    );
    const accountHeader = screen.getByRole("banner");
    expect(
      within(accountHeader).queryByRole("button", { name: /^Hemen Başla/ }),
    ).not.toBeInTheDocument();
    expect(
      within(accountHeader).getByRole("button", {
        name: "Profil — Ada Analist",
      }),
    ).toBeVisible();
    expect(
      within(accountHeader).getByRole("button", { name: "Ayarlar" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Sonraki çalışma" }));
    expect(
      await screen.findByRole("heading", {
        name: "Kategori listesini tekilleştir",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Bu vakada yalnız üç adımın var.",
      }),
    ).not.toBeInTheDocument();
  });

  it("locks global exits until a new local profile is durably stored", async () => {
    progressPersistenceHarness.saveDelays = [80];
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    await user.click(
      await screen.findByRole("button", {
        name: "Hemen Başla — Hesap oluştur ve ilk vakaya başla",
      }),
    );
    await user.type(screen.getByLabelText("Adın"), "Ada Analist");
    await user.click(
      screen.getByRole("button", {
        name: "Yerel hesabımı oluştur ve başla",
      }),
    );

    const header = screen.getByRole("banner");
    expect(header).toHaveAttribute("aria-busy", "true");
    expect(document.querySelector(".app-shell")).toHaveAttribute("inert");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Yerel profil hazırlanıyor ve güvenle kaydediliyor.",
    );
    for (const control of within(header).getAllByRole("button")) {
      expect(control).toBeDisabled();
    }

    expect(
      await screen.findByRole("heading", {
        name: "Bu vakada yalnız üç adımın var.",
      }),
    ).toBeInTheDocument();
    await waitFor(async () =>
      expect((await loadProgress()).profile.localAccountCreatedAt).toEqual(
        expect.any(String),
      ),
    );
  });

  it("signs out without losing work and reopens the same profile after reload", async () => {
    let stored = recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      "SELECT product_name, category FROM products;",
      true,
      18,
    );
    stored = recordAttempt(
      stored,
      "m1-t2",
      "SELECT DISTINCT category FROM products;",
      false,
      7,
    );
    stored = createLocalAccount(stored, "Ada Analist");
    stored = {
      ...stored,
      lastOpenedTaskId: "m1-t2",
      lastOpenedTaskIdTrusted: true,
    };
    await saveProgressWithLocalProfileSession(
      stored,
      createActiveLocalProfileSession(stored),
    );
    window.location.hash = "#/progress";
    const user = userEvent.setup();

    render(<QueryvaleApp />);

    await user.click(
      await screen.findByRole("button", { name: "Profilden çık" }),
    );
    const signOutDialog = screen.getByRole("alertdialog", {
      name: "Profilden çıkılsın mı?",
    });
    expect(signOutDialog).toHaveTextContent(/ilerlemen bu cihazda korunacak/i);
    await user.click(
      within(signOutDialog).getByRole("button", { name: "Profilden çık" }),
    );

    await screen.findByRole("button", {
      name: "Hemen Başla — Profiline Gir",
    });
    expect(window.location.hash).toBe("#/");
    expect(
      within(screen.getByRole("banner")).getByRole("button", {
        name: /^Hemen Başla/,
      }),
    ).toBeVisible();
    expect(await loadLocalProfileSession(await loadProgress())).toMatchObject({
      access: "signed-out",
    });

    cleanup();
    window.history.replaceState(null, "", "#/progress");
    render(<QueryvaleApp />);

    const signIn = await screen.findByRole("button", {
      name: "Ada Analist profiline gir",
    });
    expect(window.location.hash).toBe("#/giris");
    expect(
      within(screen.getByRole("banner")).queryByRole("button", {
        name: "Profil — Ada Analist",
      }),
    ).not.toBeInTheDocument();

    await user.click(signIn);
    expect(
      await screen.findByRole("heading", { name: tasks[1].title }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("banner")).getByRole("button", {
        name: "Profil — Ada Analist",
      }),
    ).toBeVisible();
    expect((await loadProgress()).tasks["m1-t1"].completed).toBe(true);
    expect(await loadLocalProfileSession(await loadProgress())).toMatchObject({
      access: "active",
    });
  });

  it("recognizes Python-only learning and resumes that studio after local sign-in", async () => {
    let stored = recordPythonDraft(
      createDefaultProgress(),
      pythonTasks[0].id,
      pythonTasks[0].solutionCode,
    );
    stored = createLocalAccount(stored, "Ada Analist");
    await saveProgressWithLocalProfileSession(
      stored,
      createSignedOutLocalProfileSession(stored),
    );
    progressPersistenceHarness.loadOverride = stored;
    window.location.hash = "#/giris";
    const user = userEvent.setup();

    render(<QueryvaleApp />);

    expect(
      await screen.findByText("İlk veri sağlık kontrolü"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Ada Analist profiline gir" }),
    );

    expect(window.location.hash).toBe(`#/python/${pythonTasks[0].id}`);
    expect(
      await screen.findByRole("heading", { name: pythonTasks[0].title }),
    ).toBeInTheDocument();
  });

  it("deletes the local profile separately from resetting learning history", async () => {
    const stored = createLocalAccount(
      recordAttempt(
        createDefaultProgress(),
        "m1-t1",
        "SELECT product_name, category FROM products;",
        true,
        18,
      ),
      "Ada Analist",
    );
    await saveProgressWithLocalProfileSession(
      stored,
      createActiveLocalProfileSession(stored),
    );
    window.location.hash = "#/settings";
    const user = userEvent.setup();

    render(<QueryvaleApp />);

    await user.click(
      await screen.findByRole("button", { name: "Profili sil" }),
    );
    const deleteDialog = screen.getByRole("alertdialog", {
      name: "Yerel profil ve tüm veriler silinsin mi?",
    });
    await user.click(
      within(deleteDialog).getByRole("button", {
        name: "Profili ve verileri sil",
      }),
    );

    await screen.findByRole("button", { name: /Hesabını Aç & Vaka Çöz/i });
    const restored = await loadProgress();
    expect(hasLocalAccount(restored)).toBe(false);
    expect(restored.tasks).toEqual({});
    expect(restored.evidenceByTaskId).toEqual({});
    expect(await loadLocalProfileSession(restored)).toEqual({
      access: "guest",
    });
  });

  it("resumes the stored case from the landing page without resetting progress", async () => {
    const firstQuery = "SELECT product_name, category FROM products;";
    const resumeQuery = "SELECT DISTINCT category FROM products;";
    let stored = recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      firstQuery,
      true,
      24,
    );
    stored = recordAttempt(stored, "m1-t2", resumeQuery, false, 12);
    stored = createLocalAccount(stored, "Ada Analist");
    stored = { ...stored, lastOpenedTaskId: "m1-t2" };
    await saveProgress(stored);
    const user = userEvent.setup();

    render(<QueryvaleApp />);

    const accountHeader = screen.getByRole("banner");
    await waitFor(() =>
      expect(accountHeader).toHaveAttribute("aria-busy", "false"),
    );
    expect(
      within(accountHeader).queryByRole("button", { name: /^Hemen Başla/ }),
    ).not.toBeInTheDocument();
    expect(
      within(accountHeader).getByRole("button", {
        name: "Profil — Ada Analist",
      }),
    ).toBeVisible();
    expect(
      within(accountHeader).getByRole("button", { name: "Ayarlar" }),
    ).toBeVisible();

    const resumeButtons = await screen.findAllByRole("button", {
      name: /Kaldığın Yerden Devam Et/i,
    });
    expect(resumeButtons).toHaveLength(1);
    expect(
      screen.getByTitle(`Son konumun: ${tasks[1].title}`),
    ).toBeInTheDocument();
    const resumeButton = resumeButtons[0];
    await user.click(resumeButton);
    expect(window.location.hash).toBe("#/lab/m1-t2");

    expect(
      await screen.findByRole("heading", { name: tasks[1].title }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "SQL sorgu editörü" }),
    ).toHaveValue(resumeQuery);
    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.lastOpenedTaskId).toBe("m1-t2");
      expect(restored.tasks["m1-t1"]).toMatchObject({
        completed: true,
        lastQuery: firstQuery,
      });
      expect(restored.tasks["m1-t2"]).toMatchObject({
        completed: false,
        lastQuery: resumeQuery,
      });
    });
  });

  it("keeps Hemen Başla for guest activity without a local account", async () => {
    const guestProgress = recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      "SELECT product_name, category FROM products;",
      false,
      9,
    );
    await saveProgress(guestProgress);

    render(<QueryvaleApp />);

    const header = screen.getByRole("banner");
    await waitFor(() => expect(header).toHaveAttribute("aria-busy", "false"));
    expect(
      within(header).getByRole("button", {
        name: "Hemen Başla — Yerel profil oluştur veya kaldığın vakaya devam et",
      }),
    ).toBeVisible();
    expect(
      within(header).queryByRole("group", { name: "Profil işlemleri" }),
    ).not.toBeInTheDocument();
  });

  it("recovers a legacy first-task pointer once and then marks the location trusted", async () => {
    const legacyTask = tasks.find((task) => task.id === "m1-t3");
    expect(legacyTask).toBeDefined();
    const laterQuery =
      "SELECT category, COUNT(*) FROM products GROUP BY category;";
    const legacyProgress = {
      ...recordAttempt(createDefaultProgress(), "m1-t3", laterQuery, false, 18),
      lastOpenedTaskId: "m1-t1",
      lastOpenedTaskIdTrusted: false,
    };
    await saveProgress(legacyProgress);
    const user = userEvent.setup();

    render(<QueryvaleApp />);

    const resumeButtons = await screen.findAllByRole("button", {
      name: /Yerel Profil Oluştur & Devam Et/i,
    });
    expect(resumeButtons).toHaveLength(1);
    expect(
      screen.getByTitle(`Son konumun: ${legacyTask!.title}`),
    ).toBeInTheDocument();
    const resumeButton = resumeButtons[0];
    await user.click(resumeButton);
    expect(window.location.hash).toBe("#/giris");
    await user.click(
      screen.getByRole("button", { name: "Bu cihazda hesapsız devam et" }),
    );
    expect(
      await screen.findByRole("heading", { name: legacyTask!.title }),
    ).toBeInTheDocument();
    await waitFor(async () => {
      expect(await loadProgress()).toMatchObject({
        lastOpenedTaskId: "m1-t3",
        lastOpenedTaskIdTrusted: true,
        tasks: {
          "m1-t3": { lastQuery: laterQuery, attempts: 1 },
        },
      });
    });
  });

  it("turns a verified run into a persistent evidence notebook decision", async () => {
    window.location.hash = "#/lab/m1-t1";
    const user = userEvent.setup();
    const view = render(<QueryvaleApp />);
    const sql = "SELECT product_name, category FROM products;";
    const finding =
      "Katalog çıktısında altı ürünün dört kategoriye dağıldığı görülüyor.";
    const recommendation =
      "Haftalık katalog kontrolünü ürün adı ve kategori alanlarıyla yürütün.";
    const caveat =
      "Bu kanıt yalnız mevcut ürün kataloğu anlık görüntüsünü kapsıyor.";

    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    await user.type(editor, sql);
    await screen.findByText("PostgreSQL hazır");
    await user.click(screen.getByRole("button", { name: "Çalıştır" }));

    const completion = await screen.findByRole("region", {
      name: /Katalog görünümü hazır/i,
    });
    expect(within(completion).getByText("Kanıt doğrulandı")).toBeVisible();
    expect(within(completion).getByText("+10 analiz puanı")).toBeVisible();
    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.evidenceByTaskId["m1-t1"]).toMatchObject({
        taskId: "m1-t1",
        verifiedRun: {
          taskId: "m1-t1",
          query: sql,
          columns: ["product_name", "category"],
          rowCount: 6,
          truncated: false,
        },
      });
      expect(
        restored.evidenceByTaskId["m1-t1"].verifiedRun.previewRows[0],
      ).toEqual(["Desk Lamp", "Home"]);
      expect(restored.evidenceByTaskId["m1-t1"].note).toBeUndefined();
      expect(restored.tasks["m1-t1"].scoreAwarded).toBe(10);
    });

    await user.click(within(completion).getByText("Karar notu ekle"));
    await user.type(
      within(completion).getByRole("textbox", { name: /^Bulgu/ }),
      finding,
    );
    await user.type(
      within(completion).getByRole("textbox", { name: /^Öneri/ }),
      recommendation,
    );
    await user.click(
      within(completion).getByText("Varsayım veya veri çekincesi ekle"),
    );
    await user.type(
      within(completion).getByRole("textbox", {
        name: "Varsayım veya veri çekincesi",
      }),
      caveat,
    );
    await user.click(
      within(completion).getByRole("button", { name: "Kanıta ekle" }),
    );

    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.evidenceByTaskId["m1-t1"].note).toMatchObject({
        finding,
        recommendation,
        caveat,
      });
    });
    expect(
      within(completion).getByRole("button", { name: "Kanıt Defteri’nde" }),
    ).toBeDisabled();

    navigateToRoute("progress");
    const scoreCard = screen.getByText("Analiz puanı").closest("article");
    expect(scoreCard).not.toBeNull();
    expect(scoreCard).toHaveTextContent(
      new RegExp(
        `10.*${(tasks.filter((task) => task.scored).length + pythonTasks.length) * 10} mümkün.*1.*yardımsız`,
      ),
    );
    const firstModuleRow = screen
      .getByRole("heading", { name: modules[0].title })
      .closest("article");
    expect(firstModuleRow).not.toBeNull();
    expect(firstModuleRow).toHaveTextContent("10/40 puan");
    expect(screen.getByText(/\+10 puan/)).toBeVisible();
    const notebook = await screen.findByRole("region", {
      name: "Kanıt Defteri",
    });
    expect(within(notebook).getByText(tasks[0].title)).toBeVisible();
    expect(within(notebook).getByText(finding)).toBeVisible();
    expect(within(notebook).getByText(recommendation)).toBeVisible();
    expect(within(notebook).getByText(caveat)).toBeVisible();

    view.unmount();
    window.location.hash = "#/progress";
    render(<QueryvaleApp />);

    const restoredNotebook = await screen.findByRole("region", {
      name: "Kanıt Defteri",
    });
    expect(within(restoredNotebook).getByText(tasks[0].title)).toBeVisible();
    expect(within(restoredNotebook).getByText(finding)).toBeVisible();
    expect(within(restoredNotebook).getByText(recommendation)).toBeVisible();
    expect(within(restoredNotebook).getByText(caveat)).toBeVisible();
  });

  it("does not create evidence when the SQL result is incorrect", async () => {
    window.location.hash = "#/lab/m1-t1";
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    await user.type(
      editor,
      "SELECT product_name, category FROM products WHERE 1 = 0;",
    );
    await screen.findByText("PostgreSQL hazır");
    await user.click(screen.getByRole("button", { name: "Çalıştır" }));

    expect(
      await screen.findByText(tasks[0].coaching["rows-wrong"].title),
    ).toBeVisible();
    expect(screen.queryByText("Kanıt doğrulandı")).not.toBeInTheDocument();
    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.tasks["m1-t1"]).toMatchObject({
        attempts: 1,
        completed: false,
      });
      expect(restored.evidenceByTaskId["m1-t1"]).toBeUndefined();
    });

    navigateToRoute("progress");
    const notebook = await screen.findByRole("region", {
      name: "Kanıt Defteri",
    });
    expect(
      within(notebook).getByText("İlk doğrulanmış kanıtın burada görünecek"),
    ).toBeVisible();
    expect(
      within(notebook).queryByText(tasks[0].title),
    ).not.toBeInTheDocument();
  });

  it("registers working Monaco shortcuts against the current query", async () => {
    window.location.hash = "#/lab/m1-t1";
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    await user.type(editor, "SELECT product_name, category FROM products;");
    await waitFor(() =>
      expect(screen.getByText("PostgreSQL hazır")).toBeInTheDocument(),
    );

    const saveShortcut =
      editorShortcutHarness.ctrlCmd | editorShortcutHarness.keyS;
    const commandShortcut =
      editorShortcutHarness.ctrlCmd | editorShortcutHarness.keyK;
    const runShortcut =
      editorShortcutHarness.ctrlCmd | editorShortcutHarness.enter;

    expect(editorShortcutHarness.actions.has(saveShortcut)).toBe(true);
    expect(editorShortcutHarness.actions.has(commandShortcut)).toBe(true);
    expect(editorShortcutHarness.actions.has(runShortcut)).toBe(true);

    act(() => editorShortcutHarness.actions.get(saveShortcut)?.());
    expect(
      await screen.findByText("Sorgu ve ilerleme bu cihaza kaydedildi."),
    ).toBeInTheDocument();

    act(() => editorShortcutHarness.actions.get(commandShortcut)?.());
    const routeDrawer = await screen.findByRole("region", {
      name: "SQL rotası",
    });
    expect(within(routeDrawer).getAllByRole("button")).toHaveLength(
      tasks.length,
    );
    await user.keyboard("{Escape}");

    act(() => editorShortcutHarness.actions.get(runShortcut)?.());
    expect(
      await screen.findByRole("status", { name: /Doğru —/i }),
    ).toBeInTheDocument();
  });

  it("automatically saves an unrun SQL draft without requiring Ctrl+S", async () => {
    window.location.hash = "#/lab/m1-t1";
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    const draft = "SELECT product_name FROM products;";

    expect(screen.getByText("Otomatik kayıt açık")).toBeInTheDocument();
    await user.type(editor, draft);

    await waitFor(
      async () => {
        const restored = await loadProgress();
        expect(restored.tasks["m1-t1"]).toMatchObject({
          attempts: 0,
          completed: false,
          lastQuery: draft,
        });
        expect(restored.activityDates).toContain(localDateKey(new Date()));
      },
      { timeout: 2_500 },
    );

    navigateToRoute("progress");
    const conceptSection = screen
      .getByRole("heading", { name: "Hangi SQL konularını çalıştın?" })
      .closest("section");
    expect(conceptSection).not.toBeNull();
    expect(
      within(conceptSection!).getByText("Üzerinde çalışılıyor"),
    ).toBeInTheDocument();
    expect(within(conceptSection!).getByText("SELECT")).toBeInTheDocument();
  });

  it("labels draft storage as session-only when IndexedDB is unavailable", async () => {
    window.location.hash = "#/lab/m1-t1";
    const indexedDbDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "indexedDB",
    );
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: undefined,
    });

    try {
      const user = userEvent.setup();
      render(<QueryvaleApp />);

      const sessionOnly = await screen.findByText("Yalnız bu oturum");
      expect(sessionOnly).toHaveAttribute(
        "title",
        "Kalıcı depolama kullanılamıyor; taslak yalnız bu oturumda tutuluyor",
      );
      expect(screen.queryByText("Otomatik kayıt açık")).not.toBeInTheDocument();

      fireEvent.change(
        screen.getByRole("textbox", { name: "SQL sorgu editörü" }),
        { target: { value: "SELECT product_name FROM products;" } },
      );
      await user.click(screen.getByRole("button", { name: "Kaydet" }));
      expect(
        await screen.findByText("Taslak yalnız bu oturum için tutuldu."),
      ).toBeInTheDocument();
      await act(
        () =>
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, 0);
          }),
      );
      expect(screen.getByText("Yalnız bu oturum")).toBeInTheDocument();
      expect(screen.queryByText("Otomatik kayıt açık")).not.toBeInTheDocument();
    } finally {
      if (indexedDbDescriptor) {
        Object.defineProperty(globalThis, "indexedDB", indexedDbDescriptor);
      }
    }
  });

  it("flushes a pending SQL draft when the learner leaves the workspace", async () => {
    window.location.hash = "#/lab/m1-t1";
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    const draft = "SELECT category FROM products;";
    fireEvent.change(editor, { target: { value: draft } });
    await user.click(
      screen.getByRole("button", { name: "Queryvale ana sayfa" }),
    );

    const resumeButtons = await screen.findAllByRole("button", {
      name: /Yerel Profil Oluştur & Devam Et/i,
    });
    const resumeButton = resumeButtons[0];
    await waitFor(async () => {
      expect((await loadProgress()).tasks["m1-t1"].lastQuery).toBe(draft);
    });
    await user.click(resumeButton);
    expect(window.location.hash).toBe("#/giris");
    await user.click(
      screen.getByRole("button", { name: "Bu cihazda hesapsız devam et" }),
    );

    expect(
      await screen.findByRole("textbox", { name: "SQL sorgu editörü" }),
    ).toHaveValue(draft);
  });

  it("keeps the newly opened case as the resume location while flushing the previous draft", async () => {
    window.location.hash = "#/lab/m1-t1";
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    const draft = "SELECT product_name FROM products;";
    fireEvent.change(editor, { target: { value: draft } });
    await user.click(screen.getByRole("button", { name: "Sonraki çalışma" }));

    expect(
      await screen.findByRole("heading", { name: tasks[1].title }),
    ).toBeInTheDocument();
    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.lastOpenedTaskId).toBe("m1-t2");
      expect(restored.tasks["m1-t1"].lastQuery).toBe(draft);
    });
  });

  it("persists a valid lab location reached through browser history", async () => {
    window.location.hash = "#/lab/m1-t1";
    render(<QueryvaleApp />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: tasks[0].title,
      }),
    ).toBeInTheDocument();
    act(() => {
      window.history.pushState(null, "", "#/lab/m1-t2");
      window.dispatchEvent(new Event("hashchange"));
    });

    expect(
      await screen.findByRole("heading", { name: tasks[1].title }),
    ).toBeInTheDocument();
    await waitFor(async () => {
      expect(await loadProgress()).toMatchObject({
        lastOpenedTaskId: "m1-t2",
        lastOpenedTaskIdTrusted: true,
      });
    });
  });

  it("keeps a completed query when the theme later changes in Settings", async () => {
    window.location.hash = "#/lab/m1-t1";
    sqlEngineHarness.runDelayMs = 60;
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    await user.type(editor, "SELECT product_name, category FROM products;");
    await screen.findByText("PostgreSQL hazır");
    await user.click(screen.getByRole("button", { name: "Çalıştır" }));
    expect(
      await screen.findByRole("status", { name: /Doğru —/i }),
    ).toBeInTheDocument();
    navigateToRoute("settings");
    await screen.findByRole("heading", { name: "Ayarlar" });
    await user.click(getThemeChoice("Açık"));

    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.settings.theme).toBe("light");
      expect(restored.tasks["m1-t1"].completed).toBe(true);
    });
  });

  it("keeps a hint and explicitly saved blank draft when a running query completes", async () => {
    window.location.hash = "#/lab/m1-t1";
    sqlEngineHarness.runDelayMs = 120;
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    await user.type(editor, "SELECT product_name, category FROM products;");
    await screen.findByText("PostgreSQL hazır");
    await user.click(screen.getByRole("button", { name: "Çalıştır" }));
    await user.click(
      screen.getByRole("button", { name: "Yardım adımlarını aç" }),
    );
    await user.click(screen.getByRole("button", { name: "1. ipucunu aç" }));
    await user.clear(editor);
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(
      await screen.findByRole("status", { name: /Doğru —/i }),
    ).toBeInTheDocument();
    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.tasks["m1-t1"]).toMatchObject({
        attempts: 1,
        completed: true,
        hintsUsed: [0],
        scoreAwarded: 10,
        lastQuery: "",
      });
    });
  });

  it("offers compact, keyboard-accessible mission tools", async () => {
    window.location.hash = "#/lab/m1-t1";
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 800,
    });
    const user = userEvent.setup();
    const writeClipboard = vi.spyOn(navigator.clipboard, "writeText");
    render(<QueryvaleApp />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Katalog görünümünü hazırla",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Vakaya başlama sırası" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "İstenen teslim" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Çıktını tanı" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Veriyi gör, sorgunu yaz" }),
    ).toBeInTheDocument();
    const initialHelpToggle = screen.getByRole("button", {
      name: "Yardım adımlarını aç",
    });
    expect(initialHelpToggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "1. ipucunu aç" }),
    ).not.toBeInTheDocument();

    const earlyMobileSteps = await screen.findByRole("tablist", {
      name: "Vaka çalışma adımları",
    });
    const taskTab = within(earlyMobileSteps).getByRole("tab", {
      name: "Vaka görünümü",
    });
    const schemaTab = within(earlyMobileSteps).getByRole("tab", {
      name: "Veri görünümü",
    });
    expect(taskTab).toHaveAttribute("aria-controls", "m1-t1-brief-panel");
    fireEvent.keyDown(taskTab, { key: "ArrowRight" });
    await waitFor(() => expect(schemaTab).toHaveFocus());
    expect(schemaTab).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(schemaTab, { key: "Home" });
    await waitFor(() => expect(taskTab).toHaveFocus());

    await user.click(
      screen.getByRole("button", {
        name: "product_name kolonunu kopyala",
      }),
    );
    expect(writeClipboard).toHaveBeenCalledWith("product_name");
    expect(
      await screen.findByText("product_name panoya kopyalandı."),
    ).toBeInTheDocument();

    const helpToggle = screen.getByRole("button", {
      name: "Yardım adımlarını aç",
    });
    await user.click(helpToggle);
    expect(helpToggle).toHaveAttribute("aria-expanded", "true");
    expect(helpToggle).toHaveFocus();
    const firstHintAction = screen.getByRole("button", {
      name: "1. ipucunu aç",
    });
    expect(screen.getAllByRole("button", { name: /ipucunu aç/i })).toHaveLength(
      1,
    );
    await user.click(firstHintAction);
    const secondHintAction = screen.getByRole("button", {
      name: "2. ipucunu aç",
    });
    expect(secondHintAction).toHaveFocus();
    expect(screen.getByText("1/3 ipucu")).toBeInTheDocument();

    const briefSeparator = screen.getByRole("separator", {
      name: "Vaka panelini yeniden boyutlandır",
    });
    fireEvent.keyDown(briefSeparator, { key: "ArrowRight" });
    expect(briefSeparator).toHaveAttribute("aria-valuenow", "386");

    const editorSeparator = screen.getByRole("separator", {
      name: "Editör ve sonuçları yeniden boyutlandır",
    });
    fireEvent.keyDown(editorSeparator, { key: "ArrowDown" });
    expect(editorSeparator).toHaveAttribute("aria-valuenow", "59");

    const mobileSteps = screen.getByRole("tablist", {
      name: "Vaka çalışma adımları",
    });
    const caseView = within(mobileSteps).getByRole("tab", {
      name: "Vaka görünümü",
    });
    const dataView = within(mobileSteps).getByRole("tab", {
      name: "Veri görünümü",
    });
    const sqlView = within(mobileSteps).getByRole("tab", {
      name: "SQL görünümü",
    });
    const resultsView = within(mobileSteps).getByRole("tab", {
      name: "Sonuç görünümü",
    });
    const controlledPanels = [caseView, dataView, sqlView, resultsView].map(
      (tab) => tab.getAttribute("aria-controls"),
    );
    expect(new Set(controlledPanels).size).toBe(4);
    for (const panelId of controlledPanels) {
      expect(document.getElementById(panelId!)).toHaveAttribute(
        "role",
        "tabpanel",
      );
    }
    await user.click(sqlView);
    expect(document.querySelector(".workspace-body")).toHaveAttribute(
      "data-mobile-view",
      "editor",
    );
    fireEvent.keyDown(sqlView, { key: "ArrowRight" });
    await waitFor(() => expect(resultsView).toHaveFocus());
    expect(resultsView).toHaveAttribute("aria-selected", "true");
  });

  it("confirms a full solution, preserves the editor and locks completion at zero points", async () => {
    window.location.hash = "#/lab/m1-t1";
    const user = userEvent.setup();
    const writeClipboard = vi.spyOn(navigator.clipboard, "writeText");
    render(<QueryvaleApp />);

    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    expect(editor).toHaveValue("");
    expect(
      screen.queryByRole("region", { name: "Çalışan çözüm örneği" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Yardım adımlarını aç" }),
    );
    await user.click(screen.getByRole("button", { name: "1. ipucunu aç" }));
    await user.click(screen.getByRole("button", { name: "2. ipucunu aç" }));
    await user.click(screen.getByRole("button", { name: "3. ipucunu aç" }));

    const showSolution = screen.getByRole("button", {
      name: /Bir doğru sorguyu göster/i,
    });
    expect(showSolution).toHaveAttribute("aria-expanded", "false");
    expect(editor).toHaveValue("");

    await user.click(showSolution);
    const solutionConfirmation = screen.getByRole("group", {
      name: "Tam çözümü açmak istiyor musun?",
    });
    await waitFor(() =>
      expect(
        within(solutionConfirmation).getByRole("button", {
          name: "Kendim deneyeyim",
        }),
      ).toHaveFocus(),
    );
    expect(solutionConfirmation).toHaveTextContent(
      "Bu vaka 0 analiz puanı olur",
    );
    expect(showSolution).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(showSolution).toHaveFocus());
    expect(
      screen.queryByRole("group", {
        name: "Tam çözümü açmak istiyor musun?",
      }),
    ).not.toBeInTheDocument();
    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.tasks["m1-t1"]).toMatchObject({
        completed: false,
        solutionRevealed: false,
      });
      expect(restored.tasks["m1-t1"].scoreAwarded).toBeUndefined();
    });

    await user.click(showSolution);
    const confirmedSolution = screen.getByRole("group", {
      name: "Tam çözümü açmak istiyor musun?",
    });
    await user.click(
      within(confirmedSolution).getByRole("button", {
        name: "0 puanla çözümü göster",
      }),
    );
    await waitFor(() => expect(showSolution).toHaveFocus());
    expect(showSolution).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/Tam çözüm açıldı.*0 analiz puanı/i),
    ).toBeInTheDocument();
    const solutionRegion = screen.getByRole("region", {
      name: "Çalışan çözüm örneği",
    });
    const solutionCode = within(solutionRegion).getByLabelText(
      "Katalog görünümünü hazırla için örnek SQL sorgusu",
    );
    expect(solutionCode.textContent?.replace(/\s+/g, " ").trim()).toBe(
      tasks[0].solutionSql.replace(/\s+/g, " ").trim(),
    );
    expect(editor).toHaveValue("");

    await user.click(showSolution);
    expect(showSolution).toHaveFocus();
    expect(showSolution).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("region", { name: "Çalışan çözüm örneği" }),
    ).not.toBeInTheDocument();

    await user.click(showSolution);
    await user.click(screen.getByRole("button", { name: "SQL’i kopyala" }));
    expect(writeClipboard).toHaveBeenCalledWith(tasks[0].solutionSql);
    expect(
      await screen.findByText("Çalışan örnek sorgu panoya kopyalandı."),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Editöre dön ve kendin yaz" }),
    );
    await waitFor(() => expect(editor).toHaveFocus());
    expect(editor).toHaveValue("");

    fireEvent.change(editor, { target: { value: tasks[0].solutionSql } });
    await user.click(screen.getByRole("button", { name: "Çalıştır" }));
    const assistedCompletion = await screen.findByRole("region", {
      name: /Katalog görünümü hazır/i,
    });
    expect(
      within(assistedCompletion).getByText("0 analiz puanı"),
    ).toBeVisible();

    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.tasks["m1-t1"]).toMatchObject({
        attempts: 1,
        completed: true,
        hintsUsed: [0, 1, 2],
        solutionRevealed: true,
        scoreAwarded: 0,
      });
    });
  });

  it("allows browsing the next task without completing the current task", async () => {
    window.location.hash = "#/lab/m1-t1";
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Katalog görünümünü hazırla",
      }),
    ).toBeInTheDocument();
    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    await user.type(editor, "SELECT product_name FROM products;");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    const nextButton = screen.getByRole("button", { name: "Sonraki çalışma" });
    expect(nextButton).toBeEnabled();
    await user.click(nextButton);

    expect(
      await screen.findByRole("heading", {
        name: "Kategori listesini tekilleştir",
      }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe("#/lab/m1-t2");
    const previousButton = screen.getByRole("button", {
      name: "Önceki çalışma",
    });
    expect(previousButton).toBeEnabled();
    await user.click(previousButton);
    expect(
      await screen.findByRole("textbox", { name: "SQL sorgu editörü" }),
    ).toHaveValue("SELECT product_name FROM products;");

    await user.click(screen.getByRole("button", { name: /Sıfırla/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "SQL sorgu editörü" }),
      ).toHaveValue(""),
    );
    await user.click(screen.getByRole("button", { name: "Sonraki çalışma" }));
    await user.click(
      await screen.findByRole("button", { name: "Önceki çalışma" }),
    );
    expect(
      await screen.findByRole("textbox", { name: "SQL sorgu editörü" }),
    ).toHaveValue("");
  });

  it("rejects a stale SQL result after navigating to another case", async () => {
    sqlEngineHarness.runDelayMs = 60;
    window.location.hash = "#/lab/m1-t1";
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    fireEvent.change(editor, {
      target: { value: "SELECT product_name, category FROM products;" },
    });
    const runButton = screen.getByRole("button", { name: "Çalıştır" });
    await waitFor(() => expect(runButton).toBeEnabled());
    await user.click(runButton);
    await user.click(screen.getByRole("button", { name: "Sonraki çalışma" }));

    await screen.findByRole("heading", {
      name: "Kategori listesini tekilleştir",
    });
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 90));
    });

    expect(screen.queryByRole("table", { name: "Sorgu sonucu" })).toBeNull();
    expect(document.querySelector(".studio-result-strip")).toBeNull();
    const restored = await loadProgress();
    expect(restored.tasks["m1-t1"]?.lastQuery).toBe(
      "SELECT product_name, category FROM products;",
    );
    expect(restored.tasks["m1-t1"]?.attempts ?? 0).toBe(0);
    expect(restored.tasks["m1-t2"]?.attempts ?? 0).toBe(0);
  });

  it("opens all SQL studies in the persistent Studio route and preserves drafts", async () => {
    window.location.hash = "#/lab/m1-t1";
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    const draft = "SELECT product_name, category FROM products;";
    fireEvent.change(editor, { target: { value: draft } });
    const routeTrigger = screen.getByRole("button", {
      name: routeButtonName(tasks[0]!),
    });
    await user.click(routeTrigger);
    const routeMenu = screen.getByRole("region", { name: "SQL rotası" });
    const menu = within(routeMenu);
    expect(menu.getByText("Tüm çalışmalar açık")).toBeVisible();
    expect(routeMenu.querySelectorAll(".studio-route-group")).toHaveLength(
      modules.length,
    );
    expect(menu.getAllByRole("button")).toHaveLength(tasks.length);

    const activeTask = menu.getByRole("button", {
      name: new RegExp(tasks[0].title, "i"),
    });
    expect(activeTask).toHaveAttribute("aria-current", "page");

    expect(
      menu.getByRole("button", {
        name: new RegExp(modules[1].tasks[0].title, "i"),
      }),
    ).toBeEnabled();

    await user.click(
      menu.getByRole("button", {
        name: new RegExp(modules[0].tasks[1].title, "i"),
      }),
    );
    expect(
      await screen.findByRole("heading", { name: modules[0].tasks[1].title }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe(`#/lab/${modules[0].tasks[1].id}`);
    await waitFor(async () => {
      expect(await loadProgress()).toMatchObject({
        lastOpenedTaskId: modules[0].tasks[1].id,
        lastOpenedTaskIdTrusted: true,
        tasks: {
          [modules[0].tasks[0].id]: { lastQuery: draft },
        },
      });
      expect(document.getElementById("main-content")).toHaveFocus();
    });

    const nextRouteTrigger = screen.getByRole("button", {
      name: routeButtonName(modules[0]!.tasks[1]!),
    });
    await user.click(nextRouteTrigger);
    await user.click(
      within(screen.getByRole("region", { name: "SQL rotası" })).getByRole(
        "button",
        {
          name: new RegExp(modules[0].tasks[0].title, "i"),
        },
      ),
    );
    expect(
      await screen.findByRole("textbox", { name: "SQL sorgu editörü" }),
    ).toHaveValue(draft);
  });

  it.each([
    ["drill_intro", "Alıştırma", "ALIŞTIRMA · 3 DK"],
    ["drill_practice", "Tekrar", "TEKRAR · 3 DK"],
    ["drill_mix", "Birleştir", "BİRLEŞTİR · 5 DK"],
  ] as const)(
    "renders %s as a concise, free bridge and follows the canonical route",
    async (type, label, badge) => {
      const drill = tasks.find((task) => task.type === type);
      expect(drill, `${type} drill must exist`).toBeDefined();
      const drillIndex = tasks.findIndex((task) => task.id === drill?.id);
      const nextTask = tasks[drillIndex + 1];
      expect(nextTask, `${type} must have a next route item`).toBeDefined();

      window.location.hash = `#/lab/${drill!.id}`;
      const user = userEvent.setup();
      render(<QueryvaleApp />);

      expect(
        await screen.findByRole("heading", { name: drill!.title }),
      ).toBeInTheDocument();
      const brief = screen.getByRole("article", { name: drill!.title });
      expect(brief).toHaveAttribute("data-drill-type", type);
      expect(within(brief).getByText(badge)).toBeVisible();
      for (const heading of ["Durum", "Görev", "Beklenen kolonlar", "Kavram"]) {
        expect(
          within(brief).getByRole("heading", {
            name: new RegExp(`^${heading}$`),
          }),
        ).toBeVisible();
      }
      expect(screen.queryByText("Kendini kontrol et")).not.toBeInTheDocument();
      expect(screen.queryByText("Takıldın mı?")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Ücretsiz ipucunu aç" }),
      ).toBeVisible();

      await user.click(
        screen.getByRole("button", { name: "Ücretsiz ipucunu aç" }),
      );
      expect(screen.getByText(drill!.hints[0]!)).toBeVisible();
      const correctResultTable = within(brief).getByRole("table", {
        name: `${drill!.title} için doğru sonuç`,
      });
      expect(correctResultTable).toBeVisible();
      expect(
        within(correctResultTable)
          .getAllByRole("columnheader")
          .map((header) => header.textContent),
      ).toEqual(drill!.expectedColumns);
      expect(
        within(correctResultTable)
          .getAllByRole("row")
          .slice(1)
          .map((row) =>
            within(row)
              .getAllByRole("cell")
              .map((cell) => cell.textContent),
          ),
      ).toEqual(
        drill!.expectedResult.map((row) =>
          row.map((value) => (value === null ? "NULL" : String(value))),
        ),
      );
      expect(
        within(brief).getByText(
          drill!.orderSensitive
            ? /Satırları bu sırayla karşılaştır\./
            : /Satır sırası önemli değil\./,
        ),
      ).toBeVisible();
      expect(
        within(brief).queryByText(drill!.solutionSql),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /2\. ipucunu aç/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: `Rota · ${label} ${drillIndex + 1}/${tasks.length}`,
        }),
      ).toBeVisible();

      await user.click(screen.getByRole("button", { name: "Sonraki çalışma" }));
      expect(
        await screen.findByRole("heading", { name: nextTask!.title }),
      ).toBeInTheDocument();
      expect(window.location.hash).toBe(`#/lab/${nextTask!.id}`);
    },
  );

  it("does not award a score or create evidence after a correct drill run", async () => {
    const drill = tasks.find((task) => task.type === "drill_intro");
    expect(drill).toBeDefined();
    window.location.hash = `#/lab/${drill!.id}`;
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    fireEvent.change(editor, { target: { value: drill!.solutionSql } });
    await screen.findByText("PostgreSQL hazır");
    await user.click(screen.getByRole("button", { name: "Çalıştır" }));

    expect(
      await screen.findByRole("status", { name: /Alıştırma tamamlandı/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Kanıt doğrulandı")).not.toBeInTheDocument();
    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.tasks[drill!.id]).toMatchObject({
        taskId: drill!.id,
        completed: true,
        scored: false,
      });
      expect(restored.tasks[drill!.id]?.scoreAwarded).toBeUndefined();
      expect(restored.evidenceByTaskId[drill!.id]).toBeUndefined();
    });
  });

  it("uses route order for previous and next navigation across mixed drill types", async () => {
    const drillIndex = tasks.findIndex((task) => task.type === "drill_intro");
    const previousTask = tasks[drillIndex - 1];
    const drill = tasks[drillIndex];
    const nextTask = tasks[drillIndex + 1];
    expect(previousTask).toBeDefined();
    expect(drill).toBeDefined();
    expect(nextTask).toBeDefined();

    window.location.hash = `#/lab/${previousTask!.id}`;
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    await screen.findByRole("heading", { name: previousTask!.title });
    await user.click(screen.getByRole("button", { name: "Sonraki çalışma" }));
    expect(
      await screen.findByRole("heading", { name: drill!.title }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe(`#/lab/${drill!.id}`);

    await user.click(screen.getByRole("button", { name: "Sonraki çalışma" }));
    expect(
      await screen.findByRole("heading", { name: nextTask!.title }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Önceki çalışma" }));
    expect(
      await screen.findByRole("heading", { name: drill!.title }),
    ).toBeInTheDocument();
  });

  it("keeps later SQL modules open regardless of recommended-order progress", async () => {
    const unlockedProgress = progressWithCompletedModulesBefore(modules[1].id);
    progressPersistenceHarness.loadOverride = unlockedProgress;
    window.location.hash = `#/lab/${modules[1].tasks[0].id}`;
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    await screen.findByRole("heading", { name: modules[1].tasks[0].title });
    const routeTrigger = screen.getByRole("button", {
      name: routeButtonName(modules[1]!.tasks[0]!),
    });
    await user.click(routeTrigger);
    const menu = within(screen.getByRole("region", { name: "SQL rotası" }));

    expect(
      menu.getByRole("button", {
        name: new RegExp(modules[1].tasks[0].title, "i"),
      }),
    ).toBeEnabled();
    expect(
      menu.getByRole("button", {
        name: new RegExp(modules[2].tasks[0].title, "i"),
      }),
    ).toBeEnabled();
    expect(menu.getAllByRole("button")).toHaveLength(tasks.length);
  });

  it("keeps unmet prerequisites clickable as learning-path guidance", async () => {
    window.location.hash = "#/learn";
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    expect(
      await screen.findByRole("heading", { name: "Rota" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Önerilen başlangıç")).toBeInTheDocument();
    expect(screen.getByText("Buradasın")).toBeInTheDocument();
    expect(screen.getByText("Şu an buradasın")).toBeInTheDocument();
    const advisedTask = screen
      .getByText("Kategori listesini tekilleştir", { selector: "strong" })
      .closest("button");
    expect(advisedTask).not.toBeNull();
    expect(advisedTask).toBeEnabled();
    await user.click(advisedTask!);

    expect(
      await screen.findByRole("heading", {
        name: "Kategori listesini tekilleştir",
      }),
    ).toBeInTheDocument();
  });

  it("moves focus to the routed screen and avoids smooth scroll when motion is reduced", async () => {
    const initial = createDefaultProgress();
    await saveProgress({
      ...initial,
      settings: { ...initial.settings, reducedMotion: true },
    });
    window.location.hash = "#/settings";
    const user = userEvent.setup();
    const scrollTo = vi.mocked(window.scrollTo);
    scrollTo.mockClear();
    render(<QueryvaleApp />);

    await waitFor(() =>
      expect(document.querySelector(".app-shell")).toHaveAttribute(
        "aria-busy",
        "false",
      ),
    );

    await user.click(
      within(
        await screen.findByRole("navigation", { name: "Ana bölümler" }),
      ).getByRole("button", { name: "SQL Studio — SQL Laboratuvarı" }),
    );

    await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
    expect(scrollTo).toHaveBeenLastCalledWith({
      top: 0,
      behavior: "auto",
    });
  });

  it("clears the exact legacy starter without discarding user progress", async () => {
    const legacyStarter =
      "-- İş sorusunu ve şemayı inceleyerek sorgunu düzenle\nSELECT\n  *\nFROM products\nLIMIT 10;";
    const stored = recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      legacyStarter,
      false,
      0,
    );
    await saveProgress(stored);
    window.location.hash = "#/lab/m1-t1";

    render(<QueryvaleApp />);

    expect(
      await screen.findByRole("textbox", { name: "SQL sorgu editörü" }),
    ).toHaveValue("");
    navigateToRoute("progress");
    expect(await screen.findByText("1 toplam deneme")).toBeInTheDocument();
    const moduleProgressSection = screen
      .getByRole("heading", { name: "SQL konularında neredesin?" })
      .closest("section");
    expect(moduleProgressSection).not.toBeNull();
    expect(
      within(moduleProgressSection!).getByText("Alt sorgular ve CTE"),
    ).toBeInTheDocument();
    expect(
      within(moduleProgressSection!).getByText(modules[9].title),
    ).toBeInTheDocument();
  });

  it("renames and restores the device profile without changing learning data", async () => {
    const initial = recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      "SELECT product_name FROM products;",
      false,
      0,
    );
    await saveProgress(initial);
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    await waitFor(() =>
      expect(document.querySelector(".app-shell")).toHaveAttribute(
        "aria-busy",
        "false",
      ),
    );
    navigateToRoute("progress");
    await user.click(
      await screen.findByRole("button", {
        name: "SQL Kaşifi kullanıcı adını düzenle",
      }),
    );
    const nameInput = screen.getByRole("textbox", { name: "Kullanıcı adı" });
    await user.clear(nameInput);
    await user.type(nameInput, "  Yasir   Usta  ");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(
      await screen.findByRole("heading", { name: "Yasir Usta" }),
    ).toBeInTheDocument();
    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.profile.id).toBe(initial.profile.id);
      expect(restored.profile.displayName).toBe("Yasir Usta");
      expect(restored.tasks["m1-t1"].lastQuery).toContain("SELECT");
    });
  });

  it("does not expose Settings or replace the profile before hydration completes", async () => {
    const stored = updateProfileName(createDefaultProgress(), "Ayşe");
    await saveProgress(stored);
    let releaseLoad!: () => void;
    progressPersistenceHarness.loadGate = new Promise<void>((resolve) => {
      releaseLoad = resolve;
    });

    window.location.hash = "#/settings";
    render(<QueryvaleApp />);
    const shell = document.querySelector(".app-shell");
    expect(shell).toHaveAttribute("aria-busy", "true");
    expect(
      screen.queryByRole("group", { name: "Tema" }),
    ).not.toBeInTheDocument();

    await act(async () => releaseLoad());
    await waitFor(() => expect(shell).toHaveAttribute("aria-busy", "false"));
    expect(
      await screen.findByRole("group", { name: "Tema" }),
    ).toBeInTheDocument();
    progressPersistenceHarness.loadGate = undefined;
    const restored = await loadProgress();
    expect(restored.profile).toEqual(stored.profile);
    expect(restored.settings.theme).toBe("dark");
  });

  it("keeps focus on an invalid profile name and explains the constraint", async () => {
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    await waitFor(() =>
      expect(document.querySelector(".app-shell")).toHaveAttribute(
        "aria-busy",
        "false",
      ),
    );
    navigateToRoute("progress");
    await user.click(
      await screen.findByRole("button", {
        name: "SQL Kaşifi kullanıcı adını düzenle",
      }),
    );
    const nameInput = screen.getByRole("textbox", { name: "Kullanıcı adı" });
    await user.clear(nameInput);
    await user.type(nameInput, "A");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(nameInput).toHaveFocus();
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(nameInput).toHaveAttribute("maxLength", "32");
    expect(screen.getByRole("alert")).toHaveTextContent("2–32 karakter");

    fireEvent.keyDown(nameInput, { key: "Escape" });
    const editButton = screen.getByRole("button", {
      name: "SQL Kaşifi kullanıcı adını düzenle",
    });
    await waitFor(() => expect(editButton).toHaveFocus());
  });

  it("asks before replacing progress with another local profile", async () => {
    const current = createDefaultProgress();
    await saveProgress(current);
    const imported = recordAttempt(
      updateProfileName(createDefaultProgress(), "Ayşe"),
      "m1-t1",
      "SELECT product_name, category FROM products;",
      true,
      30,
    );
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    window.location.hash = "#/settings";
    render(<QueryvaleApp />);
    await screen.findByRole("heading", { name: "Ayarlar" });
    const input = screen.getByLabelText("İlerleme dosyası seç");
    const file = new File([exportProgress(imported)], "ayse.json", {
      type: "application/json",
    });
    await user.upload(input, file);

    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining("Bu dosya “Ayşe” profiline ait"),
    );
    expect((await loadProgress()).profile.id).toBe(current.profile.id);

    confirm.mockReturnValue(true);
    await user.upload(input, file);
    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.profile.id).toBe(imported.profile.id);
      expect(restored.tasks["m1-t1"].completed).toBe(true);
    });
    confirm.mockRestore();
  });

  it("also confirms before an older backup replaces the same profile", async () => {
    const current = recordAttempt(
      createDefaultProgress(),
      "m1-t1",
      "SELECT product_name, category FROM products;",
      true,
      30,
    );
    await saveProgress(current);
    const backup = {
      ...createDefaultProgress(),
      profile: current.profile,
      startedAt: current.startedAt,
      settings: current.settings,
    };
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    window.location.hash = "#/settings";
    render(<QueryvaleApp />);
    await screen.findByRole("heading", { name: "Ayarlar" });
    await user.upload(
      screen.getByLabelText("İlerleme dosyası seç"),
      new File([exportProgress(backup)], "eski-yedek.json", {
        type: "application/json",
      }),
    );

    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining(
        "Bu dosya mevcut “SQL Kaşifi” profilinin bir yedeği",
      ),
    );
    expect((await loadProgress()).tasks["m1-t1"].completed).toBe(true);
    confirm.mockRestore();
  });

  it("rejects an oversized progress file before reading it", async () => {
    await saveProgress(createDefaultProgress());
    const user = userEvent.setup();
    window.location.hash = "#/settings";
    render(<QueryvaleApp />);
    await screen.findByRole("heading", { name: "Ayarlar" });
    await user.upload(
      screen.getByLabelText("İlerleme dosyası seç"),
      new File([new Uint8Array(2_000_001)], "buyuk-yedek.json", {
        type: "application/json",
      }),
    );

    expect(
      await screen.findByText(
        "İlerleme dosyası güvenli boyut sınırını aşıyor.",
      ),
    ).toBeInTheDocument();
  });

  it("serializes ordinary saves before a profile import", async () => {
    const current = createDefaultProgress();
    await saveProgress(current);
    const imported = recordAttempt(
      updateProfileName(createDefaultProgress(), "Ayşe"),
      "m1-t1",
      "SELECT product_name, category FROM products;",
      true,
      30,
    );
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    window.location.hash = "#/settings";
    render(<QueryvaleApp />);
    await waitFor(() =>
      expect(document.querySelector(".app-shell")).toHaveAttribute(
        "aria-busy",
        "false",
      ),
    );

    progressPersistenceHarness.saveDelays = [60, 0];
    await user.click(getThemeChoice("Açık"));
    await user.upload(
      screen.getByLabelText("İlerleme dosyası seç"),
      new File([exportProgress(imported)], "ayse.json", {
        type: "application/json",
      }),
    );

    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.profile.id).toBe(imported.profile.id);
      expect(restored.tasks["m1-t1"].completed).toBe(true);
    });
    confirm.mockRestore();
  });

  it("requires two SQL reset confirmations and preserves progress when the final step is cancelled", async () => {
    const stored = progressWithSqlAndPythonHistory();
    await saveProgress(stored);
    const user = userEvent.setup();
    window.location.hash = "#/progress";
    render(<QueryvaleApp />);

    const trigger = await screen.findByRole("button", {
      name: "SQL ilerlemesini sıfırla",
    });
    await user.click(trigger);

    const firstDialog = await screen.findByRole("alertdialog", {
      name: "SQL ilerlemesini sıfırlamaya hazır mısın?",
    });
    let persisted = await loadProgress();
    expect(persisted.tasks["m1-t1"]?.completed).toBe(true);
    expect(persisted.pythonTasks["py-m1-t1"]?.completed).toBe(true);

    await user.click(
      within(firstDialog).getByRole("button", { name: "Devam et" }),
    );
    const finalDialog = await screen.findByRole("alertdialog", {
      name: "Son onay: SQL ilerlemesini sıfırla",
    });
    persisted = await loadProgress();
    expect(persisted.tasks["m1-t1"]?.completed).toBe(true);
    expect(persisted.pythonTasks["py-m1-t1"]?.completed).toBe(true);

    await user.click(
      within(finalDialog).getByRole("button", { name: "Vazgeç" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog", {
          name: "Son onay: SQL ilerlemesini sıfırla",
        }),
      ).not.toBeInTheDocument(),
    );

    persisted = await loadProgress();
    expect(persisted.tasks["m1-t1"]?.completed).toBe(true);
    expect(persisted.pythonTasks["py-m1-t1"]?.completed).toBe(true);
  });

  it("resets SQL only after its final confirmation", async () => {
    const stored = progressWithSqlAndPythonHistory();
    await saveProgress(stored);
    const user = userEvent.setup();
    window.location.hash = "#/progress";
    render(<QueryvaleApp />);

    const finalDialog = await openFinalRouteResetConfirmation(user, {
      triggerLabel: "SQL ilerlemesini sıfırla",
      firstTitle: "SQL ilerlemesini sıfırlamaya hazır mısın?",
      finalTitle: "Son onay: SQL ilerlemesini sıfırla",
    });
    await user.click(
      within(finalDialog).getByRole("button", {
        name: "Evet, SQL ilerlememi sıfırla",
      }),
    );

    await waitFor(async () => {
      const reset = await loadProgress();
      expect(reset.profile).toEqual(stored.profile);
      expect(reset.settings).toEqual(stored.settings);
      expect(reset.tasks).toEqual({});
      expect(reset.evidenceByTaskId).toEqual({});
      expect(reset.pythonTasks).toEqual(stored.pythonTasks);
      expect(reset.pythonEvidenceByTaskId).toEqual(
        stored.pythonEvidenceByTaskId,
      );
    });
  });

  it("resets Python only after its final confirmation", async () => {
    const stored = progressWithSqlAndPythonHistory();
    await saveProgress(stored);
    const user = userEvent.setup();
    window.location.hash = "#/progress";
    render(<QueryvaleApp />);

    const finalDialog = await openFinalRouteResetConfirmation(user, {
      triggerLabel: "Python ilerlemesini sıfırla",
      firstTitle: "Python ilerlemesini sıfırlamaya hazır mısın?",
      finalTitle: "Son onay: Python ilerlemesini sıfırla",
    });
    await user.click(
      within(finalDialog).getByRole("button", {
        name: "Evet, Python ilerlememi sıfırla",
      }),
    );

    await waitFor(async () => {
      const reset = await loadProgress();
      expect(reset.profile).toEqual(stored.profile);
      expect(reset.settings).toEqual(stored.settings);
      expect(reset.pythonTasks).toEqual({});
      expect(reset.pythonEvidenceByTaskId).toEqual({});
      expect(reset.tasks).toEqual(stored.tasks);
      expect(reset.evidenceByTaskId).toEqual(stored.evidenceByTaskId);
    });
  });

  it("resets learning history while preserving profile and preferences", async () => {
    const progressed = recordAttempt(
      updateProfileName(createDefaultProgress(), "Ayşe"),
      "m1-t1",
      "SELECT product_name, category FROM products;",
      true,
      30,
    );
    const stored = {
      ...progressed,
      settings: { ...progressed.settings, theme: "light" as const },
    };
    await saveProgress(stored);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    window.location.hash = "#/settings";
    render(<QueryvaleApp />);
    await screen.findByRole("heading", { name: "Ayarlar" });
    await user.click(screen.getByRole("button", { name: "Sıfırla" }));

    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.profile).toEqual(stored.profile);
      expect(restored.settings).toEqual(stored.settings);
      expect(restored.tasks).toEqual({});
    });
    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining("Profil adın ve çalışma tercihlerin korunacak"),
    );
    confirm.mockRestore();
  });

  it("ignores stale task ids when calculating dashboard completion", async () => {
    const state = createDefaultProgress();
    const withStaleTask = {
      ...state,
      tasks: {
        ghost: {
          taskId: "ghost",
          attempts: 1,
          completed: true,
          firstCompletedAt: new Date().toISOString(),
          lastCompletedAt: new Date().toISOString(),
          lastQuery: "SELECT 1",
          hintsUsed: [],
          solutionRevealed: false,
          scoreAwarded: 10,
          solveTimeSeconds: 1,
          firstTry: true,
        },
      },
    };
    await saveProgress(withStaleTask);
    window.location.hash = "#/progress";
    render(<QueryvaleApp />);

    const overallProgress = await screen.findByRole("progressbar", {
      name: "Tamamlanan çalışma oranı",
    });
    expect(overallProgress).toHaveAttribute("aria-valuenow", "0");
    expect(
      screen.getByText(`0 / ${tasks.length + pythonTasks.length} çalışma`),
    ).toBeInTheDocument();
  });

  it("changes the theme from the Settings route", async () => {
    window.location.hash = "#/settings";
    render(<QueryvaleApp />);
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe("dark"),
    );
    await waitFor(() =>
      expect(document.querySelector(".app-shell")).toHaveAttribute(
        "aria-busy",
        "false",
      ),
    );
    fireEvent.click(getThemeChoice("Açık"));
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe("light"),
    );
  });
});
