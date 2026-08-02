# Test Stratejisi

## Kalite ilkesi

Queryvale’de testler görsel bir prototipi değil, gerçek öğrenme döngüsünü korur. En kritik sözleşme şudur: aynı doğru sonucu üreten farklı SQL veya Python kodu kabul edilir, yanlış sonuç açıklanabilir biçimde reddedilir ve ilerleme yalnızca gerçek motor başarısıyla değişir.

## Katmanlar

### Birim testleri — Vitest

Hızlı ve deterministik saf sözleşmeler:

- görev/modül verisi doğrulama,
- kolon ve hücre normalizasyonu,
- satır/multiset ve sıralama karşılaştırması,
- `NULL`, duplicate, tarih, case ve sayısal tolerans,
- gerekli kavram ve yasak operasyon tespiti,
- ilerleme istatistikleri ve import şeması,
- öğretici hata eşleme.
- Python modül/zincir sözleşmesi, DataFrame kolon/dtype/satır/sıra değerlendirmesi,
- Pyodide Worker istemcisinde boot/run timeout, iptal, reset ve stale mesaj reddi.

### Bileşen testleri — React Testing Library

Kullanıcının gördüğü/duyduğu davranış:

- tema ve editör ayarı,
- şema paneli ve ipucu açma,
- çalıştırma sırasında disabled/loading durumu,
- hata ve değerlendirme `aria-live` mesajı,
- başarı özeti ve sonraki görev eylemi,
- reset/import onay akışları.

Monaco, PGlite ve Pyodide Worker component testlerinde sözleşme seviyesinde adapter ile kontrol edilebilir; evaluator’lar mock’lanıp unutulmaz, ayrı gerçek entegrasyon testleri vardır.

### Entegrasyon testleri — Vitest/browser ortamı

- PGlite’ın yüklenmesi,
- `setupSql` uygulanması,
- basit `SELECT`,
- hatalı SQL,
- görevin resetlenmesi,
- iki görev arasında izolasyon,
- gerçek motor çıktısının evaluator’a aktarılması,
- sabitlenmiş Pyodide+pandas runtime’ında bütün Python referans çözümlerinin fixture’larla çalışması ve evaluator’dan `correct` alması,
- IndexedDB kaydetme/geri yükleme/migrasyon.
- IndexedDB okuması yetkili sonuç üretemezse otomatik kaydın eski veriyi ezmemesi; yalnız açık replace işleminin korumayı kaldırması.

### Uçtan uca — Playwright

- ana sayfadan ilk göreve geçiş,
- doğru sorguyu çalıştırma ve tamamlama,
- yanlış sorgu ve öğretici geri bildirim,
- üç kademeli ipucu açma,
- sayfa yenileme sonrası ilerleme geri yükleme,
- tema/ayar kalıcılığı,
- klavye kısayolları,
- mobil viewport’ta temel görev akışı,
- header'da yalnız iki Studio hedefi ve her iki çalışma alanında klavye/mobil uyumlu rota menüsü,
- ana sayfa başında iki Studio hedefinin açıklamalı biçimde pasif kalması, footer sonunda birlikte açılması ve doğrudan Studio rotalarının bu geçitten etkilenmemesi,
- SQL rota menüsünde 11 modül/52 çalışma, aktif vaka, tamamlanma ve modül bazlı kilit davranışı,
- Python Studio’ya header’dan giriş, dört mobil panel, gerçek DataFrame çalıştırma ve sonuçtan sonra açık sonraki-vaka eylemi,
- export/import ve onaylı reset,
- yerel profil oluşturma → çıkış → yenileme → aynı profile giriş yaşam döngüsü,
- profil silmede iptal/onay ayrımı ve silinen verinin yeniden görünmemesi.

## Zorunlu senaryo matrisi

