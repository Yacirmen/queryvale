import { MARKETING_PROJECT_SOLUTIONS_PART_ONE } from "./marketingProjectsPartOne";
import { MARKETING_PROJECT_SOLUTIONS_PART_TWO } from "./marketingProjectsPartTwo";

const sql = (source: string): string => {
  const lines = source.split("\n");
  while (lines[0]?.trim() === "") lines.shift();
  while (lines.at(-1)?.trim() === "") lines.pop();
  const indentation = Math.min(
    ...lines
      .filter((line) => line.trim())
      .map((line) => line.match(/^\s*/)?.[0].length ?? 0),
  );
  return lines.map((line) => line.slice(indentation)).join("\n");
};

/**
 * Learner-visible, working examples for every task.
 *
 * These are deliberately separate from the progressive hints: hints help the
 * learner build the query, while this catalog guarantees that someone who is
 * completely stuck can still inspect one valid, executable solution.
 */
export const TASK_SOLUTIONS: Readonly<Record<string, string>> = {
  "m1-t1": sql(`
    SELECT product_name, category
    FROM products;
  `),
  "m1-t2": sql(`
    SELECT DISTINCT category
    FROM products;
  `),
  "m1-t3": sql(`
    SELECT product_name, stock_quantity
    FROM products
    ORDER BY stock_quantity ASC
    LIMIT 3;
  `),
  "m1-t4": sql(`
    SELECT product_name, unit_price
    FROM products
    ORDER BY unit_price DESC;
  `),
  "m2-t1": sql(`
    SELECT order_id, customer_name, total_amount
    FROM orders
    WHERE total_amount >= 500;
  `),
  "m2-t2": sql(`
    SELECT order_id, customer_name, city
    FROM orders
    WHERE city IN ('Ankara', 'Istanbul')
      AND status = 'pending';
  `),
  "m2-t3": sql(`
    SELECT order_id, ordered_at, total_amount
    FROM orders
    WHERE ordered_at BETWEEN DATE '2026-01-04' AND DATE '2026-01-07'
    ORDER BY ordered_at;
  `),
  "m2-t4": sql(`
    SELECT customer_name, status
    FROM orders
    WHERE delivered_at IS NULL
      AND customer_name LIKE '%e%'
    ORDER BY customer_name;
  `),
  "m2-d1": sql(`
    SELECT DISTINCT city
    FROM orders;
  `),
  "m2-m1": sql(`
    SELECT DISTINCT city
    FROM orders
    WHERE total_amount >= 500;
  `),
  "m2-d2": sql(`
    SELECT order_id, status
    FROM orders
    WHERE status = 'pending';
  `),
  "m2-d3": sql(`
    SELECT order_id, city
    FROM orders
    WHERE city IN ('Ankara', 'Istanbul');
  `),
  "m2-d4": sql(`
    SELECT order_id, customer_name
    FROM orders
    WHERE city = 'Istanbul'
      AND total_amount >= 500;
  `),
  "m2-m2": sql(`
    SELECT order_id, city
    FROM orders
    WHERE city IN ('Ankara', 'Istanbul')
      AND status = 'pending'
      AND total_amount >= 300;
  `),
  "m2-d5": sql(`
    SELECT order_id, ordered_at
    FROM orders
    WHERE ordered_at BETWEEN DATE '2026-01-05' AND DATE '2026-01-08';
  `),
  "m2-d6": sql(`
    SELECT order_id, customer_name
    FROM orders
    WHERE delivered_at IS NULL;
  `),
  "m2-d7": sql(`
    SELECT customer_name
    FROM orders
    WHERE delivered_at IS NULL
      AND customer_name LIKE '%e%';
  `),
  "m2-m3": sql(`
    SELECT customer_name, status
    FROM orders
    WHERE delivered_at IS NULL
      AND customer_name LIKE '%e%'
      AND ordered_at BETWEEN DATE '2026-01-05' AND DATE '2026-01-08'
    ORDER BY customer_name;
  `),
  "m3-t1": sql(`
    SELECT sale_id, quantity * unit_price AS revenue
    FROM sales;
  `),
  "m3-t2": sql(`
    SELECT
      sale_id,
      UPPER(agent_first_name || ' ' || agent_last_name) AS agent_name
    FROM sales;
  `),
  "m3-t3": sql(`
    SELECT sale_id, TO_CHAR(sale_date, 'YYYY-MM') AS sale_month
    FROM sales;
  `),
  "m3-d1": sql(`
    SELECT
      sale_id,
      quantity
    FROM sales
    ORDER BY quantity DESC
    LIMIT 2;
  `),
  "m3-m1": sql(`
    SELECT
      sale_id,
      unit_price
    FROM sales
    ORDER BY unit_price DESC
    LIMIT 2;
  `),
  "m3-d2": sql(`
    SELECT
      sale_id,
      UPPER(agent_first_name) AS agent_label
    FROM sales;
  `),
  "m3-m2": sql(`
    SELECT
      UPPER(agent_first_name) AS agent_label,
      quantity * unit_price AS revenue
    FROM sales;
  `),
  "m3-d3": sql(`
    SELECT
      sale_id,
      TO_CHAR(sale_date, 'YYYY') AS sale_year
    FROM sales;
  `),
  "m3-m3": sql(`
    SELECT
      sale_id,
      UPPER(TO_CHAR(sale_date, 'Mon')) AS sale_month_label
    FROM sales;
  `),
  "m3-t4": sql(`
    SELECT
      CAST(sale_id AS TEXT) AS sale_ref,
      CASE
        WHEN quantity * unit_price >= 1000 THEN 'Yüksek'
        WHEN quantity * unit_price >= 500 THEN 'Orta'
        ELSE 'Standart'
      END AS revenue_band
    FROM sales;
  `),
  "m4-t1": sql(`
    SELECT
      region,
      COUNT(*) AS transaction_count,
      SUM(amount) AS total_revenue
    FROM transactions
    WHERE status = 'completed'
    GROUP BY region
    HAVING SUM(amount) >= 900
    ORDER BY total_revenue DESC;
  `),
  "m4-d1": sql(`
    SELECT COUNT(*) AS order_count
    FROM channel_orders;
  `),
  "m4-d2": sql(`
    SELECT
      channel,
      COUNT(*) AS order_count
    FROM channel_orders
    GROUP BY channel;
  `),
  "m4-d4": sql(`
    SELECT CAST(order_id AS TEXT) AS order_ref
    FROM channel_orders;
  `),
  "m4-m1": sql(`
    SELECT
      CAST(order_id AS TEXT) AS order_ref,
      CASE
        WHEN order_amount >= 900 THEN 'Yüksek'
        ELSE 'Standart'
      END AS amount_band
    FROM channel_orders;
  `),
  "m4-t2": sql(`
    SELECT
      channel,
      COUNT(*) AS order_count,
      SUM(order_amount) AS total_amount,
      AVG(order_amount) AS avg_amount,
      MIN(order_amount) AS min_amount,
      MAX(order_amount) AS max_amount
    FROM channel_orders
    GROUP BY channel
    ORDER BY channel;
  `),
  "m4-t3": sql(`
    SELECT
      channel,
      COUNT(*) AS order_count,
      COUNT(coupon_code) AS coupon_order_count
    FROM channel_orders
    GROUP BY channel
    ORDER BY channel;
  `),
  "m4-d3": sql(`
    SELECT
      region,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_transaction_count
    FROM transactions
    GROUP BY region
    ORDER BY region;
  `),
  "m4-m2": sql(`
    SELECT
      channel,
      COUNT(*) AS order_count,
      SUM(order_amount) AS total_amount
    FROM channel_orders
    GROUP BY channel
    ORDER BY channel;
  `),
  "m4-m3": sql(`
    SELECT
      region,
      COUNT(*) AS transaction_count,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_transaction_count
    FROM transactions
    GROUP BY region
    ORDER BY region;
  `),
  "m4-t4": sql(`
    SELECT
      channel,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
    FROM channel_orders
    GROUP BY channel
    ORDER BY channel;
  `),
  "m5-t1": sql(`
    SELECT
      c.customer_name,
      COALESCE(SUM(o.amount), 0) AS total_spend
    FROM customers c
    LEFT JOIN orders o
      ON c.customer_id = o.customer_id
     AND o.status = 'completed'
    GROUP BY c.customer_id, c.customer_name
    ORDER BY total_spend DESC, c.customer_name;
  `),
  "m5-t2": sql(`
    SELECT
      o.order_id,
      c.customer_name,
      SUM(i.quantity * i.unit_price) AS order_total
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.customer_id
    INNER JOIN order_items i ON i.order_id = o.order_id
    GROUP BY o.order_id, c.customer_name
    ORDER BY o.order_id;
  `),
  "m5-d1": sql(`
    SELECT
      order_id,
      COUNT(*) AS item_count
    FROM order_items
    GROUP BY order_id
    HAVING SUM(quantity * unit_price) >= 400
    ORDER BY order_id;
  `),
  "m5-d2": sql(`
    SELECT
      o.order_id,
      c.customer_name
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.customer_id
    ORDER BY o.order_id;
  `),
  "m5-d3": sql(`
    SELECT
      o.order_id,
      c.customer_name,
      i.item_id
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.customer_id
    INNER JOIN order_items i ON i.order_id = o.order_id
    ORDER BY o.order_id, i.item_id;
  `),
  "m5-m1": sql(`
    SELECT
      order_id,
      SUM(quantity * unit_price) AS order_amount
    FROM order_items
    GROUP BY order_id
    HAVING SUM(quantity * unit_price) >= 450
    ORDER BY order_id;
  `),
  "m5-d4": sql(`
    SELECT
      order_id,
      unit_price,
      COUNT(*) AS line_count
    FROM order_items
    GROUP BY order_id, unit_price
    ORDER BY order_id, unit_price;
  `),
  "m5-d5": sql(`
    SELECT
      c.customer_name,
      COUNT(*) AS order_count
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.customer_id
    GROUP BY c.customer_name
    ORDER BY c.customer_name;
  `),
  "m5-m2": sql(`
    SELECT
      o.order_id,
      c.customer_name,
      COUNT(i.item_id) AS item_count
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.customer_id
    INNER JOIN order_items i ON i.order_id = o.order_id
    GROUP BY o.order_id, c.customer_name
    ORDER BY o.order_id;
  `),
  "m5-t3": sql(`
    SELECT
      e.employee_name,
      m.employee_name AS manager_name
    FROM employees e
    INNER JOIN employees m ON e.manager_id = m.employee_id
    ORDER BY e.employee_id;
  `),
  "m5-t4": sql(`
    SELECT
      l.line_id,
      l.company_id,
      l.sku,
      l.quantity * p.unit_price AS line_total
    FROM order_lines l
    INNER JOIN catalog_prices p
      ON l.company_id = p.company_id
     AND l.sku = p.sku
    ORDER BY l.line_id;
  `),
  "m6-t1": sql(`
    WITH branch_totals AS (
      SELECT branch, SUM(amount) AS branch_total
      FROM branch_sales
      GROUP BY branch
    )
    SELECT branch, branch_total
    FROM branch_totals
    WHERE branch_total > (SELECT AVG(branch_total) FROM branch_totals);
  `),
  "m6-t2": sql(`
    SELECT product_name, unit_price
    FROM products
    WHERE category_id IN (
      SELECT category_id
      FROM categories
      WHERE campaign_active = TRUE
    )
      AND unit_price > (SELECT AVG(unit_price) FROM products)
    ORDER BY unit_price DESC;
  `),
  "m6-t3": sql(`
    SELECT c.customer_id, c.customer_name
    FROM customers c
    WHERE NOT EXISTS (
      SELECT 1
      FROM orders o
      WHERE o.customer_id = c.customer_id
        AND o.ordered_at >= DATE '2026-04-01'
    )
    ORDER BY c.customer_id;
  `),
  "m6-t4": sql(`
    WITH RECURSIVE category_tree AS (
      SELECT
        category_id,
        category_name::TEXT AS category_path,
        0 AS depth
      FROM categories
      WHERE parent_id IS NULL

      UNION ALL

      SELECT
        c.category_id,
        ct.category_path || ' > ' || c.category_name,
        ct.depth + 1
      FROM categories c
      INNER JOIN category_tree ct ON c.parent_id = ct.category_id
    )
    SELECT category_path, depth
    FROM category_tree
    ORDER BY category_path;
  `),
  "m7-t1": sql(`
    SELECT
      transaction_id,
      account_no,
      amount,
      SUM(amount) OVER (
        PARTITION BY account_no
        ORDER BY transaction_date, transaction_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS running_balance
    FROM account_transactions
    ORDER BY account_no, transaction_date, transaction_id;
  `),
  "m7-t2": sql(`
    SELECT
      category,
      rep_name,
      revenue,
      ROW_NUMBER() OVER (
        PARTITION BY category
        ORDER BY revenue DESC, rep_name
      ) AS row_no,
      RANK() OVER (
        PARTITION BY category
        ORDER BY revenue DESC
      ) AS revenue_rank,
      DENSE_RANK() OVER (
        PARTITION BY category
        ORDER BY revenue DESC
      ) AS dense_revenue_rank
    FROM representative_sales
    ORDER BY category, revenue DESC, rep_name;
  `),
  "m7-t3": sql(`
    WITH changes AS (
      SELECT
        week_start,
        revenue,
        LAG(revenue) OVER (ORDER BY week_start) AS previous_revenue
      FROM weekly_revenue
    )
    SELECT
      week_start,
      revenue,
      previous_revenue,
      ROUND(
        (revenue - previous_revenue) * 100.0 /
        NULLIF(previous_revenue, 0),
        2
      ) AS revenue_change_pct
    FROM changes
    ORDER BY week_start;
  `),
  "m7-t4": sql(`
    SELECT
      demand_date,
      units,
      ROUND(
        AVG(units) OVER (
          ORDER BY demand_date
          ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ),
        2
      ) AS moving_avg_7d
    FROM daily_demand
    ORDER BY demand_date;
  `),
  "m8-t1": sql(`
    UPDATE inventory
    SET stock_quantity = stock_quantity - 3
    WHERE product_id = 801
    RETURNING product_id, stock_quantity;
  `),
  "m8-t2": sql(`
    INSERT INTO inventory_movements (
      movement_id,
      product_id,
      quantity_delta,
      movement_type
    )
    VALUES (3004, 803, 4, 'IN')
    RETURNING movement_id, product_id, quantity_delta, movement_type;
  `),
  "m8-t3": sql(`
    DELETE FROM import_rows
    WHERE batch_id = 'B-77'
      AND row_no = 2
      AND status = 'draft'
    RETURNING import_row_id, batch_id, status;
  `),
  "m8-t4": sql(`
    INSERT INTO branch_daily_metrics (
      branch_id,
      metric_date,
      order_count,
      revenue
    )
    VALUES (1, DATE '2026-05-20', 14, 1620.00)
    ON CONFLICT (branch_id, metric_date)
    DO UPDATE SET
      order_count = EXCLUDED.order_count,
      revenue = EXCLUDED.revenue
    RETURNING branch_id, metric_date, order_count, revenue;
  `),
  "m9-t1": sql(`
    SELECT
      d.month_label,
      p.category,
      SUM(f.quantity * f.unit_price) AS revenue
    FROM fact_sales f
    INNER JOIN dim_product p ON p.product_key = f.product_key
    INNER JOIN dim_date d ON d.date_key = f.date_key
    GROUP BY d.month_label, p.category
    ORDER BY d.month_label, p.category;
  `),
  "m9-t2": sql(`
    SELECT customer_id, segment, valid_from
    FROM dim_customer
    WHERE valid_to IS NULL
    ORDER BY customer_id;
  `),
  "m9-t3": sql(`
    SELECT f.sale_key, f.product_key, f.revenue_amount
    FROM fact_sales f
    LEFT JOIN dim_product p ON p.product_key = f.product_key
    WHERE p.product_key IS NULL
    ORDER BY f.sale_key;
  `),
  "m9-t4": sql(`
    WITH coverage AS (
      SELECT
        w.week_start,
        c.channel_id,
        c.channel_name
      FROM dim_week w
      CROSS JOIN dim_channel c
    ),
    order_totals AS (
      SELECT
        w.week_start,
        f.channel_id,
        COUNT(*) AS order_count,
        SUM(f.revenue) AS revenue
      FROM fact_orders f
      INNER JOIN dim_week w ON w.week_key = f.week_key
      GROUP BY w.week_start, f.channel_id
    )
    SELECT
      c.week_start,
      c.channel_name,
      COALESCE(o.order_count, 0) AS order_count,
      COALESCE(o.revenue, 0) AS revenue
    FROM coverage c
    LEFT JOIN order_totals o
      ON o.week_start = c.week_start
     AND o.channel_id = c.channel_id
    ORDER BY c.week_start, c.channel_name;
  `),
  "m10-t1": sql(`
    SELECT
      b.branch_name,
      t.target_amount,
      COALESCE(SUM(s.amount), 0) AS actual_amount,
      ROUND(
        COALESCE(SUM(s.amount), 0) * 100.0 / t.target_amount,
        2
      ) AS achievement_rate,
      CASE
        WHEN COALESCE(SUM(s.amount), 0) >= t.target_amount THEN 'Hedefte'
        ELSE 'Geride'
      END AS target_status
    FROM branches b
    INNER JOIN monthly_targets t
      ON t.branch_id = b.branch_id
     AND t.target_month = '2026-05'
    LEFT JOIN branch_sales s
      ON s.branch_id = b.branch_id
     AND s.sale_month = '2026-05'
    GROUP BY b.branch_id, b.branch_name, t.target_amount
    ORDER BY achievement_rate DESC;
  `),
  "m10-t2": sql(`
    WITH active_customers AS (
      SELECT c.customer_id, c.customer_name
      FROM subscriptions s
      INNER JOIN customers c ON c.customer_id = s.customer_id
      WHERE s.status = 'active'
    ),
    last_usage AS (
      SELECT customer_id, MAX(event_date) AS last_activity_date
      FROM usage_events
      GROUP BY customer_id
    ),
    open_tickets AS (
      SELECT
        customer_id,
        COUNT(*) FILTER (WHERE status = 'open') AS open_ticket_count
      FROM support_tickets
      GROUP BY customer_id
    ),
    signals AS (
      SELECT
        c.customer_name,
        u.last_activity_date,
        CASE
          WHEN u.last_activity_date IS NULL THEN NULL
          ELSE DATE '2026-06-01' - u.last_activity_date
        END AS inactive_days,
        COALESCE(t.open_ticket_count, 0) AS open_ticket_count
      FROM active_customers c
      LEFT JOIN last_usage u ON u.customer_id = c.customer_id
      LEFT JOIN open_tickets t ON t.customer_id = c.customer_id
    ),
    risked AS (
      SELECT
        customer_name,
        last_activity_date,
        inactive_days,
        open_ticket_count,
        CASE
          WHEN last_activity_date IS NULL THEN 'Yüksek'
          WHEN inactive_days >= 45 OR open_ticket_count >= 2 THEN 'Yüksek'
          WHEN inactive_days >= 30 OR open_ticket_count >= 1 THEN 'Orta'
          ELSE 'Düşük'
        END AS risk_level
      FROM signals
    )
    SELECT
      customer_name,
      last_activity_date,
      inactive_days,
      open_ticket_count,
      risk_level
    FROM risked
    ORDER BY
      CASE risk_level
        WHEN 'Yüksek' THEN 1
        WHEN 'Orta' THEN 2
        ELSE 3
      END,
      inactive_days DESC NULLS FIRST,
      customer_name;
  `),
  "m10-t3": sql(`
    WITH spend_totals AS (
      SELECT campaign_id, SUM(spend_amount) AS total_spend
      FROM spend_events
      GROUP BY campaign_id
    ),
    order_totals AS (
      SELECT campaign_id, SUM(gross_revenue) AS gross_revenue
      FROM attributed_orders
      GROUP BY campaign_id
    ),
    refund_totals AS (
      SELECT campaign_id, SUM(refund_amount) AS total_refunds
      FROM refunds
      GROUP BY campaign_id
    ),
    metrics AS (
      SELECT
        c.campaign_name,
        COALESCE(s.total_spend, 0) AS total_spend,
        COALESCE(o.gross_revenue, 0) -
          COALESCE(r.total_refunds, 0) AS net_revenue
      FROM campaigns c
      LEFT JOIN spend_totals s ON s.campaign_id = c.campaign_id
      LEFT JOIN order_totals o ON o.campaign_id = c.campaign_id
      LEFT JOIN refund_totals r ON r.campaign_id = c.campaign_id
    )
    SELECT
      campaign_name,
      total_spend,
      net_revenue,
      net_revenue - total_spend AS profit,
      CASE
        WHEN total_spend = 0 THEN 0
        ELSE ROUND(net_revenue / total_spend, 2)
      END AS roas
    FROM metrics
    ORDER BY profit DESC, campaign_name;
  `),
  "m10-t4": sql(`
    WITH incident_daily AS (
      SELECT
        branch_id,
        incident_date,
        COUNT(*) AS incident_count,
        COUNT(*) FILTER (WHERE severity = 'critical') AS critical_count
      FROM incidents
      GROUP BY branch_id, incident_date
    ),
    base AS (
      SELECT
        b.branch_id,
        b.branch_name,
        o.operation_date,
        o.incoming_count - o.resolved_count AS backlog_delta,
        o.avg_delay_hours,
        t.backlog_limit,
        COALESCE(i.incident_count, 0) AS incident_count,
        COALESCE(i.critical_count, 0) AS critical_count
      FROM daily_operations o
      INNER JOIN branches b ON b.branch_id = o.branch_id
      INNER JOIN capacity_targets t ON t.branch_id = o.branch_id
      LEFT JOIN incident_daily i
        ON i.branch_id = o.branch_id
       AND i.incident_date = o.operation_date
    ),
    windowed AS (
      SELECT
        *,
        SUM(backlog_delta) OVER (
          PARTITION BY branch_id
          ORDER BY operation_date
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS running_backlog,
        avg_delay_hours - LAG(avg_delay_hours) OVER (
          PARTITION BY branch_id
          ORDER BY operation_date
        ) AS delay_change
      FROM base
    )
    SELECT
      branch_name,
      operation_date,
      backlog_delta,
      running_backlog,
      delay_change,
      incident_count,
      CASE
        WHEN critical_count > 0
          OR running_backlog > backlog_limit
          OR delay_change >= 2 THEN 'Acil'
        WHEN running_backlog > backlog_limit * 0.7
          OR delay_change > 0
          OR incident_count > 0 THEN 'İzle'
        ELSE 'Normal'
      END AS alert_status
    FROM windowed
    ORDER BY branch_name, operation_date;
  `),
  ...MARKETING_PROJECT_SOLUTIONS_PART_ONE,
  ...MARKETING_PROJECT_SOLUTIONS_PART_TWO,
};

export function getTaskSolution(taskId: string): string {
  const solution = TASK_SOLUTIONS[taskId];
  if (!solution) {
    throw new Error(`${taskId} için çalışan örnek çözüm tanımlanmamış.`);
  }
  return solution;
}
