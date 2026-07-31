import { describe, expect, it } from "vitest";
import {
  assertQueryAllowed,
  maskSqlLiteralsAndComments,
  SqlSecurityError,
  validateQuerySecurity,
} from "../../features/sql-engine/security";

describe("query security", () => {
  it("allows a single ordinary query and ignores keywords in data/comments", () => {
    const sql = `
      SELECT 'DROP DATABASE analytics; DELETE FROM users' AS note
      FROM sales
      -- DROP TABLE sales;
      WHERE city = $$TRUNCATE customers;$$;
    `;
    expect(validateQuerySecurity(sql, ["DELETE", "TRUNCATE"]).allowed).toBe(
      true,
    );
  });

  it("blocks multiple statements outside comments and literals", () => {
    const result = validateQuerySecurity(
      "SELECT * FROM sales; DELETE FROM sales",
    );
    expect(result.allowed).toBe(false);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "multiple-statements" }),
      ]),
    );
  });

  it.each([
    ["DROP DATABASE lab", "database-operation"],
    ["ALTER SYSTEM SET work_mem = '1GB'", "system-operation"],
    ["SELECT * FROM pg_catalog.pg_class", "system-catalog"],
    ["SELECT pg_read_file('/etc/passwd')", "system-operation"],
    ["COPY sales TO '/tmp/sales.csv'", "external-access"],
    ["GRANT SELECT ON sales TO public", "privilege-operation"],
  ])("blocks %s", (sql, code) => {
    expect(validateQuerySecurity(sql).violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code })]),
    );
  });

  it("applies task-level DDL/DML restrictions with enum-style names", () => {
    const result = validateQuerySecurity("DROP TABLE sales", ["DROP_TABLE"]);
    expect(result.violations[0]).toMatchObject({
      code: "forbidden-operation",
      operation: "DROP_TABLE",
    });
  });

  it("throws a typed error carrying all violations", () => {
    expect(() =>
      assertQueryAllowed("DELETE FROM sales", ["DELETE"]),
    ).toThrowError(SqlSecurityError);
  });

  it("masks nested comments and quoted content without moving semicolons", () => {
    const masked = maskSqlLiteralsAndComments(
      `SELECT "DROP;name", 'DELETE;'; /* outer /* inner; */ done */`,
    );
    expect(masked).toContain("SELECT");
    expect(masked).not.toContain("DROP");
    expect(masked).not.toContain("DELETE");
    expect(masked.trim().endsWith(";")).toBe(true);
  });
});

