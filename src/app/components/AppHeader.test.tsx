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
      name: "Çalışma bölümleri",
    });
    const route = within(navigation).getByRole("button", {
      name: "Vaka Rotası",
    });

    expect(route).toHaveAttribute("aria-current", "page");
    expect(
      within(navigation).getByText("Modüller ve sıradaki vaka"),
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
  });

  it("routes every explicit control and marks home and settings states", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onSettingsChange = vi.fn();
    const settings = createDefaultProgress().settings;
    const { rerender } = render(
      <AppHeader
        screen="home"
        profileName="SQL Kaşifi"
        settings={settings}
        onNavigate={onNavigate}
        onSettingsChange={onSettingsChange}
      />,
    );

    const brand = screen.getByRole("button", {
      name: "Queryvale ana sayfa",
    });
    expect(brand).toHaveAttribute("aria-current", "page");

    await user.click(
      within(
        screen.getByRole("navigation", { name: "Çalışma bölümleri" }),
      ).getByRole("button", { name: "SQL Laboratuvarı" }),
    );
    await user.click(screen.getByRole("button", { name: "Ayarları aç" }));
    await user.click(screen.getByRole("button", { name: "Açık temaya geç" }));

    expect(onNavigate).toHaveBeenNthCalledWith(1, "workspace");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "settings");
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
      />,
    );

    expect(screen.getByRole("button", { name: "Ayarları aç" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(brand).not.toHaveAttribute("aria-current");
  });
});
