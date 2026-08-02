import { PGlite } from "@electric-sql/pglite";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tasks } from "../../content/curriculum";
import { LandingScreen, landingShowcaseQuery } from "./LandingScreen";

describe("LandingScreen", () => {
  it("keeps the authored role, SQL story and first-case action in one surface", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const onContinue = vi.fn();
    render(
      <LandingScreen
        onStart={onStart}
        onContinue={onContinue}
        onOpenHelp={vi.fn()}
        resumeTask={tasks[0]}
        isReturningLearner={false}
        hasLocalAccount={false}
        profileActive={false}
        reducedMotion
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: /Geleceğin Veri Analistleri.*İçin İnteraktif SQL Studio/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Teoride kalmayın\. Gerçek iş vakalarıyla/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "İş Analistleri" }));
    expect(
      screen.getByRole("heading", {
        name: /Geleceğin İş Analistleri.*İçin İnteraktif SQL Studio/i,
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "2. adım: Sorgu Okunur Hâle Geldi",
      }),
    );
    expect(screen.getByLabelText("Tanıtım SQL sorgusu")).toHaveTextContent(
      "ORDER BY total_queries DESC",
    );
    expect(screen.getByText("0 ROWS RETURNED")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "3. adım: Sorgu Çalıştırıldı, Sonuç Hazır",
      }),
    );
    expect(screen.getByText("3 ROWS RETURNED")).toBeInTheDocument();
    expect(screen.getByText("damla_data")).toBeInTheDocument();
    expect(screen.getAllByText("Active")).toHaveLength(3);
    expect(screen.queryByText("Idle")).not.toBeInTheDocument();

    const startButton = screen.getByRole("button", {
      name: /Hesabını Aç & Vaka Çöz/i,
    });
    expect(startButton).toHaveTextContent("Hemen Başla");
    await user.click(startButton);
    expect(onStart).toHaveBeenCalledOnce();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("resumes the saved case without turning onboarding back on", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const onContinue = vi.fn();
    render(
      <LandingScreen
        onStart={onStart}
        onContinue={onContinue}
        onOpenHelp={vi.fn()}
        resumeTask={tasks[1]}
        isReturningLearner
        hasLocalAccount
        profileActive
        reducedMotion
      />,
    );

    const resume = screen.getByRole("button", {
      name: /Kaldığın Yerden Devam Et/i,
    });
    expect(resume).toHaveTextContent("Hemen Başla");
    expect(resume).toHaveAttribute("title", `Son konumun: ${tasks[1].title}`);
    await user.click(resume);
    expect(onContinue).toHaveBeenCalledOnce();
    expect(onStart).not.toHaveBeenCalled();
  });

  it("labels saved guest progress without pretending that a profile exists", () => {
    render(
      <LandingScreen
        onStart={vi.fn()}
        onContinue={vi.fn()}
        onOpenHelp={vi.fn()}
        resumeTask={tasks[1]}
        isReturningLearner
        hasLocalAccount={false}
        profileActive={false}
        reducedMotion
      />,
    );

    expect(
      screen.getByRole("button", {
        name: /Yerel Profil Oluştur & Devam Et/i,
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Profiline Gir/i }),
    ).not.toBeInTheDocument();
  });

  it("routes a signed-out local profile to sign-in and exposes service help", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const onOpenHelp = vi.fn();
    render(
      <LandingScreen
        onStart={onStart}
        onContinue={vi.fn()}
        onOpenHelp={onOpenHelp}
        resumeTask={tasks[1]}
        isReturningLearner
        hasLocalAccount
        profileActive={false}
        reducedMotion
      />,
    );

    await user.click(screen.getByRole("button", { name: /Profiline Gir/i }));
    expect(onStart).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Yardım ve veri" }));
    expect(onOpenHelp).toHaveBeenCalledOnce();
  });

  it("shows only active rows in descending query-count order", async () => {
    const database = await PGlite.create();
    await database.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        user_name TEXT NOT NULL,
        total_queries INTEGER NOT NULL,
        status TEXT NOT NULL
      );
      INSERT INTO users VALUES
        (1082, 'alex_dev', 1420, 'active'),
        (1083, 'damla_data', 3890, 'active'),
        (1084, 'selin_ops', 870, 'active'),
        (1085, 'can_admin', 210, 'idle');
    `);

    try {
      const result = await database.query<{
        id: number;
        user_name: string;
        total_queries: number;
        status: string;
      }>(landingShowcaseQuery);
      expect(result.rows).toEqual([
        {
          id: 1083,
          user_name: "damla_data",
          total_queries: 3890,
          status: "active",
        },
        {
          id: 1082,
          user_name: "alex_dev",
          total_queries: 1420,
          status: "active",
        },
        {
          id: 1084,
          user_name: "selin_ops",
          total_queries: 870,
          status: "active",
        },
      ]);
    } finally {
      await database.close();
    }
  }, 20_000);
});
