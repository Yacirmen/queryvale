import { expect, test } from "@playwright/test";
import { tasks } from "../../src/content/curriculum";
import { pythonTasks } from "../../src/content/pythonCurriculum";

test("Python Studio keeps the next case available and validates a real pandas result", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(150_000);
  test.skip(
    isMobile,
    "The real runtime contract only needs one browser execution.",
  );
  const firstTask = pythonTasks[0];

  await page.goto(`/#/python/${firstTask.id}`);
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(
    page.getByRole("heading", { name: firstTask.title }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sonraki çalışma" }),
  ).toBeEnabled();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            globalThis as typeof globalThis & {
              monaco?: { editor: { getModels: () => unknown[] } };
            }
          ).monaco?.editor.getModels().length ?? 0,
      ),
    )
    .toBe(1);
  await page.evaluate((solutionCode) => {
    const editorApi = (
      globalThis as typeof globalThis & {
        monaco?: {
          editor: {
            getModels: () => Array<{ setValue: (value: string) => void }>;
          };
        };
      }
    ).monaco;
    editorApi?.editor.getModels()[0]?.setValue(solutionCode);
  }, firstTask.solutionCode);
  await page.getByRole("button", { name: /Çalıştır/i }).click();

  const resultTable = page.getByRole("table", {
    name: `${firstTask.title} için üretilen result DataFrame`,
  });
  await expect(resultTable).toBeVisible({ timeout: 120_000 });
  await expect(resultTable).toContainText("row_count");
  await expect(resultTable).toContainText("missing_cells");
  await expect(resultTable).toContainText("6");
  await expect(page.getByRole("status", { name: /Doğru —/ })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`#\\/python\\/${firstTask.id}$`));
  await expect(
    page.getByRole("button", { name: "Sonraki çalışma" }),
  ).toBeVisible();
});

test("a learner can deep-link to any valid SQL case without a route guard", async ({
  page,
}) => {
  const projectTask = tasks.find((task) => task.id === "m11-t1");
  expect(projectTask).toBeTruthy();

  await page.goto(`/#/lab/${projectTask!.id}`);

  await expect(page).toHaveURL(new RegExp(`#\\/lab\\/${projectTask!.id}$`));
  await expect(
    page.getByRole("heading", { name: projectTask!.title }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "SQL çalışma gezintisi" }),
  ).toBeVisible();
});

test("SQL Studio exposes every shipped study in its in-flow route drawer", async ({
  page,
}) => {
  await page.goto("/#/lab/m1-t1");
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );

  await page
    .getByRole("button", { name: `Rota · Vaka 1/${tasks.length}` })
    .click();
  const drawer = page.getByRole("region", { name: "SQL rotası" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText("Tüm çalışmalar açık")).toBeVisible();
  await expect(drawer.locator(".studio-route-group")).toHaveCount(11);
  await expect(drawer.locator(".studio-route-task")).toHaveCount(tasks.length);
  const groupRects = await drawer
    .locator(".studio-route-group")
    .evaluateAll((groups) =>
      groups.map((group) => {
        const rect = group.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      }),
    );
  for (let first = 0; first < groupRects.length; first += 1) {
    for (let second = first + 1; second < groupRects.length; second += 1) {
      const horizontalOverlap = Math.max(
        0,
        Math.min(groupRects[first].right, groupRects[second].right) -
          Math.max(groupRects[first].left, groupRects[second].left),
      );
      const verticalOverlap = Math.max(
        0,
        Math.min(groupRects[first].bottom, groupRects[second].bottom) -
          Math.max(groupRects[first].top, groupRects[second].top),
      );
      expect(
        horizontalOverlap * verticalOverlap,
        `SQL rota grupları ${first + 1} ve ${second + 1} üst üste binmemeli`,
      ).toBeLessThanOrEqual(1);
    }
  }
  await expect(
    drawer.getByRole("button", { name: /Katalog görünümünü hazırla/i }),
  ).toHaveAttribute("aria-current", "page");

  const allRouteTasks = drawer.locator(".studio-route-task");
  for (let index = 0; index < tasks.length; index += 1) {
    await expect(allRouteTasks.nth(index)).toBeEnabled();
  }

  const target = tasks.find((task) => task.id === "m11-t1")!;
  await drawer
    .getByRole("button", { name: new RegExp(target.title, "i") })
    .click();
  await expect(page).toHaveURL(new RegExp(`#\\/lab\\/${target.id}$`));
  await expect(page.getByRole("heading", { name: target.title })).toBeVisible();
});

