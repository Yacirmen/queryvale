import type { LessonLearningContent } from "../types/lesson";

export const TASK_LEARNING_CONTENT: Readonly<
  Record<string, LessonLearningContent>
> = {
  "m1-t1": {
    learningBrief: {
      conceptAnchor:
        "SELECT listesini, raporun veri sözleşmesi gibi düşün: hangi kolonları hangi sırada yazarsan çıktı da o yapıda oluşur.",
      outputGrain:
        "Her satır katalogdaki tek bir ürünü; her ürün de sonuçta tam bir kez temsil eder.",
      acceptanceChecks: [
        "Çıktıda önce product_name, sonra category kolonu bulunmalı.",
        "Altı ürünün tamamı korunmalı; filtreleme veya tekilleştirme yapılmamalı.",
        "İstenen iki kolon dışında ürün kimliği, fiyat ya da stok bilgisi dönmemeli.",
      ],
      dataNotes: [
        "Furniture ve Stationery kategorileri birden fazla üründe tekrar eder.",
        "Bu görevde satır sırası değerlendirme ölçütü değildir.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Katalog sözleşmesindeki iki kolona odaklan",
        checks: [
          "Şema panelinden kolon adlarının product_name ve category olduğunu doğrula.",
          "SELECT listendeki kolon sırasını görevde istenen çıktı sırasıyla karşılaştır.",
        ],
      },
      "rows-wrong": {
        title: "Katalogdaki bütün ürünleri koru",
        checks: [
          "Sonucu azaltan WHERE, DISTINCT veya LIMIT kullanıp kullanmadığını kontrol et.",
          "Veri kaynağının products tablosu olduğundan ve altı satır döndüğünden emin ol.",
        ],
      },
      "order-wrong": {
        title: "Bu raporda satır sırası serbest",
        checks: [
          "Görev satır sırasını istemediği için ORDER BY eklemek zorunda değilsin.",
          "Sorunun kolon sırası ile satır sırasını karıştırmaktan kaynaklanmadığını kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "Veriyi doğrudan seçerek getir",
        checks: [
          "Sonuç kümesini products tablosundan bir SELECT ifadesiyle ürettiğini doğrula.",
          "İki hedef kolonu açıkça seç; tüm kolonları kapsayan kısayola dayanma.",
        ],
      },
      "execution-error": {
        title: "İlk katalog sorgunun sözdizimini toparla",
        checks: [
          "SELECT, kolon listesi ve FROM bölümlerinin doğru sırada olduğuna bak.",
          "Kolonlar arasındaki virgülü ve products tablo adının yazımını kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "İş talebindeki iki çıktı alanını belirle.",
        "Bu alanların products şemasındaki karşılıklarını seç.",
        "Satırları değiştirmeden seçimin altı ürünü koruduğunu doğrula.",
      ],
      whyItWorks:
        "İstenen kolonları açıkça seçmek, sonuç kümesinin kapsamını değiştirmeden yalnızca görünür veri şeklini daraltır.",
      edgeCases: [
        "Yeni bir ürün eklendiğinde sorgu onu da otomatik olarak sonuçta gösterir.",
        "Bir kategori NULL olabilseydi satır yine korunur, category hücresi NULL görünürdü.",
      ],
      workplaceImpact:
        "Dar ve açık kolon seçimi ağ trafiğini azaltır, BI veri sözleşmesini anlaşılır tutar ve şema değişikliklerine karşı raporu daha güvenli yapar.",
      transfer: {
        prompt:
          "Bir müşteri tablosundan yalnızca müşteri adı ve şehir alanlarını içeren, tüm müşterileri koruyan bir dışa aktarım hazırlasan hangi iki kararı önce verirdin?",
        reveal:
          "Önce çıktı kolonlarını ve sıralarını belirler, sonra satırları azaltacak hiçbir koşul eklemeden doğru kaynak tablodan seçerdin.",
      },
    },
  },
  "m1-t2": {
    learningBrief: {
      conceptAnchor:
        "DISTINCT bir satır filtresi değil, seçilen kolon kombinasyonları üzerindeki tekrar giderme işlemidir.",
      outputGrain:
        "Her satır katalogda bulunan benzersiz bir kategoriyi temsil eder.",
      acceptanceChecks: [
        "Çıktı yalnızca category kolonunu içermeli.",
        "Home, Stationery, Furniture ve Lifestyle değerlerinin her biri bir kez görünmeli.",
        "Birden fazla ürüne sahip kategoriler sonuçta yinelenmemeli.",
      ],
      dataNotes: [
        "Furniture ve Stationery tekrar ettiği için ham kolon seçimi altı satır üretir.",
        "Kategori sırası bu görevde önemli değildir.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Tekilleştirme anahtarını yalnızca category yap",
        checks: [
          "SELECT listesinde category dışında bir kolon bulunmadığını kontrol et.",
          "product_name veya product_id eklersen kombinasyonların benzersizleşeceğini hatırla.",
        ],
      },
      "rows-wrong": {
        title: "Tekrar eden kategorileri sonuç düzeyinde birleştir",
        checks: [
          "Sonuçta dört satır ve dört farklı kategori bulunduğunu say.",
          "DISTINCT anahtar kelimesinin seçilen category değerine uygulandığını doğrula.",
        ],
      },
      "order-wrong": {
        title: "Kategori sırası değil benzersizlik ölçülüyor",
        checks: [
          "ORDER BY kullanmasan da dört kategori doğru kabul edilir.",
          "Gördüğün farkın tekrar eden satırlardan mı, yalnızca görünüm sırasından mı geldiğini ayır.",
        ],
      },
      "required-concept-missing": {
        title: "Benzersizliği DISTINCT ile ifade et",
        checks: [
          "Tekrarları manuel koşullarla elemek yerine DISTINCT kullandığını kontrol et.",
          "DISTINCT'in SELECT listesindeki bütün kolon kombinasyonuna etki ettiğini hatırla.",
        ],
      },
      "execution-error": {
        title: "DISTINCT konumunu kontrol et",
        checks: [
          "DISTINCT'i SELECT anahtar kelimesinden sonra ve kolon adından önce konumlandır.",
          "category ve products adlarını şemadaki yazımlarıyla kullandığını doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "Filtre menüsünün tekilleştirme anahtarı olarak category alanını belirle.",
        "Yalnızca bu alanın benzersiz kombinasyonlarını iste.",
        "Dört farklı değerin tekrar olmadan döndüğünü doğrula.",
      ],
      whyItWorks:
        "Seçim listesi tek kolondan oluştuğu için DISTINCT aynı category değerine sahip ürün satırlarını tek sonuç satırında toplar.",
      edgeCases: [
        "Seçime product_name eklenirse her ürün-kategori çifti farklı olacağı için tekrarlar geri gelir.",
        "Birden fazla NULL kategori, DISTINCT sonucunda tek bir NULL satırı olarak görünür.",
      ],
      workplaceImpact:
        "Benzersiz boyut listeleri filtreler, seçim kutuları ve veri kalite profilleri için temel girdi sağlar.",
      transfer: {
        prompt:
          "Siparişlerden benzersiz şehir ve durum çiftleri istendiğinde DISTINCT hangi veri tanesini tekilleştirir?",
        reveal:
          "Tek bir kolonu değil, seçtiğin city-status kombinasyonunu; aynı şehir farklı durumlarda birden fazla kez görünebilir.",
      },
    },
  },
  "m1-t3": {
    learningBrief: {
      conceptAnchor:
        "LIMIT hangi satırların alınacağını tek başına belirlemez; önce ORDER BY ile öncelik kuralını kurmak gerekir.",
      outputGrain:
        "Her satır düşük stok önceliğine sahip tek bir ürünü temsil eder.",
      acceptanceChecks: [
        "Çıktı product_name ve stock_quantity kolonlarını bu sırayla içermeli.",
        "Yalnızca üç ürün dönmeli: stok miktarları 4, 7 ve 18 olan ürünler.",
        "Satırlar stock_quantity değerine göre küçükten büyüğe sıralanmalı.",
      ],
      dataNotes: [
        "Standing Desk en düşük, Notebook en yüksek stok miktarına sahiptir.",
        "Veri setinde eşit stok yoktur; gerçek veride eşitlik için ikinci sıralama anahtarı gerekebilir.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Tedarik listesinin iki kolonunu koru",
        checks: [
          "İlk kolonun ürün adı, ikinci kolonun stok miktarı olduğunu doğrula.",
          "Sıralama için kullandığın kolonun çıktıda doğru adla bulunduğunu kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Önce önceliklendir, sonra üç satıra indir",
        checks: [
          "LIMIT değerinin üç olduğunu ve sıralamadan sonra uygulandığını düşün.",
          "İlk üç stok değerinin 4, 7 ve 18 olup olmadığını kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Kritik stokları en düşükten başlat",
        checks: [
          "stock_quantity sıralama yönünün artan olduğunu doğrula.",
          "Sıralama ölçütünün ürün adı veya fiyat olmadığını kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "ORDER BY ve LIMIT görev paylaşımını koru",
        checks: [
          "Önceliği ORDER BY ile açıkça tanımladığını kontrol et.",
          "Sonuç boyutunu LIMIT ile üç satır olarak sınırladığını doğrula.",
        ],
      },
      "execution-error": {
        title: "Sorgu bölümlerinin sırasını düzelt",
        checks: [
          "ORDER BY bölümünün FROM'dan sonra, LIMIT bölümünün ise sıralamadan sonra geldiğine bak.",
          "stock_quantity adını şemadaki alt çizgisiyle doğru yazdığını kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Tedarik önceliğini en az stok olarak tanımla.",
        "Tüm ürünleri bu ölçüte göre artan sırala.",
        "Sıralanmış listenin ilk üç satırını seç ve kolon yapısını doğrula.",
      ],
      whyItWorks:
        "Sıralama kritik ürünleri listenin başına taşır; satır sınırı bundan sonra uygulandığında doğru üç ürün seçilir.",
      edgeCases: [
        "İki ürünün stoğu eşitse kararlı sonuç için product_id gibi ikinci bir sıralama alanı eklenir.",
        "Negatif stok veri kalitesi hatası olsa da artan sıralamada en üste çıkar ve incelemeyi tetikler.",
      ],
      workplaceImpact:
        "Doğru top-N kalıbı stok yenileme, en iyi müşteri ve en maliyetli olay gibi operasyonel kuyrukların temelidir.",
      transfer: {
        prompt:
          "En yüksek tutarlı beş faturayı seçerken sıralama yönü ve LIMIT hangi sırayla düşünülmeli?",
        reveal:
          "Önce tutarı azalan yönde sıralar, ardından sıralanmış kümeden ilk beş satırı alırsın.",
      },
    },
  },
  "m1-t4": {
    learningBrief: {
      conceptAnchor:
        "ORDER BY iş kullanıcısının okuma önceliğini veri sonucunun bir parçası haline getirir.",
      outputGrain:
        "Her satır bir ürünü ve o ürünün birim fiyatını temsil eder.",
      acceptanceChecks: [
        "product_name ve unit_price kolonları doğru sırada bulunmalı.",
        "Altı ürünün tamamı sonuçta kalmalı.",
        "349.90 en üstte, 6.50 en altta olacak biçimde fiyatlar azalan sıralanmalı.",
      ],
      dataNotes: [
        "Standing Desk en yüksek, Notebook en düşük fiyatlı üründür.",
        "Bu görevde satır sırası kabul koşulunun doğrudan parçasıdır.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Fiyat panosunun alanlarını yeniden eşleştir",
        checks: [
          "Ürün adı ile birim fiyat dışında kolon döndürmediğini kontrol et.",
          "unit_price kolonunun ikinci sırada olduğunu doğrula.",
        ],
      },
      "rows-wrong": {
        title: "Premium görünümde bütün kataloğu koru",
        checks: [
          "WHERE veya LIMIT nedeniyle ürün eksiltmediğinden emin ol.",
          "Sonuçta altı farklı ürün bulunduğunu kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Fiyat yönünü premiumdan erişebilire çevir",
        checks: [
          "ORDER BY ölçütünün unit_price olduğunu kontrol et.",
          "Azalan yönün açıkça belirtildiğini ve en yüksek fiyatın ilk satırda olduğunu doğrula.",
        ],
      },
      "required-concept-missing": {
        title: "İş önceliğini ORDER BY ile görünür kıl",
        checks: [
          "Motorun doğal satır sırasına güvenmek yerine ORDER BY kullandığını doğrula.",
          "Sıralama yönünü rapor talebindeki yüksekten düşüğe kuralıyla eşleştir.",
        ],
      },
      "execution-error": {
        title: "Fiyat sıralamasının sözdizimini kontrol et",
        checks: [
          "ORDER BY ifadesinin tablo kaynağından sonra geldiğini doğrula.",
          "unit_price ve azalan yön anahtar kelimesinin yazımını kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Panoda gösterilecek ürün ve fiyat alanlarını seç.",
        "Okuma önceliğini en yüksek fiyat olarak belirle.",
        "Altı satırın azalan fiyat düzenini uç değerlerle doğrula.",
      ],
      whyItWorks:
        "Azalan fiyat sıralaması, satır kaybetmeden premium ürünleri doğrudan karar vericinin görüş alanına taşır.",
      edgeCases: [
        "Aynı fiyatlı ürünlerde ikincil sıralama belirtilmezse kendi aralarındaki sıra garanti edilmez.",
        "NULL fiyatlar için ürün politikasına göre NULLS FIRST veya NULLS LAST kararı gerekebilir.",
      ],
      workplaceImpact:
        "Açık sıralama; fiyat panoları, risk listeleri ve öncelik kuyruklarında kullanıcıların aynı sonucu görmesini sağlar.",
      transfer: {
        prompt:
          "Bir destek kuyruğunu önce en yüksek öncelik, eşitlikte en eski kayıt olacak şekilde nasıl modellemeyi düşünürsün?",
        reveal:
          "ORDER BY içinde önce önceliği azalan, ardından oluşturulma zamanını artan yönde ikinci anahtar olarak tanımlarsın.",
      },
    },
  },
  "m2-t1": {
    learningBrief: {
      conceptAnchor:
        "WHERE, çıktı kolonlarını değil sonuç kümesine girecek satırları belirleyen iş kuralı katmanıdır.",
      outputGrain:
        "Her satır manuel finans kontrolüne girecek tek bir siparişi temsil eder.",
      acceptanceChecks: [
        "order_id, customer_name ve total_amount kolonları bu sırada dönmeli.",
        "500 dahil olmak üzere eşik üzerindeki siparişler seçilmeli.",
        "Sonuçta 201, 204 ve 206 numaralı üç sipariş bulunmalı.",
      ],
      dataNotes: [
        "Veri setinde tam 500 tutarlı sipariş yoktur; buna rağmen iş kuralı 500'ü kapsar.",
        "Sipariş durumu bu görevde filtre ölçütü değildir.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Finans kontrol listesinin üç alanını eşleştir",
        checks: [
          "Kimlik, müşteri adı ve tutar kolonlarının seçildiğini doğrula.",
          "Kolonların görevdeki sırayla döndüğünü kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "500 eşiğinin iki tarafını doğru ayır",
        checks: [
          "Karşılaştırmanın 500 değerini de kabul ettiğini kontrol et.",
          "Dönen tutarların 1240, 780 ve 1560 olduğunu; daha küçüklerin elendiğini doğrula.",
        ],
      },
      "order-wrong": {
        title: "Bu kontrolde satır sırası zorunlu değil",
        checks: [
          "Üç doğru sipariş farklı sıradaysa filtre mantığını değiştirme.",
          "Kolon sırası hatasını satır sırası hatasıyla karıştırmadığını kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "Eşik kuralını WHERE ve karşılaştırmayla kur",
        checks: [
          "Satır seçimini WHERE bölümünde ifade ettiğini doğrula.",
          "Eşitliği kapsayan karşılaştırma operatörünü kullandığını kontrol et.",
        ],
      },
      "execution-error": {
        title: "Tutar filtresindeki adları ve operatörü denetle",
        checks: [
          "total_amount kolonunu şemadaki alt çizgisiyle yazdığını doğrula.",
          "WHERE bölümünün orders kaynağından sonra geldiğini kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Manuel kontrol eşiğini ve dahil olma kuralını netleştir.",
        "Bu kuralı total_amount üzerinde satır filtresine dönüştür.",
        "Üç siparişin kolon ve tutarlarını kabul listesiyle karşılaştır.",
      ],
      whyItWorks:
        "Eşitliği kapsayan karşılaştırma, eşik değerindeki ve daha yüksek bütün siparişleri seçerek iş kuralını doğrudan veri düzeyinde uygular.",
      edgeCases: [
        "Tutar NULL olabilseydi karşılaştırma TRUE üretmez ve satır sonuç dışında kalırdı.",
        "Para birimleri farklıysa tek bir sayısal eşik uygulamadan önce ortak para birimine dönüşüm gerekir.",
      ],
      workplaceImpact:
        "Eşik filtreleri finansal onay, dolandırıcılık inceleme ve SLA önceliklendirme listelerini otomatikleştirir.",
      transfer: {
        prompt:
          "Stok miktarı 10 veya altında olan ürünleri seçmek için iş kuralındaki sınır nasıl düşünülmeli?",
        reveal:
          "'10 veya altında' ifadesi eşitliği kapsar; karşılaştırma yönünü metrik arttıkça riskin azalmasına göre kurarsın.",
      },
    },
  },
  "m2-t2": {
    learningBrief: {
      conceptAnchor:
        "IN aynı kolon için alternatifleri, AND ise farklı iş koşullarının aynı anda sağlanmasını ifade eder.",
      outputGrain:
        "Her satır hedef şehirlerden birinde bekleyen tek bir sipariştir.",
      acceptanceChecks: [
        "order_id, customer_name ve city kolonları bu sırada olmalı.",
        "Yalnızca Ankara veya Istanbul şehirleri kabul edilmeli.",
        "Şehir koşuluna ek olarak status kesinlikle pending olmalı; sonuç iki satır içermeli.",
      ],
      dataNotes: [
        "Istanbul'da pending olmayan siparişler de vardır; yalnızca şehir filtresi yeterli değildir.",
        "Ankara'daki completed sipariş şehir kümesine girse de durum koşulundan elenir.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Dağıtım listesinin üç görünür alanını koru",
        checks: [
          "Sipariş kimliği, müşteri adı ve şehir dışında kolon döndürmediğini kontrol et.",
          "status filtrede kullanılsa bile çıktıda istenmediğini hatırla.",
        ],
      },
      "rows-wrong": {
        title: "Şehir kümesi ile bekleme durumunu kesiştir",
        checks: [
          "Şehir seçeneklerini OR mantığıyla bir kümede, status kuralını ayrı koşulda ele al.",
          "İki koşul grubunun AND ile birleştiğini ve yalnızca 202 ile 207'nin kaldığını doğrula.",
        ],
      },
      "order-wrong": {
        title: "Dağıtım listesinde sıra serbest",
        checks: [
          "Deniz ve Lina satırları yer değiştirse de satır kümesinin aynı olduğunu kontrol et.",
          "Gereksiz bir sıralama kuralının sonucu sınırlamadığından emin ol.",
        ],
      },
      "required-concept-missing": {
        title: "Alternatifleri IN, ortak zorunluluğu AND ile anlat",
        checks: [
          "Şehirleri IN listesinde ifade ettiğini doğrula.",
          "pending koşulunun şehir kümesine AND ile bağlandığını kontrol et.",
        ],
      },
      "execution-error": {
        title: "Şehir listesinin noktalamasını denetle",
        checks: [
          "Metin değerlerinin tek tırnak içinde ve virgülle ayrılmış olduğunu kontrol et.",
          "IN listesinin parantezlerini ve status kolonunun yazımını doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "Alternatif şehirleri tek bir şehir koşulu altında grupla.",
        "Bekleyen durumunu bağımsız zorunlu koşul olarak ekle.",
        "Koşulların kesişiminde iki sipariş kaldığını doğrula.",
      ],
      whyItWorks:
        "IN şehirlerden herhangi birini kabul ederken AND yalnızca hem şehir kümesine giren hem pending olan satırları tutar.",
      edgeCases: [
        "Şehir adlarında farklı büyük-küçük harf kullanımı eşleşmeyi etkileyebilir.",
        "Boş bir IN listesi dinamik sorgu üretiminde sözdizimi hatasına yol açabileceğinden uygulama katmanında ele alınmalıdır.",
      ],
      workplaceImpact:
        "Küme ve kesişim mantığı bölgesel operasyon, ürün kapsamı ve müşteri segmenti filtrelerinin temelini oluşturur.",
      transfer: {
        prompt:
          "Gold veya Platinum segmentte olup aboneliği aktif müşterileri seçerken alternatif ve zorunlu koşullar nasıl ayrılır?",
        reveal:
          "İki segment bir IN kümesidir; aktif abonelik bu kümeyle AND üzerinden kesişen ayrı zorunluluktur.",
      },
    },
  },
  "m2-t3": {
    learningBrief: {
      conceptAnchor:
        "BETWEEN kapsayıcı bir aralıktır; tarih raporlarında başlangıç ve bitiş gününün dahil olup olmadığı iş sonucunu değiştirir.",
      outputGrain:
        "Her satır kampanya penceresinde alınmış tek bir sipariştir.",
      acceptanceChecks: [
        "order_id, ordered_at ve total_amount kolonları doğru sırada dönmeli.",
        "4 ve 7 Ocak sınır günleri dahil, toplam dört sipariş seçilmeli.",
        "Sonuç ordered_at değerine göre eski tarihten yeni tarihe sıralanmalı.",
      ],
      dataNotes: [
        "Veri her gün bir sipariş içerdiğinden sınır hatası satır sayısında hemen görünür.",
        "ordered_at DATE tipindedir; saat bileşeni yoktur.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Kampanya dışa aktarımının alanlarını hizala",
        checks: [
          "Kimlik, sipariş tarihi ve tutarı görevdeki sırayla seçtiğini kontrol et.",
          "delivered_at yerine ordered_at kullandığını doğrula.",
        ],
      },
      "rows-wrong": {
        title: "Tarih penceresinin iki sınırını da içeri al",
        checks: [
          "Başlangıç değerinin 4 Ocak, bitiş değerinin 7 Ocak olduğunu doğrula.",
          "BETWEEN'in sınırları kapsadığını ve dört satır döndüğünü kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Kampanya akışını kronolojik sıraya getir",
        checks: [
          "Sıralama kolonunun ordered_at olduğunu kontrol et.",
          "Artan yönle 4 Ocak satırının önce, 7 Ocak satırının son geldiğini doğrula.",
        ],
      },
      "required-concept-missing": {
        title: "Aralığı BETWEEN ile açıkça ifade et",
        checks: [
          "İki ayrı karşılaştırma yerine görevde istenen BETWEEN kavramını kullandığını doğrula.",
          "Kronolojik kabul koşulu için ORDER BY bölümünü de eklediğini kontrol et.",
        ],
      },
      "execution-error": {
        title: "Tarih sabitlerini PostgreSQL biçiminde denetle",
        checks: [
          "Tarih değerlerinin yıl-ay-gün düzeninde ve geçerli sabitler olduğunu kontrol et.",
          "BETWEEN ifadesindeki alt ve üst sınır arasında AND bulunduğunu doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "Kampanyanın kapsayıcı başlangıç ve bitiş tarihlerini belirle.",
        "ordered_at alanını bu aralıkla filtrele.",
        "Kalan dört siparişi tarih artan sırada ve doğru kolonlarla doğrula.",
      ],
      whyItWorks:
        "DATE tipindeki değerler kapsayıcı BETWEEN aralığıyla seçilir; kronolojik sıralama kampanya akışını kullanıcı için okunur hale getirir.",
      edgeCases: [
        "Kolon timestamp olsaydı bitiş gününün gece yarısı sonrası kayıtları için yarı açık aralık daha güvenli olabilirdi.",
        "Farklı saat dilimlerindeki olaylar raporlama gününe çevrilmeden filtrelenirse sınır kayıtları yanlış güne düşebilir.",
      ],
      workplaceImpact:
        "Doğru tarih pencereleri kampanya ölçümü, dönem sonu kapanışı ve SLA raporlarında eksik ya da fazla kayıt riskini azaltır.",
      transfer: {
        prompt:
          "Saat bilgisi içeren olaylarda tüm Ocak ayını seçmek için neden sonraki ayın ilk gününe kadar yarı açık aralık düşünülebilir?",
        reveal:
          "Alt sınırı dahil, Şubat'ın ilk anını hariç tutmak Ocak'ın tüm saatlerini kapsar ve yapay bir gün sonu saati yazmayı gerektirmez.",
      },
    },
  },
  "m2-t4": {
    learningBrief: {
      conceptAnchor:
        "NULL bir metin değeri değil bilinmeyen durumdur; IS NULL ile, metin içeriği ise LIKE deseniyle ayrı ayrı sınanır.",
      outputGrain:
        "Her satır takip gerektiren tek bir müşteri siparişini temsil eder.",
      acceptanceChecks: [
        "Çıktı customer_name ve status kolonlarını içermeli.",
        "Teslim tarihi NULL olan ve adında küçük e bulunan üç kayıt seçilmeli.",
        "Deniz, Ece ve Selin alfabetik sırada dönmeli.",
      ],
      dataNotes: [
        "LIKE karşılaştırması bu görevde büyük-küçük harfe duyarlıdır.",
        "NULL değer, boş metinle aynı değildir ve eşitlik operatörüyle yakalanmaz.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Müşteri takip listesini iki alana indir",
        checks: [
          "customer_name ve status kolonlarının bu sırada olduğunu doğrula.",
          "Filtrede kullanılan delivered_at kolonunu çıktıya yanlışlıkla eklemediğini kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Eksik teslimat ile ad desenini birlikte uygula",
        checks: [
          "Teslim tarihini IS NULL ile sınadığını, metin olarak 'NULL' aramadığını doğrula.",
          "LIKE deseninde e harfinin önünde ve arkasında joker bulunduğunu kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Takip listesini müşteri adına göre sırala",
        checks: [
          "ORDER BY alanının customer_name olduğunu doğrula.",
          "Artan yönde Deniz, Ece, Selin sırasını gördüğünü kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "NULL ve desen kontrollerini doğru araçlarla kur",
        checks: [
          "Eksik değeri IS NULL, ad parçasını LIKE ile kontrol ettiğini doğrula.",
          "İki zorunlu koşulun AND ile bağlandığını kontrol et.",
        ],
      },
      "execution-error": {
        title: "NULL ifadesi ve LIKE desenini gözden geçir",
        checks: [
          "IS NULL ifadesinde NULL çevresinde tırnak veya eşitlik operatörü olmadığını kontrol et.",
          "Metin deseninin tek tırnak ve yüzde jokerleriyle doğru kapatıldığını doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "Takip gerektiren eksik teslimat durumunu IS NULL ile tanımla.",
        "Müşteri adı desenini LIKE ile ikinci koşul olarak ekle.",
        "Kesişimde kalan üç adı alfabetik sırada doğrula.",
      ],
      whyItWorks:
        "IS NULL eksik teslimat bilgisini semantik olarak doğru yakalar; LIKE iki yana açık desenle adın herhangi bir yerindeki küçük e harfini bulur.",
      edgeCases: [
        "Boş metin teslimat değeri NULL sayılmaz; veri kalitesi kuralında ayrıca ele alınmalıdır.",
        "Aksan ve büyük-küçük harf gereksinimi varsa LIKE yerine uygun collation veya ILIKE politikası seçilebilir.",
      ],
      workplaceImpact:
        "Eksik değer ve desen kontrolleri veri kalite kuyrukları, müşteri iletişim listeleri ve istisna raporlarının sık kullanılan birleşimidir.",
      transfer: {
        prompt:
          "Telefonu eksik ve e-posta adresi şirket alan adıyla bitmeyen müşterileri ararken iki koşul nasıl farklı ele alınır?",
        reveal:
          "Eksik telefon IS NULL ile, alan adı deseni LIKE ile kontrol edilir; iş kuralındaki 've' ya da 'veya' ilişkisi ayrıca açıkça seçilir.",
      },
    },
  },
  "m3-t1": {
    learningBrief: {
      conceptAnchor:
        "Türetilmiş metrik, mevcut kolonlar arasındaki iş formülünün SELECT aşamasında hesaplanıp anlamlı bir alias ile adlandırılmasıdır.",
      outputGrain:
        "Her satır tek bir satış hareketinin hesaplanan brüt gelirini temsil eder.",
      acceptanceChecks: [
        "sale_id ve revenue kolonları bu sırada dönmeli.",
        "revenue her satırda quantity ile unit_price çarpımından hesaplanmalı.",
        "Altı satış korunmalı; örneğin 301 için 480, 304 için 1260 üretilmeli.",
      ],
      dataNotes: [
        "unit_price NUMERIC tipinde olduğu için hesap parasal hassasiyeti korur.",
        "Aynı temsilcinin birden fazla satırı vardır; bu görevde toplulaştırma yapılmaz.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Hesaplanan metriğe revenue sözleşmesini ver",
        checks: [
          "İlk kolonun sale_id, ikinci kolonun hesaplanan değer olduğunu doğrula.",
          "Hesaplanan kolona tam olarak revenue alias'ı verdiğini kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Her satış satırını ayrı hesapla",
        checks: [
          "GROUP BY, DISTINCT veya filtreyle altı hareketi azaltmadığını kontrol et.",
          "Her satırda quantity ve unit_price değerlerinin aynı kayıttan geldiğini doğrula.",
        ],
      },
      "order-wrong": {
        title: "Gelir hesabında satır sırası serbest",
        checks: [
          "Altı sale_id-gelir çifti doğruysa görünüm sırasının sonucu etkilemediğini hatırla.",
          "Sorunun revenue kolon adı veya değer hesabından kaynaklanmadığını kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "Geliri sorgu içinde hesapla ve adlandır",
        checks: [
          "quantity ile unit_price arasında matematiksel çarpma kullandığını doğrula.",
          "Türetilmiş ifadeyi AS ile revenue olarak adlandırdığını kontrol et.",
        ],
      },
      "execution-error": {
        title: "Matematiksel ifadenin parçalarını denetle",
        checks: [
          "quantity ve unit_price kolonlarının yazımını şemayla karşılaştır.",
          "Hesap ifadesinin SELECT listesinde virgülle sale_id'den ayrıldığını kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "İş metriğinin formülünü adet çarpı birim fiyat olarak belirle.",
        "Formülü her satış satırında hesapla ve revenue adıyla sözleşmeye bağla.",
        "Uç örneklerde 480 ve 1260 değerlerini, ardından altı satırın tamamını doğrula.",
      ],
      whyItWorks:
        "Satır düzeyindeki iki ölçü aynı kayıt bağlamında çarpılır; alias hesaplanan değeri sonraki rapor katmanları için anlaşılır hale getirir.",
      edgeCases: [
        "quantity veya unit_price NULL olursa çarpım da NULL olur; iş kuralına göre varsayılan gerekebilir.",
        "İndirim ve vergi varsa brüt gelir formülü net gelirle karıştırılmamalıdır.",
      ],
      workplaceImpact:
        "Satır düzeyi türetilmiş ölçüler BI modellerindeki gelir, maliyet ve marj hesaplarının doğrulanabilir temelini oluşturur.",
      transfer: {
        prompt:
          "Bir sipariş satırında net tutar, adet, liste fiyatı ve indirim oranından üretilecekse formülü ve alias'ı nasıl tasarlarsın?",
        reveal:
          "Önce indirimli birim değeri tanımlar, adetle çarpar ve iş sözlüğündeki net tutar adıyla açıkça etiketlersin.",
      },
    },
  },
  "m3-t2": {
    learningBrief: {
      conceptAnchor:
        "Metin dönüşümlerinde birleştirme okunur etiketi, UPPER ise sunum standardını oluşturur; işlem sırası sonucu belirler.",
      outputGrain:
        "Her satır bir satış hareketi ve standartlaştırılmış temsilci etiketidir.",
      acceptanceChecks: [
        "sale_id ve agent_name kolonları bu sırada dönmeli.",
        "Ad ile soyad arasında tam bir boşluk bulunmalı.",
        "Altı etiket büyük harf olmalı ve hareket satırları korunmalı.",
      ],
      dataNotes: [
        "Ada Kaya ve Eren Aydin birden fazla satışta tekrar eder; görev etiketi tekilleştirmez.",
        "Örnek adlarda NULL yoktur; gerçek veride NULL birleştirme davranışı ayrıca tasarlanmalıdır.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Temsilci etiketini agent_name altında sun",
        checks: [
          "İlk kolonun sale_id, ikinci kolonun birleşik metin olduğunu doğrula.",
          "Birleşik ifadeye agent_name alias'ı verdiğini kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Etiketi satış hareketi tanesinde üret",
        checks: [
          "Tekrarlanan temsilcileri DISTINCT ile elemediğini kontrol et.",
          "Her sale_id için bir etiket olacak biçimde altı satırı koruduğunu doğrula.",
        ],
      },
      "order-wrong": {
        title: "Etiket görevinde sıra kabul ölçütü değil",
        checks: [
          "Doğru sale_id-agent_name çiftlerinin sırasından bağımsız eşleştiğini kontrol et.",
          "Eklediğin gereksiz sıralamanın satırları sınırlamadığından emin ol.",
        ],
      },
      "required-concept-missing": {
        title: "Birleştirme ve büyük harf dönüşümünü birlikte uygula",
        checks: [
          "Ad, boşluk ve soyadı tek metin ifadede birleştirdiğini doğrula.",
          "Birleşmiş sonuca büyük harf fonksiyonu uyguladığını kontrol et.",
        ],
      },
      "execution-error": {
        title: "Metin sabiti ve birleştirme operatörünü kontrol et",
        checks: [
          "Aradaki boşluğun tek tırnak içinde geçerli bir metin sabiti olduğunu doğrula.",
          "agent_first_name ve agent_last_name kolon adlarını şemayla karşılaştır.",
        ],
      },
    },
    debrief: {
      steps: [
        "Etiket parçalarını ad, boşluk ve soyad sırasıyla belirle.",
        "Parçaları birleştirip tüm sonucu büyük harfe dönüştür.",
        "Her satış satırının agent_name alias'ıyla korunduğunu doğrula.",
      ],
      whyItWorks:
        "Birleştirme parçaları tek gösterim değerine çevirir; dıştaki büyük harf dönüşümü tüm etikete aynı standardı uygular.",
      edgeCases: [
        "Ad veya soyad NULL ise kullanılan birleştirme yöntemine göre tüm sonuç NULL olabilir.",
        "Türkçe i/İ gibi karakterlerin dönüşümü veritabanı locale ayarından etkilenebilir.",
      ],
      workplaceImpact:
        "Standart etiketler rapor görünümünü iyileştirir; ancak kalıcı anahtar yerine yalnızca sunum alanı olarak kullanılmalıdır.",
      transfer: {
        prompt:
          "Şube kodu ve adından 'KOD — ŞUBE' biçiminde bir etiket üretirken hangi veri kalite kontrollerini eklersin?",
        reveal:
          "NULL ve boş değerleri ele alır, ayırıcıyı yalnızca iki parça da uygunsa kullanır ve kimlik için yine şube anahtarını korursun.",
      },
    },
  },
  "m3-t3": {
    learningBrief: {
      conceptAnchor:
        "Tarih biçimlendirme, zaman değerini değiştirmez; raporun ihtiyaç duyduğu dönem etiketini türetir.",
      outputGrain:
        "Her satır bir satış hareketi ve o hareketin aylık dönem etiketidir.",
      acceptanceChecks: [
        "sale_id ve sale_month kolonları bu sırada dönmeli.",
        "sale_month değerleri dört haneli yıl, tire ve iki haneli ay biçiminde olmalı.",
        "Altı satış korunmalı; Ocak, Şubat ve Mart etiketleri ikişer kez görünmeli.",
      ],
      dataNotes: [
        "sale_date DATE tipindedir ve tüm kayıtlar 2026 yılındadır.",
        "Etiket metindir; kronolojik sıralama için YYYY-MM biçimi aynı zamanda alfabetik olarak da uygundur.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Aylık etiketi sale_month sözleşmesine bağla",
        checks: [
          "İlk kolonun sale_id, ikinci kolonun biçimlendirilmiş tarih olduğunu doğrula.",
          "İkinci kolona sale_month alias'ı verdiğini kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Dönem üretirken hareket ayrıntısını koru",
        checks: [
          "Ay bazında GROUP BY veya DISTINCT yaparak satırları azaltmadığını kontrol et.",
          "Her sale_id için bir sale_month olacak biçimde altı satır döndüğünü doğrula.",
        ],
      },
      "order-wrong": {
        title: "Bu görevde etiket doğruluğu sıradan önemli",
        checks: [
          "Doğru kimlik-dönem çiftleri varsa görünüm sırasının kabulü etkilemediğini hatırla.",
          "ORDER BY yerine biçim maskesi veya alias hatası olup olmadığını kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "Tarihi TO_CHAR ile rapor etiketine dönüştür",
        checks: [
          "Görevde istenen tarih biçimlendirme fonksiyonunu kullandığını doğrula.",
          "Biçim maskesinin yıl ve iki haneli ayı tireyle ayırdığını kontrol et.",
        ],
      },
      "execution-error": {
        title: "Tarih fonksiyonu ve maskesini denetle",
        checks: [
          "sale_date kolonunu ve biçim metnini fonksiyona iki ayrı argüman olarak verdiğini kontrol et.",
          "Biçim maskesinin tek tırnaklarını ve fonksiyon parantezini doğrula.",
        ],
      },
    },
    debrief: {
      steps: [
        "Hedef dönem gösterimini YYYY-MM olarak belirle.",
        "Her sale_date değerini bu maskeyle biçimlendir ve sale_month adı ver.",
        "Altı hareketin doğru üç aya dağıldığını doğrula.",
      ],
      whyItWorks:
        "TO_CHAR tarih bileşenlerini sabit genişlikli bir metin etikete dönüştürür; satır tanesi değişmediği için işlem ayrıntısı korunur.",
      edgeCases: [
        "Metin etiket tarih hesabı için uygun değildir; sonraki tarih işlemleri için kaynak DATE kolonunu korumak gerekir.",
        "Hafta ve yıl gibi dönemlerde takvim yılı ile ISO hafta yılı farklılaşabilir.",
      ],
      workplaceImpact:
        "Tutarlı dönem anahtarları dışa aktarımlar ve BI ilişkileri için kullanışlıdır; tarih boyutu olan modellerde yine boyut anahtarı tercih edilir.",
      transfer: {
        prompt:
          "Çeyrek etiketi üretirken yalnızca ay numarasını metne çevirmek neden yeterli olmayabilir?",
        reveal:
          "Ayı çeyreğe eşlemek ve yılı da etikette korumak gerekir; aksi halde farklı yılların aynı çeyrekleri birleşir.",
      },
    },
  },
  "m3-t4": {
    learningBrief: {
      conceptAnchor:
        "CASE koşulları sırayla değerlendirilir; çakışan eşiklerde en özel veya en yüksek kuralın önce gelmesi gerekir.",
      outputGrain:
        "Her satır dış sistem referansı ve gelir bandı atanmış tek bir satış hareketidir.",
      acceptanceChecks: [
        "sale_ref metin tipinde, revenue_band ise iş etiketi olarak dönmeli.",
        "1000 ve üzeri Yüksek; 500 ve üzeri Orta; diğerleri Standart olmalı.",
        "Altı satır korunmalı ve 304 Yüksek, 301 ile 303 Standart sınıfında yer almalı.",
      ],
      dataNotes: [
        "Gelir quantity ile unit_price çarpımından türetilir; hazır revenue kolonu yoktur.",
        "Eşikler çakışır: 1000 üzerindeki değer aynı zamanda 500 üzerindedir.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Dış referans ve bant kolonlarını doğru adlandır",
        checks: [
          "Dönüştürülmüş kimliğe sale_ref, koşullu etikete revenue_band alias'ı verdiğini doğrula.",
          "Çıktıda yalnızca bu iki kolonun ve doğru sıranın bulunduğunu kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Sınıflandırırken satış hareketlerini eksiltme",
        checks: [
          "CASE ifadesinin filtre değil, her satır için değer ürettiğini kontrol et.",
          "ELSE dalının 500 altındaki satırları Standart olarak koruduğunu doğrula.",
        ],
      },
      "order-wrong": {
        title: "Bant görevinde satır sırası serbest",
        checks: [
          "Altı referans-bant çifti doğruysa farklı görünüm sırasını hata sayma.",
          "Sorunun CASE dal sırasından kaynaklanan yanlış etiket olmadığını kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "CAST, hesap ve CASE rollerini ayrı doğrula",
        checks: [
          "Kimliği TEXT'e açık veri tipi dönüşümüyle çevirdiğini kontrol et.",
          "Geliri matematiksel ifadeyle hesaplayıp CASE eşiklerinde kullandığını doğrula.",
        ],
      },
      "execution-error": {
        title: "CASE dallarının sınırlarını kontrol et",
        checks: [
          "Her koşulun THEN sonucu olduğunu, yapının ELSE ve END ile kapandığını doğrula.",
          "Metin etiketlerinin tek tırnak içinde ve CAST hedef tipinin geçerli olduğunu kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Dış sistem kimliği için sale_id değerini metne dönüştür.",
        "Geliri satır düzeyinde hesapla ve yüksek eşikten başlayarak CASE dallarına ayır.",
        "Altı referans-bant çiftini eşik çevresindeki örneklerle doğrula.",
      ],
      whyItWorks:
        "CAST çıktı tipini veri sözleşmesine uyarlar; yüksek eşikten başlayan CASE ilk doğru dalı seçerek sınıfların birbirini yutmasını engeller.",
      edgeCases: [
        "Tam 500 ve 1000 değerleri eşitliği kapsayan operatörler nedeniyle sırasıyla Orta ve Yüksek olmalıdır.",
        "Gelir NULL ise hiçbir eşik doğru olmaz ve ELSE bandına düşebilir; bu davranış bilinçli kararlaştırılmalıdır.",
      ],
      workplaceImpact:
        "Koşullu bantlar müşteri segmentasyonu, risk derecelendirme ve SLA durumlarını karar vericinin okuyabileceği kategorilere çevirir.",
      transfer: {
        prompt:
          "0–30, 31–60 ve 61+ gecikme günü bantlarında CASE sırasını nasıl kurar, sınırları nasıl test edersin?",
        reveal:
          "Çakışmayan aralıklar tanımlar ve özellikle 30, 31, 60, 61 değerlerini test ederek her sınırın yalnızca tek banda düştüğünü doğrularsın.",
      },
    },
  },
};
