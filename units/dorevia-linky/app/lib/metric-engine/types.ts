/**
 * Metric Engine — Types
 * SPEC_LINKY_METRIC_ENGINE_v1.0 §1
 */

/** Classe d'une métrique */
export type MetricClass = "base" | "derived";

/** Type d'une métrique */
export type MetricType = "position" | "flow" | "exposure" | "performance";

/** Catégorie fonctionnelle */
export type MetricCategory = "liquidity" | "activity" | "risk" | "adjustments" | "performance";

/** Portée de calcul */
export type CalculationScope = "realtime" | "batch";

/** Type de valeur */
export type ValueType = "currency" | "ratio" | "count";

/** Statut d'une métrique calculée */
export type MetricStatus = "ok" | "stale" | "error" | "unavailable";

/** Définition d'une métrique dans le Registry */
export interface MetricDefinition {
  metric_id: string;
  label: string;
  metric_class: MetricClass;
  metric_type: MetricType;
  metric_category: MetricCategory;
  value_type: ValueType;
  formula: string;
  /** IDs des métriques dont dépend cette métrique (pour les derived) */
  dependencies: string[];
  /** Types d'événements Vault utilisés (pour les base) */
  events: string[];
  calculation_scope: CalculationScope;
  unit: string;
  instrument: string;
  /** TTL en secondes pour le cache (défaut: 300) */
  cache_ttl_s?: number;
}

/** Valeur calculée d'une métrique */
export interface MetricValue {
  metric_id: string;
  value: number | null;
  formatted: string;
  status: MetricStatus;
  data_freshness: string | null;
  computed_at: string;
  error?: string;
}

/** Entrée de cache */
export interface CacheEntry {
  value: MetricValue;
  expires_at: number;
  /** Types d'événements qui invalident cette entrée */
  invalidated_by: string[];
}

/** Paramètres de calcul (scope) */
export interface ComputeParams {
  tenant: string;
  company_id?: string | null;
  date_debut: string;
  date_fin: string;
}

/** Interface du fetcher de données (permet les mocks dans les tests) */
export interface MetricDataFetcher {
  fetchSales(params: ComputeParams): Promise<{ total_ht: number; total_tax: number; currency: string } | null>;
  fetchPurchases(params: ComputeParams): Promise<{ total_ht: number; total_tax: number; currency: string } | null>;
  fetchPaymentsIn(params: ComputeParams): Promise<{ total: number; currency: string } | null>;
  fetchPaymentsOut(params: ComputeParams): Promise<{ total: number; currency: string } | null>;
  fetchArByPartner(params: ComputeParams): Promise<{ totals: { open_amount: number; overdue_amount: number } } | null>;
  /** GET /ui/aggregations/ap-by-partner — dettes fournisseurs ouvertes (GO-2) */
  fetchApByPartner(params: ComputeParams): Promise<{ totals: { open_amount: number; overdue_amount: number } } | null>;
  fetchTreasury(params: ComputeParams): Promise<{ position?: { validated_balance: number } | null; reconciliation_metrics?: { remaining_ratio: number } | null } | null>;
  fetchAdjustments(params: ComputeParams, event_type: string): Promise<{ total_amount: number; currency: string } | null>;
  fetchPosSessions(params: ComputeParams): Promise<{ items: Array<{ total_sales: number; vault_status: string }> } | null>;
  /** GET /ui/aggregations/payroll — charges de personnel (GO-3) */
  fetchPayroll(params: ComputeParams): Promise<{ total_charges: number; payslip_count: number; currency: string } | null>;
}
