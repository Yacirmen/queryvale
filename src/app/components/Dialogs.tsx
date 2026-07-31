"use client";

import {
  ArrowRight,
  Check,
  Code2,
  Database,
  Lightbulb,
  Play,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { useEffect } from "react";
import type { LessonTask } from "../../types/lesson";

interface BaseDialogProps {
  onClose: () => void;
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [onClose]);
}

export function OnboardingDialog({
  onClose,
  onStart,
}: BaseDialogProps & { onStart: () => void }) {
  useEscape(onClose);
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="modal-card">
        <div className="modal-head">
          <div>
            <span className="modal-kicker">60 saniyelik başlangıç</span>
            <h2 id="onboarding-title">Masana hoş geldin.</h2>
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
            Her saha dosyasında iş sorusu, veri şeması ve izole bir PostgreSQL
            veritabanı bulunur. Burada ezber değil, doğru karar seti önemlidir.
          </p>
          <div className="onboarding-points">
            <div className="onboarding-point">
              <span className="onboarding-point-icon">
                <Database size={16} />
              </span>
              <span>
                <strong>Önce bağlamı ve şemayı incele</strong>
                <span>Tablo adları, kolonlar ve örnek satırlar solda.</span>
              </span>
            </div>
            <div className="onboarding-point">
              <span className="onboarding-point-icon">
                <Code2 size={16} />
              </span>
              <span>
                <strong>Kendi sorgunu kur</strong>
                <span>Farklı ama aynı sonucu veren doğru yollar kabul edilir.</span>
              </span>
            </div>
            <div className="onboarding-point">
              <span className="onboarding-point-icon">
                <Lightbulb size={16} />
              </span>
              <span>
                <strong>Takılırsan ipucunu kademeli aç</strong>
                <span>İlk ipucu yön verir; tam cevabı hemen göstermez.</span>
              </span>
            </div>
          </div>
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={onClose}>
              Daha sonra
            </button>
            <button className="primary-button" type="button" onClick={onStart}>
              Laboratuvarı hazırla <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompletionDialog({
  task,
  attempts,
  onClose,
  onNext,
}: BaseDialogProps & {
  task: LessonTask;
  attempts: number;
  onNext: () => void;
}) {
  useEscape(onClose);
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
    >
      <div className="modal-card">
        <div className="modal-head">
          <div />
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
          <div className="completion-mark" aria-hidden="true">
            <Check size={31} strokeWidth={2.4} />
          </div>
          <span className="modal-kicker">
            {attempts === 1 ? "İlk denemede çözüldü" : `${attempts} denemede çözüldü`}
          </span>
          <h2 id="completion-title">{task.completionMessage}</h2>
          <p>{task.explanation}</p>
          <div className="completion-summary">
            <strong>Bu vakadan kalan</strong>
            <p>
              {task.concepts.map((concept) => concept.replaceAll("_", " ")).join(
                " · ",
              )}
            </p>
          </div>
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={onClose}>
              Sonucu incele
            </button>
            <button className="primary-button" type="button" onClick={onNext}>
              Sonraki görev <ArrowRight size={15} />
            </button>
          </div>
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
  useEscape(onClose);
  const commands = [
    { label: "Sorguyu çalıştır", key: "⌘ ↵", icon: Play, action: onRun },
    { label: "İlerlemeyi kaydet", key: "⌘ S", icon: Save, action: onSave },
    { label: "Görevi sıfırla", key: "—", icon: RotateCcw, action: onReset },
    { label: "Şema panelini aç", key: "—", icon: Database, action: onSchema },
  ];
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-title"
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
