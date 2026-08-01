import { describe, expect, it } from "vitest";
import { SqlSecurityError } from "../../features/sql-engine/security";
import { translateSqlError } from "../../features/validation/error-feedback";

describe("translateSqlError", () => {
  it("turns a missing-column error into actionable teaching feedback", () => {
    const feedback = translateSqlError({
      code: "42703",
      message: 'column "customer" does not exist',
      position: "15",
    });
    expect(feedback).toMatchObject({
      title: "Kolon bulunamadı",
      code: "42703",
    });
    expect(feedback.message).toContain("customer");
    expect(feedback.suggestion).toContain("Şema");
  });

  it("suggests GROUP BY for an aggregation error", () => {
    const feedback = translateSqlError({
      code: "42803",
      message: 'column "sales.city" must appear in the GROUP BY clause',
    });
    expect(feedback.title).toBe("Gruplama eksik");
    expect(feedback.suggestion).toContain("GROUP BY");
  });

  it("keeps security failures distinct from SQL syntax errors", () => {
    const error = new SqlSecurityError([
      {
        code: "forbidden-operation",
        operation: "DELETE",
        message: "DELETE işlemi bu vakada kullanılamaz.",
      },
    ]);
    expect(translateSqlError(error)).toMatchObject({
      title: "Bu sorguya izin verilmiyor",
      message: "DELETE işlemi bu vakada kullanılamaz.",
    });
  });
});
