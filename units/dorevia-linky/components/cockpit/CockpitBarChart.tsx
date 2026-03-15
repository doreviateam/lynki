"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import type { ChartBarData } from "@/app/types/cockpit";

const COLORS = { success: "#22C55E", warning: "#F59E0B" };

interface CockpitBarChartProps {
  data: ChartBarData[];
  height?: number;
}

export function CockpitBarChart({ data, height = 180 }: CockpitBarChartProps) {
  if (!data?.length) {
    return (
      <div
        className="flex items-center justify-center text-linky-muted text-linky-small"
        style={{ height }}
      >
        Aucune donnée disponible
      </div>
    );
  }
  const chartData = data.map((d, i) => ({
    index: i,
    value: d.value,
    variant: d.variant ?? "success",
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <XAxis dataKey="index" hide />
        <YAxis
          stroke="#9FB3C8"
          tick={{ fill: "#9FB3C8", fontSize: 12 }}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1A2E47",
            border: "1px solid #223B5B",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#9FB3C8" }}
          formatter={(value: number) => [value, "Montant"]}
        />
        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]}
          isAnimationActive
          animationDuration={300}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={chartData[i]?.variant === "warning" ? COLORS.warning : COLORS.success} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
