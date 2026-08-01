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
- **Karar:** SQL yürütme, değerlendirme, tercih ve ilerleme tarayıcıda kalır. Canlı dağıtım yalnız statik GitHub Pages katmanıdır; uzak veritabanı veya obje deposu kullanılmaz.
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

## ADR-010 — Boş sorgu başlangıcı ve rehber niteliğinde ön koşullar

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** Yeni görev editörü çözüm benzeri SQL taslağı olmadan boş açılır; gerçek kullanıcı taslakları korunur. Görev ön koşulları erişimi kilitlemez, öğrenme yolunda önerilen sırayı görünür kılar. Gezinmek ilerleme sayılmaz; görev yalnız doğru değerlendirmeyle tamamlanır.
- **Seçenekler:**
  - Hazır `SELECT *` taslağı ve sert kilit: ilk eylemi kolaylaştırır ancak yanlış sorguyu bitmiş cevap gibi gösterir ve kullanıcının rotayı keşfetmesini engeller.
  - Boş editör ve öneri niteliğinde ön koşul: üretken hatırlamayı korur, ipuçlarını kullanıcı isteğine bağlar ve öz-yönelimli gezinmeye izin verir.
- **Uzman görüşleri:** Product Experience Designer, çalıştırılabilir görünen yanlış taslağın hata hissi yarattığını ve kilidin nedeninin görünmediğini belirtti. Learning Experience Expert, ipuçlarının kod enjekte etmeden kademeli kalmasını ve gezinmenin cezalandırıcı olmamasını istedi. Product Manager, kullanıcının açık serbest geçiş talebi nedeniyle ön koşulların öneri olarak kalmasını tercih etti. QA Engineer, boş başlangıç ile çözmeden ve çözümden sonra ileri geçişin regresyon testi olmasını koşul koydu.
- **Sonuç:** Eski otomatik taslağın birebir kopyası yerel kayıtta bulunduğunda boş kabul edilir; kullanıcı tarafından yazılmış diğer sorgular korunur. İlerleme ekranının sıradaki görev önerisi ön koşulları dikkate almaya devam eder. Yanlış sırada çalışma ölçülebilir öğrenme kaybı veya yüksek hata oranı üretirse sert kilit yeniden değerlendirilebilir.

## ADR-011 — Görev paneli bir okuma sayfası değil, eylem konsoludur

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** Görev paneli bilgiyi `Bağlam → Yapılacak → Çıktı → Sıradaki ipucu` sırasıyla sunar. Hedef ve beklenen kolonlar tek bir çıktı sözleşmesinde birleşir; şema ve editör doğrudan erişilebilir olur. Henüz açılmamış üç büyük ipucu yerine yalnız sıradaki ipucu eylemi gösterilir.
- **Uzman görüşleri:** Product Experience Designer, tekrar eden bölüm başlıkları ile geniş boşlukların hedefi ve ipucunu birbirinden kopardığını; varsayılan panel genişliğinde ilk eylemin kaydırmadan görünmesi gerektiğini belirtti. Learning Experience Expert, ipuçlarının odağı kaybetmeyen tek bir kademeli eylemle açılmasını istedi. Accessibility Reviewer, tam tab semantiği, daha güçlü metin kontrastı, klavye ile panel boyutlandırma ve mobilde iç içe kaydırmanın kaldırılmasını koşul koydu.
- **Sonuç:** Kolon çipleri gerçek kopyalama eylemidir ve geri bildirim verir. Dar ekranda görev paneli kendi içinde kilitli bir kaydırma alanı oluşturmaz; “Sorguyu yaz” editörü görünür alana getirip odaklar. Görev içeriği ve ilerleme sözleşmesi değişmez.

## ADR-012 — Öğrenme yolu görünür durumlar ve önerilen sıra kullanır

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** Öğrenme yolu her görevi metin ve ikonla `Tamamlandı`, `Devam ediyor`, `Tekrar bekliyor`, `Atlandı`, `Sıradaki` veya `Başlamadı` olarak gösterir. Son açılan görev ayrıca `Buradasın` işaretini taşır. Ön koşullar erişimi kilitlemez; eksik ön koşul görev adıyla öneri olarak görünür.
- **Seçenekler:**
  - Yalnız tamamlanma yüzdesi: sade görünür ancak kullanıcının kaldığı, yeniden denemesi veya eksik bıraktığı adımı açıklamaz.
  - Ziyaret edilen her önceki görevi atlanmış saymak: güçlü bir sinyal üretir ancak yalnız gezinmiş kullanıcıyı yanlış etiketler.
  - Gerçek etkinlikten türetilen durumlar: mevcut yerel veri sözleşmesiyle güvenilir, geri döndürülebilir ve test edilebilirdir.
- **Uzman görüşleri:** Product Experience Designer, renk dışında ikon, metin ve eylem adı kullanılmasını; mevcut modülün varsayılan açık, mobilde ilerleme özetinin görünür kalmasını istedi. Learning Experience Expert, `Atlandı` durumunun yalnız daha sonraki bir görevde tamamlanma, deneme, taslak veya ipucu gibi gerçek etkinlik varsa türetilmesini önerdi. QA Engineer, gezinmenin tek başına atlama üretmemesini ve tüm görevlerin erişilebilir kalmasını regresyon koşulu yaptı.
- **Sonuç:** Üstte genel ilerleme ve tek bir “Kaldığın yer” eylemi, altta durum özetleri ve odaklı açılır modüller bulunur. Mevcut kayıt ziyaret geçmişi tutmadığı için yalnız açılıp hiç çalışılmayan geçmiş görevler kesin biçimde `Atlandı` olarak sunulmaz; gelecekte ziyaret geçmişi eklenirse bu karar yeniden değerlendirilebilir.

## ADR-013 — Görevler yapılandırılmış öğrenme döngüsü ve modül başına kademeli derinlik taşır

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** Her görev, temel çalıştırma sözleşmesine ek olarak kavram odağı, çıktı tanesi, kabul kontrolleri, veri notları, değerlendirme durumuna özel koçluk ve başarı sonrası yapılandırılmış çözümleme/transfer sorusu taşır. Bu içerik tek seferde yığılmaz; görev öncesi kısa sözleşme, hata sonrası ilgili koçluk ve başarı sonrası debrief sırasıyla açılır. Modül 4–7, tek örnek yerine üç hazırlık görevi ve bir bütünleştirici finalden oluşur; toplam çalışan görev sayısı 31'e çıkar.
- **Seçenekler:**
  - Yalnız görev sayısını artırmak: hızlıdır fakat aynı yüzeysel açıklama ve genel hata mesajlarını çoğaltır.
  - Uzun ders metinlerini görev paneline eklemek: bilgi miktarını artırır fakat SQL yazma alanındaki odağı ve keşfi zayıflatır.
  - Yapılandırılmış, aşamalı içerik: daha fazla yazım ve fixture testi gerektirir; buna karşılık her bilginin kullanıcı kararındaki yeri, gösterilme zamanı ve doğrulanabilir sözleşmesi nettir.
