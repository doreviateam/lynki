import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 10000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

/** Réponse Vault GET /ui/aggregations/treasury-series (spec §11) */
interface TreasurySeriesPoint {
  date: string;
  value: number;
  secondary?: { cash_erp?: number; coverage_ratio?: number };
  state?: string;
  /** Montants rapproché / à rapprocher par point (snapshots) */
  reconciled?: number;
  unreconciled?: number;
}

interface TreasurySeriesResponse {
  metric: string;
  granularity: string;
  currency: string;
  points: TreasurySeriesPoint[];
  partial_reason?: string | null;
}

/** Série pour le chart Linky (period = date du point, amount = value) */
export interface TreasuryEvolutionSeriesPoint {
  period: string;
  amount: number;
}

/**
 * GET /api/treasury-evolution — proxy vers Vault GET /ui/aggregations/treasury-series (ADR-0010, E2).
 * Query: tenant, company_id (optionnel), date_debut, date_fin.
 * Retourne une série { series: { period, amount }[] } pour le bloc Évolution Trésorerie.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const companyId = searchParams.get("company_id") ?? "";
  const dateDebut = searchParams.get("date_debut") ?? "";
  const dateFin = searchParams.get("date_fin") ?? "";

  if (!dateDebut || !dateFin) {
    return NextResponse.json(
      { error: "date_debut and date_fin are required", series: [] },
      { status: 400 }
    );
  }

  const qs = new URLSearchParams({
    tenant,
    date_debut: dateDebut,
    date_fin: dateFin,
  });
  if (companyId) qs.set("company_id", companyId);

  const vaultBase = VAULT_URL.replace(/\/$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${vaultBase}/ui/aggregations/treasury-series?${qs}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { series: [], error: res.status === 500 ? "Vault error" : undefined },
        { status: res.status >= 500 ? 503 : res.status }
      );
    }

    const data: TreasurySeriesResponse = await res.json();
    const points = data.points ?? [];
    const series: TreasuryEvolutionSeriesPoint[] = points.map((p) => ({
      period: p.date,
      amount: p.value,
    }));
    const seriesReconciled: TreasuryEvolutionSeriesPoint[] = points.map((p) => ({
      period: p.date,
      amount: typeof p.reconciled === "number" ? p.reconciled : 0,
    }));
    const seriesUnreconciled: TreasuryEvolutionSeriesPoint[] = points.map((p) => ({
      period: p.date,
      amount: typeof p.unreconciled === "number" ? p.unreconciled : 0,
    }));

    return NextResponse.json({
      series,
      series_reconciled: seriesReconciled,
      series_unreconciled: seriesUnreconciled,
      currency: data.currency ?? "EUR",
    });
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json({ series: [] }, { status: 503 });
  }
}
