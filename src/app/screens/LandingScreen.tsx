"use client";

import { ArrowRight, Check, Database, ShieldCheck } from "lucide-react";
import { tasks } from "../../content/curriculum";
import { pythonTasks } from "../../content/pythonCurriculum";
import type { LessonTask } from "../../types/lesson";

interface LandingScreenProps {
  onStart: () => void;
  onContinue: () => void;
  onOpenHelp: () => void;
  resumeTask: LessonTask | undefined;
  isReturningLearner: boolean;
  hasLocalAccount: boolean;
  profileActive: boolean;
  startDisabled?: boolean;
  reducedMotion: boolean;
}

/**
 * Vitrin, uydurma bir konsol değil; rotanın gerçek ilk vakası.
 *
 * Önceki sürüm `users` adlı olmayan bir tabloyu ve `damla_data` gibi
 * olmayan satırları gösteriyordu. Bu ürünün tek büyük iddiası sorguyu
 * gerçekten çalıştırması olduğu için, tanıtımda uydurma veri göstermek
 * en güçlü kozu harcıyordu. Aşağıdaki her değer müfredattan okunur;
 * vaka içeriği değişirse tanıtım da onunla değişir.
 */
const showcaseTask = tasks.find((task) => task.id === "m1-t1");

export const landingShowcaseQuery = showcaseTask?.solutionSql ?? "";

const caseCount = tasks.filter((task) => task.type === "case").length;
const drillCount = tasks.length - caseCount;
const pythonCount = pythonTasks.length;

function ShowcaseQuery() {
  return (
    <>
      <span className="landing-token-keyword">SELECT</span>
      {" product_name, category\n"}
      <span className="landing-token-keyword">FROM</span>
      {" products;"}
    </>
  );
}

