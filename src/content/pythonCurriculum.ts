import {
  definePythonTask,
  type PythonCurriculum,
  type PythonCurriculumModule,
  type PythonLessonTask,
} from "../types/pythonLesson";

type PythonTaskInput = Omit<
  PythonLessonTask,
  "track" | "packages" | "resultVariable" | "numericTolerance"
> & {
  numericTolerance?: number;
};

const createPythonTask = (input: PythonTaskInput): PythonLessonTask =>
  definePythonTask({
    ...input,
    track: "python",
    packages: ["pandas"],
    resultVariable: "result",
    numericTolerance: input.numericTolerance ?? 0.001,
  });

const shapeAudit = createPythonTask({
  id: "py-m1-t1",
  slug: "ilk-veri-saglik-kontrolu",
  moduleId: "py-module-1",
  title: "İlk veri sağlık kontrolü",
  subtitle: "Satır, kolon, eksik hücre ve tekrarları tek bakışta ölç.",
  scenario:
    "Büyüme ekibi haftalık sipariş dosyasını teslim etti. Analize başlamadan önce dosyanın boyutunu ve iki temel veri kalitesi riskini görünür kılman gerekiyor.",
  objective:
    "orders_raw DataFrame'inin satır ve kolon sayısını, toplam eksik hücre sayısını ve tamamen tekrarlanan satır sayısını tek satırlık bir özet olarak üret.",
  outputGrain: "Tüm veri seti için tek sağlık özeti satırı",
  difficulty: "beginner",
  estimatedMinutes: 12,
  prerequisites: [],
  concepts: ["DataFrame.shape", "isna", "duplicated", "özet metrik"],
  dataNotes: [
    "Eksik hücre, hangi kolonda olduğundan bağımsız olarak tek tek sayılır.",
    "duplicate_rows yalnızca bütünüyle aynı olan fazladan satırları sayar.",
  ],
  datasets: [
    {
      name: "Ham siparişler",
      variableName: "orders_raw",
      description:
        "Tekrarlı bir sipariş ve üç eksik hücre içeren küçük teslim dosyası.",
      rows: [
        { order_id: 1001, channel: "Organic", revenue: 120 },
        { order_id: 1002, channel: "Paid Search", revenue: 250 },
        { order_id: 1003, channel: "Email", revenue: null },
        { order_id: 1003, channel: "Email", revenue: null },
        { order_id: 1004, channel: "Paid Search", revenue: 90 },
        { order_id: 1005, channel: null, revenue: 180 },
      ],
    },
  ],
  starterCode: `import pandas as pd

# orders_raw hazır bir pandas DataFrame'idir.
# Dört metriği tek satırlık bir DataFrame'e dönüştür.
result = pd.DataFrame([])`,
  expectedColumns: [
    "row_count",
    "column_count",
    "missing_cells",
    "duplicate_rows",
  ],
  expectedRows: [[6, 3, 3, 1]],
  expectedDtypes: {
    row_count: "int64",
    column_count: "int64",
    missing_cells: "int64",
    duplicate_rows: "int64",
  },
  orderSensitive: false,
  acceptanceChecks: [
    "result tam olarak bir satır ve dört beklenen kolon içerir.",
    "Eksik değerler tüm hücreler üzerinden sayılır ve missing_cells 3 olur.",
    "Tam satır tekrarları duplicated ile ölçülür ve duplicate_rows 1 olur.",
  ],
  hints: [
    {
      title: "Önce boyutu gör",
      body: "DataFrame.shape iki elemanlı bir tuple döndürür: önce satır, sonra kolon.",
    },
    {
      title: "Boolean değerleri say",
      body: "isna() ve duplicated() boolean üretir; True değerleri sum() ile sayılabilir.",
    },
    {
      title: "Tek satırlık sözlük",
      body: "Dört metriği bir sözlüğe koyup pd.DataFrame([sozluk]) biçiminde result'a ata.",
    },
  ],
  solutionCode: `import pandas as pd

result = pd.DataFrame([{
    "row_count": len(orders_raw),
    "column_count": orders_raw.shape[1],
    "missing_cells": int(orders_raw.isna().sum().sum()),
    "duplicate_rows": int(orders_raw.duplicated().sum()),
}])`,
  explanation:
    "shape veri hacmini, isna toplam eksikliği, duplicated ise aynı kaydın kaç kez fazladan geldiğini ölçer. Analize başlamadan bu üç riskin aynı özette görülmesi sonraki kararların güvenilirliğini artırır.",
  completionMessage: "Veriyi değiştirmeden önce sağlık fotoğrafını çıkardın.",
  debrief: {
    steps: [
      "DataFrame'in satır ve kolon boyutunu okudun.",
      "Eksik hücreleri kolonlar boyunca topladın.",
      "Tam satır tekrarlarını ayrı bir kalite sinyaline dönüştürdün.",
    ],
    whyItWorks:
      "Bu dört metrik veri tesliminin hacim, bütünlük ve tekrar risklerini tek, karşılaştırılabilir bir kontrata dönüştürür.",
    edgeCases: [
      "Aynı order_id'ye sahip ama diğer alanları farklı satırlar tam tekrar sayılmaz.",
      "Boş bir DataFrame'de satır sayısı sıfır olsa da kolon sayısı sıfır olmak zorunda değildir.",
    ],
    workplaceImpact:
      "Dosya yenilendiğinde bu özeti yeniden çalıştırarak beklenmedik hacim veya kalite değişimini analize girmeden yakalayabilirsin.",
    transfer: {
      prompt:
        "Eksik hücre toplamı yerine eksikliği en yüksek kolonun adını ve sayısını nasıl üretirdin?",
      reveal:
        "orders_raw.isna().sum() sonucunu azalan sıralayıp ilk indeks ve değeri seçebilirsin.",
    },
  },
  nextTaskId: "py-m1-t2",
});

const columnProfile = createPythonTask({
  id: "py-m1-t2",
  slug: "kolon-profili-cikar",
  moduleId: "py-module-1",
  title: "Kolon profilini çıkar",
  subtitle: "Her alanın doluluk ve çeşitlilik seviyesini karşılaştır.",
  scenario:
    "CRM ekibi lead dosyasındaki hangi alanların analiz için güvenilir olduğunu soruyor. Tek tek kolonlara bakmak yerine tekrar kullanılabilir bir profil tablosu hazırlamalısın.",
  objective:
    "leads DataFrame'indeki her kolon için dolu değer, eksik değer ve null hariç benzersiz değer sayılarını üret.",
  outputGrain: "Kaynak DataFrame'deki her kolon için bir profil satırı",
  difficulty: "beginner",
  estimatedMinutes: 14,
  prerequisites: ["py-m1-t1"],
  concepts: ["notna", "isna", "nunique", "kolon bazlı profil"],
  dataNotes: [
    "unique hesabında null bir kategori gibi sayılmamalıdır.",
    "Satır sırası kaynak DataFrame'deki kolon sırasını izler.",
  ],
  datasets: [
    {
      name: "Müşteri adayları",
      variableName: "leads",
      description:
        "Kaynak, şehir ve skor alanlarında farklı doluluk örüntüleri bulunan lead listesi.",
      rows: [
        { lead_id: 1, source: "Google", city: "İstanbul", score: 80 },
        { lead_id: 2, source: "Referral", city: "Ankara", score: 70 },
        { lead_id: 3, source: "Google", city: "İstanbul", score: null },
        { lead_id: 4, source: "Organic", city: "İzmir", score: 65 },
        { lead_id: 5, source: "Referral", city: "Ankara", score: 90 },
        { lead_id: 6, source: "Organic", city: "İzmir", score: 65 },
        { lead_id: 7, source: null, city: "İstanbul", score: 80 },
      ],
    },
  ],
  starterCode: `import pandas as pd

# Her kolon için bir profil satırı üret.
result = pd.DataFrame({
    "column": [],
    "non_null": [],
    "missing": [],
    "unique": [],
})`,
  expectedColumns: ["column", "non_null", "missing", "unique"],
  expectedRows: [
    ["lead_id", 7, 0, 7],
    ["source", 6, 1, 3],
    ["city", 7, 0, 3],
    ["score", 6, 1, 4],
  ],
  expectedDtypes: {
    column: "object",
    non_null: "int64",
    missing: "int64",
    unique: "int64",
  },
  orderSensitive: true,
  acceptanceChecks: [
    "result kaynak kolon sırasını koruyan dört profil satırı içerir.",
    "non_null ve missing her kolon için toplam 7 eder.",
    "unique null değerleri dışarıda bırakır; source ve city için 3 olur.",
  ],
  hints: [
    {
      title: "Kolon isimleri hazır",
      body: "leads.columns doğrudan column alanının değerlerini sağlayabilir.",
    },
    {
      title: "Üç seri üret",
      body: "notna().sum(), isna().sum() ve nunique(dropna=True) kolon bazında aynı indeksli seriler döndürür.",
    },
    {
      title: "Değerleri hizala",
      body: "Bu serilerin .values değerlerini bir DataFrame sözlüğünde yan yana yerleştir.",
    },
  ],
  solutionCode: `import pandas as pd

result = pd.DataFrame({
    "column": leads.columns,
    "non_null": leads.notna().sum().values,
    "missing": leads.isna().sum().values,
    "unique": leads.nunique(dropna=True).values,
})`,
  explanation:
    "Kolon profili yalnızca eksikliği değil, alanın ne kadar ayrıştırıcı olduğunu da gösterir. Örneğin city eksiksiz olsa da üç kategoriye, lead_id ise her satırda benzersiz bir değere sahiptir.",
  completionMessage: "Kolonların güvenilirlik ve çeşitlilik haritası hazır.",
  debrief: {
    steps: [
      "Kolon adlarını profil tablosunun satır anahtarına çevirdin.",
      "Doluluk ve eksikliği birbirini doğrulayan metrikler olarak hesapladın.",
      "Null değerleri kategori saymadan benzersizliği ölçtün.",
    ],
    whyItWorks:
      "Tüm metrikler aynı kolon ekseninde üretildiği için hizalama hatası olmadan karşılaştırılabilir bir veri sözlüğü oluşur.",
    edgeCases: [
      "Tamamen boş bir kolonun non_null ve unique değerleri sıfırdır.",
      "Metinlerde büyük-küçük harf veya sondaki boşluklar ayrı benzersiz değerler sayılabilir.",
    ],
    workplaceImpact:
      "Modelleme ya da dashboard öncesinde kimlik, kategori ve ölçü alanlarını daha hızlı sınıflandırabilirsin.",
    transfer: {
      prompt:
        "Profile bir missing_rate yüzdesi eklemek için hangi iki metriği kullanırsın?",
      reveal:
        "Her kolonun missing sayısını len(leads)'e bölüp 100 ile çarparak oran üretebilirsin.",
    },
  },
  nextTaskId: "py-m1-t3",
});

