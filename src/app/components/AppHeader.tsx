"use client";

import type { AppScreen, Navigate } from "../appTypes";

interface AppHeaderProps {
  screen: AppScreen;
  onNavigate: Navigate;
  onHomeStart?: () => void;
  onDataEngine?: () => void;
  homeStartLabel?: string;
}

export function AppHeader({
  screen,
  onNavigate,
  onHomeStart,
  onDataEngine,
  homeStartLabel,
}: AppHeaderProps) {
  const startStudio = onHomeStart ?? (() => onNavigate("workspace"));
  const openDataEngine =
    onDataEngine ?? (() => onNavigate("home", { anchor: "queryvale-studio" }));

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
            <strong className="brand-word">Queryvale</strong>
          </button>

          <nav className="reference-primary-nav" aria-label="Ana bölümler">
            <button
              className="reference-nav-link"
              type="button"
              onClick={() => onNavigate("learn")}
              aria-current={screen === "learn" ? "page" : undefined}
            >
              Rota
            </button>
            <button
              className="reference-nav-link"
              type="button"
              onClick={startStudio}
              aria-label="Studio — SQL Laboratuvarı"
              aria-current={screen === "workspace" ? "page" : undefined}
            >
              Studio
            </button>
            <button
              className="reference-nav-link"
              type="button"
              onClick={openDataEngine}
            >
              Veri Motoru
            </button>
            <a
              className="reference-nav-link"
              href="https://github.com/Yacirmen/queryvale#readme"
              target="_blank"
              rel="noreferrer"
            >
              Dokümanlar
            </a>
          </nav>

          <button
            className="landing-header-cta"
            type="button"
            onClick={startStudio}
            aria-label={homeStartLabel ?? "İlk vakaya başla"}
          >
            Hemen Başla
          </button>
        </div>
      </header>
    </>
  );
}
