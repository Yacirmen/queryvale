import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LandingStory } from "./LandingStory";
import { getLandingStoryFrame } from "./landingStoryFrame";

describe("LandingStory", () => {
  it("maps native scroll progress to deterministic crossfade frames", () => {
    expect(getLandingStoryFrame(-1)).toMatchObject({
      activeIndex: 0,
      fromIndex: 0,
      mix: 0,
      progress: 0,
      toIndex: 1,
    });
    expect(getLandingStoryFrame(0.125)).toMatchObject({
      activeIndex: 1,
      fromIndex: 0,
      mix: 0.5,
      toIndex: 1,
    });
    expect(getLandingStoryFrame(0.25)).toMatchObject({
      activeIndex: 1,
      fromIndex: 1,
      mix: 0,
      toIndex: 2,
    });
    expect(getLandingStoryFrame(1)).toMatchObject({
      activeIndex: 4,
      fromIndex: 4,
      mix: 0,
      progress: 1,
      toIndex: 4,
    });
    expect(getLandingStoryFrame(Number.NaN).progress).toBe(0);
  });

  it("shows one active evidence scene and changes it only on request", async () => {
    const user = userEvent.setup();
    const { container } = render(<LandingStory />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("heading", {
        name: "İş sorusunu tek bir teslim cümlesine indir.",
      }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".story-art")).toHaveLength(1);

    await user.click(screen.getByRole("tab", { name: /3\. adım: Sorgula/i }));

    expect(screen.getByRole("tab", { name: /Sorgula/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("heading", {
        name: "İstenen görünümü okunabilir SQL’e çevir.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("analysis.sql")).toBeInTheDocument();
    expect(screen.queryByText(/FROM products/i)).not.toBeInTheDocument();
    expect(container.querySelectorAll(".story-art")).toHaveLength(1);
  });

  it("supports roving tab focus with arrows, Home and End", () => {
    render(<LandingStory />);

    const firstTab = screen.getByRole("tab", { name: /1\. adım: Sor/i });
    const inspectTab = screen.getByRole("tab", {
      name: /2\. adım: İncele/i,
    });
    const finalTab = screen.getByRole("tab", { name: /5\. adım: Anlat/i });

    firstTab.focus();
    fireEvent.keyDown(firstTab, { key: "ArrowRight" });
    expect(inspectTab).toHaveFocus();
    expect(inspectTab).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(inspectTab, { key: "End" });
    expect(finalTab).toHaveFocus();
    expect(finalTab).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("heading", {
        name: "Doğrulanmış sonucu kısa bir iş notuna dönüştür.",
      }),
    ).toBeInTheDocument();

    fireEvent.keyDown(finalTab, { key: "Home" });
    expect(firstTab).toHaveFocus();
    expect(firstTab).toHaveAttribute("aria-selected", "true");
  });
});
