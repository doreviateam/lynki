/**
 * Tests unitaires — Metric Engine : DAG et détection de cycles
 * SPEC_LINKY_METRIC_ENGINE_v1.0 §2–§3
 */

import { describe, it, expect } from "vitest";
import { buildDependencyGraph, getAffectedMetrics, CycleDetectedError } from "../../app/lib/metric-engine/graph";
import type { MetricDefinition } from "../../app/lib/metric-engine/types";
import { METRIC_REGISTRY } from "../../app/lib/metric-engine/registry";

describe("buildDependencyGraph", () => {
  it("construit le graphe depuis le registry sans erreur", () => {
    expect(() => buildDependencyGraph(METRIC_REGISTRY)).not.toThrow();
  });

  it("retourne un ordre d'exécution avec toutes les métriques", () => {
    const graph = buildDependencyGraph(METRIC_REGISTRY);
    expect(graph.executionOrder.length).toBe(METRIC_REGISTRY.length);
  });

  it("les métriques base apparaissent avant les métriques derived", () => {
    const graph = buildDependencyGraph(METRIC_REGISTRY);
    const order = graph.executionOrder;

    const baseMetrics = METRIC_REGISTRY.filter((m) => m.metric_class === "base").map((m) => m.metric_id);
    const derivedMetrics = METRIC_REGISTRY.filter((m) => m.metric_class === "derived").map((m) => m.metric_id);

    const lastBaseIdx = Math.max(...baseMetrics.map((id) => order.indexOf(id)));
    const firstDerivedIdx = Math.min(...derivedMetrics.map((id) => order.indexOf(id)).filter((i) => i >= 0));

    expect(lastBaseIdx).toBeLessThan(firstDerivedIdx);
  });

  it("les dépendances sont satisfaites dans l'ordre d'exécution", () => {
    const graph = buildDependencyGraph(METRIC_REGISTRY);
    const order = graph.executionOrder;

    for (const metric of METRIC_REGISTRY) {
      const idx = order.indexOf(metric.metric_id);
      for (const dep of metric.dependencies) {
        const depIdx = order.indexOf(dep);
        if (depIdx >= 0) {
          expect(depIdx).toBeLessThan(idx);
        }
      }
    }
  });

  it("détecte un cycle simple", () => {
    const cyclicMetrics: MetricDefinition[] = [
      {
        metric_id: "metric_a",
        label: "A",
        metric_class: "derived",
        metric_type: "flow",
        metric_category: "activity",
        value_type: "currency",
        formula: "b",
        dependencies: ["metric_b"],
        events: [],
        calculation_scope: "realtime",
        unit: "EUR",
        instrument: "test",
      },
      {
        metric_id: "metric_b",
        label: "B",
        metric_class: "derived",
        metric_type: "flow",
        metric_category: "activity",
        value_type: "currency",
        formula: "a",
        dependencies: ["metric_a"],
        events: [],
        calculation_scope: "realtime",
        unit: "EUR",
        instrument: "test",
      },
    ];

    expect(() => buildDependencyGraph(cyclicMetrics)).toThrow(CycleDetectedError);
  });

  it("CycleDetectedError contient les métriques impliquées", () => {
    const cyclicMetrics: MetricDefinition[] = [
      {
        metric_id: "m1",
        label: "M1",
        metric_class: "derived",
        metric_type: "flow",
        metric_category: "activity",
        value_type: "currency",
        formula: "m2",
        dependencies: ["m2"],
        events: [],
        calculation_scope: "realtime",
        unit: "EUR",
        instrument: "test",
      },
      {
        metric_id: "m2",
        label: "M2",
        metric_class: "derived",
        metric_type: "flow",
        metric_category: "activity",
        value_type: "currency",
        formula: "m1",
        dependencies: ["m1"],
        events: [],
        calculation_scope: "realtime",
        unit: "EUR",
        instrument: "test",
      },
    ];

    try {
      buildDependencyGraph(cyclicMetrics);
      expect.fail("Should have thrown CycleDetectedError");
    } catch (e) {
      expect(e).toBeInstanceOf(CycleDetectedError);
      const err = e as CycleDetectedError;
      expect(err.involvedMetrics).toContain("m1");
      expect(err.involvedMetrics).toContain("m2");
    }
  });

  it("un graphe sans dépendances s'exécute sans erreur", () => {
    const independentMetrics: MetricDefinition[] = [
      {
        metric_id: "ind_a",
        label: "A",
        metric_class: "base",
        metric_type: "flow",
        metric_category: "activity",
        value_type: "currency",
        formula: "a",
        dependencies: [],
        events: ["invoice_issued"],
        calculation_scope: "realtime",
        unit: "EUR",
        instrument: "test",
      },
      {
        metric_id: "ind_b",
        label: "B",
        metric_class: "base",
        metric_type: "position",
        metric_category: "liquidity",
        value_type: "currency",
        formula: "b",
        dependencies: [],
        events: ["payment_received"],
        calculation_scope: "realtime",
        unit: "EUR",
        instrument: "test",
      },
    ];

    const graph = buildDependencyGraph(independentMetrics);
    expect(graph.executionOrder.length).toBe(2);
  });
});

describe("getAffectedMetrics", () => {
  it("retourne les métriques base et derived affectées par payment_received", () => {
    const affected = getAffectedMetrics("payment_received", METRIC_REGISTRY);
    expect(affected).toContain("treasury_balance");
    expect(affected).toContain("cash_flow_net");
  });

  it("propage aux métriques derived qui dépendent des bases affectées", () => {
    const affected = getAffectedMetrics("invoice_issued", METRIC_REGISTRY);
    expect(affected).toContain("commercial_margin");
    // commercial_margin_pct dépend de commercial_margin
    expect(affected).toContain("commercial_margin_pct");
  });

  it("retourne une liste vide pour un event_type inconnu", () => {
    const affected = getAffectedMetrics("unknown.event.type", METRIC_REGISTRY);
    expect(affected).toHaveLength(0);
  });

  it("ne contient pas de doublons", () => {
    const affected = getAffectedMetrics("invoice_issued", METRIC_REGISTRY);
    const unique = new Set(affected);
    expect(unique.size).toBe(affected.length);
  });
});
