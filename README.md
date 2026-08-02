# Queryvale

**Turn questions into evidence.**

Queryvale, SQL sözdizimini ezberleten bir kurs değil; gerçek iş sorularını çözerek **veri analisti gibi çalışmayı** öğreten tarayıcı tabanlı bir kanıt rotasıdır. Her vaka `Sor → İncele → Sorgula → Doğrula → Anlat` döngüsünü tekrar ettirir: kullanıcı iş sorusunu ve şemayı inceler, sorgusunu gerçek PostgreSQL uyumlu veri üzerinde çalıştırır, sonucu doğrular ve isterse bulgusunu bir karar notuna dönüştürür. Değerlendirme SQL metnini değil, üretilen sonucu ve vakanın öğrenme hedefini dikkate alır.

> Ürün dili Türkçedir. Tablo, kolon ve SQL adlandırmaları gerçek çalışma ortamlarına uyum için İngilizcedir.

## Neler sunar?

- Satış, müşteri, şube, sipariş ve veri kalitesi gibi gerçekçi iş vakaları
- Kullanıcı arayüzünde tek sözlük: Rota → Bölüm → Vaka / Proje
- Temeli kur → İş sorusunu çöz → Örüntüyü keşfet → Karara dönüştür biçiminde dört bölüm
- Önceki SQL konusu tamamlandıkça sıradaki konuyu açan, nedeni görünür modül kilitleri
- Son durak olarak 12 ilişkili veri setine dayalı pazarlama analitiği portföy projesi
- Tarayıcı içinde çalışan PGlite tabanlı SQL motoru
- Alternatif doğru sorguları kabul eden sonuç odaklı değerlendirme
- Kolon, satır, sıralama, `NULL`, duplicate ve zorunlu kavram kontrolleri
- Mantık → parçalar → sorgu iskeleti ipuçları ve istek üzerine tam çalışan örnek SQL
- Düzenlenebilir kullanıcı adıyla cihaz bazlı kişisel öğrenme paneli
- Kavram odağı, çıktı tanesi ve doğrulanabilir kabul kontrolleri
- Hata türüne özel kontrol adımları; başarıda önce sonuç, isteğe bağlı çözümleme ve transfer soruları
- İlk vaka içinde kapatılabilir 90 saniyelik başlangıç rehberi
- Yalnız doğru değerlendirilen çalışmadan üretilen sınırlı, yerel kanıt snapshot’ı
- Bulgu, öneri ve isteğe bağlı çekinceyi saklayan karar notu ile Kanıt Defteri
- İlk doğru sorguda kilitlenen 10/7/4/1 Analiz puanı; tam çözüm desteğinde 0, puan rota erişimini etkilemez
- Şema, örnek veri, SQL editörü ve sonuçları bir araya getiren çalışma alanı
- `Hemen Başla` ile açılan yerel `Giriş yap / Hesap oluştur` başlangıç kapısı; e-posta, parola, backend veya bulut hesabı olmadan IndexedDB tabanlı cihaz profili
- Yerel profil oluşturulduktan sonra `Hemen Başla` yerine doğrudan `Profil` ve `Ayarlar` erişimi sunan hesap duyarlı header
- İlerlemeyi silmeden çıkış, sayfa yenilemeleri arasında korunan yerel profil durumu ve aynı cihazda tek dokunuşla yeniden giriş
- Başlangıç rehberi, otomatik kayıt/taşıma açıklaması, destek bağlantısı ve profil-veri silme eylemini birleştiren `Yardım ve veri` alanı
- `Studio` üzerinden profil kapısını zorunlu kılmadan SQL Laboratuvarı’na misafir erişimi
- Yazarken otomatik kaydedilen SQL taslakları; `⌘/Ctrl+S` ile anında kayıt
- Açık/koyu tema, editör tercihleri ve reduced-motion desteği
- Dışa/içe aktarılabilir ilerleme verisi
- Masaüstü öncelikli; mobilde `Vaka | Veri | SQL | Sonuç` sekmeli responsive deneyim

## Teknoloji yığını

| Katman    | Teknoloji                                             |
| --------- | ----------------------------------------------------- |
| Uygulama  | React 19, TypeScript, Vinext ve Vite                  |
| Stil      | Tailwind CSS 4 ve ürün tasarım token’ları             |
| Editör    | Monaco Editor                                         |
| SQL       | PGlite, tarayıcı içinde ve gerektiğinde lazy-load     |
| State     | Sade React state, reducer/context ve saf selector’lar |
| Kalıcılık | IndexedDB                                             |
| Test      | Vitest, React Testing Library, Playwright             |
| Kalite    | ESLint, Prettier, TypeScript                          |
| Dağıtım   | GitHub Pages                                          |

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

## GitHub Pages yayını

`main` dalına yapılan push, `.github/workflows/deploy-pages.yml` üzerinden kalite
kontrollerini çalıştırır, taşınabilir istemciyi üretir ve `dist-portable`
içeriğini GitHub Pages'e yollar. Repo ayarlarında **Settings → Pages → Source**
alanı bir kez **GitHub Actions** olarak seçilmelidir. Hash tabanlı yönlendirme ve
göreli asset yolları nedeniyle proje alt yolu için ek rewrite gerekmez.

