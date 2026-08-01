import { describe, expect, it } from "vitest";
import {
  calculateCaseScore,
  getAwardedCaseScore,
  getCurrentCaseScore,
  summarizeScores,
} from "./scoring";

describe("analysis scoring", () => {
  it.each([
    [[], 10],
    [[0], 7],
    [[0, 1], 4],
    [[0, 1, 2], 1],
  ])("awards %s hints as %i points", (hints, expected) => {
    expect(calculateCaseScore(hints, false)).toBe(expected);
  });

  it("counts each valid hint once and gives zero after a full solution", () => {
    expect(calculateCaseScore([0, 0, 7, -1], false)).toBe(7);
    expect(calculateCaseScore([], true)).toBe(0);
    expect(calculateCaseScore([0, 1, 2], true)).toBe(0);
  });

  it("separates a live potential score from a locked awarded score", () => {
    expect(getCurrentCaseScore(undefined)).toBe(10);
    expect(
      getAwardedCaseScore({
        completed: false,
        hintsUsed: [0],
        solutionRevealed: false,
      }),
    ).toBe(0);
    expect(
      getCurrentCaseScore({
        completed: true,
        hintsUsed: [0, 1, 2],
        solutionRevealed: true,
        scoreAwarded: 7,
      }),
    ).toBe(7);
  });

  it("aggregates only the requested curriculum cases", () => {
    const summary = summarizeScores(["a", "b", "c", "d"], {
      a: {
        completed: true,
        hintsUsed: [],
        solutionRevealed: false,
        scoreAwarded: 10,
      },
      b: {
        completed: true,
        hintsUsed: [0],
        solutionRevealed: false,
        scoreAwarded: 7,
      },
      c: {
        completed: true,
        hintsUsed: [0, 1, 2],
        solutionRevealed: true,
        scoreAwarded: 0,
      },
      d: {
        completed: false,
        hintsUsed: [0],
        solutionRevealed: false,
      },
      stale: {
        completed: true,
        hintsUsed: [],
        solutionRevealed: false,
        scoreAwarded: 10,
      },
    });

    expect(summary).toEqual({
      earned: 17,
      possible: 40,
      completedPossible: 30,
      completed: 3,
      independent: 1,
      hintAssisted: 1,
      solutionAssisted: 1,
    });
  });
});
