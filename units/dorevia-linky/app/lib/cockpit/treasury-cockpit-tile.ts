import type { CardStatusValue, DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import { formatSignedAmount } from "@/app/lib/format";
import { UI_STATE_LABELS } from "@/app/lib/cockpit/ui-state-labels";

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

/**
 * Badge unique carte Trésorerie — aligné spec §5.4 (doctrine d’état) — W60-102 / W60-103.
 * `dashboard-metrics` : `ok` → Fiable ; `watch` → Partiel ; `neutral` → En attente ; `alert` / défaut → Indisponible.
 */
export function treasuryCockpitPrimaryBadge(status: CardStatusValue | undefined): {
  label: string;
  desktopWrap: string;
  mobileClassName: string;
  iconName: string;
} {
  switch (status) {
    case "ok":
      return {
        label: UI_STATE_LABELS.reliable,
        desktopWrap:
          "border-[color-mix(in_srgb,var(--confidence-fiable)_35%,var(--border))] bg-[color-mix(in_srgb,var(--confidence-fiable)_10%,var(--card))] text-[var(--confidence-fiable)]",
        mobileClassName: "bg-emerald-600/15 text-emerald-400",
        iconName: "check_circle",
      };
    case "watch":
      return {
        label: UI_STATE_LABELS.partial,
        desktopWrap:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-400",
        mobileClassName: "bg-amber-500/15 text-amber-400",
        iconName: "pie_chart",
      };
    case "neutral":
      return {
        label: UI_STATE_LABELS.pending,
        desktopWrap:
          "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/35 dark:bg-sky-500/15 dark:text-sky-300",
        mobileClassName: "bg-sky-500/15 text-sky-300",
        iconName: "schedule",
      };
    case "alert":
      return {
        label: UI_STATE_LABELS.unavailable,
        desktopWrap:
          "border-red-200 bg-red-50 text-red-800 dark:border-red-500/35 dark:bg-red-500/15 dark:text-red-400",
        mobileClassName: "bg-red-500/15 text-red-400",
        iconName: "block",
      };
    default:
      return {
        label: UI_STATE_LABELS.unavailable,
        desktopWrap: "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
        mobileClassName: "bg-slate-500/15 text-slate-400",
        iconName: "info",
      };
  }
}