test("all drill subtypes guide learners through three hints, a result check and a neutral solution", async ({
  page,
}) => {
  const presentations = [
    { type: "drill_intro", label: "Alıştırma", badge: "ALIŞTIRMA · 3 DK" },
    { type: "drill_practice", label: "Tekrar", badge: "TEKRAR · 3 DK" },
    { type: "drill_mix", label: "Birleştir", badge: "BİRLEŞTİR · 5 DK" },
  ] as const;

  for (const presentation of presentations) {
    const drill = tasks.find((task) => task.type === presentation.type);
    expect(drill, `${presentation.type} drill is missing`).toBeTruthy();
    const drillIndex = tasks.findIndex((task) => task.id === drill?.id);
    const nextTask = tasks[drillIndex + 1];
    expect(
      nextTask,
      `${presentation.type} next route item is missing`,
    ).toBeTruthy();

    await page.goto(`/#/lab/${drill!.id}`);
    await expect(page.locator(".app-shell")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    await expect(
      page.getByRole("heading", { name: drill!.title }),
    ).toBeVisible();
    const brief = page.getByRole("tabpanel", { name: presentation.label });
    await expect(brief).toBeVisible();
    await expect(brief).toHaveAttribute("data-drill-type", presentation.type);
    await expect(brief.getByText(presentation.badge)).toBeVisible();
    for (const section of ["İstenen teslim", "Beklenen çıktı"]) {
      await expect(
        brief.getByRole("heading", { name: section, exact: true }),
      ).toBeVisible();
    }
    for (const column of drill!.expectedColumns) {
      await expect(
        brief.getByRole("button", { name: `${column} kolonunu kopyala` }),
      ).toBeVisible();
    }
    await expect(
      brief.getByText("Bu alıştırmada ne çalışıyorsun?"),
    ).toBeVisible();
    await expect(brief.getByText("Kendini kontrol et")).toBeVisible();
    const help = brief.getByRole("region", {
      name: `${presentation.label} yardımı`,
    });
    await expect(
      help.getByRole("button", { name: "Yardım adımlarını kapat" }),
    ).toBeVisible();
    await expect(
      brief.getByRole("table", {
        name: `${drill!.title} için doğru sonuç`,
      }),
    ).toHaveCount(0);
    await expect(brief.getByText(drill!.solutionSql)).toHaveCount(0);

    // Merdiven açık gelir; ipuçlarına ek bir kapı tıklaması olmadan ulaşılır.
    for (const hintIndex of [0, 1, 2]) {
      await help
        .getByRole("button", { name: `${hintIndex + 1}. ipucunu aç` })
        .click();
      await expect(page.getByText(drill!.hints[hintIndex]!)).toBeVisible();

      if (hintIndex < 2) {
        await expect(
          brief.getByRole("table", {
            name: `${drill!.title} için doğru sonuç`,
          }),
        ).toHaveCount(0);
        await expect(brief.getByText(drill!.solutionSql)).toHaveCount(0);
      }
    }

    const correctResultTable = brief.getByRole("table", {
      name: `${drill!.title} için doğru sonuç`,
    });
    await expect(correctResultTable).toBeVisible();
    await expect(correctResultTable.getByRole("columnheader")).toHaveText(
      drill!.expectedColumns,
    );
    await expect(correctResultTable.locator("tbody tr")).toHaveCount(
      drill!.expectedResult.length,
    );
    await expect(
      brief.getByText(
        drill!.orderSensitive
          ? /Satırları bu sırayla karşılaştır\./
          : /Satır sırası önemli değil\./,
      ),
    ).toBeVisible();
    await expect(brief.getByText(drill!.solutionSql)).toHaveCount(0);
    const showSolution = help.getByRole("button", {
      name: /^Bir doğru sorguyu göster/,
    });
    const solutionControl = help.locator(
      `button[aria-controls="${drill!.id}-solution"]`,
    );
    await expect(showSolution).toBeVisible();
    await expect(showSolution).toHaveAttribute("aria-expanded", "false");
    await expect(showSolution).toHaveAttribute(
      "aria-controls",
      `${drill!.id}-solution`,
    );

    // Alıştırma puansızdır: onaylanacak bir puan kaybı olmadığı için çözüm
    // tek tıklamayla açılır, araya onay adımı girmez.
    await showSolution.click();
    await expect(
      help.getByRole("group", {
        name: "Çalışan çözümü açmak istiyor musun?",
      }),
    ).toHaveCount(0);
    await expect(solutionControl).toHaveAttribute("aria-expanded", "true");
    const solutionRegion = brief.getByRole("region", {
      name: "Çalışan çözüm örneği",
    });
    await expect(solutionRegion).toBeVisible();
    await expect(
      solutionRegion.getByLabel(`${drill!.title} için örnek SQL sorgusu`),
    ).toHaveText(drill!.solutionSql.replace(/\s+/g, " ").trim());
    const copySolution = solutionRegion.getByRole("button", {
      name: "SQL’i kopyala",
    });
    await expect(copySolution).toBeVisible();
    await copySolution.click();
    await expect(
      page.getByText(
        /Çalışan örnek sorgu panoya kopyalandı\.|Panoya erişilemedi;/,
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: `Rota · ${presentation.label} ${drillIndex + 1}/${tasks.length}`,
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Sonraki çalışma" }).click();
    await expect(page).toHaveURL(new RegExp(`#\\/lab\\/${nextTask!.id}$`));
  }
});

test("SQL Studio keeps the document fixed across the target viewport matrix", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The explicit viewport matrix runs once in Chromium.");

  const viewports = [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
  ] as const;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/#/lab/m1-t1");
    await expect(page.locator(".app-shell")).toHaveAttribute(
      "aria-busy",
      "false",
    );

    if (viewport.width <= 820) {
      await expect(
        page.getByRole("tablist", { name: "Vaka çalışma adımları" }),
      ).toBeVisible();
    }

    const layout = await page.evaluate(() => {
      const header = document.querySelector<HTMLElement>(".app-header");
      const workspace = document.querySelector<HTMLElement>(".workspace-page");
      const body = document.querySelector<HTMLElement>(".workspace-body");
      const brief = document.querySelector<HTMLElement>(
        ".brief-scroll:not([hidden])",
      );
      const workbench = document.querySelector<HTMLElement>(".workbench");
      const rail = document.querySelector<HTMLElement>(".studio-action-zone");
      const scrollingElement = document.scrollingElement;
      if (
        !header ||
        !workspace ||
        !body ||
        !brief ||
        !workbench ||
        !rail ||
        !scrollingElement
      ) {
        throw new Error("SQL Studio layout düğümleri bulunamadı.");
      }
      const headerBounds = header.getBoundingClientRect();
      const workspaceBounds = workspace.getBoundingClientRect();
      const bodyBounds = body.getBoundingClientRect();
      const railBounds = rail.getBoundingClientRect();
      return {
        documentHeightDelta: Math.abs(
          scrollingElement.scrollHeight - window.innerHeight,
        ),
        workspaceTopDelta: Math.abs(workspaceBounds.top - headerBounds.bottom),
        workspaceBottomDelta: Math.abs(
          workspaceBounds.bottom - window.innerHeight,
        ),
        bodyRailGap: Math.abs(bodyBounds.bottom - railBounds.top),
        railBottomDelta: Math.abs(railBounds.bottom - window.innerHeight),
        bodyMinHeight: getComputedStyle(body).minHeight,
        bodyOverflow: getComputedStyle(body).overflow,
        briefMinHeight: getComputedStyle(brief).minHeight,
        briefOverflowY: getComputedStyle(brief).overflowY,
        workbenchMinHeight: getComputedStyle(workbench).minHeight,
        workbenchOverflow: getComputedStyle(workbench).overflow,
      };
    });

    expect(layout.documentHeightDelta).toBeLessThanOrEqual(2);
    expect(layout.workspaceTopDelta).toBeLessThanOrEqual(1);
    expect(layout.workspaceBottomDelta).toBeLessThanOrEqual(1);
    expect(layout.bodyRailGap).toBeLessThanOrEqual(1);
    expect(layout.railBottomDelta).toBeLessThanOrEqual(1);
    expect(layout.bodyMinHeight).toBe("0px");
    expect(layout.bodyOverflow).toBe("hidden");
    expect(layout.briefMinHeight).toBe("0px");
    expect(layout.briefOverflowY).toBe("auto");
    expect(layout.workbenchMinHeight).toBe("0px");
    expect(layout.workbenchOverflow).toBe("hidden");

    await page.evaluate(() => window.scrollTo(0, 1_000));
    await page.waitForTimeout(50);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    if (viewport.width <= 820) {
      const railButtons = page
        .getByRole("navigation", { name: "SQL çalışma gezintisi" })
        .locator(".studio-action-row > button");
      await expect(railButtons).toHaveCount(3);
      for (let index = 0; index < 3; index += 1) {
        expect(
          await railButtons
            .nth(index)
            .evaluate((element) => element.getBoundingClientRect().height),
        ).toBeGreaterThanOrEqual(44);
      }
      for (const tabName of [
        "Veri görünümü",
        "SQL görünümü",
        "Sonuç görünümü",
      ]) {
        await page.getByRole("tab", { name: tabName }).click();
        expect(
          await page.evaluate(() =>
            Math.abs(
              (document.scrollingElement?.scrollHeight ?? 0) -
                window.innerHeight,
            ),
          ),
        ).toBeLessThanOrEqual(2);
      }
    }
  }

  const legacyViewportDeclarations = await page.evaluate(() => {
    const matches: string[] = [];
    const visit = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) {
          for (const property of Array.from(rule.style)) {
            const value = rule.style.getPropertyValue(property);
            if (/(^|[^a-z])100vh/i.test(value)) {
              matches.push(`${rule.selectorText} { ${property}: ${value} }`);
            }
          }
        }
        if ("cssRules" in rule) {
          try {
            visit((rule as CSSGroupingRule).cssRules);
          } catch {
            // Cross-origin sheets are irrelevant to this same-origin build.
          }
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        visit(sheet.cssRules);
      } catch {
        // Cross-origin sheets are irrelevant to this same-origin build.
      }
    }
    return matches;
  });
  expect(legacyViewportDeclarations).toEqual([]);
});

