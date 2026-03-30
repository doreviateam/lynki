import { NextRequest, NextResponse } from "next/server";
import { recordUxSample } from "@/app/lib/ux-metrics";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DVIG_URL = (process.env.DVIG_URL || "").trim();
const DVIG_INTERNAL_TOKEN = (process.env.DVIG_INTERNAL_TOKEN || "").trim();
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const LOCKED_TENANT = (process.env.TENANT_ID || "").trim();
const TIMEOUT_MS = 90000; // 90s — fallback pour requêtes non critiques
const SEALED_COUNT_BUDGET_MS = 3000; // Garantie : complétude badge/cartes en < 5 s — 3s pour réactivité
// Sprint 3 UX: le bloc DLP est informatif, il ne doit pas dégrader le temps de disponibilité cockpit.
const DLP_TIMEOUT_MS = 800;
const BANK_RECONCILIATION_TIMEOUT_MS = 2000;

function getDefaultCompanyId(): string {
  const raw = process.env.COMPANY_DISPLAY_NAMES;
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const keys = Object.keys(parsed);
    return keys.length === 1 ? keys[0] : "";
  } catch {
    return "";
  }
}

export const revalidate = 0;
export const dynamic = "force-dynamic";

export type ValueKind = "positive" | "negative" | "zero" | "accent" | "accent_soft" | "neutral" | "placeholder";

/** `critical` = vigilance forte (ex. tuile Trésorerie « À confirmer » — SPEC_TUILE_TRESO §6, T-TR-001). */
export type CardStatusValue = "neutral" | "ok" | "watch" | "alert" | "critical";

export interface KpiMetric {
  value: number | null;
  formatted: string;
  valueKind: ValueKind;
  status?: CardStatusValue;
  status_reason?: string;
}

export interface PosSessionDetail {
  session_id: string;
  shop_id: string;
  total_sales: number;
  total_tickets: number;
  cash_total: number;
  card_total: number;
  difference: number;
  vault_status: string;
}

export interface PosShopSummary {
  shop_id: string;
  sessions_count: number;
  sealed_count: number;
  total_sales: number;
  cash_total: number;
  card_total: number;
  total_tickets: number;
  anomaly_count: number;
}

export interface SalesByPartnerItem {
  partner_name: string;
  total_ht: number;
  invoices_count: number;
  pct_of_total: number;
  cumulative_pct: number;
}

export interface SalesByPartnerDetail {
  total_ht: number;
  partners_count: number;
  items: SalesByPartnerItem[];
  pareto_80_cutoff: number;
  pareto_80_partners: string[];
}

export interface ArByPartnerDetail {
  totals: {
    open_amount: number;
    overdue_amount: number;
    open_count_invoices: number;
    overdue_count_invoices: number;
    missing_due_date_count: number;
    overdue_avg_days?: number;
    overdue_max_days?: number;
  };
  partners: Array<{
    partner_id: string;
    partner_name?: string;
    open_amount: number;
    overdue_amount: number;
    share_percent: number;
    overdue_avg_days?: number;
    overdue_max_days?: number;
    payment_delay_avg_days?: number | null;
    open_count_invoices?: number;
    overdue_count_invoices?: number;
  }>;
  meta: { freshness: string; warnings?: string[] };
}

export type DataCompletenessBankHealth = "absent" | "partial" | "complete";

/** Ventilation par compte bancaire (Vault `account_volume_breakdown`) — T-TR-DETAIL-002. */
export interface TreasuryAccountVolumeRow {
  account_id: number | null;
  reconciled_volume: number;
  unreconciled_volume: number;
}

export interface TreasuryDetail {
  reconciled: number;
  unreconciled: number;
  total: number;
  currency: string;
  /** Taux rapproché (0–100) — pour dépendances Cash/Taxes (inverse du reste à rapprocher) */
  treasury_validated_pct?: number | null;
  /** Position validée (Vault) — Card Trésorerie + DIVA */
  validated_balance?: number | null;
  /** Solde comptable (ERP) — Card Trésorerie + DIVA */
  erp_balance?: number | null;
  /** Lignes non rapprochées (bank-reconciliation-health) — DIVA axe discipline */
  unreconciled_lines_count?: number | null;
  last_statement_import_date?: string | null;
  journals_count?: number | null;
  oldest_unreconciled_date?: string | null;
  /** Volumes ABS rapproché / à rapprocher par `account_id` Odoo quand la projection l’expose. */
  account_volume_breakdown?: TreasuryAccountVolumeRow[];
}

export interface CardDetails {
  treasury?: TreasuryDetail;
  cash?: { encaissements: number; decaissements: number; net: number; currency: string };
  business?: {
    ventes: number;
    achats: number;
    net: number;
    currency: string;
    sales_by_partner?: SalesByPartnerDetail;
    ar_by_partner?: ArByPartnerDetail;
  };
  credit_notes?: { clients: number; fournisseurs: number; flux: number; currency: string };
  refunds?: { clients: number; fournisseurs: number; flux: number; currency: string };
  pos_shops?: {
    total_sessions: number;
    sealed_sessions: number;
    pending_sessions: number;
    total_tickets: number;
    cash_total: number;
    card_total: number;
    total_difference: number;
    anomaly_sessions: number;
    shops: PosShopSummary[];
    sessions: PosSessionDetail[];
    currency: string;
  };
}

export interface DataCompleteness {
  bank_health_metrics: DataCompletenessBankHealth;
}

export interface DashboardMetricsResponse {
  treasury: KpiMetric;
  /** Position validée (Vault) — Card Trésorerie ancre + DIVA */
  treasury_position?: KpiMetric;
  cash: KpiMetric;
  business: KpiMetric;
  taxes: KpiMetric;
  credit_notes: KpiMetric;
  refunds: KpiMetric;
  pos_shops: KpiMetric;
  pos_z: KpiMetric;
  /** BFR — Besoin en Fonds de Roulement (encours clients - proxy dettes) */
  working_capital?: KpiMetric;
  /** Encours — créances clients ouvertes (AR open) */
  encours?: KpiMetric;
  /** EBE — Excédent Brut d'Exploitation (CA - achats - charges) */
  ebitda?: KpiMetric;
  /** DLP — Énergie stratégique (données via /api/dlp/energy-summary, pas dashboard-metrics) */
  strategic_energy?: KpiMetric;
  /** Détails par axe (enrichissement pour DIVA/Mistral) */
  _details?: CardDetails;
  /** Complétude des données (DIVA — axe discipline). complete = disponibles, pas qualité. */
  data_completeness?: DataCompleteness;
  /** Nombre de documents scellés sur la période (factures + paiements + sessions POS) — badge header */
  sealed_count?: number;
  /** Total preuves scellées pour le tenant et la société (toutes périodes) — footer */
  sealed_count_total?: number | null;
  /**
   * true = les 5 sources (ventes, achats, encaissements, décaissements, POS) ont répondu.
   * false = une ou plusieurs sources ont échoué → le comptage est partiel, non fiable.
   * Garantit à l'utilisateur que le nombre affiché est total pour la période.
   */
  sealed_count_complete?: boolean;
  /** Sources ayant répondu (pour diagnostic si incomplete) */
  sealed_count_sources?: { sales: boolean; purchases: boolean; paymentsIn: boolean; paymentsOut: boolean; pos: boolean };
  /** Total attendu (Sprint 2) — affichage X/Y dans SyncInProgress quand fourni */
  expected_count?: number | null;
  /** Timestamp ISO 8601 — Dernière synchronisation (connecteur) */
  generated_at?: string | null;
  /** Timestamp ISO 8601 — instant de disponibilité des données côté Linky API */
  linky_data_available_at?: string | null;
  /** Mesure ponctuelle UX en millisecondes (proxy `generated_at -> now`) */
  ux_t_ms?: number | null;
}

