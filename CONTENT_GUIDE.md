# İçerik Yazım Rehberi

## Amaç

Queryvale görevi bir syntax sorusu değil, küçük bir veri operasyonudur. Kullanıcı iş bağlamını anlamalı, çıktı sözleşmesini kurmalı, sorgusunu gerçek veri üzerinde doğrulamalı ve öğrendiği kavramı başka bir soruya taşıyabilmelidir.

## Görev sözleşmesi

Her görev aşağıdaki alanları destekler:

| Alan | Beklenti |
|---|---|
| `id` | Kalıcı, benzersiz ID; yayın sonrası yeniden kullanılmaz |
| `slug` | URL uyumlu, benzersiz ve anlamlı |
| `moduleId` | Var olan modül ID’si |
| `title` | Eylem ve iş sonucu; syntax adı tek başına değil |
| `subtitle` | Bir cümlelik bağlam |
| `scenario` | Rol, paydaş ve karar bağlamı |
| `objective` | Test edilebilir kullanıcı teslimi |
| `difficulty` | `beginner`, `intermediate` veya `advanced` |
| `estimatedMinutes` | Gerçekçi pozitif tam sayı |
| `prerequisites` | Var olan ve döngü oluşturmayan görev ID’leri |
| `concepts` | Öğrenilen SQL ve analitik kavramları |
| `setupSql` | Deterministik şema/veri kurulumu |
| `schema` | UI’da gösterilen tablo/kolon/ilişki sözleşmesi |
| `sampleRows` | Şemayla tutarlı, cevabı tamamen ele vermeyen örnek |
| `expectedColumns` | Ad, sıra, alias/case politikası |
| `validationMode` | Sonuç, sıra, tolerans ve kavram politikası |
| `expectedResult` | Doğrulanmış referans sonuç veya güvenilir üretim tanımı |
| `orderSensitive` | İş talebi sıralama gerektiriyorsa `true` |
| `requiredConcepts` | Sonuç doğru olsa da öğrenme hedefi için gereken sinyaller |
| `forbiddenOperations` | Görevde izin verilmeyen DDL/DML/operasyonlar |
| `hints` | Kolaydan açığa üç kademeli ipucu |
| `explanation` | Yaklaşımın neden çalıştığı; kopyalanabilir tam cevap değil |
| `completionMessage` | Sonucu iş bağlamına bağlayan kısa kapanış |
| `nextTaskId` | Var olan sonraki görev veya yol sonu |

Gerçek TypeScript tipi depodaki tek yürütülebilir kaynaktır; bu belge semantik sözleşmeyi açıklar.

## Yazım akışı

1. **Kararı seçin.** “Paydaş bu sonucu hangi kararı almak için istiyor?”
2. **Tek hedef kavram belirleyin.** Yeni bir temel kavram; önceki kavramlar destekleyici olabilir.
3. **Çıktı sözleşmesini yazın.** Beklenen kolonlar, sıra ve granularity.
4. **Veriyi tasarlayın.** Doğru/yanlış yaklaşımları ayıracak edge case’ler ekleyin.
5. **Referans sorguyu çalıştırın.** Beklenen sonucu elle tahmin etmeyin.
6. **Alternatif doğru sorgu deneyin.** Değerlendiricinin SQL metnine bağlı olmadığını kanıtlayın.
7. **Yanlış örnekleri test edin.** Kolon, satır, sıra ve kavram geri bildirimlerini kontrol edin.
8. **İpuçlarını yazın.** Her aşama bir sonraki düşünme adımını açsın.
9. **İçerik doğrulamasını ve testleri çalıştırın.**

## Senaryo standardı

İyi senaryo:

> Bölge operasyon ekibi, stok sayımı öncesi Ankara şubelerinde aktif görünen ürünleri kontrol edecek. Ürün kodu, adı ve mevcut stok miktarını en düşük stoktan başlayarak hazırlayın.

Zayıf senaryo:

