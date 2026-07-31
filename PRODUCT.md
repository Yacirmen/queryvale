# Ürün Gereksinimleri

## Kullanıcı işleri

- “Bir iş sorusu aldığımda hangi tablo ve kolonlara bakacağımı anlamak istiyorum.”
- “Sorgumu gerçek veri üzerinde deneyip sonucumun neden yanlış olduğunu öğrenmek istiyorum.”
- “Ezber yerine giderek zorlaşan, mesleğe benzeyen görevlerle güven kazanmak istiyorum.”
- “Hesap açmadan kaldığım yerden devam etmek ve verimi kendim taşıyabilmek istiyorum.”

## Bilgi mimarisi

| Ekran | Birincil amaç | Birincil eylem |
|---|---|---|
| Ana sayfa | Ürün değerini ve çalışma biçimini açıklamak | İlk göreve başla |
| Öğrenme yolu | Modül, ön koşul ve sıradaki işi göstermek | Devam et |
| Görev alanı | Soru–şema–sorgu–sonuç döngüsünü yürütmek | Sorguyu çalıştır |
| İlerleme | Öğrenme sinyallerini anlamlandırmak | Önerilen göreve git |
| Ayarlar | Deneyimi ve yerel veriyi yönetmek | Tercihi kaydet/aktar |

## Birincil akış

1. Ana sayfa ürün vaadini ve tarayıcı içi çalışma modelini açıklar.
2. “İlk göreve başla” kısa, atlanabilir onboarding’i açar.
3. Çalışma alanı görev hedefini, beklenen kolonları ve şemayı gösterir.
4. Kullanıcı sorgusunu yazar; `Cmd/Ctrl + Enter` ile çalıştırabilir.
5. Sonuç tablosu gerçek satırları, yürütme süresini ve satır sayısını gösterir.
6. Değerlendirme; yürütme, kolon, satır, sıra ve kavram katmanlarını açıklar.
7. Başarısız denemede bağlama uygun geri bildirim ve sırayla açılan ipuçları sunulur.
8. Başarıda kısa öğrenme özeti, gerçek iş bağlantısı ve sonraki görev sunulur.
9. Sorgu, deneme ve ilerleme IndexedDB’ye yazılır.

## Çalışma alanı gereksinimleri

- Masaüstünde görev/şema ile editör/sonuç arasında yeniden boyutlandırılabilir alanlar
- Dar ekranda mantıksal sekmeler ve dokunma hedefleri; yatay taşmaya dayalı ana akış yok
- Açılır/kapanır şema; tablo ilişkileri ve örnek satırlar
- Monaco Editor için belirgin yükleniyor ve hata durumu
- Çalıştır, sıfırla ve güvenli biçimde kaydet eylemleri
- Sonuçlarda sticky başlık, yatay kaydırma, `NULL` gösterimi ve satır limiti bilgisi
- Sorgu hatası için teknik ayrıntı + öğretici açıklama
- Görev navigasyonu, tamamlanma ve modül ilerlemesi
- Kısayollar:
  - `Cmd/Ctrl + Enter`: çalıştır
  - `Cmd/Ctrl + S`: sorgu/ilerleme kaydet
  - `Cmd/Ctrl + K`: komut ve yardım paneli
  - `Esc`: açık ikincil paneli kapat

## Değerlendirme durumları

1. `execution_error`: SQL çalışmadı.
2. `columns_mismatch`: beklenen çıktı sözleşmesi sağlanmadı.
3. `rows_mismatch`: kolonlar doğru, içerik yanlış.
4. `order_mismatch`: içerik doğru, zorunlu sıralama yanlış.
5. `concept_missing`: sonuç doğru, hedeflenen SQL kavramı yok.
6. `passed`: sonuç ve öğrenme hedefi doğru.

Geri bildirim kullanıcıya sonraki kontrol edilebilir eylemi söylemelidir. Tam çözüm varsayılan olarak gösterilmez.

## Öğrenme yolu

1. Veriyle ilk temas
2. Veriyi filtreleme
3. Hesaplama ve dönüşüm
4. Özetleme
5. Tabloları birleştirme
6. Alt sorgular ve CTE
7. Analitik SQL
8. Veri düzenleme
9. Veri modelleme
10. İş analistliği projeleri

İlk üç modül üretim kalitesinde çalışan görevlerden oluşur. Diğer modüller içerik sözleşmesini doğrulayan, genişletilebilir örneklerle görünürdür; tamamlanmamış bir ekran “çalışıyor” gibi sunulmaz.

## İlerleme sinyalleri

- tamamlanan görev ve modül yüzdesi
- görev başına deneme sayısı
- ilk denemede çözüm oranı
- çözüm süresi ve kullanılan ipuçları
- güçlü/zorlanılan kavramlar
- son çalışma ve önerilen sonraki görev
- takvim günü bazlı ölçülü çalışma serisi

Bu metrikler cezalandırıcı skor değildir; kullanıcının sonraki çalışmasını seçmesine yardım eder.

## Tasarım sistemi

- **Renk:** mineral turkuaz eylem/keşif, amber dikkat/ipucu, mercan hata, mavi bilgi; yüzeyler sıcak açık nötr veya gece laciverti.
- **Tipografi:** arayüz için karakterli ama yüksek okunaklı sans; SQL, kolon ve sayılar için monospace.
- **Boşluk:** 4 px taban; yoğun kontrollerde 8–12 px, panel içlerinde 16–24 px, bölüm geçişlerinde 32–64 px.
- **Kart/panel:** içerik grubu olduğunda ince sınır ve küçük yükseklik farkı; her metin bloğu kartlaştırılmaz.
- **Buton:** tek baskın primary; secondary ve ghost hiyerarşisi; tüm durumlarda görünür focus ring.
- **Editör:** uygulama temasına bağlı, syntax vurgusu erişilebilir; satır yüksekliği ve font boyutu ayarlanabilir.
- **Animasyon:** 120–240 ms, dönüşümü açıklar; reduced-motion’da ortadan kalkar veya anlık olur.
- **İkon:** tek aile, anlamı metinle destekler; dekoratif ikonlar `aria-hidden`.

## Erişilebilirlik kabulü

- Semantik başlık ve landmark yapısı
- Tüm eylemlerde klavye erişimi ve görünür odak
- WCAG AA hedefleyen metin/eylem kontrastı
- Canlı sorgu/değerlendirme mesajlarında uygun `aria-live`
- Durumun renk dışında metin ve ikon/şekille anlatılması
- Hata odağının kullanıcıyı editörden koparmadan yönetilmesi
- 44×44 px’e yakın dokunma hedefleri

## Ürün başarı sinyalleri

Backend analitiği olmadan ilk sürümde kalite, yerel ve test edilebilir ürün sinyalleriyle izlenir:

- ilk göreve ulaşmak için gereken adım sayısı,
- ilk sorgunun çalıştırılabilmesi,
- alternatif doğru sorguların kabul oranı fixture’ları,
- hata sonrası ipucu ile başarıya geçiş,
- kritik E2E akışlarının geçmesi,
- mobilde ana akışın tamamlanması,
- içerik doğrulama hatalarının build’den önce yakalanması.