- **Uzman görüşleri:** Product Manager, genişlemenin görünen sayıdan çok tamamlanabilir kullanıcı yolculuğu üretmesini istedi. SQL Curriculum Expert, modül 4–7'de her görevin tek yeni bilişsel yük taşıdığı hazırlık → uygulama → transfer → final eğrisini önerdi. Learning Experience Expert, tam SQL cevabı vermeden hata durumuna özel kontrol adımları ve başarıdan sonra yeni duruma transfer sorusu istedi. QA Engineer, yeni görevlerin gerçek PGlite sonucu, alternatif doğru yaklaşım ve yanıltıcı edge case'lerle doğrulanmasını koşul koydu.
- **Sonuç:** `LessonTask` zengin öğrenme sözleşmesini zorunlu taşır ve içerik doğrulayıcı bunu build/test öncesinde denetler. Tam çözüm ipucu veya debrief içinde gösterilmez. Modül 8–10 aynı sözleşmeyle çalışmayı sürdürür ancak kapsam genişlemesi sonraki teslimdir. Yeni görevlerden biri gerçek motor testinde başarısız olur veya koçluk yanlış değerlendirme katmanına yönlendirirse ilgili içerik yayınlanmış sayılmaz.

## ADR-014 — İki kişilik kullanım için cihaz bazlı adlandırılabilir öğrenen profili

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** Her tarayıcı tek bir düzenlenebilir kullanıcı adıyla kişiselleştirilir; ilerleme paneli o cihazdaki görev geçmişini, modül durumlarını, çalışma ritmini ve sıradaki öneriyi gösterir. Profil adı hesap, erişim anahtarı veya uzaktan kimlik değildir. İki kullanıcı aynı yayımlanmış uygulamayı kendi cihazlarında ayrı ilerlemelerle kullanır.
- **Seçenekler:**
  - Aynı tarayıcıda iki profil seçici: backend gerektirmez ancak ayrı cihaz kullanımını çözmez ve yanlış profile veri yazma riski oluşturur.
  - D1 ve kimlik doğrulamalı senkronizasyon: ortak görünüm sağlar; buna karşılık hesap sürtünmesi, kişisel veri, yetkilendirme ve yeni hata alanı ekler.
  - Cihaz bazlı adlandırılabilir profil: mevcut çevrimdışı modeli korur, iki ayrı cihazda hemen kullanılabilir ve JSON aktarımıyla taşınabilir.
- **Uzman görüşleri:** Product Manager iki kişilik kullanım için genel amaçlı hesap sistemi kurulmasını kapsam dışı tuttu. System Architect görünen adın mevcut ilerleme şemasına sürümlü ve kayıpsız migration ile eklenmesini istedi. Product Experience Designer profil kontrolünün ilerleme paneline doğrudan giriş sağlamasını ve yerel kapsamın arayüzde açık yazılmasını istedi. QA Engineer eski v1 kayıtlarının, geçersiz adların ve yeniden yükleme sonrası kalıcılığın test edilmesini koşul koydu.
- **Sonuç:** Varsayılan ad nötrdür ve kullanıcı tarafından 2–32 karakter aralığında değiştirilebilir. Her yerel profil kararlı bir UUID taşır; export/import bu kimliği ve adı birlikte korur, mevcut ilerlemenin üzerine yazmadan önce profil aynı olsa bile açık onay ister. Desteklenmeyen veya bozuk yerel kayıt sessizce ezilmez. İki kullanıcının birbirinin ilerlemesini canlı görmesi gerçek bir ihtiyaç olursa bu karar yeniden açılır; o durumda platform kimliği ve D1 tabanlı yetkilendirilmiş senkronizasyon ayrı bir teslim olarak tasarlanır.

## ADR-015 — E-postayla paylaşılabilir çevrimdışı macOS paketi

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** Queryvale'in paylaşılabilir Mac sürümü ayrı bir Vite istemci çıktısı, yalnız loopback'e bağlanan küçük bir yerel HTTP sunucusu ve çift tıklanabilir macOS başlatıcısı olarak paketlenir. Başlatıcı ve sunucu Intel + Apple Silicon universal binary olarak, açıkça macOS 11 deployment target'ıyla derlenir. Origin `http://127.0.0.1:41739` olarak sabit kalır; böylece IndexedDB profili ve ilerlemesi sonraki açılışlarda aynı yerde bulunur. Paket Node, paket yöneticisi, internet veya backend gerektirmez.
- **Seçenekler:**
  - Kaynak kod ve kurulum betiği: küçük e-posta eki üretir ancak hedefte Node 22, pnpm ve yaklaşık 1 GB bağımlılık kurulumu gerektirir.
  - Tam Vinext sunucu çıktısı: mevcut üretim hattını birebir taşır ancak alıcıda JavaScript runtime ve sunucu bağımlılıkları bırakır.
  - Statik istemci ve yerel universal sunucu: yaklaşık 9 MB zip üretir, Apple Silicon ile Intel'i destekler ve yalnız kullanıcının Mac'inde çalışır.
- **Uzman görüşleri:** Product Manager alıcının zipten çıkarıp geliştirme bilgisi olmadan açabilmesini kabul ölçütü yaptı. System Architect sabit origin'in ilerleme bütünlüğü için zorunlu olduğunu ve `file://` kullanımının worker/WASM nedeniyle uygun olmadığını belirtti. Security and Performance Reviewer sunucunun yalnız `127.0.0.1` üzerinde dinlemesini, yol geçişlerini reddetmesini ve doğru MIME türlerini sunmasını istedi. QA Engineer zipten yeniden çıkarılan uygulamanın imzası, iki mimarili binary'si ve gerçek SQL yolculuğuyla doğrulanmasını koşul koydu.
- **Sonuç:** Paket ad hoc imzalanır ve açık kaynak lisans metinlerini içerir. Apple Developer notarizasyonu olmadığı için e-postadan gelen ilk açılışta macOS kullanıcının sağ tık → Aç onayı vermesini isteyebilir. Paket dış ağa açılmaz; iki Mac'in ilerlemesi bağımsızdır ve yalnız JSON dışa/içe aktarma ile taşınır.

## ADR-016 — İki cihazda paylaşım için Hostinger statik yayını

- **Tarih:** 2026-07-31
- **Durum:** Geçersiz — ADR-024 ve ADR-027 ile değiştirildi
- **Karar:** Queryvale'in iki kullanıcıya açık ana paylaşım yolu, Hostinger Web/Cloud Hosting altında ayrı ve sabit bir HTTPS origin'inde çalışan Custom HTML statik site olacaktır. `dist-portable` çıktısı doğrudan `public_html` köküne yüklenir; backend, Node, PHP veya MySQL eklenmez. Mevcut Cloudflare Sites yapılandırması ve çevrimdışı Mac paketi geri dönüş seçeneği olarak korunur.
- **Seçenekler:**
  - Notarize edilmemiş Mac paketi: çevrimdışıdır ancak alıcı Mac'te Gatekeeper, arşiv çıkarma ve çalıştırma izni sürtünmesi üretir.
  - Mevcut Sites adresi: teknik olarak çalışır ancak alıcıdan ChatGPT ile giriş ister.
  - Hostinger statik site: tek kanonik linkle iki cihazda açılır; buna karşılık internet bağlantısı ve doğru hosting hakkı gerektirir.
- **Uzman görüşleri:** Product Manager iki kişilik kullanımda kurulum sürtünmesini kaldıran tek linki önceliklendirdi. System Architect hash routing nedeniyle genel SPA rewrite eklenmemesini, IndexedDB bütünlüğü için origin'in sabit kalmasını ve uygulamanın başka scriptlerden ayrılmış bir subdomain'de çalışmasını istedi. Security Reviewer istemci paketinde cevapların incelenebilir olduğunu, bunun öz-çalışma için kabul edilebilir fakat sınav için uygun olmadığını; dizin parolası ve hPanel 2FA'nın uygulama içine parola eklemekten daha güvenli olduğunu belirtti. QA Engineer gerçek Hostinger adresinde WASM/data MIME türleri, Monaco, SQL çalıştırma ve yenileme sonrası ilerleme kalıcılığını sürüm kapısı yaptı.
- **Sonuç:** Bu yol yalnız hesapta File Manager sunan Custom PHP/HTML sitesi varsa kullanılır; Website Builder içine dosya gömülmez. Hash'li asset'ler uzun süre önbelleklenir, `index.html` yeniden doğrulanır ve catch-all rewrite eklenmez. Kullanıcı adı, taslak ve ilerleme her tarayıcıda yerel kalır; cihazlar arasında canlı senkronizasyon yoktur. Alan adı/origin değişirse ilerleme JSON dışa/içe aktarımıyla taşınır.

