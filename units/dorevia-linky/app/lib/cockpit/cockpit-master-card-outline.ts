import type { CardStatusValue } from "@/app/api/dashboard-metrics/route";

/**
 * Contour fin des cartes maîtresses cockpit — aligné doctrine **§5.4** (fiabilité, pas dominance).
 * Pas d’import depuis composants client : même union que `ConfidenceLevel` dans `InstrumentCardChrome`.
 */
export type CockpitMetricConfidence = "fiable" | "partielle" | "proxy" | "estimee";

/** Trésorerie : mêmes couleurs de bordure que `treasuryCockpitPrimaryBadge().desktopWrap` (cohérence carte ↔ badge). */
export function treasuryMasterCardOutlineClass(status: CardStatusValue | undefined): string {
  switch (status) {
    case "ok":
      return "border border-[color-mix(in_srgb,var(--confidence-fiable)_35%,var(--border))]";
    case "watch":
      return "border border-[color-mix(in_srgb,var(--confidence-partielle)_55%,#7a5920)]";
    case "critical":
      return "border border-[color-mix(in_srgb,var(--negative)_45%,var(--border))]";
    case "neutral":
      return "border border-sky-200 dark:border-sky-500/35";
    case "alert":
      return "border border-red-200 dark:border-red-500/35";
    default:
      return "border border-[var(--border)]";
  }
}

/** Business / Flux net : dérivé du `valueKind` agrégé (voir `conf()` dans `CockpitDesktopView`). */
export function metricConfidenceOutlineClass(level: CockpitMetricConfidence): string {
  switch (level) {
    case "fiable":
      return "border border-[color-mix(in_srgb,var(--confidence-fiable)_55%,var(--border))]";
    case "partielle":
      return "border border-slate-300 dark:border-slate-500/55";
    case "proxy":
    case "estimee":
      return "border border-amber-200 dark:border-amber-500/40";
    default:
      return "border border-[var(--border)]";
  }
}
