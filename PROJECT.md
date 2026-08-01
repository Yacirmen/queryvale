# Proje Tanımı

## Özet

Queryvale, başlangıçtan analitik SQL’e uzanan öğrenme yolunu gerçek iş görevleriyle sunan, hesap gerektirmeyen bir tarayıcı uygulamasıdır. Ürünün ayırt edici birimi “ders” değil “veri operasyonu”dur: kullanıcı bir paydaş sorusunu SQL ile kanıta dönüştürür.

## Başarı tanımı

İlk sürüm, şu zincir kesintisiz ve gerçek veriye bağlı çalıştığında başarılıdır:

1. Kullanıcı ana sayfada ürünü birkaç saniye içinde anlar.
2. İlk göreve hesap açmadan başlar.
3. Şema ve örnek satırları inceleyip sorgu yazar.
4. Sorgu tarayıcı içindeki gerçek SQL motorunda çalışır.
5. Sistem, sorgu metninden bağımsız biçimde sonucu değerlendirir.
6. Yanlış yanıtta eyleme dönük geri bildirim ve kademeli ipucu verir.
7. Doğru yanıtta ilerlemeyi yerel olarak kaydeder ve sonraki göreve geçirir.

## Teslimat kapsamı

### Ürün

- Ana sayfa, öğrenme yolu, çalışma alanı, ilerleme ve ayarlar
- On bir modüllük, sıralı açılan müfredat
- İlk on modülde 40 uçtan uca çalışır vaka
- Son modülde 12 ilişkili veri setli pazarlama analitiği portföy projesi
- Açık/koyu tema, klavye kısayolları ve responsive davranış

### Platform

- PGlite ile gerçek, izole görev veritabanları
- Sonuç normalizasyonu ve çok seviyeli değerlendirme
- IndexedDB ilerleme ve tercih depolaması
- JSON içe/dışa aktarma
- Vitest/RTL/Playwright kalite kapıları
- GitHub Actions doğrulamalı GitHub Pages üretim yayını

### Dokümantasyon

Bu depodaki ürün, mimari, test, içerik, çalışma kuralları ve karar kayıtları.

## Kapsam dışı

- Hesap sistemi, kimlik doğrulama ve bulut senkronizasyonu
- Uzak veritabanı, D1, R2 veya uygulama backend’i
- Ücretli API, yapay zekâ sohbet botu veya canlı mentor
- Ödeme, sosyal ağ, leaderboard ve karmaşık puan ekonomisi
- Çok büyük veri seti veya tam PostgreSQL yönetim konsolu
- Her cihazda kusursuz çevrimdışı PWA kurulumu

## İş akışları

| Akış | Sahibi | Çıktı |
|---|---|---|
| Ürün ve kapsam | Product Manager | Doğrulanabilir MVP ölçütleri |
| Deneyim ve sistem | Product Experience Designer | Erişilebilir responsive akış |
| SQL çalışma zamanı | SQL Engine Expert | İzole ve sınırlı sorgu yürütme |
| Değerlendirme | Architect + Learning Expert | Açıklanabilir sonuç karşılaştırması |
| İçerik | SQL Curriculum Expert | Gerçekçi, tip güvenli görevler |
| Kalıcılık | React/TS Engineer | Şema sürümlü yerel ilerleme |
| Kalite | QA + Security Reviewer | Otomatik ve manuel kabul kapıları |

## Definition of Done

Bir özellik yalnızca şu koşullar birlikte sağlanınca tamamlanır:

- Kullanıcıya görünen davranış gerçek veriye ve üretim koduna bağlıdır.
- Hata, boş, yükleniyor ve başarı durumları tasarlanmıştır.
- Klavye ve ekran okuyucu davranışı kontrol edilmiştir.
- Mutasyonlar görev izolasyonunu ve diğer ilerleme kayıtlarını bozamaz.
- Uygun birim/entegrasyon/E2E testi vardır.
- TypeScript, lint, test ve production build geçer.
- İlgili doküman ve karar kaydı günceldir.

## Riskler

| Risk | Etki | Önlem |
|---|---|---|
| WASM/Monaco ilk yükü | İlk göreve geç başlama | Route ve etkileşim bazlı lazy-load, görünür hazırlık durumu |
| Serbest SQL’in kaynak tüketimi | Donma veya bellek baskısı | Worker sınırı, timeout/yeniden başlatma, satır limiti |
| Aşırı esnek cevap değerlendirme | Yanlış pozitif | Kolon/satır/sıra/kavram katmanları ve fixture testleri |
| İçerik hatası | Öğrenme güveninin kaybı | Build-time doğrulama ve referans sorgu testleri |
| Yerel verinin silinmesi | İlerleme kaybı | Açık uyarı, dışa/içe aktarma, şema migrasyonu |
