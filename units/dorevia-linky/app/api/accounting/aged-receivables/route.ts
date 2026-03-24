import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const TIMEOUT_MS = 15000;

export interface AgedBalanceLine {
  partner_id: number;
  partner_name: string;
  not_due: number;
  range_0_30: number;
  range_31_60: number;
  range_61_90: number;
  range_91_180: number;
  range_over_180: number;
  total: number;
}

export interface LynkiAgedReceivablesResponse {
  restitution_id: "lynki.accounting.aged_receivables";
  referentiel_version: string;
  tenant: string;
  company_id: string | null;
  company_ids?: number[];
  as_of_date: string;
  generated_at: string;
  lines: AgedBalanceLine[];
  complete: boolean;
  coverage?: string;
  aging_basis?: "date_maturity" | "line_date_fallback" | "mixed";
  v2_limitations?: string[];
  v1_limitations?: string;
  data_source: "vault" | "stub";
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tenant = searchParams.get("tenant") || process.env.TENANT_ID || "core";
  const asOfDate = searchParams.get("as_of_date") || "";
  const companyIds = searchParams.get("company_ids") || null;
  const companyId = searchParams.get("company_id") || null;

  const strict =
    process.env.LINKY_ACCOUNTING_STRICT === "1" ||
    process.env.LINKY_ACCOUNTING_STRICT === "true";

  if (!asOfDate) {
    return NextResponse.json({ error: "as_of_date requis (YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      tenant,
      as_of_date: asOfDate,
      ...(companyIds ? { company_ids: companyIds } : companyId ? { company_id: companyId } : {}),
    });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const vaultRes = await fetch(
      `${VAULT_URL}/api/accounting/aged-receivables?${params}`,
      { cache: "no-store", signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (vaultRes.ok) {
      const raw = (await vaultRes.json()) as Record<string, unknown>;
      const response: LynkiAgedReceivablesResponse = {
        restitution_id: "lynki.accounting.aged_receivables",
        referentiel_version: typeof raw.referentiel_version === "string" ? raw.referentiel_version : "1.1",
        tenant,
        company_id: companyId,
        company_ids: Array.isArray(raw.company_ids) ? (raw.company_ids as number[]) : undefined,
        as_of_date: asOfDate,
        generated_at: typeof raw.generated_at === "string" ? raw.generated_at : new Date().toISOString(),
        lines: Array.isArray(raw.lines) ? (raw.lines as AgedBalanceLine[]) : [],
        complete: typeof raw.complete === "boolean" ? raw.complete : false,
        coverage: typeof raw.coverage === "string" ? raw.coverage : undefined,
        aging_basis: typeof raw.aging_basis === "string" ? raw.aging_basis as LynkiAgedReceivablesResponse["aging_basis"] : undefined,
        v2_limitations: Array.isArray(raw.v2_limitations) ? (raw.v2_limitations as string[]) : undefined,
        v1_limitations: typeof raw.v1_limitations === "string" ? raw.v1_limitations : undefined,
        data_source: "vault",
      };
      return NextResponse.json(response);
    }
    if (strict) {
      return NextResponse.json({ error: "vault_aged_receivables_unavailable", vault_status: vaultRes.status }, { status: 502 });
    }
  } catch {
    if (strict) {
      return NextResponse.json({ error: "vault_aged_receivables_unreachable" }, { status: 502 });
    }
  }

  const stub: LynkiAgedReceivablesResponse = {
    restitution_id: "lynki.accounting.aged_receivables",
    referentiel_version: "1.1",
    tenant,
    company_id: companyId,
    as_of_date: asOfDate,
    generated_at: new Date().toISOString(),
    lines: [],
    complete: false,
    data_source: "stub",
  };
  return NextResponse.json(stub);
}
