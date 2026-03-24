"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export interface CockpitAppBarRowProps {
  confidenceScore?: number | null;
  confidenceLabel?: string;
  title?: string;
  subtitle?: string;
  /** Aligné maquette `pilotage_desktop_v_r_na_canon_v5` : champ recherche (placeholder, non câblé). */
  showSearchField?: boolean;
  beforeTitleSlot?: ReactNode;
  trailingSlot?: ReactNode;
}

export function CockpitAppBarRow({
  confidenceScore,
  confidenceLabel,
  title = "Lynki Desktop Cockpit",
  subtitle,
  showSearchField = true,
  beforeTitleSlot,
  trailingSlot,
}: CockpitAppBarRowProps) {
  const scoreDisplay = confidenceScore != null ? `${confidenceScore.toFixed(1)} %` : null;

  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        {beforeTitleSlot}
        <h1 className="truncate text-base font-bold tracking-tight text-[var(--text)] sm:text-lg">{title}</h1>
        {scoreDisplay ? (
          <>
            <span className="hidden text-[var(--border)] sm:inline">|</span>
            <span
              className="flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold text-[var(--confidence-fiable)] sm:px-3 sm:text-xs"
              style={{
                borderColor: "color-mix(in srgb, var(--confidence-fiable) 35%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--confidence-fiable) 12%, var(--bg-secondary))",
              }}
            >
              <Icon name="verified_user" size={14} filled />
              <span className="whitespace-nowrap">
                {scoreDisplay} {confidenceLabel ?? "Fiable"}
              </span>
            </span>
          </>
        ) : null}
        {subtitle ? (
          <span className="hidden min-w-0 truncate text-xs text-[var(--muted)] lg:inline">{subtitle}</span>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {showSearchField ? (
          <div className="relative hidden max-w-[14rem] flex-1 md:flex lg:max-w-xs">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              size={18}
            />
            <input
              type="search"
              readOnly
              placeholder="Rechercher un flux, une facture…"
              className="w-full rounded-lg border-0 bg-[var(--hover)] py-1.5 pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--confidence-fiable)_45%,transparent)]"
              aria-label="Recherche (bientôt disponible)"
            />
          </div>
        ) : null}
        <ThemeToggle />
        <button
          type="button"
          className="hidden rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] sm:inline-flex"
          aria-label="Notifications"
        >
          <Icon name="notifications" size={20} />
        </button>
        <button
          type="button"
          className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
          aria-label="Paramètres"
        >
          <Icon name="settings" size={20} />
        </button>
        <div className="ml-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--confidence-fiable)] text-xs font-bold text-white">
          V
        </div>
        {trailingSlot}
      </div>
    </div>
  );
}
