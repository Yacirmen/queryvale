"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LessonTask } from "../../types/lesson";

interface LandingScreenProps {
  onStart: () => void;
  onContinue: () => void;
  onOpenHelp: () => void;
  resumeTask: LessonTask | undefined;
  isReturningLearner: boolean;
  hasLocalAccount: boolean;
  profileActive: boolean;
  startDisabled?: boolean;
  reducedMotion: boolean;
}

const roles = ["Veri Analistleri", "İş Analistleri", "Veri Bilimcileri"];

const studioSteps = [
  {
    label: "Adım 1 / 3: Dağınık SQL Girildi",
    status: "Status: PARSING...",
    statusTone: "warning",
  },
  {
    label: "Adım 2 / 3: Sorgu Okunur Hâle Geldi",
    status: "Status: READY",
    statusTone: "ready",
  },
  {
    label: "Adım 3 / 3: Sorgu Çalıştırıldı, Sonuç Hazır",
    status: "Status: EXECUTED (3.2ms)",
    statusTone: "success",
  },
] as const;

export const landingShowcaseQuery =
  "SELECT id, user_name, total_queries, status FROM users WHERE total_queries > 100 AND status = 'active' ORDER BY total_queries DESC;";

function trackProgress(element: HTMLElement | null): number {
  if (!element) return 0;
  const distance = Math.max(element.offsetHeight - window.innerHeight, 1);
  return Math.min(
    1,
    Math.max(0, -element.getBoundingClientRect().top / distance),
  );
}

function FormattedQuery() {
  return (
    <>
      <span className="landing-token-keyword">SELECT</span>
      {"\n  id,\n  user_name,\n  total_queries,\n  status\n"}
      <span className="landing-token-keyword">FROM</span>
      {" users\n"}
      <span className="landing-token-keyword">WHERE</span>
      {" total_queries > "}
      <span className="landing-token-number">100</span>
      {"\n  "}
      <span className="landing-token-keyword">AND</span>
      {" status = "}
      <span className="landing-token-string">&apos;active&apos;</span>
      {"\n"}
      <span className="landing-token-keyword">ORDER BY</span>
      {" total_queries "}
      <span className="landing-token-keyword">DESC</span>
      {";"}
    </>
  );
}

