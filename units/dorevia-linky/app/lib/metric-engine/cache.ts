/**
 * Metric Engine — Cache Layer
 * SPEC_LINKY_METRIC_ENGINE_v1.0 §4
 *
 * Cache en mémoire par (metric_id, scope).
 * TTL configurable par métrique.
 * Invalidation granulaire par event_type.
 */

import type { MetricValue, CacheEntry, ComputeParams } from "./types";
import { getAffectedMetrics } from "./graph";
import { METRIC_REGISTRY } from "./registry";

/** Clé de cache = metric_id + scope (tenant + company + période) */
function makeCacheKey(metric_id: string, params: ComputeParams): string {
  return `${metric_id}|${params.tenant}|${params.company_id ?? ""}|${params.date_debut}|${params.date_fin}`;
}

/** Store global (singleton module) */
const store = new Map<string, CacheEntry>();

/** Statistiques du cache */
let hits = 0;
let misses = 0;
let recomputeCount = 0;

/**
 * Lit une valeur du cache.
 * Retourne null si absent ou expiré.
 */
export function cacheGet(metric_id: string, params: ComputeParams): MetricValue | null {
  const key = makeCacheKey(metric_id, params);
  const entry = store.get(key);

  if (!entry) {
    misses++;
    return null;
  }

  if (Date.now() > entry.expires_at) {
    store.delete(key);
    misses++;
    return null;
  }

  hits++;
  return entry.value;
}

/**
 * Écrit une valeur dans le cache.
 * @param ttl_s TTL en secondes (défaut: 300)
 */
export function cacheSet(
  metric_id: string,
  params: ComputeParams,
  value: MetricValue,
  ttl_s?: number
): void {
  const key = makeCacheKey(metric_id, params);
  const metric = METRIC_REGISTRY.find((m) => m.metric_id === metric_id);
  // Priorité : paramètre explicite > valeur du registry > défaut 300s
  const effectiveTtl = (ttl_s ?? metric?.cache_ttl_s ?? 300) * 1000;

  store.set(key, {
    value,
    expires_at: Date.now() + effectiveTtl,
    invalidated_by: metric?.events ?? [],
  });
}

/**
 * Invalide toutes les entrées de cache affectées par un event_type.
 * Utilisé lors de la réception d'un nouveau événement Vault.
 * SPEC §4.3 — invalidation granulaire.
 */
export function invalidateByEvent(eventType: string): number {
  const affectedIds = getAffectedMetrics(eventType);
  let invalidated = 0;

  const keysToDelete: string[] = [];
  store.forEach((entry, key) => {
    const metricId = key.split("|")[0];
    if (affectedIds.includes(metricId) || entry.invalidated_by.includes(eventType)) {
      keysToDelete.push(key);
    }
  });
  for (const key of keysToDelete) {
    store.delete(key);
    invalidated++;
  }

  return invalidated;
}

/**
 * Invalide toutes les entrées d'un tenant.
 */
export function invalidateByTenant(tenant: string): void {
  const keysToDelete: string[] = [];
  store.forEach((_, key) => {
    if (key.includes(`|${tenant}|`)) keysToDelete.push(key);
  });
  for (const key of keysToDelete) store.delete(key);
}

/** Vide entièrement le cache. */
export function cacheClear(): void {
  store.clear();
  hits = 0;
  misses = 0;
}

/** Incrémente le compteur de recalculs. */
export function recordRecompute(): void {
  recomputeCount++;
}

/** Métriques d'observabilité du cache. SPEC §8. */
export function getCacheStats() {
  const total = hits + misses;
  return {
    cache_hit_rate: total > 0 ? hits / total : 0,
    cache_entries: store.size,
    recompute_count: recomputeCount,
    dag_nodes: METRIC_REGISTRY.length,
  };
}
