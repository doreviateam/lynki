"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { normalizeUiStateLabel, UI_STATE_LABELS } from "@/app/lib/cockpit/ui-state-labels";

/** Champ recherche chrome (placeholder, non câblé) — ligne 0 cockpit ou TopBar. */
export function CockpitChromeSearchField({
  className = "",
  placeholder = "Rechercher un flux, une facture…",
  compact = false,
  shellSubdued = false,
}: {
  className?: string;
  placeholder?: string;
  /** Recherche plus discrète (shell), largeur laissée au parent. */
  compact?: boolean;
  /** Contraste plus faible que le titre (directive cockpit). */
  shellSubdued?: boolean;
}) {
  return (
    <div className={`relative flex min-w-0 max-w-full ${className}`}>
      <Icon
        name="search"
        className={`pointer-events-none absolute ${shellSubdued ? "text-[color-mix(in_srgb,var(--muted)_82%,transparent)]" : "text-[var(--muted)]"} ${compact ? "left-2 top-1/2 -translate-y-1/2" : "left-3 top-1/2 -translate-y-1/2"}`}
        size={compact ? 16 : 18}
      />
      <input
        type="search"
        readOnly
        placeholder={placeholder}
        className={`w-full rounded-lg border leading-tight focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--confidence-fiable)_40%,transparent)] ${
          compact
            ? shellSubdued
              ? "h-8 border-[color-mix(in_srgb,var(--border)_38%,transparent)] bg-[color-mix(in_srgb,var(--hover)_75%,transparent)] py-0 pl-7 pr-2 text-[11px] leading-none text-[var(--text-secondary)] placeholder:text-[color-mix(in_srgb,var(--muted)_88%,transparent)]"
              : "border-[color-mix(in_srgb,var(--border)_45%,transparent)] bg-[var(--hover)] py-0.5 pl-7 pr-2 text-xs text-[var(--text)] placeholder:text-[var(--muted)]"
            : "border-[color-mix(in_srgb,var(--border)_45%,transparent)] bg-[var(--hover)] py-1 pl-9 pr-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--muted)]"
        }`}
        aria-label="Recherche (bientôt disponible)"
      />
    </div>
  );
}

/**
 * Barre d’actions cockpit.
 * `orientation` : header Lynki V1 (CDCF) — identité / session uniquement, sans thème ni icônes système au niveau 1.
 * `full` : TopBar et écrans secondaires (thème + raccourcis + avatar).
 */
export function CockpitChromeUtilities({
  trailingSlot,
  className = "",
  variant = "full",
}: {
  trailingSlot?: ReactNode;
  className?: string;
  variant?: "full" | "orientation";
}) {
  if (variant === "orientation") {
    return (
      <div className={`flex shrink-0 items-center justify-end gap-1 ${className}`}>
        <button
          type="button"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-base font-bold text-white outline-none ring-offset-2 ring-offset-[var(--bg-secondary)] transition-[box-shadow] hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label="Session (menu à brancher)"
          title="Session"
        >
          V
        </button>
        {trailingSlot}
      </div>
    );
  }
  return (
    <div className={`flex shrink-0 items-center justify-end gap-0.5 sm:gap-1.5 ${className}`}>
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
  );
}

export interface CockpitAppBarRowProps {
  confidenceScore?: number | null;
  confidenceLabel?: string;
  title?: string;
  subtitle?: string;
  /** Aligné maquette `pilotage_desktop_v_r_na_canon_v5` : champ recherche (placeholder, non câblé). */
  showSearchField?: boolean;
  beforeTitleSlot?: ReactNode;
  trailingSlot?: ReactNode;
  /**
   * true = ligne chrome uniquement (recherche + actions). Sans `identityCluster`, la ligne 0 ne contient pas le trio titre.
   */
  chromeShellOnly?: boolean;
  /** Trio titre / couverture / arrêté — si omis avec `chromeShellOnly`, rendu sur la ligne suivante par le parent. */
  identityCluster?: ReactNode;
}

export function CockpitAppBarRow({
  confidenceScore,
  confidenceLabel,
  title = "Lynki Desktop Cockpit",
  subtitle,
  /** false par défaut : recherche non câblée — ne pas occuper le niveau 1 tant que le produit ne l’expose pas. */
  showSearchField = false,
  beforeTitleSlot,
  trailingSlot,
  chromeShellOnly = false,
  identityCluster,
}: CockpitAppBarRowProps) {
  const scoreDisplay = confidenceScore != null ? `${confidenceScore.toFixed(1)} %` : null;
  const integrityLabelRaw = confidenceLabel ?? UI_STATE_LABELS.reliable;
  const integrityLabel =
    normalizeUiStateLabel(integrityLabelRaw) ?? UI_STATE_LABELS.reliable;

  const pageIdentity =
    !chromeShellOnly ? (
      <>
        <h1 className="font-headline truncate text-base font-semibold tracking-tight text-[var(--text)] sm:text-lg">{title}</h1>
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
                {scoreDisplay} {integrityLabel}
              </span>
            </span>
          </>
        ) : null}
        {subtitle ? (
          <span className="hidden min-w-0 max-w-[14rem] truncate text-xs text-[var(--muted)] md:inline xl:max-w-none">{subtitle}</span>
        ) : null}
      </>
    ) : null;

  /**
   * Chrome cockpit : recherche compacte + utilitaires. Mobile : [tenant | utilitaires] puis recherche.
   */
  if (chromeShellOnly && !identityCluster) {
    return (
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,min(15rem,26vw))_auto] sm:items-center sm:gap-x-3 sm:gap-y-0">
        <div className="hidden min-h-0 min-w-0 sm:col-start-1 sm:row-start-1 sm:block" aria-hidden />
        <div className="col-start-1 row-start-1 min-w-0 sm:hidden">{beforeTitleSlot}</div>
        <div className="col-start-2 row-start-1 flex justify-end sm:col-start-3 sm:row-start-1">
          <CockpitChromeUtilities trailingSlot={trailingSlot} />
        </div>
        <div className="col-span-2 col-start-1 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
          {showSearchField ? <CockpitChromeSearchField compact className="w-full" /> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
        {beforeTitleSlot}
        {chromeShellOnly && identityCluster ? identityCluster : pageIdentity}
      </div>

      <div className="flex w-full shrink-0 items-center justify-end gap-1 sm:w-auto sm:gap-2">
        {showSearchField ? (
          <CockpitChromeSearchField className="flex-1 sm:max-w-[14rem] md:max-w-[16rem] lg:max-w-xs" />
        ) : null}
        <CockpitChromeUtilities trailingSlot={trailingSlot} />
      </div>
    </div>
  );
}
