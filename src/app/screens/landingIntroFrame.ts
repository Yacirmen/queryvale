export const LANDING_STORY_STEP_PROGRESS = [0, 0.5, 0.88] as const;

export function getLandingStoryStep(progress: number): number {
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const boundedProgress = Math.max(0, Math.min(1, safeProgress));
  if (boundedProgress < 0.34) return 0;
  if (boundedProgress < 0.72) return 1;
  return 2;
}

export function getLandingStoryProgressForStep(index: number): number {
  const boundedIndex = Math.max(
    0,
    Math.min(LANDING_STORY_STEP_PROGRESS.length - 1, Math.round(index)),
  );
  return LANDING_STORY_STEP_PROGRESS[boundedIndex] ?? 0;
}
