import type { CardStatusValue } from "@/app/api/dashboard-metrics/route";

/**
 * Contour fin des cartes maîtresses cockpit — aligné doctrine **§5.4** (fiabilité, pas dominance).
 * Pas d’import depuis composants client : même union que `ConfidenceLevel` dans `InstrumentCardChrome`.
 */
export type CockpitMetricConfidence = "fiable" | "partielle" | "proxy" | "estimee";

/** Trésorerie : `ok` → vert discret ; `watch` → neutre (Partiel) ; `neutral` → gris (attente) ; `alert` → rouge technique. */
export function treasuryMasterCardOutlineClass(status: CardStatusValue | undefined): string {
  switch (status) {
    case "ok":
      return "border border-[color-mix(in_srgb,var(--confidence-fiable)_55%,var(--border))]";
    case "watch":
      return "border border-slate-300 dark:border-slate-500/55";
    case "neutral":
      return "border border-[var(--border)]";
    case "alert":
      return "border border-red-400/80 dark:border-red-500/50";
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
