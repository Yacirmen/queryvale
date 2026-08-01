"use client";

import type { AppScreen, Navigate } from "../appTypes";

interface AppHeaderProps {
  screen: AppScreen;
  onNavigate: Navigate;
  onStudio?: () => void;
  onHowItWorks?: () => void;
  onStart?: () => void;
  startLabel?: string;
  disabled?: boolean;
}

export function AppHeader({
  screen,
  onNavigate,
  onStudio,
  onHowItWorks,
  onStart,
  startLabel,
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

      <header className="app-header" aria-busy={disabled}>
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
        </div>
      </header>
    </>
  );
}
