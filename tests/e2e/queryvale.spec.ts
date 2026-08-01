import { expect, test } from "@playwright/test";

test("locked module links return a new learner to the first accessible case", async ({
  page,
}) => {
  await page.goto("/#/lab/m11-t1");

  await expect(page).toHaveURL(/#\/lab\/m1-t1$/);
  await expect(
    page.getByRole("heading", { name: "Katalog görünümünü hazırla" }),
  ).toBeVisible();
  const lockNotice = page.locator(".toast[role='status']");
  await expect(lockNotice).toContainText("Pazarlama analitiği proje stüdyosu");
  await expect(lockNotice).toContainText("Veriyle ilk temas");
});

test("header keeps one clear active destination without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/");

  const currentDestinations = page.locator('[aria-current="page"]:visible');
  await expect(currentDestinations).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Queryvale ana sayfa" }),
  ).toHaveAttribute("aria-current", "page");

  await page.getByRole("button", { name: "Rota", exact: true }).click();
  await expect(page).toHaveURL(/#\/learn$/);
  await expect(currentDestinations).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Rota", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  await page.getByRole("button", { name: "Ayarları aç" }).click();
  await expect(page).toHaveURL(/#\/settings$/);
  await expect(currentDestinations).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Ayarları aç" }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("desktop landing pins the authored role and three-step SQL story", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Mobil görünüm doğrudan adım kontrollerini kullanır.");
  await page.goto("/");

  const heroTrack = page.locator(".landing-role-track");
  const heroStage = page.locator(".landing-role-stage");
  await expect(heroTrack).toHaveAttribute("data-scroll-mode", "cinematic");
  const initialHeroTop = await heroStage.evaluate(
    (element) => element.getBoundingClientRect().top,
  );

  const scrollToTrackProgress = (selector: string, progress: number) =>
    page.evaluate(
      ({ nextProgress, trackSelector }) => {
        const track = document.querySelector<HTMLElement>(trackSelector);
        if (!track) throw new Error(`${trackSelector} bulunamadı.`);
        const trackTop = window.scrollY + track.getBoundingClientRect().top;
        const travelDistance = Math.max(
          1,
          track.offsetHeight - window.innerHeight,
        );
        window.scrollTo({
          behavior: "auto",
          top: trackTop + travelDistance * nextProgress,
        });
      },
      { nextProgress: progress, trackSelector: selector },
    );

  await scrollToTrackProgress(".landing-role-track", 0.5);
  await expect(page.locator(".landing-dynamic-role")).toHaveText(
    "İş Analistleri",
  );
  await expect
    .poll(() =>
      heroStage.evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeCloseTo(initialHeroTop, 0);

  await scrollToTrackProgress(".landing-role-track", 0.9);
  await expect(page.locator(".landing-dynamic-role")).toHaveText(
    "Veri Bilimcileri",
  );

  const studioStage = page.locator(".landing-studio-stage");
  await scrollToTrackProgress(".landing-studio-track", 0.5);
  await expect(page.locator(".landing-studio-track")).toHaveAttribute(
    "data-step",
    "2",
  );
  await expect(page.getByLabel("Tanıtım SQL sorgusu")).toContainText(
    "ORDER BY total_queries DESC",
  );
  await expect
    .poll(() =>
      studioStage.evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeCloseTo(0, 0);

  await scrollToTrackProgress(".landing-studio-track", 0.9);
  await expect(page.locator(".landing-studio-track")).toHaveAttribute(
    "data-step",
    "3",
  );
  await expect(page.locator(".landing-result-table")).toHaveClass(/visible/);
  await expect(page.getByText("damla_data")).toBeVisible();
  await expect(page.getByText("Idle")).toHaveCount(0);

  const beforeWheel = await page.evaluate(() => window.scrollY);
  await page.locator(".landing-result-area").hover();
  await page.mouse.wheel(0, 280);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(beforeWheel);
});

test("landing, onboarding and first real SQL task", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Geleceğin Veri Analistleri.*İçin İnteraktif SQL Studio/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Üç adımda çalışan SQL sorgusu" }),
  ).toBeVisible();
  if (isMobile) {
    await page
      .getByRole("button", {
        name: "3. adım: Sorgu Çalıştırıldı, Sonuç Hazır",
      })
      .click();
    await expect(page.getByText("3 ROWS RETURNED")).toBeVisible();
    await expect(page.getByText("damla_data")).toBeVisible();
  }
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );

  await page.getByRole("button", { name: /İlk vakayı birlikte çöz/i }).click();
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
    page.getByRole("list", { name: "Vakaya başlama sırası" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "İstenen teslim" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Çıktını tanı" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Veriyi gör, sorgunu yaz" }),
  ).toBeVisible();
  const helpToggle = page.getByRole("button", {
    name: /Yardım adımlarını/,
  });
  await expect(helpToggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("button", { name: "1. ipucunu aç" })).toHaveCount(
    0,
  );
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
    await page.getByRole("button", { name: "Açık temaya geç" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator(".editor-toolbar")).toHaveCSS(
      "background-color",
      "rgb(248, 250, 252)",
    );
    await expect(page.locator(".results-content")).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );
    await expect(page.locator(".editor-frame .monaco-editor")).toHaveCSS(
      "background-color",
      "rgb(241, 245, 249)",
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

  await page.getByRole("button", { name: "Sorguyu yaz" }).click();
  await expect(editor).toBeFocused();
  await expect(runButton).toBeDisabled();

  await page.getByRole("button", { name: "Sonraki vaka" }).click();
  await expect(
    page.getByRole("heading", { name: "Kategori listesini tekilleştir" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Önceki vaka" }).click();
  await expect(
    page.getByRole("heading", { name: "Katalog görünümünü hazırla" }),
  ).toBeVisible();

  await helpToggle.click();
  await expect(helpToggle).toHaveAttribute("aria-expanded", "true");
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
  const commandDialog = page.getByRole("dialog", { name: "Komut paneli" });
  await expect(commandDialog).toBeVisible();
  await commandDialog.getByRole("button", { name: "Kapat" }).click();

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

  await expect(page.getByText("Doğru çözüm", { exact: true })).toBeVisible({
    timeout: 20_000,
  });
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
  await completionPanel
    .getByRole("button", {
      name: "Sonraki vakaya geç: Kategori listesini tekilleştir",
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Kategori listesini tekilleştir" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#\/lab\/m1-t2$/);

  await page.getByRole("button", { name: "Profilim", exact: true }).click();
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

test("learning path and settings remain usable on a narrow viewport", async ({
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
      name: /Geleceğin Veri Analistleri.*İçin İnteraktif SQL Studio/i,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "3. adım: Sorgu Çalıştırıldı, Sonuç Hazır",
    })
    .click();
  await expect(page.getByText("damla_data")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /İlk vakayı birlikte çöz/i }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
  await page.getByRole("button", { name: "Rota", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Rota" })).toBeVisible();
  await expect(
    page.getByText("Önerilen başlangıç", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Buradasın", { exact: true })).toBeVisible();
  await expect(page.locator(".module-progress-label").first()).toBeVisible();
  await expect(page.locator(".task-status-label").first()).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");

  await page.getByRole("button", { name: "SQL Laboratuvarı" }).click();
  await expect(
    page.getByRole("tablist", { name: "Vaka çalışma adımları" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "SQL görünümü" }).click();
  await expect(page.getByRole("button", { name: /Çalıştır/i })).toBeVisible();
});
