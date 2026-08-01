"use client";

import { ArrowRight, Check } from "lucide-react";
import { useRef } from "react";
import type { LessonTask } from "../../types/lesson";
import type { Navigate } from "../appTypes";
import { withInstantRootScroll } from "./instantScroll";
import { LandingSqlFilm } from "./LandingSqlFilm";
import { LandingTaskPreview } from "./LandingTaskPreview";

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

  const startOrResumeCase = () => {
    onNavigate("workspace", {
      taskId: resumeTask?.id,
      onboarding: showOnboardingOnStart,
    });
  };

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
      className="page landing-premium landing-gateway"
      tabIndex={-1}
    >
      <LandingSqlFilm
        isReturningLearner={isReturningLearner}
        onContinue={continueToProductIntroduction}
        onStart={startOrResumeCase}
      />

      <section
        id="product-introduction"
        ref={productIntroductionRef}
        className="landing-entry"
        aria-labelledby="landing-entry-title"
        tabIndex={-1}
      >
        <div className="landing-entry-atmosphere" aria-hidden="true">
          <span className="landing-entry-halo" />
          <span className="landing-entry-glow" />
        </div>

        <div className="landing-entry-shell">
          <div className="landing-entry-copy">
            <div className="landing-entry-kicker">
              <span className="landing-entry-pulse" />
              {isReturningLearner ? "Çalışma masan hazır" : "İlk vaka hazır"}
            </div>
            <h2 id="landing-entry-title">
              Şimdi sıra <span>sende.</span>
            </h2>
            <p className="landing-entry-lead">
              Soruyu oku, SQL’ini dene; sonucu gerçek vaka verisinde gör.
              Takılırsan ipuçları yanında.
            </p>

            <div className="landing-entry-actions">
              <button
                className="home-primary-action"
                type="button"
                onClick={startOrResumeCase}
                title={
                  isReturningLearner && resumeTask
                    ? `Son konumun: ${resumeTask.title}`
                    : undefined
                }
              >
                {isReturningLearner
                  ? "Kaldığın vakaya devam et"
                  : "İlk vakayı birlikte çöz"}
                <ArrowRight size={17} />
              </button>
              <button
                className="home-secondary-action"
                type="button"
                onClick={() => onNavigate("learn")}
              >
                Önce rotayı incele
              </button>
            </div>

            <p className="landing-entry-assurance">
              <Check size={14} aria-hidden="true" />
              Hesap gerekmez
              <span aria-hidden="true">·</span>
              Taslağın otomatik kaydolur
              <span aria-hidden="true">·</span>
              40 vaka + 12 portföy projesi
            </p>
          </div>

          <LandingTaskPreview
            task={resumeTask}
            isReturningLearner={isReturningLearner}
          />
        </div>
      </section>
    </main>
  );
}
