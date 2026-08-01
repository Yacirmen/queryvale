"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import type { LessonTask } from "../../types/lesson";
import type { Navigate } from "../appTypes";
import { LandingSqlFilm } from "./LandingSqlFilm";

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
  const startOrResumeCase = () => {
    onNavigate("workspace", {
      taskId: resumeTask?.id,
      onboarding: showOnboardingOnStart,
    });
  };

  return (
    <>
      <main
        id="main-content"
        className="page landing-premium landing-gateway"
        tabIndex={-1}
      >
        <LandingSqlFilm
          isReturningLearner={isReturningLearner}
          onStart={startOrResumeCase}
          resumeTaskTitle={resumeTask?.title}
        />
      </main>
      <footer className="landing-site-footer">
        <div className="landing-site-footer-brand">
          <strong>Queryvale</strong>
          <span>Sorudan kanıta.</span>
        </div>
        <p>
          <ShieldCheck size={15} aria-hidden="true" />
          Verin ve ilerlemen bu cihazda kalır.
        </p>
        <button type="button" onClick={() => onNavigate("learn")}>
          Rotayı incele <ArrowRight size={15} />
        </button>
      </footer>
    </>
  );
}
