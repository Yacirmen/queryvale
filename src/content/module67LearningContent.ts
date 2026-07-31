import type { LessonLearningContent } from "../types/lesson";

export const MODULE_67_LEARNING_CONTENT: Readonly<
  Record<string, LessonLearningContent>
> = {
  "m6-t2": {
    learningBrief: {
      conceptAnchor:
        "Alt sorgunun biçimini kullanım yerine uydur: IN bir değer kümesi, scalar karşılaştırma ise tek bir eşik bekler.",
      outputGrain:
        "Her satır, aktif kampanya kategorisinde bulunan ve tüm ürünlerin fiyat ortalamasını aşan tek bir üründür.",
      acceptanceChecks: [
        "Çıktı yalnızca product_name ve unit_price kolonlarını bu sırada içermeli.",
        "Yalnız Akıllı Hoparlör ile Monitör kalmalı; aktif olmayan kategorideki pahalı ürün dışarıda olmalı.",
        "Ürünler unit_price değerine göre büyükten küçüğe sıralanmalı.",
      ],
      dataNotes: [
        "Genel fiyat ortalaması 250'dir; aktif olmayan Furniture kategorisindeki 500 ve 150 değerleri de bu eşiğe dahildir.",
        "Aktif kategorilerde 50 ve 100 fiyatlı ürünler vardır; kategori uygunluğu tek başına premium listeye girmek için yeterli değildir.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Premium liste sözleşmesini iki kolona indir",
        checks: [
          "Seçim listesinde önce product_name, sonra unit_price bulunduğunu kontrol et.",
          "category_id, kampanya bayrağı veya hesaplanan ortalama yardımcı ölçütlerdir; sonuç kolonu olmamalı.",
        ],
      },
      "rows-wrong": {
        title: "Kategori kümesi ile fiyat eşiğini ayrı ayrı doğrula",
        checks: [
          "Önce aktif kategorilerin 1 ve 3 olduğunu, ardından genel ortalamanın 250 olduğunu elle kontrol et.",
          "İki koşulun birlikte sağlanmasını iste; Ofis Koltuğu pahalı olsa da kategori 2 aktif değildir.",
        ],
      },
      "order-wrong": {
        title: "Premium vitrini en yüksek fiyattan başlat",
        checks: [
          "unit_price sıralamasının azalan yönde olduğunu doğrula.",
          "400 fiyatlı Akıllı Hoparlör'ün 300 fiyatlı Monitör'den önce geldiğini kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "İki farklı alt sorgu sözleşmesini görünür kıl",
        checks: [
          "Kategori filtresinin çok satırlı bir küme döndüren alt sorguyla kurulduğunu doğrula.",
          "Fiyat karşılaştırmasının tek değer döndüren genel AVG alt sorgusunu kullandığını kontrol et.",
        ],
      },
      "execution-error": {
        title: "Alt sorguların sınırlarını ve kaynaklarını ayır",
        checks: [
          "Her alt sorgunun kendi SELECT ve FROM bölümlerinin parantez içinde tamamlandığını kontrol et.",
          "campaign_active kolonunun categories, unit_price kolonunun products tablosundan geldiğini doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "Aktif kampanya kategorilerini çok satırlı bir yardımcı sonuç olarak tanımla.",
        "Tüm ürünlerden tek bir genel fiyat ortalaması üret ve ürün fiyatıyla karşılaştır.",
        "İki iş kuralını aynı ürün satırında birleştirip kalanları fiyata göre önceliklendir.",
      ],
      whyItWorks:
        "IN, çok satırlı kategori sonucunu üyelik testine dönüştürür; scalar AVG ise tek bir karşılaştırma eşiği sağlar. Böylece kapsam ve fiyat kriterleri birbirine karışmadan aynı ürün tanesinde uygulanır.",
      edgeCases: [
        "Aktif kategori kalmazsa IN kümesi boş olur ve sonuç da boş dönmelidir.",
        "unit_price NULL olabilseydi AVG bu değeri hesaba katmaz, NULL fiyatlı ürünün eşik karşılaştırması da doğru değer üretmezdi.",
      ],
      workplaceImpact:
        "Küme ve tek değer döndüren alt sorguları ayırmak, kampanya segmentasyonu ve dinamik fiyat eşiği kurallarını bağımsız değiştirilebilir tutar.",
      transfer: {
        prompt:
          "Bir işe alım listesinde yalnız açık departmanlardaki ve şirket maaş ortalamasının üzerindeki pozisyonları seçsen hangi alt sorgu çok satır, hangisi tek değer üretirdi?",
        reveal:
          "Açık departman kimlikleri üyelik için bir küme, şirket maaş ortalaması ise her pozisyonla karşılaştırılacak tek bir eşik olurdu.",
      },
    },
  },
  "m6-t3": {
    learningBrief: {
      conceptAnchor:
        "Anti-join sorularında ana kaydı koru ve ilişkili NOT EXISTS ile belirli bir hareketin yokluğunu test et.",
      outputGrain:
        "Her satır, 1 Nisan 2026 veya sonrasında siparişi bulunmayan tek bir müşteridir.",
      acceptanceChecks: [
        "Çıktı customer_id ve customer_name kolonlarını bu sırada içermeli.",
        "Mavi Market ile Kuzey Kafe dönmeli; yakın tarihli siparişi olan Atlas Retail ve Ada Tekstil dönmemeli.",
        "Satırlar customer_id değerine göre artan sırada olmalı.",
      ],
      dataNotes: [
        "Mavi Market'in 15 Mart tarihli bir siparişi vardır; müşteri tamamen hareketsiz değil, yalnız kesim tarihinden sonra sessizdir.",
        "Kuzey Kafe'nin hiç siparişi yokken Atlas Retail'in kesim tarihinin hem öncesinde hem sonrasında siparişi vardır; ilişki her dış müşteri için yeniden sınanmalıdır.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Geri kazanım listesini müşteri kimliğine sabitle",
        checks: [
          "Sonuçta yalnız customer_id ve customer_name bulunduğunu kontrol et.",
          "Sipariş tarihi veya order_id gibi yalnız kontrol için kullanılan alanları çıktıdan çıkar.",
        ],
      },
      "rows-wrong": {
        title: "Yokluğu doğru tarih aralığında ve doğru müşteri için ara",
        checks: [
          "Alt kontrolün her siparişi dış sorgudaki mevcut customer_id ile ilişkilendirdiğini doğrula.",
          "Tarih koşulunun 1 Nisan'ı kapsadığını ve Mavi Market'in eski siparişinin onu elemediğini kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Arama listesini müşteri kimliğine göre sırala",
        checks: [
          "Dış sonuç sıralamasını customer_id artan olarak tanımla.",
          "Beklenen sıranın 2 numaralı Mavi Market, ardından 3 numaralı Kuzey Kafe olduğunu karşılaştır.",
        ],
      },
      "required-concept-missing": {
        title: "Hareket yokluğunu ilişkili NOT EXISTS ile ifade et",
        checks: [
          "Dış müşteri satırını alt sorgudaki sipariş customer_id alanına bağladığını doğrula.",
          "Varlık testini NOT ile tersine çevirerek yalnız eşleşmesi bulunmayan müşterileri bıraktığını kontrol et.",
        ],
      },
      "execution-error": {
        title: "Dış ve iç sorgu kapsamlarını netleştir",
        checks: [
          "customers ve orders tablolarına farklı, tutarlı kısa adlar verip kolonları doğru kapsamdan çağır.",
          "Tarih sabitinin PostgreSQL DATE biçiminde olduğunu ve NOT EXISTS parantezinin tamamlandığını kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Ana müşteri kümesini dış sorguda eksiksiz tut.",
        "Her müşteri için kesim tarihinden sonraki sipariş varlığını ilişkili bir alt sorguda denetle.",
        "Bu varlık testini tersine çevirip kalan müşteri kimliklerini artan sıraya koy.",
      ],
      whyItWorks:
        "İlişkili alt sorgu mevcut müşteri kimliğini siparişlerde arar; NOT EXISTS yalnız bu koşulu sağlayan hiçbir satır bulunmadığında doğru olur. Eski hareket ile yakın tarihli hareket böylece birbirinden ayrılır.",
      edgeCases: [
        "Kesim tarihi tam 1 Nisan olan bir sipariş yeni dönem hareketi sayılmalıdır.",
        "Sipariş tarafındaki müşteri kimliği NULL olabilseydi NOT EXISTS yine güvenli çalışır; NOT IN ise bilinmeyen değer nedeniyle beklenmedik biçimde hiçbir satır döndürmeyebilirdi.",
      ],
      workplaceImpact:
        "Bu desen churn, eksik onay ve hiç gerçekleşmemiş işlem listelerinde ana veri kapsamını kaybetmeden güvenilir aksiyon listesi üretir.",
      transfer: {
        prompt:
          "Son 30 günde giriş yapmamış çalışanları bulurken dış sorgu hangi ana kümeyi, ilişkili kontrol hangi hareketi temsil ederdi?",
        reveal:
          "Dış sorgu tüm çalışanları korur, alt sorgu mevcut çalışanın tarih aralığındaki giriş kaydını arar; kayıt yoksa çalışan listede kalır.",
      },
    },
  },
  "m6-t4": {
    learningBrief: {
      conceptAnchor:
        "Recursive CTE'yi bir başlangıç kümesi ve her turda bir sonraki seviyeyi üreten ilerleme kuralı olarak tasarla.",
      outputGrain:
        "Her satır, kökten erişilebilen tek bir kategori düğümünü tam yolu ve köke uzaklığıyla temsil eder.",
      acceptanceChecks: [
        "Çıktı category_path ve depth kolonlarını bu sırada içermeli.",
        "Tek kök, iki birinci seviye ve üç ikinci seviye kategori olmak üzere altı düğümün tamamı bir kez dönmeli.",
        "Yollar category_path değerine göre alfabetik artan sırada olmalı; kökün depth değeri 0 olmalı.",
      ],
      dataNotes: [
        "Ürünler satırının parent_id değeri NULL olan tek köktür; recursion bu anchor satırdan başlar.",
        "Bilgisayar, Ses ve Mutfak iki bağlantı uzaktadır; tam yolları üç kategori adı taşır ve depth değerleri 2'dir.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Ağaç çıktısını yol ve derinlikle sınırla",
        checks: [
          "Dış seçimde yalnız category_path ve depth kolonlarını verdiğini kontrol et.",
          "CTE içinde taşıdığın category_id veya parent_id alanlarını sonuç sözleşmesine sızdırma.",
        ],
      },
      "rows-wrong": {
        title: "Anchor ile recursive adımın bağlantısını izle",
        checks: [
          "Anchor bölümünün yalnız parent_id değeri NULL olan Ürünler kökünü ürettiğini doğrula.",
          "Recursive adımın çocuk parent_id değerini bir önceki turdaki kategori kimliğiyle eşleştirdiğini kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Üretilen ağacı tam yol metniyle sırala",
        checks: [
          "Sıralamayı category_name veya depth yerine dış sonuçtaki category_path üzerinden yap.",
          "Elektronik altındaki iki yolun Ev dalından önce geldiğini alfabetik olarak karşılaştır.",
        ],
      },
      "required-concept-missing": {
        title: "Recursive ilerlemeyi açıkça kur",
        checks: [
          "CTE tanımının recursive olduğunu ve başlangıç ile ilerleme bölümlerinin UNION ALL ile birleştiğini doğrula.",
          "İlerleme bölümünün CTE'nin önceki çıktısına yeniden bağlandığını; yalnız sabit tabloyu tekrar okumadığını kontrol et.",
        ],
      },
      "execution-error": {
        title: "Recursive CTE kolonlarını iki tarafta hizala",
        checks: [
          "Anchor ve recursive bölümlerin aynı sayıda ve uyumlu türde kolon ürettiğini kontrol et.",
          "Yol birleştirme ifadesinin metin, depth artışının sayı ürettiğini ve CTE adının tutarlı yazıldığını doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "parent_id değeri NULL olan kökü başlangıç sonucu ve depth 0 olarak tanımla.",
        "Bir önceki seviyedeki kimliği çocukların parent_id alanına bağlayıp yol ile depth bilgisini ilerlet.",
        "Yeni çocuk kalmayınca oluşan düğümleri tam yol üzerinden sırala.",
      ],
      whyItWorks:
        "Anchor ilk çalışma kümesini verir; recursive adım yalnız erişilebilen çocukları bir sonraki tura taşır. Yol ve depth her turda türetildiği için bilinmeyen hiyerarşi derinliği tek sorguda raporlanır.",
      edgeCases: [
        "Parent bağlantılarında döngü varsa recursion kendiliğinden güvenli biçimde durmayabilir; ziyaret edilen kimlikleri izlemek veya derinlik sınırı koymak gerekir.",
        "Geçerli köke bağlanmayan yetim kategori anchor'dan erişilemez ve bu sonuçta görünmez; veri kalitesi kontrolü ayrı yapılmalıdır.",
      ],
      workplaceImpact:
        "Aynı yapı organizasyon şeması, ürün ağacı ve bağımlılık zincirlerinde derinliği önceden bilmeden gezilebilir yol çıktısı sağlar.",
      transfer: {
        prompt:
          "Çalışan–yönetici ağacında kökten çalışana kadar bir yönetim yolu üretmek için anchor ve recursive bağlantı hangi kayıtları kullanırdı?",
        reveal:
          "Anchor yöneticisi olmayan en üst çalışanları başlatır, recursive adım yeni çalışanın manager_id değerini önceki seviyedeki employee_id ile eşleştirirdi.",
      },
    },
  },
  "m6-t1": {
    learningBrief: {
      conceptAnchor:
        "Çok adımlı analizi CTE ile adlandırılmış bir ara veri setine böl ve aynı taneyi hem listeleme hem kıyaslama için yeniden kullan.",
      outputGrain:
        "Her satır, toplam geliri tüm şube toplamlarının ortalamasını aşan tek bir şubedir.",
      acceptanceChecks: [
        "Çıktı branch ve branch_total kolonlarını bu sırada içermeli.",
        "Her şubenin işlemleri önce tek toplamda birleşmeli; ham satış satırları sonuçta görünmemeli.",
        "Yalnız toplamı 2200 olan C şubesi dönmeli.",
      ],
      dataNotes: [
        "A, B ve C şubelerinin her birinde iki satış satırı vardır; ara sonuçta üç şube satırı oluşmalıdır.",
        "Şube toplamları 1500, 1000 ve 2200; bunların ortalaması yaklaşık 1566,67 olduğundan 1500 eşik altında kalır.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Yatırım listesini şube ve toplamla sınırla",
        checks: [
          "Dış sorgunun yalnız branch ve branch_total alanlarını döndürdüğünü kontrol et.",
          "Ara hesapta kullandığın satış kimliği, ham amount veya ortalama değeri sonuca ekleme.",
        ],
      },
      "rows-wrong": {
        title: "Ortalamayı ham satışlardan değil şube toplamlarından hesapla",
        checks: [
          "CTE sonucunda A=1500, B=1000 ve C=2200 olmak üzere tam üç satır üretildiğini doğrula.",
          "Eşik hesabının altı ham amount değeri yerine bu üç branch_total değerini kullandığını kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Bu görevde satır sırası karar ölçütü değil",
        checks: [
          "Tek doğru satır bulunduğu için yalnız sıralama ekleyerek satır veya kolon hatasını çözmeye çalışma.",
          "Sonuç kümesinde C dışı bir şube varsa toplama ve eşik katmanlarını yeniden incele.",
        ],
      },
      "required-concept-missing": {
        title: "Ara şube toplamlarını CTE olarak yeniden kullan",
        checks: [
          "Şube bazlı GROUP BY ve SUM hesabının adlandırılmış bir CTE içinde bulunduğunu doğrula.",
          "Ortalama karşılaştırmasının aynı CTE'deki branch_total kolonunu kullanan tek değerli bir alt sorguyla yapıldığını kontrol et.",
        ],
      },
      "execution-error": {
        title: "CTE kapsamını ve türetilmiş kolon adını kontrol et",
        checks: [
          "CTE parantezi kapandıktan sonra ana sorgunun doğrudan bu adlandırılmış sonuçtan okuduğunu doğrula.",
          "SUM sonucuna verilen branch_total adını dış sorgu ve ortalama hesabında aynı biçimde kullan.",
        ],
      },
    },
    debrief: {
      steps: [
        "Ham satışları branch tanesinde toplayıp branch_total üreten ara sonucu adlandır.",
        "Bu üç şube toplamından tek bir kıyaslama ortalaması hesapla.",
        "Ara sonuçtaki her şubeyi bu eşikle karşılaştırıp yalnız üzerindekileri seç.",
      ],
      whyItWorks:
        "CTE, hesaplama tanesini ham satıştan şubeye dönüştürür. Dış sorgu ve scalar karşılaştırma aynı ara sonucu kullandığı için eşik ile listelenen toplamlar aynı iş tanımına dayanır.",
      edgeCases: [
        "Bir şube toplamı ortalamaya tam eşitse 'üzerinde' koşuluyla listede kalmamalıdır.",
        "Negatif iade tutarları eklendiğinde SUM bunları toplamdan düşürür; iş kuralı iadeleri dışlamak istiyorsa ara toplama öncesi kapsam tanımlanmalıdır.",
      ],
      workplaceImpact:
        "Adlandırılmış ara metrikler, finans ve performans raporlarında aynı KPI'ın farklı yerlerde farklı hesaplanması riskini azaltır.",
      transfer: {
        prompt:
          "Ortalama ekip çözüm süresinden daha yavaş destek ekiplerini bulurken ara sonuç hangi tanede, eşik hangi değerler üzerinden kurulmalı?",
        reveal:
          "Önce biletlerden ekip başına tek çözüm süresi metriği üretilir; şirket eşiği bu ekip metriklerinin ortalamasından hesaplanır.",
      },
    },
  },
  "m7-t2": {
    learningBrief: {
      conceptAnchor:
        "ROW_NUMBER, RANK ve DENSE_RANK aynı sıralamaya farklı eşitlik politikaları uygular; bölüm sınırı her kategori için hesabı yeniden başlatır.",
      outputGrain:
        "Her satır, kendi kategorisi içinde üç farklı sıra değeri hesaplanmış tek bir satış temsilcisidir.",
      acceptanceChecks: [
        "Altı çıktı kolonu category, rep_name, revenue, row_no, revenue_rank ve dense_revenue_rank sırasıyla gelmeli.",
        "Enterprise ve SMB kategorilerinin her birinde sıra değerleri 1'den yeniden başlamalı.",
        "Sonuç category artan, revenue azalan ve eşit gelirlerde rep_name artan sırada olmalı.",
      ],
      dataNotes: [
        "Enterprise kategorisinde Ayla ve Bora 1200 gelirle eşittir; ROW_NUMBER farklı, diğer iki sıra aynı değerleri vermelidir.",
        "SMB'de Eren ve Figen 600 gelirle eşittir; RANK sonrasında boşluk oluşmaz çünkü eşit grup kategorinin sonundadır, Enterprise'da ise sonraki Cem için 3 ile 2 farkı görünür.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Üç sıralama sonucunu yan yana görünür kıl",
        checks: [
          "Temel category, rep_name ve revenue alanlarından sonra üç hesap kolonunun doğru alias'larla geldiğini kontrol et.",
          "row_no, revenue_rank ve dense_revenue_rank adlarının birbirine karışmadığını doğrula.",
        ],
      },
      "rows-wrong": {
        title: "Kategori bölümlerini ve eşitlik anahtarlarını ayır",
        checks: [
          "Her pencerenin category ile bölümlendiğini; SMB sıralarının Enterprise devamı olmadığını kontrol et.",
          "RANK ve DENSE_RANK sıralamasına rep_name ekleyip gelir eşitliğini yanlışlıkla bozmadığını doğrula.",
        ],
      },
      "order-wrong": {
        title: "Hesaplama sırası ile sunum sırasını birlikte sabitle",
        checks: [
          "Dış sonucu category, revenue azalan, rep_name artan öncelikleriyle sırala.",
          "ROW_NUMBER için eşit gelirli temsilcilere deterministik sıra veren rep_name ikincil anahtarını kullandığını kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "Üç sıra politikasını aynı bölümde karşılaştır",
        checks: [
          "ROW_NUMBER, RANK ve DENSE_RANK fonksiyonlarının üçünün de sonuçta ayrı ayrı kullanıldığını doğrula.",
          "Her birinin OVER bölümünde category bölümü ve revenue azalan önceliği bulunduğunu kontrol et.",
        ],
      },
      "execution-error": {
        title: "Pencere ifadelerini bağımsız tamamla",
        checks: [
          "Her sıralama fonksiyonunun kendi boş çağrı parantezi ve tamamlanmış OVER bölümü olduğunu kontrol et.",
          "Alias'ları pencere ifadesinin sonuna yazdığını ve dış ORDER BY kolonlarının sonuç kapsamında bulunduğunu doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "Karşılaştırma alanı olarak revenue, yeniden başlama sınırı olarak category seç.",
        "Eşit gelirlerde benzersiz sıra, boşluklu sıra ve kesintisiz grup sırası üreten üç politikayı ayrı hesapla.",
        "Rapor görünümünü kategori ve gelir önceliğiyle, eşitlikleri temsilci adıyla deterministik hale getir.",
      ],
      whyItWorks:
        "PARTITION BY kategorileri bağımsız yarışlara ayırır. ROW_NUMBER her satırı tekilleştirirken RANK eşit gruptan sonra konum atlar, DENSE_RANK ise yalnız farklı gelir seviyelerini sayar.",
      edgeCases: [
        "Tüm temsilciler aynı gelire sahipse RANK ve DENSE_RANK herkes için 1, ROW_NUMBER ise benzersiz değerler üretir.",
        "ROW_NUMBER sıralamasında eşitliği kıran sabit bir anahtar yoksa aynı veri farklı çalıştırmalarda farklı satır numarası alabilir.",
      ],
      workplaceImpact:
        "Doğru sıra politikası satış primi, liderlik tablosu ve ilk-N seçimi gibi kararlarda eşit performansın adil ve açıklanabilir yönetilmesini sağlar.",
      transfer: {
        prompt:
          "Bir sınavda eşit puan alan öğrencilerden sonra sıra numarası atlamalı, fakat seviye numarası kesintisiz kalmalıysa hangi iki politika neyi temsil eder?",
        reveal:
          "Resmî yarış sırası için RANK, kaç farklı puan seviyesi bulunduğunu göstermek için DENSE_RANK kullanılır; benzersiz liste konumu gerekiyorsa ROW_NUMBER ayrı bir karardır.",
      },
    },
  },
  "m7-t3": {
    learningBrief: {
      conceptAnchor:
        "LAG, zaman serisindeki önceki gözlemi mevcut satıra taşıyarak satır kaybetmeden dönem farkı kurar.",
      outputGrain:
        "Her satır, kendi geliri, önceki haftanın geliri ve haftalık değişim yüzdesiyle tek bir haftadır.",
      acceptanceChecks: [
        "Çıktı week_start, revenue, previous_revenue ve revenue_change_pct kolonlarını bu sırada içermeli.",
        "İlk haftanın önceki gelir ve değişim alanları NULL; sonraki yüzdeler 25, -20 ve 50 olmalı.",
        "Haftalar week_start değerine göre eskiden yeniye sıralanmalı.",
      ],
      dataNotes: [
        "5 Ocak serinin sınır satırıdır; öncesinde veri olmadığı için LAG ve ondan türeyen yüzde gerçek bir NULL üretir.",
        "19 Ocak geliri 1250'den 1000'e düştüğü için yüzde negatiftir; 26 Ocak tekrar 1500'e yükselir ve baz bir önceki 1000 değeridir.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Zaman serisi karşılaştırmasını dört kolonla göster",
        checks: [
          "week_start ve revenue sonrasında previous_revenue ve revenue_change_pct alias'larının bulunduğunu kontrol et.",
          "Mutlak fark gibi istenmeyen ek bir ara kolonu sonuç sözleşmesine ekleme.",
        ],
      },
      "rows-wrong": {
        title: "Her haftayı doğru önceki haftayla eşleştir",
        checks: [
          "LAG penceresinin week_start artan sırasını kullandığını ve ilk satırı sonuçtan filtrelemediğini doğrula.",
          "Yüzde paydasının mevcut gelir değil previous_revenue olduğunu; 19 Ocak'ta -20 ürettiğini kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Hesap ve görünüm kronolojisini aynı yönde tut",
        checks: [
          "Pencere içindeki ve dış sonuçtaki week_start sırasının ikisinin de artan olduğunu doğrula.",
          "5 Ocak'ın ilk, 26 Ocak'ın son satır olduğunu kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "Önceki dönemi LAG ile taşı",
        checks: [
          "Önceki geliri self join veya sabit değerle değil LAG pencere fonksiyonuyla elde ettiğini doğrula.",
          "Yüzde hesabının çıkarma, çarpma ve bölme adımlarını sayısal kesir üretecek biçimde kurduğunu kontrol et.",
        ],
      },
      "execution-error": {
        title: "Yüzde hesabının tür ve parantezlerini kontrol et",
        checks: [
          "LAG çağrısının OVER sıralamasıyla tamamlandığını ve revenue kolonunun doğru yazıldığını doğrula.",
          "Bölme işlemini sıfır önceki gelire karşı koru; ROUND hassasiyet argümanının sayısal ifadeye uygulandığını kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Haftaları tek ve kararlı bir kronolojik sıraya yerleştir.",
        "Önceki revenue değerini LAG ile mevcut hafta satırına taşı.",
        "Farkı önceki değere bölüp yüzdeye çevir, iki ondalığa yuvarla ve sınır NULL değerini koru.",
      ],
      whyItWorks:
        "LAG aynı sonuç tanesinde komşu dönemi erişilebilir kılar; böylece join ile satır çoğaltmadan her haftayı kendi baz haftasıyla kıyaslarsın. İlk satırın NULL olması serinin doğal başlangıcını dürüstçe gösterir.",
      edgeCases: [
        "Önceki haftanın geliri sıfırsa yüzde matematiksel olarak tanımsızdır; NULLIF benzeri bir koruma çalışmayı hata yerine NULL ile sürdürür.",
        "Takvimde bir hafta eksikse LAG takvim haftasını değil mevcut sonuçtaki önceki satırı getirir; kesintisiz periyot gerekiyorsa önce tarih omurgası kurulmalıdır.",
      ],
      workplaceImpact:
        "Dönemsel değişim sinyali büyüme, bütçe ve alarm raporlarında mevcut değerin bağlamını görünür hale getirir.",
      transfer: {
        prompt:
          "Aylık aktif kullanıcı değişimini hesaplarken ilk ay, sıfır baz ay ve eksik ay için hangi üç davranışı önceden tanımlardın?",
        reveal:
          "İlk ayın değişimi NULL kalır, sıfır bazda bölme güvenli biçimde ele alınır, eksik ay varsa önceki satır ile önceki takvim ayı ayrımı açıkça seçilir.",
      },
    },
  },
  "m7-t4": {
    learningBrief: {
      conceptAnchor:
        "Hareketli ortalamada pencere sınırını açık ROWS frame ile tanımla; hesap satırları özetlemeden her gözleme bağlanır.",
      outputGrain:
        "Her satır, o günün talebi ve mevcut gün dahil en fazla son yedi satırın ortalamasıyla tek bir gündür.",
      acceptanceChecks: [
        "Çıktı demand_date, units ve moving_avg_7d kolonlarını bu sırada içermeli.",
        "İlk günün ortalaması 10, yedinci günün 15 ve sekizinci günün yaklaşık 16,71 olmalı.",
        "Sekiz günün tamamı demand_date artan sırada korunmalı.",
      ],
      dataNotes: [
        "İlk altı satırda tam yedi geçmiş gözlem yoktur; PostgreSQL pencereyi var olan satırlarla daraltır, bu nedenle başlangıç değerleri NULL değildir.",
        "8 Mayıs satırında pencere 2–8 Mayıs arasındaki yedi satırı kapsar; 1 Mayıs'taki 10 artık ortalamaya dahil değildir.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Talep sinyalini günlük ayrıntıyla birlikte tut",
        checks: [
          "demand_date ve units alanlarının yanında hesap kolonunun moving_avg_7d adıyla geldiğini kontrol et.",
          "Yalnız ortalamayı döndürüp günlük ham değeri veya tarihi kaybetmediğini doğrula.",
        ],
      },
      "rows-wrong": {
        title: "Gruplama yapmadan kayan yedi satırı hesapla",
        checks: [
          "Sekiz kaynak günün sekizinin de sonuçta bulunduğunu; GROUP BY nedeniyle satırların azalmadığını kontrol et.",
          "Frame'in mevcut satır ile önceki altı satırı kapsadığını; sekizinci günde ilk günün çıktığını doğrula.",
        ],
      },
      "order-wrong": {
        title: "Pencereyi ve sonucu aynı tarih akışına bağla",
        checks: [
          "AVG penceresindeki sıralamanın demand_date artan olduğunu kontrol et.",
          "Dış sonucu da 1 Mayıs'tan 8 Mayıs'a doğru sırala; pencere sırası görünüm sırasını tek başına garanti etmez.",
        ],
      },
      "required-concept-missing": {
        title: "Hareketli ortalama çerçevesini açıkça belirt",
        checks: [
          "AVG hesabının OVER ile pencere fonksiyonu olarak kullanıldığını doğrula.",
          "Varsayılan pencereye güvenmek yerine satır bazında önceki altı ile mevcut satır sınırını açık yazdığını kontrol et.",
        ],
      },
      "execution-error": {
        title: "Window frame sözdizimini sırayla kur",
        checks: [
          "OVER bölümünde önce ORDER BY, ardından ROWS frame tanımının geldiğini doğrula.",
          "AVG sonucunun iki ondalığa yuvarlanabildiği sayısal türde olduğunu ve alias'ın ifadenin sonunda bulunduğunu kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Her günlük satırı demand_date üzerinden kronolojik konuma yerleştir.",
        "Mevcut konumdan altı satır geriye uzanan açık bir ROWS frame tanımla.",
        "Bu çerçevedeki units ortalamasını yuvarla ve günlük satırları azaltmadan sun.",
      ],
      whyItWorks:
        "Window AVG her satıra ayrı bir hesap bağlar; ROWS sınırı her konumda hangi fiziksel satırların hesaba katılacağını belirler. Başlangıçta pencere mevcut veriye daralır, sekizinci satırda ise ilk gözlem dışarı çıkar.",
      edgeCases: [
        "Tarihler arasında boşluk varsa yedi satır yedi takvim günü anlamına gelmez; gerçek gün aralığı gerekiyorsa tarih serisiyle eksik günler tamamlanmalıdır.",
        "Aynı tarihte birden fazla satır olabilseydi yalnız demand_date sırası kararsız kalırdı; önce günlük toplama veya benzersiz ikincil sıra anahtarı gerekirdi.",
      ],
      workplaceImpact:
        "Açık pencere sınırları, talep ve operasyon metriklerindeki gürültüyü yumuşatırken raporun hangi gözlemleri kullandığını denetlenebilir tutar.",
      transfer: {
        prompt:
          "Son dört ölçümün kalite ortalamasını üretmek istesen başlangıç satırları ve beşinci ölçüm için pencere nasıl davranmalı?",
        reveal:
          "İlk üç satır yalnız mevcut gözlemleri kullanır; dördüncü satırda pencere dolar, beşincide ilk gözlem çıkar ve son dört satır kalır.",
      },
    },
  },
  "m7-t1": {
    learningBrief: {
      conceptAnchor:
        "Kümülatif toplamda bölüm, sıra ve frame birlikte iş kuralıdır: hesap bazında sıfırla, işlemleri deterministik sırala, yalnız mevcut satıra kadar biriktir.",
      outputGrain:
        "Her satır, tek bir hesap işlemini ve o işlem uygulandıktan sonraki hesap bakiyesini temsil eder.",
      acceptanceChecks: [
        "Çıktı transaction_id, account_no, amount ve running_balance kolonlarını bu sırada içermeli.",
        "A-100 bakiyeleri 100, 70, 120; B-200 bakiyeleri 200, 120 olarak ayrı ayrı ilerlemeli.",
        "Sonuç account_no, transaction_date ve transaction_id öncelikleriyle artan sırada olmalı.",
      ],
      dataNotes: [
        "A-100 ve B-200 aynı 1 Nisan tarihinde hareket içerir; PARTITION BY olmadığı durumda B hesabı A hesabının bakiyesini devralırdı.",
        "-30 ve -80 negatif amount değerleri çıkışı temsil eder; kümülatif toplam bu satırlarda azalmalı, işlem satırı kaybolmamalıdır.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "İşlem ayrıntısı ile sonrasındaki bakiyeyi yan yana tut",
        checks: [
          "transaction_id, account_no ve amount alanlarından sonra running_balance alias'ının geldiğini kontrol et.",
          "transaction_date sıralama için gerekli olsa da beklenen çıktı kolonu olmadığını unutma.",
        ],
      },
      "rows-wrong": {
        title: "Hesap sınırını ve kümülatif frame'i doğrula",
        checks: [
          "Pencerenin account_no ile bölümlendiğini; B-200 ilk bakiyesinin 200'den başladığını kontrol et.",
          "Her işlem satırının korunduğunu ve negatif amount değerlerinin toplamı azalttığını doğrula.",
        ],
      },
      "order-wrong": {
        title: "Aynı işlem akışını hesapta ve sonuçta kullan",
        checks: [
          "Pencere sırasının transaction_date ardından transaction_id olduğunu doğrula.",
          "Dış sonucu önce account_no, sonra aynı tarih ve kimlik akışıyla sırala.",
        ],
      },
      "required-concept-missing": {
        title: "Toplamı satırları koruyan analitik pencereye taşı",
        checks: [
          "SUM hesabının GROUP BY yerine OVER ile her işlem satırında çalıştığını kontrol et.",
          "PARTITION BY hesap sınırını ve başlangıçtan mevcut satıra açık ROWS frame'i tanımladığını doğrula.",
        ],
      },
      "execution-error": {
        title: "Pencere bileşenlerini doğru sırada tamamla",
        checks: [
          "OVER içinde bölüm, sıralama ve frame bölümlerinin SQL sözdizimi sırasına uyduğunu kontrol et.",
          "transaction_date ile transaction_id kolon adlarını ve UNBOUNDED/CURRENT sınır ifadelerini yeniden doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "Her hesabı bağımsız bir kümülatif seri olarak bölümle.",
        "İşlemleri tarih ve kimlikle tek anlamlı bir akışa yerleştir.",
        "Başlangıçtan mevcut işleme kadar amount değerlerini toplayıp ayrıntı satırına running_balance olarak ekle.",
      ],
      whyItWorks:
        "Window SUM kaynak işlem satırlarını korur; PARTITION BY bir hesabın tutarlarını diğerinden ayırır. Açık ROWS frame yalnız o ana kadar gerçekleşen işlemleri kapsadığı için her satır işlem sonrası bakiyeyi gösterir.",
      edgeCases: [
        "Aynı hesapta aynı tarihli iki işlem varsa transaction_id gibi benzersiz ikincil sıra anahtarı olmadan ara bakiyelerin sırası belirsizleşir.",
        "Geçmiş tarihli bir işlem sonradan eklendiğinde kendisinden sonraki tüm running_balance değerleri değişir; artımlı raporların yeniden hesaplama politikası olmalıdır.",
      ],
      workplaceImpact:
        "Deterministik kümülatif hesaplar cari bakiye, stok seviyesi ve kota tüketimi gibi denetlenebilir işlem akışlarının temelidir.",
      transfer: {
        prompt:
          "Depo stok hareketlerinde running stock hesaplarken hesap bölümü, sıra anahtarı ve pozitif-negatif değerler neye dönüşürdü?",
        reveal:
          "Bölüm ürün veya depo kimliği, sıra hareket zamanı ve benzersiz hareket kimliği olur; girişler pozitif, çıkışlar negatif miktarla aynı kümülatif akışta işlenir.",
      },
    },
  },
};
