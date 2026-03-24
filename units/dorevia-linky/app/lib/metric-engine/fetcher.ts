/**
 * Metric Engine — Vault Fetcher
 * Implémentation du MetricDataFetcher pour le Vault Linky.
 * SPEC_LINKY_METRIC_ENGINE_v1.0 §6
 */

import type { MetricDataFetcher, ComputeParams } from "./types";

const VAULT_URL = (process.env.VAULT_URL ?? "http://localhost:8080").replace(/\/$/, "");
const TIMEOUT_MS = 8000;

async function fetchJson(path: string, params: URLSearchParams): Promise<unknown | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${VAULT_URL}${path}?${params}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return res.ok ? res.json() : null;
  } catch {
    clearTimeout(t);
    return null;
  }
}

function baseParams(p: ComputeParams): URLSearchParams {
  const params = new URLSearchParams({
    tenant: p.tenant,
    date_debut: p.date_debut,
    date_fin: p.date_fin,
    granularity: "month",
  });
  if (p.company_id) params.set("company_id", p.company_id);
  return params;
}

export const vaultFetcher: MetricDataFetcher = {
  async fetchSales(p) {
    const res = await fetchJson("/ui/aggregations/sales", baseParams(p));
    if (!res || typeof res !== "object") return null;
    const r = res as Record<string, unknown>;
    return {
      total_ht: typeof r.total_ht === "number" ? r.total_ht : (typeof r.total === "number" ? r.total : 0),
      total_tax: typeof r.total_tax === "number" ? r.total_tax : 0,
      currency: typeof r.currency === "string" ? r.currency : "EUR",
    };
  },

  async fetchPurchases(p) {
    const res = await fetchJson("/ui/aggregations/purchases", baseParams(p));
    if (!res || typeof res !== "object") return null;
    const r = res as Record<string, unknown>;
    return {
      total_ht: typeof r.total_ht === "number" ? r.total_ht : (typeof r.total === "number" ? r.total : 0),
      total_tax: typeof r.total_tax === "number" ? r.total_tax : 0,
      currency: typeof r.currency === "string" ? r.currency : "EUR",
    };
  },

  async fetchPaymentsIn(p) {
    const res = await fetchJson("/ui/aggregations/payments-in", baseParams(p));
    if (!res || typeof res !== "object") return null;
    const r = res as Record<string, unknown>;
    return {
      total: typeof r.total === "number" ? r.total : 0,
      currency: typeof r.currency === "string" ? r.currency : "EUR",
    };
  },

  async fetchPaymentsOut(p) {
    const res = await fetchJson("/ui/aggregations/payments-out", baseParams(p));
    if (!res || typeof res !== "object") return null;
    const r = res as Record<string, unknown>;
    return {
      total: typeof r.total === "number" ? r.total : 0,
      currency: typeof r.currency === "string" ? r.currency : "EUR",
    };
  },

  async fetchArByPartner(p) {
    const params = new URLSearchParams({
      tenant: p.tenant,
      date_debut: p.date_debut,
      date_fin: p.date_fin,
      overdue: "false",
      limit: "1",
    });
    if (p.company_id) params.set("company_id", p.company_id);
    const res = await fetchJson("/ui/aggregations/ar-by-partner", params);
    if (!res || typeof res !== "object") return null;
    const r = res as Record<string, unknown>;
    const totals = r.totals as Record<string, unknown> | undefined;
    return {
      totals: {
        open_amount: typeof totals?.open_amount === "number" ? totals.open_amount : 0,
        overdue_amount: typeof totals?.overdue_amount === "number" ? totals.overdue_amount : 0,
      },
    };
  },

  async fetchTreasury(p) {
    const params = new URLSearchParams({ tenant: p.tenant, date_debut: p.date_debut, date_fin: p.date_fin });
    if (p.company_id) params.set("company_id", p.company_id);
    const res = await fetchJson("/ui/aggregations/treasury", params);
    if (!res || typeof res !== "object") return null;
    return res as Parameters<MetricDataFetcher["fetchTreasury"]>[0] extends Promise<infer R> ? NonNullable<R> : never;
  },

  async fetchAdjustments(p, event_type) {
    const params = new URLSearchParams({
      ...Object.fromEntries(baseParams(p)),
      event_type,
    });
    const res = await fetchJson("/ui/aggregations/adjustments", params);
    if (!res || typeof res !== "object") return null;
    const r = res as Record<string, unknown>;
    return {
      total_amount: typeof r.total_amount === "number" ? r.total_amount : (typeof r.total === "number" ? r.total : 0),
      currency: typeof r.currency === "string" ? r.currency : "EUR",
    };
  },

  async fetchApByPartner(p) {
    const params = new URLSearchParams({
      tenant: p.tenant,
      date_debut: p.date_debut,
      date_fin: p.date_fin,
      overdue: "false",
      limit: "1",
    });
    if (p.company_id) params.set("company_id", p.company_id);
    const res = await fetchJson("/ui/aggregations/ap-by-partner", params);
    if (!res || typeof res !== "object") return null;
    const r = res as Record<string, unknown>;
    const totals = r.totals as Record<string, unknown> | undefined;
    return {
      totals: {
        open_amount: typeof totals?.open_amount === "number" ? totals.open_amount : 0,
        overdue_amount: typeof totals?.overdue_amount === "number" ? totals.overdue_amount : 0,
      },
    };
  },

  async fetchStockValuation(p) {
    if (!p.company_id) return null;
    const params = new URLSearchParams({ tenant: p.tenant, company_id: p.company_id });
    const res = await fetchJson("/ui/aggregations/stock-valuation", params);
    if (!res || typeof res !== "object") return null;
    const r = res as Record<string, unknown>;
    const value = typeof r.value === "number" ? r.value : null;
    if (value == null) return null;
    return {
      value,
      currency: typeof r.currency === "string" ? r.currency : "EUR",
      as_of_date: typeof r.as_of_date === "string" ? r.as_of_date : "",
    };
  },

  async fetchPayroll(p) {
    const params = new URLSearchParams({
      tenant: p.tenant,
      date_debut: p.date_debut,
      date_fin: p.date_fin,
    });
    if (p.company_id) params.set("company_id", p.company_id);
    const res = await fetchJson("/ui/aggregations/payroll", params);
    if (!res || typeof res !== "object") return null;
    const r = res as Record<string, unknown>;
    return {
      total_charges: typeof r.total_charges === "number" ? r.total_charges : 0,
      payslip_count: typeof r.payslip_count === "number" ? r.payslip_count : 0,
      currency: typeof r.currency === "string" ? r.currency : "EUR",
    };
  },

  async fetchPosSessions(p) {
    const params = new URLSearchParams({ tenant: p.tenant, date_debut: p.date_debut, date_fin: p.date_fin });
    const res = await fetchJson("/ui/aggregations/pos-sessions", params);
    if (!res || typeof res !== "object") return null;
    const r = res as Record<string, unknown>;
    return {
      items: Array.isArray(r.items)
        ? (r.items as Array<Record<string, unknown>>).map((s) => ({
            total_sales: typeof s.total_sales === "number" ? s.total_sales : 0,
            vault_status: typeof s.vault_status === "string" ? s.vault_status : "unknown",
          }))
        : [],
    };
  },
};
