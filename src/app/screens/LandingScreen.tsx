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
import type { Navigate } from "../appTypes";
import { LandingStory } from "./LandingStory";

interface LandingScreenProps {
  onNavigate: Navigate;
}

export function LandingScreen({ onNavigate }: LandingScreenProps) {
  const storyTrackRef = useRef<HTMLElement>(null);

  return (
    <main
      id="main-content"
      className="page landing-premium landing-station"
      tabIndex={-1}
    >
      <section
        ref={storyTrackRef}
        className="home-station-section"
        aria-labelledby="home-station-title"
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
                  Uygulamalı veri analisti laboratuvarı
                </div>
                <h1 id="home-station-title">
                  Soruyu sorguya.
                  <span>Sorguyu kanıta.</span>
                </h1>
                <p className="home-station-lead">
                  Gerçekçi bir iş briefini oku; SQL’ini tarayıcıda çalıştır,
                  çıktını doğrula ve kendi karar notunu yaz.
                </p>

                <div className="home-station-actions">
                  <button
                    className="home-primary-action"
                    type="button"
                    onClick={() =>
                      onNavigate("workspace", {
                        taskId: "m1-t1",
                        onboarding: true,
                      })
                    }
                  >
                    Rehberli ilk vakayı başlat
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

              <LandingStory scrollTrackRef={storyTrackRef} />
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
