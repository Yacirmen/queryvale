# Teknik Mimari

## Mimari hedef

Queryvale, statik olarak dağıtılabilen bir uygulama kabuğu içinde tamamen tarayıcıda çalışan SQL, Python, değerlendirme ve ilerleme katmanları kullanır. GitHub Pages taşınabilir istemci ve sabitlenmiş runtime dosyalarını sunar; uygulamanın doğruluğu veya kullanıcı verisi için bir backend’e ihtiyaç yoktur.

```text
Vinext/React UI
  ├─ Content catalog ── typed modules/tasks/datasets
  ├─ Workspace state ── plain React reducer/context
  ├─ SQL runtime ────── lazy PGlite + disposable task database
  ├─ Python runtime ─── dedicated Worker + pinned Pyodide/pandas
  ├─ Evaluators ─────── SQL result/concept + DataFrame artifact checks
  ├─ Evidence ───────── bounded JSON-safe verified-run snapshots
  └─ Local data ─────── ProgressState v6 + IndexedDB migrations
```

## Katmanlar ve bağımlılık yönü

### 1. İçerik

SQL ve Python modülleri ayrı tip güvenli sözleşmelerle component kodundan ayrılır. İçerik çalışma zamanı servislerini import etmez. Build/test doğrulayıcıları ID benzersizliği, görev zinciri, ön koşul, SQL kurulum veya Python fixture’ı ile beklenen artifact sözleşmesini kontrol eder.

### 2. Domain

Framework bağımsız tip ve saf fonksiyonlar:

- sonuç hücresi ve kolon normalizasyonu,
- satır çokluğu koruyan karşılaştırma,
- sıralama ve tolerans politikası,
- temel SQL kavramı sinyalleri,
- doğrulanmış çalışma snapshot’ı normalizasyonu ve boyut sınırları,
- ilerleme istatistikleri,
- bağımsız çözüm puanı ve rota/SQL konusu toplamları,
- tamamlanma kayıtlarından türetilen sıralı modül erişimi ve güvenli görev yönlendirmesi,
- import/export şema doğrulaması.

Domain katmanı React, Monaco, IndexedDB, PGlite veya Pyodide bilmez.

### 3. Servisler

- `sql-engine`: PGlite yükleme, görev ortamı hazırlama, çalıştırma, iptal ve reset
- `python-engine`: aynı origin’deki Pyodide/pandas dosyalarını ayrı module Worker’da lazy-load etme, çalıştırma, timeout, iptal ve reset
- `validation` / `python-validation`: yürütme çıktısını kendi görev politikasına göre değerlendirme
- `evidence`: doğru yürütmeyi sınırlı, JSON-güvenli bir görüntüleme kaydına dönüştürme
- `progress`: IndexedDB repository, v6 sürümleme, iki stüdyonun ayrı devam konumları, kilitli puan, kanıt/not kalıcılığı ve import/export
- `settings`: tema ve editör tercihleri

Servis sonuçları ayrıştırılmış hata türleri döndürür; UI ham bağımlılık hatalarına bağlanmaz.

### 4. Özellik/UI

Sayfa kabukları ve feature bileşenleri servisleri hook’lar üzerinden kullanır. Sunum bileşenleri mümkün olduğunca veri alıp olay üretir. Uygulama çapındaki geçici state sade React reducer/context ile; URL’de paylaşılabilir navigasyon state’i rotayla; kalıcı state IndexedDB ile yönetilir.

`StudioCurriculumMenu`, SQL ve Python çalışma alanlarının yalnız sunum sözleşmesini paylaşır. Her ekran modül/vaka görünüm modelini kendi erişim seçicisinden üretir: SQL modül bazlı, Python vaka ön koşulu bazlı kilitleri korur. Menüden seçim ortak uygulama navigasyonuna geri döner; böylece hash çözümleme, güvenli devam konumu, taslak kaydı ve kilit yönlendirmesi ikinci kez uygulanmaz.

