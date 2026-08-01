import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function scrollLandingStory(page: Page, progress: number) {
  await page.evaluate((nextProgress) => {
    const storyTrack = document.querySelector<HTMLElement>(".landing-sql-film");
    if (!storyTrack) throw new Error("Landing SQL film track bulunamadı.");
    const headerHeight =
      Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--header-h",
        ),
      ) || 0;
    const trackTop = window.scrollY + storyTrack.getBoundingClientRect().top;
    const travelDistance = Math.min(window.innerHeight * 1.6, 1280);
    window.scrollTo({
      behavior: "auto",
      top: trackTop - headerHeight + travelDistance * nextProgress,
    });
  }, progress);
}

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

test("desktop landing pins one compact SQL canvas for three scroll steps", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Mobil görünüm erişilebilir tab deck kullanır.");
  await page.goto("/");

  const story = page.getByRole("tablist", {
    name: "SQL hikâyesinin üç adımı",
  });
  const track = page.locator(".landing-sql-film");
  const stage = page.locator(".landing-sql-film-shell");
  const editor = page.getByRole("article", { name: "SQL editörü" });
  const result = page.getByRole("complementary", {
    name: "Görsel sonuç paneli",
  });

  await expect(stage).toHaveAttribute("data-scroll-mode", "cinematic");
  await expect(story.getByRole("tab")).toHaveCount(3);
  await expect(editor).toHaveCount(1);
  await expect(result).toHaveCount(1);
  await expect(result.getByRole("table")).toHaveCount(1);

  const initialTop = await stage.evaluate(
    (element) => element.getBoundingClientRect().top,
  );

  await scrollLandingStory(page, 0.5);
  await expect(
    story.getByRole("tab", { name: "2. adım: Karşılaştır" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect
    .poll(() =>
      stage.evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeCloseTo(initialTop, 1);
  await expect(editor).toContainText("LEFT JOIN sales_ledger");
  await expect(result.getByRole("table")).toContainText("Izmir Hub");

  await scrollLandingStory(page, 0.88);
  await expect(
    story.getByRole("tab", { name: "3. adım: Karara dönüştür" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(editor).toContainText("DENSE_RANK");
  await expect(result).toContainText("Sorgu doğrulandı");
  await expect(
    page.getByRole("button", { name: "İlk vakaya başla" }),
  ).toHaveAttribute("data-emphasis", "true");
  await expect(page).toHaveURL(/\/$/);

  const compactHeight = await page.evaluate(() => ({
    page: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
  }));
  expect(compactHeight.page).toBeLessThan(compactHeight.viewport * 3.25);

  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight }),
  );
  const siteFooter = page.getByRole("contentinfo");
  await expect(siteFooter).toBeVisible();
  await expect(siteFooter).toContainText(
    "Verin ve ilerlemen bu cihazda kalır.",
  );
  await expect
    .poll(() =>
      stage.evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeLessThan(initialTop - 20);
  await expect(track).toBeVisible();
});

test("landing, onboarding and first real SQL task", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Sorgu büyüdükçe karar netleşir/i,
    }),
  ).toBeVisible();
  const landingStory = page.getByRole("tablist", {
    name: "SQL hikâyesinin üç adımı",
  });
  await expect(landingStory.getByRole("tab")).toHaveCount(3);
  const landingStage = page.locator(".landing-sql-film-shell");
  await expect(landingStage).toHaveAttribute(
    "data-scroll-mode",
    isMobile ? "manual" : "cinematic",
  );
  await landingStory
    .getByRole("tab", { name: "3. adım: Karara dönüştür" })
    .click();
  await expect(
    landingStory.getByRole("tab", { name: "3. adım: Karara dönüştür" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("complementary", { name: "Görsel sonuç paneli" }),
  ).toBeVisible();
  await expect(page.getByRole("tablist")).toHaveCount(1);
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );

  await page.getByRole("button", { name: "İlk vakaya başla" }).click();
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
      "rgb(233, 237, 231)",
    );
    await expect(page.locator(".results-content")).toHaveCSS(
      "background-color",
      "rgb(243, 241, 234)",
    );
    await expect(page.locator(".editor-frame .monaco-editor")).toHaveCSS(
      "background-color",
      "rgb(248, 246, 240)",
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
  const stage = page.locator(".landing-sql-film-shell");
  const story = page.getByRole("tablist", {
    name: "SQL hikâyesinin üç adımı",
  });
  await expect(stage).toHaveAttribute("data-scroll-mode", "manual");
  await expect(story.getByRole("tab")).toHaveCount(3);
  await story.getByRole("tab", { name: "3. adım: Karara dönüştür" }).click();
  await expect(
    story.getByRole("tab", { name: "3. adım: Karara dönüştür" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("article", { name: "SQL editörü" }),
  ).toContainText("DENSE_RANK");
  await expect(
    page.getByRole("complementary", { name: "Görsel sonuç paneli" }),
  ).toContainText("Sorgu doğrulandı");
  await expect(
    page.getByRole("button", { name: "İlk vakaya başla" }),
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
