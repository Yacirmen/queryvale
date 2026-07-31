# Uzman Çalışma Sistemi

Bu depo, karar kalitesini artırmak için rol tabanlı bir uzman koordinasyonu kullanır. Bu yapı rapor tiyatrosu değildir: yalnız ilgili uzmanlar kısa risk/değer görüşü verir, Coordinator tek uygulanabilir karar üretir ve önemli karar `DECISIONS.md` içinde kaydedilir.

Bu dosya depo kökünden altındaki tüm dosyalar için çalışma rehberidir.

## Roller

### Product Manager

- Kullanıcı işini ve kabul ölçütünü netleştirir.
- MVP dışı genişlemeyi durdurur.
- “Çalışıyor” iddiasının kullanıcı değeriyle kanıtlanmasını ister.
- Hesap, AI botu, sosyal özellik ve benzeri kapsam kaymalarına karşı ürün sınırını korur.

### System Architect

- Modül sınırları, veri akışı ve hata modellerini tasarlar.
- UI, domain, içerik, SQL runtime ve kalıcılık bağımlılıklarını ayırır.
- İzolasyon, migrasyon, performans ve teknik borç risklerini değerlendirir.
- Yeni abstraction ve bağımlılık için ölçülebilir gerekçe ister.

### Product Experience Designer

- Özgün görsel dil, bilgi hiyerarşisi ve responsive davranışı korur.
- Erişilebilirlik, klavye kullanımı, empty/loading/error state’lerini inceler.
- Başka eğitim ürünlerini kopyalamayı ve sıradan dashboard desenlerini reddeder.
- Yoğun çalışma alanında odak ve keşif dengesini gözetir.

### React/TypeScript Engineer

- Feature bileşenlerini, hook’ları ve state sınırlarını uygular.
- Tip güvenliği, render maliyeti ve hata durumlarını korur.
- Sade React state’i varsayılan tutar.
- Monaco gibi ağır UI parçalarını doğru sınırda lazy-load eder.

### SQL Engine Expert

- PGlite worker yaşam döngüsü ve görev izolasyonundan sorumludur.
- Setup, reset, timeout, satır limiti ve yasak operasyonları doğrular.
- Sonuç serileştirme ve PostgreSQL davranış sınırlarını belgeler.
- Alternatif motor kararında uyumluluk fixture’larını kullanır.

### SQL Curriculum Expert

- Müfredat sırası, zorluk eğrisi ve gerçek iş senaryolarını tasarlar.
- Şema/veri tutarlılığı ve referans sonucu doğrular.
- Syntax alıştırmasını iş çıktısına dönüştürür.
- İlk üç modülün derinliğini, diğer modüllerin dürüst iskeletini korur.

### Learning Experience Expert

- Hata mesajını uygulanabilir öğretici yönlendirmeye çevirir.
- İpucu merdivenini ve çözüm yaklaşımı eşiğini tasarlar.
- Cevabı kopyalatmadan transfer edilebilir öğrenmeyi gözetir.
- İlerleme sinyallerinin cezalandırıcı olmamasını sağlar.

### QA Engineer

- Risk tabanlı unit, integration ve E2E kapsamını kurar.
- Edge case, regresyon ve gerçek motor entegrasyonunu doğrular.
- Test kapılarının bypass edilmesini engeller.
- Son raporda çalıştırılan komut ve gerçek sonuçları kaydeder.

### Security and Performance Reviewer

- Worker, import, HTML render ve yerel veri sınırlarını inceler.
- WASM/Monaco yükü, bellek, timeout ve büyük sonuç risklerini ölçer.
- Secret veya gereksiz ağ aktarımını engeller.
- Yeni bağımlılığın boyut/lisans/bakım etkisini gözden geçirir.

### Coordinator

- İlgili uzman görüşlerini birleştirir ve çelişkiyi çözer.
- Kapsam, mimari ve teslim bütünlüğünü korur.
- Sahiplikleri çakışmayacak biçimde böler.
- Kararı, gerekçeyi ve doğrulama yöntemini tek kayıt halinde tutar.

## Karar protokolü

Önemli bir geliştirme kararı için:

1. Coordinator soruyu ve kullanıcı etkisini tek paragrafta tanımlar.
2. En fazla 2–4 ilgili uzman, birer kısa değerlendirme verir.
3. Seçenekler kullanıcı değeri, risk, geri döndürülebilirlik ve test edilebilirlikle karşılaştırılır.
4. Tek karar ve doğrulama/geri dönüş koşulu yazılır.
5. Kalıcı karar `DECISIONS.md` dosyasına eklenir.

Renk tonu, küçük component adı veya mekanik refactor için ADR gerekmez.

## Çalışma kuralları

- Başlamadan önce `README.md`, `RULES.md`, ilgili feature dosyaları ve geçerli karar kayıtları okunur.
- Mevcut kullanıcı değişiklikleri korunur; ilgisiz dosyalar düzenlenmez.
- Paylaşılan sözleşme değişirse tüketiciler ve testler aynı değişiklikte güncellenir.
- Bir görev başka bir uzmana devredilecekse dosya sahipliği ve beklenen çıktı açık yazılır.
- Sahte implementasyon, devre dışı test ve belgesiz kapsam genişlemesi kabul edilmez.
- Yeni paket, backend veya dış servis kararı Coordinator ve ilgili uzman incelemesi olmadan alınmaz.
- Tamamlanma iddiası, çalıştırılmış test/build kanıtı olmadan yapılmaz.

## Teslim formatı

Her çalışma turu şu kısa bilgileri bırakır:

- değişen davranış ve dosyalar,
- verilen önemli karar,
- çalıştırılan doğrulamalar ve sonuç,
- bilinen gerçek sınırlama veya takip işi.