const distributionAndOutlier = createPythonTask({
  id: "py-m1-t3",
  slug: "dagilimi-ve-aykiri-degeri-oku",
  moduleId: "py-module-1",
  title: "Dağılımı ve aykırı değeri oku",
  subtitle: "Ortalamanın arkasındaki dağılımı IQR ile sorgula.",
  scenario:
    "Günlük satış ortalaması beklenenden yüksek görünüyor. Finans ekibi bunun kalıcı performans mı, yoksa tek bir sıra dışı gün mü olduğunu anlamak istiyor.",
  objective:
    "daily_sales.revenue için temel dağılım metriklerini hesapla ve 1.5×IQR üst sınırını aşan gün sayısını bul.",
  outputGrain: "Gelir dağılımı için tek özet satırı",
  difficulty: "beginner",
  estimatedMinutes: 18,
  prerequisites: ["py-m1-t2"],
  concepts: ["mean", "median", "quantile", "IQR", "aykırı değer"],
  dataNotes: [
    "Pandas quantile varsayılan doğrusal enterpolasyonunu kullan.",
    "Sadece üst sınırı aşan değerleri aykırı kabul et.",
  ],
  datasets: [
    {
      name: "Günlük satışlar",
      variableName: "daily_sales",
      description:
        "Yedi tipik gün ve tek bir yüksek satış günü içeren gelir serisi.",
      rows: [
        { day: "2026-03-01", revenue: 95 },
        { day: "2026-03-02", revenue: 105 },
        { day: "2026-03-03", revenue: 110 },
        { day: "2026-03-04", revenue: 115 },
        { day: "2026-03-05", revenue: 120 },
        { day: "2026-03-06", revenue: 125 },
        { day: "2026-03-07", revenue: 130 },
        { day: "2026-03-08", revenue: 480 },
      ],
    },
  ],
  starterCode: `import pandas as pd

revenue = daily_sales["revenue"]

# q1, q3, iqr ve upper_bound değerlerini hesapla.
# Sonucu tek satırlık result DataFrame'ine ata.
result = pd.DataFrame([])`,
  expectedColumns: [
    "count",
    "mean",
    "median",
    "q1",
    "q3",
    "iqr",
    "upper_bound",
    "outlier_count",
  ],
  expectedRows: [[8, 160, 117.5, 108.75, 126.25, 17.5, 152.5, 1]],
  orderSensitive: false,
  numericTolerance: 0.001,
  acceptanceChecks: [
    "Ortalama 160 ve medyan 117.5 olarak ayrı ayrı raporlanır.",
    "Q1 108.75, Q3 126.25 ve buna bağlı üst sınır 152.5 olur.",
    "480 değeri üst sınırı aşan tek kayıt olduğu için outlier_count 1 olur.",
  ],
  hints: [
    {
      title: "Çeyrekleri bul",
      body: "revenue.quantile(0.25) Q1'i, revenue.quantile(0.75) Q3'ü verir.",
    },
    {
      title: "IQR sınırı",
      body: "IQR = Q3 - Q1; üst sınır = Q3 + 1.5 * IQR formülünü kullan.",
    },
    {
      title: "Sınırı aşanları say",
      body: "(revenue > upper_bound).sum() aykırı gün sayısını verir; tüm metrikleri tek sözlükte topla.",
    },
  ],
  solutionCode: `import pandas as pd

revenue = daily_sales["revenue"]
q1 = revenue.quantile(0.25)
q3 = revenue.quantile(0.75)
iqr = q3 - q1
upper_bound = q3 + 1.5 * iqr

result = pd.DataFrame([{
    "count": int(revenue.count()),
    "mean": revenue.mean(),
    "median": revenue.median(),
    "q1": q1,
    "q3": q3,
    "iqr": iqr,
    "upper_bound": upper_bound,
    "outlier_count": int((revenue > upper_bound).sum()),
}])`,
  explanation:
    "Ortalama 480'lik günden güçlü biçimde etkilenirken medyan tipik günü daha iyi temsil eder. IQR, dağılımın orta yarısına dayanarak aykırı eşiğini uç değerden bağımsız kurar.",
  completionMessage:
    "Yüksek ortalamanın tek bir aykırı günden geldiğini kanıtladın.",
  debrief: {
    steps: [
      "Merkez ölçüsü olarak ortalama ve medyanı karşılaştırdın.",
      "Q1 ve Q3 üzerinden dağılımın orta yarısını ölçtün.",
      "IQR üst sınırını aşan kayıtları saydın.",
    ],
    whyItWorks:
      "IQR uç gözlemlere dirençlidir; bu yüzden küçük ve çarpık serilerde aykırı değer sinyali için güvenilir bir ilk kontroldür.",
    edgeCases: [
      "Dağılım doğal olarak sağa çarpıksa yüksek değerler iş hatası değil gerçek davranış olabilir.",
      "Çok küçük örneklemlerde IQR sınırı tek başına silme kararı vermek için yeterli değildir.",
    ],
    workplaceImpact:
      "KPI sunmadan önce ortalamayı sürükleyen günleri açıklayabilir ve veri hatası ile gerçek kampanya etkisini ayırabilirsin.",
    transfer: {
      prompt:
        "Alt aykırı değerleri de işaretlemek için hangi ek sınırı kurarsın?",
      reveal:
        "lower_bound = q1 - 1.5 * iqr formülünü kullanıp iki sınırı birlikte test edersin.",
    },
  },
  nextTaskId: "py-m2-t1",
});

