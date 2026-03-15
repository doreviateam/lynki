/**
 * Metric Engine — Executor
 * SPEC_LINKY_METRIC_ENGINE_v1.0 §5
 *
 * Calcule les métriques dans l'ordre topologique du DAG.
 * Utilise le cache (lecture + écriture).
 * Délègue les fetches au MetricDataFetcher.
 */

import type { MetricValue, ComputeParams, MetricDataFetcher } from "./types";
import { buildDependencyGraph } from "./graph";
import { METRIC_REGISTRY, METRIC_INDEX } from "./registry";
import { cacheGet, cacheSet, recordRecompute } from "./cache";
import { formatAmount, formatSignedAmount } from "@/app/lib/format";

const now = () => new Date().toISOString();

/**
 * Calcule toutes les métriques ou un sous-ensemble.
 * Retourne un Map metric_id → MetricValue.
 */
export async function computeMetrics(
  params: ComputeParams,
  fetcher: MetricDataFetcher,
  metricIds?: string[]
): Promise<Map<string, MetricValue>> {
  const graph = buildDependencyGraph();
  const results = new Map<string, MetricValue>();

  const idsToCompute = metricIds
    ? graph.executionOrder.filter((id) => metricIds.includes(id))
    : graph.executionOrder;

  for (const metric_id of idsToCompute) {
    // 1. Vérifier le cache
    const cached = cacheGet(metric_id, params);
    if (cached) {
      results.set(metric_id, cached);
      continue;
    }

    // 2. Calculer
    recordRecompute();
    const value = await computeSingleMetric(metric_id, params, fetcher, results);
    results.set(metric_id, value);

    // 3. Mettre en cache
    cacheSet(metric_id, params, value);
  }

  return results;
}

/**
 * Calcule une métrique individuelle.
 * Les métriques derived lisent leurs dépendances dans `computed`.
 */