test("the workspace flex budget absorbs a two-times taller action rail", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The flex-budget contract only needs one Chromium run.");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/#/lab/m1-t1");
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );

  const measurement = await page.evaluate(() => {
    const rail = document.querySelector<HTMLElement>(".studio-action-zone");
    const body = document.querySelector<HTMLElement>(".workspace-body");
    if (!rail || !body || !document.scrollingElement) {
      throw new Error("Aksiyon rail bütçesi için gerekli düğümler bulunamadı.");
    }
    const initialHeight = rail.getBoundingClientRect().height;
    rail.style.minHeight = `${initialHeight * 2}px`;
    const railBounds = rail.getBoundingClientRect();
    const bodyBounds = body.getBoundingClientRect();
    return {
      initialHeight,
      doubledHeight: railBounds.height,
      documentHeightDelta: Math.abs(
        document.scrollingElement.scrollHeight - window.innerHeight,
      ),
      bodyRailGap: Math.abs(bodyBounds.bottom - railBounds.top),
      railBottomDelta: Math.abs(railBounds.bottom - window.innerHeight),
    };
  });

  expect(measurement.doubledHeight).toBeGreaterThanOrEqual(
    measurement.initialHeight * 2 - 1,
  );
  expect(measurement.documentHeightDelta).toBeLessThanOrEqual(2);
  expect(measurement.bodyRailGap).toBeLessThanOrEqual(1);
  expect(measurement.railBottomDelta).toBeLessThanOrEqual(1);
});

test("Python Studio shares the fixed document and action-rail viewport contract", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The explicit viewport matrix runs once in Chromium.");

  const viewports = [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
  ] as const;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/#/python/py-m1-t1");
    await expect(page.locator(".app-shell")).toHaveAttribute(
      "aria-busy",
      "false",
    );

    const layout = await page.evaluate(() => {
      const header = document.querySelector<HTMLElement>(".app-header");
      const pageElement = document.querySelector<HTMLElement>(
        ".python-studio-page",
      );
      const body = document.querySelector<HTMLElement>(".python-studio-body");
      const rail = document.querySelector<HTMLElement>(".studio-action-zone");
      const scrollingElement = document.scrollingElement;
      if (!header || !pageElement || !body || !rail || !scrollingElement) {
        throw new Error("Python Studio viewport düğümleri bulunamadı.");
      }
      const headerBounds = header.getBoundingClientRect();
      const pageBounds = pageElement.getBoundingClientRect();
      const bodyBounds = body.getBoundingClientRect();
      const railBounds = rail.getBoundingClientRect();
      return {
        documentHeightDelta: Math.abs(
          scrollingElement.scrollHeight - window.innerHeight,
        ),
        pageTopDelta: Math.abs(pageBounds.top - headerBounds.bottom),
        pageBottomDelta: Math.abs(pageBounds.bottom - window.innerHeight),
        bodyRailGap: Math.abs(bodyBounds.bottom - railBounds.top),
        railBottomDelta: Math.abs(railBounds.bottom - window.innerHeight),
        bodyMinHeight: getComputedStyle(body).minHeight,
        bodyOverflow: getComputedStyle(body).overflow,
      };
    });

    expect(layout.documentHeightDelta).toBeLessThanOrEqual(2);
    expect(layout.pageTopDelta).toBeLessThanOrEqual(1);
    expect(layout.pageBottomDelta).toBeLessThanOrEqual(1);
    expect(layout.bodyRailGap).toBeLessThanOrEqual(1);
    expect(layout.railBottomDelta).toBeLessThanOrEqual(1);
    expect(layout.bodyMinHeight).toBe("0px");
    expect(layout.bodyOverflow).toBe("hidden");

    await page.evaluate(() => window.scrollTo(0, 1_000));
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    if (viewport.width <= 820) {
      await expect(
        page.getByRole("tablist", { name: "Python çalışma alanı" }),
      ).toBeVisible();
      const railButtons = page
        .getByRole("navigation", { name: "Python çalışma gezintisi" })
        .locator(".studio-action-row > button");
      await expect(railButtons).toHaveCount(3);
      for (let index = 0; index < 3; index += 1) {
        expect(
          await railButtons
            .nth(index)
            .evaluate((element) => element.getBoundingClientRect().height),
        ).toBeGreaterThanOrEqual(44);
      }
    }
  }
});

