"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import type { TreasuryEvolutionSeriesPoint } from "@/app/api/treasury-evolution/route";
import {
  TreasuryBalanceAreaChart,
  TreasuryLineChartMini,
  applyEvolutionDisplayWindow,
  type EvolutionDisplayWindow,
  formatPeriodRangeLabel,
  formatSeriesDeltaEuro,
  formatSeriesDeltaPct,
  sliceSeriesTail,
} from "@/components/cockpit-detail/TreasuryDetailEvolutionCharts";

function sliceAligned<T extends { period: string }>(arr: T[], mainFull: TreasuryEvolutionSeriesPoint[], mode: EvolutionDisplayWindow): T[] {
  if (mainFull.length < 2 || arr.length === 0) return arr;
  if (mode === "full") return arr;
  const n = mode === "last7" ? 7 : 30;
  if (mainFull.length <= n) return arr;
  const start = mainFull.length - n;
  if (arr.length <= start) return sliceSeriesTail(arr, Math.min(n, arr.length));
  return arr.slice(start);
}

function positionSummary(series: TreasuryEvolutionSeriesPoint[], formatCurrency: (n: number) => string) {
  if (series.length === 0) return null;
  const vals = series.map((p) => p.amount);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const first = vals[0];
  const last = vals[vals.length - 1];
  return { min, max, first, last, rangeLabel: formatPeriodRangeLabel(series) };
}

function reconciledSeriesIsInteresting(series: TreasuryEvolutionSeriesPoint[]): boolean {
  if (series.length < 2) return false;
  const vals = series.map((p) => p.amount);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  return max > 1e-6 && (max - min > 1e-6 || max > 0);
}

