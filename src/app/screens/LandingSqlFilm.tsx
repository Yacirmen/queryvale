"use client";

import { ArrowRight, CheckCircle2, Database, Table2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLandingSqlStory } from "./useLandingSqlStory";

interface LandingResultColumn {
  key: string;
  label: string;
}

interface LandingSqlScene {
  description: string;
  eyebrow: string;
  id: string;
  insight: string;
  label: string;
  query: string;
  result: {
    columns: readonly LandingResultColumn[];
    rows: readonly Record<string, number | string>[];
    summary: string;
  };
  title: string;
}

const sql = (value: string) => value.trim();

export const landingSqlScenes = [
  {
    id: "fetch",
    label: "Getir",
    eyebrow: "01 · Doğru kapsam",
    title: "Önce doğru tabloyu gör.",
    description:
      "Basit bir SELECT ile analizde kimlerin yer alacağını netleştir.",
    insight: "3 şube · kapsam hazır",
    query: sql(`
SELECT branch_name
FROM branch_directory
ORDER BY branch_id;
    `),
    result: {
      columns: [{ key: "branch_name", label: "branch_name" }],
      rows: [
        { branch_name: "Istanbul Hub" },
        { branch_name: "Ankara Hub" },
        { branch_name: "Izmir Hub" },
      ],
      summary: "Bütün şubeler sonuçta; eksik kapsam yok.",
    },
  },
  {
    id: "compare",
    label: "Karşılaştır",
    eyebrow: "02 · Hedef ve gerçekleşen",
    title: "Sorguya iş bağlamını ekle.",
    description:
      "Hedefi satışla birleştir; satış yapmayan şubeyi de raporda tut.",
    insight: "İzmir · 0 satışla görünür",
    query: sql(`
SELECT
  b.branch_name,
  t.target_amount,
  COALESCE(SUM(s.amount), 0) AS actual_amount
FROM branch_directory b
INNER JOIN sales_targets t
  ON t.branch_id = b.branch_id
 AND t.target_month = '2026-05'
LEFT JOIN sales_ledger s
  ON s.branch_id = b.branch_id
 AND s.sale_month = '2026-05'
GROUP BY b.branch_id, b.branch_name, t.target_amount
ORDER BY actual_amount DESC, b.branch_name;
    `),
    result: {
      columns: [
        { key: "branch_name", label: "branch_name" },
        { key: "target_amount", label: "target" },
        { key: "actual_amount", label: "actual" },
      ],
      rows: [
        {
          branch_name: "Istanbul Hub",
          target_amount: 10000,
          actual_amount: 9500,
        },
        {
          branch_name: "Ankara Hub",
          target_amount: 8000,
          actual_amount: 8200,
        },
        {
          branch_name: "Izmir Hub",
          target_amount: 6000,
          actual_amount: 0,
        },
      ],
      summary: "Hedef ile gerçekleşen artık aynı karar setinde.",
    },
  },
  {
    id: "decide",
    label: "Karara dönüştür",
    eyebrow: "03 · Yönetici sinyali",
    title: "Sonucu karara dönüştür.",
    description:
      "CTE, oran, sıralama ve CASE ile her şube için açık bir sonraki adım üret.",
    insight: "1 hedefte · 1 takip · 1 aksiyon",
    query: sql(`
WITH branch_performance AS (
  SELECT
    b.branch_name,
    t.target_amount,
    COALESCE(SUM(s.amount), 0) AS actual_amount
  FROM branch_directory b
  INNER JOIN sales_targets t
    ON t.branch_id = b.branch_id
   AND t.target_month = '2026-05'
  LEFT JOIN sales_ledger s
    ON s.branch_id = b.branch_id
   AND s.sale_month = '2026-05'
  GROUP BY b.branch_id, b.branch_name, t.target_amount
)
SELECT
  branch_name,
  ROUND(actual_amount * 100.0 / NULLIF(target_amount, 0), 2)
    AS achievement_rate,
  DENSE_RANK() OVER (
    ORDER BY actual_amount * 100.0 / NULLIF(target_amount, 0) DESC
  ) AS performance_rank,
  CASE
    WHEN actual_amount >= target_amount THEN 'Hedefte'
    WHEN actual_amount * 100.0 / NULLIF(target_amount, 0) >= 90
      THEN 'Yakın takip'
    ELSE 'Aksiyon gerekli'
  END AS decision_signal
FROM branch_performance
ORDER BY performance_rank, branch_name;
    `),
    result: {
      columns: [
        { key: "branch_name", label: "branch_name" },
        { key: "achievement_rate", label: "rate" },
        { key: "performance_rank", label: "rank" },
        { key: "decision_signal", label: "decision_signal" },
      ],
      rows: [
        {
          branch_name: "Ankara Hub",
          achievement_rate: 102.5,
          performance_rank: 1,
          decision_signal: "Hedefte",
        },
        {
          branch_name: "Istanbul Hub",
          achievement_rate: 95,
          performance_rank: 2,
          decision_signal: "Yakın takip",
        },
        {
          branch_name: "Izmir Hub",
          achievement_rate: 0,
          performance_rank: 3,
          decision_signal: "Aksiyon gerekli",
        },
      ],
      summary: "Sorgu doğrulandı; karar seti hazır.",
    },
  },
] as const satisfies readonly LandingSqlScene[];