const normalizeTypes = createPythonTask({
  id: "py-m2-t1",
  slug: "tipleri-ve-tarihleri-duzelt",
  moduleId: "py-module-2",
  title: "Tipleri ve tarihleri düzelt",
  subtitle: "Metin olarak gelen ölçü ve tarihleri güvenli biçimde dönüştür.",
  scenario:
    "Ödeme dışa aktarımında tarih ve tutar kolonları metin olarak gelmiş. Geçersiz tarihi gizlemeden, kayıtları analiz edilebilir bir sözleşmeye çevirmelisin.",
  objective:
    "order_date alanını güvenli şekilde tarihe, amount alanını sayıya dönüştür; tarih geçerliliğini ayrı bir boolean kolonla göster.",
  outputGrain: "Her ham işlem için bir temizleme ve geçerlilik satırı",
  difficulty: "beginner",
  estimatedMinutes: 18,
  prerequisites: ["py-m1-t3"],
  concepts: ["to_datetime", "to_numeric", "errors=coerce", "veri tipi"],
  dataNotes: [
    "Geçersiz tarih result içinde null kalmalı ve date_valid False olmalıdır.",
    "Geçerli tarihler YYYY-MM-DD metin biçiminde teslim edilir.",
  ],
  datasets: [
    {
      name: "Ham işlemler",
      variableName: "transactions_raw",
      description:
        "İki tarih biçimi ve bir geçersiz tarih içeren ödeme dışa aktarımı.",
      rows: [
        { transaction_id: "T-01", order_date: "2026-01-03", amount: "1250.50" },
        { transaction_id: "T-02", order_date: "2026/01/08", amount: "875.00" },
        { transaction_id: "T-03", order_date: "invalid", amount: "420.25" },
        { transaction_id: "T-04", order_date: "2026-02-14", amount: "1100.00" },
      ],
    },
  ],
  starterCode: `import pandas as pd

clean = transactions_raw.copy()

# Tarih ve tutar kolonlarını güvenli biçimde dönüştür.
# Geçersiz tarihi silme; date_valid ile işaretle.
result = clean`,
  expectedColumns: ["transaction_id", "order_date", "amount", "date_valid"],
  expectedRows: [
    ["T-01", "2026-01-03", 1250.5, true],
    ["T-02", "2026-01-08", 875, true],
    ["T-03", null, 420.25, false],
    ["T-04", "2026-02-14", 1100, true],
  ],
  expectedDtypes: { amount: "float64", date_valid: "bool" },
  orderSensitive: true,
  acceptanceChecks: [
    "Dört işlem de result içinde korunur; geçersiz kayıt sessizce silinmez.",
    "amount sayısal değerlere dönüşür ve toplam 3645.75 olarak hesaplanabilir.",
    "T-03 için order_date null, date_valid False; diğer tarihler ISO metnidir.",
  ],
  hints: [
    {
      title: "Hatalı tarihi yakala",
      body: "pd.to_datetime(..., errors='coerce', format='mixed') geçersiz değeri NaT yapar.",
    },
    {
      title: "Geçerlilik sinyali",
      body: "Dönüştürülmüş tarih serisinde notna() kullanarak date_valid üret.",
    },
    {
      title: "Teslim biçimi",
      body: "Tarih serisini .dt.strftime('%Y-%m-%d') ile metne çevir; NaT değeri null olarak kalır.",
    },
  ],
  solutionCode: `import pandas as pd

clean = transactions_raw.copy()
parsed_dates = pd.to_datetime(
    clean["order_date"],
    errors="coerce",
    format="mixed",
)
clean["amount"] = pd.to_numeric(clean["amount"], errors="coerce")
clean["date_valid"] = parsed_dates.notna()
clean["order_date"] = parsed_dates.dt.strftime("%Y-%m-%d")

result = clean[["transaction_id", "order_date", "amount", "date_valid"]]`,
  explanation:
    "errors='coerce' tüm çalışmayı durdurmak yerine bozuk değeri görünür bir null'a çevirir. date_valid kolonu, sonraki adımda bu kaydın düzeltilmesi ya da karantinaya alınması için açık bir kalite sinyalidir.",
  completionMessage:
    "Ham metinleri analiz edilebilir tiplere çevirdin; hatayı da saklamadın.",
  debrief: {
    steps: [
      "Kaynak DataFrame'i değiştirmenin önüne geçmek için kopya aldın.",
      "Tarih ve tutarı hata toleranslı pandas dönüştürücüleriyle ayrıştırdın.",
      "Geçersiz tarihi ayrı bir boolean sinyalle teslim ettin.",
    ],
    whyItWorks:
      "Dönüşüm ile kalite kontrol aynı akışta yapıldığı için analiz tipi kazanılırken veri kaybı sessizce gerçekleşmez.",
    edgeCases: [
      "01/02/2026 gibi belirsiz tarihler için kaynak ülke kuralı açıkça belirlenmelidir.",
      "Para birimi işaretleri ve binlik ayraçlar to_numeric öncesinde normalize edilmelidir.",
    ],
    workplaceImpact:
      "Dashboard hesaplarının metin sıralaması veya geçersiz tarihler yüzünden bozulmasını önlersin.",
    transfer: {
      prompt: "Geçersiz tutarları da ayrı bir kolonla nasıl görünür kılarsın?",
      reveal:
        "Ham amount doluyken pd.to_numeric sonucu null olan satırları karşılaştırarak amount_valid üretebilirsin.",
    },
  },
  nextTaskId: "py-m2-t2",
});

const handleMissingValues = createPythonTask({
  id: "py-m2-t2",
  slug: "eksik-stogu-politikayla-doldur",
  moduleId: "py-module-2",
  title: "Eksik stoğu politikayla doldur",
  subtitle:
    "Tek bir sabit yerine kategori bağlamını kullanan tamamlamayı uygula.",
  scenario:
    "Stok raporunda iki ürünün güncel sayımı eksik. Satın alma ekibi bu ürünleri tamamen dışarıda bırakmadan, açık ve tekrar üretilebilir bir varsayımla öncelik listesi istiyor.",
  objective:
    "Eksik stock değerlerini ürün kategorisinin medyanıyla doldur ve doldurulmuş stok reorder_point'in altındaysa needs_reorder üret.",
  outputGrain: "Her ürün için doldurulmuş stok ve sipariş kararı",
  difficulty: "beginner",
  estimatedMinutes: 18,
  prerequisites: ["py-m2-t1"],
  concepts: ["groupby.transform", "median", "fillna", "boolean kolon"],
  dataNotes: [
    "Karşılaştırma strikt küçüktür; stok eşik ile eşitse yeniden sipariş gerekmez.",
    "Orijinal stock kolonu değiştirilmeden stock_filled üretilir.",
  ],
  datasets: [
    {
      name: "Stok durumu",
      variableName: "inventory",
      description:
        "Kategori içinde tamamlanabilecek iki eksik stok değeri bulunan ürün listesi.",
      rows: [
        {
          product_id: "A",
          category: "Stationery",
          stock: 12,
          reorder_point: 5,
        },
        {
          product_id: "B",
          category: "Stationery",
          stock: null,
          reorder_point: 8,
        },
        { product_id: "C", category: "Tech", stock: 4, reorder_point: 10 },
        { product_id: "D", category: "Tech", stock: 10, reorder_point: 6 },
        { product_id: "E", category: "Tech", stock: null, reorder_point: 7 },
      ],
    },
  ],
  starterCode: `import pandas as pd

clean = inventory.copy()

# Her satıra kendi kategorisinin medyan stok değerini hizala.
# stock_filled ve needs_reorder kolonlarını üret.
result = clean`,
  expectedColumns: ["product_id", "stock_filled", "needs_reorder"],
  expectedRows: [
    ["A", 12, false],
    ["B", 12, false],
    ["C", 4, true],
    ["D", 10, false],
    ["E", 7, false],
  ],
  expectedDtypes: { stock_filled: "float64", needs_reorder: "bool" },
  orderSensitive: true,
  acceptanceChecks: [
    "Eksik Stationery stoğu 12, eksik Tech stoğu 7 ile doldurulur.",
    "Yalnızca C ürünü reorder_point altında olduğu için needs_reorder True olur.",
    "result beş ürünü ve yalnızca üç beklenen kolonu kaynak sırasıyla içerir.",
  ],
  hints: [
    {
      title: "Medyanı satırlara taşı",
      body: "groupby('category')['stock'].transform('median') her satıra kategori medyanını hizalar.",
    },
    {
      title: "Yalnızca boşları doldur",
      body: "stock.fillna(category_median) mevcut stokları korur ve eksik olanları tamamlar.",
    },
    {
      title: "Karar kolonunu üret",
      body: "stock_filled < reorder_point karşılaştırması doğrudan boolean needs_reorder serisini verir.",
    },
  ],
  solutionCode: `import pandas as pd

clean = inventory.copy()
category_median = clean.groupby("category")["stock"].transform("median")
clean["stock_filled"] = clean["stock"].fillna(category_median)
clean["needs_reorder"] = clean["stock_filled"] < clean["reorder_point"]

result = clean[["product_id", "stock_filled", "needs_reorder"]]`,
  explanation:
    "Kategori medyanı ürün bağlamını korur ve uç değerlere ortalamadan daha dayanıklıdır. transform sonucu orijinal satır indeksine hizalandığından doldurma işlemi güvenli biçimde yapılır.",
  completionMessage:
    "Eksik stokları açıklanabilir bir kuralla tamamlayıp karara çevirdin.",
  debrief: {
    steps: [
      "Kategori grupları için medyan stok seviyesini hesapladın.",
      "Medyanları kaynak satırlara transform ile hizaladın.",
      "Doldurulmuş stok ile sipariş eşiğini karşılaştırdın.",
    ],
    whyItWorks:
      "Grup bazlı tamamlama, tüm ürünlere aynı sayıyı vermek yerine benzer ürünlerin dağılımını kullanır.",
    edgeCases: [
      "Bir kategorinin tüm stock değerleri eksikse kategori medyanı da eksik kalır.",
      "Stoğun sıfır olması eksik değer değildir ve fillna tarafından değiştirilmez.",
    ],
    workplaceImpact:
      "Eksik kayıtlar yüzünden ürünleri rapordan düşürmeden, varsayımını denetlenebilir biçimde karar tablosuna taşırsın.",
    transfer: {
      prompt: "Hangi satırların doldurulduğunu sonradan nasıl ayırt edersin?",
      reveal:
        "clean['stock_imputed'] = clean['stock'].isna() şeklinde bir iz kolonunu koruyabilirsin.",
    },
  },
  nextTaskId: "py-m2-t3",
});

