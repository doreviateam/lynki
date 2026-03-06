/**
 * Helper computeARRisk — Business Card v2 (SPEC v2.1)
 * Calcule la concentration du retard et le niveau de risque.
 * Logique : none en premier (zéro badge orphelin par construction).
 */

import type { ArByPartnerResponse } from "@/app/types/aggregations";

export type RiskLevel = "none" | "secured" | "concentrated" | "partial";

const CONCENTRATION_THRESHOLD = 0.5;

export interface ARRiskResult {
  overdueConcentration: number;
  riskLevel: RiskLevel;
}

export function computeARRisk(arData?: ArByPartnerResponse | null): ARRiskResult {
  if (!arData?.totals) {
    return { overdueConcentration: 0, riskLevel: "none" };
  }
  const { totals, partners } = arData;
  const openAmount = totals.open_amount ?? 0;
  const overdueAmount = totals.overdue_amount ?? 0;

  if (openAmount <= 0) {
    return { overdueConcentration: 0, riskLevel: "none" };
  }
  if (!overdueAmount || overdueAmount <= 0) {
    return { overdueConcentration: 0, riskLevel: "secured" };
  }

  const list = partners ?? [];
  const maxOverdue =
    list.length > 0
      ? Math.max(...list.map((p) => p.overdue_amount ?? 0))
      : 0;
  const concentration = maxOverdue / overdueAmount;

  if (concentration >= CONCENTRATION_THRESHOLD) {
    return { overdueConcentration: concentration, riskLevel: "concentrated" };
  }
  return { overdueConcentration: concentration, riskLevel: "partial" };
}
