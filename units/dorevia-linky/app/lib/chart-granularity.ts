/** Granularités disponibles pour les graphiques (Vault: day, week, month) */
export type ChartGranularity = "session" | "day" | "week" | "month";

export const GRANULARITY_LABELS: Record<ChartGranularity, string> = {
  session: "Session",
  day: "Jour",
  week: "Semaine",
  month: "Mois",
};

/** Calcule le nombre de jours entre deux dates (YYYY-MM-DD) */
function getDaysBetween(from: string, to: string): number {
  const d1 = new Date(from + "T00:00:00");
  const d2 = new Date(to + "T00:00:00");
  const diff = d2.getTime() - d1.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))) + 1;
}

/**
 * Retourne les granularités optimales pour la période.
 * - ≤ 31 jours : Jour, Semaine, Mois
 * - 32–90 jours : Semaine, Mois
 * - 91–180 jours : Semaine, Mois
 * - 181–365 jours : Mois
 * - > 365 jours : Mois
 */
export function getAvailableGranularities(from: string, to: string): ChartGranularity[] {
  const days = getDaysBetween(from, to);
  if (days <= 31) return ["day", "week", "month"];
  if (days <= 180) return ["week", "month"];
  return ["month"];
}

/** Pour POS : Session en premier (par défaut) + périodes */
export function getPosChartGranularities(from: string, to: string): ChartGranularity[] {
  return ["session", ...getAvailableGranularities(from, to)];
}

export function getDefaultPosChartGranularity(): ChartGranularity {
  return "session";
}

/**
 * Granularité par défaut selon la période.
 * - ≤ 31 jours : Jour (plus pertinent)
 * - > 31 jours : Mois
 */
export function getDefaultChartGranularity(from: string, to: string): ChartGranularity {
  const days = getDaysBetween(from, to);
  return days <= 31 ? "day" : "month";
}
