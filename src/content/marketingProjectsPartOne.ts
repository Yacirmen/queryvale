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

export const MARKETING_PROJECT_SOLUTIONS_PART_ONE: Record<string, string> = {
  "m11-t1": `
    WITH spend_by_campaign AS (
      SELECT campaign_id, SUM(spend_amount) AS spend
      FROM campaign_spend
      GROUP BY campaign_id
    ),
    session_flags AS (
      SELECT
        s.campaign_id,
        s.session_id,
        MAX(CASE WHEN e.event_type = 'product_view' THEN 1 ELSE 0 END) AS viewed,
        MAX(CASE WHEN e.event_type = 'add_to_cart' THEN 1 ELSE 0 END) AS carted,
        MAX(CASE WHEN e.event_type = 'purchase' THEN 1 ELSE 0 END) AS purchased
      FROM campaign_sessions s
      LEFT JOIN funnel_events e ON e.session_id = s.session_id
      GROUP BY s.campaign_id, s.session_id
    ),
    funnel_by_campaign AS (
      SELECT
        campaign_id,
        COUNT(*) AS visitors,
        SUM(viewed) AS product_viewers,
        SUM(carted) AS cart_sessions,
        SUM(purchased) AS purchasers
      FROM session_flags
      GROUP BY campaign_id
    ),
    report AS (
      SELECT
        c.campaign_name,
        COALESCE(s.spend, 0) AS spend,
        COALESCE(f.visitors, 0) AS visitors,
        COALESCE(f.product_viewers, 0) AS product_viewers,
        COALESCE(f.cart_sessions, 0) AS cart_sessions,
        COALESCE(f.purchasers, 0) AS purchasers
      FROM campaigns c
      LEFT JOIN spend_by_campaign s ON s.campaign_id = c.campaign_id
      LEFT JOIN funnel_by_campaign f ON f.campaign_id = c.campaign_id
    ),
    scored AS (
      SELECT
        *,
        CASE
          WHEN visitors = 0 THEN 0
          ELSE ROUND(purchasers * 100.0 / visitors, 2)
        END AS visit_to_purchase_pct
      FROM report
    )
    SELECT
      campaign_name,
      spend,
      visitors,
      product_viewers,
      cart_sessions,
      purchasers,
      visit_to_purchase_pct,
      CASE
        WHEN visitors = 0 THEN 'Trafik yok'
        WHEN visit_to_purchase_pct >= 40 THEN 'Sağlıklı'
        WHEN cart_sessions > 0
          AND purchasers * 100.0 / cart_sessions < 50 THEN 'Checkout kaçağı'
        WHEN product_viewers * 100.0 / visitors < 60 THEN 'Üst funnel zayıf'
        ELSE 'İzle'
      END AS health_status
    FROM scored
    ORDER BY visit_to_purchase_pct DESC, campaign_name;
  `,
  "m11-t2": `
    WITH spend_by_channel AS (
      SELECT channel_id, SUM(spend_amount) AS spend
      FROM channel_spend
      WHERE spend_date BETWEEN DATE '2026-06-01' AND DATE '2026-06-30'
      GROUP BY channel_id
    ),
    eligible_customers AS (
      SELECT customer_id, channel_id, acquired_at
      FROM acquired_customers
      WHERE acquired_at BETWEEN DATE '2026-06-01' AND DATE '2026-06-30'
    ),
    revenue_by_customer AS (
      SELECT
        c.customer_id,
        c.channel_id,
        SUM(o.gross_revenue - o.refund_amount) AS net_revenue
      FROM eligible_customers c
      LEFT JOIN customer_orders o
        ON o.customer_id = c.customer_id
       AND o.order_date >= c.acquired_at
       AND o.order_date <= c.acquired_at + INTERVAL '90 days'
       AND o.order_date <= DATE '2026-09-30'
      GROUP BY c.customer_id, c.channel_id
    ),
    acquisition_by_channel AS (
      SELECT
        c.channel_id,
        COUNT(*) AS acquired_customers,
        COALESCE(SUM(r.net_revenue), 0) AS net_revenue_90d
      FROM eligible_customers c
      LEFT JOIN revenue_by_customer r ON r.customer_id = c.customer_id
      GROUP BY c.channel_id
    ),
    base AS (
      SELECT
        ch.channel_name,
        COALESCE(s.spend, 0) AS spend,
        COALESCE(a.acquired_customers, 0) AS acquired_customers,
        COALESCE(a.net_revenue_90d, 0) AS net_revenue_90d
      FROM acquisition_channels ch
      LEFT JOIN spend_by_channel s ON s.channel_id = ch.channel_id
      LEFT JOIN acquisition_by_channel a ON a.channel_id = ch.channel_id
    ),
    metrics AS (
      SELECT
        *,
        CASE
          WHEN acquired_customers = 0 THEN NULL
          ELSE ROUND(spend::numeric / acquired_customers, 2)
        END AS cac,
        CASE
          WHEN spend = 0 THEN NULL
          ELSE ROUND(net_revenue_90d::numeric / spend, 2)
        END AS roas
      FROM base
    )
    SELECT
      channel_name,
      spend,
      acquired_customers,
      net_revenue_90d,
      cac,
      roas,
      CASE
        WHEN acquired_customers = 0 THEN 'Duraklat'
        WHEN spend = 0 THEN 'Kazanılmış büyüme'
        WHEN cac <= 200 AND roas >= 3 THEN 'Ölçekle'
        WHEN cac <= 300 AND roas >= 1.5 THEN 'Optimize et'
        ELSE 'Bütçeyi azalt'
      END AS efficiency_action
    FROM metrics
    ORDER BY roas DESC NULLS LAST, channel_name;
  `,
  "m11-t3": `
    WITH converted_visitors AS (
      SELECT DISTINCT
        a.experiment_id,
        a.visitor_id
      FROM experiment_assignments a
      INNER JOIN experiments e ON e.experiment_id = a.experiment_id
      INNER JOIN conversion_events c
        ON c.visitor_id = a.visitor_id
       AND c.event_type = 'signup'
       AND c.converted_at >= a.assigned_at
       AND c.converted_at >= e.start_date
       AND c.converted_at <= e.end_date
    ),
    variant_metrics AS (
      SELECT
        v.experiment_id,
        v.variant_name,
        v.is_control,
        COUNT(a.visitor_id) AS assigned_visitors,
        COUNT(c.visitor_id) AS converted_visitors
      FROM experiment_variants v
      LEFT JOIN experiment_assignments a
        ON a.experiment_id = v.experiment_id
       AND a.variant_name = v.variant_name
      LEFT JOIN converted_visitors c
        ON c.experiment_id = a.experiment_id
       AND c.visitor_id = a.visitor_id
      GROUP BY v.experiment_id, v.variant_name, v.is_control
    ),
    rates AS (
      SELECT
        *,
        ROUND(converted_visitors * 100.0 / assigned_visitors, 2)
          AS conversion_rate
      FROM variant_metrics
    ),
    control_rate AS (
      SELECT experiment_id, conversion_rate
      FROM rates
      WHERE is_control
    )
    SELECT
      r.variant_name,
      r.assigned_visitors,
      r.converted_visitors,
      r.conversion_rate,
      ROUND(r.conversion_rate - c.conversion_rate, 2) AS lift_pp,
      CASE
        WHEN r.is_control THEN 'Baz'
        WHEN r.conversion_rate - c.conversion_rate >= 10 THEN 'Kazanan'
        WHEN r.conversion_rate - c.conversion_rate <= -10 THEN 'Durdur'
        ELSE 'Testi sürdür'
      END AS experiment_decision
    FROM rates r
    INNER JOIN control_rate c ON c.experiment_id = r.experiment_id
    ORDER BY CASE WHEN r.is_control THEN 0 ELSE 1 END, r.variant_name;
  `,
  "m11-t4": `
    WITH term_metrics AS (
      SELECT
        c.campaign_name,
        t.search_term,
        SUM(m.clicks) AS clicks,
        SUM(m.spend_amount) AS spend,
        SUM(m.conversions) AS conversions,
        SUM(m.revenue) AS revenue
      FROM campaigns c
      INNER JOIN ad_groups g ON g.campaign_id = c.campaign_id
      INNER JOIN search_terms t ON t.ad_group_id = g.ad_group_id
      INNER JOIN search_term_daily_metrics m ON m.term_id = t.term_id
      WHERE m.metric_date BETWEEN DATE '2026-06-01' AND DATE '2026-06-30'
      GROUP BY c.campaign_name, t.search_term
    ),
    scored AS (
      SELECT
        *,
        CASE
          WHEN spend = 0 THEN NULL
          ELSE ROUND(revenue::numeric / spend, 2)
        END AS roas
      FROM term_metrics
    )
    SELECT
      campaign_name,
      search_term,
      clicks,
      spend,
      conversions,
      roas,
      CASE
        WHEN conversions = 0 THEN 'Dönüşüm yok'
        ELSE 'Düşük ROAS'
      END AS waste_reason,
      CASE
        WHEN conversions = 0 THEN 'Negatif kelime ekle'
        ELSE 'Teklifi azalt'
      END AS recommended_action
    FROM scored
    WHERE spend >= 100
      AND (conversions = 0 OR roas < 1.5)
    ORDER BY spend DESC, search_term;
  `,
  "m11-t5": `
    WITH send_flags AS (
      SELECT
        s.campaign_id,
        s.send_id,
        MAX(CASE WHEN e.event_type = 'delivered' THEN 1 ELSE 0 END) AS delivered,
        MAX(CASE WHEN e.event_type = 'open' THEN 1 ELSE 0 END) AS opened,
        MAX(CASE WHEN e.event_type = 'click' THEN 1 ELSE 0 END) AS clicked,
        MAX(CASE WHEN e.event_type = 'purchase' THEN 1 ELSE 0 END) AS purchased
      FROM email_sends s
      LEFT JOIN email_events e ON e.send_id = s.send_id
      GROUP BY s.campaign_id, s.send_id
    ),
    funnel AS (
      SELECT
        campaign_id,
        SUM(delivered) AS delivered,
        SUM(CASE WHEN delivered = 1 AND opened = 1 THEN 1 ELSE 0 END) AS openers,
        SUM(CASE WHEN delivered = 1 AND opened = 1 AND clicked = 1 THEN 1 ELSE 0 END) AS clickers,
        SUM(CASE
          WHEN delivered = 1 AND opened = 1 AND clicked = 1 AND purchased = 1
            THEN 1 ELSE 0
        END) AS purchasers
      FROM send_flags
      GROUP BY campaign_id
    ),
    rates AS (
      SELECT
        c.campaign_name,
        COALESCE(f.delivered, 0) AS delivered,
        COALESCE(f.openers, 0) AS openers,
        COALESCE(f.clickers, 0) AS clickers,
        COALESCE(f.purchasers, 0) AS purchasers,
        CASE WHEN COALESCE(f.delivered, 0) = 0 THEN NULL
          ELSE ROUND(f.openers * 100.0 / f.delivered, 2) END AS open_rate,
        CASE WHEN COALESCE(f.openers, 0) = 0 THEN NULL
          ELSE ROUND(f.clickers * 100.0 / f.openers, 2) END AS click_to_open_rate,
        CASE WHEN COALESCE(f.delivered, 0) = 0 THEN NULL
          ELSE ROUND(f.purchasers * 100.0 / f.delivered, 2) END AS purchase_rate
      FROM email_campaigns c
      LEFT JOIN funnel f ON f.campaign_id = c.campaign_id
    ),
    classified AS (
      SELECT
        *,
        CASE
          WHEN delivered = 0 THEN 'Teslimat yok'
          WHEN open_rate < 40 THEN 'Konu satırı zayıf'
          WHEN click_to_open_rate < 40 THEN 'CTA zayıf'
          WHEN purchase_rate < 15 THEN 'Teklif zayıf'
          ELSE 'Sağlıklı'
        END AS health_status
      FROM rates
    )
    SELECT
      campaign_name,
      delivered,
      openers,
      clickers,
      purchasers,
      open_rate,
      click_to_open_rate,
      purchase_rate,
      health_status
    FROM classified
    ORDER BY CASE health_status
      WHEN 'Teslimat yok' THEN 1
      WHEN 'Konu satırı zayıf' THEN 2
      WHEN 'CTA zayıf' THEN 3
      WHEN 'Teklif zayıf' THEN 4
      ELSE 5
    END, campaign_name;
  `,
  "m11-t6": `
    WITH gross_by_order AS (
      SELECT
        o.order_id,
        o.customer_id,
        o.order_date,
        SUM(i.quantity * i.unit_price) AS gross_amount
      FROM customer_orders o
      INNER JOIN order_items i ON i.order_id = o.order_id
      WHERE o.status = 'completed'
        AND o.order_date <= DATE '2026-06-30'
      GROUP BY o.order_id, o.customer_id, o.order_date
    ),
    refunds_by_order AS (
      SELECT order_id, SUM(refund_amount) AS refund_amount
      FROM order_refunds
      WHERE refunded_at <= DATE '2026-06-30'
      GROUP BY order_id
    ),
    valid_orders AS (
      SELECT
        g.order_id,
        g.customer_id,
        g.order_date,
        g.gross_amount - COALESCE(r.refund_amount, 0) AS net_amount
      FROM gross_by_order g
      LEFT JOIN refunds_by_order r ON r.order_id = g.order_id
    ),
    rfm AS (
      SELECT
        c.customer_name,
        MAX(v.order_date) AS last_order_date,
        CASE
          WHEN MAX(v.order_date) IS NULL THEN NULL
          ELSE DATE '2026-06-30' - MAX(v.order_date)
        END AS recency_days,
        COUNT(v.order_id) AS frequency,
        COALESCE(SUM(v.net_amount), 0) AS monetary_value
      FROM customers c
      LEFT JOIN valid_orders v ON v.customer_id = c.customer_id
      GROUP BY c.customer_id, c.customer_name
    ),
    segmented AS (
      SELECT
        *,
        CASE
          WHEN recency_days <= 30 AND frequency >= 3 AND monetary_value >= 1000
            THEN 'Şampiyonlar'
          WHEN recency_days <= 60 AND frequency >= 2 AND monetary_value >= 500
            THEN 'Sadıklar'
          WHEN recency_days > 90 AND frequency >= 2 THEN 'Riskte'
          WHEN recency_days <= 30 AND frequency = 1 THEN 'Yeni'
          ELSE 'Uykuda'
        END AS rfm_segment
      FROM rfm
    )
    SELECT
      customer_name,
      last_order_date,
      recency_days,
      frequency,
      monetary_value,
      rfm_segment
    FROM segmented
    ORDER BY CASE rfm_segment
      WHEN 'Şampiyonlar' THEN 1
      WHEN 'Sadıklar' THEN 2
      WHEN 'Yeni' THEN 3
      WHEN 'Riskte' THEN 4
      ELSE 5
    END, monetary_value DESC, customer_name;
  `,
};

