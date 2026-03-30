"use client";

import { IconTreasury } from "@/components/CardIcons";
import { Icon } from "@/components/Icon";
import { CockpitMasterKpiValue } from "@/components/cockpit/CockpitMasterKpiValue";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import {
  buildTreasuryCockpitTileModel,
  treasuryCockpitCoverageBarFillClass,
  treasuryCockpitPrimaryBadge,
} from "@/app/lib/cockpit/treasury-cockpit-tile";
import { treasuryMasterCardOutlineClass } from "@/app/lib/cockpit/cockpit-master-card-outline";
import { ensureCockpitKpiShowsEuro } from "@/app/lib/format";
import {
  COCKPIT_T4_MICRO_UPPER,
  COCKPIT_T5_CAPTION,
  COCKPIT_T5_DETAIL_LABEL,
  COCKPIT_T5_DETAIL_VALUE,
  COCKPIT_T5_STATE_BADGE,
} from "@/app/lib/cockpit/cockpit-typography";

/** Bloc A — même agrégats et libellés que la tuile cockpit (`buildTreasuryCockpitTileModel`). */
export function TreasuryDetailBandeau({ metrics }: { metrics: DashboardMetricsResponse }) {
  const tile = buildTreasuryCockpitTileModel(metrics);
  const treasury = metrics.treasury;
  const badge = treasuryCockpitPrimaryBadge(treasury.status);
  const outline = treasuryMasterCardOutlineClass(treasury.status);
  const coverageFill = treasuryCockpitCoverageBarFillClass(treasury.status);

  return (
    <section
      aria-labelledby="treso-detail-bandeau-heading"
      className={`rounded-xl border bg-[var(--card)] p-4 shadow-sm sm:p-5 ${outline}`}
    >
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2
              id="treso-detail-bandeau-heading"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]"
            >
              <IconTreasury className="h-4 w-4 shrink-0 text-[var(--accent)] opacity-90" aria-hidden />
              Synthèse pilotage
            </h2>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded border px-2 py-0.5 ${COCKPIT_T5_STATE_BADGE} ${badge.desktopWrap}`}
              title={treasury.status_reason ?? undefined}
            >
              <Icon name={badge.iconName} size={12} />
              {badge.label}
            </span>
          </div>
          <div className="min-w-0 w-full">
            <CockpitMasterKpiValue display={ensureCockpitKpiShowsEuro(treasury)} unified />
            <p className={`mt-1 ${COCKPIT_T5_CAPTION}`}>Solde validé</p>
          </div>
        </div>

        <div className="w-full min-w-0 space-y-4 border-t border-[var(--border)] pt-5 lg:border-t-0 lg:pt-0">
          <div title="Part des flux couverts par preuve bancaire sur la période affichée">
            <div className="flex items-baseline justify-between gap-2">
              <span className={COCKPIT_T4_MICRO_UPPER}>Couverture probante</span>
              <span className={`tabular-nums ${COCKPIT_T5_DETAIL_VALUE}`}>
                {tile.coveragePct != null ? `${tile.coveragePct} %` : "—"}
              </span>
            </div>
            <div
              className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[var(--coverage-track)]"
              role="progressbar"
              aria-valuenow={tile.coveragePct ?? undefined}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Couverture probante"
            >
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${coverageFill}`}
                style={{ width: tile.coveragePct != null ? `${tile.coveragePct}%` : "0%" }}
              />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2 border-t border-[var(--border)] pt-3 text-lg">
            <span className={COCKPIT_T5_DETAIL_LABEL}>Montant à rapprocher</span>
            <span className={`shrink-0 text-right ${COCKPIT_T5_DETAIL_VALUE}`} title={tile.rapproTooltip}>
              {tile.rapproFormatted ?? "—"}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 text-lg">
            <span className={COCKPIT_T5_DETAIL_LABEL}>Écart à confirmer</span>
            <span className={`shrink-0 ${COCKPIT_T5_DETAIL_VALUE}`} title={tile.erpDeltaTooltip}>
              {tile.erpDeltaAbsFormatted ?? "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
