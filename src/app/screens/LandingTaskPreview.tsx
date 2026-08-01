import { Clock3, Columns3 } from "lucide-react";
import type { LessonTask } from "../../types/lesson";

interface LandingTaskPreviewProps {
  task: LessonTask | undefined;
  isReturningLearner: boolean;
}

const fallbackColumns = ["product_name", "category"];

export function LandingTaskPreview({
  task,
  isReturningLearner,
}: LandingTaskPreviewProps) {
  const expectedColumns = task?.expectedColumns ?? fallbackColumns;

  return (
    <section
      className="landing-task-preview"
      aria-labelledby="landing-task-preview-title"
    >
      <header className="landing-task-preview-header">
        <span>{isReturningLearner ? "Kaldığın vaka" : "İlk vaka"}</span>
        <span>
          <Clock3 size={14} aria-hidden="true" />
          {task?.estimatedMinutes ?? 5} dk
        </span>
      </header>

      <div className="landing-task-preview-body">
        <span className="landing-task-preview-icon" aria-hidden="true">
          <Columns3 size={21} />
        </span>
        <div>
          <p>SQL çalışma masan</p>
          <h3 id="landing-task-preview-title">
            {task?.title ?? "Katalog görünümünü hazırla"}
          </h3>
        </div>
      </div>

      <p className="landing-task-preview-summary">
        {task?.subtitle ?? "İlk SELECT sorgunla doğru kolonları getir."}
      </p>

      <div className="landing-task-preview-output">
        <span>İstenen çıktı</span>
        <div>
          {expectedColumns.map((column) => (
            <code key={column}>{column}</code>
          ))}
        </div>
      </div>

      <ol
        className="landing-task-preview-steps"
        aria-label="Vakada izleyeceğin üç adım"
      >
        <li>
          <span>01</span>
          <strong>Soruyu oku</strong>
        </li>
        <li>
          <span>02</span>
          <strong>SQL’ini yaz</strong>
        </li>
        <li>
          <span>03</span>
          <strong>Sonucu doğrula</strong>
        </li>
      </ol>
    </section>
  );
}
