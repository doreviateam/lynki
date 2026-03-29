/**
 * Échelle typographique Lynki — cockpit (5 niveaux).
 * Harmonise titre de page, KPI maîtres, tuiles secondaires, labels et métadonnées.
 */

/** N1 — Titre de page (sous le « hero » : ne rivalise pas avec les montants maîtres) */
export const COCKPIT_T1_PAGE_TITLE =
  "font-headline text-base font-semibold tracking-[-0.015em] text-[color-mix(in_srgb,var(--text)_90%,var(--muted)_10%)] sm:text-[1.0625rem]";

/** Titre cockpit fusionné (bandeau — maquette pilotage HTML). */
export const COCKPIT_T0_HEADER_PAGE =
  "font-headline min-w-0 truncate text-3xl font-extrabold tracking-tight text-[var(--text)]";

/** N1 — Métadonnée de page (fraîcheur : volontairement très basse dans la hiérarchie) */
export const COCKPIT_T1_PAGE_META =
  "text-[9px] font-normal leading-tight tracking-[0.03em] text-[color-mix(in_srgb,var(--muted)_99.2%,var(--text)_0.8%)] opacity-[0.72]";

/**
 * N2 — Valeur principale tuiles maîtresses (A).
 * Utiliser avec `CockpitMasterKpiValue` : partie numérique scrollable + suffixe € fixe (évite de couper le symbole).
 */
export const COCKPIT_T2_MASTER_VALUE_SCROLL =
  "min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-headline text-4xl font-extrabold leading-none tabular-nums tracking-normal text-[var(--text)] [scrollbar-width:thin] xl:text-5xl";

export const COCKPIT_T2_MASTER_VALUE_EURO =
  "shrink-0 font-headline text-4xl font-extrabold leading-none tabular-nums tracking-normal text-[var(--text)] xl:text-5xl";

/** Cas « — » ou libellé court sans devise : pas de split. */
export const COCKPIT_T2_MASTER_VALUE_PLAIN =
  "font-headline text-4xl font-extrabold leading-none tabular-nums tracking-normal text-[var(--text)] xl:text-5xl";

/** N3 — Valeur tuiles secondaires (grille B/C) — même règle « une ligne », typo légèrement plus resserrée que les cartes A. */
export const COCKPIT_T3_SECONDARY_VALUE =
  "block w-full min-w-0 max-w-full overflow-x-auto whitespace-nowrap font-headline text-3xl font-bold tabular-nums tracking-normal text-[var(--text)] [scrollbar-width:thin]";

/** N4 — Intitulé d’instrument (toutes cartes : uppercase, même grain) */
export const COCKPIT_T4_CARD_LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--text-secondary)_96%,var(--text)_4%)]";

/** N4 — Micro-libellés type « Couverture probante » (bandeau dans carte A) */
export const COCKPIT_T4_MICRO_UPPER =
  "text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]";

/** N5 — Sous-texte métier sous le montant maître (légende KPI) */
export const COCKPIT_T5_CAPTION =
  "text-[11px] font-normal leading-snug text-[color-mix(in_srgb,var(--text-secondary)_98%,var(--text)_2%)]";

/** N5 — Ligne détail : libellé */
export const COCKPIT_T5_DETAIL_LABEL = "text-[11px] font-medium text-[var(--text-secondary)]";

/** N5 — Ligne détail : montant */
export const COCKPIT_T5_DETAIL_VALUE = "text-[11px] font-semibold tabular-nums text-[var(--text)]";

/** N5 — Badges d’état (Fiable, Partiel, Certifié, …) */
export const COCKPIT_T5_STATE_BADGE = "text-[10px] font-semibold leading-tight";

/** Métadonnées filtres header (Tenant, Société, Période) */
export const COCKPIT_HEADER_FILTER_LABEL =
  "text-[10px] font-semibold uppercase leading-none tracking-[0.14em] text-[var(--muted)]";
