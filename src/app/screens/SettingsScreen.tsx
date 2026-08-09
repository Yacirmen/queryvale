"use client";

import {
  BookOpenCheck,
  Download,
  ExternalLink,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import type { EditorSettings } from "../../features/progress/progressStore";
import { ConfirmationDialog } from "../components/Dialogs";

interface SettingsScreenProps {
  settings: EditorSettings;
  onChange: (settings: EditorSettings) => void;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
  onReset: () => Promise<void>;
  hasLocalAccount: boolean;
  profileName: string;
  onShowFirstGuide: () => void;
  onDeleteLocalProfile: () => Promise<boolean> | boolean;
  isDeletingProfile?: boolean;
}

export function SettingsScreen({
  settings,
  onChange,
  onExport,
  onImport,
  onReset,
  hasLocalAccount,
  profileName,
  onShowFirstGuide,
  onDeleteLocalProfile,
  isDeletingProfile = false,
}: SettingsScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      await onImport(file);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDeleteLocalProfile = async () => {
    const deleted = await onDeleteLocalProfile();
    if (deleted) setDeleteDialogOpen(false);
  };

  return (
    <>
      <main id="main-content" className="page" tabIndex={-1}>
        <div className="page-container">
          <div className="page-hero">
            <div>
              <div className="eyebrow">Çalışma ortamı</div>
              <h1>Ayarlar</h1>
              <p>
                Laboratuvarı çalışma biçimine göre ayarla. Tüm tercihler ve
                ilerleme bu tarayıcı profilinde kalır.
              </p>
            </div>
          </div>

          <div className="settings-layout">
            <aside className="settings-aside">
              <p>
                Düzenlemeler anında uygulanır. Editör boyutu, hareket tercihi ve
                tema JSON ilerleme dosyana da eklenir.
              </p>
            </aside>

            <div className="settings-form">
              <section className="settings-group">
                <h2>Görünüm</h2>
                <div className="setting-row">
                  <div className="setting-label">
                    <strong>Tema</strong>
                    <span>
                      Arayüz ve editör görünümünü birlikte değiştirir.
                    </span>
                  </div>
                  <div
                    className="segmented-control"
                    role="group"
                    aria-label="Tema"
                  >
                    <button
                      className={`segment ${
                        settings.theme === "light" ? "active" : ""
                      }`}
                      type="button"
                      onClick={() => onChange({ ...settings, theme: "light" })}
                    >
                      <Sun size={12} /> Açık
                    </button>
                    <button
                      className={`segment ${
                        settings.theme === "dark" ? "active" : ""
                      }`}
                      type="button"
                      onClick={() => onChange({ ...settings, theme: "dark" })}
                    >
                      <Moon size={12} /> Koyu
                    </button>
                  </div>
                </div>
                <div className="setting-row">
                  <div className="setting-label">
                    <strong>Azaltılmış hareket</strong>
                    <span>
                      Geçiş ve tamamlanma hareketlerini en aza indirir.
                    </span>
                  </div>
                  <button
                    className={`toggle ${settings.reducedMotion ? "active" : ""}`}
                    type="button"
                    role="switch"
                    aria-checked={settings.reducedMotion}
                    aria-label="Azaltılmış hareket"
                    onClick={() =>
                      onChange({
                        ...settings,
                        reducedMotion: !settings.reducedMotion,
                      })
                    }
                  />
                </div>
              </section>

              <section className="settings-group">
                <h2>Editör</h2>
                <div className="setting-row">
                  <div className="setting-label">
                    <strong>Yazı boyutu</strong>
                    <span>Monaco editöründeki kod boyutu.</span>
                  </div>
                  <label className="range-control">
                    <span className="sr-only">Editör yazı boyutu</span>
                    <input
                      type="range"
                      min="12"
                      max="22"
                      step="1"
                      value={settings.fontSize}
                      onChange={(event) =>
                        onChange({
                          ...settings,
                          fontSize: Number(event.target.value),
                        })
                      }
                    />
                    <span className="range-value">{settings.fontSize}px</span>
                  </label>
                </div>
                <div className="setting-row">
                  <div className="setting-label">
                    <strong>Satır yüksekliği</strong>
                    <span>Uzun sorgularda dikey okuma yoğunluğu.</span>
                  </div>
                  <label className="range-control">
                    <span className="sr-only">Editör satır yüksekliği</span>
                    <input
                      type="range"
                      min="1.2"
                      max="2"
                      step="0.05"
                      value={settings.lineHeight}
                      onChange={(event) =>
                        onChange({
                          ...settings,
                          lineHeight: Number(event.target.value),
                        })
                      }
                    />
                    <span className="range-value">
                      {settings.lineHeight.toFixed(2)}
                    </span>
                  </label>
                </div>
                <div className="setting-row">
                  <div className="setting-label">
                    <strong>Otomatik tamamlama</strong>
                    <span>
                      SQL anahtar kelime ve şema önerilerini gösterir.
                    </span>
                  </div>
                  <button
                    className={`toggle ${settings.autocomplete ? "active" : ""}`}
                    type="button"
                    role="switch"
                    aria-checked={settings.autocomplete}
                    aria-label="Otomatik tamamlama"
                    onClick={() =>
                      onChange({
                        ...settings,
                        autocomplete: !settings.autocomplete,
                      })
                    }
                  />
                </div>
              </section>

              <section className="settings-group">
                <h2>İlerleme verisi</h2>
                <div className="setting-row">
                  <div className="setting-label">
                    <strong>Yedekle veya taşı</strong>
                    <span>
                      Tamamlanan vakaları, sorguları, profil adını ve tercihleri
                      JSON olarak aktar. Başka bir profile ait kayıt içe
                      alınmadan önce onay istenir.
                    </span>
                  </div>
                  <div className="data-actions">
                    <button
                      className="soft-button"
                      type="button"
                      onClick={onExport}
                    >
                      <Download size={14} /> Dışa aktar
                    </button>
                    <button
                      className="soft-button"
                      type="button"
                      onClick={() => inputRef.current?.click()}
                    >
                      <Upload size={14} /> İçe aktar
                    </button>
                    <input
                      ref={inputRef}
                      className="sr-only"
                      type="file"
                      aria-label="İlerleme dosyası seç"
                      accept="application/json,.json"
                      onChange={(event) =>
                        void handleImport(event.target.files?.[0])
                      }
                    />
                  </div>
                </div>
                <div className="setting-row">
                  <div className="setting-label">
                    <strong>İlerlemeyi sıfırla</strong>
                    <span>
                      Vaka geçmişini temizler; profil adını ve çalışma
                      tercihlerini korur.
                    </span>
                  </div>
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => void onReset()}
                  >
                    <RotateCcw size={14} /> Sıfırla
                  </button>
                </div>
              </section>

              <section
                id="settings-help"
                className="settings-group"
                aria-labelledby="settings-help-title"
                tabIndex={-1}
              >
                <h2 id="settings-help-title">Yardım ve veri</h2>
                <div className="setting-row">
                  <div className="setting-label">
                    <strong>Başlangıç rehberi</strong>
                    <span>
                      Laboratuvarın temel adımlarını kaldığın vaka üzerinde
                      yeniden gör. İlerlemen veya sorgun sıfırlanmaz.
                    </span>
                  </div>
                  <button
                    className="soft-button"
                    type="button"
                    onClick={onShowFirstGuide}
                  >
                    <BookOpenCheck size={14} aria-hidden="true" /> Rehberi aç
                  </button>
                </div>
                <div className="setting-row">
                  <div className="setting-label">
                    <strong>Otomatik kayıt ve taşıma</strong>
                    <span>
                      SQL taslakların, ilerlemen ve karar notların bu cihazda
                      otomatik kaydedilir. Başka cihaza geçerken JSON yedeğini
                      dışa aktarıp orada içe alabilirsin.
                    </span>
                  </div>
                </div>
                <div className="setting-row">
                  <div className="setting-label">
                    <strong>Neden e-posta veya parola yok?</strong>
                    <span>
                      Queryvale bu sürümde sunucu hesabı veya bulut eşitleme
                      kullanmaz. Profil adın ve çalışmaların tarayıcında kalır;
                      e-posta ya da parola toplamak bu yüzden gereksizdir.
                    </span>
                  </div>
                </div>
                <div className="setting-row">
                  <div className="setting-label">
                    <strong>Geri bildirim ve destek</strong>
                    <span>
                      Bir akış çalışmıyorsa veya öğretici içerikte hata görürsen
                      GitHub üzerinden bize bildirebilirsin.
                    </span>
                  </div>
                  <a
                    className="soft-button"
                    href="https://github.com/Yacirmen/queryvale/issues/new"
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: "none" }}
                  >
                    Sorun bildir <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </div>
              </section>

              <section className="settings-group">
                <h2>Klavye kısayolları</h2>
                <div className="setting-row">
                  <div className="setting-label">
                    <strong>Çalışma alanında hız</strong>
                    <span>Mac’te ⌘, Windows/Linux’ta Ctrl kullanılır.</span>
                  </div>
                  <div className="data-actions" aria-label="Klavye kısayolları">
                    <span className="keycap">⌘/Ctrl + Enter · Çalıştır</span>
                    <span className="keycap">⌘/Ctrl + S · Kaydet</span>
                    <span className="keycap">⌘/Ctrl + K · Rota</span>
                    <span className="keycap">
                      ⇧ + ⌘/Ctrl + ←/→ · Önceki/sonraki vaka
                    </span>
                    <span className="keycap">Esc · Kapat</span>
                  </div>
                </div>
              </section>

              {hasLocalAccount ? (
                <section className="settings-group">
                  <h2>Profil ve veri</h2>
                  <div className="setting-row">
                    <div className="setting-label">
                      <strong>{profileName} profilini tamamen sil</strong>
                      <span>
                        İlerlemeyi sıfırlamak yalnız vaka geçmişini temizler ve
                        profilini korur. Bu işlem profil adını, sorguları,
                        puanları, kanıtları, notları ve tercihleri bu cihazdan
                        birlikte siler.
                      </span>
                    </div>
                    <button
                      className="danger-button"
                      type="button"
                      disabled={isDeletingProfile}
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      {isDeletingProfile ? "Siliniyor…" : "Profili sil"}
                    </button>
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Yerel profil ve tüm veriler silinsin mi?"
        description={`“${profileName}” profilinin adı, vaka ilerlemesi, SQL sorguları, puanları ve Kanıt Defteri bu cihazdan kalıcı olarak silinecek. Bu işlem ilerlemeyi sıfırlamaktan farklıdır ve geri alınamaz. Yedek almak istiyorsan Vazgeçip önce yukarıdaki JSON dışa aktarma seçeneğini kullan.`}
        confirmLabel="Profili ve verileri sil"
        cancelLabel="Vazgeç"
        tone="danger"
        busy={isDeletingProfile}
        onConfirm={() => void handleDeleteLocalProfile()}
        onClose={() => {
          if (!isDeletingProfile) setDeleteDialogOpen(false);
        }}
      />
    </>
  );
}
