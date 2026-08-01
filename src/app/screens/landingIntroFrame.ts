export interface LandingIntroFrame {
  activeIndex: number;
  fromIndex: number;
  mix: number;
  progress: number;
  toIndex: number;
}

const INTRO_START_HOLD = 0.04;
const INTRO_END_HOLD = 0.12;
const INTRO_SCENE_TRAVEL = 1 - INTRO_START_HOLD - INTRO_END_HOLD;

export function getLandingIntroFrame(
  progress: number,
  sceneCount: number,
): LandingIntroFrame {
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const boundedProgress = Math.max(0, Math.min(1, safeProgress));
  const sceneProgress = Math.max(
    0,
    Math.min(1, (boundedProgress - INTRO_START_HOLD) / INTRO_SCENE_TRAVEL),
  );
  const lastIndex = Math.max(1, sceneCount - 1);
  const position = sceneProgress * lastIndex;
  const fromIndex = Math.min(lastIndex, Math.floor(position));
  const toIndex = Math.min(lastIndex, fromIndex + 1);
  const rawMix = fromIndex === toIndex ? 0 : position - fromIndex;
  const mix = rawMix * rawMix * (3 - 2 * rawMix);

  return {
    activeIndex: rawMix >= 0.5 ? toIndex : fromIndex,
    fromIndex,
    mix,
    progress: boundedProgress,
    toIndex,
  };
}

export function getLandingIntroProgressForScene(
  index: number,
  sceneCount: number,
): number {
  const lastIndex = Math.max(1, sceneCount - 1);
  const boundedIndex = Math.max(0, Math.min(lastIndex, index));
  if (boundedIndex === 0) return 0;
  return INTRO_START_HOLD + (boundedIndex / lastIndex) * INTRO_SCENE_TRAVEL;
}