const SQL_KEYWORDS = new Set([
  "AND",
  "AS",
  "BY",
  "CASE",
  "DESC",
  "ELSE",
  "END",
  "FROM",
  "GROUP",
  "INNER",
  "JOIN",
  "LEFT",
  "ON",
  "ORDER",
  "OVER",
  "SELECT",
  "THEN",
  "WHEN",
  "WITH",
]);

const SQL_FUNCTIONS = new Set([
  "COALESCE",
  "DENSE_RANK",
  "NULLIF",
  "ROUND",
  "SUM",
]);

function highlightSqlLine(line: string): ReactNode[] {
  const tokens = line.split(
    /(--.*|'(?:''|[^'])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b)/g,
  );

  return tokens.map((token, index) => {
    const upperToken = token.toUpperCase();
    let className: string | undefined;
    if (token.startsWith("--")) className = "sql-token-comment";
    else if (token.startsWith("'")) className = "sql-token-string";
    else if (/^\d/.test(token)) className = "sql-token-number";
    else if (SQL_KEYWORDS.has(upperToken)) className = "sql-token-keyword";
    else if (SQL_FUNCTIONS.has(upperToken)) className = "sql-token-function";

    return className ? (
      <span className={className} key={`${token}-${index}`}>
        {token}
      </span>
    ) : (
      token
    );
  });
}

function formatResultValue(column: string, value: number | string) {
  if (column === "achievement_rate") {
    return `%${Number(value).toLocaleString("tr-TR", {
      maximumFractionDigits: 2,
    })}`;
  }
  if (column === "performance_rank") return `#${value}`;
  if (column.endsWith("_amount")) {
    return `₺${Number(value).toLocaleString("tr-TR", {
      maximumFractionDigits: 0,
    })}`;
  }
  return value;
}

interface LandingSqlFilmProps {
  isReturningLearner: boolean;
  onStart: () => void;
  resumeTaskTitle?: string;
}

