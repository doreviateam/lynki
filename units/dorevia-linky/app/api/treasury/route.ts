import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 10000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

const stubTreasury = () => ({
  total: 0,
  reconciled: 0,
  unreconciled: 0,
  reconciliation_rate: null as number | null,
  currency: "EUR",
  unreconciled_lines_count: null as number | null,
  oldest_unreconciled_date: null as string | null,
  journals_count: null as number | null,
  last_statement_import_date: null as string | null,
});

/**
 * GET /api/treasury — proxy vers Vault treasury + bank-reconciliation-health (SPEC Trésorerie v1.1)
 * Paramètres : tenant, date_debut, date_fin, company_id
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const dateDebut = searchParams.get("date_debut");
  const dateFin = searchParams.get("date_fin");
  const companyId = searchParams.get("company_id") ?? "";

  const qs = new URLSearchParams({ tenant });
  if (dateDebut) qs.set("date_debut", dateDebut);
  if (dateFin) qs.set("date_fin", dateFin);
  if (companyId) qs.set("company_id", companyId);

  const vaultBase = VAULT_URL.replace(/\/$/, "");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const [treasuryRes, healthRes] = await Promise.all([
      fetch(`${vaultBase}/ui/aggregations/treasury?${qs}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      }),
      fetch(`${vaultBase}/ui/system/bank-reconciliation-health?${qs}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      }),
    ]);
    clearTimeout(timeoutId);

    const base = stubTreasury();

    if (!treasuryRes.ok) {
      return NextResponse.json(base);
    }

    const raw = await treasuryRes.json();
    base.total = raw.accounting_balance ?? raw.total ?? 0;
    base.reconciled = raw.reconciled_balance ?? raw.reconciled ?? 0;
    base.unreconciled = raw.unreconciled_balance ?? raw.unreconciled ?? 0;
    base.reconciliation_rate = raw.reliability_rate ?? raw.reconciliation_rate ?? null;
    base.currency = raw.currency ?? "EUR";

    if (healthRes.ok) {
      const health = await healthRes.json();
      base.unreconciled_lines_count =
        typeof health.unreconciled_entries === "number" ? health.unreconciled_entries : null;
      base.journals_count =
        typeof health.bank_accounts_count === "number" ? health.bank_accounts_count : null;
      base.last_statement_import_date =
        typeof health.last_statement_date === "string" && health.last_statement_date
          ? health.last_statement_date
          : null;
      base.oldest_unreconciled_date =
        typeof health.oldest_unreconciled_date === "string" && health.oldest_unreconciled_date
          ? health.oldest_unreconciled_date
          : null;
    }

    return NextResponse.json(base);
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json(stubTreasury());
  }
}
