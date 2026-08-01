import type { LessonLearningContent } from "../types/lesson";

export interface ProjectLearningSpec {
  title: string;
  conceptAnchor: string;
  outputGrain: string;
  acceptanceChecks: [string, string, string];
  dataNotes: readonly [string, ...string[]];
  executionChecks: [string, string];
  columnChecks: [string, string];
  rowChecks: readonly [string, string, ...string[]];
  orderChecks: [string, string];
  conceptChecks: [string, string];
  steps: [string, string, string];
  whyItWorks: string;
  edgeCases: readonly [string, string, ...string[]];
  workplaceImpact: string;
  transferPrompt: string;
  transferReveal: string;
}

/**
 * Marketing projects share the same coaching shape, while every sentence and
 * check remains explicitly authored from the project's metric and data risks.
 */
export function createProjectLearningContent(
  spec: ProjectLearningSpec,
): LessonLearningContent {
  return {
    learningBrief: {
      conceptAnchor: spec.conceptAnchor,
      outputGrain: spec.outputGrain,
      acceptanceChecks: [...spec.acceptanceChecks],
      dataNotes: [...spec.dataNotes],
    },
    coaching: {
      "execution-error": {
        title: `${spec.title}: sorgu zincirini küçük adımlarda doğrula`,
        checks: [...spec.executionChecks],
      },
      "columns-wrong": {
        title: `${spec.title}: proje teslimini kolon sözleşmesine hizala`,
        checks: [...spec.columnChecks],
      },
      "rows-wrong": {
        title: `${spec.title}: metriği ve satır tanesini yeniden denetle`,
        checks: [...spec.rowChecks],
      },
      "order-wrong": {
        title: `${spec.title}: karar sırasını görünür kıl`,
        checks: [...spec.orderChecks],
      },
      "required-concept-missing": {
        title: `${spec.title}: aktarılabilir analiz yaklaşımını kullan`,
        checks: [...spec.conceptChecks],
      },
    },
    debrief: {
      steps: [...spec.steps],
      whyItWorks: spec.whyItWorks,
      edgeCases: [...spec.edgeCases],
      workplaceImpact: spec.workplaceImpact,
      transfer: {
        prompt: spec.transferPrompt,
        reveal: spec.transferReveal,
      },
    },
  };
}
