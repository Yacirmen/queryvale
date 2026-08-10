# İçerik Yazım Rehberi

## Amaç

Queryvale görevi bir syntax sorusu değil, küçük bir veri operasyonudur. Kullanıcı iş bağlamını anlamalı, çıktı sözleşmesini kurmalı, sorgusunu gerçek veri üzerinde doğrulamalı ve öğrendiği kavramı başka bir soruya taşıyabilmelidir.

## Görev sözleşmesi

Her görev aşağıdaki alanları destekler:

| Alan                             | Beklenti                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `id`                             | Kalıcı, benzersiz ID; yayın sonrası yeniden kullanılmaz                         |
| `slug`                           | URL uyumlu, benzersiz ve anlamlı                                                |
| `moduleId`                       | Var olan modül ID’si                                                            |
| `title`                          | Eylem ve iş sonucu; syntax adı tek başına değil                                 |
| `subtitle`                       | Bir cümlelik bağlam                                                             |
| `scenario`                       | Rol, paydaş ve karar bağlamı                                                    |
| `objective`                      | Test edilebilir kullanıcı teslimi                                               |
| `difficulty`                     | `beginner`, `intermediate` veya `advanced`                                      |
| `estimatedMinutes`               | Vaka için gerçekçi pozitif tam sayı; intro/tekrar için 2–3, birleşim için 5 dk  |
| `type`                           | `case`, `drill_intro`, `drill_practice` veya `drill_mix`                        |
| `routeOrder`                     | Gezinme ve devam için benzersiz kanonik rota konumu                             |
| `scored`                         | Vaka için `true`; alıştırma için `false`                                        |
| `conceptNew`                     | Yalnız `drill_intro`da tam bir müfredat kavramı                                 |
| `conceptsReinforced`             | Her alıştırmada önceki kavramların dizisi                                       |
| `curriculumConcepts`             | İsteğe bağlı, denetlenebilir kavram haritası; evaluator davranışını değiştirmez |
| `prerequisites`                  | Var olan ve döngü oluşturmayan görev ID’leri                                    |
| `concepts`                       | Öğrenilen SQL ve analitik kavramları                                            |
| `setupSql`                       | Deterministik şema/veri kurulumu                                                |
| `schema`                         | UI’da gösterilen tablo/kolon/ilişki sözleşmesi                                  |
| `sampleRows`                     | Şemayla tutarlı, cevabı tamamen ele vermeyen örnek                              |
| `expectedColumns`                | Ad, sıra, alias/case politikası                                                 |
| `validationMode`                 | Sonuç, sıra, tolerans ve kavram politikası                                      |
| `mutationVerification`           | DML sonrası gerçek tablo durumunu doğrulayan gizli, güvenilen SELECT            |
| `expectedResult`                 | Doğrulanmış referans sonuç veya güvenilir üretim tanımı                         |
| `orderSensitive`                 | İş talebi sıralama gerektiriyorsa `true`                                        |
| `requiredConcepts`               | Sonuç doğru olsa da öğrenme hedefi için gereken sinyaller                       |
| `forbiddenOperations`            | Görevde izin verilmeyen DDL/DML/operasyonlar                                    |
| `hints`                          | Vaka için üç kademeli; alıştırma için tam bir ücretsiz ipucu                    |
| `solutionSql`                    | İpuçlarından ayrı, kullanıcı isterse açılan ve motorla doğrulanan tam SQL       |
| `learningBrief.conceptAnchor`    | Yeni kavramın bu iş kararındaki rolünü açıklayan kısa dayanak                   |
| `learningBrief.outputGrain`      | Sonuçtaki tek satırın neyi temsil ettiğini açıkça söyleyen tanım                |
| `learningBrief.acceptanceChecks` | Kullanıcının sonucu çalıştırmadan/sonra kontrol edebileceği en az üç ölçüt      |
| `learningBrief.dataNotes`        | `NULL`, duplicate, eşitlik ve tarih sınırı gibi göreve özgü veri notları        |
| `coaching`                       | Değerlendirme durumuna özel başlık ve uygulanabilir kontrol adımları            |
| `debrief`                        | Başarı sonrası adımlar, neden, edge case, iş etkisi ve transfer sorusu          |
| `explanation`                    | Yaklaşımın neden çalıştığı; kopyalanabilir tam cevap değil                      |
| `completionMessage`              | Sonucu iş bağlamına bağlayan kısa kapanış                                       |
| `nextTaskId`                     | Eski içerik uyumluluğu; SQL rota gezinmesi `routeOrder` kullanır                |

