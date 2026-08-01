import type { LessonLearningContent } from "../types/lesson";

export const MODULE_8_EXPANSION_LEARNING_CONTENT: Readonly<
  Record<string, LessonLearningContent>
> = {
  "m8-t2": {
    learningBrief: {
      conceptAnchor:
        "INSERT ile yeni bir stok hareketini mevcut geçmişi bozmadan eklemek ve RETURNING ile veritabanına gerçekten yazılan olay kaydını aynı işlemde doğrulamak.",
      outputGrain:
        "Çıktıdaki tek satır, movement_id 3004 olan yeni stok giriş hareketini temsil eder; ürünün toplam stok durumunu değil, tek bir hareket olayını gösterir.",
      acceptanceChecks: [
        "Tam olarak bir yeni hareket oluşmalı: movement_id 3004, product_id 803, quantity_delta 4 ve movement_type IN olmalı.",
        "RETURNING çıktısı movement_id, product_id, quantity_delta ve movement_type kolonlarını bu sırada içermeli.",
        "inventory_movements içindeki mevcut hareketler değişmeden kalmalı; yeni kayıt onların yerine geçmemeli veya onları çoğaltmamalı.",
      ],
      dataNotes: [
        "inventory_movements bir olay geçmişidir; yeni stok girişi mevcut bir hareketi güncellemek yerine ayrı bir satır olarak eklenmelidir.",
        "movement_id benzersizdir. IN hareketi pozitif 4 adetlik bir girişi temsil eder; kimlik, ürün, miktar ve hareket türü aynı olay sözleşmesinin parçalarıdır.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Hareket kolonları ile eklenecek değerleri hizala",
        checks: [
          "INSERT hedefinin inventory_movements olduğunu ve kolon listesindeki dört alanla VALUES bölümündeki dört değerin aynı sırayı izlediğini kontrol et.",
          "IN değerinin bir metin sabiti olarak yazıldığını; sayısal kimlik ve miktar değerleriyle tırnak kullanımını karıştırmadığını doğrula.",
        ],
      },
      "columns-wrong": {
        title: "Yeni hareket kanıtını dört kolonla sınırla",
        checks: [
          "RETURNING listesinin movement_id, product_id, quantity_delta ve movement_type sırasını izlediğini doğrula.",
          "Fazladan teknik alan döndürmediğini ve hiçbir hedef kolona farklı bir alias vermediğini kontrol et.",
        ],
      },
      "rows-wrong": {
        title: "Eklenen olayın dört değerini yeniden doğrula",
        checks: [
          "Yeni satırın movement_id 3004 ve product_id 803 değerlerini birlikte taşıdığını kontrol et.",
          "quantity_delta değerinin pozitif 4, movement_type değerinin tam olarak IN olduğunu; mevcut hareketlerden birini değiştirmediğini doğrula.",
        ],
      },
      "order-wrong": {
        title: "Tek hareket satırında kolon düzenine odaklan",
        checks: [
          "Bu görev tek satır döndürdüğü için satır sırasının bir karar ölçütü olmadığını hatırla.",
          "Gördüğün uyuşmazlığın RETURNING kolonlarının soldan sağa sırasından kaynaklanıp kaynaklanmadığını kontrol et.",
        ],
      },
      "required-concept-missing": {
        title: "Sabit değer görünümü değil gerçek bir INSERT üret",
        checks: [
          "Dört değeri yalnız SELECT ile göstermediğini, inventory_movements tablosuna yeni bir olay olarak eklediğini doğrula.",
          "Yazılan post-state'i ikinci bir sorguya ihtiyaç duymadan aynı INSERT işleminin RETURNING bölümüyle döndürdüğünü kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Yeni stok girişini movement_id 3004 ile ayrı bir hareket olayı olarak tanımladın.",
        "Ürün 803 için pozitif 4 adetlik farkı IN hareket türüyle birlikte inventory_movements geçmişine ekledin.",
        "Eklenen dört değeri RETURNING çıktısında görerek gerçek veritabanı durumunu doğruladın.",
      ],
      whyItWorks:
        "INSERT mevcut satırları yeniden yazmadan yeni bir olay oluşturur. Açık kolon listesi her değerin iş anlamını sabitler; RETURNING ise istemcinin tahmin ettiği değerleri değil, veritabanının kabul edip kaydettiği satırı kanıt olarak verir.",
      edgeCases: [
        "movement_id 3004 daha önce kullanılmışsa benzersizlik kuralı eklemeyi reddeder; yeni bir kimlik seçmeden aynı hareketi tekrar yazmak geçmişi çoğaltmamalıdır.",
        "movement_type ile quantity_delta işareti çelişirse satır teknik olarak yazılabilse bile stok anlamı bozulur; IN için pozitif fark kuralı veri sözleşmesinde veya constraint ile korunmalıdır.",
      ],
      workplaceImpact:
        "Hareketi ekleyip oluşan satırı aynı işlemde geri almak; stok, ödeme ve denetim günlüklarında geçmişi korur, yanlış yazma ile ekranda gösterilen durum arasındaki farkı azaltır.",
      transfer: {
        prompt:
          "Ürün 803 için 2 adetlik bir stok çıkışı kaydetmen gerekse olay sözleşmesindeki miktar ve hareket türünü nasıl değiştirir, hangi alanları yine RETURNING ile doğrulardın?",
        reveal:
          "Yeni ve benzersiz bir movement_id kullanır, quantity_delta değerini çıkışı temsil edecek biçimde -2 ve movement_type değerini OUT yapardın; olay kimliği, ürün, miktar farkı ve türü yine birlikte döndürülmelidir.",
      },
    },
  },
  "m8-t3": {
    learningBrief: {
      conceptAnchor:
        "DELETE işleminin etki alanını batch, satır numarası ve durum koşullarının kesişimiyle tek kayda indirmek; gerçekten silinen satırı RETURNING ile görünür kılmak.",
      outputGrain:
        "Çıktıdaki tek satır, B-77 batch'indeki 2 numaralı draft ithalat kaydından silme anında geri dönen değerleri temsil eder.",
      acceptanceChecks: [
        "Yalnız batch_id B-77, row_no 2 ve status draft olan kayıt silinmeli ve tek satır dönmeli.",
        "B-78 içindeki 2 numaralı draft kayıt ile B-77 içindeki approved kayıtlar korunmalı.",
        "RETURNING çıktısı import_row_id, batch_id ve status kolonlarını bu sırada içermeli.",
      ],
      dataNotes: [
        "Aynı row_no ve draft durumu başka bir batch içinde de bulunur; yalnız satır numarası veya yalnız durum güvenli bir silme hedefi oluşturmaz.",
        "B-77 içinde approved kayıtların bulunması, batch koşulunun tek başına yeterli olmadığını gösterir; üç koşul aynı satır üzerinde birlikte sağlanmalıdır.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "Silme hedefi ile üç koşulu doğru SQL bölümlerine yerleştir",
        checks: [
          "DELETE hedefinin import_rows olduğunu ve batch_id, row_no, status kolon adlarını şemadaki yazımlarıyla kullandığını kontrol et.",
          "B-77 ve draft değerlerini metin sabiti olarak yazdığını; WHERE koşulları ile RETURNING listesinin doğru sırada bulunduğunu doğrula.",
        ],
      },
      "columns-wrong": {
        title: "Silinen kayıt kanıtının üç kolonunu eşleştir",
        checks: [
          "RETURNING listesinin import_row_id, batch_id ve status kolonlarını tam olarak bu sırada verdiğini kontrol et.",
          "row_no gibi hedefleme için gerekli ama teslimde istenmeyen alanları sonuçtan çıkardığını doğrula.",
        ],
      },
      "rows-wrong": {
        title: "Silme kapsamını B-77 içindeki tek draft satıra daralt",
        checks: [
          "batch_id = 'B-77' ve row_no = 2 koşullarının aynı hedef satıra uygulandığını kontrol et.",
          "status = 'draft' koşulunun bulunduğunu; B-78 draft satırını veya B-77 approved satırlarını silmediğini doğrula.",
        ],
      },
      "order-wrong": {
        title: "Tek silinen kayıtta satır sırası arama",
        checks: [
          "Görev yalnız bir kayıt sildiği için ORDER BY ile bir satır sırası kurman gerekmediğini hatırla.",
          "Uyuşmazlığın import_row_id, batch_id ve status kolonlarının yer değiştirmesinden kaynaklanmadığını kontrol et.",
        ],
      },
      "required-concept-missing": {
        title:
          "Filtrelenmiş görünüm değil gerçek ve kanıtlanabilir bir DELETE kullan",
        checks: [
          "Hedef kaydı yalnız SELECT ile listelemediğini, DELETE ile import_rows tablosundan gerçekten kaldırdığını doğrula.",
          "Silinen satırın kimliğini ve durumunu ayrı bir sorguyla tahmin etmek yerine aynı DELETE işleminin RETURNING çıktısından aldığını kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Silinecek ithalat kaydını B-77 batch'i, 2 numaralı satır ve draft durumu ile tanımladın.",
        "Üç koşulu birlikte uygulayarak benzer row_no veya status taşıyan diğer kayıtları etki alanının dışında tuttun.",
        "Silinen kaydın import_row_id, batch_id ve status değerlerini RETURNING ile denetledin.",
      ],
      whyItWorks:
        "WHERE içindeki üç koşul mantıksal bir kayıt anahtarı gibi davranıp geniş silme riskini azaltır. RETURNING yalnız gerçekten kaldırılan satırı gösterdiği için hedefleme niyeti ile oluşan veritabanı durumunu aynı kanıtta buluşturur.",
      edgeCases: [
        "Hedef kayıt daha önce silinmiş veya approved durumuna geçmişse işlem boş sonuç döndürür; sıfır etkilenen satır başarılı temizlik olarak sessizce geçilmemelidir.",
        "batch_id metin karşılaştırması birebirdir; kaynaktan 'b-77' gibi farklı yazım gelirse hedef bulunmaz. Yıkıcı sorgudan önce paket kimliğinin kanonik biçimi doğrulanmalıdır.",
      ],
      workplaceImpact:
        "Çok koşullu hedefleme ve silinen satırı geri döndürme; ithalat kuyruğu, geçici dosya ve staging temizliğinde başka batch'lerin veya onaylanmış kayıtların yanlışlıkla kaybolmasını önlemeye yardım eder.",
      transfer: {
        prompt:
          "Aynı satır numarasındaki B-78 draft kaydını temizlemen istense hangi koşul değişir, onaylı kayıtları koruyan hangi iki kontrol aynı kalırdı?",
        reveal:
          "batch_id B-78 olarak değişir; row_no 2 ve status draft koşulları korunur. Böylece aynı batch'teki farklı satırlar ile approved kayıtlar yine silme kapsamına girmez.",
      },
    },
  },
  "m8-t4": {
    learningBrief: {
      conceptAnchor:
        "Birleşik anahtarlı günlük snapshot'ı INSERT ile denemek, anahtar çakıştığında mevcut satırı kontrollü biçimde güncellemek ve tek güncel post-state üretmek.",
      outputGrain:
        "Çıktıdaki tek satır, branch_id 1 ve 2026-05-20 tarihinin çakışma sonrası güncel günlük metrik snapshot'ını temsil eder.",
      acceptanceChecks: [
        "branch_id 1 ve metric_date 2026-05-20 kaydı tek satır olarak kalmalı; order_count 14 ve revenue 1620 olmalı.",
        "Diğer şubelere veya diğer günlere ait branch_daily_metrics kayıtları değişmeden korunmalı.",
        "RETURNING çıktısı branch_id, metric_date, order_count ve revenue kolonlarını bu sırada içermeli.",
      ],
      dataNotes: [
        "(branch_id, metric_date) birleşimi tablonun primary key'idir; hedef anahtarda zaten order_count 11 ve revenue 1250 değerlerini taşıyan bir snapshot vardır.",
        "Yeni değerler eski değerlere eklenecek farklar değil, o şube-gün için 14 sipariş ve 1620 gelirden oluşan güncel mutlak snapshot'tır.",
      ],
    },
    coaching: {
      "execution-error": {
        title: "INSERT, çakışma hedefi ve güncelleme bölümlerini hizala",
        checks: [
          "INSERT hedefinin branch_daily_metrics olduğunu ve tarih sabitini 2026-05-20 için geçerli bir DATE değeri olarak yazdığını kontrol et.",
          "Çakışma hedefinde birleşik anahtarın hem branch_id hem metric_date kolonlarını içerdiğini; güncelleme bölümünde order_count ve revenue değerlerinin doğru kaynaktan alındığını doğrula.",
        ],
      },
      "columns-wrong": {
        title: "Güncel snapshot kanıtını dört kolonla sabitle",
        checks: [
          "RETURNING kolonlarının branch_id, metric_date, order_count ve revenue sırasını izlediğini kontrol et.",
          "Eski değerleri, hesap yardımcılarını veya fazladan teknik alanları sonuç sözleşmesine eklemediğini doğrula.",
        ],
      },
      "rows-wrong": {
        title: "Doğru şube-günü tek güncel snapshot'a getir",
        checks: [
          "Çakışma anahtarının branch_id 1 ile 2026-05-20 tarihini birlikte hedeflediğini ve aynı anahtarda ikinci bir satır üretmediğini kontrol et.",
          "order_count değerini 11'den 14'e, revenue değerini 1250'den 1620'ye getirdiğini; diğer şube veya gün satırlarını değiştirmediğini doğrula.",
        ],
      },
      "order-wrong": {
        title: "Tek snapshot satırında kolon sırasını denetle",
        checks: [
          "Bu görev tek bir birleşik anahtar döndürdüğü için satır sırasının değerlendirilmediğini hatırla.",
          "Metric_date ile metrik kolonlarının RETURNING listesinde beklenen soldan sağa düzende bulunduğunu kontrol et.",
        ],
      },
      "required-concept-missing": {
        title:
          "Yalnız UPDATE değil iki olasılığı yöneten gerçek bir UPSERT kur",
        checks: [
          "Mevcut satırı doğrudan UPDATE etmek yerine önce günlük snapshot'ı INSERT etmeyi deneyen ve anahtar çakışmasını açıkça yöneten yaklaşımı kullandığını doğrula.",
          "Çakışmada yeni snapshot değerlerini mevcut satıra yazdığını ve oluşan tek post-state'i RETURNING ile döndürdüğünü kontrol et.",
        ],
      },
    },
    debrief: {
      steps: [
        "Branch 1 ve 2026-05-20 birleşimini günlük snapshot'ın doğal anahtarı olarak kullandın.",
        "Aynı anahtar zaten bulunduğu için yeni bir satır çoğaltmak yerine order_count değerini 14, revenue değerini 1620 olarak güncelledin.",
        "Çakışma sonrası tek güncel satırı RETURNING çıktısında doğrulayıp diğer şube-gün kayıtlarını korudun.",
      ],
      whyItWorks:
        "Birleşik primary key aynı şube ve gün için iki snapshot oluşmasını engeller. UPSERT'in çakışma kolu yalnız bu anahtardaki satırı yeni mutlak değerlerle günceller; RETURNING de işlemin INSERT mi UPDATE mi yolundan geçtiğinden bağımsız olarak oluşan güncel durumu verir.",
      edgeCases: [
        "Aynı sorgu mutlak 14 ve 1620 değerleriyle yeniden çalışırsa sonuç değişmemelidir; güncelleme eski değerin üzerine fark ekleseydi yeniden çalıştırma metriği şişirirdi.",
        "Yeni bir branch_id ve metric_date birleşimi gelirse INSERT yolu çalışır; negatif order_count veya revenue ise tablodaki CHECK kuralları tarafından reddedilir.",
      ],
      workplaceImpact:
        "İdempotent UPSERT deseni günlük özet, API senkronizasyonu ve tekrar çalışabilen veri boru hatlarında aynı doğal anahtarın çoğalmasını önlerken en son doğrulanmış snapshot'ı güvenle yayımlar.",
      transfer: {
        prompt:
          "Branch 2 için daha önce bulunmayan 2026-05-21 snapshot'ı aynı yapıyla yazılırsa hangi işlem yolu çalışır ve doğrulama çıktısında hangi tane korunur?",
        reveal:
          "Birleşik anahtar tabloda bulunmadığı için INSERT yolu çalışır. RETURNING yine tek bir şube-gün snapshot'ını, yani branch 2 ile 2026-05-21 birleşiminin güncel metriklerini gösterir.",
      },
    },
  },
};
