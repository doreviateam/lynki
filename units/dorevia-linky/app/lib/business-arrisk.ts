/**
 * Helper computeARRisk — Carte BUSINESS (SPEC Concentration + Exposition de marge v1.0)
 * Calcule la concentration du retard, le partenaire dominant et le niveau d'exposition.
 * Badges : Marge peu exposée | Marge partiellement exposée | Marge fortement exposée.
 */

import type { ArByPartnerResponse } from "@/app/types/aggregations";

export type ExposureLabel = "Marge peu exposée" | "Marge partiellement exposée" | "Marge fortement exposée";

export interface ARRiskResult {
  /** Part du retard concentrée sur le partenaire le plus en retard (0–1) */
  overdueConcentration: number;
  /** Libellé métier pour le badge d'exposition (SPEC §5.6, §5.7) */
  exposureLabel: ExposureLabel;
  /** Nom du partenaire ayant le plus gros montant en retard (SPEC §5.4) */
  topOverduePartnerName: string;
  /** Part du retard concentrée sur ce partenaire (0–100) */
  topOverdueSharePct: number;
}

/** Seuils SPEC §5.7 — version initiale simple et explicable */
const OVERDUE_SHARE_OPEN_LOW = 0.15;
const OVERDUE_SHARE_OPEN_HIGH = 0.4;
const TOP_OVERDUE_SHARE_LOW = 0.25;
const TOP_OVERDUE_SHARE_HIGH = 0.45;
const OVERDUE_MAX_DAYS_LOW = 30;
const OVERDUE_MAX_DAYS_HIGH = 90;

export function computeARRisk(arData?: ArByPartnerResponse | null): ARRiskResult {
  const empty = {
    overdueConcentration: 0,
    exposureLabel: "Marge peu exposée" as ExposureLabel,
    topOverduePartnerName: "",
    topOverdueSharePct: 0,
  };

  if (!arData?.totals) {
    return empty;
  }
  const { totals, partners } = arData;
  const openAmount = totals.open_amount ?? 0;
  const overdueAmount = totals.overdue_amount ?? 0;
  const overdueMaxDays = totals.overdue_max_days ?? 0;

  if (openAmount <= 0) {
    return empty;
  }
  if (!overdueAmount || overdueAmount <= 0) {
    return { ...empty, exposureLabel: "Marge peu exposée" };
  }

  const list = partners ?? [];
  const overdueShareOfOpenPct = openAmount > 0 ? overdueAmount / openAmount : 0;

  let maxOverdue = 0;
  let topPartnerName = "";
  for (const p of list) {
    const amt = p.overdue_amount ?? 0;
    if (amt > maxOverdue) {
      maxOverdue = amt;
      topPartnerName = (p.partner_name ?? String(p.partner_id ?? "")).trim() || String(p.partner_id ?? "");
    }
  }
  const topOverdueSharePct = overdueAmount > 0 ? (maxOverdue / overdueAmount) * 100 : 0;
  const concentration = overdueAmount > 0 ? maxOverdue / overdueAmount : 0;

  // SPEC §5.7 — Marge fortement exposée (priorité haute)
  if (
    overdueShareOfOpenPct >= OVERDUE_SHARE_OPEN_HIGH ||
    topOverdueSharePct / 100 >= TOP_OVERDUE_SHARE_HIGH ||
    overdueMaxDays >= OVERDUE_MAX_DAYS_HIGH
  ) {
    return {
      overdueConcentration: concentration,
      exposureLabel: "Marge fortement exposée",
      topOverduePartnerName: topPartnerName,
      topOverdueSharePct,
    };
  }

  // Marge partiellement exposée
  if (
    overdueShareOfOpenPct >= OVERDUE_SHARE_OPEN_LOW ||
    topOverdueSharePct / 100 >= TOP_OVERDUE_SHARE_LOW ||
    overdueMaxDays >= OVERDUE_MAX_DAYS_LOW
  ) {
    return {
      overdueConcentration: concentration,
      exposureLabel: "Marge partiellement exposée",
      topOverduePartnerName: topPartnerName,
      topOverdueSharePct,
    };
  }

  // Marge peu exposée
  return {
    overdueConcentration: concentration,
    exposureLabel: "Marge peu exposée",
    topOverduePartnerName: topPartnerName,
    topOverdueSharePct,
  };
}
