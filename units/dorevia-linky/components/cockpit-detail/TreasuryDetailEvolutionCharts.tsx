"use client";

import { useId } from "react";
import type { TreasuryEvolutionSeriesPoint } from "@/app/api/treasury-evolution/route";

function LinePath({
  series,
  min,
  max,
  w,
  h,
}: {
  series: TreasuryEvolutionSeriesPoint[];
  min: number;
  max: number;
  w: number;
  h: number;
}) {
  const toX = (i: number) => (i / (series.length - 1)) * w;
  const toY = (v: number) => h - ((v - min) / (max - min || 1)) * h;
  return series.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.amount).toFixed(1)}`).join(" ");
}

/** Courbe principale — position (solde) sur la période. */
export function TreasuryBalanceAreaChart({ series }: { series: TreasuryEvolutionSeriesPoint[] }) {
  const gid = `tb-${useId().replace(/:/g, "")}`;
  if (series.length < 2) return null;
  const values = series.map((p) => p.amount);
  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;
  const w = 600;
  const h = 200;
  const path = LinePath({ series, min, max, w, h });
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-64 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={`${gid}-grad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--confidence-fiable)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--confidence-fiable)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid}-grad)`} />
      <path
        d={path}
        fill="none"
        stroke="var(--confidence-fiable)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Courbe compacte — même structure, sans aire (ex. montant à rapprocher, couverture). */
export function TreasuryLineChartMini({
  series,
  strokeColor,
  label,
}: {
  series: TreasuryEvolutionSeriesPoint[];
  /** Ex. `var(--confidence-partielle)` ou couleur explicite */
  strokeColor: string;
  label: string;
}) {
  if (series.length < 2) return null;
  const values = series.map((p) => p.amount);
  const pad = (max: number, min: number) => (max - min || 1) * 0.08;
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const min = rawMin - pad(rawMax, rawMin);
  const max = rawMax + pad(rawMax, rawMin);
  const w = 600;
  const h = 120;
  const path = LinePath({ series, min, max, w, h });

  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-36 w-full" preserveAspectRatio="none" role="img" aria-label={label}>
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Delta premier → dernier point (vélocité indicative sur la fenêtre affichée). */
export function formatSeriesDeltaEuro(series: TreasuryEvolutionSeriesPoint[], formatCurrency: (n: number) => string): string | null {
  if (series.length < 2) return null;
  const a = series[0]?.amount;
  const b = series[series.length - 1]?.amount;
  if (typeof a !== "number" || typeof b !== "number") return null;
  const d = b - a;
  const sign = d >= 0 ? "+" : "−";
  return `${sign} ${formatCurrency(Math.abs(d))} sur la période`;
}

export function formatSeriesDeltaPct(
  coverage: { pct: number | null }[],
  formatPct: (n: number | null | undefined) => string
): string | null {
  const nums = coverage.map((c) => c.pct).filter((x): x is number => x != null && Number.isFinite(x));
  if (nums.length < 2) return null;
  const a = nums[0];
  const b = nums[nums.length - 1];
  const d = b - a;
  const sign = d >= 0 ? "+" : "−";
  return `${sign}${Math.abs(Math.round(d))} pts de couverture sur la période (${formatPct(a)} → ${formatPct(b)})`;
}

/** Dernière fenêtre de N points (pour vélocité courte ou sélecteur d’affichage). */
export function sliceSeriesTail<T extends { period: string }>(series: T[], n: number): T[] {
  if (series.length < 2 || n < 2) return series;
  if (series.length <= n) return series;
  return series.slice(-n);
}

export type EvolutionDisplayWindow = "full" | "last30" | "last7";

export function applyEvolutionDisplayWindow<T extends { period: string }>(
  series: T[],
  mode: EvolutionDisplayWindow
): T[] {
  if (series.length < 2) return series;
  if (mode === "full") return series;
  return sliceSeriesTail(series, mode === "last7" ? 7 : 30);
}

export function formatPeriodRangeLabel(series: TreasuryEvolutionSeriesPoint[]): string | null {
  if (series.length === 0) return null;
  const a = series[0]?.period;
  const b = series[series.length - 1]?.period;
  if (!a || !b) return null;
  return a === b ? a : `${a} → ${b}`;
}
