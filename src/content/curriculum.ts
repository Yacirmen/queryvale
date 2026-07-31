import {
  DEFAULT_VALIDATION_OPTIONS,
  defineModule,
  defineTask,
  type CurriculumModule,
  type ForbiddenOperation,
  type LessonTask,
  type TaskSampleData,
  type TaskSchema,
  type ValidationOptions,
} from "../types/lesson";

const READ_ONLY_FORBIDDEN: ForbiddenOperation[] = [
  "DROP_DATABASE",
  "DROP_TABLE",
  "ALTER_TABLE",
  "CREATE_TABLE",
  "TRUNCATE",
  "INSERT",
  "UPDATE",
  "DELETE",
  "SYSTEM_CATALOG_ACCESS",
  "MULTIPLE_STATEMENTS",
];

const createTask = (
  task: Omit<LessonTask, "validationOptions"> & {
    validationOptions?: Partial<ValidationOptions>;
  },
): LessonTask =>
  defineTask({
    ...task,
    validationOptions: {
      ...DEFAULT_VALIDATION_OPTIONS,
      ...task.validationOptions,
    },
  });

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
      description: "Satış kataloğundaki ürünlerin güncel stok ve fiyat bilgileri.",
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
    subtitle: "İlk SELECT sorgunla doğru kolonları getir.",
    scenario:
      "Ürün operasyon ekibi, haftalık katalog kontrolü için ürün adlarını ve kategorilerini içeren sade bir görünüm istedi.",
    objective:
      "products tablosundan product_name ve category kolonlarını bu sırayla getir.",
    difficulty: "beginner",
    estimatedMinutes: 5,
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
      "Bir tablodan veri okumak için SELECT kullanılır.",
      "İki kolon adını virgülle ayır; veri kaynağın products tablosu.",
      "Sorgu yapın SELECT product_name, category FROM ... şeklinde başlayabilir.",
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
    subtitle: "Tekrarlanan değerleri rapordan çıkar.",
    scenario:
      "Satın alma ekibi filtre menüsünü beslemek için her kategorinin yalnızca bir kez yer aldığı bir listeye ihtiyaç duyuyor.",
    objective: "products tablosundaki benzersiz category değerlerini getir.",
    difficulty: "beginner",
    estimatedMinutes: 6,
    prerequisites: ["m1-t1"],
    concepts: ["SELECT", "DISTINCT"],
    setupSql: productSetupSql,
    schema: productSchema,
    sampleRows: productSamples,
    expectedColumns: ["category"],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Home"],
      ["Stationery"],
      ["Furniture"],
      ["Lifestyle"],
    ],
    orderSensitive: false,
    requiredConcepts: ["DISTINCT"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Aynı değerin tekrarını engelleyen anahtar kelimeyi düşün.",
      "DISTINCT, SELECT ile seçilen kolonun hemen önünde kullanılır.",
      "SELECT DISTINCT category FROM products yapısını tamamla.",
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
      "Depo sorumlusu, günün ilk tedarik görüşmelerinde hangi ürünlere öncelik vereceğini belirlemek istiyor.",
    objective:
      "Ürünleri stock_quantity kolonuna göre küçükten büyüğe sırala; ilk 3 kaydın product_name ve stock_quantity kolonlarını getir.",
    difficulty: "beginner",
    estimatedMinutes: 8,
    prerequisites: ["m1-t2"],
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
      "Önce satırları stok miktarına göre sıralamalısın.",
      "ORDER BY stock_quantity ASC düşük değerleri üste taşır.",
      "Sıralamanın sonuna LIMIT 3 ekleyerek yalnızca ilk üç satırı döndür.",
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
      "Ticari ekip, premium ürünleri hızlıca görebileceği bir fiyat panosu hazırlıyor.",
    objective:
      "product_name ve unit_price kolonlarını unit_price azalan sırada getir.",
    difficulty: "beginner",
    estimatedMinutes: 6,
    prerequisites: ["m1-t3"],
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
      "Sonuç sırasını ORDER BY ile belirlersin.",
      "Azalan sıralama için kolon adından sonra DESC kullan.",
      "SELECT product_name, unit_price FROM products ORDER BY unit_price DESC yapısını kur.",
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
      description: "E-ticaret siparişlerinin tutar, konum ve teslimat durumları.",
      columns: [
        { name: "order_id", dataType: "INTEGER", nullable: false, primaryKey: true },
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
    prerequisites: ["m1-t4"],
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
      "FROM orders bölümünden sonra WHERE total_amount >= 500 koşulunu ekle.",
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
      "WHERE city IN ('Ankara', 'Istanbul') AND status = 'pending' yapısını dene.",
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
      "WHERE ordered_at BETWEEN DATE '2026-01-04' AND DATE '2026-01-07' sonrasında ORDER BY ordered_at kullan.",
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
    requiredConcepts: ["LIKE", "IS_NULL", "AND"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "NULL değerleri eşittir operatörüyle değil IS NULL ile kontrol edilir.",
      "Bir metnin herhangi bir yerini eşlemek için LIKE deseninin iki yanında % kullan.",
      "WHERE delivered_at IS NULL AND customer_name LIKE '%e%' koşuluna alfabetik ORDER BY ekle.",
    ],
    explanation:
      "NULL bilinmeyen değeri temsil ettiği için IS NULL ile test edilir. LIKE desenindeki % sıfır veya daha fazla karakteri eşler.",
    completionMessage:
      "Eksik teslimat listesi hazır. NULL ve metin desenlerini güvenle filtreleyebiliyorsun.",
    nextTaskId: "m3-t1",
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
        { name: "sale_id", dataType: "INTEGER", nullable: false, primaryKey: true },
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
    prerequisites: ["m2-t4"],
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
      "quantity * unit_price AS revenue ifadesini sale_id yanına ekle.",
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
      "UPPER(agent_first_name || ' ' || agent_last_name) AS agent_name ifadesini kullan.",
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
      "TO_CHAR(sale_date, 'YYYY-MM') AS sale_month ifadesini SELECT listesine ekle.",
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
      "CASE WHEN gelir >= 1000 THEN 'Yüksek' WHEN gelir >= 500 THEN 'Orta' ELSE 'Standart' END AS revenue_band yapısını kur.",
    ],
    explanation:
      "CAST veri tipini açıkça dönüştürür. CASE ise sıralı iş kurallarını tek bir türetilmiş kolona çevirir; yüksek eşiğin önce kontrol edilmesi bantların çakışmasını önler.",
    completionMessage:
      "Gelir bantları hazır. Hesaplama, dönüşüm ve iş kuralını tek sorguda birleştirdin.",
    nextTaskId: "m4-t1",
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
  prerequisites: ["m3-t4"],
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
  requiredConcepts: ["COUNT", "SUM", "GROUP_BY", "HAVING"],
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
  nextTaskId: "m5-t1",
});

