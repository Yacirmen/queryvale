import { expect, test } from "@playwright/test";

test("landing, onboarding and first real SQL task", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Soruyu sorguya/i }),
  ).toBeVisible();
  await expect(page.getByText("Gerçek PostgreSQL motoru")).toBeVisible();
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );

  await page.getByRole("button", { name: /İlk vakayı aç/i }).click();
  await expect(
    page.getByRole("heading", { name: "Masana hoş geldin." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Laboratuvarı hazırla/i }).click();

  await expect(
    page.getByRole("heading", { name: "Katalog görünümünü hazırla" }),
  ).toBeVisible();
  const runButton = page.getByRole("button", { name: /Çalıştır/i });
  await expect(runButton).toBeEnabled({
    timeout: 30_000,
  });

  await page.getByRole("button", { name: "İpucu 1’i aç" }).click();
  await expect(page.getByText(/Bir tablodan veri okumak/i)).toBeVisible();

  await expect(
    page.getByRole("textbox", { name: "Editor content" }),
  ).toBeVisible();
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

  await setSql("SELECT product_name FROM products;");
  await runButton.click();
  await expect(page.getByText("Kolonları yeniden kontrol et")).toBeVisible({
    timeout: 20_000,
  });

  await setSql("SELECT product_name, category FROM products;");
  await runButton.click();

  await expect(page.getByText("Doğru çözüm")).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.getByRole("dialog", { name: /Katalog görünümü hazır/i }),
  ).toBeVisible();
});

test("learning path and settings remain usable on a narrow viewport", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile project coverage");
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await page
    .getByRole("button", { name: "Öğrenme yolu", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Öğrenme yolu" }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");

  await page.getByRole("button", { name: "Laboratuvar" }).click();
  await expect(page.getByRole("button", { name: /Çalıştır/i })).toBeVisible();
});
