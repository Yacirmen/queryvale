import { PGlite } from "@electric-sql/pglite";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LandingSqlFilm, landingSqlScenes } from "./LandingSqlFilm";
import {
  getLandingIntroFrame,
  getLandingIntroProgressForScene,
} from "./landingIntroFrame";

describe("LandingSqlFilm", () => {
  it("runs every showcase query on its isolated PostgreSQL fixture", async () => {
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
      let finalRows: Array<Record<string, unknown>> = [];
      for (const scene of landingSqlScenes) {
        const result = await database.query<Record<string, unknown>>(
          scene.query,
        );
        expect(result.rows).toHaveLength(3);
        finalRows = result.rows;
      }

      expect(finalRows).toMatchObject([
        { branch_name: "Ankara Hub", decision_signal: "Hedefte" },
        { branch_name: "Istanbul Hub", decision_signal: "Yakın takip" },
        { branch_name: "Izmir Hub", decision_signal: "Aksiyon gerekli" },
      ]);
    } finally {
      await database.close();
    }
  }, 20_000);

  it("maps native scroll progress to six deterministic scenes with end holds", () => {
    expect(getLandingIntroFrame(-1, landingSqlScenes.length)).toMatchObject({
      activeIndex: 0,
      fromIndex: 0,
      mix: 0,
      progress: 0,
      toIndex: 1,
    });

    for (let index = 0; index < landingSqlScenes.length; index += 1) {
      const progress = getLandingIntroProgressForScene(
        index,
        landingSqlScenes.length,
      );
      expect(
        getLandingIntroFrame(progress, landingSqlScenes.length).activeIndex,
      ).toBe(index);
    }

    const finalIndex = landingSqlScenes.length - 1;
    expect(getLandingIntroFrame(1, landingSqlScenes.length)).toMatchObject({
      activeIndex: finalIndex,
      fromIndex: finalIndex,
      mix: 0,
      progress: 1,
      toIndex: finalIndex,
    });
    expect(
      getLandingIntroFrame(Number.NaN, landingSqlScenes.length).progress,
    ).toBe(0);
    expect(getLandingIntroFrame(2, landingSqlScenes.length)).toMatchObject({
      activeIndex: finalIndex,
      progress: 1,
    });
  });

  it("keeps one scene in the manual fallback and reveals the validated final query", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    const onStart = vi.fn();
    const { container } = render(
      <LandingSqlFilm
        isReturningLearner={false}
        onContinue={onContinue}
        onStart={onStart}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Bir iş sorusu nasıl karara dönüşür?",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /İlk vakaya başla/i }));
    expect(onStart).toHaveBeenCalledOnce();

    expect(screen.getAllByRole("tab")).toHaveLength(landingSqlScenes.length);
    expect(
      screen.getByRole("heading", {
        name: "Her iyi analiz, doğru kümeyle başlar.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Kapsam sahnesinin SQL örneği"),
    ).toHaveTextContent("FROM branch_directory");
    expect(
      screen.getByLabelText("Kapsam sahnesinin SQL örneği"),
    ).not.toHaveTextContent("DENSE_RANK");
    expect(container.querySelectorAll(".landing-sql-editor")).toHaveLength(1);

    await user.click(screen.getByRole("tab", { name: /6\. adım: Karar/i }));

    expect(
      screen.getByRole("heading", {
        name: "Ve sorgu, konuşabileceğin bir karara dönüşür.",
      }),
    ).toBeInTheDocument();
    const visibleCode = container.querySelector(".landing-sql-code");
    expect(visibleCode).toHaveTextContent("WITH branch_performance AS");
    expect(visibleCode).toHaveTextContent("DENSE_RANK");
    expect(visibleCode).toHaveTextContent("Aksiyon gerekli");
    expect(
      screen.getByLabelText("Karar sahnesinin SQL örneği"),
    ).toHaveTextContent("DENSE_RANK");
    expect(container.querySelectorAll(".landing-sql-editor")).toHaveLength(1);
    expect(container).not.toHaveTextContent("FROM products");

    await user.click(screen.getByRole("button", { name: /Nasıl çalışır/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("supports roving tab focus with arrows, Home and End", () => {
    render(
      <LandingSqlFilm
        isReturningLearner
        onContinue={() => undefined}
        onStart={() => undefined}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Kaldığın vakaya devam et/i }),
    ).toBeInTheDocument();

    const firstTab = screen.getByRole("tab", { name: /1\. adım: Kapsam/i });
    const secondTab = screen.getByRole("tab", { name: /2\. adım: Hedef/i });
    const finalTab = screen.getByRole("tab", { name: /6\. adım: Karar/i });

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
