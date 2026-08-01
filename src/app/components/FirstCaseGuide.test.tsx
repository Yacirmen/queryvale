import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FirstCaseGuide } from "./FirstCaseGuide";

describe("FirstCaseGuide", () => {
  it("keeps the first case guidance contextual and optional", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const onFocusEditor = vi.fn();
    const onShowData = vi.fn();

    render(
      <FirstCaseGuide
        onDismiss={onDismiss}
        onFocusEditor={onFocusEditor}
        onShowData={onShowData}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Bu vakada yalnız üç adımın var.",
      }),
    ).toBeInTheDocument();
    const steps = screen.getByRole("list", { name: "İlk vaka adımları" });
    expect(within(steps).getByText("İstenen teslimi oku")).toBeVisible();
    expect(within(steps).getByText("Veriyi incele")).toBeVisible();
    expect(within(steps).getByText("SQL’ini yaz ve çalıştır")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /Veriyi aç/i }));
    await user.click(screen.getByRole("button", { name: /SQL’e geç/i }));
    await user.click(
      screen.getByRole("button", { name: "Başlangıç rehberini kapat" }),
    );

    expect(onShowData).toHaveBeenCalledOnce();
    expect(onFocusEditor).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
