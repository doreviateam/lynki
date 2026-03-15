/**
 * Tests unitaires — Metric Engine : Executor
 * Couvre les métriques ajoutées : payables_open, payroll_charges,
 * working_capital (BFR réel AR−AP), ebitda_full.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { computeMetrics } from "../../app/lib/metric-engine/executor";
import { cacheClear } from "../../app/lib/metric-engine/cache";
import type { MetricDataFetcher, ComputeParams } from "../../app/lib/metric-engine/types";

// ── Fetcher mock ────────────────────────────────────────────────

function makeMockFetcher(overrides: Partial<MetricDataFetcher> = {}): MetricDataFetcher {
  return {
    fetchSales: async () => ({ total_ht: 100_000, total_tax: 20_000, currency: "EUR" }),
    fetchPurchases: async () => ({ total_ht: 40_000, total_tax: 8_000, currency: "EUR" }),
    fetchPaymentsIn: async () => ({ total: 80_000, currency: "EUR" }),
    fetchPaymentsOut: async () => ({ total: 30_000, currency: "EUR" }),
    fetchArByPartner: async () => ({ totals: { open_amount: 25_000, overdue_amount: 5_000 } }),
    fetchApByPartner: async () => ({ totals: { open_amount: 10_000, overdue_amount: 2_000 } }),
    fetchTreasury: async () => ({ position: { validated_balance: 50_000 }, reconciliation_metrics: { remaining_ratio: 0.1 } }),
    fetchAdjustments: async () => ({ total_amount: 1_000, currency: "EUR" }),
    fetchPosSessions: async () => ({ items: [{ total_sales: 5_000, vault_status: "sealed" }] }),
    fetchPayroll: async () => ({ total_charges: 15_000, payslip_count: 5, currency: "EUR" }),
    ...overrides,
  };
}

const params: ComputeParams = {
  tenant: "test",
  company_id: null,
  date_debut: "2026-01-01",
  date_fin: "2026-03-31",
};

beforeEach(() => {
  cacheClear();
});

// ── payables_open ───────────────────────────────────────────────

describe("payables_open", () => {
  it("retourne le montant AP ouvert depuis fetchApByPartner", async () => {
    const metrics = await computeMetrics(params, makeMockFetcher());
    const m = metrics.get("payables_open");
    expect(m?.status).toBe("ok");
    expect(m?.value).toBe(10_000);
  });

  it("retourne unavailable si fetchApByPartner null", async () => {
    const metrics = await computeMetrics(
      params,
      makeMockFetcher({ fetchApByPartner: async () => null })
    );
    const m = metrics.get("payables_open");
    expect(m?.status).toBe("unavailable");
    expect(m?.value).toBeNull();
  });
});

// ── payroll_charges ─────────────────────────────────────────────

describe("payroll_charges", () => {
  it("retourne total_charges quand payslip_count > 0", async () => {
    const metrics = await computeMetrics(params, makeMockFetcher());
    const m = metrics.get("payroll_charges");
    expect(m?.status).toBe("ok");
    expect(m?.value).toBe(15_000);
  });

  it("retourne unavailable si aucun bulletin (payslip_count = 0)", async () => {
    const metrics = await computeMetrics(
      params,
      makeMockFetcher({ fetchPayroll: async () => ({ total_charges: 0, payslip_count: 0, currency: "EUR" }) })
    );
    const m = metrics.get("payroll_charges");
    expect(m?.status).toBe("unavailable");
  });

  it("retourne unavailable si fetchPayroll null", async () => {
    const metrics = await computeMetrics(
      params,
      makeMockFetcher({ fetchPayroll: async () => null })
    );
    const m = metrics.get("payroll_charges");
    expect(m?.status).toBe("unavailable");
  });
});

// ── working_capital (BFR réel AR − AP) ─────────────────────────

describe("working_capital", () => {
  it("calcule BFR = AR − AP quand les deux sont disponibles", async () => {
    const metrics = await computeMetrics(params, makeMockFetcher());
    const m = metrics.get("working_capital");
    expect(m?.status).toBe("ok");
    expect(m?.value).toBe(25_000 - 10_000); // 15 000
  });

  it("utilise AR only si AP non disponible (proxy)", async () => {
    const metrics = await computeMetrics(
      params,
      makeMockFetcher({ fetchApByPartner: async () => null })
    );
    const m = metrics.get("working_capital");
    expect(m?.status).toBe("ok");
    expect(m?.value).toBe(25_000); // proxy = AR only
  });

  it("retourne unavailable si AR non disponible", async () => {
    const metrics = await computeMetrics(
      params,
      makeMockFetcher({ fetchArByPartner: async () => null })
    );
    const m = metrics.get("working_capital");
    expect(m?.status).toBe("unavailable");
  });

  it("BFR peut être négatif si AP > AR", async () => {
    const metrics = await computeMetrics(
      params,
      makeMockFetcher({
        fetchArByPartner: async () => ({ totals: { open_amount: 5_000, overdue_amount: 0 } }),
        fetchApByPartner: async () => ({ totals: { open_amount: 20_000, overdue_amount: 0 } }),
      })
    );
    const m = metrics.get("working_capital");
    expect(m?.status).toBe("ok");
    expect(m?.value).toBe(5_000 - 20_000); // -15 000
  });
});

// ── ebitda_full ─────────────────────────────────────────────────

describe("ebitda_full", () => {
  it("calcule EBE complet = marge + avoirs − charges", async () => {
    const metrics = await computeMetrics(params, makeMockFetcher());
    const m = metrics.get("ebitda_full");
    expect(m?.status).toBe("ok");
    // commercial_margin = 100000 - 40000 = 60000
    // credit_notes_balance = adjustments_supplier - adjustments_client = 1000 - 1000 = 0
    // ebitda_proxy = 60000 + 0 = 60000
    // ebitda_full = 60000 - 15000 = 45000
    expect(m?.value).toBe(45_000);
  });

  it("retourne unavailable si payroll non disponible", async () => {
    const metrics = await computeMetrics(
      params,
      makeMockFetcher({ fetchPayroll: async () => null })
    );
    const m = metrics.get("ebitda_full");
    expect(m?.status).toBe("unavailable");
  });

  it("retourne unavailable si marge commerciale indisponible", async () => {
    const metrics = await computeMetrics(
      params,
      makeMockFetcher({
        fetchSales: async () => null,
        fetchPurchases: async () => null,
      })
    );
    const m = metrics.get("ebitda_full");
    expect(m?.status).toBe("unavailable");
  });

  it("EBE complet peut être négatif si charges > marge", async () => {
    const metrics = await computeMetrics(
      params,
      makeMockFetcher({
        fetchSales: async () => ({ total_ht: 10_000, total_tax: 2_000, currency: "EUR" }),
        fetchPurchases: async () => ({ total_ht: 8_000, total_tax: 1_600, currency: "EUR" }),
        fetchPayroll: async () => ({ total_charges: 5_000, payslip_count: 2, currency: "EUR" }),
      })
    );
    const m = metrics.get("ebitda_full");
    // marge = 10000 - 8000 = 2000; EBE = 2000 - 5000 = -3000
    expect(m?.status).toBe("ok");
    expect(m?.value).toBeLessThan(0);
  });
});

// ── ebitda_proxy (inchangé) ─────────────────────────────────────

describe("ebitda_proxy (non-régression)", () => {
  it("ebitda_proxy disponible même sans payroll", async () => {
    const metrics = await computeMetrics(
      params,
      makeMockFetcher({ fetchPayroll: async () => null })
    );
    const proxy = metrics.get("ebitda_proxy");
    expect(proxy?.status).toBe("ok");
    expect(proxy?.value).toBeDefined();
  });
});
