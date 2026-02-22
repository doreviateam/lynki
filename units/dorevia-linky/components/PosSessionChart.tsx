"use client";

import type { ReactNode } from "react";
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
} from "recharts";
import { formatAmount } from "@/app/lib/format";
import type { ChartType } from "@/app/lib/chart-type";

interface PosSessionItem {
  session_id: string;
  closed_at: string;
  total_sales: number;
  vault_status: "sealed" | "pending" | "failed" | "missing";
}

interface PosSessionChartProps {
  sessions: PosSessionItem[];
  chartType: ChartType;
  currency?: string;
}

const SCROLL_THRESHOLD = 12;
const MIN_ITEM_WIDTH = 48;

/** Un point par session (triées par closed_at) — barres ou courbe */
export function PosSessionChart({
  sessions,
  chartType,
  currency = "EUR",
}: PosSessionChartProps) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.closed_at).getTime() - new Date(b.closed_at).getTime()
  );

  const seriesData = sorted
    .filter((s) => s.vault_status === "sealed")
    .map((s) => ({
      key: s.session_id,
      session_id: s.session_id,
      amount: s.total_sales,
    }));

  if (seriesData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded border border-[var(--border)] bg-[var(--muted-soft)] text-[var(--text-secondary)] text-sm">
        Aucune donnée sur la période
      </div>
    );
  }

  const tooltipFormatter = (value: number) => formatAmount(value, currency);
  const yTickFormatter = (v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v));

  const n = seriesData.length;
  const needsScroll = n > SCROLL_THRESHOLD;
  const chartWidth = needsScroll ? Math.max(400, n * MIN_ITEM_WIDTH) : undefined;

  const chartWrapper = (content: ReactNode) =>
    needsScroll ? (
      <div className="overflow-x-auto overflow-y-hidden scroll-smooth rounded" style={{ scrollbarGutter: "stable" }}>
        <div style={{ minWidth: chartWidth }}>
          {content}
        </div>
      </div>
    ) : (
      content
    );

  if (chartType === "line") {
    return chartWrapper(
      <ResponsiveContainer width={chartWidth ?? "100%"} height={220}>
        <LineChart data={seriesData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="session_id"
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            tickLine={{ stroke: "var(--border)" }}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            tickLine={{ stroke: "var(--border)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickFormatter={yTickFormatter}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              padding: "10px 14px",
              fontSize: 14,
            }}
            labelStyle={{ color: "var(--text)" }}
            formatter={tooltipFormatter}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.session_id ?? ""}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="amount" stroke="var(--positive)" strokeWidth={2} dot={{ r: 4 }} name={`Ventes scellées (${seriesData.length})`} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  const PIE_COLORS = ["var(--positive)", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

  if (chartType === "pie") {
    const pieData = seriesData
      .filter((r) => r.amount > 0)
      .map((r, i) => ({
        name: r.session_id,
        value: r.amount,
        fill: PIE_COLORS[i % PIE_COLORS.length],
      }));
    if (pieData.length === 0) {
      return (
        <div className="flex h-48 items-center justify-center rounded border border-[var(--border)] bg-[var(--muted-soft)] text-[var(--text-secondary)] text-sm">
          Aucune donnée sur la période
        </div>
      );
    }
    return (
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
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatAmount(value, currency)}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "bar") {
    return chartWrapper(
      <ResponsiveContainer width={chartWidth ?? "100%"} height={220}>
        <BarChart data={seriesData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="session_id"
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            tickLine={{ stroke: "var(--border)" }}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            tickLine={{ stroke: "var(--border)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickFormatter={yTickFormatter}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              padding: "10px 14px",
              fontSize: 14,
            }}
            labelStyle={{ color: "var(--text)" }}
            formatter={tooltipFormatter}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.session_id ?? ""}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="amount"
            fill="var(--positive)"
            radius={[2, 2, 0, 0]}
            name={`Ventes scellées (${seriesData.length})`}
            minPointSize={(val) => (val != null && val > 0 ? 6 : 0)}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
