import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 10000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * GET /api/ar-evolution — proxy vers Vault GET /ui/aggregations/ar-series (ADR-0010, E3).
 * Retourne { series: { period, amount }[] } pour le bloc Évolution Encours (receivables_overdue).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const companyId = searchParams.get("company_id") ?? "";
  const dateDebut = searchParams.get("date_debut") ?? "";
  const dateFin = searchParams.get("date_fin") ?? "";

  if (!dateDebut || !dateFin) {
    return NextResponse.json({ error: "date_debut and date_fin are required", series: [] }, { status: 400 });
  }

  const qs = new URLSearchParams({ tenant, date_debut: dateDebut, date_fin: dateFin });
  if (companyId) qs.set("company_id", companyId);

  const vaultBase = VAULT_URL.replace(/\/$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${vaultBase}/ui/aggregations/ar-series?${qs}`, {
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
    const data = await res.json();
    const series = (data.points ?? []).map((p: { date: string; value: number }) => ({
      period: p.date,
      amount: p.value,
    }));
    return NextResponse.json({ series, currency: data.currency ?? "EUR" });
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json({ series: [] }, { status: 503 });
  }
}
