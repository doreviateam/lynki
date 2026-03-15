/**
 * Metric Engine — Dependency Graph
 * SPEC_LINKY_METRIC_ENGINE_v1.0 §2–§3
 *
 * Construit le DAG des métriques depuis le Registry.
 * Implémente le tri topologique et la détection de cycles.
 */

import type { MetricDefinition } from "./types";
import { METRIC_REGISTRY } from "./registry";

export interface DependencyGraph {
  /** Ordre d'exécution (base avant derived) */
  executionOrder: string[];
  /** Adjacence inverse : metric_id → [dependants] */
  dependants: Map<string, string[]>;
  /** Adjacence directe : metric_id → [dependencies] */
  dependencies: Map<string, string[]>;
}

/**
 * Construit le graphe de dépendances depuis le Registry.
 * Lève une erreur si un cycle est détecté (SPEC §3.2).
 */
export function buildDependencyGraph(metrics: MetricDefinition[] = METRIC_REGISTRY): DependencyGraph {
  const dependencies = new Map<string, string[]>();
  const dependants = new Map<string, string[]>();

  // Initialisation
  for (const m of metrics) {
    dependencies.set(m.metric_id, [...m.dependencies]);
    if (!dependants.has(m.metric_id)) {
      dependants.set(m.metric_id, []);
    }
  }

  // Construction de l'adjacence inverse
  for (const m of metrics) {
    for (const dep of m.dependencies) {
      const existing = dependants.get(dep) ?? [];
      existing.push(m.metric_id);
      dependants.set(dep, existing);
    }
  }

  // Détection de cycles + tri topologique (Kahn's algorithm)
  const executionOrder = topologicalSort(metrics, dependencies);

  return { executionOrder, dependants, dependencies };
}

/**
 * Tri topologique (algorithme de Kahn).
 * Lève CycleDetectedError si un cycle est trouvé.
 */
function topologicalSort(
  metrics: MetricDefinition[],
  dependencies: Map<string, string[]>
): string[] {
  const inDegree = new Map<string, number>();
  const allIds = new Set(metrics.map((m) => m.metric_id));

  for (const m of metrics) {
    inDegree.set(m.metric_id, m.dependencies.filter((d) => allIds.has(d)).length);
  }

  // File d'attente : métriques sans dépendances (base)
  const queue: string[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  // Tri par classe pour stabilité (base avant derived)
  queue.sort((a, b) => {
    const ma = metrics.find((m) => m.metric_id === a);
    const mb = metrics.find((m) => m.metric_id === b);
    if (ma?.metric_class === "base" && mb?.metric_class !== "base") return -1;
    if (ma?.metric_class !== "base" && mb?.metric_class === "base") return 1;
    return a.localeCompare(b);
  });

  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    const metric = metrics.find((m) => m.metric_id === current);
    if (!metric) continue;

    // Réduire le in-degree des dépendants
    dependencies.forEach((deps, id) => {
      if (deps.includes(current)) {
        const newDegree = (inDegree.get(id) ?? 0) - 1;
        inDegree.set(id, newDegree);
        if (newDegree === 0) {
          queue.push(id);
        }
      }
    });
  }

  // Cycle détecté : des métriques restent avec in-degree > 0
  if (result.length !== metrics.length) {
    const remaining = metrics
      .map((m) => m.metric_id)
      .filter((id) => !result.includes(id));
    throw new CycleDetectedError(remaining);
  }

  return result;
}

/**
 * Erreur levée si un cycle est détecté dans le DAG.
 */
export class CycleDetectedError extends Error {
  readonly involvedMetrics: string[];

  constructor(involvedMetrics: string[]) {
    super(
      `Cycle detected in metric dependency graph. Involved metrics: ${involvedMetrics.join(", ")}`
    );
    this.name = "CycleDetectedError";
    this.involvedMetrics = involvedMetrics;
  }
}

/**
 * Retourne les métriques qui doivent être recalculées quand un event_type est reçu.
 * Utilisé pour l'invalidation granulaire du cache (SPEC §4.3).
 */
export function getAffectedMetrics(
  eventType: string,
  metrics: MetricDefinition[] = METRIC_REGISTRY
): string[] {
  const graph = buildDependencyGraph(metrics);
  const affected = new Set<string>();

  // Métriques base qui consomment cet event_type
  const directConsumers = metrics
    .filter((m) => m.events.includes(eventType))
    .map((m) => m.metric_id);

  // Propagation en profondeur via les dépendants
  const stack = [...directConsumers];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (affected.has(id)) continue;
    affected.add(id);
    const deps = graph.dependants.get(id) ?? [];
    stack.push(...deps);
  }

  return Array.from(affected);
}
