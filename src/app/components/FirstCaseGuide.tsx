import { ArrowRight, CheckCircle2, X } from "lucide-react";

interface FirstCaseGuideProps {
  onDismiss: () => void;
  onFocusEditor: () => void;
  onShowData: () => void;
}

export function FirstCaseGuide({
  onDismiss,
  onFocusEditor,
  onShowData,
}: FirstCaseGuideProps) {
  return (
    <section
      className="first-case-guide"
      aria-labelledby="first-case-guide-title"
    >
      <div className="first-case-guide-head">
        <div>
          <span>İlk 90 saniye</span>
          <h2 id="first-case-guide-title">Bu vakada yalnız üç adımın var.</h2>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Başlangıç rehberini kapat"
        >
          <X size={14} />
        </button>
      </div>

      <ol aria-label="İlk vaka adımları">
        <li>
          <span>1</span>
          <strong>İstenen teslimi oku</strong>
        </li>
        <li>
          <span>2</span>
          <strong>Veriyi incele</strong>
        </li>
        <li>
          <span>3</span>
          <strong>SQL’ini yaz ve çalıştır</strong>
        </li>
      </ol>

      <p>
        Doğru cevabı bilmen gerekmiyor. Takılırsan ipuçları seni adım adım
        çalışan sorguya kadar götürür.
      </p>

      <div className="first-case-guide-actions">
        <button type="button" onClick={onShowData}>
          Veriyi aç <ArrowRight size={13} />
        </button>
        <button type="button" onClick={onFocusEditor}>
          SQL’e geç <CheckCircle2 size={13} />
        </button>
      </div>
    </section>
  );
}