const deduplicateCustomers = createPythonTask({
  id: "py-m2-t3",
  slug: "musteri-tekrarlarini-coz",
  moduleId: "py-module-2",
  title: "Müşteri tekrarlarını çöz",
  subtitle: "Her müşteri için en güncel ve tek kaydı koru.",
  scenario:
    "CRM birleşimi aynı müşteriyi birden fazla kez üretmiş. Pazarlama listesinde eski e-posta adresine mesaj gitmemesi ve müşteri değerinin iki kez sayılmaması gerekiyor.",
  objective:
    "updated_at alanını tarihe çevir, customer_id içinde en güncel kaydı tut ve sonucu müşteri kimliğine göre sırala.",
  outputGrain: "Her customer_id için en fazla bir güncel kayıt",
  difficulty: "beginner",
  estimatedMinutes: 18,
  prerequisites: ["py-m2-t2"],
  concepts: [
    "sort_values",
    "drop_duplicates",
    "keep=last",
    "kayıt tekilleştirme",
  ],
  dataNotes: [
    "C3 için iki satır tamamen aynıdır; sonuçta yalnızca biri kalmalıdır.",
    "updated_at teslimde YYYY-MM-DD metni olarak gösterilir.",
  ],
  datasets: [
    {
      name: "CRM müşteri kayıtları",
      variableName: "customer_records",
      description: "Güncellenmiş ve birebir tekrarlanmış müşteri kayıtları.",
      rows: [
        {
          customer_id: "C1",
          email: "ada@old.example",
          updated_at: "2026-01-01",
          lifetime_value: 100,
        },
        {
          customer_id: "C1",
          email: "ada@example",
          updated_at: "2026-02-01",
          lifetime_value: 130,
        },
        {
          customer_id: "C2",
          email: "mert@example",
          updated_at: "2026-01-15",
          lifetime_value: 80,
        },
        {
          customer_id: "C3",
          email: "selin@example",
          updated_at: "2026-01-20",
          lifetime_value: 60,
        },
        {
          customer_id: "C3",
          email: "selin@example",
          updated_at: "2026-01-20",
          lifetime_value: 60,
        },
      ],
    },
  ],
  starterCode: `import pandas as pd

clean = customer_records.copy()

# updated_at ile en yeni kaydı belirle.
# Her customer_id için tek satır bırak.
result = clean`,
  expectedColumns: ["customer_id", "email", "updated_at", "lifetime_value"],
  expectedRows: [
    ["C1", "ada@example", "2026-02-01", 130],
    ["C2", "mert@example", "2026-01-15", 80],
    ["C3", "selin@example", "2026-01-20", 60],
  ],
  orderSensitive: true,
  acceptanceChecks: [
    "Beş kaynak satırından üç benzersiz müşteri satırı kalır.",
    "C1 için 2026-02-01 tarihli güncel e-posta ve lifetime_value 130 korunur.",
    "Sonuç customer_id artan sırasındadır ve updated_at ISO metni olarak teslim edilir.",
  ],
  hints: [
    {
      title: "Önce tarihi dönüştür",
      body: "Metin tarihini pd.to_datetime ile dönüştürmek kronolojik sıralamayı açık kılar.",
    },
    {
      title: "Eski önce, yeni sonra",
      body: "updated_at artan sıralanırsa drop_duplicates(..., keep='last') en güncel satırı korur.",
    },
    {
      title: "Teslimi sabitle",
      body: "Tekilleştirmeden sonra customer_id ile sırala, tarihi strftime ile biçimle ve indeksi sıfırla.",
    },
  ],
  solutionCode: `import pandas as pd

clean = customer_records.copy()
clean["updated_at"] = pd.to_datetime(clean["updated_at"])
clean = (
    clean.sort_values(["customer_id", "updated_at"])
    .drop_duplicates(subset="customer_id", keep="last")
    .sort_values("customer_id")
    .reset_index(drop=True)
)
clean["updated_at"] = clean["updated_at"].dt.strftime("%Y-%m-%d")

result = clean[["customer_id", "email", "updated_at", "lifetime_value"]]`,
  explanation:
    "Tekilleştirme kuralı ancak önce hangi kaydın tercih edileceği tanımlandığında güvenlidir. Kronolojik sıralama ve keep='last' birlikte açık, tekrar üretilebilir bir seçim yapar.",
  completionMessage:
    "Müşteri tablosunu güncel ve tekil bir analiz girdisine dönüştürdün.",
  debrief: {
    steps: [
      "Güncelleme tarihini karşılaştırılabilir tipe çevirdin.",
      "Her müşteri içinde eski kayıttan yeni kayda sıraladın.",
      "En son kaydı tutup deterministik bir teslim sırası kurdun.",
    ],
    whyItWorks:
      "Kimlik ve güncellik kuralı birlikte kullanıldığı için rastgele bir tekrar değil, iş açısından doğru kayıt korunur.",
    edgeCases: [
      "Aynı müşterinin aynı updated_at değerine sahip farklı kayıtlarında ek bir tie-breaker gerekir.",
      "Boş customer_id değerleri ayrı bir karantina kuralıyla ele alınmalıdır.",
    ],
    workplaceImpact:
      "Kampanya erişimini ve müşteri değerini çift sayma riskini azaltırsın.",
    transfer: {
      prompt:
        "Aynı tarihte iki kayıt varsa en dolu kaydı seçmek için ne eklersin?",
      reveal:
        "Satır bazında dolu alan sayısı üretip updated_at sonrasında bu skora göre sıralayarak tie-breaker kurabilirsin.",
    },
  },
  nextTaskId: "py-m3-t1",
});

