/**
 * Python lessons deliberately have their own contract. A Python exercise is
 * evaluated from the DataFrame assigned to `result`; it is not a SQL lesson
 * with a few optional Python fields attached.
 */
export type PythonScalar = string | number | boolean | null;

export type PythonDifficulty = "beginner" | "intermediate";

export type PythonPackage = "pandas";

export type PythonDataFrameDtype =
  "object" | "string" | "int64" | "float64" | "bool" | "datetime64[ns]";

export interface PythonDatasetFixture {
  name: string;
  variableName: string;
  description: string;
  rows: Array<Record<string, PythonScalar>>;
}

export interface PythonHint {
  title: string;
  body: string;
}

export interface PythonTaskTransfer {
  prompt: string;
  reveal: string;
}

export interface PythonTaskDebrief {
  steps: [string, string, string];
  whyItWorks: string;
  edgeCases: string[];
  workplaceImpact: string;
  transfer: PythonTaskTransfer;
}

export interface PythonLessonTask {
  id: string;
  slug: string;
  moduleId: string;
  track: "python";
  title: string;
  subtitle: string;
  scenario: string;
  objective: string;
  outputGrain: string;
  difficulty: PythonDifficulty;
  estimatedMinutes: number;
  prerequisites: string[];
  concepts: string[];
  dataNotes: string[];
  datasets: PythonDatasetFixture[];
  packages: [PythonPackage];
  starterCode: string;
  resultVariable: "result";
  expectedColumns: string[];
  expectedRows: PythonScalar[][];
  expectedDtypes?: Partial<Record<string, PythonDataFrameDtype>>;
  orderSensitive: boolean;
  numericTolerance: number;
  acceptanceChecks: [string, string, string];
  hints: [PythonHint, PythonHint, PythonHint];
  solutionCode: string;
  explanation: string;
  completionMessage: string;
  debrief: PythonTaskDebrief;
  nextTaskId: string | null;
}

export interface PythonCurriculumModule {
  id: string;
  slug: string;
  track: "python";
  order: number;
  title: string;
  subtitle: string;
  description: string;
  outcome: string;
  difficulty: PythonDifficulty;
  estimatedMinutes: number;
  topics: string[];
  prerequisites: string[];
  tasks: PythonLessonTask[];
}

export interface PythonCurriculum {
  modules: PythonCurriculumModule[];
  tasks: PythonLessonTask[];
}

export const definePythonTask = <T extends PythonLessonTask>(task: T): T =>
  task;
