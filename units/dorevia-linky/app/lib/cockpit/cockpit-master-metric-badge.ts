import type { CockpitMetricConfidence } from "@/app/lib/cockpit/cockpit-master-card-outline";
import { UI_STATE_LABELS } from "@/app/lib/cockpit/ui-state-labels";

/**
 * Badge cockpit carte maîtresse (Business / Flux net) — doctrine **§9.5** :
 * la clé `proxy` côté données s’affiche comme **Partiel**, pas « Proxy ».
 */

export type CockpitMasterMetricBadgeDesktop = {
  labelUpper: string;
  wrapperClassName: string;
  iconName: string;
  iconFilled?: boolean;
};

export function cockpitMasterMetricBadgeDesktop(level: CockpitMetricConfidence): CockpitMasterMetricBadgeDesktop {
  if (level === "fiable") {
    return {
      labelUpper: UI_STATE_LABELS.reliable.toUpperCase(),
      wrapperClassName:
        "inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_14%,var(--card))] px-3 py-1 text-xs font-semibold text-[var(--accent)]",
      iconName: "verified",
      iconFilled: true,
    };
  }
  if (level === "estimee") {
    return {
      labelUpper: UI_STATE_LABELS.estimated.toUpperCase(),
      wrapperClassName:
        "inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-500/40 dark:bg-slate-500/15 dark:text-slate-300",
      iconName: "functions",
    };
  }
  return {
    labelUpper: UI_STATE_LABELS.partial.toUpperCase(),
    wrapperClassName:
      "inline-flex items-center gap-1 rounded border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-400",
    iconName: "warning",
  };
}

/** Pastille compacte mobile (cartes maîtresses cockpit). */
export function cockpitMasterMetricBadgeMobilePill(level: CockpitMetricConfidence): { label: string; className: string } {
  const base =
    "mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold";
  if (level === "fiable") {
    return { label: UI_STATE_LABELS.reliable, className: `${base} bg-emerald-600/15 text-emerald-400` };
  }
  if (level === "estimee") {
    return { label: UI_STATE_LABELS.estimated, className: `${base} bg-slate-500/15 text-slate-400` };
  }
  return { label: UI_STATE_LABELS.partial, className: `${base} bg-amber-500/15 text-amber-400` };
}
