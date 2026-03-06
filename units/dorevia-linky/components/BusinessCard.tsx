"use client";

import { useState, useMemo } from "react";
import type {
  SalesAggregation,
  PurchasesAggregation,
  SalesByPartnerResponse,
  ArByPartnerResponse,
} from "@/app/types/aggregations";
import { formatSignedAmount, formatAmount } from "@/app/lib/format";
import { computeARRisk, type RiskLevel } from "@/app/lib/business-arrisk";
import { BusinessChart } from "@/components/BusinessChart";
import { CardChartSection, type WhyContent } from "@/components/CardChartSection";
import { IconBusiness } from "@/components/CardIcons";
import type { ChartGranularity } from "@/app/lib/chart-granularity";
import type { ChartType } from "@/app/lib/chart-type";

const MISSING_DUE_DATE_WARNING_THRESHOLD = 5;
const MULTI_CURRENCY_WARNING = "multi_currency_ignored_p0";

function RiskBadge({ level }: { level: RiskLevel }) {
  if (level === "none") return null;
  const config =
    level === "secured"
      ? { label: "Marge sécurisée", className: "bg-[var(--positive)]/15 text-[var(--positive)]" }
      : level === "concentrated"
        ? { label: "Risque concentré", className: "rounded-full bg-orange-500/10 text-orange-400" }
        : { label: "Marge partiellement exposée", className: "rounded-full bg-orange-500/10 text-orange-400/90" };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${config.className}`}
      role="status"
    >
      {config.label}
    </span>
  );
}

function ArByPartnerSection({ arByPartner, currency }: { arByPartner: ArByPartnerResponse; currency: string }) {
  const [expandedEncours, setExpandedEncours] = useState(false);
  const [expandedRisque, setExpandedRisque] = useState(false);
  const { totals, partners, meta } = arByPartner;
  const openAmount = totals?.open_amount ?? 0;
  const overdueAmount = totals?.overdue_amount ?? 0;
  const missingDue = totals?.missing_due_date_count ?? 0;
  const freshness = meta?.freshness ?? "unknown";
  const hasMultiCurrency = meta?.warnings?.includes(MULTI_CURRENCY_WARNING) ?? false;

  const encoursPartners = partners ?? [];
  const risquePartners = encoursPartners
    .filter((p) => (p.overdue_amount ?? 0) > 0)
    .map((p) => ({
      ...p,
      overdue_share: overdueAmount > 0 ? ((p.overdue_amount ?? 0) / overdueAmount) * 100 : 0,
    }));

  const { overdueConcentration, riskLevel } = useMemo(
    () => computeARRisk(arByPartner),
    [totals?.overdue_amount, encoursPartners.map((p) => p.overdue_amount).join("|")]
  );

  const concentrationPct = overdueAmount > 0 ? overdueConcentration * 100 : 0;
  const maxOverdue = encoursPartners.length > 0 ? Math.max(...encoursPartners.map((p) => p.overdue_amount ?? 0)) : 0;
  const topDebtorsCount =
    overdueAmount > 0 && maxOverdue > 0
      ? encoursPartners.filter((p) => Math.abs((p.overdue_amount ?? 0) - maxOverdue) < 1e-6).length
      : 0;

  // freshness unknown → message dans l'espace du bloc AR
  if (freshness === "unknown") {
    return (
      <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-2">
        <p className="text-sm text-[var(--text-secondary)]" role="status">
          Données AR non exploitables pour cette période
        </p>
        {hasMultiCurrency && (
          <p className="text-xs text-amber-600 dark:text-amber-400" role="status">
            Factures non-EUR exclues (P0)
          </p>
        )}
      </div>
    );
  }

  // open_amount == 0 → masquer contenu principal, garder multi_currency si présent
  if (openAmount <= 0) {
    return (
      <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-2">
        {hasMultiCurrency && (
          <p className="text-xs text-amber-600 dark:text-amber-400" role="status">
            Factures non-EUR exclues (P0)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-3">
      {/* Warnings */}
      {freshness !== "event_driven" && (
        <p className="text-xs text-amber-600 dark:text-amber-400" role="status">
          Donnée snapshot (dernière mise à jour au posting)
        </p>
      )}
      {hasMultiCurrency && (
        <p className="text-xs text-amber-600 dark:text-amber-400" role="status">
          Factures non-EUR exclues (P0)
        </p>
      )}
      {missingDue >= MISSING_DUE_DATE_WARNING_THRESHOLD && (
        <p className="text-xs text-amber-600 dark:text-amber-400" role="status">
          {missingDue} facture{missingDue > 1 ? "s" : ""} sans échéance
        </p>
      )}

      {/* Bloc synthétique (3 lignes) */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--text-secondary)]">Encours client</span>
          <span className="tabular-nums text-[var(--text)]">{formatAmount(openAmount, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-secondary)]">Dont en retard</span>
          <span className="tabular-nums text-amber-600 dark:text-amber-400">{formatAmount(overdueAmount, currency)}</span>
        </div>
        {overdueAmount > 0 && concentrationPct > 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">
              {topDebtorsCount <= 1 ? "1 client concentre" : `${topDebtorsCount} clients concentrent`}
            </span>
            <span className="tabular-nums text-[var(--text)]">{concentrationPct.toFixed(1)} % du retard</span>
          </div>
        )}
      </div>

      {/* Badge — juste après bloc synthétique */}
      <RiskBadge level={riskLevel} />

      {/* Tableaux dépliables */}
      <div>
        <button
          type="button"
          onClick={() => setExpandedEncours(!expandedEncours)}
          className="flex w-full items-center justify-between text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
        >
          <span>Encours (client)</span>
          <span className="tabular-nums text-[var(--accent)]">
            {formatAmount(openAmount, currency)}
            {encoursPartners.length > 0 && ` · ${encoursPartners.length} partenaire${encoursPartners.length > 1 ? "s" : ""}`}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 transition-transform ${expandedEncours ? "rotate-180" : ""}`}
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        {expandedEncours && encoursPartners.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[320px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                  <th className="py-2 pr-2 font-medium">Partenaire</th>
                  <th className="py-2 pr-2 font-medium text-right">Encours</th>
                  <th className="py-2 pr-2 font-medium text-right">Retard</th>
                  <th className="py-2 pr-2 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {encoursPartners.map((row) => (
                  <tr key={row.partner_id} className="border-b border-[var(--border)]/50">
                    <td className="py-1.5 pr-2">{row.partner_name || row.partner_id || "(sans nom)"}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{formatAmount(row.open_amount ?? 0, currency)}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums text-amber-600 dark:text-amber-400">{(row.overdue_amount ?? 0) > 0 ? formatAmount(row.overdue_amount ?? 0, currency) : "—"}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{(row.share_percent ?? 0).toFixed(1)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => setExpandedRisque(!expandedRisque)}
          className="flex w-full items-center justify-between text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
        >
          <span>Clients à risque (retard)</span>
          <span className="tabular-nums text-amber-600 dark:text-amber-400">
            {formatAmount(overdueAmount, currency)}
            {risquePartners.length > 0 && ` · ${risquePartners.length} partenaire${risquePartners.length > 1 ? "s" : ""}`}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 transition-transform ${expandedRisque ? "rotate-180" : ""}`}
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        {expandedRisque && risquePartners.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[320px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                  <th className="py-2 pr-2 font-medium">Partenaire</th>
                  <th className="py-2 pr-2 font-medium text-right">En retard</th>
                  <th className="py-2 pr-2 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {risquePartners.map((row) => (
                  <tr key={row.partner_id} className="border-b border-[var(--border)]/50">
                    <td className="py-1.5 pr-2">{row.partner_name || row.partner_id || "(sans nom)"}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums text-amber-600 dark:text-amber-400">{formatAmount(row.overdue_amount ?? 0, currency)}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{(row.overdue_share ?? 0).toFixed(1)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ParetoTableSection({
  salesByPartner,
  currency,
}: {
  salesByPartner: SalesByPartnerResponse;
  currency: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const items = salesByPartner.items ?? [];
  const paretoSet = new Set(salesByPartner.pareto_80_partners ?? []);
  const cutoff = salesByPartner.pareto_80_cutoff ?? 0;

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
      >
        <span>Clients Pareto (80/20)</span>
        <span className="tabular-nums text-[var(--accent)]">
          {items.length} partenaire{items.length > 1 ? "s" : ""}
          {cutoff > 0 && ` · Top ${cutoff} ≈ 80 % CA`}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {expanded && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                <th className="py-2 pr-2 font-medium">Partenaire</th>
                <th className="py-2 pr-2 font-medium text-right">CA HT</th>
                <th className="py-2 pr-2 font-medium text-right">% total</th>
                <th className="py-2 pr-2 font-medium text-right">Cumul %</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const isPareto80 = paretoSet.has(row.partner_name);
                return (
                  <tr
                    key={row.partner_name}
                    className={`border-b border-[var(--border)]/50 ${isPareto80 ? "bg-[var(--accent-soft)]/20" : ""}`}
                  >
                    <td className="py-1.5 pr-2">
                      <span className={isPareto80 ? "font-semibold text-[var(--accent)]" : ""}>
                        {row.partner_name || "(sans nom)"}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{formatAmount(row.total_ht, currency)}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{row.pct_of_total.toFixed(1)} %</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{row.cumulative_pct.toFixed(1)} %</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface BusinessCardProps {
  salesData: SalesAggregation | null;
  purchasesData: PurchasesAggregation | null;
  salesByPartner?: SalesByPartnerResponse | null;
  arByPartner?: ArByPartnerResponse | null;
  loading?: boolean;
  errorSales?: string;
  errorPurchases?: string;
  postedSalesCount?: number | null;
  postedPurchasesCount?: number | null;
  /** Granularité du graphique (jour / semaine / mois) */
  chartGranularity?: ChartGranularity;
  /** Granularités disponibles selon la période */
  availableGranularities?: ChartGranularity[];
  onChartGranularityChange?: (g: ChartGranularity) => void;
  /** Type de représentation : barres (défaut), courbe, camembert */
  chartType?: ChartType;
  onChartTypeChange?: (t: ChartType) => void;
  whyContent?: WhyContent;
  onFocusRequest?: () => void;
  footer?: React.ReactNode;
}

const CARD_BASE =
  "rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] border-l-4";

export function BusinessCard({
  salesData,
  purchasesData,
  salesByPartner,
  arByPartner,
  loading,
  errorSales,
  errorPurchases,
  postedSalesCount,
  postedPurchasesCount,
  chartGranularity = "month",
  availableGranularities = ["month"],
  onChartGranularityChange,
  chartType = "bar",
  onChartTypeChange,
  whyContent,
  onFocusRequest,
  footer,
}: BusinessCardProps) {
  const error = errorSales || errorPurchases;
  const arTotals = arByPartner?.totals;
  const arMeta = arByPartner?.meta;
  const hasMultiCurrency = arMeta?.warnings?.includes(MULTI_CURRENCY_WARNING) ?? false;
  const showArSection =
    arByPartner &&
    ((arTotals?.open_amount ?? 0) > 0 ||
      arMeta?.freshness === "unknown" ||
      hasMultiCurrency);

  if (loading) {
    return (
      <section className={`${CARD_BASE} border-l-[var(--muted)]`}>
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            {onFocusRequest ? (
              <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label="Ouvrir la card Business">
                <IconBusiness className="h-6 w-6 shrink-0 text-[var(--accent)]" />
              </button>
            ) : (
              <IconBusiness className="h-6 w-6 shrink-0 text-[var(--accent)]" />
            )}
            <span className="text-lg font-bold uppercase tracking-wide text-[var(--accent)]">Business</span>
          </div>
          <div className="skeleton h-5 w-28" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-4 w-20" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`${CARD_BASE} border-l-[var(--negative)] border-[var(--border-error)] bg-[var(--negative-soft)]`}>
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-4">
          {onFocusRequest ? (
            <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label="Ouvrir la card Business">
              <IconBusiness className="h-6 w-6 shrink-0 text-[var(--accent)]" />
            </button>
          ) : (
            <IconBusiness className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          )}
          <span className="text-lg font-bold uppercase tracking-wide text-[var(--accent)]">Business</span>
        </div>
        <p className="text-[var(--negative)]">{error}</p>
      </section>
    );
  }

  const salesTotal = salesData?.total_ht ?? salesData?.total ?? 0;
  const purchasesTotalRaw = purchasesData?.total_ht ?? purchasesData?.total ?? 0;
  // Achats = charges : on soustrait la valeur absolue pour obtenir la marge (Ventes HT - Achats HT)
  const purchasesTotal = Math.abs(purchasesTotalRaw);
  const net = salesTotal - purchasesTotal;
  const currency = salesData?.currency ?? purchasesData?.currency ?? "EUR";

  const tauxRaw = salesTotal > 0 ? net / salesTotal : null;
  const tauxDisplay =
    tauxRaw != null
      ? Math.abs(tauxRaw) < 0.05
        ? "0.0"
        : (tauxRaw * 100).toFixed(1)
      : null;

  const globalVaulted = salesData?.global_invoices_count ?? salesData?.invoices_count;
  const certifiedLabel =
    postedSalesCount != null &&
    typeof globalVaulted === "number" &&
    postedSalesCount > 0
      ? `Certifié : ${Math.min(100, Math.round((globalVaulted / postedSalesCount) * 100))} %`
      : salesData?.verifiable || purchasesData?.verifiable
        ? "Données certifiées"
        : null;

  return (
    <section
      className={`${CARD_BASE} ${net >= 0 ? "border-l-[var(--positive)]" : "border-l-[var(--negative)]"}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {onFocusRequest ? (
            <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label="Ouvrir la card Business">
              <IconBusiness className="h-6 w-6 shrink-0 text-[var(--accent)]" />
            </button>
          ) : (
            <IconBusiness className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          )}
          <span className="text-lg font-bold uppercase tracking-wide text-[var(--accent)]">Business</span>
          {certifiedLabel && (
            <span
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
              title={certifiedLabel}
            >
              <span className="sr-only">{certifiedLabel}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
        <span className={`text-lg font-bold tabular-nums shrink-0 ${net >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
          {formatSignedAmount(net)}
        </span>
      </div>
      <div className="space-y-2 text-sm font-semibold text-[var(--text-secondary)]">
        {tauxDisplay != null && (
          <div className="flex justify-between">
            <span>Taux de marge</span>
            <span className="tabular-nums text-[var(--text)]">{tauxDisplay} %</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Ventes HT</span>
          <span className="tabular-nums text-[var(--text)]">{formatAmount(salesTotal, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span>Achats HT</span>
          <span className="tabular-nums text-[var(--text)]">{formatAmount(purchasesTotal, currency)}</span>
        </div>
      </div>

      <CardChartSection
        storageKey="linky-business-chart-expanded"
        sectionTitle="Évolution"
        chartType={chartType}
        onChartTypeChange={onChartTypeChange ?? (() => {})}
        chartGranularity={chartGranularity}
        onChartGranularityChange={onChartGranularityChange ?? (() => {})}
        availableGranularities={availableGranularities}
        whyContent={whyContent}
      >
        <BusinessChart
          salesSeries={salesData?.series ?? []}
          purchasesSeries={purchasesData?.series ?? []}
          salesTotal={salesTotal}
          purchasesTotal={purchasesTotal}
          granularity={chartGranularity}
          chartType={chartType}
          currency={currency}
        />
      </CardChartSection>
      {salesByPartner?.items && salesByPartner.items.length > 0 && (
        <ParetoTableSection salesByPartner={salesByPartner} currency={currency} />
      )}
      {showArSection && arByPartner && (
        <ArByPartnerSection arByPartner={arByPartner} currency={currency} />
      )}
      {footer}
    </section>
  );
}
