"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import type { SeriesPoint } from "@/app/types/aggregations";
import { formatAmount } from "@/app/lib/format";
import type { ChartGranularity } from "@/app/lib/chart-granularity";
import type { ChartType } from "@/app/lib/chart-type";

interface DualSeriesChartProps {
  series1: SeriesPoint[];
  series2: SeriesPoint[];
  total1: number;
  total2: number;
  label1: string;
  label2: string;
  /** Libellés pour le camembert (si différents, ex. HT vs TTC) */
  pieLabel1?: string;
  pieLabel2?: string;
  granularity: ChartGranularity;
  chartType: ChartType;
  currency?: string;
  /** Barres/courbe : afficher en % (chaque période = 100 %) au lieu des montants */
  relativeTo100?: boolean;
  /** Célébration 100 % — transition douce + micro-luminosité (SPEC_UX_CELEBRATION_LINKY) */
  celebrating100?: boolean;
  /** Masquer la série 2 (ex. POS : pas de ventes en attente sur le graphique) */
  showSeries2?: boolean;
  /** Mode Gouvernance — couleur slice 2 (à rapprocher) : orange >30 %, jaune 10–30 % */
  pieColor2?: string;
  /** Période sélectionnée (ex. "2026-01") — met en évidence le point/barre correspondant */
  selectedPeriod?: string | null;
  /** Appelé quand l'utilisateur clique sur un point/barre (période) */
  onPeriodSelect?: (period: string) => void;
}

/** Formate le libellé d'une période selon la granularité */
function formatPeriodLabel(period: string, granularity: ChartGranularity): string {
  try {
    if (granularity === "month") {
      const [, m] = period.split("-");
      const months = ["Janv", "Fév", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
      const idx = parseInt(m ?? "1", 10) - 1;
      return months[idx] ?? period;
    }
    if (granularity === "day" || granularity === "week") {
      const [y, m, d] = period.split("-");
      return `${d}/${m}`;
    }
    return period;
  } catch {
    return period;
  }
}

function mergeSeries(
  s1: SeriesPoint[],
  s2: SeriesPoint[],
  key1: string,
  key2: string
): { period: string; label: string; [k: string]: string | number }[] {
  const byPeriod = new Map<string, Record<string, number>>();
  for (const p of s1) {
    const cur = byPeriod.get(p.period) ?? { [key1]: 0, [key2]: 0 };
    cur[key1] = p.amount;
    byPeriod.set(p.period, cur);
  }
  for (const p of s2) {
    const cur = byPeriod.get(p.period) ?? { [key1]: 0, [key2]: 0 };
    cur[key2] = p.amount;
    byPeriod.set(p.period, cur);
  }
  const periods = Array.from(new Set([...s1.map((s) => s.period), ...s2.map((p) => p.period)])).sort();
  return periods.map((period) => {
    const d = byPeriod.get(period) ?? { [key1]: 0, [key2]: 0 };
    return {
      period,
      label: period,
      [key1]: d[key1],
      [key2]: d[key2],
    };
  });
}

const PIE_COLORS = ["var(--positive)", "var(--warning)"];
const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "10px 14px",
  fontSize: 14,
};
const TOOLTIP_ITEM_STYLE = {
  color: "var(--text)",
  fontWeight: 600,
  paddingTop: 4,
};

/** Tooltip personnalisé pour le camembert : lisibilité maximale, z-index élevé */
function PieTooltipContent({
  active,
  payload,
  currency = "EUR",
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  currency?: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div
      className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-lg"
      style={{ zIndex: 1000 }}
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-[var(--text)]">{item.name}</span>
        <span className="text-base font-bold tabular-nums text-[var(--text)]">
          {formatAmount(item.value, currency)}
        </span>
      </div>
    </div>
  );
}

