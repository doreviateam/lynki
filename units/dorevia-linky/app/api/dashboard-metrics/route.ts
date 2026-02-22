import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 15000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

export type ValueKind = "positive" | "negative" | "zero" | "accent" | "accent_soft" | "neutral" | "placeholder";

export type CardStatusValue = "neutral" | "ok" | "watch" | "alert";

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
  totals: { open_amount: number; overdue_amount: number; open_count_invoices: number; overdue_count_invoices: number; missing_due_date_count: number };
  partners: Array<{ partner_id: string; partner_name?: string; open_amount: number; overdue_amount: number; share_percent: number }>;
  meta: { freshness: string; warnings?: string[] };
}

export type DataCompletenessBankHealth = "absent" | "partial" | "complete";

export interface TreasuryDetail {
  reconciled: number;
  unreconciled: number;
  total: number;
  currency: string;
  /** Lignes non rapprochées (bank-reconciliation-health) — DIVA axe discipline */
  unreconciled_lines_count?: number | null;
  last_statement_import_date?: string | null;
  journals_count?: number | null;
  oldest_unreconciled_date?: string | null;
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
  cash: KpiMetric;
  business: KpiMetric;
  taxes: KpiMetric;
  credit_notes: KpiMetric;
  refunds: KpiMetric;
  pos_shops: KpiMetric;
  pos_z: KpiMetric;
  /** Détails par axe (enrichissement pour DIVA/Mistral) */
  _details?: CardDetails;
  /** Complétude des données (DIVA — axe discipline). complete = disponibles, pas qualité. */
  data_completeness?: DataCompleteness;
}

const SPACE = "\u0020";

function formatWithThousands(n: number, decimals = 0): string {
  const fixed = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
  const [intPart, decPart] = fixed.split(".");
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, SPACE);
  return decPart ? `${withSpaces},${decPart}` : withSpaces;
}

function formatAmount(value: number, currency = "EUR"): string {
  return `${formatWithThousands(value, 2)} €`;
}

