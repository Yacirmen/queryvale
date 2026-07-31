# Ürün Gereksinimleri

## Kullanıcı işleri

- “Bir iş sorusu aldığımda hangi tablo ve kolonlara bakacağımı anlamak istiyorum.”
- “Sorgumu gerçek veri üzerinde deneyip sonucumun neden yanlış olduğunu öğrenmek istiyorum.”
- “Ezber yerine giderek zorlaşan, mesleğe benzeyen görevlerle güven kazanmak istiyorum.”
- “Hesap açmadan kaldığım yerden devam etmek ve verimi kendim taşıyabilmek istiyorum.”
- “Kendi adımla ilerlememi, sıradaki işimi ve zorlandığım alanları tek bakışta görmek istiyorum.”
- “Doğru sorgunun çıktısını yalnız görmek değil; bulgu, öneri ve çekincesiyle açıklamak istiyorum.”

## Bilgi mimarisi

| Ekran                         | Birincil amaç                                                                   | Birincil eylem        |
| ----------------------------- | ------------------------------------------------------------------------------- | --------------------- |
| Ana sayfa                     | Kanıt rotasının değerini ve tarayıcı içi çalışma biçimini açıklamak             | İlk vakaya başla      |
| Öğrenme yolu / kariyer rotası | Dört kariyer bölümünü, ön koşulları ve sıradaki işi görünür kılmak              | Devam et              |
| Görev alanı                   | `Sor → İncele → Sorgula → Doğrula → Anlat` döngüsünü tek vaka üzerinde yürütmek | Sorguyu çalıştır      |
| İlerleme / Kanıt Defteri      | Doğrulanmış çalışmaları, karar notlarını ve pratik sinyallerini geri çağırmak   | Vakayı veya kanıtı aç |
| Ayarlar                       | Deneyimi ve yerel veriyi yönetmek                                               | Tercihi kaydet/aktar  |

## Birincil akış

1. Ana sayfa ürün vaadini ve tarayıcı içi çalışma modelini açıklar.
2. “İlk göreve başla” kısa, atlanabilir onboarding’i açar.
3. Kariyer rotası çalışan modülleri dört mesleki bölüm altında gösterir ve sıradaki vakayı önerir.
4. Çalışma alanı görev hedefini, kavram odağını, çıktı tanesini, kabul kontrollerini ve şemayı gösterir.
5. Kullanıcı sorgusunu yazar; `Cmd/Ctrl + Enter` ile çalıştırabilir.
6. Sonuç tablosu gerçek satırları, yürütme süresini ve satır sayısını gösterir.
7. Değerlendirme; yürütme, kolon, satır, sıra ve kavram katmanlarını açıklar.
8. Başarısız denemede değerlendirme katmanına özel kontrol adımları ve sırayla açılan ipuçları sunulur.
9. Doğru değerlendirmede sınırlı bir yerel kanıt snapshot’ı oluşturulur; kullanıcı çıktıyı görmeden otomatik olarak sonraki vakaya geçirilmez.
10. Kullanıcı isterse bulgu, öneri ve çekincesini karar notu olarak yazar; not otomatik puanlanmaz.
11. Sorgu, deneme, ilerleme ve kanıt kaydı v3 yerel çalışma alanına yazılır.

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

1. `execution-error`: SQL çalışmadı.
2. `columns-wrong`: beklenen çıktı sözleşmesi sağlanmadı.
3. `rows-wrong`: kolonlar doğru, içerik yanlış.
4. `order-wrong`: içerik doğru, zorunlu sıralama yanlış.
5. `required-concept-missing`: sonuç doğru, hedeflenen SQL kavramı yok.
6. `correct`: sonuç ve öğrenme hedefi doğru.

Geri bildirim kullanıcıya sonraki kontrol edilebilir eylemi söylemelidir. Tam çözüm varsayılan olarak editöre yerleştirilmez; üç hazırlık adımından sonra açık bir eylemle ve puan/ilerleme cezası olmadan gösterilir.

## Öğrenme yolu

1. Veriyle ilk temas
2. Veriyi filtreleme
3. Hesaplama ve dönüşüm
4. Özetleme
5. Tabloları birleştirme
6. Alt sorgular ve CTE
7. Analitik SQL
8. Kontrollü veri güncelleme
9. Yıldız şemaya giriş
10. Yönetici raporu projesi

İlk yedi modül üretim kalitesinde dörder görevlik setlerden oluşur. Modül 1–3 temel sorgu akıcılığını; modül 4–7 aggregation, join, alt sorgu/CTE ve analitik SQL derinliğini kurar. Modül 8–10 ise adları ve konu vaatleri tek teslimleriyle sınırlanmış, üretim kalitesinde birer odak vaka taşır; daha geniş DML, modelleme ve proje kütüphanesi yol haritasındadır.

Bu 10 modül kariyer rotasında **Temeli kur**, **İş sorusunu çöz**, **Örüntüyü keşfet** ve **Karara dönüştür** adlı dört bölüm altında sunulur. Bölümler mevcut görevlerin mesleki sonucunu açıklayan sunum katmanıdır; ayrı ilerleme üretmez ve kilitli/atlanan modülleri gizlemez.

## İlerleme sinyalleri

- tamamlanan görev ve modül yüzdesi
- doğrulanmış kanıt, karar notu ve yorumu bekleyen çalışma sayısı
- karar notlarındaki bulgu, öneri ve isteğe bağlı çekince
- çalışılan SQL kavramları ve önerilen sonraki görev
- görev başına deneme, çözüm süresi ve kullanılan ipuçları gibi ikincil pratik bağlamı
- takvim günü bazlı ölçülü çalışma serisi
- düzenlenebilir cihaz profili adı ve son tamamlanan görevler

Bu metrikler cezalandırıcı skor değildir; kullanıcının sonraki çalışmasını seçmesine yardım eder. İlk deneme, hız, ipucu sayısı, seri veya tamamlanma tek başına mesleki ustalık ya da işe hazır olma kanıtı değildir. Kanıt Defteri de sertifika değil, doğrulanmış çalışmayı ve kullanıcının kendi yorumunu geri çağıran yerel çalışma kaydıdır.
Profil adı hesap veya kimlik doğrulama değildir; yalnızca o tarayıcıdaki ilerlemeyi kişiselleştirir.

## Kanıt sözleşmesi

- Kanıt kaydı yalnız evaluator `correct` sonucunu verdiğinde oluşturulur.
- Snapshot sorguyu, sınırlı kolon listesini, en fazla 10 önizleme satırını ve toplam satır sayısı/kesilme bilgisini taşır; veritabanı dökümü değildir.
- Karar notu bulgu ve öneriyi, isteğe bağlı olarak da çekinceyi saklar. Not kullanıcının düşünme alanıdır; doğruluk veya ustalık puanı üretmez.
- Kanıtlar v3 yerel çalışma alanının parçasıdır ve doğrulanmış içe/dışa aktarma akışına dahildir.
- Tek bir doğru çalıştırma ya da yazılmış not, kavramın kalıcı öğrenildiğini veya bir mesleki yeterliliği kanıtladığı iddiasıyla sunulmaz.

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
