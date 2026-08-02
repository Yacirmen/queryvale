# Ürün Gereksinimleri

## Kullanıcı işleri

- “Bir iş sorusu aldığımda hangi tablo ve kolonlara bakacağımı anlamak istiyorum.”
- “Sorgumu gerçek veri üzerinde deneyip sonucumun neden yanlış olduğunu öğrenmek istiyorum.”
- “Ezber yerine giderek zorlaşan, mesleğe benzeyen vakalarla güven kazanmak istiyorum.”
- “Hesap açmadan kaldığım yerden devam etmek ve verimi kendim taşıyabilmek istiyorum.”
- “Kendi adımla ilerlememi, sıradaki işimi ve zorlandığım alanları tek bakışta görmek istiyorum.”
- “Doğru sorgunun çıktısını yalnız görmek değil; bulgu, öneri ve çekincesiyle açıklamak istiyorum.”
- “SQL’de kurduğum analitik düşünceyi gerçek pandas DataFrame’leri üzerinde EDA’dan örüntü analizine taşımak istiyorum.”

## Bilgi mimarisi

| Ekran                    | Birincil amaç                                                                   | Birincil eylem                   |
| ------------------------ | ------------------------------------------------------------------------------- | -------------------------------- |
| Ana sayfa                | Kanıt rotasının değerini ve tarayıcı içi çalışma biçimini açıklamak             | Başla / kaldığın yerden devam et |
| Rota                     | İki stüdyo içinden modülleri, kilitleri ve sıradaki vakayı görünür kılmak       | Vakayı seç / devam et            |
| Vaka alanı               | `Sor → İncele → Sorgula → Doğrula → Anlat` döngüsünü tek vaka üzerinde yürütmek | Sorguyu çalıştır                 |
| Python Studio            | EDA, temizlik, KPI ve zaman analizini gerçek DataFrame üzerinde uygulamak       | Python kodunu çalıştır           |
| İlerleme / Kanıt Defteri | Doğrulanmış çalışmaları, karar notlarını ve pratik sinyallerini geri çağırmak   | Vakayı veya kanıtı aç            |
| Ayarlar                  | Deneyimi ve yerel veriyi yönetmek                                               | Tercihi kaydet/aktar             |

## Birincil akış

1. Ana sayfa ürün vaadini ve tarayıcı içi çalışma modelini açıklar; header'daki SQL/Python hedefleri footer sonuna kadar nedenini açıklayan geçici bir tanıtım kilidi taşır. Bu kilit yalnız ana sayfa sunumudur, doğrudan Studio rotalarını veya diğer ekranları engellemez.
2. Yeni kullanıcıda “İlk vakaya başla” ilk vaka içinde kapatılabilir 90 saniyelik rehberi açar; geri dönen kullanıcıda “Kaldığın vakaya devam et” son güvenilir konumu açar.
3. SQL Studio içindeki rota menüsü çalışan SQL konularını dört mesleki bölüm altında gösterir; yalnız önceki SQL konusu tamamlandığında sıradakini açar ve ilk erişilebilir eksiği önerir. Ayrıntılı eski `#/learn` görünümü geriye uyumluluk için ikincil erişim olarak korunur.
4. Çalışma alanı önce istenen teslimi ve çıktı sözleşmesini gösterir; kavram, kabul kontrolleri, veri notları ve iş bağlamını ihtiyaç anında açar.
5. Kullanıcı sorgusunu yazar; taslak otomatik kaydolur ve `Cmd/Ctrl + Enter` ile çalıştırılabilir.
6. Sonuç tablosu gerçek satırları, yürütme süresini ve satır sayısını gösterir.
7. Değerlendirme; yürütme, kolon, satır, sıra ve kavram katmanlarını açıklar.
8. Başarısız denemede değerlendirme katmanına özel kontrol adımları ve sırayla açılan ipuçları sunulur.
9. Doğru değerlendirmede sınırlı bir yerel kanıt snapshot’ı oluşturulur; kullanıcı çıktıyı görmeden otomatik olarak sonraki vakaya geçirilmez.
10. Kullanıcı isterse bulgu, öneri ve çekincesini karar notu olarak yazar; not otomatik puanlanmaz.
11. İlk doğru sorguda bağımsız çözüm düzeyini gösteren Analiz puanı kilitlenir: 10 başlangıç, benzersiz ipucu başına −3, ilk doğrulamadan önce tam çözüm açıldıysa 0.
12. SQL ve Python taslakları, denemeleri, ilerlemesi, puanı ve kanıtları v6 yerel çalışma alanına ayrı alanlar olarak yazılır.

