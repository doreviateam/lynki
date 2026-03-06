import type { CertifiedRatio, CertifiedRatioPurchases } from "@/app/types/aggregations";

const ODOO_METRICS_URL = process.env.ODOO_METRICS_URL || "";
const ODOO_POSTED_SALES_COUNT = process.env.ODOO_POSTED_SALES_COUNT;
const ODOO_POSTED_PURCHASES_COUNT = process.env.ODOO_POSTED_PURCHASES_COUNT;

export interface PeriodParams {
  date_debut: string;
  date_fin: string;
}

/**
 * Appel GET vers Odoo avec optionnellement date_debut et date_fin (période).
 * Si l’URL supporte les query params (ex. /dorevia/vault/linky_metrics), retourne les comptes sur la période.
 */
async function fetchOdooMetrics(period?: PeriodParams): Promise<{
  posted_sales_count: number | null;
  posted_purchases_count: number | null;
}> {
  if (!ODOO_METRICS_URL) {
    return { posted_sales_count: null, posted_purchases_count: null };
  }
  const url = period
    ? `${ODOO_METRICS_URL}${ODOO_METRICS_URL.includes("?") ? "&" : "?"}date_debut=${encodeURIComponent(period.date_debut)}&date_fin=${encodeURIComponent(period.date_fin)}`
    : ODOO_METRICS_URL;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return { posted_sales_count: null, posted_purchases_count: null };
    const data = (await res.json()) as {
      posted_sales_count?: number;
      posted_purchases_count?: number;
    };
    const sales =
      typeof data.posted_sales_count === "number" && data.posted_sales_count >= 0
        ? data.posted_sales_count
        : null;
    const purchases =
      typeof data.posted_purchases_count === "number" && data.posted_purchases_count >= 0
        ? data.posted_purchases_count
        : null;
    return { posted_sales_count: sales, posted_purchases_count: purchases };
  } catch {
    return { posted_sales_count: null, posted_purchases_count: null };
  }
}

/**
 * Récupère le nombre de factures de vente postées dans Odoo (dénominateur du ratio Certifié).
 * - Si period est fourni et ODOO_METRICS_URL : GET avec date_debut/date_fin (compte sur la période).
 * - Sinon si ODOO_POSTED_SALES_COUNT : valeur globale (env).
 * - Sinon si ODOO_METRICS_URL sans période : GET global.
 */
export async function fetchPostedSalesCount(period?: PeriodParams): Promise<CertifiedRatio> {
  if (!period && ODOO_POSTED_SALES_COUNT !== undefined && ODOO_POSTED_SALES_COUNT !== "") {
    const n = parseInt(ODOO_POSTED_SALES_COUNT, 10);
    if (!Number.isNaN(n) && n >= 0) return { posted_sales_count: n };
  }
  const metrics = await fetchOdooMetrics(period);
  return { posted_sales_count: metrics.posted_sales_count };
}

/**
 * Récupère le nombre de factures d’achat postées dans Odoo (dénominateur du ratio Certifié Achats).
 * - Si period est fourni et ODOO_METRICS_URL : GET avec date_debut/date_fin (compte sur la période).
 * - Sinon si ODOO_POSTED_PURCHASES_COUNT : valeur globale (env).
 */
export async function fetchPostedPurchasesCount(period?: PeriodParams): Promise<CertifiedRatioPurchases> {
  if (!period && ODOO_POSTED_PURCHASES_COUNT !== undefined && ODOO_POSTED_PURCHASES_COUNT !== "") {
    const n = parseInt(ODOO_POSTED_PURCHASES_COUNT, 10);
    if (!Number.isNaN(n) && n >= 0) return { posted_purchases_count: n };
  }
  const metrics = await fetchOdooMetrics(period);
  return { posted_purchases_count: metrics.posted_purchases_count };
}
