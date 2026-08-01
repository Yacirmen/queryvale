import type { LessonLearningContent } from "../types/lesson";

export const TASK_LEARNING_CONTENT: Readonly<
  Record<string, LessonLearningContent>
> = {
  "m1-t1": {
    learningBrief: {
      conceptAnchor:
        "SELECT, sonuçta hangi dikey bilgi alanlarının (kolonların) görüneceğini belirler. Kolonları hangi sırada yazarsan ekranda da o sırada görürsün.",
      outputGrain:
        "Sonuçtaki her satır tek bir ürünü temsil eder. Bu görev ürün elemediği için altı ürünün altısı da görünür.",
      acceptanceChecks: [
        "Çıktıda önce product_name, sonra category kolonu bulunmalı.",
        "Altı ürünün tamamı sonuçta bulunmalı.",
        "Ürün kimliği, fiyat ve stok gibi istenmeyen bilgiler görünmemeli.",
      ],
      dataNotes: [
        "Furniture ve Stationery kategorileri birden fazla üründe tekrar eder.",
        "Bu görevde satır sırası değerlendirme ölçütü değildir.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "İstenen iki bilgi alanına dön",
        checks: [
          "Şema panelinde ürün adı alanının product_name, kategori alanının category olduğunu doğrula.",
          "SELECT bölümünde önce product_name, sonra category yazdığını kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Altı ürünün tamamını koru",
        checks: [
          "Sorguna ürün sayısını azaltan ek bir koşul veya satır sınırı koyup koymadığını kontrol et.",
          "Veriyi products tablosundan aldığını ve sonuçta altı satır bulunduğunu doğrula.",
        ],
      },
      "order-wrong": {
        title: "Bu görev ürünlerin sırasını ölçmüyor",
        checks: [
          "Ürünler farklı sırada görünse de altı doğru ürün varsa satırları yeniden dizmen gerekmez.",
          "Satırların sırası ile product_name ve category kolonlarının soldan sağa sırasını birbirinden ayır.",
        ],
      },
      "required-concept-missing": {
        title: "Görünecek alanları SELECT ile seç",
        checks: [
          "Sonucu bir SELECT sorgusuyla products tablosundan ürettiğini doğrula.",
          "Yalnız istenen iki kolonu adlarıyla yaz; tablodaki bütün kolonları getiren kısayolu kullanma.",
        ],
      },
      "execution-error": {
        title: "İlk sorgunun üç parçasını kontrol et",
        checks: [
          "Sıranın SELECT, gösterilecek kolonlar ve FROM ile kaynak tablo biçiminde olduğunu kontrol et.",
          "İki kolon arasındaki virgülü ve products tablo adının yazımını gözden geçir.",
        ],
      },
    },
    debrief: {
      steps: [
        "İş talebinde görünmesi gereken iki bilgiyi belirledin: ürün adı ve kategori.",
        "Bu bilgilerin products tablosundaki product_name ve category karşılıklarını seçtin.",
        "Altı ürünün korunduğunu ve yalnız iki istenen kolonun göründüğünü kontrol ettin.",
      ],
      whyItWorks:
        "SELECT bölümünde yalnız gereken kolonları yazmak ürünleri silmez; sadece sonuçta hangi bilgilerin gösterileceğini belirler.",
      edgeCases: [
        "Yeni bir ürün eklendiğinde sorgu onu da otomatik olarak sonuçta gösterir.",
        "Bir ürünün kategori bilgisi eksik olsaydı ürün satırı yine görünür, yalnız kategori hücresi boş kalırdı.",
      ],
      workplaceImpact:
        "Yalnız gereken bilgileri seçmek raporu daha kolay okunur, paylaşılır ve kontrol edilir hâle getirir.",
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
        "DISTINCT, seçtiğin değerler içindeki tekrarları kaldırır. Yalnız category seçildiğinde her kategori sonuçta bir kez görünür.",
      outputGrain:
        "Sonuçtaki her satır katalogda bulunan farklı bir kategoriyi temsil eder; artık ürün başına bir satır yoktur.",
      acceptanceChecks: [
        "Çıktı yalnızca category kolonunu içermeli.",
        "Home, Stationery, Furniture ve Lifestyle değerlerinin her biri bir kez görünmeli.",
        "Birden fazla ürüne sahip kategoriler sonuçta yinelenmemeli.",
      ],
      dataNotes: [
        "category kolonunu tekrarları kaldırmadan seçmek altı satır üretir; Furniture ve Stationery birden fazla kez görünür.",
        "Kategori sırası bu vakada önemli değildir.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Sonuçta yalnız kategori bilgisini bırak",
        checks: [
          "SELECT listesinde category dışında bir kolon bulunmadığını kontrol et.",
          "product_name veya product_id eklersen her ürün yeniden ayrı bir satıra dönüşebilir.",
        ],
      },
      "rows-wrong": {
        title: "Dört farklı kategoriyi birer kez göster",
        checks: [
          "Sonuçta dört satır bulunduğunu ve hiçbir kategori adının tekrar etmediğini kontrol et.",
          "DISTINCT anahtar kelimesini category seçiminin önünde kullandığını doğrula.",
        ],
      },
      "order-wrong": {
        title: "Bu görev kategori sırasını ölçmüyor",
        checks: [
          "Dört kategori farklı sırada görünse de aynı dört değer varsa sıralama eklemen gerekmez.",
          "Sorunun yalnız görünüm sırası mı, yoksa tekrar eden veya eksik kategori mi olduğunu ayır.",
        ],
      },
      "required-concept-missing": {
        title: "Tekrarları DISTINCT ile kaldır",
        checks: [
          "Kategori adlarını elle seçmek yerine tekrarları DISTINCT ile kaldırdığını kontrol et.",
          "DISTINCT'in SELECT bölümünde seçtiğin bütün kolonlara birlikte uygulandığını hatırla.",
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
        "Listenin ürünleri değil, farklı kategorileri göstermesi gerektiğini belirledin.",
        "Yalnız category kolonunu seçip DISTINCT ile tekrarları kaldırdın.",
        "Dört kategori adının birer kez göründüğünü doğruladın.",
      ],
      whyItWorks:
        "Seçimde yalnız category bulunduğu için DISTINCT aynı kategoriye sahip ürünleri ayrı ayrı göstermez; kategori adını sonuçta bir kez bırakır.",
      edgeCases: [
        "Seçime product_name eklersen her ürün adı farklı olduğu için kategori tekrarları yeniden görünür.",
        "Kategori bilgisi eksik olan birden fazla ürün varsa sonuçta tek bir boş kategori satırı görünür.",
      ],
      workplaceImpact:
        "Tekrarsız listeler kategori filtrelerini, seçim alanlarını ve kısa özetleri temiz ve kullanılabilir tutar.",
      transfer: {
        prompt:
          "Siparişlerden tekrarsız şehir ve durum çiftleri istendiğinde DISTINCT hangi değerleri birlikte değerlendirir?",
        reveal:
          "Seçtiğin city ve status değerlerini bir çift olarak değerlendirir; aynı şehir farklı durumlarla birden fazla satırda görünebilir.",
      },
    },
  },
  "m1-t3": {
    learningBrief: {
      conceptAnchor:
        "Önce sıralama, sonra satır sınırı gelir: ORDER BY en düşük stoğu üste taşır; LIMIT bu sıralı listenin ilk üç satırını alır.",
      outputGrain:
        "Sonuçtaki her satır tedarikte öncelik verilecek tek bir ürünü temsil eder; yalnız ilk üç ürün görünür.",
      acceptanceChecks: [
        "Çıktı product_name ve stock_quantity kolonlarını bu sırayla içermeli.",
        "Yalnızca üç ürün dönmeli: stok miktarları 4, 7 ve 18 olan ürünler.",
        "Satırlar stock_quantity değerine göre küçükten büyüğe sıralanmalı.",
      ],
      dataNotes: [
        "Standing Desk en düşük, Notebook en yüksek stok miktarına sahiptir.",
        "Veri setinde eşit stok yoktur; eşitlik olsaydı hangi ürünün önce geleceği ayrıca belirtilmeliydi.",
      ],
    },
    coaching: {
      "columns-wrong": {
        title: "Tedarik listesinde iki bilgiyi koru",
        checks: [
          "İlk kolonun ürün adı, ikinci kolonun stok miktarı olduğunu doğrula.",
          "Bu bilgilerin product_name ve stock_quantity kolonlarından geldiğini kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Sıraladıktan sonra ilk üç ürünü al",
        checks: [
          "Önce bütün ürünleri stok miktarına göre dizdiğini, satır sınırını bundan sonra uyguladığını kontrol et.",
          "İlk üç stok değerinin 4, 7 ve 18 olup olmadığını kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Kritik stokları en düşükten başlat",
        checks: [
          "stock_quantity sıralamasının küçükten büyüğe, yani ASC yönünde olduğunu doğrula.",
          "Sıralama ölçütünün ürün adı veya fiyat olmadığını kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "ORDER BY ile sırala, LIMIT ile üçe indir",
        checks: [
          "Önceliği ORDER BY ile açıkça tanımladığını kontrol et.",
          "Sıralanmış sonucu LIMIT ile üç satır olarak sınırladığını doğrula.",
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
        "Tedarik önceliğini en az stok olarak belirledin.",
        "Tüm ürünleri stock_quantity değerine göre küçükten büyüğe sıraladın.",
        "Sıralanmış listenin ilk üç satırını alıp iki istenen kolonu doğruladın.",
      ],
      whyItWorks:
        "ORDER BY düşük stoklu ürünleri listenin başına taşır. LIMIT bu işlemden sonra çalıştığı için rastgele üç ürün yerine gerçekten en az stoklu üç ürün kalır.",
      edgeCases: [
        "İki ürünün stoğu eşitse hangisinin önce geleceğini belirlemek için product_id gibi ikinci bir sıralama alanı gerekebilir.",
        "Eksi stok hatalı bir kayıt olsa da küçükten büyüğe sıralamada en üste çıkar ve kontrol edilmesi gerektiğini gösterir.",
      ],
      workplaceImpact:
        "Önce sırala, sonra sınırla yaklaşımı stok yenileme, en yüksek tutarlı faturalar ve en acil destek kayıtları gibi öncelik listelerinin temelidir.",
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
        "ORDER BY hangi kolona göre sıralanacağını, DESC ise büyük değerin önce geleceğini belirtir. Burada en pahalı ürün listenin başına taşınır.",
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
        title: "Sıralarken hiçbir ürünü kaybetme",
        checks: [
          "Sorgunun yalnızca sıralamayı değiştirdiğini, ürünleri sonuçtan çıkarmadığını kontrol et.",
          "Sonuçta altı farklı ürün bulunduğunu kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Fiyatları doğru yönde sırala",
        checks: [
          "ORDER BY bölümünde sıralama alanının unit_price olduğunu kontrol et.",
          "DESC yönünü kullandığını ve en yüksek fiyatın ilk satırda olduğunu doğrula.",
        ],
      },
      "required-concept-missing": {
        title: "İş önceliğini ORDER BY ile görünür kıl",
        checks: [
          "Tablonun kendiliğinden hep aynı sırada geleceğini varsayma; ORDER BY kullandığını doğrula.",
          "Sıralama yönünü rapor talebindeki yüksekten düşüğe kuralıyla eşleştir.",
        ],
      },
      "execution-error": {
        title: "Fiyat sıralamasının sözdizimini kontrol et",
        checks: [
          "ORDER BY bölümünün FROM ile belirtilen tablo kaynağından sonra geldiğini doğrula.",
          "unit_price kolon adını ve DESC anahtar kelimesini doğru yazdığını kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Panoda gösterilecek ürün adı ve birim fiyat alanlarını seçtin.",
        "Fiyatı yüksekten düşüğe sıralama kuralını ekledin.",
        "Altı ürünün korunduğunu, 349.90'ın ilk ve 6.50'nin son sırada olduğunu doğruladın.",
      ],
      whyItWorks:
        "DESC yönündeki fiyat sıralaması hiçbir ürünü elemeden en yüksek fiyatı ilk satıra, en düşük fiyatı son satıra taşır.",
      edgeCases: [
        "Aynı fiyatlı ürünlerde ikincil sıralama belirtilmezse kendi aralarındaki sıra garanti edilmez.",
        "Fiyatı eksik bir ürün olsaydı onu listenin neresinde göstereceğin için ayrıca bir iş kuralı gerekirdi.",
      ],
      workplaceImpact:
        "Açık bir sıralama kuralı fiyat panolarında, risk listelerinde ve iş kuyruklarında herkesin aynı öncelik düzenini görmesini sağlar.",
      transfer: {
        prompt:
          "Bir destek kuyruğunu önce en yüksek öncelik, eşitlikte en eski kayıt gelecek şekilde nasıl sıralardın?",
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
        "Sipariş durumu bu vakada filtre ölçütü değildir.",
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
        "LIKE karşılaştırması bu vakada büyük-küçük harfe duyarlıdır.",
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
        "Aynı temsilcinin birden fazla satırı vardır; bu vakada toplulaştırma yapılmaz.",
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
