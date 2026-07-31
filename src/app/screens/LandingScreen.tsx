"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Code2,
  DatabaseZap,
  Gauge,
  HardDrive,
  Rows3,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Navigate } from "../appTypes";

interface LandingScreenProps {
  onNavigate: Navigate;
}

const missions = [
  {
    domain: "Perakende operasyonu",
    title: "Hangi şube hedefin gerisinde?",
    copy: "Net satışı bölge ve şube düzeyinde özetle; hedefe uzaklığı karar ekibine hazırla.",
    difficulty: "Başlangıç",
    minutes: 8,
    taskId: "m1-t1",
  },
  {
    domain: "Müşteri analitiği",
    title: "Sessizce kaybolan müşterileri bul",
    copy: "Son sipariş tarihini ve sipariş değerini kullanarak riskli müşteri grubunu ayır.",
    difficulty: "Orta",
    minutes: 14,
    taskId: "m2-t3",
  },
  {
    domain: "Finansal kontrol",
    title: "Tutar uyuşmazlığını izole et",
    copy: "İşlem akışındaki tutarsız satırları belirle ve inceleme kuyruğu için temiz çıktı üret.",
    difficulty: "İleri",
    minutes: 18,
    taskId: "m3-t4",
  },
];

const roadmapRows = [
  ["01", "Veriyle ilk temas", ["SELECT", "DISTINCT", "ORDER BY"], "4 görev"],
  ["02", "Veriyi filtreleme", ["WHERE", "BETWEEN", "NULL"], "4 görev"],
  ["03", "Hesaplama ve dönüşüm", ["CASE", "CAST", "DATE"], "4 görev"],
  ["04", "Özetleme", ["GROUP BY", "HAVING", "SUM"], "1 görev"],
  ["05", "Tabloları birleştirme", ["JOIN", "KEYS", "RELATIONS"], "1 görev"],
];

