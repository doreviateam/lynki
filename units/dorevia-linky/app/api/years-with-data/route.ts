import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const AGG_TIMEOUT_MS = 25000; // 25s pour plage large 2000-2030
// Plage raisonnable pour discovery : année courante ± 10 ans (évite blocage 2000-2030)
const WIDE_FROM = (() => {
  const y = new Date().getFullYear() - 10;
  return `${y}-01-01`;
})();
const WIDE_TO = (() => {
  const y = new Date().getFullYear() + 2;
  return `${y}-12-31`;
})();

export const revalidate = 0;
export const dynamic = "force-dynamic";

/** Extrait années et mois (1..12) ayant des données depuis les séries */
function extractYearsAndMonthsFromSeries(
  series: { period?: string; amount?: number }[] | undefined
): { years: Set<number>; monthsByYear: Map<number, Set<number>> } {
  const years = new Set<number>();
  const monthsByYear = new Map<number, Set<number>>();
  if (!Array.isArray(series)) return { years, monthsByYear };
  for (const p of series) {
    const period = p?.period ?? "";
    if (!period) continue;
    const y = parseInt(period.substring(0, 4), 10);
    const m = parseInt(period.substring(5, 7), 10);
    if (Number.isNaN(y) || y < 2000 || y > 2030) continue;
    years.add(y);
    if (!Number.isNaN(m) && m >= 1 && m <= 12) {
      let set = monthsByYear.get(y);
      if (!set) {
        set = new Set();
        monthsByYear.set(y, set);
      }
      set.add(m);
    }
  }
  return { years, monthsByYear };
}

/**
 * GET /api/years-with-data — années contenant au moins une donnée (sales, purchases)
 * Paramètres : tenant, company_id (optionnel)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const companyId = searchParams.get("company_id") ?? "";

  const baseParams = new URLSearchParams({
    tenant,
    date_debut: WIDE_FROM,
    date_fin: WIDE_TO,
    granularity: "month",
    ...(companyId && { company_id: companyId }),
  });

  const urlSales = `${VAULT_URL.replace(/\/$/, "")}/ui/aggregations/sales?${baseParams}`;
  const urlPurchases = `${VAULT_URL.replace(/\/$/, "")}/ui/aggregations/purchases?${baseParams}`;
  const urlPaymentsIn = `${VAULT_URL.replace(/\/$/, "")}/ui/aggregations/payments-in?${baseParams}`;
  const urlPaymentsOut = `${VAULT_URL.replace(/\/$/, "")}/ui/aggregations/payments-out?${baseParams}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AGG_TIMEOUT_MS);

  try {
    const [salesRes, purchasesRes, paymentsInRes, paymentsOutRes] = await Promise.all([
      fetch(urlSales, { headers: { Accept: "application/json" }, cache: "no-store", signal: controller.signal }),
      fetch(urlPurchases, { headers: { Accept: "application/json" }, cache: "no-store", signal: controller.signal }),
      fetch(urlPaymentsIn, { headers: { Accept: "application/json" }, cache: "no-store", signal: controller.signal }),
      fetch(urlPaymentsOut, { headers: { Accept: "application/json" }, cache: "no-store", signal: controller.signal }),
    ]);
    clearTimeout(timeoutId);

    const years = new Set<number>();
    const monthsByYear = new Map<number, Set<number>>();

    const merge = (data: { years: Set<number>; monthsByYear: Map<number, Set<number>> }) => {
      Array.from(data.years).forEach((y) => years.add(y));
      data.monthsByYear.forEach((months, y) => {
        let target = monthsByYear.get(y);
        if (!target) {
          target = new Set<number>();
          monthsByYear.set(y, target);
        }
        Array.from(months).forEach((m) => target!.add(m));
      });
    };

    if (salesRes.ok) {
      const sales = await salesRes.json();
      merge(extractYearsAndMonthsFromSeries(sales?.series));
    }
    if (purchasesRes.ok) {
      const purchases = await purchasesRes.json();
      merge(extractYearsAndMonthsFromSeries(purchases?.series));
    }
    if (paymentsInRes.ok) {
      const paymentsIn = await paymentsInRes.json();
      merge(extractYearsAndMonthsFromSeries(paymentsIn?.series));
    }
    if (paymentsOutRes.ok) {
      const paymentsOut = await paymentsOutRes.json();
      merge(extractYearsAndMonthsFromSeries(paymentsOut?.series));
    }

    if (years.size === 0) {
      years.add(new Date().getFullYear());
    }

    const sorted = Array.from(years).sort((a, b) => b - a);
    const monthsWithDataByYear: Record<string, number[]> = {};
    monthsByYear.forEach((months, y) => {
      monthsWithDataByYear[String(y)] = Array.from(months).sort((a, b) => a - b);
    });
    return NextResponse.json({ years: sorted, monthsWithDataByYear });
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json({
      years: [new Date().getFullYear()],
      monthsWithDataByYear: {},
    });
  }
}
