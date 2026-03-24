import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const TIMEOUT_MS = 12000;

// ─────────────────────────────────────────────────────────────────────────────
// Contrat lynki.accounting.trial_balance (T5 — PLAN_SPRINT_01_LYNKI §4)
// Identifiant canonique : lynki.accounting.trial_balance
// Source : DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md (balance générale)
//          REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md v1.1
// ─────────────────────────────────────────────────────────────────────────────

/** Une ligne de balance générale (solde débit / crédit par compte) */
export interface TrialBalanceLine {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  balance: number;
}

/** Réponse canonique balance générale Lynki */
export interface LynkiTrialBalanceResponse {
  /** Identifiant canonique de la restitution — ne pas changer */
  restitution_id: "lynki.accounting.trial_balance";
  /** Version du référentiel de mapping utilisé — §3.5 REFERENTIEL_COMPTABLE (Sprint 02 T13 : priorité à la valeur Vault si présente) */
  referentiel_version: string;
  tenant: string;
  company_id: string | null;
  period_from: string;
  period_to: string;
  generated_at: string;
  lines: TrialBalanceLine[];
  /** Métadonnée de fraîcheur Vault */
  vault_freshness?: string | null;
  /** true si les données sont complètes (tous les journaux couverts) */
  complete: boolean;
  /** Couverture données côté Vault (ex. payroll_od_lines) — optionnel */
  coverage?: string;
  /**
   * Origine de la payload pour éviter tout stub silencieux :
   * `vault` = réponse Vault HTTP 2xx ; `stub` = secours documenté (Vault injoignable ou strict désactivé).
   */
  data_source: "vault" | "stub";
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/accounting/trial-balance
// Params : tenant, date_debut, date_fin, company_id (optionnel)
//
// T6 / Sprint 02 T12 — Stub uniquement si Vault injoignable ou erreur HTTP,
// sauf LINKY_ACCOUNTING_STRICT=1 (env de référence : erreur explicite 502, pas de secours silencieux).
// ─────────────────────────────────────────────────────────────────────────────
function referentielDefault(): string {
  return "1.1";
}

function jsonTrialBalance(
  body: LynkiTrialBalanceResponse,
  status = 200
): NextResponse {
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
  const referentielFallback = referentielDefault();

  const strictAccounting =
    process.env.LINKY_ACCOUNTING_STRICT === "1" ||
    process.env.LINKY_ACCOUNTING_STRICT === "true";

  if (!dateDebut || !dateFin) {
    return NextResponse.json({ error: "date_debut et date_fin requis" }, { status: 400 });
  }

  try {
    const accountPrefixes = searchParams.get("account_prefixes") || "";
    const params = new URLSearchParams({
      tenant,
      date_debut: dateDebut,
      date_fin: dateFin,
      ...(companyIds ? { company_ids: companyIds } : companyId ? { company_id: companyId } : {}),
      ...(accountPrefixes ? { account_prefixes: accountPrefixes } : {}),
    });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const vaultRes = await fetch(
      `${VAULT_URL}/api/accounting/trial-balance?${params}`,
      { cache: "no-store", signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (vaultRes.ok) {
      const raw = (await vaultRes.json()) as Record<string, unknown>;
      const ref =
        typeof raw.referentiel_version === "string" && raw.referentiel_version.length > 0
          ? raw.referentiel_version
          : referentielFallback;
      const response: LynkiTrialBalanceResponse = {
        restitution_id: "lynki.accounting.trial_balance",
        referentiel_version: ref,
        tenant,
        company_id: companyId,
        period_from: dateDebut,
        period_to: dateFin,
        generated_at:
          typeof raw.generated_at === "string"
            ? raw.generated_at
            : new Date().toISOString(),
        lines: Array.isArray(raw.lines) ? (raw.lines as TrialBalanceLine[]) : [],
        vault_freshness:
          typeof raw.vault_freshness === "string" || raw.vault_freshness === null
            ? (raw.vault_freshness as string | null)
            : null,
        complete: typeof raw.complete === "boolean" ? raw.complete : false,
        coverage: typeof raw.coverage === "string" ? raw.coverage : undefined,
        data_source: "vault",
      };
      return jsonTrialBalance(response);
    }

    if (strictAccounting) {
      return NextResponse.json(
        {
          error: "vault_trial_balance_unavailable",
          vault_status: vaultRes.status,
        },
        { status: 502 }
      );
    }
  } catch {
    if (strictAccounting) {
      return NextResponse.json(
        { error: "vault_trial_balance_unreachable" },
        { status: 502 }
      );
    }
    // Vault non joignable — continuer vers le stub documenté (non strict)
  }

  // Stub documenté — structure conforme, données vides, complete=false, jamais silencieux (header + data_source)
  const stub: LynkiTrialBalanceResponse = {
    restitution_id: "lynki.accounting.trial_balance",
    referentiel_version: referentielFallback,
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
  return jsonTrialBalance(stub);
}