## SQL motoru kararı

Varsayılan motor **PGlite**’tır.

| Ölçüt            | PGlite                                         | sql.js                                                    |
| ---------------- | ---------------------------------------------- | --------------------------------------------------------- |
| SQL lehçesi      | PostgreSQL                                     | SQLite                                                    |
| Müfredat uyumu   | CTE, window, PostgreSQL davranışına daha yakın | Temel SQL için iyi, ileri PostgreSQL örneklerinde ayrışır |
| Tarayıcı         | WASM, daha ağır başlangıç                      | WASM, genellikle daha küçük ve basit                      |
| Kalıcılık        | Bellek/IndexedDB VFS seçenekleri               | DB dosyasını ayrıca dışa yazma gerekir                    |
| Operasyonel risk | WASM asset ve bellek yönetimi gerekir          | Daha düşük ilk entegrasyon riski                          |

İş analistliği ve analitik SQL müfredatının PostgreSQL davranışına yakınlığı, ilk yük maliyetinden daha değerlidir. Bu nedenle motor ayrı bir istemci chunk’ında lazy-load edilir ve her görev atılabilir bir veritabanında tutulur. İlk sürüm ana tarayıcı bağlamında çalışır; Web Worker izolasyonu sonraki performans kapısıdır. PGlite’ın desteklenmediği bir tarayıcıda sahte sonuç üretilmez; anlaşılır destek hatası gösterilir. `sql.js` yalnızca ölçülmüş uyumluluk/kararlılık engeli oluşursa, görev fixture’ları yeniden doğrulanarak devreye alınabilecek yedek karardır.

## Görev yaşam döngüsü

1. İçerik kataloğu görev tanımını doğrulanmış olarak döndürür.
2. SQL runtime önceki görev oturumunu kapatır veya yeniden kullanılabilir ortamı tam resetler.
3. Yeni izole PGlite veritabanında `setupSql` çalışır.
4. Referans/beklenen çıktı görev politikasından alınır veya güvenilir kurulumda hesaplanır.
5. Kullanıcı SQL’i görev veritabanında yürütülür.
6. Çıktı satır limiti ve güvenli serileştirme üzerinden ana thread’e döner.
7. Evaluator kolon → satır → sıra → kavram sırasıyla değerlendirme yapar.
8. UI sonuç ve açıklanabilir geri bildirimi gösterir.
9. Deneme, başarı, son sorgu ve benzersiz ipuçları görev ilerlemesine kaydedilir.
10. Vakanın ilk `correct` değerlendirmesinde sorgu gönderim anındaki yardım snapshot’ı 10/7/4/1 veya tam çözümde 0 puana çevrilip bir kez kilitlenir; puansız alıştırma tamamlanır ama puan kaydı yazmaz.
11. Yalnız puanlı vaka `correct` olduğunda sınırlı bir `VerifiedRunSnapshot` oluşturulur ve tamamlanan görevin kanıt kaydına eklenir. Alıştırma sonuçları kısa tamamlanma bildirimiyle kalır.
12. Kullanıcı isterse bu kayda bulgu, öneri ve isteğe bağlı çekince içeren bir karar notu ekler; not evaluator tarafından puanlanmaz.
13. `ProgressState` v6 tek transaction ile IndexedDB’ye yazılır. SQL taslağı 700 ms debounce ile ve görevden ayrılırken kaydedilir; sonuç paneli açık kalır, sonraki göreve geçiş ayrı kullanıcı eylemidir.
14. Rota erişimi ayrıca persist edilmez: saf modül erişim seçicisi mevcut tamamlanmalardan ilk eksik modülü bulur; UI ve hash yönlendirmesi sonraki modülleri aynı kararla kilitler, eski ileri kayıtları değiştirmez.

Görev değişimi, reset ve timeout eski oturumun çıktısını geçersiz kılan bir generation/run kimliği kullanır; geç gelen sonuç yeni göreve yazılamaz.