export function LandingSqlFilm({
  isReturningLearner,
  onStart,
  resumeTaskTitle,
}: LandingSqlFilmProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStepRef = useRef(0);
  const trackRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleStoryStepChange = useCallback((nextIndex: number) => {
    activeStepRef.current = nextIndex;
    setActiveIndex(nextIndex);
  }, []);

  const { isCinematic, scrollToStep } = useLandingSqlStory({
    activeStepRef,
    onStepChange: handleStoryStepChange,
    stageRef,
    trackRef,
  });

  const activeScene = landingSqlScenes[activeIndex] ?? landingSqlScenes[0];
  const isComplete = activeIndex === landingSqlScenes.length - 1;

  const activateScene = (index: number, moveFocus = false) => {
    const boundedIndex = Math.max(
      0,
      Math.min(landingSqlScenes.length - 1, index),
    );
    handleStoryStepChange(boundedIndex);
    scrollToStep(boundedIndex);
    if (moveFocus) tabRefs.current[boundedIndex]?.focus();
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % landingSqlScenes.length;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex =
        (index - 1 + landingSqlScenes.length) % landingSqlScenes.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = landingSqlScenes.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    activateScene(nextIndex, true);
  };

  const queryLines = activeScene.query.split("\n");

  return (
    <section
      ref={trackRef}
      className="landing-sql-film"
      aria-labelledby="landing-sql-film-title"
    >
      <div
        ref={stageRef}
        className="landing-sql-film-shell"
        data-active-scene={activeScene.id}
        data-complete={isComplete}
        data-scroll-mode={isCinematic ? "cinematic" : "manual"}
      >
        <div className="landing-sql-film-atmosphere" aria-hidden="true">
          <span className="landing-sql-film-glow" />
          <span className="landing-sql-film-grid" />
        </div>

        <header className="landing-sql-film-header">
          <div className="landing-sql-film-heading">
            <p>
              <span aria-hidden="true" /> QUERYVALE · CANLI ANALİZ AKIŞI
            </p>
            <h1 id="landing-sql-film-title">
              Sorgu büyüdükçe <span>karar netleşir.</span>
            </h1>
          </div>
          <div className="landing-sql-film-scene-copy" key={activeScene.id}>
            <span>{activeScene.eyebrow}</span>
            <h2>{activeScene.title}</h2>
            <p>{activeScene.description}</p>
          </div>
        </header>

        <div
          className="landing-sql-film-tabs"
          role="tablist"
          aria-label="SQL hikâyesinin üç adımı"
        >
          {landingSqlScenes.map((scene, index) => (
            <button
              id={`landing-sql-film-tab-${scene.id}`}
              key={scene.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              aria-selected={activeScene.id === scene.id}
              aria-controls="landing-sql-film-panel"
              aria-label={`${index + 1}. adım: ${scene.label}`}
              tabIndex={activeScene.id === scene.id ? 0 : -1}
              onClick={() => activateScene(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{scene.label}</strong>
              <i aria-hidden="true" />
            </button>
          ))}
        </div>

        <div
          id="landing-sql-film-panel"
          className="landing-sql-film-workbench"
          role="tabpanel"
          aria-labelledby={`landing-sql-film-tab-${activeScene.id}`}
        >
          <article className="landing-sql-editor" aria-label="SQL editörü">
            <div className="landing-sql-editor-bar">
              <span>
                <i /> branch_performance.sql
              </span>
              <strong>
                <Database size={13} /> PostgreSQL · motor testli
              </strong>
            </div>
            <pre
              className="landing-sql-code"
              aria-label={`${activeScene.label} adımının SQL sorgusu`}
              data-lenis-prevent-wheel
            >
              <code key={activeScene.id}>
                {queryLines.map((line, lineIndex) => (
                  <span
                    className="landing-sql-code-line"
                    data-line={lineIndex + 1}
                    key={`${activeScene.id}-${lineIndex}`}
                    style={{ animationDelay: `${lineIndex * 14}ms` }}
                  >
                    {highlightSqlLine(line)}
                    {"\n"}
                  </span>
                ))}
              </code>
            </pre>
            <div className="landing-sql-editor-result">
              <span>
                <CheckCircle2 size={14} /> Sorgu çalıştı
              </span>
              <strong>{activeScene.insight}</strong>
            </div>
          </article>

          <aside
            className="landing-sql-result"
            aria-label="Görsel sonuç paneli"
          >
            <div className="landing-sql-result-bar">
              <span>
                <Table2 size={14} /> Görsel sonuç
              </span>
              <strong>{activeScene.result.rows.length} satır</strong>
            </div>
            <div className="landing-sql-result-table-wrap" data-lenis-prevent>
              <table
                key={activeScene.id}
                aria-label={`${activeScene.label} adımının sorgu sonucu`}
              >
                <caption className="sr-only">
                  {activeScene.result.summary}
                </caption>
                <thead>
                  <tr>
                    {activeScene.result.columns.map((column) => (
                      <th scope="col" key={column.key}>
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeScene.result.rows.map((row, rowIndex) => (
                    <tr key={`${activeScene.id}-${rowIndex}`}>
                      {activeScene.result.columns.map((column) => (
                        <td key={column.key}>
                          {formatResultValue(
                            column.key,
                            (row as Readonly<Record<string, number | string>>)[
                              column.key
                            ] ?? "",
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="landing-sql-result-summary">
              <span className="landing-sql-result-pulse" aria-hidden="true" />
              <p>{activeScene.result.summary}</p>
              {isComplete ? (
                <strong>
                  <CheckCircle2 size={14} /> Sorgu doğrulandı
                </strong>
              ) : null}
            </div>
          </aside>
        </div>

        <div className="landing-sql-film-footer">
          <div className="landing-sql-film-status">
            <span>{String(activeIndex + 1).padStart(2, "0")} / 03</span>
            <p>
              {isComplete
                ? "Karar setin hazır. Şimdi gerçek vakaya geç."
                : isCinematic
                  ? "Kaydır · aynı sorgu büyüsün"
                  : "Adımları seç · sorguyu büyüt"}
            </p>
          </div>
          <button
            className="landing-sql-film-start"
            data-emphasis={isComplete}
            title={
              isReturningLearner && resumeTaskTitle
                ? `Son konumun: ${resumeTaskTitle}`
                : undefined
            }
            type="button"
            onClick={onStart}
          >
            {isReturningLearner
              ? "Kaldığın vakaya devam et"
              : "İlk vakaya başla"}
            <ArrowRight size={16} />
          </button>
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {`${activeIndex + 1}. adım, ${activeScene.label}. ${activeScene.result.summary}`}
        </p>
      </div>
    </section>
  );
}
