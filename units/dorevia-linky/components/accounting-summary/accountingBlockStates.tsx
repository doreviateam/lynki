"use client";

import type { ReactNode } from "react";

const RETRY_CLASS =
  "mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors";

/** Libellé harmonisé — réponse stub / secours côté API */
export const ACCOUNTING_BADGE_STUB = "Secours documenté";

/** Couverture incomplète mais lignes présentes */
export const ACCOUNTING_BADGE_PARTIAL = "Partiel";

/** Texte d’erreur réseau / Vault — même ton sur tous les blocs comptables */
export const ACCOUNTING_UNAVAILABLE_BODY =
  "Indisponible pour le moment : le Vault n'a pas renvoyé de restitution exploitable, ou la connexion a échoué.";

export function AccountingBlockLoadingSkeleton({
  label,
  id,
  rows = 5,
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
      <div className="mb-4 h-5 w-48 max-w-[90%] rounded bg-[var(--border)] animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded bg-[var(--border)] animate-pulse"
            style={{ width: `${58 + ((i * 7) % 24)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function AccountingBlockUnavailable({
  title,
  onRetry,
  id,
}: {
  title: string;
  onRetry: () => void;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/10 p-6"
      role="alert"
    >
      <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">{ACCOUNTING_UNAVAILABLE_BODY}</p>
      <button type="button" onClick={onRetry} className={RETRY_CLASS}>
        Réessayer
      </button>
    </div>
  );
}

/** Message vide / secours sans lignes — même enveloppe visuelle partout */
export function AccountingBlockEmptyNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-[var(--accent-soft)]/10 px-3 py-2 text-xs leading-relaxed text-[var(--text-secondary)]">
      {children}
    </p>
  );
}

/** Ligne de périmètre (V1.3-3) — sous le titre, une seule lecture, sans jargon inutile */
export function AccountingBlockPerimeterLine({
  periodLabel,
  companyLabel,
  dataSource,
  compareNvsN1,
}: {
  periodLabel: string;
  companyLabel: string;
  dataSource?: string | null;
  compareNvsN1?: boolean;
}) {
  const bits = [`Période : ${periodLabel}`, `Société : ${companyLabel}`];
  if (dataSource === "vault") bits.push("Source : comptabilité (Vault)");
  else if (dataSource === "stub") bits.push("Source : secours documenté");
  else if (dataSource) bits.push(`Source : ${dataSource}`);
  if (compareNvsN1) bits.push("Comparatif N/N-1");
  return (
    <p className="mt-1 max-w-full text-[10px] leading-snug text-[var(--text-muted)]" role="note">
      {bits.join(" · ")}
    </p>
  );
}
