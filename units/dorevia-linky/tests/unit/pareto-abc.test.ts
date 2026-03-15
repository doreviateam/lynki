/**
 * Tests unitaires — Pareto ABC
 * Règle : A ≤ 80 %, B 80–95 %, C > 95 % (cumulatif)
 * Source : BusinessCard.tsx — logique de partition
 */

import { describe, it, expect } from "vitest";

// Réimplémentation de la partition ABC pour les tests
// (miroir de la logique de BusinessCard.tsx)
interface SalesByPartnerItem {
  partner_name: string;
  total_ht: number;
  pct_of_total: number;
  cumulative_pct: number;
}

type ParetoClass = "A" | "B" | "C";

function classifyPareto(item: SalesByPartnerItem): ParetoClass {
  // cumulative_pct est exprimé en 0–100
  if (item.cumulative_pct <= 80) return "A";
  if (item.cumulative_pct <= 95) return "B";
  return "C";
}

function partitionABC(items: SalesByPartnerItem[]): {
  A: SalesByPartnerItem[];
  B: SalesByPartnerItem[];
  C: SalesByPartnerItem[];
} {
  const A: SalesByPartnerItem[] = [];
  const B: SalesByPartnerItem[] = [];
  const C: SalesByPartnerItem[] = [];
  for (const item of items) {
    const cls = classifyPareto(item);
    if (cls === "A") A.push(item);
    else if (cls === "B") B.push(item);
    else C.push(item);
  }
  return { A, B, C };
}

// Données de test
const ITEMS: SalesByPartnerItem[] = [
  { partner_name: "Client A", total_ht: 50000, pct_of_total: 50, cumulative_pct: 50 },
  { partner_name: "Client B", total_ht: 30000, pct_of_total: 30, cumulative_pct: 80 },
  { partner_name: "Client C", total_ht: 12000, pct_of_total: 12, cumulative_pct: 92 },
  { partner_name: "Client D", total_ht: 5000, pct_of_total: 5, cumulative_pct: 97 },
  { partner_name: "Client E", total_ht: 3000, pct_of_total: 3, cumulative_pct: 100 },
];

describe("Pareto ABC — partition", () => {
  it("classe A : cumulative_pct ≤ 80 %", () => {
    const { A } = partitionABC(ITEMS);
    expect(A.map((i) => i.partner_name)).toEqual(["Client A", "Client B"]);
  });

  it("classe B : 80 % < cumulative_pct ≤ 95 %", () => {
    const { B } = partitionABC(ITEMS);
    expect(B.map((i) => i.partner_name)).toEqual(["Client C"]);
  });

  it("classe C : cumulative_pct > 95 %", () => {
    const { C } = partitionABC(ITEMS);
    expect(C.map((i) => i.partner_name)).toEqual(["Client D", "Client E"]);
  });

  it("toutes les classes ensemble = liste complète", () => {
    const { A, B, C } = partitionABC(ITEMS);
    expect(A.length + B.length + C.length).toBe(ITEMS.length);
  });

  it("liste vide → toutes les classes vides", () => {
    const { A, B, C } = partitionABC([]);
    expect(A).toHaveLength(0);
    expect(B).toHaveLength(0);
    expect(C).toHaveLength(0);
  });

  it("exactement 80 % → classe A (seuil inclus)", () => {
    const item: SalesByPartnerItem = { partner_name: "X", total_ht: 1000, pct_of_total: 80, cumulative_pct: 80 };
    expect(classifyPareto(item)).toBe("A");
  });

  it("exactement 95 % → classe B (seuil inclus)", () => {
    const item: SalesByPartnerItem = { partner_name: "X", total_ht: 100, pct_of_total: 15, cumulative_pct: 95 };
    expect(classifyPareto(item)).toBe("B");
  });

  it("cumulative_pct > 95 % → classe C", () => {
    const item: SalesByPartnerItem = { partner_name: "X", total_ht: 50, pct_of_total: 5, cumulative_pct: 95.1 };
    expect(classifyPareto(item)).toBe("C");
  });

  it("un seul partenaire → classe A (100 % ≤ 80 % = non, → C)", () => {
    const single: SalesByPartnerItem[] = [
      { partner_name: "Seul", total_ht: 100000, pct_of_total: 100, cumulative_pct: 100 },
    ];
    const { A, B, C } = partitionABC(single);
    expect(A).toHaveLength(0);
    expect(B).toHaveLength(0);
    expect(C).toHaveLength(1);
  });

  it("préserve l'ordre des items d'entrée", () => {
    const { A } = partitionABC(ITEMS);
    expect(A[0].partner_name).toBe("Client A");
    expect(A[1].partner_name).toBe("Client B");
  });
});

describe("Pareto ABC — cohérence des seuils", () => {
  it("la règle des 80/20 : ≤ 20 % des clients → ≥ 80 % du CA (classe A)", () => {
    // Cas réaliste : 2 clients sur 10 font 80 % du CA
    const items: SalesByPartnerItem[] = [
      { partner_name: "Top1", total_ht: 70000, pct_of_total: 70, cumulative_pct: 70 },
      { partner_name: "Top2", total_ht: 10000, pct_of_total: 10, cumulative_pct: 80 },
      ...Array.from({ length: 8 }, (_, i) => ({
        partner_name: `Rest${i}`,
        total_ht: 2500,
        pct_of_total: 2.5,
        cumulative_pct: 80 + (i + 1) * 2.5,
      })),
    ];
    const { A } = partitionABC(items);
    const totalItems = items.length;
    const classACount = A.length;
    // 2/10 = 20 % → règle de Pareto respectée
    expect(classACount / totalItems).toBeLessThanOrEqual(0.25);
  });
});