export function DualSeriesChart({
  series1,
  series2,
  total1,
  total2,
  label1,
  label2,
  pieLabel1 = label1,
  pieLabel2 = label2,
  granularity,
  chartType,
  currency = "EUR",
  relativeTo100 = false,
  celebrating100 = false,
  showSeries2 = true,
  pieColor2,
  selectedPeriod = null,
  onPeriodSelect,
}: DualSeriesChartProps) {
  // prefers-reduced-motion : désactivé ici (hooks causaient React #310 sur certains runtimes).
  // Les animations sont légères (350ms) ; fallback stable pour éviter crash.
  const prefersReducedMotion = false;

  const key1 = "serie1";
  const key2 = "serie2";
  type ChartRow = { period: string; label: string; serie1: number; serie2: number };
  let seriesData: ChartRow[] = mergeSeries(series1, series2, key1, key2).map((row) => ({
    period: row.period,
    label: formatPeriodLabel(row.period, granularity),
    serie1: Number(row[key1]) || 0,
    serie2: Number(row[key2]) || 0,
  }));

  // Si pas de série temporelle mais totaux disponibles → point agrégé pour bar/line (ex. Trésorerie)
  if (seriesData.length === 0 && (total1 > 0 || total2 > 0) && (chartType === "bar" || chartType === "line")) {
    seriesData = [{ period: "total", label: "Total", serie1: total1, serie2: total2 }];
  }

  if (relativeTo100 && (chartType === "bar" || chartType === "line")) {
    seriesData = seriesData.map((row) => {
      const raw = row as { period: string; label: string; serie1: number; serie2: number };
      const v1 = Number(raw[key1]) || 0;
      const v2 = Number(raw[key2]) || 0;
      const total = v1 + v2;
      const pct1 = total > 0 ? (v1 / total) * 100 : 0;
      const pct2 = total > 0 ? (v2 / total) * 100 : 0;
      return { ...row, [key1]: pct1, [key2]: pct2 };
    });
  }

  const isEmpty = seriesData.length === 0 && total1 === 0 && total2 === 0;
  const color2 = pieColor2 ?? PIE_COLORS[1];
  const pieData = [
    { name: pieLabel1, value: Math.max(0, total1), fill: PIE_COLORS[0] },
    ...(showSeries2 ? [{ name: pieLabel2, value: Math.max(0, total2), fill: color2 }] : []),
  ].filter((d) => d.value > 0);

  if (isEmpty) {
    return (
      <div className="flex h-48 items-center justify-center rounded border border-[var(--border)] bg-[var(--muted-soft)] text-[var(--text-secondary)] text-sm">
        Aucune donnée sur la période
      </div>
    );
  }

  if (chartType === "pie") {
    if (pieData.length === 0) {
      return (
        <div className="flex h-48 items-center justify-center rounded border border-[var(--border)] bg-[var(--muted-soft)] text-[var(--text-secondary)] text-sm">
          Aucune donnée sur la période
        </div>
      );
    }
    const pieWrapperClass =
      celebrating100 && !prefersReducedMotion
        ? "dorevia-celebration-luminosity"
        : undefined;

    return (
      <div className={pieWrapperClass}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={prefersReducedMotion ? 0 : 350}
              animationEasing="ease-out"
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              content={<PieTooltipContent currency={currency} />}
              wrapperStyle={{ zIndex: 1000 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const yAxisDomain = relativeTo100 ? [0, 100] : undefined;
  const yAxisTickFormatter = relativeTo100
    ? (v: number) => `${Math.round(v)} %`
    : (v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v));
  const tooltipFormatter = relativeTo100
    ? (value: number) => `${value.toFixed(1)} %`
    : (value: number) => formatAmount(value, currency);

  const handleChartClick = (data: { activePayload?: Array<{ payload: ChartRow }> } | undefined) => {
    const period = data?.activePayload?.[0]?.payload?.period;
    if (period && onPeriodSelect) onPeriodSelect(period);
  };

  if (chartType === "line") {
    const renderDot1 = (props: { cx?: number; cy?: number; payload?: ChartRow; index?: number }) => {
      const { cx = 0, cy = 0, payload } = props;
      const isSelected = payload && selectedPeriod !== null && selectedPeriod !== undefined && payload.period === selectedPeriod;
      return (
        <circle
          cx={cx}
          cy={cy}
          r={isSelected ? 5 : 3}
          fill={isSelected ? "var(--accent)" : "var(--positive)"}
          stroke={isSelected ? "var(--text)" : "var(--positive)"}
          strokeWidth={isSelected ? 2 : 0}
          onClick={(e) => {
            e.stopPropagation();
            if (payload?.period && onPeriodSelect) onPeriodSelect(payload.period);
          }}
          style={{ cursor: onPeriodSelect ? "pointer" : "default" }}
          aria-label={payload ? `Mois ${payload.label}${isSelected ? ", sélectionné" : ""}` : undefined}
        />
      );
    };
    const renderDot2 = (props: { cx?: number; cy?: number; payload?: ChartRow }) => {
      const { cx = 0, cy = 0, payload } = props;
      const isSelected = payload && selectedPeriod !== null && selectedPeriod !== undefined && payload.period === selectedPeriod;
      return (
        <circle
          cx={cx}
          cy={cy}
          r={isSelected ? 5 : 3}
          fill={isSelected ? "var(--accent)" : "var(--warning)"}
          stroke={isSelected ? "var(--text)" : "var(--warning)"}
          strokeWidth={isSelected ? 2 : 0}
          onClick={(e) => {
            e.stopPropagation();
            if (payload?.period && onPeriodSelect) onPeriodSelect(payload.period);
          }}
          style={{ cursor: onPeriodSelect ? "pointer" : "default" }}
        />
      );
    };
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={seriesData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }} onClick={handleChartClick}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            tickLine={{ stroke: "var(--border)" }}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            domain={yAxisDomain}
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            tickLine={{ stroke: "var(--border)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickFormatter={yAxisTickFormatter}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: "var(--text)" }}
            formatter={tooltipFormatter}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey={key1} stroke="var(--positive)" strokeWidth={2} dot={renderDot1} name={label1} />
          {showSeries2 && <Line type="monotone" dataKey={key2} stroke="var(--warning)" strokeWidth={2} dot={renderDot2} name={label2} />}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "bar") {
    const barShape1 = (props: { payload?: ChartRow; fill?: string; x?: number; y?: number; width?: number; height?: number; radius?: number | [number, number, number, number] }) => {
      const fill = props.payload && selectedPeriod != null && props.payload.period === selectedPeriod ? "var(--accent)" : "var(--positive)";
      return <Rectangle {...props} fill={fill} radius={showSeries2 ? 0 : [2, 2, 0, 0]} />;
    };
    const barShape2 = (props: { payload?: ChartRow; fill?: string; x?: number; y?: number; width?: number; height?: number; radius?: number | [number, number, number, number] }) => {
      const fill = props.payload && selectedPeriod != null && props.payload.period === selectedPeriod ? "var(--accent)" : "var(--warning)";
      return <Rectangle {...props} fill={fill} radius={[2, 2, 0, 0]} />;
    };
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={seriesData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }} onClick={handleChartClick}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            tickLine={{ stroke: "var(--border)" }}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            domain={yAxisDomain}
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            tickLine={{ stroke: "var(--border)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickFormatter={yAxisTickFormatter}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: "var(--text)" }}
            formatter={tooltipFormatter}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {relativeTo100 ? (
            <>
              <Bar
                dataKey={key1}
                stackId="stack"
                fill="var(--positive)"
                shape={barShape1}
                name={label1}
                onClick={(data: ChartRow) => data?.period && onPeriodSelect?.(data.period)}
                style={{ cursor: onPeriodSelect ? "pointer" : "default" }}
              />
              {showSeries2 && (
                <Bar
                  dataKey={key2}
                  stackId="stack"
                  fill="var(--warning)"
                  shape={barShape2}
                  name={label2}
                  onClick={(data: ChartRow) => data?.period && onPeriodSelect?.(data.period)}
                  style={{ cursor: onPeriodSelect ? "pointer" : "default" }}
                />
              )}
            </>
          ) : (
            <>
              <Bar
                dataKey={key1}
                fill="var(--positive)"
                shape={barShape1}
                radius={[2, 2, 0, 0]}
                name={label1}
                onClick={(data: ChartRow) => data?.period && onPeriodSelect?.(data.period)}
                style={{ cursor: onPeriodSelect ? "pointer" : "default" }}
              />
              {showSeries2 && (
                <Bar
                  dataKey={key2}
                  fill="var(--warning)"
                  shape={barShape2}
                  radius={[2, 2, 0, 0]}
                  name={label2}
                  onClick={(data: ChartRow) => data?.period && onPeriodSelect?.(data.period)}
                  style={{ cursor: onPeriodSelect ? "pointer" : "default" }}
                />
              )}
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
