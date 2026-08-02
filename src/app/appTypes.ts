export type AppScreen =
  | "home"
  | "account"
  | "learn"
  | "workspace"
  | "python"
  | "progress"
  | "settings";

export interface NavigateOptions {
  taskId?: string;
  onboarding?: boolean;
  anchor?: "queryvale-studio" | "settings-help";
}

export type Navigate = (screen: AppScreen, options?: NavigateOptions) => void;
