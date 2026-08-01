import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createDefaultProgress } from "../../features/progress/progressStore";
import { AppHeader } from "./AppHeader";

describe("AppHeader", () => {
  it("explains the three-part workflow and exposes a single active destination", () => {
    render(
      <AppHeader
        screen="learn"
        profileName="SQL Kaşifi"
        settings={createDefaultProgress().settings}
        onNavigate={vi.fn()}
        onSettingsChange={vi.fn()}
      />,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Çalışma alanları",
    });
    const route = within(navigation).getByRole("button", {
      name: "Rota",
    });

    expect(route).toHaveAttribute("aria-current", "page");
    expect(
      within(navigation).getByText("Bölümler ve sıradaki vaka"),
    ).toBeVisible();
    expect(
      within(navigation).getByText("Sorgunu yaz ve çalıştır"),
    ).toBeVisible();
    expect(
      within(navigation).getByText("SQL Kaşifi · İlerleme ve Kanıt Defteri"),
    ).toBeVisible();
    expect(within(navigation).getAllByText("Şu an")).toHaveLength(1);
    expect(
      within(navigation).getByRole("button", { name: "Profilim" }),
    ).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Sorudan kanıta")).toBeVisible();

    const utilities = screen.getByRole("group", {
      name: "Görünüm ve tercihler",
    });
    expect(
      within(utilities).getByRole("button", { name: "Açık temaya geç" }),
    ).toBeVisible();
    expect(
      within(utilities).getByRole("button", { name: "Ayarları aç" }),
    ).toBeVisible();
  });

  it("routes every explicit control and marks home and settings states", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onSettingsChange = vi.fn();
    const onHomeStart = vi.fn();
    const settings = createDefaultProgress().settings;
    const { rerender } = render(
      <AppHeader
        screen="home"
        profileName="SQL Kaşifi"
        settings={settings}
        onNavigate={onNavigate}
        onSettingsChange={onSettingsChange}
        onHomeStart={onHomeStart}
        homeStartLabel="İlk vakaya başla"
      />,
    );

    const brand = screen.getByRole("button", {
      name: "Queryvale ana sayfa",
    });
    expect(brand).toHaveAttribute("aria-current", "page");

    expect(
      within(
        screen.getByRole("navigation", { name: "Çalışma alanları" }),
      ).getByRole("button", { name: "Studio" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "İlk vakaya başla" }));
    await user.click(screen.getByRole("button", { name: "Ayarları aç" }));
    await user.click(screen.getByRole("button", { name: "Açık temaya geç" }));

    expect(onHomeStart).toHaveBeenCalledOnce();
    expect(onNavigate).toHaveBeenNthCalledWith(1, "settings");
    expect(onSettingsChange).toHaveBeenCalledWith({
      ...settings,
      theme: "light",
    });

    rerender(
      <AppHeader
        screen="settings"
        profileName="SQL Kaşifi"
        settings={settings}
        onNavigate={onNavigate}
        onSettingsChange={onSettingsChange}
        onHomeStart={onHomeStart}
        homeStartLabel="İlk vakaya başla"
      />,
    );

    expect(screen.getByRole("button", { name: "Ayarları aç" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(brand).not.toHaveAttribute("aria-current");
  });
});