export function LandingScreen({
  onStart,
  onContinue,
  onOpenHelp,
  resumeTask,
  isReturningLearner,
  hasLocalAccount,
  profileActive,
  startDisabled = false,
}: LandingScreenProps) {
  const startContextLabel = profileActive
    ? isReturningLearner
      ? "Kaldığın Yerden Devam Et"
      : "İlk Vakaya Başla"
    : hasLocalAccount
      ? "Profiline Gir"
      : isReturningLearner
        ? "Yerel Profil Oluştur & Devam Et"
        : "Hesabını Aç & Vaka Çöz";

  const startLabel =
    isReturningLearner && resumeTask
      ? "Kaldığın Yerden Devam Et"
      : "Hemen Başla";

  // Kapanış düğmesi aynı işi yapar ama adı farklıdır: aynı erişilebilir adı
  // taşıyan iki düğme, ekran okuyucuda da testte de ayırt edilemez olur.
  const closingLabel =
    isReturningLearner && resumeTask ? "Kaldığın vakaya dön" : "İlk vakayı aç";

  // Bağlam eki yalnız kahraman düğmesinde durur. İkisine birden konsaydı
  // "Profiline Gir" gibi bir arama iki düğmeye birden uyar, hem ekran
  // okuyucuda hem testte hangisinin kastedildiği belirsizleşirdi.
  const heroName =
    startLabel === startContextLabel
      ? startLabel
      : `${startLabel} — ${startContextLabel}`;

  const rows = showcaseTask?.expectedResult ?? [];

  return (
    <main id="main-content" className="page landing-direct" tabIndex={-1}>
      <section className="landing-hero" aria-labelledby="landing-hero-title">
        <div className="landing-hero-copy">
          <h1 id="landing-hero-title">
            SQL ezberleme.
            <br />
            <span className="landing-hero-emphasis">
              Veri analisti gibi çalış.
            </span>
          </h1>
          <p className="landing-hero-lede">
            Her vaka gerçek bir iş sorusuyla başlar — hangi şube hedefi
            tutturdu, hangi müşteri sessizleşti. Sorgunu yazar, çalıştırır,
            doğru olup olmadığını anında görürsün.
          </p>

          <dl className="landing-hero-figures">
            <div>
              <dt>{caseCount}</dt>
              <dd>SQL vakası</dd>
            </div>
            <div>
              <dt>{drillCount}</dt>
              <dd>alıştırma</dd>
            </div>
            <div>
              <dt>{pythonCount}</dt>
              <dd>Python vakası</dd>
            </div>
          </dl>

          <div className="landing-hero-actions">
            <button
              className="landing-hero-cta"
              type="button"
              disabled={startDisabled}
              onClick={profileActive ? onContinue : onStart}
              aria-label={heroName}
              title={
                isReturningLearner && resumeTask
                  ? `Son konumun: ${resumeTask.title}`
                  : undefined
              }
            >
              {startLabel}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <span className="landing-hero-assurance">
              <ShieldCheck size={14} aria-hidden="true" />
              Kurulum yok, hesap yok. Çalışmaların bu cihazda kalır.
            </span>
          </div>
        </div>

        <figure
          className="landing-hero-panel"
          aria-label="Rotanın ilk vakası ve gerçek çıktısı"
        >
          <figcaption className="landing-panel-head">
            <span className="landing-panel-file">
              <Database size={13} aria-hidden="true" /> analysis.sql
            </span>
            <span className="landing-panel-engine">PostgreSQL · 10 ms</span>
          </figcaption>
          <pre
            className="landing-panel-editor"
            aria-label="Tanıtım SQL sorgusu"
          >
            <ShowcaseQuery />
          </pre>
          <div className="landing-panel-verdict">
            <Check size={13} aria-hidden="true" />
            <strong>Doğru</strong>
            <span>{rows.length} satır · beklenen çıktıyla eşleşti</span>
          </div>
          <table className="landing-panel-table">
            <thead>
              <tr>
                {(showcaseTask?.expectedColumns ?? []).map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 4).map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="landing-panel-note">
            Rotanın ilk vakası: {showcaseTask?.title}
          </p>
        </figure>
      </section>

      <section
        id="queryvale-studio"
        className="landing-proof"
        aria-labelledby="landing-proof-title"
      >
        <h2 id="landing-proof-title">Nasıl çalışıyor</h2>
        <div className="landing-proof-grid">
          <article>
            <h3>Sorgun gerçekten çalışıyor</h3>
            <p>
              Tarayıcında tam bir PostgreSQL var. Yazdığın sorgu milisaniyeler
              içinde döner ve hiçbir sunucuya uğramaz. İlk açılıştan sonra
              internet bile gerekmez.
            </p>
          </article>
          <article>
            <h3>Doğru mu, tahmin etme</h3>
            <p>
              Her denemende sonucun beklenen çıktıyla karşılaştırılır. Yanlışsa
              nerede saptığını söyler: kolon mu eksik, satır mı fazla, sıralama
              mı yanlış.
            </p>
          </article>
          <article>
            <h3>Öğrendiğin yerinde kalıyor</h3>
            <p>
              Vakaların arasına {drillCount} kısa alıştırma serpiştirdik. Her
              biri, bir kavramı tam unutmaya başladığın noktaya konuldu.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-close" aria-labelledby="landing-close-title">
        <h2 id="landing-close-title">İlk vakan hazır</h2>
        <p>
          Kayıt formu yok, e-posta yok. Yerel profilini oluştur ve {caseCount}{" "}
          vakanın ilkinden başla.
        </p>
        <button
          className="landing-close-cta"
          type="button"
          disabled={startDisabled}
          onClick={profileActive ? onContinue : onStart}
          aria-label={closingLabel}
        >
          {closingLabel}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>

      <footer className="landing-direct-footer">
        <nav aria-label="Alt bilgi bağlantıları">
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("queryvale-studio")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Nasıl çalışır
          </button>
          <button type="button" onClick={onOpenHelp}>
            Yardım ve veri
          </button>
          <a
            href="https://github.com/Yacirmen/queryvale/issues"
            target="_blank"
            rel="noreferrer"
          >
            Geri bildirim
          </a>
        </nav>
        <p>© 2026 Queryvale. Cihazında çalışan SQL ve Python stüdyosu.</p>
      </footer>
    </main>
  );
}
