import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryvaleApp } from "./QueryvaleApp";

const correctRows = [
  { product_name: "Desk Lamp", category: "Home" },
  { product_name: "Notebook", category: "Stationery" },
  { product_name: "Office Chair", category: "Furniture" },
  { product_name: "Water Bottle", category: "Lifestyle" },
  { product_name: "Standing Desk", category: "Furniture" },
  { product_name: "Pen Set", category: "Stationery" },
];

vi.mock("../features/sql-engine", () => ({
  createTaskDatabaseForLesson: () => ({
    state: "ready",
    initialize: vi.fn().mockResolvedValue(undefined),
    run: vi.fn().mockResolvedValue({
      columns: ["product_name", "category"],
      rows: correctRows,
      rowCount: 6,
      affectedRows: 0,
      truncated: false,
      durationMs: 4,
    }),
    reset: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe("QueryvaleApp", () => {
  beforeEach(async () => {
    window.location.hash = "#/";
    document.documentElement.dataset.theme = "";
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase("queryvale");
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  });

  it("starts the first task, reveals a hint and completes the mission", async () => {
    const user = userEvent.setup();
    render(<QueryvaleApp />);

    expect(
      screen.getByRole("heading", { name: /Soruyu sorguya/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /İlk vakayı aç/i }));
    expect(
      screen.getByRole("heading", { name: "Masana hoş geldin." }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Laboratuvarı hazırla/i }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Katalog görünümünü hazırla",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "İpucu 1’i aç" }));
    expect(screen.getByText(/Bir tablodan veri okumak/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("PostgreSQL hazır")).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /Çalıştır/i }));
    expect(await screen.findByText("Doğru çözüm")).toBeInTheDocument();
    expect(
      await screen.findByRole("dialog", { name: /Katalog görünümü hazır/i }),
    ).toBeInTheDocument();
  });

  it("changes the theme from the global header", async () => {
    render(<QueryvaleApp />);
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe("dark"),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Açık temaya geç" }),
    );
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe("light"),
    );
  });
});
