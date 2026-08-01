import type { LessonLearningContent } from "../types/lesson";

export const MODULE_45_LEARNING_CONTENT: Readonly<
  Record<string, LessonLearningContent>
> = {
  "m4-t2": {
    learningBrief: {
      conceptAnchor:
        "Aynı grubu farklı aggregate fonksiyonlarıyla ölçerek hacim, toplam, merkez ve aralık sinyallerini tek karar satırında birleştirmek.",
      outputGrain:
        "Her sonuç satırı bir satış kanalının tüm siparişlerini özetler; tek bir siparişi temsil etmez.",
      acceptanceChecks: [
        "Partner, Store ve Web için tam olarak birer satır dönmeli.",
        "Her satırda sipariş adedi ile toplam, ortalama, en düşük ve en yüksek tutar birlikte görünmeli.",
        "Kanal satırları alfabetik olarak Partner, Store, Web sırasını izlemeli.",
      ],
      dataNotes: [
        "Kanal değerleri hareket tablosunda tekrar eder: Partner iki, Store ve Web üçer sipariş taşır; gruplama bu tekrarları üç karar satırına indirmelidir.",
        "Kanalların satır sayıları eşit değildir; bu nedenle toplamı sipariş sayısına bölmeden ortalama yerine toplamı yorumlamak yanıltıcı olur.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Aggregate ifadelerinin gruplama sınırını kontrol et",
        checks: [
          "Aggregate olmayan channel kolonunun gruplama anahtarında bulunduğunu doğrula.",
          "Beş metrik ifadesinin her birinde order_amount kolonunun ve parantezlerin doğru kullanıldığını kontrol et.",
        ],
      },
      "columns-wrong": {
        title: "Yönetim çıktısının altı kolonunu aynı sözleşmeye getir",
        checks: [
          "İlk kolonun channel, ardından order_count, total_amount, avg_amount, min_amount ve max_amount olduğunu doğrula.",
          "Metriklerin alias'larını görevde verilen adlarla ve fazladan kolon bırakmadan eşleştir.",
        ],
      },
      "rows-wrong": {
        title: "Sipariş satırlarını kanal tanesinde topladığından emin ol",
        checks: [
          "Sonuçta üç kanal satırı varsa da her metriğin yalnız kendi kanalındaki order_amount değerlerinden hesaplandığını kontrol et.",
          "order_count için tutar kolonunu değil tüm sipariş satırlarını say; toplam ile ortalamayı birbirinin yerine kullanmadığını doğrula.",
        ],
      },
      "order-wrong": {
        title: "Kanal etiketini artan sıralamanın tek anahtarı yap",
        checks: [
          "Sıralamayı bir metrik yerine channel kolonuna uyguladığını kontrol et.",
          "Artan yönün Partner, Store ve Web dizisini ürettiğini sonuç üzerinden doğrula.",
        ],
      },
      "required-concept-missing": {
        title: "Beş ölçüyü gerçek aggregate yapılarıyla üret",
        checks: [
          "Hacim, toplam, ortalama, alt sınır ve üst sınır için COUNT, SUM, AVG, MIN ve MAX işlevlerinin her birinin sorguda yer aldığını doğrula.",
          "Bu metrikleri kanal seviyesine indiren GROUP BY adımının bulunduğunu kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Önce karar tanesini kanal olarak sabitledin ve tekrar eden hareketleri kanal gruplarına ayırdın.",
        "Aynı grup üzerinde beş ayrı aggregate çalıştırarak hacim, değer, ortalama ve dağılım sınırlarını ürettin.",
        "Kanal etiketine göre sıralayarak karşılaştırılabilir ve tekrar üretilebilir bir yönetim çıktısı oluşturdun.",
      ],
      whyItWorks:
        "Aggregate fonksiyonları her kanal grubunun satır kümesini farklı bir ölçüye indirger. Böylece aynı çıktı tanesi korunurken metriklerin iş anlamları birbirine karışmaz.",
      edgeCases: [
        "Yeni bir kanal tek siparişle gelirse ortalama, minimum ve maksimum aynı değeri taşır; bu doğru bir sonuçtur.",
        "order_amount ileride NULL kabul ederse COUNT(*) satırı saymaya devam ederken tutar aggregate'ları NULL değerini hesaba katmaz.",
      ],
      workplaceImpact:
        "Bu desen kanal, bölge, ekip veya ürün ailesi sağlık tablolarında aynı boyut için birden fazla yönetim metriği üretmenin temelidir.",
      transfer: {
        prompt:
          "Aynı özeti channel yerine status seviyesinde isteseydin hangi tek alanı grup anahtarı olarak değiştirirdin ve satır tanesi nasıl değişirdi?",
        reveal:
          "Grup anahtarı status olurdu; artık her satır bir kanal değil, tüm kanallardaki tek bir sipariş durumunu özetlerdi.",
      },
    },
  },
  "m4-t3": {
    learningBrief: {
      conceptAnchor:
        "COUNT(*) ile COUNT(nullable_column) arasındaki farkı kullanarak toplam hacim ile dolu veri kapsamını aynı grupta ayırmak.",
      outputGrain:
        "Her sonuç satırı bir satış kanalının toplam sipariş ve kupon kodu bulunan sipariş sayılarını temsil eder.",
      acceptanceChecks: [
        "Partner, Store ve Web için birer satır dönmeli.",
        "Her kanalda order_count tüm siparişleri, coupon_order_count yalnız dolu coupon_code değerlerini saymalı.",
        "Satırlar channel değerine göre artan alfabetik sırada olmalı.",
      ],
      dataNotes: [
        "Sekiz siparişin dördünde coupon_code NULL'dır; NULL satırlar toplam sipariş hacminde kalmalı, kupon kapsamından çıkmalıdır.",
        "Web üç siparişte iki, Store üç siparişte bir, Partner iki siparişte bir dolu kupon taşır; aynı toplam hacim aynı kupon kapsamı anlamına gelmez.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Sayım ifadeleri ile grup kolonunu ayrıştır",
        checks: [
          "channel kolonunun aggregate dışında kaldığı için gruplama anahtarı olarak tanımlandığını kontrol et.",
          "Kupon sayımında tablo ve kolon adının coupon_code olarak doğru yazıldığını doğrula.",
        ],
      },
      "columns-wrong": {
        title: "İki farklı sayımı doğru alias'larla sun",
        checks: [
          "Kolon sırasının channel, order_count, coupon_order_count olduğunu kontrol et.",
          "İki COUNT sonucuna birbirinden farklı ve görevle birebir eşleşen alias verdiğini doğrula.",
        ],
      },
      "rows-wrong": {
        title: "NULL kuponları yalnızca kapsam sayımından çıkar",
        checks: [
          "order_count hesabının coupon_code kolonuna bağlı olmadığını; NULL kuponlu siparişleri de içerdiğini doğrula.",
          "coupon_order_count için NULL değerleri ayrıca bir satır filtresiyle tüm sonuçtan silmek yerine kolon bazlı sayım davranışını kullandığını kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Sayılara değil kanal adına göre sırala",
        checks: [
          "Sıralama anahtarının channel olduğunu kontrol et.",
          "Sonucun Partner, Store, Web dizisiyle başladığını doğrula.",
        ],
      },
      "required-concept-missing": {
        title: "İki COUNT biçimi arasındaki semantik farkı görünür kıl",
        checks: [
          "Tüm satırlar için yıldızlı sayım, yalnız dolu kuponlar için coupon_code kolonlu sayım kullandığını kontrol et.",
          "Kanal bazında tek satır üretmek için GROUP BY ve beklenen sıra için ORDER BY bulunduğunu doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "Kanalı çıktı tanesi olarak seçip siparişleri üç gruba ayırdın.",
        "Bir sayımda tüm satırları, diğerinde yalnız NULL olmayan kupon değerlerini ölçtün.",
        "İki metriği yan yana getirerek hacim ile veri doluluğunu doğrudan karşılaştırılabilir yaptın.",
      ],
      whyItWorks:
        "Yıldızlı COUNT grup içindeki her satırı sayar; kolonlu COUNT ise o kolondaki NULL değerleri dışarıda bırakır. İki sonuç arasındaki fark eksik kupon sayısını da dolaylı olarak gösterir.",
      edgeCases: [
        "Bir kanaldaki tüm kuponlar NULL olursa kanal satırı korunur ve coupon_order_count sıfır olur.",
        "Aynı coupon_code bir kanalda birden çok siparişte tekrar ederse kolonlu COUNT her dolu satırı sayar; benzersiz kupon kodu ölçmez.",
      ],
      workplaceImpact:
        "Bu ayrım telefon, e-posta, kampanya kodu veya onay zamanı gibi nullable alanlarda veri kapsamı KPI'larını hatasız kurmayı sağlar.",
      transfer: {
        prompt:
          "Ekip kuponlu sipariş sayısı yerine kullanılan benzersiz kupon kodu sayısını isterse sayımın hangi özelliği değişmeli?",
        reveal:
          "NULL olmayan değerleri sayma davranışı korunur, fakat tekrar eden coupon_code değerleri tekilleştirilerek sayılır.",
      },
    },
  },
  "m4-t4": {
    learningBrief: {
      conceptAnchor:
        "Satır düzeyindeki kategorileri CASE ile göstergelere çevirip aynı grup içinde koşullu olarak toplamak.",
      outputGrain:
        "Her sonuç satırı bir satış kanalının completed, pending ve cancelled sipariş sayılarını yan yana gösterir.",
      acceptanceChecks: [
        "Her kanal için yalnız bir satır ve üç ayrı durum metriği oluşmalı.",
        "Bir sipariş yalnız kendi status kolonuna bir katkı yapmalı; diğer iki metrikte sıfır etkisi bırakmalı.",
        "Kanal satırları Partner, Store, Web alfabetik sırasıyla gelmeli.",
      ],
      dataNotes: [
        "Partner ve Web kanallarında cancelled, Store kanalında pending sipariş yoktur; bu hücreler NULL değil 0 olmalıdır.",
        "completed durumu her kanalda tekrar ederken diğer durumların dağılımı farklıdır; yalnız toplam sipariş sayısı durum matrisini açıklamaz.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "CASE ifadelerinin her birini aggregate sınırı içinde tamamla",
        checks: [
          "Her durum için WHEN, THEN, ELSE ve END parçalarının kapandığını kontrol et.",
          "CASE sonucunu toplayan SUM parantezlerinin üç metrikte de doğru yerde olduğunu doğrula.",
        ],
      },
      "columns-wrong": {
        title: "Durum matrisinin kolon sözleşmesini düzelt",
        checks: [
          "Kolonların channel, completed_orders, pending_orders, cancelled_orders sırasını izlediğini kontrol et.",
          "Her koşullu toplamın doğru durum alias'ına bağlandığını ve ham status kolonunun sonuçta kalmadığını doğrula.",
        ],
      },
      "rows-wrong": {
        title: "Her siparişin yalnız doğru durum sayacını artırmasını sağla",
        checks: [
          "completed, pending ve cancelled karşılaştırmalarının fixture'daki küçük harfli değerlerle eşleştiğini kontrol et.",
          "Eşleşmeyen CASE dalının 0 ürettiğini doğrula; aksi halde eksik durumlar NULL toplam verebilir.",
        ],
      },
      "order-wrong": {
        title: "Matrisi kanal adına göre sabitle",
        checks: [
          "Sıralama anahtarında koşullu metriklerden biri yerine channel kullandığını kontrol et.",
          "Artan alfabetik yönün Partner, Store, Web sonucunu verdiğini doğrula.",
        ],
      },
      "required-concept-missing": {
        title: "Koşullu sayımı CASE ve SUM birlikteliğiyle kur",
        checks: [
          "Her status için satırı 1 veya 0'a dönüştüren ayrı bir CASE bulunduğunu kontrol et.",
          "Bu göstergelerin SUM ile kanal grubunda toplandığını ve GROUP BY kullanıldığını doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "Her siparişin status değerini üç ayrı ikili göstergeye dönüştürdün.",
        "Göstergeleri kanal grubunda toplayarak kategori değerlerini kolonlara açtın.",
        "Eksik durumlarda ELSE 0 davranışıyla boş yerine hesaplanabilir sıfır ürettin.",
      ],
      whyItWorks:
        "CASE her satırda bir iş kuralını sayısal katkıya çevirir; SUM bu katkıları grup seviyesinde biriktirir. Böylece tek taramada birden fazla filtreli metrik üretilir.",
      edgeCases: [
        "Yeni bir status değeri eklenirse mevcut üç metrik onu saymaz; matrisin kapsamı iş sözlüğüyle birlikte güncellenmelidir.",
        "Status değeri NULL olabilseydi hiçbir koşul eşleşmezdi; ELSE 0 toplamların yine sayısal kalmasını sağlardı.",
      ],
      workplaceImpact:
        "Koşullu aggregation operasyon panolarında durum, kanal, risk sınıfı veya SLA dilimlerini tek sorguda yan yana üretir.",
      transfer: {
        prompt:
          "Aynı matrise completed siparişlerin toplam tutarını eklemek için satır göstergesinde 1 yerine hangi iş değerini kullanırdın?",
        reveal:
          "Eşleşen completed satırında order_amount katkısı, diğer satırlarda 0 kullanılırdı; böylece adet değil koşullu tutar toplamı oluşurdu.",
      },
    },
  },
  "m4-t1": {
    learningBrief: {
      conceptAnchor:
        "Satır filtresi ile grup filtresini doğru sırada uygulayarak yalnız uygun hareketlerden eşik üstü özetler üretmek.",
      outputGrain:
        "Her sonuç satırı bir bölgenin yalnız completed işlemlerine ait adet ve toplam gelir özetidir.",
      acceptanceChecks: [
        "refunded ve cancelled hareketler hiçbir bölgenin sayımına veya gelirine katılmamalı.",
        "Yalnız completed toplam geliri en az 900 olan bölge grupları görünmeli.",
        "Bölge satırları total_revenue değerine göre yüksekten düşüğe sıralanmalı.",
      ],
      dataNotes: [
        "East bölgesinde 500 tutarlı refunded, North bölgesinde 250 tutarlı cancelled hareket vardır; bölge etiketi doğru olsa da bu iki satır özete girmemelidir.",
        "Altı hareket yalnız üç region değerini tekrar eder; completed filtresinden sonra dört satır, gruplamadan sonra üç karar satırı kalır.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Satır, grup ve sıralama aşamalarının SQL sırasını kontrol et",
        checks: [
          "completed koşulunun gruplama öncesi satır filtresi bölümünde bulunduğunu doğrula.",
          "Aggregate eşiğini satır filtresine değil grup filtresine yazdığını ve region kolonunu grupladığını kontrol et.",
        ],
      },
      "columns-wrong": {
        title: "Bölge özetinin üç kolonunu netleştir",
        checks: [
          "Kolon sırasının region, transaction_count, total_revenue olduğunu doğrula.",
          "Sayım ve toplam ifadelerinin alias'larını vaka sözleşmesiyle eşleştir; status veya amount gibi ham kolonları çıkar.",
        ],
      },
      "rows-wrong": {
        title: "İşlem statüsü ile gelir eşiğini farklı aşamalarda uygula",
        checks: [
          "East toplamına refunded 500'ün, North toplamına cancelled 250'nin eklenmediğini kontrol et.",
          "900 eşiğinin tek amount satırına değil bölgenin completed toplamına uygulandığını doğrula.",
        ],
      },
      "order-wrong": {
        title: "Öncelik sırasını toplam gelire bağla",
        checks: [
          "Sıralama anahtarının region veya işlem adedi değil total_revenue olduğunu kontrol et.",
          "Azalan yönün West'i East ve North'tan önce getirdiğini doğrula.",
        ],
      },
      "required-concept-missing": {
        title: "Önce satırı, sonra grubu filtrele",
        checks: [
          "completed satırlarını ayırmak için WHERE ve bölge özetlerini elemek için HAVING kullandığını kontrol et.",
          "COUNT, SUM ve GROUP BY kavramlarının her birinin gerçek bir rol taşıdığını doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "Önce yalnız completed işlem satırlarını çalışma kümesinde tuttun.",
        "Kalan satırları region düzeyine indirip işlem adedi ve toplam gelir ürettin.",
        "Aggregate sonuçta gelir eşiğini uygulayıp bölgeleri karar önceliğine göre sıraladın.",
      ],
      whyItWorks:
        "WHERE tekil hareketleri aggregate hesaplanmadan önce eler; HAVING ise oluşmuş bölge gruplarını ölçülen toplam üzerinden değerlendirir. Bu iki aşamanın ayrılması iş kuralının doğru veri tanesinde çalışmasını sağlar.",
      edgeCases: [
        "Bir bölgenin tek completed işlemi 900 ise en az koşulu nedeniyle sonuçta kalmalıdır.",
        "Bir bölgenin yüksek tutarlı refunded hareketi olsa bile completed toplamı eşiğin altındaysa bölge elenmelidir.",
      ],
      workplaceImpact:
        "Bu desen gelir, iade, SLA veya kalite raporlarında önce geçerli olayları seçip sonra grup KPI eşiği uygulamanın güvenli yoludur.",
      transfer: {
        prompt:
          "Karar kuralı 'en az iki completed işlem ve en az 900 gelir' olsaydı grup filtresine hangi ikinci ölçüyü eklerdin?",
        reveal:
          "Aynı bölge grubunun işlem adedi de ölçülür ve gelir eşiğiyle birlikte grup seviyesinde değerlendirilirdi.",
      },
    },
  },
  "m5-t2": {
    learningBrief: {
      conceptAnchor:
        "Çoktan bire ilişkilerde JOIN sonrası oluşan satır çoğalmasını doğru çıktı tanesinde aggregate ederek yönetmek.",
      outputGrain:
        "Her sonuç satırı tek bir siparişi; o siparişin müşterisini ve tüm kalemlerinin toplam değerini temsil eder.",
      acceptanceChecks: [
        "5101, 5102 ve 5103 siparişlerinin her biri sonuçta tam bir kez görünmeli.",
        "customer_name doğru sipariş sahibinden, order_total ise o siparişe ait tüm kalemlerden gelmeli.",
        "Satırlar order_id değerine göre artan sırada olmalı.",
      ],
      dataNotes: [
        "5101 siparişinin iki order_items satırı vardır; JOIN sonrası iki hareket satırı oluşsa da nihai çıktıda tek sipariş satırına toplanmalıdır.",
        "Atlas Retail iki farklı siparişe sahiptir; yalnız customer_name'e göre gruplamak 5101 ile 5103'ü yanlışlıkla tek toplamda birleştirir.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Üç tablonun ilişki zincirini adım adım doğrula",
        checks: [
          "orders ile customers eşleşmesinin customer_id, orders ile order_items eşleşmesinin order_id üzerinden kurulduğunu kontrol et.",
          "quantity ile unit_price çarpımının SUM içinde olduğunu ve seçilen sipariş kolonlarının gruplama kapsamına alındığını doğrula.",
        ],
      },
      "columns-wrong": {
        title: "Sipariş tanesindeki üç kolonu sözleşmeye uydur",
        checks: [
          "Kolonların order_id, customer_name, order_total sırasını izlediğini doğrula.",
          "Toplam ifadesinin order_total alias'ını taşıdığını ve item_id gibi kalem düzeyi kolonların sonuçta kalmadığını kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Kalem satırlarını müşteri değil sipariş seviyesinde topla",
        checks: [
          "5101 için iki kalemin de toplama katıldığını, ancak siparişin iki kez dönmediğini kontrol et.",
          "Atlas Retail'in 5101 ve 5103 siparişlerini ayrı gruplarda tuttuğunu doğrula.",
        ],
      },
      "order-wrong": {
        title: "Sipariş dosyasını kimlik sırasına sabitle",
        checks: [
          "Sıralama anahtarında customer_name veya order_total yerine order_id kullandığını kontrol et.",
          "Artan yönün 5101, 5102, 5103 dizisini verdiğini doğrula.",
        ],
      },
      "required-concept-missing": {
        title: "İlişki zinciri ile sipariş aggregate'ını birlikte kur",
        checks: [
          "İki ayrı INNER JOIN'in üç tabloyu ilişkisel anahtarlarla bağladığını kontrol et.",
          "Kalem değerlerinin SUM ile sipariş grubuna indirildiğini ve GROUP BY bulunduğunu doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "Sipariş başlığını müşteri boyutuna bağlayarak doğru müşteri adını taşıdın.",
        "Sipariş başlığını kalem hareketlerine bağlayınca oluşan çoklu satırları değer hesabında kullandın.",
        "order_id ve müşteri adı seviyesinde gruplayarak hareketleri yeniden tek sipariş satırına indirdin.",
      ],
      whyItWorks:
        "JOIN ilişkili ayrıntıyı genişletir, GROUP BY ve SUM ise bu ayrıntıyı hedeflenen sipariş tanesine geri toplar. Grup anahtarında order_id bulunması aynı müşterinin farklı siparişlerini ayrı tutar.",
      edgeCases: [
        "Bir siparişin hiç kalemi yoksa INNER JOIN o siparişi sonuçtan çıkarır; kapsam gereksinimi değişirse JOIN türü yeniden seçilmelidir.",
        "Aynı ürün iki ayrı kalem satırında tekrar ederse her fiziksel kalem toplam değere katkı yapar; ürün bazında tekilleştirme farklı bir iş kuralıdır.",
      ],
      workplaceImpact:
        "Fatura, sipariş, sevkiyat ve sepet raporlarında başlık-kalem ilişkisini doğru tanede toplamak çift sayım riskini azaltır.",
      transfer: {
        prompt:
          "Finans aynı çıktıyı sipariş yerine müşteri başına tek satır isterse grup tanesi ve beklenen satır sayısı nasıl değişir?",
        reveal:
          "Grup tanesi müşteri olur; Atlas Retail'in iki siparişi birleşeceği için üç sipariş satırı yerine iki müşteri satırı oluşur.",
      },
    },
  },
  "m5-t3": {
    learningBrief: {
      conceptAnchor:
        "Hiyerarşik bir ilişkiyi aynı tabloya farklı roller ve alias'lar vererek yan yana çözümlemek.",
      outputGrain:
        "Her sonuç satırı doğrudan yöneticisi bulunan bir çalışan ile o yöneticinin adını temsil eder.",
      acceptanceChecks: [
        "CEO dışındaki dört çalışan tam birer kez görünmeli.",
        "Her employee_name kendi manager_id değerinin işaret ettiği manager_name ile eşleşmeli.",
        "Satırlar çalışanın employee_id değerine göre artan sırada olmalı.",
      ],
      dataNotes: [
        "CEO Derya Akın'ın manager_id değeri NULL'dır; INNER self join bu kök kaydı doğal olarak sonuç dışında bırakır.",
        "Derya Akın iki çalışanın yöneticisidir; yönetici adı tekrar edebilir ve bu tekrar yanlış duplicate değildir.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Tek tabloya verdiğin iki rolü kolon referanslarında ayır",
        checks: [
          "employees tablosunun çalışan ve yönetici için iki farklı alias ile yer aldığını kontrol et.",
          "manager_id kolonunun çalışan alias'ından, employee_id kolonunun yönetici alias'ından geldiğini doğrula.",
        ],
      },
      "columns-wrong": {
        title: "İki rolün adlarını doğru çıktı kolonlarına taşı",
        checks: [
          "İlk kolonun çalışan alias'ındaki employee_name olduğunu doğrula.",
          "İkinci employee_name ifadesine manager_name alias'ı verdiğini ve kimlik kolonlarını sonuçta bırakmadığını kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "İlişki yönünü çalışandan yöneticiye kur",
        checks: [
          "Çalışanın manager_id değerini yöneticinin employee_id değeriyle eşleştirdiğini; ters veya aynı kimlik eşleşmesi yapmadığını kontrol et.",
          "NULL manager_id taşıyan CEO'nun sonuçta olmadığını, Derya Akın'ın ise iki farklı çalışan satırında yönetici olarak kalabildiğini doğrula.",
        ],
      },
      "order-wrong": {
        title: "Görünümü çalışan kimliğine göre sırala",
        checks: [
          "Sıralama kolonunun yönetici kimliği veya alfabetik ad değil çalışan alias'ındaki employee_id olduğunu kontrol et.",
          "Baran, Ceren, Efe ve Funda satırlarının bu kimlik sırasını izlediğini doğrula.",
        ],
      },
      "required-concept-missing": {
        title: "Self JOIN'i görünür ve doğrulanabilir kıl",
        checks: [
          "Aynı employees tablosunun iki kez ve farklı alias'larla kullanıldığını kontrol et.",
          "Bu iki rolün INNER JOIN ile doğrudan yönetici ilişkisi üzerinden bağlandığını doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "employees tablosunun ilk örneğini çalışan, ikinci örneğini yönetici rolü olarak adlandırdın.",
        "Çalışanın manager_id referansını yönetici rolünün employee_id anahtarına bağladın.",
        "İki roldeki ad kolonlarını yan yana seçip çalışan kimliğiyle okunabilir bir organizasyon sırası kurdun.",
      ],
      whyItWorks:
        "Self JOIN fiziksel olarak tek tabloyu iki mantıksal veri kümesi gibi kullanır. Alias'lar ilişki yönünü görünür kılar; yabancı anahtar her çalışanı doğru yönetici satırına götürür.",
      edgeCases: [
        "Bir çalışanın manager_id değeri var olmayan bir kimliği gösterirse referans bütünlüğü yoksa satır eşleşmez; burada foreign key bunu engeller.",
        "Döngüsel yönetici ilişkileri tek seviyeli görünümde yine satır üretebilir; hiyerarşinin tamamını yürümek ayrıca döngü kontrolü gerektirir.",
      ],
      workplaceImpact:
        "Aynı desen kategori-aile, hesap-üst hesap ve lokasyon-üst lokasyon gibi öz referanslı ana verileri raporlamada kullanılır.",
      transfer: {
        prompt:
          "Yöneticisi olmayan çalışanları da 'Üst yönetici yok' etiketiyle korumak istersen çalışan tarafını koruyan hangi ilişki davranışına geçersin?",
        reveal:
          "Çalışan kümesini solda koruyan dış birleşim seçilir; eşleşmeyen yönetici adı daha sonra iş etiketine dönüştürülür.",
      },
    },
  },
  "m5-t4": {
    learningBrief: {
      conceptAnchor:
        "Bir ilişkinin benzersizliğini oluşturan tüm anahtar parçalarını JOIN koşuluna taşıyarak cardinality'yi korumak.",
      outputGrain:
        "Her sonuç satırı tek bir sipariş satırını kendi şirketindeki SKU fiyatıyla değerlenmiş olarak temsil eder.",
      acceptanceChecks: [
        "5201–5204 arasındaki dört line_id sonuçta tam birer kez görünmeli.",
        "Aynı SKU farklı şirketlerde kendi unit_price değeriyle eşleşmeli.",
        "line_total quantity ile doğru şirket fiyatının çarpımı olmalı ve satırlar line_id artan sırada gelmeli.",
      ],
      dataNotes: [
        "SKU-A ve SKU-B katalogda iki farklı company_id için tekrar eder; sku tek başına eşleşme anahtarı değildir.",
        "5201 ile 5203 farklı SKU'lar ve miktarlar taşımasına rağmen line_total değeri 200'e eşit olur; bu bağ meşru bir sonuç eşitliğidir, duplicate satır değildir.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Bileşik ilişkinin iki koşulunu aynı JOIN sınırında kur",
        checks: [
          "order_lines ve catalog_prices için kullandığın alias'ların company_id, sku, quantity ve unit_price referanslarıyla uyumlu olduğunu kontrol et.",
          "company_id ve sku eşitliklerini tek JOIN koşulunda AND ile bağladığını doğrula.",
        ],
      },
      "columns-wrong": {
        title: "Sipariş satırı sözleşmesindeki dört kolonu düzelt",
        checks: [
          "Kolonların line_id, company_id, sku, line_total sırasını izlediğini doğrula.",
          "Çarpım sonucuna line_total alias'ı verdiğini ve unit_price ya da quantity ham kolonlarını fazladan döndürmediğini kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Kısmi anahtarın ürettiği çapraz şirket eşleşmesini engelle",
        checks: [
          "Her line_id yalnız aynı company_id ve aynı sku değerine sahip fiyat satırıyla eşleşiyor mu kontrol et.",
          "Dört giriş satırının sekiz sonuca çoğalmadığını ve şirket 2 fiyatlarının şirket 1 siparişlerine taşınmadığını doğrula.",
        ],
      },
      "order-wrong": {
        title: "Dosyayı sipariş satırı kimliğiyle sabitle",
        checks: [
          "Sıralama anahtarının sku, company_id veya line_total yerine line_id olduğunu kontrol et.",
          "Artan yönün 5201, 5202, 5203, 5204 dizisini verdiğini doğrula.",
        ],
      },
      "required-concept-missing": {
        title: "INNER JOIN ve iki parçalı anahtarı açıkça kullan",
        checks: [
          "İki tabloyu INNER JOIN ile bağladığını kontrol et.",
          "JOIN koşulunda company_id ile sku eşitliklerinin ikisinin de AND aracılığıyla yer aldığını doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "Katalog fiyatının benzersiz tanımının company_id ve sku birleşimi olduğunu belirledin.",
        "Sipariş satırını fiyat satırına iki anahtar parçasını birlikte kullanarak bağladın.",
        "Doğru birim fiyat ile miktarı çarpıp her line_id için tek değerlenmiş satır ürettin.",
      ],
      whyItWorks:
        "Bileşik anahtarın tamamı kullanıldığında her sipariş satırı katalogda en fazla bir fiyatla eşleşir. Anahtarın yalnız sku parçası kullanılsaydı aynı SKU'nun diğer şirket fiyatı da eşleşerek satırları çoğaltırdı.",
      edgeCases: [
        "Yeni bir şirket aynı SKU'yu kataloğa eklediğinde tam bileşik eşleşme sonuç cardinality'sini değiştirmez.",
        "Fiyat geçmişi tarih aralığıyla tutulmaya başlanırsa company_id ve sku artık tek başına benzersiz olmayabilir; geçerli dönem de ilişki koşuluna katılmalıdır.",
      ],
      workplaceImpact:
        "Tenant, mağaza, para birimi veya dönem bağlamlı tabloları birleştirirken tam iş anahtarını kullanmak yanlış fiyat ve çift sayım hatalarını önler.",
      transfer: {
        prompt:
          "Katalog anahtarı company_id, sku ve currency_code olarak genişleseydi JOIN'in güvenli kalması için ne değişirdi?",
        reveal:
          "Sipariş satırı para birimi bağlamını da taşımalı ve üçüncü anahtar eşitliği diğer ikisiyle birlikte ilişki koşuluna eklenmelidir.",
      },
    },
  },
  "m5-t1": {
    learningBrief: {
      conceptAnchor:
        "LEFT JOIN'de sağ tablo filtresinin yerini seçerek ana listedeki eşleşmeyen varlıkları korumak.",
      outputGrain:
        "Her sonuç satırı bir müşteriyi ve yalnız completed siparişlerinden oluşan toplam harcamasını temsil eder.",
      acceptanceChecks: [
        "Dört müşterinin tamamı, hiç completed siparişi olmasa bile sonuçta görünmeli.",
        "Atlas Retail 1650, Mavi Market 820; Ada Tekstil ve Kuzey Kafe 0 toplamla dönmeli.",
        "Satırlar total_spend değerine göre azalan; eşit toplamda customer_name değerine göre artan sırada olmalı.",
      ],
      dataNotes: [
        "Kuzey Kafe'nin hiç siparişi yoktur; Ada Tekstil'in ise yalnız cancelled siparişi vardır. İki farklı eksiklik durumu da completed toplamında 0 üretmelidir.",
        "Atlas Retail'in iki completed siparişi tekrar eden müşteri satırları oluşturur; bunlar tek müşteri toplamında birleşmelidir. Ada ile Kuzey'in 0 değerleri ayrıca bir sıralama bağı oluşturur.",
      ],
    },
    coaching: {
      "execution-error": {
        title:
          "Korunan müşteri kümesi ile sipariş filtresinin yerini kontrol et",
        checks: [
          "customers tablosunun LEFT JOIN'in korunan tarafında bulunduğunu doğrula.",
          "completed koşulunu ilişki koşulunda, toplamı sıfıra çeviren işlevi aggregate sonucunda doğru parantezlerle kullandığını kontrol et.",
        ],
      },
      "columns-wrong": {
        title: "CRM özetini iki kolonlu sözleşmeye indir",
        checks: [
          "Kolonların customer_name ve total_spend sırasını izlediğini doğrula.",
          "Toplam ifadesinin total_spend alias'ını taşıdığını ve customer_id ya da status kolonlarının sonuçta kalmadığını kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Siparişsiz ve yalnız iptalli müşterileri sonuçta tut",
        checks: [
          "completed koşulunu WHERE bölümüne koyarak Kuzey Kafe ile Ada Tekstil'i yanlışlıkla elemediğini kontrol et.",
          "NULL aggregate sonucunu 0'a çevirdiğini ve Ada'nın cancelled 2100 tutarını toplam harcamaya eklemediğini doğrula.",
        ],
      },
      "order-wrong": {
        title: "Müşterileri tamamlanmış harcama önceliğine göre sırala",
        checks: [
          "Ana sıralama anahtarının total_spend ve yönünün azalan olduğunu kontrol et.",
          "Eşit 0 toplamlı Ada Tekstil ile Kuzey Kafe için ikinci anahtarın customer_name ve yönünün artan olduğunu doğrula.",
        ],
      },
      "required-concept-missing": {
        title: "Müşteri kapsamını LEFT JOIN ile koru",
        checks: [
          "Ana müşterilerden hiçbirini düşürmemek için LEFT JOIN kullandığını kontrol et.",
          "Siparişleri müşteri seviyesinde toplamak için SUM ve GROUP BY kavramlarının yer aldığını doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "Tüm customers satırlarını raporun ana kümesi olarak korudun.",
        "Yalnız completed orders satırlarının eşleşmesine izin vererek iptal hareketini toplam dışında bıraktın.",
        "Müşteri seviyesinde topladın, eksik aggregate sonucunu 0'a çevirdin ve eşitlikleri müşteri adıyla deterministik sıraladın.",
      ],
      whyItWorks:
        "Sağ tablo filtresi JOIN koşulunda kaldığında LEFT JOIN eşleşmeyen müşteriler için boş bir sağ taraf üretmeye devam eder. Aggregate sonrası NULL değerini 0 yapmak, 'veri yok' durumunu bu iş bağlamındaki 'completed harcama yok' anlamına dönüştürür.",
      edgeCases: [
        "Bir müşterinin hem completed hem cancelled siparişleri varsa yalnız completed tutarlar toplanır, müşteri yine tek satır kalır.",
        "Eşit total_spend değerlerinde customer_name ikinci anahtarı kaldırılırsa bağ sırası tekrar çalıştırmalarda değişebilir.",
      ],
      workplaceImpact:
        "Müşteri, çalışan veya ürün ana listesini aktivite verisiyle birleştirirken sıfır aktiviteli varlıkları korumak kapsam ve dönüşüm oranlarını doğru tutar.",
      transfer: {
        prompt:
          "Aynı raporda completed harcamanın yanında tüm sipariş adedini de göstermek istersen cancelled satırları kaybetmeden iki metriği nasıl farklılaştırırsın?",
        reveal:
          "İlişki tüm siparişleri korur; completed tutar yalnız kendi koşullu aggregate'ında seçilirken toplam sipariş adedi ayrı bir metrik olarak hesaplanır.",
      },
    },
  },
};
