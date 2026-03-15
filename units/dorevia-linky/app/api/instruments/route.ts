/**
 * GET /api/instruments
 * SPEC_LINKY_METRIC_ENGINE_v1.0 §6.2
 *
 * Retourne les valeurs calculées pour tous les instruments du cockpit.
 * Délègue au Metric Engine (DAG, cache, executor).
 *
 * Format compatible avec IconGrid (formatted, status, valueKind).
 */

import { NextRequest, NextResponse } from "next/server";
import { computeMetrics, vaultFetcher, getCacheStats } from "@/app/lib/metric-engine";
import type { ComputeParams } from "@/app/lib/metric-engine";
import type { ValueKind, CardStatusValue, KpiMetric } from "@/app/api/dashboard-metrics/route";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const LOCKED_TENANT = (process.env.TENANT_ID ?? "").trim();
const DEFAULT_TENANT = process.env.TENANT_ID ?? "core";

/** Mappe une métrique du Metric Engine vers le format KpiMetric (IconGrid-compatible) */
function toKpiMetric(value: number | null, formatted: string, status: string): KpiMetric {
  let valueKind: ValueKind = "neutral";
  if (value == null) valueKind = "neutral";
  else if (value > 0) valueKind = "positive";
  else if (value < 0) valueKind = "negative";
  else valueKind = "zero";

  let cardStatus: CardStatusValue = "neutral";
  if (status === "ok") cardStatus = "ok";
  else if (status === "error" || status === "stale") cardStatus = "watch";

  return { value, formatted, valueKind, status: cardStatus };
}

/**
 * GET /api/instruments
 * Paramètres : tenant, date_debut, date_fin, company_id
 */
export async function GET(request: NextRequest) {
  const startMs = Date.now();
  const { searchParams } = new URL(request.url);

  const requestedTenant = searchParams.get("tenant");
  if (LOCKED_TENANT && requestedTenant && requestedTenant !== LOCKED_TENANT) {
    return NextResponse.json(
      { error: "tenant_mismatch", requested: requestedTenant, effective: LOCKED_TENANT },
      { status: 400 }
    );
  }

  const params: ComputeParams = {
    tenant: LOCKED_TENANT || requestedTenant || DEFAULT_TENANT,
    company_id: searchParams.get("company_id") ?? null,
    date_debut: searchParams.get("date_debut") ?? "2000-01-01",
    date_fin: searchParams.get("date_fin") ?? "2030-12-31",
  };

  try {
    const metrics = await computeMetrics(params, vaultFetcher);

    const get = (id: string) => metrics.get(id);

    const instruments: Record<string, KpiMetric> = {
      treasury: toKpiMetric(
        get("treasury_balance")?.value ?? null,
        get("treasury_balance")?.formatted ?? "—",
        get("treasury_balance")?.status ?? "unavailable"
      ),
      business: toKpiMetric(
        get("commercial_margin")?.value ?? null,
        get("commercial_margin")?.formatted ?? "—",
        get("commercial_margin")?.status ?? "unavailable"
      ),
      cash: toKpiMetric(
        get("cash_flow_net")?.value ?? null,
        get("cash_flow_net")?.formatted ?? "—",
        get("cash_flow_net")?.status ?? "unavailable"
      ),
      taxes: toKpiMetric(
        get("tax_balance")?.value ?? null,
        get("tax_balance")?.formatted ?? "—",
        get("tax_balance")?.status ?? "unavailable"
      ),
      credit_notes: toKpiMetric(
        get("credit_notes_balance")?.value ?? null,
        get("credit_notes_balance")?.formatted ?? "—",
        get("credit_notes_balance")?.status ?? "unavailable"
      ),
      refunds: toKpiMetric(
        get("refunds_balance")?.value ?? null,
        get("refunds_balance")?.formatted ?? "—",
        get("refunds_balance")?.status ?? "unavailable"
      ),
      pos_shops: toKpiMetric(
        get("pos_sales_total")?.value ?? null,
        get("pos_sales_total")?.formatted ?? "—",
        get("pos_sales_total")?.status ?? "unavailable"
      ),
      working_capital: toKpiMetric(
        get("working_capital")?.value ?? null,
        get("working_capital")?.formatted ?? "—",
        get("working_capital")?.status ?? "unavailable"
      ),
      encours: (() => {
        const m = get("receivables_open");
        const km = toKpiMetric(m?.value ?? null, m?.formatted ?? "—", m?.status ?? "unavailable");
        // Encours : couleur neutre (accent/bleu) — l'encours n'est pas un problème en soi.
        if (km.valueKind === "positive") km.valueKind = "accent";
        return km;
      })(),
      // ebitda_full si payroll disponible, sinon proxy
      ebitda: (() => {
        const full = get("ebitda_full");
        const proxy = get("ebitda_proxy");
        const m = full?.status === "ok" ? full : proxy;
        return toKpiMetric(m?.value ?? null, m?.formatted ?? "—", m?.status ?? "unavailable");
      })(),
      // treasury_position = tuile Paiements (rapprochement) — non calculé par le Metric Engine pour l'instant
      treasury_position: { value: null, formatted: "—", valueKind: "neutral" as const },
      pos_z: { value: null, formatted: "—", valueKind: "placeholder" },
    };

    const engineStats = getCacheStats();

    return NextResponse.json(
      {
        instruments,
        _meta: {
          computed_at: new Date().toISOString(),
          latency_ms: Date.now() - startMs,
          engine: engineStats,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err) {
    console.error("[instruments] Error:", err);
    const empty: KpiMetric = { value: null, formatted: "—", valueKind: "neutral" };
    return NextResponse.json(
      {
        instruments: {},
        _error: err instanceof Error ? err.message : String(err),
        _meta: { computed_at: new Date().toISOString(), latency_ms: Date.now() - startMs },
      },
      { status: 500 }
    );
  }
}
