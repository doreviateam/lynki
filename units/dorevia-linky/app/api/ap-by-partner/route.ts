import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const AGG_TIMEOUT_MS = 10000;

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

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * GET /api/ap-by-partner — proxy vers Vault GET /ui/aggregations/ap-by-partner
 * Dettes fournisseurs ouvertes (in_invoice, amount_residual > 0), groupées par fournisseur.
 * Paramètres : tenant, date_debut, date_fin, as_of_date, company_id, overdue (bool), limit
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const date_debut = searchParams.get("date_debut") ?? "2000-01-01";
  const date_fin = searchParams.get("date_fin") ?? "2030-12-31";
  const as_of_date = searchParams.get("as_of_date") ?? "";
  const company_id = searchParams.get("company_id") ?? getDefaultCompanyId();
  const overdue = searchParams.get("overdue") ?? "false";
  const limit = searchParams.get("limit") ?? "50";

  const params = new URLSearchParams({
    tenant,
    date_debut,
    date_fin,
    ...(as_of_date && { as_of_date }),
    ...(company_id && { company_id }),
    overdue,
    limit,
  });
  const url = `${VAULT_URL.replace(/\/$/, "")}/ui/aggregations/ap-by-partner?${params.toString()}`;
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
