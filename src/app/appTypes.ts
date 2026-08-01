export type AppScreen =
  "home" | "learn" | "workspace" | "progress" | "settings";

export interface NavigateOptions {
  taskId?: string;
  onboarding?: boolean;
  anchor?: "queryvale-studio";
}

export type Navigate = (screen: AppScreen, options?: NavigateOptions) => void;