const joinTask = createTask({
  id: "m5-t1",
  slug: "customer-order-coverage",
  moduleId: "module-5",
  title: "Sipariş vermeyen müşterileri de koru",
  subtitle: "Müşteri tabanını sipariş hareketleriyle güvenli biçimde birleştir.",
  scenario:
    "CRM ekibi, tamamlanmış siparişi olmasa bile her müşterinin raporda görünmesini ve toplam harcamasının sıfır olarak gösterilmesini istiyor.",
  objective:
    "customers ile orders tablolarını LEFT JOIN kullanarak birleştir. Her customer_name için completed sipariş toplamını total_spend adıyla getir; siparişi olmayanlarda 0 göster ve total_spend azalan sırada sırala.",
  difficulty: "intermediate",
  estimatedMinutes: 16,
  prerequisites: ["m4-t1"],
  concepts: ["PRIMARY_KEY", "FOREIGN_KEY", "LEFT_JOIN", "GROUP_BY", "SUM", "ORDER_BY"],
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
          { name: "order_id", dataType: "INTEGER", nullable: false, primaryKey: true },
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
  requiredConcepts: ["LEFT_JOIN", "GROUP_BY", "SUM"],
  forbiddenOperations: [...READ_ONLY_FORBIDDEN],
  hints: [
    "Ana listen customers olmalı; LEFT JOIN soldaki tüm müşterileri korur.",
    "completed koşulunu JOIN koşuluna eklemek, eşleşmeyen müşterilerin kaybolmasını önler.",
    "COALESCE(SUM(o.amount), 0) AS total_spend üretip müşteri adına göre grupla.",
  ],
  explanation:
    "LEFT JOIN soldaki müşteri kümesini korur. Sağ tablo filtresini ON içinde uygulamak, eşleşmeyen müşterileri WHERE ile istemeden elemeni engeller; COALESCE ise NULL toplamı sıfıra çevirir.",
  completionMessage:
    "CRM kapsamı korundu. Siparişsiz müşteriler de doğru sıfır değeriyle raporda.",
  nextTaskId: "m6-t1",
});

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
  prerequisites: ["m5-t1"],
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
          { name: "sale_id", dataType: "INTEGER", nullable: false, primaryKey: true },
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
  nextTaskId: "m7-t1",
});

