/**
 * Tests unitaires — GET /api/treasury (MINI_SPEC_COUVERTURE_STRUCTURELLE_PAIE).
 * Vérifient structural_coverage_available, structural_charges_amount, structural_charges_breakdown
 * selon la réponse payroll Vault (payroll_source, total_charges).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const TREASURY_URL = "http://vault/ui/aggregations/treasury";
const COMPLETENESS_URL = "http://vault/ui/aggregations/payments-completeness";
const PAYROLL_URL = "http://vault/ui/aggregations/payroll";

function mockFetch(
  treasury: object,
  completeness: { ok: boolean },
  payroll: { payroll_source?: string; total_charges?: number } | "fail"
) {
  return vi.fn((input: string | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("payroll")) {
      if (payroll === "fail") return Promise.resolve({ ok: false });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(payroll) });
    }
    if (url.includes("payments-completeness"))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(completeness) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve(treasury) });
  });
}

describe("GET /api/treasury — couverture structurelle (MINI_SPEC)", () => {
  const defaultTreasury = {
    position: { validated_balance: 10_000, erp_balance: 12_000 },
    currency: "EUR",
    reconciliation_rate: 85,
  };

  beforeEach(() => {
    vi.stubEnv("VAULT_URL", "http://vault");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("AC1 — payroll od + total_charges > 0 → structural_coverage_available true, montant et breakdown", async () => {
    const fetchMock = mockFetch(defaultTreasury, { ok: true }, {
      payroll_source: "od",
      total_charges: 12_400,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("@/app/api/treasury/route");
    const req = new NextRequest("http://localhost/api/treasury?tenant=core");
    const res = await GET(req);
    const body = await res.json();

    expect(body.structural_coverage_available).toBe(true);
    expect(body.structural_charges_amount).toBe(12_400);
    expect(body.structural_charges_breakdown).toEqual({ payroll: 12_400 });
    // MINI_SPEC v1.1 : ratio = min(100, 12400/10000*100) = 100
    expect(body.structural_coverage_ratio).toBe(100);
  });

  it("payroll payslip + total_charges > 0 → structural_coverage_available true, ratio calculé", async () => {
    const fetchMock = mockFetch(defaultTreasury, { ok: true }, {
      payroll_source: "payslip",
      total_charges: 8_000,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("@/app/api/treasury/route");
    const req = new NextRequest("http://localhost/api/treasury?tenant=core");
    const res = await GET(req);
    const body = await res.json();

    expect(body.structural_coverage_available).toBe(true);
    expect(body.structural_charges_amount).toBe(8_000);
    expect(body.structural_charges_breakdown).toEqual({ payroll: 8_000 });
    expect(body.structural_coverage_ratio).toBe(80); // 8000/10000*100
  });

  it("payroll source none → structural_coverage_available false, montant et ratio null", async () => {
    const fetchMock = mockFetch(defaultTreasury, { ok: true }, {
      payroll_source: "none",
      total_charges: 0,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("@/app/api/treasury/route");
    const req = new NextRequest("http://localhost/api/treasury?tenant=core");
    const res = await GET(req);
    const body = await res.json();

    expect(body.structural_coverage_available).toBe(false);
    expect(body.structural_charges_amount).toBeNull();
    expect(body.structural_charges_breakdown).toEqual({});
    expect(body.structural_coverage_ratio).toBeNull();
  });

  it("payroll total_charges 0 (source od) → structural_coverage_available false", async () => {
    const fetchMock = mockFetch(defaultTreasury, { ok: true }, {
      payroll_source: "od",
      total_charges: 0,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("@/app/api/treasury/route");
    const req = new NextRequest("http://localhost/api/treasury?tenant=core");
    const res = await GET(req);
    const body = await res.json();

    expect(body.structural_coverage_available).toBe(false);
    expect(body.structural_charges_amount).toBeNull();
    expect(body.structural_coverage_ratio).toBeNull();
  });

  it("structural_coverage_ratio plafonné à 100 et calculé (charges / trésorerie validée)", async () => {
    const treasury = { position: { validated_balance: 118_179.42 }, currency: "EUR" };
    const fetchMock = mockFetch(treasury, { ok: true }, {
      payroll_source: "od",
      total_charges: 21_500,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("@/app/api/treasury/route");
    const req = new NextRequest("http://localhost/api/treasury?tenant=core");
    const res = await GET(req);
    const body = await res.json();

    expect(body.structural_coverage_ratio).toBeGreaterThan(0);
    expect(body.structural_coverage_ratio).toBeLessThanOrEqual(100);
    expect(body.structural_coverage_ratio).toBeCloseTo((21_500 / 118_179.42) * 100, 1);
  });

  it("payroll fetch en échec → structural_coverage_available false, réponse treasury inchangée", async () => {
    const fetchMock = mockFetch(defaultTreasury, { ok: true }, "fail");
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("@/app/api/treasury/route");
    const req = new NextRequest("http://localhost/api/treasury?tenant=core");
    const res = await GET(req);
    const body = await res.json();

    expect(body.structural_coverage_available).toBe(false);
    expect(body.structural_charges_amount).toBeNull();
    expect(body.structural_charges_breakdown).toEqual({});
    expect(body.structural_coverage_ratio).toBeNull();
    expect(body.position).toBeDefined();
    expect(body.currency).toBe("EUR");
  });
});
