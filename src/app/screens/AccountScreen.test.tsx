import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { AccountScreen } from "./AccountScreen";

function renderAccountScreen(
  overrides: Partial<ComponentProps<typeof AccountScreen>> = {},
) {
  const props: ComponentProps<typeof AccountScreen> = {
    profileName: "SQL Kaşifi",
    hasLocalAccount: false,
    profileActive: false,
    hasLearningProgress: false,
    completedCount: 0,
    totalCount: 52,
    persistenceAvailable: true,
    onCreateProfile: vi.fn().mockResolvedValue(true),
    onSignIn: vi.fn().mockResolvedValue(true),
    onContinue: vi.fn(),
    onGuestContinue: vi.fn(),
    ...overrides,
  };

  render(<AccountScreen {...props} />);
  return props;
}

describe("AccountScreen", () => {
  it("opens signup for a new learner and validates the local profile name", async () => {
    const user = userEvent.setup();
    const props = renderAccountScreen();
    const signupTab = screen.getByRole("tab", { name: "Hesap oluştur" });
    const loginTab = screen.getByRole("tab", { name: "Giriş yap" });

    expect(signupTab).toHaveAttribute("aria-selected", "true");
    expect(signupTab).toHaveAttribute("tabindex", "0");
    expect(loginTab).toHaveAttribute("tabindex", "-1");
    expect(signupTab).toHaveAttribute(
      "aria-controls",
      screen.getByRole("tabpanel").id,
    );
    expect(loginTab).toHaveAttribute(
      "aria-controls",
      screen.getByRole("tabpanel").id,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Yerel hesabımı oluştur ve başla",
      }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Kullanıcı adı en az bir görünür harf",
    );
    await waitFor(() => expect(screen.getByLabelText("Adın")).toHaveFocus());
    expect(props.onCreateProfile).not.toHaveBeenCalled();
    expect(props.onContinue).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Adın"), "  Ada   Yılmaz  ");
    await user.click(
      screen.getByRole("button", {
        name: "Yerel hesabımı oluştur ve başla",
      }),
    );

    expect(props.onCreateProfile).toHaveBeenCalledWith("Ada Yılmaz");
    expect(props.onContinue).toHaveBeenCalledOnce();
  });

  it("opens the saved local profile for a returning learner", async () => {
    const user = userEvent.setup();
    const props = renderAccountScreen({
      profileName: "Ayşe",
      hasLocalAccount: true,
      completedCount: 7,
      resumeTaskTitle: "Kritik stokları sırala",
    });

    expect(screen.getByRole("tab", { name: "Giriş yap" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Ayşe")).toBeInTheDocument();
    expect(screen.getByText("7 / 52 vaka")).toBeInTheDocument();
    expect(screen.getByText("Kritik stokları sırala")).toBeInTheDocument();
    expect(
      screen.getByText(/Bu profil parola ile korunmaz/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Profili açmadan Studio’ya geç" }),
    ).toBeVisible();
    expect(
      screen.getByText(/çıkış bir güvenlik kilidi değildir/i),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Ayşe profiline gir" }),
    );
    expect(props.onSignIn).toHaveBeenCalledOnce();
    expect(props.onContinue).not.toHaveBeenCalled();
    expect(props.onCreateProfile).not.toHaveBeenCalled();
  });

  it("continues immediately when the local profile is already active", async () => {
    const user = userEvent.setup();
    const props = renderAccountScreen({
      profileName: "Ayşe",
      hasLocalAccount: true,
      profileActive: true,
    });

    await user.click(screen.getByRole("button", { name: "Rotama dön" }));
    expect(props.onContinue).toHaveBeenCalledOnce();
    expect(props.onSignIn).not.toHaveBeenCalled();
  });

  it("explains that existing guest work will be preserved during signup", () => {
    renderAccountScreen({
      hasLearningProgress: true,
      completedCount: 3,
      resumeTaskTitle: "Kritik stokları sırala",
    });

    expect(
      screen.getByRole("heading", {
        name: "İlerlemeni yerel profile bağla.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Mevcut çalışmaların korunacak")).toBeVisible();
    expect(
      screen.getByText(
        /3 tamamlanmış vakan ve sorguların “Kritik stokları sırala” konumuyla birlikte bu profile bağlanacak/i,
      ),
    ).toBeVisible();
  });

  it("redirects a new learner's empty login state to signup", async () => {
    const user = userEvent.setup();
    renderAccountScreen();

    await user.click(screen.getByRole("tab", { name: "Giriş yap" }));
    expect(
      screen.getByRole("heading", {
        name: "Bu cihazda kayıtlı bir profil yok.",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Hesap oluştur ekranına geç" }),
    );
    expect(screen.getByRole("tab", { name: "Hesap oluştur" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByLabelText("Adın")).toBeVisible();
  });

  it("keeps existing progress instead of offering a second local profile", async () => {
    const user = userEvent.setup();
    renderAccountScreen({
      profileName: "Ayşe",
      hasLocalAccount: true,
      completedCount: 11,
    });

    await user.click(screen.getByRole("tab", { name: "Hesap oluştur" }));
    const panel = screen.getByRole("tabpanel");
    expect(
      within(panel).getByRole("heading", {
        name: "Mevcut ilerlemen korunuyor.",
      }),
    ).toBeInTheDocument();
    expect(within(panel).getByText("11 / 52 vaka tamamlandı")).toBeVisible();
    expect(within(panel).queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(
      within(panel).getByRole("button", { name: "Giriş yap ekranına dön" }),
    );
    expect(screen.getByRole("tab", { name: "Giriş yap" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("keeps guest access available when persistent storage is unavailable", async () => {
    const user = userEvent.setup();
    const props = renderAccountScreen({ persistenceAvailable: false });

    expect(
      screen.getByRole("button", {
        name: "Yerel hesabımı oluştur ve başla",
      }),
    ).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "kalıcı depolamaya izin vermiyor",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Bu cihazda hesapsız devam et",
      }),
    );
    expect(props.onGuestContinue).toHaveBeenCalledOnce();
  });

  it("does not leave the account gateway before persistence is confirmed", async () => {
    const user = userEvent.setup();
    const onCreateProfile = vi.fn().mockResolvedValue(false);
    const props = renderAccountScreen({ onCreateProfile });

    await user.type(screen.getByLabelText("Adın"), "Ada Analist");
    await user.click(
      screen.getByRole("button", {
        name: "Yerel hesabımı oluştur ve başla",
      }),
    );

    expect(onCreateProfile).toHaveBeenCalledWith("Ada Analist");
    expect(props.onContinue).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByLabelText("Adın")).toHaveFocus());
  });

  it("locks alternate account exits while the profile write is pending", async () => {
    const user = userEvent.setup();
    let resolveWrite: ((created: boolean) => void) | undefined;
    const onCreateProfile = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveWrite = resolve;
        }),
    );
    renderAccountScreen({ onCreateProfile });

    await user.type(screen.getByLabelText("Adın"), "Ada Analist");
    await user.click(
      screen.getByRole("button", {
        name: "Yerel hesabımı oluştur ve başla",
      }),
    );

    expect(screen.getByRole("tab", { name: "Giriş yap" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Hesap oluştur" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Bu cihazda hesapsız devam et" }),
    ).toBeDisabled();

    resolveWrite?.(false);
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Giriş yap" })).toBeEnabled(),
    );
  });

  it("supports arrow, Home and End navigation between account tabs", async () => {
    const user = userEvent.setup();
    renderAccountScreen();
    const signupTab = screen.getByRole("tab", { name: "Hesap oluştur" });

    signupTab.focus();
    await user.keyboard("{ArrowLeft}");
    const loginTab = screen.getByRole("tab", { name: "Giriş yap" });
    expect(loginTab).toHaveFocus();
    expect(loginTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{End}");
    expect(signupTab).toHaveFocus();
    expect(signupTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Home}");
    expect(loginTab).toHaveFocus();
    expect(loginTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowRight}");
    expect(signupTab).toHaveFocus();
    expect(signupTab).toHaveAttribute("aria-selected", "true");
  });
});
