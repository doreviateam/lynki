"use client";

import { Icon } from "@/components/Icon";

interface ConfidenceScoreProps {
  score: number | null;
  label?: string;
  compact?: boolean;
}

export function ConfidenceScore({ score, label, compact = false }: ConfidenceScoreProps) {
  if (score == null) return null;

  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 90 ? "var(--confidence-fiable)" :
    pct >= 70 ? "var(--confidence-partielle)" :
    "var(--negative)";

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold"
        style={{
          borderColor: `color-mix(in srgb, ${color} 32%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${color} 12%, var(--card))`,
          color,
        }}
      >
        <Icon name="verified_user" size={14} filled />
        {pct.toFixed(1)} % {label ?? "Fiable"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon name="shield" size={20} className="text-[var(--confidence-fiable)]" filled />
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
            Data Integrity Score
          </div>
          <div className="text-lg font-bold tabular-nums" style={{ color }}>
            {pct.toFixed(1)} %
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        {label && (
          <div className="mt-1 text-right text-[9px] font-medium" style={{ color }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
