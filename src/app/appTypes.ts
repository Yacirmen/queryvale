export type AppScreen =
  "home" | "account" | "learn" | "workspace" | "progress" | "settings";

export interface NavigateOptions {
  taskId?: string;
  onboarding?: boolean;
  anchor?: "queryvale-studio";
}

export type Navigate = (screen: AppScreen, options?: NavigateOptions) => void;
