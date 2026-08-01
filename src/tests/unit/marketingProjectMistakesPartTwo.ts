type MarketingProjectMistakeStatus =
  "rows-wrong" | "columns-wrong" | "order-wrong" | "required-concept-missing";

interface MarketingProjectMistake {
  sql: string;
  expectedStatus: MarketingProjectMistakeStatus;
}

/**
 * Executable analytical mistakes used by the project-quality gate.
 *
 * These queries deliberately preserve each project's output contract and
 * required SQL approach. They should therefore pass execution/column/concept
 * gates and fail specifically when the fixture exposes the mistaken metric.
 */
export const MARKETING_PROJECT_MISTAKES_PART_TWO: Record<
  string,
  MarketingProjectMistake
> = {
  "m11-t7": {
    sql: `
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
         AND a.activity_date >= cm.cohort_month
         AND a.activity_date < cm.cohort_month + INTERVAL '1 month'
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
    expectedStatus: "rows-wrong",
  },
  "m11-t8": {
    sql: `
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
      all_cancellations AS (
        SELECT customer_id, MIN(cancellation_date) AS cancellation_date
        FROM cancellation_events
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
        LEFT JOIN all_cancellations x ON x.customer_id = c.customer_id
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
    expectedStatus: "rows-wrong",
  },
  "m11-t9": {
    sql: `
      WITH eligible_touches AS (
        SELECT
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
        FROM eligible_touches
        GROUP BY order_id
      ),
      allocated AS (
        SELECT
          e.order_id,
          e.campaign_id,
          e.revenue / c.campaign_count AS attributed_revenue
        FROM eligible_touches e
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
    expectedStatus: "rows-wrong",
  },
  "m11-t10": {
    sql: `
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
          ROUND(
            treatment_converters * 100.0 /
              (treatment_users + control_users),
            2
          ) AS treatment_rate,
          CASE
            WHEN control_users = 0 THEN 0
            ELSE ROUND(
              control_converters * 100.0 /
                (treatment_users + control_users),
              2
            )
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
              treatment_users * control_converters::numeric /
                (treatment_users + control_users),
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
    expectedStatus: "rows-wrong",
  },
  "m11-t11": {
    sql: `
      WITH merged_daily_metrics AS (
        SELECT
          c.channel_id,
          c.channel_name,
          b.current_weekly_budget,
          s.spend_date,
          s.spend_amount,
          v.metric_date,
          v.conversion_count
        FROM channels c
        INNER JOIN channel_budgets b ON b.channel_id = c.channel_id
        LEFT JOIN daily_spend s ON s.channel_id = c.channel_id
        LEFT JOIN daily_conversions v ON v.channel_id = c.channel_id
      ),
      period_metrics AS (
        SELECT
          channel_id,
          channel_name,
          current_weekly_budget,
          COALESCE(SUM(spend_amount) FILTER (
            WHERE spend_date BETWEEN DATE '2026-06-01' AND DATE '2026-06-07'
          ), 0) AS previous_spend,
          COALESCE(SUM(spend_amount) FILTER (
            WHERE spend_date BETWEEN DATE '2026-06-08' AND DATE '2026-06-14'
          ), 0) AS current_spend,
          COALESCE(SUM(conversion_count) FILTER (
            WHERE metric_date BETWEEN DATE '2026-06-01' AND DATE '2026-06-07'
          ), 0) AS previous_conversions,
          COALESCE(SUM(conversion_count) FILTER (
            WHERE metric_date BETWEEN DATE '2026-06-08' AND DATE '2026-06-14'
          ), 0) AS current_conversions
        FROM merged_daily_metrics
        GROUP BY channel_id, channel_name, current_weekly_budget
      ),
      metrics AS (
        SELECT
          *,
          CASE
            WHEN current_conversions = 0 THEN NULL
            ELSE ROUND(current_spend / current_conversions, 2)
          END AS current_cac,
          CASE
            WHEN previous_conversions = 0 THEN NULL
            ELSE ROUND(previous_spend / previous_conversions, 2)
          END AS previous_cac
        FROM period_metrics
      ),
      trended AS (
        SELECT
          *,
          CASE
            WHEN current_cac IS NULL OR previous_cac IS NULL THEN NULL
            ELSE ROUND(
              (current_cac - previous_cac) * 100.0 / previous_cac,
              2
            )
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
    expectedStatus: "rows-wrong",
  },
  "m11-t12": {
    sql: `
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
          s.marketing_spend,
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
        FROM spend_by_region s
        INNER JOIN regions r ON r.region_id = s.region_id
        INNER JOIN growth_targets t ON t.region_id = r.region_id
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
    expectedStatus: "rows-wrong",
  },
};