export const MARKETING_PROJECT_TASK_INPUTS_PART_ONE: AuthoredTask[] = [
  {
    id: "m11-t1",
    slug: "campaign-funnel-health",
    moduleId: "module-11",
    title: "Kampanya funnel sağlığını teşhis et",
    subtitle:
      "Harcama ile oturum adımlarını fanout üretmeden tek karar tablosunda birleştir.",
    scenario:
      "Growth ekibi, kampanyaların yalnız satın alma sayısını değil, ziyaret–ürün–sepet–satın alma zincirinde nerede kayıp verdiğini görmek istiyor.",
    objective:
      "Her kampanya için toplam spend, benzersiz visitors, product_viewers, cart_sessions, purchasers ve visit_to_purchase_pct üret. Oturumu her adımda yalnız bir kez say; trafiği olmayan kampanyayı koru. Sağlık durumunu verilen funnel eşiklerine göre sınıflandır ve dönüşüm oranı azalan, kampanya adı artan sırada getir.",
    difficulty: "advanced",
    estimatedMinutes: 34,
    prerequisites: ["m10-t4"],
    concepts: [
      "REPORTING",
      "CTE",
      "LEFT_JOIN",
      "MULTI_JOIN",
      "CONDITIONAL_AGGREGATION",
      "GROUP_BY",
      "CASE",
      "ARITHMETIC",
      "ORDER_BY",
    ],
    setupSql: `
      CREATE TABLE campaigns (
        campaign_id INTEGER PRIMARY KEY,
        campaign_name TEXT NOT NULL UNIQUE
      );
      CREATE TABLE campaign_spend (
        spend_id INTEGER PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(campaign_id),
        spend_date DATE NOT NULL,
        spend_amount INTEGER NOT NULL
      );
      CREATE TABLE campaign_sessions (
        session_id INTEGER PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(campaign_id),
        visitor_id INTEGER NOT NULL,
        started_at TIMESTAMP NOT NULL
      );
      CREATE TABLE funnel_events (
        event_id INTEGER PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES campaign_sessions(session_id),
        event_type TEXT NOT NULL,
        event_at TIMESTAMP NOT NULL
      );

      INSERT INTO campaigns VALUES
        (1, 'Summer Search'),
        (2, 'Social Video'),
        (3, 'Retargeting'),
        (4, 'Brand Awareness'),
        (5, 'Podcast Test');
      INSERT INTO campaign_spend VALUES
        (1, 1, DATE '2026-06-01', 600),
        (2, 1, DATE '2026-06-08', 400),
        (3, 2, DATE '2026-06-01', 500),
        (4, 3, DATE '2026-06-01', 300),
        (5, 4, DATE '2026-06-01', 200),
        (6, 5, DATE '2026-06-01', 100);
      INSERT INTO campaign_sessions VALUES
        (101, 1, 1001, TIMESTAMP '2026-06-03 10:00'),
        (102, 1, 1002, TIMESTAMP '2026-06-03 11:00'),
        (103, 1, 1003, TIMESTAMP '2026-06-04 09:00'),
        (104, 1, 1004, TIMESTAMP '2026-06-05 14:00'),
        (105, 1, 1005, TIMESTAMP '2026-06-06 16:00'),
        (201, 2, 2001, TIMESTAMP '2026-06-03 10:00'),
        (202, 2, 2002, TIMESTAMP '2026-06-04 10:00'),
        (203, 2, 2003, TIMESTAMP '2026-06-05 10:00'),
        (204, 2, 2004, TIMESTAMP '2026-06-06 10:00'),
        (301, 3, 3001, TIMESTAMP '2026-06-07 10:00'),
        (302, 3, 3002, TIMESTAMP '2026-06-08 10:00'),
        (303, 3, 3003, TIMESTAMP '2026-06-09 10:00'),
        (401, 4, 4001, TIMESTAMP '2026-06-10 10:00'),
        (402, 4, 4002, TIMESTAMP '2026-06-11 10:00');
      INSERT INTO funnel_events VALUES
        (1, 101, 'product_view', TIMESTAMP '2026-06-03 10:02'),
        (2, 101, 'add_to_cart', TIMESTAMP '2026-06-03 10:04'),
        (3, 101, 'purchase', TIMESTAMP '2026-06-03 10:07'),
        (4, 102, 'product_view', TIMESTAMP '2026-06-03 11:02'),
        (5, 102, 'add_to_cart', TIMESTAMP '2026-06-03 11:05'),
        (6, 102, 'purchase', TIMESTAMP '2026-06-03 11:08'),
        (7, 103, 'product_view', TIMESTAMP '2026-06-04 09:03'),
        (8, 103, 'add_to_cart', TIMESTAMP '2026-06-04 09:05'),
        (9, 104, 'product_view', TIMESTAMP '2026-06-05 14:03'),
        (10, 201, 'product_view', TIMESTAMP '2026-06-03 10:03'),
        (11, 201, 'product_view', TIMESTAMP '2026-06-03 10:04'),
        (12, 201, 'add_to_cart', TIMESTAMP '2026-06-03 10:05'),
        (13, 201, 'purchase', TIMESTAMP '2026-06-03 10:09'),
        (14, 202, 'product_view', TIMESTAMP '2026-06-04 10:03'),
        (15, 202, 'add_to_cart', TIMESTAMP '2026-06-04 10:05'),
        (16, 203, 'product_view', TIMESTAMP '2026-06-05 10:03'),
        (17, 203, 'add_to_cart', TIMESTAMP '2026-06-05 10:05'),
        (18, 204, 'product_view', TIMESTAMP '2026-06-06 10:03'),
        (19, 301, 'product_view', TIMESTAMP '2026-06-07 10:03'),
        (20, 401, 'product_view', TIMESTAMP '2026-06-10 10:03'),
        (21, 401, 'add_to_cart', TIMESTAMP '2026-06-10 10:06'),
        (22, 402, 'product_view', TIMESTAMP '2026-06-11 10:03');
    `,
    schema: {
      tables: [
        {
          name: "campaigns",
          description: "Raporlanacak kampanya ana listesi.",
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
          name: "campaign_spend",
          description: "Kampanyanın farklı günlerde oluşan harcama kayıtları.",
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
            { name: "spend_date", dataType: "DATE", nullable: false },
            { name: "spend_amount", dataType: "INTEGER", nullable: false },
          ],
        },
        {
          name: "campaign_sessions",
          description: "Kampanyaya atfedilmiş ziyaret oturumları.",
          columns: [
            {
              name: "session_id",
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
            { name: "visitor_id", dataType: "INTEGER", nullable: false },
            { name: "started_at", dataType: "TIMESTAMP", nullable: false },
          ],
        },
        {
          name: "funnel_events",
          description:
            "Bir oturumda tekrarlanabilen ürün, sepet ve satın alma olayları.",
          columns: [
            {
              name: "event_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "session_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "campaign_sessions", column: "session_id" },
            },
            { name: "event_type", dataType: "TEXT", nullable: false },
            { name: "event_at", dataType: "TIMESTAMP", nullable: false },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "campaign_spend",
          fromColumn: "campaign_id",
          toTable: "campaigns",
          toColumn: "campaign_id",
        },
        {
          fromTable: "campaign_sessions",
          fromColumn: "campaign_id",
          toTable: "campaigns",
          toColumn: "campaign_id",
        },
        {
          fromTable: "funnel_events",
          fromColumn: "session_id",
          toTable: "campaign_sessions",
          toColumn: "session_id",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "campaigns",
        rows: [
          { campaign_id: 1, campaign_name: "Summer Search" },
          { campaign_id: 5, campaign_name: "Podcast Test" },
        ],
      },
      {
        tableName: "campaign_sessions",
        rows: [
          {
            session_id: 101,
            campaign_id: 1,
            visitor_id: 1001,
            started_at: "2026-06-03 10:00",
          },
          {
            session_id: 201,
            campaign_id: 2,
            visitor_id: 2001,
            started_at: "2026-06-03 10:00",
          },
        ],
      },
      {
        tableName: "funnel_events",
        rows: [
          {
            event_id: 10,
            session_id: 201,
            event_type: "product_view",
            event_at: "2026-06-03 10:03",
          },
          {
            event_id: 11,
            session_id: 201,
            event_type: "product_view",
            event_at: "2026-06-03 10:04",
          },
        ],
      },
    ],
    expectedColumns: [
      "campaign_name",
      "spend",
      "visitors",
      "product_viewers",
      "cart_sessions",
      "purchasers",
      "visit_to_purchase_pct",
      "health_status",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Summer Search", 1000, 5, 4, 3, 2, 40, "Sağlıklı"],
      ["Social Video", 500, 4, 4, 3, 1, 25, "Checkout kaçağı"],
      ["Brand Awareness", 200, 2, 2, 1, 0, 0, "Checkout kaçağı"],
      ["Podcast Test", 100, 0, 0, 0, 0, 0, "Trafik yok"],
      ["Retargeting", 300, 3, 1, 0, 0, 0, "Üst funnel zayıf"],
    ],
    orderSensitive: true,
    requiredConcepts: ["CTE", "LEFT_JOIN", "GROUP_BY", "CASE", "ORDER_BY"],
    forbiddenOperations: [...MARKETING_PROJECT_READ_ONLY_FORBIDDEN],
    validationOptions: { numericTolerance: 0.01 },
    hints: [
      "Harcama ve olayları aynı ham JOIN üzerinde toplamak iki tarafı da çoğaltır; her veri akışını önce kendi doğal tanesinde özetle.",
      "Bir oturumda aynı olay tekrarlanabilir. Oturum başına 0/1 adım bayrakları üretip kampanya düzeyinde bu bayrakları topla.",
      "Harcama, session_flags ve funnel özetlerini ayrı CTE'lerde hazırla; kampanya ana listesinden LEFT JOIN ile başlayıp oran ve sağlık CASE'ini en dış katmanda kur.",
    ],
    explanation:
      "Oturum bayrakları yinelenen event'lerin funnelı şişirmesini, ayrı harcama özeti ise iki çoklu kaynağın fanout üretmesini engeller. Kampanya ana listesinden başlamak trafiği olmayan testlerin görünür kalmasını sağlar.",
    completionMessage:
      "Kampanya funnelı harcama ve adım kayıplarıyla birlikte güvenilir biçimde teşhis edildi.",
    nextTaskId: "m11-t2",
  },
  {
    id: "m11-t2",
    slug: "channel-acquisition-efficiency",
    moduleId: "module-11",
    title: "Kanal edinim verimliliğini karşılaştır",
    subtitle:
      "Edinim maliyetini müşterinin ilk 90 günlük net geliriyle aynı kanalda uzlaştır.",
    scenario:
      "Pazarlama direktörü, Haziran bütçesini hangi kanalda büyüteceğini yalnız lead sayısıyla değil, kazanılan müşteri ve ilk 90 günlük net gelirle belirlemek istiyor.",
    objective:
      "Haziran 2026 harcamasını ve Haziran'da edinilen müşterileri kanal düzeyinde birleştir. Her müşterinin edinim tarihinden itibaren 90 gün içindeki, 2026-09-30'u aşmayan net sipariş gelirini kullan. channel_name, spend, acquired_customers, net_revenue_90d, cac, roas ve efficiency_action getir; ROAS azalan NULLS LAST ve kanal adına göre sırala.",
    difficulty: "advanced",
    estimatedMinutes: 36,
    prerequisites: ["m10-t4"],
    concepts: [
      "REPORTING",
      "CTE",
      "LEFT_JOIN",
      "MULTI_JOIN",
      "DATE_FUNCTION",
      "COUNT",
      "SUM",
      "GROUP_BY",
      "CASE",
      "ARITHMETIC",
      "ORDER_BY",
    ],
    setupSql: `
      CREATE TABLE acquisition_channels (
        channel_id INTEGER PRIMARY KEY,
        channel_name TEXT NOT NULL UNIQUE
      );
      CREATE TABLE channel_spend (
        spend_id INTEGER PRIMARY KEY,
        channel_id INTEGER NOT NULL REFERENCES acquisition_channels(channel_id),
        spend_date DATE NOT NULL,
        spend_amount INTEGER NOT NULL
      );
      CREATE TABLE acquired_customers (
        customer_id INTEGER PRIMARY KEY,
        customer_name TEXT NOT NULL,
        channel_id INTEGER NOT NULL REFERENCES acquisition_channels(channel_id),
        acquired_at DATE NOT NULL
      );
      CREATE TABLE customer_orders (
        order_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES acquired_customers(customer_id),
        order_date DATE NOT NULL,
        gross_revenue INTEGER NOT NULL,
        refund_amount INTEGER NOT NULL
      );

      INSERT INTO acquisition_channels VALUES
        (1, 'Organic'),
        (2, 'Paid Search'),
        (3, 'Paid Social'),
        (4, 'Partner'),
        (5, 'Referral');
      INSERT INTO channel_spend VALUES
        (1, 1, DATE '2026-06-03', 40),
        (2, 1, DATE '2026-06-18', 60),
        (3, 2, DATE '2026-06-05', 350),
        (4, 2, DATE '2026-06-20', 250),
        (5, 3, DATE '2026-06-08', 500),
        (6, 3, DATE '2026-06-22', 400),
        (7, 4, DATE '2026-06-12', 300),
        (8, 2, DATE '2026-05-28', 999);
      INSERT INTO acquired_customers VALUES
        (101, 'Ada', 2, DATE '2026-06-02'),
        (102, 'Bora', 2, DATE '2026-06-10'),
        (103, 'Ceren', 2, DATE '2026-06-25'),
        (201, 'Deniz', 1, DATE '2026-06-05'),
        (202, 'Ekin', 1, DATE '2026-06-18'),
        (301, 'Fidan', 3, DATE '2026-06-07'),
        (302, 'Güneş', 3, DATE '2026-06-22'),
        (401, 'Hale', 5, DATE '2026-06-15'),
        (402, 'İpek', 4, DATE '2026-05-20');
      INSERT INTO customer_orders VALUES
        (1001, 101, DATE '2026-06-05', 1000, 100),
        (1002, 102, DATE '2026-07-01', 800, 0),
        (1003, 103, DATE '2026-08-15', 700, 0),
        (1004, 101, DATE '2026-10-15', 999, 0),
        (2001, 201, DATE '2026-06-20', 500, 0),
        (2002, 202, DATE '2026-07-10', 300, 0),
        (3001, 301, DATE '2026-06-30', 600, 100),
        (3002, 302, DATE '2026-08-01', 500, 0),
        (4001, 401, DATE '2026-06-20', 300, 0),
        (4002, 402, DATE '2026-06-01', 500, 0);
    `,
    schema: {
      tables: [
        {
          name: "acquisition_channels",
          description: "Ücretli ve kazanılmış müşteri edinim kanalları.",
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
          name: "channel_spend",
          description: "Kanalın farklı günlerde oluşan pazarlama harcamaları.",
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
              references: {
                table: "acquisition_channels",
                column: "channel_id",
              },
            },
            { name: "spend_date", dataType: "DATE", nullable: false },
            { name: "spend_amount", dataType: "INTEGER", nullable: false },
          ],
        },
        {
          name: "acquired_customers",
          description:
            "İlk edinim kanalı ve edinim tarihi sabitlenmiş müşteriler.",
          columns: [
            {
              name: "customer_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "customer_name", dataType: "TEXT", nullable: false },
            {
              name: "channel_id",
              dataType: "INTEGER",
              nullable: false,
              references: {
                table: "acquisition_channels",
                column: "channel_id",
              },
            },
            { name: "acquired_at", dataType: "DATE", nullable: false },
          ],
        },
        {
          name: "customer_orders",
          description:
            "Edinimden önce veya 90 günlük pencere dışında da bulunabilen siparişler.",
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
              references: {
                table: "acquired_customers",
                column: "customer_id",
              },
            },
            { name: "order_date", dataType: "DATE", nullable: false },
            { name: "gross_revenue", dataType: "INTEGER", nullable: false },
            { name: "refund_amount", dataType: "INTEGER", nullable: false },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "channel_spend",
          fromColumn: "channel_id",
          toTable: "acquisition_channels",
          toColumn: "channel_id",
        },
        {
          fromTable: "acquired_customers",
          fromColumn: "channel_id",
          toTable: "acquisition_channels",
          toColumn: "channel_id",
        },
        {
          fromTable: "customer_orders",
          fromColumn: "customer_id",
          toTable: "acquired_customers",
          toColumn: "customer_id",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "channel_spend",
        rows: [
          {
            spend_id: 3,
            channel_id: 2,
            spend_date: "2026-06-05",
            spend_amount: 350,
          },
          {
            spend_id: 8,
            channel_id: 2,
            spend_date: "2026-05-28",
            spend_amount: 999,
          },
        ],
      },
      {
        tableName: "acquired_customers",
        rows: [
          {
            customer_id: 101,
            customer_name: "Ada",
            channel_id: 2,
            acquired_at: "2026-06-02",
          },
          {
            customer_id: 402,
            customer_name: "İpek",
            channel_id: 4,
            acquired_at: "2026-05-20",
          },
        ],
      },
      {
        tableName: "customer_orders",
        rows: [
          {
            order_id: 1001,
            customer_id: 101,
            order_date: "2026-06-05",
            gross_revenue: 1000,
            refund_amount: 100,
          },
          {
            order_id: 1004,
            customer_id: 101,
            order_date: "2026-10-15",
            gross_revenue: 999,
            refund_amount: 0,
          },
        ],
      },
    ],
    expectedColumns: [
      "channel_name",
      "spend",
      "acquired_customers",
      "net_revenue_90d",
      "cac",
      "roas",
      "efficiency_action",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Organic", 100, 2, 800, 50, 8, "Ölçekle"],
      ["Paid Search", 600, 3, 2400, 200, 4, "Ölçekle"],
      ["Paid Social", 900, 2, 1000, 450, 1.11, "Bütçeyi azalt"],
      ["Partner", 300, 0, 0, null, 0, "Duraklat"],
      ["Referral", 0, 1, 300, 0, null, "Kazanılmış büyüme"],
    ],
    orderSensitive: true,
    requiredConcepts: ["CTE", "LEFT_JOIN", "GROUP_BY", "CASE", "ORDER_BY"],
    forbiddenOperations: [...MARKETING_PROJECT_READ_ONLY_FORBIDDEN],
    validationOptions: { numericTolerance: 0.01 },
    hints: [
      "Kanal harcamasının rapor ayı ile müşteri gelirinin edinimden sonraki penceresi aynı tarih filtresi değildir; iki pencereyi ayrı kur.",
      "Bir müşterinin birden çok siparişi olabilir. Önce müşteri başına 90 günlük net geliri, sonra kanal başına müşteri sayısını ve toplam geliri üret.",
      "spend, eligible_customers ve revenue_by_customer katmanlarını ayır; kanal ana listesinden LEFT JOIN ile başlayıp sıfıra bölmeyi CASE veya NULLIF ile koru.",
    ],
    explanation:
      "Müşteriyi kanalın sayım tanesi olarak sabitlemek sık alışveriş yapanların edinim sayısını şişirmesini önler. Harcama ayını ve müşteri gelir penceresini ayrı filtrelemek CAC ile 90 günlük ROAS'ı karşılaştırılabilir tutar.",
    completionMessage:
      "Kanal yatırımları müşteri edinimi, CAC ve ilk 90 günlük net değerle aynı tabloda uzlaştırıldı.",
    nextTaskId: "m11-t3",
  },
  {
    id: "m11-t3",
    slug: "landing-page-experiment",
    moduleId: "module-11",
    title: "Landing-page deneyini değerlendir",
    subtitle:
      "Atama sonrası benzersiz dönüşümü kontrol grubuyla aynı deney tanesinde karşılaştır.",
    scenario:
      "CRO ekibi üç landing-page varyantından hangisinin ölçekleneceğine karar vermek istiyor; ancak tekrar dönüşüm event'leri ve atama öncesi kayıtlar ham sayımları bozuyor.",
    objective:
      "Landing Page Signup deneyinde her varyant için assigned_visitors, atama sonrası ve deney bitişine kadar benzersiz converted_visitors, conversion_rate ve kontrol grubuna göre lift_pp hesapla. Kontrolü Baz, en az +10 puanı Kazanan, en fazla -10 puanı Durdur olarak etiketle. Kontrolü önce, diğer varyantları ada göre sırala.",
    difficulty: "advanced",
    estimatedMinutes: 32,
    prerequisites: ["m10-t4"],
    concepts: [
      "REPORTING",
      "CTE",
      "INNER_JOIN",
      "LEFT_JOIN",
      "MULTI_JOIN",
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
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL
      );
      CREATE TABLE experiment_variants (
        experiment_id INTEGER NOT NULL REFERENCES experiments(experiment_id),
        variant_name TEXT NOT NULL,
        is_control BOOLEAN NOT NULL,
        PRIMARY KEY (experiment_id, variant_name)
      );
      CREATE TABLE experiment_assignments (
        assignment_id INTEGER PRIMARY KEY,
        experiment_id INTEGER NOT NULL REFERENCES experiments(experiment_id),
        visitor_id INTEGER NOT NULL,
        variant_name TEXT NOT NULL,
        assigned_at TIMESTAMP NOT NULL,
        FOREIGN KEY (experiment_id, variant_name)
          REFERENCES experiment_variants(experiment_id, variant_name),
        UNIQUE (experiment_id, visitor_id)
      );
      CREATE TABLE conversion_events (
        conversion_id INTEGER PRIMARY KEY,
        visitor_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        converted_at TIMESTAMP NOT NULL
      );

      INSERT INTO experiments VALUES
        (1, 'Landing Page Signup', TIMESTAMP '2026-06-01 00:00', TIMESTAMP '2026-06-14 23:59');
      INSERT INTO experiment_variants VALUES
        (1, 'Control', TRUE),
        (1, 'Hero A', FALSE),
        (1, 'Short Form B', FALSE);
      INSERT INTO experiment_assignments VALUES
        (1, 1, 101, 'Control', TIMESTAMP '2026-06-01 09:00'),
        (2, 1, 102, 'Control', TIMESTAMP '2026-06-01 09:10'),
        (3, 1, 103, 'Control', TIMESTAMP '2026-06-01 09:20'),
        (4, 1, 104, 'Control', TIMESTAMP '2026-06-01 09:30'),
        (5, 1, 105, 'Control', TIMESTAMP '2026-06-01 09:40'),
        (6, 1, 201, 'Hero A', TIMESTAMP '2026-06-02 09:00'),
        (7, 1, 202, 'Hero A', TIMESTAMP '2026-06-02 09:10'),
        (8, 1, 203, 'Hero A', TIMESTAMP '2026-06-02 09:20'),
        (9, 1, 204, 'Hero A', TIMESTAMP '2026-06-02 09:30'),
        (10, 1, 205, 'Hero A', TIMESTAMP '2026-06-02 09:40'),
        (11, 1, 301, 'Short Form B', TIMESTAMP '2026-06-03 09:00'),
        (12, 1, 302, 'Short Form B', TIMESTAMP '2026-06-03 09:10'),
        (13, 1, 303, 'Short Form B', TIMESTAMP '2026-06-03 09:20'),
        (14, 1, 304, 'Short Form B', TIMESTAMP '2026-06-03 09:30');
      INSERT INTO conversion_events VALUES
        (1, 101, 'signup', TIMESTAMP '2026-06-02 10:00'),
        (2, 102, 'signup', TIMESTAMP '2026-06-05 11:00'),
        (3, 103, 'signup', TIMESTAMP '2026-05-31 08:00'),
        (4, 201, 'signup', TIMESTAMP '2026-06-03 10:00'),
        (5, 201, 'signup', TIMESTAMP '2026-06-03 10:05'),
        (6, 202, 'signup', TIMESTAMP '2026-06-06 12:00'),
        (7, 203, 'signup', TIMESTAMP '2026-06-10 12:00'),
        (8, 301, 'signup', TIMESTAMP '2026-06-08 13:00'),
        (9, 302, 'signup', TIMESTAMP '2026-06-16 13:00'),
        (10, 304, 'purchase', TIMESTAMP '2026-06-10 13:00');
    `,
    schema: {
      tables: [
        {
          name: "experiments",
          description: "Deney kimliği ve ölçüm penceresi.",
          columns: [
            {
              name: "experiment_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "experiment_name", dataType: "TEXT", nullable: false },
            { name: "start_date", dataType: "TIMESTAMP", nullable: false },
            { name: "end_date", dataType: "TIMESTAMP", nullable: false },
          ],
        },
        {
          name: "experiment_variants",
          description: "Kontrol ve treatment varyantları.",
          columns: [
            {
              name: "experiment_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "experiments", column: "experiment_id" },
            },
            { name: "variant_name", dataType: "TEXT", nullable: false },
            { name: "is_control", dataType: "BOOLEAN", nullable: false },
          ],
        },
        {
          name: "experiment_assignments",
          description: "Ziyaretçinin tek varyanta atandığı an.",
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
            { name: "visitor_id", dataType: "INTEGER", nullable: false },
            { name: "variant_name", dataType: "TEXT", nullable: false },
            { name: "assigned_at", dataType: "TIMESTAMP", nullable: false },
          ],
        },
        {
          name: "conversion_events",
          description:
            "Atama öncesi, tekrar veya pencere dışı olabilen dönüşüm event'leri.",
          columns: [
            {
              name: "conversion_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "visitor_id", dataType: "INTEGER", nullable: false },
            { name: "event_type", dataType: "TEXT", nullable: false },
            { name: "converted_at", dataType: "TIMESTAMP", nullable: false },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "experiment_variants",
          fromColumn: "experiment_id",
          toTable: "experiments",
          toColumn: "experiment_id",
        },
        {
          fromTable: "experiment_assignments",
          fromColumn: "experiment_id",
          toTable: "experiments",
          toColumn: "experiment_id",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "experiment_variants",
        rows: [
          { experiment_id: 1, variant_name: "Control", is_control: true },
          { experiment_id: 1, variant_name: "Hero A", is_control: false },
        ],
      },
      {
        tableName: "experiment_assignments",
        rows: [
          {
            assignment_id: 1,
            experiment_id: 1,
            visitor_id: 101,
            variant_name: "Control",
            assigned_at: "2026-06-01 09:00",
          },
          {
            assignment_id: 6,
            experiment_id: 1,
            visitor_id: 201,
            variant_name: "Hero A",
            assigned_at: "2026-06-02 09:00",
          },
        ],
      },
      {
        tableName: "conversion_events",
        rows: [
          {
            conversion_id: 4,
            visitor_id: 201,
            event_type: "signup",
            converted_at: "2026-06-03 10:00",
          },
          {
            conversion_id: 5,
            visitor_id: 201,
            event_type: "signup",
            converted_at: "2026-06-03 10:05",
          },
        ],
      },
    ],
    expectedColumns: [
      "variant_name",
      "assigned_visitors",
      "converted_visitors",
      "conversion_rate",
      "lift_pp",
      "experiment_decision",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Control", 5, 2, 40, 0, "Baz"],
      ["Hero A", 5, 3, 60, 20, "Kazanan"],
      ["Short Form B", 4, 1, 25, -15, "Durdur"],
    ],
    orderSensitive: true,
    requiredConcepts: [
      "CTE",
      "LEFT_JOIN",
      "DISTINCT",
      "GROUP_BY",
      "CASE",
      "ORDER_BY",
    ],
    forbiddenOperations: [...MARKETING_PROJECT_READ_ONLY_FORBIDDEN],
    validationOptions: { numericTolerance: 0.01 },
    hints: [
      "Payda event sayısı değil, varyanta atanmış benzersiz ziyaretçidir. Dönüşüm de ziyaretçi başına en fazla bir kez sayılmalıdır.",
      "Dönüşüm zamanı hem ziyaretçinin assigned_at anından sonra hem deney penceresinin içinde olmalı; signup dışındaki event'leri dışarıda bırak.",
      "Önce geçerli converted_visitors kümesini DISTINCT üret, sonra varyant metriklerini grupla ve kontrol oranını ayrı bir CTE'den her treatment satırına taşı.",
    ],
    explanation:
      "Atama birimini payda olarak korumak ve dönüşümü ziyaretçi düzeyinde tekilleştirmek tekrar event'lerin lift'i şişirmesini önler. Atama sonrası pencere, deneyden önce oluşmuş davranışı varyanta yazmaz.",
    completionMessage:
      "Landing-page varyantları temiz atama ve benzersiz dönüşüm üzerinden karşılaştırıldı.",
    nextTaskId: "m11-t4",
  },
  {
    id: "m11-t4",
    slug: "search-term-budget-waste",
    moduleId: "module-11",
    title: "Arama terimi bütçe israfını bul",
    subtitle:
      "Günlük metrikleri gerçek arama teriminde toplayıp negatif kelime ve teklif aksiyonu üret.",
    scenario:
      "Performance ekibi, kampanya toplamı iyi görünse bile bütçeyi tüketen verimsiz gerçek arama terimlerini ayrı bir aksiyon listesinde görmek istiyor.",
    objective:
      "Haziran 2026 için her search term'in clicks, spend, conversions ve roas değerini kampanya adıyla hesapla. En az 100 harcayıp sıfır dönüşüm üreten veya ROAS'ı 1.5 altında kalan terimleri getir. Sıfır dönüşüme negatif kelime, düşük ROAS'a teklif azaltma öner; spend azalan sırala.",
    difficulty: "advanced",
    estimatedMinutes: 30,
    prerequisites: ["m10-t4"],
    concepts: [
      "REPORTING",
      "CTE",
      "INNER_JOIN",
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
        campaign_name TEXT NOT NULL UNIQUE
      );
      CREATE TABLE ad_groups (
        ad_group_id INTEGER PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(campaign_id),
        ad_group_name TEXT NOT NULL
      );
      CREATE TABLE search_terms (
        term_id INTEGER PRIMARY KEY,
        ad_group_id INTEGER NOT NULL REFERENCES ad_groups(ad_group_id),
        search_term TEXT NOT NULL,
        match_type TEXT NOT NULL
      );
      CREATE TABLE search_term_daily_metrics (
        metric_id INTEGER PRIMARY KEY,
        term_id INTEGER NOT NULL REFERENCES search_terms(term_id),
        metric_date DATE NOT NULL,
        impressions INTEGER NOT NULL,
        clicks INTEGER NOT NULL,
        spend_amount INTEGER NOT NULL,
        conversions INTEGER NOT NULL,
        revenue INTEGER NOT NULL
      );

      INSERT INTO campaigns VALUES
        (1, 'Search Core'),
        (2, 'Growth Search');
      INSERT INTO ad_groups VALUES
        (11, 1, 'CRM Terms'),
        (12, 1, 'Brand Navigation'),
        (21, 2, 'Prospecting');
      INSERT INTO search_terms VALUES
        (101, 11, 'free crm template', 'broad'),
        (102, 11, 'enterprise crm', 'phrase'),
        (103, 12, 'brandname login', 'exact'),
        (201, 21, 'cheap email list', 'broad'),
        (202, 21, 'marketing automation', 'phrase'),
        (203, 21, 'crm jobs', 'broad');
      INSERT INTO search_term_daily_metrics VALUES
        (1, 101, DATE '2026-06-05', 500, 12, 120, 0, 0),
        (2, 101, DATE '2026-06-19', 520, 13, 120, 0, 0),
        (3, 102, DATE '2026-06-10', 300, 20, 180, 1, 500),
        (4, 102, DATE '2026-06-24', 240, 15, 120, 1, 400),
        (5, 103, DATE '2026-06-12', 120, 8, 30, 0, 0),
        (6, 201, DATE '2026-06-08', 430, 18, 90, 1, 100),
        (7, 201, DATE '2026-06-22', 260, 9, 60, 0, 0),
        (8, 202, DATE '2026-06-11', 350, 16, 110, 1, 180),
        (9, 202, DATE '2026-06-25', 300, 14, 90, 1, 180),
        (10, 203, DATE '2026-06-15', 410, 22, 120, 0, 0),
        (11, 101, DATE '2026-05-30', 999, 99, 999, 9, 9999);
    `,
    schema: {
      tables: [
        {
          name: "campaigns",
          description: "Arama ağı kampanyaları.",
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
          name: "ad_groups",
          description: "Kampanya içindeki hedefleme grupları.",
          columns: [
            {
              name: "ad_group_id",
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
            { name: "ad_group_name", dataType: "TEXT", nullable: false },
          ],
        },
        {
          name: "search_terms",
          description: "Kullanıcının gerçekten yazdığı sorgu ve eşleme türü.",
          columns: [
            {
              name: "term_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "ad_group_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "ad_groups", column: "ad_group_id" },
            },
            { name: "search_term", dataType: "TEXT", nullable: false },
            { name: "match_type", dataType: "TEXT", nullable: false },
          ],
        },
        {
          name: "search_term_daily_metrics",
          description:
            "Bir terimin farklı günlerde oluşan maliyet ve dönüşüm metrikleri.",
          columns: [
            {
              name: "metric_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "term_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "search_terms", column: "term_id" },
            },
            { name: "metric_date", dataType: "DATE", nullable: false },
            { name: "impressions", dataType: "INTEGER", nullable: false },
            { name: "clicks", dataType: "INTEGER", nullable: false },
            { name: "spend_amount", dataType: "INTEGER", nullable: false },
            { name: "conversions", dataType: "INTEGER", nullable: false },
            { name: "revenue", dataType: "INTEGER", nullable: false },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "ad_groups",
          fromColumn: "campaign_id",
          toTable: "campaigns",
          toColumn: "campaign_id",
        },
        {
          fromTable: "search_terms",
          fromColumn: "ad_group_id",
          toTable: "ad_groups",
          toColumn: "ad_group_id",
        },
        {
          fromTable: "search_term_daily_metrics",
          fromColumn: "term_id",
          toTable: "search_terms",
          toColumn: "term_id",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "search_terms",
        rows: [
          {
            term_id: 101,
            ad_group_id: 11,
            search_term: "free crm template",
            match_type: "broad",
          },
          {
            term_id: 102,
            ad_group_id: 11,
            search_term: "enterprise crm",
            match_type: "phrase",
          },
        ],
      },
      {
        tableName: "search_term_daily_metrics",
        rows: [
          {
            metric_id: 1,
            term_id: 101,
            metric_date: "2026-06-05",
            impressions: 500,
            clicks: 12,
            spend_amount: 120,
            conversions: 0,
            revenue: 0,
          },
          {
            metric_id: 2,
            term_id: 101,
            metric_date: "2026-06-19",
            impressions: 520,
            clicks: 13,
            spend_amount: 120,
            conversions: 0,
            revenue: 0,
          },
        ],
      },
      {
        tableName: "ad_groups",
        rows: [
          { ad_group_id: 11, campaign_id: 1, ad_group_name: "CRM Terms" },
          { ad_group_id: 21, campaign_id: 2, ad_group_name: "Prospecting" },
        ],
      },
    ],
    expectedColumns: [
      "campaign_name",
      "search_term",
      "clicks",
      "spend",
      "conversions",
      "roas",
      "waste_reason",
      "recommended_action",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      [
        "Search Core",
        "free crm template",
        25,
        240,
        0,
        0,
        "Dönüşüm yok",
        "Negatif kelime ekle",
      ],
      [
        "Growth Search",
        "cheap email list",
        27,
        150,
        1,
        0.67,
        "Düşük ROAS",
        "Teklifi azalt",
      ],
      [
        "Growth Search",
        "crm jobs",
        22,
        120,
        0,
        0,
        "Dönüşüm yok",
        "Negatif kelime ekle",
      ],
    ],
    orderSensitive: true,
    requiredConcepts: ["CTE", "INNER_JOIN", "GROUP_BY", "CASE", "ORDER_BY"],
    forbiddenOperations: [...MARKETING_PROJECT_READ_ONLY_FORBIDDEN],
    validationOptions: { numericTolerance: 0.01 },
    hints: [
      "Karar tanesi keyword veya ad group değil, kullanıcının gerçek search_term değeridir; günlük satırları önce bu tanede birleştir.",
      "İsraf için hem mutlak harcama eşiğini hem dönüşüm veya ROAS koşulunu uygula; düşük hacimli markalı sorguyu yanlışlıkla negatifleme.",
      "Dört tabloyu terim anahtarı boyunca birleştir, Haziran filtresinden sonra term_metrics CTE'sinde topla; dış sorguda ROAS ve aksiyon CASE'ini üret.",
    ],
    explanation:
      "Günlük kayıtları gerçek arama teriminde toplamak tek bir kötü günle karar verilmesini önler. Harcama eşiği, sıfır dönüşüm ve düşük ROAS ayrımı da negatif kelime ile teklif optimizasyonunu birbirine karıştırmaz.",
    completionMessage:
      "Bütçe israfı gerçek arama terimi düzeyinde ölçüldü ve uygulanabilir aksiyona dönüştürüldü.",
    nextTaskId: "m11-t5",
  },
  {
    id: "m11-t5",
    slug: "email-engagement-funnel",
    moduleId: "module-11",
    title: "E-posta etkileşim funnelını denetle",
    subtitle:
      "Tekrarlanan event'leri gönderim düzeyinde tekilleştirip gerçek kayıp adımını bul.",
    scenario:
      "CRM ekibi teslimat, açılma, tıklama ve satın alma sinyallerinden hangi e-posta kampanyasında konu satırı, CTA veya teklif sorunu olduğunu ayırmak istiyor.",
    objective:
      "Her email campaign için delivered, openers, clickers, purchasers ile open_rate, click_to_open_rate ve purchase_rate hesapla. Bir send'i her adımda yalnız bir kez say ve satın almayı teslim–açılma–tıklama zincirini tamamladıysa kabul et. Sağlık durumunu eşiklerle sınıflandırıp sorun önceliğine göre sırala.",
    difficulty: "advanced",
    estimatedMinutes: 34,
    prerequisites: ["m10-t4"],
    concepts: [
      "REPORTING",
      "CTE",
      "LEFT_JOIN",
      "MULTI_JOIN",
      "CONDITIONAL_AGGREGATION",
      "GROUP_BY",
      "CASE",
      "ARITHMETIC",
      "ORDER_BY",
    ],
    setupSql: `
      CREATE TABLE email_campaigns (
        campaign_id INTEGER PRIMARY KEY,
        campaign_name TEXT NOT NULL UNIQUE
      );
      CREATE TABLE subscribers (
        subscriber_id INTEGER PRIMARY KEY,
        email_address TEXT NOT NULL UNIQUE,
        segment TEXT NOT NULL
      );
      CREATE TABLE email_sends (
        send_id INTEGER PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES email_campaigns(campaign_id),
        subscriber_id INTEGER NOT NULL REFERENCES subscribers(subscriber_id),
        sent_at TIMESTAMP NOT NULL
      );
      CREATE TABLE email_events (
        event_id INTEGER PRIMARY KEY,
        send_id INTEGER NOT NULL REFERENCES email_sends(send_id),
        event_type TEXT NOT NULL,
        event_at TIMESTAMP NOT NULL
      );

      INSERT INTO email_campaigns VALUES
        (1, 'Newsletter'),
        (2, 'Product Launch'),
        (3, 'Winback'),
        (4, 'Weekly Digest'),
        (5, 'Draft Blast');
      INSERT INTO subscribers VALUES
        (1, 'ada@example.com', 'active'),
        (2, 'bora@example.com', 'active'),
        (3, 'ceren@example.com', 'active'),
        (4, 'deniz@example.com', 'active'),
        (5, 'ekin@example.com', 'active'),
        (6, 'fidan@example.com', 'lapsing');
      INSERT INTO email_sends VALUES
        (101, 1, 1, TIMESTAMP '2026-06-01 09:00'),
        (102, 1, 2, TIMESTAMP '2026-06-01 09:00'),
        (103, 1, 3, TIMESTAMP '2026-06-01 09:00'),
        (104, 1, 4, TIMESTAMP '2026-06-01 09:00'),
        (105, 1, 5, TIMESTAMP '2026-06-01 09:00'),
        (201, 2, 1, TIMESTAMP '2026-06-05 09:00'),
        (202, 2, 2, TIMESTAMP '2026-06-05 09:00'),
        (203, 2, 3, TIMESTAMP '2026-06-05 09:00'),
        (204, 2, 4, TIMESTAMP '2026-06-05 09:00'),
        (205, 2, 5, TIMESTAMP '2026-06-05 09:00'),
        (301, 3, 2, TIMESTAMP '2026-06-10 09:00'),
        (302, 3, 3, TIMESTAMP '2026-06-10 09:00'),
        (303, 3, 4, TIMESTAMP '2026-06-10 09:00'),
        (304, 3, 6, TIMESTAMP '2026-06-10 09:00'),
        (401, 4, 1, TIMESTAMP '2026-06-15 09:00'),
        (402, 4, 2, TIMESTAMP '2026-06-15 09:00'),
        (403, 4, 3, TIMESTAMP '2026-06-15 09:00'),
        (404, 4, 4, TIMESTAMP '2026-06-15 09:00'),
        (501, 5, 1, TIMESTAMP '2026-06-20 09:00'),
        (502, 5, 2, TIMESTAMP '2026-06-20 09:00');
      INSERT INTO email_events VALUES
        (1, 101, 'delivered', TIMESTAMP '2026-06-01 09:01'),
        (2, 101, 'open', TIMESTAMP '2026-06-01 09:10'),
        (3, 101, 'open', TIMESTAMP '2026-06-01 09:20'),
        (4, 101, 'click', TIMESTAMP '2026-06-01 09:30'),
        (5, 101, 'purchase', TIMESTAMP '2026-06-01 10:00'),
        (6, 102, 'delivered', TIMESTAMP '2026-06-01 09:01'),
        (7, 102, 'open', TIMESTAMP '2026-06-01 09:15'),
        (8, 102, 'click', TIMESTAMP '2026-06-01 09:25'),
        (9, 103, 'delivered', TIMESTAMP '2026-06-01 09:01'),
        (10, 103, 'open', TIMESTAMP '2026-06-01 09:18'),
        (11, 104, 'delivered', TIMESTAMP '2026-06-01 09:01'),
        (12, 104, 'open', TIMESTAMP '2026-06-01 09:19'),
        (13, 105, 'delivered', TIMESTAMP '2026-06-01 09:01'),
        (14, 201, 'delivered', TIMESTAMP '2026-06-05 09:01'),
        (15, 201, 'open', TIMESTAMP '2026-06-05 09:10'),
        (16, 201, 'click', TIMESTAMP '2026-06-05 09:20'),
        (17, 202, 'delivered', TIMESTAMP '2026-06-05 09:01'),
        (18, 202, 'open', TIMESTAMP '2026-06-05 09:11'),
        (19, 203, 'delivered', TIMESTAMP '2026-06-05 09:01'),
        (20, 204, 'delivered', TIMESTAMP '2026-06-05 09:01'),
        (21, 205, 'bounce', TIMESTAMP '2026-06-05 09:02'),
        (22, 301, 'delivered', TIMESTAMP '2026-06-10 09:01'),
        (23, 301, 'open', TIMESTAMP '2026-06-10 09:10'),
        (24, 302, 'delivered', TIMESTAMP '2026-06-10 09:01'),
        (25, 303, 'delivered', TIMESTAMP '2026-06-10 09:01'),
        (26, 304, 'delivered', TIMESTAMP '2026-06-10 09:01'),
        (27, 304, 'purchase', TIMESTAMP '2026-06-10 10:00'),
        (28, 401, 'delivered', TIMESTAMP '2026-06-15 09:01'),
        (29, 401, 'open', TIMESTAMP '2026-06-15 09:10'),
        (30, 401, 'click', TIMESTAMP '2026-06-15 09:20'),
        (31, 402, 'delivered', TIMESTAMP '2026-06-15 09:01'),
        (32, 402, 'open', TIMESTAMP '2026-06-15 09:10'),
        (33, 403, 'delivered', TIMESTAMP '2026-06-15 09:01'),
        (34, 403, 'open', TIMESTAMP '2026-06-15 09:10'),
        (35, 404, 'delivered', TIMESTAMP '2026-06-15 09:01'),
        (36, 501, 'bounce', TIMESTAMP '2026-06-20 09:02'),
        (37, 502, 'bounce', TIMESTAMP '2026-06-20 09:02');
    `,
    schema: {
      tables: [
        {
          name: "email_campaigns",
          description: "E-posta kampanyası ana listesi.",
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
          name: "subscribers",
          description: "Gönderim yapılan abone kimlikleri ve segmentleri.",
          columns: [
            {
              name: "subscriber_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            { name: "email_address", dataType: "TEXT", nullable: false },
            { name: "segment", dataType: "TEXT", nullable: false },
          ],
        },
        {
          name: "email_sends",
          description: "Bir kampanya ile bir aboneyi bağlayan tek gönderim.",
          columns: [
            {
              name: "send_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "campaign_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "email_campaigns", column: "campaign_id" },
            },
            {
              name: "subscriber_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "subscribers", column: "subscriber_id" },
            },
            { name: "sent_at", dataType: "TIMESTAMP", nullable: false },
          ],
        },
        {
          name: "email_events",
          description:
            "Aynı gönderimde yinelenebilen teslim, açılma, tıklama ve satın alma olayları.",
          columns: [
            {
              name: "event_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "send_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "email_sends", column: "send_id" },
            },
            { name: "event_type", dataType: "TEXT", nullable: false },
            { name: "event_at", dataType: "TIMESTAMP", nullable: false },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "email_sends",
          fromColumn: "campaign_id",
          toTable: "email_campaigns",
          toColumn: "campaign_id",
        },
        {
          fromTable: "email_sends",
          fromColumn: "subscriber_id",
          toTable: "subscribers",
          toColumn: "subscriber_id",
        },
        {
          fromTable: "email_events",
          fromColumn: "send_id",
          toTable: "email_sends",
          toColumn: "send_id",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "email_sends",
        rows: [
          {
            send_id: 101,
            campaign_id: 1,
            subscriber_id: 1,
            sent_at: "2026-06-01 09:00",
          },
          {
            send_id: 205,
            campaign_id: 2,
            subscriber_id: 5,
            sent_at: "2026-06-05 09:00",
          },
        ],
      },
      {
        tableName: "email_events",
        rows: [
          {
            event_id: 2,
            send_id: 101,
            event_type: "open",
            event_at: "2026-06-01 09:10",
          },
          {
            event_id: 3,
            send_id: 101,
            event_type: "open",
            event_at: "2026-06-01 09:20",
          },
          {
            event_id: 21,
            send_id: 205,
            event_type: "bounce",
            event_at: "2026-06-05 09:02",
          },
        ],
      },
      {
        tableName: "email_campaigns",
        rows: [
          { campaign_id: 1, campaign_name: "Newsletter" },
          { campaign_id: 5, campaign_name: "Draft Blast" },
        ],
      },
    ],
    expectedColumns: [
      "campaign_name",
      "delivered",
      "openers",
      "clickers",
      "purchasers",
      "open_rate",
      "click_to_open_rate",
      "purchase_rate",
      "health_status",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Draft Blast", 0, 0, 0, 0, null, null, null, "Teslimat yok"],
      ["Winback", 4, 1, 0, 0, 25, 0, 0, "Konu satırı zayıf"],
      ["Weekly Digest", 4, 3, 1, 0, 75, 33.33, 0, "CTA zayıf"],
      ["Product Launch", 4, 2, 1, 0, 50, 50, 0, "Teklif zayıf"],
      ["Newsletter", 5, 4, 2, 1, 80, 50, 20, "Sağlıklı"],
    ],
    orderSensitive: true,
    requiredConcepts: ["CTE", "LEFT_JOIN", "GROUP_BY", "CASE", "ORDER_BY"],
    forbiddenOperations: [...MARKETING_PROJECT_READ_ONLY_FORBIDDEN],
    validationOptions: { numericTolerance: 0.01 },
    hints: [
      "Ham email_events satırlarını saymak tekrar açılmaları çoğaltır. Önce her send için funnel adımlarını 0/1 bayraklarına çevir.",
      "Funnel adımları iç içedir: satın alma ancak teslim edilmiş, açılmış ve tıklanmış aynı send üzerinde sayılmalıdır; bounce teslim değildir.",
      "send_flags ve campaign funnel CTE'lerini kur; kampanya ana listesinden LEFT JOIN ile başlayıp oranları sıfıra bölmeden ve sağlık CASE'ini öncelik sırasıyla üret.",
    ],
    explanation:
      "Gönderim düzeyindeki bayraklar tekrar open/click event'lerinin oranları büyütmesini engeller. İç içe funnel şartı, izleme anomalisi olarak gelen tıklamasız satın almayı e-posta başarısı saymaz.",
    completionMessage:
      "E-posta funnelı gerçek gönderim tanesinde ölçüldü ve kayıp adımı aksiyona çevrildi.",
    nextTaskId: "m11-t6",
  },
  {
    id: "m11-t6",
    slug: "rfm-customer-segmentation",
    moduleId: "module-11",
    title: "RFM müşteri segmentlerini üret",
    subtitle:
      "Sipariş, kalem ve iade çokluğunu müşteri tanesinde güvenli RFM sinyaline dönüştür.",
    scenario:
      "CRM ekibi, 2026-06-30 itibarıyla hangi müşterinin ödüllendirileceğini, yeniden etkinleştirileceğini veya yeni müşteri yolculuğuna alınacağını belirlemek istiyor.",
    objective:
      "Tamamlanmış siparişlerden müşteri başına last_order_date, recency_days, benzersiz order frequency ve iadeler düşülmüş monetary_value hesapla. Şampiyonlar, Sadıklar, Riskte, Yeni ve Uykuda segmentlerini verilen eşik önceliğiyle üret; siparişi olmayan müşterileri koru ve segment önceliği, parasal değer azalan, müşteri adıyla sırala.",
    difficulty: "advanced",
    estimatedMinutes: 38,
    prerequisites: ["m10-t4"],
    concepts: [
      "REPORTING",
      "CTE",
      "INNER_JOIN",
      "LEFT_JOIN",
      "MULTI_JOIN",
      "COUNT",
      "SUM",
      "MAX",
      "GROUP_BY",
      "CASE",
      "ARITHMETIC",
      "ORDER_BY",
    ],
    setupSql: `
      CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY,
        customer_name TEXT NOT NULL UNIQUE
      );
      CREATE TABLE customer_orders (
        order_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
        order_date DATE NOT NULL,
        status TEXT NOT NULL
      );
      CREATE TABLE order_items (
        item_id INTEGER PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES customer_orders(order_id),
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL
      );
      CREATE TABLE order_refunds (
        refund_id INTEGER PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES customer_orders(order_id),
        refunded_at DATE NOT NULL,
        refund_amount INTEGER NOT NULL
      );

      INSERT INTO customers VALUES
        (1, 'Atlas'), (2, 'Bora'), (3, 'Ceren'), (4, 'Deniz'),
        (5, 'Ekin'), (6, 'Fidan'), (7, 'Güneş');
      INSERT INTO customer_orders VALUES
        (1001, 1, DATE '2026-06-20', 'completed'),
        (1002, 1, DATE '2026-05-15', 'completed'),
        (1003, 1, DATE '2026-04-01', 'completed'),
        (1004, 1, DATE '2026-06-28', 'cancelled'),
        (2001, 2, DATE '2026-06-10', 'completed'),
        (2002, 2, DATE '2026-04-20', 'completed'),
        (3001, 3, DATE '2026-01-15', 'completed'),
        (3002, 3, DATE '2026-02-01', 'completed'),
        (4001, 4, DATE '2026-06-25', 'completed'),
        (5001, 5, DATE '2026-03-15', 'completed'),
        (6001, 6, DATE '2026-06-28', 'cancelled'),
        (7001, 7, DATE '2026-06-01', 'completed'),
        (7002, 7, DATE '2026-05-01', 'completed'),
        (7003, 7, DATE '2026-04-01', 'completed');
      INSERT INTO order_items VALUES
        (1, 1001, 2, 300),
        (2, 1002, 2, 200),
        (3, 1003, 3, 100),
        (4, 1004, 1, 900),
        (5, 2001, 2, 200),
        (6, 2002, 1, 250),
        (7, 3001, 1, 500),
        (8, 3002, 1, 300),
        (9, 4001, 2, 100),
        (10, 5001, 3, 100),
        (11, 6001, 1, 1000),
        (12, 7001, 2, 150),
        (13, 7002, 2, 125),
        (14, 7003, 1, 250);
      INSERT INTO order_refunds VALUES
        (1, 1001, DATE '2026-06-22', 60),
        (2, 1001, DATE '2026-06-24', 40),
        (3, 1002, DATE '2026-07-10', 200),
        (4, 3002, DATE '2026-02-10', 0);
    `,
    schema: {
      tables: [
        {
          name: "customers",
          description:
            "Siparişi olmasa da segmentte korunacak müşteri ana listesi.",
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
          name: "customer_orders",
          description: "Tamamlanmış ve iptal edilmiş müşteri siparişleri.",
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
            { name: "status", dataType: "TEXT", nullable: false },
          ],
        },
        {
          name: "order_items",
          description: "Bir siparişte birden çok bulunabilen ürün kalemleri.",
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
              references: { table: "customer_orders", column: "order_id" },
            },
            { name: "quantity", dataType: "INTEGER", nullable: false },
            { name: "unit_price", dataType: "INTEGER", nullable: false },
          ],
        },
        {
          name: "order_refunds",
          description:
            "Aynı sipariş için birden çok veya rapor tarihi sonrası oluşabilen iadeler.",
          columns: [
            {
              name: "refund_id",
              dataType: "INTEGER",
              nullable: false,
              primaryKey: true,
            },
            {
              name: "order_id",
              dataType: "INTEGER",
              nullable: false,
              references: { table: "customer_orders", column: "order_id" },
            },
            { name: "refunded_at", dataType: "DATE", nullable: false },
            { name: "refund_amount", dataType: "INTEGER", nullable: false },
          ],
        },
      ],
      relationships: [
        {
          fromTable: "customer_orders",
          fromColumn: "customer_id",
          toTable: "customers",
          toColumn: "customer_id",
        },
        {
          fromTable: "order_items",
          fromColumn: "order_id",
          toTable: "customer_orders",
          toColumn: "order_id",
        },
        {
          fromTable: "order_refunds",
          fromColumn: "order_id",
          toTable: "customer_orders",
          toColumn: "order_id",
        },
      ],
    },
    sampleRows: [
      {
        tableName: "customer_orders",
        rows: [
          {
            order_id: 1001,
            customer_id: 1,
            order_date: "2026-06-20",
            status: "completed",
          },
          {
            order_id: 1004,
            customer_id: 1,
            order_date: "2026-06-28",
            status: "cancelled",
          },
        ],
      },
      {
        tableName: "order_items",
        rows: [
          { item_id: 1, order_id: 1001, quantity: 2, unit_price: 300 },
          { item_id: 2, order_id: 1002, quantity: 2, unit_price: 200 },
        ],
      },
      {
        tableName: "order_refunds",
        rows: [
          {
            refund_id: 1,
            order_id: 1001,
            refunded_at: "2026-06-22",
            refund_amount: 60,
          },
          {
            refund_id: 2,
            order_id: 1001,
            refunded_at: "2026-06-24",
            refund_amount: 40,
          },
        ],
      },
    ],
    expectedColumns: [
      "customer_name",
      "last_order_date",
      "recency_days",
      "frequency",
      "monetary_value",
      "rfm_segment",
    ],
    validationMode: "result-and-concepts",
    expectedResult: [
      ["Atlas", "2026-06-20", 10, 3, 1200, "Şampiyonlar"],
      ["Güneş", "2026-06-01", 29, 3, 800, "Sadıklar"],
      ["Bora", "2026-06-10", 20, 2, 650, "Sadıklar"],
      ["Deniz", "2026-06-25", 5, 1, 200, "Yeni"],
      ["Ceren", "2026-02-01", 149, 2, 800, "Riskte"],
      ["Ekin", "2026-03-15", 107, 1, 300, "Uykuda"],
      ["Fidan", null, null, 0, 0, "Uykuda"],
    ],
    orderSensitive: true,
    requiredConcepts: ["CTE", "LEFT_JOIN", "GROUP_BY", "CASE", "ORDER_BY"],
    forbiddenOperations: [...MARKETING_PROJECT_READ_ONLY_FORBIDDEN],
    validationOptions: { numericTolerance: 0.01 },
    hints: [
      "Sipariş kalemleri ile iadeleri ham biçimde aynı JOIN'e bağlamak iki tarafı da çoğaltır; önce sipariş tanesinde ayrı ayrı özetle.",
      "Frequency tamamlanmış benzersiz sipariş sayısıdır; monetary, rapor tarihine kadar geçerli iadeler düşüldükten sonraki toplamdır. Siparişi olmayan müşteri kaybolmamalı.",
      "gross_by_order, refunds_by_order ve valid_orders CTE'lerinden müşteri RFM özetine geç; segment CASE'ini en dar ve yüksek değerli koşuldan başlayarak sırala.",
    ],
    explanation:
      "Kalem ve iade akışlarını sipariş tanesinde ayrı özetlemek parasal değeri fanout'tan korur. Müşteri ana listesinden LEFT JOIN ile başlamak sıfır frekanslı müşterileri de geri kazanım segmentinde tutar.",
    completionMessage:
      "Müşteriler güncellik, sıklık ve net parasal değerle eyleme hazır RFM segmentlerine ayrıldı.",
    nextTaskId: "m11-t7",
  },
];

