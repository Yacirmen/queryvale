import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getTaskById } from "../../content";
import { LandingTaskPreview } from "./LandingTaskPreview";

describe("LandingTaskPreview", () => {
  it("shows one concise task preview without revealing the SQL solution", () => {
    const task = getTaskById("m1-t1");

    render(<LandingTaskPreview task={task} isReturningLearner={false} />);

    const preview = screen.getByRole("region", {
      name: "Katalog görünümünü hazırla",
    });
    expect(within(preview).getByText("İlk vaka")).toBeInTheDocument();
    expect(within(preview).getByText("5 dk")).toBeInTheDocument();
    expect(within(preview).getByText("product_name")).toBeInTheDocument();
    expect(within(preview).getByText("category")).toBeInTheDocument();
    expect(
      within(preview).getByRole("list", {
        name: "Vakada izleyeceğin üç adım",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByText(/FROM products/i)).not.toBeInTheDocument();
  });

  it("previews the learner's current task when progress exists", () => {
    const task = getTaskById("m1-t3");

    render(<LandingTaskPreview task={task} isReturningLearner />);

    const preview = screen.getByRole("region", {
      name: "Kritik stokları sırala",
    });
    expect(within(preview).getByText("Kaldığın vaka")).toBeInTheDocument();
    expect(within(preview).getByText("8 dk")).toBeInTheDocument();
    expect(within(preview).getByText("stock_quantity")).toBeInTheDocument();
  });
});