### Python Studio akışı

1. Header’daki `Python Studio`, ilk erişilebilir eksik Python vakasını veya güvenli son konumu açar.
2. Kullanıcı iş sorusunu ve küçük deterministik DataFrame’i inceler; sonraki vaka mevcut vaka tamamlanana kadar kilitlidir.
3. Python kodu ayrı Web Worker’daki gerçek Pyodide/pandas runtime’ında çalışır ve `result` DataFrame’i üretir.
4. Sonuç tablosu önce görünür; kolon, dtype, satır ve gerekiyorsa sıra sözleşmesi açıklanabilir geri bildirimle değerlendirilir.
5. Kullanıcı sonuç ekranda kalırken isterse sonraki vakaya geçer. Taslak, yardım, puan, tamamlanma ve sınırlı artifact otomatik kaydedilir.

Her iki stüdyo üst çubuğunda aynı rota menüsü kalıbını kullanır. SQL menüsü modül bazlı erişim sözleşmesini korur; açık modülün vakaları arasında serbestçe dolaşılabilir. Python menüsünde ise mevcut vaka ön koşulları değişmeden kalır.

## Çalışma alanı gereksinimleri

- Masaüstünde vaka/veri ile editör/sonuç arasında yeniden boyutlandırılabilir alanlar
- Dar ekranda `Vaka | Veri | SQL | Sonuç` sekmeleri ve dokunma hedefleri; sorgu çalışınca Sonuç açılır, yatay taşmaya dayalı ana akış yok
- Python Studio’da aynı bilgi önceliğini koruyan `Vaka | Veri | Python | Sonuç` sekmeleri
- Açılır/kapanır şema; tablo ilişkileri ve örnek satırlar
- Monaco Editor için belirgin yükleniyor ve hata durumu
- Çalıştır, sıfırla, otomatik taslak kaydı ve anında manuel kayıt eylemleri
- Sonuçlarda sticky başlık, yatay kaydırma, `NULL` gösterimi ve satır limiti bilgisi
- Sorgu hatası için teknik ayrıntı + öğretici açıklama
- Vaka navigasyonu, tamamlanma ve rota ilerlemesi
- Kısayollar:
  - `Cmd/Ctrl + Enter`: çalıştır
  - `Cmd/Ctrl + S`: otomatik kaydı beklemeden sorgu/ilerlemeyi hemen kaydet
  - `Cmd/Ctrl + K`: komut ve yardım paneli
  - `Esc`: açık ikincil paneli kapat

## Değerlendirme durumları

1. `execution-error`: SQL çalışmadı.
2. `columns-wrong`: beklenen çıktı sözleşmesi sağlanmadı.
3. `rows-wrong`: kolonlar doğru, içerik yanlış.
4. `order-wrong`: içerik doğru, zorunlu sıralama yanlış.
5. `required-concept-missing`: sonuç doğru, hedeflenen SQL kavramı yok.
6. `correct`: sonuç ve öğrenme hedefi doğru.

Python evaluator aynı kullanıcı diliyle `execution-error`, yanlış artifact, kolon, dtype, satır, sıra ve `correct` durumlarını ayırır. Python kaynak kodu tam çözümle metin eşitliği üzerinden puanlanmaz.

Geri bildirim kullanıcıya sonraki kontrol edilebilir eylemi söylemelidir. Tam çözüm varsayılan olarak editöre yerleştirilmez; üç hazırlık adımından sonra açık bir eylem ve puan etkisini anlatan ikinci onayla gösterilir. Çözüm ilk doğru değerlendirmeden önce açılırsa vaka puanı 0 olur; vaka tamamlanması, kanıt ve rota erişimi etkilenmez. Tamamlanmış bir vakada sonradan yardım incelemek kilitli puanı değiştirmez.

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
11. Pazarlama analitiği proje stüdyosu

