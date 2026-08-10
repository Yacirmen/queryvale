// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import {
  createTaskDatabase,
  createTaskDatabaseForLesson,
  type TaskDatabase,
} from "../../features/sql-engine";
import { tasks } from "../../content/curriculum";
import { evaluateLessonQuery } from "../../features/validation";
import { isDrillTask, type LessonTask } from "../../types/lesson";
import { MARKETING_PROJECT_MISTAKES_PART_ONE } from "./marketingProjectMistakesPartOne";
import { MARKETING_PROJECT_MISTAKES_PART_TWO } from "./marketingProjectMistakesPartTwo";

let database: TaskDatabase | undefined;

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").replace(/;\s*$/, "").trim();
}

async function runAndEvaluateLesson(
  taskDatabase: TaskDatabase,
  task: LessonTask,
  sql: string,
) {
  const result = await taskDatabase.run(sql);
  const mutationVerificationResult = task.mutationVerification
    ? await taskDatabase.run(task.mutationVerification.sql)
    : undefined;

  return evaluateLessonQuery(
    task,
    sql,
    result,
    undefined,
    mutationVerificationResult,
  );
}

afterEach(async () => {
  await database?.dispose();
  database = undefined;
});

describe("PGlite task database integration", () => {
  it("runs setup SQL, executes a real SELECT, caps rows and resets mutations", async () => {
    database = createTaskDatabase({
      taskId: "integration-select",
      setupSql: `
        CREATE TABLE sales (id integer PRIMARY KEY, amount numeric);
        INSERT INTO sales VALUES (1, 10), (2, 20), (3, 30);
      `,
      forbiddenOperations: ["DROP_DATABASE"],
      maxRows: 2,
      timeoutMs: 5_000,
    });

    await database.initialize();
    const first = await database.run(
      "SELECT id, amount FROM sales ORDER BY id",
    );
    expect(first.columns).toEqual(["id", "amount"]);
    expect(first.rows).toHaveLength(2);
    expect(first.truncated).toBe(true);

    await database.run("DELETE FROM sales WHERE id = 1");
    expect(
      (await database.run("SELECT id FROM sales ORDER BY id")).rows,
    ).toEqual([{ id: 2 }, { id: 3 }]);

    await database.reset();
    expect(
      (await database.run("SELECT id FROM sales ORDER BY id")).rows,
    ).toEqual([{ id: 1 }, { id: 2 }]);
  }, 30_000);

  it("executes and accepts reference solutions for every original case in modules 1–3", async () => {
    const solutions: Record<string, string> = {
      "m1-t1": "SELECT product_name, category FROM products",
      "m1-t2": "SELECT DISTINCT category FROM products",
      "m1-t3":
        "SELECT product_name, stock_quantity FROM products ORDER BY stock_quantity ASC LIMIT 3",
      "m1-t4":
        "SELECT product_name, unit_price FROM products ORDER BY unit_price DESC",
      "m2-t1":
        "SELECT order_id, customer_name, total_amount FROM orders WHERE total_amount >= 500",
      "m2-t2":
        "SELECT order_id, customer_name, city FROM orders WHERE city IN ('Ankara', 'Istanbul') AND status = 'pending'",
      "m2-t3":
        "SELECT order_id, ordered_at, total_amount FROM orders WHERE ordered_at BETWEEN DATE '2026-01-04' AND DATE '2026-01-07' ORDER BY ordered_at",
      "m2-t4":
        "SELECT customer_name, status FROM orders WHERE delivered_at IS NULL AND customer_name LIKE '%e%' ORDER BY customer_name",
      "m3-t1": "SELECT sale_id, quantity * unit_price AS revenue FROM sales",
      "m3-t2":
        "SELECT sale_id, UPPER(agent_first_name || ' ' || agent_last_name) AS agent_name FROM sales",
      "m3-t3":
        "SELECT sale_id, TO_CHAR(sale_date, 'YYYY-MM') AS sale_month FROM sales",
      "m3-t4": `
        SELECT
          CAST(sale_id AS TEXT) AS sale_ref,
          CASE
            WHEN quantity * unit_price >= 1000 THEN 'Yüksek'
            WHEN quantity * unit_price >= 500 THEN 'Orta'
            ELSE 'Standart'
          END AS revenue_band
        FROM sales
      `,
    };

    const productionTasks = tasks.filter(
      (task) =>
        task.type === "case" &&
        ["module-1", "module-2", "module-3"].includes(task.moduleId),
    );
    expect(productionTasks).toHaveLength(12);

    for (const task of productionTasks) {
      const fixtureSql = solutions[task.id];
      expect(
        fixtureSql,
        `${task.id} reference solution is missing`,
      ).toBeTruthy();
      expect(normalizeSql(task.solutionSql)).toBe(normalizeSql(fixtureSql));
      database = createTaskDatabaseForLesson(task);
      await database.initialize();
      const evaluation = await runAndEvaluateLesson(
        database,
        task,
        task.solutionSql,
      );
      expect(evaluation.status, `${task.id}: ${evaluation.message}`).toBe(
        "correct",
      );
      await database.dispose();
      database = undefined;
    }
  }, 120_000);

  it("executes and accepts reference solutions for every original case in modules 4–7", async () => {
    const solutions: Record<string, string> = {
      "m4-t2": `
        SELECT
          channel,
          COUNT(*) AS order_count,
          SUM(order_amount) AS total_amount,
          AVG(order_amount) AS avg_amount,
          MIN(order_amount) AS min_amount,
          MAX(order_amount) AS max_amount
        FROM channel_orders
        GROUP BY channel
        ORDER BY channel
      `,
      "m4-t3": `
        SELECT
          channel,
          COUNT(*) AS order_count,
          COUNT(coupon_code) AS coupon_order_count
        FROM channel_orders
        GROUP BY channel
        ORDER BY channel
      `,
      "m4-t4": `
        SELECT
          channel,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
        FROM channel_orders
        GROUP BY channel
        ORDER BY channel
      `,
      "m4-t1": `
        SELECT
          region,
          COUNT(*) AS transaction_count,
          SUM(amount) AS total_revenue
        FROM transactions
        WHERE status = 'completed'
        GROUP BY region
        HAVING SUM(amount) >= 900
        ORDER BY total_revenue DESC
      `,
      "m5-t2": `
        SELECT
          o.order_id,
          c.customer_name,
          SUM(i.quantity * i.unit_price) AS order_total
        FROM orders o
        INNER JOIN customers c ON o.customer_id = c.customer_id
        INNER JOIN order_items i ON i.order_id = o.order_id
        GROUP BY o.order_id, c.customer_name
        ORDER BY o.order_id
      `,
      "m5-t3": `
        SELECT
          e.employee_name,
          m.employee_name AS manager_name
        FROM employees e
        INNER JOIN employees m ON e.manager_id = m.employee_id
        ORDER BY e.employee_id
      `,
      "m5-t4": `
        SELECT
          l.line_id,
          l.company_id,
          l.sku,
          l.quantity * p.unit_price AS line_total
        FROM order_lines l
        INNER JOIN catalog_prices p
          ON l.company_id = p.company_id
         AND l.sku = p.sku
        ORDER BY l.line_id
      `,
      "m5-t1": `
        SELECT
          c.customer_name,
          COALESCE(SUM(o.amount), 0) AS total_spend
        FROM customers c
        LEFT JOIN orders o
          ON c.customer_id = o.customer_id
         AND o.status = 'completed'
        GROUP BY c.customer_id, c.customer_name
        ORDER BY total_spend DESC, c.customer_name
      `,
      "m6-t2": `
        SELECT product_name, unit_price
        FROM products
        WHERE category_id IN (
          SELECT category_id
          FROM categories
          WHERE campaign_active = TRUE
        )
          AND unit_price > (SELECT AVG(unit_price) FROM products)
        ORDER BY unit_price DESC
      `,
      "m6-t3": `
        SELECT c.customer_id, c.customer_name
        FROM customers c
        WHERE NOT EXISTS (
          SELECT 1
          FROM orders o
          WHERE o.customer_id = c.customer_id
            AND o.ordered_at >= DATE '2026-04-01'
        )
        ORDER BY c.customer_id
      `,
      "m6-t4": `
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
        ORDER BY category_path
      `,
      "m6-t1": `
        WITH branch_totals AS (
          SELECT branch, SUM(amount) AS branch_total
          FROM branch_sales
          GROUP BY branch
        )
        SELECT branch, branch_total
        FROM branch_totals
        WHERE branch_total > (SELECT AVG(branch_total) FROM branch_totals)
      `,
      "m7-t2": `
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
        ORDER BY category, revenue DESC, rep_name
      `,
      "m7-t3": `
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
        ORDER BY week_start
      `,
      "m7-t4": `
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
        ORDER BY demand_date
      `,
      "m7-t1": `
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
        ORDER BY account_no, transaction_date, transaction_id
      `,
    };

    const expandedTasks = tasks.filter(
      (task) =>
        task.type === "case" &&
        ["module-4", "module-5", "module-6", "module-7"].includes(
          task.moduleId,
        ),
    );
    expect(expandedTasks).toHaveLength(16);

    for (const task of expandedTasks) {
      const fixtureSql = solutions[task.id];
      expect(
        fixtureSql,
        `${task.id} reference solution is missing`,
      ).toBeTruthy();
      expect(normalizeSql(task.solutionSql)).toBe(normalizeSql(fixtureSql));
      database = createTaskDatabaseForLesson(task);
      await database.initialize();
      const evaluation = await runAndEvaluateLesson(
        database,
        task,
        task.solutionSql,
      );
      expect(evaluation.status, `${task.id}: ${evaluation.message}`).toBe(
        "correct",
      );
      await database.dispose();
      database = undefined;
    }
  }, 180_000);

  it("executes every foundation drill on the exact fixture of its following case", async () => {
    const drills = tasks.filter(isDrillTask);

    expect(drills.length).toBeGreaterThanOrEqual(24);
    expect(drills.length).toBeLessThanOrEqual(30);

    for (const drill of drills) {
      const drillIndex = tasks.findIndex((task) => task.id === drill.id);
      const followingCase = tasks
        .slice(drillIndex + 1)
        .find((task) => task.type === "case");
      expect(followingCase, `${drill.id} needs a following case`).toBeDefined();
      expect(drill.setupSql, drill.id).toBe(followingCase?.setupSql);
      expect(drill.schema, drill.id).toStrictEqual(followingCase?.schema);
      expect(drill.sampleRows, drill.id).toStrictEqual(
        followingCase?.sampleRows,
      );
      expect(drill.forbiddenOperations, drill.id).toEqual(
        followingCase?.forbiddenOperations,
      );

      database = createTaskDatabaseForLesson(drill);
      await database.initialize();
      const evaluation = await runAndEvaluateLesson(
        database,
        drill,
        drill.solutionSql,
      );
      expect(evaluation.status, `${drill.id}: ${evaluation.message}`).toBe(
        "correct",
      );
      await database.dispose();
      database = undefined;
    }
  }, 240_000);

  it("accepts structurally different correct solutions for every new module 4–7 task", async () => {
    const alternatives: Record<string, string> = {
      "m4-t2": `
        WITH channel_metrics AS (
          SELECT
            channel,
            COUNT(order_id) AS order_count,
            SUM(order_amount) AS total_amount,
            AVG(order_amount) AS avg_amount,
            MIN(order_amount) AS min_amount,
            MAX(order_amount) AS max_amount
          FROM channel_orders
          GROUP BY channel
        )
        SELECT
          channel,
          order_count,
          total_amount,
          avg_amount,
          min_amount,
          max_amount
        FROM channel_metrics
        ORDER BY channel
      `,
      "m4-t3": `
        SELECT
          channel,
          COUNT(order_id) AS order_count,
          COUNT(*) FILTER (WHERE coupon_code IS NOT NULL) AS coupon_order_count
        FROM channel_orders
        GROUP BY channel
        ORDER BY channel
      `,
      "m4-t4": `
        WITH order_flags AS (
          SELECT
            channel,
            CASE WHEN status = 'completed' THEN 1 ELSE 0 END AS completed_flag,
            CASE WHEN status = 'pending' THEN 1 ELSE 0 END AS pending_flag,
            CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END AS cancelled_flag
          FROM channel_orders
        )
        SELECT
          channel,
          SUM(completed_flag) AS completed_orders,
          SUM(pending_flag) AS pending_orders,
          SUM(cancelled_flag) AS cancelled_orders
        FROM order_flags
        GROUP BY channel
        ORDER BY channel
      `,
      "m5-t2": `
        SELECT
          o.order_id,
          c.customer_name,
          SUM(i.unit_price * i.quantity) AS order_total
        FROM order_items i
        INNER JOIN orders o ON o.order_id = i.order_id
        INNER JOIN customers c ON c.customer_id = o.customer_id
        GROUP BY 1, 2
        ORDER BY 1
      `,
      "m5-t3": `
        SELECT
          employee.employee_name,
          manager.employee_name AS manager_name
        FROM employees manager
        INNER JOIN employees employee
          ON manager.employee_id = employee.manager_id
        ORDER BY employee.employee_id
      `,
      "m5-t4": `
        WITH priced_lines AS (
          SELECT
            l.line_id,
            l.company_id,
            l.sku,
            l.quantity,
            p.unit_price
          FROM catalog_prices p
          INNER JOIN order_lines l
            ON p.company_id = l.company_id
           AND p.sku = l.sku
        )
        SELECT
          line_id,
          company_id,
          sku,
          quantity * unit_price AS line_total
        FROM priced_lines
        ORDER BY line_id
      `,
      "m6-t2": `
        WITH above_average AS (
          SELECT product_name, category_id, unit_price
          FROM products
          WHERE unit_price > (SELECT AVG(unit_price) FROM products)
        )
        SELECT product_name, unit_price
        FROM above_average
        WHERE category_id IN (
          SELECT category_id
          FROM categories
          WHERE campaign_active = TRUE
        )
          AND unit_price > 0
        ORDER BY unit_price DESC
      `,
      "m6-t3": `
        WITH recent_orders AS (
          SELECT customer_id
          FROM orders
          WHERE ordered_at >= DATE '2026-04-01'
        )
        SELECT c.customer_id, c.customer_name
        FROM customers c
        WHERE NOT EXISTS (
          SELECT NULL
          FROM recent_orders r
          WHERE r.customer_id = c.customer_id
            AND r.customer_id IS NOT NULL
        )
        ORDER BY c.customer_id
      `,
      "m6-t4": `
        WITH RECURSIVE tree(category_id, category_path, tree_level) AS (
          SELECT category_id, CAST(category_name AS TEXT), 1
          FROM categories
          WHERE parent_id IS NULL

          UNION ALL

          SELECT
            child.category_id,
            tree.category_path || ' > ' || child.category_name,
            tree.tree_level + 1
          FROM tree
          INNER JOIN categories child
            ON child.parent_id = tree.category_id
        )
        SELECT category_path, tree_level - 1 AS depth
        FROM tree
        ORDER BY category_path
      `,
      "m7-t2": `
        WITH ranked_sales AS (
          SELECT
            category,
            rep_name,
            revenue,
            ROW_NUMBER() OVER (
              PARTITION BY category
              ORDER BY revenue DESC, rep_id
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
        )
        SELECT
          category,
          rep_name,
          revenue,
          row_no,
          revenue_rank,
          dense_revenue_rank
        FROM ranked_sales
        ORDER BY category, revenue DESC, rep_name
      `,
      "m7-t3": `
        SELECT
          week_start,
          revenue,
          previous_revenue,
          ROUND(
            100.0 * (revenue - previous_revenue) /
            NULLIF(previous_revenue, 0),
            2
          ) AS revenue_change_pct
        FROM (
          SELECT
            week_start,
            revenue,
            LAG(revenue) OVER (ORDER BY week_start) AS previous_revenue
          FROM weekly_revenue
        ) AS history
        ORDER BY week_start
      `,
      "m7-t4": `
        WITH demand_signal AS (
          SELECT
            demand_date,
            units,
            AVG(units) OVER (
              ORDER BY demand_date
              ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
            ) AS raw_moving_average
          FROM daily_demand
        )
        SELECT
          demand_date,
          units,
          ROUND(raw_moving_average, 2) AS moving_avg_7d
        FROM demand_signal
        ORDER BY demand_date
      `,
    };

    const newTaskIds = [
      "m4-t2",
      "m4-t3",
      "m4-t4",
      "m5-t2",
      "m5-t3",
      "m5-t4",
      "m6-t2",
      "m6-t3",
      "m6-t4",
      "m7-t2",
      "m7-t3",
      "m7-t4",
    ];
    expect(newTaskIds).toHaveLength(12);

    for (const taskId of newTaskIds) {
      const task = tasks.find((candidate) => candidate.id === taskId);
      const sql = alternatives[taskId];
      expect(task, `${taskId} task is missing`).toBeTruthy();
      expect(sql, `${taskId} alternative solution is missing`).toBeTruthy();
      database = createTaskDatabaseForLesson(task!);
      await database.initialize();
      const evaluation = await runAndEvaluateLesson(database, task!, sql);
      expect(evaluation.status, `${taskId}: ${evaluation.message}`).toBe(
        "correct",
      );
      await database.dispose();
      database = undefined;
    }
  }, 180_000);

  it("accepts structurally different correct solutions for every remaining task", async () => {
    const alternatives: Record<string, string> = {
      "m1-t1": `
        SELECT catalog.product_name, catalog.category
        FROM (
          SELECT product_name, category
          FROM products
        ) AS catalog
      `,
      "m1-t2": `
        WITH catalog_categories AS (
          SELECT category
          FROM products
        )
        SELECT DISTINCT category
        FROM catalog_categories
      `,
      "m1-t3": `
        SELECT catalog.product_name, catalog.stock_quantity
        FROM (
          SELECT product_name, stock_quantity
          FROM products
        ) AS catalog
        ORDER BY catalog.stock_quantity
        LIMIT 3
      `,
      "m1-t4": `
        WITH price_list AS (
          SELECT product_name, unit_price
          FROM products
        )
        SELECT product_name, unit_price
        FROM price_list
        ORDER BY unit_price DESC
      `,
      "m2-t1": `
        SELECT order_id, customer_name, total_amount
        FROM orders
        WHERE NOT total_amount < 500
      `,
      "m2-t2": `
        WITH target_cities(city) AS (
          VALUES ('Ankara'), ('Istanbul')
        )
        SELECT order_id, customer_name, city
        FROM orders
        WHERE status = 'pending'
          AND city IN (SELECT city FROM target_cities)
      `,
      "m2-t3": `
        WITH campaign_orders AS (
          SELECT order_id, ordered_at, total_amount
          FROM orders
          WHERE ordered_at BETWEEN DATE '2026-01-04' AND DATE '2026-01-07'
        )
        SELECT order_id, ordered_at, total_amount
        FROM campaign_orders
        ORDER BY ordered_at
      `,
      "m2-t4": `
        SELECT customer_name, status
        FROM orders
        WHERE customer_name ILIKE '%E%'
          AND delivered_at IS NULL
        ORDER BY customer_name
      `,
      "m3-t1": `
        WITH calculated_sales AS (
          SELECT sale_id, unit_price * quantity AS line_revenue
          FROM sales
        )
        SELECT sale_id, line_revenue AS revenue
        FROM calculated_sales
      `,
      "m3-t2": `
        SELECT
          sale_id,
          UPPER(CONCAT(agent_first_name, ' ', agent_last_name)) AS agent_name
        FROM sales
      `,
      "m3-t3": `
        SELECT
          sale_id,
          TO_CHAR(DATE_TRUNC('month', sale_date), 'YYYY-MM') AS sale_month
        FROM sales
      `,
      "m3-t4": `
        WITH prepared_sales AS (
          SELECT
            sale_id::TEXT AS sale_ref,
            unit_price * quantity AS calculated_revenue
          FROM sales
        )
        SELECT
          sale_ref,
          CASE
            WHEN calculated_revenue >= 1000 THEN 'Yüksek'
            WHEN calculated_revenue >= 500 THEN 'Orta'
            ELSE 'Standart'
          END AS revenue_band
        FROM prepared_sales
      `,
      "m4-t1": `
        WITH completed_transactions AS (
          SELECT transaction_id, region, amount
          FROM transactions
          WHERE status = 'completed'
        )
        SELECT
          region,
          COUNT(transaction_id) AS transaction_count,
          SUM(amount) AS total_revenue
        FROM completed_transactions
        GROUP BY region
        HAVING SUM(amount) >= 900
        ORDER BY SUM(amount) DESC
      `,
      "m5-t1": `
        WITH completed_spend AS (
          SELECT customer_id, SUM(amount) AS total_spend
          FROM orders
          WHERE status = 'completed'
          GROUP BY customer_id
        )
        SELECT
          c.customer_name,
          COALESCE(s.total_spend, 0) AS total_spend
        FROM customers c
        LEFT JOIN completed_spend s ON s.customer_id = c.customer_id
        ORDER BY total_spend DESC, c.customer_name
      `,
      "m6-t1": `
        WITH branch_totals AS (
          SELECT branch, SUM(amount) AS branch_total
          FROM branch_sales
          GROUP BY branch
        ),
        benchmark AS (
          SELECT AVG(branch_total) AS average_total
          FROM branch_totals
        )
        SELECT totals.branch, totals.branch_total
        FROM branch_totals totals
        CROSS JOIN benchmark
        WHERE totals.branch_total > benchmark.average_total
      `,
      "m7-t1": `
        WITH balances AS (
          SELECT
            transaction_id,
            account_no,
            transaction_date,
            amount,
            SUM(amount) OVER (
              PARTITION BY account_no
              ORDER BY transaction_date, transaction_id
              ROWS UNBOUNDED PRECEDING
            ) AS running_balance
          FROM account_transactions
        )
        SELECT transaction_id, account_no, amount, running_balance
        FROM balances
        ORDER BY account_no, transaction_date, transaction_id
      `,
      "m8-t1": `
        UPDATE inventory
        SET stock_quantity = stock_quantity + (-3)
        WHERE product_id = 801
        RETURNING product_id, stock_quantity
      `,
      "m8-t2": `
        INSERT INTO inventory_movements (
          product_id,
          movement_type,
          movement_id,
          quantity_delta
        )
        SELECT 803, 'IN', 3004, 4
        RETURNING movement_id, product_id, quantity_delta, movement_type
      `,
      "m8-t3": `
        DELETE FROM import_rows
        WHERE import_row_id IN (
          SELECT import_row_id
          FROM import_rows
          WHERE batch_id = 'B-77'
            AND row_no = 2
        )
          AND status = 'draft'
        RETURNING import_row_id, batch_id, status
      `,
      "m8-t4": `
        INSERT INTO branch_daily_metrics (
          metric_date,
          branch_id,
          revenue,
          order_count
        )
        SELECT DATE '2026-05-20', 1, 1620.00, 14
        ON CONFLICT ON CONSTRAINT branch_daily_metrics_pkey
        DO UPDATE SET
          revenue = EXCLUDED.revenue,
          order_count = EXCLUDED.order_count
        RETURNING branch_id, metric_date, order_count, revenue
      `,
      "m9-t1": `
        WITH monthly_category_revenue AS (
          SELECT
            dates.month_label,
            products.category,
            SUM(sales.unit_price * sales.quantity) AS revenue
          FROM fact_sales sales
          INNER JOIN dim_date dates ON dates.date_key = sales.date_key
          INNER JOIN dim_product products
            ON products.product_key = sales.product_key
          GROUP BY dates.month_label, products.category
        )
        SELECT month_label, category, revenue
        FROM monthly_category_revenue
        ORDER BY month_label, category
      `,
      "m9-t2": `
        WITH open_customer_versions AS (
          SELECT customer_id, segment, valid_from
          FROM dim_customer
          WHERE valid_to IS NULL
        )
        SELECT customer_id, segment, valid_from
        FROM open_customer_versions
        ORDER BY customer_id
      `,
      "m9-t3": `
        WITH audited_sales AS (
          SELECT
            f.sale_key,
            f.product_key,
            f.revenue_amount,
            p.product_key AS matched_product_key
          FROM fact_sales f
          LEFT JOIN dim_product p ON f.product_key = p.product_key
        )
        SELECT sale_key, product_key, revenue_amount
        FROM audited_sales
        WHERE matched_product_key IS NULL
        ORDER BY sale_key
      `,
      "m9-t4": `
        WITH order_totals AS (
          SELECT
            f.week_key,
            f.channel_id,
            COUNT(f.order_key) AS order_count,
            SUM(f.revenue) AS revenue
          FROM fact_orders f
          GROUP BY f.week_key, f.channel_id
        ),
        reporting_grid AS (
          SELECT
            w.week_key,
            w.week_start,
            c.channel_id,
            c.channel_name
          FROM dim_channel c
          CROSS JOIN dim_week w
        )
        SELECT
          grid.week_start,
          grid.channel_name,
          COALESCE(totals.order_count, 0) AS order_count,
          COALESCE(totals.revenue, 0) AS revenue
        FROM reporting_grid grid
        LEFT JOIN order_totals totals
          ON totals.week_key = grid.week_key
         AND totals.channel_id = grid.channel_id
        ORDER BY grid.week_start, grid.channel_name
      `,
      "m10-t1": `
        WITH may_sales AS (
          SELECT branch_id, SUM(amount) AS actual_amount
          FROM branch_sales
          WHERE sale_month = '2026-05'
          GROUP BY branch_id
        )
        SELECT
          b.branch_name,
          t.target_amount,
          COALESCE(s.actual_amount, 0) AS actual_amount,
          ROUND(
            COALESCE(s.actual_amount, 0) * 100.0 / t.target_amount,
            2
          ) AS achievement_rate,
          CASE
            WHEN COALESCE(s.actual_amount, 0) >= t.target_amount THEN 'Hedefte'
            ELSE 'Geride'
          END AS target_status
        FROM monthly_targets t
        INNER JOIN branches b ON b.branch_id = t.branch_id
        LEFT JOIN may_sales s ON s.branch_id = t.branch_id
        WHERE t.target_month = '2026-05'
        ORDER BY achievement_rate DESC
      `,
      "m10-t2": `
        WITH usage_summary AS (
          SELECT customer_id, MAX(event_date) AS last_activity_date
          FROM usage_events
          GROUP BY customer_id
        ),
        ticket_summary AS (
          SELECT
            customer_id,
            COUNT(ticket_id) FILTER (WHERE status = 'open') AS open_ticket_count
          FROM support_tickets
          GROUP BY customer_id
        ),
        customer_signals AS (
          SELECT
            c.customer_name,
            u.last_activity_date,
            CASE
              WHEN u.last_activity_date IS NULL THEN NULL
              ELSE DATE '2026-06-01' - u.last_activity_date
            END AS inactive_days,
            COALESCE(t.open_ticket_count, 0) AS open_ticket_count
          FROM customers c
          INNER JOIN subscriptions s
            ON s.customer_id = c.customer_id
           AND s.status = 'active'
          LEFT JOIN usage_summary u ON u.customer_id = c.customer_id
          LEFT JOIN ticket_summary t ON t.customer_id = c.customer_id
        ),
        classified AS (
          SELECT
            *,
            CASE
              WHEN last_activity_date IS NULL THEN 'Yüksek'
              WHEN inactive_days >= 45 OR open_ticket_count >= 2 THEN 'Yüksek'
              WHEN inactive_days >= 30 OR open_ticket_count >= 1 THEN 'Orta'
              ELSE 'Düşük'
            END AS risk_level
          FROM customer_signals
        )
        SELECT
          customer_name,
          last_activity_date,
          inactive_days,
          open_ticket_count,
          risk_level
        FROM classified
        ORDER BY
          CASE risk_level
            WHEN 'Yüksek' THEN 1
            WHEN 'Orta' THEN 2
            ELSE 3
          END,
          inactive_days DESC NULLS FIRST,
          customer_name
      `,
      "m10-t3": `
        WITH refund_totals AS (
          SELECT campaign_id, SUM(refund_amount) AS refund_amount
          FROM refunds
          GROUP BY campaign_id
        ),
        revenue_totals AS (
          SELECT
            orders.campaign_id,
            SUM(orders.gross_revenue) -
              COALESCE(refunds.refund_amount, 0) AS net_revenue
          FROM attributed_orders orders
          LEFT JOIN refund_totals refunds
            ON refunds.campaign_id = orders.campaign_id
          GROUP BY orders.campaign_id, refunds.refund_amount
        ),
        spend_totals AS (
          SELECT campaign_id, SUM(spend_amount) AS total_spend
          FROM spend_events
          GROUP BY campaign_id
        ),
        campaign_metrics AS (
          SELECT
            campaigns.campaign_name,
            COALESCE(spend.total_spend, 0) AS total_spend,
            COALESCE(revenue.net_revenue, 0) AS net_revenue
          FROM campaigns
          LEFT JOIN spend_totals spend
            ON spend.campaign_id = campaigns.campaign_id
          LEFT JOIN revenue_totals revenue
            ON revenue.campaign_id = campaigns.campaign_id
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
        FROM campaign_metrics
        ORDER BY profit DESC, campaign_name
      `,
      "m10-t4": `
        WITH incident_summary AS (
          SELECT
            branch_id,
            incident_date,
            COUNT(incident_id) AS incident_count,
            SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical_count
          FROM incidents
          GROUP BY branch_id, incident_date
        ),
        daily_base AS (
          SELECT
            branches.branch_id,
            branches.branch_name,
            operations.operation_date,
            operations.incoming_count - operations.resolved_count AS backlog_delta,
            operations.avg_delay_hours,
            targets.backlog_limit,
            COALESCE(incidents.incident_count, 0) AS incident_count,
            COALESCE(incidents.critical_count, 0) AS critical_count
          FROM branches
          INNER JOIN daily_operations operations
            ON operations.branch_id = branches.branch_id
          INNER JOIN capacity_targets targets
            ON targets.branch_id = branches.branch_id
          LEFT JOIN incident_summary incidents
            ON incidents.branch_id = branches.branch_id
           AND incidents.incident_date = operations.operation_date
        ),
        measured AS (
          SELECT
            *,
            SUM(backlog_delta) OVER (
              PARTITION BY branch_id
              ORDER BY operation_date
              ROWS UNBOUNDED PRECEDING
            ) AS running_backlog,
            avg_delay_hours - LAG(avg_delay_hours) OVER (
              PARTITION BY branch_id
              ORDER BY operation_date
            ) AS delay_change
          FROM daily_base
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
        FROM measured
        ORDER BY branch_name, operation_date
      `,
    };

    const remainingTaskIds = [
      "m1-t1",
      "m1-t2",
      "m1-t3",
      "m1-t4",
      "m2-t1",
      "m2-t2",
      "m2-t3",
      "m2-t4",
      "m3-t1",
      "m3-t2",
      "m3-t3",
      "m3-t4",
      "m4-t1",
      "m5-t1",
      "m6-t1",
      "m7-t1",
      "m8-t1",
      "m8-t2",
      "m8-t3",
      "m8-t4",
      "m9-t1",
      "m9-t2",
      "m9-t3",
      "m9-t4",
      "m10-t1",
      "m10-t2",
      "m10-t3",
      "m10-t4",
    ];
    expect(remainingTaskIds).toHaveLength(28);

    for (const taskId of remainingTaskIds) {
      const task = tasks.find((candidate) => candidate.id === taskId);
      const sql = alternatives[taskId];
      expect(task, `${taskId} task is missing`).toBeTruthy();
      expect(sql, `${taskId} alternative solution is missing`).toBeTruthy();
      database = createTaskDatabaseForLesson(task!);
      await database.initialize();
      const evaluation = await runAndEvaluateLesson(database, task!, sql);
      expect(evaluation.status, `${taskId}: ${evaluation.message}`).toBe(
        "correct",
      );
      await database.dispose();
      database = undefined;
    }
  }, 240_000);

  it("classifies realistic mistakes across the expanded concept families", async () => {
    const cases = [
      {
        taskId: "m1-t1",
        expectedStatus: "columns-wrong",
        sql: `
          SELECT category, product_name
          FROM products
        `,
      },
      {
        taskId: "m1-t2",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT category
          FROM products
        `,
      },
      {
        taskId: "m1-t3",
        expectedStatus: "order-wrong",
        sql: `
          SELECT product_name, stock_quantity
          FROM (
            SELECT product_name, stock_quantity
            FROM products
            ORDER BY stock_quantity
            LIMIT 3
          ) AS critical_stock
          ORDER BY stock_quantity DESC
        `,
      },
      {
        taskId: "m1-t4",
        expectedStatus: "order-wrong",
        sql: `
          SELECT product_name, unit_price
          FROM products
          ORDER BY unit_price ASC
        `,
      },
      {
        taskId: "m2-t1",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT order_id, customer_name, total_amount
          FROM orders
          WHERE total_amount > 800
        `,
      },
      {
        taskId: "m2-t2",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT order_id, customer_name, city
          FROM orders
          WHERE city IN ('Ankara')
            AND status = 'pending'
        `,
      },
      {
        taskId: "m2-t3",
        expectedStatus: "order-wrong",
        sql: `
          SELECT order_id, ordered_at, total_amount
          FROM orders
          WHERE ordered_at BETWEEN DATE '2026-01-04' AND DATE '2026-01-07'
          ORDER BY ordered_at DESC
        `,
      },
      {
        taskId: "m2-t4",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT customer_name, status
          FROM orders
          WHERE delivered_at IS NULL
            AND customer_name LIKE '%i%'
          ORDER BY customer_name
        `,
      },
      {
        taskId: "m3-t1",
        expectedStatus: "columns-wrong",
        sql: `
          SELECT
            sale_id,
            quantity * unit_price AS total_revenue
          FROM sales
        `,
      },
      {
        taskId: "m3-t2",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT
            sale_id,
            LOWER(agent_first_name || ' ' || agent_last_name) AS agent_name
          FROM sales
        `,
      },
      {
        taskId: "m3-t3",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT
            sale_id,
            TO_CHAR(sale_date, 'YYYY') AS sale_month
          FROM sales
        `,
      },
      {
        taskId: "m3-t4",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT
            CAST(sale_id AS TEXT) AS sale_ref,
            CASE
              WHEN quantity * unit_price >= 500 THEN 'Yüksek'
              WHEN quantity * unit_price >= 250 THEN 'Orta'
              ELSE 'Standart'
            END AS revenue_band
          FROM sales
        `,
      },
      {
        taskId: "m4-t2",
        expectedStatus: "columns-wrong",
        sql: `
          SELECT
            channel,
            COUNT(*) AS total_orders,
            SUM(order_amount) AS total_amount,
            AVG(order_amount) AS avg_amount,
            MIN(order_amount) AS min_amount,
            MAX(order_amount) AS max_amount
          FROM channel_orders
          GROUP BY channel
          ORDER BY channel
        `,
      },
      {
        taskId: "m4-t3",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT
            channel,
            COUNT(*) AS order_count,
            COUNT(*) AS coupon_order_count
          FROM channel_orders
          GROUP BY channel
          ORDER BY channel
        `,
      },
      {
        taskId: "m4-t4",
        expectedStatus: "required-concept-missing",
        sql: `
          SELECT
            channel,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders,
            COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders,
            COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders
          FROM channel_orders
          GROUP BY channel
          ORDER BY channel
        `,
      },
      {
        taskId: "m5-t2",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT
            o.order_id,
            c.customer_name,
            i.quantity * i.unit_price AS order_total
          FROM orders o
          INNER JOIN customers c ON o.customer_id = c.customer_id
          INNER JOIN order_items i ON i.order_id = o.order_id
          ORDER BY o.order_id
        `,
      },
      {
        taskId: "m5-t3",
        expectedStatus: "columns-wrong",
        sql: `
          SELECT
            e.employee_name,
            m.employee_name AS manager
          FROM employees e
          INNER JOIN employees m ON e.manager_id = m.employee_id
          ORDER BY e.employee_id
        `,
      },
      {
        taskId: "m5-t4",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT
            l.line_id,
            l.company_id,
            l.sku,
            l.quantity * p.unit_price AS line_total
          FROM order_lines l
          INNER JOIN catalog_prices p ON l.sku = p.sku
          ORDER BY l.line_id
        `,
      },
      {
        taskId: "m6-t2",
        expectedStatus: "order-wrong",
        sql: `
          SELECT product_name, unit_price
          FROM products
          WHERE category_id IN (
            SELECT category_id
            FROM categories
            WHERE campaign_active = TRUE
          )
            AND unit_price > (SELECT AVG(unit_price) FROM products)
          ORDER BY unit_price ASC
        `,
      },
      {
        taskId: "m6-t3",
        expectedStatus: "required-concept-missing",
        sql: `
          SELECT c.customer_id, c.customer_name
          FROM customers c
          LEFT JOIN orders o
            ON o.customer_id = c.customer_id
           AND o.ordered_at >= DATE '2026-04-01'
          WHERE o.order_id IS NULL
          ORDER BY c.customer_id
        `,
      },
      {
        taskId: "m6-t4",
        expectedStatus: "rows-wrong",
        sql: `
          WITH RECURSIVE category_tree AS (
            SELECT
              category_id,
              category_name::TEXT AS category_path,
              1 AS depth
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
          ORDER BY category_path
        `,
      },
      {
        taskId: "m7-t2",
        expectedStatus: "rows-wrong",
        sql: `
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
            RANK() OVER (
              PARTITION BY category
              ORDER BY revenue DESC
            ) AS dense_revenue_rank
          FROM representative_sales
          ORDER BY category, revenue DESC, rep_name
        `,
      },
      {
        taskId: "m7-t3",
        expectedStatus: "columns-wrong",
        sql: `
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
            ) AS change_pct
          FROM changes
          ORDER BY week_start
        `,
      },
      {
        taskId: "m7-t4",
        expectedStatus: "order-wrong",
        sql: `
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
          ORDER BY demand_date DESC
        `,
      },
      {
        taskId: "m4-t1",
        expectedStatus: "order-wrong",
        sql: `
          SELECT
            region,
            COUNT(*) AS transaction_count,
            SUM(amount) AS total_revenue
          FROM transactions
          WHERE status = 'completed'
          GROUP BY region
          HAVING SUM(amount) >= 900
          ORDER BY total_revenue ASC
        `,
      },
      {
        taskId: "m5-t1",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT
            c.customer_name,
            COALESCE(SUM(o.amount), 0) AS total_spend
          FROM customers c
          LEFT JOIN orders o ON o.customer_id = c.customer_id
          WHERE o.status = 'completed'
          GROUP BY c.customer_id, c.customer_name
          ORDER BY total_spend DESC, c.customer_name
        `,
      },
      {
        taskId: "m6-t1",
        expectedStatus: "required-concept-missing",
        sql: `
          SELECT branch, SUM(amount) AS branch_total
          FROM branch_sales
          GROUP BY branch
          HAVING SUM(amount) > (
            SELECT AVG(branch_total)
            FROM (
              SELECT SUM(amount) AS branch_total
              FROM branch_sales
              GROUP BY branch
            ) AS totals
          )
        `,
      },
      {
        taskId: "m7-t1",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT
            transaction_id,
            account_no,
            amount,
            SUM(amount) OVER (
              ORDER BY transaction_date, transaction_id
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS running_balance
          FROM account_transactions
          ORDER BY account_no, transaction_date, transaction_id
        `,
      },
      {
        taskId: "m8-t1",
        expectedStatus: "required-concept-missing",
        sql: `
          SELECT
            product_id,
            stock_quantity - 3 AS stock_quantity
          FROM inventory
          WHERE product_id = 801
        `,
      },
      {
        taskId: "m8-t2",
        expectedStatus: "rows-wrong",
        sql: `
          INSERT INTO inventory_movements (
            movement_id,
            product_id,
            quantity_delta,
            movement_type
          )
          VALUES (3004, 803, -4, 'OUT')
          RETURNING movement_id, product_id, quantity_delta, movement_type
        `,
      },
      {
        taskId: "m8-t3",
        expectedStatus: "rows-wrong",
        sql: `
          DELETE FROM import_rows
          WHERE row_no = 2
            AND status = 'draft'
          RETURNING import_row_id, batch_id, status
        `,
      },
      {
        taskId: "m8-t4",
        expectedStatus: "rows-wrong",
        sql: `
          INSERT INTO branch_daily_metrics (
            branch_id,
            metric_date,
            order_count,
            revenue
          )
          VALUES (1, DATE '2026-05-20', 13, 1500.00)
          ON CONFLICT (branch_id, metric_date)
          DO UPDATE SET
            order_count = EXCLUDED.order_count,
            revenue = EXCLUDED.revenue
          RETURNING branch_id, metric_date, order_count, revenue
        `,
      },
      {
        taskId: "m9-t1",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT
            d.month_label,
            p.category,
            SUM(f.quantity) AS revenue
          FROM fact_sales f
          INNER JOIN dim_product p ON p.product_key = f.product_key
          INNER JOIN dim_date d ON d.date_key = f.date_key
          GROUP BY d.month_label, p.category
          ORDER BY d.month_label, p.category
        `,
      },
      {
        taskId: "m9-t2",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT customer_id, segment, valid_from
          FROM dim_customer
          WHERE valid_to IS NOT NULL
          ORDER BY customer_id
        `,
      },
      {
        taskId: "m9-t3",
        expectedStatus: "rows-wrong",
        sql: `
          SELECT f.sale_key, f.product_key, f.revenue_amount
          FROM fact_sales f
          LEFT JOIN dim_product p ON p.product_key = f.product_key
          WHERE p.product_key IS NOT NULL
          ORDER BY f.sale_key
        `,
      },
      {
        taskId: "m9-t4",
        expectedStatus: "rows-wrong",
        sql: `
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
            ON o.channel_id = c.channel_id
          ORDER BY c.week_start, c.channel_name
        `,
      },
      {
        taskId: "m10-t1",
        expectedStatus: "rows-wrong",
        sql: `
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
          LEFT JOIN branch_sales s ON s.branch_id = b.branch_id
          GROUP BY b.branch_id, b.branch_name, t.target_amount
          ORDER BY achievement_rate DESC
        `,
      },
      {
        taskId: "m10-t2",
        expectedStatus: "rows-wrong",
        sql: `
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
          all_tickets AS (
            SELECT customer_id, COUNT(*) AS open_ticket_count
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
            LEFT JOIN all_tickets t ON t.customer_id = c.customer_id
          ),
          risked AS (
            SELECT
              *,
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
            customer_name
        `,
      },
      {
        taskId: "m10-t3",
        expectedStatus: "rows-wrong",
        sql: `
          WITH inflated_metrics AS (
            SELECT
              c.campaign_name,
              COALESCE(SUM(s.spend_amount), 0) AS total_spend,
              COALESCE(SUM(o.gross_revenue), 0) -
                COALESCE(SUM(r.refund_amount), 0) AS net_revenue
            FROM campaigns c
            LEFT JOIN spend_events s ON s.campaign_id = c.campaign_id
            LEFT JOIN attributed_orders o ON o.campaign_id = c.campaign_id
            LEFT JOIN refunds r ON r.campaign_id = c.campaign_id
            GROUP BY c.campaign_id, c.campaign_name
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
          FROM inflated_metrics
          ORDER BY profit DESC, campaign_name
        `,
      },
      {
        taskId: "m10-t4",
        expectedStatus: "rows-wrong",
        sql: `
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
                ORDER BY operation_date, branch_id
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
          ORDER BY branch_name, operation_date
        `,
      },
    ] as const;

    expect(cases).toHaveLength(40);
    expect(new Set(cases.map((testCase) => testCase.taskId)).size).toBe(40);
    expect(cases.map((testCase) => testCase.taskId).sort()).toEqual(
      tasks
        .filter((task) => task.moduleId !== "module-11" && task.type === "case")
        .map((task) => task.id)
        .sort(),
    );

    for (const testCase of cases) {
      const task = tasks.find((candidate) => candidate.id === testCase.taskId);
      expect(task, `${testCase.taskId} task is missing`).toBeTruthy();
      database = createTaskDatabaseForLesson(task!);
      await database.initialize();
      const evaluation = await runAndEvaluateLesson(
        database,
        task!,
        testCase.sql,
      );
      expect(evaluation.status, testCase.taskId).toBe(testCase.expectedStatus);
      await database.dispose();
      database = undefined;
    }
  }, 240_000);

  it("rejects a mutation that spoofs a correct RETURNING row without the correct post-state", async () => {
    const task = tasks.find((candidate) => candidate.id === "m8-t4");
    expect(task).toBeTruthy();
    expect(task?.mutationVerification).toBeTruthy();

    const spoofedSql = `
      INSERT INTO branch_daily_metrics (
        branch_id,
        metric_date,
        order_count,
        revenue
      )
      VALUES (2, DATE '2026-05-20', 14, 1620.00)
      ON CONFLICT (branch_id, metric_date)
      DO UPDATE SET
        order_count = EXCLUDED.order_count,
        revenue = EXCLUDED.revenue
      RETURNING
        1 AS branch_id,
        DATE '2026-05-20' AS metric_date,
        14 AS order_count,
        1620.00 AS revenue
    `;

    database = createTaskDatabaseForLesson(task!);
    await database.initialize();
    const visibleResult = await database.run(spoofedSql);
    const visibleOnlyTask: LessonTask = {
      ...task!,
      mutationVerification: undefined,
    };
    expect(
      evaluateLessonQuery(visibleOnlyTask, spoofedSql, visibleResult).status,
    ).toBe("correct");

    const mutationVerificationResult = await database.run(
      task!.mutationVerification!.sql,
    );
    const evaluation = evaluateLessonQuery(
      task!,
      spoofedSql,
      visibleResult,
      undefined,
      mutationVerificationResult,
    );
    expect(evaluation.status).toBe("rows-wrong");
  }, 30_000);

  it("executes and accepts the mutation, modeling and capstone reference solutions", async () => {
    const solutions: Record<string, string> = {
      "m8-t1": `
        UPDATE inventory
        SET stock_quantity = stock_quantity - 3
        WHERE product_id = 801
        RETURNING product_id, stock_quantity
      `,
      "m9-t1": `
        SELECT
          d.month_label,
          p.category,
          SUM(f.quantity * f.unit_price) AS revenue
        FROM fact_sales f
        INNER JOIN dim_product p ON p.product_key = f.product_key
        INNER JOIN dim_date d ON d.date_key = f.date_key
        GROUP BY d.month_label, p.category
        ORDER BY d.month_label, p.category
      `,
      "m10-t1": `
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
        ORDER BY achievement_rate DESC
      `,
    };

    const remainingTasks = tasks.filter((task) =>
      ["module-8", "module-9", "module-10"].includes(task.moduleId),
    );
    expect(remainingTasks).toHaveLength(12);

    for (const task of remainingTasks) {
      const fixtureSql = solutions[task.id];
      if (fixtureSql) {
        expect(normalizeSql(task.solutionSql)).toBe(normalizeSql(fixtureSql));
      }
      database = createTaskDatabaseForLesson(task);
      await database.initialize();
      const evaluation = await runAndEvaluateLesson(
        database,
        task,
        task.solutionSql,
      );
      expect(evaluation.status, `${task.id}: ${evaluation.message}`).toBe(
        "correct",
      );
      await database.dispose();
      database = undefined;
    }
  }, 90_000);

  it("executes all marketing project solutions and rejects project-specific analytical mistakes", async () => {
    const projectTasks = tasks.filter((task) => task.moduleId === "module-11");
    const mistakes = {
      ...MARKETING_PROJECT_MISTAKES_PART_ONE,
      ...MARKETING_PROJECT_MISTAKES_PART_TWO,
    };
    expect(projectTasks).toHaveLength(12);
    expect(Object.keys(mistakes).sort()).toEqual(
      projectTasks.map((task) => task.id).sort(),
    );

    for (const task of projectTasks) {
      database = createTaskDatabaseForLesson(task);
      await database.initialize();

      const accepted = await runAndEvaluateLesson(
        database,
        task,
        task.solutionSql,
      );
      expect(accepted.status, `${task.id}: ${accepted.message}`).toBe(
        "correct",
      );

      const mistake = mistakes[task.id as keyof typeof mistakes];
      expect(
        mistake,
        `${task.id}: realistic mistake fixture is missing`,
      ).toBeDefined();
      const rejected = await runAndEvaluateLesson(database, task, mistake.sql);
      expect(rejected.status, `${task.id}: ${rejected.message}`).toBe(
        mistake.expectedStatus,
      );

      await database.dispose();
      database = undefined;
    }
  }, 240_000);
});
