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
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 box-border flex min-h-16 items-center border-b border-[var(--border)] bg-[var(--bg-secondary)] px-6 md:left-64"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <CockpitAppBarRow
          title={title}
          subtitle={subtitle}
          confidenceScore={confidenceScore}
          confidenceLabel={confidenceLabel}
          showSearchField
        />
      </header>
      <div
        className="shrink-0"
        style={{ height: "calc(4rem + env(safe-area-inset-top, 0px))" }}
        aria-hidden
      />
    </>
  );
}