export const MARKETING_PROJECT_LEARNING_CONTENT_PART_ONE: Record<
  string,
  LessonLearningContent
> = {
  "m11-t1": createProjectLearningContent({
    title: "Kampanya funnel sağlığı",
    conceptAnchor:
      "Çoklu harcama ve event akışları ham JOIN ile değil, önce kendi doğal tanelerinde özetlenip sonra kampanya düzeyinde birleştirilir.",
    outputGrain:
      "Her sonuç satırı tek kampanyanın toplam harcamasını, benzersiz oturum adımlarını ve baskın sağlık sorununu temsil eder.",
    acceptanceChecks: [
      "Beş kampanyanın tamamı, trafiği olmayan Podcast Test dahil görünmeli.",
      "Aynı oturumdaki tekrar product_view yalnız bir product_viewer sayılmalı.",
      "visit_to_purchase_pct ziyaretçi başına satın alan oturum oranı olmalı ve karar sırası açıkça uygulanmalı.",
    ],
    dataNotes: [
      "Summer Search harcaması iki satırda, funnel event'leri ise oturum başına birden çok satırdadır.",
      "Social Video'daki aynı oturum iki product_view üretir; ham COUNT event sayısını şişirir.",
      "Podcast Test harcama yapmış fakat hiç session üretmemiştir.",
    ],
    executionChecks: [
      "Her CTE'nin tek başına çalıştığını ve kampanya kimliğini taşıdığını doğrula.",
      "Oranlarda numeric bölme kullandığını ve sıfır ziyaretçiyi CASE ile koruduğunu kontrol et.",
    ],
    columnChecks: [
      "Kolonları kampanya, maliyet, dört funnel sayısı, oran ve durum sırasıyla alias'la.",
      "Product viewer ile event sayısını, purchaser ile purchase event sayısını birbirine karıştırma.",
    ],
    rowChecks: [
      "Harcama toplamları event JOIN'inden sonra çoğalmamalı; Summer Search spend 1000 kalmalı.",
      "Session bayrakları toplanınca Social Video dört viewer değil dört oturumdan dört viewer üretmeli.",
      "Trafiği olmayan kampanyayı INNER JOIN ile kaybetmediğini kontrol et.",
    ],
    orderChecks: [
      "Önce visit_to_purchase_pct değerini azalan sırala.",
      "Eşit oranlarda campaign_name artan ikinci anahtarını kullan.",
    ],
    conceptChecks: [
      "En az iki ayrı özet CTE ve kampanya ana listesinden LEFT JOIN yaklaşımını kullan.",
      "Adım bayraklarını koşullu aggregate, sağlık kararını ayrı CASE ile üret.",
    ],
    steps: [
      "Harcama ve oturum event'lerini ayrı tanelerde özetledin.",
      "Oturum bayraklarından kampanya funnel sayılarını ürettin.",
      "Oran ve öncelikli sağlık durumunu tüm kampanyalar için doğruladın.",
    ],
    whyItWorks:
      "Ön toplama, iki ayrı one-to-many ilişkinin çarpılarak maliyet ve event sayılarını büyütmesini engeller; oturum bayrağı funnelın gerçek sayım birimini korur.",
    edgeCases: [
      "Yeni bir event türü eklense bile yalnız tanımlı adım bayrakları etkilenir.",
      "Harcaması veya trafiği olmayan yeni kampanya ana listeden geldiği için görünür kalır.",
      "Bir oturum birden çok satın alma event'i üretse de tek purchaser sayılır.",
    ],
    workplaceImpact:
      "Ekip toplam dönüşümün düşük olduğunu söylemek yerine kaybın trafik, ürün ilgisi veya checkout adımında olduğunu ayırabilir.",
    transferPrompt:
      "Aynı kampanyada impression ve sipariş gibi iki ayrı çoklu tabloyu eklesen fanout'u nasıl önlersin?",
    transferReveal:
      "Her akışı önce campaign_id veya onun doğal tanesinde özetler, yalnız küçük özetleri kampanya ana listesine bağlarsın.",
  }),
  "m11-t2": createProjectLearningContent({
    title: "Kanal edinim verimliliği",
    conceptAnchor:
      "CAC'ın paydası edinilen benzersiz müşteri, 90 günlük ROAS'ın payı ise her müşterinin kendi edinim tarihine bağlanmış net gelirdir.",
    outputGrain:
      "Her satır tek edinim kanalının Haziran harcamasını, Haziran kohortunu ve ilk 90 günlük değerini temsil eder.",
    acceptanceChecks: [
      "Beş kanalın tamamı; müşterisiz Partner ve harcamasız Referral dahil korunmalı.",
      "Mayıs harcaması, Mayıs'ta edinilen müşteri ve 90 gün sonrası sipariş Haziran kohortuna girmemeli.",
      "CAC ve ROAS sıfıra bölmeden hesaplanmalı, aksiyon kuralları doğru öncelikte uygulanmalı.",
    ],
    dataNotes: [
      "Paid Search harcaması iki Haziran satırına ve üç müşteriye dağılır.",
      "Ada'nın Ekim siparişi hem 90 gün hem rapor sonu dışında olduğu için değere katılmaz.",
      "Partner Haziran'da harcama yapmış ama Haziran müşterisi kazanmamış; Referral ise harcamasız müşteri kazanmıştır.",
    ],
    executionChecks: [
      "DATE ile INTERVAL karşılaştırmalarının doğru veri tipleriyle çalıştığını kontrol et.",
      "Tam sayı bölmesini numeric'e dönüştür ve NULL paydaları bilinçli bırak.",
    ],
    columnChecks: [
      "spend, acquired_customers ve net_revenue_90d kolonlarını kanal özetlerinden getir.",
      "cac ve roas alias'larını karıştırmadan iki farklı paydayla hesapla.",
    ],
    rowChecks: [
      "Paid Search için üç müşteri ve 2400 net gelir kalmalı; pencere dışı 999 eklenmemeli.",
      "Partner satırı müşterisi olmadığı için kaybolmamalı ve CAC NULL olmalı.",
      "Referral satırında spend 0, CAC 0 ve ROAS NULL olmalı.",
    ],
    orderChecks: [
      "ROAS'ı azalan ve NULL değerleri en sona taşıyan sıralama kullan.",
      "NULL ROAS eşitliğinde channel_name artan sırasını koru.",
    ],
    conceptChecks: [
      "Harcama, uygun müşteri ve müşteri geliri için ayrı CTE'ler kullan.",
      "Kanal ana listesini LEFT JOIN ve aksiyonu CASE ile kur.",
    ],
    steps: [
      "Haziran harcaması ile Haziran edinim kohortunu ayrı belirledin.",
      "Her müşterinin ilk 90 günlük net gelirini sabitledin.",
      "Kanal CAC, ROAS ve bütçe aksiyonunu tüm kanallar için ürettin.",
    ],
    whyItWorks:
      "Müşteri düzeyindeki ara katman hem tekrar siparişleri tek edinime bağlar hem her müşterinin 90 günlük penceresini kendi başlangıcından ölçer.",
    edgeCases: [
      "Müşteri edinimden önce sipariş verdiyse bu sipariş kanala atfedilmez.",
      "Harcamasız referral kanalı ROAS için anlamlı bir payda taşımaz fakat müşteri değeri görünür kalır.",
      "İadesi geliri aşan müşteri negatif değer üretebilir; iş kuralı bunun ayrıca nasıl sınıflanacağını belirtmelidir.",
    ],
    workplaceImpact:
      "Bütçe kararı ucuz lead'e değil, gerçekten kazanılmış müşteri ve erken dönem ekonomik değere dayanır.",
    transferPrompt:
      "90 günlük pencereyi 30 güne indirirken hangi CTE değişmeli, hangi kanal toplaması aynı kalmalı?",
    transferReveal:
      "Yalnız customer_orders tarih koşulu değişir; harcama ayı, kohort tanımı ve kanal toplama tanesi korunur.",
  }),
  "m11-t3": createProjectLearningContent({
    title: "Landing-page deneyi",
    conceptAnchor:
      "Deney metriğinin paydası atanan ziyaretçi, payı ise atama sonrası geçerli pencerede en az bir kez dönüşen benzersiz ziyaretçidir.",
    outputGrain:
      "Her satır deneydeki tek varyantın atama, dönüşüm, oran, kontrol lift'i ve kararını temsil eder.",
    acceptanceChecks: [
      "Kontrol 5/2, Hero A 5/3 ve Short Form B 4/1 ziyaretçi–dönüşüm üretmeli.",
      "Tekrar signup, atama öncesi signup, deney sonrası signup ve purchase event'i sayılmamalı.",
      "Lift yüzde değil yüzde puan olarak kontrol oranından çıkarılmalı.",
    ],
    dataNotes: [
      "Visitor 201 iki signup event'i üretse de tek converter'dır.",
      "Visitor 103 atamadan önce, visitor 302 deney bittikten sonra signup olmuştur.",
      "Visitor 304 purchase üretmiştir; hedef event yalnız signup'dır.",
    ],
    executionChecks: [
      "Composite variant ilişkisinde experiment_id ve variant_name koşullarının ikisini de kullandığını kontrol et.",
      "Timestamp sınırlarını assigned_at dahil ve experiment end dahil kur.",
    ],
    columnChecks: [
      "Atanan ve dönüşen ziyaretçi kolonlarını event sayısı yerine kişi sayısı olarak döndür.",
      "conversion_rate, lift_pp ve experiment_decision alias'larını beklenen sırada üret.",
    ],
    rowChecks: [
      "Hero A'nın iki event üreten visitor 201 kaydı converter sayısını dörde çıkarmamalı.",
      "Kontrol visitor 103 atama öncesi olduğu için iki converter sınırında kalmalı.",
      "Her varyant bir satır olmalı; atama veya event JOIN'i varyantı çoğaltmamalı.",
    ],
    orderChecks: [
      "Kontrol satırını açık CASE sırasıyla ilk sıraya koy.",
      "Treatment varyantlarında variant_name artan sırasını kullan.",
    ],
    conceptChecks: [
      "Geçerli converter kümesini DISTINCT ile ayrı CTE'de üret.",
      "Varyantları atamalara LEFT JOIN, kontrol benchmark'ını oranlara INNER JOIN ile bağla.",
    ],
    steps: [
      "Geçerli dönüşüm penceresini atamaya bağladın.",
      "Ziyaretçi dönüşümlerini tekilleştirip varyant oranlarını hesapladın.",
      "Kontrol lift'ini ve deney kararını aynı varyant tanesinde sundun.",
    ],
    whyItWorks:
      "Atama anını ve deney penceresini birlikte kullanmak varyantın sebep olamayacağı dönüşümleri dışarıda bırakır; DISTINCT kişi tabanlı metriği event yoğunluğundan korur.",
    edgeCases: [
      "Bir ziyaretçi birden çok varyanta atanabiliyorsa deney kimliği–ziyaretçi uniqueness ihlali ayrıca temizlenmelidir.",
      "Kontrol grubunda hiç atama yoksa lift hesaplanamaz ve karar için yetersiz kontrol durumu gerekir.",
      "Dönüşüm penceresi deney sonundan sonra devam edecekse cutoff iş kuralı yeniden tanımlanmalıdır.",
    ],
    workplaceImpact:
      "CRO ekibi event sayısına değil temiz atama birimine dayalı, tekrarlanabilir bir büyütme veya durdurma kararı verir.",
    transferPrompt:
      "Aynı deneyde revenue per visitor ölçmek istersen converter CTE'si ve payda nasıl değişir?",
    transferReveal:
      "Geliri ziyaretçi düzeyinde toplayıp tüm atanan ziyaretçilere LEFT JOIN eder, toplam varyant gelirini assigned visitor sayısına bölersin.",
  }),
  "m11-t4": createProjectLearningContent({
    title: "Arama terimi bütçe israfı",
    conceptAnchor:
      "Optimizasyon kararı keyword toplamında değil, kullanıcının gerçek arama teriminde ve yeterli harcama eşiği geçildikten sonra verilir.",
    outputGrain:
      "Her satır tek kampanya içindeki tek gerçek arama teriminin Haziran performansını ve önerilen aksiyonunu temsil eder.",
    acceptanceChecks: [
      "Yalnız harcaması en az 100 olan üç verimsiz terim dönmeli.",
      "Sıfır dönüşümlü terim negatif kelime, dönüşümlü fakat ROAS'ı düşük terim teklif azaltma almalı.",
      "Mayıs metriği Haziran toplamasına karışmamalı ve spend azalan sıralanmalı.",
    ],
    dataNotes: [
      "free crm template iki Haziran gününde toplam 240 harcar ve dönüşüm üretmez.",
      "brandname login sıfır dönüşümlüdür fakat yalnız 30 harcadığı için israf listesine girmez.",
      "enterprise crm ve marketing automation yeterli ROAS ürettiği için korunur.",
    ],
    executionChecks: [
      "Dört tablo arasındaki foreign-key yolunu ve Haziran tarih sınırlarını kontrol et.",
      "ROAS bölmesinde numeric hesap ve sıfır spend koruması kullan.",
    ],
    columnChecks: [
      "campaign_name ile search_term'i birlikte koruyarak metrik alias'larını doğru sırala.",
      "waste_reason ile recommended_action metinlerini aynı CASE koşulundan tutarlı üret.",
    ],
    rowChecks: [
      "Günlük satırlar term düzeyinde birleşmeli; free crm template 25 click ve 240 spend olmalı.",
      "Düşük hacimli brandname login ve sağlıklı iki terim filtre dışında kalmalı.",
      "cheap email list ROAS'ı 100/150 = 0.67 olarak yuvarlanmalı.",
    ],
    orderChecks: [
      "Önce spend değerini azalan sırala.",
      "Eşit spend halinde search_term artan ikinci anahtarını kullan.",
    ],
    conceptChecks: [
      "Term metriklerini tek CTE'de GROUP BY ile üret.",
      "İsraf nedeni ve aksiyonu dış sorguda CASE ile ayır.",
    ],
    steps: [
      "Gerçek arama terimini kampanya bağlamıyla birleştirdin.",
      "Haziran maliyet, dönüşüm ve ROAS metriklerini topladın.",
      "Hacim eşiği sonrası israfı negatif kelime veya teklif aksiyonuna ayırdın.",
    ],
    whyItWorks:
      "Harcama eşiği düşük hacimde erken hüküm vermeyi, term düzeyi ise iyi kampanya toplamının altında saklanan israfı önler.",
    edgeCases: [
      "Aynı search_term farklı kampanyalarda bulunabilir; campaign_name grain'in parçası kalmalıdır.",
      "Spend sıfırsa ROAS tanımsızdır ve bu maliyet israfı listesine girmemelidir.",
      "Offline dönüşümler gecikmeli geliyorsa rapor tarihi için veri olgunluk penceresi gerekir.",
    ],
    workplaceImpact:
      "Performance ekibi bütçeyi geniş kampanya düzeyinde kesmek yerine gerçek israf kaynağına hassas müdahale eder.",
    transferPrompt:
      "Negatif kelime kararına en az 20 click koşulu eklemek istesen filtreyi nasıl genişletirsin?",
    transferReveal:
      "Toplanmış clicks metriğini dış sorgudaki harcama ve verimsizlik koşullarına ekleyerek aynı grain'i korursun.",
  }),
  "m11-t5": createProjectLearningContent({
    title: "E-posta etkileşim funnelı",
    conceptAnchor:
      "E-posta event'leri değil, tekil send kayıtları funnelın sayım birimidir; her sonraki adım önceki adımların gerçekleşmesini de gerektirir.",
    outputGrain:
      "Her satır tek e-posta kampanyasının teslimden satın almaya funnel sayılarını, oranlarını ve ilk müdahale alanını temsil eder.",
    acceptanceChecks: [
      "Beş kampanya; hiç teslimatı olmayan Draft Blast dahil görünmeli.",
      "Newsletter tekrar open event'ine rağmen dört opener, iki clicker ve bir purchaser üretmeli.",
      "Winback'teki tıklamasız purchase funnel purchaser sayılmamalı ve sağlık öncelikleri doğru uygulanmalı.",
    ],
    dataNotes: [
      "Newsletter send 101 iki open event'i üretir.",
      "Product Launch beş send'e rağmen yalnız dört delivered üretir; bounce teslim değildir.",
      "Winback send 304 purchase event'i üretir fakat open ve click zincirini tamamlamaz.",
    ],
    executionChecks: [
      "Event type yazımlarını ve send_id JOIN'ini kontrol et.",
      "Teslimat veya opener sıfırken oranları CASE ile NULL bırak.",
    ],
    columnChecks: [
      "Dört funnel sayısını üç oran ve health_status öncesinde beklenen sırada getir.",
      "click_to_open_rate paydasında delivered yerine openers kullandığını doğrula.",
    ],
    rowChecks: [
      "Her send için MAX bayrağı kullan; tekrar event kampanya sayısını artırmamalı.",
      "Draft Blast kampanyası LEFT JOIN sayesinde sıfırlarla korunmalı.",
      "Purchaser koşulu aynı send üzerinde delivered, opened, clicked ve purchased bayraklarının tümünü istemeli.",
    ],
    orderChecks: [
      "Sağlık sorunlarını Teslimat, Konu, CTA, Teklif ve Sağlıklı önceliğinde sırala.",
      "Aynı durumda campaign_name artan sırasını kullan.",
    ],
    conceptChecks: [
      "send_flags ve campaign funnel için ayrı CTE katmanları kullan.",
      "Bayrak ve sağlık mantığını koşullu aggregate ile CASE üzerinden kur.",
    ],
    steps: [
      "Ham event'leri send başına tekil funnel bayraklarına çevirdin.",
      "İç içe adımları kampanya düzeyinde sayıp oranladın.",
      "İlk kırılan funnel adımını öncelikli sağlık durumuna dönüştürdün.",
    ],
    whyItWorks:
      "Send bayrakları event tekrarını yok eder; iç içe adım koşulları izleme anomalilerinin kullanıcı yolculuğunda gerçekleşmemiş bir başarı yazmasını engeller.",
    edgeCases: [
      "Apple Mail benzeri otomatik open sinyalleri opener tanımını ayrıca etkileyebilir.",
      "Bir aboneye aynı kampanyadan iki send gönderildiyse bu tasarım send bazında iki fırsat sayar; kişi bazlı analiz ayrı grain ister.",
      "Purchase attribution penceresi uzunsa event_at ile sent_at arasına ek süre koşulu konmalıdır.",
    ],
    workplaceImpact:
      "CRM ekibi genel düşük satış yerine teslimat, konu satırı, CTA veya teklif sorununa doğru müdahaleyi seçer.",
    transferPrompt:
      "Kampanya yerine subscriber bazında benzersiz opener ölçmek istersen hangi grain değişir?",
    transferReveal:
      "Önce campaign_id–subscriber_id düzeyinde bayrak üretir, aynı kişinin birden çok send'ini tekleştirip kampanya toplamına geçersin.",
  }),
  "m11-t6": createProjectLearningContent({
    title: "RFM müşteri segmentasyonu",
    conceptAnchor:
      "RFM'de recency son tamamlanmış siparişten, frequency benzersiz siparişten, monetary ise kalem toplamından geçerli iadeler düşülerek üretilir.",
    outputGrain:
      "Her satır 2026-06-30 itibarıyla tek müşterinin RFM metriklerini ve tek öncelikli CRM segmentini temsil eder.",
    acceptanceChecks: [
      "Yedi müşteri, tamamlanmış siparişi olmayan Fidan dahil görünmeli.",
      "Sipariş kalemi ve çoklu iade fanout üretmeden Atlas için frequency 3 ve monetary 1200 kalmalı.",
      "Segment CASE'i Şampiyonlar, Sadıklar, Riskte, Yeni ve Uykuda eşiklerini doğru öncelikte uygulamalı.",
    ],
    dataNotes: [
      "Atlas'ın bir siparişinde iki ayrı iade, başka bir siparişinde rapor tarihinden sonra iade vardır.",
      "Fidan'ın yalnız iptal edilmiş siparişi bulunur ve RFM bakımından siparişsizdir.",
      "Güneş yüksek frequency fakat Şampiyonlar için gereken monetary eşiğinin altındadır.",
    ],
    executionChecks: [
      "DATE çıkarımının integer recency_days ürettiğini ve NULL son tarihi koruduğunu kontrol et.",
      "Kalem ve iade özetlerinin aynı order_id tanesinde birleştiğini doğrula.",
    ],
    columnChecks: [
      "last_order_date, recency_days, frequency ve monetary_value kolonlarını müşteri özetinden getir.",
      "rfm_segment alias'ını en dış katmanda tek CASE sonucu olarak üret.",
    ],
    rowChecks: [
      "İptal siparişleri gross_by_order CTE'sine girmemeli.",
      "İadeleri önce order_id düzeyinde topla; iki iade iki item satırını çoğaltmamalı.",
      "Müşterilere LEFT JOIN ile dönerek Fidan için frequency ve monetary sıfırını koru.",
    ],
    orderChecks: [
      "Segment önceliğini açık CASE sıralamasıyla uygula.",
      "Aynı segmentte monetary_value azalan, sonra customer_name artan sırala.",
    ],
    conceptChecks: [
      "Gross, refund, valid order ve customer RFM için ayrı CTE katmanları kullan.",
      "Müşteri ana listesini LEFT JOIN, segmenti öncelikli CASE ile kur.",
    ],
    steps: [
      "Sipariş kalemi ile iadeyi sipariş tanesinde güvenli biçimde uzlaştırdın.",
      "Müşteri recency, frequency ve net monetary metriklerini ürettin.",
      "Eşikleri öncelikli CRM segmentlerine ve karar sırasına çevirdin.",
    ],
    whyItWorks:
      "Sipariş ön toplaması RFM frequency ve monetary değerlerini çoklu item–refund ilişkisinden korur; müşteri ana listesi sessiz müşterilerin yeniden etkinleştirme havuzundan düşmesini önler.",
    edgeCases: [
      "İade sipariş tutarını aşarsa monetary negatif olabilir ve segment politikası bunu ayrıca ele almalıdır.",
      "Birden çok para birimi varsa monetary toplamından önce kur dönüşümü gerekir.",
      "RFM eşikleri zamanla nüfus dağılımına göre kalibre edilmezse segment boyutları bozulabilir.",
    ],
    workplaceImpact:
      "CRM kampanyaları genel toplu gönderim yerine güncel, sadık, riskli ve yeni müşteri davranışına göre hedeflenebilir.",
    transferPrompt:
      "Sabit eşikler yerine müşteri nüfusunun beşlik dilimlerini kullanmak istersen hangi katmanı değiştirirsin?",
    transferReveal:
      "RFM özetinden sonra recency, frequency ve monetary için pencere tabanlı skor katmanı ekler; veri hazırlama CTE'lerini değiştirmezsin.",
  }),
};
