"use client";

import { Database, Play, RotateCcw, Save, X } from "lucide-react";
import { useEffect, useRef } from "react";

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

function useDialogFocus(onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : undefined;
    const initialTarget = getDialogFocusables(dialog)[0] ?? dialog;
    initialTarget.focus();

    const listener = (event: KeyboardEvent) => {
      const openDialogs = document.querySelectorAll<HTMLElement>(
        '[role="dialog"][aria-modal="true"]',
      );
      if (openDialogs[openDialogs.length - 1] !== dialog) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
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
  }, []);

  return dialogRef;
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
