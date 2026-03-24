/**
 * MINI_SPEC_COUVERTURE_STRUCTURELLE_PAIE v1.1 — logique d’affichage couverture structurelle en %.
 * Couverture structurelle = x % (ratio) ou 0 % ou — (dénominateur non exploitable).
 */

import { formatAmount } from "@/app/lib/format";

export interface StructuralCoverageDisplayInput {
  structural_coverage_available?: boolean;
  structural_charges_amount?: number | null;
  /** MINI_SPEC v1.1 — ratio 0–100 (charges / trésorerie validée × 100), valeur affichée */
  structural_coverage_ratio?: number | null;
  currency?: string;
}

export function getStructuralCoverageDisplay(
  data: StructuralCoverageDisplayInput | null | undefined,
  currency = "EUR"
): { structuralCoverageLabel: string; structuralChargesFormatted: string } {
  const amount = data?.structural_charges_amount;
  const ratio = data?.structural_coverage_ratio;
  const curr = data?.currency ?? currency;
  // Règles affichage v1.1 : ratio nombre → x % ; ratio === 0 → 0 % ; sinon —
  let structuralCoverageLabel: string;
  if (ratio != null && Number.isFinite(ratio)) {
    structuralCoverageLabel = ratio === 0 ? "0 %" : `${formatRatio(ratio)} %`;
  } else if (amount != null && Number.isFinite(amount) && amount === 0) {
    structuralCoverageLabel = "0 %";
  } else {
    structuralCoverageLabel = "—";
  }
  return {
    structuralCoverageLabel,
    structuralChargesFormatted:
      amount != null && Number.isFinite(amount) ? formatAmount(amount, curr) : "—",
  };
}

function formatRatio(value: number): string {
  if (value >= 100) return "100";
  if (value <= 0) return "0";
  const oneDecimal = Math.round(value * 10) / 10;
  return oneDecimal % 1 === 0 ? String(Math.round(oneDecimal)) : oneDecimal.toFixed(1).replace(".", ",");
}