export function LandingScreen({ onNavigate }: LandingScreenProps) {
  return (
    <main className="page">
      <section className="page-container landing-hero">
        <div className="hero-copy">
          <div className="eyebrow">İnteraktif veri operasyon laboratuvarı</div>
          <h1>
            Soruyu sorguya,
            <span>sorguyu kanıta dönüştür.</span>
          </h1>
          <p>
            SQL’i slaytlardan değil, gerçek bir veri ekibinin iş
            senaryolarından öğren. Şemayı incele, sorgunu gerçek PostgreSQL
            üzerinde çalıştır ve sonucun neden doğru ya da yanlış olduğunu gör.
          </p>
          <div className="hero-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                onNavigate("workspace", {
                  taskId: "m1-t1",
                  onboarding: true,
                })
              }
            >
              İlk vakayı aç
              <ArrowRight size={16} />
            </button>
            <button
              className="soft-button"
              type="button"
              onClick={() => onNavigate("learn")}
            >
              Öğrenme yolunu keşfet
            </button>
          </div>
          <div className="hero-note">
            <span>
              <Check size={13} /> Hesap gerekmez
            </span>
            <span>
              <Check size={13} /> SQL tarayıcında çalışır
            </span>
            <span>
              <Check size={13} /> İlerleme cihazında kalır
            </span>
          </div>
        </div>

        <div className="lab-preview" aria-label="Queryvale çalışma alanı önizlemesi">
          <div className="preview-window">
            <div className="preview-bar">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
              <strong>Şube nabzı</strong>
              <span className="preview-step">Görev 01 / 19</span>
            </div>
            <div className="preview-brief">
              <small>Operasyon notu</small>
              <h2>Cironun en güçlü olduğu üç şubeyi getir.</h2>
              <p>
                Bölge toplantısı için şube adını ve net satış toplamını,
                yüksekten düşüğe sırala.
              </p>
            </div>
            <div className="preview-code" aria-label="Örnek SQL sorgusu">
              <div className="line">
                <span className="line-number">1</span>
                <span>
                  <span className="sql-keyword">SELECT</span>{" "}
                  <span className="sql-field">branch_name</span>,
                </span>
              </div>
              <div className="line">
                <span className="line-number">2</span>
                <span>
                  &nbsp;&nbsp;
                  <span className="sql-keyword">SUM</span>(
                  <span className="sql-field">net_revenue</span>){" "}
                  <span className="sql-keyword">AS</span>{" "}
                  <span className="sql-field">revenue</span>
                </span>
              </div>
              <div className="line">
                <span className="line-number">3</span>
                <span>
                  <span className="sql-keyword">FROM</span> branch_sales
                </span>
              </div>
              <div className="line">
                <span className="line-number">4</span>
                <span>
                  <span className="sql-keyword">GROUP BY</span> branch_name
                </span>
              </div>
              <div className="line">
                <span className="line-number">5</span>
                <span>
                  <span className="sql-keyword">ORDER BY</span> revenue DESC{" "}
                  <span className="sql-keyword">LIMIT</span>{" "}
                  <span className="sql-number">3</span>;
                </span>
              </div>
            </div>
            <div className="preview-result">
              <div className="preview-result-head">
                <strong>Sonuç · 3 satır</strong>
                <span className="result-success">
                  <CheckCircle2 size={11} /> Beklenen karar seti
                </span>
              </div>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>branch_name</th>
                    <th>revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Kadıköy</td>
                    <td>₺284.600</td>
                  </tr>
                  <tr>
                    <td>Çankaya</td>
                    <td>₺251.900</td>
                  </tr>
                  <tr>
                    <td>Nilüfer</td>
                    <td>₺219.450</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <div className="signal-strip">
        <div className="signal-strip-inner">
          <div className="signal-item">
            <DatabaseZap size={15} /> Gerçek PostgreSQL motoru
          </div>
          <div className="signal-item">
            <ShieldCheck size={15} /> Görev bazlı izole veri
          </div>
          <div className="signal-item">
            <HardDrive size={15} /> Yalnızca yerel ilerleme
          </div>
          <div className="signal-item">
            <Gauge size={15} /> 10 modül · 19 saha vakası
          </div>
        </div>
      </div>

      <section className="landing-section">
        <div className="page-container">
          <div className="section-intro">
            <div className="eyebrow">İşin ritmiyle öğren</div>
            <h2>Her görev küçük bir karar masasıdır.</h2>
            <p>
              Ezberlenmiş cevapları değil, düşünme sürecini geliştir. Queryvale
              seni senaryo, veri ve kanıt arasında üç adımda ilerletir.
            </p>
          </div>
          <div className="workflow-steps">
            <article className="workflow-step">
              <div className="workflow-index">01</div>
              <ScanSearch size={25} strokeWidth={1.5} />
              <h3>İş sorusunu çözümle</h3>
              <p>
                Operasyon notunu oku; beklenen karar çıktısını ve kullanılabilir
                tablo ilişkilerini ayır.
              </p>
            </article>
            <article className="workflow-step">
              <div className="workflow-index">02</div>
              <Code2 size={25} strokeWidth={1.5} />
              <h3>Sorguyu kur ve çalıştır</h3>
              <p>
                Monaco editöründe SQL yaz. Sorgun görev için hazırlanmış gerçek
                PGlite veritabanında çalışsın.
              </p>
            </article>
            <article className="workflow-step">
              <div className="workflow-index">03</div>
              <Rows3 size={25} strokeWidth={1.5} />
              <h3>Sonucu kanıtla</h3>
              <p>
                Sistem kolon, satır, sıralama ve kavram kullanımını ayrı ayrı
                değerlendirip bir sonraki doğru adımı gösterir.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="page-container">
          <div className="section-intro">
            <div className="eyebrow">Saha dosyaları</div>
            <h2>SQL sözdizimi değil, iş sonucu üret.</h2>
            <p>
              Veriler küçük ve anlaşılır; bağlam gerçek. Her vakada farklı bir
              analitik kası çalıştırırsın.
            </p>
          </div>
          <div className="mission-grid">
            {missions.map((mission, index) => (
              <article className="mission-card" key={mission.title}>
                <div className="mission-topline">
                  <span
                    className={`difficulty-dot ${
                      index === 1 ? "medium" : index === 2 ? "hard" : ""
                    }`}
                  />
                  {mission.domain}
                  <span>·</span>
                  <Clock3 size={11} /> {mission.minutes} dk
                </div>
                <h3>{mission.title}</h3>
                <p>{mission.copy}</p>
                <button
                  className="mission-link"
                  type="button"
                  onClick={() =>
                    onNavigate("workspace", { taskId: mission.taskId })
                  }
                >
                  Dosyayı incele <ArrowRight size={13} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="page-container">
          <div className="section-intro">
            <div className="eyebrow">Öğrenme rotası</div>
            <h2>İlk tablodan analitik SQL’e uzanan sakin bir eğri.</h2>
            <p>
              İlk üç modül tamamen çalışır. İleri modüller, büyüyebilecek
              müfredat yapısıyla şimdiden laboratuvarda yerini alır.
            </p>
          </div>
          <div className="roadmap-preview">
            {roadmapRows.map(([number, title, concepts, count]) => (
              <div className="roadmap-row" key={number as string}>
                <span className="roadmap-number">{number}</span>
                <h3>{title as string}</h3>
                <div className="concept-list">
                  {(concepts as string[]).map((concept) => (
                    <span className="concept-chip" key={concept}>
                      {concept}
                    </span>
                  ))}
                </div>
                <span className="roadmap-status">
                  {count as string} <ArrowRight size={12} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="page-container">
          <div className="cta-panel">
            <h2>İlk karar setin sekiz dakika uzakta.</h2>
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                onNavigate("workspace", {
                  taskId: "m1-t1",
                  onboarding: true,
                })
              }
            >
              Laboratuvara gir <Sparkles size={15} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
