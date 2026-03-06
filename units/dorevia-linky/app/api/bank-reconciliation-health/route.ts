import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 5000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * GET /api/bank-reconciliation-health — proxy vers Vault GET /ui/system/bank-reconciliation-health
 * SPEC_INDICATEUR_CONFIANCE_RAPPROCHEMENT_BANCAIRE_LINKY v1.0
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const companyId = searchParams.get("company_id") ?? "";

  const qs = new URLSearchParams({ tenant });
  if (companyId) qs.set("company_id", companyId);
  const url = `${VAULT_URL.replace(/\/$/, "")}/ui/system/bank-reconciliation-health?${qs}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return NextResponse.json({ reconciliation_rate: null }, { status: 200 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json({ reconciliation_rate: null }, { status: 200 });
  }
}
