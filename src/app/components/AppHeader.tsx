"use client";

import {
  ChartNoAxesCombined,
  DatabaseZap,
  Moon,
  Route,
  Settings2,
  SquareTerminal,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { AppScreen, Navigate } from "../appTypes";
import type { EditorSettings } from "../../features/progress/progressStore";

interface AppHeaderProps {
  screen: AppScreen;
  profileName: string;
  settings: EditorSettings;
  onNavigate: Navigate;
  onSettingsChange: (settings: EditorSettings) => void;
}

const navigation: Array<{
  id: AppScreen;
  label: string;
  icon: LucideIcon;
  dataNav?: string;
}> = [
  { id: "learn", label: "Öğrenme yolu", icon: Route },
  { id: "workspace", label: "Laboratuvar", icon: SquareTerminal },
  {
    id: "progress",
    label: "İlerleme",
    icon: ChartNoAxesCombined,
    dataNav: "progress",
  },
];

function profileInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase("tr-TR") ?? "")
    .join("");
  return initials || "Q";
}

export function AppHeader({
  screen,
  profileName,
  settings,
  onNavigate,
  onSettingsChange,
}: AppHeaderProps) {
  const isDark = settings.theme === "dark";
  const navigationItems = navigation.map((item) => {
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        className={`nav-item ${screen === item.id ? "active" : ""}`}
        data-nav={item.dataNav}
        type="button"
        onClick={() => onNavigate(item.id)}
        aria-current={screen === item.id ? "page" : undefined}
      >
        <span className="nav-item-icon" aria-hidden="true">
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <span className="nav-item-label">{item.label}</span>
      </button>
    );
  });

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <button
            className="brand"
            type="button"
            onClick={() => onNavigate("home")}
            aria-label="Queryvale ana sayfa"
          >
            <span className="brand-mark" aria-hidden="true">
              <DatabaseZap size={18} strokeWidth={1.8} />
            </span>
            <span className="brand-word">Queryvale</span>
          </button>

          <nav className="primary-nav" aria-label="Ana menü">
            {navigationItems}
          </nav>

          <div className="header-actions">
            <button
              className={`profile-control ${screen === "progress" ? "active" : ""}`}
              type="button"
              onClick={() => onNavigate("progress")}
              aria-label={`${profileName} profilini ve ilerleme panelini aç`}
              aria-current={screen === "progress" ? "page" : undefined}
            >
              <span className="profile-avatar" aria-hidden="true">
                {profileInitials(profileName)}
              </span>
              <span className="profile-control-copy">
                <strong>{profileName}</strong>
                <small>Bu cihazdaki profil</small>
              </span>
            </button>
            <button
              className="icon-button header-theme-button"
              type="button"
              onClick={() =>
                onSettingsChange({
                  ...settings,
                  theme: isDark ? "light" : "dark",
                })
              }
              aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={() => onNavigate("settings")}
              aria-label="Ayarları aç"
            >
              <Settings2 size={16} />
            </button>
          </div>
        </div>
      </header>

      <nav className="mobile-primary-nav" aria-label="Mobil ana menü">
        {navigationItems}
      </nav>
    </>
  );
}
