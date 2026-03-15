/**
 * Tests unitaires — payroll-source-ui (SPEC_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0 §10, §11).
 * Recette continue : S-FR-2 (source bulletins), S-FR-3 (source indisponible), S-FR-4 (legacy_fallback).
 */

import { describe, it, expect } from "vitest";
import {
  normalizePayrollResponse,
  resolvePayrollSourceUi,
  PAYROLL_SOURCE_UI,
  type RawPayrollResponse,
} from "../../app/lib/payroll-source-ui";

describe("normalizePayrollResponse", () => {
  it("retourne des valeurs par défaut pour null ou objet vide", () => {
    expect(normalizePayrollResponse(null)).toEqual({
      total: null,
      count: 0,
      currency: "EUR",
    });
    expect(normalizePayrollResponse({})).toMatchObject({
      total: null,
      count: 0,
      currency: "EUR",
    });
  });

  it("lit total_charges et payslip_count (format Vault)", () => {
    const raw: RawPayrollResponse = {
      total_charges: 21500,
      payslip_count: 2,
      currency: "EUR",
      payroll_source: "od",
    };
    const out = normalizePayrollResponse(raw);
    expect(out.total).toBe(21500);
    expect(out.count).toBe(2);
    expect(out.payroll_source).toBe("od");
  });

  it("lit total et count (alias)", () => {
    const raw: RawPayrollResponse = {
      total: 5000,
      count: 1,
      payroll_source: "payslip",
    };
    const out = normalizePayrollResponse(raw);
    expect(out.total).toBe(5000);
    expect(out.count).toBe(1);
    expect(out.payroll_source).toBe("payslip");
  });

  it("normalise payroll_source none et payroll_unavailable", () => {
    const raw: RawPayrollResponse = {
      total_charges: 0,
      payslip_count: 0,
      payroll_source: "none",
      payroll_unavailable: true,
    };
    const out = normalizePayrollResponse(raw);
    expect(out.payroll_source).toBe("none");
    expect(out.payroll_unavailable).toBe(true);
  });

  it("ne renvoie pas payroll_source si absent (rétrocompatibilité S-FR-4)", () => {
    const raw: RawPayrollResponse = {
      total: 1000,
      count: 1,
      currency: "EUR",
    };
    const out = normalizePayrollResponse(raw);
    expect(out.total).toBe(1000);
    expect("payroll_source" in out ? (out as { payroll_source?: string }).payroll_source : undefined).toBeUndefined();
  });
});

describe("resolvePayrollSourceUi", () => {
  it("S-FR-2 : payroll_source payslip → payslip", () => {
    expect(resolvePayrollSourceUi({ total: 5000, count: 1, currency: "EUR", payroll_source: "payslip" })).toBe(
      "payslip"
    );
  });

  it("payroll_source od → od", () => {
    expect(resolvePayrollSourceUi({ total: 21500, count: 2, currency: "EUR", payroll_source: "od" })).toBe("od");
  });

  it("S-FR-3 : payroll_source none ou payroll_unavailable → none", () => {
    expect(resolvePayrollSourceUi({ total: 0, count: 0, currency: "EUR", payroll_source: "none" })).toBe("none");
    expect(
      resolvePayrollSourceUi({ total: null, count: 0, currency: "EUR", payroll_unavailable: true })
    ).toBe("none");
  });

  it("S-FR-4 : pas de payroll_source → legacy_fallback", () => {
    expect(resolvePayrollSourceUi({ total: 1000, count: 1, currency: "EUR" })).toBe("legacy_fallback");
  });
});

describe("PAYROLL_SOURCE_UI (mapping spec §10)", () => {
  it("S-FR-2 : badge et message pour source bulletins", () => {
    const entry = PAYROLL_SOURCE_UI.payslip;
    expect(entry.badge).toBe("Source paie : bulletins");
    expect(entry.messagePrimary).toContain("bulletins de paie");
  });

  it("badge et message pour source OD", () => {
    const entry = PAYROLL_SOURCE_UI.od;
    expect(entry.badge).toBe("Source paie : OD comptables");
    expect(entry.messagePrimary).toContain("OD comptables");
  });

  it("S-FR-3 : badge et message pour source indisponible (pas « Aucun bulletin dans le Vault »)", () => {
    const entry = PAYROLL_SOURCE_UI.none;
    expect(entry.badge).toBe("Source paie indisponible");
    expect(entry.messagePrimary).toBe("Charges de personnel non disponibles sur la période.");
    expect(entry.messageSecondary).not.toContain("Aucun bulletin dans le Vault");
    expect(entry.messageSecondary).toContain("Aucun bulletin ni OD");
  });

  it("S-FR-4 : badge et message legacy_fallback (générique)", () => {
    const entry = PAYROLL_SOURCE_UI.legacy_fallback;
    expect(entry.badge).toBe("Source paie actuelle non disponible");
    expect(entry.messagePrimary).toContain("non disponibles");
    expect(entry.messageSecondary).not.toContain("Aucun bulletin dans le Vault");
  });

  it("S-FR-5 : la chaîne « Aucun bulletin dans le Vault » n’apparaît dans aucun état", () => {
    const obsolete = "Aucun bulletin dans le Vault";
    for (const key of Object.keys(PAYROLL_SOURCE_UI) as Array<keyof typeof PAYROLL_SOURCE_UI>) {
      const entry = PAYROLL_SOURCE_UI[key];
      expect(entry.badge).not.toContain(obsolete);
      expect(entry.messagePrimary).not.toContain(obsolete);
      expect(entry.messageSecondary).not.toContain(obsolete);
    }
  });
});
