/**
 * Metric Engine — Point d'entrée public
 * SPEC_LINKY_METRIC_ENGINE_v1.0
 */

export type { MetricDefinition, MetricValue, ComputeParams, MetricDataFetcher, MetricStatus } from "./types";
export { METRIC_REGISTRY, METRIC_INDEX, getMetric, getMetricsByInstrument } from "./registry";
export { buildDependencyGraph, getAffectedMetrics, CycleDetectedError } from "./graph";
export { cacheGet, cacheSet, invalidateByEvent, invalidateByTenant, cacheClear, getCacheStats } from "./cache";
export { computeMetrics } from "./executor";
export { vaultFetcher } from "./fetcher";
