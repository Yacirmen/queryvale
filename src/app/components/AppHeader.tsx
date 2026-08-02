"use client";

import { Settings2 } from "lucide-react";
import type { AppScreen, Navigate } from "../appTypes";

type HeaderAccountStatus = "loading" | "guest" | "local";

interface AppHeaderProps {
  screen: AppScreen;
  onNavigate: Navigate;
  onStudio?: () => void;
  onHowItWorks?: () => void;
  onStart?: () => void;
  startLabel?: string;
  accountStatus?: HeaderAccountStatus;
  profileName?: string;
  disabled?: boolean;
}

function profileInitials(profileName?: string): string {
  const initials = (profileName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase("tr-TR") ?? "")
    .join("");

  return initials || "QV";
}

export function AppHeader({
  screen,
  onNavigate,
  onStudio,
  onHowItWorks,
  onStart,
  startLabel,
  accountStatus = "guest",
  profileName,
  disabled = false,
}: AppHeaderProps) {
  const openStudio = onStudio ?? (() => onNavigate("workspace"));
  const openHowItWorks =
    onHowItWorks ?? (() => onNavigate("home", { anchor: "queryvale-studio" }));
  const start = onStart ?? (() => onNavigate("account"));

  return (
    <>
      <a className="skip-link" href="#main-content">
        İçeriğe geç
      </a>

      <header
        className="app-header"
        aria-busy={disabled || accountStatus === "loading"}
      >
        <div className="header-inner">
          <button
            className="brand"
            type="button"
            disabled={disabled}
            onClick={() => onNavigate("home")}
            aria-label="Queryvale ana sayfa"
            aria-current={screen === "home" ? "page" : undefined}
          >
            <strong className="brand-word">Queryvale</strong>
          </button>

          <nav className="reference-primary-nav" aria-label="Ana bölümler">
            <button
              className="reference-nav-link"
              type="button"
              disabled={disabled}
              onClick={() => onNavigate("learn")}
              aria-current={screen === "learn" ? "page" : undefined}
            >
              Rota
            </button>
            <button
              className="reference-nav-link"
              type="button"
              disabled={disabled}
              onClick={openStudio}
              aria-label="Studio — SQL Laboratuvarı"
              aria-current={screen === "workspace" ? "page" : undefined}
            >
              Studio
            </button>
            <button
              className="reference-nav-link"
              type="button"
              disabled={disabled}
              onClick={openHowItWorks}
            >
              Nasıl Çalışır
            </button>
          </nav>

          {accountStatus === "loading" ? (
            <span className="header-account-placeholder" aria-hidden="true" />
          ) : accountStatus === "local" ? (
            <div
              className="header-account-actions"
              role="group"
              aria-label="Profil işlemleri"
            >
              <button
                className="header-profile-action"
                type="button"
                disabled={disabled}
                onClick={() => onNavigate("progress")}
                aria-label={`Profil — ${profileName?.trim() || "yerel kullanıcı"}`}
                aria-current={screen === "progress" ? "page" : undefined}
              >
                <span className="header-profile-avatar" aria-hidden="true">
                  {profileInitials(profileName)}
                </span>
                <span>Profil</span>
              </button>
              <button
                className="header-settings-action"
                type="button"
                disabled={disabled}
                onClick={() => onNavigate("settings")}
                aria-label="Ayarlar"
                aria-current={screen === "settings" ? "page" : undefined}
              >
                <Settings2 size={17} strokeWidth={1.9} aria-hidden="true" />
                <span className="header-settings-label">Ayarlar</span>
              </button>
            </div>
          ) : (
            <button
              className="landing-header-cta"
              type="button"
              disabled={disabled}
              onClick={start}
              aria-label={`Hemen Başla — ${startLabel ?? "hesap aç veya giriş yap"}`}
              aria-current={screen === "account" ? "page" : undefined}
            >
              Hemen Başla
            </button>
          )}
        </div>
      </header>
    </>
  );
}
