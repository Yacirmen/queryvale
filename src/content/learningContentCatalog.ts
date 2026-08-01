import type { LessonLearningContent } from "../types/lesson";
import { MODULE_45_LEARNING_CONTENT } from "./module45LearningContent";
import { MODULE_67_LEARNING_CONTENT } from "./module67LearningContent";
import { MODULE_810_LEARNING_CONTENT } from "./module810LearningContent";
import { MODULE_8_EXPANSION_LEARNING_CONTENT } from "./module8ExpansionLearningContent";
import { MODULE_9_EXPANSION_LEARNING_CONTENT } from "./module9ExpansionLearningContent";
import { MODULE_10_EXPANSION_LEARNING_CONTENT } from "./module10ExpansionLearningContent";
import { TASK_LEARNING_CONTENT } from "./taskLearningContent";

/**
 * One authored catalog keeps curriculum construction deterministic while the
 * module files remain small enough for focused content review.
 */
export const AUTHORED_TASK_LEARNING_CONTENT: Readonly<
  Record<string, LessonLearningContent>
> = {
  ...TASK_LEARNING_CONTENT,
  ...MODULE_45_LEARNING_CONTENT,
  ...MODULE_67_LEARNING_CONTENT,
  ...MODULE_810_LEARNING_CONTENT,
  ...MODULE_8_EXPANSION_LEARNING_CONTENT,
  ...MODULE_9_EXPANSION_LEARNING_CONTENT,
  ...MODULE_10_EXPANSION_LEARNING_CONTENT,
};
