export type AppScreen =
  | "home"
  | "learn"
  | "workspace"
  | "progress"
  | "settings";

export interface NavigateOptions {
  taskId?: string;
  onboarding?: boolean;
}

export type Navigate = (
  screen: AppScreen,
  options?: NavigateOptions,
) => void;
