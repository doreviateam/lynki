import { test, expect } from "@playwright/test";

/** Glob Playwright pour matcher toutes les requêtes /api/dashboard-metrics (robuste Chromium/CI) */
const DASHBOARD_METRICS_GLOB = "**/api/dashboard-metrics*";

const mockMetricsIncomplete = {
  treasury: { value: null, formatted: "-", valueKind: "neutral" },
  cash: { value: 0, formatted: "+ 0 EUR", valueKind: "zero" },
  business: { value: 0, formatted: "+ 0 EUR", valueKind: "zero" },
  taxes: { value: 0, formatted: "+ 0 EUR", valueKind: "zero" },
  credit_notes: { value: 0, formatted: "+ 0 EUR", valueKind: "zero" },
  refunds: { value: 0, formatted: "+ 0 EUR", valueKind: "zero" },
  pos_shops: { value: 0, formatted: "0 EUR", valueKind: "neutral" },
  pos_z: { value: null, formatted: "-", valueKind: "placeholder" },
  sealed_count: 223,
  sealed_count_complete: false,
  sealed_count_sources: {
    sales: true,
    purchases: false,
    paymentsIn: true,
    paymentsOut: true,
    pos: true,
  },
};

const mockMetricsComplete = {
  ...mockMetricsIncomplete,
  treasury: { value: 85, formatted: "85 %", valueKind: "accent" },
  _details: {
    treasury: { reconciled: 1000, unreconciled: 100, total: 1100, currency: "EUR" },
    cash: { encaissements: 500, decaissements: 200, net: 300, currency: "EUR" },
  },
  sealed_count: 516,
  sealed_count_complete: true,
  expected_count: 516,
  sealed_count_sources: {
    sales: true,
    purchases: true,
    paymentsIn: true,
    paymentsOut: true,
    pos: true,
  },
};

