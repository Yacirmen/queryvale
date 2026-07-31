// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import {
  createTaskDatabase,
  createTaskDatabaseForLesson,
  type TaskDatabase,
} from "../../features/sql-engine";
import { tasks } from "../../content/curriculum";
import { evaluateLessonQuery } from "../../features/validation";

let database: TaskDatabase | undefined;

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
    expect((await database.run("SELECT id FROM sales ORDER BY id")).rows).toEqual([
      { id: 2 },
      { id: 3 },
    ]);

    await database.reset();
    expect((await database.run("SELECT id FROM sales ORDER BY id")).rows).toEqual([
      { id: 1 },
      { id: 2 },
    ]);
  }, 30_000);

  it("executes and accepts reference solutions for every task in modules 1–3", async () => {
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
      "m3-t1":
        "SELECT sale_id, quantity * unit_price AS revenue FROM sales",
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

    const productionTasks = tasks.filter((task) =>
      ["module-1", "module-2", "module-3"].includes(task.moduleId),
    );
    expect(productionTasks).toHaveLength(12);

    for (const task of productionTasks) {
      const sql = solutions[task.id];
      expect(sql, `${task.id} reference solution is missing`).toBeTruthy();
      database = createTaskDatabaseForLesson(task);
      await database.initialize();
      const result = await database.run(sql);
      const evaluation = evaluateLessonQuery(task, sql, result);
      expect(evaluation.status, `${task.id}: ${evaluation.message}`).toBe(
        "correct",
      );
      await database.dispose();
      database = undefined;
    }
  }, 120_000);

  it("initializes every expandable module fixture in a real PGlite database", async () => {
    const expandableTasks = tasks.filter(
      (task) => !["module-1", "module-2", "module-3"].includes(task.moduleId),
    );
    expect(expandableTasks).toHaveLength(7);

    for (const task of expandableTasks) {
      database = createTaskDatabaseForLesson(task);
      await expect(database.initialize(), task.id).resolves.toBeUndefined();
      await database.dispose();
      database = undefined;
    }
  }, 120_000);
});
