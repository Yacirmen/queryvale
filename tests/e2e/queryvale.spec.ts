import { expect, test } from "@playwright/test";

test("header keeps one clear active destination without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/");

  const currentDestinations = page.locator('[aria-current="page"]:visible');
  await expect(currentDestinations).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Queryvale ana sayfa" }),
  ).toHaveAttribute("aria-current", "page");

  await page.getByRole("button", { name: "Vaka Rotası" }).click();
  await expect(page).toHaveURL(/#\/learn$/);
  await expect(currentDestinations).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Vaka Rotası" }),
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

test("desktop landing keeps one SQL canvas while native scroll grows the query", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Mobil görünüm erişilebilir tab deck kullanır.");
  await page.goto("/");

  const film = page.locator(".landing-sql-film-shell");
  const stickyStage = page.locator(".landing-sql-film-sticky");
  await expect(film).toHaveAttribute("data-scroll-mode", "cinematic");
  const initialTop = await stickyStage.evaluate(
    (element) => element.getBoundingClientRect().top,
  );

  const scrollToStoryProgress = (progress: number) =>
    page.evaluate((nextProgress) => {
      const track = document.querySelector<HTMLElement>(".landing-sql-film");
      if (!track) throw new Error("Landing SQL film track bulunamadı.");
      const headerHeight =
        Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--header-h",
          ),
        ) || 0;
      const trackTop = window.scrollY + track.getBoundingClientRect().top;
      const stageHeight = Math.max(1, window.innerHeight - headerHeight);
      const travelDistance = Math.max(1, track.offsetHeight - stageHeight);
      window.scrollTo({
        behavior: "auto",
        top: trackTop - headerHeight + travelDistance * nextProgress,
      });
    }, progress);

  await scrollToStoryProgress(0.376);
  await expect(
    page.getByRole("tab", { name: /3\. adım: Gerçekleşen/i }),
  ).toHaveAttribute("aria-selected", "true");
  await expect
    .poll(() =>
      stickyStage.evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeCloseTo(initialTop, 0);

  await scrollToStoryProgress(0.9);
  await expect(
    page.getByRole("tab", { name: /6\. adım: Karar/i }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".landing-sql-code")).toContainText("DENSE_RANK");
  await expect(page).toHaveURL(/\/$/);

  await scrollToStoryProgress(0.208);
  await expect(
    page.getByRole("tab", { name: /2\. adım: Hedef/i }),
  ).toHaveAttribute("aria-selected", "true");
});

test("landing, onboarding and first real SQL task", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Bir sorgu nasıl büyür/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Tanıtıma geç/i }).click();
  await expect(
    page.getByRole("heading", { name: /Bir tabloyla başla/i }),
  ).toBeVisible();
  await expect(page.locator("#product-introduction")).toBeFocused();
  const journeyDeck = page.getByRole("region", {
    name: "Queryvale analiz döngüsü",
  });
  await expect(journeyDeck).toHaveAttribute("data-scroll-mode", "manual");
  await expect(journeyDeck).toBeVisible();
  await page.getByRole("tab", { name: /3\. adım: Sorgula/i }).click();
  await expect(
    journeyDeck.getByText(/PostgreSQL uyumlu veri üzerinde/),
  ).toBeVisible();
  await page.getByRole("tab", { name: /5\. adım: Anlat/i }).click();
  await expect(
    page.getByRole("heading", {
      name: "Doğrulanmış sonucu kısa bir iş notuna dönüştür.",
    }),
  ).toBeVisible();
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );

  await page
    .getByRole("button", { name: /Rehberli ilk vakayı başlat/i })
    .click();
  await expect(
    page.getByRole("heading", { name: "Masana hoş geldin." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Laboratuvarı hazırla/i }).click();

  await expect(
    page.getByRole("heading", { name: "Katalog görünümünü hazırla" }),
  ).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Göreve başlama sırası" }),
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
  await expect(editor).toBeVisible();
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

  await expect(runButton).toBeDisabled();
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

  await page.getByRole("button", { name: "Sonraki görev" }).click();
  await expect(
    page.getByRole("heading", { name: "Kategori listesini tekilleştir" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Önceki görev" }).click();
  await expect(
    page.getByRole("heading", { name: "Katalog görünümünü hazırla" }),
  ).toBeVisible();

  await helpToggle.click();
  await expect(helpToggle).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "1. ipucunu aç" }).click();
  await expect(
    page.getByText(/SELECT görmek istediğin kolonları/i),
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
  await expect(page.getByText("Kolonları yeniden kontrol et")).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.getByText("Katalog sözleşmesindeki iki kolona odaklan"),
  ).toBeVisible();
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

  await setSql("SELECT product_name, category FROM products;");
  await runButton.click();

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
    completionPanel.getByText("Bu görevin temel mantığı"),
  ).toBeHidden();
  await completionPanel.getByText("Çözümü incele").click();
  await expect(
    completionPanel.getByText("Bu görevin temel mantığı"),
  ).toBeVisible();
  await expect(resultTable.getByText("Desk Lamp")).toBeVisible();
  await completionPanel
    .getByRole("button", {
      name: "Sonraki göreve geç: Kategori listesini tekilleştir",
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
  const journeyDeck = page.getByRole("region", {
    name: "Queryvale analiz döngüsü",
  });
  await expect(journeyDeck).toBeVisible();
  await expect(journeyDeck).toHaveAttribute("data-scroll-mode", "manual");
  await expect(
    journeyDeck.getByRole("tab", { name: /1\. adım: Sor/i }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(journeyDeck.getByRole("tabpanel")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
  await page.getByRole("button", { name: "Vaka Rotası", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Öğrenme yolu" }),
  ).toBeVisible();
  await expect(
    page.getByText("Önerilen başlangıç", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Buradasın", { exact: true })).toBeVisible();
  await expect(page.locator(".module-progress-label").first()).toBeVisible();
  await expect(page.locator(".task-status-label").first()).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");

  await page.getByRole("button", { name: "SQL Laboratuvarı" }).click();
  await expect(page.getByRole("button", { name: /Çalıştır/i })).toBeVisible();
});
