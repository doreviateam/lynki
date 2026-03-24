/**
 * Tests unitaires — affichage couverture structurelle (MINI_SPEC v1.1, AC4, AC7).
 * Teste getStructuralCoverageDisplay : Couverture structurelle en % (x %, 0 %, —).
 */

import { describe, it, expect } from "vitest";
import {
  getStructuralCoverageDisplay,
  type StructuralCoverageDisplayInput,
} from "@/app/lib/structural-coverage-display";

describe("getStructuralCoverageDisplay", () => {
  it("AC4 v1.1 — structural_coverage_ratio présent → x %", () => {
    const data: StructuralCoverageDisplayInput = {
      structural_charges_amount: 12_400,
      structural_coverage_ratio: 18.2,
      currency: "EUR",
    };
    const out = getStructuralCoverageDisplay(data, "EUR");
    expect(out.structuralCoverageLabel).toBe("18,2 %");
    expect(out.structuralChargesFormatted).toContain("12");
    expect(out.structuralChargesFormatted).toContain("€");
  });

  it("structural_coverage_ratio 0 → « 0 % »", () => {
    const data: StructuralCoverageDisplayInput = {
      structural_charges_amount: 0,
      structural_coverage_ratio: 0,
      currency: "EUR",
    };
    const out = getStructuralCoverageDisplay(data, "EUR");
    expect(out.structuralCoverageLabel).toBe("0 %");
  });

  it("ratio null / pas de dénominateur → « — »", () => {
    const data: StructuralCoverageDisplayInput = {
      structural_coverage_available: false,
      structural_charges_amount: null,
      structural_coverage_ratio: null,
      currency: "EUR",
    };
    const out = getStructuralCoverageDisplay(data, "EUR");
    expect(out.structuralCoverageLabel).toBe("—");
    expect(out.structuralChargesFormatted).toBe("—");
  });

  it("data null → « — »", () => {
    const out = getStructuralCoverageDisplay(null, "EUR");
    expect(out.structuralCoverageLabel).toBe("—");
    expect(out.structuralChargesFormatted).toBe("—");
  });

  it("ratio 100 → « 100 % »", () => {
    const data: StructuralCoverageDisplayInput = {
      structural_charges_amount: 50_000,
      structural_coverage_ratio: 100,
      currency: "EUR",
    };
    const out = getStructuralCoverageDisplay(data, "EUR");
    expect(out.structuralCoverageLabel).toBe("100 %");
  });

  it("structural_charges_amount 0 sans ratio → « 0 % »", () => {
    const data: StructuralCoverageDisplayInput = {
      structural_charges_amount: 0,
      currency: "EUR",
    };
    const out = getStructuralCoverageDisplay(data, "EUR");
    expect(out.structuralCoverageLabel).toBe("0 %");
    expect(out.structuralChargesFormatted).toMatch(/0[\s,]*00\s*€/);
  });
});