## ADR-017 — Başarı akışında sonuç önce, ilerleme kullanıcının kararıdır

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Karar:** Doğru sorgu artık modal açmaz, odağı taşımaz veya kullanıcıyı otomatik olarak sonraki göreve yönlendirmez. Sonuç tablosu önce gösterilir; kısa başarı özeti tablonun altında aynı kaydırma alanında yer alır. Uzun çözümleme ve transfer içeriği varsayılan olarak kapalıdır. Sonraki göreve geçiş yalnız kullanıcının açık eylemiyle gerçekleşir.
- **Seçenekler:**
  - Otomatik tamamlama modalı: başarıyı güçlü biçimde duyurur ancak çıktıyı örter, odağı çalar ve öğrenme kararını aceleye getirir.
  - Tablo üstünde kalıcı geniş başarı paneli: modalı kaldırır fakat sınırlı sonuç alanını daraltır ve çıktıyı ikincilleştirir.
  - Tablo sonrası kompakt, katmanlı başarı bölgesi: çıktıyı birincil tutar; ayrıntıyı ve ilerlemeyi kullanıcının zamanlamasına bırakır.
- **Uzman görüşleri:** Product Experience Designer, başarı sonrası odak tuzağı oluşmamasını ve URL'nin yerinde kalmasını istedi. Learning Experience Expert, kısa canlı mesajın yeterli olduğunu; çözüm adımları ile transfer sorusunun yalnız talep üzerine açılması gerektiğini belirtti. QA Engineer, tablonun görünür kalmasını, detayların başlangıçta kapalı olmasını ve gezinmenin yalnız açık düğme eylemiyle gerçekleşmesini regresyon sözleşmesi yaptı.
- **Sonuç:** Başarı mesajı ekran okuyucuya ayrı ve kısa bir `status` ile duyurulur; sonuç bölümünün tamamı canlı bölge değildir. Her yeni sonuçta kaydırma tablo başına alınır ancak odak değiştirilmez. Son görevde aynı açık eylem ilerleme paneline götürür. Bu akış masaüstü ve dar ekran E2E senaryolarında doğrulanır.

## ADR-018 — Yardım merdiveni çıkışsız bırakmaz ve açık talepte çalışan çözüm gösterir

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Soru ve kullanıcı etkisi:** Üç yönlendirici ipucu, SQL sözdizimini hiç bilmeyen veya bildiği halde sorguyu kuramayan kullanıcıya çalışan bir örnek vermediği için öğrenme döngüsü çıkışsız kalıyordu. Özellikle ilk üç modül, tahmin yeteneğini değil temel SQL kurma becerisini öğretmelidir.
- **Karar:** Her görev tip güvenli ve boş olamayan bir `solutionSql` taşır. Yardım akışı `Mantık → Parçalar → Sorgu iskeleti → Bir doğru sorgu` sırasındadır. İlk üç adım cevabı kopyalanabilir biçimde vermez; üçü görüldükten sonra tam çalışan sorgu kalıcı bir düğmeyle, yalnız kullanıcının açık talebinde açılır. Çözüm editöre otomatik yazılmaz, otomatik çalıştırılmaz, görevi tamamlamaz ve ilerlemeye ceza vermez. Kod bloğu kopyalanabilir; kullanıcı sorguyu editörde yine kendisi çalıştırır. Bu karar ADR-013'ün “tam çözüm gösterilmez” hükmünü geçersiz kılar, yapılandırılmış koçluk ve debrief kararlarını korur.
- **Seçenekler:**
  - Tam çözümü hiç göstermemek: yüzeysel kopyalamayı azaltır ancak tamamen takılan başlangıç kullanıcısını üründen çıkarır.
  - Belirli sayıda yanlış denemeden sonra otomatik çözüm vermek: erişimi geciktirir, bilmeyen kullanıcıyı gereksiz hataya zorlar ve cezalandırıcı hissettirir.
  - Açık talepte ayrı çalışan örnek göstermek: öğrenene önce kademeli destek sunar, ihtiyaç olduğunda güvenilir çıkış verir ve editör/ilerleme kontrolünü kullanıcıda bırakır.
- **Uzman görüşleri:** SQL Curriculum Expert ilk üç modülde üçüncü ipucunun gerçek bir sorgu iskeleti olmasını ve tam çözümün ayrı içerik alanında tutulmasını istedi. Learning Experience Expert, çözümün “geçerli çözümlerden biri” olarak sunulmasını, yanlış deneme şartı taşımamasını ve hiçbir puan/ilerleme cezası üretmemesini önerdi. Product Experience Designer, kalıcı `aria-expanded` tetiği, yatay kaydırılabilir salt-okunur kod bloğu ve editörün değişmediğini bildiren kısa ekran okuyucu durumunu koşul koydu. QA Engineer, kullanıcıya gösterilen her çözümün gerçek PGlite motorunda doğru kabul edilmesini ve çözüm açıldığında editör ile tamamlanma durumunun değişmemesini regresyon sözleşmesi yaptı.
- **Doğrulama ve geri dönüş koşulu:** 31 kullanıcı çözümü bağımsız referans fixture'larıyla eşleştirilip gerçek motor üzerinde yürütülür; UI testi çözümün başlangıçta kapalı olduğunu, üç adım sonrası açılıp kapanabildiğini, kopyalanabildiğini ve editör/başarı durumunu değiştirmediğini doğrular. E2E ilk görevde aynı sözleşmeyi gerçek Monaco ile sınar. Çözüm gösterimi görev terkini azaltmıyor veya doğrudan kopyalamanın öğrenme transferini belirgin biçimde bozuyorsa erişim zamanı yeniden değerlendirilir; tam çözüm alanı ve motor testi kaldırılmaz.

## ADR-019 — Veri analisti ilerlemesi tamamlanma yüzdesiyle değil, doğrulanmış kanıt zinciriyle büyür

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Soru ve kullanıcı etkisi:** Mevcut 31 görev güçlü bir analitik SQL laboratuvarı kuruyor; ancak doğru sorgu iş bulgusuna ve paydaş kararına dönüşmeden akış sona erebiliyor. İlk deneme, süre, seri veya tek kavram yüzdesini büyütmek kullanıcıya veri analisti yetkinliği kazandığını kanıtlamaz ve başlangıç kullanıcısını denemekten ya da yardım almaktan caydırabilir.
- **Karar:** Queryvale’in ürün omurgası `Sor → İncele → Sorgula → Doğrula → Anlat` kanıt döngüsüdür. Doğru değerlendirilen ilk sorgu; kullanıcı sorgusu, sınırlı ve JSON-güvenli çıktı önizlemesi, kolonlar, satır sayısı ve doğrulama tarihiyle yerel bir kanıt kaydı oluşturur. Kullanıcı bu kanıta zorunlu olmayan `bulgu`, `öneri` ve isteğe bağlı `çekince` yazar; yorum otomatik olarak doğru ilan edilmez. İlerleme ekranı bu kayıtları **Kanıt Defteri** olarak gösterir ve karar notunu birincil sinyal yapar. Mevcut on modül içerik kopyalamadan dört iş sonucu bölümünde görünür: `Temeli kur`, `İş sorusunu çöz`, `Örüntüyü keşfet`, `Karara dönüştür`. Bölüm ilerlemesi yalnız evaluator tarafından doğru bulunan gerçek görevlerden türetilir; “ustalaştın” veya “işe hazırsın” iddiası üretmez.
- **Seçenekler:**
  - Daha fazla bağlantısız SQL görevi eklemek: içerik sayısını büyütür fakat sorgu öncesi soru kurma ve sorgu sonrası karar iletişimi açığını kapatmaz.
  - Yeni bir beceri dashboard’u yapmak: hızlı görünür değer üretir ancak mevcut zayıf completion sinyallerini mesleki yeterlik gibi süsler.
  - Kapalı kanıt döngüsü kurmak: yeni state/migration ve UX işi gerektirir; buna karşılık gerçek PGlite sonucu ile kullanıcı yorumunu aynı denetlenebilir artefakta bağlar ve gelecekteki portföy/Insight Studio için güvenilir temel oluşturur.
