# Test Stratejisi

## Kalite ilkesi

Queryvale’de testler görsel bir prototipi değil, gerçek öğrenme döngüsünü korur. En kritik sözleşme şudur: aynı doğru sonucu üreten farklı SQL kabul edilir, yanlış veya tehlikeli sonuç açıklanabilir biçimde reddedilir ve ilerleme yalnızca gerçek başarıyla değişir.

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

### Bileşen testleri — React Testing Library

Kullanıcının gördüğü/duyduğu davranış:

- tema ve editör ayarı,
- şema paneli ve ipucu açma,
- çalıştırma sırasında disabled/loading durumu,
- hata ve değerlendirme `aria-live` mesajı,
- başarı özeti ve sonraki görev eylemi,
- reset/import onay akışları.

Monaco ve PGlite, component testlerinde sözleşme seviyesinde adapter ile kontrol edilebilir; evaluator’ın kendisi mock’lanıp unutulmaz, ayrı gerçek entegrasyon testleri vardır.

### Entegrasyon testleri — Vitest/browser ortamı

- PGlite’ın yüklenmesi,
- `setupSql` uygulanması,
- basit `SELECT`,
- hatalı SQL,
- görevin resetlenmesi,
- iki görev arasında izolasyon,
- gerçek motor çıktısının evaluator’a aktarılması,
- IndexedDB kaydetme/geri yükleme/migrasyon.

### Uçtan uca — Playwright

- ana sayfadan ilk göreve geçiş,
- doğru sorguyu çalıştırma ve tamamlama,
- yanlış sorgu ve öğretici geri bildirim,
- üç kademeli ipucu açma,
- sayfa yenileme sonrası ilerleme geri yükleme,
- tema/ayar kalıcılığı,
- klavye kısayolları,
- mobil viewport’ta temel görev akışı,
- export/import ve onaylı reset.

## Zorunlu senaryo matrisi

| Alan | Mutlu yol | Kritik edge case |
|---|---|---|
| İçerik | geçerli görev kataloğa girer | duplicate ID, bozuk nextTask, eksik hint reddedilir |
| SQL runtime | setup + SELECT sonuç döndürür | syntax error, timeout, stale run, reset |
| Kolon | doğru ad/sıra kabul edilir | eksik, fazla, alias/case politikası |
| Satır | eşit sonuç kabul edilir | duplicate, `NULL`, tarih, float toleransı |
| Sıra | görev politikasına uyar | aynı satırlar yanlış sırada |
| Kavram | hedef kavram saptanır | kavram yalnız yorum/string içinde geçer |
| Progress | başarı kalıcılaşır | tekrar deneme, migration, IndexedDB hatası |
| UI | yükleniyor→sonuç | motor yükleme hatası, boş sonuç |
| Responsive | görev tamamlanır | yatay taşma, erişilemeyen eylem |

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
- PGlite sözleşmesi sadece mock ile doğrulanmış sayılmaz.
- IndexedDB repository için hızlı test adapter’ı kullanılabilir; gerçek IndexedDB entegrasyon testi ayrıca çalışır.
- Zaman, rastgelelik ve locale sabitlenir.
- Testin geçmesi için üretim doğrulaması bypass edilmez.

## Manuel kabul turu

Otomatik testlerden sonra üretim build’inde:

1. Temiz profilde ana sayfadan ilk görev başlatılır.
2. Şema klavye ile incelenir, yanlış sorgu çalıştırılır.
3. Geri bildirim ve üç ipucu kontrol edilir.
4. Alternatif doğru sorguyla görev tamamlanır.
5. Yenileme sonrası sorgu/ilerleme doğrulanır.
6. Tema ve editor tercihleri değiştirilir.
7. Mobil boyutta aynı temel akış tamamlanır.
8. Export alınır, reset onaylanır, import ile geri yüklenir.

## Hata ayıklama raporu

Bir test flake ise kapatılmaz. Rapora en az test adı, seed/fixture, tarayıcı, viewport, log ve tekrar üretme adımları yazılır. Timeout artırmak yalnız kök neden ölçüldüyse kabul edilir.
