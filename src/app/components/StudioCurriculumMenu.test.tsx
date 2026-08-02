import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  StudioCurriculumMenu,
  type StudioCurriculumModuleItem,
} from "./StudioCurriculumMenu";

const modules: StudioCurriculumModuleItem[] = [
  {
    id: "module-1",
    order: 1,
    title: "Veriyle ilk temas",
    status: "1/2 vaka",
    complete: false,
    tasks: [
      {
        id: "m1-t1",
        title: "Katalog görünümünü hazırla",
        meta: "5 dk",
        accessible: true,
        complete: true,
      },
      {
        id: "m1-t2",
        title: "Kategori listesini tekilleştir",
        meta: "6 dk",
        accessible: true,
        complete: false,
      },
    ],
  },
  {
    id: "module-2",
    order: 2,
    title: "Veriyi filtreleme",
    status: "Önce Veriyle ilk temas",
    complete: false,
    tasks: [
      {
        id: "m2-t1",
        title: "Yüksek tutarlı siparişleri bul",
        meta: "7 dk",
        accessible: false,
        complete: false,
      },
    ],
  },
];

function renderMenu(onSelectTask = vi.fn()) {
  return {
    onSelectTask,
    ...render(
      <StudioCurriculumMenu
        variant="sql"
        label="SQL rotası"
        title="Analist SQL rotası"
        subtitle="Temelden portföy projelerine"
        completedCount={1}
        totalCount={3}
        activeTaskId="m1-t2"
        modules={modules}
        onSelectTask={onSelectTask}
      />,
    ),
  };
}

describe("StudioCurriculumMenu", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("shows progress, active work and a visible lock reason", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByText("SQL rotası").closest("summary");
    expect(trigger).not.toBeNull();
    await user.click(trigger!);

    await waitFor(() =>
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        block: "nearest",
        inline: "nearest",
      }),
    );

    expect(screen.getByText("Analist SQL rotası")).toBeVisible();
    expect(screen.getByText("Temelden portföy projelerine")).toBeVisible();
    const progress = screen.getByRole("progressbar", {
      name: "SQL rotası yüzde 33 tamamlandı",
    });
    expect(progress).toBeVisible();
    expect(progress).toHaveAttribute("aria-valuenow", "33");
    expect(screen.getByText("1/2 vaka")).toBeVisible();
    expect(screen.getByText("Önce Veriyle ilk temas")).toBeInTheDocument();

    const activeTask = screen.getByRole("button", {
      name: /Kategori listesini tekilleştir/,
    });
    expect(activeTask).toHaveAttribute("aria-current", "page");

    await user.click(screen.getByText("Veriyi filtreleme"));
    expect(
      screen.getByRole("button", {
        name: /Yüksek tutarlı siparişleri bul/,
      }),
    ).toBeDisabled();
  });

  it("selects an accessible task, closes the menu and supports Escape", async () => {
    const user = userEvent.setup();
    const { container, onSelectTask } = renderMenu();
    const menu = container.querySelector<HTMLDetailsElement>(
      ".studio-curriculum-menu",
    );
    const trigger = screen.getByText("SQL rotası").closest("summary");
    expect(menu).not.toBeNull();
    expect(trigger).not.toBeNull();

    await user.click(trigger!);
    await user.click(
      screen.getByRole("button", { name: /Katalog görünümünü hazırla/ }),
    );
    expect(onSelectTask).toHaveBeenCalledWith("m1-t1");
    expect(menu).not.toHaveAttribute("open");

    await user.click(trigger!);
    expect(menu).toHaveAttribute("open");
    trigger!.focus();
    await user.keyboard("{Escape}");
    expect(menu).not.toHaveAttribute("open");
    expect(trigger).toHaveFocus();

    await user.click(trigger!);
    await user.click(document.body);
    expect(menu).not.toHaveAttribute("open");
  });

  it("returns focus when the already active task is selected", async () => {
    const user = userEvent.setup();
    const { container, onSelectTask } = renderMenu();
    const menu = container.querySelector<HTMLDetailsElement>(
      ".studio-curriculum-menu",
    );
    const trigger = screen.getByText("SQL rotası").closest("summary");

    await user.click(trigger!);
    await user.click(
      screen.getByRole("button", { name: /Kategori listesini tekilleştir/ }),
    );

    expect(menu).not.toHaveAttribute("open");
    expect(trigger).toHaveFocus();
    expect(onSelectTask).not.toHaveBeenCalled();
  });

  it("marks completed modules and renders all task controls", async () => {
    const user = userEvent.setup();
    const completedModules: StudioCurriculumModuleItem[] = [
      { ...modules[0]!, complete: true, status: "2/2 vaka" },
    ];
    const { container } = render(
      <StudioCurriculumMenu
        variant="python"
        label="Python rotası"
        title="Analist Python rotası"
        subtitle="EDA’dan örüntü analizine"
        completedCount={2}
        totalCount={2}
        activeTaskId="m1-t2"
        modules={completedModules}
        onSelectTask={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Python rotası").closest("summary")!);
    const moduleGroup = screen
      .getByText("Veriyle ilk temas")
      .closest("details");
    expect(moduleGroup).not.toBeNull();
    expect(within(moduleGroup!).getByLabelText("Tamamlandı")).toBeVisible();
    expect(
      container.querySelectorAll(".studio-module-list button"),
    ).toHaveLength(2);
  });
});
