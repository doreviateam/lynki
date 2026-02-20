import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 15000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

export type ValueKind = "positive" | "negative" | "zero" | "accent" | "accent_soft" | "neutral" | "placeholder";

export interface KpiMetric {
  value: number | null;
  formatted: string;
  valueKind: ValueKind;
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

export interface CardDetails {
  treasury?: { reconciled: number; unreconciled: number; total: number; currency: string };
  cash?: { encaissements: number; decaissements: number; net: number; currency: string };
  business?: { ventes: number; achats: number; net: number; currency: string };
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
}

function formatAmount(value: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
    currency,
  }).format(value).replace(/\u202f|\u00a0/g, "\u0020");
}

function formatSignedAmount(value: number): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value)).replace(/\u202f|\u00a0/g, "\u0020");
  const sign = value >= 0 ? "+" : "\u2212";
  return `${sign} ${formatted} €`;
}

function toValueKind(value: number, useSigned: boolean): ValueKind {
  if (!useSigned) return "neutral";
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "zero";
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
    const [
      treasuryRes,
      paymentsInRes,
      paymentsOutRes,
      salesRes,
      purchasesRes,
      adjCreditClientRes,
      adjCreditSupplierRes,
      adjRefundClientRes,
      adjRefundSupplierRes,
      posRes,
    ] = await Promise.all([
      fetchJson("/ui/aggregations/treasury", treasuryParams),
      fetchJson("/ui/aggregations/payments-in", commonParams),
      fetchJson("/ui/aggregations/payments-out", commonParams),
      fetchJson("/ui/aggregations/sales", commonParams),
      fetchJson("/ui/aggregations/purchases", commonParams),
      fetchJson("/ui/aggregations/adjustments", new URLSearchParams({ ...Object.fromEntries(commonParams), event_type: "credit_note.customer.issued" })),
      fetchJson("/ui/aggregations/adjustments", new URLSearchParams({ ...Object.fromEntries(commonParams), event_type: "credit_note.supplier.received" })),
      fetchJson("/ui/aggregations/adjustments", new URLSearchParams({ ...Object.fromEntries(commonParams), event_type: "refund.customer.paid" })),
      fetchJson("/ui/aggregations/adjustments", new URLSearchParams({ ...Object.fromEntries(commonParams), event_type: "refund.supplier.received" })),
      fetchJson("/ui/aggregations/pos-sessions", new URLSearchParams({ tenant, date_debut, date_fin })),
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

    const response: DashboardMetricsResponse = {
      _details: {
        treasury: { reconciled, unreconciled, total: accountingTotal, currency },
        cash: { encaissements: inTotal, decaissements: outTotal, net: cashNet, currency },
        business: { ventes: salesTotal, achats: purchasesTotal, net: businessNet, currency },
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

    return NextResponse.json(response);
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
