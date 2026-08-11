# Queryvale

**Turn questions into evidence.**

Queryvale, komut ezberleten bir kurs değil; gerçek iş sorularını SQL ve Python ile çözerek **veri analisti gibi çalışmayı** öğreten tarayıcı tabanlı bir kanıt rotasıdır. SQL vakaları `Sor → İncele → Sorgula → Doğrula → Anlat` döngüsünü; Python vakaları ise `Veriyi tanı → güvenilir hâle getir → analiz et → örüntüyü açıkla` akışını tekrar ettirir. Her iki stüdyo da kaynak metni kopyalamayı değil, üretilen gerçek sonucu değerlendirir.

> Ürün dili Türkçedir. Tablo, kolon ve SQL adlandırmaları gerçek çalışma ortamlarına uyum için İngilizcedir.

## Neler sunar?

- Satış, müşteri, şube, sipariş ve veri kalitesi gibi gerçekçi iş vakaları
- Kullanıcı arayüzünde tek sözlük: Rota → Bölüm → Vaka / Proje
- Temeli kur → İş sorusunu çöz → Örüntüyü keşfet → Karara dönüştür biçiminde dört bölüm
- Önerilen sırayı görünür tutarken ihtiyaç duyulan herhangi bir SQL veya Python vakasına doğrudan geçiş
- Son durak olarak 12 ilişkili veri setine dayalı pazarlama analitiği portföy projesi
- Tarayıcı içinde çalışan PGlite tabanlı SQL motoru
- Tarayıcı içinde ayrı Web Worker’da çalışan, aynı origin’den yüklenen Pyodide + pandas Python motoru
- EDA, veri temizleme, KPI/segment ve zaman/örüntü analizlerinden oluşan 4 modül ve 12 çalışan Python vakası
- Her Python vakasında deterministik DataFrame, gerçek `result` çıktısı, üç ipucu, tam çözüm ve çıktı odaklı doğrulama
- Alternatif doğru sorguları kabul eden sonuç odaklı değerlendirme
- Kolon, satır, sıralama, `NULL`, duplicate ve zorunlu kavram kontrolleri
- Mantık → parçalar → sorgu iskeleti ipuçları ve istek üzerine tam çalışan örnek SQL
- Düzenlenebilir kullanıcı adıyla cihaz bazlı kişisel öğrenme paneli
- Kavram odağı, çıktı tanesi ve doğrulanabilir kabul kontrolleri
- Hata türüne özel kontrol adımları; başarıda önce sonuç, isteğe bağlı çözümleme ve transfer soruları
- İlk vaka içinde kapatılabilir 90 saniyelik başlangıç rehberi
- Yalnız doğru değerlendirilen çalışmadan üretilen sınırlı, yerel kanıt snapshot’ı
- Bulgu, öneri ve isteğe bağlı çekinceyi saklayan karar notu ile Kanıt Defteri
- Vakalarda ilk doğru sorguda kilitlenen 10/7/4/1 Analiz puanı; tam çözüm desteğinde 0, puan rota erişimini etkilemez
- Üç kısa ve puansız alıştırma biçimi: tek kavramı tanıtan `ALIŞTIRMA · 3 DK`, kavramı farklı veride tekrar ettiren `TEKRAR · 3 DK` ve son dört kalemi bağlayan `BİRLEŞTİR · 5 DK`; ücretsiz ipucu açıldığında tam doğru sonucu da gösteren sade bir brief taşır
- Şema, örnek veri, SQL editörü ve sonuçları bir araya getiren çalışma alanı
- `Hemen Başla` ile açılan yerel `Giriş yap / Hesap oluştur` başlangıç kapısı; e-posta, parola, backend veya bulut hesabı olmadan IndexedDB tabanlı cihaz profili
- Yerel profil oluşturulduktan sonra `Hemen Başla` yerine doğrudan `Profil` ve `Ayarlar` erişimi sunan hesap duyarlı header
- İlerlemeyi silmeden çıkış, sayfa yenilemeleri arasında korunan yerel profil durumu ve aynı cihazda tek dokunuşla yeniden giriş
- Başlangıç rehberi, otomatik kayıt/taşıma açıklaması, destek bağlantısı ve profil-veri silme eylemini birleştiren `Yardım ve veri` alanı
- `SQL Studio` ve `Python Studio` üzerinden profil kapısını zorunlu kılmadan iki çalışma alanına misafir erişimi
- Ana sayfa anlatısının sonuna ulaşılana kadar iki Studio hedefini açıklamalı kilit simgesiyle bekleten; doğrudan rotaları ve diğer ekranları engellemeyen oturumluk tanıtım geçidi
- İki stüdyoda da sonucu örtmeden kalan kalıcı aksiyon rail'i; önceki/sonraki vaka, rota özeti ve klavye kısayolları
- Akış içinde yukarı açılan, kendi içinde kaydırılan ve bütün çalışmaları erişilebilir tutan rota çekmecesi: SQL'de 11 modül/82 çalışma (52 vaka-proje + 30 alıştırma), Python'da 4 modül/12 vaka
- Yazarken otomatik kaydedilen SQL taslakları; `⌘/Ctrl+S` ile anında kayıt
- Açık/koyu tema, editör tercihleri ve reduced-motion desteği
- Dışa/içe aktarılabilir ilerleme verisi
- Masaüstü öncelikli; her iki Studio'da belgeyi değil yalnız ilgili paneli kaydıran tek-viewport çalışma alanı ve mobilde dört sekmeli responsive deneyim
- Python Studio’da mobil `Vaka | Veri | Python | Sonuç` akışı, otomatik taslak kaydı ve `⌘/Ctrl+Enter` çalıştırma
- `⌘/Ctrl+K` ile rota; Monaco'nun satır hareketini koruyan `⌘/Ctrl+Shift+←/→` ile vaka geçişi