export function LandingScreen({
  onStart,
  onContinue,
  onOpenHelp,
  resumeTask,
  isReturningLearner,
  hasLocalAccount,
  profileActive,
  startDisabled = false,
  reducedMotion,
}: LandingScreenProps) {
  const heroTrackRef = useRef<HTMLElement>(null);
  const studioTrackRef = useRef<HTMLElement>(null);
  const [roleIndex, setRoleIndex] = useState(0);
  const [studioStep, setStudioStep] = useState(0);

  const shouldUseManualControls = () =>
    reducedMotion ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
    window.innerWidth <= 900 ||
    window.innerHeight < 700;

  const moveTrackTo = (
    track: HTMLElement | null,
    progress: number,
    update: () => void,
  ) => {
    if (!track || shouldUseManualControls()) {
      update();
      return;
    }
    const trackTop = window.scrollY + track.getBoundingClientRect().top;
    const distance = Math.max(track.offsetHeight - window.innerHeight, 1);
    window.scrollTo({
      top: trackTop + distance * progress,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (reducedMotion || media?.matches) return;

    let animationFrame = 0;
    const updateFromScroll = () => {
      animationFrame = 0;
      if (window.innerWidth <= 900 || window.innerHeight < 700) return;
      const heroProgress = trackProgress(heroTrackRef.current);
      const nextRole = heroProgress >= 0.66 ? 2 : heroProgress >= 0.33 ? 1 : 0;
      const studioProgress = trackProgress(studioTrackRef.current);
      const nextStep =
        studioProgress >= 0.7 ? 2 : studioProgress >= 0.35 ? 1 : 0;
      setRoleIndex((current) => (current === nextRole ? current : nextRole));
      setStudioStep((current) => (current === nextStep ? current : nextStep));
    };
    const requestUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateFromScroll);
    };

    updateFromScroll();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [reducedMotion]);

  const activeStep = studioSteps[studioStep];
  const resultVisible = studioStep === 2;
  const visibleStartLabel = profileActive
    ? isReturningLearner
      ? "Kaldığın Yerden Devam Et"
      : "İlk Vakaya Başla"
    : hasLocalAccount
      ? "Profiline Gir"
      : isReturningLearner
        ? "Yerel Profil Oluştur & Devam Et"
        : "Hesabını Aç & Vaka Çöz";

  return (
    <main id="main-content" className="page landing-reference" tabIndex={-1}>
      <section
        ref={heroTrackRef}
        className="landing-reference-track landing-role-track"
        data-scroll-mode={reducedMotion ? "manual" : "cinematic"}
        aria-labelledby="landing-reference-title"
      >
        <div className="landing-reference-sticky landing-role-stage">
          <h1 id="landing-reference-title">
            Geleceğin{" "}
            <span className="landing-dynamic-role" aria-live="polite">
              {roles[roleIndex]}
            </span>{" "}
            <br />
            İçin İnteraktif SQL Studio
          </h1>
          <p>
            Teoride kalmayın. Gerçek iş vakalarıyla sorgular yazın, veriyi
            dönüştürün ve pratik yaparak sektörün aradığı yetkinliğe ulaşın.
          </p>

          <div
            className="landing-role-controls"
            role="group"
            aria-label="Mesleki rol örnekleri"
          >
            {roles.map((role, index) => (
              <button
                key={role}
                type="button"
                className={index === roleIndex ? "active" : ""}
                onClick={() =>
                  moveTrackTo(
                    heroTrackRef.current,
                    [0.05, 0.5, 0.9][index] ?? 0,
                    () => setRoleIndex(index),
                  )
                }
                aria-pressed={index === roleIndex}
                aria-label={role}
              >
                <span aria-hidden="true" />
                <strong>{role}</strong>
              </button>
            ))}
          </div>

          <button
            className="landing-scroll-hint"
            type="button"
            onClick={() =>
              document.getElementById("queryvale-studio")?.scrollIntoView({
                behavior: shouldUseManualControls() ? "auto" : "smooth",
              })
            }
          >
            Kaydırarak Rolleri Keşfedin
            <ArrowDown size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section
        id="queryvale-studio"
        ref={studioTrackRef}
        className="landing-reference-track landing-studio-track"
        data-step={studioStep + 1}
        aria-labelledby="landing-studio-heading"
        tabIndex={-1}
      >
        <div className="landing-reference-sticky landing-studio-stage">
          <h2 id="landing-studio-heading" className="sr-only">
            Üç adımda çalışan SQL sorgusu
          </h2>
          <div className="landing-step-pill" aria-live="polite">
            {activeStep.label}
          </div>

          <div
            className={`landing-workspace-window ${
              resultVisible ? "is-complete" : ""
            }`}
          >
            <div className="landing-window-header">
              <div className="landing-window-dots" aria-hidden="true">
                <span className="red" />
                <span className="yellow" />
                <span className="green" />
              </div>
              <span
                className="landing-status-badge"
                data-tone={activeStep.statusTone}
              >
                {activeStep.status}
              </span>
            </div>

            <pre
              className="landing-reference-editor"
              aria-label="Tanıtım SQL sorgusu"
            >
              <code>
                {studioStep === 0 ? landingShowcaseQuery : <FormattedQuery />}
              </code>
            </pre>

            <div className="landing-result-area">
              <div className="landing-result-meta">
                <span>QUERY OUTPUT (POSTGRESQL)</span>
                <span>
                  {resultVisible ? "3 ROWS RETURNED" : "0 ROWS RETURNED"}
                </span>
              </div>

              <div
                className={`landing-result-table ${
                  resultVisible ? "visible" : ""
                }`}
                aria-hidden={!resultVisible}
              >
                <table>
                  <thead>
                    <tr>
                      <th>id</th>
                      <th>user_name</th>
                      <th>total_queries</th>
                      <th>status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>#1083</td>
                      <td>damla_data</td>
                      <td>3,890</td>
                      <td className="landing-status-active">Active</td>
                    </tr>
                    <tr>
                      <td>#1082</td>
                      <td>alex_dev</td>
                      <td>1,420</td>
                      <td className="landing-status-active">Active</td>
                    </tr>
                    <tr>
                      <td>#1084</td>
                      <td>selin_ops</td>
                      <td>870</td>
                      <td className="landing-status-active">Active</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div
            className="landing-step-controls"
            role="group"
            aria-label="SQL tanıtım adımları"
          >
            {studioSteps.map((step, index) => (
              <button
                key={step.label}
                type="button"
                className={index === studioStep ? "active" : ""}
                aria-pressed={index === studioStep}
                aria-label={`${index + 1}. adım: ${step.label.replace(
                  /^Adım \d \/ 3: /,
                  "",
                )}`}
                onClick={() =>
                  moveTrackTo(
                    studioTrackRef.current,
                    [0.05, 0.5, 0.9][index] ?? 0,
                    () => setStudioStep(index),
                  )
                }
              >
                <span>{index + 1}</span>
                {step.label.replace(/^Adım \d \/ 3: /, "")}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section
        className="landing-reference-cta"
        aria-labelledby="landing-cta-title"
      >
        <div>
          <h2 id="landing-cta-title">
            Teoriyi Bırakın, İlk Vakanızı Çözmeye Başlayın
          </h2>
          <p>
            Kurulum yok, karmaşık veritabanı ayarları yok. Yerel çalışma
            profilini seç, gerçek senaryolar üzerinden veriyi sorgulamaya başla.
          </p>
          <button
            className="landing-reference-cta-button"
            type="button"
            disabled={startDisabled}
            onClick={profileActive ? onContinue : onStart}
            aria-label={visibleStartLabel}
            title={
              isReturningLearner && resumeTask
                ? `Son konumun: ${resumeTask.title}`
                : undefined
            }
          >
            {visibleStartLabel}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <footer className="landing-reference-footer">
        <nav aria-label="Alt bilgi bağlantıları">
          <button
            type="button"
            onClick={() =>
              document.getElementById("queryvale-studio")?.scrollIntoView({
                behavior: shouldUseManualControls() ? "auto" : "smooth",
              })
            }
          >
            Nasıl çalışır
          </button>
          <button type="button" onClick={onOpenHelp}>
            Yardım ve veri
          </button>
          <a
            href="https://github.com/Yacirmen/queryvale/issues"
            target="_blank"
            rel="noreferrer"
          >
            Geri bildirim
          </a>
        </nav>
        <p>© 2026 Queryvale. Cihazında çalışan SQL öğrenme stüdyosu.</p>
      </footer>
    </main>
  );
}
