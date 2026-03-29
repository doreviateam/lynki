import type { UiStateKey } from "@/app/lib/cockpit/ui-state-labels";
import { UI_STATE_LABELS } from "@/app/lib/cockpit/ui-state-labels";

/**
 * Entrées du lexique Pilotage (aperçu in-app) — aligné sur la doctrine Web60.
 * Textes courts ; la norme complète reste en doc produit.
 */
export const LEXIQUE_PILOTAGE_ORDER: UiStateKey[] = [
  "reliable",
  "partial",
  "pending",
  "unavailable",
  "estimated",
  "to_confirm",
  "certified",
  "sealed",
  "sync_ok",
  "empty_useful",
];

export const LEXIQUE_PILOTAGE_HINTS: Partial<Record<UiStateKey, string>> = {
  reliable: "Lecture pilotable sur le périmètre affiché.",
  partial:
    "Donnée ou couverture incomplètes ; interpréter avec prudence. Comprend les lectures dont la clé technique est `proxy` : l’UI affiche **Partiel**, pas « Proxy » (doctrine §9.5).",
  pending: "Donnée ou stabilisation attendue.",
  unavailable: "Aucune lecture fiable ; ce n’est pas nécessairement un zéro métier.",
  estimated: "Valeur estimée ; méthode à garder en tête.",
  to_confirm: "Lecture possible ; consolidation ou rapprochement à finaliser.",
  certified: "Niveau de preuve renforcé selon les règles produit.",
  sealed: "Ancrage ou scellement probant.",
  sync_ok: "Chaîne de mise à jour récente — complète l’état de qualité, ne le remplace pas.",
  empty_useful: "Absence informative sur la période (ex. aucun flux).",
};

export function lexiquePilotageRows(): { key: UiStateKey; label: string; hint: string }[] {
  return LEXIQUE_PILOTAGE_ORDER.map((key) => ({
    key,
    label: UI_STATE_LABELS[key],
    hint: LEXIQUE_PILOTAGE_HINTS[key] ?? "—",
  }));
}
