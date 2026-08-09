import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { modules, tasks } from "../../content/curriculum";
import {
  createDefaultProgress,
  type TaskProgress,
} from "../../features/progress/progressStore";
import {
  buildLearningPathTaskStates,
  LearningPathScreen,
} from "./LearningPathScreen";

function taskProgress(
  taskId: string,
  overrides: Partial<TaskProgress> = {},
): TaskProgress {
  return {
    taskId,
    attempts: 0,
    completed: false,
    lastQuery: "",
    hintsUsed: [],
    solutionRevealed: false,
    solveTimeSeconds: 0,
    firstTry: false,
    ...overrides,
  };
}

describe("buildLearningPathTaskStates", () => {
  it("marks the first untouched task as both current and next", () => {
    const states = buildLearningPathTaskStates(tasks, createDefaultProgress());

    expect(states[0]).toMatchObject({ status: "next", isCurrent: true });
    expect(states.some((item) => item.status === "skipped")).toBe(false);
  });

  it("does not infer skipped work from navigation alone", () => {
    const progress = {
      ...createDefaultProgress(),
      lastOpenedTaskId: tasks[2].id,
    };
    const states = buildLearningPathTaskStates(tasks, progress);

    expect(states[0].status).toBe("next");
    expect(states[1].status).toBe("upcoming");
    expect(states[2]).toMatchObject({
      status: "upcoming",
      isCurrent: true,
    });
    expect(states.some((item) => item.status === "skipped")).toBe(false);
  });

  it("surfaces untouched earlier tasks as skipped after later real activity", () => {
    const activeTask = tasks[2];
    const progress = {
      ...createDefaultProgress(),
      lastOpenedTaskId: activeTask.id,
      tasks: {
        [activeTask.id]: taskProgress(activeTask.id, {
          attempts: 1,
          lastQuery: "SELECT product_name FROM products;",
        }),
      },
    };
    const states = buildLearningPathTaskStates(tasks, progress);

    expect(states[0].status).toBe("skipped");
    expect(states[1].status).toBe("skipped");
    expect(states[2]).toMatchObject({ status: "retry", isCurrent: true });
  });

  it("moves the recommendation forward after a completed task", () => {
    const firstTask = tasks[0];
    const secondTask = tasks[1];
    const progress = {
      ...createDefaultProgress(),
      lastOpenedTaskId: secondTask.id,
      tasks: {
        [firstTask.id]: taskProgress(firstTask.id, {
          attempts: 1,
          completed: true,
        }),
      },
    };
    const states = buildLearningPathTaskStates(tasks, progress);

    expect(states[0].status).toBe("completed");
    expect(states[1]).toMatchObject({ status: "next", isCurrent: true });
  });
});

describe("LearningPathScreen career chapters", () => {
  it("shows the ordered career route and counts preserved completed work", () => {
    const attemptedFoundationTask = tasks.find(
      (task) => task.moduleId === "module-1",
    )!;
    const completedBusinessTask = tasks.find(
      (task) => task.moduleId === "module-4",
    )!;
    const progress = {
      ...createDefaultProgress(),
      lastOpenedTaskId: completedBusinessTask.id,
      tasks: {
        [attemptedFoundationTask.id]: taskProgress(attemptedFoundationTask.id, {
          attempts: 3,
          lastQuery: "SELECT * FROM products;",
        }),
        [completedBusinessTask.id]: taskProgress(completedBusinessTask.id, {
          attempts: 1,
          completed: true,
          hintsUsed: [0],
          scoreAwarded: 7,
        }),
      },
    };

    render(
      createElement(LearningPathScreen, {
        modules,
        tasks,
        progress,
        onNavigate: () => undefined,
      }),
    );

    expect(screen.getByText("Veri analisti rotası")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Rota" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Sorgudan karara ilerlediğin yol",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Bölümler ve SQL konuları" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Çalışma durum özeti" }),
    ).toBeInTheDocument();

    const foundationChapter = screen.getByRole("article", {
      name: "Temeli kur bölümü",
    });
    const businessChapter = screen.getByRole("article", {
      name: "İş sorusunu çöz bölümü",
    });

    expect(foundationChapter).toHaveTextContent("0/12 çalışma tamamlandı");
    expect(within(foundationChapter).getByText("Önerilen odak")).toBeVisible();
    expect(businessChapter).toHaveTextContent("1/8 çalışma tamamlandı");
    expect(within(businessChapter).getByText("İlerliyorsun")).toBeVisible();
    expect(screen.getAllByText("Serbest erişim", { exact: true })).toHaveLength(
      2,
    );
    expect(screen.getByText(`7/${tasks.length * 10}`)).toBeVisible();
    expect(screen.getByText("7/40 analiz puanı")).toBeVisible();
    const laterModule = screen.getByRole("button", {
      name: new RegExp(`${modules[3].title} (vakalarını|projelerini)`),
    });
    expect(laterModule).not.toHaveAttribute("aria-disabled", "true");
  });

  it("lets a learner open any module with the keyboard", async () => {
    const user = userEvent.setup();
    render(
      createElement(LearningPathScreen, {
        modules,
        tasks,
        progress: createDefaultProgress(),
        onNavigate: () => undefined,
      }),
    );

    const firstModule = screen.getByRole("button", {
      name: `${modules[0].title} vakalarını daralt`,
    });
    const laterModule = screen.getByRole("button", {
      name: `${modules[1].title} vakalarını aç`,
    });

    expect(firstModule).not.toHaveAttribute("aria-disabled", "true");
    expect(laterModule).not.toHaveAttribute("aria-disabled", "true");
    expect(laterModule).toHaveAttribute("aria-expanded", "false");

    laterModule.focus();
    await user.keyboard("{Enter}");

    expect(laterModule).toHaveFocus();
    expect(laterModule).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(`${modules[1].id}-tasks`)).not.toBeNull();
  });

  it("keeps the current module expanded after earlier work is complete", () => {
    const firstModuleProgress = Object.fromEntries(
      modules[0].tasks.map((task) => [
        task.id,
        taskProgress(task.id, { completed: true, scoreAwarded: 10 }),
      ]),
    );

    render(
      createElement(LearningPathScreen, {
        modules,
        tasks,
        progress: {
          ...createDefaultProgress(),
          lastOpenedTaskId: modules[1].tasks[0].id,
          tasks: firstModuleProgress,
        },
        onNavigate: () => undefined,
      }),
    );

    const secondModule = screen.getByRole("button", {
      name: `${modules[1].title} vakalarını daralt`,
    });
    expect(secondModule).not.toHaveAttribute("aria-disabled", "true");
    expect(secondModule).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(`${modules[1].id}-tasks`)).not.toBeNull();
  });
});
