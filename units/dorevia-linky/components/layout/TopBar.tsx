"use client";

import { CockpitAppBarRow } from "@/components/layout/CockpitAppBarRow";

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
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-[var(--border)] bg-[var(--bg-secondary)] px-6">
      <CockpitAppBarRow
        title={title}
        subtitle={subtitle}
        confidenceScore={confidenceScore}
        confidenceLabel={confidenceLabel}
        showSearchField
      />
    </header>
  );
}
