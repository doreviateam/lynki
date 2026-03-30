import type { CardStatusValue, DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import { formatAmount, formatSignedAmount } from "@/app/lib/format";
import { UI_STATE_LABELS } from "@/app/lib/cockpit/ui-state-labels";

/** Données cockpit (tuile Trésorerie A) dérivées de `dashboard-metrics` — W60-101, sans nouveau backend. */
export interface TreasuryCockpitTileModel {
  currency: string;
  /** 0–100, part des flux couverts par preuve bancaire ; `null` si inconnu */
  coveragePct: number | null;
  /** ERP − validé Vault ; `null` si un des deux manque */
  erpDelta: number | null;
  /** Valeur signée (+/−) — tooltip / détail */
  erpDeltaFormatted: string | null;
  /** Valeur absolue — ligne « Écart à confirmer » (SPEC §4.4 B) */
  erpDeltaAbsFormatted: string | null;
  /** Infobulle §10.5 + montant signé si disponible */
  erpDeltaTooltip: string;
  /** KPI « Montant à rapprocher » (déjà formaté par l’agrégat) */
  rapproFormatted: string | null;
  /** Tooltip §10.4 */
  rapproTooltip: string;
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

  const erpDeltaFormatted = erpDelta != null ? formatSignedAmount(erpDelta, currency) : null;
  const erpDeltaAbsFormatted = erpDelta != null ? formatAmount(Math.abs(erpDelta), currency) : null;
  const rapproTooltip = "Montant restant à traiter dans le rapprochement sur le périmètre affiché.";
  const ecartTooltipBase =
    "Décalage restant à confirmer entre la lecture ERP et la position validée retenue pour le périmètre affiché.";
  const erpDeltaTooltip =
    erpDelta != null && erpDeltaFormatted != null
      ? `${ecartTooltipBase} Cet indicateur reflète l'écart entre le solde ERP et la position validée retenue pour la vue ; il est affiché en valeur absolue dans la tuile. Montant signé (ERP − solde validé) : ${erpDeltaFormatted}.`
      : ecartTooltipBase;

  const tp = metrics?.treasury_position;
  const rapproFormatted =
    tp && typeof tp.formatted === "string" && tp.formatted.trim() !== "" && tp.formatted !== "—"
      ? tp.formatted
      : null;

  return {
    currency,
    coveragePct,
    erpDelta,
    erpDeltaFormatted,
    erpDeltaAbsFormatted,
    erpDeltaTooltip,
    rapproFormatted,
    rapproTooltip,
    treasuryStatus: metrics?.treasury.status,
  };
}

/** Remplissage de la barre « Couverture probante » : même famille de couleurs que le badge / contour. */
export function treasuryCockpitCoverageBarFillClass(status: CardStatusValue | undefined): string {
  switch (status) {
    case "ok":
      return "bg-[var(--confidence-fiable)]";
    case "watch":
      return "bg-[var(--confidence-partielle)]";
    case "critical":
      return "bg-[var(--negative)]";
    case "neutral":
      return "bg-sky-500 dark:bg-sky-400";
    case "alert":
      return "bg-red-500 dark:bg-red-400";
    default:
      return "bg-[var(--text-secondary)]";
  }
}

/**
 * Badge unique carte Trésorerie — SPEC_TUILE_TRESO §6 / T-TR-001.
 * `dashboard-metrics` : `critical` → À confirmer ; `watch` → Partiel ; `ok` → Fiable ; `neutral` → En attente ; `alert` / défaut → Indisponible.
 */
export function treasuryCockpitPrimaryBadge(status: CardStatusValue | undefined): {
  label: string;
  desktopWrap: string;
  mobileClassName: string;
  iconName: string;
} {
  switch (status) {
    case "critical":
      return {
        label: UI_STATE_LABELS.to_confirm,
        desktopWrap:
          "border border-[color-mix(in_srgb,var(--negative)_45%,var(--border))] bg-[color-mix(in_srgb,var(--negative)_12%,var(--card))] text-[var(--negative)]",
        mobileClassName: "bg-red-500/15 text-red-400",
        iconName: "error",
      };
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
          "border border-[color-mix(in_srgb,var(--confidence-partielle)_55%,#7a5920)] bg-[var(--warn-soft-bg)] text-[var(--confidence-partielle)]",
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
