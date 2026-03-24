import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const TIMEOUT_MS = 12000;

// ─────────────────────────────────────────────────────────────────────────────
// Contrat lynki.accounting.general_ledger (T16 — PLAN_SPRINT_03_LYNKI §4)
// Identifiant canonique : lynki.accounting.general_ledger
// Source Vault : GET /api/accounting/general-ledger
// Filtres REQUIS : tenant, account_code, date_debut, date_fin
// Filtre optionnel : company_id
// Couverture Sprint 03 : payroll_od_lines (OD paie 641*/645*) — partielle (T19 décision documentée).
// ─────────────────────────────────────────────────────────────────────────────

/** Une écriture de grand livre (entrée individuelle). */
export interface GeneralLedgerLine {
  line_id: number;
  move_id: number;
  line_date: string; // YYYY-MM-DD
  account_code: string;
  account_name: string;
  journal_code?: string;   // Sprint 06 T33
  partner_id?: number;     // Sprint 06 T33
  partner_name?: string;   // Sprint 06 T33
  debit: number;
  credit: number;
  balance: number;
  currency: string;
}

/** Réponse canonique grand livre Lynki. */
export interface LynkiGeneralLedgerResponse {
  /** Identifiant canonique — distincts du chemin HTTP */
  restitution_id: "lynki.accounting.general_ledger";
  referentiel_version: string;
  tenant: string;
  /** Compte filtré — aligné avec la ligne BG source du drill */
  account_code: string;
  company_id: string | null;
  period_from: string;
  period_to: string;
  generated_at: string;
  lines: GeneralLedgerLine[];
  total_debit: number;
  total_credit: number;
  opening_balance?: number; // Sprint 06 T34
  total_count?: number;     // Sprint 06 T34
  page?: number;            // Sprint 06 T34
  page_size?: number;       // Sprint 06 T34
  vault_freshness?: string | null;
  complete: boolean;
  coverage?: string;
  filter_journal?: string;       // Sprint 06 T33
  filter_partner?: number;       // Sprint 06 T33
  filter_partner_name?: string;  // Sprint 07 T38
  data_source: "vault" | "stub";
}

function jsonGL(body: LynkiGeneralLedgerResponse, status = 200): NextResponse {
  const res = NextResponse.json(body, { status });
  res.headers.set("X-Lynki-Accounting-Source", body.data_source);
  return res;
}

function referentielDefault(): string {
  return "1.1";
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/accounting/general-ledger
// Params : tenant, account_code, date_debut, date_fin (requis), company_id (optionnel)
// LINKY_ACCOUNTING_STRICT=1 : 502 si Vault indisponible, pas de stub silencieux.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const tenant = searchParams.get("tenant") || process.env.TENANT_ID || "core";
  const accountCode = searchParams.get("account_code") || "";
  const dateDebut = searchParams.get("date_debut") || "";
  const dateFin = searchParams.get("date_fin") || "";
  const companyId = searchParams.get("company_id") || null;
  // Sprint 06 T33/T34 + Sprint 07 T38
  const journalCode = searchParams.get("journal_code") || "";
  const partnerId = searchParams.get("partner_id") || "";
  const partnerName = searchParams.get("partner_name") || "";
  const page = searchParams.get("page") || "";
  const pageSize = searchParams.get("page_size") || "";

  const strict =
    process.env.LINKY_ACCOUNTING_STRICT === "1" ||
    process.env.LINKY_ACCOUNTING_STRICT === "true";

  if (!accountCode || !dateDebut || !dateFin) {
    return NextResponse.json(
      { error: "account_code, date_debut et date_fin sont requis" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    tenant,
    account_code: accountCode,
    date_debut: dateDebut,
    date_fin: dateFin,
    ...(companyId ? { company_id: companyId } : {}),
    ...(journalCode ? { journal_code: journalCode } : {}),
    ...(partnerId ? { partner_id: partnerId } : {}),
    ...(partnerName ? { partner_name: partnerName } : {}),
    ...(page ? { page } : {}),
    ...(pageSize ? { page_size: pageSize } : {}),
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const vaultRes = await fetch(
      `${VAULT_URL}/api/accounting/general-ledger?${params}`,
      { cache: "no-store", signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (vaultRes.ok) {
      const raw = (await vaultRes.json()) as Record<string, unknown>;
      const ref =
        typeof raw.referentiel_version === "string" && raw.referentiel_version.length > 0
          ? raw.referentiel_version
          : referentielDefault();
      const response: LynkiGeneralLedgerResponse = {
        restitution_id: "lynki.accounting.general_ledger",
        referentiel_version: ref,
        tenant,
        account_code: accountCode,
        company_id: companyId,
        period_from: dateDebut,
        period_to: dateFin,
        generated_at:
          typeof raw.generated_at === "string"
            ? raw.generated_at
            : new Date().toISOString(),
        lines: Array.isArray(raw.lines) ? (raw.lines as GeneralLedgerLine[]) : [],
        total_debit: typeof raw.total_debit === "number" ? raw.total_debit : 0,
        total_credit: typeof raw.total_credit === "number" ? raw.total_credit : 0,
        opening_balance: typeof raw.opening_balance === "number" ? raw.opening_balance : 0,
        total_count: typeof raw.total_count === "number" ? raw.total_count : undefined,
        page: typeof raw.page === "number" ? raw.page : undefined,
        page_size: typeof raw.page_size === "number" ? raw.page_size : undefined,
        vault_freshness:
          typeof raw.vault_freshness === "string" || raw.vault_freshness === null
            ? (raw.vault_freshness as string | null)
            : null,
        complete: typeof raw.complete === "boolean" ? raw.complete : false,
        coverage: typeof raw.coverage === "string" ? raw.coverage : undefined,
        filter_journal: typeof raw.filter_journal === "string" ? raw.filter_journal : undefined,
        filter_partner: typeof raw.filter_partner === "number" ? raw.filter_partner : undefined,
        filter_partner_name: typeof raw.filter_partner_name === "string" ? raw.filter_partner_name : undefined,
        data_source: "vault",
      };
      return jsonGL(response);
    }

    if (strict) {
      return NextResponse.json(
        { error: "vault_general_ledger_unavailable", vault_status: vaultRes.status },
        { status: 502 }
      );
    }
  } catch {
    if (strict) {
      return NextResponse.json(
        { error: "vault_general_ledger_unreachable" },
        { status: 502 }
      );
    }
  }

  // Stub documenté — jamais silencieux
  const stub: LynkiGeneralLedgerResponse = {
    restitution_id: "lynki.accounting.general_ledger",
    referentiel_version: referentielDefault(),
    tenant,
    account_code: accountCode,
    company_id: companyId,
    period_from: dateDebut,
    period_to: dateFin,
    generated_at: new Date().toISOString(),
    lines: [],
    total_debit: 0,
    total_credit: 0,
    vault_freshness: null,
    complete: false,
    data_source: "stub",
  };
  return jsonGL(stub);
}
