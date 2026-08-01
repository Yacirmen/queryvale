export const MAX_CASE_SCORE = 10;
export const HINT_SCORE_PENALTY = 3;
export const MAX_CASE_HINTS = 3;
export const VALID_CASE_SCORES = [0, 1, 4, 7, 10] as const;

export function isValidCaseScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    VALID_CASE_SCORES.some((score) => score === value)
  );
}

export interface ScoreableTaskProgress {
  completed: boolean;
  hintsUsed: readonly number[];
  solutionRevealed: boolean;
  scoreAwarded?: number;
}

export interface ScoreSummary {
  earned: number;
  possible: number;
  completedPossible: number;
  completed: number;
  independent: number;
  hintAssisted: number;
  solutionAssisted: number;
}

function validUniqueHintCount(hintsUsed: readonly number[]): number {
  return new Set(
    hintsUsed.filter(
      (hintIndex) =>
        Number.isInteger(hintIndex) &&
        hintIndex >= 0 &&
        hintIndex < MAX_CASE_HINTS,
    ),
  ).size;
}

export function calculateCaseScore(
  hintsUsed: readonly number[],
  solutionRevealed: boolean,
): number {
  if (solutionRevealed) return 0;
  return Math.max(
    0,
    MAX_CASE_SCORE - validUniqueHintCount(hintsUsed) * HINT_SCORE_PENALTY,
  );
}

export function getAwardedCaseScore(
  taskProgress: ScoreableTaskProgress | undefined,
): number {
  if (!taskProgress?.completed) return 0;
  return (
    taskProgress.scoreAwarded ??
    calculateCaseScore(taskProgress.hintsUsed, taskProgress.solutionRevealed)
  );
}

export function getCurrentCaseScore(
  taskProgress: ScoreableTaskProgress | undefined,
): number {
  if (!taskProgress) return MAX_CASE_SCORE;
  if (taskProgress.completed) return getAwardedCaseScore(taskProgress);
  return calculateCaseScore(
    taskProgress.hintsUsed,
    taskProgress.solutionRevealed,
  );
}

export function summarizeScores(
  taskIds: readonly string[],
  taskProgressById: Readonly<Record<string, ScoreableTaskProgress | undefined>>,
): ScoreSummary {
  return taskIds.reduce<ScoreSummary>(
    (summary, taskId) => {
      const taskProgress = taskProgressById[taskId];
      if (!taskProgress?.completed) return summary;
      const score = getAwardedCaseScore(taskProgress);
      return {
        ...summary,
        earned: summary.earned + score,
        completedPossible: summary.completedPossible + MAX_CASE_SCORE,
        completed: summary.completed + 1,
        independent: summary.independent + Number(score === MAX_CASE_SCORE),
        hintAssisted:
          summary.hintAssisted + Number(score > 0 && score < MAX_CASE_SCORE),
        solutionAssisted: summary.solutionAssisted + Number(score === 0),
      };
    },
    {
      earned: 0,
      possible: taskIds.length * MAX_CASE_SCORE,
      completedPossible: 0,
      completed: 0,
      independent: 0,
      hintAssisted: 0,
      solutionAssisted: 0,
    },
  );
}
