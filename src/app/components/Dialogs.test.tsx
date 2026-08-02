import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmationDialog } from "./Dialogs";

const defaultProps = {
  title: "Yerel profilden çık?",
  description:
    "İlerlemen bu cihazda korunacak ve yeniden girdiğinde geri yüklenecek.",
  confirmLabel: "Çıkış yap",
  onConfirm: vi.fn(),
  onClose: vi.fn(),
};

describe("ConfirmationDialog", () => {
  it("stays unmounted while closed and initializes focus when opened", async () => {
    const { rerender } = render(
      <ConfirmationDialog {...defaultProps} open={false} />,
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    rerender(<ConfirmationDialog {...defaultProps} open />);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Vazgeç" })).toHaveFocus(),
    );
  });

  it("connects alert dialog semantics and focuses the safe action first", async () => {
    render(<ConfirmationDialog {...defaultProps} />);

    const dialog = screen.getByRole("alertdialog", {
      name: "Yerel profilden çık?",
    });
    const cancel = screen.getByRole("button", { name: "Vazgeç" });
    const description = screen.getByText(
      "İlerlemen bu cihazda korunacak ve yeniden girdiğinde geri yüklenecek.",
    );

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-describedby", description.id);
    expect(dialog).toHaveAttribute("aria-busy", "false");
    expect(dialog).toHaveAttribute("data-tone", "neutral");
    await waitFor(() => expect(cancel).toHaveFocus());
  });

  it("confirms the action and exposes a non-color danger cue", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ConfirmationDialog
        {...defaultProps}
        tone="danger"
        confirmLabel="Profili kalıcı olarak sil"
        onConfirm={onConfirm}
      />,
    );

    const dialog = screen.getByRole("alertdialog", {
      name: "Yerel profilden çık?",
    });
    expect(dialog).toHaveClass("confirmation-dialog--danger");
    expect(dialog).toHaveAttribute("data-tone", "danger");
    const toneIcon = dialog.querySelector(".confirmation-dialog-tone-icon");
    expect(toneIcon).toBeInTheDocument();
    expect(toneIcon).toHaveAttribute("aria-hidden", "true");

    await user.click(
      screen.getByRole("button", { name: "Profili kalıcı olarak sil" }),
    );
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("cancels with Escape or a direct backdrop click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <ConfirmationDialog {...defaultProps} onClose={onClose} />,
    );
    const backdrop = container.querySelector<HTMLElement>(
      ".confirmation-dialog-backdrop",
    );
    if (!backdrop) throw new Error("Confirmation backdrop was not rendered.");

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();

    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(
      screen.getByRole("heading", { name: "Yerel profilden çık?" }),
    );
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("traps forward and backward focus while keeping cancel as the initial target", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmationDialog {...defaultProps}>
        <a href="#yedek">Önce yedeği indir</a>
      </ConfirmationDialog>,
    );

    const link = screen.getByRole("link", { name: "Önce yedeği indir" });
    const cancel = screen.getByRole("button", { name: "Vazgeç" });
    const confirm = screen.getByRole("button", { name: "Çıkış yap" });
    await waitFor(() => expect(cancel).toHaveFocus());

    confirm.focus();
    await user.tab();
    expect(link).toHaveFocus();

    link.focus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
  });

  it("keeps cancellation available when disabled and locks every exit while busy", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const { container, rerender } = render(
      <ConfirmationDialog
        {...defaultProps}
        disabled
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole("button", { name: "Çıkış yap" })).toBeDisabled();
    const cancel = screen.getByRole("button", { name: "Vazgeç" });
    expect(cancel).toBeEnabled();
    await user.click(cancel);
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();

    onClose.mockClear();
    rerender(
      <ConfirmationDialog
        {...defaultProps}
        busy
        busyLabel="Profil kapatılıyor…"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole("alertdialog")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Profil kapatılıyor…" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Vazgeç" })).toBeDisabled();

    await user.keyboard("{Escape}");
    const backdrop = container.querySelector<HTMLElement>(
      ".confirmation-dialog-backdrop",
    );
    if (!backdrop) throw new Error("Confirmation backdrop was not rendered.");
    fireEvent.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
