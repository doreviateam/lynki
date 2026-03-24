"use client";

import type { ReactNode } from "react";

const RETRY_CLASS =
  "mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors";

/** Message réseau / agrégat indisponible — ton cockpit flux (pas tableau de flux IFRS). */
export const COCKPIT_FLUX_NET_UNAVAILABLE_BODY =
  "Les indicateurs de flux n’ont pas pu être chargés (réseau ou réponse vide). Réessayez ou vérifiez la configuration du tenant.";

export function CockpitFluxNetLoadingSkeleton({
  label,
  id,
  rows = 4,
}: {
  label: string;
  id?: string;
  rows?: number;
}) {
  return (
    <div
      id={id}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
      aria-busy="true"
      aria-label={`Chargement : ${label}`}
    >
      <div className="mb-4 h-5 w-48 max-w-[90%] animate-pulse rounded bg-[var(--border)]" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-[var(--border)]"
            style={{ width: `${58 + ((i * 7) % 24)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function CockpitFluxNetUnavailable({
  title,
  onRetry,
  attemptHint,
  id,
}: {
  title: string;
  onRetry: () => void;
  attemptHint?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/10 p-6"
      role="alert"
    >
      <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{COCKPIT_FLUX_NET_UNAVAILABLE_BODY}</p>
      {attemptHint ? <p className="mt-1 text-xs text-[var(--muted)]">{attemptHint}</p> : null}
      <button type="button" onClick={onRetry} className={RETRY_CLASS}>
        Réessayer
      </button>
    </div>
  );
}

export function CockpitFluxNetEmptyNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-[var(--accent-soft)]/10 px-3 py-2 text-xs leading-relaxed text-[var(--text-secondary)]">
      {children}
    </p>
  );
}

/** Vue partielle : KPI sans détail enc/déc, ou mode instruments sans `_details`. */
export function CockpitFluxNetPartialBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-secondary)]">
      {children}
    </div>
  );
}
