# Katkı Rehberi

## Başlamadan önce

1. `README.md`, `RULES.md` ve ilgili mimari/ürün belgesini okuyun.
2. `DECISIONS.md` içinde mevcut kararı kontrol edin.
3. Değişikliği tek kullanıcı sonucu ve açık kabul ölçütüyle tanımlayın.
4. Mevcut çalışma alanındaki ilgisiz değişikliklere dokunmayın.

## Yerel geliştirme

```bash
pnpm install
pnpm run dev
```

Teslim öncesi:

```bash
pnpm run lint
pnpm test
pnpm run test:e2e
pnpm run build
```

Komutların kesin kaynağı `package.json` dosyasıdır.

## Kod düzeni

- Feature’a özgü UI, state ve adapter’ı aynı feature sınırında tutun.
- Saf normalizasyon/karşılaştırma fonksiyonlarını React component’inden ayırın.
- Browser API’lerini repository/adapter arkasında tutun.
- Component adları `PascalCase`, hook’lar `useX`, fonksiyon/değişkenler `camelCase`, içerik ID/slug’ları `kebab-case` olsun.
- TypeScript’te dar union’ları ve exhaustive switch’i tercih edin.
- Kullanıcıya gösterilen hata ile teknik `cause` bilgisini ayırın.
- Yeni bağımlılık eklemeden önce platform API’si veya mevcut yardımcıyla çözümü değerlendirin.

## UI katkıları

- Tasarım token’larını kullanın; rastgele hex, shadow ve spacing çoğaltmayın.
- Tüm interaktif durumları ekleyin: default, hover, focus-visible, active, disabled, loading, error.
- Semantik HTML’yi ARIA’dan önce tercih edin.
- Durumu yalnız renkle anlatmayın.
- Reduced-motion ve klavye akışını test edin.
- Masaüstü ve mobilde gerçek içerik uzunluklarıyla kontrol edin.

## SQL motoru/değerlendirme katkıları

- Bir görevin mutasyonu başka göreve sızmamalıdır.
- Timeout, reset ve route değişiminde geç gelen async sonucu reddedin.
- Sonuç karşılaştırması duplicate’ları korumalıdır.
- `NULL`, tarih, sayı ve case davranışı açık görev politikası kullanmalıdır.
- Regex/token taramasını tam parser veya güvenlik sandbox’ı gibi tanımlamayın.
- Yeni PostgreSQL davranışı gerçek PGlite entegrasyon fixture’ı ile test edilmelidir.

## İçerik katkıları

[CONTENT_GUIDE.md](./CONTENT_GUIDE.md) sözleşmesine uyun. Her çalışan görev:

- gerçekçi iş senaryosu ve tek anlamlı hedef,
- deterministik setup,
- doğrulanmış beklenen sonuç,
- yapısal olarak farklı doğru çözüm,
- anlamlı yanlış çözüm fixture’ları,
- üç kademeli ipucu,
- kısa yaklaşım açıklaması

taşımalıdır.

## Test beklentisi

- Saf domain değişikliği: unit test
- Component davranışı: RTL testi
- PGlite/IndexedDB adapter değişikliği: gerçek entegrasyon testi
- Kritik kullanıcı yolculuğu: Playwright
- Bug fix: önce veya aynı değişiklikte regresyon testi

Snapshot’ı yalnız davranış sözleşmesinden daha açık olduğunda kullanın. Testleri implementation detail’e veya CSS class dizisine gereksiz bağlamayın.

## Dokümantasyon ve kararlar

Kullanıcı davranışı, komut, içerik şeması, bilinen sınır veya mimari değişirse ilgili belgeyi aynı katkıda güncelleyin. PGlite fallback’i, yeni state kütüphanesi, backend, veri aktarımı veya yeni ağır bağımlılık gibi kararlar için kısa ADR gerekir.

## Değişiklik kontrol listesi

- [ ] Kullanıcı değeri ve kapsam açık
- [ ] Loading/error/empty/success durumları tamam
- [ ] Klavye, focus, kontrast ve reduced-motion kontrol edildi
- [ ] Tipler ve feature sınırları korundu
- [ ] Uygun testler eklendi ve geçti
- [ ] Lint/typecheck/build geçti
- [ ] İçerik veya dokümantasyon güncel
- [ ] Gizli veri, build çıktısı veya kişisel yerel DB eklenmedi
- [ ] Bilinen sınırlama dürüstçe kaydedildi
