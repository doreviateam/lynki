import type { CardStatusValue, DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import { formatSignedAmount } from "@/app/lib/format";

/** Données cockpit (tuile Trésorerie A) dérivées de `dashboard-metrics` — W60-101, sans nouveau backend. */
export interface TreasuryCockpitTileModel {
  currency: string;
  /** 0–100, part des flux couverts par preuve bancaire ; `null` si inconnu */
  coveragePct: number | null;
  /** ERP − validé Vault ; `null` si un des deux manque */
  erpDelta: number | null;
  erpDeltaFormatted: string | null;
  /** KPI secondaire « reste / volume à rapprocher » (déjà formaté par l’agrégat) */
  rapproFormatted: string | null;
  treasuryStatus: CardStatusValue | undefined;
}

export function buildTreasuryCockpitTileModel(metrics: DashboardMetricsResponse | null): TreasuryCockpitTileModel {
  const d = metrics?._details?.treasury;
  const currency = d?.currency ?? "EUR";
  const validated = d?.validated_balance ?? metrics?.treasury.value ?? null;
  const erp = d?.erp_balance ?? null;

  const rawPct = d?.treasury_validated_pct;
  const coveragePct =
    rawPct != null && Number.isFinite(rawPct) ? Math.max(0, Math.min(100, Math.round(rawPct))) : null;

  let erpDelta: number | null = null;
  if (erp != null && validated != null && Number.isFinite(erp) && Number.isFinite(validated)) {
    erpDelta = erp - validated;
  }

  const tp = metrics?.treasury_position;
  const rapproFormatted =
    tp && typeof tp.formatted === "string" && tp.formatted.trim() !== "" && tp.formatted !== "—"
      ? tp.formatted
      : null;

  return {
    currency,
    coveragePct,
    erpDelta,
    erpDeltaFormatted: erpDelta != null ? formatSignedAmount(erpDelta, currency) : null,
    rapproFormatted,
    treasuryStatus: metrics?.treasury.status,
  };
}
