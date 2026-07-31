export interface LandingStoryFrame {
  activeIndex: number;
  fromIndex: number;
  mix: number;
  progress: number;
  toIndex: number;
}

export const LANDING_STORY_SCENE_COUNT = 5;

export function getLandingStoryFrame(progress: number): LandingStoryFrame {
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const boundedProgress = Math.max(0, Math.min(1, safeProgress));
  const lastIndex = LANDING_STORY_SCENE_COUNT - 1;
  const position = boundedProgress * lastIndex;
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
