"use client";

import {
  Check,
  CheckCircle2,
  CircleDot,
  Database,
  FileCheck2,
  Lightbulb,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  getLandingStoryFrame,
  type LandingStoryFrame,
} from "./landingStoryFrame";

const storyScenes = [
  {
    id: "question",
    label: "Sor",
    eyebrow: "Operasyon brief’i",
    title: "İş sorusunu tek bir teslim cümlesine indir.",
    description:
      "Ürün ekibinin kim için, hangi görünümü istediğini ayır. İlk vaka yalnız ürün adı ve kategori kolonlarından oluşan sade bir katalog çıktısı ister.",
    detail: "Ürün adı · kategori · her ürün bir satır",
  },
  {
    id: "inspect",
    label: "İncele",
    eyebrow: "Şema ve veri",
    title: "Satırın neyi temsil ettiğini şemadan doğrula.",
    description:
      "products tablosundaki kolonları ve örnek satırları incele. Bu görevde her sonuç satırı katalogdaki tek bir ürünü temsil eder.",
    detail: "products · product_name · category",
  },
  {
    id: "query",
    label: "Sorgula",
    eyebrow: "Çalıştırılabilir düşünce",
    title: "İstenen görünümü okunabilir SQL’e çevir.",
    description:
      "Sorgunu boş editörde kendin kur ve görev için hazırlanmış PostgreSQL uyumlu veri üzerinde çalıştır.",
    detail: "SELECT · iki kolon · gerçek motor",
  },
  {
    id: "validate",
    label: "Doğrula",
    eyebrow: "Karar seti",
    title: "Çıktının yapısını ve gerçek satırlarını kontrol et.",
    description:
      "Queryvale yalnız sorgunun çalışmasına bakmaz; beklenen kolonları, satırları ve görevin öğrenme sözleşmesini birlikte doğrular.",
    detail: "Kolon sözleşmesi · 6 ürün · sonuç kanıtı",
  },
  {
    id: "explain",
    label: "Anlat",
    eyebrow: "Kanıt defteri",
    title: "Doğrulanmış sonucu kısa bir iş notuna dönüştür.",
    description:
      "Bulgunu, önerini ve varsa çekinceni yaz. SQL çıktısı doğrulanır; yorum ve mesleki muhakeme sende kalır.",
    detail: "Bulgu · öneri · çekince",
  },
] as const;

type StorySceneId = (typeof storyScenes)[number]["id"];