İlk on modül üretim kalitesinde dörder vakadan oluşur. Modül 1–3 temel sorgu akıcılığını; modül 4–7 aggregation, join, alt sorgu/CTE ve analitik SQL derinliğini; Modül 8–10 güvenli veri değişikliği, modelleme/veri güveni ve yönetici karar teslimlerini kurar. Son modül, edinimden büyüme kararına uzanan 12 pazarlama analitiği projesiyle portföy teslimi yaptırır.

Bu 11 modül kariyer rotasında **Temeli kur**, **İş sorusunu çöz**, **Örüntüyü keşfet** ve **Karara dönüştür** adlı dört bölüm altında sunulur. Bölümler ayrı ilerleme üretmez. İlk modül açıktır; her sonraki modül yalnız önceki bütün modüllerin çalışmaları tamamlandığında açılır. Kilitli modüller gizlenmez, açılma koşulunu gösterir; mevcut ileri ilerleme ve kanıtlar silinmez.

Python Studio ayrı ve bağımsız bir rota taşır: **Veriyi tanı — EDA**, **Veriyi güvenilir hâle getir**, **KPI ve segment analizi**, **Zaman ve örüntü**. Her modül üç çalışan pandas vakası içerir; hem modüller hem vakalar ön koşul sırasıyla açılır. SQL ilerlemesi Python’a, Python ilerlemesi SQL’e erişim engeli koymaz.

## İlerleme sinyalleri

- tamamlanan vaka ve rota yüzdesi
- doğrulanmış kanıt, karar notu ve yorumu bekleyen çalışma sayısı
- karar notlarındaki bulgu, öneri ve isteğe bağlı çekince
- çalışılan SQL kavramları ve önerilen sonraki vaka
- tamamlanan Python vakaları, son Python çalışma konumu ve doğrulanan DataFrame kanıtları
- vaka başına deneme, çözüm süresi ve kullanılan ipuçları gibi ikincil pratik bağlamı
- takvim günü bazlı ölçülü çalışma serisi
- düzenlenebilir cihaz profili adı ve son tamamlanan vakalar

Bu metrikler cezalandırıcı sıralama değildir; kullanıcının sonraki çalışmasını seçmesine yardım eder. Analiz puanı ilk doğru sonuçtaki yardım düzeyini görünür kılar fakat ilerleme yüzdesi veya ustalık yerine geçmez. İlk deneme, hız, ipucu sayısı, seri, puan veya tamamlanma tek başına mesleki ustalık ya da işe hazır olma kanıtı değildir. Kanıt Defteri de sertifika değil, doğrulanmış çalışmayı ve kullanıcının kendi yorumunu geri çağıran yerel çalışma kaydıdır.
Profil adı hesap veya kimlik doğrulama değildir; yalnızca o tarayıcıdaki ilerlemeyi kişiselleştirir. Kullanıcı ilerlemeyi silmeden profilden çıkabilir ve aynı cihazdaki profili yeniden açabilir. Bu çıkış bir güvenlik kilidi değildir. İlerlemeyi sıfırlama profil ve tercihleri korurken, ayrı profil silme eylemi ad, sorgular, puanlar, kanıtlar, notlar ve ayarları açık onayla birlikte kaldırır.

## Kanıt sözleşmesi

- Kanıt kaydı yalnız evaluator `correct` sonucunu verdiğinde oluşturulur.
- Snapshot sorguyu, sınırlı kolon listesini, en fazla 10 önizleme satırını ve toplam satır sayısı/kesilme bilgisini taşır; veritabanı dökümü değildir.
- Karar notu bulgu ve öneriyi, isteğe bağlı olarak da çekinceyi saklar. Not kullanıcının düşünme alanıdır; doğruluk veya ustalık puanı üretmez.
- SQL ve Python kanıtları ile ilk başarıda kilitlenen puanlar v6 yerel çalışma alanının parçasıdır ve doğrulanmış içe/dışa aktarma akışına dahildir.
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

- ilk vakada editöre ulaşmak için gereken eylem sayısı,
- ilk sorguya ulaşma süresi ve kullanıcının sıradaki adımı kendi cümlesiyle söyleyebilmesi,
- ilk sorgunun çalıştırılabilmesi,
- alternatif doğru sorguların kabul oranı fixture’ları,
- hata sonrası ipucu ile başarıya geçiş,
- kritik E2E akışlarının geçmesi,
- mobilde ana akışın tamamlanması,
- içerik doğrulama hatalarının build’den önce yakalanması.
