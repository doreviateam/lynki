import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  decodeSession,
  canAccessAccounting,
} from "@/app/lib/auth-roles";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 5000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

export interface PeriodStatus {
  month: number;
  year: number;
  company_id: string;
  status: "open" | "closed" | "locked" | "partial";
  closed_at: string | null;
  heterogeneous?: boolean;
}

export interface AccountingPeriodsResponse {
  tenant: string;
  fiscal_year?: { start: string; end: string } | null;
  periods: PeriodStatus[];
  generated_at: string;
}

/**
 * GET /api/accounting/periods — proxy vers Vault (Sprint 13 T73).
 * Fallback { periods: [] } si Vault injoignable ou erreur.
 *
 * Session : sans cookie Lynki valide, pas d’appel Vault (réponse vide 200) — aligné avec le
 * cockpit accessible sans gate sur `/`, évite des 401 console alors que le bandeau utilise
 * ce hook pour les pastilles de période.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const year = searchParams.get("year") ?? "";
  const companyIds = searchParams.get("company_ids") ?? "";

  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  const empty = () =>
    NextResponse.json({ tenant, periods: [], generated_at: new Date().toISOString() });
  if (!session) {
    return empty();
  }
  if (!canAccessAccounting(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const qs = new URLSearchParams({ tenant });
  if (year) qs.set("year", year);
  if (companyIds) qs.set("company_ids", companyIds);

  const vaultBase = VAULT_URL.replace(/\/$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${vaultBase}/api/accounting/periods?${qs}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ tenant, periods: [], generated_at: new Date().toISOString() });
    }

    const data: AccountingPeriodsResponse = await res.json();
    return NextResponse.json(data);
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json({ tenant, periods: [], generated_at: new Date().toISOString() });
  }
}
