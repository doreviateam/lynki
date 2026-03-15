"use client";

interface BarData {
  value: number;
  variant?: "success" | "warning";
}

interface BarChartPlaceholderProps {
  data: BarData[];
}

export function BarChartPlaceholder({ data }: BarChartPlaceholderProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="h-[180px] flex items-end gap-2.5">
      {data.map((d, i) => (
        <div
          key={i}
          className={`flex-1 min-w-[28px] rounded-t transition-all duration-300 ${
            d.variant === "warning"
              ? "bg-linky-warning"
              : "bg-linky-success"
          }`}
          style={{ height: `${(d.value / max) * 140}px` }}
        />
      ))}
    </div>
  );
}
