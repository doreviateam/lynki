import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const AGG_TIMEOUT_MS = 10000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * GET /api/payments-in — proxy vers Vault GET /ui/aggregations/payments-in
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const date_debut = searchParams.get("date_debut") ?? "2000-01-01";
  const date_fin = searchParams.get("date_fin") ?? "2030-12-31";
  const granularity = searchParams.get("granularity") ?? "month";
  const company_id = searchParams.get("company_id") ?? "";

  const params = new URLSearchParams({
    tenant,
    date_debut,
    date_fin,
    granularity,
    ...(company_id && { company_id }),
  });
  const url = `${VAULT_URL.replace(/\/$/, "")}/ui/aggregations/payments-in?${params.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AGG_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.error ?? "Erreur Vault" }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }
}
