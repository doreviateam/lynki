"use client";

import { Icon } from "@/components/Icon";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import { buildTreasuryCockpitTileModel } from "@/app/lib/cockpit/treasury-cockpit-tile";
import { formatAmount } from "@/app/lib/format";

function formatCell(n: number | null | undefined, currency: string): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return formatAmount(n, currency);
}

/** Section « divergence » : comparatif ERP vs position validée, cadrage investigation. */
export function TreasuryDetailGapBlock({ metrics }: { metrics: DashboardMetricsResponse }) {
  const d = metrics._details?.treasury;
  const tile = buildTreasuryCockpitTileModel(metrics);
  const currency = tile.currency;
  const erp = d?.erp_balance ?? null;
  const validatedRaw = d?.validated_balance ?? metrics.treasury.value;
  const validated = validatedRaw != null && Number.isFinite(Number(validatedRaw)) ? Number(validatedRaw) : null;
  const hasComparable = erp != null && validated != null;

  return (
    <section
      aria-labelledby="treso-gap-heading"
      className="rounded-xl border border-[var(--border)] border-l-[3px] border-l-amber-500/70 bg-[var(--card)] p-6 shadow-sm dark:border-l-amber-400/60"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon name="compare_arrows" size={20} className="shrink-0 text-amber-700 dark:text-amber-400" />
          <div>
            <h2 id="treso-gap-heading" className="text-sm font-bold uppercase tracking-tight text-[var(--text)]">
              Écart à confirmer
            </h2>
            <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-secondary)]">
              Pourquoi la lecture ERP et la position validée diffèrent-elles ? Comparez les deux bases avant de conclure.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/40 px-3 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Écart (valeur absolue)</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-[var(--text)]" title={tile.erpDeltaTooltip}>
            {tile.erpDeltaAbsFormatted ?? "—"}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/40 px-3 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Lecture ERP</div>
          <div className="mt-1 text-sm font-bold tabular-nums text-[var(--text)]">{formatCell(erp, currency)}</div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/40 px-3 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Position validée</div>
          <div className="mt-1 text-sm font-bold tabular-nums text-[var(--text)]">{formatCell(validated, currency)}</div>
        </div>
      </div>

      {tile.erpDeltaFormatted ? (
        <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-xs text-[var(--text-secondary)] dark:bg-amber-500/10">
          <span className="font-semibold text-[var(--text)]">Écart signé</span>
          <span className="ml-2 tabular-nums" title={tile.erpDeltaTooltip}>
            {tile.erpDeltaFormatted}
          </span>
          <span className="ml-1 text-[var(--muted)]">(ERP − position validée)</span>
        </div>
      ) : null}

      {!hasComparable ? (
        <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">
          Une des deux lectures est manquante sur ce périmètre : l’investigation complète passe par le rapprochement et les soldes
          dans l’ERP.
        </p>
      ) : null}
    </section>
  );
}