- **Uzman görüşleri:** Product Manager ilk dilimin yeni paket, backend veya yapay zekâ olmadan mevcut çalışan üründen mesleki değer üretmesini istedi. SQL Curriculum Expert resmi analist çerçevelerindeki iş sorusu, veri kalitesi, modelleme, görselleştirme, yorum ve vaka teslimi açığını; yeni yüz bağlantısız syntax sorusundan önce tek bir uçtan uca kanıt vakasıyla kapatmayı önerdi. Product Experience Designer kart dashboard’u yerine aynı profesyonel döngüyü tekrarlayan Kanıt Rotası metaforunu, sonuç tablosundan sonra tek cümlelik karar notunu ve cezalandırıcı olmayan sinyalleri istedi. System Architect snapshot’ın yalnız doğru evaluator sonucunda, sınırlandırılmış ve JSON-güvenli biçimde kaydedilmesini; V1/V2 kayıtlarının V3’e kayıpsız taşınmasını ve türetilmiş kariyer verisinin ayrıca persist edilmemesini koşul koydu.
- **Doğrulama ve geri dönüş koşulu:** Yanlış sorgu kanıt üretmez; ilk doğru sorgu snapshot oluşturur; not ancak doğrulanmış kayıt üzerinde kaydedilir; yenileme/export-import sorgu, çıktı özeti ve notu korur; V1/V2 migration, 2 MB import ve preview sınırları test edilir. Masaüstü ve 320 px akışında tablo → kanıt notu → Kanıt Defteri klavyeyle tamamlanır. Karar notu formu öğrenenin sonucu incelemesini artırmıyor veya akışı belirgin biçimde terk ettiriyorsa zorunlu hale getirilmez; alan sayısı ve yerleşimi sadeleştirilir. Doğrulanmış snapshot temeli korunur.

## ADR-020 — Ana sayfa tek bir vakanın scroll anlatısıyla ürün davranışını gösterir

- **Tarih:** 2026-07-31
- **Durum:** Geçersiz — ADR-022 ile değiştirildi
- **Soru ve kullanıcı etkisi:** Mevcut ana sayfa doğru bilgiyi veriyor ancak birbirinden kopuk özellik blokları, Queryvale’in brief’ten karar notuna uzanan özgün çalışma döngüsünü deneyimletmiyordu. Premium hareket dili eklenirken scroll kontrolünü ele geçirmek, ağır animasyon bağımlılıkları kullanmak veya erişilebilir içeriği sahne durumuna bağlamak ürünün hız ve yerel çalışma vaadini zedeleyebilirdi.
- **Karar:** Ana sayfa `Sor → İncele → Sorgula → Doğrula → Anlat` sırasını tek bir analist vakasının dönüşümü olarak anlatır. Masaüstünde normal akıştaki metin adımlarının yanında CSS `position: sticky` ile duran tek görsel sahne bulunur; sahne yalnız adım sınırlarında tek `IntersectionObserver` ile değişir. Ham scroll dinleyicisi, scroll hijacking, snap, parallax, video, uzak görsel, Monaco/PGlite importu veya yeni animasyon paketi kullanılmaz. Mobil, kısa viewport, `prefers-reduced-motion` ve ürünün azaltılmış hareket ayarında sticky sahne kapanır; her adım kendi statik görseliyle doğal DOM akışında görünür.
- **Seçenekler:**
  - Mevcut bağımsız kart bloklarını yalnız renklendirmek: düşük risklidir ancak ürünün ayırt edici kanıt döngüsünü hissettirmez.
  - Tam ekran scroll kilitlemeli sinematik sahneler: güçlü ilk etki yaratır ancak klavye, zoom, mobil, düşük donanım ve içerik keşfinde yüksek risk taşır.
  - CSS-first sticky kanıt sahnesi: hareketi ürün davranışına bağlar, metni normal akışta tutar ve küçük bir geri dönüş yüzeyiyle statik düzene çevrilebilir.
- **Uzman görüşleri:** Product Experience Designer aynı iş vakasının brief, şema, SQL, sonuç ve karar notuna dönüşmesini; masaüstünde yaklaşık 42/58 metin–sahne oranını ve mobilde statik sırayı önerdi. SQL Curriculum Expert gerçek ürün sözleşmelerinin kullanılmasını, yardımın ceza olmadığının ve kullanıcının yorumunun otomatik doğrulanmadığının açık yazılmasını istedi. Security and Performance Reviewer tek observer, yalnız opacity/küçük transform geçişleri, observer fallback/cleanup ve yeni bağımlılık eklenmemesi koşulunu koydu. Coordinator, premium etkinin iddia veya dekor yoğunluğundan değil aynı ürün yüzeyinin anlamlı dönüşümünden üretilmesine karar verdi.
- **Doğrulama ve geri dönüş koşulu:** Tüm beş adım scroll veya JavaScript olmadan DOM’da okunur; CTA’lar normal focus sırasındadır; observer desteklenmiyorsa ilk kompozit sahne ve tüm metin korunur. Masaüstü sticky değişimi, 820/320 px tek kolon, kısa viewport, açık/koyu tema ve azaltılmış hareket kontrol edilir; unit test, lint, typecheck ve production build geçer. Scroll sırasında uzun görev, belirgin LCP/CLS gerilemesi veya kullanıcıların adımları kaçırması gözlenirse observer tabanlı katman geçişi kaldırılır; aynı semantik içerik statik sahneler olarak korunur.

## ADR-021 — Görev paneli sıralı teslim sözleşmesi ve istek üzerine ayrıntı kullanır

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Soru ve kullanıcı etkisi:** Görev panelinde amaç, senaryo, öğrenme açıklaması, kontroller, veri notları, kolonlar ve yardım aynı anda görünerek ilk eylemi ekranın altına itiyordu. Başlangıç kullanıcısı önce ne üretmesi gerektiğini ve nereden başlayacağını ayırt edemiyordu.
- **Karar:** Görev panelinin varsayılan görünümü semantik bir `İstenen teslim → Çıktını tanı → Veriyi gör, sorgunu yaz` sırasıdır. Amaç, çıktı tanesi, beklenen kolonlar ve iki başlangıç eylemi görünür kalır. Kabul kontrolleri, kavram açıklaması ve iş bağlamı bağımsız disclosure alanlarında kapalı başlar; veri notları `Şema & veri` sekmesine taşınır. Yardım ayrı ve kapalı bir eylem konsoludur, mevcut ipucu/çözüm merdivenini korur ve sonuç panelinden yardım istendiğinde görünür hâle gelir. Bu karar ADR-011'in bilgi sırasını ayrıntılandırır; doğrudan şema/editör erişimi ile tek sıradaki ipucu ilkesini korur.
- **Seçenekler:**
  - Metni yalnız kısaltmak: ilk görünümü hafifletir ancak içerik sözleşmesini ve acemi desteğini kaybettirir.
  - Çok sekmeli veya çok panelli sihirbaz: sıralamayı güçlendirir ancak SQL çalışma alanında fazladan gezinme ve state üretir.
  - Sıralı ana akış ve isteğe bağlı ayrıntı: ilk eylemi görünür tutar, zengin içeriği kaybetmez ve mevcut görev/şema tab sözleşmesini bozmaz.
