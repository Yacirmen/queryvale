"use client";

import {
  CircleAlert,
  CircleHelp,
  Database,
  Play,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";

interface BaseDialogProps {
  onClose: () => void;
}

const FOCUSABLE_DIALOG_ELEMENT = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getDialogFocusables(dialog: HTMLElement): HTMLElement[] {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(FOCUSABLE_DIALOG_ELEMENT),
  ).filter(
    (element) =>
      !element.hidden &&
      element.getAttribute("aria-hidden") !== "true" &&
      !element.closest("[hidden]"),
  );
}

interface DialogFocusOptions {
  active?: boolean;
  closeDisabled?: boolean;
  initialFocusSelector?: string;
}

function useDialogFocus(onClose: () => void, options: DialogFocusOptions = {}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(Boolean(options.closeDisabled));
  const initialFocusSelectorRef = useRef(options.initialFocusSelector);

  useEffect(() => {
    closeDisabledRef.current = Boolean(options.closeDisabled);
  }, [options.closeDisabled]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (options.active === false) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : undefined;
    const requestedInitialTarget = initialFocusSelectorRef.current
      ? dialog.querySelector<HTMLElement>(initialFocusSelectorRef.current)
      : undefined;
    const initialTarget =
      (requestedInitialTarget && !requestedInitialTarget.matches(":disabled")
        ? requestedInitialTarget
        : undefined) ??
      getDialogFocusables(dialog)[0] ??
      dialog;
    initialTarget.focus();

    const listener = (event: KeyboardEvent) => {
      const openDialogs = document.querySelectorAll<HTMLElement>(
        '[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]',
      );
      if (openDialogs[openDialogs.length - 1] !== dialog) return;

      if (event.key === "Escape") {
        event.preventDefault();
        if (!closeDisabledRef.current) onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = getDialogFocusables(dialog);
      if (focusables.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeElement = document.activeElement;
      if (
        event.shiftKey &&
        (activeElement === first || !dialog.contains(activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (activeElement === last || !dialog.contains(activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [options.active]);

  return dialogRef;
}

export type ConfirmationDialogTone = "neutral" | "danger";

export interface ConfirmationDialogProps {
  open?: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  cancelLabel?: string;
  busyLabel?: string;
  tone?: ConfirmationDialogTone;
  disabled?: boolean;
  busy?: boolean;
  children?: ReactNode;
}

export function ConfirmationDialog({
  open = true,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  cancelLabel = "Vazgeç",
  busyLabel = "İşlem sürüyor…",
  tone = "neutral",
  disabled = false,
  busy = false,
  children,
}: ConfirmationDialogProps) {
  const instanceId = useId();
  const titleId = `${instanceId}-confirmation-title`;
  const descriptionId = `${instanceId}-confirmation-description`;
  const dialogRef = useDialogFocus(onClose, {
    active: open,
    closeDisabled: busy,
    initialFocusSelector: "[data-dialog-cancel]",
  });
  const ToneIcon = tone === "danger" ? CircleAlert : CircleHelp;

  if (!open) return null;

  return (
    <div
      className="modal-backdrop confirmation-dialog-backdrop"
      onClick={(event) => {
        if (!busy && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={`modal-card confirmation-dialog confirmation-dialog--${tone}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={busy}
        data-tone={tone}
        tabIndex={-1}
      >
        <div className="confirmation-dialog-head">
          <span className="confirmation-dialog-tone-icon" aria-hidden="true">
            <ToneIcon size={20} />
          </span>
          <div className="confirmation-dialog-copy">
            <h2 id={titleId} className="confirmation-dialog-title">
              {title}
            </h2>
            <p id={descriptionId} className="confirmation-dialog-description">
              {description}
            </p>
          </div>
        </div>

        {children ? (
          <div className="confirmation-dialog-content">{children}</div>
        ) : null}

        <div className="confirmation-dialog-actions">
          <button
            className="confirmation-dialog-cancel"
            type="button"
            data-dialog-cancel
            disabled={busy}
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            className="confirmation-dialog-confirm"
            type="button"
            disabled={disabled || busy}
            onClick={onConfirm}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CommandDialog({
  onClose,
  onRun,
  onSave,
  onReset,
  onSchema,
}: BaseDialogProps & {
  onRun: () => void;
  onSave: () => void;
  onReset: () => void;
  onSchema: () => void;
}) {
  const dialogRef = useDialogFocus(onClose);
  const commands = [
    {
      label: "Sorguyu çalıştır",
      key: "⌘/Ctrl ↵",
      icon: Play,
      action: onRun,
    },
    {
      label: "İlerlemeyi kaydet",
      key: "⌘/Ctrl S",
      icon: Save,
      action: onSave,
    },
    { label: "Vakayı sıfırla", key: "—", icon: RotateCcw, action: onReset },
    { label: "Şema panelini aç", key: "—", icon: Database, action: onSchema },
  ];
  return (
    <div
      ref={dialogRef}
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-title"
      tabIndex={-1}
    >
      <div className="modal-card">
        <div className="modal-head">
          <div>
            <span className="modal-kicker">Hızlı eylemler</span>
            <h2 id="command-title">Komut paneli</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Kapat"
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <p>
            Çalışma alanını fareye uzanmadan yönet. Kısayollar editör
            odağındayken de çalışır.
          </p>
          <div className="command-list">
            {commands.map((command) => {
              const Icon = command.icon;
              return (
                <button
                  className="command-item"
                  type="button"
                  key={command.label}
                  onClick={() => {
                    command.action();
                    onClose();
                  }}
                >
                  <Icon size={15} />
                  {command.label}
                  <span className="keycap">{command.key}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
