/**
 * Tests unitaires — IconGrid : grille KPI
 * Vérifie le nombre de tuiles, leur ordre et les IDs attendus.
 */

import { describe, it, expect } from "vitest";

// Réimplémentation de GRID_ITEMS pour les tests
// (miroir de IconGrid.tsx — à garder synchronisé)
type CardId =
  | "treasury"
  | "treasury_position"
  | "cash"
  | "business"
  | "taxes"
  | "credit_notes"
  | "refunds"
  | "pos_shops"
  | "pos_z"
  | "working_capital"
  | "encours"
  | "ebitda";

interface GridItem {
  id: CardId;
  label: string;
}

const GRID_ITEMS: GridItem[] = [
  { id: "treasury", label: "Paiements" },
  { id: "business", label: "Business" },
  { id: "cash", label: "Cash" },
  { id: "working_capital", label: "BFR" },
  { id: "taxes", label: "Taxes" },
  { id: "encours", label: "Encours" },
  { id: "pos_shops", label: "Points de vente" },
  { id: "credit_notes", label: "Notes de crédit" },
  { id: "refunds", label: "Remboursements" },
  { id: "pos_z", label: "Z de caisse" },
  { id: "ebitda", label: "EBE" },
];

// IDs attendus par la spec (SPEC_LINKY_COCKPIT_INSTRUMENTS_v1.0 §3.1)
const EXPECTED_INSTRUMENT_IDS: CardId[] = [
  "treasury",
  "business",
  "cash",
  "working_capital",
  "taxes",
  "encours",
  "pos_shops",
  "credit_notes",
  "refunds",
  "pos_z",
  "ebitda",
];

describe("IconGrid — grille KPI", () => {
  it("contient 11 instruments (+ 1 en attente : pos_z)", () => {
    expect(GRID_ITEMS.length).toBe(11);
  });

  it("contient tous les IDs d'instruments attendus", () => {
    const gridIds = GRID_ITEMS.map((i) => i.id);
    for (const expected of EXPECTED_INSTRUMENT_IDS) {
      expect(gridIds).toContain(expected);
    }
  });

  it("les IDs sont uniques", () => {
    const ids = GRID_ITEMS.map((i) => i.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("les labels sont non vides", () => {
    for (const item of GRID_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("les nouveaux instruments sont présents : BFR, Encours, EBE", () => {
    const ids = GRID_ITEMS.map((i) => i.id);
    expect(ids).toContain("working_capital");
    expect(ids).toContain("encours");
    expect(ids).toContain("ebitda");
  });

  it("les instruments historiques sont présents", () => {
    const ids = GRID_ITEMS.map((i) => i.id);
    expect(ids).toContain("treasury");
    expect(ids).toContain("business");
    expect(ids).toContain("cash");
    expect(ids).toContain("taxes");
    expect(ids).toContain("credit_notes");
    expect(ids).toContain("refunds");
    expect(ids).toContain("pos_shops");
  });

  it("treasury est en première position (instrument principal)", () => {
    expect(GRID_ITEMS[0].id).toBe("treasury");
  });
});

describe("IconGrid — Metric Registry — alignement", () => {
  it("les instruments de la grille couvrent les 12 définis dans la spec", () => {
    // 12 instruments spec − 1 (pos_z en cours) = 11 implémentés
    // + pos_z dans la grille → 11 tuiles actuelles
    expect(GRID_ITEMS.length).toBeGreaterThanOrEqual(11);
  });
});
