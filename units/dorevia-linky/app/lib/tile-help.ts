/**
 * Tooltips d'aide des tuiles vue Synthèse — NOTE_IMPLÉMENTATION_TOOLTIPS_TUILES_LINKY_SYNTHÈSE_v1.0.
 * Chaque tuile expose une icône "i" avec ce texte (survol desktop, clic/tap mobile).
 */

import type { CardId } from "@/app/types/linky-tiles";

export type TileTimeScope = "current" | "period";

export interface TileHelpEntry {
  key: CardId;
  title: string;
  tooltip: string;
  timeScope: TileTimeScope;
}

export const TILE_HELP: Record<CardId, TileHelpEntry> = {
  treasury: {
    key: "treasury",
    title: "Trésorerie",
    tooltip: "Trésorerie disponible à date. Position actuelle, pas la période sélectionnée.",
    timeScope: "current",
  },
  business: {
    key: "business",
    title: "Business",
    tooltip: "Volume d'activité sur la période. À distinguer des encaissements et de la trésorerie.",
    timeScope: "period",
  },
  cash: {
    key: "cash",
    title: "Flux net",
    tooltip: "Entrées moins sorties sur la période. Négatif = consommation nette de cash.",
    timeScope: "period",
  },
  treasury_position: {
    key: "treasury_position",
    title: "Paiements",
    tooltip: "Paiements constatés sur la période. Règlements enregistrés, distincts de la trésorerie globale.",
    timeScope: "period",
  },
  working_capital: {
    key: "working_capital",
    title: "BFR",
    tooltip: "Besoin en fonds de roulement à date. Liquidités mobilisées, pas un flux de période.",
    timeScope: "current",
  },
  encours: {
    key: "encours",
    title: "Encours",
    tooltip: "Encours à date. Position à encaisser ou à suivre, pas un flux de période.",
    timeScope: "current",
  },
  taxes: {
    key: "taxes",
    title: "Taxes",
    tooltip: "Taxes calculées sur la période. Part fiscale de l'activité observée.",
    timeScope: "period",
  },
  ebitda: {
    key: "ebitda",
    title: "EBE",
    tooltip: "Excédent brut d'exploitation sur la période. En attente si donnée non disponible.",
    timeScope: "period",
  },
  credit_notes: {
    key: "credit_notes",
    title: "Notes de crédit",
    tooltip: "Notes de crédit émises sur la période. Avoirs et corrections sur l'activité facturée.",
    timeScope: "period",
  },
  refunds: {
    key: "refunds",
    title: "Remboursements",
    tooltip: "Remboursements constatés sur la période.",
    timeScope: "period",
  },
  pos_shops: {
    key: "pos_shops",
    title: "Points de vente",
    tooltip: "Activité des points de vente sur la période. Périmètre POS remonté dans Linky.",
    timeScope: "period",
  },
  pos_z: {
    key: "pos_z",
    title: "Z de caisse",
    tooltip: "Clôtures de caisse sur la période. Dépend des Z remontés dans le périmètre POS.",
    timeScope: "period",
  },
};

export function getTileHelp(id: CardId): TileHelpEntry | undefined {
  return TILE_HELP[id];
}