## Python motoru kararı

Python Studio, `pyodide@0.29.4` ve pandas’ı ana UI thread’inden ayrı bir module Web Worker’da çalıştırır. Worker ve Monaco yalnız Python rotası açıldığında yüklenir. Hazırlanmış Worker vaka bileşeninden bir üst uygulama sınırında tutulur; Python vakaları arasında yeniden kullanılır, Studio’dan çıkışta veya süren çalışmanın iptalinde sonlandırılır. Build öncesi hazırlık betiği Pyodide çekirdeğini npm paketinden kopyalar; pandas ve bağımlı wheel dosyalarını resmi lockfile’daki SHA-256 değerleriyle doğrulayarak `public/vendor/pyodide/0.29.4` altında toplar. Üretim çalışması üçüncü taraf CDN çağrısı yapmaz; bütün runtime aynı GitHub Pages origin’inden gelir.

Her çalıştırma temiz bir Python globals sözlüğü ve içerikteki küçük JSON fixture’lardan yeni DataFrame’ler kurar. Kullanıcı `result` adlı DataFrame’i üretir; Worker yalnız sınırlı kolon/satır, dtype, stdout ve traceback içeren JSON-güvenli artifact döndürür. Evaluator kolon → dtype → satır → sıra katmanlarını karşılaştırır; kaynak kod eşitliği aramaz. İlk hazırlık için 90 saniye, kullanıcı kodu için 10 saniye sınırı vardır. Timeout, durdurma, reset ve görev değişimi Worker’ı sonlandırır; generation/request kimliği geç sonuçları reddeder.

Web Worker UI kararlılığı ve iptal edilebilirlik sınırıdır, kötü amaçlı kod için güvenlik sandbox’ı değildir. Bu nedenle Python Studio kullanıcı dosyası, gizli veri, keyfi paket kurulumu veya uzak veri erişimi sunmaz; yalnız paketlenmiş öğrenme fixture’ları ve izinli pandas paketiyle çalışır.

### Python vaka yaşam döngüsü

1. Sıralı erişim seçicisi ilk açık Python vakasını çözer.
2. Kullanıcı vaka ve deterministik DataFrame önizlemesini inceler; taslak 700 ms debounce ile yerel kayda yazılır.
3. Runtime ve pandas gerektiğinde aynı origin’den yüklenir, fixture’lar yeni globals alanına kurulur.
4. Kullanıcı kodu çalışır ve `result` artifact’ı UI’a döner.
5. Gerçek sonuç tablosu değerlendirme ile birlikte gösterilir; kullanıcı otomatik olarak sonraki vakaya geçirilmez.
6. İlk doğru artifact yardım snapshot’ına göre 10/7/4/1 veya tam çözümde 0 puanı kilitler ve sınırlı Python kanıtı oluşturur.
7. Python devam konumu, taslak, deneme, ipucu, tamamlanma ve kanıt `ProgressState` v6 içinde SQL alanlarından ayrı saklanır.

## Sorgu güvenliği ve kaynak sınırları

Bu bir güvenlik sınırı olan uzak çok kiracılı DB değil, kullanıcının kendi tarayıcısıdır; yine de kullanılabilirlik ve görev bütünlüğü korunur:

- görev tanımındaki `forbiddenOperations` ile DDL/DML kısıtı,
- sistem kataloğu ve `DROP DATABASE` benzeri işlemler için ön kontrol,
- maksimum döndürülen satır sayısı,
- sorgu timeout’unda görev DB’sini kapatıp sonraki çalıştırmada yeniden hazırlama,
- yalnızca tek aktif çalıştırma ve stale-result reddi,
- ham HTML üretmeyen hücre render’ı,
- import edilen JSON için sürüm/şema/boyut doğrulaması,
- görevler arası paylaşılan mutasyonlu DB yok.

