/**
 * Data Loader Cockpit Linky — CAHIER_DES_CHARGES v1.2
 * Charge les données des APIs et les mappe vers CockpitData.
 * Fallback sur données mock en cas d'erreur.
 */

import type {
  CockpitData,
  ProofSource,
  ChartBarData,
  TableRowData,
  AlertItemData,
} from "@/app/types/cockpit";
import { getDefaultPeriod } from "@/app/lib/period-utils";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatPeriod(period: { from: string; to: string }): string {
  const m = period.from.match(/^(\d{4})-(\d{2})/);
  if (m) {
    const month = parseInt(m[2] ?? "1", 10);
    return `${MONTHS[month - 1] ?? "?"} ${m[1]}`;
  }
  return "—";
}

function getMockCockpitData(
  tenantName: string,
  period: { from: string; to: string }
): CockpitData {
  const periodLabel = formatPeriod(period);
  return {
    header: {
      tenantName,
      period: periodLabel,
      fluxStatus: "validé",
      source: "Vault",
    },
    insight: {
      text: "Risque de trésorerie modéré — 41% du retard concentré sur deux partenaires majeurs.",
      badge: { label: "Surveillance", variant: "warning" },
    },
    kpis: [
      { title: "Trésorerie", value: "62 480 €", delta: { text: "+8 % vs mois précédent", variant: "success" } },
      { title: "Marge", value: "58.4 %", delta: { text: "−2 pts vs N−1", variant: "neutral" } },
      { title: "Encours clients", value: "23 292 €", delta: { text: "−12 %", variant: "success" } },
      { title: "Retard paiement", value: "41 %", delta: { text: "+5 pts", variant: "danger" } },
    ],
    proof: {
      percentage: 78,
      sources: [
        { name: "Vault", status: "Validé", variant: "success" },
        { name: "Odoo", status: "Sync", variant: "success" },
        { name: "POS", status: "Partiel", variant: "warning" },
        { name: "Banque", status: "Confirmé", variant: "success" },
      ] as ProofSource[],
    },
    flux: {
      title: "Flux économiques",
      status: "Flux positifs sur 3 périodes",
      data: [
        { value: 60 },
        { value: 120 },
        { value: 150 },
        { value: 70, variant: "warning" },
        { value: 100, variant: "warning" },
        { value: 110, variant: "warning" },
      ] as ChartBarData[],
    },
    treasury: {
      title: "Position trésorerie",
      status: "Tendance haussière",
      data: [
        { value: 100 },
        { value: 110 },
        { value: 120 },
        { value: 130 },
      ] as ChartBarData[],
    },
    exposure: {
      title: "Exposition clients",
      status: "2 clients à surveiller",
      rows: [
        {
          partner: "EMD",
          encours: 10703,
          retard: 37,
          retardVariant: "warning",
          preuve: "Vault ✓",
          preuveValidated: true,
        },
        {
          partner: "Export My Island",
          encours: 12589,
          retard: 43,
          retardVariant: "danger",
          preuve: "Odoo + POS",
        },
      ] as TableRowData[],
    },
    alerts: {
      title: "Alertes financières",
      status: "3 alertes actives",
      alerts: [
        { text: "Client EMD dépasse seuil risque", badge: { label: "Alerte", variant: "danger" } },
        { text: "Flux non couverts POS", badge: { label: "À vérifier", variant: "warning" } },
        { text: "Synchronisation Odoo retardée", badge: { label: "Monitoring", variant: "warning" } },
      ] as AlertItemData[],
    },
  };
}

export interface LoadCockpitDataParams {
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
}

/**
 * Charge les données du cockpit depuis les APIs.
 * En cas d'erreur ou d'API indisponible, retourne des données mock.
 */