Gerçek TypeScript tipi depodaki tek yürütülebilir kaynaktır; bu belge semantik sözleşmeyi açıklar.

## Yazım akışı

1. **Kararı seçin.** “Paydaş bu sonucu hangi kararı almak için istiyor?”
2. **Tek hedef kavram belirleyin.** Yeni bir temel kavram; önceki kavramlar destekleyici olabilir.
3. **Çıktı sözleşmesini yazın.** Beklenen kolonlar, sıra ve granularity.
4. **Veriyi tasarlayın.** Doğru/yanlış yaklaşımları ayıracak edge case’ler ekleyin.
5. **Referans sorguyu çalıştırın.** Beklenen sonucu elle tahmin etmeyin.
6. **Alternatif doğru sorgu deneyin.** Değerlendiricinin SQL metnine bağlı olmadığını kanıtlayın.
7. **Yanlış örnekleri test edin.** Kolon, satır, sıra ve kavram geri bildirimlerini kontrol edin.
8. **İpuçlarını yazın.** Vaka için mantık → parçalar → sorgu iskeleti sırasını; alıştırma için tek, ücretsiz ve kavramı işaret eden ipucunu kullanın.
9. **Tam çözümü doğrulayın.** `solutionSql` tek doğru cevap gibi sunulmasa da eksiksiz çalışmalıdır.
10. **İçerik doğrulamasını ve testleri çalıştırın.**

## İçeriğin gösterilme sırası

Zengin içerik uzun bir ders metni olarak aynı anda gösterilmez:

1. **Görevden önce:** kavram odağı, çıktı tanesi, kabul kontrolleri ve veri notları.
2. **Yanlış denemeden sonra:** yalnız oluşan değerlendirme durumuna ait koçluk adımları.
3. **Kullanıcı istediğinde:** mantık → parçalar → sorgu iskeleti sırasındaki üç ipucu.
4. **Üç ipucundan sonra, yalnız açık talepte:** geçerli çözümlerden biri olan tam ve çalıştırılabilir SQL.
5. **Başarıdan sonra:** çözüm adımları, neden çalıştığı, edge case'ler ve iş etkisi.
6. **Transfer kontrolü:** kullanıcı açtığında görünen yeni durum sorusu ve düşünme yönü.

Tam çözüm ilk üç ipucunun, hata koçluğunun veya başarı debrief'inin içine saklanmaz; ayrı ve açıkça adlandırılmış son yardım adımıdır. Açılması için başarısız deneme şartı yoktur, editörü otomatik değiştirmez ve görevi tamamlamaz. İlk doğru değerlendirmeden önce açıldığında vaka puanını 0 yapacağı ikinci bir açık onayla anlatılır; tamamlanma, kanıt ve rota erişimi etkilenmez. Bu akış yalnız vakalara uygulanır; alıştırma tek ücretsiz ipucuyla biter ve puan/kanıt/debrief baskısı oluşturmaz. “Geçerli çözümlerden biri” dili, sonuç odaklı değerlendirmenin alternatif doğru sorguları kabul ettiğini korur.

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

## Vaka ipucu merdiveni

1. **Kavramsal:** Filtrelemeden önce satırın hangi koşulu sağlaması gerektiğini düşün.
2. **Parçalar:** Şube için `branches.city`, stok için `products.stock_quantity` kolonlarına bak.
3. **Sorgu iskeleti:** `SELECT [kolonlar] FROM [tablo] WHERE [koşullar] ORDER BY [kolon];` gibi doldurulabilir bir yapı göster.
4. **Çalışan örnek:** İlk üç adım yetmediyse ayrı `solutionSql` alanındaki tam sorguyu kullanıcının açık eylemiyle göster.

İlk üç ipucu tam kolon listesi ile nihai SQL’i aynı anda vermemelidir. Dördüncü adım ise yarım bırakılmış bir sözde çözüm değildir: kopyalanabilir ve gerçek görev verisi üzerinde çalışan eksiksiz bir örnektir. Bu ayrım, öğreneni önce düşünmeye davet eder ama tamamen takıldığında çıkışsız bırakmaz.