- **Uzman görüşleri:** Product Experience Designer aynı önem seviyesindeki blokları üç adımlı yön bulma sırasına indirmeyi, tek baskın şema eylemini ve yardımın kapalı kalmasını önerdi. SQL Curriculum Expert `subtitle`, `scenario` ve `objective` tekrarını kaldırıp görev sözleşmesi ile yardım merdivenini ayırdı; veri notlarının şema yanında anlamlı olduğunu belirtti. Security and Performance Reviewer native disclosure kullanımını, yeni bağımlılık eklenmemesini, Monaco/PGlite yaşam döngüsünün etkilenmemesini ve mobilde tek kaydırma sahibini koşul koydu.
- **Doğrulama ve geri dönüş koşulu:** İlk görünümde üç sıralı başlık ve başlangıç eylemleri okunur; yardım başlangıçta kapalıdır, tetik odak kaybetmeden açılır ve yalnız sıradaki ipucunu gösterir. Görev/şema ok tuşları, kolon kopyalama, editör odağı ve çözüm sözleşmesi korunur. Birim/entegrasyon testleri, masaüstü ve mobil E2E, açık/koyu tarayıcı kontrolü, lint, typecheck ve production build geçer. Gerçek kullanımda kullanıcılar çıktı sözleşmesini bulamıyor veya ilk eyleme ulaşmak için hâlâ gereksiz kaydırıyorsa açık alanların miktarı yeniden azaltılır; zengin içerik ve yardım merdiveni silinmez.

## ADR-022 — Ana sayfa scroll anlatısı yerine tek-viewport Evidence Deck kullanır

- **Tarih:** 2026-07-31
- **Durum:** Geçersiz — ADR-023 ile değiştirildi
- **Soru ve kullanıcı etkisi:** Ana sayfanın sticky scroll hikâyesi aynı ürün yüzeyini dönüştürse de beş uzun sahne, yardım alanı, görev örnekleri, rota ve tekrarlanan CTA’larla kullanıcıyı gereksiz bir sayfa yolculuğuna zorluyordu. Ürün birkaç saniyede anlaşılmalı ve ilk eylem her zaman görünür kalmalıdır.
- **Karar:** Ana sayfa standart masaüstü viewportunda header altında tek kompozisyondur: solda ürün vaadi, iki niyet bazlı CTA ve kısa yardım güvencesi; sağda gerçek ilk görevi `Sor → İncele → Sorgula → Doğrula → Anlat` aşamalarında gösteren Evidence Deck; altta dört kısa ürün kanıtı bulunur. Aşamalar scroll, timer veya otomatik oynatmayla değil yalnız kullanıcının tab/ok tuşu seçimiyle aynı panel içinde değişir. Yalnız aktif görsel ağacı render edilir. Uzun yardım, saha dosyası, kariyer rotası ve final CTA bölümleri landing’den kaldırılır; bunların ayrıntısı görev alanı ve Öğrenme Yolu’nda kalır. Bu karar ADR-020’nin IntersectionObserver ve uzun scroll sahnesi hükmünü geçersiz kılar; aynı vaka ve beş aşamalı kanıt döngüsü ilkesini korur.
- **Seçenekler:**
  - Mevcut scroll mesafesini yalnız kısaltmak: görünümü iyileştirir ancak ana etkileşimi hâlâ sayfa konumuna bağlar.
  - Wheel/touch yakalayan tam ekran sunum: tek ekran hissini güçlendirir fakat doğal scroll, klavye, mobil ve erişilebilirliği bozar.
  - Kullanıcı kontrollü tek-panel deck: sahneyi sabit tutar, içerik üzerinde açık kontrol verir ve ek state/bağımlılık gerektirmez.
- **Uzman görüşleri:** Product Experience Designer sabit sol değer önerisi, sağda tek aktif artefakt, beş erişilebilir tab ve ince proof rail önerdi; premium etkinin katman sayısından değil kompozisyon disiplininden gelmesini istedi. SQL Curriculum Expert yalnız gerçek ilk görev, tek cümle değer vaadi, üç güven kanıtı ve niyet bazlı CTA’ların kalmasını; tekrarlanan bölümlerin kaldırılmasını istedi. Security and Performance Reviewer yalnız yerel `activeScene` state’i, roving tab focus’u, wheel/touch yakalamama, tek aktif görsel ağacı, reduced-motion’da anlık geçiş ve kısa viewportta doğal fallback koşullarını koydu.
- **Doğrulama ve geri dönüş koşulu:** Beş tab `aria-selected`, `aria-controls` ve roving `tabIndex` sözleşmesini taşır; oklar ile Home/End odağı seçicide tutarak sahneyi değiştirir. IntersectionObserver, scroll listener, timer, scroll-snap ve yeni paket yoktur. 1440×900 ile 1280×720’de temel landing tek viewportta kalır; dar/kısa ekranda beş sahne alt alta çoğalmaz ve yalnız aktif panel görünür. Reduced-motion geçişi kaldırır. Birim testleri, lint, typecheck ve production build geçer. Kullanıcılar deck aşamalarını keşfetmiyor veya gerçek ürünün ne yaptığını anlayamıyorsa tab etiketleri ve başlangıç sahnesi yeniden düzenlenir; uzun scroll hikâyesine geri dönülmez.

## ADR-023 — Ana sayfa doğal scroll ile sürülen sticky bir analiz filmi kullanır

- **Tarih:** 2026-07-31
- **Durum:** Geçersiz — ADR-026 ile değiştirildi
- **Soru ve kullanıcı etkisi:** Tek-viewport Evidence Deck içerik yoğunluğunu azalttı ancak kullanıcının istediği sinematik keşif hissini de kaldırdı. İstenen davranış sayfayı blok blok aşağı taşımak değil; doğal scroll ilerlerken aynı kompozisyonu header altında sabit tutmak ve gerçek bir vakanın beş aşamasını birbirine bağlı film kareleri gibi dönüştürmektir.
- **Karar:** Yeterli genişlik ve yükseklikte ana sayfa yaklaşık `360svh` uzunluğunda doğal bir story track ve içinde `position: sticky` tek sahne kullanır. Scroll veya touch olayı engellenmez; pasif scroll dinleyicisi yalnız tek `requestAnimationFrame` planlar. İlerleme saf bir fonksiyonla iki komşu sahneye ve karışım oranına çevrilir; oran React state'ine her karede yazılmaz, yalnız opacity ve küçük transform CSS değişkenleri doğrudan güncellenir. Aynı anda en fazla mevcut ve sıradaki iki `StoryVisual` render edilir. React state yalnız aktif sahne eşiği değiştiğinde güncellenir. Kalıcı arka plan, başlık, CTA'lar, deck çerçevesi ve ilerleme şeridi yerini korur; `Sor → İncele → Sorgula → Doğrula → Anlat` aynı `m1-t1` vakasının brief, şema, SQL iskeleti, sonuç ve kanıt notu dönüşümüdür. Sekmeler ilgili scroll noktasına kullanıcı eylemiyle gider ve ok/Home/End desteğini korur. Bu karar ADR-022'nin “scroll kullanılmaz” hükmünü geçersiz kılar; tek kompozisyon, gerçek vaka ve kompakt içerik kararlarını korur.
- **Seçenekler:**
  - Ayrık tab deck: erişilebilir ve kompakttır ancak istenen scroll ile film-kareleri hissini üretmez.
  - Wheel/touch yakalayan tam ekran sunum: sahneyi kontrol eder fakat native scroll, momentum, klavye ve mobil davranışını bozar.
  - Native scroll + sticky canvas + rAF crossfade: tek arka plan hissini korur, yönü doğal biçimde tersine çevirebilir ve yeni animasyon paketi gerektirmez.
