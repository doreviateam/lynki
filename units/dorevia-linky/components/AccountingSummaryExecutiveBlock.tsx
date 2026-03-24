"use client";

/**
 * Résumé de lecture comité (V1.3-1) — déterministe, sans nouvel appel API.
 * S’appuie uniquement sur l’état déjà calculé dans AccountingSummaryView.
 */

export type ExecutiveCoverageState = "loading" | "ready" | "partial" | "empty" | "unavailable";

export interface AccountingSummaryExecutiveBlockProps {
  periodLabel: string;
  companyLabel: string;
  companiesLoaded: boolean;
  coverageState: ExecutiveCoverageState;
  /** Rubriques bilan / CdR : comparatif N/N-1 côté API lorsque true (période ≠ mode N-1 seul). */
  enableCompare: boolean;
}

function coverageSummary(state: ExecutiveCoverageState): string {
  switch (state) {
    case "loading":
      return "Vérification du périmètre comptable en cours ; les blocs ci-dessous affichent leur propre état.";
    case "ready":
      return "Les trois agrégats de contrôle (balance générale, rubriques bilan, rubriques compte de résultat) renvoient des lignes sur ce périmètre.";
    case "partial":
      return "La couverture Vault est partielle : certains blocs peuvent être incomplets — se fier au détail de chaque section.";
    case "empty":
      return "Peu ou pas de lignes sur ce périmètre pour les agrégats principaux ; la structure de la page reste disponible avec des états vides par bloc.";
    case "unavailable":
      return "Les agrégats principaux ne sont pas joignables pour le moment ; chaque bloc indique son indisponibilité.";
    default:
      return "";
  }
}

export function AccountingSummaryExecutiveBlock({
  periodLabel,
  companyLabel,
  companiesLoaded,
  coverageState,
  enableCompare,
}: AccountingSummaryExecutiveBlockProps) {
  const scopeLine = companiesLoaded
    ? `Synthèse comptable · ${periodLabel} · ${companyLabel}.`
    : `Synthèse comptable · ${periodLabel}.`;

  return (
    <section
      className="rounded-xl border border-[var(--sv2-border)] bg-[var(--sv2-surface)] px-5 py-4 sm:px-6 shadow-sm"
      aria-label="Résumé de lecture comité"
    >
      <p className="sv2-label text-[var(--sv2-text-muted)] mb-1">Résumé de lecture comité</p>
      <p className="text-sm font-medium text-[var(--sv2-text)] leading-snug">{scopeLine}</p>
      <p className="mt-2 text-xs text-[var(--sv2-text-muted)] leading-relaxed">
        Les montants et tableaux proviennent du Vault. Aucune conclusion financière automatique n’est inférée ici.
      </p>

      <ul className="mt-3 space-y-1.5 text-xs text-[var(--sv2-text-muted)] list-disc pl-4 leading-relaxed">
        <li>{coverageSummary(coverageState)}</li>
        <li>
          {enableCompare
            ? "Rubriques bilan et compte de résultat : un comparatif N/N-1 est demandé au Vault lorsque la période affichée le permet (colonnes dédiées dans les tableaux)."
            : "Rubriques bilan et compte de résultat : affichage sans comparatif N/N-1 pour la période ou le mode sélectionné."}
        </li>
        <li>Balance générale : disponible sur cette page, sans comparatif N/N-1.</li>
        <li>
          Balances âgées clients et fournisseurs : présentes plus bas ; l’état précis (données / vide / erreur) est indiqué sur chaque bloc.
        </li>
        <li>Exports : fichiers CSV par bloc comptable concerné ; rapport DOCX uniquement via le bloc d’analyse (Diva), lorsqu’il est disponible.</li>
      </ul>
    </section>
  );
}
