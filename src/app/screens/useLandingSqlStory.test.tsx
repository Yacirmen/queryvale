import { act, renderHook, waitFor } from "@testing-library/react";
import type { MutableRefObject, RefObject } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLandingSqlStory } from "./useLandingSqlStory";

const animationMocks = vi.hoisted(() => ({
  contextRevert: vi.fn(),
  contextScope: null as unknown,
  destroy: vi.fn(),
  lenisOptions: [] as unknown[],
  lenisRaf: vi.fn(),
  lenisResize: vi.fn(),
  lenisScrollTo: vi.fn(),
  refresh: vi.fn(),
  registerPlugin: vi.fn(),
  scrollListener: null as null | (() => void),
  tickerAdd: vi.fn(),
  tickerLagSmoothing: vi.fn(),
  tickerRemove: vi.fn(),
  trigger: { end: 900, start: 100 },
  triggerCreate: vi.fn(),
  triggerUpdate: vi.fn(),
  triggerVars: null as unknown,
  unsubscribe: vi.fn(),
}));

vi.mock("gsap", () => ({
  gsap: {
    context: (callback: () => void, scope: unknown) => {
      animationMocks.contextScope = scope;
      callback();
      return { revert: animationMocks.contextRevert };
    },
    registerPlugin: animationMocks.registerPlugin,
    ticker: {
      add: animationMocks.tickerAdd,
      lagSmoothing: animationMocks.tickerLagSmoothing,
      remove: animationMocks.tickerRemove,
    },
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {
    create: (vars: unknown) => {
      animationMocks.triggerVars = vars;
      animationMocks.triggerCreate(vars);
      return animationMocks.trigger;
    },
    refresh: animationMocks.refresh,
    update: animationMocks.triggerUpdate,
  },
}));

vi.mock("lenis", () => ({
  default: class MockLenis {
    constructor(options: unknown) {
      animationMocks.lenisOptions.push(options);
    }

    destroy() {
      animationMocks.destroy();
    }

    on(_event: string, listener: () => void) {
      animationMocks.scrollListener = listener;
      return animationMocks.unsubscribe;
    }

    raf(time: number) {
      animationMocks.lenisRaf(time);
    }

    resize() {
      animationMocks.lenisResize();
    }

    scrollTo(target: number, options: unknown) {
      animationMocks.lenisScrollTo(target, options);
    }
  },
}));

class TestMediaQueryList {
  matches: boolean;
  readonly media = "landing-cinematic";
  readonly onchange = null;
  private readonly listeners = new Set<() => void>();

  constructor(matches: boolean) {
    this.matches = matches;
  }

  addEventListener(_type: "change", listener: () => void) {
    this.listeners.add(listener);
  }

  removeEventListener(_type: "change", listener: () => void) {
    this.listeners.delete(listener);
  }

  setMatches(matches: boolean) {
    this.matches = matches;
    this.listeners.forEach((listener) => listener());
  }
}

interface StoryTriggerVars {
  end: () => string;
  onUpdate: (self: { progress: number }) => void;
  pin: HTMLElement;
  pinSpacing: boolean;
  scrub: boolean;
  start: () => string;
  trigger: HTMLElement;
}

function createRefs() {
  const stage = document.createElement("section");
  const track = document.createElement("section");

  return {
    stage,
    stageRef: { current: stage } as RefObject<HTMLElement | null>,
    track,
    trackRef: { current: track } as RefObject<HTMLElement | null>,
  };
}

describe("useLandingSqlStory", () => {
  let mediaQuery: TestMediaQueryList;

  beforeEach(() => {
    vi.clearAllMocks();
    animationMocks.contextScope = null;
    animationMocks.lenisOptions.length = 0;
    animationMocks.scrollListener = null;
    animationMocks.trigger.end = 900;
    animationMocks.trigger.start = 100;
    animationMocks.triggerVars = null;
    mediaQuery = new TestMediaQueryList(true);
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => mediaQuery),
    });
    document.documentElement.dataset.reducedMotion = "false";
    document.documentElement.style.setProperty("--header-h", "68px");
  });

  afterEach(() => {
    delete document.documentElement.dataset.reducedMotion;
    document.documentElement.style.removeProperty("--header-h");
  });

  it("pins one compact story and publishes only changed steps", async () => {
    const activeStepRef: MutableRefObject<number> = { current: 0 };
    const onStepChange = vi.fn();
    const { stage, stageRef, track, trackRef } = createRefs();
    const { result } = renderHook(() =>
      useLandingSqlStory({
        activeStepRef,
        onStepChange,
        stageRef,
        trackRef,
      }),
    );

    await waitFor(() => expect(result.current.isCinematic).toBe(true));

    expect(animationMocks.lenisOptions).toEqual([
      {
        allowNestedScroll: false,
        anchors: true,
        stopInertiaOnNavigate: true,
        syncTouch: false,
      },
    ]);
    expect(animationMocks.contextScope).toBe(track);
    const triggerVars = animationMocks.triggerVars as StoryTriggerVars;
    expect(triggerVars.trigger).toBe(track);
    expect(triggerVars.pin).toBe(stage);
    expect(triggerVars.pinSpacing).toBe(true);
    expect(triggerVars.scrub).toBe(true);
    expect(triggerVars.start()).toBe("top top+=68");
    expect(triggerVars.end()).toBe("+=1280");
    expect(animationMocks.lenisResize).toHaveBeenCalledOnce();

    act(() => triggerVars.onUpdate({ progress: 0.5 }));
    expect(activeStepRef.current).toBe(1);
    expect(onStepChange).toHaveBeenLastCalledWith(1);

    act(() => triggerVars.onUpdate({ progress: 0.6 }));
    expect(onStepChange).toHaveBeenCalledTimes(1);

    act(() => triggerVars.onUpdate({ progress: 0.9 }));
    expect(activeStepRef.current).toBe(2);
    expect(onStepChange).toHaveBeenLastCalledWith(2);
  });

  it("moves between trigger positions through Lenis and fully cleans up", async () => {
    const activeStepRef: MutableRefObject<number> = { current: 0 };
    const refs = createRefs();
    const { result, unmount } = renderHook(() =>
      useLandingSqlStory({
        activeStepRef,
        onStepChange: () => undefined,
        stageRef: refs.stageRef,
        trackRef: refs.trackRef,
      }),
    );

    await waitFor(() => expect(result.current.isCinematic).toBe(true));
    act(() => result.current.scrollToStep(1));
    expect(animationMocks.lenisScrollTo).toHaveBeenCalledWith(500, {
      immediate: true,
    });

    const ticker = animationMocks.tickerAdd.mock.calls[0]?.[0] as (
      time: number,
    ) => void;
    ticker(1.25);
    expect(animationMocks.lenisRaf).toHaveBeenCalledWith(1250);
    animationMocks.scrollListener?.();
    expect(animationMocks.triggerUpdate).toHaveBeenCalledOnce();

    unmount();
    expect(animationMocks.unsubscribe).toHaveBeenCalledOnce();
    expect(animationMocks.tickerRemove).toHaveBeenCalledWith(ticker);
    expect(animationMocks.contextRevert).toHaveBeenCalledOnce();
    expect(animationMocks.destroy).toHaveBeenCalledOnce();
    expect(animationMocks.tickerLagSmoothing).toHaveBeenLastCalledWith(500, 33);
  });

  it("stays manual for reduced motion and never creates duplicate runtimes", async () => {
    document.documentElement.dataset.reducedMotion = "true";
    const activeStepRef: MutableRefObject<number> = { current: 0 };
    const refs = createRefs();
    const { result } = renderHook(() =>
      useLandingSqlStory({
        activeStepRef,
        onStepChange: () => undefined,
        stageRef: refs.stageRef,
        trackRef: refs.trackRef,
      }),
    );

    expect(result.current.isCinematic).toBe(false);
    expect(animationMocks.lenisOptions).toHaveLength(0);

    document.documentElement.dataset.reducedMotion = "false";
    await waitFor(() => expect(result.current.isCinematic).toBe(true));
    act(() => mediaQuery.setMatches(true));
    expect(animationMocks.lenisOptions).toHaveLength(1);

    document.documentElement.dataset.reducedMotion = "true";
    await waitFor(() => expect(result.current.isCinematic).toBe(false));
    act(() => result.current.scrollToStep(2));
    expect(animationMocks.lenisScrollTo).not.toHaveBeenCalled();
  });
});
