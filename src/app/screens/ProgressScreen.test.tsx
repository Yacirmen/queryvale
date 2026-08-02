import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { modules, pythonModules, pythonTasks, tasks } from "../../content";
import {
  createDefaultProgress,
  recordAttempt,
  recordPythonAttempt,
  recordPythonEvidence,
  recordPythonHint,
  type ProgressState,
} from "../../features/progress/progressStore";
import { buildProfileConceptSignals, ProgressScreen } from "./ProgressScreen";

function renderProgress(progress: ProgressState) {
  const onNavigate = vi.fn();
  render(
    <ProgressScreen
      modules={modules}
      tasks={tasks}
      pythonModules={pythonModules}
      pythonTasks={pythonTasks}
      progress={progress}
      profileName={progress.profile.displayName}
      onProfileNameChange={vi.fn()}
      onSignOut={vi.fn().mockResolvedValue(true)}
      onNavigate={onNavigate}
    />,
  );
  return { onNavigate };
}

describe("ProgressScreen learning signals", () => {
  it("explains an origin-local empty profile and offers a real next action", () => {
    const progress = createDefaultProgress();
    const { onNavigate } = renderProgress(progress);

    expect(screen.getByText("Henüz kayıt yok")).toBeInTheDocument();
    expect(
      screen.getByText(/Bu web adresinde henüz çalışma kaydı yok/),
    ).toBeInTheDocument();
    expect(screen.getByText("Henüz kavram sinyali yok")).toBeInTheDocument();
    const notebookTitle = screen.getByRole("heading", {
      name: "Kanıt Defteri",
    });
    expect(notebookTitle.parentElement).toHaveTextContent(
      "Doğrulanmış SQL sorguların, Python DataFrame çıktıları ve karar notların.",
    );
    expect(
      screen.getByText(/Localhost’taki kayıt GitHub adresine otomatik gelmez/),
    ).toBeInTheDocument();

    const activity = screen.getByRole("img", {
      name: /arasında 0 gün çalışıldı/,
    });
    expect(activity.querySelectorAll("time")).toHaveLength(35);
    expect(
      Array.from(activity.querySelectorAll("time")).every(
        (cell) =>
          /^\d{4}-\d{2}-\d{2}$/.test(cell.dateTime) &&
          Boolean(cell.getAttribute("title")),
      ),
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "İlk vakayı aç" }));
    expect(onNavigate).toHaveBeenCalledWith("workspace", {
      taskId: tasks[0].id,
    });
  });

  it("shows locked modules without offering a navigation escape", () => {
    renderProgress(createDefaultProgress());

    const lockedRow = screen
      .getByRole("heading", { name: modules[1].title })
      .closest("article");
    expect(lockedRow).not.toBeNull();
    expect(within(lockedRow!).getByText("Kilitli")).toBeInTheDocument();
    expect(
      within(lockedRow!).getByText(`Önce ${modules[0].title}`),
    ).toBeInTheDocument();
    expect(within(lockedRow!).queryByRole("button")).not.toBeInTheDocument();

    const projectRow = screen
      .getByRole("heading", { name: modules.at(-1)!.title })
      .closest("article");
    expect(projectRow).not.toBeNull();
    expect(projectRow).toHaveTextContent("0/12 proje");
  });

  it("separates an unfinished target from concepts verified by a correct task", () => {
    const task = tasks.find((item) => item.id === "m1-t3");
    expect(task).toBeDefined();

    const attempted = recordAttempt(
      createDefaultProgress(),
      task!.id,
      "SELECT * FROM products",
      false,
      0,
    );
    const attemptedSignals = buildProfileConceptSignals(tasks, attempted);
    expect(attemptedSignals.verified).toEqual([]);
    expect(attemptedSignals.inProgress.map((signal) => signal.concept)).toEqual(
      expect.arrayContaining(["ORDER_BY", "LIMIT"]),
    );
    expect(
      attemptedSignals.inProgress.map((signal) => signal.concept),
    ).not.toContain("SELECT");

    renderProgress(attempted);
    const conceptSection = screen
      .getByRole("heading", { name: "Hangi SQL konularını çalıştın?" })
      .closest("section");
    expect(conceptSection).not.toBeNull();
    expect(
      within(conceptSection!).getByText("Üzerinde çalışılıyor"),
    ).toBeInTheDocument();
    expect(within(conceptSection!).getByText("ORDER BY")).toBeInTheDocument();
    expect(within(conceptSection!).getByText("LIMIT")).toBeInTheDocument();
    expect(
      within(conceptSection!).queryByText("Doğrulanan konular"),
    ).not.toBeInTheDocument();

    const completed = recordAttempt(
      createDefaultProgress(),
      task!.id,
      task!.solutionSql,
      true,
      42,
    );
    const completedSignals = buildProfileConceptSignals(tasks, completed);
    expect(completedSignals.verified.map((signal) => signal.concept)).toEqual(
      expect.arrayContaining(["SELECT", "ORDER_BY", "LIMIT"]),
    );
    expect(completedSignals.inProgress).toEqual([]);
  });

  it("unifies Python completion, score, modules and verified evidence without hiding SQL", () => {
    const firstPythonTask = pythonTasks[0]!;
    const secondPythonTask = pythonTasks[1]!;
    const hinted = recordPythonHint(
      createDefaultProgress(),
      firstPythonTask.id,
      0,
      new Date("2026-08-02T09:00:00.000Z"),
    );
    const completed = recordPythonAttempt(
      hinted,
      firstPythonTask.id,
      firstPythonTask.solutionCode,
      true,
      24,
      new Date("2026-08-02T09:02:00.000Z"),
    );
    const withEvidence = recordPythonEvidence(completed, {
      taskId: firstPythonTask.id,
      runtimeVersion: "0.29.4",
      contentVersion: "1",
      verifiedAt: "2026-08-02T09:02:00.000Z",
      columns: [...firstPythonTask.expectedColumns],
      dtypes: firstPythonTask.expectedColumns.map(
        (column) => firstPythonTask.expectedDtypes?.[column] ?? "object",
      ),
      previewRows: firstPythonTask.expectedRows.map((row) => [...row]),
      rowCount: firstPythonTask.expectedRows.length,
      stdout: "",
    });

    const { onNavigate } = renderProgress(withEvidence);

    expect(
      screen.getByText(`1 / ${tasks.length + pythonTasks.length} çalışma`),
    ).toBeInTheDocument();
    const completionCard = screen.getByText("Tamamlanan").closest("article");
    expect(completionCard).not.toBeNull();
    expect(completionCard).toHaveTextContent("1 Python");

    const scoreCard = screen.getByText("Analiz puanı").closest("article");
    expect(scoreCard).not.toBeNull();
    expect(scoreCard).toHaveTextContent("7");
    expect(scoreCard).toHaveTextContent(
      `${(tasks.length + pythonTasks.length) * 10} mümkün`,
    );
    expect(scoreCard).toHaveTextContent("1 ipucuyla");

    expect(
      screen.getByRole("heading", { name: secondPythonTask.title }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Çalışmaya devam et" }));
    expect(onNavigate).toHaveBeenCalledWith("python", {
      taskId: secondPythonTask.id,
    });

    const pythonRoute = screen
      .getByRole("heading", { name: "Python modüllerinde neredesin?" })
      .closest("section");
    expect(pythonRoute).not.toBeNull();
    const firstModuleRow = within(pythonRoute!)
      .getByRole("heading", { name: pythonModules[0]!.title })
      .closest("article");
    expect(firstModuleRow).not.toBeNull();
    expect(firstModuleRow).toHaveTextContent("1/3 vaka · 7/30 puan");

    const lockedPythonRow = within(pythonRoute!)
      .getByRole("heading", { name: pythonModules[1]!.title })
      .closest("article");
    expect(lockedPythonRow).not.toBeNull();
    expect(within(lockedPythonRow!).getByText("Kilitli")).toBeInTheDocument();
    expect(
      within(lockedPythonRow!).queryByRole("button"),
    ).not.toBeInTheDocument();

    const notebook = screen.getByRole("region", { name: "Kanıt Defteri" });
    expect(
      within(notebook).getByText(firstPythonTask.title),
    ).toBeInTheDocument();
    expect(
      within(notebook).getByText("DataFrame doğrulandı"),
    ).toBeInTheDocument();
    expect(
      within(notebook).getByRole("table", {
        name: `${firstPythonTask.title} Python çıktı önizlemesi`,
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      within(notebook).getByRole("button", {
        name: `Python çalışmasını aç: ${firstPythonTask.title}`,
      }),
    );
    expect(onNavigate).toHaveBeenCalledWith("python", {
      taskId: firstPythonTask.id,
    });
    expect(
      screen.getByRole("heading", { name: "SQL konularında neredesin?" }),
    ).toBeInTheDocument();
  });
});
