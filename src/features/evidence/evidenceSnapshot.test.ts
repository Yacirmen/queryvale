import { describe, expect, it } from "vitest";
import {
  createVerifiedRunSnapshot,
  isVerifiedRunSnapshot,
  MAX_EVIDENCE_CELL_CHARS,
  MAX_EVIDENCE_COLUMNS,
  MAX_EVIDENCE_COLUMN_NAME_CHARS,
  MAX_EVIDENCE_PREVIEW_ROWS,
  MAX_EVIDENCE_QUERY_CHARS,
} from "./evidenceSnapshot";

describe("evidenceSnapshot", () => {
  it("creates a JSON-safe preview from a verified execution", () => {
    const snapshot = createVerifiedRunSnapshot(
      "m1-t3",
      "SELECT product_name, captured_at, amount, payload FROM evidence",
      {
        columns: ["product_name", "captured_at", "amount", "payload"],
        rows: [
          {
            product_name: null,
            captured_at: new Date("2026-07-31T08:00:00.000Z"),
            amount: BigInt(9),
            payload: new Uint8Array([1, 2, 3]),
          },
        ],
        rowCount: 1,
        truncated: false,
      },
      "2026-07-31T09:00:00.000Z",
    );

    expect(snapshot).toEqual({
      taskId: "m1-t3",
      verifiedAt: "2026-07-31T09:00:00.000Z",
      query: "SELECT product_name, captured_at, amount, payload FROM evidence",
      columns: ["product_name", "captured_at", "amount", "payload"],
      previewRows: [["NULL", "2026-07-31T08:00:00.000Z", "9", "[3 bayt]"]],
      rowCount: 1,
      truncated: false,
    });
    expect(isVerifiedRunSnapshot(snapshot)).toBe(true);
    expect(() => JSON.stringify(snapshot)).not.toThrow();
  });

  it("bounds query, columns, rows and display cells", () => {
    const sourceColumns = Array.from(
      { length: MAX_EVIDENCE_COLUMNS + 3 },
      (_, index) =>
        `${index}-${"c".repeat(MAX_EVIDENCE_COLUMN_NAME_CHARS + 5)}`,
    );
    const sourceRows = Array.from(
      { length: MAX_EVIDENCE_PREVIEW_ROWS + 4 },
      () =>
        Object.fromEntries(
          sourceColumns.map((column) => [
            column,
            "v".repeat(MAX_EVIDENCE_CELL_CHARS + 5),
          ]),
        ),
    );
    const snapshot = createVerifiedRunSnapshot(
      "m1-t3",
      "Q".repeat(MAX_EVIDENCE_QUERY_CHARS + 5),
      {
        columns: sourceColumns,
        rows: sourceRows,
        rowCount: sourceRows.length,
        truncated: true,
      },
    );

    expect(Array.from(snapshot.query)).toHaveLength(MAX_EVIDENCE_QUERY_CHARS);
    expect(snapshot.columns).toHaveLength(MAX_EVIDENCE_COLUMNS);
    expect(snapshot.previewRows).toHaveLength(MAX_EVIDENCE_PREVIEW_ROWS);
    expect(Array.from(snapshot.columns[0])).toHaveLength(
      MAX_EVIDENCE_COLUMN_NAME_CHARS,
    );
    expect(Array.from(snapshot.previewRows[0][0])).toHaveLength(
      MAX_EVIDENCE_CELL_CHARS,
    );
    expect(snapshot.rowCount).toBe(sourceRows.length);
    expect(snapshot.truncated).toBe(true);
    expect(isVerifiedRunSnapshot(snapshot)).toBe(true);
  });

  it("rejects malformed or internally inconsistent snapshots", () => {
    const snapshot = createVerifiedRunSnapshot(
      "m1-t3",
      "SELECT stock_quantity FROM products",
      {
        columns: ["stock_quantity"],
        rows: [{ stock_quantity: 4 }],
        rowCount: 1,
        truncated: false,
      },
    );

    expect(
      isVerifiedRunSnapshot({
        ...snapshot,
        previewRows: [["4", "fazla hücre"]],
      }),
    ).toBe(false);
    expect(isVerifiedRunSnapshot({ ...snapshot, verifiedAt: "dün" })).toBe(
      false,
    );
    expect(isVerifiedRunSnapshot({ ...snapshot, rowCount: 0 })).toBe(false);
    expect(() =>
      createVerifiedRunSnapshot(" ", "SELECT 1", {
        columns: ["value"],
        rows: [{ value: 1 }],
        rowCount: 1,
        truncated: false,
      }),
    ).toThrow(/görev kimliği/);
  });
});
