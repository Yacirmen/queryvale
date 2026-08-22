import type { ForbiddenOperation, LessonTask } from "../types/lesson";
import { createTask, READ_ONLY_FORBIDDEN } from "./curriculumTaskFactory";

const mutationForbidden = (
  allowed: readonly ("INSERT" | "UPDATE" | "DELETE")[],
): ForbiddenOperation[] =>
  READ_ONLY_FORBIDDEN.filter(
    (operation) =>
      !allowed.includes(operation as "INSERT" | "UPDATE" | "DELETE"),
  );

/**
 * Modül 8 fixture'ları hem vakalar hem köprü alıştırmaları tarafından
 * kullanılır. Entegrasyon testi, alıştırmanın kendinden sonraki vakayla
 * aynı fixture ve aynı yasak-işlem setini taşımasını şart koşar.
 */
const movementLedgerSetupSql = `
    CREATE TABLE inventory (
      product_id INTEGER PRIMARY KEY,
      product_name TEXT NOT NULL UNIQUE,
      stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0)
    );
    CREATE TABLE inventory_movements (
      movement_id INTEGER PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES inventory(product_id),
      quantity_delta INTEGER NOT NULL CHECK (quantity_delta <> 0),
      movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT'))
    );
    INSERT INTO inventory VALUES
      (801, 'Wireless Scanner', 12),
      (802, 'Label Printer', 6),
      (803, 'Packing Tape', 20),
      (804, 'Handheld Terminal', 3);
    INSERT INTO inventory_movements VALUES
      (3001, 801, 12, 'IN'),
      (3002, 802, 6, 'IN'),
      (3003, 801, -3, 'OUT');
  `;