const deriveOrderMetrics = createPythonTask({
  id: "py-m3-t1",
  slug: "siparis-karliligini-turet",
  moduleId: "py-module-3",
  title: "Sipariş kârlılığını türet",
  subtitle: "İş filtresini uygula, kâr ve marj kolonlarını üret.",
  scenario:
    "Ticaret ekibi yalnızca tamamlanan siparişlerin gerçekleşmiş kârlılığını görmek istiyor. İptal ve iade kayıtları operasyonel tabloda dursa da bu teslimde KPI'a girmemeli.",
  objective:
    "completed siparişleri filtrele; gross_profit ve iki ondalığa yuvarlanmış margin_pct kolonlarını hesapla.",
  outputGrain: "Her tamamlanmış sipariş için bir kârlılık satırı",
  difficulty: "beginner",
  estimatedMinutes: 16,
  prerequisites: ["py-m2-t3"],
  concepts: ["boolean filtre", "assign", "türetilmiş kolon", "marj"],
  dataNotes: [
    "gross_profit = revenue - cost.",
    "margin_pct = gross_profit / revenue * 100 ve iki ondalıkla gösterilir.",
  ],
  datasets: [
    {
      name: "Sipariş kârlılığı",
      variableName: "orders",
      description:
        "Tamamlanmış, iptal edilmiş ve iade edilmiş siparişlerden oluşan operasyon tablosu.",
      rows: [
        {
          order_id: "O1",
          channel: "Organic",
          status: "completed",
          revenue: 200,
          cost: 120,
        },
        {
          order_id: "O2",
          channel: "Paid",
          status: "cancelled",
          revenue: 300,
          cost: 150,
        },
        {
          order_id: "O3",
          channel: "Email",
          status: "completed",
          revenue: 150,
          cost: 90,
        },
        {
          order_id: "O4",
          channel: "Paid",
          status: "completed",
          revenue: 500,
          cost: 350,
        },
        {
          order_id: "O5",
          channel: "Organic",
          status: "returned",
          revenue: 100,
          cost: 80,
        },
        {
          order_id: "O6",
          channel: "Organic",
          status: "completed",
          revenue: 250,
          cost: 175,
        },
      ],
    },
  ],
  starterCode: `import pandas as pd

# Yalnızca completed siparişlerin bağımsız bir kopyasını al.
completed = orders.loc[orders["status"] == "completed"].copy()

# Kâr ve marj kolonlarını ekle.
result = completed`,
  expectedColumns: [
    "order_id",
    "channel",
    "revenue",
    "cost",
    "gross_profit",
    "margin_pct",
  ],
  expectedRows: [
    ["O1", "Organic", 200, 120, 80, 40],
    ["O3", "Email", 150, 90, 60, 40],
    ["O4", "Paid", 500, 350, 150, 30],
    ["O6", "Organic", 250, 175, 75, 30],
  ],
  orderSensitive: true,
  acceptanceChecks: [
    "Yalnızca status değeri completed olan O1, O3, O4 ve O6 kayıtları kalır.",
    "gross_profit her satırda revenue eksi cost olarak hesaplanır.",
    "margin_pct O1 ve O3 için 40, O4 ve O6 için 30 olur.",
  ],
  hints: [
    {
      title: "Önce doğru evren",
      body: "orders.loc[orders['status'] == 'completed'].copy() ile KPI evrenini ayır.",
    },
    {
      title: "Kâr farktır",
      body: "completed['gross_profit'] = completed['revenue'] - completed['cost'].",
    },
    {
      title: "Marj oranını yuvarla",
      body: "gross_profit'i revenue'ya böl, 100 ile çarp ve .round(2) uygula.",
    },
  ],
  solutionCode: `import pandas as pd

completed = orders.loc[orders["status"] == "completed"].copy()
completed["gross_profit"] = completed["revenue"] - completed["cost"]
completed["margin_pct"] = (
    completed["gross_profit"] / completed["revenue"] * 100
).round(2)

result = completed[[
    "order_id",
    "channel",
    "revenue",
    "cost",
    "gross_profit",
    "margin_pct",
]].reset_index(drop=True)`,
  explanation:
    "Önce iş kuralına uygun evreni filtrelemek, türetilmiş KPI'ların iptal ve iadelerle kirlenmesini önler. Kopya almak da zincirli atama belirsizliğini ortadan kaldırır.",
  completionMessage:
    "Operasyon satırlarını karar verilebilir kârlılık metriklerine çevirdin.",
  debrief: {
    steps: [
      "Gerçekleşmiş sipariş evrenini statü filtresiyle tanımladın.",
      "Gelir ve maliyetten sipariş kârını türettin.",
      "Kârı gelir ölçeğine taşıyarak karşılaştırılabilir marj ürettin.",
    ],
    whyItWorks:
      "Filtre ve formül açık biçimde aynı akışta yer aldığı için KPI'ın hangi satırlardan ve hangi kuralla oluştuğu izlenebilir.",
    edgeCases: [
      "Revenue sıfırsa margin_pct sonsuz olabilir; üretim kodunda güvenli bölme gerekir.",
      "İadelerin ayrı bir negatif gelir politikası varsa yalnızca filtrelemek yeterli olmayabilir.",
    ],
    workplaceImpact:
      "Kampanya veya kanal kıyasından önce güvenilir sipariş seviyesinde kârlılık tabanı oluşturursun.",
    transfer: {
      prompt:
        "Marjı yüzde yerine 0–1 oranında teslim etmek için neyi değiştirirsin?",
      reveal:
        "Formülden * 100 adımını çıkarırsın; kolon adını da margin_rate gibi açıkça değiştirirsin.",
    },
  },
  nextTaskId: "py-m3-t2",
});

const segmentKpis = createPythonTask({
  id: "py-m3-t2",
  slug: "kanal-kpilarini-uret",
  moduleId: "py-module-3",
  title: "Kanal KPI'larını üret",
  subtitle:
    "Siparişleri kanal seviyesinde karşılaştırılabilir metriklere topla.",
  scenario:
    "Pazarlama lideri hangi kanalın hacim, müşteri erişimi ve sepet değeri açısından öne çıktığını tek tabloda görmek istiyor.",
  objective:
    "Kanal bazında sipariş, benzersiz müşteri, toplam gelir ve ortalama sipariş değeri hesapla; gelire göre azalan sırala.",
  outputGrain: "Her pazarlama kanalı için bir KPI satırı",
  difficulty: "intermediate",
  estimatedMinutes: 22,
  prerequisites: ["py-m3-t1"],
  concepts: ["groupby", "agg", "nunique", "named aggregation", "sıralama"],
  dataNotes: [
    "orders sipariş satırı sayısıdır; customers benzersiz customer_id sayısıdır.",
    "avg_order_value iki ondalığa yuvarlanır.",
  ],
  datasets: [
    {
      name: "Kanal siparişleri",
      variableName: "channel_orders",
      description:
        "Üç kanal, sekiz sipariş ve tekrarlayan müşteriler içeren performans tablosu.",
      rows: [
        { order_id: "P1", customer_id: "C1", channel: "Paid", revenue: 300 },
        { order_id: "P2", customer_id: "C2", channel: "Paid", revenue: 200 },
        { order_id: "P3", customer_id: "C2", channel: "Paid", revenue: 100 },
        { order_id: "O1", customer_id: "C3", channel: "Organic", revenue: 180 },
        { order_id: "O2", customer_id: "C4", channel: "Organic", revenue: 220 },
        { order_id: "O3", customer_id: "C5", channel: "Organic", revenue: 100 },
        { order_id: "E1", customer_id: "C6", channel: "Email", revenue: 120 },
        { order_id: "E2", customer_id: "C6", channel: "Email", revenue: 80 },
      ],
    },
  ],
  starterCode: `import pandas as pd

# Named aggregation ile kanal KPI'larını üret.
# avg_order_value kolonunu iki ondalığa yuvarla.
result = pd.DataFrame([])`,
  expectedColumns: [
    "channel",
    "orders",
    "customers",
    "revenue",
    "avg_order_value",
  ],
  expectedRows: [
    ["Paid", 3, 2, 600, 200],
    ["Organic", 3, 3, 500, 166.67],
    ["Email", 2, 1, 200, 100],
  ],
  orderSensitive: true,
  numericTolerance: 0.01,
  acceptanceChecks: [
    "Paid, Organic ve Email için birer satır üretilir ve gelir azalan sıralanır.",
    "Paid için 3 sipariş ama 2 benzersiz müşteri; Email için 2 sipariş ama 1 müşteri sayılır.",
    "Organic avg_order_value değeri iki ondalıkla 166.67 olur.",
  ],
  hints: [
    {
      title: "Named aggregation kullan",
      body: "groupby('channel').agg(orders=('order_id','count'), ...) çıktıya doğrudan anlamlı kolon adları verir.",
    },
    {
      title: "Müşteriyi ayrı say",
      body: "customers için customer_id üzerinde nunique; revenue ve avg_order_value için revenue üzerinde sum ve mean kullan.",
    },
    {
      title: "Teslim sırası",
      body: "reset_index sonrası avg_order_value'ı round(2) yap ve revenue'ya göre ascending=False sırala.",
    },
  ],
  solutionCode: `import pandas as pd

result = (
    channel_orders.groupby("channel", as_index=False)
    .agg(
        orders=("order_id", "count"),
        customers=("customer_id", "nunique"),
        revenue=("revenue", "sum"),
        avg_order_value=("revenue", "mean"),
    )
    .sort_values("revenue", ascending=False)
    .reset_index(drop=True)
)
result["avg_order_value"] = result["avg_order_value"].round(2)`,
  explanation:
    "Named aggregation farklı iş metriklerini aynı grup seviyesinde açıkça tanımlar. Sipariş ve benzersiz müşteri sayısını ayırmak, tekrar alışveriş ile erişimi birbirine karıştırmayı önler.",
  completionMessage:
    "Ham siparişleri karşılaştırılabilir kanal performansına topladın.",
  debrief: {
    steps: [
      "Analiz tanesini channel olarak belirledin.",
      "Aynı groupby içinde hacim, erişim, gelir ve ortalama ürettin.",
      "Karar önceliğine uygun biçimde gelire göre sıraladın.",
    ],
    whyItWorks:
      "Tüm KPI'lar aynı grup evreninden üretildiği için kanal satırları tutarlı ve doğrudan kıyaslanabilir olur.",
    edgeCases: [
      "Eksik channel değerleri groupby tarafından varsayılan olarak dışarıda kalabilir.",
      "Bir order_id birden çok satıra bölünmüşse count yerine nunique gerekebilir.",
    ],
    workplaceImpact:
      "Bütçe tartışmasını tek bir gelir metriğinden çıkarıp hacim, erişim ve sepet bağlamına taşırsın.",
    transfer: {
      prompt: "Her kanalın toplam gelir içindeki payını nasıl eklersin?",
      reveal:
        "result['revenue_share'] = result['revenue'] / result['revenue'].sum() formülünü kullanırsın.",
    },
  },
  nextTaskId: "py-m3-t3",
});

