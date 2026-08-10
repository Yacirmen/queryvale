import {
  defineModule,
  type CurriculumModule,
  type LessonTask,
  type TaskSampleData,
  type TaskSchema,
} from "../types/lesson";
import { assertValidTaskCollection } from "../features/validation/task-content";
import { createTask, READ_ONLY_FORBIDDEN } from "./curriculumTaskFactory";
import {
  module8ExpansionTasks,
  module9ExpansionTasks,
  module10ExpansionTasks,
} from "./advancedExpansionTasks";
import { marketingProjectModule } from "./marketingProjects";

const productSetupSql = `
  CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL
  );

  INSERT INTO products
    (product_id, product_name, category, unit_price, stock_quantity)
  VALUES
    (101, 'Desk Lamp', 'Home', 45.90, 18),
    (102, 'Notebook', 'Stationery', 6.50, 120),
    (103, 'Office Chair', 'Furniture', 189.00, 7),
    (104, 'Water Bottle', 'Lifestyle', 22.00, 42),
    (105, 'Standing Desk', 'Furniture', 349.90, 4),
    (106, 'Pen Set', 'Stationery', 12.75, 65);
`;

const productSchema: TaskSchema = {
  tables: [
    {
      name: "products",
      description:
        "Satış kataloğundaki ürünlerin güncel stok ve fiyat bilgileri.",
      columns: [
        {
          name: "product_id",
          dataType: "INTEGER",
          nullable: false,
          primaryKey: true,
          description: "Ürünün benzersiz kimliği",
        },
        {
          name: "product_name",
          dataType: "TEXT",
          nullable: false,
          description: "Ürün adı",
        },
        {
          name: "category",
          dataType: "TEXT",
          nullable: false,
          description: "Ürün kategorisi",
        },
        {
          name: "unit_price",
          dataType: "NUMERIC(10,2)",
          nullable: false,
          description: "Birim satış fiyatı",
        },
        {
          name: "stock_quantity",
          dataType: "INTEGER",
          nullable: false,
          description: "Mevcut stok adedi",
        },
      ],
    },
  ],
};

const productSamples: TaskSampleData[] = [
  {
    tableName: "products",
    rows: [
      {
        product_id: 101,
        product_name: "Desk Lamp",
        category: "Home",
        unit_price: 45.9,
        stock_quantity: 18,
      },
      {
        product_id: 102,
        product_name: "Notebook",
        category: "Stationery",
        unit_price: 6.5,
        stock_quantity: 120,
      },
      {
        product_id: 103,
        product_name: "Office Chair",
        category: "Furniture",
        unit_price: 189,
        stock_quantity: 7,
      },
      {
        product_id: 105,
        product_name: "Standing Desk",
        category: "Furniture",
        unit_price: 349.9,
        stock_quantity: 4,
      },
    ],
  },
];

const firstContactTasks: LessonTask[] = [
  createTask({
    id: "m1-t1",
    slug: "catalog-view",
    moduleId: "module-1",
    title: "Katalog görünümünü hazırla",
    subtitle: "İlk sorgunda yalnız ürün adı ve kategoriyi getir.",
    scenario:
      "Ürün operasyon ekibi, haftalık katalog kontrolünde her ürünün adını ve kategorisini yan yana görmek istiyor.",
    objective:
      "products adlı ürün tablosundan product_name (ürün adı) ve category (kategori) kolonlarını bu sırayla getir.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    routeOrder: 1,
    curriculumConcepts: ["K01"],
    prerequisites: [],
    concepts: ["SELECT"],
    setupSql: productSetupSql,
    schema: productSchema,
    sampleRows: productSamples,
    expectedColumns: ["product_name", "category"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Desk Lamp", "Home"],
      ["Notebook", "Stationery"],
      ["Office Chair", "Furniture"],
      ["Water Bottle", "Lifestyle"],
      ["Standing Desk", "Furniture"],
      ["Pen Set", "Stationery"],
    ],
    orderSensitive: false,
    requiredConcepts: ["SELECT"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Her ürün sonuçta bir satır olarak kalmalı; yalnız görünen bilgiler ürün adı ve kategori olmalı.",
      "SELECT hangi kolonların gösterileceğini, FROM ise verinin hangi tablodan alınacağını söyler.",
      "İskelet: SELECT [ürün adı kolonu], [kategori kolonu] FROM [ürün tablosu];",
    ],
    explanation:
      "SELECT yalnızca ihtiyaç duyulan kolonları seçmeyi sağlar. Kolonları açıkça yazmak, gereksiz veriyi taşımayan ve amacı okunabilen rapor sorguları üretir.",
    completionMessage:
      "Katalog görünümü hazır. Artık bir tablodan hedef kolonları güvenle seçebiliyorsun.",
    nextTaskId: "m1-t2",
  }),
  createTask({
    id: "m1-t2",
    slug: "unique-categories",
    moduleId: "module-1",
    title: "Kategori listesini tekilleştir",
    subtitle: "Her kategoriyi listede yalnız bir kez göster.",
    scenario:
      "Satın alma ekibi, kategori seçim listesinde aynı adın tekrar etmemesini istiyor.",
    objective:
      "products tablosundaki category (kategori) kolonunu getir; aynı kategori birden fazla üründe bulunsa da sonuçta yalnız bir kez görünsün.",
    difficulty: "beginner",
    estimatedMinutes: 6,
    routeOrder: 2,
    curriculumConcepts: ["K01", "K13"],
    prerequisites: ["m1-t1"],
    concepts: ["SELECT", "DISTINCT"],
    setupSql: productSetupSql,
    schema: productSchema,
    sampleRows: productSamples,
    expectedColumns: ["category"],
    validationMode: "result-and-concepts",
    expectedResult: [["Home"], ["Stationery"], ["Furniture"], ["Lifestyle"]],
    orderSensitive: false,
    requiredConcepts: ["DISTINCT"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Hedef altı ürünü göstermek değil, bu ürünlerde geçen dört farklı kategoriyi birer kez göstermektir.",
      "DISTINCT, seçilen tekrar eden değerleri sonuçta birer kez gösterir ve SELECT'ten sonra yazılır.",
      "İskelet: SELECT DISTINCT [kategori kolonu] FROM [ürün tablosu];",
    ],
    explanation:
      "DISTINCT, seçilen kolon kombinasyonundaki tekrarları kaldırır. Burada tek kolon seçildiği için her kategori sonuçta yalnızca bir kez görünür.",
    completionMessage:
      "Filtre listesi temiz: dört benzersiz kategori elde ettin.",
    nextTaskId: "m1-t3",
  }),
  createTask({
    id: "m1-t3",
    slug: "critical-stock",
    moduleId: "module-1",
    title: "Kritik stokları sırala",
    subtitle: "En az stoğu kalan üç ürünü bul.",
    scenario:
      "Depo sorumlusu tedarik görüşmelerine stoğu en az olan ürünlerden başlayacak ve ilk üç ürünün adını, stok miktarını görmek istiyor.",
    objective:
      "products tablosundaki ürünleri stock_quantity (stok miktarı) küçükten büyüğe sırala. İlk 3 satırın product_name (ürün adı) ve stock_quantity kolonlarını bu sırayla getir.",
    difficulty: "beginner",
    estimatedMinutes: 8,
    routeOrder: 8,
    curriculumConcepts: ["K01", "K03", "K04", "K19"],
    prerequisites: ["m1-t4"],
    concepts: ["SELECT", "ORDER_BY", "LIMIT"],
    setupSql: productSetupSql,
    schema: productSchema,
    sampleRows: productSamples,
    expectedColumns: ["product_name", "stock_quantity"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Standing Desk", 4],
      ["Office Chair", 7],
      ["Desk Lamp", 18],
    ],
    orderSensitive: true,
    requiredConcepts: ["ORDER_BY", "LIMIT"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Önce bütün ürünleri en az stoktan en çok stoğa diz; sonra bu listenin ilk üç satırını al.",
      "ORDER BY satırları sıralar; ASC küçükten büyüğe yönü, LIMIT ise kaç satır alınacağını belirtir.",
      "İskelet: SELECT [ürün adı], [stok miktarı] FROM [ürün tablosu] ORDER BY [stok miktarı] ASC LIMIT [satır sayısı];",
    ],
    explanation:
      "ORDER BY sonucu belirli bir kolona göre sıralar; ASC küçükten büyüğe sıralamadır. LIMIT ise sıralanmış sonuç kümesinden gereken kadar satır alır.",
    completionMessage:
      "Tedarik öncelikleri netleşti. Sıralama ve satır sınırını birlikte kullandın.",
    nextTaskId: "m1-t4",
  }),
  createTask({
    id: "m1-t4",
    slug: "price-board",
    moduleId: "module-1",
    title: "Fiyat panosunu düzenle",
    subtitle: "Katalog fiyatlarını yüksekten düşüğe sun.",
    scenario:
      "Ticari ekip bütün ürün adlarını ve fiyatlarını görmek, en yüksek fiyatlı ürünü listenin başına almak istiyor.",
    objective:
      "products tablosundan product_name (ürün adı) ve unit_price (birim fiyat) kolonlarını getir. Hiçbir ürünü elemeden unit_price değerini yüksekten düşüğe sırala.",
    difficulty: "beginner",
    estimatedMinutes: 6,
    routeOrder: 7,
    curriculumConcepts: ["K01", "K03"],
    prerequisites: ["m2-t4"],
    concepts: ["SELECT", "ORDER_BY"],
    setupSql: productSetupSql,
    schema: productSchema,
    sampleRows: productSamples,
    expectedColumns: ["product_name", "unit_price"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Standing Desk", 349.9],
      ["Office Chair", 189],
      ["Desk Lamp", 45.9],
      ["Water Bottle", 22],
      ["Pen Set", 12.75],
      ["Notebook", 6.5],
    ],
    orderSensitive: true,
    requiredConcepts: ["ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Bütün ürünler sonuçta kalmalı; yalnızca okuma sırası değişmeli ve en yüksek fiyat ilk satırda olmalı.",
      "ORDER BY sıralanacak kolonu, DESC ise büyükten küçüğe yönü belirtir.",
      "İskelet: SELECT [ürün adı], [birim fiyat] FROM [ürün tablosu] ORDER BY [birim fiyat] DESC;",
    ],
    explanation:
      "DESC, ORDER BY sıralamasını büyükten küçüğe çevirir. Rapor tüketicisinin beklediği sıralamayı sorguda açıkça tanımlamak sonucu öngörülebilir yapar.",
    completionMessage:
      "Premium ürünler artık listenin başında. İlk modülü tamamladın.",
    nextTaskId: "m2-t1",
  }),
];

const orderSetupSql = `
  CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY,
    customer_name TEXT NOT NULL,
    city TEXT NOT NULL,
    status TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    ordered_at DATE NOT NULL,
    delivered_at DATE
  );

  INSERT INTO orders
    (order_id, customer_name, city, status, total_amount, ordered_at, delivered_at)
  VALUES
    (201, 'Arda', 'Istanbul', 'completed', 1240.00, DATE '2026-01-04', DATE '2026-01-06'),
    (202, 'Deniz', 'Ankara', 'pending', 320.00, DATE '2026-01-05', NULL),
    (203, 'Ece', 'Istanbul', 'cancelled', 90.00, DATE '2026-01-06', NULL),
    (204, 'Mert', 'Izmir', 'completed', 780.00, DATE '2026-01-07', DATE '2026-01-09'),
    (205, 'Selin', 'Bursa', 'processing', 450.00, DATE '2026-01-08', NULL),
    (206, 'Bora', 'Ankara', 'completed', 1560.00, DATE '2026-01-09', DATE '2026-01-11'),
    (207, 'Lina', 'Istanbul', 'pending', 210.00, DATE '2026-01-10', NULL);
`;

const orderSchema: TaskSchema = {
  tables: [
    {
      name: "orders",
      description:
        "E-ticaret siparişlerinin tutar, konum ve teslimat durumları.",
      columns: [
        {
          name: "order_id",
          dataType: "INTEGER",
          nullable: false,
          primaryKey: true,
        },
        { name: "customer_name", dataType: "TEXT", nullable: false },
        { name: "city", dataType: "TEXT", nullable: false },
        { name: "status", dataType: "TEXT", nullable: false },
        { name: "total_amount", dataType: "NUMERIC(10,2)", nullable: false },
        { name: "ordered_at", dataType: "DATE", nullable: false },
        { name: "delivered_at", dataType: "DATE", nullable: true },
      ],
    },
  ],
};

const orderSamples: TaskSampleData[] = [
  {
    tableName: "orders",
    rows: [
      {
        order_id: 201,
        customer_name: "Arda",
        city: "Istanbul",
        status: "completed",
        total_amount: 1240,
        ordered_at: "2026-01-04",
        delivered_at: "2026-01-06",
      },
      {
        order_id: 202,
        customer_name: "Deniz",
        city: "Ankara",
        status: "pending",
        total_amount: 320,
        ordered_at: "2026-01-05",
        delivered_at: null,
      },
      {
        order_id: 205,
        customer_name: "Selin",
        city: "Bursa",
        status: "processing",
        total_amount: 450,
        ordered_at: "2026-01-08",
        delivered_at: null,
      },
    ],
  },
];

const filteringTasks: LessonTask[] = [
  createTask({
    id: "m2-t1",
    slug: "high-value-orders",
    moduleId: "module-2",
    title: "Yüksek tutarlı siparişleri ayır",
    subtitle: "Operasyon listesini bir eşik değerle filtrele.",
    scenario:
      "Finans operasyon ekibi, manuel kontrol için 500 TL ve üzerindeki siparişleri görmek istiyor.",
    objective:
      "total_amount değeri 500 veya daha yüksek olan siparişlerin order_id, customer_name ve total_amount kolonlarını getir.",
    difficulty: "beginner",
    estimatedMinutes: 7,
    routeOrder: 3,
    curriculumConcepts: ["K01", "K06"],
    prerequisites: ["m1-t2"],
    concepts: ["SELECT", "WHERE", "COMPARISON"],
    setupSql: orderSetupSql,
    schema: orderSchema,
    sampleRows: orderSamples,
    expectedColumns: ["order_id", "customer_name", "total_amount"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [201, "Arda", 1240],
      [204, "Mert", 780],
      [206, "Bora", 1560],
    ],
    orderSensitive: false,
    requiredConcepts: ["WHERE", "COMPARISON"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Satırları koşula göre seçmek için WHERE kullanılır.",
      "Eşik değer de dahil olduğu için >= karşılaştırmasını düşün.",
      "İskelet: SELECT [istenen kolonlar] FROM orders WHERE total_amount >= 500;",
    ],
    explanation:
      "WHERE, tablodaki satırları sonuç kümesine girmeden önce filtreler. >= operatörü eşik değeri ve onun üzerindeki değerleri kapsar.",
    completionMessage:
      "Kontrol kuyruğu hazır. Sayısal bir eşiğe göre doğru satırları ayırdın.",
    nextTaskId: "m2-t2",
  }),
  createTask({
    id: "m2-t2",
    slug: "pending-city-orders",
    moduleId: "module-2",
    title: "Bekleyen şehir siparişlerini bul",
    subtitle: "Birden fazla koşulu birlikte uygula.",
    scenario:
      "Dağıtım ekibi yalnızca Ankara ve Istanbul'da bekleyen siparişleri aynı gün içinde ele alacak.",
    objective:
      "city değeri Ankara veya Istanbul olan ve status değeri pending olan siparişlerin order_id, customer_name ve city kolonlarını getir.",
    difficulty: "beginner",
    estimatedMinutes: 9,
    routeOrder: 4,
    curriculumConcepts: ["K01", "K05", "K07", "K10"],
    prerequisites: ["m2-t1"],
    concepts: ["WHERE", "AND", "IN"],
    setupSql: orderSetupSql,
    schema: orderSchema,
    sampleRows: orderSamples,
    expectedColumns: ["order_id", "customer_name", "city"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [202, "Deniz", "Ankara"],
      [207, "Lina", "Istanbul"],
    ],
    orderSensitive: false,
    requiredConcepts: ["AND", "IN"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Şehir kümesini bir koşul, sipariş durumunu ikinci koşul olarak düşün.",
      "İki şehir için IN (...), koşulları birleştirmek için AND kullanabilirsin.",
      "İskelet: SELECT [kolonlar] FROM orders WHERE city IN (...) AND status = 'pending';",
    ],
    explanation:
      "IN bir kolonu birden fazla olası değerle karşılaştırır. AND ise her iki koşulu da sağlayan satırların kalmasını sağlar.",
    completionMessage:
      "Dağıtım listesi daraltıldı. Küme filtresiyle durum filtresini birlikte yönettin.",
    nextTaskId: "m2-t3",
  }),
  createTask({
    id: "m2-t3",
    slug: "campaign-date-window",
    moduleId: "module-2",
    title: "Kampanya tarih aralığını incele",
    subtitle: "Başlangıç ve bitiş gününü kapsayan bir pencere oluştur.",
    scenario:
      "Pazarlama ekibi 4–7 Ocak kampanyası sırasında alınan siparişleri kronolojik bir dosyaya aktarıyor.",
    objective:
      "ordered_at değeri 2026-01-04 ile 2026-01-07 arasında olan siparişlerin order_id, ordered_at ve total_amount kolonlarını tarihe göre artan sırada getir.",
    difficulty: "beginner",
    estimatedMinutes: 9,
    routeOrder: 5,
    curriculumConcepts: ["K01", "K03", "K11"],
    prerequisites: ["m2-t2"],
    concepts: ["WHERE", "BETWEEN", "ORDER_BY"],
    setupSql: orderSetupSql,
    schema: orderSchema,
    sampleRows: orderSamples,
    expectedColumns: ["order_id", "ordered_at", "total_amount"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [201, "2026-01-04", 1240],
      [202, "2026-01-05", 320],
      [203, "2026-01-06", 90],
      [204, "2026-01-07", 780],
    ],
    orderSensitive: true,
    requiredConcepts: ["BETWEEN", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "BETWEEN başlangıç ve bitiş değerlerini de kapsar.",
      "Tarih sabitlerini PostgreSQL'de DATE 'YYYY-MM-DD' olarak yazabilirsin.",
      "İskelet: SELECT [kolonlar] FROM orders WHERE ordered_at BETWEEN [başlangıç] AND [bitiş] ORDER BY ordered_at;",
    ],
    explanation:
      "BETWEEN iki uç değeri de dahil eden okunaklı bir aralık filtresidir. ORDER BY ile kampanya akışı kronolojik hale gelir.",
    completionMessage:
      "Kampanya penceresi doğru sınırlarla ve doğru sırayla hazırlandı.",
    nextTaskId: "m2-t4",
  }),
  createTask({
    id: "m2-t4",
    slug: "missing-deliveries",
    moduleId: "module-2",
    title: "Eksik teslimat kayıtlarını tara",
    subtitle: "Metin deseni ile NULL kontrolünü birleştir.",
    scenario:
      "Müşteri deneyimi ekibi, adı 'e' harfi içeren ve teslim tarihi henüz oluşmamış müşterileri alfabetik arama listesine almak istiyor.",
    objective:
      "delivered_at değeri NULL olan ve customer_name içinde küçük 'e' harfi bulunan kayıtların customer_name ve status kolonlarını customer_name artan sırada getir.",
    difficulty: "beginner",
    estimatedMinutes: 10,
    routeOrder: 6,
    curriculumConcepts: ["K01", "K03", "K07", "K09", "K12"],
    prerequisites: ["m2-t3"],
    concepts: ["WHERE", "AND", "LIKE", "IS_NULL", "ORDER_BY"],
    setupSql: orderSetupSql,
    schema: orderSchema,
    sampleRows: orderSamples,
    expectedColumns: ["customer_name", "status"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Deniz", "pending"],
      ["Ece", "cancelled"],
      ["Selin", "processing"],
    ],
    orderSensitive: true,
    requiredConcepts: ["LIKE", "IS_NULL", "AND", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "NULL değerleri eşittir operatörüyle değil IS NULL ile kontrol edilir.",
      "Bir metnin herhangi bir yerini eşlemek için LIKE deseninin iki yanında % kullan.",
      "İskelet: SELECT [kolonlar] FROM orders WHERE delivered_at IS NULL AND customer_name LIKE '%e%' ORDER BY customer_name;",
    ],
    explanation:
      "NULL bilinmeyen değeri temsil ettiği için IS NULL ile test edilir. LIKE desenindeki % sıfır veya daha fazla karakteri eşler.",
    completionMessage:
      "Eksik teslimat listesi hazır. NULL ve metin desenlerini güvenle filtreleyebiliyorsun.",
    nextTaskId: "m3-t1",
  }),
];

/**
 * These drills are deliberately grouped immediately before the case whose
 * order fixture they reuse. They introduce only the narrow part that would
 * otherwise make the following beginner case carry several new operations.
 */
