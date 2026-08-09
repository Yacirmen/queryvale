"use client";

import {
  Check,
  CheckCircle2,
  Lightbulb,
  NotebookPen,
  Save,
  ShieldCheck,
  Target,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import type { LessonTask } from "../../types/lesson";
import {
  HINT_SCORE_PENALTY,
  MAX_CASE_SCORE,
} from "../../features/progress/scoring";

interface EvidenceNote {
  finding: string;
  recommendation: string;
  caveat?: string;
  updatedAt: string;
}

interface CompletionEvidence {
  verifiedRun: {
    columns: string[];
    rowCount: number;
    verifiedAt: string;
  };
  note?: EvidenceNote;
}

export interface ResultCompletionNoteInput {
  finding: string;
  recommendation: string;
  caveat?: string;
}

interface ResultCompletionProps {
  task: LessonTask;
  attempts: number;
  rowCount: number;
  scoreAwarded: number;
  evidence?: CompletionEvidence;
  onSaveNote: (note: ResultCompletionNoteInput) => void;
}

export function ResultCompletion({
  task,
  attempts,
  rowCount,
  scoreAwarded,
  evidence,
  onSaveNote,
}: ResultCompletionProps) {
  const [finding, setFinding] = useState(evidence?.note?.finding ?? "");
  const [recommendation, setRecommendation] = useState(
    evidence?.note?.recommendation ?? "",
  );
  const [caveat, setCaveat] = useState(evidence?.note?.caveat ?? "");
  const [noteError, setNoteError] = useState<string>();
  const [noteStatus, setNoteStatus] = useState<string>();
  const attemptLabel = attempts <= 1 ? "ilk deneme" : `${attempts} deneme`;
  const scoreHintCount =
    scoreAwarded > 0
      ? Math.round((MAX_CASE_SCORE - scoreAwarded) / HINT_SCORE_PENALTY)
      : 0;
  const scoreExplanation =
    scoreAwarded === 0
      ? "Tam çözüm ilk doğrulamadan önce açıldı · puan kilitlendi"
      : scoreHintCount === 0
        ? "Yardım almadan tamamlandı · ilk doğrulamada kilitlendi"
        : `${MAX_CASE_SCORE} başlangıç − ${scoreHintCount} ipucu × ${HINT_SCORE_PENALTY} = ${scoreAwarded} · ilk doğrulamada kilitlendi`;
  const normalizedDraft = useMemo(
    () => ({
      finding: finding.trim(),
      recommendation: recommendation.trim(),
      caveat: caveat.trim(),
    }),
    [caveat, finding, recommendation],
  );
  const noteIsDirty = Boolean(
    evidence?.note &&
    (normalizedDraft.finding !== evidence.note.finding ||
      normalizedDraft.recommendation !== evidence.note.recommendation ||
      normalizedDraft.caveat !== (evidence.note.caveat ?? "")),
  );

  const saveNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNoteError(undefined);
    setNoteStatus(undefined);

    if (!normalizedDraft.finding || !normalizedDraft.recommendation) {
      setNoteError("Bulgu ve öneri alanlarını doldurmalısın.");
      return;
    }

    try {
      onSaveNote({
        finding: normalizedDraft.finding,
        recommendation: normalizedDraft.recommendation,
        caveat: normalizedDraft.caveat || undefined,
      });
      setNoteStatus(
        evidence?.note
          ? "Karar notu güncellendi."
          : "Karar notu Kanıt Defteri’ne kaydedildi.",
      );
    } catch (error) {
      setNoteError(
        error instanceof Error
          ? error.message
          : "Karar notu bu cihazda kaydedilemedi.",
      );
    }
  };

  return (
    <section
      className="result-completion"
      role="region"
      aria-labelledby={`${task.id}-completion-title`}
      data-testid="completion-panel"
    >
      <span className="sr-only" role="status">
        Vaka doğrulandı. {rowCount} satır döndü.{" "}
        {scoreAwarded > 0
          ? "Bu vakadan " + scoreAwarded + " analiz puanı kazandın."
          : "Tam çözüm kullanıldığı için bu vakadan analiz puanı kazanılmadı."}{" "}
        Sonuç ekranda kalır; devam etmek senin seçimin.
      </span>

      <div className="result-completion-head">
        <span className="result-completion-mark" aria-hidden="true">
          <CheckCircle2 size={18} />
        </span>
        <div className="result-completion-copy">
          <span className="result-completion-meta">
            Vaka doğrulandı · {rowCount} satır · {attemptLabel}
          </span>
          <h3 id={`${task.id}-completion-title`}>{task.completionMessage}</h3>
        </div>
        <div
          className={`result-score-badge ${scoreAwarded === 0 ? "assisted" : ""}`}
          aria-label={`Vaka puanı ${scoreAwarded}/${MAX_CASE_SCORE}`}
        >
          <Target size={15} aria-hidden="true" />
          <span>
            <strong>
              {scoreAwarded > 0 ? `+${scoreAwarded}` : "0"} analiz puanı
            </strong>
            <small>{scoreExplanation}</small>
          </span>
        </div>
      </div>

      <div
        className="result-verification-strip"
        aria-label="Doğrulanan çıktı kontrolleri"
      >
        <span>
          <Check size={13} aria-hidden="true" />
          {task.expectedColumns.length} kolon doğru
        </span>
        <span>
          <Check size={13} aria-hidden="true" /> {rowCount} satır doğru
        </span>
        <span>
          <Check size={13} aria-hidden="true" /> İş kuralı karşılandı
        </span>
        <span>
          <ShieldCheck size={13} aria-hidden="true" />
          {evidence ? "Kanıt doğrulandı" : "Kanıt hazırlanıyor"}
        </span>
      </div>

      <details className="result-completion-details">
        <summary>
          <NotebookPen size={14} aria-hidden="true" />
          {evidence?.note ? "Karar notunu görüntüle" : "Karar notu ekle"}
          <span>
            {evidence?.note
              ? "Kanıt Defteri’nde"
              : "Kanıt Defteri · isteğe bağlı"}
          </span>
        </summary>
        <form
          className="analyst-note-composer"
          aria-labelledby={`${task.id}-analyst-note-title`}
          onSubmit={saveNote}
        >
          <div className="analyst-note-heading">
            <span className="analyst-note-icon" aria-hidden="true">
              <NotebookPen size={17} />
            </span>
            <div>
              <span className="analyst-note-kicker">Analist pratiği</span>
              <h4 id={`${task.id}-analyst-note-title`}>
                Çıktıyı bir karara dönüştür
              </h4>
            </div>
          </div>

          <p className="analyst-note-intro">
            Tabloyu incele ve paydaşa söyleyeceğin özü kendi cümlenle yaz. Sorgu
            ile çıktı doğrulandı; yorumun otomatik puanlanmaz.
          </p>

          <div className="analyst-note-fields">
            <label>
              <span>Bulgu</span>
              <small>Bu çıktı iş sorusu hakkında ne söylüyor?</small>
              <textarea
                value={finding}
                maxLength={600}
                rows={3}
                placeholder="Sonuçtaki en önemli örüntüyü veya farkı tek cümleyle yaz."
                onChange={(event) => {
                  setFinding(event.target.value);
                  setNoteError(undefined);
                  setNoteStatus(undefined);
                }}
              />
            </label>
            <label>
              <span>Öneri</span>
              <small>Bu bulguya göre hangi eylem alınmalı?</small>
              <textarea
                value={recommendation}
                maxLength={600}
                rows={3}
                placeholder="Bu bulguya göre alınacak somut bir sonraki adımı yaz."
                onChange={(event) => {
                  setRecommendation(event.target.value);
                  setNoteError(undefined);
                  setNoteStatus(undefined);
                }}
              />
            </label>
          </div>

          <details className="analyst-note-caveat">
            <summary>Varsayım veya veri çekincesi ekle</summary>
            <label>
              <span className="sr-only">Varsayım veya veri çekincesi</span>
              <textarea
                value={caveat}
                maxLength={400}
                rows={2}
                placeholder="Örn. Bu yorum yalnız mevcut stok anlık görüntüsüne dayanıyor; satış hızı hesaba katılmadı."
                onChange={(event) => {
                  setCaveat(event.target.value);
                  setNoteError(undefined);
                  setNoteStatus(undefined);
                }}
              />
            </label>
          </details>

          <div className="analyst-note-footer">
            <span>
              {rowCount} doğrulanmış satır · {task.expectedColumns.length} kolon
            </span>
            <button
              className="analyst-note-save"
              type="submit"
              disabled={!evidence || Boolean(evidence.note && !noteIsDirty)}
            >
              {evidence?.note && !noteIsDirty ? (
                <>
                  <CheckCircle2 size={14} /> Kanıt Defteri’nde
                </>
              ) : (
                <>
                  <Save size={14} />
                  {evidence?.note ? "Notu güncelle" : "Kanıta ekle"}
                </>
              )}
            </button>
          </div>
          {noteError && (
            <p className="analyst-note-error" role="alert">
              {noteError}
            </p>
          )}
          {noteStatus && (
            <p className="analyst-note-status" role="status">
              {noteStatus}
            </p>
          )}
        </form>
      </details>

      <details className="result-completion-details">
        <summary>
          <Lightbulb size={14} aria-hidden="true" />
          Çözümü incele
          <span>İsteğe bağlı</span>
        </summary>
        <div className="result-completion-details-body">
          <p>{task.explanation}</p>

          <section aria-labelledby={`${task.id}-solution-logic`}>
            <h4 id={`${task.id}-solution-logic`}>Bu vakanın temel mantığı</h4>
            <ol className="result-completion-steps">
              {task.debrief.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <div className="result-completion-insights">
            <section>
              <strong>Neden çalışır?</strong>
              <p>{task.debrief.whyItWorks}</p>
            </section>
            <section>
              <strong>İş etkisi</strong>
              <p>{task.debrief.workplaceImpact}</p>
            </section>
          </div>

          <details className="result-completion-subdetails">
            <summary>
              Dikkat edilecek durumlar
              <span>{task.debrief.edgeCases.length}</span>
            </summary>
            <ul>
              {task.debrief.edgeCases.map((edgeCase) => (
                <li key={edgeCase}>{edgeCase}</li>
              ))}
            </ul>
          </details>

          <details className="result-completion-subdetails">
            <summary>Aktarım sorusu</summary>
            <div className="result-completion-transfer">
              <p>{task.debrief.transfer.prompt}</p>
              <details>
                <summary>Yaklaşımı karşılaştır</summary>
                <p>{task.debrief.transfer.reveal}</p>
              </details>
            </div>
          </details>
        </div>
      </details>

      <div className="result-completion-actions">
        <span>
          Sonuç ekranda kalır. Karar notunu yazabilir; hazır olduğunda aşağıdaki
          vaka gezintisinden devam edebilirsin.
        </span>
      </div>
    </section>
  );
}