> `products` tablosundan `WHERE` ve `ORDER BY` kullanın.

İlki rol, amaç, kapsam ve çıktı kararını verir; SQL yapısını kullanıcıya bırakır.

## Veri seti kuralları

- Tablo/kolon adları İngilizce `snake_case`; kullanıcıya görünen kişi/şirket değerleri Türkçe olabilir.
- Primary/foreign key ve nullability şema panelinde açık olmalıdır.
- Veri, hedef kavramı anlamlı kılan karşı örnekler içermelidir.
- `NULL`, duplicate, eşit değer ve tarih sınırı yalnız görev için anlamlıysa eklenir.
- Tarihler deterministik ISO değerlerdir; “bugün” gibi zamana bağlı setup kullanılmaz.
- Para ve oranlarda tür/tolerans açık olmalıdır.
- Kişisel veri gerçek kişiye ait olmamalıdır.
- Setup idempotent bir görev DB’sinde çalışmalı; uzak kaynağa bağlı olmamalıdır.

## İpucu merdiveni

1. **Kavramsal:** Filtrelemeden önce satırın hangi koşulu sağlaması gerektiğini düşün.
2. **Şema yönlendirmesi:** Şube için `branches.city`, stok için `products.stock_quantity` kolonlarına bak.
3. **Yapısal:** Sonucu önce şehir ve aktiflik koşullarıyla daralt, ardından stok kolonuna göre artan sırala.

İpucu tam kolon listesi ve nihai SQL’i aynı anda vermemelidir. Çok sayıda başarısız denemeden sonra açılan “çözüm yaklaşımı”, adımları anlatabilir; varsayılan tam SQL cevabı değildir.

## Değerlendirme seçimi

- İş talebi “en yüksekten”, “son işlem”, “ilk 10” diyorsa `orderSensitive: true`.
- Sıra anlamsızsa satırlar multiset olarak karşılaştırılır; duplicate kaybolmaz.
- Alias iş çıktısının parçasıysa kolon adı strict; yalnız okunabilirlik tercihiyse case/alias politikası gevşetilebilir.
- Float hesaplarında açık epsilon tanımlanır; parasal veri mümkünse exact numeric kullanır.
- `requiredConcepts`, alternatif doğru yolları sebepsiz reddetmemelidir. Yalnız dersin hedefi başka türlü ölçülemiyorsa kullanılır.
- Yasak işlem listesi güvenlik illüzyonu değil, görev bütünlüğü içindir.

## Modül zorluk eğrisi

- Modül 1: tek tablo, görünür kolonlar, küçük sonuç, SELECT/DISTINCT/LIMIT/ORDER BY
- Modül 2: koşul kombinasyonları, `NULL`, metin ve aralık edge case’leri
- Modül 3: türetilmiş kolon, alias, string/tarih, `CASE`, cast
- Modül 4–7: grain, join cardinality, aggregation ve analitik düşünce
- Modül 8–9: mutasyon güvenliği ve modelleme muhakemesi
- Modül 10: birden fazla adımlı iş teslimleri

Yeni görev, bir öncekinin tüm karmaşıklığını rastgele büyütmek yerine tek yeni bilişsel yük eklemelidir.

## İçerik inceleme kontrol listesi

- [ ] Paydaş ve karar gerçekçi mi?
- [ ] İstenen çıktı tek anlamlı mı?
- [ ] Şema ve sample rows setup ile tutarlı mı?
- [ ] Doğru sonuç gerçek motorla üretildi mi?
- [ ] Yapısal olarak farklı doğru çözüm kabul ediliyor mu?
- [ ] Yanlış çözüm anlamlı geri bildirim alıyor mu?
- [ ] Üç ipucu giderek daha açık mı?
- [ ] Açıklama SQL’i kopyalatmadan yaklaşımı öğretiyor mu?
- [ ] Gerçek iş bağlantısı tamamlanma mesajında görünüyor mu?
- [ ] Ön koşul ve next görev zinciri geçerli mi?

