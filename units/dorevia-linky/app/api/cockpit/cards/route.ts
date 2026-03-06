import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const CARDS_VERSION = "2026-02-18.1";

interface CockpitCard {
  key: string;
  label: string;
  unit: "currency" | "percent" | "count";
  required: boolean;
}

const COCKPIT_CARDS: CockpitCard[] = [
  { key: "treasury_validated_pct", label: "Trésorerie validée", unit: "percent", required: true },
  { key: "treasury_position", label: "Position trésorerie", unit: "currency", required: false },
  { key: "cash", label: "Cash", unit: "currency", required: true },
  { key: "business", label: "Business", unit: "currency", required: true },
  { key: "taxes", label: "Taxes", unit: "currency", required: true },
  { key: "credit_notes", label: "Notes de crédit", unit: "currency", required: true },
  { key: "refunds", label: "Remboursements", unit: "currency", required: true },
  { key: "pos_shops", label: "POS magasins", unit: "currency", required: false },
  { key: "pos_z", label: "Z de caisse", unit: "currency", required: false },
];

/**
 * GET /api/cockpit/cards — Source de vérité des cards cockpit.
 * SPEC : DIVA_Cockpit_Cards_Governance.md v1.0 §2
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    schema: "dorevia.cockpit_cards.v1",
    cards_version: CARDS_VERSION,
    cards: COCKPIT_CARDS,
  });
}