## Alıştırma standardı

Alıştırma, var olan bir vakadan hemen önce aynı şema ve fixture üzerinde çalışan kısa bir köprüdür. Üç biçim vardır: `drill_intro` tam olarak bir `conceptNew` taşır ve 2–3 dakika sürer; `drill_practice` sıfır yeni kavramla aynı fikri farklı açıdan tekrar eder ve 2–3 dakika sürer; `drill_mix` sıfır yeni kavramla son dört kalemi birleştirir ve 5 dakika sürer. Her biri puansız, açık erişimli, `prerequisites: []` olan ve yalnız tek ücretsiz ipucu içeren çalışmadır. Görünür brief sırası sabittir: **Durum → Görev → Beklenen kolonlar → Kavram**. Yönetici mesajı, kabul listesi, üç aşamalı yardım, puan rehberi ve karar debrief'i alıştırmaya eklenmez.

## Değerlendirme seçimi

- İş talebi “en yüksekten”, “son işlem”, “ilk 10” diyorsa `orderSensitive: true`.
- Sıra anlamsızsa satırlar multiset olarak karşılaştırılır; duplicate kaybolmaz.
- Alias iş çıktısının parçasıysa kolon adı strict; yalnız okunabilirlik tercihiyse case/alias politikası gevşetilebilir.
- Float hesaplarında açık epsilon tanımlanır; parasal veri mümkünse exact numeric kullanır.
- `requiredConcepts`, alternatif doğru yolları sebepsiz reddetmemelidir. Yalnız dersin hedefi başka türlü ölçülemiyorsa kullanılır.
- Yasak işlem listesi güvenlik illüzyonu değil, görev bütünlüğü içindir.
- `mutation` görevinde görünen `RETURNING` sonucu tek başına başarı kanıtı değildir. `mutationVerification`, aynı veritabanında hedef satırın değiştiğini ve korunması gereken satırların değişmediğini denetlemelidir.

## Göreve özel koçluk

Koçluk, SQL metnini tam anlamıyla ayrıştırdığı iddiasında bulunmaz; değerlendiricinin kanıtladığı katmana göre yön verir:

- `execution-error`: sözdizimi, tablo/kolon adı ve parantez gibi çalışmayı engelleyen noktaları kontrol ettirir.
- `columns-wrong`: çıktı sözleşmesindeki ad, alias, adet ve sırayı kontrol ettirir.
- `rows-wrong`: filtre, join cardinality, aggregation tanesi ve `NULL` davranışını kontrol ettirir.
- `order-wrong`: iş talebindeki sıralama anahtarını, yönü ve eşitlik kuralını kontrol ettirir.
- `required-concept-missing`: sonuç doğru olsa da görevin hedef kavramıyla yeniden kurmayı ister.

Her durum en az iki kısa, uygulanabilir kontrol taşır. Genel “tekrar dene” mesajı görev koçluğu sayılmaz.

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
- [ ] DML görevinde gerçek post-state doğrulanıyor ve sabit/literal `RETURNING` taklidi reddediliyor mu?
- [ ] Vaka için üç ipucu giderek daha açık mı; alıştırma için yalnız tek ücretsiz ipucu var mı?
- [ ] `solutionSql` eksiksiz mi, açık talepte mi gösteriliyor ve gerçek motorda doğru kabul ediliyor mu?
- [ ] Çıktı tanesi ve en az üç kabul kontrolü açık mı?
- [ ] Veri notları yanlış ama makul yaklaşımı görünür kılan edge case'leri açıklıyor mu?
- [ ] Her değerlendirme katmanı görev bağlamına özel bir sonraki kontrolü söylüyor mu?
- [ ] Açıklama SQL’i kopyalatmadan yaklaşımı öğretiyor mu?
- [ ] Debrief neden, edge case, iş etkisi ve yeni duruma transfer sorusu taşıyor mu?
- [ ] Gerçek iş bağlantısı tamamlanma mesajında görünüyor mu?
- [ ] Benzersiz `routeOrder` ve eski `nextTaskId` referansları geçerli mi?