function formatSignedAmount(value: number): string {
  const sign = value >= 0 ? "+" : "\u2212";
  return `${sign} ${formatWithThousands(Math.abs(value), 2)} €`;
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
  const tPct = resp.treasury.value;
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

  // §4.1 Trésorerie validée (KPI maître)
  if (tPct == null) set(resp.treasury, "neutral", "Donnée non disponible");
  else if (tPct === 0) set(resp.treasury, "watch", "Trésorerie non validée (0 %)");
  else if (tPct < 50) set(resp.treasury, "watch", `Trésorerie faiblement validée (${Math.round(tPct)} %)`);
  else if (tPct < 80) set(resp.treasury, "watch", `Trésorerie partiellement validée (${Math.round(tPct)} %)`);
  else set(resp.treasury, "ok", `Trésorerie validée à ${Math.round(tPct)} %`);

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
 * GET /api/dashboard-metrics — agrège les métriques principales des 8 KPIs pour la grille d'accueil.
 * Appelle le Vault directement (évite les self-fetch qui échouent en Docker).
 * Paramètres : tenant, date_debut, date_fin, company_id
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const date_debut = searchParams.get("date_debut") ?? "2000-01-01";
  const date_fin = searchParams.get("date_fin") ?? "2030-12-31";
  const company_id = searchParams.get("company_id") ?? "";
  const base = VAULT_URL.replace(/\/$/, "");

  const commonParams = new URLSearchParams({
    tenant,
    date_debut,
    date_fin,
    granularity: "month",
    ...(company_id && { company_id }),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const fetchJson = async (path: string, params?: URLSearchParams) => {
    try {
      const qs = params ? `?${params.toString()}` : "";
      const res = await fetch(`${base}${path}${qs}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      return res.ok ? res.json() : null;
    } catch {
      return null;
    }
  };

  try {
    const treasuryParams = new URLSearchParams({ tenant, date_debut, date_fin, ...(company_id && { company_id }) });
    const arByPartnerParams = new URLSearchParams({ ...Object.fromEntries(commonParams), overdue: "false", limit: "50" });
    const [
      treasuryRes,
      healthRes,
      paymentsInRes,
      paymentsOutRes,
      salesRes,
      purchasesRes,
      adjCreditClientRes,
      adjCreditSupplierRes,
      adjRefundClientRes,
      adjRefundSupplierRes,
      posRes,
      salesByPartnerRes,
      arByPartnerRes,
    ] = await Promise.all([
      fetchJson("/ui/aggregations/treasury", treasuryParams),
      fetchJson("/ui/system/bank-reconciliation-health", treasuryParams),
      fetchJson("/ui/aggregations/payments-in", commonParams),
      fetchJson("/ui/aggregations/payments-out", commonParams),
      fetchJson("/ui/aggregations/sales", commonParams),
      fetchJson("/ui/aggregations/purchases", commonParams),
      fetchJson("/ui/aggregations/adjustments", new URLSearchParams({ ...Object.fromEntries(commonParams), event_type: "credit_note.customer.issued" })),
      fetchJson("/ui/aggregations/adjustments", new URLSearchParams({ ...Object.fromEntries(commonParams), event_type: "credit_note.supplier.received" })),
      fetchJson("/ui/aggregations/adjustments", new URLSearchParams({ ...Object.fromEntries(commonParams), event_type: "refund.customer.paid" })),
      fetchJson("/ui/aggregations/adjustments", new URLSearchParams({ ...Object.fromEntries(commonParams), event_type: "refund.supplier.received" })),
      fetchJson("/ui/aggregations/pos-sessions", new URLSearchParams({ tenant, date_debut, date_fin })),
      fetchJson("/ui/aggregations/sales-by-partner", commonParams),
      fetchJson("/ui/aggregations/ar-by-partner", arByPartnerParams),
    ]);

    clearTimeout(timeoutId);

    // Trésorerie validée (tuile) : fiabilité bancaire (reliability_rate) depuis Vault /ui/aggregations/treasury
    const rawRate =
      treasuryRes?.reliability_rate ?? treasuryRes?.reconciliation_rate ?? null;
    const treasuryRatePct =
      rawRate != null ? (rawRate <= 1 ? rawRate * 100 : rawRate) : null;
    const treasuryFormatted =
      treasuryRatePct != null ? `${Math.round(treasuryRatePct)} %` : "—";
    const currency = treasuryRes?.currency ?? "EUR";

    const inTotal = paymentsInRes?.total ?? 0;
    const outTotalRaw = paymentsOutRes?.total ?? 0;
    const outTotal = Math.abs(outTotalRaw);
    const cashNet = inTotal - outTotal;

    const salesTotal = salesRes?.total_ht ?? salesRes?.total ?? 0;
    const purchasesTotal = Math.abs(purchasesRes?.total_ht ?? purchasesRes?.total ?? 0);
    const businessNet = salesTotal - purchasesTotal;

    const tvaCollectee = salesRes?.total_tax ?? 0;
    const tvaDeductible = purchasesRes?.total_tax ?? 0;
    const taxesFlux = tvaCollectee - tvaDeductible;

    const creditClient = adjCreditClientRes?.total_amount ?? adjCreditClientRes?.total ?? 0;
    const creditSupplier = adjCreditSupplierRes?.total_amount ?? adjCreditSupplierRes?.total ?? 0;
    const creditNotesFlux = creditSupplier - creditClient;

    const refundClient = adjRefundClientRes?.total_amount ?? adjRefundClientRes?.total ?? 0;
    const refundSupplier = adjRefundSupplierRes?.total_amount ?? adjRefundSupplierRes?.total ?? 0;
    const refundsFlux = refundSupplier - refundClient;

    const posItems: Array<{
      session_id?: string; shop_id?: string; total_sales?: number;
      total_tickets?: number; cash_total?: number; card_total?: number;
      difference?: number; vault_status?: string;
    }> = posRes?.items ?? [];

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

    const reconciled = treasuryRes?.reconciled_balance ?? treasuryRes?.reconciled ?? 0;
    const unreconciled = treasuryRes?.unreconciled_balance ?? treasuryRes?.unreconciled ?? 0;
    const accountingTotal = treasuryRes?.accounting_balance ?? treasuryRes?.total ?? reconciled + unreconciled;

    // Bank-reconciliation-health (DIVA axe discipline — SPEC Cockpit v1.1)
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
    const hasUnreconciledEntries = unreconciledLinesCount != null;
    const hasLastStatement = lastStatementImportDate != null && lastStatementImportDate !== "";
    let bankHealthMetrics: DataCompletenessBankHealth = "absent";
    if (healthRes && hasUnreconciledEntries && hasLastStatement) bankHealthMetrics = "complete";
    else if (healthRes && hasUnreconciledEntries) bankHealthMetrics = "partial";

    const response: DashboardMetricsResponse = {
      data_completeness: { bank_health_metrics: bankHealthMetrics },
      _details: {
        treasury: {
          reconciled,
          unreconciled,
          total: accountingTotal,
          currency,
          unreconciled_lines_count: unreconciledLinesCount,
          last_statement_import_date: lastStatementImportDate,
          journals_count: journalsCount,
          oldest_unreconciled_date: oldestUnreconciledDate,
        },
        cash: { encaissements: inTotal, decaissements: outTotal, net: cashNet, currency },
        business: {
          ventes: salesTotal,
          achats: purchasesTotal,
          net: businessNet,
          currency,
          sales_by_partner: salesByPartnerRes
            ? {
                total_ht: salesByPartnerRes.total_ht ?? 0,
                partners_count: salesByPartnerRes.partners_count ?? 0,
                items: salesByPartnerRes.items ?? [],
                pareto_80_cutoff: salesByPartnerRes.pareto_80_cutoff ?? 0,
                pareto_80_partners: salesByPartnerRes.pareto_80_partners ?? [],
              }
            : undefined,
          ar_by_partner: arByPartnerRes
            ? {
                totals: arByPartnerRes.totals ?? { open_amount: 0, overdue_amount: 0, open_count_invoices: 0, overdue_count_invoices: 0, missing_due_date_count: 0 },
                partners: arByPartnerRes.partners ?? [],
                meta: arByPartnerRes.meta ?? { freshness: "unknown", warnings: [] },
              }
            : undefined,
        },
        credit_notes: {
          clients: creditClient,
          fournisseurs: creditSupplier,
          flux: creditNotesFlux,
          currency,
        },
        refunds: {
          clients: refundClient,
          fournisseurs: refundSupplier,
          flux: refundsFlux,
          currency,
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
          currency,
        },
      },
      treasury: {
        value: treasuryRatePct,
        formatted: treasuryFormatted,
        valueKind: "accent",
      },
      cash: {
        value: cashNet,
        formatted: formatSignedAmount(cashNet),
        valueKind: toValueKind(cashNet, true),
      },
      business: {
        value: businessNet,
        formatted: formatSignedAmount(businessNet),
        valueKind: toValueKind(businessNet, true),
      },
      taxes: {
        value: taxesFlux,
        formatted: formatSignedAmount(taxesFlux),
        valueKind: taxesFlux === 0 ? "accent_soft" : "accent",
      },
      credit_notes: {
        value: creditNotesFlux,
        formatted: formatSignedAmount(creditNotesFlux),
        valueKind: creditNotesFlux === 0 ? "accent_soft" : "accent",
      },
      refunds: {
        value: refundsFlux,
        formatted: formatSignedAmount(refundsFlux),
        valueKind: refundsFlux === 0 ? "accent_soft" : "accent",
      },
      pos_shops: {
        value: posTotal,
        formatted: formatAmount(posTotal, currency),
        valueKind: "neutral",
      },
      pos_z: {
        value: null,
        formatted: "—",
        valueKind: "placeholder",
      },
    };

    computeCardStatuses(response);
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch {
    clearTimeout(timeoutId);
    const empty: KpiMetric = { value: null, formatted: "—", valueKind: "neutral" };
    return NextResponse.json({
      treasury: empty,
      cash: empty,
      business: empty,
      taxes: empty,
      credit_notes: empty,
      refunds: empty,
      pos_shops: empty,
      pos_z: { value: null, formatted: "—", valueKind: "placeholder" as const },
    } satisfies DashboardMetricsResponse);
  }
}