export function TreasuryDetailEvolutionPanel({
  primarySourceLabel,
  evolutionLoading,
  evolutionError,
  evolutionSeriesFull,
  evolutionUnreconciledFull,
  evolutionReconciledFull,
  evolutionCoverageFull,
  partialReason,
  formatCurrency,
  formatPct,
}: {
  primarySourceLabel: string;
  evolutionLoading: boolean;
  evolutionError: boolean;
  evolutionSeriesFull: TreasuryEvolutionSeriesPoint[];
  evolutionUnreconciledFull: TreasuryEvolutionSeriesPoint[];
  evolutionReconciledFull: TreasuryEvolutionSeriesPoint[];
  evolutionCoverageFull: { period: string; pct: number | null }[];
  partialReason: string | null;
  formatCurrency: (n: number | null | undefined) => string;
  formatPct: (n: number | null | undefined) => string;
}) {
  const [windowMode, setWindowMode] = useState<EvolutionDisplayWindow>("full");

  const evolutionSeries = useMemo(
    () => applyEvolutionDisplayWindow(evolutionSeriesFull, windowMode),
    [evolutionSeriesFull, windowMode]
  );
  const evolutionUnreconciledSeries = useMemo(
    () => sliceAligned(evolutionUnreconciledFull, evolutionSeriesFull, windowMode),
    [evolutionUnreconciledFull, evolutionSeriesFull, windowMode]
  );
  const evolutionReconciledSeries = useMemo(
    () => sliceAligned(evolutionReconciledFull, evolutionSeriesFull, windowMode),
    [evolutionReconciledFull, evolutionSeriesFull, windowMode]
  );
  const evolutionCoverageSeries = useMemo(
    () => sliceAligned(evolutionCoverageFull, evolutionSeriesFull, windowMode),
    [evolutionCoverageFull, evolutionSeriesFull, windowMode]
  );

  const coverageChartSeries = useMemo((): TreasuryEvolutionSeriesPoint[] => {
    return evolutionCoverageSeries
      .filter((x) => x.pct != null && Number.isFinite(Number(x.pct)))
      .map((x) => ({ period: x.period, amount: Number(x.pct) }));
  }, [evolutionCoverageSeries]);

  const velocityMain = useMemo(
    () => formatSeriesDeltaEuro(evolutionUnreconciledSeries, (n) => formatCurrency(n)),
    [evolutionUnreconciledSeries, formatCurrency]
  );
  const velocityCoverage = useMemo(
    () => formatSeriesDeltaPct(evolutionCoverageSeries, formatPct),
    [evolutionCoverageSeries, formatPct]
  );
  const velocityPosition = useMemo(
    () => formatSeriesDeltaEuro(evolutionSeries, (n) => formatCurrency(n)),
    [evolutionSeries, formatCurrency]
  );

  const velocityReconciled = useMemo(
    () => formatSeriesDeltaEuro(evolutionReconciledSeries, (n) => formatCurrency(n)),
    [evolutionReconciledSeries, formatCurrency]
  );

  const velocity7Unreconciled = useMemo(() => {
    if (evolutionUnreconciledFull.length < 7) return null;
    const tail = sliceSeriesTail(evolutionUnreconciledFull, 7);
    return formatSeriesDeltaEuro(tail, (n) => formatCurrency(n));
  }, [evolutionUnreconciledFull, formatCurrency]);

  const posKpi = useMemo(() => positionSummary(evolutionSeries, (n) => formatCurrency(n)), [evolutionSeries, formatCurrency]);

  const windowButtons: { mode: EvolutionDisplayWindow; label: string }[] = [
    { mode: "full", label: "Période cockpit" },
    { mode: "last30", label: "30 derniers points" },
    { mode: "last7", label: "7 derniers points" },
  ];

  const showReconciledMini = reconciledSeriesIsInteresting(evolutionReconciledFull);

  return (
    <section
      aria-labelledby="treso-evo-heading"
      className="order-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-6 lg:order-5 lg:col-span-2"
    >
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <h2 id="treso-evo-heading" className="font-bold text-[var(--text)]">
            Évolution de la trésorerie
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Hiérarchie : position validée → montants rapprochement / couverture · source {primarySourceLabel} ·{" "}
            <code className="text-[10px]">/api/treasury-evolution</code>
          </p>
        </div>
        <div
          className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap"
          role="group"
          aria-label="Fenêtre d’analyse des séries"
        >
          {windowButtons.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setWindowMode(mode)}
              aria-pressed={windowMode === mode}
              className={`min-h-[44px] rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors sm:min-h-0 sm:text-center ${
                windowMode === mode
                  ? "border-emerald-600 bg-emerald-500/15 text-emerald-900 dark:border-emerald-500 dark:text-emerald-100"
                  : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {partialReason ? (
        <div className="mb-4 flex gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-200">
          <Icon name="info" size={18} className="shrink-0" />
          <span>
            <span className="font-semibold">Série partielle.</span> {partialReason}
          </span>
        </div>
      ) : null}

      {evolutionLoading ? (
        <div className="flex h-64 items-center justify-center text-sm text-[var(--muted)]">
          <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Chargement des séries…
        </div>
      ) : evolutionError || evolutionSeries.length < 2 ? (
        <div className="flex min-h-[16rem] items-center justify-center rounded-lg border border-dashed border-[var(--border)] px-4 text-sm text-[var(--text-secondary)]">
          <div className="text-center">
            <Icon name="show_chart" size={32} className="mb-2 text-[var(--muted)]" />
            <p>Historique non encore disponible pour cette période.</p>
          </div>
        </div>
      ) : (
        <>
          {posKpi ? (
            <div className="mb-4 grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Fenêtre affichée</div>
                <div className="text-sm font-semibold tabular-nums text-[var(--text)]">{posKpi.rangeLabel ?? "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Position (min → max)</div>
                <div className="text-sm font-semibold tabular-nums text-[var(--text)]">
                  {formatCurrency(posKpi.min)} → {formatCurrency(posKpi.max)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Dernier point</div>
                <div className="text-sm font-semibold tabular-nums text-[var(--text)]">{formatCurrency(posKpi.last)}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Variation (série affichée)</div>
                <div className="text-sm font-medium tabular-nums text-[var(--text-secondary)]">
                  {velocityPosition ?? "—"}
                </div>
              </div>
            </div>
          ) : null}

          {windowMode === "full" && velocity7Unreconciled ? (
            <p className="mb-4 text-xs text-[var(--text-secondary)]">
              <span className="font-semibold">Vélocité à rapprocher (7 derniers points) :</span> {velocity7Unreconciled}
            </p>
          ) : null}

          <div className="overflow-x-auto -mx-1 px-1">
            <TreasuryBalanceAreaChart series={evolutionSeries} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-[var(--border)] pt-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Position validée (série)</span>
            </div>
          </div>

          <div className="mt-8 grid gap-8 max-md:gap-6 lg:grid-cols-2">
            {evolutionUnreconciledSeries.length >= 2 ? (
              <div className="min-w-0">
                <TreasuryLineChartMini
                  series={evolutionUnreconciledSeries}
                  strokeColor="var(--confidence-partielle)"
                  label="Montant à rapprocher (série)"
                />
                {velocityMain ? (
                  <p className="mt-2 text-xs font-medium text-[var(--text-secondary)]">
                    Vélocité (fenêtre affichée) : {velocityMain}
                  </p>
                ) : null}
              </div>
            ) : null}
            {coverageChartSeries.length >= 2 ? (
              <div className="min-w-0">
                <TreasuryLineChartMini
                  series={coverageChartSeries}
                  strokeColor="var(--confidence-fiable)"
                  label="Couverture probante (série %)"
                />
                {velocityCoverage ? (
                  <p className="mt-2 text-xs font-medium text-[var(--text-secondary)]">
                    Vélocité (fenêtre affichée) : {velocityCoverage}
                  </p>
                ) : null}
              </div>
            ) : null}
            {showReconciledMini ? (
              <div className="min-w-0 lg:col-span-2">
                <TreasuryLineChartMini
                  series={evolutionReconciledSeries}
                  strokeColor="color-mix(in srgb, var(--confidence-fiable) 70%, var(--border))"
                  label="Volume rapproché (série)"
                />
                {velocityReconciled ? (
                  <p className="mt-2 text-xs font-medium text-[var(--text-secondary)]">
                    Vélocité (fenêtre affichée) : {velocityReconciled}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {evolutionUnreconciledSeries.length < 2 && coverageChartSeries.length < 2 ? (
            <p className="mt-4 text-xs text-[var(--muted)]">
              Les séries « à rapprocher » et « couverture » ne sont pas renseignées point par point pour cette période (réponse Vault
              partielle).
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
