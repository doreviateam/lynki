import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 10000;

/** Masse salariale mensuelle (€) — config gouvernance, SPEC Masse Salariale P0. Si 0 ou absent, couverture non calculée. */
function getMasseSalarialeMensuelle(): number {
  const v = process.env.MASSE_SALARIALE_MENSUELLE_EUR;
  if (!v) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export const revalidate = 0;
export const dynamic = "force-dynamic";

/** SPEC Carte Paiements v1.1 — contrôle complétude (données Linky = Vault) */
export interface PaymentsCompletenessCheck {
  ok: boolean;
  badge: string;
  message: string;
}

/** SPEC Trésorerie v4.1 — Linky appelle uniquement le Vault (proxy unique) */
interface TreasuryV4Response {
  position?: {
    validated_balance?: number;
    erp_balance?: number | null;
    unvalidated_exposure?: number | null;
    reliability_position?: number | null;
  };
  process?: {
    reconciled_volume?: number;
    unreconciled_volume?: number;
    reliability_volume?: number;
    source?: "confirmation" | "proxy";
  };
  confirmation?: {
    total_amount_abs?: number;
    confirmed_amount_abs?: number;
    unconfirmed_amount_abs?: number;
    confirmation_rate?: number;
  };
  /** SPEC web38 — Reste à rapprocher */
  reconciliation_metrics?: {
    total_amount_abs?: number;
    reconciled_amount_abs?: number;
    remaining_amount_abs?: number;
    remaining_ratio?: number;
    generated_at?: string;
  };
  flags?: {
    sign_mismatch?: boolean;
    large_delta?: boolean;
    structural_delta?: boolean;
  };
  generated_at?: string;
  last_reconcil_event_at?: string;
  // Legacy (rétrocompat)
  reconciled_balance?: number;
  unreconciled_balance?: number;
  accounting_balance?: number;
  total?: number;
  reconciled?: number;
  unreconciled?: number;
  reliability_rate?: number | null;
  reconciliation_rate?: number | null;
  currency?: string;
  bank_accounts_count?: number;
  last_statement_date?: string | null;
  oldest_unreconciled_date?: string | null;
  unreconciled_entries?: number;
}

/** MINI_SPEC_COUVERTURE_STRUCTURELLE_PAIE — charges structurelles (base explicative), extensible */
export interface StructuralChargesBreakdown {
  payroll?: number;
  rent?: number;
  subscriptions?: number;
}

const stubTreasury = (): Record<string, unknown> => ({
  total: 0,
  reconciled: 0,
  unreconciled: 0,
  reconciliation_rate: null,
  currency: "EUR",
  unreconciled_lines_count: null,
  oldest_unreconciled_date: null,
  journals_count: null,
  last_statement_import_date: null,
  generated_at: null,
  couverture_salariale_mois: null,
  completeness_check: null as PaymentsCompletenessCheck | null,
  reconciliation_metrics: null,
  structural_coverage_available: false,
  structural_charges_amount: null,
  structural_charges_breakdown: {},
  structural_coverage_ratio: null,
});

/**
 * GET /api/treasury — proxy unique vers Vault (SPEC Trésorerie v4.1)
 * Le Vault agrège projection RECONCIL + erp_balance Odoo. Un seul appel.
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

  const qsCompleteness = new URLSearchParams({ tenant });
  qsCompleteness.set("date_from", dateDebut ?? "2000-01-01");
  qsCompleteness.set("date_to", dateFin ?? "2030-12-31");
  if (companyId) qsCompleteness.set("company_id", companyId);

  const vaultBase = VAULT_URL.replace(/\/$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Fetch treasury + payments-completeness + payroll en parallèle (SPEC Carte Paiements v1.1 ; MINI_SPEC couverture structurelle)
    const [treasuryRes, completenessRes, payrollRes] = await Promise.all([
      fetch(`${vaultBase}/ui/aggregations/treasury?${qs}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      }),
      fetch(`${vaultBase}/ui/aggregations/payments-completeness?${qsCompleteness}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      }),
      fetch(`${vaultBase}/ui/aggregations/payroll?${qs}`, {
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

    const raw: TreasuryV4Response = await treasuryRes.json();

    // SPEC Carte Paiements v1.1 — contrôle complétude
    if (completenessRes.ok) {
      const comp = await completenessRes.json();
      base.completeness_check = {
        ok: comp.ok === true,
        badge: comp.badge ?? "",
        message: comp.message ?? "",
      };
    } else {
      base.completeness_check = { ok: false, badge: "Données incomplètes", message: "Contrôle de complétude indisponible (Odoo inaccessible)" };
    }

    // V4.1 : position/process/flags — Linky reprend telles quelles les valeurs du Vault (source unique).
    if (raw.position) {
      base.position = { ...raw.position };
    }
    if (raw.process) base.process = raw.process;
    // SPEC Carte Paiements Option A — confirmation (A/B paiements depuis financial_recon_deltas)
    if (raw.confirmation) base.confirmation = raw.confirmation;
    // SPEC web38 — Reste à rapprocher
    if (raw.reconciliation_metrics) base.reconciliation_metrics = raw.reconciliation_metrics;
    if (raw.flags) base.flags = raw.flags;
    if (raw.generated_at) base.generated_at = raw.generated_at;
    if (raw.last_reconcil_event_at) base.last_reconcil_event_at = raw.last_reconcil_event_at;

    // Champs plats (legacy + mapping)
    // SPEC Carte Paiements Option A : si complétude OK et confirmation présente → A/B/couverture depuis confirmation
    const completeness = base.completeness_check as PaymentsCompletenessCheck | null;
    const useConfirmationForPayments =
      completeness?.ok === true &&
      raw.confirmation &&
      (raw.confirmation.confirmed_amount_abs != null || raw.confirmation.unconfirmed_amount_abs != null);
    if (useConfirmationForPayments && raw.confirmation) {
      const conf = raw.confirmation;
      const tot = conf.total_amount_abs ?? ((conf.unconfirmed_amount_abs ?? 0) + (conf.confirmed_amount_abs ?? 0));
      // Le signal de confirmation peut rester à 0 sur certains runs alors qu'un volume
      // rapproché existe déjà via la projection trésorerie. On réconcilie les deux.
      const confirmedFromConfirmation = conf.confirmed_amount_abs ?? 0;
      const confirmedFromProcess = raw.process?.reconciled_volume ?? 0;
      const b = Math.max(confirmedFromConfirmation, confirmedFromProcess, 0);
      const boundedConfirmed = Math.min(b, Math.max(tot, 0));
      const a = Math.max(Math.max(tot, 0) - boundedConfirmed, 0);
      base.reconciled = boundedConfirmed;
      base.unreconciled = a;
      base.total = tot;
      base.reconciliation_rate =
        tot > 0 ? ((boundedConfirmed / tot) * 100) : null;
      // La carte Paiements doit afficher le périmètre des flux paiements (confirmation),
      // pas le proxy trésorerie global qui inclut des lignes ERP hors scope de la carte.
      base.reconciliation_metrics = {
        generated_at: raw.reconciliation_metrics?.generated_at ?? raw.generated_at,
        total_amount_abs: Math.max(tot, 0),
        reconciled_amount_abs: boundedConfirmed,
        remaining_amount_abs: a,
        remaining_ratio: tot > 0 ? a / tot : 0,
      };
    } else {
      base.total = raw.accounting_balance ?? raw.total ?? 0;
      base.reconciled = raw.reconciled_balance ?? raw.reconciled ?? (raw.process?.reconciled_volume ?? 0);
      base.unreconciled = raw.unreconciled_balance ?? raw.unreconciled ?? (raw.process?.unreconciled_volume ?? 0);
      const rawRate = raw.reliability_rate ?? raw.reconciliation_rate ?? raw.process?.reliability_volume ?? null;
      base.reconciliation_rate =
        typeof rawRate === "number" && !Number.isNaN(rawRate)
          ? rawRate <= 1
            ? rawRate * 100
            : rawRate
          : null;
    }

    base.currency = raw.currency ?? "EUR";
    base.journals_count = raw.bank_accounts_count ?? null;
    base.last_statement_import_date = raw.last_statement_date ?? null;
    base.oldest_unreconciled_date = raw.oldest_unreconciled_date ?? null;
    base.unreconciled_lines_count = raw.unreconciled_entries ?? null;

    // Couverture structurelle (SPEC Masse Salariale P0) — calcul dérivé gouvernance (position = valeur Vault).
    const masseSalariale = getMasseSalarialeMensuelle();
    const validatedBalance = raw.position?.validated_balance ?? null;
    if (masseSalariale > 0 && validatedBalance != null && Number.isFinite(validatedBalance)) {
      const rawMois = validatedBalance / masseSalariale;
      base.couverture_salariale_mois = rawMois < 0 ? 0 : rawMois;
    } else {
      base.couverture_salariale_mois = null;
    }

    // MINI_SPEC_COUVERTURE_STRUCTURELLE_PAIE v1.1 — charges structurelles + ratio % (trésorerie validée = dénominateur)
    base.structural_coverage_ratio = null;
    if (payrollRes.ok) {
      try {
        const payroll = await payrollRes.json() as { payroll_source?: string; total_charges?: number };
        const source = payroll.payroll_source;
        const totalCharges = typeof payroll.total_charges === "number" && !Number.isNaN(payroll.total_charges) ? payroll.total_charges : 0;
        const hasStructuralPayroll = (source === "od" || source === "payslip") && totalCharges > 0;
        base.structural_coverage_available = hasStructuralPayroll;
        base.structural_charges_amount = hasStructuralPayroll ? totalCharges : null;
        base.structural_charges_breakdown = hasStructuralPayroll ? { payroll: totalCharges } : {};
        // structural_coverage_ratio = min(100, charges / trésorerie validée × 100) — MINI_SPEC v1.1
        const validatedBalance = raw.position?.validated_balance;
        const refAmount = typeof validatedBalance === "number" && !Number.isNaN(validatedBalance) && validatedBalance > 0 ? validatedBalance : null;
        if (totalCharges === 0) {
          base.structural_coverage_ratio = 0;
        } else if (totalCharges > 0 && refAmount != null) {
          base.structural_coverage_ratio = Math.min(100, (totalCharges / refAmount) * 100);
        }
      } catch {
        // Ne pas casser la réponse treasury si le JSON payroll est invalide
      }
    }

    return NextResponse.json(base);
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json(stubTreasury());
  }
}
