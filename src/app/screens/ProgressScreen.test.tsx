import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { modules, tasks } from "../../content";
import {
  createDefaultProgress,
  recordAttempt,
  type ProgressState,
} from "../../features/progress/progressStore";
import { buildProfileConceptSignals, ProgressScreen } from "./ProgressScreen";

function renderProgress(progress: ProgressState) {
  const onNavigate = vi.fn();
  render(
    <ProgressScreen
      modules={modules}
      tasks={tasks}
      progress={progress}
      profileName={progress.profile.displayName}
      onProfileNameChange={vi.fn()}
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
      "Doğrulanmış sorguların ve karar notların.",
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
});
