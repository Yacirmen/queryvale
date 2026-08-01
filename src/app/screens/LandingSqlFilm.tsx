"use client";

import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  SkipForward,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  getLandingIntroFrame,
  getLandingIntroProgressForScene,
  type LandingIntroFrame,
} from "./landingIntroFrame";
import { withInstantRootScroll } from "./instantScroll";

interface LandingSqlScene {
  description: string;
  eyebrow: string;
  id: string;
  insight: string;
  label: string;
  query: string;
  title: string;
}

const sql = (value: string) => value.trim();

export const landingSqlScenes = [
  {
    id: "scope",
    label: "Kapsam",
    eyebrow: "01 · Önce bütünü gör",
    title: "Her iyi analiz, doğru kümeyle başlar.",
    description:
      "Önce masadaki bütün şubeleri gör. Henüz hesap yok; yalnızca kimi raporda tutman gerektiğini netleştiriyorsun.",
    insight: "3 şube · kapsam eksiksiz",
    query: sql(`
SELECT branch_id, branch_name
FROM branch_directory
ORDER BY branch_id;
    `),
  },
  {
    id: "target",
    label: "Hedef",
    eyebrow: "02 · Beklentiyi bağla",
    title: "Bir sayı, bağlamı gelince anlam kazanır.",
    description:
      "Şubeleri Mayıs hedefleriyle eşleştir. Artık yalnız kimlerin olduğunu değil, her birinden ne beklendiğini de biliyorsun.",
    insight: "Mayıs hedefleri şubelere bağlandı",
    query: sql(`
SELECT
  b.branch_name,
  t.target_amount
FROM branch_directory b
INNER JOIN sales_targets t
  ON t.branch_id = b.branch_id
 AND t.target_month = '2026-05'
ORDER BY b.branch_id;
    `),
  },
  {
    id: "actual",
    label: "Gerçekleşen",
    eyebrow: "03 · Olanı hesapla",
    title: "Sessiz kalan satırı da raporda tut.",
    description:
      "Satışları şube düzeyinde topla. LEFT JOIN sayesinde o ay hiç satışı olmayan İzmir kaybolmaz; sıfır da işin parçası olarak görünür.",
    insight: "İzmir · 0 satışla raporda kaldı",
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
  },
  {
    id: "status",
    label: "Durum",
    eyebrow: "04 · Sonucu açıkla",
    title: "Hesabı, herkesin okuyacağı bir karara çevir.",
    description:
      "Gerçekleşme oranını güvenle hesapla; CASE ile sayının ne söylediğini açıkça adlandır. SQL artık yalnız veri getirmiyor, durumu anlatıyor.",
    insight: "Ankara · %102,50 · Hedefte",
    query: sql(`
SELECT
  b.branch_name,
  t.target_amount,
  COALESCE(SUM(s.amount), 0) AS actual_amount,
  ROUND(
    COALESCE(SUM(s.amount), 0) * 100.0 /
    NULLIF(t.target_amount, 0), 2
  ) AS achievement_rate,
  CASE
    WHEN COALESCE(SUM(s.amount), 0) >= t.target_amount
      THEN 'Hedefte'
    ELSE 'Geride'
  END AS target_status
FROM branch_directory b
INNER JOIN sales_targets t
  ON t.branch_id = b.branch_id
 AND t.target_month = '2026-05'
LEFT JOIN sales_ledger s
  ON s.branch_id = b.branch_id
 AND s.sale_month = '2026-05'
GROUP BY b.branch_id, b.branch_name, t.target_amount
ORDER BY achievement_rate DESC, b.branch_name;
    `),
  },
  {
    id: "compare",
    label: "Kıyas",
    eyebrow: "05 · Birbirine göre gör",
    title: "Tek bir başarıyı, ağın tamamıyla kıyasla.",
    description:
      "CTE hesabı okunur tutar; window fonksiyonları her şubeyi sıralarken ağ ortalamasını aynı sonuçta korur.",
    insight: "Ağ ortalaması · %65,83",
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
      NULLS LAST
  ) AS performance_rank,
  ROUND(AVG(
    actual_amount * 100.0 / NULLIF(target_amount, 0)
  ) OVER (), 2) AS network_avg_rate
FROM branch_performance
ORDER BY performance_rank, branch_name;
    `),
  },
  {
    id: "decision",
    label: "Karar",
    eyebrow: "06 · Yönetici sinyali",
    title: "Ve sorgu, konuşabileceğin bir karara dönüşür.",
    description:
      "Final sorgu hedefi, gerçekleşeni, sıralamayı ve ağ ortalamasını tek bir karar setinde buluşturur. Uzun olduğu için değil; her satırı bir soruyu çözdüğü için güçlüdür.",
    insight: "1 hedefte · 1 yakın takip · 1 aksiyon",
    query: sql(`
WITH branch_performance AS (
  SELECT b.branch_name, t.target_amount,
    COALESCE(SUM(s.amount), 0) AS actual_amount
  FROM branch_directory b
  INNER JOIN sales_targets t
    ON t.branch_id = b.branch_id AND t.target_month = '2026-05'
  LEFT JOIN sales_ledger s
    ON s.branch_id = b.branch_id AND s.sale_month = '2026-05'
  GROUP BY b.branch_id, b.branch_name, t.target_amount
),
scored AS (
  SELECT branch_name, target_amount, actual_amount,
    actual_amount * 100.0 / NULLIF(target_amount, 0)
      AS achievement_rate,
    DENSE_RANK() OVER (
      ORDER BY actual_amount * 100.0 / NULLIF(target_amount, 0) DESC
        NULLS LAST
    ) AS performance_rank,
    AVG(actual_amount * 100.0 / NULLIF(target_amount, 0)) OVER ()
      AS network_avg_rate
  FROM branch_performance
)
SELECT branch_name, target_amount, actual_amount,
  ROUND(achievement_rate, 2) AS achievement_rate,
  performance_rank,
  ROUND(network_avg_rate, 2) AS network_avg_rate,
  CASE
    WHEN actual_amount >= target_amount THEN 'Hedefte'
    WHEN achievement_rate >= network_avg_rate THEN 'Yakın takip'
    ELSE 'Aksiyon gerekli'
  END AS decision_signal
FROM scored
ORDER BY performance_rank, branch_name;
    `),
  },
] as const satisfies readonly LandingSqlScene[];

const SQL_KEYWORDS = new Set([
  "AND",
  "AS",
  "ASC",
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
  "AVG",
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

interface LandingSqlFilmProps {
  isReturningLearner: boolean;
  onContinue: () => void;
  onStart: () => void;
}

interface FilmLayerPair {
  fromIndex: number;
  toIndex: number;
}

const CINEMATIC_MEDIA_QUERY =
  "(min-width: 1100px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)";

export function LandingSqlFilm({
  isReturningLearner,
  onContinue,
  onStart,
}: LandingSqlFilmProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCinematic, setIsCinematic] = useState(false);
  const [layerPair, setLayerPair] = useState<FilmLayerPair>({
    fromIndex: 0,
    toIndex: 0,
  });
  const trackRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const frameRefs = useRef<Array<HTMLElement | null>>([]);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndexRef = useRef(0);
  const cinematicRef = useRef(false);
  const layerPairRef = useRef<FilmLayerPair>(layerPair);
  const latestFrameRef = useRef<LandingIntroFrame>(
    getLandingIntroFrame(0, landingSqlScenes.length),
  );
  const activeScene = landingSqlScenes[activeIndex] ?? landingSqlScenes[0];

  const applyFrameToLayers = useCallback((frame: LandingIntroFrame) => {
    const currentLayer = frameRefs.current[frame.fromIndex];
    const nextLayer = frameRefs.current[frame.toIndex];
    const hasNextLayer = frame.fromIndex !== frame.toIndex;

    if (currentLayer) {
      currentLayer.style.setProperty(
        "--film-frame-opacity",
        String(hasNextLayer ? 1 - frame.mix : 1),
      );
      currentLayer.style.setProperty(
        "--film-frame-shift",
        `${-8 * frame.mix}px`,
      );
    }

    if (hasNextLayer && nextLayer) {
      nextLayer.style.setProperty("--film-frame-opacity", String(frame.mix));
      nextLayer.style.setProperty(
        "--film-frame-shift",
        `${10 * (1 - frame.mix)}px`,
      );
    }
  }, []);

  const commitFrame = useCallback(
    (frame: LandingIntroFrame) => {
      latestFrameRef.current = frame;
      stageRef.current?.style.setProperty(
        "--film-progress",
        frame.progress.toFixed(4),
      );

      if (
        layerPairRef.current.fromIndex !== frame.fromIndex ||
        layerPairRef.current.toIndex !== frame.toIndex
      ) {
        const nextPair = {
          fromIndex: frame.fromIndex,
          toIndex: frame.toIndex,
        };
        layerPairRef.current = nextPair;
        setLayerPair(nextPair);
      }

      if (activeIndexRef.current !== frame.activeIndex) {
        activeIndexRef.current = frame.activeIndex;
        setActiveIndex(frame.activeIndex);
      }

      applyFrameToLayers(frame);
    },
    [applyFrameToLayers],
  );

  useEffect(() => {
    applyFrameToLayers(latestFrameRef.current);
  }, [applyFrameToLayers, layerPair]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia(CINEMATIC_MEDIA_QUERY);
    const root = document.documentElement;
    let animationFrame: number | null = null;
    let listening = false;
    let startScroll = 0;
    let travelDistance = 1;

    const renderScrollFrame = () => {
      animationFrame = null;
      if (!cinematicRef.current) return;
      commitFrame(
        getLandingIntroFrame(
          (window.scrollY - startScroll) / travelDistance,
          landingSqlScenes.length,
        ),
      );
    };

    const scheduleScrollFrame = () => {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(renderScrollFrame);
    };

    const measureTrack = () => {
      if (!cinematicRef.current) return;
      const rootStyles = window.getComputedStyle(root);
      const headerHeight =
        Number.parseFloat(rootStyles.getPropertyValue("--header-h")) || 0;
      const trackTop = window.scrollY + track.getBoundingClientRect().top;
      const stageHeight = Math.max(1, window.innerHeight - headerHeight);
      startScroll = trackTop - headerHeight;
      travelDistance = Math.max(1, track.offsetHeight - stageHeight);
      scheduleScrollFrame();
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measureTrack);

    const stopListening = () => {
      if (!listening) return;
      listening = false;
      window.removeEventListener("scroll", scheduleScrollFrame);
      window.removeEventListener("resize", measureTrack);
      resizeObserver?.disconnect();
    };

    const startListening = () => {
      if (listening) return;
      listening = true;
      window.addEventListener("scroll", scheduleScrollFrame, { passive: true });
      window.addEventListener("resize", measureTrack);
      resizeObserver?.observe(track);
      measureTrack();
    };

    const syncCinematicMode = () => {
      const nextMode =
        mediaQuery.matches && root.dataset.reducedMotion !== "true";
      cinematicRef.current = nextMode;
      setIsCinematic(nextMode);

      if (nextMode) {
        startListening();
        measureTrack();
        return;
      }

      stopListening();
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      const preservedIndex = activeIndexRef.current;
      commitFrame({
        activeIndex: preservedIndex,
        fromIndex: preservedIndex,
        mix: 0,
        progress: getLandingIntroProgressForScene(
          preservedIndex,
          landingSqlScenes.length,
        ),
        toIndex: preservedIndex,
      });
    };

    const motionPreferenceObserver = new MutationObserver(syncCinematicMode);
    motionPreferenceObserver.observe(root, {
      attributeFilter: ["data-reduced-motion"],
      attributes: true,
    });
    mediaQuery.addEventListener?.("change", syncCinematicMode);
    syncCinematicMode();

    return () => {
      stopListening();
      motionPreferenceObserver.disconnect();
      mediaQuery.removeEventListener?.("change", syncCinematicMode);
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [commitFrame]);

  const activateScene = (index: number, moveFocus = false) => {
    const boundedIndex = Math.max(
      0,
      Math.min(landingSqlScenes.length - 1, index),
    );

    if (cinematicRef.current && trackRef.current) {
      const track = trackRef.current;
      const rootStyles = window.getComputedStyle(document.documentElement);
      const headerHeight =
        Number.parseFloat(rootStyles.getPropertyValue("--header-h")) || 0;
      const trackTop = window.scrollY + track.getBoundingClientRect().top;
      const stageHeight = Math.max(1, window.innerHeight - headerHeight);
      const travelDistance = Math.max(1, track.offsetHeight - stageHeight);
      const sceneProgress = getLandingIntroProgressForScene(
        boundedIndex,
        landingSqlScenes.length,
      );
      commitFrame({
        activeIndex: boundedIndex,
        fromIndex: boundedIndex,
        mix: 0,
        progress: sceneProgress,
        toIndex: boundedIndex,
      });
      withInstantRootScroll(() => {
        window.scrollTo({
          behavior: "auto",
          top: trackTop - headerHeight + travelDistance * sceneProgress,
        });
      });
    } else {
      commitFrame({
        activeIndex: boundedIndex,
        fromIndex: boundedIndex,
        mix: 0,
        progress: getLandingIntroProgressForScene(
          boundedIndex,
          landingSqlScenes.length,
        ),
        toIndex: boundedIndex,
      });
    }

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

  const visibleSceneIndexes =
    layerPair.fromIndex === layerPair.toIndex
      ? [layerPair.fromIndex]
      : [layerPair.fromIndex, layerPair.toIndex];

  return (
    <section
      ref={trackRef}
      className="landing-sql-film"
      aria-labelledby="landing-sql-film-title"
    >
      <div className="landing-sql-film-sticky">
        <div className="landing-sql-film-atmosphere" aria-hidden="true">
          <span className="landing-sql-film-glow" />
          <span className="landing-sql-film-grid" />
        </div>

        <div
          ref={stageRef}
          className="landing-sql-film-shell"
          data-active-scene={activeScene.id}
          data-scroll-mode={isCinematic ? "cinematic" : "manual"}
        >
          <header className="landing-sql-film-header">
            <div>
              <p>
                <span aria-hidden="true" /> SQL EZBERLEME · ANALİST GİBİ ÇALIŞ
              </p>
              <h1 id="landing-sql-film-title">
                Bir iş sorusu nasıl karara dönüşür?
              </h1>
            </div>
            <div className="landing-sql-film-actions">
              <button
                className="landing-sql-film-start"
                type="button"
                onClick={onStart}
                aria-label={
                  isReturningLearner
                    ? "Kaldığın vakaya devam et"
                    : "İlk vakaya başla"
                }
              >
                <span className="landing-sql-film-action-label">
                  {isReturningLearner
                    ? "Kaldığın vakaya devam et"
                    : "İlk vakaya başla"}
                </span>
                <span
                  className="landing-sql-film-action-short"
                  aria-hidden="true"
                >
                  {isReturningLearner ? "Devam et" : "Başla"}
                </span>
                <ArrowRight size={15} />
              </button>
              <button
                className="landing-sql-film-explain"
                type="button"
                onClick={onContinue}
                aria-label="Nasıl çalışır?"
              >
                <span className="landing-sql-film-action-label">
                  Nasıl çalışır?
                </span>
                <span
                  className="landing-sql-film-action-short"
                  aria-hidden="true"
                >
                  Nasıl?
                </span>
                <SkipForward size={15} />
              </button>
            </div>
          </header>

          <div
            className="landing-sql-film-tabs"
            role="tablist"
            aria-label="Sorgunun büyüme adımları"
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
              </button>
            ))}
          </div>

          <div
            id="landing-sql-film-panel"
            className="landing-sql-film-frame-stack"
            role="tabpanel"
            aria-labelledby={`landing-sql-film-tab-${activeScene.id}`}
            tabIndex={0}
          >
            {visibleSceneIndexes.map((sceneIndex) => {
              const scene = landingSqlScenes[sceneIndex] ?? landingSqlScenes[0];
              const lines = scene.query.split("\n");
              return (
                <article
                  key={scene.id}
                  ref={(node) => {
                    frameRefs.current[sceneIndex] = node;
                  }}
                  className="landing-sql-film-frame"
                  aria-hidden={activeIndex !== sceneIndex}
                >
                  <div className="landing-sql-film-copy">
                    <p>{scene.eyebrow}</p>
                    <h2>{scene.title}</h2>
                    <div>{scene.description}</div>
                    <span className="landing-sql-film-insight">
                      <BarChart3 size={15} /> {scene.insight}
                    </span>
                    {scene.id === "decision" ? (
                      <span className="landing-sql-film-cue">
                        Şimdi Queryvale’in bunu nasıl öğrettiğini gör.
                        <ArrowDown size={15} />
                      </span>
                    ) : null}
                  </div>

                  <div className="landing-sql-editor" aria-hidden="true">
                    <div className="landing-sql-editor-bar">
                      <span>
                        <i /> branch_performance.sql
                      </span>
                      <strong>
                        <Database size={13} /> PostgreSQL · ders dışı örnek
                      </strong>
                    </div>
                    <ol className="landing-sql-code">
                      {lines.map((line, lineIndex) => (
                        <li
                          key={`${scene.id}-${lineIndex}`}
                          style={{ animationDelay: `${lineIndex * 12}ms` }}
                        >
                          <code>{highlightSqlLine(line)}</code>
                        </li>
                      ))}
                    </ol>
                    <div className="landing-sql-editor-result">
                      <span>
                        <CheckCircle2 size={14} /> Örnek sorgu · motor testli
                      </span>
                      <strong>{scene.insight}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <footer className="landing-sql-film-footer">
            <span>
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(landingSqlScenes.length).padStart(2, "0")}
            </span>
            <span>
              {isCinematic
                ? "Kaydır · sorgu büyüsün"
                : "Adımları seç · sorguyu keşfet"}
            </span>
          </footer>

          <pre
            className="sr-only"
            aria-label={`${activeScene.label} sahnesinin SQL örneği`}
          >
            <code>{activeScene.query}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