const analyticsTask = createTask({
  id: "m7-t1",
  slug: "account-running-balance",
  moduleId: "module-7",
  title: "Hareketli hesap bakiyesini üret",
  subtitle: "Her işlem sonrasındaki kümülatif bakiyeyi pencere fonksiyonuyla izle.",
  scenario:
    "Finans ekibi, her hesap için işlemlerin ardından oluşan bakiyeyi işlem sırasını bozmadan görmek istiyor.",
  objective:
    "Her account_no içinde transaction_date ve transaction_id sırasıyla amount toplamını biriktirip running_balance adıyla getir. Çıktı transaction_id, account_no, amount, running_balance kolonlarını account_no, transaction_date, transaction_id sırasıyla içersin.",
  difficulty: "advanced",
  estimatedMinutes: 20,
  prerequisites: ["m6-t1"],
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
  expectedColumns: ["transaction_id", "account_no", "amount", "running_balance"],
  validationMode: "result-and-concepts",
  expectedResult: [
    [701, "A-100", 100, 100],
    [702, "A-100", -30, 70],
    [703, "A-100", 50, 120],
    [704, "B-200", 200, 200],
    [705, "B-200", -80, 120],
  ],
  orderSensitive: true,
  requiredConcepts: ["SUM", "PARTITION_BY", "RUNNING_TOTAL"],
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
  concepts: ["UPDATE", "TRANSACTION"],
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
  requiredConcepts: ["UPDATE"],
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
  hints: [
    "Bir satırdaki değeri değiştirmek için UPDATE ve hedefi sınırlamak için WHERE kullan.",
    "Yeni değer mevcut stock_quantity değerinden 3 çıkarılarak hesaplanabilir.",
    "UPDATE inventory SET stock_quantity = stock_quantity - 3 WHERE product_id = 801 RETURNING product_id, stock_quantity yapısını kur.",
  ],
  explanation:
    "UPDATE seçilen satırın değerini yerinde değiştirir. WHERE olmadan tüm tablo etkilenebileceği için hedef koşulu kritik önemdedir; RETURNING değişikliği aynı işlemde doğrular.",
  completionMessage:
    "Stok güvenle ayrıldı ve kalan miktar doğrulandı. İlk kontrollü veri değişikliğini yaptın.",
  nextTaskId: "m9-t1",
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
  prerequisites: ["m8-t1"],
  concepts: ["STAR_SCHEMA", "INNER_JOIN", "MULTI_JOIN", "GROUP_BY", "SUM"],
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
          { name: "date_key", dataType: "INTEGER", nullable: false, primaryKey: true },
          { name: "month_label", dataType: "TEXT", nullable: false },
        ],
      },
      {
        name: "fact_sales",
        description: "Boyut anahtarları ve ölçüleri içeren satış fact tablosu.",
        columns: [
          { name: "sale_key", dataType: "INTEGER", nullable: false, primaryKey: true },
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
        { product_key: 10, product_name: "Office Chair", category: "Furniture" },
        { product_key: 11, product_name: "Monitor", category: "Technology" },
      ],
    },
    {
      tableName: "fact_sales",
      rows: [
        { sale_key: 901, product_key: 10, date_key: 1, quantity: 2, unit_price: 100 },
        { sale_key: 902, product_key: 11, date_key: 1, quantity: 1, unit_price: 300 },
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
  requiredConcepts: ["STAR_SCHEMA", "MULTI_JOIN", "GROUP_BY", "SUM"],
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
  nextTaskId: "m10-t1",
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
  prerequisites: ["m9-t1"],
  concepts: [
    "REPORTING",
    "LEFT_JOIN",
    "MULTI_JOIN",
    "SUM",
    "GROUP_BY",
    "CASE",
    "ARITHMETIC",
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
          { name: "branch_id", dataType: "INTEGER", nullable: false, primaryKey: true },
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
          { name: "sale_id", dataType: "INTEGER", nullable: false, primaryKey: true },
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
  requiredConcepts: ["REPORTING", "LEFT_JOIN", "SUM", "GROUP_BY", "CASE"],
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
  nextTaskId: null,
});

export const curriculum: CurriculumModule[] = [
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
    estimatedMinutes: 35,
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
    tasks: filteringTasks,
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
    estimatedMinutes: 39,
    topics: [
      "Alias",
      "Matematiksel ifadeler",
      "String işlemleri",
      "Tarih işlemleri",
      "CASE WHEN",
      "Veri tipi dönüşümü",
    ],
    prerequisites: ["module-2"],
    tasks: transformationTasks,
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
    estimatedMinutes: 55,
    topics: [
      "COUNT, SUM ve AVG",
      "MIN ve MAX",
      "GROUP BY",
      "HAVING",
      "Koşullu aggregation",
    ],
    prerequisites: ["module-3"],
    tasks: [summaryTask],
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
    estimatedMinutes: 70,
    topics: [
      "Primary key ve foreign key",
      "INNER JOIN",
      "LEFT JOIN",
      "Çoklu JOIN",
      "Self JOIN",
      "Birden fazla anahtar üzerinden JOIN",
    ],
    prerequisites: ["module-4"],
    tasks: [joinTask],
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
    estimatedMinutes: 75,
    topics: [
      "Scalar subquery",
      "IN subquery",
      "EXISTS",
      "Correlated subquery",
      "CTE",
      "Recursive CTE",
    ],
    prerequisites: ["module-5"],
    tasks: [cteTask],
  }),
  defineModule({
    id: "module-7",
    slug: "analytical-sql",
    order: 7,
    title: "Analitik SQL",
    subtitle: "Satır ayrıntısını korurken sıralı ve hareketli metrikler üret.",
    description:
      "Window function ailesiyle sıralama, önceki/sonraki değer, running total, moving average ve cohort benzeri analizler yap.",
    difficulty: "advanced",
    estimatedMinutes: 95,
    topics: [
      "ROW_NUMBER, RANK ve DENSE_RANK",
      "LAG ve LEAD",
      "PARTITION BY",
      "Running total",
      "Moving average",
      "İlk ve son işlem",
      "Cohort benzeri analizler",
    ],
    prerequisites: ["module-6"],
    tasks: [analyticsTask],
  }),
  defineModule({
    id: "module-8",
    slug: "data-manipulation",
    order: 8,
    title: "Veri düzenleme",
    subtitle: "Veriyi kontrollü biçimde oluştur, ekle, güncelle ve sil.",
    description:
      "CREATE TABLE, INSERT, UPDATE ve DELETE işlemlerini constraint ve transaction güvenliğiyle uygula.",
    difficulty: "intermediate",
    estimatedMinutes: 65,
    topics: [
      "CREATE TABLE",
      "INSERT",
      "UPDATE",
      "DELETE",
      "Constraints",
      "Transaction mantığı",
    ],
    prerequisites: ["module-7"],
    tasks: [mutationTask],
  }),
  defineModule({
    id: "module-9",
    slug: "data-modeling",
    order: 9,
    title: "Veri modelleme",
    subtitle: "Analitik sorgular için sürdürülebilir veri yapıları tasarla.",
    description:
      "Normalizasyon, fact/dimension ayrımı, star schema ve veri martı yaklaşımını çalışan sorgularla bağla.",
    difficulty: "advanced",
    estimatedMinutes: 80,
    topics: [
      "Normalizasyon",
      "Fact ve dimension tabloları",
      "Star schema",
      "Veri martı",
      "Analitik veri modeli",
    ],
    prerequisites: ["module-8"],
    tasks: [modelingTask],
  }),
  defineModule({
    id: "module-10",
    slug: "business-analyst-projects",
    order: 10,
    title: "İş analistliği projeleri",
    subtitle: "SQL yapı taşlarını karar almaya hazır veri ürünlerine dönüştür.",
    description:
      "Şube performansı, hedef gerçekleşme, müşteri segmentasyonu, sigorta, e-ticaret, veri kalitesi ve BI hazırlığı senaryolarını uçtan uca çöz.",
    difficulty: "advanced",
    estimatedMinutes: 140,
    topics: [
      "Şube performans analizi",
      "Satış hedef gerçekleşme analizi",
      "Müşteri segmentasyonu",
      "Sigorta poliçe üretimi",
      "E-ticaret sipariş analizi",
      "Veri kalite kontrolü",
      "Power BI veri hazırlama",
      "Yönetici raporu veri seti",
    ],
    prerequisites: ["module-9"],
    tasks: [capstoneTask],
  }),
];