Yayın herkese açıktır. Kullanıcı adı, ilerleme ve Kanıt Defteri her tarayıcı +
web adresinin IndexedDB alanında bağımsız kalır; cihazlar ve origin'ler arası
canlı eşitleme yapılmaz. Repo veya alan adı değişirse ilerleme önce JSON olarak dışa aktarılmalıdır. Vaka
konumu, denemeler, ipuçları, tamamlanmalar, kanıtlar ve SQL taslakları aynı
origin içinde otomatik kaydedilir; normal kullanımda `⌘/Ctrl+S` gerekmez.
`Hemen Başla`, bu yerel çalışma alanını seçmek veya adlandırmak için
`Giriş yap / Hesap oluştur` ekranını açar. Bu ekran gerçek kimlik doğrulama değildir; e-posta
ya da parola toplamaz, backend'e veri göndermez ve başka cihazda oturum açma
veya bulut senkronizasyonu vaat etmez. Açıkça yerel profil oluşturulduktan sonra header'daki
`Hemen Başla` eylemi kaldırılır; aynı alanda `Profil` ve `Ayarlar` bağlantıları görünür.
`Profilden çık`, sorguları ve ilerlemeyi silmeden bu kontrolleri kapatır; sayfa yenilense de
çıkış durumu korunur ve `Hemen Başla` aynı cihazdaki profili yeniden açar. Bu işlem parola
kilidi veya yetkilendirme değildir. Profilin tamamen kaldırılması ayrı ve onaylı
`Ayarlar → Profil ve veri → Profili sil` eylemidir. `İlerlemeyi sıfırla` ise profil adını
ve çalışma tercihlerini korur.
Yalnız görev denemiş bir misafir hesap varmış gibi gösterilmez. `Studio` bağlantısı SQL
Laboratuvarı'na misafir erişimini korur; çıkış yapılmışken Studio'da üretilen çalışma da
bu cihazdaki tek çalışma alanına kaydedilir.

## Komutlar

```bash
pnpm run dev          # geliştirme sunucusu
pnpm run lint         # statik kalite kontrolleri
pnpm test             # varsayılan test kapısı
pnpm run test:unit    # Vitest ve RTL testleri
pnpm run test:e2e     # Playwright kritik kullanıcı akışları
pnpm run build        # üretim derlemesi
pnpm run build:portable # macOS taşınabilir statik istemci çıktısı
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
src/features/evidence/    Sınırlı ve JSON-güvenli doğrulanmış çalışma snapshot'ı
src/features/progress/    IndexedDB ilerleme ve ayar modeli
src/types/                Ortak içerik tipleri
src/tests/unit/           Motor ve evaluator testleri
tests/e2e/                Playwright kullanıcı yolculukları
portable/                 Backend gerektirmeyen taşınabilir istemci girişi
packaging/                Yerel macOS başlatıcı, loopback sunucu ve yönergeler
```

Depodaki gerçek klasörler uygulama geliştikçe bu sorumluluklara göre gruplanabilir; klasör adından daha önemli olan bağımlılık sınırlarıdır. Ayrıntı için [ARCHITECTURE.md](./ARCHITECTURE.md).

## Yeni görev ekleme

1. Uygun modülü ve ön koşulları belirleyin.
2. `src/content` altında tip güvenli görev ve öğrenme içeriği tanımı oluşturun.
3. İzole `setupSql`, şema, örnek satırlar ve beklenen sonucu ekleyin.
4. Kavram odağını, çıktı tanesini, kabul kontrollerini ve veri notlarını yazın.
5. Üç kademeli ipucu, ayrı `solutionSql`, değerlendirme durumuna özel koçluk ve transfer odaklı debrief ekleyin.
6. Kullanıcıya gösterilen tam çözümü ve alternatif doğru sorguyu gerçek motor testinde çalıştırın.
7. İçerik doğrulama ile öğrenme yolu sırası ve `nextTaskId` bağlantısını kontrol edin.

Alanların tam sözleşmesi, örnek görev ve editoryal standartlar [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) dosyasındadır.

## Ürün sınırları ve bilinen kısıtlar

- Her tarayıcı kendi adlandırılabilir öğrenen profilini ve ilerlemesini saklar; cihazlar arası canlı senkronizasyon yoktur.
- Bir origin ve tarayıcı profili tek bir Queryvale çalışma alanı taşır; çoklu kullanıcı hesabı, parola koruması ve aynı cihazda birbirinden yalıtılmış çalışma alanları bu sürümün parçası değildir.
- Çalışan rota bugün SQL ağırlıklı 11 modül ve 52 çalışmadır: ilk 10 modülde 40 doğrulanmış vaka, son Pazarlama Analitiği Proje Stüdyosu'nda 12 portföy projesi bulunur. SQL konuları sırayla açılır; eski ileri kayıtlar silinmeden ilk eksik modülün arkasında korunur. Python, elektronik tablo ve BI araçları henüz ürün içinde çalıştırılmaz; ileride aynı kanıt döngüsüne bağlanan köprüler olarak değerlendirilecektir.
- Tamamlanma, Analiz puanı, deneme, süre, ipucu ve çalışma serisi pratik bağlamıdır; tek başına mesleki ustalık veya işe hazır olma iddiası değildir. Puan rekabet veya sertifika değil, ilk doğru sonuçtaki yardım düzeyinin yerel kaydıdır.
- Taşınabilir Mac paketi macOS 11 veya yenisinde, Intel ve Apple Silicon işlemcilerde çalışır. Sabit `127.0.0.1:41739` origin'ini kullanır; Node veya internet gerektirmez ve ilerlemeyi aynı tarayıcı origin'inde korur.
- Canlı web sürümünün tek kanonik adresi `https://yacirmen.github.io/queryvale/` ve tek yayın hattı GitHub Pages'tir.
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
