import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { modules, tasks } from "../content";
import {
  createDefaultProgress,
  exportProgress,
  loadProgress,
  recordAttempt,
  saveProgress,
  updateProfileName,
} from "../features/progress/progressStore";
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
  saveDelays: [] as number[],
}));

vi.mock("../features/progress/progressStore", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../features/progress/progressStore")>();
  return {
    ...actual,
    loadProgress: async () => {
      const gate = progressPersistenceHarness.loadGate;
      if (gate) await gate;
      return actual.loadProgress();
    },
    saveProgress: async (
      state: Parameters<typeof actual.saveProgress>[0],
      options?: Parameters<typeof actual.saveProgress>[1],
    ) => {
      const delay = progressPersistenceHarness.saveDelays.shift() ?? 0;
      if (delay) {
        await new Promise((resolve) => window.setTimeout(resolve, delay));
      }
      return actual.saveProgress(state, options);
    },
  };
});

vi.mock("../features/sql-engine", () => ({
  createTaskDatabaseForLesson: (task: { id: string }) => {
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
    editorShortcutHarness.actions.clear();
    sqlEngineHarness.failInitialize = false;
    sqlEngineHarness.failReset = false;
    sqlEngineHarness.mutationResetCount = 0;
    sqlEngineHarness.runDelayMs = 0;
    progressPersistenceHarness.loadGate = undefined;
    progressPersistenceHarness.saveDelays = [];
    window.location.hash = "#/";
    document.documentElement.dataset.theme = "";
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase("queryvale");
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
    await loadProgress();
  });

  it("keeps engine initialization failures separate from query coaching", async () => {
    sqlEngineHarness.failInitialize = true;
    window.location.hash = "#/lab/m1-t1";
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Bu sistem hatası sorgunla ilgili değil");
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
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    await screen.findByText("PostgreSQL hazır");
    sqlEngineHarness.failReset = true;
    await user.click(screen.getByRole("button", { name: /Sıfırla/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Görev verisi yeniden hazırlanamadı");
    expect(
      screen.queryByText(tasks[0].coaching["execution-error"].title),
    ).not.toBeInTheDocument();
  });

  it("starts every mutation attempt from a fresh fixture", async () => {
    window.location.hash = "#/lab/m8-t1";
    const user = userEvent.setup();
    const mutationTask = tasks.find((task) => task.id === "m8-t1");
    expect(mutationTask).toBeDefined();
    render(<QueryvaleApp />);

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
      await screen.findByText(mutationTask!.coaching["rows-wrong"].title),
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
  });

  it("starts blank, reveals a hint and advances after a correct query", async () => {
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    expect(
      screen.getByRole("heading", { name: /Soruyu sorguya/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tablist", { name: "Analiz döngüsü aşamaları" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /5\. adım: Anlat/i }));
    expect(
      screen.getByRole("heading", {
        name: "Doğrulanmış sonucu kısa bir iş notuna dönüştür.",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Rehberli ilk vakayı başlat/i }),
    );
    expect(
      screen.getByRole("heading", { name: "Masana hoş geldin." }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Laboratuvarı hazırla/i }),
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
      screen.getByText(/SELECT görmek istediğin kolonları/i),
    ).toBeInTheDocument();
    await user.type(editor, "SELECT product_name, category FROM products;");

    await waitFor(() =>
      expect(screen.getByText("PostgreSQL hazır")).toBeInTheDocument(),
    );
    expect(runButton).toBeEnabled();
    await user.click(runButton);
    expect(await screen.findByText("Doğru çözüm")).toBeInTheDocument();
    const resultTable = screen.getByRole("table", { name: "Sorgu sonucu" });
    expect(within(resultTable).getByText("Desk Lamp")).toBeVisible();
    expect(within(resultTable).getByText("Home")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.location.hash).toBe("#/lab/m1-t1");

    const completion = await screen.findByRole("region", {
      name: /Katalog görünümü hazır/i,
    });
    expect(
      within(completion).getByText(tasks[0].explanation),
    ).not.toBeVisible();
    await user.click(within(completion).getByText("Çözümü incele"));
    expect(within(completion).getByText(tasks[0].explanation)).toBeVisible();
    await user.click(
      within(completion).getByRole("button", {
        name: "Sonraki göreve geç: Kategori listesini tekilleştir",
      }),
    );
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
    });

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

    await user.click(
      within(
        screen.getByRole("navigation", { name: "Çalışma bölümleri" }),
      ).getByRole("button", { name: /^Profilim$/ }),
    );
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

    await user.click(
      within(
        screen.getByRole("navigation", { name: "Çalışma bölümleri" }),
      ).getByRole("button", { name: /^Profilim$/ }),
    );
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
    const commandDialog = await screen.findByRole("dialog", {
      name: "Komut paneli",
    });
    await user.click(
      within(commandDialog).getByRole("button", { name: "Kapat" }),
    );

    act(() => editorShortcutHarness.actions.get(runShortcut)?.());
    expect(await screen.findByText("Doğru çözüm")).toBeInTheDocument();
  });

  it("keeps a newer theme change when a running query saves its result", async () => {
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
    await user.click(screen.getByRole("button", { name: "Açık temaya geç" }));

    expect(await screen.findByText("Doğru çözüm")).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: /Kaydet/i }));

    expect(await screen.findByText("Doğru çözüm")).toBeInTheDocument();
    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.tasks["m1-t1"]).toMatchObject({
        attempts: 1,
        completed: true,
        hintsUsed: [0],
        lastQuery: "",
      });
    });
  });

  it("offers compact, keyboard-accessible mission tools", async () => {
    window.location.hash = "#/lab/m1-t1";
    const user = userEvent.setup();
    const writeClipboard = vi.spyOn(navigator.clipboard, "writeText");
    render(<QueryvaleApp />);

    expect(
      await screen.findByRole("heading", {
        name: "Katalog görünümünü hazırla",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Göreve başlama sırası" }),
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

    const taskTab = screen.getByRole("tab", { name: "Görev" });
    const schemaTab = screen.getByRole("tab", { name: "Şema & veri" });
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
      name: "Görev panelini yeniden boyutlandır",
    });
    fireEvent.keyDown(briefSeparator, { key: "ArrowRight" });
    expect(briefSeparator).toHaveAttribute("aria-valuenow", "386");

    const editorSeparator = screen.getByRole("separator", {
      name: "Editör ve sonuçları yeniden boyutlandır",
    });
    fireEvent.keyDown(editorSeparator, { key: "ArrowDown" });
    expect(editorSeparator).toHaveAttribute("aria-valuenow", "59");
  });

  it("reveals a working solution only on request without changing the editor or completion", async () => {
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
    expect(showSolution).toHaveFocus();
    expect(showSolution).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText("Tam çözüm açıldı; editördeki sorgun değiştirilmedi."),
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

    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.tasks["m1-t1"]).toMatchObject({
        attempts: 0,
        completed: false,
        hintsUsed: [0, 1, 2],
      });
    });
  });

  it("allows browsing the next task without completing the current task", async () => {
    window.location.hash = "#/lab/m1-t1";
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    expect(
      await screen.findByRole("heading", {
        name: "Katalog görünümünü hazırla",
      }),
    ).toBeInTheDocument();
    const editor = await screen.findByRole("textbox", {
      name: "SQL sorgu editörü",
    });
    await user.type(editor, "SELECT product_name FROM products;");
    await user.click(screen.getByRole("button", { name: /Kaydet/i }));

    const nextButton = screen.getByRole("button", { name: "Sonraki görev" });
    expect(nextButton).toBeEnabled();
    await user.click(nextButton);

    expect(
      await screen.findByRole("heading", {
        name: "Kategori listesini tekilleştir",
      }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe("#/lab/m1-t2");
    const previousButton = screen.getByRole("button", {
      name: "Önceki görev",
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
    await user.click(screen.getByRole("button", { name: "Sonraki görev" }));
    await user.click(
      await screen.findByRole("button", { name: "Önceki görev" }),
    );
    expect(
      await screen.findByRole("textbox", { name: "SQL sorgu editörü" }),
    ).toHaveValue("");
  });

  it("keeps unmet prerequisites clickable as learning-path guidance", async () => {
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    await user.click(
      within(
        await screen.findByRole("navigation", { name: "Çalışma bölümleri" }),
      ).getByRole("button", {
        name: /^Vaka Rotası$/,
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Öğrenme yolu" }),
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
        await screen.findByRole("navigation", { name: "Çalışma bölümleri" }),
      ).getByRole("button", { name: "Vaka Rotası" }),
    );

    await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
    expect(scrollTo).toHaveBeenLastCalledWith({
      top: 0,
      behavior: "auto",
    });
  });

  it("clears the exact legacy starter without discarding user progress", async () => {
    const user = userEvent.setup();
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
    await user.click(
      within(
        screen.getByRole("navigation", { name: "Çalışma bölümleri" }),
      ).getByRole("button", { name: /^Profilim$/ }),
    );
    expect(screen.getByText("1 toplam deneme")).toBeInTheDocument();
    const moduleProgressSection = screen
      .getByRole("heading", { name: "Modüller nerede kaldı?" })
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

    await user.click(
      within(
        await screen.findByRole("navigation", { name: "Çalışma bölümleri" }),
      ).getByRole("button", { name: "Profilim" }),
    );
    await user.click(
      screen.getByRole("button", {
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
    expect(
      within(
        screen.getByRole("navigation", { name: "Çalışma bölümleri" }),
      ).getByText("Yasir Usta · İlerleme ve Kanıt Defteri"),
    ).toBeInTheDocument();

    await waitFor(async () => {
      const restored = await loadProgress();
      expect(restored.profile.id).toBe(initial.profile.id);
      expect(restored.profile.displayName).toBe("Yasir Usta");
      expect(restored.tasks["m1-t1"].lastQuery).toContain("SELECT");
    });
  });

  it("does not persist the temporary profile before hydration completes", async () => {
    const stored = updateProfileName(createDefaultProgress(), "Ayşe");
    await saveProgress(stored);
    let releaseLoad!: () => void;
    progressPersistenceHarness.loadGate = new Promise<void>((resolve) => {
      releaseLoad = resolve;
    });

    render(<QueryvaleApp />);
    const shell = document.querySelector(".app-shell");
    expect(shell).toHaveAttribute("aria-busy", "true");
    fireEvent.click(screen.getByRole("button", { name: "Açık temaya geç" }));

    await act(async () => releaseLoad());
    await waitFor(() => expect(shell).toHaveAttribute("aria-busy", "false"));
    progressPersistenceHarness.loadGate = undefined;
    const restored = await loadProgress();
    expect(restored.profile).toEqual(stored.profile);
    expect(restored.settings.theme).toBe("dark");
  });

  it("keeps focus on an invalid profile name and explains the constraint", async () => {
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    await user.click(
      within(
        await screen.findByRole("navigation", { name: "Çalışma bölümleri" }),
      ).getByRole("button", { name: "Profilim" }),
    );
    await user.click(
      screen.getByRole("button", {
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
    render(<QueryvaleApp />);

    await user.click(
      await screen.findByRole("button", { name: "Ayarları aç" }),
    );
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
    render(<QueryvaleApp />);

    await user.click(
      await screen.findByRole("button", { name: "Ayarları aç" }),
    );
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
    render(<QueryvaleApp />);

    await user.click(
      await screen.findByRole("button", { name: "Ayarları aç" }),
    );
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
    render(<QueryvaleApp />);
    await waitFor(() =>
      expect(document.querySelector(".app-shell")).toHaveAttribute(
        "aria-busy",
        "false",
      ),
    );

    progressPersistenceHarness.saveDelays = [60, 0];
    await user.click(screen.getByRole("button", { name: "Açık temaya geç" }));
    await user.click(screen.getByRole("button", { name: "Ayarları aç" }));
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
    render(<QueryvaleApp />);

    await user.click(
      await screen.findByRole("button", { name: "Ayarları aç" }),
    );
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
          solveTimeSeconds: 1,
          firstTry: true,
        },
      },
    };
    await saveProgress(withStaleTask);
    window.location.hash = "#/progress";
    render(<QueryvaleApp />);

    const overallProgress = await screen.findByRole("progressbar", {
      name: "Tamamlanan görev oranı",
    });
    expect(overallProgress).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText(`0 / ${tasks.length} görev`)).toBeInTheDocument();
  });

  it("changes the theme from the global header", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Açık temaya geç" }));
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe("light"),
    );
  });
});
