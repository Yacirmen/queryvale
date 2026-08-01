import type {
  ForbiddenOperation,
  LessonLearningContent,
} from "../types/lesson";
import type { AuthoredTask } from "./curriculumTaskFactory";
import { createProjectLearningContent } from "./createProjectLearningContent";

const MARKETING_PROJECT_READ_ONLY_FORBIDDEN = [
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
] satisfies ForbiddenOperation[];

export const MARKETING_PROJECT_SOLUTIONS_PART_TWO: Record<string, string> = {
  "m11-t7": `
    WITH cohort_members AS (
      SELECT
        c.customer_id,
        DATE_TRUNC('month', c.signup_date)::date AS cohort_month,
        ch.channel_name
      FROM customers c
      INNER JOIN customer_acquisition ca
        ON ca.customer_id = c.customer_id
      INNER JOIN acquisition_channels ch
        ON ch.channel_id = ca.channel_id
    ),
    retained_customers AS (
      SELECT DISTINCT
        cm.customer_id,
        cm.cohort_month,
        cm.channel_name
      FROM cohort_members cm
      INNER JOIN activities a
        ON a.customer_id = cm.customer_id
       AND a.activity_date >= cm.cohort_month + INTERVAL '1 month'
       AND a.activity_date < cm.cohort_month + INTERVAL '2 months'
    ),
    cohort_metrics AS (
      SELECT
        cm.cohort_month,
        cm.channel_name,
        COUNT(DISTINCT cm.customer_id) AS cohort_size,
        COUNT(DISTINCT rc.customer_id) AS retained_m1
      FROM cohort_members cm
      LEFT JOIN retained_customers rc
        ON rc.customer_id = cm.customer_id
       AND rc.cohort_month = cm.cohort_month
       AND rc.channel_name = cm.channel_name
      GROUP BY cm.cohort_month, cm.channel_name
    )
    SELECT
      cohort_month,
      channel_name,
      cohort_size,
      retained_m1,
      ROUND(retained_m1 * 100.0 / cohort_size, 2) AS retention_rate
    FROM cohort_metrics
    ORDER BY cohort_month, channel_name;
  `,
  "m11-t8": `
    WITH activity_gaps AS (
      SELECT
        customer_id,
        event_date,
        LAG(event_date) OVER (
          PARTITION BY customer_id
          ORDER BY event_date
        ) AS previous_activity_date
      FROM activity_events
      WHERE event_date <= DATE '2026-06-30'
    ),
    ranked_activity AS (
      SELECT
        customer_id,
        event_date AS last_activity_date,
        previous_activity_date,
        ROW_NUMBER() OVER (
          PARTITION BY customer_id
          ORDER BY event_date DESC
        ) AS activity_rank
      FROM activity_gaps
    ),
    latest_activity AS (
      SELECT customer_id, last_activity_date, previous_activity_date
      FROM ranked_activity
      WHERE activity_rank = 1
    ),
    valid_cancellations AS (
      SELECT customer_id, MIN(cancellation_date) AS cancellation_date
      FROM cancellation_events
      WHERE cancellation_date <= DATE '2026-06-30'
      GROUP BY customer_id
    ),
    lifecycle AS (
      SELECT
        c.customer_name,
        c.segment,
        a.last_activity_date,
        CASE
          WHEN a.last_activity_date IS NULL THEN NULL
          ELSE DATE '2026-06-30' - a.last_activity_date
        END AS inactive_days,
        CASE
          WHEN x.cancellation_date IS NOT NULL THEN 'Churned'
          WHEN a.last_activity_date >= DATE '2026-06-01'
            AND a.previous_activity_date IS NOT NULL
            AND a.last_activity_date - a.previous_activity_date >= 60
            THEN 'Reactivated'
          WHEN s.status = 'active'
            AND (a.last_activity_date IS NULL
              OR a.last_activity_date < DATE '2026-05-01')
            THEN 'Risk'
          ELSE 'Healthy'
        END AS lifecycle_status
      FROM customers c
      INNER JOIN subscriptions s ON s.customer_id = c.customer_id
      LEFT JOIN latest_activity a ON a.customer_id = c.customer_id
      LEFT JOIN valid_cancellations x ON x.customer_id = c.customer_id
      WHERE s.started_at <= DATE '2026-06-30'
    )
    SELECT
      customer_name,
      segment,
      last_activity_date,
      inactive_days,
      lifecycle_status
    FROM lifecycle
    ORDER BY
      CASE lifecycle_status
        WHEN 'Churned' THEN 1
        WHEN 'Reactivated' THEN 2
        WHEN 'Risk' THEN 3
        ELSE 4
      END,
      inactive_days DESC NULLS FIRST,
      customer_name;
  `,
  "m11-t9": `
    WITH eligible_campaigns AS (
      SELECT DISTINCT
        o.order_id,
        o.revenue,
        t.campaign_id
      FROM orders o
      INNER JOIN touchpoints t
        ON t.customer_id = o.customer_id
       AND t.touch_date BETWEEN o.order_date - INTERVAL '30 days'
                            AND o.order_date
    ),
    campaign_count_per_order AS (
      SELECT order_id, COUNT(*) AS campaign_count
      FROM eligible_campaigns
      GROUP BY order_id
    ),
    allocated AS (
      SELECT
        e.order_id,
        e.campaign_id,
        e.revenue / c.campaign_count AS attributed_revenue
      FROM eligible_campaigns e
      INNER JOIN campaign_count_per_order c ON c.order_id = e.order_id
    ),
    campaign_totals AS (
      SELECT
        campaign_id,
        COUNT(DISTINCT order_id) AS attributed_orders,
        SUM(attributed_revenue) AS attributed_revenue
      FROM allocated
      GROUP BY campaign_id
    ),
    report AS (
      SELECT
        c.campaign_name,
        COALESCE(t.attributed_orders, 0) AS attributed_orders,
        COALESCE(t.attributed_revenue, 0) AS attributed_revenue
      FROM campaigns c
      LEFT JOIN campaign_totals t ON t.campaign_id = c.campaign_id
    )
    SELECT
      campaign_name,
      attributed_orders,
      ROUND(attributed_revenue, 2) AS attributed_revenue,
      ROUND(
        attributed_revenue * 100.0 /
          NULLIF(SUM(attributed_revenue) OVER (), 0),
        2
      ) AS revenue_share_pct
    FROM report
    ORDER BY attributed_revenue DESC, campaign_name;
  `,
  "m11-t10": `
    WITH converted_users AS (
      SELECT DISTINCT a.experiment_id, a.customer_id
      FROM experiment_assignments a
      INNER JOIN experiments e ON e.experiment_id = a.experiment_id
      INNER JOIN conversions c
        ON c.customer_id = a.customer_id
       AND c.converted_at >= GREATEST(e.start_date, a.assigned_at)
       AND c.converted_at <= e.end_date
    ),
    experiment_metrics AS (
      SELECT
        e.experiment_id,
        e.experiment_name,
        COUNT(*) FILTER (WHERE a.variant = 'treatment') AS treatment_users,
        COUNT(*) FILTER (WHERE a.variant = 'control') AS control_users,
        COUNT(c.customer_id) FILTER (
          WHERE a.variant = 'treatment'
        ) AS treatment_converters,
        COUNT(c.customer_id) FILTER (
          WHERE a.variant = 'control'
        ) AS control_converters
      FROM experiments e
      INNER JOIN experiment_assignments a
        ON a.experiment_id = e.experiment_id
      LEFT JOIN converted_users c
        ON c.experiment_id = a.experiment_id
       AND c.customer_id = a.customer_id
      GROUP BY e.experiment_id, e.experiment_name
    ),
    rates AS (
      SELECT
        *,
        ROUND(treatment_converters * 100.0 / treatment_users, 2)
          AS treatment_rate,
        CASE
          WHEN control_users = 0 THEN 0
          ELSE ROUND(control_converters * 100.0 / control_users, 2)
        END AS control_rate
      FROM experiment_metrics
    )
    SELECT
      experiment_name,
      treatment_users,
      control_users,
      treatment_rate,
      control_rate,
      CASE
        WHEN control_users = 0 THEN 0
        ELSE ROUND(treatment_rate - control_rate, 2)
      END AS lift_pp,
      CASE
        WHEN control_users = 0 THEN 0
        ELSE ROUND(
          treatment_converters -
            treatment_users * control_converters::numeric / control_users,
          2
        )
      END AS incremental_conversions,
      CASE
        WHEN control_users = 0 THEN 'Yetersiz kontrol'
        WHEN treatment_rate - control_rate >= 10 THEN 'Büyüt'
        WHEN treatment_rate - control_rate <= -5 THEN 'Durdur'
        ELSE 'Nötr'
      END AS decision
    FROM rates
    ORDER BY experiment_name;
  `,
  "m11-t11": `
    WITH spend_periods AS (
      SELECT
        channel_id,
        COALESCE(SUM(spend_amount) FILTER (
          WHERE spend_date BETWEEN DATE '2026-06-01' AND DATE '2026-06-07'
        ), 0) AS previous_spend,
        COALESCE(SUM(spend_amount) FILTER (
          WHERE spend_date BETWEEN DATE '2026-06-08' AND DATE '2026-06-14'
        ), 0) AS current_spend
      FROM daily_spend
      GROUP BY channel_id
    ),
    conversion_periods AS (
      SELECT
        channel_id,
        COALESCE(SUM(conversion_count) FILTER (
          WHERE metric_date BETWEEN DATE '2026-06-01' AND DATE '2026-06-07'
        ), 0) AS previous_conversions,
        COALESCE(SUM(conversion_count) FILTER (
          WHERE metric_date BETWEEN DATE '2026-06-08' AND DATE '2026-06-14'
        ), 0) AS current_conversions
      FROM daily_conversions
      GROUP BY channel_id
    ),
    metrics AS (
      SELECT
        c.channel_name,
        b.current_weekly_budget,
        COALESCE(s.current_spend, 0) AS current_spend,
        COALESCE(v.current_conversions, 0) AS current_conversions,
        CASE
          WHEN COALESCE(v.current_conversions, 0) = 0 THEN NULL
          ELSE ROUND(s.current_spend / v.current_conversions, 2)
        END AS current_cac,
        CASE
          WHEN COALESCE(v.previous_conversions, 0) = 0 THEN NULL
          ELSE ROUND(s.previous_spend / v.previous_conversions, 2)
        END AS previous_cac
      FROM channels c
      INNER JOIN channel_budgets b ON b.channel_id = c.channel_id
      LEFT JOIN spend_periods s ON s.channel_id = c.channel_id
      LEFT JOIN conversion_periods v ON v.channel_id = c.channel_id
    ),
    trended AS (
      SELECT
        *,
        CASE
          WHEN current_cac IS NULL OR previous_cac IS NULL THEN NULL
          ELSE ROUND((current_cac - previous_cac) * 100.0 / previous_cac, 2)
        END AS cac_change_pct
      FROM metrics
    ),
    recommendations AS (
      SELECT
        *,
        CASE
          WHEN current_conversions = 0 THEN 'Durdur ve incele'
          WHEN cac_change_pct <= -10 THEN 'Artır'
          WHEN cac_change_pct > 15 THEN 'Azalt'
          ELSE 'Koru'
        END AS recommendation
      FROM trended
    )
    SELECT
      channel_name,
      current_spend AS current_week_spend,
      current_conversions,
      current_cac,
      cac_change_pct,
      recommendation,
      CASE recommendation
        WHEN 'Artır' THEN ROUND(current_weekly_budget * 1.20, 2)
        WHEN 'Azalt' THEN ROUND(current_weekly_budget * 0.80, 2)
        WHEN 'Durdur ve incele' THEN ROUND(current_weekly_budget * 0.50, 2)
        ELSE current_weekly_budget
      END AS proposed_budget
    FROM recommendations
    ORDER BY proposed_budget DESC, channel_name;
  `,
  "m11-t12": `
    WITH spend_by_region AS (
      SELECT region_id, SUM(spend_amount) AS marketing_spend
      FROM marketing_spend
      WHERE spend_date BETWEEN DATE '2026-06-01' AND DATE '2026-06-30'
      GROUP BY region_id
    ),
    new_customers AS (
      SELECT region_id, COUNT(*) AS new_customers
      FROM customers
      WHERE acquired_at BETWEEN DATE '2026-06-01' AND DATE '2026-06-30'
      GROUP BY region_id
    ),
    active_customers AS (
      SELECT c.region_id, COUNT(DISTINCT s.customer_id) AS active_customers
      FROM subscriptions s
      INNER JOIN customers c ON c.customer_id = s.customer_id
      WHERE s.started_at <= DATE '2026-06-30'
        AND (s.cancelled_at IS NULL OR s.cancelled_at > DATE '2026-06-30')
      GROUP BY c.region_id
    ),
    revenue_by_region AS (
      SELECT
        c.region_id,
        SUM(r.gross_amount - r.refund_amount) AS net_revenue
      FROM revenue_events r
      INNER JOIN customers c ON c.customer_id = r.customer_id
      WHERE r.event_date BETWEEN DATE '2026-06-01' AND DATE '2026-06-30'
      GROUP BY c.region_id
    ),
    base AS (
      SELECT
        r.region_name,
        COALESCE(s.marketing_spend, 0) AS marketing_spend,
        COALESCE(n.new_customers, 0) AS new_customers,
        COALESCE(a.active_customers, 0) AS active_customers,
        COALESCE(v.net_revenue, 0) AS net_revenue,
        t.target_new_customers,
        t.target_net_revenue,
        t.max_cac,
        CASE
          WHEN COALESCE(n.new_customers, 0) = 0 THEN NULL
          ELSE ROUND(s.marketing_spend / n.new_customers, 2)
        END AS cac
      FROM regions r
      INNER JOIN growth_targets t ON t.region_id = r.region_id
      LEFT JOIN spend_by_region s ON s.region_id = r.region_id
      LEFT JOIN new_customers n ON n.region_id = r.region_id
      LEFT JOIN active_customers a ON a.region_id = r.region_id
      LEFT JOIN revenue_by_region v ON v.region_id = r.region_id
    ),
    scored AS (
      SELECT
        *,
        ROUND(
          LEAST(new_customers::numeric / target_new_customers, 1) * 40 +
          LEAST(net_revenue / target_net_revenue, 1) * 40 +
          CASE
            WHEN new_customers = 0 THEN 0
            WHEN cac <= max_cac THEN 20
            WHEN cac <= max_cac * 1.20 THEN 10
            ELSE 0
          END,
          1
        ) AS growth_score
      FROM base
    )
    SELECT
      region_name,
      marketing_spend,
      new_customers,
      active_customers,
      net_revenue,
      cac,
      growth_score,
      CASE
        WHEN new_customers >= target_new_customers
          AND net_revenue >= target_net_revenue
          AND cac <= max_cac THEN 'Ölçekle'
        WHEN new_customers < target_new_customers * 0.50
          OR net_revenue < target_net_revenue * 0.80
          OR (new_customers > 0 AND cac > max_cac * 1.20)
          THEN 'Düzelt'
        ELSE 'İzle'
      END AS executive_action
    FROM scored
    ORDER BY growth_score DESC, region_name;
  `,
};

