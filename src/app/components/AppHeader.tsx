"use client";

import {
  DatabaseZap,
  Moon,
  Settings2,
  Sun,
} from "lucide-react";
import type { AppScreen, Navigate } from "../appTypes";
import type { EditorSettings } from "../../features/progress/progressStore";

interface AppHeaderProps {
  screen: AppScreen;
  settings: EditorSettings;
  onNavigate: Navigate;
  onSettingsChange: (settings: EditorSettings) => void;
}

const navigation: Array<{
  id: AppScreen;
  label: string;
  dataNav?: string;
}> = [
  { id: "learn", label: "Öğrenme yolu" },
  { id: "workspace", label: "Laboratuvar" },
  { id: "progress", label: "İlerleme", dataNav: "progress" },
];

export function AppHeader({
  screen,
  settings,
  onNavigate,
  onSettingsChange,
}: AppHeaderProps) {
  const isDark = settings.theme === "dark";

  return (
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
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${screen === item.id ? "active" : ""}`}
              data-nav={item.dataNav}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={screen === item.id ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <span className="local-badge">Yerel &amp; çevrimdışı hazır</span>
          <button
            className="icon-button"
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
  );
}
