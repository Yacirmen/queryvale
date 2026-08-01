import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "./AppHeader";

describe("AppHeader", () => {
  it("shows the five reference controls and marks the current destination", () => {
    const { rerender } = render(
      <AppHeader screen="learn" onNavigate={vi.fn()} />,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Ana bölümler",
    });
    const route = within(navigation).getByRole("button", { name: "Rota" });
    const studio = within(navigation).getByRole("button", {
      name: "Studio — SQL Laboratuvarı",
    });
    const dataEngine = within(navigation).getByRole("button", {
      name: "Veri Motoru",
    });
    const documentation = within(navigation).getByRole("link", {
      name: "Dokümanlar",
    });
    const start = screen.getByRole("button", { name: "İlk vakaya başla" });

    expect(route).toBeVisible();
    expect(studio).toBeVisible();
    expect(dataEngine).toBeVisible();
    expect(documentation).toBeVisible();
    expect(start).toBeVisible();
    expect(route).toHaveAttribute("aria-current", "page");
    expect(studio).not.toHaveAttribute("aria-current");

    rerender(<AppHeader screen="workspace" onNavigate={vi.fn()} />);

    expect(route).not.toHaveAttribute("aria-current");
    expect(studio).toHaveAttribute("aria-current", "page");
    expect(documentation).toHaveAttribute(
      "href",
      "https://github.com/Yacirmen/queryvale#readme",
    );
    expect(documentation).toHaveAttribute("target", "_blank");
    expect(documentation).toHaveAttribute("rel", "noreferrer");
  });

  it("routes Rota and calls the Studio, data-engine and CTA handlers", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onHomeStart = vi.fn();
    const onDataEngine = vi.fn();

    render(
      <AppHeader
        screen="home"
        onNavigate={onNavigate}
        onHomeStart={onHomeStart}
        onDataEngine={onDataEngine}
        homeStartLabel="Kaldığın vakaya devam et"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Rota" }));
    await user.click(
      screen.getByRole("button", { name: "Studio — SQL Laboratuvarı" }),
    );
    await user.click(screen.getByRole("button", { name: "Veri Motoru" }));
    await user.click(
      screen.getByRole("button", { name: "Kaldığın vakaya devam et" }),
    );

    expect(onNavigate).toHaveBeenCalledOnce();
    expect(onNavigate).toHaveBeenCalledWith("learn");
    expect(onHomeStart).toHaveBeenCalledTimes(2);
    expect(onDataEngine).toHaveBeenCalledOnce();
  });
});
