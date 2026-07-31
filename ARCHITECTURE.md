# Teknik Mimari

## Mimari hedef

Queryvale, statik olarak dağıtılabilen bir uygulama kabuğu içinde tamamen tarayıcıda çalışan SQL, değerlendirme ve ilerleme katmanları kullanır. Cloudflare Sites dosyaları sunar; uygulamanın doğruluğu veya kullanıcı verisi için bir backend’e ihtiyaç yoktur.

```text
Vinext/React UI
  ├─ Content catalog ── typed modules/tasks/datasets
  ├─ Workspace state ── plain React reducer/context
  ├─ SQL runtime ────── lazy PGlite + disposable task database
  ├─ Evaluator ──────── normalization + result/concept checks
  └─ Local data ─────── IndexedDB repositories + migrations
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
- ilerleme istatistikleri,
- import/export şema doğrulaması.

Domain katmanı React, Monaco, IndexedDB veya PGlite bilmez.

### 3. Servisler

- `sql-engine`: PGlite yükleme, görev ortamı hazırlama, çalıştırma, iptal ve reset
- `validation`: yürütme çıktısını görev politikasına göre değerlendirme
- `progress`: IndexedDB repository, sürümleme, import/export
- `settings`: tema ve editör tercihleri

Servis sonuçları ayrıştırılmış hata türleri döndürür; UI ham bağımlılık hatalarına bağlanmaz.

### 4. Özellik/UI

Sayfa kabukları ve feature bileşenleri servisleri hook’lar üzerinden kullanır. Sunum bileşenleri mümkün olduğunca veri alıp olay üretir. Uygulama çapındaki geçici state sade React reducer/context ile; URL’de paylaşılabilir navigasyon state’i rotayla; kalıcı state IndexedDB ile yönetilir.

## SQL motoru kararı

Varsayılan motor **PGlite**’tır.

| Ölçüt | PGlite | sql.js |
|---|---|---|
| SQL lehçesi | PostgreSQL | SQLite |
| Müfredat uyumu | CTE, window, PostgreSQL davranışına daha yakın | Temel SQL için iyi, ileri PostgreSQL örneklerinde ayrışır |
| Tarayıcı | WASM, daha ağır başlangıç | WASM, genellikle daha küçük ve basit |
| Kalıcılık | Bellek/IndexedDB VFS seçenekleri | DB dosyasını ayrıca dışa yazma gerekir |
| Operasyonel risk | WASM asset ve bellek yönetimi gerekir | Daha düşük ilk entegrasyon riski |

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
9. Deneme/başarı/sorgu snapshot’ı IndexedDB’ye kaydedilir.

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

IndexedDB şeması mantıksal olarak aşağıdaki store’ları içerir:

- `taskProgress`: deneme, tarihler, süre, sorgu, ipucu ve tamamlanma
- `settings`: tema, font, satır yüksekliği, autocomplete, reduced motion
- `meta`: şema sürümü, son görev, import/migration bilgisi

Yazmalar idempotent ve transaction sınırında yapılır. Uygulama açılışında IndexedDB kullanılamazsa kullanıcı bilgilendirilir ve oturum içi state ile devam edebilir; kalıcılık garanti edilmiş gibi gösterilmez.

## Performans

- Monaco ve PGlite ilk sayfa paketinden ayrılır.
- İçerik modül/görev bazında yüklenebilir.
- Editor her tuşta tüm uygulama state’ini güncellemez; draft sınırı korunur.
- Büyük sonuçlar kesilir; tablo yalnızca gerekli satırları render eder.
- PGlite görev veritabanı yaşam döngüsü ölçülür; görev geçişlerinde bellek serbest bırakılır.
- Tema ve kritik kabuk JS beklemeden okunabilir olmalıdır.

## Dağıtım

Vinext/Vite üretim çıktısı Cloudflare Sites’a dağıtılır. `.openai/hosting.json` mevcut Sites projesinin kimliğini taşır ve yeniden kullanılmalıdır. D1/R2 bağları `null` kalır; kullanıcı ilerlemesi veya SQL yürütme sunucuya taşınmaz.

## Gözlemlenebilirlik

Kullanıcı verisini dışarı gönderen analitik yoktur. Geliştirmede yapılandırılmış `performance.mark`, test raporları, build boyutu ve anlaşılır console hata sınırları kullanılır. Üretimde sorgu veya veri seti içeriği üçüncü taraf servise gönderilmez.
