import type { DashboardMetricsResponse, KpiMetric } from "@/app/api/dashboard-metrics/route";

export type AlertSeverity = "urgent" | "vigilance" | "suivi";

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  metrics?: { label: string; value: string }[];
  source?: string;
}

const CARD_LABELS: Partial<Record<string, string>> = {
  treasury: "Trésorerie",
  business: "Business",
  cash: "Flux Net",
  working_capital: "BFR",
  encours: "Encours",
  taxes: "Taxes",
  ebitda: "EBE",
  credit_notes: "Notes de crédit",
  refunds: "Remboursements",
};

/**
 * Dérive des alertes business structurées à partir des métriques dashboard réelles.
 * Source unique : DashboardMetricsResponse.
 * Règle D2 : jamais de données fictives — si aucun signal, retourner [].
 */
export function adaptMetricsToAlerts(
  metrics: DashboardMetricsResponse | null | undefined
): AlertItem[] {
  if (!metrics) return [];
  const alerts: AlertItem[] = [];

  // 1. Données partiellement synchronisées (qualité donnée)
  if (metrics.sealed_count_complete === false) {
    const sources = metrics.sealed_count_sources;
    const failed: string[] = [];
    if (sources) {
      if (!sources.sales) failed.push("ventes");
      if (!sources.purchases) failed.push("achats");
      if (!sources.paymentsIn) failed.push("encaissements");
      if (!sources.paymentsOut) failed.push("décaissements");
      if (!sources.pos) failed.push("POS");
    }
    alerts.push({
      id: "data-incomplete",
      severity: "vigilance",
      title: "Données partiellement synchronisées",
      description:
        failed.length > 0
          ? `Sources en attente de synchronisation : ${failed.join(", ")}. Certaines métriques peuvent être incomplètes.`
          : "La synchronisation des données n'est pas encore complète pour cette période.",
      source: "Vault",
    });
  }

  // 2. Signaux par carte KPI (status watch / alert)
  const cardEntries: [string, KpiMetric | undefined][] = [
    ["treasury", metrics.treasury],
    ["business", metrics.business],
    ["cash", metrics.cash],
    ["working_capital", metrics.working_capital],
    ["encours", metrics.encours],
    ["ebitda", metrics.ebitda],
    ["taxes", metrics.taxes],
    ["credit_notes", metrics.credit_notes],
    ["refunds", metrics.refunds],
  ];

  for (const [key, card] of cardEntries) {
    if (!card || !card.status || card.status === "neutral" || card.status === "ok") continue;
    const label = CARD_LABELS[key] ?? key;
    const severity: AlertSeverity =
      card.status === "alert" || card.status === "critical" ? "urgent" : "vigilance";
    alerts.push({
      id: `card-${key}`,
      severity,
      title: `${label} — ${severity === "urgent" ? "Anomalie détectée" : "Point de vigilance"}`,
      description:
        card.status_reason ??
        `La métrique ${label} signale un écart à surveiller sur la période.`,
      metrics:
        card.value != null
          ? [{ label, value: card.formatted }]
          : undefined,
      source: "Vault · ERP",
    });
  }

  // 3. Rapprochement bancaire insuffisant
  const tDetails = metrics._details?.treasury;
  if (tDetails) {
    const unreconciledPct =
      tDetails.treasury_validated_pct != null
        ? 100 - tDetails.treasury_validated_pct
        : null;
    if (unreconciledPct !== null && unreconciledPct > 20) {
      const cardAlreadyPresent = alerts.some((a) => a.id === "card-treasury");
      if (!cardAlreadyPresent) {
        alerts.push({
          id: "treasury-reconciliation",
          severity: unreconciledPct > 40 ? "urgent" : "vigilance",
          title: "Rapprochement bancaire incomplet",
          description: `${Math.round(unreconciledPct)} % des mouvements bancaires restent à rapprocher sur la période.`,
          metrics:
            tDetails.unreconciled_lines_count != null
              ? [{ label: "Lignes à rapprocher", value: String(tDetails.unreconciled_lines_count) }]
              : undefined,
          source: "Vault",
        });
      }
    }
  }

  // 4. Santé de la connexion bancaire
  const bankHealth = metrics.data_completeness?.bank_health_metrics;
  if (bankHealth === "absent") {
    alerts.push({
      id: "bank-health-absent",
      severity: "suivi",
      title: "Connexion bancaire non configurée",
      description:
        "Aucun compte bancaire n'est connecté au module de rapprochement Vault. Les données de trésorerie sont en mode proxy.",
      source: "Vault",
    });
  } else if (bankHealth === "partial") {
    alerts.push({
      id: "bank-health-partial",
      severity: "suivi",
      title: "Connexion bancaire partielle",
      description:
        "Certains comptes bancaires ne sont pas encore connectés au module de rapprochement.",
      source: "Vault",
    });
  }

  return alerts;
}