Regex veya token taraması tam SQL güvenlik parser’ı gibi sunulmaz; savunmanın asıl katmanı görevler arasında paylaşılmayan atılabilir veritabanı ve kaynak limitleridir. Ayrı Web Worker süreç izolasyonu mevcut sürümün bilinçli sınırlamasıdır.

## Sonuç değerlendirme

Normalizasyon politikası görev bazında ayarlanabilir:

- kolon adı/case ve alias politikası,
- `NULL`, string, tarih ve sayısal temsil,
- sayısal epsilon toleransı,
- sıra önemli değilse canonical satır anahtarı,
- duplicate’ları koruyan multiset karşılaştırması,
- sıra önemliyse indeks bazlı karşılaştırma,
- basit token/comment temizliğiyle `SELECT`, `JOIN`, `GROUP BY`, `HAVING`, CTE ve window sinyali.

Değerlendirici örnek SQL ile string equality yapmaz. Kavram denetimi yalnızca sonuç doğru olduktan sonra öğrenme hedefini doğrular ve yanlış pozitif riski fixture testleriyle yönetilir.

## Kalıcılık

Fiziksel şema `queryvale` veritabanındaki `workspace` object store’unda iki ayrı kayıt tutar: `progress` anahtarında tek doğrulanmış çalışma alanı, `local-profile-session` anahtarında ise yalnız sunum erişimini belirleyen `active | signed-out` yerel profil durumu. Veritabanı şema sürümü ile uygulama veri modeli ayrı kavramlardır; güncel uygulama modeli `ProgressState` **v6**’dır:

- `profile`: kararlı yerel profil kimliği ve düzenlenebilir sunum adı
- `startedAt`, SQL için `lastOpenedTaskId`, Python için `lastOpenedPythonTaskId`, `lastOpenedTaskIdTrusted`, `activityDates`: çalışma alanı ve devam-konumu metası
- `tasks`: deneme, tarihler, süre, son sorgu, ipucu, tam çözüm kullanımı, ilk başarıda kilitlenen puan ve tamamlanma
- `pythonTasks`: deneme, tarihler, süre, son kod, ipucu, tam çözüm, kilitlenen puan ve tamamlanma
- `settings`: tema, font, satır yüksekliği, autocomplete ve reduced motion
- `evidenceByTaskId`: doğrulanmış çalışma snapshot’ı ile isteğe bağlı karar notu
- `pythonEvidenceByTaskId`: runtime/content sürümü, kolon/dtype, sınırlı satır önizlemesi ve stdout taşıyan doğrulanmış DataFrame artifact’ı

`LocalProfileSession` ilerleme modeline gömülmez ve JSON yedeğine dahil edilmez. Böylece başka cihazda içe alınan adlandırılmış bir çalışma alanı açık profil olarak başlar; çıkış tercihi cihaz/origin yerelinde kalır. Eski adlandırılmış kayıtta oturum anahtarı yoksa geriye uyumluluk için profil açık kabul edilir. Bozuk veya farklı profil kimliğine bağlı oturum kaydı güvenli biçimde `signed-out` olarak yorumlanır.

### Sınırlı kanıt modeli

Kanıt snapshot’ı ikinci bir veritabanı dökümü değil, doğru değerlendirilen çalışmayı yeniden göstermeye yetecek JSON-güvenli bir kayıttır. Uygulanan sınırlar şunlardır:

- en fazla 500 görev kanıtı,
- görev kimliğinde 200, sorguda 200.000 karakter,
- en fazla 32 kolon; kolon adında 256 karakter,
- en fazla 10 önizleme satırı; her hücrede 10.000 karakter,
- 1.000.000 ile sınırlı toplam satır sayısı ve ayrı `truncated` işareti,
- karar notunun bulgu, öneri ve çekince alanlarının her birinde en fazla 2.000 karakter.

Hücreler saklanmadan önce string gösterimine çevrilir; snapshot doğrulaması görev kimliği, zaman damgası, kolon/satır biçimi ve tüm sınırları denetler. Kanıt yalnız tamamlanmış bir görev için kaydedilebilir. Varsayılan kayıt davranışı ilk doğrulanmış snapshot’ı korur; snapshot ancak çağrıda `replace` açıkça istendiğinde yenilenir ve mevcut karar notu korunur.

