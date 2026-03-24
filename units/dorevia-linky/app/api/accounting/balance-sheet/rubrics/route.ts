import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const TIMEOUT_MS = 15000;

/** Ligne de rubrique comptable Lynki (Sprint 08 T43) */
export interface RubricLine {
  rubric_id: string;
  label: string;
  amount: number;
  section: string; // "actif" | "passif"
  account_filter?: string[]; // préfixes de comptes pour drill BG (Sprint 09 T49)
}

/** Réponse lynki.accounting.balance_sheet detail_level=rubrics */
export interface LynkiBalanceSheetRubricsResponse {
  restitution_id: "lynki.accounting.balance_sheet";
  referentiel_version: string;
  detail_level: "rubrics";
  tenant: string;
  company_id: string | null;
  period_from: string;
  period_to: string;
  generated_at: string;
  lines: RubricLine[];
  total_actif?: number;
  total_passif?: number;
  vault_freshness?: string | null;
  complete: boolean;
  coverage?: string;
  data_source: "vault" | "stub";
  compare?: string;
  lines_previous?: RubricLine[];
  period_previous_from?: string;
  period_previous_to?: string;
  complete_previous?: boolean;
}

function jsonResponse(body: LynkiBalanceSheetRubricsResponse, status = 200): NextResponse {
  const res = NextResponse.json(body, { status });
  res.headers.set("X-Lynki-Accounting-Source", body.data_source);
  return res;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tenant = searchParams.get("tenant") || process.env.TENANT_ID || "core";
  const dateDebut = searchParams.get("date_debut") || "";
  const dateFin = searchParams.get("date_fin") || "";
  const companyIds = searchParams.get("company_ids") || null;
  const companyId = searchParams.get("company_id") || null;
  const compare = searchParams.get("compare") || null;

  const strict =
    process.env.LINKY_ACCOUNTING_STRICT === "1" ||
    process.env.LINKY_ACCOUNTING_STRICT === "true";

  if (!dateDebut || !dateFin) {
    return NextResponse.json({ error: "date_debut et date_fin requis" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      tenant,
      date_debut: dateDebut,
      date_fin: dateFin,
      ...(companyIds ? { company_ids: companyIds } : companyId ? { company_id: companyId } : {}),
      ...(compare ? { compare } : {}),
    });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const vaultRes = await fetch(
      `${VAULT_URL}/api/accounting/balance-sheet/rubrics?${params}`,
      { cache: "no-store", signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (vaultRes.ok) {
      const raw = (await vaultRes.json()) as Record<string, unknown>;
      const response: LynkiBalanceSheetRubricsResponse = {
        restitution_id: "lynki.accounting.balance_sheet",
        referentiel_version: typeof raw.referentiel_version === "string" ? raw.referentiel_version : "1.1",
        detail_level: "rubrics",
        tenant,
        company_id: companyId,
        period_from: dateDebut,
        period_to: dateFin,
        generated_at: typeof raw.generated_at === "string" ? raw.generated_at : new Date().toISOString(),
        lines: Array.isArray(raw.lines) ? (raw.lines as RubricLine[]) : [],
        total_actif: typeof raw.total_actif === "number" ? raw.total_actif : undefined,
        total_passif: typeof raw.total_passif === "number" ? raw.total_passif : undefined,
        vault_freshness: typeof raw.vault_freshness === "string" ? raw.vault_freshness : null,
        complete: typeof raw.complete === "boolean" ? raw.complete : false,
        coverage: typeof raw.coverage === "string" ? raw.coverage : undefined,
        data_source: "vault",
        compare: typeof raw.compare === "string" ? raw.compare : undefined,
        lines_previous: Array.isArray(raw.lines_previous) ? (raw.lines_previous as RubricLine[]) : undefined,
        period_previous_from: typeof raw.period_previous_from === "string" ? raw.period_previous_from : undefined,
        period_previous_to: typeof raw.period_previous_to === "string" ? raw.period_previous_to : undefined,
        complete_previous: typeof raw.complete_previous === "boolean" ? raw.complete_previous : undefined,
      };
      return jsonResponse(response);
    }
    if (strict) {
      return NextResponse.json({ error: "vault_balance_sheet_rubrics_unavailable", vault_status: vaultRes.status }, { status: 502 });
    }
  } catch {
    if (strict) {
      return NextResponse.json({ error: "vault_balance_sheet_rubrics_unreachable" }, { status: 502 });
    }
  }

  const stub: LynkiBalanceSheetRubricsResponse = {
    restitution_id: "lynki.accounting.balance_sheet",
    referentiel_version: "1.1",
    detail_level: "rubrics",
    tenant,
    company_id: companyId,
    period_from: dateDebut,
    period_to: dateFin,
    generated_at: new Date().toISOString(),
    lines: [],
    vault_freshness: null,
    complete: false,
    data_source: "stub",
  };
  return jsonResponse(stub);
}
