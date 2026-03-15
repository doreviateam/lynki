/**
 * Constantes du bloc Évolution (SPEC_CONSOLIDEE_BLOC_EVOLUTION_3_CARDS v1.1.1).
 * Référence : ZeDocs/web47/SPEC_CONSOLIDEE_BLOC_EVOLUTION_3_CARDS_v1.0.md
 *
 * Règle partial (spec §9.4) : l'état `partial` est évalué sur les **points
 * effectivement affichés** à la granularité demandée (points renvoyés par
 * l'endpoint après agrégation), pas sur les snapshots bruts.
 */

/** Message standardisé pour l'état empty du bloc Évolution (spec §7.2, §9.2). */
export const EVOLUTION_EMPTY_MESSAGE =
  "Historique insuffisant pour afficher une évolution sur la période.";

/**
 * Seuil de couverture (0–1) en deçà duquel la card Trésorerie affiche l'état partial.
 * Spec §9.4 : COVERAGE_PARTIAL_THRESHOLD, valeur recommandée 0,95 (95 %).
 * Si coverage_ratio < seuil sur au moins un point affiché → state partial.
 */
export const COVERAGE_PARTIAL_THRESHOLD = 0.95;
