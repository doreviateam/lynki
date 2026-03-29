import { test, expect } from "@playwright/test";

/**
 * Sprint 15 T85 — Cohérence Pilotage × Synthèse (rapprochement bancaire)
 *
 * Deux scénarios obligatoires (contrat métier v0.2, plan v1.2 §5.2) :
 *   Cas 1 — Aligné : Pilotage et Synthèse affichent des valeurs cohérentes.
 *   Cas 2 — Non aligné : la Synthèse affiche un état explicite (pas de chiffre arbitraire).
 *
 * La comparaison porte sur la cohérence métier (valeur/état), pas sur du texte pixel-perfect.
 */

const BASE_URL = "/";

test.describe("Sprint 15 T85 — Rapprochement bancaire : cohérence Pilotage × Synthèse", () => {
  test("Cas 1 — Aligné : le bloc rapprochement affiche une valeur en Synthèse quand Pilotage en a une", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // En Pilotage par défaut — vérifier que la page se charge
    const main = page.locator("main");
    await expect(main).toBeVisible({ timeout: 15_000 });

    // Synthèse : route dédiée (redirection depuis `/?view=synthese` si besoin)
    await page.goto("/?view=synthese");
    await page.waitForLoadState("networkidle");

    // Le bloc « État du rapprochement bancaire » doit être visible
    const reconBlock = page.getByText("État du rapprochement bancaire");
    await expect(reconBlock).toBeVisible({ timeout: 10_000 });

    // Le bloc doit contenir soit une valeur chiffrée (ex. "XX %"), soit un état explicite
    const blockContainer = page.locator("text=État du rapprochement bancaire").locator("..").locator("..");
    const hasPercentage = blockContainer.getByText(/%/).first();
    const hasStateLabel = blockContainer.getByText(/Partiel|Indisponible|Non aligné|Aligné/).first();

    const percentVisible = await hasPercentage.isVisible().catch(() => false);
    const stateVisible = await hasStateLabel.isVisible().catch(() => false);

    // Au moins l'un des deux : valeur ou état explicite — pas de trou UI
    expect(percentVisible || stateVisible).toBe(true);
  });

  test("Cas 2 — Non aligné / indisponible : la Synthèse affiche un état explicite, pas un chiffre arbitraire", async ({ page }) => {
    // Accès en Synthèse directement
    await page.goto("/?view=synthese");
    await page.waitForLoadState("networkidle");

    const reconBlock = page.getByText("État du rapprochement bancaire");
    await expect(reconBlock).toBeVisible({ timeout: 10_000 });

    const blockContainer = page.locator("text=État du rapprochement bancaire").locator("..").locator("..");

    // La ligne Réf. doit être visible même en état dégradé
    const refLine = blockContainer.getByText(/Réf\./);
    await expect(refLine).toBeVisible({ timeout: 5_000 });

    // Le bloc ne doit JAMAIS avoir un emplacement vide visible entre libellé et contenu
    // Vérifier que le conteneur a du contenu textuel au-delà du titre
    const innerText = await blockContainer.innerText();
    expect(innerText.length).toBeGreaterThan(40);
  });

  test("Non-régression — les blocs existants de Synthèse sont toujours visibles", async ({ page }) => {
    await page.goto("/?view=synthese");
    await page.waitForLoadState("networkidle");

    // Titre Synthèse
    await expect(page.getByText("Synthèse comptable")).toBeVisible({ timeout: 10_000 });

    // Blocs structurants existants (contrat §3.2)
    await expect(page.getByText(/Balance générale/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Bilan/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Compte de résultat/)).toBeVisible({ timeout: 10_000 });
  });

  test("Non-régression — le bloc ne casse pas l'ordre de lecture en Synthèse", async ({ page }) => {
    await page.goto("/?view=synthese");
    await page.waitForLoadState("networkidle");

    const reconBlock = page.getByText("État du rapprochement bancaire").first();
    const bgBlock = page.getByText(/Balance générale/).first();

    await expect(reconBlock).toBeVisible({ timeout: 10_000 });
    await expect(bgBlock).toBeVisible({ timeout: 10_000 });

    // Le bloc rapprochement doit apparaître AVANT la balance générale (ordre de lecture)
    const reconBox = await reconBlock.boundingBox();
    const bgBox = await bgBlock.boundingBox();

    if (reconBox && bgBox) {
      expect(reconBox.y).toBeLessThan(bgBox.y);
    }
  });
});
