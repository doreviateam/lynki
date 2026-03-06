import { test, expect } from "@playwright/test";

test.describe("Linky — Page d'accueil", () => {
  test("affiche la page sans erreur", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Dorevia Linky/);
  });

  test("contient le header ou la navigation", async ({ page }) => {
    await page.goto("/");
    // Adapter le sélecteur selon la structure réelle (ex. ReportHeader, BottomNav)
    const main = page.getByRole("main").or(page.locator("main"));
    await expect(main).toBeVisible({ timeout: 10_000 });
  });
});