## Teknoloji yığını

| Katman    | Teknoloji                                               |
| --------- | ------------------------------------------------------- |
| Uygulama  | React 19, TypeScript, Vinext ve Vite                    |
| Stil      | Tailwind CSS 4 ve ürün tasarım token’ları               |
| Editör    | Monaco Editor                                           |
| SQL       | PGlite, tarayıcı içinde ve gerektiğinde lazy-load       |
| Python    | Pyodide 0.29.4 + pandas, ayrı Web Worker ve yerel asset |
| State     | Sade React state, reducer/context ve saf selector’lar   |
| Kalıcılık | IndexedDB                                               |
| Test      | Vitest, React Testing Library, Playwright               |
| Kalite    | ESLint, Prettier, TypeScript                            |
| Dağıtım   | GitHub Pages                                            |

## Gereksinimler

- Node.js `>=22.13.0`
- pnpm `11.x`
- WebAssembly ve IndexedDB destekleyen güncel bir tarayıcı

## Yerel kurulum

```bash
pnpm install
pnpm run dev
```

Geliştirme sunucusunun gösterdiği yerel adresi açın. İlk SQL çalıştırmasında PGlite ve Monaco parçaları; ilk Python çalıştırmasında yaklaşık 19,4 MiB sabitlenmiş Pyodide/pandas runtime’ı lazy-load edildiği için kısa bir hazırlık durumu görülebilir. `prepare:python-runtime` komutu gerekli Python dosyalarını sürümü ve SHA-256 bütünlüğü doğrulanmış kaynaktan üretim klasörüne hazırlar.

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
Profil ekranındaki `SQL ilerlemesini sıfırla` ve `Python ilerlemesini sıfırla` eylemleri
iki açık onaydan sonra yalnız seçilen rotanın görevlerini, taslaklarını ve kanıtlarını
siler; diğer rota, profil adı ve çalışma tercihleri korunur.
Yalnız görev denemiş bir misafir hesap varmış gibi gösterilmez. Header yalnız `SQL Studio`
ve `Python Studio` çalışma hedeflerini taşır; iki rotanın modül/vaka görünümü kendi stüdyosundaki
açılır menüden erişilir. Ana sayfada bu iki hedef, kullanıcı footer sonuna ulaşana kadar
erişilebilir açıklamayla pasif kalır ve aynı uygulama oturumu boyunca açık kalır. Bu yalnız
tanıtım akışıdır: doğrudan `#/lab/...` ve `#/python/...` rotaları ile diğer ekranlardaki Studio
hedefleri engellenmez. Tam sayfa yenileme yeni uygulama oturumu sayılır. `SQL Studio`
bağlantısı SQL Laboratuvarı'na misafir erişimini korur;
çıkış yapılmışken stüdyolarda üretilen çalışma da
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
src/features/python-engine/ Pyodide worker yaşam döngüsü ve Python çalıştırma
src/features/python-validation/ DataFrame artifact değerlendirmesi
src/features/evidence/    Sınırlı ve JSON-güvenli doğrulanmış çalışma snapshot'ı
src/features/progress/    IndexedDB ilerleme ve ayar modeli
src/types/                Ortak içerik tipleri
src/tests/unit/           Motor ve evaluator testleri
tests/e2e/                Playwright kullanıcı yolculukları
portable/                 Backend gerektirmeyen taşınabilir istemci girişi
packaging/                Yerel macOS başlatıcı, loopback sunucu ve yönergeler
```

Depodaki gerçek klasörler uygulama geliştikçe bu sorumluluklara göre gruplanabilir; klasör adından daha önemli olan bağımlılık sınırlarıdır. Ayrıntı için [ARCHITECTURE.md](./ARCHITECTURE.md).

## Yeni SQL görevi ekleme

1. Uygun modülü ve ön koşulları belirleyin.
2. `src/content` altında tip güvenli görev ve öğrenme içeriği tanımı oluşturun.
3. İzole `setupSql`, şema, örnek satırlar ve beklenen sonucu ekleyin.
4. Kavram odağını, çıktı tanesini, kabul kontrollerini ve veri notlarını yazın.
5. Vaka için üç kademeli ipucu, ayrı `solutionSql`, değerlendirme durumuna özel koçluk ve transfer odaklı debrief ekleyin. Alıştırma için tek ücretsiz ipucu ve dört bölümlü sade brief kullanın: `drill_intro` tam bir yeni kavramı, `drill_practice` yalnız tekrarı, `drill_mix` son kavramların birleşimini taşır.
6. Kullanıcıya gösterilen tam çözümü ve alternatif doğru sorguyu gerçek motor testinde çalıştırın.
7. İçerik doğrulama ile benzersiz `routeOrder` değerini ve öğrenme yolu sırasını kontrol edin. `nextTaskId` eski içerik uyumluluğu içindir; SQL Studio gezinmesi rota sırasını kullanır.

Alanların tam sözleşmesi, örnek görev ve editoryal standartlar [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) dosyasındadır.

Yeni Python vakası `PythonLessonTask` sözleşmesine uyar: küçük ve deterministik fixture’lar, yalnız desteklenen yerel paketler, `result` adlı DataFrame teslimi, beklenen kolon/satır/dtype artifact’ı, üç kabul kontrolü, üç ipucu ve gerçek Pyodide+pandas üzerinde çalışan referans çözüm birlikte eklenir.

## Ürün sınırları ve bilinen kısıtlar

- Her tarayıcı kendi adlandırılabilir öğrenen profilini ve ilerlemesini saklar; cihazlar arası canlı senkronizasyon yoktur.
- Bir origin ve tarayıcı profili tek bir Queryvale çalışma alanı taşır; çoklu kullanıcı hesabı, parola koruması ve aynı cihazda birbirinden yalıtılmış çalışma alanları bu sürümün parçası değildir.
- SQL rotası 11 modül ve 82 çalışmadır: 52 puanlı vaka/proje ile temel bölgede kavramı tanıtan, tekrar ettiren ve birleştiren 30 puansız alıştırmadan oluşur. İlk 10 modülde 40 doğrulanmış vaka, son Pazarlama Analitiği Proje Stüdyosu'nda 12 portföy projesi bulunur. Ayrı Python rotası 4 modül ve 12 pandas vakasıdır. Her iki rotada da bütün çalışmalar açıktır; sıra öneri ve güvenli devam bilgisidir. Elektronik tablo ve BI araçları henüz ürün içinde çalıştırılmaz.
- Tamamlanma, Analiz puanı, deneme, süre, ipucu ve çalışma serisi pratik bağlamıdır; tek başına mesleki ustalık veya işe hazır olma iddiası değildir. Puan rekabet veya sertifika değil, ilk doğru sonuçtaki yardım düzeyinin yerel kaydıdır.
- Taşınabilir Mac paketi macOS 11 veya yenisinde, Intel ve Apple Silicon işlemcilerde çalışır. Sabit `127.0.0.1:41739` origin'ini kullanır; Node veya internet gerektirmez ve ilerlemeyi aynı tarayıcı origin'inde korur.
- Canlı web sürümünün tek kanonik adresi `https://yacirmen.github.io/queryvale/` ve tek yayın hattı GitHub Pages'tir.
- Gizli bir backend bulunmadığı için görev tanımları ve beklenen sonuçlar istemci paketinde incelenebilir.
- Büyük veri setleri amaçlanmaz; sonuçlar ve çalışma süresi güvenli sınırlarla kısıtlanır.
- PGlite WebAssembly başlangıç maliyeti düşük donanımlarda hissedilebilir; yükleme gecikmeli yapılır.
- Pyodide/pandas ilk yükü yaklaşık 19,4 MiB’dir; sonraki açılışlarda tarayıcı önbelleği kullanılır. Runtime kullanıcı kodunu ayrı Web Worker’da çalıştırır fakat Worker bir kötü amaçlı kod güvenlik sandbox’ı değildir; bu alan yalnız öğrenme amaçlı yerel fixture’lar içindir.
- Python runtime asset’ları çalışma anında üçüncü taraf CDN’den çağrılmaz. Temiz bir geliştirme/CI derlemesi, sabitlenmiş wheel dosyalarını checksum doğrulayarak hazırlamak için ağ erişimine ihtiyaç duyar; üretilen GitHub Pages paketi bunları aynı origin’den sunar.
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
