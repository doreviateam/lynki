"use client";

import type { ReactNode } from "react";

const RETRY_CLASS =
  "mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors";

/** Message réseau / agrégat indisponible — ton cockpit (pas comptable). */
export const COCKPIT_ENCOURS_UNAVAILABLE_BODY =
  "Les indicateurs encours n’ont pas pu être chargés (réseau ou réponse vide). Réessayez ou vérifiez la configuration du tenant.";

export function CockpitEncoursLoadingSkeleton({
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

export function CockpitEncoursUnavailable({
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
      <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{COCKPIT_ENCOURS_UNAVAILABLE_BODY}</p>
      {attemptHint ? <p className="mt-1 text-xs text-[var(--muted)]">{attemptHint}</p> : null}
      <button type="button" onClick={onRetry} className={RETRY_CLASS}>
        Réessayer
      </button>
    </div>
  );
}

export function CockpitEncoursEmptyNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-[var(--accent-soft)]/10 px-3 py-2 text-xs leading-relaxed text-[var(--text-secondary)]">
      {children}
    </p>
  );
}

/** KPI présent mais détail AR / partenaires absent — pas d’invention de chiffres. */
export function CockpitEncoursPartialBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-secondary)]">
      {children}
    </div>
  );
}
