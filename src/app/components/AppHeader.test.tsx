import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "./AppHeader";

describe("AppHeader", () => {
  it("uses the supplied logo as a decorative mark inside the accessible home action", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<AppHeader screen="home" onNavigate={onNavigate} />);

    const brand = screen.getByRole("button", { name: "Queryvale ana sayfa" });
    const logo = brand.querySelector("img.brand-logo");

    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "./queryvale-logo.svg");
    expect(logo).toHaveAttribute("alt", "");
    expect(logo).toHaveAttribute("aria-hidden", "true");
    expect(logo).toHaveAttribute("width", "42");
    expect(logo).toHaveAttribute("height", "30");
    expect(brand).toHaveTextContent("Queryvale");

    await user.click(brand);
    expect(onNavigate).toHaveBeenCalledWith("home");
  });

  it("shows both studios without a separate route button", () => {
    const { rerender } = render(
      <AppHeader screen="workspace" onNavigate={vi.fn()} />,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Ana bölümler",
    });
    const sqlStudio = within(navigation).getByRole("button", {
      name: "SQL Studio — SQL Laboratuvarı",
    });
    const pythonStudio = within(navigation).getByRole("button", {
      name: "Python Studio",
    });
    const start = screen.getByRole("button", {
      name: "Hemen Başla — hesap aç veya giriş yap",
    });

    expect(sqlStudio).toBeVisible();
    expect(sqlStudio).toHaveTextContent("SQL Studio");
    expect(pythonStudio).toBeVisible();
    expect(start).toBeVisible();
    expect(within(navigation).getAllByRole("button")).toHaveLength(2);
    expect(
      within(navigation).queryByRole("button", { name: "Rota" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Dokümanlar")).not.toBeInTheDocument();
    expect(screen.queryByText("Nasıl Çalışır")).not.toBeInTheDocument();
    expect(sqlStudio).toHaveAttribute("aria-current", "page");
    expect(pythonStudio).not.toHaveAttribute("aria-current");
    expect(start).not.toHaveAttribute("aria-current");

    rerender(<AppHeader screen="python" onNavigate={vi.fn()} />);

    expect(sqlStudio).not.toHaveAttribute("aria-current");
    expect(pythonStudio).toHaveAttribute("aria-current", "page");

    rerender(<AppHeader screen="account" onNavigate={vi.fn()} />);

    expect(pythonStudio).not.toHaveAttribute("aria-current");
    expect(start).toHaveAttribute("aria-current", "page");

    rerender(<AppHeader screen="account" onNavigate={vi.fn()} disabled />);

    expect(screen.getByRole("banner")).toHaveAttribute("aria-busy", "true");
    for (const control of screen.getAllByRole("button")) {
      expect(control).toBeDisabled();
    }
  });

  it("keeps SQL Studio, Python Studio and CTA callbacks separate", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onStudio = vi.fn();
    const onPythonStudio = vi.fn();
    const onStart = vi.fn();

    render(
      <AppHeader
        screen="home"
        onNavigate={onNavigate}
        onStudio={onStudio}
        onPythonStudio={onPythonStudio}
        onStart={onStart}
        startLabel="Hesabını oluştur"
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "SQL Studio — SQL Laboratuvarı",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Python Studio" }));
    await user.click(
      screen.getByRole("button", {
        name: "Hemen Başla — Hesabını oluştur",
      }),
    );

    expect(onNavigate).not.toHaveBeenCalled();
    expect(onStudio).toHaveBeenCalledOnce();
    expect(onPythonStudio).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("locks only the landing Studio actions and explains how they open", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onStudio = vi.fn();
    const onPythonStudio = vi.fn();
    const onStart = vi.fn();

    render(
      <AppHeader
        screen="home"
        onNavigate={onNavigate}
        onStudio={onStudio}
        onPythonStudio={onPythonStudio}
        onStart={onStart}
        studioNavigationLocked
      />,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Ana bölümler",
    });
    const sqlStudio = within(navigation).getByRole("button", {
      name: "SQL Studio — SQL Laboratuvarı",
    });
    const pythonStudio = within(navigation).getByRole("button", {
      name: "Python Studio",
    });
    const explanation = screen.getByText(
      /ana sayfanın sonuna ulaştığında açılır/i,
    );

    for (const studio of [sqlStudio, pythonStudio]) {
      expect(studio).toHaveAttribute("aria-disabled", "true");
      expect(studio).toHaveAttribute(
        "aria-describedby",
        explanation.getAttribute("id"),
      );
      expect(studio).toHaveAttribute(
        "title",
        "Sayfanın sonuna ulaştığında açılır",
      );
      await user.click(studio);
    }

    expect(onStudio).not.toHaveBeenCalled();
    expect(onPythonStudio).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Queryvale ana sayfa" }),
    );
    await user.click(screen.getByRole("button", { name: /^Hemen Başla/ }));

    expect(onNavigate).toHaveBeenCalledWith("home");
    expect(onStart).toHaveBeenCalledOnce();
    expect(screen.getByRole("banner")).toHaveAttribute("aria-busy", "false");
  });

  it("falls back to the SQL workspace, Python Studio and account screen", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<AppHeader screen="home" onNavigate={onNavigate} />);

    await user.click(
      screen.getByRole("button", {
        name: "SQL Studio — SQL Laboratuvarı",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Python Studio" }));
    await user.click(
      screen.getByRole("button", {
        name: "Hemen Başla — hesap aç veya giriş yap",
      }),
    );

    expect(onNavigate).toHaveBeenNthCalledWith(1, "workspace");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "python");
    expect(onNavigate).toHaveBeenNthCalledWith(3, "account");
  });

  it("replaces the start CTA with profile controls for a local account", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const { rerender } = render(
      <AppHeader
        screen="home"
        onNavigate={onNavigate}
        accountStatus="local"
        profileName="Ada Yılmaz"
        studioNavigationLocked
      />,
    );

    const accountActions = screen.getByRole("group", {
      name: "Profil işlemleri",
    });
    const profile = within(accountActions).getByRole("button", {
      name: "Profil — Ada Yılmaz",
    });
    const settings = within(accountActions).getByRole("button", {
      name: "Ayarlar",
    });

    expect(profile).toBeVisible();
    expect(profile).toHaveTextContent("AYProfil");
    expect(profile).toBeEnabled();
    expect(settings).toBeVisible();
    expect(settings).toBeEnabled();
    expect(
      within(
        screen.getByRole("navigation", { name: "Ana bölümler" }),
      ).getByRole("button", { name: "SQL Studio — SQL Laboratuvarı" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.queryByRole("button", { name: /^Hemen Başla/ }),
    ).not.toBeInTheDocument();

    await user.click(profile);
    await user.click(settings);

    expect(onNavigate).toHaveBeenNthCalledWith(1, "progress");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "settings");

    rerender(
      <AppHeader
        screen="progress"
        onNavigate={onNavigate}
        accountStatus="local"
        profileName="Ada Yılmaz"
      />,
    );
    expect(profile).toHaveAttribute("aria-current", "page");
    expect(settings).not.toHaveAttribute("aria-current");

    rerender(
      <AppHeader
        screen="settings"
        onNavigate={onNavigate}
        accountStatus="local"
        profileName="Ada Yılmaz"
        disabled
      />,
    );
    expect(profile).not.toHaveAttribute("aria-current");
    expect(settings).toHaveAttribute("aria-current", "page");
    expect(profile).toBeDisabled();
    expect(settings).toBeDisabled();
  });

  it("keeps the account slot neutral while persisted progress is loading", () => {
    render(
      <AppHeader screen="home" onNavigate={vi.fn()} accountStatus="loading" />,
    );

    expect(screen.getByRole("banner")).toHaveAttribute("aria-busy", "true");
    expect(
      screen.queryByRole("button", { name: /^Hemen Başla/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Profil işlemleri" }),
    ).not.toBeInTheDocument();
  });
});