const pivotChannelPerformance = createPythonTask({
  id: "py-m3-t3",
  slug: "kanal-performansini-pivotla",
  moduleId: "py-module-3",
  title: "Kanal performansını pivotla",
  subtitle:
    "Uzun formdaki aylık veriyi yönetici karşılaştırma matrisine çevir.",
  scenario:
    "Pazarlama toplantısında aylar satırda, kanallar yan yana görülmek isteniyor. Kaynak dosya ise her ay-kanal kombinasyonunu ayrı satırda tutuyor.",
  objective:
    "monthly_channel_sales verisini month satırları ve channel kolonları olacak biçimde pivotla; eksikleri sıfırla ve kolon sırasını sabitle.",
  outputGrain: "Her ay için kanal gelirlerini yan yana gösteren bir satır",
  difficulty: "intermediate",
  estimatedMinutes: 18,
  prerequisites: ["py-m3-t2"],
  concepts: ["pivot_table", "uzun-geniş veri", "fill_value", "kolon sırası"],
  dataNotes: [
    "Değer alanı revenue, toplama kuralı sum olmalıdır.",
    "Teslim kolon sırası month, Email, Organic, Paid biçimindedir.",
  ],
  datasets: [
    {
      name: "Aylık kanal satışları",
      variableName: "monthly_channel_sales",
      description: "İki ay ve üç kanalın uzun formda tutulduğu gelir tablosu.",
      rows: [
        { month: "2026-01", channel: "Paid", revenue: 120 },
        { month: "2026-01", channel: "Organic", revenue: 90 },
        { month: "2026-01", channel: "Email", revenue: 50 },
        { month: "2026-02", channel: "Paid", revenue: 150 },
        { month: "2026-02", channel: "Organic", revenue: 110 },
        { month: "2026-02", channel: "Email", revenue: 70 },
      ],
    },
  ],
  starterCode: `import pandas as pd

# index=month, columns=channel, values=revenue olacak şekilde pivot üret.
# Sonucu normal kolonlu ve sabit sıralı bir DataFrame olarak teslim et.
result = pd.DataFrame([])`,
  expectedColumns: ["month", "Email", "Organic", "Paid"],
  expectedRows: [
    ["2026-01", 50, 90, 120],
    ["2026-02", 70, 110, 150],
  ],
  orderSensitive: true,
  acceptanceChecks: [
    "Her month yalnızca bir satırdır ve üç kanal ayrı kolonlara dönüşür.",
    "2026-01 satırı Email 50, Organic 90 ve Paid 120 değerlerini içerir.",
    "Kolon ve ay sırası beklenen teslim kontratıyla birebir aynıdır.",
  ],
  hints: [
    {
      title: "Pivot eksenlerini seç",
      body: "pivot_table içinde index='month', columns='channel', values='revenue' kullan.",
    },
    {
      title: "Toplama kuralını açıkla",
      body: "aggfunc='sum' ve fill_value=0 olası tekrar veya eksik kombinasyonları güvenli ele alır.",
    },
    {
      title: "İndeksi geri getir",
      body: "reset_index sonrası [['month','Email','Organic','Paid']] ile teslim sırasını sabitle.",
    },
  ],
  solutionCode: `import pandas as pd

result = (
    monthly_channel_sales.pivot_table(
        index="month",
        columns="channel",
        values="revenue",
        aggfunc="sum",
        fill_value=0,
    )
    .reset_index()
    .sort_values("month")
    .reset_index(drop=True)
)
result.columns.name = None
result = result[["month", "Email", "Organic", "Paid"]]`,
  explanation:
    "Pivot, ölçünün tanesini değiştirmeden kategorileri kolonlara taşır. aggfunc ve fill_value açıkça verildiği için tekrar veya eksik kombinasyonlarda davranış tahmine bırakılmaz.",
  completionMessage:
    "Uzun form veriyi toplantıda okunabilir bir performans matrisine çevirdin.",
  debrief: {
    steps: [
      "Ayı satır, kanalı kolon ekseni olarak tanımladın.",
      "Geliri ay-kanal kesişiminde topladın.",
      "İndeksi ve kolon sırasını teslim kontratına göre düzenledin.",
    ],
    whyItWorks:
      "Uzun form hesaplama için esnek kalırken geniş form yan yana iş kıyasını kolaylaştırır; pivot iki görünüm arasında kontrollü geçiş sağlar.",
    edgeCases: [
      "Yeni bir kanal geldiğinde sabit kolon seçimi güncellenmezse sonuçtan düşebilir.",
      "Aynı ay-kanal için birden çok satır varsa aggfunc iş kuralıyla uyumlu seçilmelidir.",
    ],
    workplaceImpact:
      "Yönetici sunumları ve heatmap benzeri görseller için hazır bir ay-kanal matrisi üretirsin.",
    transfer: {
      prompt:
        "Kanalları gelir yerine dönüşüm sayısıyla karşılaştırmak için neyi değiştirirsin?",
      reveal:
        "values parametresini conversions kolonuna yönlendirir, diğer pivot sözleşmesini korursun.",
    },
  },
  nextTaskId: "py-m4-t1",
});

const periodGrowth = createPythonTask({
  id: "py-m4-t1",
  slug: "donemsel-buyumeyi-hesapla",
  moduleId: "py-module-4",
  title: "Dönemsel büyümeyi hesapla",
  subtitle: "Aylık gelirin yalnız seviyesini değil değişim hızını da ölç.",
  scenario:
    "Yönetim gelir grafiğindeki yükseliş ve düşüşlerin oranını soruyor. Mutlak gelir tek başına aylar arasındaki ivmeyi anlatmıyor.",
  objective:
    "Aylık kayıtları kronolojik sırala ve revenue için bir önceki aya göre growth_pct hesapla.",
  outputGrain: "Her ay için gelir ve önceki aya göre büyüme satırı",
  difficulty: "intermediate",
  estimatedMinutes: 18,
  prerequisites: ["py-m3-t3"],
  concepts: ["to_datetime", "sort_values", "pct_change", "dönemsel büyüme"],
  dataNotes: [
    "İlk ayın karşılaştırma dönemi olmadığı için growth_pct null kalır.",
    "growth_pct yüzde ölçeğinde ve iki ondalıkla teslim edilir.",
  ],
  datasets: [
    {
      name: "Aylık gelir",
      variableName: "monthly_revenue",
      description:
        "Dört aylık gelir seviyesi; kaynak sırası bilinçli olarak kronolojik değildir.",
      rows: [
        { month: "2026-03", revenue: 900 },
        { month: "2026-01", revenue: 1000 },
        { month: "2026-04", revenue: 1350 },
        { month: "2026-02", revenue: 1200 },
      ],
    },
  ],
  starterCode: `import pandas as pd

trend = monthly_revenue.copy()

# month alanını tarihe çevirip kronolojik sırala.
# revenue üzerinden growth_pct üret.
result = trend`,
  expectedColumns: ["month", "revenue", "growth_pct"],
  expectedRows: [
    ["2026-01", 1000, null],
    ["2026-02", 1200, 20],
    ["2026-03", 900, -25],
    ["2026-04", 1350, 50],
  ],
  orderSensitive: true,
  numericTolerance: 0.01,
  acceptanceChecks: [
    "Kaynak sırası düzeltilir ve aylar 2026-01'den 2026-04'e kronolojik gelir.",
    "Büyüme oranları sırasıyla null, 20, -25 ve 50 olur.",
    "month teslimde YYYY-MM biçimindedir ve result yalnızca üç beklenen kolonu içerir.",
  ],
  hints: [
    {
      title: "Metin sırasına güvenme",
      body: "month alanını pd.to_datetime ile dönüştür ve sort_values ile zaman sırasını kur.",
    },
    {
      title: "Önceki döneme oran",
      body: "revenue.pct_change() önceki satıra göre oransal değişimi hesaplar.",
    },
    {
      title: "Yüzde ve biçim",
      body: "pct_change sonucunu 100 ile çarpıp round(2) yap; month'u strftime('%Y-%m') ile geri biçimle.",
    },
  ],
  solutionCode: `import pandas as pd

trend = monthly_revenue.copy()
trend["month"] = pd.to_datetime(trend["month"])
trend = trend.sort_values("month").reset_index(drop=True)
trend["growth_pct"] = trend["revenue"].pct_change().mul(100).round(2)
trend["month"] = trend["month"].dt.strftime("%Y-%m")

result = trend[["month", "revenue", "growth_pct"]]`,
  explanation:
    "pct_change satır sırasına bağlıdır; bu yüzden zaman alanını önce gerçek tarihe çevirmek ve sıralamak hesaplamanın parçasıdır. İlk satırın null olması hata değil, karşılaştırma döneminin yokluğudur.",
  completionMessage:
    "Gelir seviyesini aylık ivmeyle birlikte okunur hâle getirdin.",
  debrief: {
    steps: [
      "Ay metnini zaman tipine dönüştürdün.",
      "Kayıtları kronolojik ve deterministik sıraya aldın.",
      "Önceki döneme göre yüzde değişimi hesapladın.",
    ],
    whyItWorks:
      "Zaman sırası hesaplamadan önce kurulduğu için her değişim gerçekten bir önceki döneme referans verir.",
    edgeCases: [
      "Önceki dönem geliri sıfırsa büyüme oranı sonsuz olabilir.",
      "Eksik aylar varsa pct_change son mevcut satıra göre hesaplar; takvim sürekliliği ayrıca kontrol edilmelidir.",
    ],
    workplaceImpact:
      "Yalnızca hangi ayın büyük olduğunu değil, performansın hızlandığı veya tersine döndüğü noktayı anlatırsın.",
    transfer: {
      prompt: "Yıllık aynı aya göre büyüme için pct_change nasıl değişir?",
      reveal:
        "Aylık ve eksiksiz seride pct_change(periods=12) ile bir önceki yılın aynı ayını baz alırsın.",
    },
  },
  nextTaskId: "py-m4-t2",
});

