/**
 * SPEC Card FLUX NET v1.0 / v1.1 — Insight de lecture et statut métier.
 * v1.1 : insights enrichis par granularité (mensuel comparatif, hebdo pics/tensions).
 */

import type { SeriesPoint } from "@/app/types/aggregations";
import type { ChartGranularity } from "@/app/lib/chart-granularity";

export type FluxNetStatusLabel =
  | "Trésorerie sous contrôle"
  | "Flux net positif mais volatil"
  | "Tension de trésorerie"
  | "Décaissements sous surveillance";

export interface FluxNetInsightResult {
  /** Phrase principale sous le graphique (SPEC §7, v1.1 §5) */
  primary: string;
  /** Phrase secondaire optionnelle */
  secondary?: string;
  /** Statut métier pour affichage près du KPI (SPEC §9) */
  statusLabel: FluxNetStatusLabel;
}

const RATIO_CONTROL = 1.1;
const MOIS_LABELS: Record<number, string> = {
  1: "janvier", 2: "février", 3: "mars", 4: "avril", 5: "mai", 6: "juin",
  7: "juillet", 8: "août", 9: "septembre", 10: "octobre", 11: "novembre", 12: "décembre",
};

/**
 * Détecte une volatilité simple : écart-type relatif des flux nets par période.
 */
function volatilityIndex(seriesIn: SeriesPoint[], seriesOut: SeriesPoint[]): number {
  const byPeriod = new Map<string, { in: number; out: number }>();
  for (const p of seriesIn) {
    byPeriod.set(p.period, { in: p.amount, out: byPeriod.get(p.period)?.out ?? 0 });
  }
  for (const p of seriesOut) {
    const cur = byPeriod.get(p.period) ?? { in: 0, out: 0 };
    cur.out = Math.abs(p.amount);
    byPeriod.set(p.period, cur);
  }
  const nets = Array.from(byPeriod.values()).map((v) => v.in - v.out);
  if (nets.length < 2) return 0;
  const mean = nets.reduce((a, b) => a + b, 0) / nets.length;
  const variance = nets.reduce((s, n) => s + (n - mean) ** 2, 0) / nets.length;
  const std = Math.sqrt(variance);
  const absMean = Math.abs(mean);
  return absMean > 0 ? std / absMean : (std > 0 ? 1 : 0);
}

/** Formate une période pour l'insight : semaine → "26/01", mois → "janvier" */
function formatPeriodLabel(period: string, granularity: ChartGranularity): string {
  if (granularity === "month") {
    const [, m] = period.split("-");
    const num = parseInt(m ?? "1", 10);
    return MOIS_LABELS[num] ?? period;
  }
  if (granularity === "week" || granularity === "day") {
    const parts = period.split("-");
    if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
  }
  return period;
}

/**
 * Calcule l'insight de lecture et le statut métier (SPEC §7, §9, correctrice v1.1 §5).
 */
export function computeFluxNetInsight(
  totalIn: number,
  totalOut: number,
  seriesIn: SeriesPoint[],
  seriesOut: SeriesPoint[],
  granularity?: ChartGranularity
): FluxNetInsightResult {
  const net = totalIn - totalOut;
  const outAbs = Math.abs(totalOut);
  const ratio = outAbs > 0 ? totalIn / outAbs : (totalIn > 0 ? 2 : 0);
  const vol = volatilityIndex(seriesIn, seriesOut);
  const isVolatile = vol > 0.6;

  const byPeriod = new Map<string, { in: number; out: number; net: number }>();
  for (const p of seriesIn) {
    byPeriod.set(p.period, { in: p.amount, out: byPeriod.get(p.period)?.out ?? 0, net: 0 });
  }
  for (const p of seriesOut) {
    const cur = byPeriod.get(p.period) ?? { in: 0, out: 0, net: 0 };
    cur.out = Math.abs(p.amount);
    cur.net = cur.in - cur.out;
    byPeriod.set(p.period, cur);
  }
  Array.from(byPeriod.values()).forEach((v) => {
    if (v.net === 0) v.net = v.in - v.out;
  });
  const periods = Array.from(byPeriod.entries())
    .map(([period, v]) => ({ period, ...v }))
    .sort((a, b) => a.period.localeCompare(b.period));

  let primary: string;

  if (periods.length >= 2 && granularity) {
    const bestNet = periods.reduce((a, b) => (a.net >= b.net ? a : b));
    const worstNet = periods.reduce((a, b) => (a.net <= b.net ? a : b));
    const peakInflow = periods.reduce((a, b) => (a.in >= b.in ? a : b));
    const bestLabel = formatPeriodLabel(bestNet.period, granularity);
    const worstLabel = formatPeriodLabel(worstNet.period, granularity);

    if (granularity === "month" && bestNet.period !== worstNet.period) {
      if (net > 0 && bestNet.net > 0 && worstNet.net < 0) {
        primary = `${bestLabel.charAt(0).toUpperCase() + bestLabel.slice(1)} favorable, ${worstLabel} plus tendu.`;
      } else if (net > 0) {
        primary = `Flux net positif sur la période, porté par ${bestLabel}.`;
      } else {
        primary = `Encaissements dominants en ${bestLabel}, décaissements supérieurs en ${worstLabel}.`;
      }
    } else if (granularity === "week" && peakInflow.in > 0) {
      const weekStr = formatPeriodLabel(peakInflow.period, granularity);
      const last = periods[periods.length - 1];
      if (last.net < 0 && last.period !== peakInflow.period) {
        const lastStr = formatPeriodLabel(last.period, granularity);
        primary = `Pic d'encaissements semaine du ${weekStr}, avec tension sur la semaine du ${lastStr}.`;
      } else {
        primary = `Pic d'encaissements semaine du ${weekStr}.`;
      }
    } else {
      primary = buildFallbackPrimary(net, ratio, isVolatile);
    }
  } else {
    primary = buildFallbackPrimary(net, ratio, isVolatile);
  }

  const statusLabel = buildStatusLabel(net, ratio, isVolatile);
  return { primary, statusLabel };
}

function buildFallbackPrimary(net: number, ratio: number, isVolatile: boolean): string {
  if (net > 0) {
    if (ratio >= RATIO_CONTROL && !isVolatile) return "Encaissements supérieurs aux décaissements sur la période.";
    if (ratio >= RATIO_CONTROL && isVolatile) return "Flux net positif sur la période, mais volatil.";
    return "Flux net positif sur la période.";
  }
  if (net < 0) return "Décaissements supérieurs aux encaissements sur la période.";
  return "Encaissements et décaissements à l'équilibre sur la période.";
}

function buildStatusLabel(
  net: number,
  ratio: number,
  isVolatile: boolean
): FluxNetStatusLabel {
  if (net > 0) {
    if (ratio >= RATIO_CONTROL && !isVolatile) return "Trésorerie sous contrôle";
    if (ratio >= RATIO_CONTROL && isVolatile) return "Flux net positif mais volatil";
    if (ratio < 1) return "Décaissements sous surveillance";
    return isVolatile ? "Flux net positif mais volatil" : "Trésorerie sous contrôle";
  }
  if (net < 0) return "Tension de trésorerie";
  return "Décaissements sous surveillance";
}
