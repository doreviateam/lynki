/**
 * Résolution d'état UI source paie pour la card EBE.
 * SPEC_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0 §10, §11.
 */

export type PayrollSourceUi = "payslip" | "od" | "none" | "legacy_fallback";

export interface NormalizedPayrollResponse {
  total: number | null;
  count: number;
  currency: string;
  payroll_source?: "payslip" | "od" | "none";
  payroll_unavailable?: boolean;
  breakdown?: { accounts_641?: number; accounts_645?: number };
}

/** Réponse brute API payroll (Vault ou proxy). */
export type RawPayrollResponse = Record<string, unknown> | null;

/**
 * Unifie les champs backend (total vs total_charges, count vs payslip_count).
 */
export function normalizePayrollResponse(raw: RawPayrollResponse): NormalizedPayrollResponse {
  if (!raw || typeof raw !== "object") {
    return { total: null, count: 0, currency: "EUR" };
  }
  const total =
    typeof (raw as { total?: number }).total === "number"
      ? (raw as { total: number }).total
      : typeof (raw as { total_charges?: number }).total_charges === "number"
        ? (raw as { total_charges: number }).total_charges
        : null;
  const count =
    typeof (raw as { payslip_count?: number }).payslip_count === "number"
      ? (raw as { payslip_count: number }).payslip_count
      : typeof (raw as { count?: number }).count === "number"
        ? (raw as { count: number }).count
        : 0;
  const currency =
    typeof (raw as { currency?: string }).currency === "string"
      ? (raw as { currency: string }).currency
      : "EUR";
  const payroll_source = (raw as { payroll_source?: string }).payroll_source as
    | "payslip"
    | "od"
    | "none"
    | undefined;
  const payroll_unavailable = (raw as { payroll_unavailable?: boolean }).payroll_unavailable;
  const breakdown = (raw as { breakdown?: { accounts_641?: number; accounts_645?: number } }).breakdown;

  return {
    total,
    count,
    currency,
    ...(payroll_source && { payroll_source }),
    ...(payroll_unavailable !== undefined && { payroll_unavailable: !!payroll_unavailable }),
    ...(breakdown && typeof breakdown === "object" && { breakdown }),
  };
}

/**
 * Dérive l'état UI à partir de la réponse normalisée (spec §11.1).
 */
export function resolvePayrollSourceUi(payroll: NormalizedPayrollResponse): PayrollSourceUi {
  if (payroll.payroll_source === "payslip") return "payslip";
  if (payroll.payroll_source === "od") return "od";
  if (payroll.payroll_source === "none" || payroll.payroll_unavailable === true) return "none";
  return "legacy_fallback";
}

/** Entrée du mapping : badge + message principal + message secondaire (spec §10). */
export interface PayrollSourceUiEntry {
  badge: string;
  messagePrimary: string;
  messageSecondary: string;
}

/** Mapping normatif spec §10. */
export const PAYROLL_SOURCE_UI: Record<PayrollSourceUi, PayrollSourceUiEntry> = {
  payslip: {
    badge: "Source paie : bulletins",
    messagePrimary: "Charges de personnel intégrées via les bulletins de paie.",
    messageSecondary: "",
  },
  od: {
    badge: "Source paie : OD comptables",
    messagePrimary: "Charges de personnel intégrées via les OD comptables.",
    messageSecondary:
      "Les charges de personnel sont calculées à partir des OD comptables éligibles de la période.",
  },
  none: {
    badge: "Source paie indisponible",
    messagePrimary: "Charges de personnel non disponibles sur la période.",
    messageSecondary:
      "Aucun bulletin ni OD de paie intégrés n'ont été trouvés pour cette période.",
  },
  legacy_fallback: {
    badge: "Source paie actuelle non disponible",
    messagePrimary: "Charges de personnel non disponibles via la source paie actuelle.",
    messageSecondary: "Les OD comptables ne sont peut-être pas encore intégrées à ce calcul.",
  },
};