const rollingDemand = createPythonTask({
  id: "py-m4-t2",
  slug: "hareketli-ortalamayla-sinyali-yumusat",
  moduleId: "py-module-4",
  title: "Hareketli ortalamayla sinyali yumuşat",
  subtitle: "Günlük dalgalanmayı üç günlük pencereyle okunur hâle getir.",
  scenario:
    "Operasyon ekibi günlük sipariş oynaklığından dolayı vardiya planlamakta zorlanıyor. Son üç günün yakın dönem seviyesini gösteren basit bir sinyale ihtiyaç var.",
  objective:
    "Tarih sırasını kur, üç günlük hareketli sipariş ortalamasını hesapla ve yalnızca tam pencere oluşan günleri teslim et.",
  outputGrain: "Tam üç günlük pencereye sahip her gün için bir trend satırı",
  difficulty: "intermediate",
  estimatedMinutes: 20,
  prerequisites: ["py-m4-t1"],
  concepts: ["rolling", "window", "min_periods", "hareketli ortalama"],
  dataNotes: [
    "Pencere mevcut gün ile önceki iki günü kapsar.",
    "İlk iki gün tam pencere oluşturmadığı için result içinde yer almaz.",
  ],
  datasets: [
    {
      name: "Günlük talep",
      variableName: "daily_demand",
      description:
        "Altı günlük sipariş sayısı; hareketli pencereyi elle doğrulayacak kadar küçük.",
      rows: [
        { date: "2026-04-01", orders: 10 },
        { date: "2026-04-02", orders: 14 },
        { date: "2026-04-03", orders: 12 },
        { date: "2026-04-04", orders: 18 },
        { date: "2026-04-05", orders: 21 },
        { date: "2026-04-06", orders: 15 },
      ],
    },
  ],
  starterCode: `import pandas as pd

trend = daily_demand.copy()

# Tarihi sırala ve orders üzerinde 3 satırlık hareketli ortalama üret.
# Yalnızca tam pencere oluşan satırları result'a koy.
result = trend`,
  expectedColumns: ["date", "orders", "rolling_3d"],
  expectedRows: [
    ["2026-04-03", 12, 12],
    ["2026-04-04", 18, 14.67],
    ["2026-04-05", 21, 17],
    ["2026-04-06", 15, 18],
  ],
  orderSensitive: true,
  numericTolerance: 0.01,
  acceptanceChecks: [
    "İlk iki eksik pencere satırı teslimden çıkar ve dört tarih kalır.",
    "2026-04-03 rolling_3d değeri (10+14+12)/3 = 12 olur.",
    "2026-04-04 değeri 14.67, son iki değer 17 ve 18 olarak iki ondalıkla teslim edilir.",
  ],
  hints: [
    {
      title: "Zaman sırasını garanti et",
      body: "date alanını tarihe çevirip sort_values('date') ile pencerenin yönünü belirle.",
    },
    {
      title: "Tam pencere iste",
      body: "orders.rolling(window=3, min_periods=3).mean() ilk iki satırı NaN bırakır.",
    },
    {
      title: "Hazır sinyalleri seç",
      body: "rolling_3d notna olan satırları filtrele, iki ondalığa yuvarla ve tarihi ISO metne çevir.",
    },
  ],
  solutionCode: `import pandas as pd

trend = daily_demand.copy()
trend["date"] = pd.to_datetime(trend["date"])
trend = trend.sort_values("date").reset_index(drop=True)
trend["rolling_3d"] = (
    trend["orders"].rolling(window=3, min_periods=3).mean().round(2)
)
trend = trend.loc[trend["rolling_3d"].notna()].copy()
trend["date"] = trend["date"].dt.strftime("%Y-%m-%d")

result = trend[["date", "orders", "rolling_3d"]].reset_index(drop=True)`,
  explanation:
    "rolling mevcut satırın çevresinde sabit bir geçmiş penceresi kurar. min_periods=3 ile kısmi pencereleri rapora almamak, farklı büyüklükte ortalamaların aynı metrik gibi görünmesini önler.",
  completionMessage: "Günlük gürültüyü yakın dönem eğilimine dönüştürdün.",
  debrief: {
    steps: [
      "Günlük kayıtları zaman sırasına yerleştirdin.",
      "Sabit üç günlük ve tam pencere şartlı ortalama kurdun.",
      "Yalnızca karşılaştırılabilir pencereleri teslim ettin.",
    ],
    whyItWorks:
      "Her satır aynı sayıda gözlemi kullandığı için hareketli ortalamalar günler arasında tutarlı bir kısa dönem sinyali sağlar.",
    edgeCases: [
      "Eksik takvim günleri varsa üç satır her zaman üç takvim günü anlamına gelmez.",
      "Ani gerçek sıçramalar yumuşatıldığı için operasyonel alarm ayrıca korunmalıdır.",
    ],
    workplaceImpact:
      "Tek günlük oynaklığa aşırı tepki vermeden vardiya ve stok planı için daha dengeli bir talep sinyali sunarsın.",
    transfer: {
      prompt:
        "Son günlere daha fazla ağırlık vermek için hangi yaklaşımı denersin?",
      reveal:
        "Basit rolling mean yerine ewm ile üstel ağırlıklı hareketli ortalama üretebilirsin.",
    },
  },
  nextTaskId: "py-m4-t3",
});