test.describe("Completude AT1-AT8", () => {
  test("AT1 — Blocage strict si incomplet", async ({ page }) => {
    await page.addInitScript(() => sessionStorage.clear());
    await page.route(DASHBOARD_METRICS_GLOB, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMetricsIncomplete),
      })
    );
    await page.goto("/");
    const syncInProgress = page.getByTestId("sync-in-progress");
    await expect(syncInProgress).toBeVisible({ timeout: 15000 });
    // Accepte les deux variantes : "des preuves en cours" ou "en cours… Vous pouvez réessayer"
    await expect(syncInProgress).toContainText(/Synchronisation.*en cours/);
    await expect(syncInProgress.getByTestId("sync-progression")).toContainText("223");
  });

  test("AT2 — Blocage pendant loading", async ({ page }) => {
    let resolveRequest: () => void = () => {};
    const requestPromise = new Promise<void>((r) => {
      resolveRequest = r;
    });
    await page.route(DASHBOARD_METRICS_GLOB, async (route) => {
      await requestPromise;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMetricsComplete),
      });
    });
    const nav = page.goto("/");
    await page.waitForTimeout(500);
    const syncInProgress = page.getByTestId("sync-in-progress");
    await expect(syncInProgress).toBeVisible({ timeout: 5000 });
    resolveRequest();
    await nav;
  });

  test("AT3 — Incomplet ou erreur : bouton Réessayer visible", async ({ page }) => {
    await page.addInitScript(() => sessionStorage.clear());
    // Données incomplètes : setAttemptCount dans .then() → canRetry (attemptCount >= 1) → bouton Réessayer
    await page.route(DASHBOARD_METRICS_GLOB, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMetricsIncomplete),
      })
    );
    await page.goto("/");
    await expect(page.getByTestId("sync-in-progress")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("sync-retry-button")).toBeVisible({ timeout: 10000 });
  });

  test("AT4 — Reessayer relance le fetch", async ({ page }) => {
    await page.addInitScript(() => sessionStorage.clear());
    let phase: "incomplete" | "complete" = "incomplete";
    await page.route(DASHBOARD_METRICS_GLOB, (route) => {
      const body = phase === "complete" ? mockMetricsComplete : mockMetricsIncomplete;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });
    await page.goto("/");
    await expect(page.getByTestId("sync-in-progress")).toBeVisible({ timeout: 15000 });
    const retryBtn = page.getByTestId("sync-retry-button");
    await expect(retryBtn).toBeVisible({ timeout: 10000 });
    phase = "complete";
    await retryBtn.click();
    await expect(page.locator("main").filter({ hasText: /Cash|Business/ })).toBeVisible({
      timeout: 15000,
    });
  });

  test("AT5 — Badge neutre quand incomplet", async ({ page }) => {
    await page.route(DASHBOARD_METRICS_GLOB, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMetricsIncomplete),
      })
    );
    await page.goto("/");
    await expect(page.getByTestId("sync-in-progress")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=preuves (partiel)")).not.toBeVisible();
  });

  test("AT6 — Cache invalide au changement de scope", async ({ page }) => {
    let fetchCount = 0;
    await page.route(DASHBOARD_METRICS_GLOB, (route) => {
      fetchCount += 1;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMetricsComplete),
      });
    });
    await page.goto("/");
    await expect(page.locator("main").filter({ hasText: /Cash|Business/ })).toBeVisible({
      timeout: 10000,
    });
    const selectCompany = page.locator("select[aria-label='Société'], #company-select-mobile").first();
    const opts = await selectCompany.locator("option").all();
    if (opts.length >= 2) {
      await selectCompany.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await selectCompany.selectOption({ index: 0 });
      await page.waitForTimeout(500);
      expect(fetchCount).toBeGreaterThanOrEqual(2);
    }
  });

  test("AT7 — Happy path : cartes visibles", async ({ page }) => {
    await page.route(DASHBOARD_METRICS_GLOB, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMetricsComplete),
      })
    );
    await page.goto("/");
    await expect(page.getByTestId("sync-in-progress")).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator("main").filter({ hasText: /Cash|Business/ })).toBeVisible({ timeout: 10000 });
  });

  test("AT8 — Transition SyncInProgress vers cartes sans refresh", async ({ page }) => {
    let callCount = 0;
    await page.route(DASHBOARD_METRICS_GLOB, (route) => {
      callCount += 1;
      const body = callCount >= 2 ? mockMetricsComplete : mockMetricsIncomplete;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });
    await page.goto("/");
    await expect(page.getByTestId("sync-in-progress")).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(3500);
    await expect(page.getByTestId("sync-in-progress")).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator("main").filter({ hasText: /Cash|Business/ })).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Completude Sprint 2 (AT9, AT11, AT12)", () => {
  test("AT9 — Stabilité sealed_count au refresh", async ({ page }) => {
    const stablePayload = { ...mockMetricsComplete, sealed_count: 100, expected_count: 100 };
    await page.route(DASHBOARD_METRICS_GLOB, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(stablePayload),
      })
    );
    await page.goto("/");
    await expect(page.locator("main").filter({ hasText: /Cash|Business/ })).toBeVisible({ timeout: 10000 });
    const badgeWith100 = page.locator("text=100 preuves").first();
    await expect(badgeWith100).toBeVisible({ timeout: 5000 });
    await page.reload();
    await expect(page.locator("main").filter({ hasText: /Cash|Business/ })).toBeVisible({ timeout: 10000 });
    await expect(badgeWith100).toBeVisible({ timeout: 5000 });
  });

  test("AT11 — Progression X / Y quand expected_count connu", async ({ page }) => {
    const incompleteWithExpected = { ...mockMetricsIncomplete, expected_count: 500 };
    await page.route(DASHBOARD_METRICS_GLOB, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(incompleteWithExpected),
      })
    );
    await page.goto("/");
    await expect(page.getByTestId("sync-in-progress")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("sync-progression")).toContainText("223");
    await expect(page.getByTestId("sync-progression")).toContainText("500");
  });

  test("AT12 — Fallback 5 endpoints si snapshot indisponible — blocage conservé", async ({ page }) => {
    await page.route(DASHBOARD_METRICS_GLOB, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMetricsIncomplete),
      })
    );
    await page.goto("/");
    await expect(page.getByTestId("sync-in-progress")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("main").filter({ hasText: /Cash|Business/ })).not.toBeVisible();
  });

  test("AT10 — Matérialisation à l'événement : snapshot mis à jour après scellement simulé", async ({ page }) => {
    await page.addInitScript(() => sessionStorage.clear());
    // Mock platform/status pour que IntegrityBadge affiche le label (sinon affiche "—" en attente)
    await page.route("**/api/platform/status*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ integrity_state: "STATE_OK", sealed_pct: 100 }),
      })
    );
    let callCount = 0;
    let phase: "initial" | "after-reload" = "initial";
    await page.route(DASHBOARD_METRICS_GLOB, (route) => {
      callCount += 1;
      // Phase "after-reload" : bascule après le reload du test (détecté via navigation)
      const sealed = phase === "after-reload" ? 101 : 100;
      const payload = {
        ...mockMetricsComplete,
        sealed_count: sealed,
        expected_count: sealed,
      };
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });
    await page.goto("/");
    await expect(page.locator("main").filter({ hasText: /Cash|Business/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("integrity-badge-label").first()).toContainText("100 preuves", { timeout: 5000 });
    // Bascule pour simuler un nouveau snapshot (scellement) après reload
    phase = "after-reload";
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await expect(page.locator("main").filter({ hasText: /Cash|Business/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("integrity-badge-label").first()).toContainText("101 preuves", { timeout: 5000 });
  });
});