export const MARKETING_PROJECT_TASK_INPUTS_PART_TWO: AuthoredTask[] = [
  {
    id: "m11-t7",
    slug: "cohort-month-one-retention",
    moduleId: "module-11",
    title: "Kohortların ilk ay tutunmasını ölç",
    subtitle:
      "Edinim kanalını koruyarak takip ayındaki gerçek müşteri tutunmasını hesapla.",
    scenario:
      "Büyüme ekibi, yalnız toplam aktif kullanıcıyı değil, her kayıt kohortunun ilk tam takip ayında hangi edinim kanalında tutunduğunu görmek istiyor.",
    objective:
      "Müşterileri signup_date ayı ve acquisition channel tanesinde kohortlara ayır. Kayıt ayını izleyen takvim ayında en az bir activity kaydı bulunan benzersiz müşteriyi retained_m1 say. cohort_month, channel_name, cohort_size, retained_m1 ve yüzde retention_rate kolonlarını getir; kohort ayı ve kanal adına göre artan sırala.",
    difficulty: "advanced",
    estimatedMinutes: 38,
    prerequisites: ["m10-t4"],
    concepts: [
      "REPORTING",
      "CTE",
      "INNER_JOIN",
      "LEFT_JOIN",
      "MULTI_JOIN",
      "DATE_FUNCTION",
      "DISTINCT",
      "COUNT",
      "GROUP_BY",
      "ARITHMETIC",
      "ORDER_BY",
    ],
    setupSql: `
      CREATE TABLE acquisition_channels (
        channel_id INTEGER PRIMARY KEY,
        channel_name TEXT NOT NULL UNIQUE
      );
      CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY,
        customer_name TEXT NOT NULL,
        signup_date DATE NOT NULL
      );
      CREATE TABLE customer_acquisition (
        customer_id INTEGER PRIMARY KEY REFERENCES customers(customer_id),
        channel_id INTEGER NOT NULL REFERENCES acquisition_channels(channel_id)
      );
      CREATE TABLE activities (
        activity_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
        activity_date DATE NOT NULL,
        activity_type TEXT NOT NULL
      );

      INSERT INTO acquisition_channels VALUES
        (1, 'Organic'),
        (2, 'Paid');
      INSERT INTO customers VALUES
        (101, 'Ada', DATE '2026-01-05'),
        (102, 'Bora', DATE '2026-01-20'),
        (103, 'Ceren', DATE '2026-01-18'),
        (104, 'Deniz', DATE '2026-02-02'),
        (105, 'Ekin', DATE '2026-02-10'),
        (106, 'Fidan', DATE '2026-02-15'),
        (107, 'Güneş', DATE '2026-03-01');
      INSERT INTO customer_acquisition VALUES
        (101, 1), (102, 1), (103, 2), (104, 1),
        (105, 2), (106, 2), (107, 1);
      INSERT INTO activities VALUES
        (1001, 101, DATE '2026-02-05', 'session'),
        (1002, 101, DATE '2026-02-18', 'purchase'),
        (1003, 102, DATE '2026-01-25', 'purchase'),
        (1004, 102, DATE '2026-03-01', 'session'),
        (1005, 103, DATE '2026-02-25', 'session'),
        (1006, 104, DATE '2026-03-02', 'purchase'),
        (1007, 105, DATE '2026-03-12', 'session'),
        (1008, 105, DATE '2026-03-20', 'purchase'),
        (1009, 106, DATE '2026-04-01', 'session'),
        (1010, 107, DATE '2026-04-01', 'session');
    `,
    schema: {
      tables: [
        {
          name: "acquisition_channels",
          description: "Müşterinin ilk edinildiği pazarlama kanalı.",
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
          name: "customers",
          description: "Kayıt tarihiyle birlikte müşteri ana listesi.",
          columns: [
            {
              name: "customer_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "customer_name", dataType: "TEXT", nullable: false },
            { name: "signup_date", dataType: "DATE", nullable: false },
          ],
        },
        {
          name: "customer_acquisition",
          description: "Her müşterinin tek ilk edinim kanalı eşlemesi.",
          columns: [
            {
              name: "customer_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
              references: { table: "customers", column: "customer_id" },
            },
            {
              name: "channel_id",
              dataType: "INTEGER",
              nullable: false,
              references: {
                table: "acquisition_channels",
                column: "channel_id",
              },
            },
          ],
        },
        {
          name: "activities",
          description:
            "Aynı müşteri için bir ayda birden çok kez oluşabilen kullanım olayları.",
          columns: [
            {
              name: "activity_id",
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
            { name: "activity_date", dataType: "DATE", nullable: false },
            { name: "activity_type", dataType: "TEXT", nullable: false },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "customer_acquisition",
          fromColumn: "customer_id",
          toTable: "customers",
          toColumn: "customer_id",
        },
        {
          fromTable: "customer_acquisition",
          fromColumn: "channel_id",
          toTable: "acquisition_channels",
          toColumn: "channel_id",
        },
        {
          fromTable: "activities",
          fromColumn: "customer_id",
          toTable: "customers",
          toColumn: "customer_id",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "customers",
        rows: [
          { customer_id: 101, customer_name: "Ada", signup_date: "2026-01-05" },
          {
            customer_id: 105,
            customer_name: "Ekin",
            signup_date: "2026-02-10",
          },
        ],
      },
      {
        tableName: "customer_acquisition",
        rows: [
          { customer_id: 101, channel_id: 1 },
          { customer_id: 105, channel_id: 2 },
        ],
      },
      {
        tableName: "activities",
        rows: [
          {
            activity_id: 1001,
            customer_id: 101,
            activity_date: "2026-02-05",
            activity_type: "session",
          },
          {
            activity_id: 1002,
            customer_id: 101,
            activity_date: "2026-02-18",
            activity_type: "purchase",
          },
        ],
      },
    ],
    expectedColumns: [
      "cohort_month",
      "channel_name",
      "cohort_size",
      "retained_m1",
      "retention_rate",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["2026-01-01", "Organic", 2, 1, 50],
      ["2026-01-01", "Paid", 1, 1, 100],
      ["2026-02-01", "Organic", 1, 1, 100],
      ["2026-02-01", "Paid", 2, 1, 50],
      ["2026-03-01", "Organic", 1, 1, 100],
    ],
    orderSensitive: true,
    requiredConcepts: ["CTE", "LEFT_JOIN", "GROUP_BY", "ORDER_BY"],
    forbiddenOperations: [...MARKETING_PROJECT_READ_ONLY_FORBIDDEN],
    validationOptions: { numericTolerance: 0.01 },
    hints: [
      "Önce her müşteriye kayıt ayını ve tek edinim kanalını ver; sonuç tanesi müşteri değil, kohort ayı–kanal ikilisidir.",
      "Takip penceresini kayıt ayından sonraki ayın başlangıcı dahil, ikinci ayın başlangıcı hariç kur; aynı müşterinin tekrar olaylarını tek müşteri say.",
      "Ayrı CTE'lerde kohort üyelerini ve takip ayında dönen benzersiz üyeleri üret; tüm kohortları koruyan birleşimden sonra oranı hesapla.",
    ],
    explanation:
      "Kohort üyeliğini etkinliklerden önce sabitlemek paydayı korur. Takip olaylarını müşteri düzeyinde tekilleştirmek yoğun kullanıcıların retention oranını yapay biçimde büyütmesini engeller.",
    completionMessage:
      "İlk ay retention kohort ve edinim kanalı tanesinde karşılaştırılabilir hale geldi.",
    nextTaskId: "m11-t8",
  },
  {
    id: "m11-t8",
    slug: "reactivation-churn-lifecycle-queue",
    moduleId: "module-11",
    title: "Reaktivasyon ve churn kuyruğunu kur",
    subtitle:
      "Son davranış, uzun ara ve iptal sinyalini tek müşteri yaşam döngüsünde birleştir.",
    scenario:
      "CRM ekibi, geri dönen müşteriyi hâlâ riskte olan veya gerçekten churn etmiş müşteriden ayıran tek bir aksiyon kuyruğu istiyor.",
    objective:
      "2026-06-30 tarihi itibarıyla her müşterinin son etkinliğini ve bir önceki etkinliğini bul. Geçerli iptali olanı Churned; Haziran'da dönüp önceki etkinliğiyle arasında en az 60 gün bulunanı Reactivated; aktif abonede son etkinliği 2026-05-01 öncesi veya hiç yoksa Risk; diğerini Healthy sınıfına koy. customer_name, segment, last_activity_date, inactive_days ve lifecycle_status kolonlarını getir; durum önceliği, inactive_days azalan NULLS FIRST ve müşteri adına göre sırala.",
    difficulty: "advanced",
    estimatedMinutes: 40,
    prerequisites: ["m10-t4"],
    concepts: [
      "REPORTING",
      "CTE",
      "INNER_JOIN",
      "LEFT_JOIN",
      "MULTI_JOIN",
      "LAG",
      "ROW_NUMBER",
      "PARTITION_BY",
      "CASE",
      "MIN",
      "ORDER_BY",
    ],
    setupSql: `
      CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY,
        customer_name TEXT NOT NULL,
        segment TEXT NOT NULL
      );
      CREATE TABLE subscriptions (
        subscription_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL UNIQUE REFERENCES customers(customer_id),
        started_at DATE NOT NULL,
        status TEXT NOT NULL
      );
      CREATE TABLE activity_events (
        event_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
        event_date DATE NOT NULL,
        event_type TEXT NOT NULL
      );
      CREATE TABLE cancellation_events (
        cancellation_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
        cancellation_date DATE NOT NULL,
        reason TEXT NOT NULL
      );

      INSERT INTO customers VALUES
        (201, 'Atlas', 'SMB'),
        (202, 'Bora', 'Enterprise'),
        (203, 'Ceren', 'SMB'),
        (204, 'Deniz', 'Enterprise'),
        (205, 'Ekin', 'SMB'),
        (206, 'Fidan', 'SMB'),
        (207, 'Gama', 'Enterprise');
      INSERT INTO subscriptions VALUES
        (2001, 201, DATE '2025-12-01', 'active'),
        (2002, 202, DATE '2026-01-15', 'active'),
        (2003, 203, DATE '2026-02-01', 'active'),
        (2004, 204, DATE '2025-11-01', 'cancelled'),
        (2005, 205, DATE '2026-03-01', 'active'),
        (2006, 206, DATE '2026-01-01', 'active'),
        (2007, 207, DATE '2026-01-01', 'active');
      INSERT INTO activity_events VALUES
        (2101, 201, DATE '2026-01-05', 'session'),
        (2102, 201, DATE '2026-06-20', 'purchase'),
        (2103, 202, DATE '2026-04-01', 'session'),
        (2104, 203, DATE '2026-05-20', 'session'),
        (2105, 204, DATE '2026-06-01', 'session'),
        (2106, 206, DATE '2026-05-25', 'session'),
        (2107, 206, DATE '2026-06-10', 'purchase'),
        (2108, 207, DATE '2026-06-01', 'session');
      INSERT INTO cancellation_events VALUES
        (2201, 204, DATE '2026-06-15', 'price'),
        (2202, 207, DATE '2026-07-05', 'future_request');
    `,
    schema: {
      tables: [
        {
          name: "customers",
          description: "CRM müşteri kimliği ve iş segmenti.",
          columns: [
            {
              name: "customer_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "customer_name", dataType: "TEXT", nullable: false },
            { name: "segment", dataType: "TEXT", nullable: false },
          ],
        },
        {
          name: "subscriptions",
          description: "Müşterinin rapor tarihindeki abonelik kaydı.",
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
            { name: "started_at", dataType: "DATE", nullable: false },
            { name: "status", dataType: "TEXT", nullable: false },
          ],
        },
        {
          name: "activity_events",
          description:
            "Müşterinin zaman içindeki kullanım ve satın alma olayları.",
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
            { name: "event_type", dataType: "TEXT", nullable: false },
          ],
        },
        {
          name: "cancellation_events",
          description:
            "Gerçekleşmiş veya gelecek tarihli olabilen abonelik iptal talepleri.",
          columns: [
            {
              name: "cancellation_id",
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
            { name: "cancellation_date", dataType: "DATE", nullable: false },
            { name: "reason", dataType: "TEXT", nullable: false },
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
          fromTable: "activity_events",
          fromColumn: "customer_id",
          toTable: "customers",
          toColumn: "customer_id",
        },
        {
          fromTable: "cancellation_events",
          fromColumn: "customer_id",
          toTable: "customers",
          toColumn: "customer_id",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "customers",
        rows: [
          { customer_id: 201, customer_name: "Atlas", segment: "SMB" },
          { customer_id: 205, customer_name: "Ekin", segment: "SMB" },
        ],
      },
      {
        tableName: "activity_events",
        rows: [
          {
            event_id: 2101,
            customer_id: 201,
            event_date: "2026-01-05",
            event_type: "session",
          },
          {
            event_id: 2102,
            customer_id: 201,
            event_date: "2026-06-20",
            event_type: "purchase",
          },
        ],
      },
      {
        tableName: "cancellation_events",
        rows: [
          {
            cancellation_id: 2201,
            customer_id: 204,
            cancellation_date: "2026-06-15",
            reason: "price",
          },
          {
            cancellation_id: 2202,
            customer_id: 207,
            cancellation_date: "2026-07-05",
            reason: "future_request",
          },
        ],
      },
    ],
    expectedColumns: [
      "customer_name",
      "segment",
      "last_activity_date",
      "inactive_days",
      "lifecycle_status",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Deniz", "Enterprise", "2026-06-01", 29, "Churned"],
      ["Atlas", "SMB", "2026-06-20", 10, "Reactivated"],
      ["Ekin", "SMB", null, null, "Risk"],
      ["Bora", "Enterprise", "2026-04-01", 90, "Risk"],
      ["Ceren", "SMB", "2026-05-20", 41, "Healthy"],
      ["Gama", "Enterprise", "2026-06-01", 29, "Healthy"],
      ["Fidan", "SMB", "2026-06-10", 20, "Healthy"],
    ],
    orderSensitive: true,
    requiredConcepts: [
      "CTE",
      "LEFT_JOIN",
      "LAG",
      "ROW_NUMBER",
      "PARTITION_BY",
      "CASE",
      "ORDER_BY",
    ],
    forbiddenOperations: [...MARKETING_PROJECT_READ_ONLY_FORBIDDEN],
    validationOptions: { numericTolerance: 0.01 },
    hints: [
      "Durumu tek ham JOIN üzerinde üretme; önce müşteri başına son ve bir önceki davranış tarihini güvenilir biçimde belirle.",
      "Uzun ara sinyali ardışık etkinlikler arasındaki gün farkından gelir; gelecek tarihli iptal rapor tarihindeki churn sayılmamalıdır.",
      "Etkinlik sırasını pencere fonksiyonlarıyla kur, son satırı müşteri başına seç ve iptal–reaktivasyon–risk önceliğini tek CASE içinde açıkça sırala.",
    ],
    explanation:
      "Ardışık etkinlikler arasındaki boşluğu ayrı hesaplamak, yalnız son etkinliğe bakarak reaktivasyon uydurulmasını önler. İptal tarihini rapor tarihine bağlamak da gelecek taleplerin bugünkü churn'ü şişirmesini engeller.",
    completionMessage:
      "CRM kuyruğu churn, reaktivasyon ve sessizlik sinyallerini aynı müşteri tanesinde ayırdı.",
    nextTaskId: "m11-t9",
  },
  {
    id: "m11-t9",
    slug: "multi-touch-linear-attribution",
    moduleId: "module-11",
    title: "Geliri temaslara adil dağıt",
    subtitle:
      "Siparişten önceki 30 günlük pazarlama temaslarını tekilleştirip doğrulanabilir bir çoklu temas modeli kur.",
    scenario:
      "Pazarlama lideri son tıklama raporunun kanalları yanıltmasından şüpheleniyor. Bir siparişe katkı veren uygun kampanyalar arasında geliri eşit dağıtan şeffaf bir başlangıç modeli istiyor.",
    objective:
      "Her sipariş için sipariş tarihi dahil önceki 30 günde aynı müşteriye ulaşan benzersiz kampanyaları bul. Sipariş gelirini bu kampanyalar arasında eşit paylaştır; kampanyası olmayan siparişi atfetme. campaign_name, attributed_orders, attributed_revenue ve toplam atfedilen gelir içindeki yüzde revenue_share_pct kolonlarını getir. Hiç pay almayan kampanyaları da sıfırla koru; gelire göre azalan, eşitlikte kampanya adına göre artan sırala.",
    difficulty: "advanced",
    estimatedMinutes: 42,
    prerequisites: ["m10-t4"],
    concepts: [
      "REPORTING",
      "CTE",
      "INNER_JOIN",
      "LEFT_JOIN",
      "MULTI_JOIN",
      "DATE_FUNCTION",
      "DISTINCT",
      "COUNT",
      "SUM",
      "GROUP_BY",
      "ARITHMETIC",
      "ORDER_BY",
    ],
    setupSql: `
      CREATE TABLE campaigns (
        campaign_id INTEGER PRIMARY KEY,
        campaign_name TEXT NOT NULL UNIQUE
      );
      CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY,
        customer_name TEXT NOT NULL
      );
      CREATE TABLE touchpoints (
        touch_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
        campaign_id INTEGER NOT NULL REFERENCES campaigns(campaign_id),
        touch_date DATE NOT NULL
      );
      CREATE TABLE orders (
        order_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
        order_date DATE NOT NULL,
        revenue NUMERIC(12, 2) NOT NULL
      );

      INSERT INTO campaigns VALUES
        (1, 'Search'),
        (2, 'Social'),
        (3, 'Email'),
        (4, 'Affiliate');
      INSERT INTO customers VALUES
        (301, 'Ada'),
        (302, 'Bora'),
        (303, 'Ceren'),
        (304, 'Deniz');
      INSERT INTO touchpoints VALUES
        (3001, 301, 1, DATE '2026-05-01'),
        (3002, 301, 2, DATE '2026-05-10'),
        (3003, 302, 3, DATE '2026-05-01'),
        (3004, 302, 1, DATE '2026-05-20'),
        (3005, 302, 1, DATE '2026-05-22'),
        (3006, 303, 4, DATE '2026-04-01'),
        (3007, 304, 2, DATE '2026-05-25'),
        (3008, 301, 3, DATE '2026-06-01');
      INSERT INTO orders VALUES
        (3101, 301, DATE '2026-05-15', 120.00),
        (3102, 302, DATE '2026-05-25', 90.00),
        (3103, 303, DATE '2026-06-01', 80.00),
        (3104, 304, DATE '2026-06-05', 40.00),
        (3105, 301, DATE '2026-06-10', 60.00);
    `,
    schema: {
      tables: [
        {
          name: "campaigns",
          description:
            "Rapor omurgasında pay almasa da görünmesi gereken kampanya listesi.",
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
          name: "customers",
          description:
            "Temas ve siparişleri aynı kişide birleştiren müşteri listesi.",
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
          name: "touchpoints",
          description:
            "Aynı müşteri ve kampanya için yinelenebilen pazarlama temasları.",
          columns: [
            {
              name: "touch_id",
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
            {
              name: "campaign_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "campaigns", column: "campaign_id" },
            },
            { name: "touch_date", dataType: "DATE", nullable: false },
          ],
        },
        {
          name: "orders",
          description:
            "Müşterinin tarih ve gelir içeren tamamlanmış siparişleri.",
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
            { name: "order_date", dataType: "DATE", nullable: false },
            { name: "revenue", dataType: "NUMERIC(12, 2)", nullable: false },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "touchpoints",
          fromColumn: "customer_id",
          toTable: "customers",
          toColumn: "customer_id",
        },
        {
          fromTable: "touchpoints",
          fromColumn: "campaign_id",
          toTable: "campaigns",
          toColumn: "campaign_id",
        },
        {
          fromTable: "orders",
          fromColumn: "customer_id",
          toTable: "customers",
          toColumn: "customer_id",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "campaigns",
        rows: [
          { campaign_id: 1, campaign_name: "Search" },
          { campaign_id: 4, campaign_name: "Affiliate" },
        ],
      },
      {
        tableName: "touchpoints",
        rows: [
          {
            touch_id: 3004,
            customer_id: 302,
            campaign_id: 1,
            touch_date: "2026-05-20",
          },
          {
            touch_id: 3005,
            customer_id: 302,
            campaign_id: 1,
            touch_date: "2026-05-22",
          },
        ],
      },
      {
        tableName: "orders",
        rows: [
          {
            order_id: 3102,
            customer_id: 302,
            order_date: "2026-05-25",
            revenue: 90,
          },
          {
            order_id: 3103,
            customer_id: 303,
            order_date: "2026-06-01",
            revenue: 80,
          },
        ],
      },
    ],
    expectedColumns: [
      "campaign_name",
      "attributed_orders",
      "attributed_revenue",
      "revenue_share_pct",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Email", 2, 105, 33.87],
      ["Search", 2, 105, 33.87],
      ["Social", 2, 100, 32.26],
      ["Affiliate", 0, 0, 0],
    ],
    orderSensitive: true,
    requiredConcepts: ["CTE", "LEFT_JOIN", "GROUP_BY", "SUM", "ORDER_BY"],
    forbiddenOperations: [...MARKETING_PROJECT_READ_ONLY_FORBIDDEN],
    validationOptions: { numericTolerance: 0.01 },
    hints: [
      "Önce sipariş–kampanya tanesinde uygun temasları kur. Aynı kampanyanın bir siparişten önce iki kez görünmesi iki ayrı gelir payı yaratmamalıdır.",
      "Her siparişin benzersiz uygun kampanya sayısını bul ve geliri yalnız bu sayıya böl; uygun teması olmayan siparişi toplam atfedilen gelire katma.",
      "Tahsis satırlarını kampanya düzeyinde topla, sonra tüm kampanyaları koruyan omurgaya bağla. Yüzde payın paydası atfedilmiş kampanya gelirlerinin toplamıdır.",
    ],
    explanation:
      "Sipariş–kampanya çiftini önce tekilleştirmek yoğun temas frekansının gereksiz kredi almasını önler. Tahsis öncesi kampanya sayısını sipariş bazında sabitlemek de dağıtılan gelirin sipariş gelirini aşmamasını sağlar.",
    completionMessage:
      "Çoklu temas gelir dağılımı tekrarlı temasları ve atıfsız siparişleri açıkça yönetti.",
    nextTaskId: "m11-t10",
  },
  {
    id: "m11-t10",
    slug: "experiment-incrementality-holdout",
    moduleId: "module-11",
    title: "Holdout ile artımlı etkiyi ölç",
    subtitle:
      "Kampanya dönüşümünü kontrol grubuna karşı sınayıp gerçek artımlı katkıyı raporla.",
    scenario:
      "Büyüme ekibi, kampanya sırasında gelen her dönüşümü kampanyaya yazmak yerine, kullanıcıların ne kadarının zaten dönüşeceğini holdout grubuyla ayırmak istiyor.",
    objective:
      "Her deneyde atama tarihinden erken olmayan ve deney bitişini aşmayan ilk/tekrarlı tüm conversion kayıtlarını müşteri düzeyinde tek dönüşüme indir. Treatment ve control kullanıcılarını, yüzde dönüşüm oranlarını, yüzde puan lift_pp değerini ve beklenen kontrol dönüşümünü aşan incremental_conversions değerini hesapla. Kontrol grubu yoksa oran karşılaştırmalarını 0 kabul edip kararı Yetersiz kontrol ver; lift en az 10 puansa Büyüt, -5 veya altındaysa Durdur, diğerlerinde Nötr de. Deney adına göre sırala.",
    difficulty: "advanced",
    estimatedMinutes: 42,
    prerequisites: ["m10-t4"],
    concepts: [
      "REPORTING",
      "CTE",
      "INNER_JOIN",
      "LEFT_JOIN",
      "MULTI_JOIN",
      "DATE_FUNCTION",
      "DISTINCT",
      "COUNT",
      "GROUP_BY",
      "CASE",
      "ARITHMETIC",
      "ORDER_BY",
    ],
    setupSql: `
      CREATE TABLE experiments (
        experiment_id INTEGER PRIMARY KEY,
        experiment_name TEXT NOT NULL UNIQUE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL
      );
      CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY,
        customer_name TEXT NOT NULL
      );
      CREATE TABLE experiment_assignments (
        assignment_id INTEGER PRIMARY KEY,
        experiment_id INTEGER NOT NULL REFERENCES experiments(experiment_id),
        customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
        variant TEXT NOT NULL,
        assigned_at DATE NOT NULL,
        UNIQUE (experiment_id, customer_id)
      );
      CREATE TABLE conversions (
        conversion_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
        converted_at DATE NOT NULL,
        conversion_value NUMERIC(12, 2) NOT NULL
      );

      INSERT INTO experiments VALUES
        (1, 'Summer Launch', DATE '2026-05-01', DATE '2026-05-31'),
        (2, 'Winback', DATE '2026-06-01', DATE '2026-06-30'),
        (3, 'Brand Awareness', DATE '2026-07-01', DATE '2026-07-31');
      INSERT INTO customers
      SELECT customer_id, 'Customer ' || customer_id
      FROM GENERATE_SERIES(401, 419) AS customer_id;
      INSERT INTO experiment_assignments VALUES
        (4001, 1, 401, 'treatment', DATE '2026-05-01'),
        (4002, 1, 402, 'treatment', DATE '2026-05-01'),
        (4003, 1, 403, 'treatment', DATE '2026-05-01'),
        (4004, 1, 404, 'treatment', DATE '2026-05-01'),
        (4005, 1, 405, 'treatment', DATE '2026-05-01'),
        (4006, 1, 406, 'control', DATE '2026-05-01'),
        (4007, 1, 407, 'control', DATE '2026-05-01'),
        (4008, 1, 408, 'control', DATE '2026-05-01'),
        (4009, 1, 409, 'control', DATE '2026-05-01'),
        (4010, 2, 410, 'treatment', DATE '2026-06-01'),
        (4011, 2, 411, 'treatment', DATE '2026-06-01'),
        (4012, 2, 412, 'treatment', DATE '2026-06-01'),
        (4013, 2, 413, 'treatment', DATE '2026-06-01'),
        (4014, 2, 414, 'control', DATE '2026-06-01'),
        (4015, 2, 415, 'control', DATE '2026-06-01'),
        (4016, 2, 416, 'control', DATE '2026-06-01'),
        (4017, 2, 417, 'control', DATE '2026-06-01'),
        (4018, 3, 418, 'treatment', DATE '2026-07-01'),
        (4019, 3, 419, 'treatment', DATE '2026-07-01');
      INSERT INTO conversions VALUES
        (4101, 401, DATE '2026-05-10', 100.00),
        (4102, 402, DATE '2026-05-12', 50.00),
        (4103, 402, DATE '2026-05-20', 25.00),
        (4104, 403, DATE '2026-05-18', 80.00),
        (4105, 406, DATE '2026-05-15', 90.00),
        (4106, 404, DATE '2026-04-30', 70.00),
        (4107, 407, DATE '2026-06-01', 60.00),
        (4108, 410, DATE '2026-06-10', 40.00),
        (4109, 414, DATE '2026-06-12', 40.00),
        (4110, 418, DATE '2026-07-10', 35.00);
    `,
    schema: {
      tables: [
        {
          name: "experiments",
          description:
            "Holdout karşılaştırmasının tarih sınırlarını taşıyan deneyler.",
          columns: [
            {
              name: "experiment_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "experiment_name", dataType: "TEXT", nullable: false },
            { name: "start_date", dataType: "DATE", nullable: false },
            { name: "end_date", dataType: "DATE", nullable: false },
          ],
        },
        {
          name: "customers",
          description: "Deney katılımcılarının müşteri ana listesi.",
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
          name: "experiment_assignments",
          description:
            "Her deneyde müşterinin treatment veya control grubuna tekil ataması.",
          columns: [
            {
              name: "assignment_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "experiment_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "experiments", column: "experiment_id" },
            },
            {
              name: "customer_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "customers", column: "customer_id" },
            },
            { name: "variant", dataType: "TEXT", nullable: false },
            { name: "assigned_at", dataType: "DATE", nullable: false },
          ],
        },
        {
          name: "conversions",
          description:
            "Atamadan önce, deney içinde veya deneyden sonra oluşabilen dönüşüm olayları.",
          columns: [
            {
              name: "conversion_id",
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
            { name: "converted_at", dataType: "DATE", nullable: false },
            {
              name: "conversion_value",
              dataType: "NUMERIC(12, 2)",
              nullable: false,
            },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "experiment_assignments",
          fromColumn: "experiment_id",
          toTable: "experiments",
          toColumn: "experiment_id",
        },
        {
          fromTable: "experiment_assignments",
          fromColumn: "customer_id",
          toTable: "customers",
          toColumn: "customer_id",
        },
        {
          fromTable: "conversions",
          fromColumn: "customer_id",
          toTable: "customers",
          toColumn: "customer_id",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "experiments",
        rows: [
          {
            experiment_id: 1,
            experiment_name: "Summer Launch",
            start_date: "2026-05-01",
            end_date: "2026-05-31",
          },
        ],
      },
      {
        tableName: "experiment_assignments",
        rows: [
          {
            assignment_id: 4002,
            experiment_id: 1,
            customer_id: 402,
            variant: "treatment",
            assigned_at: "2026-05-01",
          },
          {
            assignment_id: 4006,
            experiment_id: 1,
            customer_id: 406,
            variant: "control",
            assigned_at: "2026-05-01",
          },
        ],
      },
      {
        tableName: "conversions",
        rows: [
          {
            conversion_id: 4102,
            customer_id: 402,
            converted_at: "2026-05-12",
            conversion_value: 50,
          },
          {
            conversion_id: 4103,
            customer_id: 402,
            converted_at: "2026-05-20",
            conversion_value: 25,
          },
        ],
      },
    ],
    expectedColumns: [
      "experiment_name",
      "treatment_users",
      "control_users",
      "treatment_rate",
      "control_rate",
      "lift_pp",
      "incremental_conversions",
      "decision",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Brand Awareness", 2, 0, 50, 0, 0, 0, "Yetersiz kontrol"],
      ["Summer Launch", 5, 4, 60, 25, 35, 1.75, "Büyüt"],
      ["Winback", 4, 4, 25, 25, 0, 0, "Nötr"],
    ],
    orderSensitive: true,
    requiredConcepts: ["CTE", "LEFT_JOIN", "COUNT", "CASE", "ORDER_BY"],
    forbiddenOperations: [...MARKETING_PROJECT_READ_ONLY_FORBIDDEN],
    validationOptions: { numericTolerance: 0.01 },
    hints: [
      "Dönüşüm tablosunu doğrudan atamalara bağlamak birden fazla dönüşümü olan kişiyi paydada ve payda karşısında çoğaltabilir; önce deney–müşteri tanesine indir.",
      "Geçerli dönüşüm penceresinin başlangıcı, deney başlangıcı ile kişinin atama tarihinden daha geç olanıdır; bitişi deney bitişidir.",
      "Grup büyüklükleri ve dönüşenler için koşullu sayımlar üret; control_users sıfırken bölmeyi ve iş kararını ayrı CASE dalında güvenle ele al.",
    ],
    explanation:
      "Atama sonrası benzersiz dönüşen müşteriyi ölçmek tekrar satın alımları conversion rate içinde çoğaltmaz. Kontrol oranını treatment grubuna uygulamak, gözlenen dönüşümün kampanya olmasa da beklenen bölümünü ayırır.",
    completionMessage:
      "Kampanya dönüşümü korelasyondan ayrılıp holdout tabanlı artımlı etkiye dönüştü.",
    nextTaskId: "m11-t11",
  },
  {
    id: "m11-t11",
    slug: "weekly-budget-reallocation",
    moduleId: "module-11",
    title: "Bütçeyi CAC trendine göre yeniden dağıt",
    subtitle:
      "İki haftanın kanal verisini karşılaştırıp sıfır dönüşümü de yöneten bir bütçe önerisi üret.",
    scenario:
      "Pazarlama direktörü gelecek haftanın kanal bütçesini belirleyecek. Tek haftalık CAC fotoğrafı yerine maliyetin iyileşip kötüleştiğini ve ölçümün nerede çöktüğünü birlikte görmek istiyor.",
    objective:
      "2026-06-01–07 dönemini previous, 2026-06-08–14 dönemini current hafta kabul et. Her kanal için current_week_spend, current_conversions, current_cac ve önceki CAC'ye göre yüzde cac_change_pct üret. Current conversion sıfırsa Durdur ve incele; CAC en az %10 iyileştiyse Artır; %15'ten fazla kötüleştiyse Azalt; aksi halde Koru öner. Buna göre mevcut haftalık bütçeyi sırasıyla %50, %120, %80 veya değişmeden proposed_budget yap. Tüm kanalları koru ve önerilen bütçeye göre azalan sırala.",
    difficulty: "advanced",
    estimatedMinutes: 40,
    prerequisites: ["m10-t4"],
    concepts: [
      "REPORTING",
      "CTE",
      "INNER_JOIN",
      "LEFT_JOIN",
      "MULTI_JOIN",
      "DATE_FUNCTION",
      "SUM",
      "GROUP_BY",
      "CASE",
      "ARITHMETIC",
      "ORDER_BY",
    ],
    setupSql: `
      CREATE TABLE channels (
        channel_id INTEGER PRIMARY KEY,
        channel_name TEXT NOT NULL UNIQUE
      );
      CREATE TABLE channel_budgets (
        channel_id INTEGER PRIMARY KEY REFERENCES channels(channel_id),
        current_weekly_budget NUMERIC(12, 2) NOT NULL
      );
      CREATE TABLE daily_spend (
        spend_id INTEGER PRIMARY KEY,
        channel_id INTEGER NOT NULL REFERENCES channels(channel_id),
        spend_date DATE NOT NULL,
        spend_amount NUMERIC(12, 2) NOT NULL
      );
      CREATE TABLE daily_conversions (
        metric_id INTEGER PRIMARY KEY,
        channel_id INTEGER NOT NULL REFERENCES channels(channel_id),
        metric_date DATE NOT NULL,
        conversion_count INTEGER NOT NULL
      );

      INSERT INTO channels VALUES
        (1, 'Search'),
        (2, 'Social'),
        (3, 'Email'),
        (4, 'Affiliate');
      INSERT INTO channel_budgets VALUES
        (1, 1000.00),
        (2, 800.00),
        (3, 400.00),
        (4, 200.00);
      INSERT INTO daily_spend VALUES
        (5001, 1, DATE '2026-06-03', 700.00),
        (5002, 1, DATE '2026-06-10', 840.00),
        (5003, 2, DATE '2026-06-03', 600.00),
        (5004, 2, DATE '2026-06-10', 720.00),
        (5005, 3, DATE '2026-06-03', 200.00),
        (5006, 3, DATE '2026-06-10', 250.00),
        (5007, 4, DATE '2026-06-03', 100.00),
        (5008, 4, DATE '2026-06-10', 150.00);
      INSERT INTO daily_conversions VALUES
        (5101, 1, DATE '2026-06-03', 35),
        (5102, 1, DATE '2026-06-10', 42),
        (5103, 2, DATE '2026-06-03', 30),
        (5104, 2, DATE '2026-06-10', 20),
        (5105, 3, DATE '2026-06-03', 10),
        (5106, 3, DATE '2026-06-10', 20),
        (5107, 4, DATE '2026-06-03', 0);
    `,
    schema: {
      tables: [
        {
          name: "channels",
          description:
            "Harcama veya dönüşüm kaydı eksik olsa da raporda korunacak kanal omurgası.",
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
          name: "channel_budgets",
          description: "Gelecek önerinin uygulanacağı mevcut haftalık bütçe.",
          columns: [
            {
              name: "channel_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
              references: { table: "channels", column: "channel_id" },
            },
            {
              name: "current_weekly_budget",
              dataType: "NUMERIC(12, 2)",
              nullable: false,
            },
          ],
        },
        {
          name: "daily_spend",
          description: "Kanal ve gün düzeyindeki gerçekleşen medya harcaması.",
          columns: [
            {
              name: "spend_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "channel_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "channels", column: "channel_id" },
            },
            { name: "spend_date", dataType: "DATE", nullable: false },
            {
              name: "spend_amount",
              dataType: "NUMERIC(12, 2)",
              nullable: false,
            },
          ],
        },
        {
          name: "daily_conversions",
          description:
            "Bazı gün/kanal kombinasyonları hiç satır üretmeyebilen dönüşüm ölçümü.",
          columns: [
            {
              name: "metric_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "channel_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "channels", column: "channel_id" },
            },
            { name: "metric_date", dataType: "DATE", nullable: false },
            { name: "conversion_count", dataType: "INTEGER", nullable: false },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "channel_budgets",
          fromColumn: "channel_id",
          toTable: "channels",
          toColumn: "channel_id",
        },
        {
          fromTable: "daily_spend",
          fromColumn: "channel_id",
          toTable: "channels",
          toColumn: "channel_id",
        },
        {
          fromTable: "daily_conversions",
          fromColumn: "channel_id",
          toTable: "channels",
          toColumn: "channel_id",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "channel_budgets",
        rows: [
          { channel_id: 1, current_weekly_budget: 1000 },
          { channel_id: 4, current_weekly_budget: 200 },
        ],
      },
      {
        tableName: "daily_spend",
        rows: [
          {
            spend_id: 5005,
            channel_id: 3,
            spend_date: "2026-06-03",
            spend_amount: 200,
          },
          {
            spend_id: 5006,
            channel_id: 3,
            spend_date: "2026-06-10",
            spend_amount: 250,
          },
        ],
      },
      {
        tableName: "daily_conversions",
        rows: [
          {
            metric_id: 5105,
            channel_id: 3,
            metric_date: "2026-06-03",
            conversion_count: 10,
          },
          {
            metric_id: 5106,
            channel_id: 3,
            metric_date: "2026-06-10",
            conversion_count: 20,
          },
        ],
      },
    ],
    expectedColumns: [
      "channel_name",
      "current_week_spend",
      "current_conversions",
      "current_cac",
      "cac_change_pct",
      "recommendation",
      "proposed_budget",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Search", 840, 42, 20, 0, "Koru", 1000],
      ["Social", 720, 20, 36, 80, "Azalt", 640],
      ["Email", 250, 20, 12.5, -37.5, "Artır", 480],
      ["Affiliate", 150, 0, null, null, "Durdur ve incele", 100],
    ],
    orderSensitive: true,
    requiredConcepts: ["CTE", "LEFT_JOIN", "SUM", "CASE", "ORDER_BY"],
    forbiddenOperations: [...MARKETING_PROJECT_READ_ONLY_FORBIDDEN],
    validationOptions: { numericTolerance: 0.01 },
    hints: [
      "Harcama ve dönüşümü tek ham tabloda birleştirip toplama; günlük satır sayıları farklıysa iki ölçü de katlanır. Önce dönem bazında ayrı özetle.",
      "Önce previous ve current CAC'yi sıfır dönüşümden koruyarak üret; trend yalnız iki CAC de varsa anlamlıdır.",
      "Kanal ve bütçe tablosunu omurga yap, iki dönem özetini LEFT JOIN ile bağla; öneri CASE'inde sıfır dönüşüm kuralını trend eşiklerinden önce çalıştır.",
    ],
    explanation:
      "Harcama ve dönüşümü ayrı CTE'lerde toplamak çoktan-çoğa satır patlamasını engeller. Sıfır dönüşümü NULL CAC ile görünür bırakmak, sonsuz maliyeti sahte bir sıfıra çevirmeden güvenli aksiyon üretir.",
    completionMessage:
      "Kanal performansı tek dönem fotoğrafından uygulanabilir bir bütçe yeniden dağıtımına dönüştü.",
    nextTaskId: "m11-t12",
  },
  {
    id: "m11-t12",
    slug: "executive-growth-scorecard",
    moduleId: "module-11",
    title: "Yönetici büyüme scorecard'ını teslim et",
    subtitle:
      "Harcama, müşteri, abonelik, gelir ve hedefleri tek bölgesel karar ekranında birleştir.",
    scenario:
      "Genel müdür, bölge ekiplerinin Haziran performansını tek tabloda görmek ve hangi bölgeyi ölçekleyip hangisini düzeltmesi gerektiğini toplantıda doğrudan karara bağlamak istiyor.",
    objective:
      "Haziran 2026 için bölge düzeyinde marketing_spend, yeni müşteri sayısı, 30 Haziran sonu active_customers ve refund düşülmüş net_revenue üret. CAC'yi harcama/yeni müşteri olarak hesapla; yeni müşteri yoksa NULL bırak. Growth score'u hedefe göre yeni müşteri başarısı en fazla 40, net gelir başarısı en fazla 40 ve CAC hedefi başarısı 20/10/0 puanla toplam 100 üzerinden hesapla. Her üç hedefi geçen bölgeye Ölçekle; yeni müşteri hedefinin yarısının altında, gelir hedefinin %80'inin altında veya CAC üst sınırının %20 üstündeyse Düzelt; kalanına İzle de. Tüm bölgeleri koru, skora göre azalan sırala.",
    difficulty: "advanced",
    estimatedMinutes: 45,
    prerequisites: ["m10-t4"],
    concepts: [
      "REPORTING",
      "CTE",
      "INNER_JOIN",
      "LEFT_JOIN",
      "MULTI_JOIN",
      "DATE_FUNCTION",
      "DISTINCT",
      "COUNT",
      "SUM",
      "GROUP_BY",
      "CASE",
      "ARITHMETIC",
      "ORDER_BY",
    ],
    setupSql: `
      CREATE TABLE regions (
        region_id INTEGER PRIMARY KEY,
        region_name TEXT NOT NULL UNIQUE
      );
      CREATE TABLE acquisition_channels (
        channel_id INTEGER PRIMARY KEY,
        channel_name TEXT NOT NULL UNIQUE
      );
      CREATE TABLE marketing_spend (
        spend_id INTEGER PRIMARY KEY,
        region_id INTEGER NOT NULL REFERENCES regions(region_id),
        channel_id INTEGER NOT NULL REFERENCES acquisition_channels(channel_id),
        spend_date DATE NOT NULL,
        spend_amount NUMERIC(12, 2) NOT NULL
      );
      CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY,
        region_id INTEGER NOT NULL REFERENCES regions(region_id),
        customer_name TEXT NOT NULL,
        acquired_at DATE NOT NULL
      );
      CREATE TABLE subscriptions (
        subscription_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
        started_at DATE NOT NULL,
        cancelled_at DATE
      );
      CREATE TABLE revenue_events (
        revenue_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
        event_date DATE NOT NULL,
        gross_amount NUMERIC(12, 2) NOT NULL,
        refund_amount NUMERIC(12, 2) NOT NULL
      );
      CREATE TABLE growth_targets (
        region_id INTEGER PRIMARY KEY REFERENCES regions(region_id),
        target_new_customers INTEGER NOT NULL,
        target_net_revenue NUMERIC(12, 2) NOT NULL,
        max_cac NUMERIC(12, 2) NOT NULL
      );

      INSERT INTO regions VALUES
        (1, 'North'),
        (2, 'West'),
        (3, 'South'),
        (4, 'Central');
      INSERT INTO acquisition_channels VALUES
        (1, 'Search'),
        (2, 'Social'),
        (3, 'Email');
      INSERT INTO growth_targets VALUES
        (1, 3, 1000.00, 200.00),
        (2, 2, 800.00, 250.00),
        (3, 1, 300.00, 150.00),
        (4, 2, 500.00, 180.00);
      INSERT INTO marketing_spend VALUES
        (6001, 1, 1, DATE '2026-06-05', 300.00),
        (6002, 1, 2, DATE '2026-06-18', 200.00),
        (6003, 2, 1, DATE '2026-06-08', 400.00),
        (6004, 2, 3, DATE '2026-06-20', 100.00),
        (6005, 4, 2, DATE '2026-06-04', 250.00),
        (6006, 4, 3, DATE '2026-06-22', 150.00);
      INSERT INTO customers VALUES
        (601, 1, 'Ada', DATE '2026-06-05'),
        (602, 1, 'Bora', DATE '2026-06-10'),
        (603, 1, 'Ceren', DATE '2026-06-20'),
        (604, 1, 'Deniz', DATE '2026-05-15'),
        (605, 2, 'Ekin', DATE '2026-06-03'),
        (606, 2, 'Fidan', DATE '2026-06-25'),
        (607, 2, 'Güneş', DATE '2026-05-01'),
        (608, 3, 'Ilgın', DATE '2026-05-10'),
        (609, 4, 'Jale', DATE '2026-06-02'),
        (610, 4, 'Kaan', DATE '2026-06-08');
      INSERT INTO subscriptions VALUES
        (6101, 601, DATE '2026-06-05', NULL),
        (6102, 602, DATE '2026-06-10', NULL),
        (6103, 603, DATE '2026-06-20', NULL),
        (6104, 604, DATE '2026-05-15', NULL),
        (6105, 605, DATE '2026-06-03', NULL),
        (6106, 606, DATE '2026-06-25', DATE '2026-06-28'),
        (6107, 607, DATE '2026-05-01', NULL),
        (6108, 608, DATE '2026-05-10', NULL),
        (6109, 609, DATE '2026-06-02', NULL),
        (6110, 610, DATE '2026-06-08', NULL);
      INSERT INTO revenue_events VALUES
        (6201, 601, DATE '2026-06-10', 400.00, 0.00),
        (6202, 602, DATE '2026-06-15', 350.00, 50.00),
        (6203, 603, DATE '2026-06-25', 300.00, 0.00),
        (6204, 604, DATE '2026-06-05', 200.00, 0.00),
        (6205, 605, DATE '2026-06-08', 300.00, 0.00),
        (6206, 606, DATE '2026-06-27', 250.00, 50.00),
        (6207, 607, DATE '2026-06-12', 100.00, 0.00),
        (6208, 608, DATE '2026-06-09', 100.00, 0.00),
        (6209, 609, DATE '2026-06-11', 400.00, 0.00),
        (6210, 610, DATE '2026-06-19', 250.00, 0.00),
        (6211, 609, DATE '2026-06-28', 0.00, 100.00);
    `,
    schema: {
      tables: [
        {
          name: "regions",
          description: "Scorecard'da veri olmasa da korunacak coğrafi omurga.",
          columns: [
            {
              name: "region_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "region_name", dataType: "TEXT", nullable: false },
          ],
        },
        {
          name: "acquisition_channels",
          description: "Bölgesel harcamanın gerçekleştiği pazarlama kanalları.",
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
          name: "marketing_spend",
          description: "Bölge, kanal ve gün tanesindeki pazarlama harcaması.",
          columns: [
            {
              name: "spend_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "region_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "regions", column: "region_id" },
            },
            {
              name: "channel_id",
              dataType: "INTEGER",
              nullable: false,
              references: {
                table: "acquisition_channels",
                column: "channel_id",
              },
            },
            { name: "spend_date", dataType: "DATE", nullable: false },
            {
              name: "spend_amount",
              dataType: "NUMERIC(12, 2)",
              nullable: false,
            },
          ],
        },
        {
          name: "customers",
          description: "Edinim tarihi ve sahip bölgesiyle müşteri ana listesi.",
          columns: [
            {
              name: "customer_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "region_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "regions", column: "region_id" },
            },
            { name: "customer_name", dataType: "TEXT", nullable: false },
            { name: "acquired_at", dataType: "DATE", nullable: false },
          ],
        },
        {
          name: "subscriptions",
          description:
            "Rapor sonu aktiflik hesabı için başlangıç ve iptal tarihleri.",
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
            { name: "started_at", dataType: "DATE", nullable: false },
            { name: "cancelled_at", dataType: "DATE", nullable: true },
          ],
        },
        {
          name: "revenue_events",
          description:
            "Gross gelir ve refund'u ayrı taşıyan müşteri gelir olayları.",
          columns: [
            {
              name: "revenue_id",
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
            {
              name: "gross_amount",
              dataType: "NUMERIC(12, 2)",
              nullable: false,
            },
            {
              name: "refund_amount",
              dataType: "NUMERIC(12, 2)",
              nullable: false,
            },
          ],
        },
        {
          name: "growth_targets",
          description:
            "Bölge bazında yeni müşteri, net gelir ve kabul edilebilir CAC eşikleri.",
          columns: [
            {
              name: "region_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
              references: { table: "regions", column: "region_id" },
            },
            {
              name: "target_new_customers",
              dataType: "INTEGER",
              nullable: false,
            },
            {
              name: "target_net_revenue",
              dataType: "NUMERIC(12, 2)",
              nullable: false,
            },
            { name: "max_cac", dataType: "NUMERIC(12, 2)", nullable: false },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "marketing_spend",
          fromColumn: "region_id",
          toTable: "regions",
          toColumn: "region_id",
        },
        {
          fromTable: "marketing_spend",
          fromColumn: "channel_id",
          toTable: "acquisition_channels",
          toColumn: "channel_id",
        },
        {
          fromTable: "customers",
          fromColumn: "region_id",
          toTable: "regions",
          toColumn: "region_id",
        },
        {
          fromTable: "subscriptions",
          fromColumn: "customer_id",
          toTable: "customers",
          toColumn: "customer_id",
        },
        {
          fromTable: "revenue_events",
          fromColumn: "customer_id",
          toTable: "customers",
          toColumn: "customer_id",
        },
        {
          fromTable: "growth_targets",
          fromColumn: "region_id",
          toTable: "regions",
          toColumn: "region_id",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "growth_targets",
        rows: [
          {
            region_id: 1,
            target_new_customers: 3,
            target_net_revenue: 1000,
            max_cac: 200,
          },
          {
            region_id: 3,
            target_new_customers: 1,
            target_net_revenue: 300,
            max_cac: 150,
          },
        ],
      },
      {
        tableName: "subscriptions",
        rows: [
          {
            subscription_id: 6105,
            customer_id: 605,
            started_at: "2026-06-03",
            cancelled_at: null,
          },
          {
            subscription_id: 6106,
            customer_id: 606,
            started_at: "2026-06-25",
            cancelled_at: "2026-06-28",
          },
        ],
      },
      {
        tableName: "revenue_events",
        rows: [
          {
            revenue_id: 6202,
            customer_id: 602,
            event_date: "2026-06-15",
            gross_amount: 350,
            refund_amount: 50,
          },
          {
            revenue_id: 6211,
            customer_id: 609,
            event_date: "2026-06-28",
            gross_amount: 0,
            refund_amount: 100,
          },
        ],
      },
    ],
    expectedColumns: [
      "region_name",
      "marketing_spend",
      "new_customers",
      "active_customers",
      "net_revenue",
      "cac",
      "growth_score",
      "executive_action",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["North", 500, 3, 4, 1200, 166.67, 100, "Ölçekle"],
      ["Central", 400, 2, 2, 550, 200, 90, "İzle"],
      ["West", 500, 2, 2, 600, 250, 90, "Düzelt"],
      ["South", 0, 0, 1, 100, null, 13.3, "Düzelt"],
    ],
    orderSensitive: true,
    requiredConcepts: [
      "CTE",
      "LEFT_JOIN",
      "MULTI_JOIN",
      "COUNT",
      "SUM",
      "GROUP_BY",
      "CASE",
      "ORDER_BY",
    ],
    forbiddenOperations: [...MARKETING_PROJECT_READ_ONLY_FORBIDDEN],
    validationOptions: { numericTolerance: 0.01 },
    hints: [
      "Harcama, yeni müşteri, aktif abonelik ve geliri ham satırlar üzerinden birlikte toplarsan ölçüler birbirini katlar; her metriği önce bölge tanesinde sabitle.",
      "Bölge omurgasını hedeflerle başlat ve metrik özetlerini LEFT JOIN ile bağla. CAC için sıfır yeni müşteriyi NULL, score bileşenlerini ise hedef başına tavanlı puan olarak ele al.",
      "Ayrı CTE'lerde dört bölgesel metrik üret; birleşik base katmanında CAC'yi, sonraki katmanda 40+40+20 skoru, en son SELECT'te karar önceliklerini hesapla.",
    ],
    explanation:
      "Her iş metriğini kendi doğal tanesinde toplamak, farklı olay tablolarının oluşturduğu fan-out hatasını keser. Bölge omurgası veri üretmeyen alanları görünür tutarken tavanlı score, tek bir hedefin diğer eksikleri gizlemesini önler.",
    completionMessage:
      "Büyüme performansı, yönetim toplantısında doğrudan kullanılabilecek hedefli ve aksiyonlu bir scorecard'a dönüştü.",
    nextTaskId: null,
  },
];

export const MARKETING_PROJECT_LEARNING_CONTENT_PART_TWO: Record<
  string,
  LessonLearningContent
> = {
  "m11-t7": createProjectLearningContent({
    title: "Kohort retention",
    conceptAnchor:
      "Paydayı kayıt kohortundan, payı takip ayındaki benzersiz aktif müşteriden üret.",
    outputGrain: "Bir cohort_month ve acquisition channel çifti.",
    acceptanceChecks: [
      "Kayıt ayı–kanal kombinasyonlarının hiçbiri aktivite yok diye kaybolmuyor.",
      "Aynı müşterinin takip ayındaki iki aktivitesi retained_m1 değerini yalnız bir artırıyor.",
      "Retention oranı retained_m1 / cohort_size * 100 olarak iki ondalığa yuvarlanıyor.",
    ],
    dataNotes: [
      "Aktivite tablosunda müşteri başına aynı ayda birden çok olay bulunur.",
      "Kayıt ayındaki veya ikinci takip ayındaki aktivite M1 retention değildir.",
      "Her müşteri customer_acquisition tablosunda tek ilk kanala sahiptir.",
    ],
    executionChecks: [
      "Tarih aralığında cohort_month ile INTERVAL işlemlerinin DATE/TIMESTAMP uyumunu kontrol et.",
      "Her CTE'yi geçici olarak seçip müşteri, kohort ve kanal kolonlarının taşındığını doğrula.",
    ],
    columnChecks: [
      "Çıktı adlarını cohort_month, channel_name, cohort_size, retained_m1 ve retention_rate olarak alias'la.",
      "Oran kolonunu tam sayı bölmesi yerine ondalıklı aritmetikle üret.",
    ],
    rowChecks: [
      "Kohort üyelerinin sayısını activity satırlarından değil, benzersiz müşteri listesinden al.",
      "Retained müşteri listesini müşteri–kohort–kanal tanesinde tekilleştir.",
      "Aktivitesi olmayan bir kohortu korumak için pay tablosunu paydaya dıştan bağla.",
    ],
    orderChecks: [
      "Önce cohort_month artan, sonra channel_name artan sıralama uygula.",
      "Sıralamayı metin biçimine dönüştürülmüş ay yerine gerçek tarih kolonu üzerinden yap.",
    ],
    conceptChecks: [
      "Pay ve paydayı ayrı CTE'lerde kur; tüm kohortları koruyan LEFT JOIN kullan.",
      "Kohort tanesinde GROUP BY ve sonuç sözleşmesindeki ORDER BY adımlarını görünür tut.",
    ],
    steps: [
      "Müşteriye signup ayını ve ilk edinim kanalını bağlayarak cohort_members üret.",
      "Yalnız sonraki takvim ayında aktivitesi olan müşteri–kohort çiftlerini tekilleştir.",
      "Kohort büyüklüğü ile retained sayısını birleştirip yüzdelik oranı hesapla.",
    ],
    whyItWorks:
      "Üyelik tablosu paydayı davranıştan bağımsız sabitler; takip ayı tablosunun tekilleştirilmesi de event yoğunluğunu retention ile karıştırmaz.",
    edgeCases: [
      "Bir müşterinin takip ayında birden fazla activity kaydı vardır.",
      "Müşteri yalnız kayıt ayında veya M2 ayında aktiftir ve M1 retained sayılmamalıdır.",
      "Küçük bir kohorttaki tek retained müşteri yüzdeyi 100'e çıkarabilir; bu hesap hatası değildir.",
    ],
    workplaceImpact:
      "Kanal karşılaştırması toplam aktif kullanıcıdan bağımsızlaşır ve edinim kalitesini kohort yaşı sabitken ölçer.",
    transferPrompt:
      "M1 yerine M2 retention istense tarih penceresinde hangi iki sınırı değiştirirdin?",
    transferReveal:
      "Alt sınırı cohort_month + 2 ay, üst sınırı cohort_month + 3 ay yapar; kohort paydasını değiştirmezdim.",
  }),
  "m11-t8": createProjectLearningContent({
    title: "Yaşam döngüsü kuyruğu",
    conceptAnchor:
      "Son durum ile davranışlar arasındaki boşluğu ayrı üretip öncelikli iş kuralında birleştir.",
    outputGrain: "Rapor tarihindeki tek bir müşteri.",
    acceptanceChecks: [
      "Her müşteri yalnız bir yaşam döngüsü durumunda ve bir satırda görünür.",
      "Geçerli iptal, reaktivasyon veya risk sinyalinden önce Churned sonucunu verir.",
      "inactive_days yalnız son etkinliği olan müşterilerde rapor tarihi farkını gösterir.",
    ],
    dataNotes: [
      "Gelecek tarihli iptal talebi rapor tarihinde gerçekleşmiş churn değildir.",
      "Hiç etkinliği olmayan aktif müşteri Risk olmalıdır ve tarih kolonları NULL kalır.",
      "Reaktivasyon son etkinliğin yeni olmasından değil, ardışık iki etkinlik arasındaki en az 60 günlük aradan doğar.",
    ],
    executionChecks: [
      "LAG ve ROW_NUMBER pencerelerinde PARTITION BY customer_id ile tarih sırasını açıkça ver.",
      "DATE çıkarımından önce son etkinliğin NULL olabileceği dalı CASE ile koru.",
    ],
    columnChecks: [
      "customer_name, segment, last_activity_date, inactive_days ve lifecycle_status kolonlarını bu sırada döndür.",
      "Son etkinlik tarihini metne çevirmeden DATE, inactive_days değerini gün sayısı olarak bırak.",
    ],
    rowChecks: [
      "Rapor tarihinden sonraki activity ve cancellation satırlarını durum hesabına sokma.",
      "Müşteri başına en son etkinlik satırını pencere sırasından seç; rastgele MAX ile önceki tarihi kaybetme.",
      "CASE sırasını Churned, Reactivated, Risk ve Healthy önceliğinde kur.",
    ],
    orderChecks: [
      "Durum metninin alfabetik sırası yerine iş önceliğini sayısal CASE ile sırala.",
      "Aynı durumda inactive_days azalan NULLS FIRST, ardından customer_name artan olsun.",
    ],
    conceptChecks: [
      "Ardışık davranışı LAG, son satırı ROW_NUMBER ve müşteri izolasyonunu PARTITION BY ile üret.",
      "Etkinliği veya iptali olmayan müşterileri kaybetmemek için LEFT JOIN zincirini koru.",
    ],
    steps: [
      "Rapor tarihine kadar her müşterinin etkinliklerini sırala ve önceki tarihi LAG ile ekle.",
      "Ters tarih sıralı ROW_NUMBER ile en son etkinliği seç, geçerli iptalleri ayrı özetle.",
      "Abonelik omurgasında sinyalleri birleştirip durum önceliğini ve iş sırasını uygula.",
    ],
    whyItWorks:
      "Pencere fonksiyonları son davranışı ve o davranıştan önceki gerçek boşluğu aynı satıra taşır; öncelikli CASE çakışan sinyalleri tek aksiyona indirir.",
    edgeCases: [
      "Aktif aboneliğin hiç activity kaydı yoktur.",
      "İptal tarihi rapor tarihinden sonradır ve henüz churn sayılmamalıdır.",
      "Haziran'da aktif olan iki müşteriden yalnız biri 60 günden uzun aradan dönmüştür.",
    ],
    workplaceImpact:
      "CRM ekibi aynı listede geri kazanım fırsatını, sessizlik riskini ve kesin churn'ü farklı aksiyonlara yönlendirebilir.",
    transferPrompt:
      "Risk eşiği 60 inactive day olsaydı iş kuralını hangi sinyale bağlardın?",
    transferReveal:
      "Sabit bir tarih karşılaştırması yerine rapor tarihi ile last_activity_date arasındaki gün farkını 60 eşiğine bağlardım.",
  }),
  "m11-t9": createProjectLearningContent({
    title: "Çoklu temas atfı",
    conceptAnchor:
      "Sipariş gelirini, uygun benzersiz kampanyaların sayısı kadar eşit paya böl ve sonra kampanya düzeyine topla.",
    outputGrain: "Bir pazarlama kampanyası.",
    acceptanceChecks: [
      "Aynı sipariş–kampanya çiftindeki tekrarlı temas yalnız bir kredi üretir.",
      "Atfedilen kampanya gelirlerinin toplamı yalnız uygun teması olan siparişlerin gelirine eşittir.",
      "Hiç uygun siparişi olmayan kampanya sıfır değerlerle sonuçta kalır.",
    ],
    dataNotes: [
      "Search kampanyasının aynı siparişten önce iki temas kaydı vardır.",
      "Bir siparişin tek teması 30 günlük pencerenin dışında olduğu için atıfsız kalır.",
      "30 gün önceki temas dahildir; 31 gün önceki temas dahil değildir.",
    ],
    executionChecks: [
      "INTERVAL çıkarımı ile touch_date ve order_date karşılaştırmasının aynı tarih türünde çalıştığını kontrol et.",
      "Her ara CTE'de order_id ve campaign_id anahtarlarının kaybolmadığını doğrula.",
    ],
    columnChecks: [
      "Kolonları campaign_name, attributed_orders, attributed_revenue ve revenue_share_pct olarak döndür.",
      "Gelir ile yüzde payını iki ondalığa yuvarla; sipariş sayısını benzersiz sipariş olarak bırak.",
    ],
    rowChecks: [
      "Temasları siparişe yalnız aynı customer_id ve geçerli lookback penceresinde bağla.",
      "Kampanya sayısını ham touchpoint sayısından değil tekil sipariş–kampanya çiftlerinden hesapla.",
      "Yüzde payın paydasında atıfsız sipariş geliri bulunmamalıdır.",
    ],
    orderChecks: [
      "Önce attributed_revenue azalan, eşitlikte campaign_name artan sırala.",
      "Sıralamayı biçimlendirilmiş metin yerine sayısal atfedilen gelir üzerinden yap.",
    ],
    conceptChecks: [
      "Tahsis zincirini CTE'lerle görünür kur ve kampanya omurgasını LEFT JOIN ile koru.",
      "Kampanya toplamını GROUP BY ve SUM ile, toplam payı pencere toplamıyla üret.",
    ],
    steps: [
      "Geçerli lookback içindeki sipariş–kampanya çiftlerini DISTINCT ile üret.",
      "Sipariş başına kampanya sayısını bulup geliri eşit paylara ayır.",
      "Payları kampanyada topla, tüm kampanya omurgasına bağla ve toplam gelir payını hesapla.",
    ],
    whyItWorks:
      "Tekilleştirme frekans yanlılığını keser; sipariş bazlı paylaştırma gelirin korunmasını sağlar; kampanya omurgası sıfır performansı görünmez yapmaz.",
    edgeCases: [
      "Aynı kampanya aynı siparişten önce iki kez temas etmiştir.",
      "Siparişin hiçbir uygun kampanyası yoktur.",
      "Kampanyanın hiç atfedilmiş siparişi yoktur ama raporda görünmelidir.",
    ],
    workplaceImpact:
      "Ekip son tıklama yanlılığından daha şeffaf bir başlangıç modeline geçer ve toplam dağıtılan geliri denetleyebilir.",
    transferPrompt:
      "İlk ve son temasa %40, kalan temaslara toplam %20 verilse hangi ara katmanı değiştirirdin?",
    transferReveal:
      "Sipariş içindeki temas sırasını pencere fonksiyonlarıyla belirler, allocated katmanındaki eşit pay formülünü konumsal ağırlıklarla değiştirirdim.",
  }),
  "m11-t10": createProjectLearningContent({
    title: "Incrementality deneyi",
    conceptAnchor:
      "Treatment sonucundan, kontrol oranının treatment büyüklüğünde üreteceği beklenen dönüşümü çıkar.",
    outputGrain: "Bir pazarlama deneyi.",
    acceptanceChecks: [
      "Aynı müşterinin deney içindeki tekrarlı dönüşümleri tek converter sayılır.",
      "Atamadan önce veya deney bitişinden sonra oluşan dönüşümler dışarıda kalır.",
      "Kontrolsüz deney bölme hatası üretmeden Yetersiz kontrol olarak işaretlenir.",
    ],
    dataNotes: [
      "Summer Launch treatment grubunda aynı müşterinin iki conversion satırı vardır.",
      "Atama öncesi ve deney sonu conversion kayıtları kasıtlı olarak bulunur.",
      "Brand Awareness deneyinde control assignment yoktur.",
    ],
    executionChecks: [
      "Atama başlangıcında GREATEST kullanımının iki DATE değerini karşılaştırdığını doğrula.",
      "FILTER koşullarında variant metinlerinin treatment ve control değerleriyle birebir eşleştiğini kontrol et.",
    ],
    columnChecks: [
      "Sekiz teslim kolonunu objective'teki adlarla ve aynı sırayla alias'la.",
      "Rate ve lift değerlerini yüzde puan olarak, incremental_conversions değerini ondalıklı sayı olarak döndür.",
    ],
    rowChecks: [
      "Geçerli converter listesini experiment_id ve customer_id birlikte tekilleştir.",
      "Kullanıcı paydalarını assignment satırlarından, converter paylarını tekilleştirilmiş listeden say.",
      "Kontrolsüz deneyde kontrol oranı, lift ve incremental değerler 0; karar ise Yetersiz kontrol olmalıdır.",
    ],
    orderChecks: [
      "Sonucu experiment_name artan sırala.",
      "Karar veya lift büyüklüğünü ikincil ve istenmeyen bir sıralama ölçütü yapma.",
    ],
    conceptChecks: [
      "Dönüşen müşteri setini CTE ile ayır ve assignment omurgasına LEFT JOIN et.",
      "Grup metriklerini koşullu COUNT, korumalı oranları CASE ile üret.",
    ],
    steps: [
      "Her deney–müşteri için atama sonrası ve deney içindeki geçerli dönüşümü tekilleştir.",
      "Deney bazında treatment/control kullanıcı ve converter sayılarını koşullu topla.",
      "Oran, lift, beklenen kontrol dönüşümü ve karar eşiklerini güvenli biçimde hesapla.",
    ],
    whyItWorks:
      "Holdout oranı kampanyasız baz davranışı temsil eder; bu oranı treatment büyüklüğüne ölçeklemek gözlenen dönüşüm içindeki artımlı bölümü ayırır.",
    edgeCases: [
      "Bir kullanıcı bir deney penceresinde iki kez dönüşür.",
      "Conversion atamadan bir gün önce veya deney bittikten bir gün sonra gerçekleşir.",
      "Deneyde hiç control kullanıcısı yoktur.",
    ],
    workplaceImpact:
      "Bütçe kararı toplam dönüşüm yerine deneysel olarak savunulabilen artımlı katkıya dayanır.",
    transferPrompt:
      "Grupların büyüklüğü çok dengesiz olduğunda neden ham converter farkını kullanmamalısın?",
    transferReveal:
      "Ham fark grup büyüklüğünü etkiyle karıştırır; önce oranları karşılaştırıp kontrol oranını treatment büyüklüğüne ölçeklemek gerekir.",
  }),
  "m11-t11": createProjectLearningContent({
    title: "Bütçe yeniden dağıtımı",
    conceptAnchor:
      "Farklı olay tablolarını ayrı dönem özetlerinde topla; CAC trendini ancak iki dönem de ölçülebilirse yorumla.",
    outputGrain: "Bir pazarlama kanalı.",
    acceptanceChecks: [
      "Her kanal harcama veya dönüşüm kaydı eksik olsa da bir satırda görünür.",
      "CAC change, current ve previous CAC arasındaki yüzdesel değişimi doğru işaretle gösterir.",
      "Önerilen bütçe recommendation kuralıyla birebir uyumlu ve parasal sayı olarak döner.",
    ],
    dataNotes: [
      "Affiliate current haftada harcama yapmış ama conversion satırı üretmemiştir.",
      "Affiliate previous haftada açıkça sıfır conversion kaydına sahiptir.",
      "Spend ve conversion tablolarının satır sayıları gelecekte farklılaşabilir; ham JOIN toplamları katlayabilir.",
    ],
    executionChecks: [
      "FILTER içindeki iki haftalık DATE sınırlarının dahil olduğunu doğrula.",
      "Sıfır conversion kontrolünü bölme işleminden önce CASE dalında uygula.",
    ],
    columnChecks: [
      "current spend kolonunu current_week_spend olarak alias'la ve yedi kolonu sözleşme sırasıyla döndür.",
      "Ölçülemeyen CAC ve trend değerlerini 0 yerine NULL bırak.",
    ],
    rowChecks: [
      "Spend ve conversion verisini ayrı ayrı channel_id düzeyinde topla.",
      "Eksik metrik satırlarını kanal omurgasında COALESCE ile sıfır sayıya çevir, oranı ise NULL koru.",
      "Durdur ve incele kuralını Artır/Azalt trend eşiklerinden önce değerlendir.",
    ],
    orderChecks: [
      "proposed_budget azalan, eşitlikte channel_name artan sırala.",
      "Recommendation metnini alfabetik sıralama ölçütü olarak kullanma.",
    ],
    conceptChecks: [
      "Dönem özetleri ve karar katmanlarını CTE'lerle ayır; eksik kanal ölçülerini LEFT JOIN ile koru.",
      "Toplamları SUM, sıfır güvenli oran ve öneriyi CASE, nihai önceliği ORDER BY ile üret.",
    ],
    steps: [
      "Spend ve conversion tablolarında previous/current haftaları ayrı koşullu toplamlarla özetle.",
      "Kanal–bütçe omurgasına özetleri bağlayıp iki CAC ve ölçülebilir trendi hesapla.",
      "Trend/sıfır conversion kurallarından recommendation ve buna bağlı proposed_budget üret.",
    ],
    whyItWorks:
      "Ön toplama metrik fan-out'unu engeller; NULL oran semantiği ölçülemeyen performansı kötü performanstan ayırır; kural katmanı öneriyi denetlenebilir yapar.",
    edgeCases: [
      "Current haftada conversion satırı hiç yoktur.",
      "Previous haftada conversion sayısı açıkça sıfırdır ve trend hesaplanamaz.",
      "CAC iyileşirken harcama artabilir; öneri salt harcamaya değil birim maliyet trendine dayanır.",
    ],
    workplaceImpact:
      "Pazarlama direktörü bütçe değişikliğinin hangi ölçüm ve eşiğe dayandığını kanalla birlikte görebilir.",
    transferPrompt:
      "Conversion hacmi %50 düşerken CAC %12 iyileşse tek başına Artır kararı yeterli olur mu?",
    transferReveal:
      "Hayır; gerçek sistemde minimum hacim veya güven aralığı gibi ikinci bir koruma eşiği eklerdim.",
  }),
  "m11-t12": createProjectLearningContent({
    title: "Yönetici büyüme scorecard'ı",
    conceptAnchor:
      "Her metriği doğal tanesinde ayrı topla, hedef tabanlı tavanlı puana çevir ve tek yönetici aksiyonunda birleştir.",
    outputGrain: "Haziran 2026 performansı için bir bölge.",
    acceptanceChecks: [
      "Tüm bölgeler, Haziran harcaması veya yeni müşterisi olmasa da scorecard'da görünür.",
      "Net gelir gross_amount eksi refund_amount toplamıdır; active customer rapor sonu abonelik durumuna göre sayılır.",
      "Growth score 100'ü aşmaz ve executive_action hedef/koruma eşikleriyle tutarlıdır.",
    ],
    dataNotes: [
      "South bölgesinde Haziran harcaması ve yeni müşteri yoktur ama aktif müşteri ve gelir vardır.",
      "West'teki bir abonelik 30 Haziran'dan önce iptal olduğu için aktif sayılmaz.",
      "Central bölgesinde ayrı refund olayı net geliri düşürür.",
      "Marketing spend birden çok kanal satırına, revenue birden çok müşteri olayına dağılmıştır.",
    ],
    executionChecks: [
      "LEAST içindeki oranlarda integer division oluşmaması için en az bir tarafı numeric tut.",
      "NULL cancelled_at ve sıfır new_customers dallarını tarih/oran hesaplarından önce koru.",
    ],
    columnChecks: [
      "Sekiz scorecard kolonunu objective'teki adlarla ve aynı sırayla döndür.",
      "CAC'yi iki, growth_score'u bir ondalığa yuvarla; yeni müşterisiz bölgede CAC NULL olsun.",
    ],
    rowChecks: [
      "Harcama, yeni müşteri, aktif abonelik ve net geliri dört ayrı bölge özeti olarak üret.",
      "Aktif müşteride started_at rapor sonundan geç olmamalı; cancelled_at NULL veya rapor sonundan sonra olmalıdır.",
      "Bölge–hedef omurgasına özetleri LEFT JOIN et; veri yokluğunu oran aşamasında kontrollü ele al.",
      "Karar CASE'inde Ölçekle koşulunu önce, Düzelt koruma koşullarını sonra değerlendir.",
    ],
    orderChecks: [
      "growth_score azalan, eşit puanda region_name artan sırala.",
      "Yuvarlanmamış veya metne çevrilmiş bir değerle görünür sıralamayı çeliştirme.",
    ],
    conceptChecks: [
      "Metrik katmanlarını CTE ve GROUP BY ile izole et; scorecard omurgasında çoklu LEFT JOIN kullan.",
      "COUNT/SUM ölçülerini, CASE tabanlı puan ve aksiyonu, karar sıralı ORDER BY'ı açıkça göster.",
    ],
    steps: [
      "Dört olay alanını Haziran ve bölge tanesinde ayrı CTE'lerde özetle.",
      "Bölgeleri hedeflerle birleştirip metrikleri bağla; CAC ve üç puan bileşenini hesapla.",
      "Tavanlı bileşenleri growth_score'a, hedef eşiklerini executive_action'a dönüştürüp sırala.",
    ],
    whyItWorks:
      "Ölçülerin ayrı toplanması join fan-out'unu engeller; hedef tavanları tek güçlü metriğin zayıflıkları kapatmasını önler; aksiyon kuralları skoru yönetim kararına çevirir.",
    edgeCases: [
      "Bölgede harcama ve yeni müşteri yokken mevcut müşteriden gelir vardır.",
      "Abonelik ay içinde başlamış ve ay bitmeden iptal olmuştur.",
      "Refund ayrı olay olarak geliri aşağı çekmektedir.",
      "İki bölgenin skoru eşittir ve ikincil alfabetik sıra gerekir.",
    ],
    workplaceImpact:
      "Yönetici, bölgesel büyümeyi hacim, gelir ve verimlilik dengesinde görür; toplantı çıktısı Ölçekle/İzle/Düzelt aksiyonuna bağlanır.",
    transferPrompt:
      "Net revenue hedefinin stratejik ağırlığı iki katına çıksa scorecard'ı nasıl yeniden dengelerdin?",
    transferReveal:
      "Toplam 100'ü koruyacak yeni ağırlıklar belirler, her bileşeni yine kendi hedef oranında tavanlar ve karar eşiklerini yeni ağırlıklardan bağımsız açık kurallarda tutardım.",
  }),
};
