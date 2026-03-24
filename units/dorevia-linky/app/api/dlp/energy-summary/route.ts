import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 10000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * GET /api/dlp/energy-summary — proxy vers Vault /ui/dlp/energy-summary (ADR-001, ZeDocs/web51).
 * Paramètres : tenant, period_days (30/60/90), company_id (optionnel)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const periodDays = searchParams.get("period_days") ?? "90";
  const companyId = searchParams.get("company_id") ?? "";

  const qs = new URLSearchParams({ tenant, period_days: periodDays });
  if (companyId) qs.set("company_id", companyId);

  const base = VAULT_URL.replace(/\/$/, "");
  const url = `${base}/ui/dlp/energy-summary?${qs}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "X-Tenant": tenant },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        {
          dlp_active_count: 0,
          hits_total: 0,
          period_days: parseInt(periodDays, 10) || 90,
          by_perimeter: [],
          by_company: [],
          error: err || res.statusText,
        },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    clearTimeout(timeoutId);
    return NextResponse.json(
      {
        dlp_active_count: 0,
        hits_total: 0,
        period_days: parseInt(periodDays, 10) || 90,
        by_perimeter: [],
        by_company: [],
        error: String(e),
      },
      { status: 503 }
    );
  }
}
