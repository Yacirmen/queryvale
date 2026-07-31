import type { LessonLearningContent } from "../types/lesson";

export const MODULE_810_LEARNING_CONTENT: Readonly<
  Record<string, LessonLearningContent>
> = {
  "m8-t1": {
    learningBrief: {
      conceptAnchor:
        "Bir veri değişikliğini güvenli kılan üçlü: doğru satırı WHERE ile hedeflemek, mevcut değeri göreli olarak güncellemek ve oluşan durumu RETURNING ile hemen doğrulamak.",
      outputGrain:
        "Çıktıdaki tek satır, stoğu değiştirilen product_id 801 ürününün güncelleme sonrasındaki durumunu temsil eder.",
      acceptanceChecks: [
        "Yalnız product_id 801 satırı değişmeli ve stock_quantity değeri 12'den 9'a inmeli.",
        "product_id 802 satırının 6 adetlik stoğu değişmeden kalmalı.",
        "Sonuç yalnız product_id ve güncel stock_quantity kolonlarını bu sırada döndürmeli.",
      ],
      dataNotes: [
        "Wireless Scanner ürünü product_id 801 ile 12 adet, Label Printer ise product_id 802 ile 6 adet stok taşır; hedef koşulu bu iki satırı ayırmalıdır.",
        "stock_quantity kolonu negatif değeri engelleyen bir kontrol taşır; bu fixture'daki 3 adetlik ayırma 801 numaralı ürünü güvenli biçimde 9'a indirir.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Güncellemenin hedef, hesap ve dönüş bölümlerini ayır",
        checks: [
          "inventory tablo adını ve stock_quantity kolonunun alt çizgili yazımını şemayla karşılaştır.",
          "Yeni değer hesabının, hedef koşulunun ve döndürülecek kolonların kendi SQL bölümlerinde doğru sırada bulunduğunu kontrol et.",
        ],
      },
      "columns-wrong": {
        title: "Değişiklik kanıtını iki kolonla sınırla",
        checks: [
          "RETURNING çıktısının önce product_id, sonra stock_quantity verdiğini doğrula.",
          "product_name veya hesaplama amaçlı ek kolonların sonuç sözleşmesine sızmadığını kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Tek ürünü ve üç adetlik farkı yeniden doğrula",
        checks: [
          "WHERE koşulunun product_id 801 dışında hiçbir envanter satırını hedeflemediğini kontrol et.",
          "Yeni stoğu sabit bir değere çevirmek yerine mevcut 12 adet üzerinden tam 3 azaltarak 9 ürettiğini doğrula.",
        ],
      },
      "order-wrong": {
        title: "Tek satırlı sonuçta sıra değil kolon düzenini kontrol et",
        checks: [
          "Bu görev tek ürün döndürdüğü için satır sırasının değerlendirilmediğini hatırla.",
          "Gördüğün farkın product_id ile stock_quantity kolonlarının yer değiştirmesinden kaynaklanmadığını kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "Hesaplanmış bir görünüm değil gerçek bir UPDATE üret",
        checks: [
          "Yalnız yeni stok değerini hesaplayan bir SELECT yerine inventory satırını gerçekten değiştiren yaklaşımı kullandığını doğrula.",
          "Değişen satırı ikinci bir sorguya ihtiyaç duymadan aynı işlem sonucunda döndürdüğünü kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Önce product_id 801'i değişikliğin tek hedefi olarak belirledin.",
        "Mevcut stock_quantity değerinden 3 çıkararak stoğu 12'den 9'a indirdin.",
        "Değişen ürün kimliği ile yeni stok miktarını RETURNING çıktısında doğruladın.",
      ],
      whyItWorks:
        "Hedef koşulu güncellemenin etki alanını tek satıra indirir, göreli hesap mevcut değeri koruyarak farkı uygular ve RETURNING yazma işleminin gerçek sonucunu doğrudan gözlemlenebilir yapar.",
      edgeCases: [
        "Ayrılacak miktar mevcut stoktan büyük olursa negatif stok kontrolü değişikliği reddeder; uygulama bu hatayı kullanıcıya anlaşılır biçimde taşımalıdır.",
        "Ürün kimliği bulunamazsa hiçbir satır değişmez ve boş dönüş alınır; bunu başarılı stok ayırma gibi yorumlamamak gerekir.",
      ],
      workplaceImpact:
        "Bu desen stok ayırma, kota düşürme ve durum değiştirme gibi operasyonlarda yanlış satırı güncelleme riskini azaltır ve değişikliği aynı anda denetlenebilir kılar.",
      transfer: {
        prompt:
          "Label Printer için 2 adet stok ayırman istense hedef, yeni değer hesabı ve doğrulama çıktısında hangi üç iş kararını değiştirirdin?",
        reveal:
          "Hedef ürün 802 olur, mevcut 6 adet stok 2 azaltılarak 4'e iner; doğrulama çıktısı yine yalnız ürün kimliği ile güncel stok miktarını taşır.",
      },
    },
  },
  "m9-t1": {
    learningBrief: {
      conceptAnchor:
        "Yıldız şemada fact tablosunun olay tanesini koruyup boyut anahtarlarından açıklayıcı etiketlere ulaşmak, ardından ölçüyü istenen rapor tanesinde toplamak.",
      outputGrain:
        "Her sonuç satırı tek bir ay ve ürün kategorisi birleşimi için toplam satış gelirini temsil eder.",
      acceptanceChecks: [
        "2026-01 ve 2026-02 aylarının her birinde Furniture ve Technology kategorileri görünerek toplam dört satır oluşmalı.",
        "revenue her fact satırındaki quantity ile unit_price çarpımının aynı ay-kategori grubunda toplanmasıyla hesaplanmalı.",
        "Kolonlar month_label, category, revenue sırasını izlemeli; satırlar önce aya, sonra kategoriye göre artan gelmeli.",
      ],
      dataNotes: [
        "product_key 10 Furniture kategorisindeki Office Chair'a, 11 ise Technology kategorisindeki Monitor'e gider; kategori etiketi fact_sales içinde bulunmaz.",
        "date_key 1 değeri 2026-01'e, 2 değeri 2026-02'ye karşılık gelir; dört fact satırının her biri bir satış olayını ve kendi quantity değerini taşır.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Fact ile iki boyut arasındaki anahtar yollarını doğrula",
        checks: [
          "fact_sales içindeki product_key ve date_key alanlarının doğru boyut tablosundaki aynı adlı anahtara bağlandığını kontrol et.",
          "month_label ve category aggregate dışında kaldığı için ikisinin de grup tanımında bulunduğunu doğrula.",
        ],
      },
      "columns-wrong": {
        title: "Ay-kategori raporunun üç kolonunu sabitle",
        checks: [
          "İlk iki kolonun boyutlardan gelen month_label ve category, üçüncü kolonun revenue alias'lı ölçü olduğunu doğrula.",
          "product_key, date_key, quantity veya unit_price gibi teknik ve satır düzeyi alanları son çıktıdan çıkar.",
        ],
      },
      "rows-wrong": {
        title: "Fact tanesini join sırasında çoğaltmadığını kontrol et",
        checks: [
          "Her fact satırının tam bir ürün ve tam bir tarih boyutu satırıyla eşleştiğini, eksik ya da çapraz bir join olmadığını doğrula.",
          "Geliri yalnız unit_price toplamı olarak değil, her olayın quantity ile unit_price çarpımını ay-kategori seviyesinde toplayarak hesapladığını kontrol et.",
        ],
      },
      "order-wrong": {
        title: "Raporun boyut hiyerarşisini sıralamaya taşı",
        checks: [
          "Birincil sıralama anahtarının month_label ve yönünün artan olduğunu doğrula.",
          "Aynı ay içindeki iki satırı category değerine göre artan sıralayan ikinci anahtarın bulunduğunu kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "Yıldız şemanın fact-merkezli yolunu görünür kıl",
        checks: [
          "Rapor etiketlerini doğrudan fact tablosunda aramak yerine fact_sales'i hem ürün hem tarih boyutuna kendi anahtarlarıyla bağladığını doğrula.",
          "Olay ölçüsünü ay-kategori tanesine indirmek için çarpım, SUM ve iki boyutlu gruplama adımlarının birlikte bulunduğunu kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Fact_sales tablosundaki her satış olayını ürün ve tarih anahtarları üzerinden ilgili boyut satırlarıyla eşleştirdin.",
        "Her olayın quantity ve unit_price değerlerinden satır düzeyi gelir katkısını belirledin.",
        "Bu katkıları month_label ile category tanesinde toplayıp dört düzenli rapor satırına indirdin.",
      ],
      whyItWorks:
        "Boyut tablolarındaki anahtarlar benzersiz olduğu için her fact olayı join sonrasında bir kez kalır. Böylece etiketler analize eklenirken olaylar çoğalmaz ve toplama işlemi doğru ay-kategori tanesinde yapılır.",
      edgeCases: [
        "Bir boyut anahtarı benzersizliğini kaybederse aynı fact satırı birden fazla eşleşerek geliri sessizce şişirebilir; cardinality veri modeli düzeyinde korunmalıdır.",
        "İade veya indirimler ileride ayrı fact türleri olarak gelirse quantity ile liste fiyatı çarpımı net geliri temsil etmeyebilir; ölçünün iş tanımı yeniden belirlenmelidir.",
      ],
      workplaceImpact:
        "Bu fact-merkezli yaklaşım ürün, tarih, müşteri veya kanal kırılımlarında güvenilir BI metrikleri üretmenin ve raporlar arasında aynı ölçü tanesini korumanın temelidir.",
      transfer: {
        prompt:
          "Rapora category yerine product_name eklense çıktı tanesi ve gruplama kararı nasıl değişirdi?",
        reveal:
          "Her satır artık bir ay-kategori özeti değil, bir ay-ürün özeti olurdu; ürün adı yeni boyut tanesini belirler ve toplama da bu daha ayrıntılı seviyede yapılırdı.",
      },
    },
  },
  "m10-t1": {
    learningBrief: {
      conceptAnchor:
        "Raporun kapsama kümesini önce sabitlemek, opsiyonel hareketleri LEFT JOIN ile eklemek ve eksik gerçekleşmeleri sıfıra çevirerek ölçüyü karar etiketine dönüştürmek.",
      outputGrain:
        "Her sonuç satırı 2026-05 dönemi için tek bir şubenin hedef, gerçekleşen satış, gerçekleşme oranı ve hedef durumunu temsil eder.",
      acceptanceChecks: [
        "Istanbul, Ankara ve Mayıs satışı olmayan Izmir dahil üç şubenin tamamı sonuçta bulunmalı; Izmir'in actual_amount ve achievement_rate değerleri 0 olmalı.",
        "Ankara 8200 / 8000 ile yüzde 102.5 ve Hedefte, Istanbul 9500 / 10000 ile yüzde 95 ve Geride, Izmir ise yüzde 0 ve Geride görünmeli.",
        "Beş kolon görevdeki sırayı izlemeli ve satırlar achievement_rate değerine göre Ankara, Istanbul, Izmir biçiminde azalan sıralanmalı.",
      ],
      dataNotes: [
        "Izmir'in branch_sales tablosunda 5000 tutarlı bir kaydı vardır ancak sale_month değeri 2026-04'tür; bu satır Mayıs gerçekleşmesine katılmamalı, şube yine de raporda kalmalıdır.",
        "Istanbul Mayıs ayında 4000 ve 5500 olmak üzere iki satış satırı taşırken hedefi tek satırdır; satışlar toplanmalı fakat 10000 tutarlı hedef iki kez sayılmamalıdır.",
      ],
    },
    coaching: {
      "execution-error": {
        title:
          "Kapsama join'lerini ve tekrar kullanılan hesapları parçalara ayır",
        checks: [
          "branches, monthly_targets ve branch_sales alias'larının kolon başvurularıyla tutarlı olduğunu kontrol et.",
          "Toplam, sıfır doldurma, oran ve CASE ifadelerindeki parantezleri; grup dışındaki kolonların grup tanımını gözden geçir.",
        ],
      },
      "columns-wrong": {
        title: "Yönetici raporunun beş alanını sözleşmeyle eşleştir",
        checks: [
          "Kolon sırasının branch_name, target_amount, actual_amount, achievement_rate, target_status olduğunu doğrula.",
          "Toplam satışa, yüzde hesabına ve CASE sonucuna görevde istenen alias'ları verdiğini; teknik anahtarları sonuçtan çıkardığını kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Mayıs filtresini kapsamı bozmadan uygula",
        checks: [
          "Izmir satırının kaybolmaması için satış ayı koşulunun opsiyonel satış eşleşmesini sınırladığını, sonradan boş satışları eleyen bir filtreye dönüşmediğini kontrol et.",
          "Istanbul'un iki Mayıs satışını 9500'e topladığını; hedef tutarını satış satırı sayısı kadar çoğaltmadığını doğrula.",
        ],
      },
      "order-wrong": {
        title: "Şubeleri karar önceliği olan orana göre sırala",
        checks: [
          "Sıralama anahtarının branch_name veya actual_amount değil achievement_rate olduğunu kontrol et.",
          "Yönün azalan olduğunu ve yüzde 102.5, 95, 0 dizisini ürettiğini doğrula.",
        ],
      },
      "required-concept-missing": {
        title: "Kapsama, ölçü ve karar katmanlarını birlikte kur",
        checks: [
          "Mayıs hedefli şubeleri koruyan LEFT JOIN yaklaşımını ve satışları şube seviyesinde biriktiren SUM ile GROUP BY adımlarını doğrula.",
          "Eksik satışı sıfıra çevirip gerçekleşeni hedefle karşılaştıran CASE yapısının raporlama kuralını açıkça ifade ettiğini kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Önce Mayıs hedefi bulunan üç şubeyi raporun kapsama kümesi olarak korudun.",
        "Yalnız Mayıs satışlarını opsiyonel olarak eşleyip şube düzeyinde topladın; satış gelmeyen Izmir'i sıfır gerçekleşmeyle tuttun.",
        "Gerçekleşeni hedefe bölerek oranı ürettin, CASE ile durum etiketine dönüştürdün ve en yüksek orandan başlayarak sıraladın.",
      ],
      whyItWorks:
        "LEFT JOIN hedefli şubelerin kapsamını satış bulunmasına bağlamaz. Ay koşulu doğru eşleşme sınırında kaldığında Nisan satırı Mayıs toplamına girmez; aggregation, sıfır doldurma ve CASE de aynı şube-ay tanesinde tutarlı bir karar kaydı üretir.",
      edgeCases: [
        "target_amount sıfır olabilirse yüzde hesabı bölme hatasına karşı açık bir iş kuralı ister; sıfır hedefin başarı sayılıp sayılmayacağı ürün kararıdır.",
        "Bir şubenin aynı ay için birden fazla hedef satırı oluşursa satışlar join sırasında çoğalabilir; mevcut birleşik anahtar bu cardinality hatasını veri modelinde engeller.",
      ],
      workplaceImpact:
        "Kapsama-korumalı bu desen satışsız şube, sıfır olaylı müşteri veya kullanılmayan ürün gibi sessizce kaybolan birimleri yönetim raporlarında görünür tutar.",
      transfer: {
        prompt:
          "Yönetim Mayıs hedefi tanımlanmamış şubeleri de raporda görmek isterse kapsama kümesini hangi tablodan başlatır, eksik hedefi nasıl yorumlardın?",
        reveal:
          "Kapsam tüm branches satırları olur, hedef ve satışlar opsiyonel eşleşir; eksik hedef için oran ve hedef durumu üretmeden önce iş biriminin 'hedef yok' kuralı açıkça tanımlanmalıdır.",
      },
    },
  },
};