function StoryVisual({ scene }: { scene: StorySceneId }) {
  if (scene === "question") {
    return (
      <div className="story-art story-brief-art">
        <div className="story-art-kicker">
          <span>FIELD NOTE / 001</span>
          <span>5 dk</span>
        </div>
        <div className="story-brief-author">
          <span className="story-author-mark">ÜO</span>
          <div>
            <strong>Haftalık katalog kontrolü</strong>
            <small>Ürün operasyon ekibi</small>
          </div>
        </div>
        <blockquote>
          “Ürün adlarını ve kategorilerini içeren sade bir görünüm istiyoruz.”
        </blockquote>
        <div className="story-contract-row">
          <span>Beklenen teslim</span>
          <strong>product_name + category</strong>
        </div>
        <div className="story-art-footnote">
          <CircleDot size={13} /> Teslim sözleşmesi net
        </div>
      </div>
    );
  }

  if (scene === "inspect") {
    return (
      <div className="story-art story-schema-art story-catalog-schema-art">
        <div className="story-art-kicker">
          <span>Şema &amp; veri</span>
          <span>1 tablo · 5 kolon</span>
        </div>
        <div className="story-products-schema">
          <div className="story-products-table">
            <div>
              <Database size={15} /> products
            </div>
            <span>
              <b>PK</b> product_id <em>INTEGER</em>
            </span>
            <span className="is-needed">
              product_name <em>TEXT</em>
            </span>
            <span className="is-needed">
              category <em>TEXT</em>
            </span>
            <span>
              unit_price <em>NUMERIC</em>
            </span>
            <span>
              stock_quantity <em>INTEGER</em>
            </span>
          </div>
          <div className="story-products-grain">
            <span>Çıktı tanesi</span>
            <strong>Bir satır = katalogdaki tek bir ürün</strong>
          </div>
        </div>
      </div>
    );
  }

  if (scene === "query") {
    return (
      <div className="story-art story-query-art story-catalog-query-art">
        <div className="story-editor-bar">
          <span className="story-file-dot" />
          <strong>analysis.sql</strong>
          <span>PostgreSQL hazır</span>
        </div>
        <div className="story-code" aria-label="Katalog sorgusu iskeleti">
          <span className="story-line-number">1</span>
          <code>
            <b>SELECT</b>
          </code>
          <span className="story-line-number">2</span>
          <code>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[beklenen kolonlar]</code>
          <span className="story-line-number">3</span>
          <code>
            <b>FROM</b> [tablo];
          </code>
        </div>
        <div className="story-run-row">
          <span>
            <Check size={13} /> İskelet hazır
          </span>
          <span className="story-run-button">Sen tamamlayacaksın</span>
        </div>
      </div>
    );
  }

  if (scene === "validate") {
    return (
      <div className="story-art story-result-art story-catalog-result-art">
        <div className="story-art-kicker">
          <span>Sorgu sonucu</span>
          <span className="story-verified">
            <CheckCircle2 size={13} /> Doğrulandı
          </span>
        </div>
        <div className="story-result-table story-catalog-result-table">
          <div className="story-result-row story-result-head">
            <span>product_name</span>
            <span>category</span>
          </div>
          <div className="story-result-row">
            <strong>Desk Lamp</strong>
            <span>Home</span>
          </div>
          <div className="story-result-row">
            <strong>Notebook</strong>
            <span>Stationery</span>
          </div>
          <div className="story-result-row">
            <strong>Office Chair</strong>
            <span>Furniture</span>
          </div>
          <div className="story-result-more">+ 3 doğrulanmış ürün satırı</div>
        </div>
        <div className="story-check-grid">
          <span>
            <Check size={12} /> Kolon sırası doğru
          </span>
          <span>
            <Check size={12} /> Altı ürün tam
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="story-art story-evidence-art story-catalog-evidence-art">
      <div className="story-art-kicker">
        <span>Kanıt defteri · QV-001</span>
        <span>Yerel kayıt</span>
      </div>
      <div className="evidence-status-line">
        <span className="evidence-seal">
          <FileCheck2 size={20} />
        </span>
        <div>
          <strong>Katalog görünümü hazır</strong>
          <small>Doğrulanmış SQL çıktısına bağlı</small>
        </div>
      </div>
      <div className="story-evidence-note">
        <span>
          <Lightbulb size={13} /> Bulgu
        </span>
        <p>Altı ürünün dört kategoriye dağıldığı görülüyor.</p>
      </div>
      <div className="story-evidence-note story-evidence-note-secondary">
        <span>
          <CheckCircle2 size={13} /> Öneri
        </span>
        <p>Katalog kontrolünü ürün adı ve kategori alanlarıyla yürütün.</p>
      </div>
      <div className="evidence-owner-row">
        <span>Yorum otomatik doğrulanmaz</span>
        <strong>Muhakeme sende</strong>
      </div>
    </div>
  );
}

interface LandingStoryProps {
  scrollTrackRef?: RefObject<HTMLElement | null>;
}

interface StoryLayerPair {
  fromIndex: number;
  toIndex: number;
}

const CINEMATIC_MEDIA_QUERY =
  "(min-width: 901px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)";

export function LandingStory({ scrollTrackRef }: LandingStoryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCinematic, setIsCinematic] = useState(false);
  const [layerPair, setLayerPair] = useState<StoryLayerPair>({
    fromIndex: 0,
    toIndex: 0,
  });
  const deckRef = useRef<HTMLElement | null>(null);
  const frameRefs = useRef<Array<HTMLElement | null>>([]);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndexRef = useRef(0);
  const cinematicRef = useRef(false);
  const layerPairRef = useRef<StoryLayerPair>(layerPair);
  const latestFrameRef = useRef<LandingStoryFrame>(getLandingStoryFrame(0));
  const activeStory = storyScenes[activeIndex] ?? storyScenes[0];

  const applyFrameToLayers = useCallback((frame: LandingStoryFrame) => {
    const currentLayer = frameRefs.current[frame.fromIndex];
    const nextLayer = frameRefs.current[frame.toIndex];
    const hasNextLayer = frame.fromIndex !== frame.toIndex;

    if (currentLayer) {
      currentLayer.style.setProperty(
        "--frame-opacity",
        String(hasNextLayer ? 1 - frame.mix : 1),
      );
      currentLayer.style.setProperty("--frame-shift", `${-10 * frame.mix}px`);
      currentLayer.style.setProperty(
        "--frame-scale",
        String(1 - 0.015 * frame.mix),
      );
    }

    if (hasNextLayer && nextLayer) {
      nextLayer.style.setProperty("--frame-opacity", String(frame.mix));
      nextLayer.style.setProperty("--frame-shift", `${12 * (1 - frame.mix)}px`);
      nextLayer.style.setProperty(
        "--frame-scale",
        String(0.985 + 0.015 * frame.mix),
      );
    }
  }, []);

  const commitFrame = useCallback(
    (frame: LandingStoryFrame) => {
      latestFrameRef.current = frame;
      deckRef.current?.style.setProperty(
        "--story-overall-progress",
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
    const track = scrollTrackRef?.current;
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
      const progress = (window.scrollY - startScroll) / travelDistance;
      commitFrame(getLandingStoryFrame(progress));
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
      window.addEventListener("scroll", scheduleScrollFrame, {
        passive: true,
      });
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
        progress: preservedIndex / (storyScenes.length - 1),
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
  }, [commitFrame, scrollTrackRef]);

  const activateScene = (index: number, moveFocus = false) => {
    const boundedIndex = Math.max(0, Math.min(storyScenes.length - 1, index));

    if (cinematicRef.current && scrollTrackRef?.current) {
      const track = scrollTrackRef.current;
      const rootStyles = window.getComputedStyle(document.documentElement);
      const headerHeight =
        Number.parseFloat(rootStyles.getPropertyValue("--header-h")) || 0;
      const trackTop = window.scrollY + track.getBoundingClientRect().top;
      const stageHeight = Math.max(1, window.innerHeight - headerHeight);
      const travelDistance = Math.max(1, track.offsetHeight - stageHeight);
      const sceneProgress = boundedIndex / (storyScenes.length - 1);
      window.scrollTo({
        behavior: "smooth",
        top: trackTop - headerHeight + travelDistance * sceneProgress,
      });
    } else {
      commitFrame({
        activeIndex: boundedIndex,
        fromIndex: boundedIndex,
        mix: 0,
        progress: boundedIndex / (storyScenes.length - 1),
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
      nextIndex = (index + 1) % storyScenes.length;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + storyScenes.length) % storyScenes.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = storyScenes.length - 1;
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
      ref={deckRef}
      className="home-journey-deck"
      data-active-scene={activeStory.id}
      data-scroll-mode={isCinematic ? "cinematic" : "manual"}
      aria-label="Queryvale analiz döngüsü"
    >
      <header className="home-journey-deck-bar">
        <span>
          <Database size={14} /> QUERYVALE / ANALİZ AKIŞI
        </span>
        <strong>{String(activeIndex + 1).padStart(2, "0")} / 05</strong>
      </header>

      <div
        className="home-journey-tabs"
        role="tablist"
        aria-label="Analiz döngüsü aşamaları"
      >
        {storyScenes.map((scene, index) => (
          <button
            id={`home-journey-tab-${scene.id}`}
            key={scene.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={activeStory.id === scene.id}
            aria-controls="home-journey-panel"
            aria-label={`${index + 1}. adım: ${scene.label}`}
            tabIndex={activeStory.id === scene.id ? 0 : -1}
            onClick={() => activateScene(index)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{scene.label}</strong>
          </button>
        ))}
      </div>

      <div
        id="home-journey-panel"
        className="home-journey-panel-stack"
        role="tabpanel"
        aria-labelledby={`home-journey-tab-${activeStory.id}`}
        tabIndex={0}
      >
        {visibleSceneIndexes.map((sceneIndex) => {
          const scene = storyScenes[sceneIndex] ?? storyScenes[0];
          return (
            <article
              key={scene.id}
              ref={(node) => {
                frameRefs.current[sceneIndex] = node;
              }}
              className="home-journey-panel home-journey-panel-frame"
              aria-hidden={activeIndex !== sceneIndex}
            >
              <div className="home-journey-copy">
                <p>{scene.eyebrow}</p>
                <h2>{scene.title}</h2>
                <div className="home-journey-description">
                  {scene.description}
                </div>
                <span className="home-journey-detail">{scene.detail}</span>
              </div>
              <div className="home-journey-visual" aria-hidden="true">
                <StoryVisual scene={scene.id} />
              </div>
            </article>
          );
        })}
      </div>

      <footer className="home-journey-footer">
        <span>
          <i aria-hidden="true" /> Gerçek başlangıç vakası
        </span>
        <span>
          {isCinematic
            ? "Kaydır: sahne dönüşsün · sekmeyle atla"
            : "Tıkla veya ← → tuşlarını kullan"}
        </span>
      </footer>
    </section>
  );
}
