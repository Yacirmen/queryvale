type ExpectedMistakeStatus =
  "rows-wrong" | "columns-wrong" | "order-wrong" | "required-concept-missing";

/**
 * Executable near-miss queries for the first six marketing projects.
 *
 * Each query keeps the requested delivery shape while making one realistic
 * analytical mistake. This lets integration tests prove that the evaluator
 * rejects business-logic errors instead of relying on an artificial empty
 * result set.
 */
export const MARKETING_PROJECT_MISTAKES_PART_ONE: Record<
  string,
  { sql: string; expectedStatus: ExpectedMistakeStatus }
> = {
  "m11-t1": {
    expectedStatus: "rows-wrong",
    sql: `
      WITH spend_by_campaign AS (
        SELECT campaign_id, SUM(spend_amount) AS spend
        FROM campaign_spend
        GROUP BY campaign_id
      ),
      session_flags AS (
        SELECT
          s.campaign_id,
          s.session_id,
          SUM(CASE WHEN e.event_type = 'product_view' THEN 1 ELSE 0 END) AS viewed,
          SUM(CASE WHEN e.event_type = 'add_to_cart' THEN 1 ELSE 0 END) AS carted,
          SUM(CASE WHEN e.event_type = 'purchase' THEN 1 ELSE 0 END) AS purchased
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
  },
  "m11-t2": {
    expectedStatus: "rows-wrong",
    sql: `
      WITH spend_by_channel AS (
        SELECT channel_id, SUM(spend_amount) AS spend
        FROM channel_spend
        WHERE spend_date BETWEEN DATE '2026-06-01' AND DATE '2026-06-30'
        GROUP BY channel_id
      ),
      eligible_customers AS (
        SELECT customer_id, channel_id, acquired_at
        FROM acquired_customers
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
  },
  "m11-t3": {
    expectedStatus: "rows-wrong",
    sql: `
      WITH converted_visitors AS (
        SELECT DISTINCT
          a.experiment_id,
          a.visitor_id
        FROM experiment_assignments a
        INNER JOIN experiments e ON e.experiment_id = a.experiment_id
        INNER JOIN conversion_events c
          ON c.visitor_id = a.visitor_id
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
  },
  "m11-t4": {
    expectedStatus: "rows-wrong",
    sql: `
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
  },
  "m11-t5": {
    expectedStatus: "rows-wrong",
    sql: `
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
            WHEN delivered = 1 AND purchased = 1 THEN 1 ELSE 0
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
  },
  "m11-t6": {
    expectedStatus: "rows-wrong",
    sql: `
      WITH order_values AS (
        SELECT
          o.order_id,
          o.customer_id,
          o.order_date,
          SUM(
            i.quantity * i.unit_price - COALESCE(r.refund_amount, 0)
          ) AS net_amount
        FROM customer_orders o
        INNER JOIN order_items i ON i.order_id = o.order_id
        LEFT JOIN order_refunds r
          ON r.order_id = o.order_id
         AND r.refunded_at <= DATE '2026-06-30'
        WHERE o.status = 'completed'
          AND o.order_date <= DATE '2026-06-30'
        GROUP BY o.order_id, o.customer_id, o.order_date
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
        LEFT JOIN order_values v ON v.customer_id = c.customer_id
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
  },
};