| Alan           | Mutlu yol                                              | Kritik edge case                                                       |
| -------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| İçerik         | geçerli görev kataloğa girer                           | duplicate ID, bozuk nextTask, eksik hint reddedilir                    |
| SQL runtime    | setup + SELECT sonuç döndürür                          | syntax error, timeout, stale run, reset                                |
| Python runtime | pandas kodu gerçek DataFrame artifact döndürür         | boot/run timeout, iptal, eksik result, satır/çıktı sınırı              |
| Python içeriği | 12 referans çözüm gerçek runtime’da doğrulanır         | kolon, dtype, sıra veya fixture sapması build’i durdurur               |
| Kolon          | doğru ad/sıra kabul edilir                             | eksik, fazla, alias/case politikası                                    |
| Satır          | eşit sonuç kabul edilir                                | duplicate, `NULL`, tarih, float toleransı                              |
| Sıra           | görev politikasına uyar                                | aynı satırlar yanlış sırada                                            |
| Kavram         | hedef kavram saptanır                                  | kavram yalnız yorum/string içinde geçer                                |
| Progress       | başarı kalıcılaşır                                     | tekrar deneme, migration, IndexedDB hatası                             |
| Yerel profil   | oluşturma, çıkış ve yeniden giriş aynı ilerlemeyi açar | çıkış veriyi silmez; profil silme iptali korur, onayı tamamen temizler |
| UI             | yükleniyor→sonuç                                       | motor yükleme hatası, boş sonuç                                        |
| Responsive     | görev tamamlanır                                       | yatay taşma, erişilemeyen eylem                                        |

## Komutlar

```bash
pnpm run test:unit
pnpm run test:e2e
pnpm test
pnpm run lint
pnpm run build
```

`package.json` komut isimlerinin kaynağıdır. CI veya yerel teslim kapısı en az lint, unit/integration, E2E kritik yol ve production build’i kapsamalıdır.

## Fixture kuralları

- Her çalışan görev için setup’ın deterministik olduğu bir fixture bulunur.
- En az bir referans çözüm ve mümkünse yapısal olarak farklı bir doğru çözüm çalıştırılır.
- En az bir yanlış kolon, yanlış satır ve görev uygunsa yanlış sıra örneği vardır.
- Beklenen sonuç elle değiştirildiğinde referans sorgu testi de güncellenir.
- Tarihler ISO ve açık timezone politikasıyla; sayılar görev toleransıyla karşılaştırılır.

## Mock politikası

- Ağır UI bağımlılıkları component seviyesinde mock edilebilir.
- PGlite ve Pyodide/pandas sözleşmeleri sadece mock ile doğrulanmış sayılmaz.
- IndexedDB repository için hızlı test adapter’ı kullanılabilir; gerçek IndexedDB entegrasyon testi ayrıca çalışır.
- Zaman, rastgelelik ve locale sabitlenir.
- Testin geçmesi için üretim doğrulaması bypass edilmez.

## Manuel kabul turu

Otomatik testlerden sonra üretim build’inde:

1. Temiz profilde ana sayfa başında SQL/Python header hedeflerinin pasif olduğu, footer sonuna ulaşıldığında birlikte açıldığı ve `Hemen Başla` eyleminin bu sırada kullanılabildiği doğrulanır; ardından ilk görev başlatılır.
2. Şema klavye ile incelenir, yanlış sorgu çalıştırılır.
3. Geri bildirim ve üç ipucu kontrol edilir.
4. Alternatif doğru sorguyla görev tamamlanır.
5. Yenileme sonrası sorgu/ilerleme doğrulanır.
6. Tema ve editor tercihleri değiştirilir.
7. Mobil boyutta aynı temel akış tamamlanır.
8. Export alınır, reset onaylanır, import ile geri yüklenir.
9. Profil ekranından çıkış yapılır; header'ın misafir durumuna döndüğü, yenilemede çıkışın korunduğu ve yeniden girişte son vakaya dönüldüğü doğrulanır.
10. Ayarlar'da `İlerlemeyi sıfırla` ile `Profili sil` açıklamaları karşılaştırılır; profil silme önce iptal edilir, sonra onaylanır ve yeni misafir durumu doğrulanır.
11. Python Studio ilk EDA vakasında çalıştırılır; gerçek tablo, geri bildirim, ipucu/çözüm puanı, sonraki vaka kilidi ve yenileme sonrası taslak kontrol edilir.
12. SQL Studio rota menüsü açılır; aktif vaka, 11 modül/52 çalışma, sonraki modül kilidi ve açık modül içindeki vaka geçişi kontrol edilir. Mobilde menünün yatay taşmadığı ve `Escape` ile kapandığı doğrulanır.

## Hata ayıklama raporu

Bir test flake ise kapatılmaz. Rapora en az test adı, seed/fixture, tarayıcı, viewport, log ve tekrar üretme adımları yazılır. Timeout artırmak yalnız kök neden ölçüldüyse kabul edilir.
