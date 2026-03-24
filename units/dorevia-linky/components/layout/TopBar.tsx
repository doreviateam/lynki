"use client";

import { Icon } from "@/components/Icon";

interface TopBarProps {
  confidenceScore?: number | null;
  confidenceLabel?: string;
  title?: string;
  subtitle?: string;
}

export function TopBar({
  confidenceScore,
  confidenceLabel,
  title = "Lynki Desktop Cockpit",
  subtitle,
}: TopBarProps) {
  const scoreDisplay = confidenceScore != null ? `${confidenceScore.toFixed(1)} %` : null;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-3">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-[var(--text)]">{title}</h1>
        {scoreDisplay && (
          <>
            <span className="text-[var(--border)]">|</span>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-0.5 text-xs font-semibold text-emerald-500">
              <Icon name="verified_user" size={14} filled />
              {scoreDisplay} {confidenceLabel ?? "Fiable"}
            </span>
          </>
        )}
        {subtitle && (
          <span className="text-xs text-[var(--muted)]">{subtitle}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]">
          <Icon name="search" size={20} />
        </button>
        <button className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]">
          <Icon name="notifications" size={20} />
        </button>
        <button className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]">
          <Icon name="settings" size={20} />
        </button>
        <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
          V
        </div>
      </div>
    </header>
  );
}
