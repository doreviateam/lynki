import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";

/**
 * Score de confiance dynamique V1.
 *
 * Règle :
 * - sealed_count_complete === true  → 100
 * - sealed_count_complete === false → round(sealed_count / expected_count × 100)
 * - données absentes / insuffisantes → null  (afficher "—" ou spinner, jamais 0 %)
 */
export function computeConfidenceScore(
  metrics: DashboardMetricsResponse | null | undefined
): number | null {
  if (!metrics) return null;
  if (metrics.sealed_count_complete === true) return 100;
  if (
    metrics.sealed_count_complete === false &&
    typeof metrics.sealed_count === "number" &&
    typeof metrics.expected_count === "number" &&
    metrics.expected_count > 0
  ) {
    return Math.round((metrics.sealed_count / metrics.expected_count) * 100);
  }
  return null;
}
