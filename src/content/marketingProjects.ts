import { defineModule, type LessonTask } from "../types/lesson";
import { createTask } from "./curriculumTaskFactory";
import { MARKETING_PROJECT_TASK_INPUTS_PART_ONE } from "./marketingProjectsPartOne";
import { MARKETING_PROJECT_TASK_INPUTS_PART_TWO } from "./marketingProjectsPartTwo";

const marketingProjectInputs = [
  ...MARKETING_PROJECT_TASK_INPUTS_PART_ONE,
  ...MARKETING_PROJECT_TASK_INPUTS_PART_TWO,
];

/**
 * The studio deliberately reuses the verified lesson runtime. A project is
 * distinguished by scope and UI copy, not by a second evaluator or progress
 * model that could drift from the rest of the curriculum.
 */
export const marketingProjectTasks: LessonTask[] =
  marketingProjectInputs.map(createTask);

export const marketingProjectModule = defineModule({
  id: "module-11",
  slug: "marketing-analytics-project-studio",
  order: 11,
  contentKind: "projects" as const,
  title: "Pazarlama analitiği proje stüdyosu",
  subtitle: "Edinimden büyüme kararına 12 portföy teslimi üret.",
  description:
    "Funnel, kanal verimliliği, deney, retention, attribution ve bütçe kararlarını ilişkili pazarlama verileri üzerinde uçtan uca SQL projelerine dönüştür.",
  difficulty: "advanced" as const,
  estimatedMinutes: marketingProjectTasks.reduce(
    (total, task) => total + task.estimatedMinutes,
    0,
  ),
  topics: [
    "Funnel ve dönüşüm sağlığı",
    "Kanal edinim verimliliği",
    "A/B test ve incrementality",
    "Arama ve e-posta performansı",
    "RFM ve cohort retention",
    "Churn ve reactivation",
    "Multi-touch attribution",
    "Bütçe yönlendirme",
    "Yönetici büyüme skoru",
  ],
  prerequisites: ["module-10"],
  tasks: marketingProjectTasks,
});