- **Uzman görüşleri:** Product Experience Designer yaklaşık `360svh` track, tek sticky canvas, sabit 40/60 kompozisyon, iki komşu kare arasında opacity ile 8–14 px transform ve doğrudan sahne sekmeleri önerdi. Learning Experience Expert beş karenin aynı ilk vakanın neden-sonuç zinciri olmasını, landing'de çalışan tam sorgu yerine iskelet gösterilmesini ve yorumun otomatik doğrulanmadığının korunmasını istedi. Security and Performance Reviewer pasif listener + tek rAF, her karede React render etmeme, aynı anda en fazla iki görsel, URL/history'yi değiştirmeme ve wheel/touch/PageDown müdahalesi yapmama koşullarını koydu. Coordinator, kullanıcının açık etkileşim tarifini önceki “scroll yok” yorumundan üstün tuttu.
- **Doğrulama ve geri dönüş koşulu:** Saf progress eşlemesi başlangıç, ara eşik, bitiş, clamp ve ters yönde deterministik olmalıdır. 1280×720 ve 1440×900'de sticky sahne header altında aynı konumda kalmalı; track başı, dört ara konum ve sonda doğru aşama seçilmelidir. Hızlı/ters scroll URL'yi değiştirmemeli; layout shift veya yatay body taşması üretmemelidir. Mobil, kısa viewport, işletim sistemi ya da ürün içi reduced-motion tercihinde uzun track ve rAF kapanır; tek aktif panelli tab deck çalışmaya devam eder. Unit, entegrasyon, lint, typecheck ve production build geçer. Düşük donanımda kare atlama, uzun görev veya odak sorunu ölçülürse track kısaltılır; native scroll ve statik tab fallback korunur.

## ADR-024 — Küçük public pilot GitHub Pages üzerinde otomatik yayımlanır

- **Tarih:** 2026-07-31
- **Durum:** Kabul
- **Soru ve kullanıcı etkisi:** Localhost ve imzasız Mac paketi ikinci kullanıcıya ulaşmada kurulum ve güvenlik sürtünmesi üretti. İki kişilik pilotun tek HTTPS bağlantısıyla açılması, her güncellemenin aynı adrese güvenilir biçimde gitmesi ve mevcut tarayıcı içi SQL/ilerleme mimarisinin korunması gerekiyor.
- **Karar:** Public pilotun kaynak deposu public GitHub reposudur. `main` dalına push, GitHub Actions içinde Node 22.13 ve pnpm 11 ile lint, typecheck, unit/render testleri ve `build:portable` çalıştırır; yalnız temiz `dist-portable` artefaktı resmi GitHub Pages Actions akışıyla yayımlanır. Build çıktısı git geçmişine eklenmez. `base: "./"` ve hash routing korunur; SPA catch-all kullanılmaz. GitHub Pages URL'si tek kanonik origin olarak sabit tutulur. ADR-016'nın Hostinger'ı ana paylaşım yolu yapan hükmü geçersizdir.
- **Seçenekler:**
  - İmzalanmamış Mac paketi: çevrimdışı çalışır fakat Gatekeeper ve kurulum sürtünmesi devam eder.
  - Hostinger'a elle dosya yüklemek: özel alan ve header kontrolü sağlar fakat her sürümde manuel paket/yükleme işi üretir.
  - GitHub Pages + Actions: public kaynak ve erişim kısıtı olmaması karşılığında ücretsiz, tekrarlanabilir ve tek bağlantılı pilot sağlar.
- **Uzman görüşleri:** Product Manager iki kullanıcı için kurulum gerektirmeyen sabit bağlantıyı önceliklendirdi. System Architect mevcut göreli asset üretimi, hash router, PGlite WASM/data ve Monaco worker URL'lerinin proje alt yoluna uygun olduğunu; deploy girdisinin `dist-portable` içeriği olması gerektiğini belirtti. Security and Performance Reviewer GitHub Pages'in erişim kontrolü olmadığını, `solutionSql` ve fixture'ların public kaynakta görüleceğini, ilerlemenin origin bazlı IndexedDB'de ayrı kalacağını ve yayın sonrası WASM MIME/worker/gerçek sorgu smoke testinin zorunlu olduğunu kaydetti. QA Engineer build dosyalarını commit etmek yerine Actions artefaktı, frozen lockfile ve kalite kapılarının her push'ta çalışmasını istedi.
- **Doğrulama ve geri dönüş koşulu:** Public URL'de ana sayfa ve doğrudan `#/lab/m1-t1` açılıp yenilenir; JS/CSS/worker/WASM/data dosyaları 200 döner ve WASM `application/wasm` olarak sunulur; ilk gerçek sorgu değerlendirilir; kullanıcı adı ve ilerleme yenileme sonrası korunur; temiz ikinci tarayıcı profili bağımsız başlar. Repo/alan adı değişmeden yeni deploy mevcut ilerlemeyi silmemelidir. İleride parola korumalı erişim gerçek bir gereksinime dönüşürse yeni yayın hedefi ayrı bir kararla açılır; varsayılan ve tek aktif hat GitHub Pages olarak kalır.

## ADR-025 — Header, üç aşamalı analist rotasını ve tekil aktif konumu açıklar