async function computeSingleMetric(
  metric_id: string,
  params: ComputeParams,
  fetcher: MetricDataFetcher,
  computed: Map<string, MetricValue>
): Promise<MetricValue> {
  const def = METRIC_INDEX.get(metric_id);
  if (!def) {
    return unavailable(metric_id, `Metric not found: ${metric_id}`);
  }

  try {
    switch (metric_id) {
      // ── Base metrics ────────────────────────────────────────────────────

      case "treasury_balance": {
        const t = await fetcher.fetchTreasury(params);
        const validated = t?.position?.validated_balance ?? null;
        if (validated == null) return unavailable(metric_id);
        return ok(metric_id, validated, formatAmount(Math.abs(validated), "EUR"), now());
      }

      case "commercial_margin": {
        const [s, p] = await Promise.all([
          fetcher.fetchSales(params),
          fetcher.fetchPurchases(params),
        ]);
        if (!s && !p) return unavailable(metric_id);
        const sales = s?.total_ht ?? 0;
        const purchases = p?.total_ht != null ? Math.abs(p.total_ht) : 0;
        const margin = sales - purchases;
        return ok(metric_id, margin, formatSignedAmount(margin, s?.currency ?? "EUR"), now());
      }

      case "cash_flow_net": {
        const [pi, po] = await Promise.all([
          fetcher.fetchPaymentsIn(params),
          fetcher.fetchPaymentsOut(params),
        ]);
        const inTotal = pi?.total ?? 0;
        const outTotal = po?.total != null ? Math.abs(po.total) : 0;
        const net = inTotal - outTotal;
        return ok(metric_id, net, formatSignedAmount(net, pi?.currency ?? "EUR"), now());
      }

      case "tax_balance": {
        const [s, p] = await Promise.all([
          fetcher.fetchSales(params),
          fetcher.fetchPurchases(params),
        ]);
        const collected = s?.total_tax ?? 0;
        const deductible = p?.total_tax != null ? Math.abs(p.total_tax) : 0;
        const balance = collected - deductible;
        return ok(metric_id, balance, formatSignedAmount(balance, "EUR"), now());
      }

      case "credit_notes_balance": {
        const [cc, cs] = await Promise.all([
          fetcher.fetchAdjustments(params, "credit_note.customer.issued"),
          fetcher.fetchAdjustments(params, "credit_note.supplier.received"),
        ]);
        const client = cc?.total_amount ?? 0;
        const supplier = cs?.total_amount ?? 0;
        const flux = supplier - client;
        return ok(metric_id, flux, formatSignedAmount(flux, "EUR"), now());
      }

      case "refunds_balance": {
        const [rc, rs] = await Promise.all([
          fetcher.fetchAdjustments(params, "refund.customer.paid"),
          fetcher.fetchAdjustments(params, "refund.supplier.received"),
        ]);
        const client = rc?.total_amount ?? 0;
        const supplier = rs?.total_amount ?? 0;
        const flux = supplier - client;
        return ok(metric_id, flux, formatSignedAmount(flux, "EUR"), now());
      }

      case "receivables_open": {
        const ar = await fetcher.fetchArByPartner(params);
        const openAmount = ar?.totals?.open_amount ?? null;
        if (openAmount == null) return unavailable(metric_id);
        return ok(metric_id, openAmount, formatAmount(openAmount, "EUR"), now());
      }

      case "payables_open": {
        const ap = await fetcher.fetchApByPartner(params);
        const openAmount = ap?.totals?.open_amount ?? null;
        if (openAmount == null) return unavailable(metric_id);
        return ok(metric_id, openAmount, formatAmount(openAmount, "EUR"), now());
      }

      case "payroll_charges": {
        const pr = await fetcher.fetchPayroll(params);
        if (!pr || pr.payslip_count === 0) return unavailable(metric_id);
        const total = pr.total_charges;
        return ok(metric_id, total, formatAmount(total, pr.currency ?? "EUR"), now());
      }

      case "pos_sales_total": {
        const pos = await fetcher.fetchPosSessions(params);
        const total = (pos?.items ?? [])
          .filter((s) => s.vault_status === "sealed")
          .reduce((acc, s) => acc + (s.total_sales ?? 0), 0);
        return ok(metric_id, total, formatAmount(total, "EUR"), now());
      }

      // ── Derived metrics ──────────────────────────────────────────────────

      case "working_capital": {
        const receivables = computed.get("receivables_open");
        if (!receivables || receivables.status === "unavailable") return unavailable(metric_id);
        const arOpen = receivables.value ?? 0;
        const payables = computed.get("payables_open");
        const apOpen = payables?.value ?? null;
        // BFR = Créances clients - Dettes fournisseurs (AP disponible depuis GO-2)
        const bfr = apOpen != null ? arOpen - apOpen : arOpen;
        return ok(metric_id, bfr, formatSignedAmount(bfr, "EUR"), now());
      }

      case "treasury_validated_pct": {
        const t = await fetcher.fetchTreasury(params);
        const remaining = t?.reconciliation_metrics?.remaining_ratio;
        if (remaining == null) return unavailable(metric_id);
        const validated = (1 - remaining) * 100;
        return ok(metric_id, validated, `${validated.toFixed(1)} %`, now());
      }

      case "commercial_margin_pct": {
        const margin = computed.get("commercial_margin");
        if (!margin || margin.value == null) return unavailable(metric_id);
        const [s] = await Promise.all([fetcher.fetchSales(params)]);
        const sales = s?.total_ht ?? 0;
        if (sales === 0) return unavailable(metric_id);
        const pct = (margin.value / sales) * 100;
        return ok(metric_id, pct, `${pct.toFixed(1)} %`, now());
      }

      case "ebitda_proxy": {
        const margin = computed.get("commercial_margin");
        const cn = computed.get("credit_notes_balance");
        if (!margin || margin.value == null) return unavailable(metric_id);
        const ebe = (margin.value ?? 0) + (cn?.value ?? 0);
        return ok(metric_id, ebe, formatSignedAmount(ebe, "EUR"), now());
      }

      case "ebitda_full": {
        const margin = computed.get("commercial_margin");
        const cn = computed.get("credit_notes_balance");
        const payroll = computed.get("payroll_charges");
        if (!margin || margin.value == null) return unavailable(metric_id);
        if (!payroll || payroll.status === "unavailable") return unavailable(metric_id);
        const ebe = (margin.value ?? 0) + (cn?.value ?? 0) - (payroll.value ?? 0);
        return ok(metric_id, ebe, formatSignedAmount(ebe, "EUR"), now());
      }

      default:
        return unavailable(metric_id, `No computation defined for: ${metric_id}`);
    }
  } catch (err) {
    return error(metric_id, err instanceof Error ? err.message : String(err));
  }
}

function ok(metric_id: string, value: number, formatted: string, freshness: string): MetricValue {
  return { metric_id, value, formatted, status: "ok", data_freshness: freshness, computed_at: now() };
}

function unavailable(metric_id: string, msg?: string): MetricValue {
  return { metric_id, value: null, formatted: "—", status: "unavailable", data_freshness: null, computed_at: now(), error: msg };
}

function error(metric_id: string, msg: string): MetricValue {
  return { metric_id, value: null, formatted: "—", status: "error", data_freshness: null, computed_at: now(), error: msg };
}
