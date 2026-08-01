import type { LessonLearningContent } from "../types/lesson";

export const MODULE_10_EXPANSION_LEARNING_CONTENT: Readonly<
  Record<string, LessonLearningContent>
> = {
  "m10-t2": {
    learningBrief: {
      conceptAnchor:
        "Kayıp riski analizinde ana müşteri kümesini önce aktif aboneliklerle sabitle; kullanım ve destek hareketlerini kendi müşteri tanelerinde özetledikten sonra birleştir ki çoklu hareketler müşteri satırını çoğaltmasın.",
      outputGrain:
        "Her sonuç satırı 1 Haziran 2026 itibarıyla aktif aboneliği bulunan tek bir müşterinin son etkinliğini, açık destek yükünü ve kayıp riskini temsil eder.",
      acceptanceChecks: [
        "Çıktı customer_name, last_activity_date, inactive_days, open_ticket_count ve risk_level kolonlarını bu sırada içermeli; her aktif müşteri yalnız bir kez görünmeli.",
        "Kullanımı hiç olmayan müşteri kaybolmamalı ve aynı risk düzeyinde ilk sırada gelmeli; iki açık talebi olan yakın tarihli müşteri, hareketsizlik eşiğine ihtiyaç duymadan Yüksek olmalı.",
        "1 Haziran 2026 sabit referans tarihi kullanılmalı; 52 gündür sessiz ama açık talebi olmayan müşteri Yüksek, tam 30 gündür sessiz müşteri Orta olmalı ve iptal edilmiş müşteri sonuçta bulunmamalı.",
      ],
      dataNotes: [
        "Bir müşterinin birden fazla kullanım ve destek kaydı olabilir. Ham hareket tablolarını aynı anda birleştirmek satırları çarpar; son kullanım ve açık talep sayısı önce ayrı ayrı müşteri seviyesine indirilmelidir.",
        "Kullanımı hiç olmayan müşteride last_activity_date ve buna bağlı inactive_days NULL kalabilir; bu yokluk sıradan bir tarih farkından önce CASE içinde ele alınmalıdır.",
        "Abonelik durumu analiz kapsamını belirler. Hareket geçmişi bulunsa bile iptal edilmiş bir müşteri aktif kayıp-risk kuyruğuna geri sokulmamalıdır.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Müşteri özetlerini küçük ve bağımsız adımlarda kur",
        checks: [
          "Son kullanım CTE'sinde müşteri başına MAX tarih, destek CTE'sinde ise yalnız açık talepler için müşteri başına sayım üretildiğini kontrol et.",
          "DATE sabitini, tarih çıkarma ifadesini ve CTE alias'larını ayrı ayrı çalıştırarak hangi adımın sözdizimi veya kolon hatası verdiğini bul.",
        ],
      },
      "columns-wrong": {
        title: "Risk kuyruğunun beş alanını teslim sözleşmesine hizala",
        checks: [
          "Kolonların customer_name, last_activity_date, inactive_days, open_ticket_count ve risk_level sırasını izlediğini doğrula.",
          "customer_id, subscription_id veya CTE içindeki yardımcı sayımların son çıktıya sızmadığını; hesaplanan alanların doğru alias'ları taşıdığını kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Önce kapsamı, sonra iki hareket tanesini doğrula",
        checks: [
          "Ana kümenin yalnız aktif aboneliklerden geldiğini ve iptal edilen müşterinin hareket geçmişi nedeniyle sonuca eklenmediğini kontrol et.",
          "Kullanım ile destek kayıtlarını ham satır düzeyinde birbirine bağlamadığını; son kullanım ve açık talep sayısını ayrı CTE'lerde müşteri başına tek satıra indirdiğini doğrula.",
          "Hiç kullanımı olmayan müşterinin LEFT JOIN sonrasında korunduğunu ve tam 30 günlük sınırın CASE koşulunda kapsandığını kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Kuyruğu operasyonun müdahale sırasına göre düzenle",
        checks: [
          "Birincil sıralama anahtarının görevde istenen risk önceliğini gerçekten öne taşıdığını doğrula.",
          "Aynı risk düzeyinde kullanımı hiç olmayan müşteriyi NULLS FIRST ile öne aldığını; ardından hareketsizlik süresi azalan ve müşteri adı artan anahtarları uyguladığını kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "Çoklu hareketleri join öncesinde müşteri tanesine indir",
        checks: [
          "Son kullanım tarihi ile açık talep sayısının iki ayrı toplulaştırılmış CTE'de üretildiğini doğrula.",
          "Hareketi olmayan aktif müşterileri korumak için özetleri aktif müşteri kümesine LEFT JOIN ile eklediğini ve risk etiketini CASE ile açıkça kurduğunu kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Aktif abonelikleri 1 Haziran 2026 tarihindeki risk kuyruğunun kapsamı olarak belirledin.",
        "Kullanım hareketlerinden müşteri başına son tarihi, destek taleplerinden müşteri başına açık kayıt sayısını ayrı ayrı ürettin.",
        "İki özeti aktif müşteri kümesine ekleyip NULL ve 30 günlük sınırı CASE içinde yorumladın; sonucu müdahale önceliğine göre sıraladın.",
      ],
      whyItWorks:
        "Her çoklu hareket kaynağı join'den önce müşteri başına tek satıra indiği için kullanım ve destek kayıtları birbirini çoğaltmaz. Aktif aboneliklerden başlayan LEFT JOIN de hareketi olmayan müşteriyi korur; sabit referans tarihi risk sonucunu tekrar üretilebilir kılar.",
      edgeCases: [
        "Aynı müşterinin birden fazla aktif aboneliği mümkünse kapsam CTE'si müşteri seviyesinde tekilleştirilmelidir; aksi halde özetler doğru olsa bile müşteri iki kez görünür.",
        "Son kullanım gelecekteki bir tarih taşıyorsa inactive_days negatif olur; bunu sağlıklı etkinlik gibi yorumlamadan önce veri kalitesi kuralı gerekir.",
        "Talep durumu sonradan yeniden açılabiliyorsa satır saymak yerine her talebin güncel durumunu belirleyen ayrı bir durum tanesi gerekebilir.",
      ],
      workplaceImpact:
        "Kapsamı ve cardinality'yi koruyan bu kuyruk, müşteri başarı ekibinin hareketi olmayan ya da destek yükü büyüyen aktif müşterilere yanlış sayımlar olmadan öncelik vermesini sağlar.",
      transfer: {
        prompt:
          "Kayıp riski müşteri yerine hesap grubu seviyesinde izlenecek olsaydı hangi üç özeti hangi yeni taneye indirmen gerekirdi?",
        reveal:
          "Önce aktif kapsamı hesap grubu seviyesinde tekilleştirir, müşteri kullanımlarından grup son etkinliğini ve tüm müşteri taleplerinden grup açık-talep sayısını üretirdin; tarih farkı ve risk kuralını ancak bu özetlerden sonra uygularsın.",
      },
    },
  },
  "m10-t3": {
    learningBrief: {
      conceptAnchor:
        "Bir kampanyaya bağlı harcama, sipariş ve iade tabloları çoktan-çoğa fanout üretmeden önce kendi campaign_id tanelerinde özetlenmeli; kârlılık ancak bu bağımsız toplamların mutabakatından sonra hesaplanmalı.",
      outputGrain:
        "Her sonuç satırı tek bir kampanyanın toplam harcamasını, iade sonrası net gelirini, kârını ve ROAS değerini temsil eder.",
      acceptanceChecks: [
        "campaign_name, total_spend, net_revenue, profit ve roas kolonları bu sırada bulunmalı; kampanya başına tam bir satır dönmeli.",
        "Birden fazla spend_events, attributed_orders ve refunds satırı birbirini çoğaltmamalı; total_spend, net_revenue ve profit ayrı kaynak toplamlarından hesaplanmalı.",
        "Siparişi olmayan kampanya kapsamda kalmalı; sıfır harcamalı kampanyada ROAS bölme hatası üretmemeli ve görevde tanımlanan boş/sıfır politikası korunmalı.",
      ],
      dataNotes: [
        "Aynı campaign_id için iki harcama ve iki sipariş satırını doğrudan birleştirmek dört ara satır üretir; iadeler eklendiğinde çarpan daha da büyür.",
        "Net gelir, ilişkilendirilmiş sipariş geliri toplamından iade toplamının çıkarılmasıdır. Kâr ise net gelirden toplam harcamanın çıkarılmasıyla oluşur; bu iki metrik aynı şey değildir.",
        "ROAS'ın paydası total_spend değeridir. Sıfır harcama gerçek bir edge case'tir ve NULLIF ya da açık CASE politikasıyla ele alınmalıdır.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Üç kaynak toplamını ve son hesapları sırayla doğrula",
        checks: [
          "spend_events, attributed_orders ve refunds tablolarının her birini campaign_id bazında özetleyen CTE'leri bağımsız çalıştır.",
          "COALESCE, çıkarma ve ROAS bölme ifadelerindeki alias kapsamlarını; özellikle sıfır payda korumasını kontrol et.",
        ],
      },
      "columns-wrong": {
        title: "Mutabakat çıktısını beş yönetici metriğine indir",
        checks: [
          "Kolon sırasının campaign_name, total_spend, net_revenue, profit ve roas olduğunu doğrula.",
          "Brüt sipariş geliri, refund toplamı veya campaign_id gibi ara alanların hesapta kullanılmasına rağmen son teslimde yer almadığını kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Fanout'u kaynak toplamlarında durdur",
        checks: [
          "Üç hareket tablosunu aynı ham FROM/JOIN zincirinde birleştirmediğini; her birinin campaign_id başına tek satır ürettiğini doğrula.",
          "net_revenue hesabında iadeyi brüt gelirden çıkardığını, profit hesabında ise harcamayı net gelirden çıkardığını kontrol et.",
          "Siparişsiz ve sıfır harcamalı kampanyaların LEFT JOIN ve NULL politikası sonrasında sonuçta kaldığını doğrula.",
        ],
      },
      "order-wrong": {
        title: "Kampanyaları karar metriğine göre önceliklendir",
        checks: [
          "Görevde belirtilen birincil kârlılık ya da verimlilik ölçüsünü doğru yönde sıraladığını kontrol et.",
          "Eşit metriklerde deterministik görünüm için campaign_name gibi ikinci anahtarın gerekli olup olmadığını doğrula.",
        ],
      },
      "required-concept-missing": {
        title: "Her child tabloyu join öncesinde kendi tanesine indir",
        checks: [
          "Harcama, sipariş ve iadeler için ayrı SUM + GROUP BY CTE'leri bulunduğunu doğrula.",
          "Kampanya ana listesinden başlayıp bu üç özeti LEFT JOIN ile eklediğini; kâr ve ROAS kararlarını özet değerler üzerinden kurduğunu kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Her kampanyanın harcama, ilişkilendirilmiş sipariş ve iade hareketlerini üç bağımsız CTE'de topladın.",
        "Özetleri kampanya ana listesine ekleyip eksik hareketleri görev politikasına göre sıfır veya NULL olarak yorumladın.",
        "Net geliri, kârı ve güvenli ROAS oranını aynı kampanya tanesinde hesaplayıp karar sırasına koydun.",
      ],
      whyItWorks:
        "Her child kaynak campaign_id başına tek satıra düştüğü için son join bire-bir özet eşleşmelerinden oluşur; satır çarpılması toplamları şişiremez. Kapsamı campaigns tablosundan başlatmak da hiç sipariş üretmeyen kampanyaları görünür tutar.",
      edgeCases: [
        "İade tutarı brüt geliri aşarsa net_revenue ve profit negatif olabilir; bu değer sorgu hatası değil, ayrı bir veri veya operasyon inceleme sinyalidir.",
        "Bir iadenin campaign_id bilgisi yoksa kampanya seviyesinde güvenilir biçimde düşülemez; ilişkilendirme kuralı rapor dışında açıkça yönetilmelidir.",
        "Farklı para birimleri aynı tablolarda tutuluyorsa SUM öncesinde kur dönüşümü yapılmadan hesaplanan kârlılık karşılaştırılamaz.",
      ],
      workplaceImpact:
        "Ön-toplama ve mutabakat deseni, pazarlama panolarındaki sessiz fanout hatalarını önler ve bütçe kesme ya da büyütme kararlarının izlenebilir kaynak toplamlarına dayanmasını sağlar.",
      transfer: {
        prompt:
          "Kampanya raporuna tıklama maliyeti için dördüncü bir çoklu hareket tablosu eklense mevcut sorguyu nasıl genişletirdin?",
        reveal:
          "Tıklama hareketlerini de campaign_id başına ayrı bir CTE'de toplar, diğer özetlere ham satır düzeyinde bağlamazdın; son kampanya join'ine tek satırlık maliyet özetini ekleyip yeni metriği orada hesaplardın.",
      },
    },
  },
  "m10-t4": {
    learningBrief: {
      conceptAnchor:
        "Erken uyarı panelinde önce branch-date tanesini koru, çoklu olayları günlük özetle, sonra aynı şube içindeki zaman sırasına window hesapları uygula; karar CASE'i ancak bu kanıtlar oluştuktan sonra üret.",
      outputGrain:
        "Her sonuç satırı tek bir şubenin tek bir operasyon günündeki giriş–çözüm farkını, biriken backlog'unu, gecikme değişimini, olay yükünü ve uyarı durumunu temsil eder.",
      acceptanceChecks: [
        "Her branch-date birleşimi bir kez görünmeli; aynı günün birden fazla incident satırı günlük operasyon veya kapasite değerlerini çoğaltmamalı.",
        "backlog_delta günlük giriş ile işlenen hacim farkından, running_backlog yalnız aynı şubenin kronolojik farklarından; delay_change ise aynı şubenin bir önceki gün gecikmesinden üretilmeli.",
        "Fixture; kritik olayı, limit üstü backlog'u ve 2+ saat kötüleşmeyi ayrı Acil kanıtları; %70 backlog, pozitif gecikme ve küçük olayı ayrı İzle kanıtları olarak göstermeli. İlk günün delay_change değeri NULL kalmalı.",
      ],
      dataNotes: [
        "incidents tablosunda aynı branch-date için birden fazla olay bulunabilir. Günlük olay özeti join'den önce üretilmezse daily_operations satırı çoğalır ve backlog hesabı şişer.",
        "LAG ile running SUM aynı branch_id bölümünü ve aynı operasyon tarihi sırasını kullanmalıdır; PARTITION BY unutulursa bir şubenin geçmişi diğerine taşar.",
        "Bir şubenin ilk günü için önceki gecikme yoktur. Bu NULL, sıfıra zorlanacak eksik veri değil, karşılaştırma yapılamadığını anlatan doğru analitik sonuçtur.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Günlük özet, window hesapları ve alarmı katmanlara ayır",
        checks: [
          "Önce incident günlük özetini, ardından branch-date temel setini ve en son window hesaplarını ayrı CTE'lerde çalıştırarak hatalı katmanı belirle.",
          "SUM ve LAG içindeki OVER parantezlerini, PARTITION BY ile ORDER BY sırasını ve window sonucunu kullanan dış CASE alias kapsamını kontrol et.",
        ],
      },
      "columns-wrong": {
        title: "Kontrol kulesinin teslim alanlarını sözleşmeyle karşılaştır",
        checks: [
          "Görevde istenen şube, tarih, backlog_delta, running_backlog, delay_change, olay ölçüsü ve alert alanlarının adlarını ve sırasını doğrula.",
          "Window sırasını kurmak için kullanılan branch_id veya ara gecikme kolonlarının son çıktıda gereksiz yere bulunmadığını kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Branch-date tanesini incident fanout'undan koru",
        checks: [
          "incidents verisini daily_operations ile birleştirmeden önce branch_id ve incident_date bazında tek satıra indirdiğini doğrula.",
          "backlog_delta hesabının hedef kapasiteyi değil, görevde tanımlanan giriş ve işlenen hacim farkını kullandığını kontrol et.",
          "running_backlog ve LAG pencerelerinin branch_id ile bölümlendiğini; tarih sırasının artan ve deterministik olduğunu doğrula.",
        ],
      },
      "order-wrong": {
        title: "Paneli şube içindeki zaman akışıyla hizala",
        checks: [
          "Sonuç sırasının önce görevde istenen şube anahtarını, ardından operasyon tarihini artan yönde kullandığını doğrula.",
          "Window içindeki ORDER BY ile görünür sonuç sırasının aynı analitik zaman yönünü izlediğini, fakat iki sıralamanın farklı sorumluluklar olduğunu hatırla.",
        ],
      },
      "required-concept-missing": {
        title: "Günlük kanıtı pencereyle biriktir, CASE ile karara çevir",
        checks: [
          "Incident sayımını günlük CTE'de, running_backlog değerini branch partition'lı kümülatif SUM ile ve delay_change değerini LAG ile ürettiğini doğrula.",
          "Uyarı etiketini ham tek bir kolondan değil, görevde verilen backlog, gecikme ve olay sinyallerini öncelik sırasıyla değerlendiren CASE üzerinden kurduğunu kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Çoklu incident kayıtlarını branch-date seviyesinde sayarak operasyon tablosunun tanesiyle uyumlu hale getirdin.",
        "Günlük backlog farkını kurup aynı şube içindeki farkları açık zaman sırasıyla biriktirdin; LAG ile gecikmenin önceki güne göre değişimini ölçtün.",
        "Kapasite, biriken backlog, gecikme değişimi ve olay kanıtlarını CASE içinde önceliklendirerek her şube-gün için eyleme dönük uyarı ürettin.",
      ],
      whyItWorks:
        "Olayları join öncesinde branch-date tanesine indirmek günlük operasyon satırlarını çoğalmaktan korur. PARTITION BY her şubenin zaman serisini izole eder; açık ORDER BY ve window frame birikimin yönünü belirler. Dış CASE de hesaplanmış sinyalleri tek, denetlenebilir karar etiketine dönüştürür.",
      edgeCases: [
        "Operasyon takviminde gün atlanırsa LAG önceki takvim gününü değil, mevcut verideki önceki kaydı getirir; ardışık gün şartı varsa ayrıca bir takvim omurgası gerekir.",
        "Geç gelen incident kaydı geçmiş bir günün olay sayısını ve uyarısını değiştirebilir; panelin veri güncellik zamanı karar notunda görünür olmalıdır.",
        "Negatif running_backlog iş kuralında mümkün değilse sonuç sıfıra sabitlenmeden önce fazla kapasitenin ayrı bir metrik olarak korunup korunmayacağı kararlaştırılmalıdır.",
      ],
      workplaceImpact:
        "Bu kontrol kulesi deseni, günlük hacim ve olay hareketlerini şişirmeden birleştirir; operasyon liderinin yalnız bugünkü sapmayı değil biriken yükü ve kötüleşme yönünü birlikte görmesini sağlar.",
      transfer: {
        prompt:
          "Panel günlük yerine vardiya bazında çalışacak olsa incident özeti, window sırası ve ilk-kayıt davranışında neyi değiştirirdin?",
        reveal:
          "Bütün kaynakları önce branch-shift tanesine indirir, pencere sırasını tarih artı vardiya anahtarıyla deterministik kurar ve her şubenin ilk vardiyasında LAG sonucunun yine NULL olmasını korurdun.",
      },
    },
  },
};
