import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../../features/progress/progressStore";
import { SettingsScreen } from "./SettingsScreen";

function renderSettings(
  overrides: Partial<ComponentProps<typeof SettingsScreen>> = {},
) {
  const props: ComponentProps<typeof SettingsScreen> = {
    settings: { ...defaultSettings },
    onChange: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn().mockResolvedValue(undefined),
    onReset: vi.fn().mockResolvedValue(undefined),
    hasLocalAccount: false,
    profileName: "SQL Kaşifi",
    onShowFirstGuide: vi.fn(),
    onDeleteLocalProfile: vi.fn().mockResolvedValue(true),
    ...overrides,
  };

  render(<SettingsScreen {...props} />);
  return props;
}

describe("SettingsScreen", () => {
  it("keeps editor, backup, import and reset controls working", async () => {
    const user = userEvent.setup();
    const props = renderSettings();

    await user.click(screen.getByRole("button", { name: "Açık" }));
    expect(props.onChange).toHaveBeenCalledWith({
      ...defaultSettings,
      theme: "light",
    });

    await user.click(screen.getByRole("button", { name: "Dışa aktar" }));
    expect(props.onExport).toHaveBeenCalledOnce();

    const backup = new File(["{}"], "queryvale-backup.json", {
      type: "application/json",
    });
    await user.upload(screen.getByLabelText("İlerleme dosyası seç"), backup);
    expect(props.onImport).toHaveBeenCalledWith(backup);

    await user.click(screen.getByRole("button", { name: "Sıfırla" }));
    expect(props.onReset).toHaveBeenCalledOnce();
    expect(props.onDeleteLocalProfile).not.toHaveBeenCalled();
  });

  it("explains local data boundaries and reopens the first-case guide", async () => {
    const user = userEvent.setup();
    const props = renderSettings();
    const helpTitle = screen.getByRole("heading", { name: "Yardım ve veri" });
    const helpSection = helpTitle.closest("section");

    expect(helpSection).toHaveAttribute("id", "settings-help");
    expect(helpSection).toHaveAttribute("tabindex", "-1");
    expect(
      within(helpSection!).getByText(/SQL taslakların.*otomatik kaydedilir/i),
    ).toBeVisible();
    expect(
      within(helpSection!).getByText(/JSON yedeğini.*dışa aktarıp/i),
    ).toBeVisible();
    expect(
      within(helpSection!).getByText(/Neden e-posta veya parola yok/i),
    ).toBeVisible();
    expect(
      within(helpSection!).getByText(/sunucu hesabı veya bulut eşitleme/i),
    ).toBeVisible();

    await user.click(
      within(helpSection!).getByRole("button", { name: "Rehberi aç" }),
    );
    expect(props.onShowFirstGuide).toHaveBeenCalledOnce();

    const supportLink = within(helpSection!).getByRole("link", {
      name: "Sorun bildir",
    });
    expect(supportLink).toHaveAttribute(
      "href",
      "https://github.com/Yacirmen/queryvale/issues/new",
    );
    expect(supportLink).toHaveAttribute("target", "_blank");
    expect(supportLink).toHaveAttribute("rel", "noreferrer");
  });

  it("does not offer destructive profile deletion to a guest", () => {
    renderSettings({ hasLocalAccount: false });

    expect(
      screen.queryByRole("heading", { name: "Profil ve veri" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Profili sil" }),
    ).not.toBeInTheDocument();
  });

  it("separates reset from deleting the local profile and requires confirmation", async () => {
    const user = userEvent.setup();
    const props = renderSettings({
      hasLocalAccount: true,
      profileName: "Ada Analist",
    });

    expect(
      screen.getByRole("heading", { name: "Profil ve veri" }),
    ).toBeVisible();
    expect(screen.getByText("Ada Analist profilini tamamen sil")).toBeVisible();
    expect(
      screen.getByText(/İlerlemeyi sıfırlamak yalnız vaka geçmişini temizler/i),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Profili sil" }));
    let dialog = screen.getByRole("alertdialog", {
      name: "Yerel profil ve tüm veriler silinsin mi?",
    });
    expect(
      within(dialog).getByText(/Ada Analist.*kalıcı olarak silinecek/i),
    ).toBeVisible();
    expect(
      within(dialog).getByText(/Vazgeçip önce yukarıdaki JSON dışa aktarma/i),
    ).toBeVisible();

    await user.click(within(dialog).getByRole("button", { name: "Vazgeç" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(props.onDeleteLocalProfile).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Profili sil" }));
    dialog = screen.getByRole("alertdialog", {
      name: "Yerel profil ve tüm veriler silinsin mi?",
    });
    await user.click(
      within(dialog).getByRole("button", {
        name: "Profili ve verileri sil",
      }),
    );

    await waitFor(() =>
      expect(props.onDeleteLocalProfile).toHaveBeenCalledOnce(),
    );
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(props.onReset).not.toHaveBeenCalled();
  });

  it("locks the destructive action while profile deletion is pending", () => {
    renderSettings({
      hasLocalAccount: true,
      profileName: "Ada Analist",
      isDeletingProfile: true,
    });

    expect(screen.getByRole("button", { name: "Siliniyor…" })).toBeDisabled();
  });
});
