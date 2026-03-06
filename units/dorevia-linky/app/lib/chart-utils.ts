import type { SeriesPoint } from "@/app/types/aggregations";

/**
 * Règle d'affichage : sur les graphiques, les montants sont exprimés en valeurs positives.
 * Charges, achats, décaissements, etc. peuvent arriver négatifs de l'API — on les normalise
 * pour que les barres/courbes s'affichent vers le haut (volumes).
 */
export function toPositiveSeries(series: SeriesPoint[]): SeriesPoint[] {
  return series.map((p) => ({ period: p.period, amount: Math.abs(p.amount) }));
}
