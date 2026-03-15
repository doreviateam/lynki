import { NextRequest, NextResponse } from "next/server";
import type { SeriesPoint } from "@/app/types/aggregations";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const AGG_TIMEOUT_MS = 15000;

function getDefaultCompanyId(): string {
  const raw = process.env.COMPANY_DISPLAY_NAMES;
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const keys = Object.keys(parsed);
    return keys.length === 1 ? keys[0] : "";
  } catch {
    return "";
  }
}

function normalizeCompanyId(raw: string): string {
  const v = raw.trim();
  const m = v.match(/^odoo:(\d+)$/);
  return m ? m[1] : v;
}

export const revalidate = 0;
export const dynamic = "force-dynamic";

export interface EbeEvolutionResponse {
  series: SeriesPoint[];
  granularity: string;
  currency: string;
  payroll_unavailable?: boolean;
}

/**
 * GET /api/ebe-evolution — série EBE dérivée (ventes − achats − charges personnel) par période.
 * Appelle le Vault : sales, purchases, payroll avec granularity=month.
 * Politique d’erreur (PLAN_IMPLEMENTATION_DATA_EVOLUTION_VAULT_LINKY) :
 * - sales ou purchases manquant → 503
 * - payroll seul manquant → série partielle (EBE = ventes − achats), payroll_unavailable: true
 * - tout manquant → 503
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? process.env.TENANT_ID ?? DEFAULT_TENANT;
  const date_debut = searchParams.get("date_debut") ?? "2000-01-01";
  const date_fin = searchParams.get("date_fin") ?? "2030-12-31";
  const company_id = normalizeCompanyId(searchParams.get("company_id") ?? getDefaultCompanyId());
  const granularity = (searchParams.get("granularity") ?? "month") as "day" | "week" | "month";
  const safeGranularity = ["day", "week", "month"].includes(granularity) ? granularity : "month";

  const params = new URLSearchParams({
    tenant,
    date_debut,
    date_fin,
    granularity: safeGranularity,
    ...(company_id && { company_id }),
  });

  const base = VAULT_URL.replace(/\/$/, "");
  const urls = [
    `${base}/ui/aggregations/sales?${params.toString()}`,
    `${base}/ui/aggregations/purchases?${params.toString()}`,
    `${base}/ui/aggregations/payroll?${params.toString()}`,
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AGG_TIMEOUT_MS);

  try {
    const [salesRes, purchasesRes, payrollRes] = await Promise.all(
      urls.map((url) =>
        fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: controller.signal })
      )
    );
    clearTimeout(timeoutId);

    const [salesData, purchasesData, payrollData] = await Promise.all([
      salesRes.ok ? salesRes.json().catch(() => null) : null,
      purchasesRes.ok ? purchasesRes.json().catch(() => null) : null,
      payrollRes.ok ? payrollRes.json().catch(() => null) : null,
    ]);

    // Politique d’erreur : sales ou purchases manquant → erreur
    if (!salesData || typeof (salesData as { total_ht?: number }).total_ht !== "number") {
      return NextResponse.json(
        { error: "Agrégation ventes indisponible" },
        { status: 503 }
      );
    }
    if (!purchasesData || typeof (purchasesData as { total_ht?: number }).total_ht !== "number") {
      return NextResponse.json(
        { error: "Agrégation achats indisponible" },
        { status: 503 }
      );
    }

    const salesSeries = (salesData as { series?: SeriesPoint[] }).series ?? [];
    const purchasesSeries = (purchasesData as { series?: SeriesPoint[] }).series ?? [];
    const payrollSeries = (payrollData as { series?: SeriesPoint[] })?.series ?? [];

    const byPeriod = new Map<string, { sales: number; purchases: number; payroll: number }>();
    for (const p of salesSeries) {
      const cur = byPeriod.get(p.period) ?? { sales: 0, purchases: 0, payroll: 0 };
      cur.sales = p.amount;
      byPeriod.set(p.period, cur);
    }
    for (const p of purchasesSeries) {
      const cur = byPeriod.get(p.period) ?? { sales: 0, purchases: 0, payroll: 0 };
      cur.purchases = Math.abs(p.amount);
      byPeriod.set(p.period, cur);
    }
    for (const p of payrollSeries) {
      const cur = byPeriod.get(p.period) ?? { sales: 0, purchases: 0, payroll: 0 };
      cur.payroll = p.amount;
      byPeriod.set(p.period, cur);
    }

    const periods = Array.from(byPeriod.keys()).sort();
    const series: SeriesPoint[] = periods.map((period) => {
      const d = byPeriod.get(period)!;
      return {
        period,
        amount: d.sales - d.purchases - d.payroll,
      };
    });

    const currency =
      (salesData as { currency?: string }).currency ??
      (purchasesData as { currency?: string }).currency ??
      "EUR";
    const payroll_unavailable = !payrollData || !Array.isArray((payrollData as { series?: unknown }).series);

    const body: EbeEvolutionResponse = {
      series,
      granularity: safeGranularity,
      currency,
      ...(payroll_unavailable && { payroll_unavailable: true }),
    };
    return NextResponse.json(body);
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }
}
