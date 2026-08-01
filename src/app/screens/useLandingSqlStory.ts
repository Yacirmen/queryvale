"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject, RefObject } from "react";
import {
  getLandingStoryProgressForStep,
  getLandingStoryStep,
} from "./landingIntroFrame";

const CINEMATIC_MEDIA_QUERY =
  "(min-width:901px) and (min-height:700px) and (pointer:fine) and (prefers-reduced-motion:no-preference)";
const DEFAULT_GSAP_LAG_THRESHOLD = 500;
const DEFAULT_GSAP_ADJUSTED_LAG = 33;

interface LandingSqlStoryOptions {
  activeStepRef: MutableRefObject<number>;
  onStepChange: (step: number) => void;
  stageRef: RefObject<HTMLElement | null>;
  trackRef: RefObject<HTMLElement | null>;
}

interface StoryRuntime {
  end: () => number;
  scrollTo: (target: number) => void;
  start: () => number;
}

interface LandingSqlStoryResult {
  isCinematic: boolean;
  scrollToStep: (index: number) => void;
}

function readHeaderOffset(): number {
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--header-h");
  const offset = Number.parseFloat(value);
  return Number.isFinite(offset) ? Math.max(0, offset) : 0;
}

export function useLandingSqlStory({
  activeStepRef,
  onStepChange,
  stageRef,
  trackRef,
}: LandingSqlStoryOptions): LandingSqlStoryResult {
  const [isCinematic, setIsCinematic] = useState(false);
  const onStepChangeRef = useRef(onStepChange);
  const runtimeRef = useRef<StoryRuntime | null>(null);

  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  const scrollToStep = useCallback((index: number) => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    const start = runtime.start();
    const end = runtime.end();
    const target =
      start + (end - start) * getLandingStoryProgressForStep(index);
    runtime.scrollTo(target);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const root = document.documentElement;
    const mediaQuery = window.matchMedia(CINEMATIC_MEDIA_QUERY);
    let disposed = false;
    let setupPending = false;
    let generation = 0;
    let cleanupRuntime: (() => void) | null = null;

    const isEligible = () =>
      mediaQuery.matches && root.dataset.reducedMotion !== "true";

    const stopRuntime = () => {
      generation += 1;
      cleanupRuntime?.();
      cleanupRuntime = null;
      runtimeRef.current = null;
      if (!disposed) setIsCinematic(false);
    };

    const synchronize = () => {
      if (disposed || !isEligible()) {
        stopRuntime();
        return;
      }

      if (cleanupRuntime || setupPending) return;

      setupPending = true;
      const setupGeneration = generation;

      void Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ])
        .then(([gsapModule, scrollTriggerModule, lenisModule]) => {
          if (disposed || setupGeneration !== generation || !isEligible()) {
            return;
          }

          const stage = stageRef.current;
          const track = trackRef.current;
          if (!stage || !track) return;

          const { gsap } = gsapModule;
          const { ScrollTrigger } = scrollTriggerModule;
          const Lenis = lenisModule.default;
          gsap.registerPlugin(ScrollTrigger);

          const lenis = new Lenis({
            allowNestedScroll: false,
            anchors: true,
            stopInertiaOnNavigate: true,
            syncTouch: false,
          });
          let context: ReturnType<typeof gsap.context> | null = null;
          let storyTrigger: ReturnType<typeof ScrollTrigger.create> | null =
            null;
          let unsubscribeLenis: (() => void) | null = null;
          let tickerAdded = false;
          let lagSmoothingChanged = false;
          let cleaned = false;

          const lenisTicker = (time: number) => {
            lenis.raf(time * 1000);
          };

          const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            if (runtimeRef.current?.scrollTo === scrollRuntimeTo) {
              runtimeRef.current = null;
            }
            unsubscribeLenis?.();
            if (tickerAdded) gsap.ticker.remove(lenisTicker);
            context?.revert();
            lenis.destroy();
            if (lagSmoothingChanged) {
              gsap.ticker.lagSmoothing(
                DEFAULT_GSAP_LAG_THRESHOLD,
                DEFAULT_GSAP_ADJUSTED_LAG,
              );
            }
          };

          const scrollRuntimeTo = (target: number) => {
            lenis.scrollTo(target, {
              immediate: true,
            });
          };

          cleanupRuntime = cleanup;

          try {
            unsubscribeLenis = lenis.on("scroll", () => {
              ScrollTrigger.update();
            });
            gsap.ticker.lagSmoothing(0);
            lagSmoothingChanged = true;
            gsap.ticker.add(lenisTicker);
            tickerAdded = true;

            context = gsap.context(() => {
              storyTrigger = ScrollTrigger.create({
                end: () => `+=${Math.min(window.innerHeight * 1.6, 1280)}`,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                  const nextStep = getLandingStoryStep(self.progress);
                  if (activeStepRef.current === nextStep) return;
                  activeStepRef.current = nextStep;
                  onStepChangeRef.current(nextStep);
                },
                pin: stage,
                pinSpacing: true,
                scrub: true,
                start: () => `top top+=${readHeaderOffset()}`,
                trigger: track,
              });
            }, track);

            const runtimeTrigger = storyTrigger as ReturnType<
              typeof ScrollTrigger.create
            > | null;
            if (!runtimeTrigger) {
              throw new Error("Landing story ScrollTrigger could not start.");
            }

            runtimeRef.current = {
              end: () => runtimeTrigger.end,
              scrollTo: scrollRuntimeTo,
              start: () => runtimeTrigger.start,
            };
            ScrollTrigger.refresh();
            lenis.resize();
            setIsCinematic(true);
          } catch (error) {
            cleanup();
            throw error;
          }
        })
        .catch(() => {
          if (!disposed && setupGeneration === generation) {
            cleanupRuntime?.();
            cleanupRuntime = null;
            runtimeRef.current = null;
            setIsCinematic(false);
          }
        })
        .finally(() => {
          setupPending = false;
          if (!disposed && setupGeneration !== generation && isEligible()) {
            synchronize();
          }
        });
    };

    const handleEligibilityChange = () => {
      synchronize();
    };
    const reducedMotionObserver = new MutationObserver(handleEligibilityChange);
    reducedMotionObserver.observe(root, {
      attributeFilter: ["data-reduced-motion"],
      attributes: true,
    });
    mediaQuery.addEventListener("change", handleEligibilityChange);
    synchronize();

    return () => {
      disposed = true;
      mediaQuery.removeEventListener("change", handleEligibilityChange);
      reducedMotionObserver.disconnect();
      stopRuntime();
    };
  }, [activeStepRef, stageRef, trackRef]);

  return { isCinematic, scrollToStep };
}