const movementLedgerSchema = {
  tables: [
    {
      name: "inventory",
      description: "Depodaki ürün kartları ve güncel stok bakiyeleri.",
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
    {
      name: "inventory_movements",
      description:
        "Her stok giriş ve çıkışını değişmez bir denetim kaydı olarak tutar.",
      columns: [
        {
          name: "movement_id",
          dataType: "INTEGER",
          nullable: false,
          primaryKey: true,
        },
        {
          name: "product_id",
          dataType: "INTEGER",
          nullable: false,
          references: { table: "inventory", column: "product_id" },
        },
        { name: "quantity_delta", dataType: "INTEGER", nullable: false },
        { name: "movement_type", dataType: "TEXT", nullable: false },
      ],
    },
  ],
  relationships: [
    {
      fromTable: "inventory_movements",
      fromColumn: "product_id",
      toTable: "inventory",
      toColumn: "product_id",
    },
  ],
};

const movementLedgerSamples = [
  {
    tableName: "inventory",
    rows: [
      {
        product_id: 801,
        product_name: "Wireless Scanner",
        stock_quantity: 12,
      },
      { product_id: 803, product_name: "Packing Tape", stock_quantity: 20 },
    ],
  },
  {
    tableName: "inventory_movements",
    rows: [
      {
        movement_id: 3001,
        product_id: 801,
        quantity_delta: 12,
        movement_type: "IN",
      },
      {
        movement_id: 3003,
        product_id: 801,
        quantity_delta: -3,
        movement_type: "OUT",
      },
    ],
  },
];

const movementLedgerForbidden = mutationForbidden(["INSERT"]);

const importBatchSetupSql = `
    CREATE TABLE import_rows (
      import_row_id INTEGER PRIMARY KEY,
      batch_id TEXT NOT NULL,
      row_no INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'rejected')),
      payload TEXT NOT NULL,
      UNIQUE (batch_id, row_no)
    );
    INSERT INTO import_rows VALUES
      (4101, 'B-77', 1, 'approved', 'customer=Atlas'),
      (4102, 'B-77', 2, 'draft', 'customer=Boreal'),
      (4103, 'B-77', 3, 'approved', 'customer=Ceres'),
      (4104, 'B-78', 2, 'draft', 'customer=Delta'),
      (4105, 'B-79', 4, 'rejected', 'customer=Ekin');
  `;

const importBatchSchema = {
  tables: [
    {
      name: "import_rows",
      description:
        "Dosya aktarımındaki her satırın paket, sıra ve onay durumunu tutar.",
      columns: [
        {
          name: "import_row_id",
          dataType: "INTEGER",
          nullable: false,
          primaryKey: true,
        },
        { name: "batch_id", dataType: "TEXT", nullable: false },
        { name: "row_no", dataType: "INTEGER", nullable: false },
        { name: "status", dataType: "TEXT", nullable: false },
        { name: "payload", dataType: "TEXT", nullable: false },
      ],
    },
  ],
};

const importBatchSamples = [
  {
    tableName: "import_rows",
    rows: [
      {
        import_row_id: 4101,
        batch_id: "B-77",
        row_no: 1,
        status: "approved",
        payload: "customer=Atlas",
      },
      {
        import_row_id: 4102,
        batch_id: "B-77",
        row_no: 2,
        status: "draft",
        payload: "customer=Boreal",
      },
      {
        import_row_id: 4104,
        batch_id: "B-78",
        row_no: 2,
        status: "draft",
        payload: "customer=Delta",
      },
    ],
  },
];

const importBatchForbidden = mutationForbidden(["DELETE"]);

const dailyMetricSetupSql = `
    CREATE TABLE branch_daily_metrics (
      branch_id INTEGER NOT NULL,
      metric_date DATE NOT NULL,
      order_count INTEGER NOT NULL CHECK (order_count >= 0),
      revenue NUMERIC(12, 2) NOT NULL CHECK (revenue >= 0),
      PRIMARY KEY (branch_id, metric_date)
    );
    INSERT INTO branch_daily_metrics VALUES
      (1, DATE '2026-05-19', 9, 980.00),
      (1, DATE '2026-05-20', 11, 1250.00),
      (2, DATE '2026-05-20', 8, 910.00);
  `;

const dailyMetricSchema = {
  tables: [
    {
      name: "branch_daily_metrics",
      description:
        "Her şube ve gün için tek, yeniden yüklenebilir operasyon özeti.",
      columns: [
        { name: "branch_id", dataType: "INTEGER", nullable: false },
        { name: "metric_date", dataType: "DATE", nullable: false },
        { name: "order_count", dataType: "INTEGER", nullable: false },
        { name: "revenue", dataType: "NUMERIC(12,2)", nullable: false },
      ],
    },
  ],
};

const dailyMetricSamples = [
  {
    tableName: "branch_daily_metrics",
    rows: [
      {
        branch_id: 1,
        metric_date: "2026-05-20",
        order_count: 11,
        revenue: 1250,
      },
      {
        branch_id: 2,
        metric_date: "2026-05-20",
        order_count: 8,
        revenue: 910,
      },
    ],
  },
];

const dailyMetricForbidden = mutationForbidden(["INSERT", "UPDATE"]);

const insertMovementTask = createTask({
  id: "m8-t2",
  slug: "record-stock-movement",
  moduleId: "module-8",
  title: "Stok giriş hareketini kaydet",
  subtitle: "Yeni kaydı constraint sınırları içinde ekle ve kanıtla.",
  scenario:
    "Depo ekibi, Packing Tape ürünü için gelen 4 adetlik teslimatı hareket günlüğüne eklemek ve oluşan kaydı aynı işlemde denetlemek istiyor.",
  objective:
    "inventory_movements tablosuna movement_id 3004, product_id 803, quantity_delta 4 ve movement_type 'IN' değerleriyle tek kayıt ekle. RETURNING ile movement_id, product_id, quantity_delta ve movement_type kolonlarını bu sırada döndür.",
  difficulty: "intermediate",
  estimatedMinutes: 12,
  prerequisites: ["m8-t1"],
  concepts: ["INSERT", "CONSTRAINT"],
  setupSql: movementLedgerSetupSql,
  schema: movementLedgerSchema,
  sampleRows: movementLedgerSamples,
  expectedColumns: [
    "movement_id",
    "product_id",
    "quantity_delta",
    "movement_type",
  ],
  validationMode: "mutation",
  expectedResult: [[3004, 803, 4, "IN"]],
  orderSensitive: false,
  requiredConcepts: ["INSERT"],
  forbiddenOperations: movementLedgerForbidden,
  mutationVerification: {
    sql: `
      SELECT movement_id, product_id, quantity_delta, movement_type
      FROM inventory_movements
      ORDER BY movement_id;
    `,
    expectedColumns: [
      "movement_id",
      "product_id",
      "quantity_delta",
      "movement_type",
    ],
    expectedResult: [
      [3001, 801, 12, "IN"],
      [3002, 802, 6, "IN"],
      [3003, 801, -3, "OUT"],
      [3004, 803, 4, "IN"],
    ],
    orderSensitive: true,
  },
  hints: [
    "Yeni bir hareket satırı oluşturmak için INSERT INTO ile hedef tabloyu ve yazacağın kolonları açıkça belirt.",
    "VALUES bölümündeki dört değeri kolon sırasıyla eşleştir; hareket türü giriş olduğu için IN kullan.",
    "INSERT INTO inventory_movements (movement_id, product_id, quantity_delta, movement_type) VALUES (...) RETURNING ... iskeletini tamamla.",
  ],
  explanation:
    "Açık kolon listesi veri sözleşmesini görünür kılar. Primary key aynı hareketin iki kez yazılmasını, foreign key bilinmeyen ürünü ve CHECK kuralları geçersiz miktar veya hareket türünü engeller; RETURNING eklenen satırı doğrular.",
  completionMessage:
    "Stok girişi denetlenebilir bir hareket olarak kaydedildi ve gerçek tablo durumu doğrulandı.",
  nextTaskId: "m8-t3",
});

const deleteImportDraftTask = createTask({
  id: "m8-t3",
  slug: "delete-import-draft",
  moduleId: "module-8",
  title: "Taslak ithalat kaydını güvenle sil",
  subtitle: "Yıkıcı işlemi batch, satır ve durum koşullarıyla daralt.",
  scenario:
    "Veri operasyon ekibi B-77 aktarım paketinin 2. satırındaki hatalı taslağı yeniden yükleyecek. Aynı paketteki onaylı satırlar ve başka paketteki benzer taslak korunmalı.",
  objective:
    "import_rows tablosunda yalnız batch_id 'B-77', row_no 2 ve status 'draft' koşullarının üçünü birden karşılayan kaydı sil. RETURNING ile import_row_id, batch_id ve status kolonlarını bu sırada döndür.",
  difficulty: "intermediate",
  estimatedMinutes: 12,
  prerequisites: ["m8-t2"],
  concepts: ["DELETE", "WHERE", "AND"],
  setupSql: importBatchSetupSql,
  schema: importBatchSchema,
  sampleRows: importBatchSamples,
  expectedColumns: ["import_row_id", "batch_id", "status"],
  validationMode: "mutation",
  expectedResult: [[4102, "B-77", "draft"]],
  orderSensitive: false,
  requiredConcepts: ["DELETE", "WHERE", "AND"],
  forbiddenOperations: importBatchForbidden,
  mutationVerification: {
    sql: `
      SELECT import_row_id, batch_id, row_no, status
      FROM import_rows
      ORDER BY import_row_id;
    `,
    expectedColumns: ["import_row_id", "batch_id", "row_no", "status"],
    expectedResult: [
      [4101, "B-77", 1, "approved"],
      [4103, "B-77", 3, "approved"],
      [4104, "B-78", 2, "draft"],
      [4105, "B-79", 4, "rejected"],
    ],
    orderSensitive: true,
  },
  hints: [
    "DELETE hedef tablodan satır kaldırır; WHERE koşulu işlem alanını belirler.",
    "Batch, satır numarası ve durum ayrı güvenlik kilitleridir. Üç koşulu AND ile birlikte uygula.",
    "DELETE FROM import_rows WHERE batch_id = ... AND row_no = ... AND status = ... RETURNING ... iskeletini tamamla.",
  ],
  explanation:
    "Yıkıcı bir sorguda tek bir kimliğe güvenmek yerine iş bağlamını oluşturan batch, satır ve durum koşullarını birlikte kullanmak yanlış kaydı silme riskini azaltır. Gizli durum kontrolü hedef dışındaki dört kaydın gerçekten korunduğunu kanıtlar.",
  completionMessage:
    "Hatalı taslak kaldırıldı; onaylı kayıtlar ve diğer paketler değişmeden kaldı.",
  nextTaskId: "m8-t4",
});

const upsertDailyMetricTask = createTask({
  id: "m8-t4",
  slug: "upsert-daily-branch-metric",
  moduleId: "module-8",
  title: "Günlük metriği çakışmada güncelle",
  subtitle: "Yeniden gelen veriyle duplicate üretmeden aynı snapshot'ı yenile.",
  scenario:
    "Gece yükü, branch_id 1 olan şubenin 20 Mayıs metriğini düzeltilmiş değerlerle tekrar gönderdi. ETL akışı yeni bir kopya üretmemeli; aynı şube-gün kaydını idempotent biçimde güncellemelidir.",
  objective:
    "branch_daily_metrics tablosuna branch_id 1, metric_date DATE '2026-05-20', order_count 14 ve revenue 1620.00 değerlerini INSERT et. Birleşik anahtar çakışırsa order_count ve revenue değerlerini EXCLUDED kaydından güncelle. RETURNING ile branch_id, metric_date, order_count ve revenue kolonlarını döndür.",
  difficulty: "advanced",
  estimatedMinutes: 18,
  prerequisites: ["m8-t3"],
  concepts: ["INSERT", "UPDATE", "UPSERT", "CONSTRAINT"],
  setupSql: dailyMetricSetupSql,
  schema: dailyMetricSchema,
  sampleRows: dailyMetricSamples,
  expectedColumns: ["branch_id", "metric_date", "order_count", "revenue"],
  validationMode: "mutation",
  expectedResult: [[1, "2026-05-20", 14, 1620]],
  orderSensitive: false,
  requiredConcepts: ["INSERT", "UPDATE", "UPSERT"],
  forbiddenOperations: dailyMetricForbidden,
  mutationVerification: {
    sql: `
      SELECT branch_id, metric_date, order_count, revenue
      FROM branch_daily_metrics
      ORDER BY metric_date, branch_id;
    `,
    expectedColumns: ["branch_id", "metric_date", "order_count", "revenue"],
    expectedResult: [
      [1, "2026-05-19", 9, 980],
      [1, "2026-05-20", 14, 1620],
      [2, "2026-05-20", 8, 910],
    ],
    orderSensitive: true,
  },
  validationOptions: { numericTolerance: 0.01 },
  hints: [
    "Aynı sorgunun hem yeni hem mevcut anahtar için güvenli çalışması INSERT ... ON CONFLICT desenini gerektirir.",
    "Çakışma hedefi birleşik primary key olan branch_id ve metric_date; yeni değerlerin kaynağı EXCLUDED kaydıdır.",
    "INSERT ... VALUES (...) ON CONFLICT (branch_id, metric_date) DO UPDATE SET order_count = EXCLUDED.order_count, revenue = EXCLUDED.revenue RETURNING ... iskeletini tamamla.",
  ],
  explanation:
    "UPSERT aynı doğal tanedeki kaydı ikinci kez üretmek yerine mevcut snapshot'ı yeniler. Birleşik primary key iş tanesini korur, EXCLUDED gelen kaydı açıkça temsil eder ve post-state doğrulaması diğer gün ile şubenin değişmediğini gösterir.",
  completionMessage:
    "Günlük snapshot duplicate üretmeden yenilendi; ETL yükü yeniden çalıştırılabilir hâle geldi.",
  nextTaskId: "m9-t1",
});

/**
 * Modül 8 köprü alıştırmaları. Veri değiştirme, rotanın en riskli bölgesi ama
 * en az pratiği olanıydı: INSERT, DELETE ve UPSERT birer vakada görülüp bir
 * daha görünmüyordu.
 *
 * İki farklı öğretme hamlesi kullanılır. Silme ve güncellemede tehlikeli olan
 * SET değil WHERE'dir; bu yüzden o iki alıştırma önce "hangi satırlar
 * etkilenecek" sorusunu okunur bir SELECT ile çözdürür. Ekleme ve upsert ise
 * gerçekten uygulanır ve tablo durumu ayrıca doğrulanır.
 */
export const module8BridgeDrills: LessonTask[] = [
  createTask({
    id: "m8-d1",
    slug: "inventory-movement-insert-practice",
    moduleId: "module-8",
    title: "Yeni hareketi kaydet",
    subtitle: "Ekleme yaptığını RETURNING ile kendine kanıtlat.",
    scenario:
      "Depo sorumlusu el terminali için gelen beş adetlik girişi kayda geçiriyor.",
    objective:
      "inventory_movements tablosuna 3005 numaralı, 804 numaralı ürüne ait, 5 adetlik bir IN hareketi ekle ve eklenen satırın movement_id, product_id ve quantity_delta kolonlarını geri döndür.",
    difficulty: "intermediate",
    estimatedMinutes: 3,
    type: "drill_practice",
    scored: false,
    routeOrder: 29.1,
    conceptsReinforced: ["K99-INSERT", "K99-RETURNING"],
    curriculumConcepts: ["K99-INSERT", "K99-RETURNING"],
    drillConcept:
      "INSERT satır ekler; RETURNING ise eklenen satırı sana geri gösterir. Değişiklik yaptığını varsaymak yerine görmek, veri değiştiren her işte alışkanlık olmalıdır.",
    prerequisites: [],
    concepts: ["INSERT"],
    setupSql: movementLedgerSetupSql,
    schema: movementLedgerSchema,
    sampleRows: movementLedgerSamples,
    expectedColumns: ["movement_id", "product_id", "quantity_delta"],
    validationMode: "mutation",
    mutationVerification: {
      sql: "SELECT movement_id, product_id, quantity_delta, movement_type FROM inventory_movements ORDER BY movement_id;",
      expectedColumns: [
        "movement_id",
        "product_id",
        "quantity_delta",
        "movement_type",
      ],
      expectedResult: [
        [3001, 801, 12, "IN"],
        [3002, 802, 6, "IN"],
        [3003, 801, -3, "OUT"],
        [3005, 804, 5, "IN"],
      ],
      orderSensitive: true,
    },
    expectedResult: [[3005, 804, 5]],
    orderSensitive: false,
    requiredConcepts: ["INSERT"],
    forbiddenOperations: movementLedgerForbidden,
    hints: [
      "Mevcut satırlara dokunma; tabloya yalnız bir satır eklenecek. Hareket tipi kolonu yalnız IN veya OUT kabul eder.",
      "INSERT INTO [tablo] (kolonlar) VALUES (...) yapısına RETURNING ekleyerek eklenen satırı görebilirsin.",
      "İskelet: INSERT INTO inventory_movements (movement_id, product_id, quantity_delta, movement_type) VALUES ([kimlik], [ürün], [adet], '[tip]') RETURNING movement_id, product_id, quantity_delta;",
    ],
    explanation:
      "RETURNING, eklenen satırı işlemin kendisinden okur. Ayrı bir SELECT çekmeye gerek kalmaz ve gerçekten ne yazıldığını görürsün.",
    completionMessage:
      "Hareketi kaydettin ve kanıtını gördün. Sıradaki alıştırma silmeden önce kapsamı ölçmeyi çalıştıracak.",
    nextTaskId: null,
  }),
  createTask({
    id: "m8-d2",
    slug: "import-draft-delete-scope",
    moduleId: "module-8",
    title: "Silmeden önce kapsamı ölç",
    subtitle: "Hangi satırların gideceğini silmeden önce gör.",
    scenario:
      "Veri ekibi B-77 partisindeki taslak satırları temizleyecek; önce hangi satırların etkileneceğini teyit ediyor.",
    objective:
      "import_rows tablosundan yalnız B-77 partisine ait ve durumu draft olan satırların import_row_id, batch_id ve status kolonlarını kimliğe göre artan sırada getir.",
    difficulty: "intermediate",
    estimatedMinutes: 3,
    type: "drill_practice",
    scored: false,
    routeOrder: 30.1,
    conceptsReinforced: ["K01", "K05", "K07"],
    curriculumConcepts: ["K01", "K05", "K07"],
    drillConcept:
      "Silmede tehlikeli olan DELETE kelimesi değil, WHERE koşuludur. Aynı koşulu önce SELECT ile çalıştırmak, geri alınamaz bir işlemi çalıştırmadan önceki tek ucuz kontroldür.",
    prerequisites: [],
    concepts: ["SELECT", "WHERE", "AND", "COMPARISON", "ORDER_BY"],
    setupSql: importBatchSetupSql,
    schema: importBatchSchema,
    sampleRows: importBatchSamples,
    expectedColumns: ["import_row_id", "batch_id", "status"],
    validationMode: "result-and-concepts",
    expectedResult: [[4102, "B-77", "draft"]],
    orderSensitive: true,
    requiredConcepts: ["WHERE", "AND", "COMPARISON", "ORDER_BY"],
    forbiddenOperations: importBatchForbidden,
    hints: [
      "İki koşul birlikte sağlanmalı: parti B-77 olacak ve durum draft olacak. Tek koşulla çalışırsan başka partinin taslağı da listeye girer.",
      "WHERE içinde iki eşitliği AND ile bağla. B-78 partisinde de bir draft satır var; koşulun onu dışarıda bırakmalı.",
      "İskelet: SELECT [kimlik], [parti], [durum] FROM import_rows WHERE [parti] = '[değer]' AND [durum] = '[değer]' ORDER BY [kimlik];",
    ],
    explanation:
      "Tek satır döner. Aynı WHERE ile DELETE çalıştırsaydın yalnız o satır silinecekti; koşulu eksik yazsaydın B-78 partisinin taslağı da gidecekti.",
    completionMessage:
      "Kapsamı ölçtün. Sıradaki vaka aynı koşulu gerçek bir silmeye taşıyacak.",
    nextTaskId: null,
  }),
  createTask({
    id: "m8-d4",
    slug: "import-rejected-delete-execute",
    moduleId: "module-8",
    title: "Ölçtüğün kapsamı sil",
    subtitle: "Aynı WHERE'i bu kez gerçekten çalıştır.",
    scenario:
      "B-79 partisi reddedildi; veri ekibi bu partinin reddedilen satırlarını kalıcı olarak temizliyor.",
    objective:
      "import_rows tablosundan yalnız B-79 partisine ait ve durumu rejected olan satırları sil; silinen satırın import_row_id, batch_id ve status kolonlarını geri döndür.",
    difficulty: "intermediate",
    estimatedMinutes: 3,
    type: "drill_practice",
    scored: false,
    routeOrder: 30.2,
    conceptsReinforced: ["K01", "K05", "K07", "K99-DELETE", "K99-RETURNING"],
    curriculumConcepts: ["K01", "K05", "K07", "K99-DELETE", "K99-RETURNING"],
    drillConcept:
      "Bir önceki alıştırmada kapsamı SELECT ile ölçtün; burada aynı WHERE bir DELETE'e taşınıyor. Silme geri alınamaz, bu yüzden kural şudur: koşulu önce oku, sonra çalıştır, sonra RETURNING ile ne gittiğini gör.",
    prerequisites: [],
    concepts: ["DELETE"],
    setupSql: importBatchSetupSql,
    schema: importBatchSchema,
    sampleRows: importBatchSamples,
    expectedColumns: ["import_row_id", "batch_id", "status"],
    validationMode: "mutation",
    mutationVerification: {
      sql: "SELECT import_row_id, batch_id, status FROM import_rows ORDER BY import_row_id;",
      expectedColumns: ["import_row_id", "batch_id", "status"],
      expectedResult: [
        [4101, "B-77", "approved"],
        [4102, "B-77", "draft"],
        [4103, "B-77", "approved"],
        [4104, "B-78", "draft"],
      ],
      orderSensitive: true,
    },
    expectedResult: [[4105, "B-79", "rejected"]],
    orderSensitive: false,
    requiredConcepts: ["DELETE"],
    forbiddenOperations: importBatchForbidden,
    hints: [
      "Dört satır tabloda kalmalı. WHERE'i eksik yazarsan başka partilerin satırları da gider ve geri getiremezsin.",
      "İki koşulu AND ile bağla, sonra ifadenin sonuna RETURNING ekleyerek gerçekten hangi satırın silindiğini gör.",
      "İskelet: DELETE FROM import_rows WHERE [parti] = '[değer]' AND [durum] = '[değer]' RETURNING [kimlik], [parti], [durum];",
    ],
    explanation:
      "Tek satır silindi ve RETURNING onu sana gösterdi. Aynı koşulu bir önceki alıştırmada SELECT ile denemiştin; bu sıralama gerçek işlerde de doğru sıradır çünkü DELETE'in geri dönüşü yoktur.",
    completionMessage:
      "Silmeyi ölçüp uyguladın. INSERT, DELETE ve UPSERT artık birer vakadan fazlasında geçti.",
    nextTaskId: null,
  }),
  createTask({
    id: "m8-d3",
    slug: "daily-metric-upsert-insert-path",
    moduleId: "module-8",
    title: "Çakışma yoksa ne olur",
    subtitle: "UPSERT'ün ekleme tarafını çakışmadan önce tanı.",
    scenario:
      "ETL yükü yeni bir güne ait şube metriğini yazıyor; o gün için kayıt henüz yok.",
    objective:
      "branch_daily_metrics tablosuna 2 numaralı şubenin 2026-05-21 günü için 6 sipariş ve 720.00 ciro değerini yaz; aynı anahtar zaten varsa değerleri güncelleyecek biçimde kur ve yazılan satırın dört kolonunu geri döndür.",
    difficulty: "intermediate",
    estimatedMinutes: 3,
    type: "drill_practice",
    scored: false,
    routeOrder: 31.1,
    conceptsReinforced: ["K99-INSERT", "K99-UPSERT", "K99-RETURNING"],
    curriculumConcepts: ["K99-INSERT", "K99-UPSERT", "K99-RETURNING"],
    drillConcept:
      "ON CONFLICT DO UPDATE iki yolu tek ifadede taşır: anahtar yoksa ekler, varsa günceller. Burada anahtar yok, yani ekleme yolu çalışır — aynı ifade sıradaki vakada güncelleme yolunu çalıştıracak.",
    prerequisites: [],
    concepts: ["INSERT", "UPSERT"],
    setupSql: dailyMetricSetupSql,
    schema: dailyMetricSchema,
    sampleRows: dailyMetricSamples,
    expectedColumns: ["branch_id", "metric_date", "order_count", "revenue"],
    validationMode: "mutation",
    mutationVerification: {
      sql: "SELECT branch_id, metric_date, order_count, revenue FROM branch_daily_metrics ORDER BY branch_id, metric_date;",
      expectedColumns: ["branch_id", "metric_date", "order_count", "revenue"],
      expectedResult: [
        [1, "2026-05-19", 9, "980.00"],
        [1, "2026-05-20", 11, "1250.00"],
        [2, "2026-05-20", 8, "910.00"],
        [2, "2026-05-21", 6, "720.00"],
      ],
      orderSensitive: true,
    },
    expectedResult: [[2, "2026-05-21", 6, "720.00"]],
    orderSensitive: false,
    requiredConcepts: ["INSERT", "UPSERT"],
    forbiddenOperations: dailyMetricForbidden,
    hints: [
      "Bu gün için kayıt yok, yani ifade ekleme yapacak. Yine de çakışma davranışını şimdiden yazmalısın; sıradaki vakada aynı ifade güncelleme yapacak.",
      "ON CONFLICT (anahtar kolonları) DO UPDATE SET ... yazdığında çakışma hâlinde güncelleme yolu çalışır. Yeni değerlere EXCLUDED üzerinden erişirsin.",
      "İskelet: INSERT INTO branch_daily_metrics (...) VALUES (...) ON CONFLICT ([şube], [tarih]) DO UPDATE SET [sayı] = EXCLUDED.[sayı], [ciro] = EXCLUDED.[ciro] RETURNING [dört kolon];",
    ],
    explanation:
      "Anahtar bulunmadığı için ekleme yolu çalıştı ve tabloya dördüncü satır eklendi. Aynı ifadeyi var olan bir anahtarla çalıştırsaydın mevcut satır güncellenirdi.",
    completionMessage:
      "UPSERT'ün ekleme yolunu gördün. Sıradaki vaka aynı ifadeyi çakışan bir anahtarla çalıştıracak.",
    nextTaskId: null,
  }),
];

export const module8ExpansionTasks: LessonTask[] = [
  insertMovementTask,
  deleteImportDraftTask,
  upsertDailyMetricTask,
];

const customerHistorySetupSql = `
    CREATE TABLE dim_customer (
      customer_key INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      segment TEXT NOT NULL,
      valid_from DATE NOT NULL,
      valid_to DATE
    );
    INSERT INTO dim_customer VALUES
      (1, 101, 'Atlas Market', 'Standard', DATE '2026-01-01', DATE '2026-03-31'),
      (2, 101, 'Atlas Market', 'Premium', DATE '2026-04-01', NULL),
      (3, 102, 'Boreal Studio', 'Standard', DATE '2026-02-15', NULL),
      (4, 103, 'Ceres Labs', 'Premium', DATE '2026-01-01', DATE '2026-04-30'),
      (5, 103, 'Ceres Labs', 'At Risk', DATE '2026-05-01', NULL),
      (6, 104, 'Delta Works', 'Standard', DATE '2025-11-01', DATE '2026-02-28');
  `;

const customerHistorySchema = {
  tables: [
    {
      name: "dim_customer",
      description:
        "Müşteri segment değişimlerini başlangıç ve bitiş tarihleriyle saklayan SCD Type 2 boyutu.",
      columns: [
        {
          name: "customer_key",
          dataType: "INTEGER",
          nullable: false,
          primaryKey: true,
          description: "Her tarihsel boyut sürümünün surrogate key değeri",
        },
        {
          name: "customer_id",
          dataType: "INTEGER",
          nullable: false,
          description: "Sürümler boyunca değişmeyen müşteri iş anahtarı",
        },
        { name: "customer_name", dataType: "TEXT", nullable: false },
        { name: "segment", dataType: "TEXT", nullable: false },
        { name: "valid_from", dataType: "DATE", nullable: false },
        { name: "valid_to", dataType: "DATE", nullable: true },
      ],
    },
  ],
};

const customerHistorySamples = [
  {
    tableName: "dim_customer",
    rows: [
      {
        customer_key: 1,
        customer_id: 101,
        customer_name: "Atlas Market",
        segment: "Standard",
        valid_from: "2026-01-01",
        valid_to: "2026-03-31",
      },
      {
        customer_key: 2,
        customer_id: 101,
        customer_name: "Atlas Market",
        segment: "Premium",
        valid_from: "2026-04-01",
        valid_to: null,
      },
      {
        customer_key: 6,
        customer_id: 104,
        customer_name: "Delta Works",
        segment: "Standard",
        valid_from: "2025-11-01",
        valid_to: "2026-02-28",
      },
    ],
  },
];

const currentCustomerSegmentTask = createTask({
  id: "m9-t2",
  slug: "select-current-customer-segment",
  moduleId: "module-9",
  title: "Güncel müşteri segmentini seç",
  subtitle: "SCD Type 2 geçmişinden açık boyut kaydını ayır.",
  scenario:
    "CRM ekibi kampanya hedeflemesi için müşterilerin yalnız güncel segmentini istiyor. Boyut tablosu geçmiş sürümleri de tuttuğu için aynı müşteri birden fazla fiziksel satırda görünebilir.",
  objective:
    "dim_customer tablosunda valid_to değeri NULL olan güncel kayıtları seç. customer_id, segment ve valid_from kolonlarını bu sırada getir; customer_id değerine göre artan sırala.",
  difficulty: "advanced",
  estimatedMinutes: 14,
  prerequisites: ["m9-t1"],
  concepts: ["STAR_SCHEMA", "NORMALIZATION", "WHERE", "IS_NULL", "ORDER_BY"],
  setupSql: customerHistorySetupSql,
  schema: customerHistorySchema,
  sampleRows: customerHistorySamples,
  expectedColumns: ["customer_id", "segment", "valid_from"],
  validationMode: "result-and-concepts",
  expectedResult: [
    [101, "Premium", "2026-04-01"],
    [102, "Standard", "2026-02-15"],
    [103, "At Risk", "2026-05-01"],
  ],
  orderSensitive: true,
  requiredConcepts: ["WHERE", "IS_NULL", "ORDER_BY"],
  forbiddenOperations: [...READ_ONLY_FORBIDDEN],
  hints: [
    "SCD Type 2 tablosunda customer_key satırı, customer_id ise müşteriyi temsil eder; güncel sürümü tarih sözleşmesiyle seçmelisin.",
    "Açık kalan boyut kaydının valid_to değeri yoktur. Geçmiş satırları elemek için IS NULL kullan.",
    "SELECT [çıktı kolonları] FROM dim_customer WHERE [açık sürüm koşulu] ORDER BY [müşteri iş anahtarı] iskeletini tamamla.",
  ],
  explanation:
    "SCD Type 2 geçmişi üzerine yazmak yerine yeni sürüm açar. Güncel görünüm surrogate key'in büyüklüğüne değil, açık dönem sözleşmesine dayanır; valid_to IS NULL müşterinin etkin boyut satırını seçer.",
  completionMessage:
    "Tarihsel boyut korunurken CRM için müşteri başına tek güncel segment üretildi.",
  nextTaskId: "m9-t3",
});

/**
 * SCD Type 2 boyutu, satır sayısının varlık sayısına eşit olmadığı ilk yer.
 * Bu iki alıştırma o ayrımı vakadan önce görünür kılar ve rotanın ilk
 * çeyreğinde öğrenilip bir daha uğranmayan DISTINCT ile MAX'ı geri getirir.
 */
export const module9BridgeDrills: LessonTask[] = [
  createTask({
    id: "m9-d2",
    slug: "distinct-customers-behind-versions",
    moduleId: "module-9",
    title: "Kaç satır, kaç müşteri",
    subtitle: "Sürüm satırlarının ardındaki gerçek varlık sayısını gör.",
    scenario:
      "CRM ekibi boyut tablosunda altı satır görüyor ve bunun kaç müşteriye karşılık geldiğini soruyor.",
    objective:
      "dim_customer tablosundaki farklı müşterileri bir kez listele; customer_id ve customer_name kolonlarını customer_id artan sırada getir.",
    difficulty: "advanced",
    estimatedMinutes: 3,
    type: "drill_practice",
    scored: false,
    routeOrder: 33.1,
    conceptsReinforced: ["K01", "K03", "K13"],
    curriculumConcepts: ["K01", "K03", "K13"],
    drillConcept:
      "Bir tablonun satır sayısı ile temsil ettiği varlık sayısı aynı şey değildir. SCD Type 2 boyutunda her segment değişikliği yeni bir satır açar; müşteri sayısını görmek için tekrarları kaldırman gerekir.",
    prerequisites: [],
    concepts: ["SELECT", "DISTINCT", "ORDER_BY"],
    setupSql: customerHistorySetupSql,
    schema: customerHistorySchema,
    sampleRows: customerHistorySamples,
    expectedColumns: ["customer_id", "customer_name"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [101, "Atlas Market"],
      [102, "Boreal Studio"],
      [103, "Ceres Labs"],
      [104, "Delta Works"],
    ],
    orderSensitive: true,
    requiredConcepts: ["DISTINCT", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Tabloda altı satır var ama altı müşteri yok. Atlas Market ve Ceres Labs ikişer sürümle duruyor.",
      "customer_key her sürüme özel olduğu için onu seçersen tekrar kalkmaz. İş anahtarı ile adı seç ve DISTINCT uygula.",
      "İskelet: SELECT DISTINCT [iş anahtarı], [ad] FROM dim_customer ORDER BY [iş anahtarı];",
    ],
    explanation:
      "Altı satır dört müşteriye iniyor. Sıradaki vaka aynı farkı başka bir yoldan çözecek: tekrarı kaldırmak yerine her müşterinin yalnız açık sürümünü seçecek.",
    completionMessage:
      "Tane farkını gördün. DISTINCT'i rotanın ilk günlerinden sonra ilk kez yeniden kullandın.",
    nextTaskId: null,
  }),
  createTask({
    id: "m9-d3",
    slug: "latest-version-start-per-customer",
    moduleId: "module-9",
    title: "En son sürüm ne zaman başladı",
    subtitle: "Grup başına en büyük tarihi çıkar.",
    scenario:
      "Veri kalitesi ekibi her müşterinin en son segment değişikliğinin tarihini raporluyor.",
    objective:
      "dim_customer tablosunda her müşteri için en büyük valid_from değerini latest_version_start adıyla getir; customer_id ve bu kolonu customer_id artan sırada listele.",
    difficulty: "advanced",
    estimatedMinutes: 3,
    type: "drill_practice",
    scored: false,
    routeOrder: 33.2,
    conceptsReinforced: ["K01", "K02", "K03", "K15", "K16"],
    curriculumConcepts: ["K01", "K02", "K03", "K15", "K16"],
    drillConcept:
      "MAX bir tarih kolonunda da çalışır ve grup başına en geç değeri verir. Bu, güncel sürümü bulmanın akla ilk gelen yoludur — ama tek yolu değildir.",
    prerequisites: [],
    concepts: ["SELECT", "MAX", "GROUP_BY", "ALIAS", "ORDER_BY"],
    setupSql: customerHistorySetupSql,
    schema: customerHistorySchema,
    sampleRows: customerHistorySamples,
    expectedColumns: ["customer_id", "latest_version_start"],
    validationMode: "result-and-concepts",
    expectedResult: [
      [101, "2026-04-01"],
      [102, "2026-02-15"],
      [103, "2026-05-01"],
      [104, "2025-11-01"],
    ],
    orderSensitive: true,
    requiredConcepts: ["MAX", "GROUP_BY", "ALIAS", "ORDER_BY"],
    forbiddenOperations: [...READ_ONLY_FORBIDDEN],
    hints: [
      "Her müşteri için tek satır dönmeli. Delta Works'ün tek sürümü var, yine de listede yer alacak.",
      "customer_id ile grupla ve valid_from üzerinde MAX kullan; sonuca AS ile ad ver.",
      "İskelet: SELECT [iş anahtarı], MAX([başlangıç tarihi]) AS latest_version_start FROM dim_customer GROUP BY [iş anahtarı] ORDER BY [iş anahtarı];",
    ],
    explanation:
      "Delta Works burada 2025-11-01 ile listede — oysa o müşterinin kaydı 2026-02-28'de kapanmış, yani artık güncel değil. En büyük tarih ile açık sürüm aynı şey değildir; sıradaki vaka bu yüzden MAX'ı değil, valid_to boşluğunu kullanacak.",
    completionMessage:
      "MAX ile grup başına en geç tarihi çıkardın ve bunun neden yeterli olmadığını gördün.",
    nextTaskId: null,
  }),
];

const orphanSalesAuditTask = createTask({
  id: "m9-t3",
  slug: "audit-orphan-sales-keys",
  moduleId: "module-9",
  title: "Yetim satış anahtarlarını denetle",
  subtitle: "Boyutta karşılığı olmayan fact olaylarını kalite kuyruğuna ayır.",
  scenario:
    "BI yenilemesi öncesi veri kalite kontrolü, ürün boyutunda karşılığı bulunmayan satış olaylarını rapordan önce yakalamalıdır. Staging fact tablosunda foreign key bilinçli olarak uygulanmamıştır.",
  objective:
    "fact_sales tablosunu dim_product ile product_key üzerinden LEFT JOIN et. Boyut tarafında eşleşmesi olmayan olayların sale_key, product_key ve revenue_amount kolonlarını getir; sale_key değerine göre artan sırala.",
  difficulty: "intermediate",
  estimatedMinutes: 14,
  prerequisites: ["m9-t2"],
  concepts: ["DATA_QUALITY", "LEFT_JOIN", "IS_NULL", "ORDER_BY"],
  setupSql: `
    CREATE TABLE dim_product (
      product_key INTEGER PRIMARY KEY,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL
    );
    CREATE TABLE fact_sales (
      sale_key INTEGER PRIMARY KEY,
      product_key INTEGER NOT NULL,
      revenue_amount NUMERIC(12, 2) NOT NULL
    );
    INSERT INTO dim_product VALUES
      (10, 'Office Chair', 'Furniture'),
      (11, 'Monitor', 'Technology'),
      (12, 'Desk Lamp', 'Home');
    INSERT INTO fact_sales VALUES
      (9201, 10, 240.00),
      (9202, 99, 180.00),
      (9203, 11, 320.00),
      (9204, 88, 75.00),
      (9205, 12, 90.00);
  `,
  schema: {
    tables: [
      {
        name: "dim_product",
        description: "Raporlarda kullanılan onaylı ürün boyutu.",
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
        name: "fact_sales",
        description:
          "Kaynak yükten gelen ve henüz referans bütünlüğü uygulanmamış satış staging olayları.",
        columns: [
          {
            name: "sale_key",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          { name: "product_key", dataType: "INTEGER", nullable: false },
          {
            name: "revenue_amount",
            dataType: "NUMERIC(12,2)",
            nullable: false,
          },
        ],
      },
    ],
    relationships: [
      {
        fromTable: "fact_sales",
        fromColumn: "product_key",
        toTable: "dim_product",
        toColumn: "product_key",
        label: "Staging'de mantıksal ilişki; bilinçli olarak FK yok",
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
        { sale_key: 9201, product_key: 10, revenue_amount: 240 },
        { sale_key: 9202, product_key: 99, revenue_amount: 180 },
        { sale_key: 9203, product_key: 11, revenue_amount: 320 },
      ],
    },
  ],
  expectedColumns: ["sale_key", "product_key", "revenue_amount"],
  validationMode: "result-and-concepts",
  expectedResult: [
    [9202, 99, 180],
    [9204, 88, 75],
  ],
  orderSensitive: true,
  requiredConcepts: ["LEFT_JOIN", "IS_NULL", "ORDER_BY"],
  forbiddenOperations: [...READ_ONLY_FORBIDDEN],
  hints: [
    "Denetim kapsamı tüm fact_sales olaylarıdır; eşleşmeyenleri kaybetmemek için fact tarafından başlayan LEFT JOIN kullan.",
    "Yetim satırda fact anahtarı dolu kalır, dim_product tarafındaki anahtar NULL olur.",
    "SELECT [fact teslim kolonları] FROM fact_sales f LEFT JOIN dim_product p ON [ürün anahtarı eşleşmesi] WHERE [boyut tarafındaki eksik eşleşme] ORDER BY [satış anahtarı] iskeletini tamamla.",
  ],
  explanation:
    "LEFT JOIN fact kapsamını korur, eşleşmeyen dimension tarafını NULL bırakır. Bu anti-join deseni yanlış anahtarların rapor toplamlarına karışmasını önceden görünür kılar; staging tablosunda FK olmaması bu kalite hatasını bilinçli olarak test eder.",
  completionMessage:
    "İki yetim satış olayı rapor yenilemesinden önce kalite kuyruğuna ayrıldı.",
  nextTaskId: "m9-t4",
});

const weeklyChannelMartTask = createTask({
  id: "m9-t4",
  slug: "build-dense-weekly-channel-mart",
  moduleId: "module-9",
  title: "Eksiksiz haftalık kanal martını üret",
  subtitle: "Olay olmayan hafta–kanal çiftlerini gerçek sıfır olarak koru.",
  scenario:
    "BI ekibi haftalık kanal grafiğinde boşluk görmek istemiyor. Sipariş gelmeyen kombinasyonlar veri eksikliği gibi kaybolmamalı; sıfır sipariş ve sıfır gelirle açıkça görünmelidir.",
  objective:
    "dim_week ile dim_channel tablolarından tüm hafta–kanal kombinasyonlarını üret. fact_orders verisini önce week_start ve channel_id tanesinde özetleyip kapsama LEFT JOIN et. week_start, channel_name, order_count ve revenue kolonlarını getir; eksik ölçüleri 0 yap ve önce haftaya, sonra kanal adına göre artan sırala.",
  difficulty: "advanced",
  estimatedMinutes: 24,
  prerequisites: ["m9-t3"],
  concepts: [
    "STAR_SCHEMA",
    "DATA_MART",
    "CTE",
    "LEFT_JOIN",
    "COUNT",
    "SUM",
    "GROUP_BY",
    "ORDER_BY",
  ],
  setupSql: `
    CREATE TABLE dim_week (
      week_key INTEGER PRIMARY KEY,
      week_start DATE NOT NULL UNIQUE
    );
    CREATE TABLE dim_channel (
      channel_id INTEGER PRIMARY KEY,
      channel_name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE fact_orders (
      order_key INTEGER PRIMARY KEY,
      week_key INTEGER NOT NULL REFERENCES dim_week(week_key),
      channel_id INTEGER NOT NULL REFERENCES dim_channel(channel_id),
      revenue NUMERIC(12, 2) NOT NULL
    );
    INSERT INTO dim_week VALUES
      (1, DATE '2026-05-04'),
      (2, DATE '2026-05-11');
    INSERT INTO dim_channel VALUES
      (10, 'Web'),
      (11, 'Marketplace'),
      (12, 'Store');
    INSERT INTO fact_orders VALUES
      (9301, 1, 10, 120.00),
      (9302, 1, 10, 80.00),
      (9303, 1, 11, 150.00),
      (9304, 2, 10, 90.00),
      (9305, 2, 12, 60.00),
      (9306, 2, 12, 40.00);
  `,
  schema: {
    tables: [
      {
        name: "dim_week",
        description: "Rapor kapsamındaki haftaların tarih boyutu.",
        columns: [
          {
            name: "week_key",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          { name: "week_start", dataType: "DATE", nullable: false },
        ],
      },
      {
        name: "dim_channel",
        description: "Raporlanması gereken satış kanalları.",
        columns: [
          {
            name: "channel_id",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          { name: "channel_name", dataType: "TEXT", nullable: false },
        ],
      },
      {
        name: "fact_orders",
        description: "Hafta ve kanal anahtarlarıyla satış siparişi olayları.",
        columns: [
          {
            name: "order_key",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          {
            name: "week_key",
            dataType: "INTEGER",
            nullable: false,
            references: { table: "dim_week", column: "week_key" },
          },
          {
            name: "channel_id",
            dataType: "INTEGER",
            nullable: false,
            references: { table: "dim_channel", column: "channel_id" },
          },
          { name: "revenue", dataType: "NUMERIC(12,2)", nullable: false },
        ],
      },
    ],
    relationships: [
      {
        fromTable: "fact_orders",
        fromColumn: "week_key",
        toTable: "dim_week",
        toColumn: "week_key",
      },
      {
        fromTable: "fact_orders",
        fromColumn: "channel_id",
        toTable: "dim_channel",
        toColumn: "channel_id",
      },
    ],
  },
  sampleRows: [
    {
      tableName: "dim_week",
      rows: [
        { week_key: 1, week_start: "2026-05-04" },
        { week_key: 2, week_start: "2026-05-11" },
      ],
    },
    {
      tableName: "dim_channel",
      rows: [
        { channel_id: 10, channel_name: "Web" },
        { channel_id: 11, channel_name: "Marketplace" },
        { channel_id: 12, channel_name: "Store" },
      ],
    },
    {
      tableName: "fact_orders",
      rows: [
        { order_key: 9301, week_key: 1, channel_id: 10, revenue: 120 },
        { order_key: 9303, week_key: 1, channel_id: 11, revenue: 150 },
        { order_key: 9304, week_key: 2, channel_id: 10, revenue: 90 },
      ],
    },
  ],
  expectedColumns: ["week_start", "channel_name", "order_count", "revenue"],
  validationMode: "result-and-concepts",
  expectedResult: [
    ["2026-05-04", "Marketplace", 1, 150],
    ["2026-05-04", "Store", 0, 0],
    ["2026-05-04", "Web", 2, 200],
    ["2026-05-11", "Marketplace", 0, 0],
    ["2026-05-11", "Store", 2, 100],
    ["2026-05-11", "Web", 1, 90],
  ],
  orderSensitive: true,
  requiredConcepts: [
    "CTE",
    "LEFT_JOIN",
    "COUNT",
    "SUM",
    "GROUP_BY",
    "ORDER_BY",
  ],
  forbiddenOperations: [...READ_ONLY_FORBIDDEN],
  hints: [
    "Önce dim_week CROSS JOIN dim_channel ile iki hafta × üç kanaldan oluşan altı satırlık kapsam omurgasını kur.",
    "Fact olaylarını ayrı bir CTE'de week_start ve channel_id tanesinde COUNT ve SUM ile özetle; ham fact'i omurgaya doğrudan bağlama.",
    "coverage ve order_totals CTE'lerini kur, iki anahtarla LEFT JOIN et, COALESCE ile eksik ölçüleri 0 yap ve hafta–kanal sırasını uygula.",
  ],
  explanation:
    "Kapsama omurgası raporda bulunması gereken tüm boyut kombinasyonlarını tanımlar. Fact'i önce aynı tanede özetlemek join cardinality'sini bire bir yapar; LEFT JOIN ve COALESCE olay yokluğunu kayıp satır yerine ölçülebilir sıfıra dönüştürür.",
  completionMessage:
    "Altı hafta–kanal hücresi eksiksiz üretildi; grafik artık gerçek sıfırları veri boşluğundan ayırabiliyor.",
  nextTaskId: "m10-t1",
});

export const module9ExpansionTasks: LessonTask[] = [
  currentCustomerSegmentTask,
  orphanSalesAuditTask,
  weeklyChannelMartTask,
];

const customerChurnQueueTask = createTask({
  id: "m10-t2",
  slug: "build-customer-churn-queue",
  moduleId: "module-10",
  title: "Müşteri kayıp risk kuyruğunu kur",
  subtitle:
    "Kullanım sessizliği ve destek yükünü tek aksiyon tanesinde birleştir.",
  scenario:
    "Müşteri başarı ekibi 1 Haziran 2026 görüşmelerini planlıyor. Yalnız aktif aboneleri, son kullanımlarını ve açık destek taleplerini satır çoğalması olmadan tek bir risk kuyruğunda görmek istiyor.",
  objective:
    "Aktif aboneleri kapsam olarak al. usage_events içinden müşteri başına son event_date, support_tickets içinden müşteri başına açık talep sayısı üret ve özetleri LEFT JOIN et. customer_name, last_activity_date, inactive_days, open_ticket_count ve risk_level kolonlarını getir. Kullanımı yoksa tarih ve gün NULL fakat risk Yüksek olsun; 45+ gün veya 2+ açık talep Yüksek, 30+ gün veya 1 açık talep Orta, diğerleri Düşük olsun. Yüksek–Orta–Düşük risk sırala; aynı riskte kullanımı hiç olmayanı önce, ardından inactive_days azalan ve müşteri adı artan getir.",
  difficulty: "advanced",
  estimatedMinutes: 28,
  prerequisites: ["m10-t1"],
  concepts: [
    "REPORTING",
    "CTE",
    "LEFT_JOIN",
    "MULTI_JOIN",
    "MAX",
    "COUNT",
    "CASE",
    "ORDER_BY",
  ],
  setupSql: `
    CREATE TABLE customers (
      customer_id INTEGER PRIMARY KEY,
      customer_name TEXT NOT NULL
    );
    CREATE TABLE subscriptions (
      subscription_id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
      status TEXT NOT NULL CHECK (status IN ('active', 'cancelled'))
    );
    CREATE TABLE usage_events (
      event_id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
      event_date DATE NOT NULL
    );
    CREATE TABLE support_tickets (
      ticket_id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
      status TEXT NOT NULL CHECK (status IN ('open', 'closed'))
    );
    INSERT INTO customers VALUES
      (1, 'Atlas Market'),
      (2, 'Boreal Studio'),
      (3, 'Ceres Labs'),
      (4, 'Delta Works'),
      (5, 'Eon Retail'),
      (6, 'Fora Design'),
      (7, 'Gama Foods');
    INSERT INTO subscriptions VALUES
      (101, 1, 'active'),
      (102, 2, 'active'),
      (103, 3, 'active'),
      (104, 4, 'active'),
      (105, 5, 'active'),
      (106, 6, 'cancelled'),
      (107, 7, 'active');
    INSERT INTO usage_events VALUES
      (501, 1, DATE '2026-05-20'),
      (502, 1, DATE '2026-05-28'),
      (503, 2, DATE '2026-03-15'),
      (504, 2, DATE '2026-04-10'),
      (505, 4, DATE '2026-05-02'),
      (506, 5, DATE '2026-05-31'),
      (507, 6, DATE '2026-02-01'),
      (508, 7, DATE '2026-05-30');
    INSERT INTO support_tickets VALUES
      (701, 1, 'open'),
      (702, 7, 'open'),
      (703, 7, 'open'),
      (704, 2, 'closed'),
      (705, 3, 'closed'),
      (706, 6, 'open');
  `,
  schema: {
    tables: [
      {
        name: "customers",
        description: "Müşteri ana verisi.",
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
        name: "subscriptions",
        description: "Risk kuyruğunun aktif müşteri kapsamını belirler.",
        columns: [
          {
            name: "subscription_id",
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
          { name: "status", dataType: "TEXT", nullable: false },
        ],
      },
      {
        name: "usage_events",
        description: "Müşterinin ürünü kullandığı tarihsel hareketler.",
        columns: [
          {
            name: "event_id",
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
          { name: "event_date", dataType: "DATE", nullable: false },
        ],
      },
      {
        name: "support_tickets",
        description: "Müşterinin açık ve kapanmış destek kayıtları.",
        columns: [
          {
            name: "ticket_id",
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
          { name: "status", dataType: "TEXT", nullable: false },
        ],
      },
    ],
    relationships: [
      {
        fromTable: "subscriptions",
        fromColumn: "customer_id",
        toTable: "customers",
        toColumn: "customer_id",
      },
      {
        fromTable: "usage_events",
        fromColumn: "customer_id",
        toTable: "customers",
        toColumn: "customer_id",
      },
      {
        fromTable: "support_tickets",
        fromColumn: "customer_id",
        toTable: "customers",
        toColumn: "customer_id",
      },
    ],
  },
  sampleRows: [
    {
      tableName: "subscriptions",
      rows: [
        { subscription_id: 101, customer_id: 1, status: "active" },
        { subscription_id: 103, customer_id: 3, status: "active" },
        { subscription_id: 106, customer_id: 6, status: "cancelled" },
      ],
    },
    {
      tableName: "usage_events",
      rows: [
        { event_id: 501, customer_id: 1, event_date: "2026-05-20" },
        { event_id: 502, customer_id: 1, event_date: "2026-05-28" },
        { event_id: 505, customer_id: 4, event_date: "2026-05-02" },
      ],
    },
    {
      tableName: "support_tickets",
      rows: [
        { ticket_id: 702, customer_id: 7, status: "open" },
        { ticket_id: 703, customer_id: 7, status: "open" },
        { ticket_id: 704, customer_id: 2, status: "closed" },
      ],
    },
  ],
  expectedColumns: [
    "customer_name",
    "last_activity_date",
    "inactive_days",
    "open_ticket_count",
    "risk_level",
  ],
  validationMode: "result-and-concepts",
  expectedResult: [
    ["Ceres Labs", null, null, 0, "Yüksek"],
    ["Boreal Studio", "2026-04-10", 52, 0, "Yüksek"],
    ["Gama Foods", "2026-05-30", 2, 2, "Yüksek"],
    ["Delta Works", "2026-05-02", 30, 0, "Orta"],
    ["Atlas Market", "2026-05-28", 4, 1, "Orta"],
    ["Eon Retail", "2026-05-31", 1, 0, "Düşük"],
  ],
  orderSensitive: true,
  requiredConcepts: [
    "CTE",
    "LEFT_JOIN",
    "MULTI_JOIN",
    "MAX",
    "COUNT",
    "CASE",
    "ORDER_BY",
  ],
  forbiddenOperations: [...READ_ONLY_FORBIDDEN],
  hints: [
    "Önce aktif abonelik kapsamını, son kullanım tarihini ve açık talep sayısını ayrı müşteri-taneli CTE'lerde üret.",
    "Hareketi olmayan aktif müşteriyi korumak için özetleri LEFT JOIN et; gün farkını sabit DATE '2026-06-01' üzerinden hesapla.",
    "signals CTE'sinden sonra ikinci bir risked CTE kur; NULL, 45/2 ve 30/1 eşiklerini CASE içinde bu öncelikle değerlendirip özel risk sırasını uygula.",
  ],
  explanation:
    "Her hareket kaynağını join öncesinde müşteri başına tek satıra indirmek kullanım × destek fanout'unu engeller. Aktif kapsamdan başlayan LEFT JOIN sessiz müşteriyi korur; sabit tarih ve açık CASE eşikleri risk kuyruğunu tekrar üretilebilir ve açıklanabilir yapar.",
  completionMessage:
    "Aktif müşteriler satır çoğalması olmadan risk sırasına alındı; ekip görüşme kuyruğunu kanıtlarıyla görebiliyor.",
  nextTaskId: "m10-t3",
});

const campaignProfitabilityTask = createTask({
  id: "m10-t3",
  slug: "reconcile-campaign-profitability",
  moduleId: "module-10",
  title: "Kampanya kârlılığını mutabıklaştır",
  subtitle: "Üç çoklu kaynağı fanout üretmeden aynı karar tanesinde buluştur.",
  scenario:
    "Pazarlama yöneticisi kampanya bazında harcama, iade sonrası net gelir, kâr ve ROAS istiyor. Her kaynakta birden fazla hareket bulunduğu için ham join rakamları sessizce şişirebilir.",
  objective:
    "spend_events, attributed_orders ve refunds tablolarını ayrı CTE'lerde campaign_id bazında topla; özetleri campaigns kapsamına LEFT JOIN et. campaign_name, total_spend, net_revenue, profit ve roas kolonlarını getir. net_revenue brüt sipariş geliri eksi iade, profit net gelir eksi harcama olsun; harcama 0 ise roas 0 olsun. Kâra göre azalan, sonra kampanya adına göre artan sırala.",
  difficulty: "advanced",
  estimatedMinutes: 32,
  prerequisites: ["m10-t2"],
  concepts: [
    "REPORTING",
    "CTE",
    "LEFT_JOIN",
    "MULTI_JOIN",
    "SUM",
    "GROUP_BY",
    "CASE",
    "ARITHMETIC",
    "ORDER_BY",
  ],
  setupSql: `
    CREATE TABLE campaigns (
      campaign_id INTEGER PRIMARY KEY,
      campaign_name TEXT NOT NULL
    );
    CREATE TABLE spend_events (
      spend_id INTEGER PRIMARY KEY,
      campaign_id INTEGER NOT NULL REFERENCES campaigns(campaign_id),
      spend_amount NUMERIC(12, 2) NOT NULL
    );
    CREATE TABLE attributed_orders (
      order_id INTEGER PRIMARY KEY,
      campaign_id INTEGER NOT NULL REFERENCES campaigns(campaign_id),
      gross_revenue NUMERIC(12, 2) NOT NULL
    );
    CREATE TABLE refunds (
      refund_id INTEGER PRIMARY KEY,
      campaign_id INTEGER NOT NULL REFERENCES campaigns(campaign_id),
      refund_amount NUMERIC(12, 2) NOT NULL
    );
    INSERT INTO campaigns VALUES
      (1, 'Spring Search'),
      (2, 'Marketplace Boost'),
      (3, 'Dormant Retarget'),
      (4, 'Organic Referral');
    INSERT INTO spend_events VALUES
      (201, 1, 200.00),
      (202, 1, 100.00),
      (203, 2, 400.00),
      (204, 2, 250.00),
      (205, 3, 150.00);
    INSERT INTO attributed_orders VALUES
      (301, 1, 700.00),
      (302, 1, 500.00),
      (303, 2, 900.00),
      (304, 2, 600.00),
      (305, 4, 400.00);
    INSERT INTO refunds VALUES
      (401, 1, 100.00),
      (402, 1, 50.00),
      (403, 2, 150.00),
      (404, 2, 50.00);
  `,
  schema: {
    tables: [
      {
        name: "campaigns",
        description: "Rapor kapsamındaki kampanya ana listesi.",
        columns: [
          {
            name: "campaign_id",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          { name: "campaign_name", dataType: "TEXT", nullable: false },
        ],
      },
      {
        name: "spend_events",
        description: "Kampanya bütçe harcamaları.",
        columns: [
          {
            name: "spend_id",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          {
            name: "campaign_id",
            dataType: "INTEGER",
            nullable: false,
            references: { table: "campaigns", column: "campaign_id" },
          },
          { name: "spend_amount", dataType: "NUMERIC(12,2)", nullable: false },
        ],
      },
      {
        name: "attributed_orders",
        description: "Kampanyaya ilişkilendirilmiş brüt sipariş gelirleri.",
        columns: [
          {
            name: "order_id",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          {
            name: "campaign_id",
            dataType: "INTEGER",
            nullable: false,
            references: { table: "campaigns", column: "campaign_id" },
          },
          { name: "gross_revenue", dataType: "NUMERIC(12,2)", nullable: false },
        ],
      },
      {
        name: "refunds",
        description: "Kampanyaya mutabıklaştırılmış iade hareketleri.",
        columns: [
          {
            name: "refund_id",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
          },
          {
            name: "campaign_id",
            dataType: "INTEGER",
            nullable: false,
            references: { table: "campaigns", column: "campaign_id" },
          },
          { name: "refund_amount", dataType: "NUMERIC(12,2)", nullable: false },
        ],
      },
    ],
    relationships: [
      {
        fromTable: "spend_events",
        fromColumn: "campaign_id",
        toTable: "campaigns",
        toColumn: "campaign_id",
      },
      {
        fromTable: "attributed_orders",
        fromColumn: "campaign_id",
        toTable: "campaigns",
        toColumn: "campaign_id",
      },
      {
        fromTable: "refunds",
        fromColumn: "campaign_id",
        toTable: "campaigns",
        toColumn: "campaign_id",
      },
    ],
  },
  sampleRows: [
    {
      tableName: "spend_events",
      rows: [
        { spend_id: 201, campaign_id: 1, spend_amount: 200 },
        { spend_id: 202, campaign_id: 1, spend_amount: 100 },
      ],
    },
    {
      tableName: "attributed_orders",
      rows: [
        { order_id: 301, campaign_id: 1, gross_revenue: 700 },
        { order_id: 302, campaign_id: 1, gross_revenue: 500 },
        { order_id: 305, campaign_id: 4, gross_revenue: 400 },
      ],
    },
    {
      tableName: "refunds",
      rows: [
        { refund_id: 401, campaign_id: 1, refund_amount: 100 },
        { refund_id: 402, campaign_id: 1, refund_amount: 50 },
      ],
    },
  ],
  expectedColumns: [
    "campaign_name",
    "total_spend",
    "net_revenue",
    "profit",
    "roas",
  ],
  validationMode: "result-and-concepts",
  expectedResult: [
    ["Spring Search", 300, 1050, 750, 3.5],
    ["Marketplace Boost", 650, 1300, 650, 2],
    ["Organic Referral", 0, 400, 400, 0],
    ["Dormant Retarget", 150, 0, -150, 0],
  ],
  orderSensitive: true,
  requiredConcepts: [
    "CTE",
    "LEFT_JOIN",
    "MULTI_JOIN",
    "SUM",
    "GROUP_BY",
    "CASE",
    "ARITHMETIC",
    "ORDER_BY",
  ],
  forbiddenOperations: [...READ_ONLY_FORBIDDEN],
  validationOptions: { numericTolerance: 0.01 },
  hints: [
    "Harcama, sipariş ve iadeyi aynı ham join'de buluşturma; her kaynak için campaign_id başına tek satır üreten ayrı SUM CTE'si kur.",
    "campaigns kapsamından başlayıp üç özeti LEFT JOIN et; eksikleri COALESCE ile 0'a çevirerek net gelir ve kârı hesapla.",
    "Bir metrics CTE'sinde total_spend ve net_revenue üret; dış SELECT'te profit ve CASE/NULLIF korumalı ROAS hesaplayıp profit DESC, campaign_name sırasını uygula.",
  ],
  explanation:
    "Bağımsız ön-toplamalar her child kaynağı campaign_id başına tek satıra indirir; son join bire bir özet eşleşmelerinden oluşur ve fanout toplamları şişiremez. Ana kampanya kapsamı siparişsiz ve sıfır harcamalı edge case'leri görünür tutar.",
  completionMessage:
    "Kampanya harcaması, net geliri ve kârı fanout olmadan mutabıklaştırıldı; bütçe kararı güvenilir bir taneye oturdu.",
  nextTaskId: "m10-t4",
});

const operationsEarlyWarningTask = createTask({
  id: "m10-t4",
  slug: "build-operations-early-warning",
  moduleId: "module-10",
  title: "Operasyon erken uyarı panelini hazırla",
  subtitle:
    "Günlük olayları, biriken yükü ve değişim yönünü tek final tesliminde birleştir.",
  scenario:
    "Operasyon direktörü şube bazında günlük iş yükünün birikip birikmediğini, gecikmenin önceki güne göre kötüleşip kötüleşmediğini ve kritik olayları tek panelde görmek istiyor.",
  objective:
    "incidents verisini önce branch_id ve incident_date tanesinde incident_count ve critical_count olarak özetle. daily_operations, branches ve capacity_targets ile birleştir; backlog_delta = incoming_count - resolved_count, running_backlog = şube içinde tarih sıralı kümülatif fark, delay_change = avg_delay_hours - önceki gün değeri olsun. Kritik olay, limit üstü backlog veya 2+ saat kötüleşmede Acil; backlog limitinin %70'ini aşan birikim, pozitif gecikme değişimi veya herhangi bir olayda İzle; aksi halde Normal yaz. branch_name, operation_date, backlog_delta, running_backlog, delay_change, incident_count ve alert_status kolonlarını getir; şube ve tarihe göre artan sırala.",
  difficulty: "advanced",
  estimatedMinutes: 36,
  prerequisites: ["m10-t3"],
  concepts: [
    "REPORTING",
    "CTE",
    "LEFT_JOIN",
    "MULTI_JOIN",
    "SUM",
    "COUNT",
    "GROUP_BY",
    "LAG",
    "PARTITION_BY",
    "RUNNING_TOTAL",
    "CASE",
    "ORDER_BY",
  ],
  setupSql: `
    CREATE TABLE branches (
      branch_id INTEGER PRIMARY KEY,
      branch_name TEXT NOT NULL
    );
    CREATE TABLE capacity_targets (
      branch_id INTEGER PRIMARY KEY REFERENCES branches(branch_id),
      backlog_limit INTEGER NOT NULL CHECK (backlog_limit > 0)
    );
    CREATE TABLE daily_operations (
      branch_id INTEGER NOT NULL REFERENCES branches(branch_id),
      operation_date DATE NOT NULL,
      incoming_count INTEGER NOT NULL,
      resolved_count INTEGER NOT NULL,
      avg_delay_hours NUMERIC(6, 2) NOT NULL,
      PRIMARY KEY (branch_id, operation_date)
    );
    CREATE TABLE incidents (
      incident_id INTEGER PRIMARY KEY,
      branch_id INTEGER NOT NULL REFERENCES branches(branch_id),
      incident_date DATE NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('minor', 'critical'))
    );
    INSERT INTO branches VALUES
      (1, 'Ankara Hub'),
      (2, 'Istanbul Hub'),
      (3, 'Bursa Hub'),
      (4, 'Izmir Hub'),
      (5, 'Konya Hub');
    INSERT INTO capacity_targets VALUES
      (1, 8),
      (2, 10),
      (3, 5),
      (4, 100),
      (5, 100);
    INSERT INTO daily_operations VALUES
      (1, DATE '2026-05-01', 5, 5, 1.00),
      (1, DATE '2026-05-02', 7, 3, 1.50),
      (1, DATE '2026-05-03', 2, 6, 1.00),
      (2, DATE '2026-05-01', 8, 5, 2.00),
      (2, DATE '2026-05-02', 10, 4, 2.00),
      (2, DATE '2026-05-03', 12, 3, 6.00),
      (3, DATE '2026-05-01', 3, 0, 1.00),
      (3, DATE '2026-05-02', 3, 0, 1.00),
      (4, DATE '2026-05-01', 5, 5, 1.00),
      (4, DATE '2026-05-02', 5, 5, 3.50),
      (5, DATE '2026-05-01', 4, 4, 1.00);
    INSERT INTO incidents VALUES
      (801, 1, DATE '2026-05-03', 'critical'),
      (802, 5, DATE '2026-05-01', 'minor'),
      (803, 2, DATE '2026-05-03', 'critical'),
      (804, 2, DATE '2026-05-03', 'minor');
  `,
  schema: {
    tables: [
      {
        name: "branches",
        description: "Operasyon şubeleri.",
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
        name: "capacity_targets",
        description: "Şubenin kabul edilebilir birikmiş iş sınırı.",
        columns: [
          {
            name: "branch_id",
            dataType: "INTEGER",
            nullable: false,
            primaryKey: true,
            references: { table: "branches", column: "branch_id" },
          },
          { name: "backlog_limit", dataType: "INTEGER", nullable: false },
        ],
      },
      {
        name: "daily_operations",
        description:
          "Şube ve gün tanesinde gelen, çözülen iş ve gecikme ölçüleri.",
        columns: [
          {
            name: "branch_id",
            dataType: "INTEGER",
            nullable: false,
            references: { table: "branches", column: "branch_id" },
          },
          { name: "operation_date", dataType: "DATE", nullable: false },
          { name: "incoming_count", dataType: "INTEGER", nullable: false },
          { name: "resolved_count", dataType: "INTEGER", nullable: false },
          {
            name: "avg_delay_hours",
            dataType: "NUMERIC(6,2)",
            nullable: false,
          },
        ],
      },
      {
        name: "incidents",
        description:
          "Şube gününde sıfır, bir veya birden fazla operasyon olayı.",
        columns: [
          {
            name: "incident_id",
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
          { name: "incident_date", dataType: "DATE", nullable: false },
          { name: "severity", dataType: "TEXT", nullable: false },
        ],
      },
    ],
    relationships: [
      {
        fromTable: "daily_operations",
        fromColumn: "branch_id",
        toTable: "branches",
        toColumn: "branch_id",
      },
      {
        fromTable: "capacity_targets",
        fromColumn: "branch_id",
        toTable: "branches",
        toColumn: "branch_id",
      },
      {
        fromTable: "incidents",
        fromColumn: "branch_id",
        toTable: "branches",
        toColumn: "branch_id",
      },
    ],
  },
  sampleRows: [
    {
      tableName: "daily_operations",
      rows: [
        {
          branch_id: 2,
          operation_date: "2026-05-01",
          incoming_count: 8,
          resolved_count: 5,
          avg_delay_hours: 2,
        },
        {
          branch_id: 2,
          operation_date: "2026-05-02",
          incoming_count: 10,
          resolved_count: 4,
          avg_delay_hours: 2,
        },
      ],
    },
    {
      tableName: "incidents",
      rows: [
        {
          incident_id: 802,
          branch_id: 5,
          incident_date: "2026-05-01",
          severity: "minor",
        },
        {
          incident_id: 803,
          branch_id: 2,
          incident_date: "2026-05-03",
          severity: "critical",
        },
        {
          incident_id: 804,
          branch_id: 2,
          incident_date: "2026-05-03",
          severity: "minor",
        },
      ],
    },
  ],
  expectedColumns: [
    "branch_name",
    "operation_date",
    "backlog_delta",
    "running_backlog",
    "delay_change",
    "incident_count",
    "alert_status",
  ],
  validationMode: "result-and-concepts",
  expectedResult: [
    ["Ankara Hub", "2026-05-01", 0, 0, null, 0, "Normal"],
    ["Ankara Hub", "2026-05-02", 4, 4, 0.5, 0, "İzle"],
    ["Ankara Hub", "2026-05-03", -4, 0, -0.5, 1, "Acil"],
    ["Bursa Hub", "2026-05-01", 3, 3, null, 0, "Normal"],
    ["Bursa Hub", "2026-05-02", 3, 6, 0, 0, "Acil"],
    ["Istanbul Hub", "2026-05-01", 3, 3, null, 0, "Normal"],
    ["Istanbul Hub", "2026-05-02", 6, 9, 0, 0, "İzle"],
    ["Istanbul Hub", "2026-05-03", 9, 18, 4, 2, "Acil"],
    ["Izmir Hub", "2026-05-01", 0, 0, null, 0, "Normal"],
    ["Izmir Hub", "2026-05-02", 0, 0, 2.5, 0, "Acil"],
    ["Konya Hub", "2026-05-01", 0, 0, null, 1, "İzle"],
  ],
  orderSensitive: true,
  requiredConcepts: [
    "CTE",
    "LEFT_JOIN",
    "MULTI_JOIN",
    "SUM",
    "COUNT",
    "GROUP_BY",
    "LAG",
    "PARTITION_BY",
    "RUNNING_TOTAL",
    "CASE",
    "ORDER_BY",
  ],
  forbiddenOperations: [...READ_ONLY_FORBIDDEN],
  validationOptions: { numericTolerance: 0.01 },
  hints: [
    "Önce incidents tablosunu branch_id ve incident_date tanesinde incident_count ile critical_count olarak özetle; ham olayları günlük tabloya bağlama.",
    "base CTE'de günlük delta ve olay sayılarını kur; sonraki CTE'de SUM(delta) OVER ve LAG(avg_delay_hours) OVER ifadelerini aynı branch/date penceresinde hesapla.",
    "Window sonuçlarını dış SELECT'te CASE eşiklerine çevir; kritik/limit/2 saat kuralını İzle koşullarından önce yaz ve branch_name, operation_date sırasını uygula.",
  ],
  explanation:
    "Olayları join öncesinde branch-date tanesine indirmek günlük satırın çoğalmasını engeller. Aynı PARTITION BY ve tarih sırası running backlog ile LAG karşılaştırmasını şubeye izole eder; dış CASE ise ölçüleri açık öncelikli bir operasyon kararına dönüştürür.",
  completionMessage:
    "Kontrol kulesi hazır: günlük hareket, biriken yük, gecikme yönü ve olay etkisi tek güvenilir şube-gün karar setinde birleşti.",
  nextTaskId: "m11-t1",
});

export const module10ExpansionTasks: LessonTask[] = [
  customerChurnQueueTask,
  campaignProfitabilityTask,
  operationsEarlyWarningTask,
];
