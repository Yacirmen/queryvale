import type { LessonLearningContent } from "../types/lesson";

export const MODULE_9_EXPANSION_LEARNING_CONTENT: Readonly<
  Record<string, LessonLearningContent>
> = {
  "m9-t2": {
    learningBrief: {
      conceptAnchor:
        "SCD Type 2 boyutunda aynı müşteri kimliği birden fazla tarihsel satırda bulunabilir; güncel görünüm, geçmişi tekilleştirerek değil valid_to değeri NULL olan açık kaydı seçerek kurulur.",
      outputGrain:
        "Her sonuç satırı, güncel segment kaydı bulunan tek bir customer_id müşterisini ve o kaydın başladığı tarihi temsil eder.",
      acceptanceChecks: [
        "Çıktı customer_id, segment ve valid_from kolonlarını tam olarak bu sırada içermeli.",
        "Her customer_id en fazla bir kez görünmeli ve yalnız valid_to değeri NULL olan boyut satırından gelmeli.",
        "Kapanmış geçmiş kayıtlar ile artık güncel kaydı bulunmayan müşteri sonuç dışında kalmalı; satırlar customer_id artan sırada gelmeli.",
      ],
      dataNotes: [
        "customer_key fiziksel boyut satırını, customer_id ise zaman içinde aynı kalan iş varlığını tanımlar; aynı customer_id için birden fazla customer_key görülmesi SCD geçmişinin beklenen sonucudur.",
        "En yeni valid_from değerini seçmek, güncel kayıt garantisi vermez: bir müşterinin bütün dönemleri kapanmış olabilir. Bu görevde güncellik sözleşmesi açıkça valid_to IS NULL koşuludur.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Boyut kolonlarını ve NULL koşulunu yeniden kur",
        checks: [
          "Kaynak tablonun dim_customer; iş anahtarının customer_id, dönem alanlarının valid_from ve valid_to olduğunu şemadan doğrula.",
          "NULL değerini eşitlik operatörüyle karşılaştırmadığını ve filtre ile sıralama bölümlerini doğru SQL sırasına yerleştirdiğini kontrol et.",
        ],
      },
      "columns-wrong": {
        title: "Güncel segment sözleşmesini üç iş alanıyla sınırla",
        checks: [
          "İlk kolonun customer_id, ikinci kolonun segment, üçüncü kolonun valid_from olduğunu doğrula.",
          "Filtreyi kurmak için kullanılan valid_to ile fiziksel customer_key alanlarının son çıktıya sızmadığını kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Geçmiş satır ile açık satırı birbirinden ayır",
        checks: [
          "Her dönen kaydın valid_to değerinin gerçekten NULL olduğunu ve kapanış tarihi bulunan eski segmentlerin elendiğini doğrula.",
          "Yalnız MAX(valid_from) ya da DISTINCT kullanarak müşteri başına satır seçmediğini kontrol et; hiç açık kaydı kalmayan müşteri bu yöntemlerle yanlışlıkla geri gelebilir.",
        ],
      },
      "order-wrong": {
        title: "Müşteri görünümünü iş anahtarına göre sırala",
        checks: [
          "Birincil sıralama anahtarının surrogate customer_key değil customer_id olduğunu doğrula.",
          "Sıralama yönünün artan olduğunu ve metin segmentinin sonuç sırasını belirlemediğini kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "Güncelliği SCD dönem sözleşmesiyle ifade et",
        checks: [
          "Belirli customer_key değerlerini elle seçmek yerine açık dönem göstergesi olan valid_to IS NULL koşulunu kullandığını doğrula.",
          "Tarihsel satırları gruplama veya tekrar silme problemi gibi ele alma; burada hedef, her iş varlığının geçerli boyut sürümünü dönem alanından bulmaktır.",
        ],
      },
    },
    debrief: {
      steps: [
        "Önce customer_key ile customer_id rollerini ayırarak fiziksel satır tanesi ile iş varlığı tanesini belirledin.",
        "valid_to değeri NULL olan açık dönemleri seçip kapanmış segment geçmişini sonuç dışında bıraktın.",
        "Güncel kaydı bulunan müşterileri customer_id tanesinde ve deterministik sırada teslim ettin.",
      ],
      whyItWorks:
        "SCD Type 2 modeli değişen niteliği eski satırı ezmeden yeni bir satır açarak saklar. Açık dönemi valid_to IS NULL ile seçmek, en son görünen satırı tahmin etmek yerine modelin geçerlilik sözleşmesini doğrudan uygular.",
      edgeCases: [
        "Aynı customer_id için birden fazla valid_to NULL satırı varsa sorgu iki kayıt döndürür; bu bir sorgu tekilleştirme ihtiyacından önce boyut veri kalitesi ihlalidir.",
        "Belirli bir geçmiş tarih için segment istenirse yalnız NULL kontrolü yeterli olmaz; valid_from ve valid_to sınırları o referans tarihi kapsayacak biçimde değerlendirilmelidir.",
      ],
      workplaceImpact:
        "Güncel boyut sürümünü doğru seçmek CRM listelerinde eski segmentle iletişim kurulmasını, raporlarda aynı müşterinin iki kez sayılmasını ve tarihsel durumun güncel gerçeklik sanılmasını önler.",
      transfer: {
        prompt:
          "30 Haziran 2026 tarihindeki müşteri segmenti istense güncel kayıt filtresini hangi geçerlilik aralığına dönüştürürdün?",
        reveal:
          "valid_from değeri referans tarihten küçük veya eşit olmalı; valid_to ise referans tarihten büyük olmalı ya da dönem hâlâ açıksa NULL olmalıdır. Böylece o tarihte gerçekten geçerli olan sürüm seçilir.",
      },
    },
  },
  "m9-t3": {
    learningBrief: {
      conceptAnchor:
        "Yetim fact kaydı, fact kümesini LEFT JOIN ile eksiksiz koruyup boyut tarafında eşleşme oluşmayan anahtarları IS NULL ile seçen anti-join deseniyle görünür olur.",
      outputGrain:
        "Her sonuç satırı, dim_product içinde karşılığı bulunmayan tek bir staging satış olayını temsil eder.",
      acceptanceChecks: [
        "Çıktı sale_key, product_key ve revenue_amount kolonlarını bu sırada içermeli.",
        "Bilinçli olarak eklenen iki yetim satış olayı dönmeli; geçerli ürün anahtarına sahip satışlar sonuçta bulunmamalı.",
        "Her fact olayı en fazla bir kez görünmeli ve satırlar sale_key değerine göre artan sıralanmalı.",
      ],
      dataNotes: [
        "Staging fact_sales tablosunda foreign key kısıtı özellikle yoktur; üretim hattından gelen geçersiz product_key değerlerini sorguyla denetleyebilmek için bu kalite hatası fixture'da korunur.",
        "Eşleşmeyi fact tarafındaki product_key alanının NULL olup olmadığıyla değil, LEFT JOIN sonrasında boyut tarafındaki ürün anahtarının NULL kalmasıyla test etmek gerekir.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Fact ve boyut alias'larını anahtar yoluyla hizala",
        checks: [
          "fact_sales ile dim_product tablo adlarını ve iki tablodaki product_key kolonlarını şemadaki yazımlarıyla kullandığını doğrula.",
          "LEFT JOIN eşleşme koşulunun ON bölümünde, eşleşmeyen boyut kontrolünün ise sonraki filtre bölümünde bulunduğunu kontrol et.",
        ],
      },
      "columns-wrong": {
        title: "Kalite kuyruğuna yalnız fact kanıtını taşı",
        checks: [
          "Kolonların sale_key, product_key ve revenue_amount sırasını izlediğini doğrula.",
          "Boyut tablosundaki ürün adı veya kontrol amaçlı boyut anahtarını son çıktıya eklemediğini; üç alanı fact alias'ından aldığını kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Korunan tarafı ve NULL testinin tarafını kontrol et",
        checks: [
          "Sorgunun fact_sales kümesinden başladığını ve INNER JOIN kullanarak yetim satırları eşleşme anında kaybetmediğini doğrula.",
          "NULL koşulunu fact_sales.product_key üzerinde değil, eşleşme bulunmadığında boş kalan dim_product anahtarı üzerinde uyguladığını kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Kalite kayıtlarını olay anahtarına göre sırala",
        checks: [
          "ORDER BY anahtarının product_key veya revenue_amount değil sale_key olduğunu doğrula.",
          "İki yetim olayın sale_key değerine göre küçükten büyüğe geldiğini kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "Eşleşmeyeni LEFT JOIN anti-join deseniyle kanıtla",
        checks: [
          "Fact olaylarını koruyan LEFT JOIN kullandığını ve eşleşme yokluğunu sağ tablodaki anahtarın IS NULL durumu üzerinden gösterdiğini doğrula.",
          "Geçersiz ürün anahtarlarını sabit bir listeyle yazmak yerine boyut tablosunun gerçek kapsamına göre dinamik olarak tespit et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Denetlenecek tam olay kümesi olarak staging fact_sales tablosunu seçtin.",
        "Her product_key değerini dim_product anahtarına LEFT JOIN ile bağlayarak geçerli ve eşleşmeyen olayları aynı ara kümede korudun.",
        "Boyut tarafı NULL kalan iki olayı kalite kuyruğuna ayırıp sale_key sırasıyla teslim ettin.",
      ],
      whyItWorks:
        "LEFT JOIN soldaki fact satırını boyut eşleşmesi bulunmasa da tutar. Boyutun benzersiz anahtarı bu durumda NULL kaldığı için IS NULL filtresi yalnız referans karşılığı olmayan olayları güvenilir biçimde ayırır.",
      edgeCases: [
        "dim_product.product_key benzersiz değilse geçerli bir fact olayı birden fazla boyut satırıyla eşleşebilir; anti-join yetimleri bulsa da bu ayrı cardinality ihlalini tek başına ölçmez.",
        "Fact product_key alanının kendisi NULL olabiliyorsa bunun 'bilinmeyen ürün' boyutuna mı bağlanacağı yoksa kalite hatası mı sayılacağı ayrı bir modelleme kararıdır.",
      ],
      workplaceImpact:
        "Yetim anahtarları rapor aggregation'ından önce ayırmak, satışların sessizce kaybolmasını ve fact toplamı ile boyut kırılımlı toplam arasında açıklanamayan mutabakat farkı oluşmasını önler.",
      transfer: {
        prompt:
          "Aynı kontrolü müşteri boyutu için kurarken hangi tabloyu korur, hangi anahtarın NULL kalmasını beklersin?",
        reveal:
          "Satış fact kümesini yine solda korur, customer_key üzerinden müşteri boyutuna bağlanır ve eşleşme bulunmayan satırlarda boyut tarafındaki customer_key alanının NULL kalmasını test edersin.",
      },
    },
  },
  "m9-t4": {
    learningBrief: {
      conceptAnchor:
        "Eksiksiz rapor kapsamı fact tablosundan kendiliğinden çıkmaz; önce hafta ve kanal boyutlarının 2 × 3 kapsam omurgası kurulur, fact verisi kendi tanesinde özetlenir ve bu omurgaya opsiyonel olarak bağlanır.",
      outputGrain:
        "Her sonuç satırı tek bir week_start ve channel_name birleşimi için sipariş sayısı ile geliri temsil eder; olay bulunmayan birleşimler de ayrı satırdır.",
      acceptanceChecks: [
        "İki hafta ile üç kanalın bütün birleşimlerini kapsayan tam altı satır bulunmalı.",
        "Çıktı week_start, channel_name, order_count ve revenue kolonlarını bu sırada içermeli; boş birleşimlerde son iki değer 0 olmalı.",
        "Satırlar önce week_start, aynı hafta içinde channel_name artan sırada gelmeli ve fact'teki çoklu siparişler ilgili hafta-kanal satırında yalnız bir kez toplanmalı.",
      ],
      dataNotes: [
        "Bir hafta-kanal birleşiminin fact_orders içinde hiç satırının olmaması, o birleşimin rapor kapsamından çıkarılması değil ölçüsünün sıfır olması anlamına gelir.",
        "Fact verisini omurgaya ham satırlarla bağlamak aynı birleşim için birden fazla sonuç satırı veya çoğalan ölçü üretebilir; önce hafta-kanal tanesinde toplamak cardinality'yi sabitler.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Kapsam, özet ve final join adımlarını ayrı ayrı doğrula",
        checks: [
          "Hafta ve kanal kapsamını üreten CTE ile fact özetini üreten CTE'nin adlarını ve kolon alias'larını dış sorgudaki başvurularla karşılaştır.",
          "CROSS JOIN, GROUP BY ve LEFT JOIN bölümlerinin kendi SQL adımlarında bulunduğunu; week_start veri tiplerinin eşleştiğini kontrol et.",
        ],
      },
      "columns-wrong": {
        title: "Haftalık martın dört alanlı sözleşmesini koru",
        checks: [
          "İlk iki kolonun omurgadan gelen week_start ve channel_name, sonraki kolonların order_count ve revenue olduğunu doğrula.",
          "Teknik channel_id, CTE içi anahtarlar veya kontrol amaçlı ham order_id alanlarının final çıktıda bulunmadığını kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Altı kapsam satırını ve fact tanesini yeniden say",
        checks: [
          "CROSS JOIN sonucunun iki hafta × üç kanal ile altı benzersiz kapsam satırı ürettiğini doğrula.",
          "Fact'i önce week_start ve channel_id tanesinde özetlediğini, sonra her iki anahtar üzerinden omurgaya bağladığını ve eşleşmeyen ölçüleri COALESCE ile sıfıra çevirdiğini kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Zamanı önce, kanalı sonra sırala",
        checks: [
          "Birincil sıralamanın week_start artan, ikincil sıralamanın channel_name artan olduğunu doğrula.",
          "Sıfır gelirli satırları alta iten revenue sıralaması kullanmadığını; raporun zaman-kanal matrisini koruduğunu kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "Eksiksiz kapsamı fact'ten değil boyut omurgasından üret",
        checks: [
          "Başlangıç kümesinin yalnız fact_orders olmadığını; hafta ve kanal boyutlarını CROSS JOIN ederek beklenen bütün rapor hücrelerini kurduğunu doğrula.",
          "Ham fact'i doğrudan bağlamak yerine CTE içinde hafta-kanal tanesinde topladığını ve bu özeti kapsama LEFT JOIN ile eklediğini kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "İki hafta ile üç kanal boyutunu CROSS JOIN ederek altı hücrelik rapor kapsamını olaylardan bağımsız tanımladın.",
        "Siparişleri week_start ve channel_id tanesinde önceden toplayarak her kapsam hücresi için en fazla bir fact özeti ürettin.",
        "Özeti omurgaya LEFT JOIN ile ekledin, eksik ölçüleri sıfıra çevirdin ve zaman-kanal düzeninde sıraladın.",
      ],
      whyItWorks:
        "CROSS JOIN hangi hücrelerin raporda bulunması gerektiğini, preaggregation ise fact'in hangi tanede bağlanacağını belirler. LEFT JOIN bu kapsamı korur; COALESCE de eşleşme yokluğunu ölçüsel sıfıra dönüştürür. Böylece 'satır yok' ile 'değer sıfır' birbirine karışmaz.",
      edgeCases: [
        "Hafta veya kanal boyutunda yinelenen anahtar bulunursa kapsam omurgası altıdan fazla satıra çıkar ve ölçüler çoğalabilir; boyut benzersizliği bu desenin ön koşuludur.",
        "Geç gelen bir sipariş daha sonra fact'e eklendiğinde aynı hafta-kanal satırı sıfırdan gerçek ölçüye dönüşür; mart yenilemesi bu değişimi idempotent biçimde yeniden hesaplamalıdır.",
      ],
      workplaceImpact:
        "Eksiksiz kapsam omurgası, grafiklerde boş kategorilerin kaybolmasını, sıfır aktivitenin yanlışlıkla veri eksikliği sanılmasını ve haftalar arası karşılaştırmanın farklı satır kümeleri üzerinde yapılmasını önler.",
      transfer: {
        prompt:
          "Aynı yaklaşım aylık ürün-kategori stok raporuna taşınsa kapsam omurgasını ve preaggregation tanesini nasıl değiştirirdin?",
        reveal:
          "Kapsamı rapor ayları ile beklenen ürün kategorilerinin birleşiminden kurar, stok olaylarını ay-kategori tanesinde özetler ve bu özeti omurgaya opsiyonel bağlayarak olaysız hücreleri sıfırla korurdun.",
      },
    },
  },
};
