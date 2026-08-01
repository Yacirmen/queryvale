# Yol Haritası

Bu yol haritası tarih vaadi değil, bağımlılık ve değer sırasıdır. Her fazın kapısı test, erişilebilirlik ve production build ile kapanır.

## Şimdi — Güvenilir kanıt rotası çekirdeği

### P0: Temel ürün

- Queryvale kimliği ve responsive uygulama kabuğu
- Ana sayfa ve birkaç saniyede anlaşılır değer önerisi
- İlk vaka içinde kapatılabilir 90 saniyelik rehber ve ana filmden doğrudan vaka/devam eylemi
- On bir çalışan SQL konusunu mesleki sonuçlarına göre gruplayan dört bölüm
- Her vakada `Sor → İncele → Sorgula → Doğrula → Anlat` döngüsü
- Masaüstü öncelikli vaka çalışma alanı; mobilde `Vaka | Veri | SQL | Sonuç` sekmeleri
- Şema, örnek satır, editor, sonuç ve ipucu panelleri

### P0: SQL ve değerlendirme

- Lazy-load PGlite worker
- Vaka başına izole kurulum/reset
- Sonuç satır limiti, timeout ve stale-run koruması
- Kolon, satır, sıra, `NULL`, duplicate, tolerans kontrolleri
- Gerekli kavram ve yasak işlem sinyalleri
- Öğretici hata eşleme

### P0: Öğrenme ve kalıcılık

- İlk on modülde dörder çalışan ve doğrulanmış vaka; final modülde 12 pazarlama analitiği portföy projesi; toplam 52 çalışma
- Önceki modüllerin bütün çalışmaları tamamlandıkça sıradakini açan, doğrudan URL'yi de kapsayan erişim sırası
- Her vakada kavram odağı, çıktı tanesi, kabul kontrolleri ve üç kademeli ipucu
- Hazırlık ipuçları yetmediğinde açık talep üzerine, puan etkisi önceden açıklanan ve ilerlemeyi engellemeyen tam çalışan çözüm
- Değerlendirme durumuna özel koçluk ve başarı sonrası transfer odaklı debrief
- Doğru değerlendirmeden üretilen sınırlı kanıt snapshot’ı, isteğe bağlı karar notu ve Kanıt Defteri
- IndexedDB v5 ilerleme, güvenilir devam konumu, otomatik SQL taslağı, ilk başarıda kilitlenen Analiz puanı, ayarlar ve `evidenceByTaskId` kalıcılığı
- İçe/dışa aktarma ve onaylı reset
- İlerleme özeti ve sıradaki vaka önerisi

### Çıkış kapısı

- Kritik unit/integration/E2E testleri geçer.
- Typecheck/lint ve production build hatasızdır.
- İlk vaka, yanlış sorgu, ipucu, tamamlama ve mobil sekmeli akış doğrulanır.
- Doğru sorgunun sonucu kullanıcı görmeden kaybolmaz; sonraki vakaya geçiş açık kullanıcı eylemidir.
- Kanıt snapshot’ı yalnız doğru değerlendirmede oluşur, sınırlarını korur ve karar notuyla birlikte yeniden açılabilir.
- Çalışmayan eylem veya sahte sonuç yoktur.

## Sonraki — Kanıt kalitesi ve analist muhakemesi

1. **Evidence Contract ve Data Trust Lab:** her vakada veri tanesi, sahiplik, güncellik, tamlık, `NULL`, duplicate ve join çoğalması kontrollerini görünür, tekrar kullanılabilir bir doğrulama sözleşmesine dönüştürmek
2. **Metrik ve modelleme:** pay/payda, filtre, boyut, zaman penceresi ve grain tanımlarını; yıldız şema ve güvenli join pratiğiyle birleştirmek
3. **Insight Studio:** doğrulanmış sonucu bulgu, öneri ve çekinceye dönüştürmeyi; doğru görsel/özet seçimi ve paydaş dilinde açıklamayla çalıştırmak
4. **Proje stüdyosu derinliği:** mevcut 12 pazarlama projesindeki karar notlarını, teslim değerlendirme rubriğini ve taşınabilir portföy görünümünü gerçek kullanıcı testiyle güçlendirmek
5. **Yerel portföy:** seçili kanıt snapshot’larını ve karar notlarını cihazda derleyip taşınabilir/indirilebilir bir çalışma dosyasına dönüştürmek; sertifika veya bulut profili iddiası taşımamak

## Paralel — İçerik derinliği ve ürün akıcılığı

1. Daha zengin tablo ilişki görünümü ve erişilebilir veri önizleme
2. İçerik yazarı için fixture/preview ve yanlış-sorgu yardımcıları
3. Büyük sonuçlar için sanallaştırılmış tablo
4. Tam offline PWA cache stratejisi ve güncelleme UX’i
5. Yerel performans/öğrenme içgörülerinin daha iyi öneri üretmesi

## Daha sonra — Araç köprüleri

1. CSV/elektronik tablo incelemesini aynı kanıt sözleşmesine bağlayan içe/dışa aktarma akışları
2. Kanıtı Python/pandas çalışmasına taşıyan, dosya tabanlı ve açık sınırları olan çalışma köprüsü
3. Tanımlanmış metrik ve veri setini BI aracına taşıyan görselleştirme/teslim playbook’ları
4. İçerik paketlerinin sürümlü ve bağımsız yayımlanması
5. Türkçe dışında yerelleştirme altyapısı

Python ve BI bu aşamada ürün içine gömülü ayrı çalışma motorları olarak vaat edilmez. Önce SQL kanıt rotasının veri sözleşmesi ve çıktı biçimi kararlı hale gelir; araç köprüleri daha sonra ölçülmüş kullanıcı ihtiyacıyla sınanır.

## Bilinçli olarak planda yok

- Hesap, backend profili ve bulut senkronizasyonu
- AI sohbet botu veya otomatik çözüm üreticisi
- Leaderboard, sosyal feed, sanal mağaza
- Ödeme ve abonelik
- Uzak sorgu çalıştırma

Bu maddeler ancak yeni kanıt ve açık ürün kararıyla kapsam içine alınabilir; teknik kolaylık tek başına gerekçe değildir.
