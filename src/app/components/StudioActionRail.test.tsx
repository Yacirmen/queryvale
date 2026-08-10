import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  StudioActionRail,
  StudioResultStrip,
  type StudioRouteModuleItem,
} from "./StudioActionRail";

const modules: StudioRouteModuleItem[] = [
  {
    id: "m1",
    order: 1,
    title: "Temeller",
    tasks: [
      {
        id: "t1",
        index: 0,
        title: "İlk vaka",
        status: "completed",
        score: 10,
      },
      {
        id: "t2",
        index: 1,
        title: "İkinci vaka",
        status: "attempted",
      },
    ],
  },
  {
    id: "m2",
    order: 2,
    title: "Analiz",
    tasks: [
      {
        id: "t3",
        index: 2,
        title: "Üçüncü vaka",
        status: "unstarted",
      },
    ],
  },
];

function Harness({
  activeTaskId = "t2",
  activeIndex = 1,
  previousTaskId = "t1",
  nextTaskId = "t3",
  currentTaskCorrect = false,
  onSelectTask = vi.fn(),
  onCompleteRoute = vi.fn(),
  isFirst = false,
  isLast = false,
}: Partial<React.ComponentProps<typeof StudioActionRail>> & {
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <StudioActionRail
      variant="sql"
      activeTaskId={activeTaskId}
      activeIndex={activeIndex}
      totalCount={3}
      modules={modules}
      previousTaskId={isFirst ? undefined : previousTaskId}
      nextTaskId={isLast ? undefined : nextTaskId}
      currentTaskCorrect={currentTaskCorrect}
      routeMenuOpen={open}
      onRouteMenuOpenChange={setOpen}
      onSelectTask={onSelectTask}
      onCompleteRoute={onCompleteRoute}
    />
  );
}

describe("StudioActionRail", () => {
  it("keeps previous, route and next actions stable before a case is solved", async () => {
    const user = userEvent.setup();
    const onSelectTask = vi.fn();
    render(<Harness onSelectTask={onSelectTask} />);

    const rail = screen.getByRole("navigation", {
      name: /sql çalışma gezintisi/i,
    });
    expect(
      within(rail).getByRole("button", { name: /önceki çalışma/i }),
    ).toBeEnabled();
    expect(
      within(rail).getByRole("button", { name: /rota · vaka 2\/3/i }),
    ).toBeEnabled();
    const next = within(rail).getByRole("button", {
      name: /sonraki çalışma/i,
    });
    expect(next).toBeEnabled();

    await user.click(next);
    expect(onSelectTask).toHaveBeenCalledWith("t3");
  });

  it("keeps first previous visible with aria-disabled and completes from the last case", async () => {
    const user = userEvent.setup();
    const onSelectTask = vi.fn();
    const onCompleteRoute = vi.fn();
    const { rerender } = render(
      <Harness
        activeTaskId="t1"
        activeIndex={0}
        isFirst
        onSelectTask={onSelectTask}
      />,
    );

    const previous = screen.getByRole("button", {
      name: /önceki çalışma/i,
    });
    expect(previous).toHaveAttribute("aria-disabled", "true");
    await user.click(previous);
    expect(onSelectTask).not.toHaveBeenCalled();

    rerender(
      <Harness
        activeTaskId="t3"
        activeIndex={2}
        previousTaskId="t2"
        isLast
        currentTaskCorrect
        onCompleteRoute={onCompleteRoute}
      />,
    );
    await user.click(screen.getByRole("button", { name: /rotayı tamamla/i }));
    expect(onCompleteRoute).toHaveBeenCalledTimes(1);
  });

  it("opens every route item, exposes real states and supports roving keyboard focus", async () => {
    const user = userEvent.setup();
    const onSelectTask = vi.fn();
    render(<Harness onSelectTask={onSelectTask} />);

    const trigger = screen.getByRole("button", { name: /rota · vaka 2\/3/i });
    await user.click(trigger);
    const drawer = screen.getByRole("region", { name: /sql rotası/i });
    const buttons = within(drawer).getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons.every((button) => !button.hasAttribute("disabled"))).toBe(
      true,
    );
    expect(within(buttons[0]).getByText("10/10")).toBeVisible();
    expect(within(buttons[1]).getByText("Deneniyor")).toHaveClass("sr-only");
    expect(within(buttons[2]).getByText("Başlanmadı")).toHaveClass("sr-only");
    await waitFor(() => expect(buttons[1]).toHaveFocus());

    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelectTask).toHaveBeenCalledWith("t3");

    await user.click(trigger);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(
      screen.queryByRole("region", { name: /sql rotası/i }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["drill_intro", "Alıştırma", "ALIŞTIRMA · 3 DK"],
    ["drill_practice", "Tekrar", "TEKRAR · 3 DK"],
    ["drill_mix", "Birleştir", "BİRLEŞTİR · 5 DK"],
  ] as const)(
    "labels an unscored %s route item without inventing a 0/10 score",
    (type, label, badge) => {
      render(
        <StudioActionRail
          variant="sql"
          activeTaskId="drill"
          activeIndex={1}
          activeTaskType={type}
          totalCount={2}
          modules={[
            {
              id: "m1",
              order: 1,
              title: "Köprüler",
              tasks: [
                {
                  id: "case",
                  index: 0,
                  title: "Temel vaka",
                  status: "completed",
                  type: "case",
                  scored: true,
                  score: 10,
                },
                {
                  id: "drill",
                  index: 1,
                  title: "Tek COUNT",
                  status: "completed",
                  type,
                  scored: false,
                },
              ],
            },
          ]}
          previousTaskId="case"
          currentTaskCorrect
          routeMenuOpen
          onRouteMenuOpenChange={vi.fn()}
          onSelectTask={vi.fn()}
          onCompleteRoute={vi.fn()}
        />,
      );

      const trigger = screen.getByRole("button", {
        name: `Rota · ${label} 2/2`,
      });
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger.closest(".studio-action-zone")).toHaveAttribute(
        "data-task-type",
        type,
      );
      const drill = screen.getByRole("button", { name: /Tek COUNT/i });
      expect(drill).toHaveAttribute("data-type", type);
      expect(
        within(drill).getByText(`${badge} · puanlanmaz`),
      ).toBeInTheDocument();
      expect(within(drill).queryByText("0/10")).not.toBeInTheDocument();
    },
  );
});

describe("StudioResultStrip", () => {
  it("announces a compact verified result without owning table scroll", () => {
    render(
      <StudioResultStrip
        status="correct"
        summary="6 satır · beklenen çıktıyla eşleşti · 7/10 puan"
      />,
    );

    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Doğru — 6 satır · beklenen çıktıyla eşleşti · 7/10 puan",
    );
  });
});