test("a 200-row SQL result scrolls only inside the result panel", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The result ownership contract needs one desktop run.");
  test.setTimeout(60_000);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/#/lab/m1-t1");
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            globalThis as typeof globalThis & {
              monaco?: { editor: { getModels: () => unknown[] } };
            }
          ).monaco?.editor.getModels().length ?? 0,
      ),
    )
    .toBe(1);

  await page.evaluate(() => {
    const editorApi = (
      globalThis as typeof globalThis & {
        monaco?: {
          editor: {
            getModels: () => Array<{ setValue: (value: string) => void }>;
          };
        };
      }
    ).monaco;
    editorApi?.editor
      .getModels()[0]
      ?.setValue(
        "SELECT series_id FROM generate_series(1, 250) AS rows(series_id);",
      );
  });

  const runButton = page.getByRole("button", { name: /Çalıştır/i });
  await expect(runButton).toBeEnabled({ timeout: 30_000 });
  await runButton.click();

  const rows = page.locator("table[aria-label='Sorgu sonucu'] tbody tr");
  await expect(rows).toHaveCount(200, { timeout: 20_000 });
  await expect(page.locator(".result-count")).toContainText("sınırlandı");

  const results = page.locator(".results-content");
  await expect(results).toHaveAttribute("tabindex", "0");
  const before = await page.evaluate(() => ({
    documentTop: document.scrollingElement?.scrollTop ?? 0,
    briefTop:
      document.querySelector<HTMLElement>(".brief-scroll:not([hidden])")
        ?.scrollTop ?? 0,
    resultTop:
      document.querySelector<HTMLElement>(".results-content")?.scrollTop ?? 0,
  }));
  expect(
    await results.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true);

  await results.focus();
  await results.hover();
  await page.mouse.wheel(0, 900);
  await expect
    .poll(() => results.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(before.resultTop);
  expect(
    await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0),
  ).toBe(before.documentTop);
  expect(
    await page
      .locator(".brief-scroll:not([hidden])")
      .evaluate((element) => element.scrollTop),
  ).toBe(before.briefTop);
});

test("the unified fixed header keeps both Studio controls visible across every route", async ({
  page,
}) => {
  const routes = [
    { path: "/", active: "home" },
    { path: "/#/giris", active: "account" },
    { path: "/#/learn", active: "learn" },
    { path: "/#/lab/m1-t1", active: "workspace" },
    { path: "/#/python/py-m1-t1", active: "python" },
    { path: "/#/progress", active: undefined },
    { path: "/#/settings", active: undefined },
  ] as const;

  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.locator(".app-shell")).toHaveAttribute(
      "aria-busy",
      "false",
    );

    const header = page.locator(".app-header");
    const brand = header.getByRole("button", {
      name: "Queryvale ana sayfa",
    });
    const logo = brand.locator("svg.brand-logo");
    const sqlStudio = header.getByRole("button", {
      name: "SQL Studio — SQL Laboratuvarı",
    });
    const pythonStudio = header.getByRole("button", { name: "Python Studio" });
    const start = header.locator(".landing-header-cta");

    await expect(header).toHaveCSS("position", "fixed");
    for (const control of [brand, sqlStudio, pythonStudio, start]) {
      await expect(control).toBeVisible();
    }
    await expect(logo).toHaveAttribute("aria-hidden", "true");
    // İşaret satır içi SVG olduğu için "dosya yüklendi mi" diye bir durum
    // kalmadı; geriye kalan gerçek soru gerçekten çizilip çizilmediği.
    await expect
      .poll(() =>
        logo.evaluate((element) => {
          const box = element.getBoundingClientRect();
          return box.width > 0 && box.height > 0;
        }),
      )
      .toBe(true);
    const brandBounds = await brand.boundingBox();
    const logoBounds = await logo.boundingBox();
    expect(logoBounds?.x ?? -1).toBeGreaterThanOrEqual(brandBounds?.x ?? 0);
    expect(
      (logoBounds?.x ?? 0) + (logoBounds?.width ?? Number.POSITIVE_INFINITY),
    ).toBeLessThanOrEqual((brandBounds?.x ?? 0) + (brandBounds?.width ?? 0));
    expect(logoBounds?.y ?? -1).toBeGreaterThanOrEqual(brandBounds?.y ?? 0);
    expect(
      (logoBounds?.y ?? 0) + (logoBounds?.height ?? Number.POSITIVE_INFINITY),
    ).toBeLessThanOrEqual((brandBounds?.y ?? 0) + (brandBounds?.height ?? 0));
    await expect(
      header.getByRole("button", { name: "Rota", exact: true }),
    ).toHaveCount(0);
    await expect(header.getByText("Dokümanlar")).toHaveCount(0);

    const navigationCenter = await header
      .getByRole("navigation", { name: "Ana bölümler" })
      .evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.left + bounds.width / 2;
      });
    expect(
      Math.abs(
        navigationCenter -
          (await page.evaluate(() => document.documentElement.clientWidth / 2)),
      ),
    ).toBeLessThanOrEqual(1);

    const activeControls = header.locator('[aria-current="page"]');
    if (route.active === "home") {
      await expect(activeControls).toHaveCount(1);
      await expect(brand).toHaveAttribute("aria-current", "page");
    } else if (route.active === "workspace") {
      await expect(activeControls).toHaveCount(1);
      await expect(sqlStudio).toHaveAttribute("aria-current", "page");
    } else if (route.active === "python") {
      await expect(activeControls).toHaveCount(1);
      await expect(pythonStudio).toHaveAttribute("aria-current", "page");
    } else if (route.active === "account") {
      await expect(activeControls).toHaveCount(1);
      await expect(start).toHaveAttribute("aria-current", "page");
    } else {
      await expect(activeControls).toHaveCount(0);
    }
    // Studio bağlantıları her rotada açık; giriş sayfasında da.
    await expect(sqlStudio).not.toHaveAttribute("aria-disabled", "true");
    await expect(pythonStudio).not.toHaveAttribute("aria-disabled", "true");

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".app-header")
    .getByRole("button", { name: "Python Studio" })
    .click();
  await expect(page).toHaveURL(/#\/python\/py-m1-t1$/);
  await expect(
    page.getByRole("heading", { name: "İlk veri sağlık kontrolü" }),
  ).toBeVisible();

  const pythonPanels = page.getByRole("tablist", {
    name: "Python çalışma alanı",
  });
  const casePanel = pythonPanels.getByRole("tab", { name: "Vaka" });
  const dataPanel = pythonPanels.getByRole("tab", { name: "Veri" });
  const codePanel = pythonPanels.getByRole("tab", { name: "Python" });
  const resultPanel = pythonPanels.getByRole("tab", { name: "Sonuç" });

  for (const panel of [casePanel, dataPanel, codePanel, resultPanel]) {
    await expect(panel).toBeVisible();
  }

  await expect(casePanel).toHaveAttribute("aria-selected", "true");
  await dataPanel.click();
  await expect(page.getByText("Vaka verisi hazır")).toBeVisible();
  await codePanel.click();
  await expect(page.locator(".python-editor-section")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Editor content" }),
  ).toBeVisible();
  await resultPanel.click();
  await expect(page.getByText("Analiz çıktın burada oluşacak")).toBeVisible();
});

