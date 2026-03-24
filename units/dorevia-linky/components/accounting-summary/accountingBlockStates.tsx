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

// ─── Libellés export CSV / DOCX (V1.3-5) — objet métier clair, distinct du rapport Diva ───

export const EXPORT_CSV_LABEL_TRIAL_BALANCE = "CSV · Balance générale";
export const EXPORT_CSV_LABEL_RUBRICS_BILAN = "CSV · Rubriques bilan";
export const EXPORT_CSV_LABEL_RUBRICS_CDR = "CSV · Rubriques compte de résultat";
export const EXPORT_CSV_LABEL_AGED_CLIENTS = "CSV · Balance âgée clients";
export const EXPORT_CSV_LABEL_AGED_SUPPLIERS = "CSV · Balance âgée fournisseurs";

export const EXPORT_DOCX_LABEL_DIVA_REPORT = "DOCX · Rapport Diva";

/** Texte bouton pendant l’appel réseau — homogène sur tous les CSV */
export const EXPORT_CSV_PENDING_LABEL = "Téléchargement…";

export function buildTrialBalanceCsvTooltip(opts: {
  periodFrom: string;
  periodTo: string;
  companyLabel: string;
  /** Vue filtrée par rubrique : le CSV reste la balance complète (pas de filtre côté export actuel). */
  screenFilteredByRubric: boolean;
}): string {
  const range = `${opts.periodFrom} → ${opts.periodTo}`;
  let s = `Fichier CSV : balance générale complète sur ${range}, ${opts.companyLabel}. Données Vault (même périmètre que les dates et sociétés de la synthèse).`;
  if (opts.screenFilteredByRubric) {
    s +=
      " Attention : la table est filtrée par rubrique à l’écran, mais ce téléchargement contient la balance générale entière sur la période.";
  }
  return s;
}

export function buildRubricsCsvTooltip(opts: {
  kind: "bilan" | "cdr";
  periodFrom: string;
  periodTo: string;
  companyLabel: string;
  includesNvsN1: boolean;
}): string {
  const range = `${opts.periodFrom} → ${opts.periodTo}`;
  const bloc = opts.kind === "bilan" ? "rubriques bilan" : "rubriques compte de résultat";
  let s = `Fichier CSV : ${bloc} pour ${range}, ${opts.companyLabel}. Données Vault.`;
  if (opts.includesNvsN1) {
    s += " Le fichier reprend les colonnes affichées, y compris N/N-1 si présentes à l’écran.";
  }
  return s;
}

export function buildAgedCsvTooltip(opts: {
  kind: "clients" | "fournisseurs";
  asOfDate: string;
  companyLabel: string;
}): string {
  const lib =
    opts.kind === "clients" ? "balance âgée clients" : "balance âgée fournisseurs";
  return `Fichier CSV : ${lib}, position au ${opts.asOfDate}, ${opts.companyLabel}. Données Vault — même date et sociétés que ce bloc.`;
}

/** Rapport narratif Diva — agrégats, pas les CSV des blocs */
export function buildDivaDocxTooltip(opts: {
  periodFrom: string;
  periodTo: string;
  companyLabel: string;
}): string {
  return `Document Word généré par Diva à partir d’agrégats (rubriques bilan, CdR, balances tiers) — ${opts.periodFrom} → ${opts.periodTo}, ${opts.companyLabel}. Ce n’est pas un export des fichiers CSV des blocs.`;
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