/** Flat views keep navigation, lookup and progress calculations inexpensive. */
export const modules = curriculum;
export const tasks: LessonTask[] = curriculum.flatMap((module) => module.tasks);

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
  if (authoredModules.length !== 10) {
    throw new Error(
      `Müfredat tam olarak 10 modül içermeli; bulunan: ${authoredModules.length}.`,
    );
  }

  const moduleIds = new Set<string>();
  const moduleSlugs = new Set<string>();
  const taskIds = new Set<string>();
  const taskSlugs = new Set<string>();
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
      throw new Error(
        `${curriculumModule.id} süre ve konu bilgisi içermeli.`,
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
      throw new Error(`${task.id}, var olmayan ${task.moduleId} modülüne bağlı.`);
    }
    if (!task.setupSql.trim() || !task.objective.trim()) {
      throw new Error(`${task.id} çalıştırılabilir SQL kurulumu ve hedef içermeli.`);
    }
    if (task.estimatedMinutes <= 0 || task.hints.length !== 3) {
      throw new Error(`${task.id} süre ve üç aşamalı ipucu içermeli.`);
    }
    if (
      task.expectedColumns.length === 0 ||
      task.expectedResult.some(
        (row) => row.length !== task.expectedColumns.length,
      )
    ) {
      throw new Error(`${task.id} beklenen kolon ve satır genişlikleri uyuşmuyor.`);
    }
    if (
      task.requiredConcepts.some(
        (concept) => !task.concepts.includes(concept),
      )
    ) {
      throw new Error(`${task.id} zorunlu kavramları concepts içinde tanımlamalı.`);
    }

    const schemaTableNames = new Set(task.schema.tables.map((table) => table.name));
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
      throw new Error(`${task.id} için nextTaskId bulunamadı: ${task.nextTaskId}.`);
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

export default curriculum;
