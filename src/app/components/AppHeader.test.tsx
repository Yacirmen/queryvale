import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "./AppHeader";

describe("AppHeader", () => {
  it("shows three navigation targets and the CTA without documentation", () => {
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
    const howItWorks = within(navigation).getByRole("button", {
      name: "Nasıl Çalışır",
    });
    const start = screen.getByRole("button", {
      name: "Hemen Başla — hesap aç veya giriş yap",
    });

    expect(route).toBeVisible();
    expect(studio).toBeVisible();
    expect(howItWorks).toBeVisible();
    expect(start).toBeVisible();
    expect(within(navigation).getAllByRole("button")).toHaveLength(3);
    expect(screen.queryByText("Dokümanlar")).not.toBeInTheDocument();
    expect(route).toHaveAttribute("aria-current", "page");
    expect(studio).not.toHaveAttribute("aria-current");
    expect(start).not.toHaveAttribute("aria-current");

    rerender(<AppHeader screen="workspace" onNavigate={vi.fn()} />);

    expect(route).not.toHaveAttribute("aria-current");
    expect(studio).toHaveAttribute("aria-current", "page");

    rerender(<AppHeader screen="account" onNavigate={vi.fn()} />);

    expect(studio).not.toHaveAttribute("aria-current");
    expect(start).toHaveAttribute("aria-current", "page");

    rerender(<AppHeader screen="account" onNavigate={vi.fn()} disabled />);

    expect(screen.getByRole("banner")).toHaveAttribute("aria-busy", "true");
    for (const control of screen.getAllByRole("button")) {
      expect(control).toBeDisabled();
    }
  });

  it("routes Rota and keeps Studio, how-it-works and CTA callbacks separate", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onStudio = vi.fn();
    const onHowItWorks = vi.fn();
    const onStart = vi.fn();

    render(
      <AppHeader
        screen="home"
        onNavigate={onNavigate}
        onStudio={onStudio}
        onHowItWorks={onHowItWorks}
        onStart={onStart}
        startLabel="Hesabını oluştur"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Rota" }));
    await user.click(
      screen.getByRole("button", { name: "Studio — SQL Laboratuvarı" }),
    );
    await user.click(screen.getByRole("button", { name: "Nasıl Çalışır" }));
    await user.click(
      screen.getByRole("button", {
        name: "Hemen Başla — Hesabını oluştur",
      }),
    );

    expect(onNavigate).toHaveBeenCalledOnce();
    expect(onNavigate).toHaveBeenCalledWith("learn");
    expect(onStudio).toHaveBeenCalledOnce();
    expect(onHowItWorks).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("falls back to the workspace, showcase anchor and account screen", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<AppHeader screen="home" onNavigate={onNavigate} />);

    await user.click(
      screen.getByRole("button", { name: "Studio — SQL Laboratuvarı" }),
    );
    await user.click(screen.getByRole("button", { name: "Nasıl Çalışır" }));
    await user.click(
      screen.getByRole("button", {
        name: "Hemen Başla — hesap aç veya giriş yap",
      }),
    );

    expect(onNavigate).toHaveBeenNthCalledWith(1, "workspace");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "home", {
      anchor: "queryvale-studio",
    });
    expect(onNavigate).toHaveBeenNthCalledWith(3, "account");
  });
});
