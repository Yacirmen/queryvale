import { describe, expect, it } from "vitest";
import {
  checkRequiredConcepts,
  detectSqlConcepts,
  normalizeConceptName,
} from "../../features/validation/sql-concepts";
import { tasks } from "../../content/curriculum";

describe("SQL concept detection", () => {
  it("detects joins, grouping, having, CTE and window functions", () => {
    const sql = `
      WITH branch_sales AS (
        SELECT b.id, SUM(o.total) AS total
        FROM branches b
        LEFT JOIN orders o ON o.branch_id = b.id
        GROUP BY b.id
        HAVING SUM(o.total) > 100
      )
      SELECT id, total,
        RANK() OVER (ORDER BY total DESC) AS sales_rank
      FROM branch_sales
      ORDER BY total DESC
    `;
    const concepts = detectSqlConcepts(sql);
    expect(concepts).toEqual(
      expect.objectContaining({
        has: expect.any(Function),
      }),
    );
    for (const concept of [
      "CTE",
      "SELECT",
      "LEFT_JOIN",
      "GROUP_BY",
      "HAVING",
      "AGGREGATE",
      "WINDOW",
      "RANK",
      "ORDER_BY",
      "ALIAS",
    ] as const) {
      expect(concepts.has(concept)).toBe(true);
    }
  });

  it("does not count concepts mentioned only in comments or literals", () => {
    const check = checkRequiredConcepts(
      "SELECT 'use GROUP BY and HAVING' AS hint -- JOIN customers",
      ["GROUP BY", "HAVING", "JOIN"],
    );
    expect(check.satisfied).toBe(false);
    expect(check.missing).toEqual(["GROUP BY", "HAVING", "JOIN"]);
  });

  it("normalizes curriculum concept spelling", () => {
    const check = checkRequiredConcepts(
      "SELECT city, COUNT(*) FROM sales GROUP BY city",
      ["group-by", "SELECT"],
    );
    expect(check.satisfied).toBe(true);
  });

  it("detects PostgreSQL upserts separately from plain INSERT and UPDATE", () => {
    const upsert = detectSqlConcepts(`
      INSERT INTO daily_snapshots (branch_id, snapshot_date, backlog)
      VALUES (10, DATE '2026-06-01', 24)
      ON CONFLICT (branch_id, snapshot_date)
      DO UPDATE SET backlog = EXCLUDED.backlog
      RETURNING branch_id, snapshot_date, backlog
    `);

    expect(upsert.has("INSERT")).toBe(true);
    expect(upsert.has("UPDATE")).toBe(true);
    expect(upsert.has("UPSERT")).toBe(true);
    expect(normalizeConceptName("upsert")).toBe("UPSERT");
    expect(normalizeConceptName("on conflict")).toBe("UPSERT");

    const insert = detectSqlConcepts(`
      INSERT INTO daily_snapshots (branch_id, snapshot_date, backlog)
      VALUES (11, DATE '2026-06-01', 8)
      RETURNING branch_id
    `);
    expect(insert.has("INSERT")).toBe(true);
    expect(insert.has("UPDATE")).toBe(false);
    expect(insert.has("UPSERT")).toBe(false);

    const update = detectSqlConcepts(`
      UPDATE daily_snapshots
      SET backlog = 8
      WHERE branch_id = 11
    `);
    expect(update.has("INSERT")).toBe(false);
    expect(update.has("UPDATE")).toBe(true);
    expect(update.has("UPSERT")).toBe(false);

    const doNothing = detectSqlConcepts(`
      INSERT INTO daily_snapshots (branch_id, snapshot_date, backlog)
      VALUES (11, DATE '2026-06-01', 8)
      ON CONFLICT (branch_id, snapshot_date) DO NOTHING
    `);
    expect(doNothing.has("INSERT")).toBe(true);
    expect(doNothing.has("UPDATE")).toBe(false);
    expect(doNothing.has("UPSERT")).toBe(false);
  });

  it("does not infer an upsert from comments or string values", () => {
    const concepts = detectSqlConcepts(`
      INSERT INTO audit_log (message)
      VALUES ('ON CONFLICT DO UPDATE is the documented recovery path')
      -- ON CONFLICT (message) DO UPDATE SET message = EXCLUDED.message
      RETURNING message
    `);

    expect(concepts.has("INSERT")).toBe(true);
    expect(concepts.has("UPDATE")).toBe(false);
    expect(concepts.has("UPSERT")).toBe(false);
    expect(checkRequiredConcepts("SELECT 1", ["UPSERT"])).toMatchObject({
      satisfied: false,
      missing: ["UPSERT"],
    });
  });

  it("recognizes every concept used as a curriculum requirement", () => {
    for (const task of tasks) {
      for (const concept of task.requiredConcepts) {
        expect(
          normalizeConceptName(concept),
          `${task.id} uses unsupported concept ${concept}`,
        ).toBeDefined();
      }
    }
  });

  it("detects transformation, aggregate and running-total requirements", () => {
    const transformation = detectSqlConcepts(`
      SELECT
        sale_id::text AS sale_ref,
        UPPER(agent_first_name || ' ' || agent_last_name) AS agent_name,
        TO_CHAR(sale_date, 'YYYY-MM') AS sale_month,
        quantity * unit_price AS revenue
      FROM sales
      WHERE quantity * unit_price >= 500
    `);
    for (const concept of [
      "CAST",
      "STRING_FUNCTION",
      "DATE_FUNCTION",
      "ARITHMETIC",
      "COMPARISON",
    ] as const) {
      expect(transformation.has(concept)).toBe(true);
    }

    const running = detectSqlConcepts(`
      SELECT transaction_id,
        SUM(amount) OVER (
          PARTITION BY account_no
          ORDER BY transaction_date, transaction_id
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS running_balance
      FROM account_transactions
    `);
    expect(running.has("SUM")).toBe(true);
    expect(running.has("PARTITION_BY")).toBe(true);
    expect(running.has("RUNNING_TOTAL")).toBe(true);
  });

  it("detects star-schema and reporting query shapes", () => {
    const star = detectSqlConcepts(`
      SELECT d.month_label, p.category, SUM(f.quantity * f.unit_price)
      FROM fact_sales f
      INNER JOIN dim_product p ON p.product_key = f.product_key
      INNER JOIN dim_date d ON d.date_key = f.date_key
      GROUP BY d.month_label, p.category
    `);
    expect(star.has("STAR_SCHEMA")).toBe(true);
    expect(star.has("MULTI_JOIN")).toBe(true);

    const report = detectSqlConcepts(`
      SELECT b.branch_name, SUM(s.amount),
        CASE WHEN SUM(s.amount) >= t.target_amount THEN 'ok' ELSE 'behind' END
      FROM branches b
      JOIN monthly_targets t ON t.branch_id = b.branch_id
      LEFT JOIN branch_sales s ON s.branch_id = b.branch_id
      GROUP BY b.branch_name, t.target_amount
    `);
    expect(report.has("REPORTING")).toBe(true);
  });
});
