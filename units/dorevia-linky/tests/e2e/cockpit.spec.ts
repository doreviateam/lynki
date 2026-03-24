import { test, expect } from "@playwright/test";

const COCKPIT_APIS = [
  "**/api/dashboard-metrics*",
  "**/api/ar-by-partner*",
  "**/api/vault-health*",
  "**/api/sales*",
  "**/api/purchases*",
];

test.describe("Cockpit Linky — /cockpit", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/tenant*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tenant_id: "core" }),
      })
    );
    for (const pattern of COCKPIT_APIS) {
      await page.route(pattern, (route) =>
        route.fulfill({ status: 500, body: "{}" })
      );
    }
  });

  test("affiche la page cockpit sans erreur", async ({ page }) => {
    await page.goto("/cockpit");
    await expect(page).toHaveTitle(/Dorevia Lynki/);
  });

  test("affiche le header et le contenu principal", async ({ page }) => {
    await page.goto("/cockpit");
    const main = page.getByRole("main");
    await expect(main).toBeVisible({ timeout: 15_000 });
    await expect(main).toContainText(/Cockpit financier/);
    await expect(main).toContainText(/Linky/);
  });

  test("affiche les KPIs et la couverture probante", async ({ page }) => {
    await page.goto("/cockpit");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("text=Trésorerie").or(page.locator("text=Marge"))).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator("text=Couverture probante")).toBeVisible({ timeout: 5_000 });
  });

  test("affiche les sections Flux et Exposition clients", async ({ page }) => {
    await page.goto("/cockpit");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("text=Flux économiques").or(page.locator("text=Exposition clients"))).toBeVisible({
      timeout: 10_000,
    });
  });

  test("affiche les alertes financières", async ({ page }) => {
    await page.goto("/cockpit");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("text=Alertes financières")).toBeVisible({ timeout: 10_000 });
  });

  test("bouton Réessayer visible en cas d'erreur", async ({ page }) => {
    await page.route("**/api/tenant*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tenant_id: "core" }),
      })
    );
    await page.route(COCKPIT_APIS[0]!, (route) =>
      route.fulfill({ status: 200, body: "invalid json" })
    );
    for (let i = 1; i < COCKPIT_APIS.length; i++) {
      await page.route(COCKPIT_APIS[i]!, (route) =>
        route.fulfill({ status: 500, body: "{}" })
      );
    }
    await page.goto("/cockpit");
    const retryBtn = page.getByRole("button", { name: /Réessayer/i });
    await expect(retryBtn).toBeVisible({ timeout: 15_000 });
  });
});
