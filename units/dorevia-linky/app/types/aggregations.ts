/** Types pour les réponses API Linky (proxy Vault, Odoo) */

export interface VaultHealthResponse {
  vault_rate: number | null;
  pending_events: number;
  failed_events: number;
  last_sync_at: string | null;
}

export interface BankReconciliationHealthResponse {
  reconciliation_rate: number | null;
  last_statement_date: string | null;
  unreconciled_entries: number;
  unreconciled_amount: number;
  bank_accounts_count: number;
}

export interface CertifiedRatio {
  posted_sales_count: number | null;
}

export interface CertifiedRatioPurchases {
  posted_purchases_count: number | null;
}

export interface BaseAggregation {
  from?: string;
  to?: string;
  effective_from?: string;
  effective_to?: string;
  currency?: string;
  verifiable?: boolean;
  last_seal_at?: string | null;
  [key: string]: unknown;
}

/** Point de série temporelle (Vault : period = YYYY-MM ou YYYY-MM-DD, amount = TTC) */
export interface SeriesPoint {
  period: string;
  amount: number;
}

export interface SalesAggregation extends BaseAggregation {
  total?: number;
  total_ht?: number;
  total_tax?: number;
  invoices_count?: number;
  global_invoices_count?: number;
  /** Dénominateur ratio Certifié (single-source Vault) */
  posted_sales_count?: number | null;
  series?: SeriesPoint[];
}

export interface PurchasesAggregation extends BaseAggregation {
  total?: number;
  total_ht?: number;
  total_tax?: number;
  invoices_count?: number;
  global_invoices_count?: number;
  /** Dénominateur ratio Certifié achats (single-source Vault) */
  posted_purchases_count?: number | null;
  series?: SeriesPoint[];
}

export interface PaymentsAggregation extends BaseAggregation {
  total?: number;
  payment_count?: number;
  series?: SeriesPoint[];
  /** Ventilation espèces vs banque (cash, transfer, card, etc.) */
  by_method?: Record<string, number>;
}

export interface AdjustmentsAggregation extends BaseAggregation {
  total_amount?: number;
  total?: number;
  series?: SeriesPoint[];
}

/** Réponse agrégation ventes par partenaire (Pareto 80/20) */
export interface SalesByPartnerResponse {
  total_ht?: number;
  partners_count?: number;
  items?: SalesByPartnerItem[];
  pareto_80_cutoff?: number;
  pareto_80_partners?: string[];
}

/** Ligne partenaire avec CA, % et cumul */
export interface SalesByPartnerItem {
  partner_name: string;
  total_ht: number;
  invoices_count: number;
  pct_of_total: number;
  cumulative_pct: number;
}

/** Réponse agrégation AR by Partner (Encours & Retard) — SPEC v1.0 */
export interface ArByPartnerResponse {
  totals: ArByPartnerTotals;
  partners: ArByPartnerItem[];
  meta: ArByPartnerMeta;
}

export interface ArByPartnerTotals {
  open_amount: number;
  overdue_amount: number;
  open_count_invoices: number;
  overdue_count_invoices: number;
  missing_due_date_count: number;
  /** Retard moyen pondéré par montant (jours au-delà de l'échéance) */
  overdue_avg_days?: number;
  /** Plus ancien retard en jours */
  overdue_max_days?: number;
}

export interface ArByPartnerItem {
  partner_id: string;
  partner_name?: string;
  open_amount: number;
  overdue_amount: number;
  open_count_invoices: number;
  overdue_count_invoices: number;
  share_percent: number;
  /** Jours de retard moyen pondéré (pour ce partenaire) */
  overdue_avg_days?: number;
  /** Pire retard en jours (pour ce partenaire) */
  overdue_max_days?: number;
  /** Délai moyen de paiement (historique) — n.d. si absent */
  payment_delay_avg_days?: number | null;
  /** Score priorité relance 0–9 (SPEC Priorisation v1.0) */
  priority_score?: number;
  /** Faible | Moyenne | Élevée | Critique */
  priority_label?: string;
}

export interface ArByPartnerMeta {
  freshness: "event_driven" | "snapshot" | "unknown";
  warnings?: string[];
  data_quality?: string;
}