const SPACE = "\u0020";

function normalizeTreasuryAccountVolumeBreakdown(raw: unknown): TreasuryAccountVolumeRow[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const rows: TreasuryAccountVolumeRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as {
      account_id?: unknown;
      reconciled_volume?: unknown;
      unreconciled_volume?: unknown;
    };
    const rv =
      typeof o.reconciled_volume === "number" && Number.isFinite(o.reconciled_volume) ? o.reconciled_volume : 0;
    const uv =
      typeof o.unreconciled_volume === "number" && Number.isFinite(o.unreconciled_volume) ? o.unreconciled_volume : 0;
    if (rv <= 0 && uv <= 0) continue;
    let accountId: number | null = null;
    if (typeof o.account_id === "number" && Number.isFinite(o.account_id)) accountId = o.account_id;
    rows.push({ account_id: accountId, reconciled_volume: rv, unreconciled_volume: uv });
  }
  return rows.length > 0 ? rows : undefined;
}

function getCurrencyLabel(currency = "EUR"): string {
  const code = (currency || "EUR").toUpperCase();
  if (code === "EUR") return "€";
  if (code === "USD") return "$";
  if (code === "GBP") return "£";
  return code;
}

function formatWithThousands(n: number, decimals = 0): string {
  const fixed = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
  const [intPart, decPart] = fixed.split(".");
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, SPACE);
  return decPart ? `${withSpaces},${decPart}` : withSpaces;
}

function formatAmount(value: number, currency = "EUR"): string {
  return `${formatWithThousands(value, 2)} ${getCurrencyLabel(currency)}`;
}

function formatSignedAmount(value: number, currency = "EUR"): string {
  const sign = value >= 0 ? "+" : "\u2212";
  return `${sign} ${formatWithThousands(Math.abs(value), 2)} ${getCurrencyLabel(currency)}`;
}

function toValueKind(value: number, useSigned: boolean): ValueKind {
  if (!useSigned) return "neutral";
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "zero";
}

/**
 * Calcul déterministe du statut de gouvernance pour chaque carte KPI.
 * Spec : SPEC_DOREVIA_Linky_Icon_Status_Badge_v1.0 §4–§5.
 */
function computeCardStatuses(resp: DashboardMetricsResponse): void {
  // treasury.value = solde validé (position) depuis la refonte — lire la couverture depuis _details
  const tPct = resp._details?.treasury?.treasury_validated_pct ?? null;
  /** Part des flux non couverts par preuve bancaire (100 − couverture), pour wording historique / alerts */
  const remainingPct = tPct != null ? 100 - tPct : null;
  const cashVal = resp.cash.value;
  const bizVal = resp.business.value;
  const posVal = resp.pos_shops.value;
  const totalCA = (bizVal ?? 0) + (posVal ?? 0);
  const refVal = resp.refunds.value;
  const pd = resp._details?.pos_shops;

  const set = (m: KpiMetric, s: CardStatusValue, r: string) => {
    m.status = s;
    m.status_reason = r;
  };

  // §4.1 Trésorerie (tuile) — T-TR-001 / SPEC_TUILE_TRESO §6 : assiette = couverture probante tPct (0–100 %)
  // À confirmer ≤10 %, Partiel >10–80 %, Fiable >80 % ; neutral = donnée absente
  if (tPct == null || !Number.isFinite(tPct)) {
    set(resp.treasury, "neutral", "Couverture non disponible — lecture en attente.");
  } else if (tPct <= 10) {
    set(
      resp.treasury,
      "critical",
      `Couverture probante ${tPct.toFixed(0)} % — rapprochement encore trop incomplet pour une lecture stabilisée.`
    );
  } else if (tPct <= 80) {
    set(
      resp.treasury,
      "watch",
      `Couverture probante ${tPct.toFixed(0)} % — lecture exploitable, rapprochement encore partiel.`
    );
  } else {
    set(resp.treasury, "ok", `Couverture probante ${tPct.toFixed(0)} % — lecture fiable sur le périmètre affiché.`);
  }

  // §4.1bis Paiements (KPI treasury_position) — même grille de confiance que la tuile Trésorerie (T-TR-001)
  if (resp.treasury_position) {
    if (tPct == null || !Number.isFinite(tPct)) {
      set(resp.treasury_position, "neutral", "Rapprochement non disponible.");
    } else if (tPct <= 10) {
      set(
        resp.treasury_position,
        "critical",
        `Couverture ${tPct.toFixed(0)} % — volume encore largement à rapprocher.`
      );
    } else if (tPct <= 80) {
      set(
        resp.treasury_position,
        "watch",
        `Couverture ${tPct.toFixed(0)} % — rapprochement partiel sur le périmètre.`
      );
    } else {
      set(resp.treasury_position, "ok", `Couverture ${tPct.toFixed(0)} % — rapprochement suffisant.`);
    }
  }

  // §4.2 Cash (dépend de la validation trésorerie)
  if (cashVal == null) set(resp.cash, "neutral", "Pas de donnée cash");
  else if (cashVal === 0) set(resp.cash, "neutral", "Pas d'activité cash");
  else if (tPct == null) set(resp.cash, "neutral", "Trésorerie non disponible");
  else if (tPct < 50) set(resp.cash, "watch", "Cash non validé (trésorerie insuffisante)");
  else if (tPct < 80) set(resp.cash, "watch", "Cash partiellement validé");
  else set(resp.cash, "ok", "Cash validé");

  // §4.3 Business
  if (bizVal == null) set(resp.business, "neutral", "Pas de donnée facturation");
  else if (bizVal === 0 && totalCA > 0) set(resp.business, "neutral", "CA exclusivement POS");
  else if (bizVal === 0 && totalCA === 0) set(resp.business, "watch", "Aucune activité commerciale");
  else set(resp.business, "ok", "Facturation active");

  // §4.4 Taxes — si charges fiscales présentes, afficher watch si trésorerie inconnue (au lieu de neutral)
  const taxesVal = resp.taxes.value;
  if (taxesVal == null || taxesVal === 0) set(resp.taxes, "neutral", "Pas de charge fiscale");
  else if (tPct != null && tPct < 80) set(resp.taxes, "watch", "Poids fiscal à surveiller (trésorerie < 80 %)");
  else if (tPct != null && tPct >= 80) set(resp.taxes, "ok", "Charges fiscales couvertes");
  else set(resp.taxes, "watch", "Poids fiscal à surveiller (trésorerie non disponible)");

  // §4.5 Notes de crédit
  const cnVal = resp.credit_notes.value;
  if (cnVal == null || cnVal === 0) set(resp.credit_notes, "neutral", "Aucune note de crédit");
  else set(resp.credit_notes, "watch", "Notes de crédit présentes");

  // §4.6 Remboursements — considérer aussi les flux bruts (client + fournisseur) si flux net = 0
  const refDetails = resp._details?.refunds;
  const hasRefundsRaw = refDetails && (refDetails.clients > 0 || refDetails.fournisseurs > 0);
  const hasRefunds = (refVal != null && refVal !== 0) || hasRefundsRaw;
  if (!hasRefunds) set(resp.refunds, "neutral", "Aucun remboursement");
  else if (totalCA <= 0) set(resp.refunds, "watch", "Remboursements sans CA de référence");
  else {
    const effectiveRef = refVal != null && refVal !== 0 ? Math.abs(refVal) : (refDetails?.clients ?? 0) + (refDetails?.fournisseurs ?? 0);
    const ratio = effectiveRef > 0 ? (effectiveRef / totalCA) * 100 : 0;
    if (ratio < 2) set(resp.refunds, "ok", `Remboursements marginaux (${ratio.toFixed(1)} %)`);
    else if (ratio < 5) set(resp.refunds, "watch", `Remboursements à surveiller (${ratio.toFixed(1)} %)`);
    else set(resp.refunds, "watch", `Remboursements élevés (${ratio.toFixed(1)} % du CA)`);
  }

  // §4.7 POS
  if (!pd || pd.total_sessions === 0) set(resp.pos_shops, "neutral", "Pas de session POS");
  else if (pd.anomaly_sessions > 0) set(resp.pos_shops, "watch", `${pd.anomaly_sessions} session(s) en anomalie`);
  else if (pd.pending_sessions > 0) set(resp.pos_shops, "watch", `${pd.sealed_sessions} scellée(s), ${pd.pending_sessions} non scellée(s)`);
  else if (Math.abs(pd.total_difference) > 1) set(resp.pos_shops, "watch", `Écart de caisse : ${pd.total_difference.toFixed(2)} €`);
  else set(resp.pos_shops, "ok", `POS conforme (${pd.sealed_sessions} sessions scellées)`);

  // §4.8 Z de caisse
  if (resp.pos_z.value == null) set(resp.pos_z, "neutral", "Z de caisse non renseigné");
  else set(resp.pos_z, "neutral", "Z de caisse présent (règles v1.1)");

  // §4.9 BFR (working_capital) — BFR complet (Stock + AR − AP) ou AR − AP / AR (ZeDocs/web52)
  if (resp.working_capital) {
    const bfrVal = resp.working_capital.value;
    if (bfrVal == null) set(resp.working_capital, "neutral", "BFR non disponible");
    else if (bfrVal > 0) set(resp.working_capital, "watch", `BFR ${formatAmount(bfrVal)}`);
    else set(resp.working_capital, "ok", "BFR négatif ou nul");
  }

  // §4.10 Encours — créances clients ouvertes
  if (resp.encours) {
    const encoursVal = resp.encours.value;
    if (encoursVal == null) set(resp.encours, "neutral", "Encours non disponible");
    else if (encoursVal > 0) set(resp.encours, "watch", `${formatAmount(encoursVal)} d'encours clients`);
    else set(resp.encours, "ok", "Aucun encours client");
  }

  // §4.11 EBE — aligné vue détaillée (payroll OD ou bulletins)
  if (resp.ebitda) {
    if (resp.ebitda.value == null) set(resp.ebitda, "neutral", "EBE non disponible (données insuffisantes)");
    else set(resp.ebitda, "ok", "EBE disponible (OD ou bulletins)");
  }

  // §5 Cohérence globale : si treasury = 0 %, aucun ok sauf POS
  if (tPct != null && tPct === 0) {
    for (const card of [resp.cash, resp.business, resp.taxes, resp.credit_notes, resp.refunds, resp.pos_z]) {
      if (card.status === "ok") {
        card.status = "watch";
        card.status_reason += " (trésorerie non validée)";
      }
    }
  }
}

