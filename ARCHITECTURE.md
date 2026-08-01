# Teknik Mimari

## Mimari hedef

Queryvale, statik olarak dağıtılabilen bir uygulama kabuğu içinde tamamen tarayıcıda çalışan SQL, değerlendirme ve ilerleme katmanları kullanır. GitHub Pages taşınabilir istemci dosyalarını sunar; uygulamanın doğruluğu veya kullanıcı verisi için bir backend’e ihtiyaç yoktur.

```text
Vinext/React UI
  ├─ Content catalog ── typed modules/tasks/datasets
  ├─ Workspace state ── plain React reducer/context
  ├─ SQL runtime ────── lazy PGlite + disposable task database
  ├─ Evaluator ──────── normalization + result/concept checks
  ├─ Evidence ───────── bounded JSON-safe verified-run snapshots
  └─ Local data ─────── ProgressState v4 + IndexedDB migrations
```

## Katmanlar ve bağımlılık yönü

### 1. İçerik

Modül, görev ve veri setleri koddan ayrılmış tip güvenli tanımlardır. İçerik çalışma zamanı servislerini import etmez. Bir build/test doğrulayıcısı ID benzersizliği, görev zinciri, ön koşul, SQL kurulum ve beklenen sonuç sözleşmelerini kontrol eder.

### 2. Domain

Framework bağımsız tip ve saf fonksiyonlar:

- sonuç hücresi ve kolon normalizasyonu,
- satır çokluğu koruyan karşılaştırma,
- sıralama ve tolerans politikası,
- temel SQL kavramı sinyalleri,
- doğrulanmış çalışma snapshot’ı normalizasyonu ve boyut sınırları,
- ilerleme istatistikleri,
- import/export şema doğrulaması.

Domain katmanı React, Monaco, IndexedDB veya PGlite bilmez.

### 3. Servisler

- `sql-engine`: PGlite yükleme, görev ortamı hazırlama, çalıştırma, iptal ve reset
- `validation`: yürütme çıktısını görev politikasına göre değerlendirme
- `evidence`: doğru yürütmeyi sınırlı, JSON-güvenli bir görüntüleme kaydına dönüştürme
- `progress`: IndexedDB repository, v4 sürümleme, devam konumu, kanıt/not kalıcılığı ve import/export
- `settings`: tema ve editör tercihleri

Servis sonuçları ayrıştırılmış hata türleri döndürür; UI ham bağımlılık hatalarına bağlanmaz.

### 4. Özellik/UI

Sayfa kabukları ve feature bileşenleri servisleri hook’lar üzerinden kullanır. Sunum bileşenleri mümkün olduğunca veri alıp olay üretir. Uygulama çapındaki geçici state sade React reducer/context ile; URL’de paylaşılabilir navigasyon state’i rotayla; kalıcı state IndexedDB ile yönetilir.

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
9. Deneme, başarı ve son sorgu görev ilerlemesine kaydedilir.
10. Yalnız değerlendirme `correct` ise sınırlı bir `VerifiedRunSnapshot` oluşturulur ve tamamlanan görevin kanıt kaydına eklenir.
11. Kullanıcı isterse bu kayda bulgu, öneri ve isteğe bağlı çekince içeren bir karar notu ekler; not evaluator tarafından puanlanmaz.
12. `ProgressState` v4 tek transaction ile IndexedDB’ye yazılır. SQL taslağı 700 ms debounce ile ve görevden ayrılırken kaydedilir; sonuç paneli açık kalır, sonraki göreve geçiş ayrı kullanıcı eylemidir.

Görev değişimi, reset ve timeout eski oturumun çıktısını geçersiz kılan bir generation/run kimliği kullanır; geç gelen sonuç yeni göreve yazılamaz.

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

Fiziksel şema `queryvale` veritabanındaki `workspace` object store’unda, `progress` anahtarı altında tek bir doğrulanmış çalışma alanı kaydı tutar. Veritabanı şema sürümü ile uygulama veri modeli ayrı kavramlardır; güncel uygulama modeli `ProgressState` **v4**’tür:

- `profile`: kararlı yerel profil kimliği ve düzenlenebilir sunum adı
- `startedAt`, `lastOpenedTaskId`, `lastOpenedTaskIdTrusted`, `activityDates`: çalışma alanı ve bir kezlik devam-konumu migrasyonu metası
- `tasks`: deneme, tarihler, süre, son sorgu, ipucu ve tamamlanma
- `settings`: tema, font, satır yüksekliği, autocomplete ve reduced motion
- `evidenceByTaskId`: doğrulanmış çalışma snapshot’ı ile isteğe bağlı karar notu

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

- Geçerli v1 kayıtları görev/ayar verisini koruyarak v4’e taşınır, yeni bir yerel profil kazanır ve boş Kanıt Defteri ile başlar.
- Geçerli v2 kayıtları profili dahil mevcut veriyi koruyarak v4’e taşınır ve boş Kanıt Defteri ile başlar.
- Eski tamamlanma kayıtlarından kanıt uydurulmaz; kanıt ancak yeni bir doğru değerlendirmeden doğar.
- Geçerli v3 kaydı v4’e taşınırken tüm kanıt/not sözleşmesi doğrulanır ve eski landing hatasının ezmiş olabileceği `lastOpenedTaskId` yalnız bir kez daha ileri anlamlı etkinlikten kurtarılır. Sonraki kullanıcı navigasyonları güvenilir konum olarak işaretlenir.
- Geçerli v4 kaydı iç içe dizileri kopyalanarak ve tüm sözleşme doğrulanarak yüklenir.
- İçe aktarma dosyası en fazla 2 MB olabilir; tüm model doğrulanır ve mevcut çalışma alanı değiştirilmeden önce kullanıcıdan açık onay alınır.
- Uyumsuz bir mevcut kayıt otomatik yazmayla ezilmez. Uygulama durumu bildirir ve kullanıcı açıkça değiştirmedikçe kaydı korur.

Yazmalar tek object-store transaction’ında yapılır. IndexedDB kullanılamazsa kullanıcı bilgilendirilir ve oturum içi state ile devam edebilir; kalıcılık garanti edilmiş gibi gösterilmez. Adlandırılabilir profil tek bir tarayıcı kaydının sunum kimliğidir; hesap, yetkilendirme veya cihazlar arası eşitleme sınırı değildir.

## Performans

- Monaco ve PGlite ilk sayfa paketinden ayrılır.
- İçerik modül/görev bazında yüklenebilir.
- Editor her tuşta tüm uygulama state’ini güncellemez; draft sınırı korunur.
- Büyük sonuçlar kesilir; tablo yalnızca gerekli satırları render eder.
- PGlite görev veritabanı yaşam döngüsü ölçülür; görev geçişlerinde bellek serbest bırakılır.
- Tema ve kritik kabuk JS beklemeden okunabilir olmalıdır.

## Dağıtım

`main` dalına yapılan push, GitHub Actions kalite kapılarından sonra `dist-portable` çıktısını GitHub Pages'e dağıtır. Uygulama göreli asset yolları ve hash routing kullanır; kullanıcı ilerlemesi veya SQL yürütme sunucuya taşınmaz. Başka bir canlı yayın hedefi tutulmaz.

## Gözlemlenebilirlik

Kullanıcı verisini dışarı gönderen analitik yoktur. Geliştirmede yapılandırılmış `performance.mark`, test raporları, build boyutu ve anlaşılır console hata sınırları kullanılır. Üretimde sorgu veya veri seti içeriği üçüncü taraf servise gönderilmez.
