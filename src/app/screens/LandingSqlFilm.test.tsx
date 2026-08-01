import { PGlite } from "@electric-sql/pglite";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LandingSqlFilm, landingSqlScenes } from "./LandingSqlFilm";
import {
  getLandingStoryProgressForStep,
  getLandingStoryStep,
} from "./landingIntroFrame";

vi.mock("./useLandingSqlStory", () => ({
  useLandingSqlStory: () => ({
    isCinematic: false,
    scrollToStep: vi.fn(),
  }),
}));

function normalizeRows(
  rows: readonly Record<string, unknown>[],
  expectedRows: readonly Record<string, number | string>[],
) {
  return rows.map((row, rowIndex) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof expectedRows[rowIndex]?.[key] === "number"
          ? Number(value)
          : value,
      ]),
    ),
  );
}

describe("LandingSqlFilm", () => {
  it("runs all three showcase queries and matches every displayed result", async () => {
    const database = await PGlite.create();
    await database.exec(`
      CREATE TABLE branch_directory (
        branch_id INTEGER PRIMARY KEY,
        branch_name TEXT NOT NULL
      );
      CREATE TABLE sales_targets (
        branch_id INTEGER NOT NULL REFERENCES branch_directory(branch_id),
        target_month TEXT NOT NULL,
        target_amount NUMERIC(12, 2) NOT NULL,
        PRIMARY KEY (branch_id, target_month)
      );
      CREATE TABLE sales_ledger (
        sale_id INTEGER PRIMARY KEY,
        branch_id INTEGER NOT NULL REFERENCES branch_directory(branch_id),
        sale_month TEXT NOT NULL,
        amount NUMERIC(12, 2) NOT NULL
      );
      INSERT INTO branch_directory VALUES
        (1, 'Istanbul Hub'), (2, 'Ankara Hub'), (3, 'Izmir Hub');
      INSERT INTO sales_targets VALUES
        (1, '2026-05', 10000.00),
        (2, '2026-05', 8000.00),
        (3, '2026-05', 6000.00);
      INSERT INTO sales_ledger VALUES
        (1001, 1, '2026-05', 4000.00),
        (1002, 1, '2026-05', 5500.00),
        (1003, 2, '2026-05', 8200.00),
        (1004, 3, '2026-04', 5000.00);
    `);

    try {
      expect(landingSqlScenes).toHaveLength(3);
      for (const scene of landingSqlScenes) {
        const result = await database.query<Record<string, unknown>>(
          scene.query,
        );
        expect(Object.keys(result.rows[0] ?? {})).toEqual(
          scene.result.columns.map((column) => column.key),
        );
        expect(normalizeRows(result.rows, scene.result.rows)).toEqual(
          scene.result.rows,
        );
      }
    } finally {
      await database.close();
    }
  }, 20_000);

  it("maps scroll progress to three stable story steps", () => {
    expect(getLandingStoryStep(-1)).toBe(0);
    expect(getLandingStoryStep(Number.NaN)).toBe(0);
    expect(getLandingStoryStep(0.33)).toBe(0);
    expect(getLandingStoryStep(0.34)).toBe(1);
    expect(getLandingStoryStep(0.71)).toBe(1);
    expect(getLandingStoryStep(0.72)).toBe(2);
    expect(getLandingStoryStep(2)).toBe(2);
    expect(getLandingStoryProgressForStep(-2)).toBe(0);
    expect(getLandingStoryProgressForStep(1)).toBe(0.5);
    expect(getLandingStoryProgressForStep(9)).toBe(0.88);
  });

  it("keeps one editor and result panel while revealing the final decision query", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const { container } = render(
      <LandingSqlFilm isReturningLearner={false} onStart={onStart} />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Sorgu büyüdükçe karar netleşir.",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(container.querySelectorAll(".landing-sql-editor")).toHaveLength(1);
    expect(container.querySelectorAll(".landing-sql-result")).toHaveLength(1);
    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(
      screen.getByLabelText("Getir adımının SQL sorgusu"),
    ).toHaveTextContent("FROM branch_directory");
    expect(
      screen.getByLabelText("Getir adımının SQL sorgusu"),
    ).not.toHaveTextContent("DENSE_RANK");

    await user.click(
      screen.getByRole("tab", { name: /3\. adım: Karara dönüştür/i }),
    );

    expect(
      screen.getByRole("heading", { name: "Sonucu karara dönüştür." }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Karara dönüştür adımının SQL sorgusu"),
    ).toHaveTextContent("DENSE_RANK");
    expect(screen.getByText("Sorgu doğrulandı")).toBeInTheDocument();
    expect(container.querySelectorAll(".landing-sql-editor")).toHaveLength(1);
    expect(container.querySelectorAll(".landing-sql-result")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /İlk vakaya başla/i }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("supports roving step focus and the returning learner CTA", () => {
    render(<LandingSqlFilm isReturningLearner onStart={() => undefined} />);

    expect(
      screen.getByRole("button", { name: /Kaldığın vakaya devam et/i }),
    ).toBeInTheDocument();

    const firstTab = screen.getByRole("tab", { name: /1\. adım: Getir/i });
    const secondTab = screen.getByRole("tab", {
      name: /2\. adım: Karşılaştır/i,
    });
    const finalTab = screen.getByRole("tab", {
      name: /3\. adım: Karara dönüştür/i,
    });

    firstTab.focus();
    fireEvent.keyDown(firstTab, { key: "ArrowRight" });
    expect(secondTab).toHaveFocus();
    expect(secondTab).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(secondTab, { key: "End" });
    expect(finalTab).toHaveFocus();
    expect(finalTab).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(finalTab, { key: "Home" });
    expect(firstTab).toHaveFocus();
    expect(firstTab).toHaveAttribute("aria-selected", "true");
  });
});