/**
 * GET /api/dashboard-metrics — agrège les métriques principales des KPIs pour la grille d'accueil.
 * Appelle le Vault directement (évite les self-fetch qui échouent en Docker).
 * Paramètres : tenant, date_debut, date_fin, company_id
 *
 * @deprecated Sera remplacé par GET /api/instruments (Metric Engine).
 * Migration : PLAN_IMPLEMENTATION_SCRUM_LINKY_v1.0.md US-08 / US-10.
 * Pour activer le Metric Engine : NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE=1
 */
export async function GET(request: NextRequest) {
  const requestStartedAtMs = Date.now();
  const { searchParams } = new URL(request.url);
  const requestedTenant = searchParams.get("tenant");
  if (LOCKED_TENANT && requestedTenant && requestedTenant !== LOCKED_TENANT) {
    return NextResponse.json(
      {
        error: "tenant_mismatch",
        message: `This Linky deployment is locked to tenant '${LOCKED_TENANT}'.`,
        requested_tenant: requestedTenant,
        effective_tenant: LOCKED_TENANT,
      },
      { status: 400 }
    );
  }
  // Verrouillage inter-tenant: si le déploiement est dédié, ignorer tout tenant divergent.
  const tenant = LOCKED_TENANT || requestedTenant || DEFAULT_TENANT;
  const date_debut = searchParams.get("date_debut") ?? "2000-01-01";
  const date_fin = searchParams.get("date_fin") ?? "2030-12-31";
  const company_id = searchParams.get("company_id") ?? getDefaultCompanyId();
  const minimal = searchParams.get("minimal") === "1"; // Vue grille : skip sales-by-partner, ar-by-partner (allège payload)
  const base = VAULT_URL.replace(/\/$/, "");

  const commonParams = new URLSearchParams({
    tenant,
    date_debut,
    date_fin,
    granularity: "month",
    ...(company_id && { company_id }),
  });

  const fetchJsonWithTimeout = async (path: string, params?: URLSearchParams, timeoutMs = TIMEOUT_MS) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const qs = params ? `?${params.toString()}` : "";
      const res = await fetch(`${base}${path}${qs}`, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "X-Tenant": tenant,
        },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      return res.ok ? res.json() : null;
    } catch {
      clearTimeout(t);
      return null;
    }
  };

  type SealedSourceKey = "sales" | "purchases" | "paymentsIn" | "paymentsOut" | "pos";
  const sealedSourcePaths: Record<SealedSourceKey, { path: string; params: URLSearchParams }> = {
    sales: { path: "/ui/aggregations/sales", params: commonParams },
    purchases: { path: "/ui/aggregations/purchases", params: commonParams },
    paymentsIn: { path: "/ui/aggregations/payments-in", params: commonParams },
    paymentsOut: { path: "/ui/aggregations/payments-out", params: commonParams },
    pos: { path: "/ui/aggregations/pos-sessions", params: new URLSearchParams({ tenant, date_debut, date_fin }) },
  };

  const COMPLETENESS_SNAPSHOT_TIMEOUT_MS = 3000; // SPEC §5.1 : 5s max — 3s pour réactivité
  const roundMs = Math.min(1500, Math.floor(SEALED_COUNT_BUDGET_MS / 2));
  /** Snapshot scopé (période + société) pour le reste du dashboard */
  const fetchCompletenessSnapshot = async () => {
    try {
      const params = new URLSearchParams({ tenant, date_debut, date_fin });
      if (company_id) params.set("company_id", company_id);
      const data = await fetchJsonWithTimeout("/ui/completeness-snapshot", params, COMPLETENESS_SNAPSHOT_TIMEOUT_MS);
      return data as {
        sealed_count?: number;
        expected_count?: number | null;
        complete?: boolean;
        sealed_count_sources?: Record<string, boolean>;
        generated_at?: string | null;
      } | null;
    } catch {
      return null;
    }
  };
  /** Snapshot total tenant (période large, sans company_id) pour le badge « X preuves scellées » — ne pas remonter une valeur inférieure au total Vault */
  const fetchCompletenessSnapshotTotal = async () => {
    try {
      const params = new URLSearchParams({
        tenant,
        date_debut: "2000-01-01",
        date_fin: "2030-12-31",
      });
      const data = await fetchJsonWithTimeout("/ui/completeness-snapshot", params, COMPLETENESS_SNAPSHOT_TIMEOUT_MS);
      return data as {
        sealed_count?: number;
        complete?: boolean;
        sealed_count_sources?: Record<string, boolean>;
        generated_at?: string | null;
      } | null;
    } catch {
      return null;
    }
  };
  /** Snapshot total tenant + société (période large 2000-2030, avec company_id) pour le footer « Preuves scellées : X » */
  const fetchCompletenessSnapshotTotalForCompany = async () => {
    if (!company_id) return null;
    try {
      const params = new URLSearchParams({
        tenant,
        company_id,
        date_debut: "2000-01-01",
        date_fin: "2030-12-31",
      });
      const data = await fetchJsonWithTimeout("/ui/completeness-snapshot", params, COMPLETENESS_SNAPSHOT_TIMEOUT_MS);
      return data as {
        sealed_count?: number;
        complete?: boolean;
        sealed_count_sources?: Record<string, boolean>;
        generated_at?: string | null;
      } | null;
    } catch {
      return null;
    }
  };
  const fetchSealedSourcesWithRetry = async (): Promise<Record<SealedSourceKey, unknown>> => {
    const results: Record<SealedSourceKey, unknown> = {} as Record<SealedSourceKey, unknown>;
    let toFetch: SealedSourceKey[] = ["sales", "purchases", "paymentsIn", "paymentsOut", "pos"];
    for (let round = 0; round < 2 && toFetch.length > 0; round++) {
      const fetched = await Promise.all(
        toFetch.map(async (k) => {
          const { path, params } = sealedSourcePaths[k];
          const data = await fetchJsonWithTimeout(path, params, roundMs);
          return { k, data };
        })
      );
      toFetch = [];
      for (const { k, data } of fetched) {
        results[k] = data;
        if (data == null) toFetch.push(k);
      }
    }
    return results;
  };

  /** Linky ne voit que le Vault : toutes les sources scellées viennent du Vault */
  const sealedResultsPromise = fetchSealedSourcesWithRetry();

  try {
    const treasuryParams = new URLSearchParams({ tenant, date_debut, date_fin, ...(company_id && { company_id }) });
    const arByPartnerParams = new URLSearchParams({ ...Object.fromEntries(commonParams), overdue: "false", limit: "50" });

    const [sealedRaw, snapshotRes, snapshotTotalRes, snapshotTotalCompanyRes, otherCritical] = await Promise.all([
      sealedResultsPromise,
      fetchCompletenessSnapshot(),
      fetchCompletenessSnapshotTotal(),
      fetchCompletenessSnapshotTotalForCompany(),
      Promise.all([
        fetchJsonWithTimeout("/ui/aggregations/treasury", treasuryParams, SEALED_COUNT_BUDGET_MS),
        fetchJsonWithTimeout("/ui/system/vault-health", new URLSearchParams({ tenant }), BANK_RECONCILIATION_TIMEOUT_MS),
        fetchJsonWithTimeout("/ui/system/bank-reconciliation-health", treasuryParams, BANK_RECONCILIATION_TIMEOUT_MS),
        fetchJsonWithTimeout("/ui/aggregations/adjustments", new URLSearchParams({ ...Object.fromEntries(commonParams), event_type: "credit_note.customer.issued" }), SEALED_COUNT_BUDGET_MS),
        fetchJsonWithTimeout("/ui/aggregations/adjustments", new URLSearchParams({ ...Object.fromEntries(commonParams), event_type: "credit_note.supplier.received" }), SEALED_COUNT_BUDGET_MS),
        fetchJsonWithTimeout("/ui/aggregations/adjustments", new URLSearchParams({ ...Object.fromEntries(commonParams), event_type: "refund.customer.paid" }), SEALED_COUNT_BUDGET_MS),
        fetchJsonWithTimeout("/ui/aggregations/adjustments", new URLSearchParams({ ...Object.fromEntries(commonParams), event_type: "refund.supplier.received" }), SEALED_COUNT_BUDGET_MS),
        fetchJsonWithTimeout(
          "/ui/aggregations/payments-completeness",
          new URLSearchParams({ tenant, date_from: date_debut, date_to: date_fin }),
          SEALED_COUNT_BUDGET_MS
        ),
        fetchJsonWithTimeout("/ui/aggregations/payroll", commonParams, SEALED_COUNT_BUDGET_MS),
      ]),
    ]);

    const sealedResults = sealedRaw as Record<SealedSourceKey, unknown>;
    const salesRes = sealedResults.sales;
    const purchasesRes = sealedResults.purchases;
    const paymentsInRes = sealedResults.paymentsIn;
    const paymentsOutRes = sealedResults.paymentsOut;
    const posRes = sealedResults.pos;
    const [
      treasuryRes,
      vaultHealthRes,
      healthRes,
      adjCreditClientRes,
      adjCreditSupplierRes,
      adjRefundClientRes,
      adjRefundSupplierRes,
      paymentsCompletenessRes,
      payrollRes,
    ] = otherCritical;
    // AR totals : toujours fetché (BFR/Encours dans la grille), limit=1 suffit pour les totaux
    const arByPartnerMinimalParams = new URLSearchParams({ ...Object.fromEntries(commonParams), overdue: "false", limit: "1" });
    const arTotalsFetch = fetchJsonWithTimeout("/ui/aggregations/ar-by-partner", arByPartnerMinimalParams, SEALED_COUNT_BUDGET_MS).catch(() => null);
    // AP totals : pour BFR complet (tuile + card) = Stock + AR - AP (ZeDocs/web52)
    const apTotalsFetch = fetchJsonWithTimeout("/ui/aggregations/ap-by-partner", arByPartnerMinimalParams, SEALED_COUNT_BUDGET_MS).catch(() => null);
    // Contexte analytique Diva : top 10 partenaires en retard triés par PriorityScore (Critique en premier)
    // Séparé du fetch minimal pour ne pas dépendre du mode (cockpit vs detail)
    const arDivaContextParams = new URLSearchParams({ ...Object.fromEntries(commonParams), overdue: "true", limit: "10" });
    const arDivaContextFetch = fetchJsonWithTimeout("/ui/aggregations/ar-by-partner", arDivaContextParams, SEALED_COUNT_BUDGET_MS).catch(() => null);
    // Stock valuation : BFR complet quand company_id (ZeDocs/web52 Option B)
    const stockValuationParams = company_id ? new URLSearchParams({ tenant, company_id }) : null;
    const stockValuationFetch = stockValuationParams
      ? fetchJsonWithTimeout("/ui/aggregations/stock-valuation", stockValuationParams, 8000).catch(() => null)
      : Promise.resolve(null);

    const optionalFetches = minimal
      ? Promise.resolve([null, null] as [null, null])
      : Promise.all([
          fetchJsonWithTimeout("/ui/aggregations/sales-by-partner", commonParams, 12_000).catch(() => null),
          fetchJsonWithTimeout("/ui/aggregations/ar-by-partner", arByPartnerParams, 12_000).catch(() => null),
        ]);

    // ADR-001 : Linky ne connaît que le Vault ; tuile Énergie stratégique via /ui/dlp/energy-summary
    const dlpFetch = (async () => {
      try {
        const dlpParams = new URLSearchParams({ tenant, period_days: "90" });
        if (company_id) dlpParams.set("company_id", company_id);
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), DLP_TIMEOUT_MS);
        const res = await fetch(
          `${base}/ui/dlp/energy-summary?${dlpParams}`,
          { cache: "no-store", headers: { Accept: "application/json", "X-Tenant": tenant }, signal: ctrl.signal }
        );
        clearTimeout(t);
        return res.ok ? await res.json() : null;
      } catch {
        return null;
      }
    })();

    // Durcissement cash: double lecture et sélection de la valeur la plus complète.
    // Cela évite les réponses transitoires incomplètes observées au premier hit.
    const fetchStableCashAgg = async (path: string) => {
      const a = await fetchJsonWithTimeout(path, commonParams, 12_000).catch(() => null);
      const b = await fetchJsonWithTimeout(path, commonParams, 12_000).catch(() => null);
      const pick = [a, b]
        .filter((x) => typeof x?.total === "number")
        .sort((x, y) => Math.abs((y?.total as number) ?? 0) - Math.abs((x?.total as number) ?? 0))[0];
      return pick ?? a ?? b;
    };
    const strictCashFetches = Promise.all([
      fetchStableCashAgg("/ui/aggregations/payments-in"),
      fetchStableCashAgg("/ui/aggregations/payments-out"),
    ]);

    const [[salesByPartnerRes, arByPartnerResFull], dlpData, [paymentsInStrictRes, paymentsOutStrictRes], arTotalsRes, apTotalsRes, stockValuationRes, arDivaContextRes] = await Promise.all([
      optionalFetches,
      dlpFetch,
      strictCashFetches,
      arTotalsFetch,
      apTotalsFetch,
      stockValuationFetch,
      arDivaContextFetch,
    ]);
    // En vue détail : utiliser la réponse complète ; en mode minimal : utiliser arTotalsRes pour les totaux BFR/Encours
    const arByPartnerRes = arByPartnerResFull ?? arTotalsRes;

    // Tuile Paiements — alignée Card Paiements (mode gouvernance) : montant à rapprocher
    // Affichage : montant à rapprocher (€) ; statut (contour orange) : remaining_ratio
    const reconMetrics = treasuryRes?.reconciliation_metrics as {
      remaining_ratio?: number;
      total_amount_abs?: number;
      remaining_amount_abs?: number;
    } | undefined;
    const remainingRatio = reconMetrics?.remaining_ratio;
    const totalAmountAbs = reconMetrics?.total_amount_abs ?? 0;
    const remainingAmountAbs = reconMetrics?.remaining_amount_abs ?? 0;
    const hasReconMetrics = remainingRatio != null && Number.isFinite(remainingRatio) && totalAmountAbs > 0;

    const rawRate =
      treasuryRes?.process?.reliability_volume ??
      treasuryRes?.reliability_rate ??
      treasuryRes?.reconciliation_rate ??
      null;
    const legacyRatePct = rawRate != null ? (rawRate <= 1 ? rawRate * 100 : rawRate) : null;

    // Pour statut (contour orange) : reste à rapprocher % (0–100)
    let treasuryRemainingPct = hasReconMetrics
      ? remainingRatio! * 100
      : legacyRatePct != null
        ? 100 - legacyRatePct
        : null;
    const treasuryCurrency = treasuryRes?.currency ?? "EUR";
    // Affichage tuile : montant à rapprocher (€) ; fallback unreconciled si pas de reconciliation_metrics
    const unreconciledVol =
      treasuryRes?.process?.unreconciled_volume ??
      treasuryRes?.unreconciled_balance ??
      treasuryRes?.unreconciled ??
      0;
    let amountToReconcile = hasReconMetrics ? remainingAmountAbs : unreconciledVol;
    let treasuryFormatted =
      amountToReconcile > 0 ? formatAmount(amountToReconcile, treasuryCurrency) : "Rapprocher";

    type AggWithTotal = { total?: number; by_method?: Record<string, number>; currency?: string } | null;
    type SealedAgg = { invoices_count?: number; payment_count?: number; items?: unknown } | null;
    const salesOk = salesRes != null && typeof (salesRes as SealedAgg)?.invoices_count === "number";
    const purchasesOk = purchasesRes != null && typeof (purchasesRes as SealedAgg)?.invoices_count === "number";
    const paymentsInOk = paymentsInRes != null && typeof (paymentsInRes as SealedAgg)?.payment_count === "number";
    const paymentsOutOk = paymentsOutRes != null && typeof (paymentsOutRes as SealedAgg)?.payment_count === "number";
    const posOk = posRes != null && Array.isArray((posRes as PosRes)?.items);

    const inTotalRaw = (paymentsInStrictRes as AggWithTotal)?.total ?? (paymentsInRes as AggWithTotal)?.total;
    const outTotalRaw = (paymentsOutStrictRes as AggWithTotal)?.total ?? (paymentsOutRes as AggWithTotal)?.total;
    const inTotal = typeof inTotalRaw === "number" ? inTotalRaw : 0;
    const outTotal = typeof outTotalRaw === "number" ? Math.abs(outTotalRaw) : 0;
    const sealedPaymentsGross = Math.abs(inTotal) + Math.abs(outTotal);
    const sealedPaymentsCount =
      ((paymentsInRes as SealedAgg)?.payment_count ?? 0) + ((paymentsOutRes as SealedAgg)?.payment_count ?? 0);
    // Garde-fou multi-source: si aucune preuve de paiement scellée sur la période, ne pas afficher un reste à rapprocher issu de fallback ERP.
    if (sealedPaymentsCount === 0) {
      treasuryRemainingPct = 0;
      amountToReconcile = 0;
      treasuryFormatted = formatAmount(0, treasuryCurrency);
    }
    // Garde-fou de cohérence: la carte Paiements doit rester bornée au périmètre scellé.
    // Si le fallback ERP renvoie un volume hors-échelle (ex: lignes historiques non scellées),
    // on force l'affichage sur le volume réellement scellé visible dans Linky.
    if (sealedPaymentsCount > 0 && sealedPaymentsGross > 0) {
      const outOfScopeReconciliation = !hasReconMetrics || amountToReconcile > sealedPaymentsGross * 1.25;
      if (outOfScopeReconciliation) {
        amountToReconcile = sealedPaymentsGross;
        treasuryRemainingPct = 100;
        treasuryFormatted = formatAmount(amountToReconcile, treasuryCurrency);
      }
    }
    // Flux net : définition unique = encaissements − décaissements (total), alignée avec la vue détail Flux net.
    // Évite la divergence tuile (ex. net espèces) vs détail (net total) — même formule, même source.
    const cashNet = inTotal - outTotal;
    const cashNetForKpi = paymentsInOk && paymentsOutOk ? cashNet : null;
    const paymentsCompletenessSigned =
      typeof paymentsCompletenessRes?.payments_sum_amount_signed === "number"
        ? paymentsCompletenessRes.payments_sum_amount_signed
        : null;

    type SalesPurch = { total_ht?: number; total?: number; total_tax?: number; currency?: string } | null;
    const salesTotalRaw = (salesRes as SalesPurch)?.total_ht ?? (salesRes as SalesPurch)?.total;
    const purchasesTotalRaw = (purchasesRes as SalesPurch)?.total_ht ?? (purchasesRes as SalesPurch)?.total;
    const salesTotal = typeof salesTotalRaw === "number" ? salesTotalRaw : 0;
    const purchasesTotal = typeof purchasesTotalRaw === "number" ? Math.abs(purchasesTotalRaw) : 0;
    const salesByPartnerTotal =
      typeof salesByPartnerRes?.total_ht === "number" ? salesByPartnerRes.total_ht : null;
    const normalizedSalesTotal = Math.max(
      salesByPartnerTotal ?? 0,
      salesTotal
    );
    const businessNet = normalizedSalesTotal - purchasesTotal;
    // KPI Business (tuile) = CA ventes HT ; on retient la meilleure source disponible.
    const businessValueForKpi =
      normalizedSalesTotal > 0 ? normalizedSalesTotal : (salesOk ? salesTotal : null);

    const tvaCollectee = (salesRes as SalesPurch)?.total_tax ?? 0;
    const tvaDeductible = (purchasesRes as SalesPurch)?.total_tax ?? 0;
    const taxesFlux = tvaCollectee - tvaDeductible;

    type AdjRes = { total_amount?: number; total?: number; currency?: string } | null;
    const creditClient = (adjCreditClientRes as AdjRes)?.total_amount ?? (adjCreditClientRes as AdjRes)?.total ?? 0;
    const creditSupplier = (adjCreditSupplierRes as AdjRes)?.total_amount ?? (adjCreditSupplierRes as AdjRes)?.total ?? 0;
    const creditNotesFlux = creditSupplier - creditClient;

    const refundClient = (adjRefundClientRes as AdjRes)?.total_amount ?? (adjRefundClientRes as AdjRes)?.total ?? 0;
    const refundSupplier = (adjRefundSupplierRes as AdjRes)?.total_amount ?? (adjRefundSupplierRes as AdjRes)?.total ?? 0;
    const refundsFlux = refundSupplier - refundClient;

    type PosRes = { currency?: string; items?: Array<{
      session_id?: string; shop_id?: string; total_sales?: number;
      total_tickets?: number; cash_total?: number; card_total?: number;
      difference?: number; vault_status?: string;
    }> } | null;
    const posItems: Array<{
      session_id?: string; shop_id?: string; total_sales?: number;
      total_tickets?: number; cash_total?: number; card_total?: number;
      difference?: number; vault_status?: string;
    }> = (posRes as PosRes)?.items ?? [];

    const posTotal = posItems
      .filter((s) => s.vault_status === "sealed")
      .reduce((acc, s) => acc + (s.total_sales ?? 0), 0);

    const posCashTotal = posItems.reduce((acc, s) => acc + (s.cash_total ?? 0), 0);
    const posCardTotal = posItems.reduce((acc, s) => acc + (s.card_total ?? 0), 0);
    const posTotalTickets = posItems.reduce((acc, s) => acc + (s.total_tickets ?? 0), 0);
    const posTotalDifference = posItems.reduce((acc, s) => acc + (s.difference ?? 0), 0);
    const posAnomalySessions = posItems.filter((s) => (s.difference ?? 0) !== 0).length;
    const posSealedCount = posItems.filter((s) => s.vault_status === "sealed").length;
    const posPendingCount = posItems.filter((s) => s.vault_status === "pending").length;

    const posShopMap = new Map<string, PosShopSummary>();
    for (const s of posItems) {
      const shopId = s.shop_id ?? "(inconnu)";
      const cur = posShopMap.get(shopId);
      if (cur) {
        cur.sessions_count += 1;
        cur.sealed_count += s.vault_status === "sealed" ? 1 : 0;
        cur.total_sales += s.total_sales ?? 0;
        cur.cash_total += s.cash_total ?? 0;
        cur.card_total += s.card_total ?? 0;
        cur.total_tickets += s.total_tickets ?? 0;
        cur.anomaly_count += (s.difference ?? 0) !== 0 ? 1 : 0;
      } else {
        posShopMap.set(shopId, {
          shop_id: shopId,
          sessions_count: 1,
          sealed_count: s.vault_status === "sealed" ? 1 : 0,
          total_sales: s.total_sales ?? 0,
          cash_total: s.cash_total ?? 0,
          card_total: s.card_total ?? 0,
          total_tickets: s.total_tickets ?? 0,
          anomaly_count: (s.difference ?? 0) !== 0 ? 1 : 0,
        });
      }
    }
    const posShops = Array.from(posShopMap.values()).sort((a, b) => b.total_sales - a.total_sales);

    const posSessionDetails: PosSessionDetail[] = posItems.map((s) => ({
      session_id: s.session_id ?? "",
      shop_id: s.shop_id ?? "(inconnu)",
      total_sales: s.total_sales ?? 0,
      total_tickets: s.total_tickets ?? 0,
      cash_total: s.cash_total ?? 0,
      card_total: s.card_total ?? 0,
      difference: s.difference ?? 0,
      vault_status: s.vault_status ?? "unknown",
    }));

    // Treasury v4.1 : position/process ou legacy
    const reconciled =
      treasuryRes?.process?.reconciled_volume ??
      treasuryRes?.reconciled_balance ??
      treasuryRes?.reconciled ??
      0;
    const unreconciled =
      treasuryRes?.process?.unreconciled_volume ??
      treasuryRes?.unreconciled_balance ??
      treasuryRes?.unreconciled ??
      0;
    const accountingTotal =
      treasuryRes?.accounting_balance ?? treasuryRes?.total ?? reconciled + unreconciled;

    // Bank health : healthRes en priorité ; fallback treasuryRes (Vault v4.1 inclut bank_* dans treasury)
    let unreconciledLinesCount: number | null = null;
    let lastStatementImportDate: string | null = null;
    let journalsCount: number | null = null;
    let oldestUnreconciledDate: string | null = null;
    if (healthRes) {
      unreconciledLinesCount = typeof healthRes.unreconciled_entries === "number" ? healthRes.unreconciled_entries : null;
      journalsCount = typeof healthRes.bank_accounts_count === "number" ? healthRes.bank_accounts_count : null;
      lastStatementImportDate = typeof healthRes.last_statement_date === "string" && healthRes.last_statement_date ? healthRes.last_statement_date : null;
      oldestUnreconciledDate = typeof healthRes.oldest_unreconciled_date === "string" && healthRes.oldest_unreconciled_date ? healthRes.oldest_unreconciled_date : null;
    }
    if (journalsCount == null && typeof treasuryRes?.bank_accounts_count === "number") journalsCount = treasuryRes.bank_accounts_count;
    if (lastStatementImportDate == null && typeof treasuryRes?.last_statement_date === "string") lastStatementImportDate = treasuryRes.last_statement_date;
    if (oldestUnreconciledDate == null && typeof treasuryRes?.oldest_unreconciled_date === "string") oldestUnreconciledDate = treasuryRes.oldest_unreconciled_date;
    const hasUnreconciledEntries = unreconciledLinesCount != null;
    const hasLastStatement = lastStatementImportDate != null && lastStatementImportDate !== "";
    let bankHealthMetrics: DataCompletenessBankHealth = "absent";
    if (healthRes && hasUnreconciledEntries && hasLastStatement) bankHealthMetrics = "complete";
    else if (healthRes && hasUnreconciledEntries) bankHealthMetrics = "partial";

    const fallbackSealedCountComplete = salesOk && purchasesOk && paymentsInOk && paymentsOutOk && posOk;
    const fallbackSealedCount =
      posSealedCount +
      ((salesRes as SealedAgg)?.invoices_count ?? 0) +
      ((purchasesRes as SealedAgg)?.invoices_count ?? 0) +
      ((paymentsInRes as SealedAgg)?.payment_count ?? 0) +
      ((paymentsOutRes as SealedAgg)?.payment_count ?? 0);

    // Fallback DVIG : si les routes Vault /ui/aggregations/* ne sont pas disponibles (vault ancien),
    // interroger DVIG pour dériver la complétude à partir du vault_rate.
    let dvigCompleteOverride: boolean | null = null;
    if (!fallbackSealedCountComplete && DVIG_URL && DVIG_INTERNAL_TOKEN) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        const dvigRes = await fetch(
          `${DVIG_URL.replace(/\/$/, "")}/internal/vault-health?tenant=${encodeURIComponent(tenant)}`,
          {
            headers: { Accept: "application/json", Authorization: `Bearer ${DVIG_INTERNAL_TOKEN}` },
            cache: "no-store",
            signal: ctrl.signal,
          }
        );
        clearTimeout(t);
        if (dvigRes.ok) {
          const dvigData = (await dvigRes.json()) as {
            vault_rate?: number | null;
            pending_events?: number;
            failed_events?: number;
            last_sync_at?: string | null;
          };
          const rawRate = dvigData.vault_rate ?? null;
          const rate = rawRate != null ? (rawRate > 1 ? rawRate / 100 : rawRate) : null;
          if (rate != null && rate >= 0.98 && (dvigData.pending_events ?? 0) === 0) {
            dvigCompleteOverride = true;
          } else if (rate != null && dvigData.last_sync_at) {
            // Tolérer si synchro récente (< 48h) même avec quelques événements en attente
            const syncAge = Date.now() - new Date(dvigData.last_sync_at).getTime();
            dvigCompleteOverride = syncAge < 48 * 3600 * 1000;
          }
        }
      } catch {
        // Silencieux — fallback dégradé
      }
    }

    // Badge « X preuves scellées » : afficher le nombre sur la période (et société) sélectionnée pour que le filtre soit cohérent.
    // On préfère le snapshot scopé (période + company_id) ; repli sur le total tenant si indisponible.
    const snapshotForBadge = snapshotRes ?? snapshotTotalRes;
    const useSnapshotForBadge =
      snapshotForBadge != null &&
      typeof snapshotForBadge.sealed_count === "number" &&
      typeof snapshotForBadge.complete === "boolean" &&
      snapshotForBadge.sealed_count_sources != null;
    const sealedCount = useSnapshotForBadge ? snapshotForBadge.sealed_count : fallbackSealedCount;
    /** Footer : total preuves scellées pour le tenant (et la société si company_id) — toutes périodes */
    const sealedCountTotal =
      typeof snapshotTotalCompanyRes?.sealed_count === "number"
        ? snapshotTotalCompanyRes.sealed_count
        : typeof snapshotTotalRes?.sealed_count === "number"
          ? snapshotTotalRes.sealed_count
          : null;

    const useScopedSnapshotForCompleteness =
      snapshotRes != null &&
      typeof snapshotRes.sealed_count === "number" &&
      typeof snapshotRes.complete === "boolean" &&
      snapshotRes.sealed_count_sources != null;
    const sealedCountComplete = useScopedSnapshotForCompleteness
      ? snapshotRes.complete
      : (dvigCompleteOverride ?? fallbackSealedCountComplete);
    const sealedCountSources = useScopedSnapshotForCompleteness
      ? {
          sales: !!snapshotRes.sealed_count_sources?.sales,
          purchases: !!snapshotRes.sealed_count_sources?.purchases,
          paymentsIn: !!snapshotRes.sealed_count_sources?.paymentsIn,
          paymentsOut: !!snapshotRes.sealed_count_sources?.paymentsOut,
          pos: !!snapshotRes.sealed_count_sources?.pos,
        }
      : { sales: salesOk, purchases: purchasesOk, paymentsIn: paymentsInOk, paymentsOut: paymentsOutOk, pos: posOk };
    const expectedCount =
      snapshotRes != null && typeof snapshotRes.expected_count === "number" ? snapshotRes.expected_count : null;
    const generatedAtFromSnapshot =
      snapshotForBadge != null && typeof snapshotForBadge.generated_at === "string" ? snapshotForBadge.generated_at : null;
    const generatedAtFromVaultHealth =
      vaultHealthRes != null && typeof (vaultHealthRes as { last_sync_at?: unknown }).last_sync_at === "string"
        ? ((vaultHealthRes as { last_sync_at?: string }).last_sync_at ?? null)
        : null;
    const generatedAt = generatedAtFromSnapshot ?? generatedAtFromVaultHealth;
    const linkyDataAvailableAt = new Date().toISOString();
    const responseComputedAtMs = Date.parse(linkyDataAvailableAt);
    const generatedAtMs = generatedAt ? Date.parse(generatedAt) : NaN;
    const fallbackProxyMs = responseComputedAtMs - requestStartedAtMs;
    const uxSampleMs =
      Number.isFinite(generatedAtMs) && Number.isFinite(responseComputedAtMs)
        ? responseComputedAtMs - generatedAtMs
        : fallbackProxyMs;
    if (uxSampleMs != null && uxSampleMs >= 0) {
      recordUxSample({
        tenant,
        company: company_id,
        periodFrom: date_debut,
        periodTo: date_fin,
        latencyMs: uxSampleMs,
        atIso: linkyDataAvailableAt,
      });
    }

    // Toutes les valeurs trésorerie proviennent du Vault (source unique).
    const validatedBalance = treasuryRes?.position?.validated_balance ?? null;
    const erpBalance = treasuryRes?.position?.erp_balance ?? null;
    const treasuryPositionValue = validatedBalance != null ? validatedBalance : null;
    const treasuryPositionFormatted =
      treasuryPositionValue != null ? formatAmount(treasuryPositionValue, treasuryCurrency) : "—";

    const cashCurrency =
      (paymentsInStrictRes as AggWithTotal)?.currency ??
      (paymentsOutStrictRes as AggWithTotal)?.currency ??
      (paymentsInRes as AggWithTotal)?.currency ??
      (paymentsOutRes as AggWithTotal)?.currency ??
      treasuryCurrency;
    const cashLooksInconsistent =
      cashCurrency !== treasuryCurrency &&
      paymentsCompletenessSigned != null;
    const cashValueNormalizedRaw = cashLooksInconsistent ? paymentsCompletenessSigned : cashNetForKpi;
    let cashValueNormalized = cashValueNormalizedRaw;
    // Dernier garde-fou: ne pas descendre sous la valeur certifiée payments-completeness si disponible.
    if (typeof cashValueNormalizedRaw === "number" && paymentsCompletenessSigned != null) {
      cashValueNormalized = Math.max(cashValueNormalizedRaw, paymentsCompletenessSigned);
    }
    const cashCurrencyNormalized = cashLooksInconsistent ? treasuryCurrency : cashCurrency;
    const businessCurrency =
      (salesByPartnerTotal != null ? treasuryCurrency : undefined) ??
      (salesRes as SalesPurch)?.currency ??
      (purchasesRes as SalesPurch)?.currency ??
      treasuryCurrency;
    const adjustmentsCurrency =
      (adjCreditClientRes as AdjRes)?.currency ??
      (adjCreditSupplierRes as AdjRes)?.currency ??
      (adjRefundClientRes as AdjRes)?.currency ??
      (adjRefundSupplierRes as AdjRes)?.currency ??
      businessCurrency;
    const posCurrency = (posRes as PosRes)?.currency ?? treasuryCurrency;

    const accountVolumeBreakdown = normalizeTreasuryAccountVolumeBreakdown(
      (treasuryRes as { account_volume_breakdown?: unknown } | null)?.account_volume_breakdown
    );

    const response: DashboardMetricsResponse = {
      data_completeness: { bank_health_metrics: bankHealthMetrics },
      sealed_count: sealedCount,
      sealed_count_total: sealedCountTotal,
      sealed_count_complete: sealedCountComplete,
      sealed_count_sources: sealedCountSources,
      expected_count: expectedCount ?? undefined,
      generated_at: generatedAt ?? undefined,
      linky_data_available_at: linkyDataAvailableAt,
      ux_t_ms: uxSampleMs,
      _details: {
        treasury: {
          reconciled,
          unreconciled,
          total: accountingTotal,
          currency: treasuryCurrency,
          treasury_validated_pct: treasuryRemainingPct != null ? 100 - treasuryRemainingPct : legacyRatePct ?? undefined,
          validated_balance: validatedBalance ?? undefined,
          erp_balance: erpBalance ?? undefined,
          unreconciled_lines_count: unreconciledLinesCount,
          last_statement_import_date: lastStatementImportDate,
          journals_count: journalsCount,
          oldest_unreconciled_date: oldestUnreconciledDate,
          ...(accountVolumeBreakdown ? { account_volume_breakdown: accountVolumeBreakdown } : {}),
        },
        cash: { encaissements: inTotal, decaissements: outTotal, net: cashNet, currency: cashCurrency },
        business: {
          ventes: normalizedSalesTotal,
          achats: purchasesTotal,
          net: businessNet,
          currency: businessCurrency,
          sales_by_partner: salesByPartnerRes
            ? {
                total_ht: salesByPartnerRes.total_ht ?? 0,
                partners_count: salesByPartnerRes.partners_count ?? 0,
                items: salesByPartnerRes.items ?? [],
                pareto_80_cutoff: salesByPartnerRes.pareto_80_cutoff ?? 0,
                pareto_80_partners: salesByPartnerRes.pareto_80_partners ?? [],
              }
            : undefined,
          ar_by_partner: (arByPartnerRes ?? arDivaContextRes)
            ? {
                // Totaux depuis le fetch all-open (BFR/Encours corrects)
                totals: arByPartnerRes?.totals ?? arDivaContextRes?.totals ?? { open_amount: 0, overdue_amount: 0, open_count_invoices: 0, overdue_count_invoices: 0, missing_due_date_count: 0 },
                // Partners depuis le fetch overdue trié par PriorityScore (Diva identifie le bon débiteur critique)
                partners: arDivaContextRes?.partners ?? arByPartnerRes?.partners ?? [],
                meta: (arDivaContextRes ?? arByPartnerRes)?.meta ?? { freshness: "unknown", warnings: [] },
              }
            : undefined,
        },
        credit_notes: {
          clients: creditClient,
          fournisseurs: creditSupplier,
          flux: creditNotesFlux,
          currency: adjustmentsCurrency,
        },
        refunds: {
          clients: refundClient,
          fournisseurs: refundSupplier,
          flux: refundsFlux,
          currency: adjustmentsCurrency,
        },
        pos_shops: {
          total_sessions: posItems.length,
          sealed_sessions: posSealedCount,
          pending_sessions: posPendingCount,
          total_tickets: posTotalTickets,
          cash_total: posCashTotal,
          card_total: posCardTotal,
          total_difference: posTotalDifference,
          anomaly_sessions: posAnomalySessions,
          shops: posShops,
          sessions: posSessionDetails,
          currency: posCurrency,
        },
      },
      treasury: {
        value: treasuryPositionValue,
        formatted: treasuryPositionFormatted,
        valueKind: treasuryPositionValue != null ? (treasuryPositionValue >= 0 ? "positive" : "negative") : "neutral",
      },
      treasury_position: {
        value: treasuryRemainingPct,
        formatted: treasuryFormatted,
        valueKind: "accent",
      },
      cash: {
        value: cashValueNormalized,
        formatted: cashValueNormalized == null ? "—" : formatSignedAmount(cashValueNormalized, cashCurrencyNormalized),
        valueKind: cashValueNormalized == null ? "neutral" : toValueKind(cashValueNormalized, true),
      },
      business: {
        value: businessValueForKpi,
        formatted: businessValueForKpi == null ? "—" : formatSignedAmount(businessValueForKpi, businessCurrency),
        valueKind: businessValueForKpi == null ? "neutral" : toValueKind(businessValueForKpi, true),
      },
      taxes: {
        value: taxesFlux,
        formatted: formatSignedAmount(taxesFlux, adjustmentsCurrency),
        valueKind: taxesFlux === 0 ? "accent_soft" : "accent",
      },
      credit_notes: {
        value: creditNotesFlux,
        formatted: formatSignedAmount(creditNotesFlux, adjustmentsCurrency),
        valueKind: creditNotesFlux === 0 ? "accent_soft" : "accent",
      },
      refunds: {
        value: refundsFlux,
        formatted: formatSignedAmount(refundsFlux, adjustmentsCurrency),
        valueKind: refundsFlux === 0 ? "accent_soft" : "accent",
      },
      pos_shops: {
        value: posTotal,
        formatted: formatAmount(posTotal, posCurrency),
        valueKind: "neutral",
      },
      pos_z: {
        value: null,
        formatted: "—",
        valueKind: "placeholder",
      },
    };

    // Énergie stratégique (DLP) — déjà fetcher en parallèle avec Vault
    const hits = dlpData?.hits_total ?? 0;
    response.strategic_energy = {
      value: hits,
      formatted: hits > 0 ? `${hits} hit${hits > 1 ? "s" : ""}` : "—",
      valueKind: hits > 0 ? "accent_soft" : "neutral",
    };

    // BFR / Encours — AR open (créances clients), AP open (dettes fournisseurs), stock (ZeDocs/web52)
    const arOpenAmount: number | null =
      typeof arByPartnerRes?.totals?.open_amount === "number" ? arByPartnerRes.totals.open_amount : null;
    const arOverdueAmount: number | null =
      typeof arByPartnerRes?.totals?.overdue_amount === "number" ? arByPartnerRes.totals.overdue_amount : null;
    const apOpenAmount: number | null =
      typeof (apTotalsRes as { totals?: { open_amount?: number } } | null)?.totals?.open_amount === "number"
        ? (apTotalsRes as { totals: { open_amount: number } }).totals.open_amount
        : null;
    const stockValue: number | null =
      typeof (stockValuationRes as { value?: number } | null)?.value === "number" ? (stockValuationRes as { value: number }).value : null;
    const bfrCurrency = businessCurrency;

    // working_capital = BFR complet si stock dispo (Stock + AR - AP), sinon AR - AP, sinon AR (ZeDocs/web52)
    const workingCapitalValue =
      stockValue != null && arOpenAmount != null && apOpenAmount != null
        ? stockValue + arOpenAmount - apOpenAmount
        : arOpenAmount != null && apOpenAmount != null
          ? arOpenAmount - apOpenAmount
          : arOpenAmount;
    response.working_capital = {
      value: workingCapitalValue,
      formatted: workingCapitalValue != null ? formatAmount(workingCapitalValue, bfrCurrency) : "—",
      valueKind: workingCapitalValue == null ? "neutral" : workingCapitalValue > 0 ? "accent" : "zero",
    };

    // encours = AR open — couleur neutre (accent/bleu) : l'encours n'est pas un problème en soi.
    // Le statut watch (contour orange) signale les retards, pas la couleur de la valeur.
    response.encours = {
      value: arOpenAmount,
      formatted: arOpenAmount != null ? formatAmount(arOpenAmount, bfrCurrency) : "—",
      valueKind: arOpenAmount == null ? "neutral" : arOpenAmount > 0 ? "accent" : "zero",
    };

    // EBE — aligné vue détaillée : marge brute (+ avoirs nets) − charges de personnel (payroll OD ou bulletins)
    const payrollTotal =
      typeof (payrollRes as { total?: number })?.total === "number"
        ? (payrollRes as { total: number }).total
        : typeof (payrollRes as { total_charges?: number })?.total_charges === "number"
          ? (payrollRes as { total_charges: number }).total_charges
          : null;
    const payrollSource = (payrollRes as { payroll_source?: string })?.payroll_source;
    const hasPayroll =
      (payrollSource === "od" || payrollSource === "payslip") &&
      payrollTotal != null &&
      typeof payrollTotal === "number";
    const ebeProxy = businessNet + creditNotesFlux;
    const ebeValue =
      hasPayroll && ebeProxy != null && Number.isFinite(ebeProxy)
        ? ebeProxy - payrollTotal
        : null;
    response.ebitda = {
      value: ebeValue,
      formatted: ebeValue != null ? formatSignedAmount(ebeValue, businessCurrency) : "—",
      valueKind: ebeValue != null ? toValueKind(ebeValue, true) : "placeholder",
    };

    computeCardStatuses(response);
    const responseHeaders: Record<string, string> = {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      // US-10 : en-tête de dépréciation (RFC 8594)
      "Deprecation": "true",
      "Sunset": "2026-12-31",
      "Link": '</api/instruments>; rel="successor-version"',
    };
    return NextResponse.json(response, { headers: responseHeaders });
  } catch (err) {
    console.error("[dashboard-metrics] Error:", err);
    const empty: KpiMetric = { value: null, formatted: "—", valueKind: "neutral" };
    return NextResponse.json(
      {
        treasury: empty,
        treasury_position: empty,
        cash: empty,
        business: empty,
        taxes: empty,
        credit_notes: empty,
        refunds: empty,
        pos_shops: empty,
        pos_z: { value: null, formatted: "—", valueKind: "placeholder" as const },
        strategic_energy: { value: null, formatted: "—", valueKind: "placeholder" as const },
        sealed_count: 0,
        sealed_count_complete: false,
        _fallback: true,
        _error: err instanceof Error ? err.message : String(err),
      } satisfies DashboardMetricsResponse & { _fallback?: boolean; _error?: string },
      { status: 200 }
    );
  }
}