- **Tarih:** 2026-08-01
- **Durum:** Kabul
- **Soru ve kullanıcı etkisi:** Önceki header masaüstünde ikonları gizli üç soyut kelime gösteriyor, profil ile “İlerleme” aynı ekrana iki ayrı hedef gibi gidiyor ve ana sayfa/Ayarlar için aktif konum belirtmiyordu. Kullanıcı nereden başlayacağını, laboratuvarın ne yaptığını ve ilerlemesini nerede bulacağını ilk bakışta anlayamıyordu.
- **Karar:** Üst gezinme `Vaka Rotası → SQL Laboratuvarı → Profilim` şeklinde tek bir analist çalışma sırası olarak sunulur. Masaüstünde her hedef ikon, açık ad ve eylem açıklaması taşır; aktif hedef yüzey, sınır, indeks çizgisi ve görünür `Şu an` işaretiyle belirtilir. Profilin baş harfleri ve adı `Profilim` hedefinin içine alınır; aynı ekrana giden ayrı profil kontrolü kaldırılır. Marka `Sorudan kanıta` ürün imzasını taşır ve ana sayfada, Ayarlar kontrolü de kendi ekranında `aria-current` alır. Mobil alt navigasyon aynı üç hedefi kısa adlarla korur; Queryvale kelime markası üstte görünür kalır. Tema ve Ayarlar kontrolleri masaüstünde görünür metinle açıklanır; `920px` ve altında aynı kontroller üst header'da erişilebilir adlarını koruyan iki kompakt `44×44px` ikon olarak görünür kalır. Yeni paket veya header yüksekliği değişikliği yoktur.
- **Seçenekler:** Yalnız renk/gölge eklemek mevcut bilgi mimarisi belirsizliğini korurdu. Profil kontrolünü ayrı tutup rozet eklemek aynı hedefe giden iki aktif kontrol üretmeye devam ederdi. Tüm kontrolleri hamburger menüye almak masaüstü keşfini ve hızlı çalışma geçişini zayıflatırdı. Üç aşamalı rota, mevcut ürün ekranlarını yeni backend veya state üretmeden tek bir anlaşılır sözleşmede birleştirir.
- **Uzman görüşleri:** Product Experience Designer genel SaaS kapsülleri yerine Queryvale’in Kanıt Defteri indeks dilini, tek profil hedefini ve aktifliği yalnız renge bırakmayan üçlü sinyali önerdi. SQL Curriculum ve Learning Experience değerlendirmesi gezinmenin `seç → uygula/doğrula → kanıtı incele` zihinsel modelini taşımasını istedi. Security and Performance Reviewer mevcut 68/62 px yükseklik sözleşmesinin korunmasını, yüksek kontrastlı odağı, route sonrası ana içeriğe odak taşınmasını, reduced-motion için JavaScript smooth scroll’un kapatılmasını ve yeni blur/animasyon yükü eklenmemesini koşul koydu. Coordinator görünür açıklamaları geniş ekranda, kısa ama aynı anlamdaki etiketleri mobilde kullanarak kararları birleştirdi.
- **Doğrulama ve geri dönüş koşulu:** Her rotada yalnız bir görünür hedef `aria-current="page"` taşır; ana sayfa ve Ayarlar da kendi tekil current durumuna sahiptir. Klavye ile rota değişiminde odak `main` alanına geçer, hareket azaltıldığında scroll `auto` olur ve içerik-atlama bağlantısı çalışır. 320, 820, 821, 1024 ve geniş masaüstünde yatay taşma olmadan marka ve ana hedefler anlaşılır kalmalı; `920px` ve altında tema ile Ayarlar üst header'da en az `44×44px` dokunma hedefleri olarak görünmelidir. Component/entegrasyon testleri, lint, typecheck, gerçek SQL testleri ve iki production build geçer. Dar masaüstünde hedef adları kesilir veya header çalışma alanını örtüyorsa önce yardımcı açıklamalar kısaltılır; tema ve Ayarlar ikonları, tek profil hedefi ve üç aşamalı rota korunur.

## ADR-026 — Ana sayfa tek SQL filmiyle açılır, ürün tanıtımını kullanıcı kontrollü deck'e bırakır

- **Tarih:** 2026-08-01
- **Durum:** Kabul
- **Soru ve kullanıcı etkisi:** Mevcut sticky anlatıda sol ürün vaadi sabit kalırken yalnız sağdaki ilk görev kanıtları değişiyordu. Kullanıcı, ana sayfanın açılışında farklı SQL sorgularının aynı zeminde kare kare büyümesini, güçlü bir final sorguyla kapanmasını ve ancak ardından Queryvale tanıtımına geçmesini istedi. İki uzun sticky track'i art arda kullanmak bu isteği yaklaşık `700svh` süren yorucu bir sayfaya dönüştürebilirdi.
- **Karar:** Ana sayfa tek bir `350svh` doğal-scroll SQL filmiyle açılır. Altı sahne aynı şube performansı vakasını `kapsam → hedef → gerçekleşen → durum → kıyas → karar` sırasıyla büyütür; sorgular müfredat görevlerinden ayrı `branch_directory`, `sales_targets` ve `sales_ledger` showcase fixture'ında PostgreSQL/PGlite ile çalışır. Film native scroll'u engellemez; pasif listener tek `requestAnimationFrame` planlar, saf progress eşlemesi yalnız iki komşu katmanı opacity ve küçük transform ile karıştırır, React state yalnız sahne eşiğinde değişir. Aktif sahnenin kodu satır satır kısa bir clip/opacity geçişiyle yazılır; reduced-motion'da bu geçiş kaldırılır. Film hiçbir dersin çözümünü veya ilerleme kanıtını oluşturmaz. Film doğal olarak çözüldükten sonra ürün tanıtımı `Bir tabloyla başla. İçindeki hikâyeyi bul.` vaadiyle normal akışta görünür ve mevcut `Sor → İncele → Sorgula → Doğrula → Anlat` Evidence Deck'i yalnız kullanıcı kontrollü manual tab modunda çalışır. Bu karar ADR-023'ün mevcut ilk görev deck'ini scroll ile sürme hükmünü değiştirir; native scroll, sticky canvas, tek rAF, en fazla iki katman ve responsive fallback ilkelerini korur.
- **Seçenekler:** Tek track içinde SQL filmiyle ürün tanıtımını on bir sahneye uzatmak kesintisiz görünürdü ancak CTA'yı ve ürünün ne yaptığını çok geç gösterirdi. İki ayrı sticky film güçlü hareket üretirdi fakat toplam scroll mesafesini gereksiz büyütürdü. SQL filmi ardından manual ürün deck'i, istenen sinematik açılışı tek yerde yoğunlaştırır ve ürün incelemesini kullanıcının kontrolüne bırakır.
- **Uzman görüşleri:** Product Experience Designer sağda yer değiştirmeyen editör yüzeyi, solda altı sıcak anlatı sahnesi, karakter karakter typewriter yerine okunabilir crossfade ve film sonrası doğal ürün geçişi önerdi. SQL Curriculum Expert final vakasını gerçek ileri düzey şema üzerinde altı ayrı sorguyla doğruladı; final çıktının Ankara'yı `Hedefte`, Istanbul'u `Yakın takip`, İzmir'i `Aksiyon gerekli` olarak sınıflandırdığını kaydetti. Security and Performance Reviewer ikinci cinematic track'in kapatılmasını, 330–350svh sınırını, cached ölçümler + tek rAF'ı, ilk görev cevabının ifşa edilmemesini ve mobil/kısa/reduced-motion görünümünde uzun track'in manual stepper'a dönüşmesini koşul koydu. Coordinator bu görüşleri tek cinematic açılış ve tek doğal ürün viewportunda birleştirdi.
- **Doğrulama ve geri dönüş koşulu:** Saf frame fonksiyonu NaN, clamp, altı sahne konumu, ileri/geri ilerleme ve final hold için deterministik olmalıdır. Filmde aynı anda en fazla iki frame render edilir; manual fallback tek aktif sorgu, altı erişilebilir tab, roving focus ve Home/End desteği sunar. `<1100px`, yüksekliği `<700px`, işletim sistemi veya ürün reduced-motion ayarında sticky track ve scroll listener kapanır. Ürün deck'i her koşulda manual kalır; `Tanıtıma geç` eylemi ürün bölümünü kaydırıp odaklar. Unit/entegrasyon testleri, lint, typecheck, render testi ve iki production build geçer. 1280×720'de final sorgu okunamayacak kadar sıkışır veya film kullanıcıların ürüne ulaşmasını belirgin biçimde geciktirirse önce sorgu satırları ve track `320svh`ye kısaltılır; native scroll ile manual fallback korunur.

## ADR-027 — Tek canlı yayın hedefi GitHub Pages'tir