const cohortRetention = createPythonTask({
  id: "py-m4-t3",
  slug: "cohort-retention-matrisi-kur",
  moduleId: "py-module-4",
  title: "Cohort retention tablosu kur",
  subtitle: "Müşteri aktivitesini edinim ayına ve geçen döneme göre çözümle.",
  scenario:
    "Ürün ekibi toplam aktif müşteri sayısının arkasında eski müşteri tutundurma davranışını görmek istiyor. Her edinim grubunun sonraki aylarda ne kadarının geri döndüğünü ölçmelisin.",
  objective:
    "Müşterileri signup_month cohort'una ayır; dönem numarası, aktif müşteri, cohort büyüklüğü ve retention_rate üret.",
  outputGrain:
    "Her cohort ayı ve geçen dönem kombinasyonu için bir retention satırı",
  difficulty: "intermediate",
  estimatedMinutes: 30,
  prerequisites: ["py-m4-t2"],
  concepts: ["cohort", "groupby", "merge", "dönem farkı", "retention"],
  dataNotes: [
    "period_number 0 müşterinin kayıt olduğu ayı temsil eder.",
    "Aynı müşteri aynı ayda birden çok aktivite üretse bile bir kez sayılmalıdır.",
  ],
  datasets: [
    {
      name: "Müşteri aylık aktivitesi",
      variableName: "customer_activity",
      description:
        "Ocak, şubat ve mart cohort'larının takip aylarındaki benzersiz aktivitesi.",
      rows: [
        {
          customer_id: "C1",
          signup_month: "2026-01",
          activity_month: "2026-01",
        },
        {
          customer_id: "C1",
          signup_month: "2026-01",
          activity_month: "2026-02",
        },
        {
          customer_id: "C1",
          signup_month: "2026-01",
          activity_month: "2026-03",
        },
        {
          customer_id: "C2",
          signup_month: "2026-01",
          activity_month: "2026-01",
        },
        {
          customer_id: "C2",
          signup_month: "2026-01",
          activity_month: "2026-02",
        },
        {
          customer_id: "C3",
          signup_month: "2026-02",
          activity_month: "2026-02",
        },
        {
          customer_id: "C3",
          signup_month: "2026-02",
          activity_month: "2026-03",
        },
        {
          customer_id: "C4",
          signup_month: "2026-02",
          activity_month: "2026-02",
        },
        {
          customer_id: "C5",
          signup_month: "2026-03",
          activity_month: "2026-03",
        },
      ],
    },
  ],
  starterCode: `import pandas as pd

activity = customer_activity.copy()

# signup_month ve activity_month alanlarını aylık Period tipine çevir.
# Cohort boyutunu ve her dönemdeki aktif müşteri sayısını birleştir.
result = pd.DataFrame([])`,
  expectedColumns: [
    "cohort_month",
    "period_number",
    "active_customers",
    "cohort_size",
    "retention_rate",
  ],
  expectedRows: [
    ["2026-01", 0, 2, 2, 100],
    ["2026-01", 1, 2, 2, 100],
    ["2026-01", 2, 1, 2, 50],
    ["2026-02", 0, 2, 2, 100],
    ["2026-02", 1, 1, 2, 50],
    ["2026-03", 0, 1, 1, 100],
  ],
  orderSensitive: true,
  numericTolerance: 0.01,
  acceptanceChecks: [
    "Ocak cohort'u 2 müşteriyle başlar; dönem 1 retention yüzde 100, dönem 2 yüzde 50 olur.",
    "Şubat cohort'u dönem 0'da 2, dönem 1'de 1 aktif müşteri gösterir.",
    "Altı satır cohort_month ve period_number artan sırasıyla teslim edilir.",
  ],
  hints: [
    {
      title: "Ayları Period yap",
      body: "pd.to_datetime(...).dt.to_period('M') aylık dönem aritmetiğini açık hâle getirir.",
    },
    {
      title: "Dönem farkını hesapla",
      body: "Yıl farkını 12 ile çarpıp ay farkını ekleyerek period_number üret; sonra cohort ve dönem bazında nunique say.",
    },
    {
      title: "Paydayı ayrı kur",
      body: "customer_id-cohort çiftlerinden cohort_size üret, aktif sayılara merge et ve active/cohort_size*100 hesapla.",
    },
  ],
  solutionCode: `import pandas as pd

activity = customer_activity.copy()
activity["signup_month"] = pd.to_datetime(activity["signup_month"]).dt.to_period("M")
activity["activity_month"] = pd.to_datetime(activity["activity_month"]).dt.to_period("M")
activity["period_number"] = (
    (activity["activity_month"].dt.year - activity["signup_month"].dt.year) * 12
    + activity["activity_month"].dt.month
    - activity["signup_month"].dt.month
)

cohort_sizes = (
    activity[["customer_id", "signup_month"]]
    .drop_duplicates()
    .groupby("signup_month", as_index=False)
    .agg(cohort_size=("customer_id", "nunique"))
)
active = (
    activity.groupby(["signup_month", "period_number"], as_index=False)
    .agg(active_customers=("customer_id", "nunique"))
)
result = active.merge(cohort_sizes, on="signup_month", how="left")
result["retention_rate"] = (
    result["active_customers"] / result["cohort_size"] * 100
).round(2)
result = result.sort_values(["signup_month", "period_number"]).reset_index(drop=True)
result["cohort_month"] = result["signup_month"].astype(str)
result = result[[
    "cohort_month",
    "period_number",
    "active_customers",
    "cohort_size",
    "retention_rate",
]]`,
  explanation:
    "Cohort analizi takvim ayını müşteri yaşına çevirir. Böylece farklı aylarda edinilen gruplar, kayıtlarından bu yana geçen eşit sürelerde kıyaslanır; toplam aktif sayının sakladığı tutundurma farkı görünür olur.",
  completionMessage:
    "Toplam aktivitenin arkasındaki müşteri tutundurma örüntüsünü ortaya çıkardın.",
  debrief: {
    steps: [
      "Kayıt ve aktivite aylarını dönem aritmetiğine uygun tipe çevirdin.",
      "Her cohort-dönem hücresinde benzersiz aktif müşteriyi saydın.",
      "Aktif sayıyı başlangıç cohort büyüklüğüne bölerek retention ürettin.",
    ],
    whyItWorks:
      "Her cohort kendi başlangıç büyüklüğüne göre normalize edildiği için farklı edinim hacmine sahip aylar adil biçimde karşılaştırılır.",
    edgeCases: [
      "Signup öncesi activity kayıtları negatif period üretir ve veri kalitesi kontrolüne alınmalıdır.",
      "Geç gelen event'ler geçmiş cohort oranlarını değiştirebilir; raporlama kesim tarihi belirtilmelidir.",
    ],
    workplaceImpact:
      "Edinim büyümesi ile gerçek müşteri bağlılığını ayırır, ürün değişikliklerinin hangi cohort'ta kalıcı etki yarattığını gösterirsin.",
    transfer: {
      prompt:
        "Retention'ı acquisition_channel kırılımında karşılaştırmak için ne yaparsın?",
      reveal:
        "Cohort anahtarına acquisition_channel ekler; cohort_sizes, active, merge ve sıralamada aynı anahtar setini korursun.",
    },
  },
  nextTaskId: null,
});

export const pythonTasks: PythonLessonTask[] = [
  shapeAudit,
  columnProfile,
  distributionAndOutlier,
  normalizeTypes,
  handleMissingValues,
  deduplicateCustomers,
  deriveOrderMetrics,
  segmentKpis,
  pivotChannelPerformance,
  periodGrowth,
  rollingDemand,
  cohortRetention,
];

export const pythonModules: PythonCurriculumModule[] = [
  {
    id: "py-module-1",
    slug: "veriyi-tani-eda",
    track: "python",
    order: 1,
    title: "Veriyi tanı — EDA",
    subtitle: "Hesaplamadan önce verinin sağlığını ve dağılımını sorgula.",
    description:
      "Bir analistin yeni veriyle ilk 30 dakikasını simüle eder: boyutu doğrula, kolonları profille ve ortalamanın arkasındaki dağılımı incele.",
    outcome:
      "Yeni bir DataFrame'i değiştirmeden önce kalite, yapı ve aykırı değer risklerini kanıtla özetleyebilirsin.",
    difficulty: "beginner",
    estimatedMinutes: 44,
    topics: ["shape", "eksik ve tekrar", "kolon profili", "dağılım", "IQR"],
    prerequisites: [],
    tasks: [shapeAudit, columnProfile, distributionAndOutlier],
  },
  {
    id: "py-module-2",
    slug: "veriyi-guvenilir-hale-getir",
    track: "python",
    order: 2,
    title: "Veriyi güvenilir hâle getir",
    subtitle: "Tip, eksik değer ve tekrar kararlarını açık kurallara bağla.",
    description:
      "Ham operasyon verisini sessiz veri kaybı yaratmadan temizler; her dönüşümün iş kuralını ve riskini görünür tutar.",
    outcome:
      "Tarih ve ölçü tiplerini güvenle dönüştürebilir, eksikleri bağlama göre tamamlayabilir ve güncellik kuralıyla tekilleştirebilirsin.",
    difficulty: "beginner",
    estimatedMinutes: 54,
    topics: [
      "tip dönüşümü",
      "tarih",
      "eksik değer",
      "group transform",
      "duplicate",
    ],
    prerequisites: ["py-module-1"],
    tasks: [normalizeTypes, handleMissingValues, deduplicateCustomers],
  },
  {
    id: "py-module-3",
    slug: "kpi-ve-segment-analizi",
    track: "python",
    order: 3,
    title: "KPI ve segment analizi",
    subtitle:
      "Satırları iş tanımına uygun metrik ve karşılaştırmalara dönüştür.",
    description:
      "Filtre, türetilmiş kolon, groupby ve pivot araçlarını gerçek pazarlama ve ticaret kararlarında bir araya getirir.",
    outcome:
      "Doğru analiz evrenini kurabilir, KPI üretebilir ve segmentleri okunabilir tablolarda kıyaslayabilirsin.",
    difficulty: "intermediate",
    estimatedMinutes: 56,
    topics: ["filtre", "türetilmiş kolon", "groupby", "KPI", "pivot"],
    prerequisites: ["py-module-2"],
    tasks: [deriveOrderMetrics, segmentKpis, pivotChannelPerformance],
  },
  {
    id: "py-module-4",
    slug: "zaman-ve-oruntu",
    track: "python",
    order: 4,
    title: "Zaman ve örüntü",
    subtitle:
      "Seviyenin ötesine geç; büyüme, yakın dönem sinyali ve retention ölç.",
    description:
      "Zaman sırasını analizin aktif bir parçası yapar ve toplamların sakladığı dönemsel davranışı görünür kılar.",
    outcome:
      "Dönemsel büyüme ve hareketli ortalama hesaplayabilir, cohort retention tablosuyla müşteri örüntüsünü açıklayabilirsin.",
    difficulty: "intermediate",
    estimatedMinutes: 68,
    topics: ["pct_change", "rolling", "dönem", "cohort", "retention"],
    prerequisites: ["py-module-3"],
    tasks: [periodGrowth, rollingDemand, cohortRetention],
  },
];

export const pythonCurriculum: PythonCurriculum = {
  modules: pythonModules,
  tasks: pythonTasks,
};

export const pythonTaskById = new Map(
  pythonTasks.map((task) => [task.id, task]),
);

export const pythonModuleById = new Map(
  pythonModules.map((module) => [module.id, module]),
);

export const getPythonTaskById = (
  taskId: string,
): PythonLessonTask | undefined => pythonTaskById.get(taskId);

export const getPythonModuleById = (
  moduleId: string,
): PythonCurriculumModule | undefined => pythonModuleById.get(moduleId);

export default pythonCurriculum;