export async function loadCockpitData(
  params: LoadCockpitDataParams
): Promise<CockpitData> {
  const { tenantId, companyId, period } = params;
  const tenantName = tenantId || "Tenant";
  const periodLabel = formatPeriod(period);

  const qs = new URLSearchParams({
    tenant: tenantId,
    date_debut: period.from,
    date_fin: period.to,
    ...(companyId && { company_id: companyId }),
  });

  try {
    const [metricsRes, arRes, vaultRes, salesRes, purchasesRes] = await Promise.allSettled([
      fetch(`/api/dashboard-metrics?${qs}`, { cache: "no-store" }),
      fetch(`/api/ar-by-partner?${qs}`, { cache: "no-store" }),
      fetch(`/api/vault-health?tenant=${tenantId}`, { cache: "no-store" }),
      fetch(`/api/sales?${qs}&granularity=month`, { cache: "no-store" }),
      fetch(`/api/purchases?${qs}&granularity=month`, { cache: "no-store" }),
    ]);

    const metrics = metricsRes.status === "fulfilled" && metricsRes.value.ok
      ? await metricsRes.value.json()
      : null;
    const ar = arRes.status === "fulfilled" && arRes.value.ok
      ? await arRes.value.json()
      : null;
    const vault = vaultRes.status === "fulfilled" && vaultRes.value.ok
      ? await vaultRes.value.json()
      : null;
    const sales = salesRes.status === "fulfilled" && salesRes.value.ok
      ? await salesRes.value.json()
      : null;
    const purchases = purchasesRes.status === "fulfilled" && purchasesRes.value.ok
      ? await purchasesRes.value.json()
      : null;

    const proofPct = vault?.vault_rate != null ? Math.round(vault.vault_rate * 100) : 78;
    const fluxStatus = proofPct >= 80 ? "validé" : proofPct >= 50 ? "partiel" : "à vérifier";

    const kpis = metrics?._details
      ? [
          {
            title: "Trésorerie",
            value: metrics.treasury_position?.formatted ?? metrics.treasury?.formatted ?? "—",
            delta: metrics.treasury_position?.value != null ? { text: "Données Vault", variant: "neutral" as const } : undefined,
          },
          {
            title: "Marge",
            value: metrics.business?.formatted ?? "—",
            delta: undefined,
          },
          {
            title: "Encours clients",
            value: ar?.totals?.open_amount != null
              ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(ar.totals.open_amount)
              : "—",
            delta: undefined,
          },
          {
            title: "Retard paiement",
            value: ar?.totals?.overdue_amount != null && ar?.totals?.open_amount != null && ar.totals.open_amount > 0
              ? `${Math.round((ar.totals.overdue_amount / ar.totals.open_amount) * 100)} %`
              : "—",
            delta: undefined,
          },
        ]
      : getMockCockpitData(tenantName, period).kpis;

    const exposureRows: TableRowData[] = ar?.partners?.length
      ? ar.partners.slice(0, 10).map((p: { partner_name?: string; open_amount: number; overdue_amount: number }) => {
          const retard = p.open_amount > 0 ? Math.round((p.overdue_amount / p.open_amount) * 100) : 0;
          return {
            partner: p.partner_name ?? "—",
            encours: p.open_amount,
            retard,
            retardVariant: retard >= 40 ? "danger" : "warning",
            preuve: "Vault",
            preuveValidated: true,
          };
        })
      : getMockCockpitData(tenantName, period).exposure.rows;

    const salesSeries = sales?.series ?? [];
    const purchasesSeries = purchases?.series ?? [];
    const n = Math.min(6, Math.max(salesSeries.length, purchasesSeries.length, 1));
    const fluxData: ChartBarData[] = [];
    for (let i = 0; i < n; i++) {
      fluxData.push({ value: salesSeries[i]?.amount ?? 0, variant: "success" });
      fluxData.push({ value: purchasesSeries[i]?.amount ?? 0, variant: "warning" });
    }
    if (fluxData.length === 0) {
      fluxData.push(...getMockCockpitData(tenantName, period).flux.data);
    }

    return {
      header: {
        tenantName,
        period: periodLabel,
        fluxStatus,
        source: "Vault",
      },
      insight: getMockCockpitData(tenantName, period).insight,
      kpis,
      proof: {
        percentage: proofPct,
        sources: [
          { name: "Vault", status: proofPct >= 90 ? "Validé" : "Partiel", variant: proofPct >= 90 ? "success" : "warning" },
          { name: "Odoo", status: "Sync", variant: "success" },
          { name: "POS", status: "Partiel", variant: "warning" },
          { name: "Banque", status: "Confirmé", variant: "success" },
        ],
      },
      flux: {
        title: "Flux économiques",
        status: fluxData.length > 0 ? "Données Vault" : "Flux positifs sur 3 périodes",
        data: fluxData.length > 0 ? fluxData : getMockCockpitData(tenantName, period).flux.data,
      },
      treasury: getMockCockpitData(tenantName, period).treasury,
      exposure: {
        title: "Exposition clients",
        status: `${exposureRows.length} client(s)`,
        rows: exposureRows,
      },
      alerts: getMockCockpitData(tenantName, period).alerts,
    };
  } catch {
    return getMockCockpitData(tenantName, period);
  }
}
