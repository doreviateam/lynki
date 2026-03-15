/** Types pour le cockpit Linky — CAHIER_DES_CHARGES v1.2 */

export type BadgeVariant = "success" | "warning" | "danger" | "info";

export interface CockpitHeaderData {
  tenantName: string;
  period: string;
  fluxStatus: "validé" | "partiel" | "à vérifier";
  source: string;
}

export interface CockpitInsightData {
  text: string;
  badge?: { label: string; variant: BadgeVariant };
}

export interface KpiCardData {
  title: string;
  value: string | number;
  delta?: { text: string; variant?: "success" | "danger" | "neutral" };
  subtitle?: string;
  badge?: { label: string; variant: BadgeVariant };
}

export interface ProofSource {
  name: string;
  status: string;
  variant: "success" | "warning";
}

export interface ProofWidgetData {
  percentage: number;
  sources: ProofSource[];
}

export interface ChartBarData {
  value: number;
  variant?: "success" | "warning";
  label?: string;
}

export interface ChartCardData {
  title: string;
  status?: string;
  data: ChartBarData[];
}

export interface TableRowData {
  partner: string;
  encours: number;
  retard: number;
  retardVariant: "warning" | "danger";
  preuve: string;
  preuveValidated?: boolean;
}

export interface TableCardData {
  title: string;
  status?: string;
  rows: TableRowData[];
}

export interface AlertItemData {
  text: string;
  badge: { label: string; variant: BadgeVariant };
}

export interface AlertCardData {
  title: string;
  status?: string;
  alerts: AlertItemData[];
}

export interface CockpitData {
  header: CockpitHeaderData;
  insight: CockpitInsightData;
  kpis: KpiCardData[];
  proof: ProofWidgetData;
  flux: ChartCardData;
  treasury: ChartCardData;
  exposure: TableCardData;
  alerts: AlertCardData;
}