test("the local profile survives sign-out and can be deliberately deleted", async ({
  page,
  isMobile,
}) => {
  if (isMobile) {
    await page.setViewportSize({ width: 320, height: 700 });
  }
  await page.goto("/#/giris");
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );

  await page.getByLabel("Adın").fill("Ada Analist");
  await page
    .getByRole("button", { name: "Yerel hesabımı oluştur ve başla" })
    .click();
  await expect(page).toHaveURL(/#\/lab\/m1-t1$/);
  await page.getByRole("button", { name: "Başlangıç rehberini kapat" }).click();

  const header = page.locator(".app-header");
  const brand = header.getByRole("button", { name: "Queryvale ana sayfa" });
  const logo = brand.locator("svg.brand-logo");
  const profile = header.getByRole("button", {
    name: "Profil — Ada Analist",
  });
  const settings = header.getByRole("button", { name: "Ayarlar" });
  await expect(
    header.getByRole("button", { name: /^Hemen Başla/ }),
  ).toHaveCount(0);
  await expect(profile).toBeVisible();
  await expect(profile).toContainText("Profil");
  await expect(settings).toBeVisible();
  await expect(logo).toBeVisible();
  if (isMobile) {
    await expect(brand.locator(".brand-word")).toBeHidden();
  }

  for (const control of [profile, settings]) {
    const bounds = await control.boundingBox();
    expect(bounds?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(bounds?.height ?? 0).toBeGreaterThanOrEqual(43.9);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await profile.click();
  await expect(page).toHaveURL(/#\/progress$/);
  await expect(profile).toHaveAttribute("aria-current", "page");

  await settings.click();
  await expect(page).toHaveURL(/#\/settings$/);
  await expect(settings).toHaveAttribute("aria-current", "page");

  await page.reload();
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(
    page
      .locator(".app-header")
      .getByRole("button", { name: "Profil — Ada Analist" }),
  ).toBeVisible();
  await expect(
    page.locator(".app-header").getByRole("button", { name: /^Hemen Başla/ }),
  ).toHaveCount(0);

  await page
    .locator(".app-header")
    .getByRole("button", { name: "Profil — Ada Analist" })
    .click();
  await page.getByRole("button", { name: "Profilden çık" }).click();
  let confirmation = page.getByRole("alertdialog", {
    name: "Profilden çıkılsın mı?",
  });
  await expect(confirmation).toContainText("ilerlemen bu cihazda korunacak");
  await confirmation.getByRole("button", { name: "Profilden çık" }).click();

  await expect(page).toHaveURL(/#\/$/);
  await expect(
    page.locator(".app-header").getByRole("button", { name: /^Hemen Başla/ }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(
    page.locator(".app-header").getByRole("button", { name: /^Hemen Başla/ }),
  ).toBeVisible();

  await page
    .locator(".app-header")
    .getByRole("button", { name: /^Hemen Başla/ })
    .click();
  await expect(page).toHaveURL(/#\/giris$/);
  await page
    .getByRole("button", { name: "Ada Analist profiline gir", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/lab\/m1-t1$/);
  await expect(
    page
      .locator(".app-header")
      .getByRole("button", { name: "Profil — Ada Analist" }),
  ).toBeVisible();

  await page
    .locator(".app-header")
    .getByRole("button", { name: "Ayarlar" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Yardım ve veri" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Profili sil" }).click();
  confirmation = page.getByRole("alertdialog", {
    name: "Yerel profil ve tüm veriler silinsin mi?",
  });
  await confirmation.getByRole("button", { name: "Vazgeç" }).click();
  await expect(page.getByRole("button", { name: "Profili sil" })).toBeVisible();

  await page.getByRole("button", { name: "Profili sil" }).click();
  confirmation = page.getByRole("alertdialog", {
    name: "Yerel profil ve tüm veriler silinsin mi?",
  });
  await confirmation
    .getByRole("button", { name: "Profili ve verileri sil" })
    .click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(
    page.locator(".app-header").getByRole("button", { name: /^Hemen Başla/ }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(
    page
      .locator(".app-header")
      .getByRole("button", { name: "Profil — Ada Analist" }),
  ).toHaveCount(0);
});

test("landing shows the real first case and unlocks the studios at the end", async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    "Kilit sözleşmesi tek tarayıcı çalıştırmasıyla kanıtlanır.",
  );
  await page.goto("/");

  const header = page.locator(".app-header");
  const sqlStudio = header.getByRole("button", {
    name: "SQL Studio — SQL Laboratuvarı",
  });
  const pythonStudio = header.getByRole("button", { name: "Python Studio" });

  // Studio bağlantıları eskiden sayfanın sonuna inene kadar kilitliydi; kilit
  // yalnız ana sayfada uygulandığı için herhangi bir başka ekrandan atlanabildi
  // ve hiçbir şeyi korumadı. Artık kaydırmadan da açık olmalılar.
  await expect(sqlStudio).toBeEnabled();
  await expect(pythonStudio).toBeEnabled();

  // İddia, sayılar, kanıt ve çağrı ilk ekranda birlikte durmalı.
  const hero = page.locator(".landing-hero");
  await expect(
    hero.getByRole("heading", {
      name: /SQL ezberleme.*Veri analisti gibi çalış/i,
    }),
  ).toBeVisible();
  // Sayılar müfredattan hesaplanır; testin sıraya değil değere bakması gerek.
  const caseCount = tasks.filter((task) => task.type === "case").length;
  await expect(
    hero.locator(".landing-hero-figures dt", { hasText: String(caseCount) }),
  ).toHaveCount(1);
  await expect(
    hero.getByRole("button", { name: /Hemen Başla/i }),
  ).toBeVisible();

  const heroBottom = await hero.evaluate(
    (element) => element.getBoundingClientRect().bottom,
  );
  expect(heroBottom).toBeLessThanOrEqual(
    (page.viewportSize()?.height ?? 720) + 1,
  );

  // Vitrindeki her değer müfredattan gelir; uydurma satır kalmamalı.
  const showcase = tasks.find((task) => task.id === "m1-t1")!;
  await expect(page.getByLabel("Tanıtım SQL sorgusu")).toContainText(
    "FROM products;",
  );
  for (const column of showcase.expectedColumns) {
    await expect(
      page.getByRole("columnheader", { name: column }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("cell", { name: String(showcase.expectedResult[0]![0]) }),
  ).toBeVisible();
  await expect(page.getByText("damla_data")).toHaveCount(0);

  // Sayfa artık kaydırma filmi değil; tüm içerik birkaç ekranda bitmeli.
  const documentHeight = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  expect(documentHeight).toBeLessThan((page.viewportSize()?.height ?? 720) * 4);

  await sqlStudio.click();
  await expect(page).toHaveURL(/#\/lab\//);
});

test("landing, onboarding and first real SQL task", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /SQL ezberleme.*Veri analisti gibi çalış/i,
    }),
  ).toBeVisible();
  const landingHeader = page.locator(".app-header");
  const landingSqlStudio = landingHeader.getByRole("button", {
    name: "SQL Studio — SQL Laboratuvarı",
  });
  const landingPythonStudio = landingHeader.getByRole("button", {
    name: "Python Studio",
  });
  await expect(landingSqlStudio).toBeEnabled();
  await expect(landingPythonStudio).toBeEnabled();
  await expect(
    page.getByRole("figure", { name: "Rotanın ilk vakası ve gerçek çıktısı" }),
  ).toBeVisible();
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );

  await page.getByRole("button", { name: /Hesabını Aç & Vaka Çöz/i }).click();
  await expect(page).toHaveURL(/#\/giris$/);
  await expect(
    page.getByRole("heading", { name: "Analiz rotanı kaydet." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Bu cihazda hesapsız devam et" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Bu vakada yalnız üç adımın var.",
    }),
  ).toBeVisible();
  if (isMobile) {
    await page.getByRole("button", { name: /Veriyi aç/i }).click();
    const dataTab = page.getByRole("tab", { name: "Veri görünümü" });
    await expect(dataTab).toHaveAttribute("aria-selected", "true");
    await expect(dataTab).toBeFocused();
    await page.getByRole("tab", { name: "Vaka görünümü" }).click();
  }
  await page.getByRole("button", { name: "Başlangıç rehberini kapat" }).click();

  await expect(
    page.getByRole("heading", { name: "Katalog görünümünü hazırla" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "İstenen teslim" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Beklenen çıktı" }),
  ).toBeVisible();
  // Kabul kontrolleri brief ile birlikte görünür; açmak gerekmez.
  await expect(page.getByText("Kendini kontrol et")).toBeVisible();
  const helpToggle = page.getByRole("button", {
    name: /Yardım adımlarını/,
  });
  await expect(helpToggle).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("button", { name: "1. ipucunu aç" }),
  ).toBeVisible();
  const runButton = page.getByRole("button", { name: /Çalıştır/i });
  const editor = page.getByRole("textbox", { name: "Editor content" });
  if (isMobile) {
    await expect(
      page.getByRole("tablist", { name: "Vaka çalışma adımları" }),
    ).toBeVisible();
    await expect(editor).toBeHidden();
    await expect(runButton).toHaveCount(0);
  } else {
    await expect(editor).toBeVisible();
  }
  if (!isMobile) {
    await page.evaluate(() => {
      window.location.hash = "#/settings";
    });
    await expect(page).toHaveURL(/#\/settings$/);
    await page
      .getByRole("group", { name: "Tema" })
      .getByRole("button", { name: "Açık", exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page
      .getByRole("button", { name: "SQL Studio — SQL Laboratuvarı" })
      .click();
    await expect(page).toHaveURL(/#\/lab\/m1-t1$/);
    // Stüdyo yüzeyleri tema token'larından beslenmelidir. Sabit renk yazmak
    // paleti her değiştiğinde testi kırar; iddiayı token'ın kendisine bağlıyoruz.
    const tokenColor = (token: string) =>
      page.evaluate((name) => {
        const probe = document.createElement("div");
        probe.style.color = getComputedStyle(document.documentElement)
          .getPropertyValue(name)
          .trim();
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      }, token);

    await expect(page.locator(".editor-toolbar")).toHaveCSS(
      "background-color",
      await tokenColor("--workbench-toolbar"),
    );
    await expect(page.locator(".results-content")).toHaveCSS(
      "background-color",
      await tokenColor("--workbench-surface"),
    );
    await expect(page.locator(".editor-frame .monaco-editor")).toHaveCSS(
      "background-color",
      await tokenColor("--code-bg"),
    );
  }
  const setSql = (sql: string) =>
    page.evaluate((nextSql) => {
      const monaco = (
        window as unknown as {
          monaco?: {
            editor: {
              getModels(): Array<{ setValue(value: string): void }>;
            };
          };
        }
      ).monaco;
      const model = monaco?.editor.getModels()[0];
      if (!model) throw new Error("Monaco modeli bulunamadı.");
      model.setValue(nextSql);
    }, sql);
  const readRailGeometry = () =>
    page.evaluate(() => {
      const rail = document.querySelector<HTMLElement>(".studio-action-zone");
      const next = document.querySelector<HTMLElement>(".studio-action-next");
      if (!rail || !next)
        throw new Error("Aksiyon rail geometrisi bulunamadı.");
      const railBounds = rail.getBoundingClientRect();
      const nextBounds = next.getBoundingClientRect();
      return {
        top: railBounds.top,
        height: railBounds.height,
        nextWidth: nextBounds.width,
      };
    });
  const expectStableRail = (
    actual: { top: number; height: number; nextWidth: number },
    expected: { top: number; height: number; nextWidth: number },
  ) => {
    expect(Math.abs(actual.top - expected.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(actual.height - expected.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(actual.nextWidth - expected.nextWidth)).toBeLessThanOrEqual(
      1,
    );
  };

  await expect
    .poll(() =>
      page.evaluate(() => {
        const monaco = (
          window as unknown as {
            monaco?: {
              editor: {
                getModels(): Array<{ getValue(): string }>;
              };
            };
          }
        ).monaco;
        return monaco?.editor.getModels()[0]?.getValue() ?? "";
      }),
    )
    .toBe("");

  // "Sorguyu yaz" kısayol butonu brief'ten kaldırıldı: dar ekranda SQL
  // görünümü sekmesi, geniş ekranda editörün kendisi zaten erişilebilir.
  const sqlViewTab = page.getByRole("tab", { name: "SQL görünümü" });
  if (await sqlViewTab.isVisible()) await sqlViewTab.click();
  await editor.focus();
  await expect(editor).toBeFocused();
  await expect(runButton).toBeDisabled();

  await page.getByRole("button", { name: "Sonraki çalışma" }).click();
  await expect(
    page.getByRole("heading", { name: "Kategori listesini tekilleştir" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Önceki çalışma" }).click();
  await expect(
    page.getByRole("heading", { name: "Katalog görünümünü hazırla" }),
  ).toBeVisible();
  const idleRailGeometry = await readRailGeometry();

  await page.getByRole("button", { name: "1. ipucunu aç" }).click();
  await expect(
    page.getByText(/Her ürün sonuçta bir satır olarak kalmalı/i),
  ).toBeVisible();
  await page.getByRole("button", { name: "2. ipucunu aç" }).click();
  await page.getByRole("button", { name: "3. ipucunu aç" }).click();
  const solutionTrigger = page.getByRole("button", {
    name: /Bir doğru sorguyu göster/i,
  });
  await expect(solutionTrigger).toHaveAttribute("aria-expanded", "false");
  await solutionTrigger.click();
  const solutionConfirmation = page.getByRole("group", {
    name: "Tam çözümü açmak istiyor musun?",
  });
  await expect(
    solutionConfirmation.getByRole("button", { name: "Kendim deneyeyim" }),
  ).toBeFocused();
  await expect(solutionConfirmation).toContainText(
    "Bu vaka 0 analiz puanı olur",
  );
  await solutionConfirmation
    .getByRole("button", { name: "0 puanla çözümü göster" })
    .click();
  const hideSolutionTrigger = page.getByRole("button", {
    name: /Çalışan çözümü gizle/i,
  });
  await expect(hideSolutionTrigger).toHaveAttribute("aria-expanded", "true");
  const solutionRegion = page.getByRole("region", {
    name: "Çalışan çözüm örneği",
  });
  await expect(solutionRegion).toContainText("SELECT product_name, category");
  await expect(solutionRegion).toContainText("FROM products;");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const monaco = (
          window as unknown as {
            monaco?: {
              editor: {
                getModels(): Array<{ getValue(): string }>;
              };
            };
          }
        ).monaco;
        return monaco?.editor.getModels()[0]?.getValue() ?? "";
      }),
    )
    .toBe("");
  await solutionRegion
    .getByRole("button", { name: "Editöre dön ve kendin yaz" })
    .click();
  await expect(editor).toBeFocused();

  const incompleteSql = "SELECT product_name FROM products;";
  await setSql(incompleteSql);
  await expect(runButton).toBeEnabled({
    timeout: 30_000,
  });
  await editor.press("ControlOrMeta+S");
  await expect(
    page.getByText("Sorgu ve ilerleme bu cihaza kaydedildi."),
  ).toBeVisible();

  await editor.press("ControlOrMeta+K");
  const routeDrawer = page.getByRole("region", { name: "SQL rotası" });
  await expect(routeDrawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(routeDrawer).toHaveCount(0);

  await editor.focus();
  await editor.press("ControlOrMeta+Enter");
  if (isMobile) {
    const resultTab = page.getByRole("tab", { name: "Sonuç görünümü" });
    await expect(resultTab).toHaveAttribute("aria-selected", "true");
    await expect(resultTab).toBeFocused();
  }
  await expect(
    page.getByText("Kolonları yeniden kontrol et", { exact: true }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("İstenen iki bilgi alanına dön")).toBeVisible();
  expectStableRail(await readRailGeometry(), idleRailGeometry);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const monaco = (
          window as unknown as {
            monaco?: {
              editor: {
                getModels(): Array<{ getValue(): string }>;
              };
            };
          }
        ).monaco;
        return monaco?.editor.getModels()[0]?.getValue() ?? "";
      }),
    )
    .toBe(incompleteSql);

  if (isMobile) {
    await page.getByRole("tab", { name: "SQL görünümü" }).click();
  }
  await setSql("SELECT product_name, category FROM products;");
  await runButton.click();

  if (isMobile) {
    const resultTab = page.getByRole("tab", { name: "Sonuç görünümü" });
    await expect(resultTab).toHaveAttribute("aria-selected", "true");
    await expect(resultTab).toBeFocused();
  }

  await expect(page.getByRole("status", { name: /Doğru —/ })).toBeVisible({
    timeout: 20_000,
  });
  expectStableRail(await readRailGeometry(), idleRailGeometry);
  const resultTable = page.getByRole("table", { name: "Sorgu sonucu" });
  await expect(resultTable).toBeVisible();
  await expect(resultTable.getByText("Desk Lamp")).toBeVisible();
  await expect(resultTable.getByText("Home")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/#\/lab\/m1-t1$/);

  const completionPanel = page.getByRole("region", {
    name: /Katalog görünümü hazır/i,
  });
  await expect(completionPanel).toBeVisible();
  await expect(completionPanel.getByText("Kanıt doğrulandı")).toBeVisible();
  await expect(completionPanel.getByText("0 analiz puanı")).toBeVisible();
  const finding =
    "Katalog çıktısında altı ürünün dört kategoriye dağıldığı görülüyor.";
  const recommendation =
    "Haftalık katalog kontrolünü ürün adı ve kategori alanlarıyla yürütün.";
  const caveat =
    "Bu kanıt yalnız mevcut ürün kataloğu anlık görüntüsünü kapsıyor.";
  await completionPanel.getByText("Karar notu ekle").click();
  await completionPanel.getByRole("textbox", { name: /^Bulgu/ }).fill(finding);
  await completionPanel
    .getByRole("textbox", { name: /^Öneri/ })
    .fill(recommendation);
  await completionPanel.getByText("Varsayım veya veri çekincesi ekle").click();
  await completionPanel
    .getByRole("textbox", { name: "Varsayım veya veri çekincesi" })
    .fill(caveat);
  await completionPanel.getByRole("button", { name: "Kanıta ekle" }).click();
  await expect(
    completionPanel.getByRole("button", { name: "Kanıt Defteri’nde" }),
  ).toBeDisabled();
  await expect(
    completionPanel.getByText("Bu vakanın temel mantığı"),
  ).toBeHidden();
  await completionPanel.getByText("Çözümü incele").click();
  await expect(
    completionPanel.getByText("Bu vakanın temel mantığı"),
  ).toBeVisible();
  await expect(resultTable.getByText("Desk Lamp")).toBeVisible();
  await page.getByRole("button", { name: "Sonraki çalışma" }).click();
  await expect(
    page.getByRole("heading", { name: "Kategori listesini tekilleştir" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#\/lab\/m1-t2$/);

  await page.evaluate(() => {
    window.location.hash = "#/progress";
  });
  await expect(page).toHaveURL(/#\/progress$/);
  const scoreCard = page
    .getByText("Analiz puanı", { exact: true })
    .locator("..");
  await expect(scoreCard.locator("strong")).toHaveText("0");
  await expect(scoreCard).toContainText("1 çözümle");
  await page.reload();
  const restoredScoreCard = page
    .getByText("Analiz puanı", { exact: true })
    .locator("..");
  await expect(restoredScoreCard.locator("strong")).toHaveText("0");
  await expect(restoredScoreCard).toContainText("1 çözümle");
  const evidenceNotebook = page.getByRole("region", {
    name: "Kanıt Defteri",
  });
  await expect(evidenceNotebook).toBeVisible();
  await expect(
    evidenceNotebook.getByText("Katalog görünümünü hazırla"),
  ).toBeVisible();
  await expect(evidenceNotebook.getByText(finding)).toBeVisible();
  await expect(evidenceNotebook.getByText(recommendation)).toBeVisible();
  await expect(evidenceNotebook.getByText(caveat)).toBeVisible();

  await page.reload();
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  const restoredNotebook = page.getByRole("region", {
    name: "Kanıt Defteri",
  });
  await expect(
    restoredNotebook.getByText("Katalog görünümünü hazırla"),
  ).toBeVisible();
  await expect(restoredNotebook.getByText(finding)).toBeVisible();
  await expect(restoredNotebook.getByText(recommendation)).toBeVisible();
  await expect(restoredNotebook.getByText(caveat)).toBeVisible();
});

test("learning path, settings and the in-flow route remain usable on a narrow viewport", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile project coverage");
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(
    page.getByRole("heading", {
      name: /SQL ezberleme.*Veri analisti gibi çalış/i,
    }),
  ).toBeVisible();
  const landingHeader = page.locator(".app-header");
  const landingSqlStudio = landingHeader.getByRole("button", {
    name: "SQL Studio — SQL Laboratuvarı",
  });
  const landingPythonStudio = landingHeader.getByRole("button", {
    name: "Python Studio",
  });
  await expect(landingSqlStudio).toBeEnabled();
  await expect(landingPythonStudio).toBeEnabled();
  await expect(
    page.getByRole("figure", { name: "Rotanın ilk vakası ve gerçek çıktısı" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Hesabını Aç & Vaka Çöz/i }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);

  await page.getByRole("button", { name: /Hesabını Aç & Vaka Çöz/i }).click();
  await expect(page).toHaveURL(/#\/giris$/);
  await expect(
    page.getByRole("heading", { name: "Analiz rotanı kaydet." }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByLabel("Adın")).toBeVisible();
  await expect(page.getByLabel("Adın")).toBeInViewport({ ratio: 1 });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);

  await page.goto("/#/settings");
  await page.getByRole("button", { name: "Açık" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: /^Hemen Başla/ }).click();
  await expect(page).toHaveURL(/#\/giris$/);
  await expect(page.getByLabel("Adın")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);

  await page.goto("/#/learn");
  await expect(page.getByRole("heading", { name: "Rota" })).toBeVisible();
  await expect(
    page.getByText("Önerilen başlangıç", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Buradasın", { exact: true })).toBeVisible();
  await expect(page.locator(".module-progress-label").first()).toBeVisible();
  await expect(page.locator(".task-status-label").first()).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");

  await page
    .getByRole("button", { name: "SQL Studio — SQL Laboratuvarı" })
    .click();
  await expect(
    page.getByRole("tablist", { name: "Vaka çalışma adımları" }),
  ).toBeVisible();
  for (const studioTarget of [
    page.getByRole("button", { name: "SQL Studio — SQL Laboratuvarı" }),
    page.getByRole("button", { name: "Python Studio" }),
  ]) {
    const bounds = await studioTarget.boundingBox();
    expect(bounds?.height ?? 0).toBeGreaterThanOrEqual(43.9);
  }
  await page
    .getByRole("button", { name: new RegExp(`Rota · Vaka 1/${tasks.length}`) })
    .click();
  const routeDrawer = page.getByRole("region", { name: "SQL rotası" });
  await expect(routeDrawer).toBeVisible();
  await expect(routeDrawer).toHaveCSS("position", "static");
  const drawerBounds = await routeDrawer.boundingBox();
  expect(drawerBounds?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect(
    (drawerBounds?.x ?? 0) + (drawerBounds?.width ?? 321),
  ).toBeLessThanOrEqual(320);
  expect(
    (drawerBounds?.y ?? 0) + (drawerBounds?.height ?? 701),
  ).toBeLessThanOrEqual(700);
  expect(
    await routeDrawer
      .locator(".studio-route-list")
      .evaluate((element) => element.scrollHeight > element.clientHeight),
  ).toBe(true);
  expect(
    await page.evaluate(() =>
      Math.abs(
        (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight,
      ),
    ),
  ).toBeLessThanOrEqual(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
  await page.keyboard.press("Escape");
  await expect(routeDrawer).toHaveCount(0);
  await page.getByRole("tab", { name: "SQL görünümü" }).click();
  await expect(page.getByRole("button", { name: /Çalıştır/i })).toBeVisible();
});
