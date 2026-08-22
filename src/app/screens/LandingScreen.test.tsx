import { PGlite } from "@electric-sql/pglite";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tasks } from "../../content/curriculum";
import { LandingScreen, landingShowcaseQuery } from "./LandingScreen";

describe("LandingScreen", () => {
  it("puts the claim, the real showcase and the first-case action on one screen", async () => {
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
        name: /SQL ezberleme.*Veri analisti gibi çalış/i,
      }),
    ).toBeInTheDocument();

    // Sayılar elle yazılmaz; müfredat büyüdükçe tanıtım da onunla büyür.
    const caseCount = tasks.filter((task) => task.type === "case").length;
    expect(
      screen.getByText(String(caseCount), { selector: "dt" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(String(tasks.length - caseCount), { selector: "dt" }),
    ).toBeInTheDocument();

    // Vitrin uydurma bir tablo değil, rotanın gerçek ilk vakası.
    const showcase = tasks.find((task) => task.id === "m1-t1")!;
    expect(screen.getByLabelText("Tanıtım SQL sorgusu")).toHaveTextContent(
      "FROM products;",
    );
    for (const column of showcase.expectedColumns) {
      expect(
        screen.getByRole("columnheader", { name: column }),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByRole("cell", {
        name: String(showcase.expectedResult[0]![0]),
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("damla_data")).not.toBeInTheDocument();

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
    // Eski sürüm herkese "Hemen Başla" yazıyor, bağlamı yalnız aria-label'a
    // saklıyordu; gören kullanıcı düğmenin ne yapacağını okuyamıyordu.
    expect(resume).toHaveTextContent("Kaldığın Yerden Devam Et");
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

  it("runs the showcased query on the real case fixture and matches it", async () => {
    // Tanıtımdaki panel bir ekran görüntüsü değil, müfredattan okunan veri.
    // Bu test o verinin gerçekten motorda üretilebildiğini kanıtlar; panel
    // ile uygulamanın söylediği şey birbirinden ayrışamaz.
    const showcase = tasks.find((task) => task.id === "m1-t1")!;
    const database = await PGlite.create();
    await database.exec(showcase.setupSql);

    try {
      const result =
        await database.query<Record<string, unknown>>(landingShowcaseQuery);
      const columns = result.fields.map((field) => field.name);
      expect(columns).toEqual([...showcase.expectedColumns]);
      expect(
        result.rows.map((row) => columns.map((column) => row[column])),
      ).toEqual(showcase.expectedResult.map((row) => [...row]));
    } finally {
      await database.close();
    }
  }, 20_000);
});