const filteringBridgeDrills: LessonTask[] = [
  createTask({
    id: "m2-d1",
    slug: "distinct-order-cities",
    moduleId: "module-2",
    title: "Şehirleri tekilleştir",
    subtitle: "Tekrar eden şehir adlarını kısa bir seçim listesine indir.",
    scenario:
      "Operasyon ekibi şehir filtresinde her seçeneği yalnız bir kez görmek istiyor.",
    objective:
      "orders tablosundan city kolonundaki her farklı şehri bir kez getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_practice",
    scored: false,
    routeOrder: 2.1,
    conceptsReinforced: ["K01", "K13"],
    curriculumConcepts: ["K01", "K13"],
    drillConcept:
      "DISTINCT, seçtiğin şehir değeri tekrar etse bile sonucu bir kez bırakır. Burada satırları filtrelemez; yalnız aynı değeri yeniden yazmaz.",
    prerequisites: [],
    concepts: ["SELECT", "DISTINCT"],
    setupSql: orderSetupSql,
    schema: orderSchema,
    sampleRows: orderSamples,
    expectedColumns: ["city"],
    validationMode: "result-and-concepts",
    expectedResult: [["Istanbul"], ["Ankara"], ["Izmir"], ["Bursa"]],
    orderSensitive: false,
    requiredConcepts: ["DISTINCT"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "SELECT DISTINCT city FROM orders yapısıyla şehir değerlerini tekilleştir.",
    ],
    explanation:
      "DISTINCT, aynı şehir adını birden çok sipariş verse bile sonuçta yalnız bir kez gösterir.",
    completionMessage:
      "Şehir seçimi temizlendi. DISTINCT'i yeni bir veri dünyasında tekrar kullandın.",
    nextTaskId: null,
  }),
  createTask({
    id: "m2-m1",
    slug: "distinct-high-value-cities",
    moduleId: "module-2",
    title: "Tekrarsız kontrol şehirleri",
    subtitle: "Bir seçim ve eşik filtresini aynı kısa listede buluştur.",
    scenario:
      "Finans ekibi, yalnız yüksek tutarlı siparişi olan şehirleri tekrar etmeden görmek istiyor.",
    objective:
      "total_amount değeri en az 500 olan siparişlerden city değerlerini tekrarsız getir.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    type: "drill_mix",
    scored: false,
    routeOrder: 3.1,
    conceptsReinforced: ["K01", "K13", "K06"],
    curriculumConcepts: ["K01", "K13", "K06"],
    drillConcept:
      "DISTINCT sonuçta hangi tekrarların kalkacağını, WHERE ise hangi siparişlerin önce kalacağını belirler. Önce eşiği uygular, sonra kalan şehirleri tekilleştirirsin.",
    prerequisites: [],
    concepts: ["SELECT", "DISTINCT", "WHERE", "COMPARISON"],
    setupSql: orderSetupSql,
    schema: orderSchema,
    sampleRows: orderSamples,
    expectedColumns: ["city"],
    validationMode: "result-and-concepts",
    expectedResult: [["Istanbul"], ["Izmir"], ["Ankara"]],
    orderSensitive: false,
    requiredConcepts: ["DISTINCT", "WHERE", "COMPARISON"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "SELECT DISTINCT city ile başla; WHERE total_amount >= 500 koşulunu FROM orders sonrasına ekle.",
    ],
    explanation:
      "Bu kısa çıktı, filtrelemenin ve tekilleştirmenin aynı sonuç üzerinde farklı işler yaptığını gösterir.",
    completionMessage:
      "Yüksek tutarlı şehirler tekilleşti. İki tanıdık yapıyı birlikte kullandın.",
    nextTaskId: null,
  }),
  createTask({
    id: "m2-d2",
    slug: "pending-status-equality",
    moduleId: "module-2",
    title: "Tek durum eşitliği",
    subtitle: "Bir metin değerine eşit olan siparişleri seç.",
    scenario:
      "Operasyon ekibi yalnız pending durumundaki siparişleri hızlıca görmek istiyor.",
    objective:
      "status değeri pending olan siparişlerin order_id ve status kolonlarını getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_intro",
    scored: false,
    routeOrder: 3.2,
    conceptNew: "K05",
    conceptsReinforced: ["K01"],
    curriculumConcepts: ["K01", "K05"],
    drillConcept:
      "WHERE içindeki = işareti, bir kolonu tek bir hedef değerle eşleştirir. Burada yalnız pending satırları kalır; diğer durumlar sonuçta görünmez.",
    prerequisites: [],
    concepts: ["SELECT", "WHERE"],
    setupSql: orderSetupSql,
    schema: orderSchema,
    sampleRows: orderSamples,
    expectedColumns: ["order_id", "status"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [202, "pending"],
      [207, "pending"],
    ],
    orderSensitive: false,
    requiredConcepts: ["WHERE"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: ["FROM orders sonrasına WHERE status = 'pending' koşulunu ekle."],
    explanation: "Eşitlik filtresi, tek bir iş durumuna ait satırları seçer.",
    completionMessage: "Pending kuyruğu hazır. İlk eşitlik filtresini kurdun.",
    nextTaskId: null,
  }),
  createTask({
    id: "m2-d3",
    slug: "city-set-filter",
    moduleId: "module-2",
    title: "Şehir kümesini seç",
    subtitle: "Birden fazla kabul edilen şehri tek koşulda tanımla.",
    scenario:
      "Dağıtım ekibi iki öncelikli şehirdeki siparişleri aynı listede inceleyecek.",
    objective:
      "city değeri Ankara veya Istanbul olan siparişlerin order_id ve city kolonlarını getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_intro",
    scored: false,
    routeOrder: 3.3,
    conceptNew: "K10",
    conceptsReinforced: ["K01"],
    curriculumConcepts: ["K01", "K10"],
    drillConcept:
      "IN, aynı kolon için kabul edilen birkaç değeri okunaklı bir kümede toplar. Şehir değerini her biri için ayrı WHERE yazmadan karşılaştırırsın.",
    prerequisites: [],
    concepts: ["SELECT", "WHERE", "IN"],
    setupSql: orderSetupSql,
    schema: orderSchema,
    sampleRows: orderSamples,
    expectedColumns: ["order_id", "city"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [201, "Istanbul"],
      [202, "Ankara"],
      [203, "Istanbul"],
      [206, "Ankara"],
      [207, "Istanbul"],
    ],
    orderSensitive: false,
    requiredConcepts: ["IN"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: ["WHERE city IN ('Ankara', 'Istanbul') koşulunu kullan."],
    explanation:
      "IN, tek kolon için birden fazla eşitlik seçeneğini tek bir koşulda anlatır.",
    completionMessage:
      "Şehir kümesi seçildi. IN ile iki değeri tek koşulda yönettin.",
    nextTaskId: null,
  }),
  createTask({
    id: "m2-d4",
    slug: "two-condition-filter",
    moduleId: "module-2",
    title: "İki koşulu birlikte tut",
    subtitle: "Aynı satırın iki iş koşulunu da sağlamasını iste.",
    scenario:
      "Dağıtım ekibi Istanbul'daki yüksek tutarlı siparişi öncelikli kontrol listesine alacak.",
    objective:
      "city değeri Istanbul ve total_amount değeri en az 500 olan siparişlerin order_id ile customer_name kolonlarını getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_intro",
    scored: false,
    routeOrder: 3.4,
    conceptNew: "K07",
    conceptsReinforced: ["K01", "K05", "K06"],
    curriculumConcepts: ["K01", "K05", "K06", "K07"],
    drillConcept:
      "AND, iki koşulun da aynı satır için doğru olmasını ister. Bir koşul doğru olsa bile diğeri yanlışsa satır sonuçta kalmaz.",
    prerequisites: [],
    concepts: ["SELECT", "WHERE", "COMPARISON", "AND"],
    setupSql: orderSetupSql,
    schema: orderSchema,
    sampleRows: orderSamples,
    expectedColumns: ["order_id", "customer_name"],
    validationMode: "result-and-concepts",
    expectedResult: [[201, "Arda"]],
    orderSensitive: false,
    requiredConcepts: ["COMPARISON", "AND"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: ["WHERE city = 'Istanbul' AND total_amount >= 500 yapısını kur."],
    explanation: "AND, iki daraltma kuralını aynı satır üzerinde kesiştirir.",
    completionMessage: "İki koşul kesişti. AND ile doğru satırı korudun.",
    nextTaskId: null,
  }),
  createTask({
    id: "m2-m2",
    slug: "priority-city-queue",
    moduleId: "module-2",
    title: "Öncelikli şehir kuyruğu",
    subtitle: "Küme, durum ve tutar koşullarını aynı daraltmada birleştir.",
    scenario:
      "Finans operasyonu, iki şehirdeki bekleyen ve yüksek tutarlı siparişleri ayrı bir kontrol kuyruğuna alıyor.",
    objective:
      "Ankara veya Istanbul'da, pending durumda ve total_amount değeri en az 300 olan siparişlerin order_id ile city kolonlarını getir.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    type: "drill_mix",
    scored: false,
    routeOrder: 4.1,
    conceptsReinforced: ["K01", "K05", "K06", "K07", "K10"],
    curriculumConcepts: ["K01", "K05", "K06", "K07", "K10"],
    drillConcept:
      "IN şehir kümesini, = durum eşitliğini ve >= eşiğini kurar; AND ise bu üç iş kuralını aynı sipariş üzerinde birleştirir.",
    prerequisites: [],
    concepts: ["SELECT", "WHERE", "COMPARISON", "AND", "IN"],
    setupSql: orderSetupSql,
    schema: orderSchema,
    sampleRows: orderSamples,
    expectedColumns: ["order_id", "city"],
    validationMode: "result-and-concepts",
    expectedResult: [[202, "Ankara"]],
    orderSensitive: false,
    requiredConcepts: ["WHERE", "COMPARISON", "AND", "IN"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Şehir için IN, durum için =, tutar için >= yaz; üç koşulu AND ile bağla.",
    ],
    explanation:
      "Aynı WHERE ifadesi, farklı türden iş koşullarını birlikte taşıyabilir.",
    completionMessage:
      "Öncelikli kuyruk daraltıldı. Filtre yapılarını birlikte kullandın.",
    nextTaskId: null,
  }),
  createTask({
    id: "m2-d5",
    slug: "date-window-repeat",
    moduleId: "module-2",
    title: "Tarih penceresini tekrar kur",
    subtitle: "Başlangıç ve bitiş gününü kapsayan satırları seç.",
    scenario:
      "Kampanya ekibi 5–8 Ocak arasındaki siparişleri ikinci bir kontrol listesinde görüyor.",
    objective:
      "ordered_at değeri 2026-01-05 ile 2026-01-08 arasında olan siparişlerin order_id ve ordered_at kolonlarını getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_practice",
    scored: false,
    routeOrder: 5.1,
    conceptsReinforced: ["K01", "K11"],
    curriculumConcepts: ["K01", "K11"],
    drillConcept:
      "BETWEEN başlangıç ve bitiş değerlerini birlikte kapsar. Aynı tarih aralığını iki ayrı karşılaştırmaya bölmek zorunda kalmazsın.",
    prerequisites: [],
    concepts: ["SELECT", "WHERE", "BETWEEN"],
    setupSql: orderSetupSql,
    schema: orderSchema,
    sampleRows: orderSamples,
    expectedColumns: ["order_id", "ordered_at"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [202, "2026-01-05"],
      [203, "2026-01-06"],
      [204, "2026-01-07"],
      [205, "2026-01-08"],
    ],
    orderSensitive: false,
    requiredConcepts: ["BETWEEN"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "WHERE ordered_at BETWEEN DATE '2026-01-05' AND DATE '2026-01-08' yaz.",
    ],
    explanation:
      "BETWEEN, iki tarih sınırını da dahil eden kısa bir aralık filtresidir.",
    completionMessage:
      "Tarih penceresi yeniden hazır. Sınır günlerini korudun.",
    nextTaskId: null,
  }),
  createTask({
    id: "m2-d6",
    slug: "missing-delivery-check",
    moduleId: "module-2",
    title: "Eksik teslimatı seç",
    subtitle: "Boş teslim tarihi olan satırları ayır.",
    scenario:
      "Müşteri deneyimi ekibi teslim tarihi henüz oluşmamış siparişleri takip ediyor.",
    objective:
      "delivered_at değeri NULL olan siparişlerin order_id ve customer_name kolonlarını getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_intro",
    scored: false,
    routeOrder: 5.2,
    conceptNew: "K09",
    conceptsReinforced: ["K01"],
    curriculumConcepts: ["K01", "K09"],
    drillConcept:
      "NULL bilinmeyen ya da henüz girilmemiş değerdir; = NULL ile değil IS NULL ile kontrol edilir. Böylece yalnız eksik teslim tarihi olan satırlar kalır.",
    prerequisites: [],
    concepts: ["SELECT", "WHERE", "IS_NULL"],
    setupSql: orderSetupSql,
    schema: orderSchema,
    sampleRows: orderSamples,
    expectedColumns: ["order_id", "customer_name"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [202, "Deniz"],
      [203, "Ece"],
      [205, "Selin"],
      [207, "Lina"],
    ],
    orderSensitive: false,
    requiredConcepts: ["IS_NULL"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "WHERE delivered_at IS NULL koşulunu kullan; eşittir işareti kullanma.",
    ],
    explanation:
      "IS NULL, eksik teslim tarihi taşıyan siparişleri güvenle ayırır.",
    completionMessage:
      "Eksik teslimatlar seçildi. NULL kontrolünün ayrı yazımını öğrendin.",
    nextTaskId: null,
  }),
  createTask({
    id: "m2-d7",
    slug: "name-pattern-check",
    moduleId: "module-2",
    title: "İsim desenini ara",
    subtitle: "Metnin içinde geçen ortak harfi yakala.",
    scenario:
      "Destek ekibi, teslimatı henüz oluşmamış ve adında küçük e harfi geçen müşteriler için bir örnek arama görünümü hazırlıyor.",
    objective:
      "delivered_at değeri NULL ve customer_name içinde küçük e harfi bulunan kayıtların customer_name kolonunu getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_intro",
    scored: false,
    routeOrder: 5.3,
    conceptNew: "K12",
    conceptsReinforced: ["K01", "K07", "K09"],
    curriculumConcepts: ["K01", "K07", "K09", "K12"],
    drillConcept:
      "LIKE, metin içindeki bir deseni arar. Desenin iki yanındaki % işaretleri, harften önce veya sonra başka karakterlerin bulunabileceğini söyler.",
    prerequisites: [],
    concepts: ["SELECT", "WHERE", "AND", "IS_NULL", "LIKE"],
    setupSql: orderSetupSql,
    schema: orderSchema,
    sampleRows: orderSamples,
    expectedColumns: ["customer_name"],
    validationMode: "result-and-concepts",
    expectedResult: [["Deniz"], ["Ece"], ["Selin"]],
    orderSensitive: false,
    requiredConcepts: ["AND", "IS_NULL", "LIKE"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "WHERE delivered_at IS NULL AND customer_name LIKE '%e%' ile iki koşulu bağla.",
    ],
    explanation:
      "LIKE deseni müşteri adındaki küçük e harfini eşler; AND bu aramayı eksik teslimat kontrolüyle kesiştirir.",
    completionMessage: "Metin deseni bulundu. LIKE ile ilk aramanı yaptın.",
    nextTaskId: null,
  }),
  createTask({
    id: "m2-m3",
    slug: "missing-delivery-pattern-window",
    moduleId: "module-2",
    title: "Eksik teslimat penceresi",
    subtitle:
      "Eksik değer, metin deseni ve tarihi tek kontrol listesinde birleştir.",
    scenario:
      "Operasyon ekibi, belirli günlerde alınmış ve takip gerektiren siparişleri tek listede inceliyor.",
    objective:
      "Teslim tarihi NULL, müşteri adı e içeren ve 5–8 Ocak arasında alınmış siparişlerin customer_name ile status kolonlarını ada göre artan sırada getir.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    type: "drill_mix",
    scored: false,
    routeOrder: 5.4,
    conceptsReinforced: ["K01", "K03", "K07", "K09", "K11", "K12"],
    curriculumConcepts: ["K01", "K03", "K07", "K09", "K11", "K12"],
    drillConcept:
      "IS NULL, LIKE ve BETWEEN farklı türde filtrelerdir; AND hepsinin aynı siparişte doğru olmasını ister. ORDER BY ise kalan listeyi okunur sıraya koyar.",
    prerequisites: [],
    concepts: [
      "SELECT",
      "WHERE",
      "AND",
      "IS_NULL",
      "LIKE",
      "BETWEEN",
      "ORDER_BY",
    ],
    setupSql: orderSetupSql,
    schema: orderSchema,
    sampleRows: orderSamples,
    expectedColumns: ["customer_name", "status"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Deniz", "pending"],
      ["Ece", "cancelled"],
      ["Selin", "processing"],
    ],
    orderSensitive: true,
    requiredConcepts: ["AND", "IS_NULL", "LIKE", "BETWEEN", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "IS NULL, LIKE '%e%' ve BETWEEN koşullarını AND ile bağla; ardından customer_name ile sırala.",
    ],
    explanation:
      "Üç filtre aynı risk tanımını kurar; sıralama ise kontrol listesini paylaşılabilir hâle getirir.",
    completionMessage:
      "Takip penceresi hazır. Farklı filtre yapılarını güvenle birleştirdin.",
    nextTaskId: null,
  }),
];

const saleSetupSql = `
  CREATE TABLE sales (
    sale_id INTEGER PRIMARY KEY,
    branch_name TEXT NOT NULL,
    agent_first_name TEXT NOT NULL,
    agent_last_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    sale_date DATE NOT NULL,
    channel TEXT NOT NULL
  );

  INSERT INTO sales
    (sale_id, branch_name, agent_first_name, agent_last_name, quantity, unit_price, sale_date, channel)
  VALUES
    (301, 'Central', 'Ada', 'Kaya', 4, 120.00, DATE '2026-01-12', 'Online'),
    (302, 'North', 'Can', 'Demir', 2, 350.00, DATE '2026-01-26', 'Store'),
    (303, 'Central', 'Ada', 'Kaya', 10, 45.00, DATE '2026-02-03', 'Partner'),
    (304, 'South', 'Eren', 'Aydin', 3, 420.00, DATE '2026-02-14', 'Online'),
    (305, 'North', 'Ipek', 'Yilmaz', 1, 950.00, DATE '2026-03-02', 'Store'),
    (306, 'South', 'Eren', 'Aydin', 8, 80.00, DATE '2026-03-09', 'Partner');
`;

const saleSchema: TaskSchema = {
  tables: [
    {
      name: "sales",
      description: "Şube satış hareketleri ve işlemi yapan temsilci bilgileri.",
      columns: [
        {
          name: "sale_id",
          dataType: "INTEGER",
          nullable: false,
          primaryKey: true,
        },
        { name: "branch_name", dataType: "TEXT", nullable: false },
        { name: "agent_first_name", dataType: "TEXT", nullable: false },
        { name: "agent_last_name", dataType: "TEXT", nullable: false },
        { name: "quantity", dataType: "INTEGER", nullable: false },
        { name: "unit_price", dataType: "NUMERIC(10,2)", nullable: false },
        { name: "sale_date", dataType: "DATE", nullable: false },
        { name: "channel", dataType: "TEXT", nullable: false },
      ],
    },
  ],
};

const saleSamples: TaskSampleData[] = [
  {
    tableName: "sales",
    rows: [
      {
        sale_id: 301,
        branch_name: "Central",
        agent_first_name: "Ada",
        agent_last_name: "Kaya",
        quantity: 4,
        unit_price: 120,
        sale_date: "2026-01-12",
        channel: "Online",
      },
      {
        sale_id: 304,
        branch_name: "South",
        agent_first_name: "Eren",
        agent_last_name: "Aydin",
        quantity: 3,
        unit_price: 420,
        sale_date: "2026-02-14",
        channel: "Online",
      },
      {
        sale_id: 305,
        branch_name: "North",
        agent_first_name: "Ipek",
        agent_last_name: "Yilmaz",
        quantity: 1,
        unit_price: 950,
        sale_date: "2026-03-02",
        channel: "Store",
      },
    ],
  },
];

const transformationTasks: LessonTask[] = [
  createTask({
    id: "m3-t1",
    slug: "line-revenue",
    moduleId: "module-3",
    title: "Satır gelirini hesapla",
    subtitle: "Ham kolonlardan yeni bir iş metriği üret.",
    scenario:
      "Finans ekibi, her satış hareketinin brüt gelirini hesaplamak için adet ile birim fiyatı birleştiren bir çıktı istiyor.",
    objective:
      "sale_id ile quantity * unit_price hesabını revenue alias'ı altında getir.",
    difficulty: "beginner",
    estimatedMinutes: 8,
    routeOrder: 9,
    curriculumConcepts: ["K01", "K02", "K99-ARITMETIK"],
    prerequisites: ["m1-t3"],
    concepts: ["SELECT", "ARITHMETIC", "ALIAS"],
    setupSql: saleSetupSql,
    schema: saleSchema,
    sampleRows: saleSamples,
    expectedColumns: ["sale_id", "revenue"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [301, 480],
      [302, 700],
      [303, 450],
      [304, 1260],
      [305, 950],
      [306, 640],
    ],
    orderSensitive: false,
    requiredConcepts: ["ARITHMETIC", "ALIAS"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Hesaplanan kolonlar SELECT listesinde matematiksel ifadeyle üretilebilir.",
      "quantity ile unit_price kolonlarını * operatörüyle çarp.",
      "İskelet: SELECT sale_id, [hesap] AS revenue FROM sales;",
    ],
    explanation:
      "SQL, kaynak kolonlardan sorgu anında metrik türetebilir. AS ile verilen alias, hesaplanan kolonun raporda anlaşılır bir adla görünmesini sağlar.",
    completionMessage:
      "Her işlem için gelir metriği üretildi. Ham veriyi iş değerine dönüştürdün.",
    nextTaskId: "m3-t2",
  }),
  createTask({
    id: "m3-t2",
    slug: "agent-labels",
    moduleId: "module-3",
    title: "Temsilci etiketlerini oluştur",
    subtitle: "Ayrı metin kolonlarını tek bir okunaklı alanda birleştir.",
    scenario:
      "Satış lideri, temsilci adlarının panoda tek kolonda ve büyük harflerle görünmesini istiyor.",
    objective:
      "sale_id ve agent_first_name ile agent_last_name değerlerini arada bir boşluk olacak şekilde birleştirip büyük harfe çeviren agent_name kolonunu getir.",
    difficulty: "beginner",
    estimatedMinutes: 10,
    routeOrder: 10,
    curriculumConcepts: ["K01", "K02", "K29"],
    prerequisites: ["m3-t1"],
    concepts: ["SELECT", "STRING_FUNCTION", "ALIAS"],
    setupSql: saleSetupSql,
    schema: saleSchema,
    sampleRows: saleSamples,
    expectedColumns: ["sale_id", "agent_name"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [301, "ADA KAYA"],
      [302, "CAN DEMIR"],
      [303, "ADA KAYA"],
      [304, "EREN AYDIN"],
      [305, "IPEK YILMAZ"],
      [306, "EREN AYDIN"],
    ],
    orderSensitive: false,
    requiredConcepts: ["STRING_FUNCTION", "ALIAS"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Metinleri || operatörüyle birleştirebilir, UPPER ile büyük harfe çevirebilirsin.",
      "Ad, ' ' sabiti ve soyadı sırasıyla birleştir.",
      "İskelet: SELECT sale_id, UPPER([ad] || ' ' || [soyad]) AS agent_name FROM sales;",
    ],
    explanation:
      "|| metin parçalarını birleştirir, UPPER sonucu büyük harfe dönüştürür. Dönüşümü sorguda yapmak rapor etiketlerini tutarlı hale getirir.",
    completionMessage:
      "Temsilci etiketleri standartlaştırıldı. Metin dönüşümlerini rapora uyguladın.",
    nextTaskId: "m3-t3",
  }),
  createTask({
    id: "m3-t3",
    slug: "monthly-sales-label",
    moduleId: "module-3",
    title: "Aylık dönem etiketini üret",
    subtitle: "Tarih değerini raporlanabilir bir döneme dönüştür.",
    scenario:
      "Raporlama ekibi, satış hareketlerini Power BI modelinde YYYY-MM biçimindeki dönem etiketiyle eşleştirecek.",
    objective:
      "sale_id ile sale_date değerinden TO_CHAR kullanarak üretilen YYYY-MM biçimindeki sale_month kolonunu getir.",
    difficulty: "beginner",
    estimatedMinutes: 9,
    routeOrder: 11,
    curriculumConcepts: ["K01", "K02", "K28"],
    prerequisites: ["m3-t2"],
    concepts: ["SELECT", "DATE_FUNCTION", "ALIAS"],
    setupSql: saleSetupSql,
    schema: saleSchema,
    sampleRows: saleSamples,
    expectedColumns: ["sale_id", "sale_month"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [301, "2026-01"],
      [302, "2026-01"],
      [303, "2026-02"],
      [304, "2026-02"],
      [305, "2026-03"],
      [306, "2026-03"],
    ],
    orderSensitive: false,
    requiredConcepts: ["DATE_FUNCTION", "ALIAS"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "PostgreSQL'de TO_CHAR bir tarih değerini belirlediğin desende metne çevirir.",
      "Yıl ve ay için biçim maskesi 'YYYY-MM' olmalı.",
      "İskelet: SELECT sale_id, TO_CHAR([tarih kolonu], 'YYYY-MM') AS sale_month FROM sales;",
    ],
    explanation:
      "TO_CHAR, tarih değerinin gösterim biçimini kontrol eder. YYYY-MM etiketi günlük ayrıntıyı kaybetmeden işlemleri ortak aylık döneme bağlamayı kolaylaştırır.",
    completionMessage:
      "Satışlar aylık dönem etiketine kavuştu. Tarihleri rapor boyutuna dönüştürdün.",
    nextTaskId: "m3-t4",
  }),
  createTask({
    id: "m3-t4",
    slug: "revenue-bands",
    moduleId: "module-3",
    title: "Satışları gelir bandına ayır",
    subtitle: "Koşullu etiket ve veri tipi dönüşümü uygula.",
    scenario:
      "Ticari ekip işlemleri Standart, Orta ve Yüksek bantlarında izleyecek; ayrıca satış kimliğini dış sistem için metin olarak bekliyor.",
    objective:
      "sale_id değerini TEXT'e dönüştürüp sale_ref adıyla getir. quantity * unit_price 1000 ve üzerindeyse Yüksek, 500 ve üzerindeyse Orta, aksi halde Standart döndüren revenue_band kolonunu ekle.",
    difficulty: "intermediate",
    estimatedMinutes: 12,
    routeOrder: 12,
    curriculumConcepts: [
      "K01",
      "K02",
      "K26",
      "K99-ARITMETIK",
      "K99-TIP_DONUSUMU",
    ],
    prerequisites: ["m3-t3"],
    concepts: ["CAST", "CASE", "ARITHMETIC", "ALIAS"],
    setupSql: saleSetupSql,
    schema: saleSchema,
    sampleRows: saleSamples,
    expectedColumns: ["sale_ref", "revenue_band"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["301", "Standart"],
      ["302", "Orta"],
      ["303", "Standart"],
      ["304", "Yüksek"],
      ["305", "Orta"],
      ["306", "Orta"],
    ],
    orderSensitive: false,
    requiredConcepts: ["CAST", "CASE", "ARITHMETIC"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "CASE koşulları yukarıdan aşağıya değerlendirir; en yüksek eşiği önce yaz.",
      "CAST(sale_id AS TEXT) kimliği metne çevirir. Gelir hesabı quantity * unit_price.",
      "İskelet: SELECT CAST(...) AS sale_ref, CASE WHEN [gelir] >= 1000 THEN 'Yüksek' WHEN [gelir] >= 500 THEN 'Orta' ELSE 'Standart' END AS revenue_band FROM sales;",
    ],
    explanation:
      "CAST veri tipini açıkça dönüştürür. CASE ise sıralı iş kurallarını tek bir türetilmiş kolona çevirir; yüksek eşiğin önce kontrol edilmesi bantların çakışmasını önler.",
    completionMessage:
      "Gelir bantları hazır. Hesaplama, dönüşüm ve iş kuralını tek sorguda birleştirdin.",
    nextTaskId: "m4-t2",
  }),
];

/**
 * The first two drills use the next sales fixture as a transfer surface for
 * the moved Top-N case. The remaining drills make text and date transforms
 * recur before the multi-concept revenue-band case asks for them together.
 */
const transformationBridgeDrills: LessonTask[] = [
  createTask({
    id: "m3-d1",
    slug: "sales-top-two-by-quantity",
    moduleId: "module-3",
    title: "İlk iki satış hareketi",
    subtitle: "Bilinen sıralama ve sınırı yeni bir tabloda tekrar kullan.",
    scenario:
      "Satış lideri en yüksek adetli iki hareketi hızlıca kontrol ediyor.",
    objective:
      "sales tablosundan sale_id ve quantity kolonlarını quantity azalan sırada getir; yalnız ilk iki satırı bırak.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_practice",
    scored: false,
    routeOrder: 8.1,
    conceptsReinforced: ["K01", "K03", "K04", "K19"],
    curriculumConcepts: ["K01", "K03", "K04", "K19"],
    drillConcept:
      "Top-N, önce ORDER BY ile önem sırasını kurup sonra LIMIT ile gereken kadar satırı almaktır. Yeni tablo değişse de iki adımın sırası değişmez.",
    prerequisites: [],
    concepts: ["SELECT", "ORDER_BY", "LIMIT"],
    setupSql: saleSetupSql,
    schema: saleSchema,
    sampleRows: saleSamples,
    expectedColumns: ["sale_id", "quantity"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [303, 10],
      [306, 8],
    ],
    orderSensitive: true,
    requiredConcepts: ["ORDER_BY", "LIMIT"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: ["quantity için DESC sıralaması kur, ardından LIMIT 2 ekle."],
    explanation:
      "En büyük adetler önce sıralanır; LIMIT yalnız bu sıralı listenin iki satırını bırakır.",
    completionMessage:
      "İlk iki hareket seçildi. Top-N iskeletini yeni veride korudun.",
    nextTaskId: null,
  }),
  createTask({
    id: "m3-m1",
    slug: "sales-top-two-by-price",
    moduleId: "module-3",
    title: "Fiyata göre kısa liste",
    subtitle: "Sıralama ve sınırı başka bir iş metriğine taşı.",
    scenario:
      "Satış lideri bu kez en yüksek birim fiyatlı iki hareketi karşılaştırıyor.",
    objective:
      "sales tablosundan sale_id ve unit_price kolonlarını unit_price azalan sırada getir; ilk iki satırla sınırla.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    type: "drill_mix",
    scored: false,
    routeOrder: 8.2,
    conceptsReinforced: ["K01", "K03", "K04", "K19"],
    curriculumConcepts: ["K01", "K03", "K04", "K19"],
    drillConcept:
      "Top-N şablonu metrikten bağımsızdır: önce hangi değerin üstte olacağını ORDER BY ile söylersin, sonra LIMIT ile kısa listeyi kesersin.",
    prerequisites: [],
    concepts: ["SELECT", "ORDER_BY", "LIMIT"],
    setupSql: saleSetupSql,
    schema: saleSchema,
    sampleRows: saleSamples,
    expectedColumns: ["sale_id", "unit_price"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [305, 950],
      [304, 420],
    ],
    orderSensitive: true,
    requiredConcepts: ["ORDER_BY", "LIMIT"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "unit_price için DESC sıralaması kullan; sıralamadan sonra LIMIT 2 yaz.",
    ],
    explanation:
      "Aynı Top-N yapısı, stok yerine fiyat önceliği için de çalışır.",
    completionMessage:
      "Fiyat kısa listesi hazır. Top-N yapısını transfer ettin.",
    nextTaskId: null,
  }),
  createTask({
    id: "m3-d2",
    slug: "uppercase-agent-first-name",
    moduleId: "module-3",
    title: "Temsilci adını büyük yaz",
    subtitle: "Tek bir metin alanını dönüştürüp anlamlı ad ver.",
    scenario:
      "Satış lideri kısa listede temsilci adlarını büyük harfle görmek istiyor.",
    objective:
      "sale_id ile agent_first_name değerini UPPER ile büyük harfe çeviren agent_label kolonunu getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_practice",
    scored: false,
    routeOrder: 10.1,
    conceptsReinforced: ["K01", "K02", "K29"],
    curriculumConcepts: ["K01", "K02", "K29"],
    drillConcept:
      "UPPER tek bir metin değerinin gösterimini dönüştürür; AS ise bu yeni çıktıya raporda okunacak adı verir.",
    prerequisites: [],
    concepts: ["SELECT", "STRING_FUNCTION", "ALIAS"],
    setupSql: saleSetupSql,
    schema: saleSchema,
    sampleRows: saleSamples,
    expectedColumns: ["sale_id", "agent_label"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [301, "ADA"],
      [302, "CAN"],
      [303, "ADA"],
      [304, "EREN"],
      [305, "IPEK"],
      [306, "EREN"],
    ],
    orderSensitive: false,
    requiredConcepts: ["STRING_FUNCTION", "ALIAS"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "UPPER(agent_first_name) AS agent_label ifadesini SELECT listesine ekle.",
    ],
    explanation:
      "Metin fonksiyonu kaynak değeri değiştirmeden sonuçtaki gösterimini standardize eder.",
    completionMessage:
      "Temsilci etiketi hazır. Metin dönüşümünü yeniden kullandın.",
    nextTaskId: null,
  }),
  createTask({
    id: "m3-m2",
    slug: "agent-label-and-revenue",
    moduleId: "module-3",
    title: "Etiket ve gelir birlikte",
    subtitle: "Dönüşmüş metni ve hesaplanmış metriği aynı satırda buluştur.",
    scenario:
      "Satış lideri temsilci etiketiyle beraber hareket gelirini kısa bir görünümde inceliyor.",
    objective:
      "agent_first_name değerini büyük harfe çevirip agent_label adıyla getir; quantity * unit_price hesabını revenue adıyla aynı satırda ekle.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    type: "drill_mix",
    scored: false,
    routeOrder: 10.2,
    conceptsReinforced: ["K01", "K02", "K29", "K99-ARITMETIK"],
    curriculumConcepts: ["K01", "K02", "K29", "K99-ARITMETIK"],
    drillConcept:
      "Bir SELECT listesinde hem metin dönüşümü hem hesaplanmış metrik bulunabilir. Her ifade kendi AS adıyla çıktının ne söylediğini açıklar.",
    prerequisites: [],
    concepts: ["SELECT", "STRING_FUNCTION", "ARITHMETIC", "ALIAS"],
    setupSql: saleSetupSql,
    schema: saleSchema,
    sampleRows: saleSamples,
    expectedColumns: ["agent_label", "revenue"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["ADA", 480],
      ["CAN", 700],
      ["ADA", 450],
      ["EREN", 1260],
      ["IPEK", 950],
      ["EREN", 640],
    ],
    orderSensitive: false,
    requiredConcepts: ["STRING_FUNCTION", "ARITHMETIC", "ALIAS"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "UPPER(agent_first_name) AS agent_label ve quantity * unit_price AS revenue ifadelerini yan yana yaz.",
    ],
    explanation:
      "Aynı satış satırından hem okunur etiket hem sayısal metrik üretilebilir.",
    completionMessage:
      "Etiket ve gelir birleşti. İki dönüşümü aynı çıktı sözleşmesinde kullandın.",
    nextTaskId: null,
  }),
  createTask({
    id: "m3-d3",
    slug: "sale-year-repeat",
    moduleId: "module-3",
    title: "Satış yılını ayır",
    subtitle: "Tarihten yalnız ihtiyacın olan zaman parçasını çıkar.",
    scenario:
      "Raporlama ekibi satış kimliğinin yanında yalnız yıl bilgisini görmek istiyor.",
    objective:
      "sale_id ile sale_date değerinden TO_CHAR kullanarak üretilen sale_year kolonunu getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_practice",
    scored: false,
    routeOrder: 11.1,
    conceptsReinforced: ["K01", "K02", "K28"],
    curriculumConcepts: ["K01", "K02", "K28"],
    drillConcept:
      "TO_CHAR tarih değerinden raporun istediği parçayı çıkarır. 'YYYY' biçimi, gün ve ayı bırakıp yalnız yılı gösterir.",
    prerequisites: [],
    concepts: ["SELECT", "DATE_FUNCTION", "ALIAS"],
    setupSql: saleSetupSql,
    schema: saleSchema,
    sampleRows: saleSamples,
    expectedColumns: ["sale_id", "sale_year"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [301, "2026"],
      [302, "2026"],
      [303, "2026"],
      [304, "2026"],
      [305, "2026"],
      [306, "2026"],
    ],
    orderSensitive: false,
    requiredConcepts: ["DATE_FUNCTION", "ALIAS"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: ["TO_CHAR(sale_date, 'YYYY') AS sale_year ifadesini kullan."],
    explanation:
      "Tarih fonksiyonu, gün bazındaki veriyi daha geniş raporlama zamanına dönüştürür.",
    completionMessage:
      "Satış yılı hazır. Tarih dönüşümünü farklı bir biçimde tekrar kullandın.",
    nextTaskId: null,
  }),
  createTask({
    id: "m3-m3",
    slug: "month-label-standardization",
    moduleId: "module-3",
    title: "Ay etiketini standardize et",
    subtitle: "Tarih ve metin dönüşümünü tek kısa etikette birleştir.",
    scenario:
      "Raporlama ekibi ay kısaltmalarını başlıkta aynı biçimde kullanmak istiyor.",
    objective:
      "sale_id ile sale_date değerinden ay kısaltmasını çıkar; bu metni büyük harfe çevirip sale_month_label adıyla getir.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    type: "drill_mix",
    scored: false,
    routeOrder: 11.2,
    conceptsReinforced: ["K01", "K02", "K28", "K29"],
    curriculumConcepts: ["K01", "K02", "K28", "K29"],
    drillConcept:
      "TO_CHAR tarihi ay metnine çevirir; UPPER ise bu yeni metni tek bir görsel standarda taşır. Dönüşümler iç içe yazılabilir.",
    prerequisites: [],
    concepts: ["SELECT", "DATE_FUNCTION", "STRING_FUNCTION", "ALIAS"],
    setupSql: saleSetupSql,
    schema: saleSchema,
    sampleRows: saleSamples,
    expectedColumns: ["sale_id", "sale_month_label"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [301, "JAN"],
      [302, "JAN"],
      [303, "FEB"],
      [304, "FEB"],
      [305, "MAR"],
      [306, "MAR"],
    ],
    orderSensitive: false,
    requiredConcepts: ["DATE_FUNCTION", "STRING_FUNCTION", "ALIAS"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "UPPER(TO_CHAR(sale_date, 'Mon')) AS sale_month_label yapısını kullan.",
    ],
    explanation:
      "İç içe dönüşüm, tarih bilgisini standart rapor etiketine dönüştürür.",
    completionMessage:
      "Ay etiketleri standardize edildi. İki dönüşümü bilinçli biçimde birleştirdin.",
    nextTaskId: null,
  }),
];

const channelOrderSetupSql = `
  CREATE TABLE channel_orders (
    order_id INTEGER PRIMARY KEY,
    channel TEXT NOT NULL,
    status TEXT NOT NULL,
    order_amount NUMERIC(10, 2) NOT NULL,
    coupon_code TEXT
  );

  INSERT INTO channel_orders VALUES
    (4101, 'Web', 'completed', 1200.00, 'VIP'),
    (4102, 'Web', 'pending', 800.00, NULL),
    (4103, 'Store', 'completed', 450.00, 'STORE25'),
    (4104, 'Store', 'cancelled', 950.00, NULL),
    (4105, 'Partner', 'completed', 600.00, 'PARTNER'),
    (4106, 'Partner', 'pending', 400.00, NULL),
    (4107, 'Web', 'completed', 1000.00, 'WELCOME'),
    (4108, 'Store', 'completed', 550.00, NULL);
`;

const channelOrderSchema: TaskSchema = {
  tables: [
    {
      name: "channel_orders",
      description:
        "Satış kanalına göre sipariş durumu, tutarı ve opsiyonel kupon bilgisini tutan hareket tablosu.",
      columns: [
        {
          name: "order_id",
          dataType: "INTEGER",
          nullable: false,
          primaryKey: true,
        },
        { name: "channel", dataType: "TEXT", nullable: false },
        { name: "status", dataType: "TEXT", nullable: false },
        { name: "order_amount", dataType: "NUMERIC(10,2)", nullable: false },
        { name: "coupon_code", dataType: "TEXT", nullable: true },
      ],
    },
  ],
};

const channelOrderSamples: TaskSampleData[] = [
  {
    tableName: "channel_orders",
    rows: [
      {
        order_id: 4101,
        channel: "Web",
        status: "completed",
        order_amount: 1200,
        coupon_code: "VIP",
      },
      {
        order_id: 4102,
        channel: "Web",
        status: "pending",
        order_amount: 800,
        coupon_code: null,
      },
      {
        order_id: 4104,
        channel: "Store",
        status: "cancelled",
        order_amount: 950,
        coupon_code: null,
      },
      {
        order_id: 4105,
        channel: "Partner",
        status: "completed",
        order_amount: 600,
        coupon_code: "PARTNER",
      },
    ],
  },
];

const aggregationTasks: LessonTask[] = [
  createTask({
    id: "m4-t2",
    slug: "channel-health-metrics",
    moduleId: "module-4",
    title: "Kanal sağlık özetini hazırla",
    subtitle:
      "Beş temel aggregate fonksiyonunu aynı yönetim çıktısında kullan.",
    scenario:
      "Satış yöneticisi her kanalın sipariş hacmini, gelirini ve sipariş tutarı aralığını tek tabloda karşılaştıracak.",
    objective:
      "channel_orders verisini channel bazında grupla. order_count, total_amount, avg_amount, min_amount ve max_amount metriklerini üret; sonucu channel artan sırada getir.",
    difficulty: "intermediate",
    estimatedMinutes: 12,
    routeOrder: 14,
    curriculumConcepts: ["K01", "K02", "K03", "K14", "K15", "K16"],
    prerequisites: ["m4-t3"],
    concepts: ["COUNT", "SUM", "AVG", "MIN", "MAX", "GROUP_BY", "ORDER_BY"],
    setupSql: channelOrderSetupSql,
    schema: channelOrderSchema,
    sampleRows: channelOrderSamples,
    expectedColumns: [
      "channel",
      "order_count",
      "total_amount",
      "avg_amount",
      "min_amount",
      "max_amount",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Partner", 2, 1000, 500, 400, 600],
      ["Store", 3, 1950, 650, 450, 950],
      ["Web", 3, 3000, 1000, 800, 1200],
    ],
    orderSensitive: true,
    requiredConcepts: [
      "COUNT",
      "SUM",
      "AVG",
      "MIN",
      "MAX",
      "GROUP_BY",
      "ORDER_BY",
    ],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Her kanalın tek satır olması için channel kolonuna göre gruplama yap.",
      "COUNT(*) hacmi, SUM ve AVG tutar seviyesini, MIN ve MAX ise aralığın iki ucunu verir.",
      "SELECT channel, COUNT(*) AS order_count, ... FROM channel_orders GROUP BY channel ORDER BY channel yapısını tamamla.",
    ],
    explanation:
      "GROUP BY aynı kanalın işlem satırlarını tek karar satırında toplar. COUNT hacmi, SUM toplam değeri, AVG tipik seviyeyi, MIN ve MAX ise dağılımın sınırlarını gösterir.",
    completionMessage:
      "Kanal sağlık tablosu hazır. Beş aggregate metriğini aynı çıktı tanesinde birleştirdin.",
    nextTaskId: "m4-t3",
  }),
  createTask({
    id: "m4-t3",
    slug: "coupon-null-coverage",
    moduleId: "module-4",
    title: "Kupon kullanımını doğru say",
    subtitle: "COUNT(*) ile COUNT(column) arasındaki NULL farkını görünür kıl.",
    scenario:
      "Kampanya ekibi kanal başına toplam sipariş ile kupon kodu girilmiş sipariş sayısını yan yana görmek istiyor.",
    objective:
      "Her channel için tüm satırları order_count, NULL olmayan coupon_code değerlerini coupon_order_count olarak say; sonucu channel artan sırada getir.",
    difficulty: "intermediate",
    estimatedMinutes: 10,
    routeOrder: 13,
    curriculumConcepts: ["K01", "K02", "K03", "K14", "K16"],
    prerequisites: ["m3-t4"],
    concepts: ["COUNT", "GROUP_BY", "ORDER_BY"],
    setupSql: channelOrderSetupSql,
    schema: channelOrderSchema,
    sampleRows: channelOrderSamples,
    expectedColumns: ["channel", "order_count", "coupon_order_count"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Partner", 2, 1],
      ["Store", 3, 1],
      ["Web", 3, 2],
    ],
    orderSensitive: true,
    requiredConcepts: ["COUNT", "GROUP_BY", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "COUNT(*) satırları, COUNT(kolon) ise yalnızca NULL olmayan kolon değerlerini sayar.",
      "Aynı grupta COUNT(*) ve COUNT(coupon_code) ifadelerini iki farklı alias ile kullan.",
      "channel bazında GROUP BY yapıp COUNT(*) AS order_count ve COUNT(coupon_code) AS coupon_order_count üret.",
    ],
    explanation:
      "COUNT(*) gruptaki her satırı sayar; COUNT(coupon_code) ise NULL kuponları dışarıda bırakır. Bu ayrım eksik değer içeren operasyon metriklerinde yanlış oran üretmeyi önler.",
    completionMessage:
      "Kupon kapsamı doğru sayıldı. NULL değerlerin aggregate sonuçlarına etkisini yönettin.",
    nextTaskId: "m4-t4",
  }),
  createTask({
    id: "m4-t4",
    slug: "order-status-matrix",
    moduleId: "module-4",
    title: "Sipariş durum matrisini kur",
    subtitle: "CASE ifadelerini aggregate içine taşıyarak koşullu metrik üret.",
    scenario:
      "Operasyon lideri her satış kanalındaki tamamlanan, bekleyen ve iptal edilen siparişleri tek satırda izlemek istiyor.",
    objective:
      "Her channel için SUM ve CASE kullanarak completed_orders, pending_orders ve cancelled_orders kolonlarını üret; sonucu channel artan sırada getir.",
    difficulty: "intermediate",
    estimatedMinutes: 13,
    routeOrder: 15,
    curriculumConcepts: [
      "K01",
      "K02",
      "K03",
      "K15",
      "K16",
      "K26",
      "K99-KOSULLU_OZETLEME",
    ],
    prerequisites: ["m4-t2"],
    concepts: [
      "SUM",
      "CASE",
      "GROUP_BY",
      "CONDITIONAL_AGGREGATION",
      "ORDER_BY",
    ],
    setupSql: channelOrderSetupSql,
    schema: channelOrderSchema,
    sampleRows: channelOrderSamples,
    expectedColumns: [
      "channel",
      "completed_orders",
      "pending_orders",
      "cancelled_orders",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Partner", 1, 1, 0],
      ["Store", 2, 0, 1],
      ["Web", 2, 1, 0],
    ],
    orderSensitive: true,
    requiredConcepts: ["SUM", "CASE", "GROUP_BY", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Her durum için eşleşen satıra 1, diğerlerine 0 veren ayrı bir CASE ifadesi düşün.",
      "SUM(CASE WHEN status = ... THEN 1 ELSE 0 END) grup içindeki eşleşmeleri sayar.",
      "Üç koşullu SUM ifadesini alias'larıyla yaz, channel bazında grupla ve channel'a göre sırala.",
    ],
    explanation:
      "Koşullu aggregation, satır düzeyindeki durumları tek grup satırında ayrı karar metriklerine çevirir. ELSE 0 kullanmak eşleşmeyen satırların toplamı belirsizleştirmesini engeller.",
    completionMessage:
      "Durum matrisi hazır. Tek taramada üç operasyon metriği ürettin.",
    nextTaskId: "m4-t1",
  }),
];

const aggregationBridgeDrills: LessonTask[] = [
  createTask({
    id: "m4-d1",
    slug: "total-order-count",
    moduleId: "module-4",
    title: "Tek COUNT",
    subtitle: "Tablodaki tüm satırları tek bir sayıya indir.",
    scenario:
      "Operasyon ekibi, kanal sipariş tablosunda kaç hareket olduğunu tek sayı olarak görmek istiyor.",
    objective:
      "channel_orders tablosundaki toplam satır sayısını order_count adıyla getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_intro",
    scored: false,
    routeOrder: 12.3,
    conceptNew: "K14",
    conceptsReinforced: ["K01", "K02"],
    curriculumConcepts: ["K01", "K02", "K14"],
    drillConcept:
      "COUNT, çıktı tanesinin ilk kez değiştiği yerdir: birçok satır girer, tek satır çıkar. GROUP BY olmadan COUNT tüm tabloyu tek grupta özetler.",
    prerequisites: [],
    concepts: ["SELECT", "COUNT", "ALIAS"],
    setupSql: channelOrderSetupSql,
    schema: channelOrderSchema,
    sampleRows: channelOrderSamples,
    expectedColumns: ["order_count"],
    validationMode: "result-and-concepts",
    expectedResult: [[8]],
    orderSensitive: false,
    requiredConcepts: ["COUNT"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: ["COUNT(*) tüm satırları sayar; sonucu order_count diye adlandır."],
    explanation:
      "COUNT(*) filtre veya gruplama olmadan tabloya tek bir özet satırı üretir.",
    completionMessage:
      "Toplam sipariş sayısı hazır. İlk tek-satır özetini ürettin.",
    nextTaskId: null,
  }),
  createTask({
    id: "m4-d2",
    slug: "orders-per-channel-count",
    moduleId: "module-4",
    title: "GROUP BY + tek aggregate",
    subtitle: "Siparişleri kanal kovalarına ayırıp her kovayı say.",
    scenario:
      "Operasyon ekibi, toplam yerine her satış kanalındaki sipariş adedini karşılaştırmak istiyor.",
    objective:
      "channel_orders tablosunu channel kolonuna göre grupla ve her kanalın satır sayısını order_count adıyla getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_intro",
    scored: false,
    routeOrder: 12.4,
    conceptNew: "K16",
    conceptsReinforced: ["K01", "K14"],
    curriculumConcepts: ["K01", "K02", "K14", "K16"],
    drillConcept:
      "GROUP BY satırları ortak channel değeri olan kovalarına ayırır; COUNT ise her kovayı tek satıra indirir. Bu nedenle sonuçta kanal başına bir satır görürsün.",
    prerequisites: [],
    concepts: ["SELECT", "COUNT", "GROUP_BY", "ALIAS"],
    setupSql: channelOrderSetupSql,
    schema: channelOrderSchema,
    sampleRows: channelOrderSamples,
    expectedColumns: ["channel", "order_count"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Partner", 2],
      ["Store", 3],
      ["Web", 3],
    ],
    orderSensitive: false,
    requiredConcepts: ["COUNT", "GROUP_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "SELECT channel, COUNT(*) AS order_count ile başla; channel için GROUP BY ekle.",
    ],
    explanation:
      "Tek kolonlu GROUP BY, her kanal için tek bir COUNT çıktısı üretir.",
    completionMessage:
      "Kanal kovaları hazır. GROUP BY ile özet satırlarının tanesini belirledin.",
    nextTaskId: null,
  }),
  createTask({
    id: "m4-d4",
    slug: "cast-order-reference",
    moduleId: "module-4",
    title: "Sipariş kimliğini metne çevir",
    subtitle: "Sayısal kimliği dışa aktarım için metin etikete dönüştür.",
    scenario:
      "Operasyon ekibi sipariş kimliklerini dışa aktarımda metin olarak kullanacak.",
    objective:
      "channel_orders tablosundan order_id değerini TEXT'e dönüştürüp order_ref adıyla getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_practice",
    scored: false,
    routeOrder: 12.1,
    conceptsReinforced: ["K01", "K02", "K99-TIP_DONUSUMU"],
    curriculumConcepts: ["K01", "K02", "K99-TIP_DONUSUMU"],
    drillConcept:
      "CAST, değerin kendisini değil sonuçtaki veri tipini değiştirir. AS order_ref ise dönüştürülmüş kimliğin rapordaki amacını açıklar.",
    prerequisites: [],
    concepts: ["SELECT", "CAST", "ALIAS"],
    setupSql: channelOrderSetupSql,
    schema: channelOrderSchema,
    sampleRows: channelOrderSamples,
    expectedColumns: ["order_ref"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["4101"],
      ["4102"],
      ["4103"],
      ["4104"],
      ["4105"],
      ["4106"],
      ["4107"],
      ["4108"],
    ],
    orderSensitive: false,
    requiredConcepts: ["CAST", "ALIAS"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "CAST(order_id AS TEXT) AS order_ref ifadesini SELECT listesine ekle.",
    ],
    explanation:
      "CAST sayısal kimliği metne çevirir; kaynak tablodaki order_id değeri değişmez.",
    completionMessage:
      "Sipariş referansları hazır. Tip dönüşümünü kısa bir çıktıda tekrar kullandın.",
    nextTaskId: null,
  }),
  createTask({
    id: "m4-m1",
    slug: "cast-and-amount-band",
    moduleId: "module-4",
    title: "Metin referansı ve tutar bandı",
    subtitle: "İki satır düzeyi dönüşümü tek görünümde birleştir.",
    scenario:
      "Operasyon ekibi dışa aktarım referansını ve tutar önemini aynı listede okumak istiyor.",
    objective:
      "order_id değerini TEXT'e dönüştürüp order_ref adıyla getir; order_amount 900 veya üzerindeyse Yüksek, değilse Standart döndüren amount_band kolonunu ekle.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    type: "drill_mix",
    scored: false,
    routeOrder: 12.2,
    conceptsReinforced: ["K01", "K02", "K26", "K99-TIP_DONUSUMU"],
    curriculumConcepts: ["K01", "K02", "K26", "K99-TIP_DONUSUMU"],
    drillConcept:
      "CAST kimliğin veri tipini, CASE ise tutarın iş etiketini üretir. İkisi de satır sayısını değiştirmeden SELECT içinde yeni kolonlar oluşturur.",
    prerequisites: [],
    concepts: ["SELECT", "CAST", "CASE", "ALIAS"],
    setupSql: channelOrderSetupSql,
    schema: channelOrderSchema,
    sampleRows: channelOrderSamples,
    expectedColumns: ["order_ref", "amount_band"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["4101", "Yüksek"],
      ["4102", "Standart"],
      ["4103", "Standart"],
      ["4104", "Yüksek"],
      ["4105", "Standart"],
      ["4106", "Standart"],
      ["4107", "Yüksek"],
      ["4108", "Standart"],
    ],
    orderSensitive: false,
    requiredConcepts: ["CAST", "CASE", "ALIAS"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "CAST(order_id AS TEXT) ile referansı üret; CASE WHEN order_amount >= 900 THEN 'Yüksek' ELSE 'Standart' END kullan.",
    ],
    explanation:
      "İki satır düzeyi dönüşüm, aynı ham sipariş kaydını daha okunur bir rapor satırına çevirir.",
    completionMessage:
      "Referans ve tutar bandı hazır. Bilinen dönüşümleri birleştirdin.",
    nextTaskId: null,
  }),
  createTask({
    id: "m4-m2",
    slug: "channel-count-and-total",
    moduleId: "module-4",
    title: "Kanal sayısı ve toplamı",
    subtitle: "İki tanıdık metrikle yönetici özetini sadeleştir.",
    scenario:
      "Satış yöneticisi, her kanalda kaç sipariş ve ne kadar tutar bulunduğunu hızlıca karşılaştırıyor.",
    objective:
      "channel bazında order_count ve total_amount metriklerini üret; sonucu channel artan sırada getir.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    type: "drill_mix",
    scored: false,
    routeOrder: 14.1,
    conceptsReinforced: ["K01", "K02", "K03", "K14", "K15", "K16"],
    curriculumConcepts: ["K01", "K02", "K03", "K14", "K15", "K16"],
    drillConcept:
      "GROUP BY kanal başına bir karar satırı üretir. COUNT hacmi, SUM ise parasal toplamı aynı grup için farklı metrikler olarak verir.",
    prerequisites: [],
    concepts: ["SELECT", "COUNT", "SUM", "GROUP_BY", "ORDER_BY", "ALIAS"],
    setupSql: channelOrderSetupSql,
    schema: channelOrderSchema,
    sampleRows: channelOrderSamples,
    expectedColumns: ["channel", "order_count", "total_amount"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Partner", 2, 1000],
      ["Store", 3, 1950],
      ["Web", 3, 3000],
    ],
    orderSensitive: true,
    requiredConcepts: ["COUNT", "SUM", "GROUP_BY", "ORDER_BY", "ALIAS"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "channel için GROUP BY yap; COUNT(*) AS order_count ve SUM(order_amount) AS total_amount ekleyip channel ile sırala.",
    ],
    explanation:
      "Kısa iki-metrik özet, tam sağlık raporundaki aggregate ailesini daha yönetilebilir biçimde tekrarlar.",
    completionMessage:
      "Kanal sayısı ve toplamı hazır. Özet yapısını yeniden kullandın.",
    nextTaskId: null,
  }),
];

const summaryTask = createTask({
  id: "m4-t1",
  slug: "regional-revenue-summary",
  moduleId: "module-4",
  title: "Bölgesel gelir özetini çıkar",
  subtitle: "İşlem satırlarını yönetici seviyesinde metriklere dönüştür.",
  scenario:
    "Bölge müdürü, yalnızca tamamlanmış işlemlerden en az 900 TL gelir üreten bölgeleri karşılaştırmak istiyor.",
  objective:
    "completed durumundaki işlemleri region bazında grupla. transaction_count ve total_revenue kolonlarını üret, toplam geliri en az 900 olan grupları total_revenue azalan sırada getir.",
  difficulty: "intermediate",
  estimatedMinutes: 14,
  routeOrder: 16,
  curriculumConcepts: ["K01", "K02", "K03", "K05", "K14", "K15", "K16", "K18"],
  prerequisites: ["m4-t4"],
  concepts: ["COUNT", "SUM", "GROUP_BY", "HAVING", "WHERE", "ORDER_BY"],
  setupSql: `
    CREATE TABLE transactions (
      transaction_id INTEGER PRIMARY KEY,
      region TEXT NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      status TEXT NOT NULL
    );
    INSERT INTO transactions VALUES
      (401, 'East', 1200.00, 'completed'),
      (402, 'West', 800.00, 'completed'),
      (403, 'East', 500.00, 'refunded'),
      (404, 'North', 950.00, 'completed'),
      (405, 'West', 700.00, 'completed'),
      (406, 'North', 250.00, 'cancelled');
  `,
  schema: {
    tables: [
      {
        name: "transactions",
        description: "Bölgelere göre finansal işlem hareketleri.",
        columns: [
          {
            name: "transaction_id",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          { name: "region", dataType: "TEXT", nullable: false },
          { name: "amount", dataType: "NUMERIC(10,2)", nullable: false },
          { name: "status", dataType: "TEXT", nullable: false },
        ],
      },
    ],
  },
  sampleRows: [
    {
      tableName: "transactions",
      rows: [
        {
          transaction_id: 401,
          region: "East",
          amount: 1200,
          status: "completed",
        },
        {
          transaction_id: 402,
          region: "West",
          amount: 800,
          status: "completed",
        },
        {
          transaction_id: 403,
          region: "East",
          amount: 500,
          status: "refunded",
        },
      ],
    },
  ],
  expectedColumns: ["region", "transaction_count", "total_revenue"],
  validationMode: "result-and-concepts",
  expectedResult: [
    ["West", 2, 1500],
    ["East", 1, 1200],
    ["North", 1, 950],
  ],
  orderSensitive: true,
  requiredConcepts: ["COUNT", "SUM", "GROUP_BY", "HAVING", "ORDER_BY"],
  forbiddenOperations: [...READ_ONLY_FORBIDDEN],
  hints: [
    "Önce completed satırlarını WHERE ile ayır, sonra region bazında grupla.",
    "COUNT(*) işlem sayısını, SUM(amount) toplam geliri verir.",
    "GROUP BY region sonrasında HAVING SUM(amount) >= 900 ve ORDER BY total_revenue DESC kullan.",
  ],
  explanation:
    "WHERE satırları gruplamadan önce, HAVING ise oluşan grupları toplulaştırmadan sonra filtreler. COUNT ve SUM aynı grup üzerinde farklı yönetim metrikleri üretir.",
  completionMessage:
    "Bölgesel yönetici özeti hazır. Satırları anlamlı gruplara ve metriklere dönüştürdün.",
  nextTaskId: "m5-t2",
});

/**
 * These two repeats come after the full status-matrix case and deliberately
 * reuse the exact regional-summary fixture. The learner sees the same
 * transaction world that the next case will use, but practises one narrow
 * conditional metric before returning to the richer manager brief.
 */
const regionalSummaryBridgeDrills: LessonTask[] = [
  createTask({
    id: "m4-d3",
    slug: "completed-transactions-per-region",
    moduleId: "module-4",
    title: "Tek koşullu sayaç",
    subtitle: "CASE’i bölge bazında tek bir tamamlanma metriğine dönüştür.",
    scenario:
      "Bölge lideri, her bölgedeki tamamlanan işlem sayısını kısa bir kontrol listesinde görmek istiyor.",
    objective:
      "transactions tablosunu region bazında grupla. completed durumundaki işlemleri completed_transaction_count adıyla SUM(CASE ...) kullanarak say; sonucu region artan sırada getir.",
    difficulty: "intermediate",
    estimatedMinutes: 3,
    type: "drill_practice",
    scored: false,
    routeOrder: 15.1,
    conceptsReinforced: [
      "K01",
      "K02",
      "K03",
      "K15",
      "K16",
      "K26",
      "K99-KOSULLU_OZETLEME",
    ],
    curriculumConcepts: [
      "K01",
      "K02",
      "K03",
      "K15",
      "K16",
      "K26",
      "K99-KOSULLU_OZETLEME",
    ],
    drillConcept:
      "CASE burada her satıra etiket vermek yerine aggregate’in içine girer. Eşleşen işlem 1, diğer işlem 0 olur; SUM her bölgedeki bu 1’leri toplar.",
    prerequisites: [],
    concepts: ["SELECT", "SUM", "CASE", "GROUP_BY", "ORDER_BY", "ALIAS"],
    setupSql: summaryTask.setupSql,
    schema: summaryTask.schema,
    sampleRows: summaryTask.sampleRows,
    expectedColumns: ["region", "completed_transaction_count"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["East", 1],
      ["North", 1],
      ["West", 2],
    ],
    orderSensitive: true,
    requiredConcepts: ["SUM", "CASE", "GROUP_BY", "ORDER_BY", "ALIAS"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_transaction_count ifadesini region GROUP BY içinde kullan.",
    ],
    explanation:
      "Koşullu özetleme, satır düzeyindeki CASE sonucunu grup düzeyinde tek bir sayaca dönüştürür.",
    completionMessage:
      "Bölgesel koşullu sayaç hazır. CASE’i grup metrikleri için tekrar kullandın.",
    nextTaskId: null,
  }),
  createTask({
    id: "m4-m3",
    slug: "regional-completion-summary",
    moduleId: "module-4",
    title: "Bölgesel tamamlama özeti",
    subtitle: "Hacim ve koşullu sayacı tek özet satırında birleştir.",
    scenario:
      "Operasyon lideri, her bölgedeki işlem hacminin yanında tamamlanan işlem sayısını birlikte görmek istiyor.",
    objective:
      "transactions tablosunu region bazında grupla. transaction_count ve completed_transaction_count metriklerini üret; sonucu region artan sırada getir.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    type: "drill_mix",
    scored: false,
    routeOrder: 15.2,
    conceptsReinforced: [
      "K01",
      "K02",
      "K03",
      "K14",
      "K15",
      "K16",
      "K26",
      "K99-KOSULLU_OZETLEME",
    ],
    curriculumConcepts: [
      "K01",
      "K02",
      "K03",
      "K14",
      "K15",
      "K16",
      "K26",
      "K99-KOSULLU_OZETLEME",
    ],
    drillConcept:
      "COUNT bütün işlem hacmini, SUM(CASE ...) ise bu hacim içindeki tamamlanan işlemleri sayar. İkisi aynı GROUP BY kovasında yan yana okunur.",
    prerequisites: [],
    concepts: [
      "SELECT",
      "COUNT",
      "SUM",
      "CASE",
      "GROUP_BY",
      "ORDER_BY",
      "ALIAS",
    ],
    setupSql: summaryTask.setupSql,
    schema: summaryTask.schema,
    sampleRows: summaryTask.sampleRows,
    expectedColumns: [
      "region",
      "transaction_count",
      "completed_transaction_count",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["East", 2, 1],
      ["North", 2, 1],
      ["West", 2, 2],
    ],
    orderSensitive: true,
    requiredConcepts: ["COUNT", "SUM", "CASE", "GROUP_BY", "ORDER_BY", "ALIAS"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "COUNT(*) AS transaction_count ile SUM(CASE ...) AS completed_transaction_count ifadelerini region GROUP BY içinde kullan.",
    ],
    explanation:
      "İki metrik aynı bölge kovasının hem toplam hareketini hem de tamamlanma durumunu gösterir.",
    completionMessage:
      "Bölgesel tamamlama özeti hazır. Koşullu metriği daha geniş bir özetle birleştirdin.",
    nextTaskId: null,
  }),
];

const joinFoundationTasks: LessonTask[] = [
  createTask({
    id: "m5-t2",
    slug: "order-value-file",
    moduleId: "module-5",
    title: "Sipariş değer dosyasını üret",
    subtitle: "Üç tabloyu doğru çıktı tanesinde bir araya getir.",
    scenario:
      "Finans ekibi müşteri adını ve sipariş kalemlerini birleştirerek her sipariş için tek bir toplam değer satırı istiyor.",
    objective:
      "orders, customers ve order_items tablolarını INNER JOIN ile birleştir. Her order_id için customer_name ve quantity * unit_price toplamını order_total adıyla getir; order_id artan sırada sırala.",
    difficulty: "intermediate",
    estimatedMinutes: 15,
    routeOrder: 17,
    curriculumConcepts: [
      "K01",
      "K02",
      "K03",
      "K15",
      "K17",
      "K20",
      "K24",
      "K25",
      "K99-ARITMETIK",
    ],
    prerequisites: ["m4-t1"],
    concepts: [
      "PRIMARY_KEY",
      "FOREIGN_KEY",
      "INNER_JOIN",
      "MULTI_JOIN",
      "ARITHMETIC",
      "SUM",
      "GROUP_BY",
      "ORDER_BY",
    ],
    setupSql: `
      CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY,
        customer_name TEXT NOT NULL
      );
      CREATE TABLE orders (
        order_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(customer_id)
      );
      CREATE TABLE order_items (
        item_id INTEGER PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(order_id),
        quantity INTEGER NOT NULL,
        unit_price NUMERIC(10, 2) NOT NULL
      );
      INSERT INTO customers VALUES
        (1, 'Atlas Retail'),
        (2, 'Mavi Market');
      INSERT INTO orders VALUES
        (5101, 1),
        (5102, 2),
        (5103, 1);
      INSERT INTO order_items VALUES
        (1, 5101, 2, 100.00),
        (2, 5101, 1, 500.00),
        (3, 5102, 3, 150.00),
        (4, 5103, 4, 100.00);
    `,
    schema: {
      tables: [
        {
          name: "customers",
          description: "Sipariş veren kurumsal müşteriler.",
          columns: [
            {
              name: "customer_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "customer_name", dataType: "TEXT", nullable: false },
          ],
        },
        {
          name: "orders",
          description: "Müşteriye bağlı sipariş başlıkları.",
          columns: [
            {
              name: "order_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "customer_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "customers", column: "customer_id" },
            },
          ],
        },
        {
          name: "order_items",
          description: "Siparişlerin miktar ve fiyat içeren kalemleri.",
          columns: [
            {
              name: "item_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "order_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "orders", column: "order_id" },
            },
            { name: "quantity", dataType: "INTEGER", nullable: false },
            { name: "unit_price", dataType: "NUMERIC(10,2)", nullable: false },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "orders",
          fromColumn: "customer_id",
          toTable: "customers",
          toColumn: "customer_id",
          label: "Sipariş başlığı müşteriye aittir",
        },
        {
          fromTable: "order_items",
          fromColumn: "order_id",
          toTable: "orders",
          toColumn: "order_id",
          label: "Kalem sipariş başlığına aittir",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "customers",
        rows: [
          { customer_id: 1, customer_name: "Atlas Retail" },
          { customer_id: 2, customer_name: "Mavi Market" },
        ],
      },
      {
        tableName: "orders",
        rows: [
          { order_id: 5101, customer_id: 1 },
          { order_id: 5102, customer_id: 2 },
        ],
      },
      {
        tableName: "order_items",
        rows: [
          { item_id: 1, order_id: 5101, quantity: 2, unit_price: 100 },
          { item_id: 2, order_id: 5101, quantity: 1, unit_price: 500 },
        ],
      },
    ],
    expectedColumns: ["order_id", "customer_name", "order_total"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [5101, "Atlas Retail", 700],
      [5102, "Mavi Market", 450],
      [5103, "Atlas Retail", 400],
    ],
    orderSensitive: true,
    requiredConcepts: [
      "INNER_JOIN",
      "MULTI_JOIN",
      "SUM",
      "GROUP_BY",
      "ORDER_BY",
    ],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Çıktının tanesi sipariştir; kalem satırlarını order_id seviyesinde toplamalısın.",
      "orders önce customers ile customer_id, sonra order_items ile order_id üzerinden birleşir.",
      "İki INNER JOIN sonrasında order_id ve customer_name'e göre grupla; SUM(quantity * unit_price) AS order_total üret.",
    ],
    explanation:
      "Çoklu JOIN dağınık boyut ve hareket verisini bağlar. GROUP BY sipariş tanesini korurken kalem tutarlarını tek bir finansal toplamda birleştirir.",
    completionMessage:
      "Sipariş değer dosyası hazır. Üç tabloyu satır çoğalmasını yöneterek birleştirdin.",
    nextTaskId: "m5-t3",
  }),
  createTask({
    id: "m5-t3",
    slug: "employee-manager-map",
    moduleId: "module-5",
    title: "Çalışan–yönetici görünümünü kur",
    subtitle: "Aynı tabloyu iki ayrı rolle birleştir.",
    scenario:
      "İnsan kaynakları ekibi, doğrudan yöneticisi bulunan her çalışanı yöneticisinin adıyla birlikte organizasyon listesine ekleyecek.",
    objective:
      "employees tablosunu kendisiyle INNER JOIN kullanarak birleştir. employee_name ve manager_name kolonlarını employee_id artan sırada getir; üst yöneticiyi sonuç dışında bırak.",
    difficulty: "intermediate",
    estimatedMinutes: 12,
    prerequisites: ["m5-t2"],
    concepts: [
      "PRIMARY_KEY",
      "FOREIGN_KEY",
      "INNER_JOIN",
      "SELF_JOIN",
      "ORDER_BY",
      "ALIAS",
    ],
    setupSql: `
      CREATE TABLE employees (
        employee_id INTEGER PRIMARY KEY,
        employee_name TEXT NOT NULL,
        role_title TEXT NOT NULL,
        manager_id INTEGER REFERENCES employees(employee_id)
      );
      INSERT INTO employees VALUES
        (1, 'Derya Akın', 'CEO', NULL),
        (2, 'Baran Tunç', 'Sales Director', 1),
        (3, 'Ceren Aras', 'Operations Director', 1),
        (4, 'Efe Kaya', 'Account Executive', 2),
        (5, 'Funda Yalın', 'Analyst', 3);
    `,
    schema: {
      tables: [
        {
          name: "employees",
          description:
            "Yönetici ilişkisini aynı tablo üzerinde tutan çalışan ana verisi.",
          columns: [
            {
              name: "employee_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "employee_name", dataType: "TEXT", nullable: false },
            { name: "role_title", dataType: "TEXT", nullable: false },
            {
              name: "manager_id",
              dataType: "INTEGER",
              nullable: true,
              references: { table: "employees", column: "employee_id" },
            },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "employees",
          fromColumn: "manager_id",
          toTable: "employees",
          toColumn: "employee_id",
          label: "Çalışanın yöneticisi yine employees tablosundadır",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "employees",
        rows: [
          {
            employee_id: 1,
            employee_name: "Derya Akın",
            role_title: "CEO",
            manager_id: null,
          },
          {
            employee_id: 2,
            employee_name: "Baran Tunç",
            role_title: "Sales Director",
            manager_id: 1,
          },
          {
            employee_id: 4,
            employee_name: "Efe Kaya",
            role_title: "Account Executive",
            manager_id: 2,
          },
        ],
      },
    ],
    expectedColumns: ["employee_name", "manager_name"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Baran Tunç", "Derya Akın"],
      ["Ceren Aras", "Derya Akın"],
      ["Efe Kaya", "Baran Tunç"],
      ["Funda Yalın", "Ceren Aras"],
    ],
    orderSensitive: true,
    requiredConcepts: ["INNER_JOIN", "SELF_JOIN", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Aynı employees tablosuna çalışan ve yönetici rollerini ayıran iki farklı alias ver.",
      "Çalışan alias'ındaki manager_id, yönetici alias'ındaki employee_id ile eşleşir.",
      "FROM employees e INNER JOIN employees m ON e.manager_id = m.employee_id yapısını kurup e.employee_id ile sırala.",
    ],
    explanation:
      "Self JOIN aynı varlığın hiyerarşik rollerini yan yana getirir. Açık alias'lar hangi kolonun çalışana, hangisinin yöneticiye ait olduğunu anlaşılır kılar.",
    completionMessage:
      "Organizasyon görünümü hazır. Aynı tabloyu iki iş rolüyle güvenle kullandın.",
    nextTaskId: "m5-t4",
  }),
  createTask({
    id: "m5-t4",
    slug: "tenant-price-match",
    moduleId: "module-5",
    title: "Fiyatı bileşik anahtarla eşleştir",
    subtitle: "Yanlış satır çoğalmasını iki kolonlu JOIN koşuluyla önle.",
    scenario:
      "Çok şirketli sipariş sisteminde aynı SKU farklı şirketlerde farklı fiyata sahip; finans her satırı kendi şirket fiyatıyla değerlemek istiyor.",
    objective:
      "order_lines ile catalog_prices tablolarını company_id ve sku kolonlarının ikisi üzerinden INNER JOIN ile birleştir. line_id, company_id, sku ve quantity * unit_price sonucu line_total kolonlarını line_id artan sırada getir.",
    difficulty: "intermediate",
    estimatedMinutes: 14,
    prerequisites: ["m5-t3"],
    concepts: [
      "PRIMARY_KEY",
      "FOREIGN_KEY",
      "INNER_JOIN",
      "AND",
      "ARITHMETIC",
      "ORDER_BY",
      "ALIAS",
    ],
    setupSql: `
      CREATE TABLE catalog_prices (
        company_id INTEGER NOT NULL,
        sku TEXT NOT NULL,
        unit_price NUMERIC(10, 2) NOT NULL,
        PRIMARY KEY (company_id, sku)
      );
      CREATE TABLE order_lines (
        line_id INTEGER PRIMARY KEY,
        company_id INTEGER NOT NULL,
        sku TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (company_id, sku) REFERENCES catalog_prices(company_id, sku)
      );
      INSERT INTO catalog_prices VALUES
        (1, 'SKU-A', 100.00),
        (2, 'SKU-A', 130.00),
        (1, 'SKU-B', 50.00),
        (2, 'SKU-B', 65.00);
      INSERT INTO order_lines VALUES
        (5201, 1, 'SKU-A', 2),
        (5202, 2, 'SKU-A', 3),
        (5203, 1, 'SKU-B', 4),
        (5204, 2, 'SKU-B', 1);
    `,
    schema: {
      tables: [
        {
          name: "catalog_prices",
          description:
            "Şirket ve SKU birleşimine göre değişen katalog fiyatları.",
          columns: [
            {
              name: "company_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "sku",
              dataType: "TEXT",
              nullable: false,
              primaryKey: true,
            },
            { name: "unit_price", dataType: "NUMERIC(10,2)", nullable: false },
          ],
        },
        {
          name: "order_lines",
          description: "Şirket ve SKU bağlamını taşıyan sipariş satırları.",
          columns: [
            {
              name: "line_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "company_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "catalog_prices", column: "company_id" },
            },
            {
              name: "sku",
              dataType: "TEXT",
              nullable: false,
              references: { table: "catalog_prices", column: "sku" },
            },
            { name: "quantity", dataType: "INTEGER", nullable: false },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "order_lines",
          fromColumn: "company_id",
          toTable: "catalog_prices",
          toColumn: "company_id",
          label: "Bileşik eşleşmenin şirket parçası",
        },
        {
          fromTable: "order_lines",
          fromColumn: "sku",
          toTable: "catalog_prices",
          toColumn: "sku",
          label: "Bileşik eşleşmenin ürün parçası",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "catalog_prices",
        rows: [
          { company_id: 1, sku: "SKU-A", unit_price: 100 },
          { company_id: 2, sku: "SKU-A", unit_price: 130 },
        ],
      },
      {
        tableName: "order_lines",
        rows: [
          { line_id: 5201, company_id: 1, sku: "SKU-A", quantity: 2 },
          { line_id: 5202, company_id: 2, sku: "SKU-A", quantity: 3 },
        ],
      },
    ],
    expectedColumns: ["line_id", "company_id", "sku", "line_total"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [5201, 1, "SKU-A", 200],
      [5202, 2, "SKU-A", 390],
      [5203, 1, "SKU-B", 200],
      [5204, 2, "SKU-B", 65],
    ],
    orderSensitive: true,
    requiredConcepts: ["INNER_JOIN", "AND", "ARITHMETIC", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "sku tek başına benzersiz değildir; eşleşmenin şirket bağlamını da taşıması gerekir.",
      "ON bölümünde company_id eşitliği ile sku eşitliğini AND kullanarak birleştir.",
      "INNER JOIN catalog_prices p ON l.company_id = p.company_id AND l.sku = p.sku sonrasında quantity * unit_price hesapla.",
    ],
    explanation:
      "Bileşik anahtarın yalnızca bir parçasıyla JOIN yapmak çapraz şirket fiyatlarını eşleştirerek satırları çoğaltır. Her iki anahtar kolonunu kullanmak doğru cardinality'yi korur.",
    completionMessage:
      "Sipariş satırları doğru şirket fiyatıyla eşleşti. JOIN cardinality hatasını önledin.",
    nextTaskId: "m5-t1",
  }),
];

/**
 * All three bridge drills intentionally reuse the exact m5-t2 fixture.
 * They query only its customers/orders subset so the eventual three-table
 * case feels like a continuation of a familiar data world, not a new puzzle.
 */
const orderValueCase = joinFoundationTasks[0]!;

const joinBridgeDrills: LessonTask[] = [
  createTask({
    id: "m5-d1",
    slug: "order-item-count-threshold",
    moduleId: "module-5",
    title: "HAVING ile eşik koy",
    subtitle: "Grupları oluşturduktan sonra kalanları seç.",
    scenario:
      "Finans ekibi, toplam sipariş değeri en az 400 TL olan siparişlerin kalem sayısını kısa bir kontrol listesinde görmek istiyor.",
    objective:
      "order_items tablosunu order_id bazında grupla. quantity * unit_price toplamı en az 400 olan siparişler için order_id ve item_count kolonlarını order_id artan sırada getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_practice",
    scored: false,
    routeOrder: 16.1,
    conceptsReinforced: [
      "K01",
      "K02",
      "K03",
      "K14",
      "K15",
      "K16",
      "K18",
      "K99-ARITMETIK",
    ],
    curriculumConcepts: [
      "K01",
      "K02",
      "K03",
      "K14",
      "K15",
      "K16",
      "K18",
      "K99-ARITMETIK",
    ],
    drillConcept:
      "HAVING, GROUP BY ile oluşmuş sipariş gruplarını filtreler. WHERE satırları gruplamadan önce seçerken, burada COUNT sonucu üzerinden karar verirsin.",
    prerequisites: [],
    concepts: [
      "SELECT",
      "COUNT",
      "SUM",
      "ARITHMETIC",
      "GROUP_BY",
      "HAVING",
      "ORDER_BY",
      "ALIAS",
    ],
    setupSql: orderValueCase.setupSql,
    schema: orderValueCase.schema,
    sampleRows: orderValueCase.sampleRows,
    expectedColumns: ["order_id", "item_count"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [5101, 2],
      [5102, 1],
      [5103, 1],
    ],
    orderSensitive: true,
    requiredConcepts: [
      "COUNT",
      "SUM",
      "ARITHMETIC",
      "GROUP_BY",
      "HAVING",
      "ORDER_BY",
      "ALIAS",
    ],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "GROUP BY order_id sonrasında HAVING SUM(quantity * unit_price) >= 400 kullan; COUNT(*) sonucuna item_count alias'ını ver.",
    ],
    explanation:
      "HAVING, yalnız oluşmuş grupları sayım veya toplam gibi aggregate sonuçlara göre seçer.",
    completionMessage:
      "Sipariş grupları filtrelendi. HAVING ile özet sonrası eşiği tekrar kullandın.",
    nextTaskId: null,
  }),
  createTask({
    id: "m5-d2",
    slug: "order-customer-inner-join",
    moduleId: "module-5",
    title: "İki tablo INNER JOIN",
    subtitle: "Sipariş başlığını müşterinin adıyla tek satırda buluştur.",
    scenario:
      "Finans ekibi, sipariş numarasının yanında müşterinin adını görmek için iki tabloyu birleştirmek istiyor.",
    objective:
      "orders ile customers tablolarını customer_id üzerinden INNER JOIN ile birleştir. order_id ve customer_name kolonlarını order_id artan sırada getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_intro",
    scored: false,
    routeOrder: 16.3,
    conceptNew: "K20",
    conceptsReinforced: ["K01", "K03"],
    curriculumConcepts: ["K01", "K03", "K20"],
    drillConcept:
      "INNER JOIN iki tablodaki eşleşen parçaları tek satırda buluşturur. ON koşulu hangi siparişin hangi müşteriye ait olduğunu söyler; bu bir filtre değil, ilişki kuralıdır.",
    prerequisites: [],
    concepts: ["SELECT", "INNER_JOIN", "ORDER_BY"],
    setupSql: orderValueCase.setupSql,
    schema: orderValueCase.schema,
    sampleRows: orderValueCase.sampleRows,
    expectedColumns: ["order_id", "customer_name"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [5101, "Atlas Retail"],
      [5102, "Mavi Market"],
      [5103, "Atlas Retail"],
    ],
    orderSensitive: true,
    requiredConcepts: ["INNER_JOIN", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id ile iki kaynağı bağla; sonra o.order_id ile sırala.",
    ],
    explanation:
      "INNER JOIN, eşleşen sipariş ve müşteri satırlarını aynı sonuç satırına taşır.",
    completionMessage:
      "Sipariş ve müşteri tek satırda buluştu. İlk INNER JOIN’ini kurdun.",
    nextTaskId: null,
  }),
  createTask({
    id: "m5-d3",
    slug: "order-customer-item-join",
    moduleId: "module-5",
    title: "Üç tabloyu ilişkilendir",
    subtitle: "Sipariş başlığından kalem ayrıntısına güvenli biçimde ilerle.",
    scenario:
      "Finans ekibi, müşteri adını her sipariş kaleminin yanında görmek için üç kaynağı bağlamak istiyor.",
    objective:
      "orders, customers ve order_items tablolarını INNER JOIN ile birleştir. order_id, customer_name ve item_id kolonlarını order_id, sonra item_id artan sırada getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_intro",
    scored: false,
    routeOrder: 16.4,
    conceptNew: "K24",
    conceptsReinforced: ["K01", "K03", "K20"],
    curriculumConcepts: ["K01", "K03", "K20", "K24"],
    drillConcept:
      "Üç tablo JOIN’i, aynı iş nesnesinin farklı parçalarını iki ilişki üzerinden bağlar. Önce siparişi müşteriye, sonra siparişi kalemlerine bağlarsın; sonuç satırı artık bir kalemdir.",
    prerequisites: [],
    concepts: ["SELECT", "INNER_JOIN", "MULTI_JOIN", "ORDER_BY"],
    setupSql: orderValueCase.setupSql,
    schema: orderValueCase.schema,
    sampleRows: orderValueCase.sampleRows,
    expectedColumns: ["order_id", "customer_name", "item_id"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [5101, "Atlas Retail", 1],
      [5101, "Atlas Retail", 2],
      [5102, "Mavi Market", 3],
      [5103, "Atlas Retail", 4],
    ],
    orderSensitive: true,
    requiredConcepts: ["INNER_JOIN", "MULTI_JOIN", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "orders'ı önce customers ile customer_id üzerinden, sonra order_items ile order_id üzerinden INNER JOIN yap; o.order_id ve i.item_id ile sırala.",
    ],
    explanation:
      "Çoklu JOIN iki ilişkiyi aynı satıra taşır; burada her sonuç satırı bir sipariş kalemini temsil eder.",
    completionMessage:
      "Üç tablo ilişkilendi. Bir sonraki vakada bu kalem satırlarını sipariş düzeyinde özetleyeceksin.",
    nextTaskId: null,
  }),
  createTask({
    id: "m5-m1",
    slug: "high-value-order-totals",
    moduleId: "module-5",
    title: "Sipariş toplamına eşik koy",
    subtitle:
      "Kalemleri sipariş seviyesinde topla, sonra yüksek değerli grupları seç.",
    scenario:
      "Finans ekibi, toplamı en az 450 olan siparişleri öncelikli tahsilat listesinde incelemek istiyor.",
    objective:
      "order_items tablosunu order_id bazında grupla. quantity * unit_price toplamı en az 450 olan siparişler için order_id ve order_amount kolonlarını order_id artan sırada getir.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    type: "drill_mix",
    scored: false,
    routeOrder: 16.2,
    conceptsReinforced: [
      "K01",
      "K02",
      "K03",
      "K15",
      "K16",
      "K18",
      "K99-ARITMETIK",
    ],
    curriculumConcepts: [
      "K01",
      "K02",
      "K03",
      "K15",
      "K16",
      "K18",
      "K99-ARITMETIK",
    ],
    drillConcept:
      "Önce quantity * unit_price ile kalem değerini üretirsin; SUM bunu sipariş toplamına çevirir. HAVING artık oluşmuş toplam üzerinde eşik uygular.",
    prerequisites: [],
    concepts: [
      "SELECT",
      "SUM",
      "ARITHMETIC",
      "GROUP_BY",
      "HAVING",
      "ORDER_BY",
      "ALIAS",
    ],
    setupSql: orderValueCase.setupSql,
    schema: orderValueCase.schema,
    sampleRows: orderValueCase.sampleRows,
    expectedColumns: ["order_id", "order_amount"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [5101, 700],
      [5102, 450],
    ],
    orderSensitive: true,
    requiredConcepts: [
      "SUM",
      "ARITHMETIC",
      "GROUP_BY",
      "HAVING",
      "ORDER_BY",
      "ALIAS",
    ],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "SUM(quantity * unit_price) AS order_amount yaz; GROUP BY order_id sonrasında HAVING SUM(quantity * unit_price) >= 450 ekle.",
    ],
    explanation:
      "Aritmetik değer önce kalem düzeyinde, SUM ve HAVING ise sipariş düzeyinde çalışır.",
    completionMessage:
      "Yüksek değerli siparişler hazır. Özet sonrası eşik ve tutar hesabını birleştirdin.",
    nextTaskId: null,
  }),
  createTask({
    id: "m5-d4",
    slug: "order-price-buckets",
    moduleId: "module-5",
    title: "İki kolonla grupla",
    subtitle: "Sonuç tanesini sipariş ve fiyat birleşimi olarak belirle.",
    scenario:
      "Finans ekibi, her siparişte hangi birim fiyatların kaç kalemde tekrarlandığını görmek istiyor.",
    objective:
      "order_items tablosunu order_id ve unit_price kolonlarına göre grupla. order_id, unit_price ve line_count kolonlarını order_id, sonra unit_price artan sırada getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_intro",
    scored: false,
    routeOrder: 16.5,
    conceptNew: "K17",
    conceptsReinforced: ["K01", "K02", "K03", "K14", "K16"],
    curriculumConcepts: ["K01", "K02", "K03", "K14", "K16", "K17"],
    drillConcept:
      "Birden fazla GROUP BY kolonu, satırları tek bir özelliğe göre değil o özelliklerin birleşimine göre kovalar. Burada bir sonuç satırı bir sipariş–fiyat çiftidir.",
    prerequisites: [],
    concepts: ["SELECT", "COUNT", "GROUP_BY", "ORDER_BY", "ALIAS"],
    setupSql: orderValueCase.setupSql,
    schema: orderValueCase.schema,
    sampleRows: orderValueCase.sampleRows,
    expectedColumns: ["order_id", "unit_price", "line_count"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [5101, 100, 1],
      [5101, 500, 1],
      [5102, 150, 1],
      [5103, 100, 1],
    ],
    orderSensitive: true,
    requiredConcepts: ["COUNT", "GROUP_BY", "ORDER_BY", "ALIAS"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "SELECT listesinde aggregate olmayan order_id ve unit_price değerlerinin ikisini de GROUP BY listesine ekle; COUNT(*) AS line_count ile say.",
    ],
    explanation:
      "Çok kolonlu GROUP BY, her sipariş–fiyat birleşimi için ayrı bir özet satırı üretir.",
    completionMessage:
      "Çok kolonlu kovalar hazır. Sonuç tanesini iki anahtarla belirledin.",
    nextTaskId: null,
  }),
  createTask({
    id: "m5-d5",
    slug: "customer-order-count-join",
    moduleId: "module-5",
    title: "JOIN sonucunu özetle",
    subtitle: "İlişkili satırları müşteri düzeyinde bir karara indir.",
    scenario:
      "Finans ekibi, her müşterinin kaç sipariş verdiğini kısa bir özet halinde görmek istiyor.",
    objective:
      "orders ile customers tablolarını INNER JOIN ile birleştir. customer_name bazında grupla ve customer_name ile order_count kolonlarını customer_name artan sırada getir.",
    difficulty: "beginner",
    estimatedMinutes: 3,
    type: "drill_intro",
    scored: false,
    routeOrder: 16.6,
    conceptNew: "K25",
    conceptsReinforced: ["K01", "K02", "K03", "K14", "K16", "K20"],
    curriculumConcepts: ["K01", "K02", "K03", "K14", "K16", "K20", "K25"],
    drillConcept:
      "JOIN ile oluşan sonuç da tek tablo gibi gruplanabilir. Önce müşteri-sipariş ilişkisini kurar, sonra GROUP BY ile müşteri başına satırları kovalar ve COUNT ile sayarsın.",
    prerequisites: [],
    concepts: [
      "SELECT",
      "INNER_JOIN",
      "COUNT",
      "GROUP_BY",
      "ORDER_BY",
      "ALIAS",
    ],
    setupSql: orderValueCase.setupSql,
    schema: orderValueCase.schema,
    sampleRows: orderValueCase.sampleRows,
    expectedColumns: ["customer_name", "order_count"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Atlas Retail", 2],
      ["Mavi Market", 1],
    ],
    orderSensitive: true,
    requiredConcepts: ["INNER_JOIN", "COUNT", "GROUP_BY", "ORDER_BY", "ALIAS"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "orders ve customers’ı customer_id ile birleştir; c.customer_name için GROUP BY ekleyip COUNT(*) AS order_count yaz ve customer_name ile sırala.",
    ],
    explanation:
      "Birleştirilmiş satırları müşteri düzeyinde gruplamak, ilişki sonrası da özet tanesini açıkça korur.",
    completionMessage:
      "Müşteri sipariş özeti hazır. JOIN sonucunu GROUP BY ile yönettin.",
    nextTaskId: null,
  }),
  createTask({
    id: "m5-m2",
    slug: "order-customer-item-summary",
    moduleId: "module-5",
    title: "Sipariş kalem özetini birleştir",
    subtitle:
      "Üç tabloyu, çoklu grubu ve ilişkili sayımı tek teslimde buluştur.",
    scenario:
      "Finans ekibi, her siparişin müşteri adıyla birlikte kaç kalemden oluştuğunu doğrulamak istiyor.",
    objective:
      "orders, customers ve order_items tablolarını INNER JOIN ile birleştir. order_id ve customer_name bazında grupla; item_count kolonunu üret ve sonucu order_id artan sırada getir.",
    difficulty: "beginner",
    estimatedMinutes: 5,
    type: "drill_mix",
    scored: false,
    routeOrder: 16.7,
    conceptsReinforced: [
      "K01",
      "K02",
      "K03",
      "K14",
      "K17",
      "K20",
      "K24",
      "K25",
    ],
    curriculumConcepts: [
      "K01",
      "K02",
      "K03",
      "K14",
      "K17",
      "K20",
      "K24",
      "K25",
    ],
    drillConcept:
      "İki JOIN aynı sipariş satırını müşteri ve kalem bilgisiyle zenginleştirir. GROUP BY sipariş–müşteri tanesini korur; COUNT ise bu siparişteki kalemleri sayar.",
    prerequisites: [],
    concepts: [
      "SELECT",
      "INNER_JOIN",
      "MULTI_JOIN",
      "COUNT",
      "GROUP_BY",
      "ORDER_BY",
      "ALIAS",
    ],
    setupSql: orderValueCase.setupSql,
    schema: orderValueCase.schema,
    sampleRows: orderValueCase.sampleRows,
    expectedColumns: ["order_id", "customer_name", "item_count"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [5101, "Atlas Retail", 2],
      [5102, "Mavi Market", 1],
      [5103, "Atlas Retail", 1],
    ],
    orderSensitive: true,
    requiredConcepts: [
      "INNER_JOIN",
      "MULTI_JOIN",
      "COUNT",
      "GROUP_BY",
      "ORDER_BY",
      "ALIAS",
    ],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "İki INNER JOIN'i kur; SELECT içindeki order_id ve customer_name değerlerinin ikisini de GROUP BY listesine ekleyip COUNT(i.item_id) AS item_count kullan.",
    ],
    explanation:
      "Bu kısa teslim, bir sonraki vaka için gereken çoklu JOIN ve çok kolonlu GROUP BY iskeletini aynı veri dünyasında tekrarlar.",
    completionMessage:
      "Sipariş kalem özeti hazır. Üç tabloyu doğru tanede birleştirdin.",
    nextTaskId: null,
  }),
];

const joinTask = createTask({
  id: "m5-t1",
  slug: "customer-order-coverage",
  moduleId: "module-5",
  title: "Sipariş vermeyen müşterileri de koru",
  subtitle:
    "Müşteri tabanını sipariş hareketleriyle güvenli biçimde birleştir.",
  scenario:
    "CRM ekibi, tamamlanmış siparişi olmasa bile her müşterinin raporda görünmesini ve toplam harcamasının sıfır olarak gösterilmesini istiyor.",
  objective:
    "customers ile orders tablolarını LEFT JOIN kullanarak birleştir. Her customer_name için completed sipariş toplamını total_spend adıyla getir; siparişi olmayanlarda 0 göster. total_spend azalan, eşitlikte customer_name artan sırada getir.",
  difficulty: "intermediate",
  estimatedMinutes: 16,
  prerequisites: ["m5-t4"],
  concepts: [
    "PRIMARY_KEY",
    "FOREIGN_KEY",
    "LEFT_JOIN",
    "GROUP_BY",
    "SUM",
    "ORDER_BY",
  ],
  setupSql: `
    CREATE TABLE customers (
      customer_id INTEGER PRIMARY KEY,
      customer_name TEXT NOT NULL,
      city TEXT NOT NULL
    );
    CREATE TABLE orders (
      order_id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
      amount NUMERIC(10, 2) NOT NULL,
      status TEXT NOT NULL
    );
    INSERT INTO customers VALUES
      (1, 'Atlas Retail', 'Istanbul'),
      (2, 'Mavi Market', 'Ankara'),
      (3, 'Kuzey Kafe', 'Samsun'),
      (4, 'Ada Tekstil', 'Izmir');
    INSERT INTO orders VALUES
      (501, 1, 1250.00, 'completed'),
      (502, 2, 820.00, 'completed'),
      (503, 1, 400.00, 'completed'),
      (504, 4, 2100.00, 'cancelled');
  `,
  schema: {
    tables: [
      {
        name: "customers",
        description: "CRM müşteri ana verisi.",
        columns: [
          {
            name: "customer_id",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          { name: "customer_name", dataType: "TEXT", nullable: false },
          { name: "city", dataType: "TEXT", nullable: false },
        ],
      },
      {
        name: "orders",
        description: "Müşterilere bağlı sipariş hareketleri.",
        columns: [
          {
            name: "order_id",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          {
            name: "customer_id",
            dataType: "INTEGER",
            nullable: false,
            references: { table: "customers", column: "customer_id" },
          },
          { name: "amount", dataType: "NUMERIC(10,2)", nullable: false },
          { name: "status", dataType: "TEXT", nullable: false },
        ],
      },
    ],
    relationships: [
      {
        fromTable: "orders",
        fromColumn: "customer_id",
        toTable: "customers",
        toColumn: "customer_id",
        label: "Her sipariş bir müşteriye aittir",
      },
    ],
  },
  sampleRows: [
    {
      tableName: "customers",
      rows: [
        { customer_id: 1, customer_name: "Atlas Retail", city: "Istanbul" },
        { customer_id: 3, customer_name: "Kuzey Kafe", city: "Samsun" },
      ],
    },
    {
      tableName: "orders",
      rows: [
        { order_id: 501, customer_id: 1, amount: 1250, status: "completed" },
        { order_id: 504, customer_id: 4, amount: 2100, status: "cancelled" },
      ],
    },
  ],
  expectedColumns: ["customer_name", "total_spend"],
  validationMode: "result-and-concepts",
  expectedResult: [
    ["Atlas Retail", 1650],
    ["Mavi Market", 820],
    ["Ada Tekstil", 0],
    ["Kuzey Kafe", 0],
  ],
  orderSensitive: true,
  requiredConcepts: ["LEFT_JOIN", "GROUP_BY", "SUM", "ORDER_BY"],
  forbiddenOperations: [...READ_ONLY_FORBIDDEN],
  hints: [
    "Ana listen customers olmalı; LEFT JOIN soldaki tüm müşterileri korur.",
    "completed koşulunu JOIN koşuluna eklemek, eşleşmeyen müşterilerin kaybolmasını önler.",
    "Toplamı NULL olduğunda sıfıra çevir; toplamı azalan, eşit toplamları müşteri adına göre artan sırala.",
  ],
  explanation:
    "LEFT JOIN soldaki müşteri kümesini korur. Sağ tablo filtresini ON içinde uygulamak, eşleşmeyen müşterileri WHERE ile istemeden elemeni engeller; COALESCE ise NULL toplamı sıfıra çevirir.",
  completionMessage:
    "CRM kapsamı korundu. Siparişsiz müşteriler de doğru sıfır değeriyle raporda.",
  nextTaskId: "m6-t2",
});

const subqueryFoundationTasks: LessonTask[] = [
  createTask({
    id: "m6-t2",
    slug: "campaign-product-shortlist",
    moduleId: "module-6",
    title: "Kampanya ürünlerini kısa listele",
    subtitle: "IN ve scalar alt sorguyu iki ayrı iş kuralı için kullan.",
    scenario:
      "Kategori ekibi yalnızca aktif kampanya kategorilerindeki ve genel ürün ortalamasından pahalı ürünleri premium vitrine alacak.",
    objective:
      "category_id değeri aktif kampanya kategorilerini döndüren bir IN alt sorgusunda bulunan ve unit_price değeri tüm ürünlerin ortalamasından yüksek olan ürünlerin product_name ve unit_price kolonlarını fiyata göre azalan sırada getir.",
    difficulty: "intermediate",
    estimatedMinutes: 14,
    prerequisites: ["m5-t1"],
    concepts: [
      "SUBQUERY",
      "IN",
      "AVG",
      "WHERE",
      "AND",
      "COMPARISON",
      "ORDER_BY",
    ],
    setupSql: `
      CREATE TABLE categories (
        category_id INTEGER PRIMARY KEY,
        category_name TEXT NOT NULL,
        campaign_active BOOLEAN NOT NULL
      );
      CREATE TABLE products (
        product_id INTEGER PRIMARY KEY,
        product_name TEXT NOT NULL,
        category_id INTEGER NOT NULL REFERENCES categories(category_id),
        unit_price NUMERIC(10, 2) NOT NULL
      );
      INSERT INTO categories VALUES
        (1, 'Electronics', TRUE),
        (2, 'Furniture', FALSE),
        (3, 'Audio', TRUE);
      INSERT INTO products VALUES
        (1, 'Kulaklık', 1, 100.00),
        (2, 'Monitör', 1, 300.00),
        (3, 'Ofis Koltuğu', 2, 500.00),
        (4, 'Akıllı Hoparlör', 3, 400.00),
        (5, 'Ses Kablosu', 3, 50.00),
        (6, 'Çalışma Masası', 2, 150.00);
    `,
    schema: {
      tables: [
        {
          name: "categories",
          description: "Kampanya kapsamı işaretlenmiş ürün kategorileri.",
          columns: [
            {
              name: "category_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "category_name", dataType: "TEXT", nullable: false },
            { name: "campaign_active", dataType: "BOOLEAN", nullable: false },
          ],
        },
        {
          name: "products",
          description: "Kategoriye bağlı ürün ve fiyat listesi.",
          columns: [
            {
              name: "product_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "product_name", dataType: "TEXT", nullable: false },
            {
              name: "category_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "categories", column: "category_id" },
            },
            { name: "unit_price", dataType: "NUMERIC(10,2)", nullable: false },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "products",
          fromColumn: "category_id",
          toTable: "categories",
          toColumn: "category_id",
          label: "Ürün bir kategoriye aittir",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "categories",
        rows: [
          {
            category_id: 1,
            category_name: "Electronics",
            campaign_active: true,
          },
          {
            category_id: 2,
            category_name: "Furniture",
            campaign_active: false,
          },
        ],
      },
      {
        tableName: "products",
        rows: [
          {
            product_id: 2,
            product_name: "Monitör",
            category_id: 1,
            unit_price: 300,
          },
          {
            product_id: 3,
            product_name: "Ofis Koltuğu",
            category_id: 2,
            unit_price: 500,
          },
        ],
      },
    ],
    expectedColumns: ["product_name", "unit_price"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Akıllı Hoparlör", 400],
      ["Monitör", 300],
    ],
    orderSensitive: true,
    requiredConcepts: ["SUBQUERY", "IN", "AVG", "AND", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "İki bağımsız filtre var: uygun kategori kümesi ve tek değer döndüren fiyat ortalaması.",
      "category_id için IN (SELECT ... FROM categories ...), fiyat eşiği için (SELECT AVG(...) FROM products) kullan.",
      "WHERE category_id IN (...) AND unit_price > (SELECT AVG(unit_price) FROM products) sonrasında fiyata göre DESC sırala.",
    ],
    explanation:
      "IN alt sorgusu çok satırlı bir kategori kümesini, scalar alt sorgu ise karşılaştırmada kullanılacak tek ortalama değerini üretir. Her alt sorgunun çıktı şekli kullanıldığı operatörle uyumludur.",
    completionMessage:
      "Premium kampanya listesi hazır. Küme ve tek değer alt sorgularını birlikte kullandın.",
    nextTaskId: "m6-t3",
  }),
  createTask({
    id: "m6-t3",
    slug: "silent-customer-watchlist",
    moduleId: "module-6",
    title: "Sessiz müşterileri bul",
    subtitle:
      "İlişkili NOT EXISTS ile hareketi olmayan ana kayıtları tespit et.",
    scenario:
      "Müşteri başarı ekibi 1 Nisan 2026'dan beri hiç sipariş vermeyen müşteriler için geri kazanım çalışması başlatacak.",
    objective:
      "customers tablosundan, orders içinde aynı customer_id ile 2026-04-01 veya sonrasında kaydı bulunmayan customer_id ve customer_name değerlerini customer_id artan sırada getir. İlişkili NOT EXISTS kullan.",
    difficulty: "intermediate",
    estimatedMinutes: 14,
    prerequisites: ["m6-t2"],
    concepts: [
      "SUBQUERY",
      "EXISTS",
      "NOT",
      "WHERE",
      "AND",
      "COMPARISON",
      "ORDER_BY",
    ],
    setupSql: `
      CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY,
        customer_name TEXT NOT NULL
      );
      CREATE TABLE orders (
        order_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
        ordered_at DATE NOT NULL
      );
      INSERT INTO customers VALUES
        (1, 'Atlas Retail'),
        (2, 'Mavi Market'),
        (3, 'Kuzey Kafe'),
        (4, 'Ada Tekstil');
      INSERT INTO orders VALUES
        (6101, 1, DATE '2026-04-08'),
        (6102, 2, DATE '2026-03-15'),
        (6103, 4, DATE '2026-04-02'),
        (6104, 1, DATE '2026-02-20');
    `,
    schema: {
      tables: [
        {
          name: "customers",
          description: "Geri kazanım analizi yapılacak müşteri ana verisi.",
          columns: [
            {
              name: "customer_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "customer_name", dataType: "TEXT", nullable: false },
          ],
        },
        {
          name: "orders",
          description: "Müşterilerin tarihli sipariş hareketleri.",
          columns: [
            {
              name: "order_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "customer_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "customers", column: "customer_id" },
            },
            { name: "ordered_at", dataType: "DATE", nullable: false },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "orders",
          fromColumn: "customer_id",
          toTable: "customers",
          toColumn: "customer_id",
          label: "Sipariş müşteriye aittir",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "customers",
        rows: [
          { customer_id: 1, customer_name: "Atlas Retail" },
          { customer_id: 3, customer_name: "Kuzey Kafe" },
        ],
      },
      {
        tableName: "orders",
        rows: [
          { order_id: 6101, customer_id: 1, ordered_at: "2026-04-08" },
          { order_id: 6102, customer_id: 2, ordered_at: "2026-03-15" },
        ],
      },
    ],
    expectedColumns: ["customer_id", "customer_name"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [2, "Mavi Market"],
      [3, "Kuzey Kafe"],
    ],
    orderSensitive: true,
    requiredConcepts: ["SUBQUERY", "EXISTS", "NOT", "AND", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Her müşteri için eşleşen yakın tarihli bir sipariş olup olmadığını kontrol etmelisin.",
      "Alt sorguyu o.customer_id = c.customer_id koşuluyla dış satıra bağla; tarih koşulunu aynı alt sorguda uygula.",
      "İç kontrolü müşteri anahtarı ve 1 Nisan tarih sınırıyla ilişkilendir; dışarıda bu eşleşmenin bulunmamasını iste.",
    ],
    explanation:
      "İlişkili NOT EXISTS dış sorgudaki her müşteri için belirlenen koşulu sağlayan en az bir hareket arar ve yalnızca bulunmayanları bırakır. NULL üretebilen listelerde NOT IN'e göre daha güvenli bir anti-join desenidir.",
    completionMessage:
      "Geri kazanım listesi hazır. Hareketi olmayan ana kayıtları güvenle tespit ettin.",
    nextTaskId: "m6-t4",
  }),
  createTask({
    id: "m6-t4",
    slug: "category-tree-paths",
    moduleId: "module-6",
    title: "Kategori ağacını aç",
    subtitle: "Recursive CTE ile bilinmeyen derinlikteki hiyerarşiyi dolaş.",
    scenario:
      "Katalog ekibi üst ve alt kategorileri tam yol etiketiyle dışa aktararak menü ve arama indeksini aynı kaynaktan besleyecek.",
    objective:
      "WITH RECURSIVE kullanarak kök kategoriden alt kategorilere ilerle. Her kayıt için 'Ürünler > ...' biçiminde category_path ve kökte 0'dan başlayan depth üret; category_path artan sırada getir.",
    difficulty: "advanced",
    estimatedMinutes: 18,
    prerequisites: ["m6-t3"],
    concepts: [
      "CTE",
      "RECURSIVE_CTE",
      "INNER_JOIN",
      "STRING_FUNCTION",
      "ARITHMETIC",
      "ORDER_BY",
    ],
    setupSql: `
      CREATE TABLE categories (
        category_id INTEGER PRIMARY KEY,
        category_name TEXT NOT NULL,
        parent_id INTEGER REFERENCES categories(category_id)
      );
      INSERT INTO categories VALUES
        (1, 'Ürünler', NULL),
        (2, 'Elektronik', 1),
        (3, 'Ev', 1),
        (4, 'Bilgisayar', 2),
        (5, 'Ses', 2),
        (6, 'Mutfak', 3);
    `,
    schema: {
      tables: [
        {
          name: "categories",
          description:
            "parent_id ile kendi üzerine bağlanan katalog kategorileri.",
          columns: [
            {
              name: "category_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "category_name", dataType: "TEXT", nullable: false },
            {
              name: "parent_id",
              dataType: "INTEGER",
              nullable: true,
              references: { table: "categories", column: "category_id" },
            },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "categories",
          fromColumn: "parent_id",
          toTable: "categories",
          toColumn: "category_id",
          label: "Alt kategori üst kategoriye bağlanır",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "categories",
        rows: [
          { category_id: 1, category_name: "Ürünler", parent_id: null },
          { category_id: 2, category_name: "Elektronik", parent_id: 1 },
          { category_id: 4, category_name: "Bilgisayar", parent_id: 2 },
        ],
      },
    ],
    expectedColumns: ["category_path", "depth"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Ürünler", 0],
      ["Ürünler > Elektronik", 1],
      ["Ürünler > Elektronik > Bilgisayar", 2],
      ["Ürünler > Elektronik > Ses", 2],
      ["Ürünler > Ev", 1],
      ["Ürünler > Ev > Mutfak", 2],
    ],
    orderSensitive: true,
    requiredConcepts: ["CTE", "RECURSIVE_CTE", "INNER_JOIN", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Recursive CTE iki parçadan oluşur: kökleri seçen anchor ve çocukları ekleyen recursive adım.",
      "Anchor parent_id IS NULL satırlarını depth 0 ile başlatır; UNION ALL sonrası çocukları parent_id üzerinden CTE'ye bağla.",
      "Recursive adımda çocuğu parent_id üzerinden bir önceki seviyeye bağla; yol metnini uzatırken depth değerini bir artır.",
    ],
    explanation:
      "Recursive CTE anchor sonuçtan başlar ve yeni çocuk kalmayana kadar aynı ilişkiyi tekrarlar. Yol ve depth değerlerini her adımda taşımak hiyerarşiyi raporlanabilir hale getirir.",
    completionMessage:
      "Kategori ağacı tam yollarıyla açıldı. Değişken derinlikteki hiyerarşiyi recursive olarak dolaştın.",
    nextTaskId: "m6-t1",
  }),
];

const cteTask = createTask({
  id: "m6-t1",
  slug: "above-average-branches",
  moduleId: "module-6",
  title: "Ortalamanın üzerindeki şubeleri bul",
  subtitle: "Çok adımlı analizi okunaklı CTE'lere böl.",
  scenario:
    "Satış direktörü, toplam geliri şube ortalamasının üzerinde kalan şubeleri yatırım planına almak istiyor.",
  objective:
    "Bir CTE ile branch_sales verisini branch bazında toplayıp branch_total üret. Sonuçtan yalnızca şube toplamlarının ortalamasını aşan branch ve branch_total değerlerini getir.",
  difficulty: "intermediate",
  estimatedMinutes: 18,
  prerequisites: ["m6-t4"],
  concepts: ["CTE", "SUBQUERY", "GROUP_BY", "SUM"],
  setupSql: `
    CREATE TABLE branch_sales (
      sale_id INTEGER PRIMARY KEY,
      branch TEXT NOT NULL,
      amount NUMERIC(10, 2) NOT NULL
    );
    INSERT INTO branch_sales VALUES
      (601, 'A', 900.00),
      (602, 'A', 600.00),
      (603, 'B', 400.00),
      (604, 'B', 600.00),
      (605, 'C', 1200.00),
      (606, 'C', 1000.00);
  `,
  schema: {
    tables: [
      {
        name: "branch_sales",
        description: "Şubelerin satış işlem tutarları.",
        columns: [
          {
            name: "sale_id",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          { name: "branch", dataType: "TEXT", nullable: false },
          { name: "amount", dataType: "NUMERIC(10,2)", nullable: false },
        ],
      },
    ],
  },
  sampleRows: [
    {
      tableName: "branch_sales",
      rows: [
        { sale_id: 601, branch: "A", amount: 900 },
        { sale_id: 603, branch: "B", amount: 400 },
        { sale_id: 605, branch: "C", amount: 1200 },
      ],
    },
  ],
  expectedColumns: ["branch", "branch_total"],
  validationMode: "result-and-concepts",
  expectedResult: [["C", 2200]],
  orderSensitive: false,
  requiredConcepts: ["CTE", "SUBQUERY", "GROUP_BY", "SUM"],
  forbiddenOperations: [...READ_ONLY_FORBIDDEN],
  hints: [
    "İlk adımda WITH branch_totals AS (...) yapısı içinde şube toplamlarını üret.",
    "CTE sonucundaki branch_total değerlerinin AVG değerini bir scalar subquery ile hesaplayabilirsin.",
    "Dış sorguda WHERE branch_total > (SELECT AVG(branch_total) FROM branch_totals) koşulunu kullan.",
  ],
  explanation:
    "CTE ara sonucu adlandırarak çok adımlı analizi okunabilir kılar. Aynı ara sonuç hem ana sorguya hem ortalama hesaplayan scalar subquery'ye veri sağlar.",
  completionMessage:
    "Yatırım adayı belirlendi. Karmaşık analizi tekrar kullanılabilir adımlara böldün.",
  nextTaskId: "m7-t2",
});

const analyticsFoundationTasks: LessonTask[] = [
  createTask({
    id: "m7-t2",
    slug: "category-sales-ranks",
    moduleId: "module-7",
    title: "Kategori liderlerini sırala",
    subtitle:
      "ROW_NUMBER, RANK ve DENSE_RANK farkını aynı sonuçta karşılaştır.",
    scenario:
      "Satış direktörü kategori içindeki temsilci sırasını görmek ve eşit gelirlerin sıra numaralarını nasıl etkilediğini karşılaştırmak istiyor.",
    objective:
      "Her category içinde ROW_NUMBER ile row_no üretirken revenue azalan, eşit gelirde rep_name artan sırasını kullan. RANK ile revenue_rank ve DENSE_RANK ile dense_revenue_rank yalnız revenue azalan sırasını izlesin. Sonucu category, revenue azalan ve rep_name artan sırada getir.",
    difficulty: "advanced",
    estimatedMinutes: 16,
    prerequisites: ["m6-t1"],
    concepts: [
      "ROW_NUMBER",
      "RANK",
      "DENSE_RANK",
      "PARTITION_BY",
      "ORDER_BY",
      "ALIAS",
    ],
    setupSql: `
      CREATE TABLE representative_sales (
        rep_id INTEGER PRIMARY KEY,
        category TEXT NOT NULL,
        rep_name TEXT NOT NULL,
        revenue NUMERIC(10, 2) NOT NULL
      );
      INSERT INTO representative_sales VALUES
        (1, 'Enterprise', 'Ayla', 1200.00),
        (2, 'Enterprise', 'Bora', 1200.00),
        (3, 'Enterprise', 'Cem', 900.00),
        (4, 'SMB', 'Derya', 800.00),
        (5, 'SMB', 'Eren', 600.00),
        (6, 'SMB', 'Figen', 600.00);
    `,
    schema: {
      tables: [
        {
          name: "representative_sales",
          description: "Kategori bazında temsilci gelir sonuçları.",
          columns: [
            {
              name: "rep_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "category", dataType: "TEXT", nullable: false },
            { name: "rep_name", dataType: "TEXT", nullable: false },
            { name: "revenue", dataType: "NUMERIC(10,2)", nullable: false },
          ],
        },
      ],
    },
    sampleRows: [
      {
        tableName: "representative_sales",
        rows: [
          {
            rep_id: 1,
            category: "Enterprise",
            rep_name: "Ayla",
            revenue: 1200,
          },
          {
            rep_id: 2,
            category: "Enterprise",
            rep_name: "Bora",
            revenue: 1200,
          },
          { rep_id: 5, category: "SMB", rep_name: "Eren", revenue: 600 },
        ],
      },
    ],
    expectedColumns: [
      "category",
      "rep_name",
      "revenue",
      "row_no",
      "revenue_rank",
      "dense_revenue_rank",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Enterprise", "Ayla", 1200, 1, 1, 1],
      ["Enterprise", "Bora", 1200, 2, 1, 1],
      ["Enterprise", "Cem", 900, 3, 3, 2],
      ["SMB", "Derya", 800, 1, 1, 1],
      ["SMB", "Eren", 600, 2, 2, 2],
      ["SMB", "Figen", 600, 3, 2, 2],
    ],
    orderSensitive: true,
    requiredConcepts: [
      "ROW_NUMBER",
      "RANK",
      "DENSE_RANK",
      "PARTITION_BY",
      "ORDER_BY",
    ],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Üç fonksiyon da aynı category bölümünde çalışmalı; eşitliği revenue değeri belirlemeli.",
      "ROW_NUMBER eşit gelirlerde rep_name artan ikinci anahtarını kullanmalı; RANK ve DENSE_RANK yalnızca revenue üzerinden sıralanmalı.",
      "Her fonksiyonda OVER (PARTITION BY category ORDER BY revenue DESC ...) kullan; dış sorguyu da beklenen category, revenue DESC, rep_name sırasına getir.",
    ],
    explanation:
      "ROW_NUMBER her satıra benzersiz sıra verir. RANK eşitlikten sonra boşluk bırakır; DENSE_RANK ise bir sonraki sırayı kesintisiz sürdürür. PARTITION BY bu hesabı her kategoride yeniden başlatır.",
    completionMessage:
      "Kategori liderlik tablosu hazır. Üç sıralama davranışını aynı veri üzerinde ayırdın.",
    nextTaskId: "m7-t3",
  }),
  createTask({
    id: "m7-t3",
    slug: "weekly-revenue-change",
    moduleId: "module-7",
    title: "Haftalık gelir değişimini ölç",
    subtitle: "LAG ile önceki dönemi aynı satıra taşı.",
    scenario:
      "Büyüme ekibi her haftanın gelirini önceki haftayla karşılaştırarak artış ve düşüş yüzdesini izlemek istiyor.",
    objective:
      "weekly_revenue verisini week_start sırasına koy. LAG ile previous_revenue üret; (revenue - previous) * 100 / previous hesabını iki ondalığa yuvarlayıp revenue_change_pct adıyla getir. İlk haftada iki türetilmiş kolon NULL kalmalı.",
    difficulty: "advanced",
    estimatedMinutes: 15,
    prerequisites: ["m7-t2"],
    concepts: ["LAG", "ORDER_BY", "ARITHMETIC", "ALIAS"],
    setupSql: `
      CREATE TABLE weekly_revenue (
        week_start DATE PRIMARY KEY,
        revenue NUMERIC(10, 2) NOT NULL
      );
      INSERT INTO weekly_revenue VALUES
        (DATE '2026-01-05', 1000.00),
        (DATE '2026-01-12', 1250.00),
        (DATE '2026-01-19', 1000.00),
        (DATE '2026-01-26', 1500.00);
    `,
    schema: {
      tables: [
        {
          name: "weekly_revenue",
          description: "Hafta başlangıcı bazında toplam gelir serisi.",
          columns: [
            {
              name: "week_start",
              dataType: "DATE",
              nullable: false,
              primaryKey: true,
            },
            { name: "revenue", dataType: "NUMERIC(10,2)", nullable: false },
          ],
        },
      ],
    },
    sampleRows: [
      {
        tableName: "weekly_revenue",
        rows: [
          { week_start: "2026-01-05", revenue: 1000 },
          { week_start: "2026-01-12", revenue: 1250 },
          { week_start: "2026-01-19", revenue: 1000 },
        ],
      },
    ],
    expectedColumns: [
      "week_start",
      "revenue",
      "previous_revenue",
      "revenue_change_pct",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["2026-01-05", 1000, null, null],
      ["2026-01-12", 1250, 1000, 25],
      ["2026-01-19", 1000, 1250, -20],
      ["2026-01-26", 1500, 1000, 50],
    ],
    orderSensitive: true,
    requiredConcepts: ["LAG", "ARITHMETIC", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    validationOptions: { numericTolerance: 0.01 },
    hints: [
      "LAG(revenue) aynı sıralamadaki bir önceki satırın gelirini getirir.",
      "Önceki geliri hem gösterim hem yüzde hesabında kullan; sıfıra bölünmeyi NULLIF ile koruyabilirsin.",
      "Önce previous_revenue değerini üret; yüzde değişimini ayrı adımda hesaplayıp sıfıra bölmeyi NULLIF ile güvenli kıl.",
    ],
    explanation:
      "LAG satırları birleştirmeden önceki dönem değerini mevcut satıra taşır. Böylece zaman serisindeki mutlak farkı ve oransal değişimi aynı çıktı tanesinde hesaplayabilirsin.",
    completionMessage:
      "Haftalık değişim serisi hazır. Önceki dönem karşılaştırmasını pencere fonksiyonuyla kurdun.",
    nextTaskId: "m7-t4",
  }),
  createTask({
    id: "m7-t4",
    slug: "seven-day-demand-signal",
    moduleId: "module-7",
    title: "Yedi günlük talep sinyali üret",
    subtitle: "Açık window frame ile hareketli ortalama hesapla.",
    scenario:
      "Tedarik planlama ekibi günlük dalgalanmayı yumuşatmak için her günün kendisi ve önceki altı günü kapsayan talep ortalamasını izleyecek.",
    objective:
      "daily_demand verisini demand_date sırasına koy. AVG(units) için ROWS BETWEEN 6 PRECEDING AND CURRENT ROW çerçevesini kullan; sonucu iki ondalığa yuvarlayıp moving_avg_7d adıyla getir.",
    difficulty: "advanced",
    estimatedMinutes: 15,
    prerequisites: ["m7-t3"],
    concepts: ["AVG", "MOVING_AVERAGE", "ORDER_BY", "ALIAS"],
    setupSql: `
      CREATE TABLE daily_demand (
        demand_date DATE PRIMARY KEY,
        units INTEGER NOT NULL
      );
      INSERT INTO daily_demand VALUES
        (DATE '2026-05-01', 10),
        (DATE '2026-05-02', 14),
        (DATE '2026-05-03', 12),
        (DATE '2026-05-04', 18),
        (DATE '2026-05-05', 16),
        (DATE '2026-05-06', 20),
        (DATE '2026-05-07', 15),
        (DATE '2026-05-08', 22);
    `,
    schema: {
      tables: [
        {
          name: "daily_demand",
          description: "Günlük sevkiyat talep adetleri.",
          columns: [
            {
              name: "demand_date",
              dataType: "DATE",
              nullable: false,
              primaryKey: true,
            },
            { name: "units", dataType: "INTEGER", nullable: false },
          ],
        },
      ],
    },
    sampleRows: [
      {
        tableName: "daily_demand",
        rows: [
          { demand_date: "2026-05-01", units: 10 },
          { demand_date: "2026-05-02", units: 14 },
          { demand_date: "2026-05-03", units: 12 },
        ],
      },
    ],
    expectedColumns: ["demand_date", "units", "moving_avg_7d"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["2026-05-01", 10, 10],
      ["2026-05-02", 14, 12],
      ["2026-05-03", 12, 12],
      ["2026-05-04", 18, 13.5],
      ["2026-05-05", 16, 14],
      ["2026-05-06", 20, 15],
      ["2026-05-07", 15, 15],
      ["2026-05-08", 22, 16.71],
    ],
    orderSensitive: true,
    requiredConcepts: ["AVG", "MOVING_AVERAGE", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    validationOptions: { numericTolerance: 0.01 },
    hints: [
      "Window AVG satırları azaltmaz; her gün için ayrı bir pencere hesabı üretir.",
      "Pencereyi demand_date ile sırala ve satır bazlı sınırı ROWS anahtar kelimesiyle açıkça yaz.",
      "AVG penceresini tarih sırasına bağla; çerçeveyi mevcut satır ve ondan önceki altı satırla açıkça sınırla.",
    ],
    explanation:
      "Hareketli ortalama güncel satırı ve belirli sayıdaki önceki satırı değerlendirerek kısa vadeli oynaklığı yumuşatır. Açık ROWS frame pencerenin sınırlarını belirsiz varsayımlardan kurtarır.",
    completionMessage:
      "Talep sinyali hazır. Window frame ile kayan yedi günlük metriği ürettin.",
    nextTaskId: "m7-t1",
  }),
];

const analyticsTask = createTask({
  id: "m7-t1",
  slug: "account-running-balance",
  moduleId: "module-7",
  title: "Hareketli hesap bakiyesini üret",
  subtitle:
    "Her işlem sonrasındaki kümülatif bakiyeyi pencere fonksiyonuyla izle.",
  scenario:
    "Finans ekibi, her hesap için işlemlerin ardından oluşan bakiyeyi işlem sırasını bozmadan görmek istiyor.",
  objective:
    "Her account_no içinde transaction_date ve transaction_id sırasıyla amount toplamını biriktirip running_balance adıyla getir. Çıktı transaction_id, account_no, amount, running_balance kolonlarını account_no, transaction_date, transaction_id sırasıyla içersin.",
  difficulty: "advanced",
  estimatedMinutes: 20,
  prerequisites: ["m7-t4"],
  concepts: ["SUM", "PARTITION_BY", "RUNNING_TOTAL", "ORDER_BY"],
  setupSql: `
    CREATE TABLE account_transactions (
      transaction_id INTEGER PRIMARY KEY,
      account_no TEXT NOT NULL,
      transaction_date DATE NOT NULL,
      amount NUMERIC(10, 2) NOT NULL
    );
    INSERT INTO account_transactions VALUES
      (701, 'A-100', DATE '2026-04-01', 100.00),
      (702, 'A-100', DATE '2026-04-02', -30.00),
      (703, 'A-100', DATE '2026-04-04', 50.00),
      (704, 'B-200', DATE '2026-04-01', 200.00),
      (705, 'B-200', DATE '2026-04-03', -80.00);
  `,
  schema: {
    tables: [
      {
        name: "account_transactions",
        description: "Hesap bazlı finansal giriş ve çıkış hareketleri.",
        columns: [
          {
            name: "transaction_id",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          { name: "account_no", dataType: "TEXT", nullable: false },
          { name: "transaction_date", dataType: "DATE", nullable: false },
          { name: "amount", dataType: "NUMERIC(10,2)", nullable: false },
        ],
      },
    ],
  },
  sampleRows: [
    {
      tableName: "account_transactions",
      rows: [
        {
          transaction_id: 701,
          account_no: "A-100",
          transaction_date: "2026-04-01",
          amount: 100,
        },
        {
          transaction_id: 702,
          account_no: "A-100",
          transaction_date: "2026-04-02",
          amount: -30,
        },
        {
          transaction_id: 704,
          account_no: "B-200",
          transaction_date: "2026-04-01",
          amount: 200,
        },
      ],
    },
  ],
  expectedColumns: [
    "transaction_id",
    "account_no",
    "amount",
    "running_balance",
  ],
  validationMode: "result-and-concepts",
  expectedResult: [
    [701, "A-100", 100, 100],
    [702, "A-100", -30, 70],
    [703, "A-100", 50, 120],
    [704, "B-200", 200, 200],
    [705, "B-200", -80, 120],
  ],
  orderSensitive: true,
  requiredConcepts: ["SUM", "PARTITION_BY", "RUNNING_TOTAL", "ORDER_BY"],
  forbiddenOperations: [...READ_ONLY_FORBIDDEN],
  hints: [
    "Normal GROUP BY satırları azaltır; burada satırları koruyan bir window function gerekir.",
    "SUM(amount) OVER (...) içinde hesabı PARTITION BY ile, işlem akışını ORDER BY ile tanımla.",
    "OVER (PARTITION BY account_no ORDER BY transaction_date, transaction_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) çerçevesini kullan.",
  ],
  explanation:
    "Window SUM satır ayrıntısını korurken bölüm içindeki önceki değerleri biriktirir. Açık ROWS çerçevesi aynı tarihli işlemlerde de deterministik sonuç sağlar.",
  completionMessage:
    "Hesap hareketleri artık adım adım bakiye gösteriyor. Analitik pencereyi başarıyla kullandın.",
  nextTaskId: "m8-t1",
});

const mutationTask = createTask({
  id: "m8-t1",
  slug: "reserve-inventory",
  moduleId: "module-8",
  title: "Sipariş için stok ayır",
  subtitle: "Kontrollü bir UPDATE işlemini sonuçla doğrula.",
  scenario:
    "Depo sistemi, product_id 801 için onaylanan siparişe 3 adet stok ayırmalı ve kalan stoğu anında göstermeli.",
  objective:
    "inventory tablosunda product_id 801 satırının stock_quantity değerini 3 azalt. UPDATE ... RETURNING ile product_id ve güncel stock_quantity kolonlarını döndür.",
  difficulty: "intermediate",
  estimatedMinutes: 12,
  prerequisites: ["m7-t1"],
  concepts: ["UPDATE", "ARITHMETIC"],
  setupSql: `
    CREATE TABLE inventory (
      product_id INTEGER PRIMARY KEY,
      product_name TEXT NOT NULL,
      stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0)
    );
    INSERT INTO inventory VALUES
      (801, 'Wireless Scanner', 12),
      (802, 'Label Printer', 6);
  `,
  schema: {
    tables: [
      {
        name: "inventory",
        description: "Depodaki ürünlerin kullanılabilir stok miktarları.",
        columns: [
          {
            name: "product_id",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          { name: "product_name", dataType: "TEXT", nullable: false },
          { name: "stock_quantity", dataType: "INTEGER", nullable: false },
        ],
      },
    ],
  },
  sampleRows: [
    {
      tableName: "inventory",
      rows: [
        {
          product_id: 801,
          product_name: "Wireless Scanner",
          stock_quantity: 12,
        },
        { product_id: 802, product_name: "Label Printer", stock_quantity: 6 },
      ],
    },
  ],
  expectedColumns: ["product_id", "stock_quantity"],
  validationMode: "mutation",
  expectedResult: [[801, 9]],
  orderSensitive: false,
  requiredConcepts: ["UPDATE", "ARITHMETIC"],
  forbiddenOperations: [
    "DROP_DATABASE",
    "DROP_TABLE",
    "ALTER_TABLE",
    "CREATE_TABLE",
    "TRUNCATE",
    "INSERT",
    "DELETE",
    "SYSTEM_CATALOG_ACCESS",
    "MULTIPLE_STATEMENTS",
  ],
  mutationVerification: {
    sql: `
      SELECT product_id, stock_quantity
      FROM inventory
      ORDER BY product_id;
    `,
    expectedColumns: ["product_id", "stock_quantity"],
    expectedResult: [
      [801, 9],
      [802, 6],
    ],
    orderSensitive: true,
  },
  hints: [
    "Bir satırdaki değeri değiştirmek için UPDATE ve hedefi sınırlamak için WHERE kullan.",
    "Yeni değer mevcut stock_quantity değerinden 3 çıkarılarak hesaplanabilir.",
    "Değeri mevcut stoktan türet, hedefi ürün kimliğiyle sınırla ve değişen iki alanı RETURNING ile doğrula.",
  ],
  explanation:
    "UPDATE seçilen satırın değerini yerinde değiştirir. WHERE olmadan tüm tablo etkilenebileceği için hedef koşulu kritik önemdedir; RETURNING değişikliği aynı işlemde doğrular.",
  completionMessage:
    "Stok güvenle ayrıldı ve kalan miktar doğrulandı. İlk kontrollü veri değişikliğini yaptın.",
  nextTaskId: "m8-t2",
});

const modelingTask = createTask({
  id: "m9-t1",
  slug: "star-schema-revenue",
  moduleId: "module-9",
  title: "Yıldız şemadan aylık gelir üret",
  subtitle: "Fact ve dimension tablolarını analitik çıktıda buluştur.",
  scenario:
    "BI ekibi, ürün kategorisi ve ay boyutlarında gelir üreten ilk veri martı sorgusunu doğruluyor.",
  objective:
    "fact_sales tablosunu dim_product ve dim_date ile birleştir. month_label ve category bazında quantity * unit_price toplamını revenue adıyla getir; ay ve kategoriye göre artan sırala.",
  difficulty: "advanced",
  estimatedMinutes: 20,
  prerequisites: ["m8-t4"],
  concepts: [
    "STAR_SCHEMA",
    "INNER_JOIN",
    "MULTI_JOIN",
    "GROUP_BY",
    "SUM",
    "ORDER_BY",
  ],
  setupSql: `
    CREATE TABLE dim_product (
      product_key INTEGER PRIMARY KEY,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL
    );
    CREATE TABLE dim_date (
      date_key INTEGER PRIMARY KEY,
      month_label TEXT NOT NULL
    );
    CREATE TABLE fact_sales (
      sale_key INTEGER PRIMARY KEY,
      product_key INTEGER NOT NULL REFERENCES dim_product(product_key),
      date_key INTEGER NOT NULL REFERENCES dim_date(date_key),
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(10, 2) NOT NULL
    );
    INSERT INTO dim_product VALUES
      (10, 'Office Chair', 'Furniture'),
      (11, 'Monitor', 'Technology');
    INSERT INTO dim_date VALUES
      (1, '2026-01'),
      (2, '2026-02');
    INSERT INTO fact_sales VALUES
      (901, 10, 1, 2, 100.00),
      (902, 11, 1, 1, 300.00),
      (903, 10, 2, 3, 100.00),
      (904, 11, 2, 2, 300.00);
  `,
  schema: {
    tables: [
      {
        name: "dim_product",
        description: "Ürün niteliklerini tutan boyut tablosu.",
        columns: [
          {
            name: "product_key",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          { name: "product_name", dataType: "TEXT", nullable: false },
          { name: "category", dataType: "TEXT", nullable: false },
        ],
      },
      {
        name: "dim_date",
        description: "Raporlama dönemlerini tutan tarih boyutu.",
        columns: [
          {
            name: "date_key",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          { name: "month_label", dataType: "TEXT", nullable: false },
        ],
      },
      {
        name: "fact_sales",
        description: "Boyut anahtarları ve ölçüleri içeren satış fact tablosu.",
        columns: [
          {
            name: "sale_key",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          {
            name: "product_key",
            dataType: "INTEGER",
            nullable: false,
            references: { table: "dim_product", column: "product_key" },
          },
          {
            name: "date_key",
            dataType: "INTEGER",
            nullable: false,
            references: { table: "dim_date", column: "date_key" },
          },
          { name: "quantity", dataType: "INTEGER", nullable: false },
          { name: "unit_price", dataType: "NUMERIC(10,2)", nullable: false },
        ],
      },
    ],
    relationships: [
      {
        fromTable: "fact_sales",
        fromColumn: "product_key",
        toTable: "dim_product",
        toColumn: "product_key",
      },
      {
        fromTable: "fact_sales",
        fromColumn: "date_key",
        toTable: "dim_date",
        toColumn: "date_key",
      },
    ],
  },
  sampleRows: [
    {
      tableName: "dim_product",
      rows: [
        {
          product_key: 10,
          product_name: "Office Chair",
          category: "Furniture",
        },
        { product_key: 11, product_name: "Monitor", category: "Technology" },
      ],
    },
    {
      tableName: "fact_sales",
      rows: [
        {
          sale_key: 901,
          product_key: 10,
          date_key: 1,
          quantity: 2,
          unit_price: 100,
        },
        {
          sale_key: 902,
          product_key: 11,
          date_key: 1,
          quantity: 1,
          unit_price: 300,
        },
      ],
    },
  ],
  expectedColumns: ["month_label", "category", "revenue"],
  validationMode: "result-and-concepts",
  expectedResult: [
    ["2026-01", "Furniture", 200],
    ["2026-01", "Technology", 300],
    ["2026-02", "Furniture", 300],
    ["2026-02", "Technology", 600],
  ],
  orderSensitive: true,
  requiredConcepts: [
    "STAR_SCHEMA",
    "MULTI_JOIN",
    "GROUP_BY",
    "SUM",
    "ORDER_BY",
  ],
  forbiddenOperations: [...READ_ONLY_FORBIDDEN],
  hints: [
    "Fact tablo ölçüleri, dimension tabloları ise rapor etiketlerini sağlar.",
    "fact_sales içindeki product_key ve date_key değerlerini ilgili boyut anahtarlarına JOIN et.",
    "month_label ve category ile gruplayıp SUM(f.quantity * f.unit_price) AS revenue üret.",
  ],
  explanation:
    "Yıldız şemada fact tablo sayısal olayları, dimension tabloları analiz bağlamını taşır. Boyutları fact anahtarları üzerinden birleştirmek tekrar kullanılabilir rapor kırılımları sağlar.",
  completionMessage:
    "İlk veri martı çıktın hazır. Fact ve dimension rollerini çalışan bir raporda birleştirdin.",
  nextTaskId: "m9-t2",
});

const capstoneTask = createTask({
  id: "m10-t1",
  slug: "branch-target-performance",
  moduleId: "module-10",
  title: "Şube hedef gerçekleşme raporu",
  subtitle: "Yönetici kararına hazır çok tablolu veri seti üret.",
  scenario:
    "Genel müdür, Mayıs hedefi ile gerçekleşen satışları şube bazında karşılaştıran ve hedef durumunu açıkça etiketleyen tek bir rapor bekliyor.",
  objective:
    "branches, monthly_targets ve branch_sales tablolarını kullan. 2026-05 dönemi için her şubenin branch_name, target_amount, actual_amount, yüzde achievement_rate ve target_status kolonlarını getir. Satışı olmayan şubede actual_amount ve oran 0 olsun; actual hedefe ulaştıysa Hedefte, aksi halde Geride yaz. Orana göre azalan sırala.",
  difficulty: "advanced",
  estimatedMinutes: 25,
  prerequisites: ["m9-t4"],
  concepts: [
    "REPORTING",
    "LEFT_JOIN",
    "MULTI_JOIN",
    "SUM",
    "GROUP_BY",
    "CASE",
    "ARITHMETIC",
    "ORDER_BY",
  ],
  setupSql: `
    CREATE TABLE branches (
      branch_id INTEGER PRIMARY KEY,
      branch_name TEXT NOT NULL
    );
    CREATE TABLE monthly_targets (
      branch_id INTEGER NOT NULL REFERENCES branches(branch_id),
      target_month TEXT NOT NULL,
      target_amount NUMERIC(12, 2) NOT NULL,
      PRIMARY KEY (branch_id, target_month)
    );
    CREATE TABLE branch_sales (
      sale_id INTEGER PRIMARY KEY,
      branch_id INTEGER NOT NULL REFERENCES branches(branch_id),
      sale_month TEXT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL
    );
    INSERT INTO branches VALUES
      (1, 'Istanbul Hub'),
      (2, 'Ankara Hub'),
      (3, 'Izmir Hub');
    INSERT INTO monthly_targets VALUES
      (1, '2026-05', 10000.00),
      (2, '2026-05', 8000.00),
      (3, '2026-05', 6000.00);
    INSERT INTO branch_sales VALUES
      (1001, 1, '2026-05', 4000.00),
      (1002, 1, '2026-05', 5500.00),
      (1003, 2, '2026-05', 8200.00),
      (1004, 3, '2026-04', 5000.00);
  `,
  schema: {
    tables: [
      {
        name: "branches",
        description: "Şube ana verisi.",
        columns: [
          {
            name: "branch_id",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          { name: "branch_name", dataType: "TEXT", nullable: false },
        ],
      },
      {
        name: "monthly_targets",
        description: "Şube ve ay bazında satış hedefleri.",
        columns: [
          {
            name: "branch_id",
            dataType: "INTEGER",
            nullable: false,
            references: { table: "branches", column: "branch_id" },
          },
          { name: "target_month", dataType: "TEXT", nullable: false },
          { name: "target_amount", dataType: "NUMERIC(12,2)", nullable: false },
        ],
      },
      {
        name: "branch_sales",
        description: "Şubelerin ay içindeki satış hareketleri.",
        columns: [
          {
            name: "sale_id",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          {
            name: "branch_id",
            dataType: "INTEGER",
            nullable: false,
            references: { table: "branches", column: "branch_id" },
          },
          { name: "sale_month", dataType: "TEXT", nullable: false },
          { name: "amount", dataType: "NUMERIC(12,2)", nullable: false },
        ],
      },
    ],
    relationships: [
      {
        fromTable: "monthly_targets",
        fromColumn: "branch_id",
        toTable: "branches",
        toColumn: "branch_id",
      },
      {
        fromTable: "branch_sales",
        fromColumn: "branch_id",
        toTable: "branches",
        toColumn: "branch_id",
      },
    ],
  },
  sampleRows: [
    {
      tableName: "monthly_targets",
      rows: [
        { branch_id: 1, target_month: "2026-05", target_amount: 10000 },
        { branch_id: 2, target_month: "2026-05", target_amount: 8000 },
      ],
    },
    {
      tableName: "branch_sales",
      rows: [
        { sale_id: 1001, branch_id: 1, sale_month: "2026-05", amount: 4000 },
        { sale_id: 1003, branch_id: 2, sale_month: "2026-05", amount: 8200 },
      ],
    },
  ],
  expectedColumns: [
    "branch_name",
    "target_amount",
    "actual_amount",
    "achievement_rate",
    "target_status",
  ],
  validationMode: "result-and-concepts",
  expectedResult: [
    ["Ankara Hub", 8000, 8200, 102.5, "Hedefte"],
    ["Istanbul Hub", 10000, 9500, 95, "Geride"],
    ["Izmir Hub", 6000, 0, 0, "Geride"],
  ],
  orderSensitive: true,
  requiredConcepts: [
    "REPORTING",
    "LEFT_JOIN",
    "SUM",
    "GROUP_BY",
    "CASE",
    "ORDER_BY",
  ],
  forbiddenOperations: [...READ_ONLY_FORBIDDEN],
  validationOptions: { numericTolerance: 0.01 },
  hints: [
    "Önce Mayıs hedeflerini şubelerle birleştir; satışları LEFT JOIN ile ekleyerek boş şubeleri koru.",
    "COALESCE(SUM(s.amount), 0) gerçekleşeni; bu değerin hedefe oranı yüzdeyi verir.",
    "CASE ile toplam satış >= target_amount durumunu etiketle, ROUND ile oranı iki ondalığa yuvarla ve alias üzerinden azalan sırala.",
  ],
  explanation:
    "Bu sorgu ana veri, hedef ve işlem tablolarını aynı yönetici çıktısında birleştirir. LEFT JOIN kapsamı korur; aggregation gerçekleşeni, CASE ise metriği karar etiketine dönüştürür.",
  completionMessage:
    "Yönetici raporu yayına hazır. SQL yapı taşlarını uçtan uca bir iş kararına dönüştürdün.",
  nextTaskId: "m10-t2",
});

const authoredCurriculum: CurriculumModule[] = [
  defineModule({
    id: "module-1",
    slug: "data-first-contact",
    order: 1,
    title: "Veriyle ilk temas",
    subtitle: "Bir tablodan doğru veriyi seç, sırala ve sınırla.",
    description:
      "Ürün kataloğu üzerinden tablo, satır ve kolon mantığını; SELECT, DISTINCT, ORDER BY ve LIMIT yapılarını öğren.",
    difficulty: "beginner",
    estimatedMinutes: 25,
    topics: [
      "Tablo, satır ve kolon",
      "SELECT",
      "Belirli kolon seçimi",
      "DISTINCT",
      "LIMIT",
      "ORDER BY",
    ],
    prerequisites: [],
    tasks: firstContactTasks,
  }),
  defineModule({
    id: "module-2",
    slug: "filtering-data",
    order: 2,
    title: "Veriyi filtreleme",
    subtitle: "İş koşullarını doğru ve okunaklı filtrelere çevir.",
    description:
      "E-ticaret siparişlerinde eşik, küme, tarih aralığı, metin deseni ve eksik değer kontrolleri uygula.",
    difficulty: "beginner",
    topics: [
      "WHERE",
      "Karşılaştırma operatörleri",
      "AND, OR ve NOT",
      "IN",
      "BETWEEN",
      "LIKE",
      "NULL",
    ],
    prerequisites: ["module-1"],
    estimatedMinutes: 71,
    tasks: [...filteringTasks, ...filteringBridgeDrills],
  }),
  defineModule({
    id: "module-3",
    slug: "calculation-transformation",
    order: 3,
    title: "Hesaplama ve dönüşüm",
    subtitle: "Ham kolonlardan raporlanabilir metrik ve etiketler üret.",
    description:
      "Satış hareketleri üzerinde alias, matematik, metin ve tarih fonksiyonları, CASE ve CAST kullan.",
    difficulty: "beginner",
    estimatedMinutes: 63,
    topics: [
      "Alias",
      "Matematiksel ifadeler",
      "String işlemleri",
      "Tarih işlemleri",
      "CASE WHEN",
      "Veri tipi dönüşümü",
    ],
    prerequisites: ["module-2"],
    tasks: [...transformationTasks, ...transformationBridgeDrills],
  }),
  defineModule({
    id: "module-4",
    slug: "aggregation",
    order: 4,
    title: "Özetleme",
    subtitle: "İşlem satırlarını karar metriklerine indirgeme.",
    description:
      "COUNT, SUM, AVG, MIN ve MAX fonksiyonlarını GROUP BY, HAVING ve koşullu aggregation ile kullan.",
    difficulty: "intermediate",
    estimatedMinutes: 76,
    topics: [
      "COUNT, SUM ve AVG",
      "MIN ve MAX",
      "GROUP BY",
      "HAVING",
      "Koşullu aggregation",
    ],
    prerequisites: ["module-3"],
    // routeOrder keeps the original IDs stable while placing narrow practice
    // before the heavier aggregate cases.
    tasks: [
      ...aggregationBridgeDrills,
      ...aggregationTasks,
      ...regionalSummaryBridgeDrills,
      summaryTask,
    ],
  }),
  defineModule({
    id: "module-5",
    slug: "joining-tables",
    order: 5,
    title: "Tabloları birleştirme",
    subtitle: "Dağınık iş verilerini ilişkiler üzerinden bir araya getir.",
    description:
      "Primary ve foreign key ilişkilerinden başlayarak INNER JOIN, LEFT JOIN, çoklu ve self JOIN yapılarını öğren.",
    difficulty: "intermediate",
    estimatedMinutes: 82,
    topics: [
      "Primary key ve foreign key",
      "INNER JOIN",
      "LEFT JOIN",
      "Çoklu JOIN",
      "Self JOIN",
      "Birden fazla anahtar üzerinden JOIN",
    ],
    prerequisites: ["module-4"],
    tasks: [...joinBridgeDrills, ...joinFoundationTasks, joinTask],
  }),
  defineModule({
    id: "module-6",
    slug: "subqueries-cte",
    order: 6,
    title: "Alt sorgular ve CTE",
    subtitle: "Çok adımlı analizleri küçük ve okunaklı parçalara ayır.",
    description:
      "Scalar ve ilişkili alt sorguları, IN ve EXISTS kontrollerini, CTE ve recursive CTE yapılarını keşfet.",
    difficulty: "intermediate",
    estimatedMinutes: 64,
    topics: [
      "Scalar subquery",
      "IN subquery",
      "EXISTS",
      "Correlated subquery",
      "CTE",
      "Recursive CTE",
    ],
    prerequisites: ["module-5"],
    tasks: [...subqueryFoundationTasks, cteTask],
  }),
  defineModule({
    id: "module-7",
    slug: "analytical-sql",
    order: 7,
    title: "Analitik SQL",
    subtitle: "Satır ayrıntısını korurken sıralı ve hareketli metrikler üret.",
    description:
      "Window function ailesiyle kategori sıralaması, önceki dönem karşılaştırması, running total ve hareketli ortalama üret.",
    difficulty: "advanced",
    estimatedMinutes: 66,
    topics: [
      "ROW_NUMBER, RANK ve DENSE_RANK",
      "LAG ile önceki dönem",
      "PARTITION BY",
      "Running total",
      "Moving average",
      "Açık window frame",
      "Eşitlik ve deterministik sıra",
    ],
    prerequisites: ["module-6"],
    tasks: [...analyticsFoundationTasks, analyticsTask],
  }),
  defineModule({
    id: "module-8",
    slug: "data-manipulation",
    order: 8,
    title: "Kontrollü veri güncelleme",
    subtitle: "Veri değişikliğini hedefle, uygula ve gerçek durumla kanıtla.",
    description:
      "UPDATE, INSERT, DELETE ve UPSERT işlemlerini dar hedef, constraint, RETURNING ve gizli post-state kontrolleriyle güvenle uygula.",
    difficulty: "intermediate",
    estimatedMinutes: 54,
    topics: [
      "UPDATE",
      "WHERE ile güvenli hedefleme",
      "Göreli değer güncelleme",
      "RETURNING",
      "Constraint geri bildirimi",
      "INSERT ve DELETE",
      "Idempotent UPSERT",
    ],
    prerequisites: ["module-7"],
    tasks: [mutationTask, ...module8ExpansionTasks],
  }),
  defineModule({
    id: "module-9",
    slug: "data-modeling",
    order: 9,
    title: "Analitik veri modelleme",
    subtitle: "Fact, dimension, tarihçe ve veri kalitesini aynı modelde yönet.",
    description:
      "Yıldız şema raporu, SCD Type 2 güncelliği, yetim fact denetimi ve sıfır kombinasyonları koruyan yoğun veri martı üret.",
    difficulty: "advanced",
    estimatedMinutes: 72,
    topics: [
      "Fact ve dimension rolleri",
      "Star schema",
      "Boyut anahtarları",
      "Rapor tanesi",
      "Analitik JOIN",
      "SCD Type 2",
      "Yetim anahtar denetimi",
      "Kapsama omurgası ve sıfır olay",
    ],
    prerequisites: ["module-8"],
    tasks: [modelingTask, ...module9ExpansionTasks],
  }),
  defineModule({
    id: "module-10",
    slug: "business-analyst-projects",
    order: 10,
    title: "Veri analisti karar projeleri",
    subtitle: "Çok kaynaklı veriyi açıklanabilir aksiyon setlerine dönüştür.",
    description:
      "Hedef gerçekleşme, müşteri kayıp riski, kampanya kârlılığı ve operasyon erken uyarısını cardinality güvenli, çok adımlı SQL teslimlerine dönüştür.",
    difficulty: "advanced",
    estimatedMinutes: 121,
    topics: [
      "Satış hedef gerçekleşme analizi",
      "Kapsam koruyan JOIN",
      "Sıfır aktiviteli varlıklar",
      "Oran ve koşullu karar etiketi",
      "Yönetici raporu veri seti",
      "Müşteri risk kuyruğu",
      "Kampanya kârlılığı ve fanout",
      "Window tabanlı erken uyarı",
    ],
    prerequisites: ["module-9"],
    tasks: [capstoneTask, ...module10ExpansionTasks],
  }),
  marketingProjectModule,
];

/**
 * Route order is a learning-flow concern, not an ID convention. Legacy cases
 * retain their original ordinal positions; short bridge drills occupy explicit
 * fractional positions between them. Consumers always use this normalized
 * order for navigation, resume and counters.
 */
function normalizeCurriculumRoute(
  authoredModules: readonly CurriculumModule[],
): CurriculumModule[] {
  let nextLegacyOrder = 1;
  const legacyRouteOrder = new Map<string, number>();

  for (const curriculumModule of authoredModules) {
    for (const task of curriculumModule.tasks) {
      if (task.type !== "case") continue;
      legacyRouteOrder.set(task.id, nextLegacyOrder);
      nextLegacyOrder += 1;
    }
  }

  return authoredModules.map((curriculumModule) => ({
    ...curriculumModule,
    tasks: curriculumModule.tasks
      .map((task) => ({
        ...task,
        routeOrder:
          task.routeOrder > 0
            ? task.routeOrder
            : (legacyRouteOrder.get(task.id) ?? task.routeOrder),
      }))
      .toSorted((left, right) => left.routeOrder - right.routeOrder),
  }));
}

export const curriculum: CurriculumModule[] =
  normalizeCurriculumRoute(authoredCurriculum);

/** Flat views keep navigation, lookup and progress calculations inexpensive. */
export const modules = curriculum;
export const tasks: LessonTask[] = curriculum
  .flatMap((module) => module.tasks)
  .toSorted((left, right) => left.routeOrder - right.routeOrder);

export const moduleById: ReadonlyMap<string, CurriculumModule> = new Map(
  modules.map((module) => [module.id, module]),
);

export const taskById: ReadonlyMap<string, LessonTask> = new Map(
  tasks.map((task) => [task.id, task]),
);

export const getModuleById = (moduleId: string): CurriculumModule | undefined =>
  moduleById.get(moduleId);

export const getTaskById = (taskId: string): LessonTask | undefined =>
  taskById.get(taskId);

export const getTaskBySlug = (slug: string): LessonTask | undefined =>
  tasks.find((task) => task.slug === slug);

/**
 * Fails fast when authored content breaks navigation or result validation.
 * It intentionally runs on import so the same checks protect development,
 * production builds and tests without requiring a separate content pipeline.
 */
export const assertCurriculumIsValid = (
  authoredModules: readonly CurriculumModule[],
): void => {
  if (authoredModules.length !== 11) {
    throw new Error(
      `Müfredat tam olarak 11 modül içermeli; bulunan: ${authoredModules.length}.`,
    );
  }

  const finalModule = authoredModules.at(-1);
  if (
    finalModule?.id !== "module-11" ||
    finalModule.contentKind !== "projects" ||
    finalModule.tasks.length !== 12
  ) {
    throw new Error(
      "Son modül, tam 12 çalışmadan oluşan pazarlama proje stüdyosu olmalı.",
    );
  }

  const moduleIds = new Set<string>();
  const moduleSlugs = new Set<string>();
  const taskIds = new Set<string>();
  const taskSlugs = new Set<string>();
  const taskRouteOrders = new Set<number>();
  const authoredTasks = authoredModules.flatMap((module) => module.tasks);

  for (const [moduleIndex, curriculumModule] of authoredModules.entries()) {
    if (
      moduleIds.has(curriculumModule.id) ||
      moduleSlugs.has(curriculumModule.slug)
    ) {
      throw new Error(
        `Tekrarlanan modül kimliği veya slug: ${curriculumModule.id}.`,
      );
    }
    if (curriculumModule.order !== moduleIndex + 1) {
      throw new Error(
        `${curriculumModule.id} için modül sırası kesintisiz değil.`,
      );
    }
    if (curriculumModule.tasks.length === 0) {
      throw new Error(`${curriculumModule.id} en az bir görev içermeli.`);
    }
    if (
      curriculumModule.estimatedMinutes <= 0 ||
      curriculumModule.topics.length === 0
    ) {
      throw new Error(`${curriculumModule.id} süre ve konu bilgisi içermeli.`);
    }
    const calculatedMinutes = curriculumModule.tasks.reduce(
      (total, task) => total + task.estimatedMinutes,
      0,
    );
    if (curriculumModule.estimatedMinutes !== calculatedMinutes) {
      throw new Error(
        `${curriculumModule.id} süre bilgisi görev süreleriyle uyuşmuyor.`,
      );
    }
    moduleIds.add(curriculumModule.id);
    moduleSlugs.add(curriculumModule.slug);
  }

  for (const task of authoredTasks) {
    if (taskIds.has(task.id) || taskSlugs.has(task.slug)) {
      throw new Error(`Tekrarlanan görev kimliği veya slug: ${task.id}.`);
    }
    if (!moduleIds.has(task.moduleId)) {
      throw new Error(
        `${task.id}, var olmayan ${task.moduleId} modülüne bağlı.`,
      );
    }
    if (
      !task.setupSql.trim() ||
      !task.objective.trim() ||
      !task.solutionSql.trim()
    ) {
      throw new Error(
        `${task.id} çalıştırılabilir SQL kurulumu, hedef ve örnek çözüm içermeli.`,
      );
    }
    if (!Number.isFinite(task.routeOrder) || task.routeOrder <= 0) {
      throw new Error(`${task.id} geçerli bir routeOrder içermeli.`);
    }
    if (taskRouteOrders.has(task.routeOrder)) {
      throw new Error(`${task.id} routeOrder değeri benzersiz olmalı.`);
    }
    taskRouteOrders.add(task.routeOrder);
    if (task.estimatedMinutes <= 0) {
      throw new Error(`${task.id} pozitif süre içermeli.`);
    }
    if (task.type === "case") {
      if (!task.scored || task.hints.length !== 3) {
        throw new Error(
          `${task.id} vaka olarak puanlı ve üç aşamalı ipuçlu olmalı.`,
        );
      }
    } else {
      const isMix = task.type === "drill_mix";
      const hasValidDuration = isMix
        ? task.estimatedMinutes === 5
        : task.estimatedMinutes >= 2 && task.estimatedMinutes <= 3;
      const hasExpectedNewConcept =
        task.type === "drill_intro"
          ? Boolean(task.conceptNew)
          : task.conceptNew === undefined;
      if (
        task.scored ||
        task.hints.length !== 1 ||
        !hasValidDuration ||
        !hasExpectedNewConcept ||
        !task.conceptsReinforced?.length ||
        !task.drillConcept?.trim()
      ) {
        throw new Error(
          `${task.id} alıştırma alt tipi için puansız, tek ipuçlu ve kavram sözleşmesini karşılamalı.`,
        );
      }
    }
    if (
      task.expectedColumns.length === 0 ||
      task.expectedResult.some(
        (row) => row.length !== task.expectedColumns.length,
      )
    ) {
      throw new Error(
        `${task.id} beklenen kolon ve satır genişlikleri uyuşmuyor.`,
      );
    }
    if (
      task.requiredConcepts.some((concept) => !task.concepts.includes(concept))
    ) {
      throw new Error(
        `${task.id} zorunlu kavramları concepts içinde tanımlamalı.`,
      );
    }

    const schemaTableNames = new Set(
      task.schema.tables.map((table) => table.name),
    );
    if (schemaTableNames.size !== task.schema.tables.length) {
      throw new Error(`${task.id} şemasında tekrarlanan tablo adı var.`);
    }
    for (const sample of task.sampleRows) {
      if (!schemaTableNames.has(sample.tableName)) {
        throw new Error(
          `${task.id} örnek verisi şemada olmayan ${sample.tableName} tablosunu kullanıyor.`,
        );
      }
    }

    taskIds.add(task.id);
    taskSlugs.add(task.slug);
  }

  for (const task of authoredTasks) {
    if (task.nextTaskId !== null && !taskIds.has(task.nextTaskId)) {
      throw new Error(
        `${task.id} için nextTaskId bulunamadı: ${task.nextTaskId}.`,
      );
    }
    for (const prerequisite of task.prerequisites) {
      if (!taskIds.has(prerequisite)) {
        throw new Error(
          `${task.id} için prerequisite bulunamadı: ${prerequisite}.`,
        );
      }
    }
  }

  for (const curriculumModule of authoredModules) {
    for (const prerequisite of curriculumModule.prerequisites) {
      if (!moduleIds.has(prerequisite)) {
        throw new Error(
          `${curriculumModule.id} için modül prerequisite bulunamadı: ${prerequisite}.`,
        );
      }
    }
  }
};

assertCurriculumIsValid(curriculum);
assertValidTaskCollection(tasks);

export default curriculum;
