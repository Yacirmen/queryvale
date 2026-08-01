"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  DatabaseZap,
  Gauge,
  HardDrive,
  Lightbulb,
} from "lucide-react";
import { useRef } from "react";
import type { LessonTask } from "../../types/lesson";
import type { Navigate } from "../appTypes";
import { withInstantRootScroll } from "./instantScroll";
import { LandingSqlFilm } from "./LandingSqlFilm";
import { LandingStory } from "./LandingStory";

interface LandingScreenProps {
  onNavigate: Navigate;
  resumeTask: LessonTask | undefined;
  isReturningLearner: boolean;
  showOnboardingOnStart: boolean;
}

export function LandingScreen({
  onNavigate,
  resumeTask,
  isReturningLearner,
  showOnboardingOnStart,
}: LandingScreenProps) {
  const productIntroductionRef = useRef<HTMLElement>(null);

  const continueToProductIntroduction = () => {
    const target = productIntroductionRef.current;
    if (!target) return;
    withInstantRootScroll(() => {
      target.scrollIntoView?.({ behavior: "auto", block: "start" });
      target.focus({ preventScroll: true });
    });
  };

  return (
    <main
      id="main-content"
      className="page landing-premium landing-station"
      tabIndex={-1}
    >
      <LandingSqlFilm onContinue={continueToProductIntroduction} />

      <section
        id="product-introduction"
        ref={productIntroductionRef}
        className="home-station-section home-station-section-static"
        aria-labelledby="home-station-title"
        tabIndex={-1}
      >
        <div className="home-station-sticky">
          <div className="home-station-atmosphere" aria-hidden="true">
            <span className="home-station-orbit home-station-orbit-one" />
            <span className="home-station-orbit home-station-orbit-two" />
            <span className="home-station-orbit home-station-orbit-three" />
            <span className="home-station-glow" />
          </div>

          <div className="home-station-shell">
            <div className="home-station-main">
              <div className="home-station-copy">
                <div className="home-station-kicker">
                  <span className="home-station-pulse" />
                  SQL öğrenmek için sakin bir çalışma alanı
                </div>
                <h2 id="home-station-title">
                  Bir tabloyla başla.
                  <span>İçindeki hikâyeyi bul.</span>
                </h2>
                <p className="home-station-lead">
                  Queryvale’de gerçek iş sorularını kendi hızında çözersin.
                  Denersin, yanılırsın, ipucu alırsın; sonunda yalnız doğru
                  sorguyu değil, neden doğru olduğunu da görürsün.
                </p>

                <div className="home-station-actions">
                  <button
                    className="home-primary-action"
                    type="button"
                    onClick={() =>
                      onNavigate("workspace", {
                        taskId: resumeTask?.id,
                        onboarding: showOnboardingOnStart,
                      })
                    }
                    title={
                      isReturningLearner && resumeTask
                        ? `Son konumun: ${resumeTask.title}`
                        : undefined
                    }
                  >
                    {isReturningLearner
                      ? "Kaldığın vakaya devam et"
                      : "Rehberli ilk vakayı başlat"}
                    <ArrowRight size={17} />
                  </button>
                  <button
                    className="home-secondary-action"
                    type="button"
                    onClick={() => onNavigate("learn")}
                  >
                    SQL biliyorum — rotayı seç
                  </button>
                </div>

                <div
                  className="home-station-trust"
                  aria-label="Başlama koşulları"
                >
                  <span>
                    <Check size={13} /> Hesap yok
                  </span>
                  <span>
                    <Check size={13} /> Kurulum yok
                  </span>
                  <span>
                    <Check size={13} /> Yardım cezası yok
                  </span>
                </div>

                <div className="home-station-help-note">
                  <span className="home-station-help-icon" aria-hidden="true">
                    <Lightbulb size={15} />
                  </span>
                  <p>
                    <strong>Takılırsan çıkışın var.</strong>
                    Mantık → parçalar → iskelet → açık talepte çalışan örnek.
                  </p>
                </div>
              </div>

              <LandingStory />
            </div>

            <div
              className="home-station-proof-rail"
              aria-label="Ürün kanıtları"
            >
              <span>
                <DatabaseZap size={15} />
                <strong>PostgreSQL uyumlu</strong> yerel motor
              </span>
              <span>
                <CheckCircle2 size={15} />
                <strong>Sonuç odaklı</strong> değerlendirme
              </span>
              <span>
                <HardDrive size={15} />
                <strong>Profil ve kanıt</strong> cihazında
              </span>
              <span>
                <Gauge size={15} />
                <strong>4 bölüm</strong> · 10 modül · 31 vaka
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
