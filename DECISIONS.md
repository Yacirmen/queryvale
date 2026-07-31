# Karar Kayıtları

Kararlar kısa ADR biçimindedir. Durumlar: `Önerildi`, `Kabul`, `Geçersiz`. Yeni karar eskisini değiştiriyorsa önceki kaydı silmez, bağlantı verir.

## ADR-001 — Ürün kimliği: Queryvale

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** Çalışma adı **Queryvale**, slogan **“Turn questions into evidence.”** Türkçe ana vaat “Soruyu sorguya, sorguyu kanıta dönüştür.”
- **Gerekçe:** “SQL kursu” isimlendirmesinden ayrışır; keşif, yolculuk ve veri kanıtı hissi verir. Profesyonel ve global telaffuza uygundur.
- **Uzman görüşleri:** Product Manager isimden ürünün iş sonucu odağını taşımasını istedi. Product Experience Designer vadi/katman metaforunun kopya dashboard estetiğine düşmeden görsel sistem üretebildiğini belirtti.
- **Sonuç:** Kimlik mineral turkuaz, sıcak amber ve mürekkep tonlu modern veri laboratuvarı yönünü kullanır. Resmi marka/alan adı uygunluk incelemesi ürün kapsamı dışıdır.

## ADR-002 — PGlite, sql.js yerine varsayılan SQL motoru

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** SQL motoru PGlite; worker içinde lazy-load ve atılabilir görev oturumlarıyla kullanılır. sql.js aktif bağımlılık değil, kanıtlanmış uyumluluk engelinde değerlendirilecek fallback’tir.
- **Seçenekler:**
  - PGlite: PostgreSQL’e yakın semantik, analitik SQL müfredatıyla yüksek uyum; daha ağır WASM ve yaşam döngüsü maliyeti.
  - sql.js: daha küçük/basit SQLite çalışma zamanı; tarih, tip ve ileri PostgreSQL davranışlarında müfredat ayrışması.
- **Uzman görüşleri:** SQL Engine Expert, CTE/window ve PostgreSQL davranış uyumunun öğretim değerini öne çıkardı; worker reseti ve timeout’u zorunlu gördü. Curriculum Expert, öğrencinin analitik iş ortamına daha yakın lehçe öğrenmesini tercih etti. Security and Performance Reviewer, motorun ilk bundle’dan ayrılmasını ve bellek/timeout testlerini koşul koydu.
- **Sonuç:** İlk çalıştırmada görünür hazırlık durumu, satır limiti ve destek hatası gerekir. Fallback ancak gerçek cihaz matrisi ve aynı görev fixture’larıyla ölçülür.

## ADR-003 — Backend’siz ve hesap gerektirmeyen yerel ürün

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** SQL yürütme, değerlendirme, tercih ve ilerleme tarayıcıda kalır. Cloudflare Sites yalnız dağıtım katmanıdır; D1/R2 kullanılmaz.
- **Uzman görüşleri:** Product Manager ilk değere ulaşma sürtünmesini azaltmayı önceliklendirdi. Architect uzak servisin MVP değerine katkı sunmadan gizlilik, maliyet ve hata alanı ekleyeceğini belirtti. Security Reviewer, içe aktarılan veriye sürüm/boyut doğrulaması istedi.
- **Sonuç:** Cihazlar arası senkronizasyon yoktur; JSON export/import veri taşınabilirliği sağlar.

## ADR-004 — Sonuç odaklı, katmanlı değerlendirme

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** SQL metni referans cevapla karşılaştırılmaz. Değerlendirme yürütme → kolon → satır → sıra → gerekli kavram sırasını izler.
- **Uzman görüşleri:** Learning Experience Expert, her ret durumunun tek sonraki öğrenme eylemi üretmesini istedi. SQL Engine Expert duplicate’ların set değil multiset olarak ele alınması ve `NULL`/numeric/date politikasının görev bazında açık olmasını istedi. QA Engineer yapısal olarak farklı en az iki doğru çözüm fixture’ını kritik sözleşme saydı.
- **Sonuç:** Basit SQL kavram analizi tam parser gibi sunulmaz. Sonuç doğru değilse kavram eksikliği ana hata olarak gösterilmez.

## ADR-005 — Sade React state ve servis sınırları

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** Uygulama state’i React reducer/context ve feature hook’larıyla yönetilir. Kalıcı state repository katmanında, navigasyon URL’de, Monaco draft’ı workspace sınırında tutulur. Zustand eklenmez.
- **Uzman görüşleri:** React/TypeScript Engineer mevcut kapsamda dış store’un sağladığı değerin sade reducer ve selector’larla karşılanabildiğini belirtti. Architect domain servislerinin React’ten bağımsız kalmasını koşul koydu.
- **Sonuç:** Ölçülmüş render/koordinasyon sorunu oluşursa karar yeniden açılabilir; tercih üzerine kütüphane eklenmez.

## ADR-006 — İçerik odaklı tip güvenli görev mimarisi

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** Görevler component koduna gömülmez; TypeScript veri tanımları ve build/test doğrulayıcısı kullanılır.
- **Uzman görüşleri:** Curriculum Expert içerik yazarının şema, ipucu ve referans sonucu tek sözleşmede görmesini istedi. QA Engineer duplicate ID, kırık görev zinciri, eksik ipucu ve setup/expected result uyuşmazlığının otomatik yakalanmasını istedi.
- **Sonuç:** İçerik şeması sürümlenir; çalışan her görev gerçek PGlite referans testi taşır.

## ADR-007 — Görev izolasyonu birincil güvenlik ve doğruluk sınırı

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** Her görev deterministik setup’tan hazırlanan atılabilir bir DB oturumunda çalışır. Reset aynı başlangıç durumuna döner; görev değişiminde eski run sonucu reddedilir.
- **Uzman görüşleri:** SQL Engine Expert regex tabanlı yasak listesinin tek başına yeterli olmadığını belirtti. Security Reviewer timeout’ta worker sonlandırma, run ID ve sonuç limiti istedi.
- **Sonuç:** Yasak operasyon taraması savunma katmanıdır; izolasyonun yerine geçmez.

## ADR-008 — Masaüstü öncelikli, dar ekranda sekmeli çalışma alanı

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** Masaüstünde yeniden boyutlandırılabilir görev/şema ve editor/sonuç panelleri; dar ekranda görev, şema, sorgu ve sonuç arasında mantıksal sekmeler kullanılır.
- **Uzman görüşleri:** Product Experience Designer küçük ekranda dört paneli küçültmenin kullanılabilir olmadığını, bilgi önceliğinin değişmesi gerektiğini belirtti. QA Engineer mobilde sorgu çalıştırma ve sonucu okuma akışını ayrı E2E kapısı yaptı.
- **Sonuç:** Masaüstü güçlü ana deneyimdir; mobil “salt görüntüleme”ye düşmez.

## ADR-009 — Test ve build tamamlanma kapısı

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** İçerik doğrulama, evaluator unit testleri, gerçek motor entegrasyonu, kritik Playwright akışları, lint/typecheck ve production build geçmeden sürüm tamamlanmış sayılmaz.
- **Uzman görüşleri:** QA Engineer yalnız UI mock’larıyla SQL doğruluğu kanıtlanamayacağını belirtti. Product Manager çalışmayan veya yarım bir demo tesliminin ürün vaadini bozacağını vurguladı.
- **Sonuç:** Devre dışı test veya sahte sonuç release engelidir; son rapor gerçek komut ve sayıları içerir.

