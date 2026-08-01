"use client";

import {
  DatabaseZap,
  Moon,
  Route,
  Settings2,
  SquareTerminal,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { EditorSettings } from "../../features/progress/progressStore";
import type { AppScreen, Navigate } from "../appTypes";

interface AppHeaderProps {
  screen: AppScreen;
  profileName: string;
  settings: EditorSettings;
  onNavigate: Navigate;
  onSettingsChange: (settings: EditorSettings) => void;
}

interface HeaderDestination {
  id: "learn" | "workspace" | "progress";
  label: string;
  shortLabel: string;
  description: string;
  icon?: LucideIcon;
  dataNav?: string;
}

const destinations: HeaderDestination[] = [
  {
    id: "learn",
    label: "Rota",
    shortLabel: "Rota",
    description: "Bölümler ve sıradaki vaka",
    icon: Route,
  },
  {
    id: "workspace",
    label: "SQL Laboratuvarı",
    shortLabel: "Laboratuvar",
    description: "Sorgunu yaz ve çalıştır",
    icon: SquareTerminal,
  },
  {
    id: "progress",
    label: "Profilim",
    shortLabel: "Profilim",
    description: "İlerleme ve Kanıt Defteri",
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

function HeaderDestinationButton({
  destination,
  isActive,
  profileName,
  variant,
  onNavigate,
}: {
  destination: HeaderDestination;
  isActive: boolean;
  profileName: string;
  variant: "desktop" | "mobile";
  onNavigate: Navigate;
}) {
  const Icon = destination.icon;
  const descriptionId = `${variant}-${destination.id}-description`;
  const description =
    destination.id === "progress"
      ? `${profileName} · ${destination.description}`
      : destination.description;

  return (
    <button
      className={`nav-item ${isActive ? "active" : ""}`}
      data-nav={destination.dataNav}
      type="button"
      onClick={() => onNavigate(destination.id)}
      aria-current={isActive ? "page" : undefined}
      aria-label={destination.label}
      aria-describedby={descriptionId}
    >
      <span className="nav-item-icon" aria-hidden="true">
        {destination.id === "progress" ? (
          <span className="nav-profile-avatar">
            {profileInitials(profileName)}
          </span>
        ) : (
          Icon && <Icon size={17} strokeWidth={1.8} />
        )}
      </span>
      <span className="nav-item-copy">
        <strong className="nav-item-label">
          <span className="nav-item-label-desktop">{destination.label}</span>
          <span className="nav-item-label-mobile">
            {destination.shortLabel}
          </span>
        </strong>
        <small id={descriptionId} className="nav-item-description">
          {description}
        </small>
      </span>
      {isActive && (
        <span className="nav-current" aria-hidden="true">
          Şu an
        </span>
      )}
    </button>
  );
}

export function AppHeader({
  screen,
  profileName,
  settings,
  onNavigate,
  onSettingsChange,
}: AppHeaderProps) {
  const isDark = settings.theme === "dark";

  const renderDestinations = (variant: "desktop" | "mobile") =>
    destinations.map((destination) => (
      <HeaderDestinationButton
        key={destination.id}
        destination={destination}
        isActive={screen === destination.id}
        profileName={profileName}
        variant={variant}
        onNavigate={onNavigate}
      />
    ));

  return (
    <>
      <a className="skip-link" href="#main-content">
        İçeriğe geç
      </a>

      <header className="app-header">
        <div className="header-inner">
          <button
            className="brand"
            type="button"
            onClick={() => onNavigate("home")}
            aria-label="Queryvale ana sayfa"
            aria-current={screen === "home" ? "page" : undefined}
          >
            <span className="brand-mark" aria-hidden="true">
              <DatabaseZap size={19} strokeWidth={1.8} />
            </span>
            <span className="brand-copy">
              <strong className="brand-word">Queryvale</strong>
              <small className="brand-tagline">Sorudan kanıta</small>
            </span>
          </button>

          <nav className="primary-nav" aria-label="Çalışma alanları">
            {renderDestinations("desktop")}
          </nav>

          <div
            className="header-actions"
            role="group"
            aria-label="Görünüm ve tercihler"
          >
            <button
              className="header-utility header-theme-control"
              type="button"
              onClick={() =>
                onSettingsChange({
                  ...settings,
                  theme: isDark ? "light" : "dark",
                })
              }
              aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
            >
              <span className="header-utility-icon" aria-hidden="true">
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </span>
              <span className="header-utility-copy" aria-hidden="true">
                <strong>{isDark ? "Açık görünüm" : "Koyu görünüm"}</strong>
                <small>Temayı değiştir</small>
              </span>
            </button>
            <button
              className={`header-utility header-settings-control ${
                screen === "settings" ? "active" : ""
              }`}
              type="button"
              onClick={() => onNavigate("settings")}
              aria-label="Ayarları aç"
              aria-current={screen === "settings" ? "page" : undefined}
            >
              <span className="header-utility-icon" aria-hidden="true">
                <Settings2 size={16} />
              </span>
              <span className="header-utility-copy" aria-hidden="true">
                <strong>Ayarlar</strong>
                <small>Tercihler ve yedek</small>
              </span>
            </button>
          </div>
        </div>
      </header>

      <nav className="mobile-primary-nav" aria-label="Ana menü">
        {renderDestinations("mobile")}
      </nav>
    </>
  );
}
