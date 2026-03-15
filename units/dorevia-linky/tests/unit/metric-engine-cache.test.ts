/**
 * Tests unitaires — Metric Engine : Cache et invalidation
 * SPEC_LINKY_METRIC_ENGINE_v1.0 §4
 */

import { describe, it, expect, beforeEach } from "vitest";
import { cacheGet, cacheSet, invalidateByEvent, invalidateByTenant, cacheClear, getCacheStats } from "../../app/lib/metric-engine/cache";
import type { MetricValue, ComputeParams } from "../../app/lib/metric-engine/types";

const testParams: ComputeParams = {
  tenant: "test-tenant",
  company_id: "1",
  date_debut: "2026-01-01",
  date_fin: "2026-03-31",
};

const makeValue = (metric_id: string, value: number): MetricValue => ({
  metric_id,
  value,
  formatted: `${value} €`,
  status: "ok",
  data_freshness: new Date().toISOString(),
  computed_at: new Date().toISOString(),
});

describe("Cache Layer", () => {
  beforeEach(() => {
    cacheClear();
  });

  describe("cacheGet / cacheSet", () => {
    it("retourne null pour une entrée absente", () => {
      expect(cacheGet("treasury_balance", testParams)).toBeNull();
    });

    it("retourne la valeur après cacheSet", () => {
      const val = makeValue("treasury_balance", 12345);
      cacheSet("treasury_balance", testParams, val);
      const cached = cacheGet("treasury_balance", testParams);
      expect(cached).not.toBeNull();
      expect(cached?.value).toBe(12345);
    });

    it("les paramètres différents donnent des clés différentes", () => {
      const val1 = makeValue("treasury_balance", 100);
      const val2 = makeValue("treasury_balance", 200);
      const params2: ComputeParams = { ...testParams, date_debut: "2025-01-01" };

      cacheSet("treasury_balance", testParams, val1);
      cacheSet("treasury_balance", params2, val2);

      expect(cacheGet("treasury_balance", testParams)?.value).toBe(100);
      expect(cacheGet("treasury_balance", params2)?.value).toBe(200);
    });

    it("retourne null après expiration du TTL", async () => {
      const val = makeValue("treasury_balance", 999);
      cacheSet("treasury_balance", testParams, val, 0.001); // 1ms TTL
      await new Promise((r) => setTimeout(r, 10));
      expect(cacheGet("treasury_balance", testParams)).toBeNull();
    });

    it("différentes métriques ne s'écrasent pas", () => {
      cacheSet("treasury_balance", testParams, makeValue("treasury_balance", 1000));
      cacheSet("commercial_margin", testParams, makeValue("commercial_margin", 2000));

      expect(cacheGet("treasury_balance", testParams)?.value).toBe(1000);
      expect(cacheGet("commercial_margin", testParams)?.value).toBe(2000);
    });
  });

  describe("invalidateByEvent", () => {
    it("invalide les métriques affectées par l'event_type", () => {
      cacheSet("treasury_balance", testParams, makeValue("treasury_balance", 100));
      cacheSet("commercial_margin", testParams, makeValue("commercial_margin", 200));

      const count = invalidateByEvent("payment_received");

      expect(count).toBeGreaterThan(0);
      expect(cacheGet("treasury_balance", testParams)).toBeNull();
      // commercial_margin n'est pas affecté par payment_received
      expect(cacheGet("commercial_margin", testParams)).not.toBeNull();
    });

    it("retourne 0 pour un event_type inconnu", () => {
      cacheSet("treasury_balance", testParams, makeValue("treasury_balance", 100));
      const count = invalidateByEvent("unknown.event.xyz");
      expect(count).toBe(0);
      expect(cacheGet("treasury_balance", testParams)).not.toBeNull();
    });

    it("invalide commercial_margin sur invoice_issued", () => {
      cacheSet("commercial_margin", testParams, makeValue("commercial_margin", 5000));
      invalidateByEvent("invoice_issued");
      expect(cacheGet("commercial_margin", testParams)).toBeNull();
    });
  });

  describe("invalidateByTenant", () => {
    it("invalide toutes les entrées d'un tenant", () => {
      const otherParams: ComputeParams = { ...testParams, tenant: "other-tenant" };

      cacheSet("treasury_balance", testParams, makeValue("treasury_balance", 100));
      cacheSet("treasury_balance", otherParams, makeValue("treasury_balance", 200));

      invalidateByTenant("test-tenant");

      expect(cacheGet("treasury_balance", testParams)).toBeNull();
      expect(cacheGet("treasury_balance", otherParams)).not.toBeNull();
    });
  });

  describe("getCacheStats", () => {
    it("retourne un cache_hit_rate cohérent", () => {
      const val = makeValue("treasury_balance", 100);
      cacheSet("treasury_balance", testParams, val);

      cacheGet("treasury_balance", testParams); // hit
      cacheGet("commercial_margin", testParams); // miss

      const stats = getCacheStats();
      expect(stats.cache_hit_rate).toBeCloseTo(0.5, 1);
      expect(stats.cache_entries).toBeGreaterThan(0);
      expect(stats.dag_nodes).toBeGreaterThan(0);
    });

    it("cache_hit_rate = 0 au démarrage (pas de hits)", () => {
      cacheGet("treasury_balance", testParams); // miss
      const stats = getCacheStats();
      expect(stats.cache_hit_rate).toBe(0);
    });
  });
});
