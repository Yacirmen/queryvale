# Queryvale

**Turn questions into evidence.**

Queryvale, SQL sözdizimini ezberleten bir kurs değil; kullanıcıyı gerçek bir veri ekibinin içinde çalışıyormuş gibi hissettiren, tarayıcı tabanlı bir veri operasyon laboratuvarıdır. Kullanıcı iş senaryosunu okur, şemayı inceler, sorgusunu Monaco Editor’da yazar ve gerçek PostgreSQL uyumlu veri üzerinde çalıştırır. Değerlendirme SQL metnini değil, üretilen sonucu ve görevin öğrenme hedefini dikkate alır.

> Ürün dili Türkçedir. Tablo, kolon ve SQL adlandırmaları gerçek çalışma ortamlarına uyum için İngilizcedir.

## Neler sunar?

- Satış, müşteri, şube, sipariş ve veri kalitesi gibi gerçekçi iş görevleri
- Tarayıcı içinde çalışan PGlite tabanlı SQL motoru
- Alternatif doğru sorguları kabul eden sonuç odaklı değerlendirme
- Kolon, satır, sıralama, `NULL`, duplicate ve zorunlu kavram kontrolleri
- Üç kademeli, doğrudan cevabı vermeyen ipuçları
- Şema, örnek veri, SQL editörü ve sonuçları bir araya getiren çalışma alanı
- Hesapsız ve backend’siz, IndexedDB tabanlı yerel ilerleme
- Açık/koyu tema, editör tercihleri ve reduced-motion desteği
- Dışa/içe aktarılabilir ilerleme verisi
- Masaüstü öncelikli, tablet ve mobilde kullanılabilir responsive deneyim

## Teknoloji yığını

| Katman | Teknoloji |
|---|---|
| Uygulama | React 19, TypeScript, Vinext ve Vite |
| Stil | Tailwind CSS 4 ve ürün tasarım token’ları |
| Editör | Monaco Editor |
| SQL | PGlite, tarayıcı içinde ve gerektiğinde lazy-load |
| State | Sade React state, reducer/context ve saf selector’lar |
| Kalıcılık | IndexedDB |
| Test | Vitest, React Testing Library, Playwright |
| Kalite | ESLint, Prettier, TypeScript |
| Dağıtım | Cloudflare Sites; D1/R2/backend bağımlılığı yok |

## Gereksinimler

- Node.js `>=22.13.0`
- pnpm `11.x`
- WebAssembly ve IndexedDB destekleyen güncel bir tarayıcı

## Yerel kurulum

```bash
pnpm install
pnpm run dev
```

Geliştirme sunucusunun gösterdiği yerel adresi açın. İlk SQL çalıştırmasında PGlite ve Monaco parçaları lazy-load edildiği için kısa bir hazırlık durumu görülebilir.

## Komutlar

```bash
pnpm run dev          # geliştirme sunucusu
pnpm run lint         # statik kalite kontrolleri
pnpm test             # varsayılan test kapısı
pnpm run test:unit    # Vitest ve RTL testleri
pnpm run test:e2e     # Playwright kritik kullanıcı akışları
pnpm run build        # üretim derlemesi
pnpm run start        # yerel üretim önizlemesi
```

Kesin komut listesi için `package.json` içindeki `scripts` alanı kaynak kabul edilir. Test yaklaşımı ve zorunlu senaryolar [TESTING.md](./TESTING.md) dosyasındadır.

## Proje yapısı

```text
app/                      Vinext sayfa kabuğu ve metadata
src/app/                  Uygulama state’i, ekranlar ve UI bileşenleri
src/content/              Tip güvenli modül, görev ve fixture kataloğu
src/features/sql-engine/  PGlite yaşam döngüsü ve sorgu çalıştırma
src/features/validation/  Sonuç normalizasyonu ve değerlendirme
src/features/progress/    IndexedDB ilerleme ve ayar modeli
src/types/                Ortak içerik tipleri
src/tests/unit/           Motor ve evaluator testleri
tests/e2e/                Playwright kullanıcı yolculukları
```

Depodaki gerçek klasörler uygulama geliştikçe bu sorumluluklara göre gruplanabilir; klasör adından daha önemli olan bağımlılık sınırlarıdır. Ayrıntı için [ARCHITECTURE.md](./ARCHITECTURE.md).

## Yeni görev ekleme

1. Uygun modülü ve ön koşulları belirleyin.
2. `content/tasks` altında tip güvenli görev tanımı oluşturun.
3. İzole `setupSql`, şema, örnek satırlar ve beklenen sonucu ekleyin.
4. Üç kademeli ipucu, kısa açıklama ve gerçek iş bağlantısını yazın.
5. İçerik doğrulama testini ve göreve özel değerlendirme testini çalıştırın.
6. Öğrenme yolu sırası ile `nextTaskId` bağlantısını kontrol edin.

Alanların tam sözleşmesi, örnek görev ve editoryal standartlar [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) dosyasındadır.

## Ürün sınırları ve bilinen kısıtlar

- Tüm veriler bu tarayıcı profilinde saklanır; cihazlar arası senkronizasyon yoktur.
- Gizli bir backend bulunmadığı için görev tanımları ve beklenen sonuçlar istemci paketinde incelenebilir.
- Büyük veri setleri amaçlanmaz; sonuçlar ve çalışma süresi güvenli sınırlarla kısıtlanır.
- PGlite WebAssembly başlangıç maliyeti düşük donanımlarda hissedilebilir; yükleme gecikmeli yapılır.
- Sorgular atılabilir görev veritabanında ve süre/satır limitleriyle çalışır; ayrı Web Worker izolasyonu bu sürümde yoktur.
- PostgreSQL’in her uzantısı ve sunucu özelliği tarayıcı ortamında desteklenmez.
- Ürün adı için resmi marka ve alan adı uygunluk incelemesi bu deponun kapsamı dışındadır.
- Çevrimdışı çalışmaya uygun mimari kurulmuştur; tam PWA kurulum deneyimi ayrı bir sürüm kapısıdır.

## Dokümantasyon

- [Vizyon](./VISION.md)
- [Ürün gereksinimleri](./PRODUCT.md)
- [Teknik mimari](./ARCHITECTURE.md)
- [Yol haritası](./ROADMAP.md)
- [Kararlar](./DECISIONS.md)
- [Katkı rehberi](./CONTRIBUTING.md)
