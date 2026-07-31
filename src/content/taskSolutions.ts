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
};

export function getTaskSolution(taskId: string): string {
  const solution = TASK_SOLUTIONS[taskId];
  if (!solution) {
    throw new Error(`${taskId} için çalışan örnek çözüm tanımlanmamış.`);
  }
  return solution;
}