- **Tarih:** 2026-08-01
- **Durum:** Kabul
- **Soru ve kullanıcı etkisi:** Aynı ürünün GitHub Pages, ChatGPT Sites ve Hostinger için ayrı yayın izleri taşıması hangi bağlantının güncel olduğu konusunda belirsizlik ve her değişiklikte gereksiz operasyon üretiyordu. İki kişilik kullanım için giriş istemeyen, sabit ve otomatik güncellenen tek adres yeterlidir.
- **Karar:** Queryvale'in tek kanonik canlı adresi `https://yacirmen.github.io/queryvale/`, tek kaynak remote'u `github` ve tek yayın hattı `main → GitHub Actions → GitHub Pages` olur. Sites proje kimliği, Sites'e özel paketleme/auth kodu, Sites git remote'u ve Hostinger yayın artefaktları depodan kaldırılır. Taşınabilir Mac paketi canlı yayın hedefi sayılmaz ve çevrimdışı geri dönüş olarak korunur. Önceki Sites origin'i yeni sürüm almaz; platform yönetiminde silme işlemi tamamlanana kadar owner-only durumda kalır.
- **Seçenekler:** Birden çok hedefi paralel tutmak geri dönüş kolaylığı sağlasa da her sürümde eşzamanlama ve bağlantı belirsizliği üretir. Sites'i yalnız özel önizleme olarak tutmak ikinci bir yayın sürecini sürdürür. Yalnız GitHub Pages, mevcut public pilotun kurulum gerektirmeyen ve otomatik doğrulanan tek link ihtiyacını karşılar.
- **Uzman görüşleri:** Product Manager kullanıcıya tek paylaşılabilir adres verilmesini ve yayın ritüelinin tek adım olmasını istedi. System Architect GitHub portable sözleşmesinin korunmasını, Sites metadata importu kaldırılırken Vinext yerel/render derlemesinin bozulmamasını koşul koydu. Security and Performance Reviewer eski Sites origin'indeki IndexedDB ilerlemesinin GitHub origin'ine otomatik taşınmadığını ve silmeden önce gerekirse JSON dışa aktarılması gerektiğini kaydetti. QA Engineer aktif hosting referanslarının temizlenmesini, GitHub canonical metadata'sını ve Pages Action başarısını doğrulama kapısı yaptı.
- **Doğrulama ve geri dönüş koşulu:** Yerel git remote listesinde yalnız `github` kalır; `.openai/hosting.json`, Sites paketleme/auth dosyaları ve Hostinger yayın dizini bulunmaz. Lint, typecheck, unit/render testleri, Vinext build, portable build ve GitHub Pages Action geçer; kanonik ve sosyal URL'ler GitHub Pages origin'ini kullanır. Parola korumalı veya özel alan adlı ikinci bir hedef gerçekten gerekirse eski gizli yapılandırma geri getirilmeyip yeni bir ADR ve ayrı güvenlik incelemesiyle tasarlanır.

## ADR-028 — Ana başlangıç eylemi kaldığın vakayı açar ve SQL taslağı otomatik kaydolur

- **Tarih:** 2026-08-01
- **Durum:** Kabul
- **Soru ve kullanıcı etkisi:** Ana sayfadaki “Rehberli ilk vakayı başlat” eylemi bütün görev verisini silmese de `lastOpenedTaskId` işaretçisini koşulsuz `m1-t1` ile değiştiriyor, geri dönen kullanıcının ilerlemesi kaybolmuş gibi görünmesine neden oluyordu. Ayrıca yalnız editöre yazılan ve henüz çalıştırılmayan SQL, açık bir Kaydet veya `⌘/Ctrl+S` eylemi olmadan kalıcılaşmıyordu.
- **Karar:** Tek saf `selectResumeTask` sözleşmesi yeni kullanıcıyı ilk vaka ve onboarding'e, geri dönen kullanıcıyı ise son açık konumuna yönlendirir. `ProgressState` v4, konum işaretçisinin kullanıcı navigasyonuyla doğrulandığını belirten `lastOpenedTaskIdTrusted` alanını taşır. v1–v3 kaydı ilk kez yüklenirken eski CTA'nın ilk göreve ezmiş olabileceği işaretçi, müfredatta daha ileride bulunan anlamlı taslak, deneme, ipucu, tamamlama veya kanıttan yalnız bir kez kurtarılır ve yeni konum güvenilir olarak yazılır; kullanıcının daha sonra bilinçli olarak ilk vakaya dönüşü artık ileriye atılmaz. Tamamlanmış son konumda açık `nextTaskId`, ardından ön koşulları hazır ilk eksik vaka kullanılır. Landing CTA geri dönende “Kaldığın vakaya devam et” olur ve onboarding'i yeniden açmaz. Editör taslağı 700 ms hareketsizlikten sonra IndexedDB ilerlemesine yazılır; görevden ayrılırken bekleyen taslak yeni hedef konumu ezmeden flush edilir. Kaydet ve `⌘/Ctrl+S` kaldırılmaz, yalnız anında kayıt ve görünür onay işlevi görür. Kalıcılık kullanılamıyorsa araç çubuğu “Yalnız bu oturum” der; normal kalıcılık aynı tarayıcı, cihaz ve origin ile sınırlıdır.
- **Seçenekler:** CTA'yı yalnız `lastOpenedTaskId`ye bağlamak en basit çözüm olsa da önceki hatanın ezdiği işaretçileri kurtaramazdı. İlk eksik görevi her zaman seçmek rota disiplinini güçlendirirdi fakat kullanıcının açık “neredeysem oradan devam” beklentisini bozar ve atlanmış çalışmayı görünmez yapardı. Her tuşta IndexedDB yazmak daha hızlı görünür ancak gereksiz yazma/render yükü oluştururdu. İlerlemeye duyarlı selector ile debounce + ayrılışta flush, veri güveni ve geri dönüş davranışını ek paket olmadan birleştirir.
- **Uzman görüşleri:** Product Manager geri dönüş eyleminin kullanıcının emeğini koruduğunu açıkça anlatmasını ve gerçek sıfırlamanın yalnız Ayarlar'daki onaylı işlem olarak kalmasını istedi. Learning Experience Expert yeni kullanıcı onboarding'inin korunmasını, geri dönende tekrar edilmemesini ve eski işaretçi hatasının daha ileri etkinlikten kurtarılmasını önerdi. React/TypeScript Engineer seçim mantığını saf domain fonksiyonuna, taslak kaydını ref tabanlı yarış korumasıyla 700 ms debounce'a ayırdı; çalışan sorgu sırasında daha yeni bir taslağın ezilmemesini koşul koydu. QA Engineer yeni kullanıcı, salt ileri konum, ezilmiş işaretçi, tamamlanmış anchor, otomatik taslak, boş taslak ve `⌘/Ctrl+S` regresyonlarını zorunlu tuttu.
- **Doğrulama ve geri dönüş koşulu:** Yeni profilde ilk vaka ve onboarding; ileri konumda dinamik devam CTA'sı; v3 `m1-t1` işaretçisiyle daha ileri etkinliğin bir kez kurtarılıp v4 güvenilir konuma yazılması; ardından bilinçli ilk-vaka dönüşünün korunması; CTA sonrasında önceki tamamlanma, sorgu ve kanıtların korunması; yazıp beklemede, ana sayfaya çıkışta ve görevden göreve geçişte taslak kalıcılığı; yeni hedef konumun ezilmemesi; çalışan sorgu ile eşzamanlı yeni/boş taslağın korunması; manuel kayıt kısayolu ve kalıcı depolama yokken oturumluk durum metni test edilir. Lint, typecheck, unit/render testleri ve portable production build geçmelidir. Debounce düşük donanımda hissedilir veri kaybı üretirse süre kısaltılır; otomatik kayıt ve ayrılışta flush sözleşmesi korunur.