### Migrasyon ve içe aktarma

- Geçerli v1–v5 kayıtları mevcut SQL görevlerini, profili, ayarları ve kanıtları kayıpsız koruyarak v6’ya taşınır; Python alanları ilk açık vakayla boş başlar.
- Eski tamamlanma kayıtlarından kanıt uydurulmaz; kanıt ancak yeni bir doğru değerlendirmeden doğar.
- Geçerli v3 kaydında eski landing hatasının ezmiş olabileceği `lastOpenedTaskId` yalnız bir kez daha ileri anlamlı etkinlikten kurtarılır. Geçerli v4 kaydında tamamlanmış SQL vakalarının puanı kayıtlı benzersiz ipuçlarından hesaplanır; bilinmeyen tam çözüm kullanımı uydurulmaz. Geçerli v5 kaydı iç içe dizileri kopyalanarak doğrulanır ve boş Python alanları kazanır.
- İçe aktarma dosyası en fazla 2 MB olabilir; tüm model doğrulanır ve mevcut çalışma alanı değiştirilmeden önce kullanıcıdan açık onay alınır.
- Uyumsuz bir mevcut kayıt otomatik yazmayla ezilmez. Uygulama durumu bildirir ve kullanıcı açıkça değiştirmedikçe kaydı korur.

Çalışma alanı ile profil erişiminin birlikte değiştiği oluşturma, içe aktarma ve silme işlemleri aynı object-store transaction’ında yazılır. Çıkış yalnız oturum anahtarını değiştirir; `progress` kaydını silmez. Tam profil silme yeni bir misafir çalışma alanı ile oturum anahtarını atomik olarak değiştirir. IndexedDB kullanılamazsa kullanıcı bilgilendirilir ve oturum içi state ile devam edebilir; kalıcılık garanti edilmiş gibi gösterilmez. Adlandırılabilir profil tek bir tarayıcı kaydının sunum kimliğidir; hesap, yetkilendirme, güvenlik kilidi veya cihazlar arası eşitleme sınırı değildir. Profil açılmadan Studio kullanılırsa aynı cihaz çalışma alanı güncellenir; ikinci, gizli bir misafir alanı oluşturulmaz.

## Performans

- Monaco ve PGlite ilk sayfa paketinden ayrılır.
- Pyodide Worker ve pandas ilk sayfa paketinden ayrılır; ilk kullanımda yaklaşık 19,4 MiB aynı-origin asset yüklenir ve tarayıcı önbelleğine bırakılır.
- İçerik modül/görev bazında yüklenebilir.
- Editor her tuşta tüm uygulama state’ini güncellemez; draft sınırı korunur.
- Büyük sonuçlar kesilir; tablo yalnızca gerekli satırları render eder.
- PGlite görev veritabanı yaşam döngüsü ölçülür; görev geçişlerinde bellek serbest bırakılır.
- Tema ve kritik kabuk JS beklemeden okunabilir olmalıdır.

## Dağıtım

`main` dalına yapılan push, GitHub Actions kalite kapılarından sonra `dist-portable` çıktısını GitHub Pages'e dağıtır. Uygulama göreli asset yolları ve hash routing kullanır; PGlite ile Pyodide/pandas runtime dosyaları aynı statik pakette sunulur, kullanıcı ilerlemesi veya kod yürütme sunucuya taşınmaz. Başka bir canlı yayın hedefi tutulmaz.

## Gözlemlenebilirlik

Kullanıcı verisini dışarı gönderen analitik yoktur. Geliştirmede yapılandırılmış `performance.mark`, test raporları, build boyutu ve anlaşılır console hata sınırları kullanılır. Üretimde sorgu veya veri seti içeriği üçüncü taraf servise gönderilmez.
