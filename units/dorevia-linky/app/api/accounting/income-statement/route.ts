import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const TIMEOUT_MS = 12000;

/** Ligne agrégée par classe PCG (Sprint 07 T40) */
export interface ClassBalanceLine {
  class: string;
  label: string;
  balance: number;
}

/** Réponse lynki.accounting.income_statement */
export interface LynkiIncomeStatementResponse {
  restitution_id: "lynki.accounting.income_statement";
  referentiel_version: string;
  tenant: string;
  company_id: string | null;
  period_from: string;
  period_to: string;
  generated_at: string;
  perimeter_note: string;
  lines: ClassBalanceLine[];
  vault_freshness?: string | null;
  complete: boolean;
  coverage?: string;
  data_source: "vault" | "stub";
}

function referentielDefault(): string {
  return "1.1";
}

function jsonIncomeStatement(body: LynkiIncomeStatementResponse, status = 200): NextResponse {
  const res = NextResponse.json(body, { status });
  res.headers.set("X-Lynki-Accounting-Source", body.data_source);
  return res;
}

// GET /api/accounting/income-statement — proxy Vault Sprint 07 T40
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tenant = searchParams.get("tenant") || process.env.TENANT_ID || "core";
  const dateDebut = searchParams.get("date_debut") || "";
  const dateFin = searchParams.get("date_fin") || "";
  const companyId = searchParams.get("company_id") || null;
  const referentielFallback = referentielDefault();

  const strictAccounting =
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
      ...(companyId ? { company_id: companyId } : {}),
    });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const vaultRes = await fetch(
      `${VAULT_URL}/api/accounting/income-statement?${params}`,
      { cache: "no-store", signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (vaultRes.ok) {
      const raw = (await vaultRes.json()) as Record<string, unknown>;
      const ref =
        typeof raw.referentiel_version === "string" && raw.referentiel_version.length > 0
          ? raw.referentiel_version
          : referentielFallback;
      const response: LynkiIncomeStatementResponse = {
        restitution_id: "lynki.accounting.income_statement",
        referentiel_version: ref,
        tenant,
        company_id: companyId,
        period_from: dateDebut,
        period_to: dateFin,
        generated_at:
          typeof raw.generated_at === "string"
            ? raw.generated_at
            : new Date().toISOString(),
        perimeter_note:
          typeof raw.perimeter_note === "string"
            ? raw.perimeter_note
            : "Premier incrément — agrégation par classe PCG (classes 6–7).",
        lines: Array.isArray(raw.lines) ? (raw.lines as ClassBalanceLine[]) : [],
        vault_freshness:
          typeof raw.vault_freshness === "string" || raw.vault_freshness === null
            ? (raw.vault_freshness as string | null)
            : null,
        complete: typeof raw.complete === "boolean" ? raw.complete : false,
        coverage: typeof raw.coverage === "string" ? raw.coverage : undefined,
        data_source: "vault",
      };
      return jsonIncomeStatement(response);
    }

    if (strictAccounting) {
      return NextResponse.json(
        {
          error: "vault_income_statement_unavailable",
          vault_status: vaultRes.status,
        },
        { status: 502 }
      );
    }
  } catch {
    if (strictAccounting) {
      return NextResponse.json({ error: "vault_income_statement_unreachable" }, { status: 502 });
    }
  }

  const stub: LynkiIncomeStatementResponse = {
    restitution_id: "lynki.accounting.income_statement",
    referentiel_version: referentielFallback,
    tenant,
    company_id: companyId,
    period_from: dateDebut,
    period_to: dateFin,
    generated_at: new Date().toISOString(),
    perimeter_note: "Stub — Vault injoignable.",
    lines: [],
    vault_freshness: null,
    complete: false,
    data_source: "stub",
  };
  return jsonIncomeStatement(stub);
}
