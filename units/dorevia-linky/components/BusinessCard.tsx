"use client";

import { useState, useMemo } from "react";
import type {
  SalesAggregation,
  PurchasesAggregation,
  SalesByPartnerResponse,
  SalesByPartnerItem,
  ArByPartnerResponse,
} from "@/app/types/aggregations";
import { formatSignedAmount, formatAmount, formatPaymentDelayDays } from "@/app/lib/format";
import { computeARRisk, type ExposureLabel } from "@/app/lib/business-arrisk";
import { BusinessChart } from "@/components/BusinessChart";
import { CardChartSection, type WhyContent } from "@/components/CardChartSection";
import { IconBusiness } from "@/components/CardIcons";
import {
  INSTRUMENT_CARD_BASE,
  InstrumentCardHeader,
  InstrumentCardNav,
  InstrumentCardStatusBadge,
  InstrumentCardFooter,
} from "@/components/InstrumentCardChrome";
import type { CardId } from "@/app/types/linky-tiles";
import type { ChartGranularity } from "@/app/lib/chart-granularity";
import type { ChartType } from "@/app/lib/chart-type";

const MISSING_DUE_DATE_WARNING_THRESHOLD = 5;
const MULTI_CURRENCY_WARNING = "multi_currency_ignored_p0";

/** Badge priorité relance — SPEC Priorisation v1.1 (Critique / Élevée / Moyenne / Faible), visuellement explicite */
function PriorityBadge({ label }: { label?: string | null }) {
  if (!label) return <span className="text-[var(--text-secondary)]">—</span>;
  const config: Record<string, string> = {
    Critique: "bg-red-500/25 text-red-400 ring-1 ring-red-400/30",
    Élevée: "bg-amber-500/25 text-amber-400 ring-1 ring-amber-400/30",
    Moyenne: "bg-[var(--warning)]/20 text-[var(--warning)] ring-1 ring-[var(--warning)]/25",
    Faible: "bg-[var(--muted-soft)] text-[var(--text-secondary)]",
  };
  const cls = config[label] ?? "bg-[var(--muted-soft)] text-[var(--text-secondary)]";
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}
      title="Priorité = montant en retard + ancienneté + historique de paiement"
    >
      {label}
    </span>
  );
}

/** Badge exposition de marge — SPEC Concentration + Exposition v1.0 §5.6 */
function ExposureBadge({ label }: { label: ExposureLabel }) {
  const config: Record<ExposureLabel, string> = {
    "Marge peu exposée": "bg-[var(--positive)]/15 text-[var(--positive)]",
    "Marge partiellement exposée": "rounded-md bg-amber-500/15 text-amber-400",
    "Marge fortement exposée": "rounded-md bg-red-500/15 text-red-400",
  };
  const className = config[label] ?? "bg-[var(--muted-soft)] text-[var(--text-secondary)]";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium ${className}`} role="status">
      {label}
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
  const risquePartnersSorted = useMemo(() => {
    const risk = encoursPartners
      .filter((p) => (p.overdue_amount ?? 0) > 0)
      .map((p) => ({
        ...p,
        overdue_share: overdueAmount > 0 ? ((p.overdue_amount ?? 0) / overdueAmount) * 100 : 0,
      }));
    // SPEC Priorisation v1.0 : tri priorité de relance (score puis montant puis ancienneté)
    return [...risk].sort((a, b) => {
      const sa = a.priority_score ?? 0;
      const sb = b.priority_score ?? 0;
      if (sa !== sb) return sb - sa;
      if ((b.overdue_amount ?? 0) !== (a.overdue_amount ?? 0)) return (b.overdue_amount ?? 0) - (a.overdue_amount ?? 0);
      return (b.overdue_max_days ?? 0) - (a.overdue_max_days ?? 0);
    });
  }, [encoursPartners, overdueAmount]);
  const risquePartners = risquePartnersSorted;

  const { overdueConcentration, exposureLabel, topOverduePartnerName, topOverdueSharePct } = useMemo(
    () => computeARRisk(arByPartner),
    [totals?.overdue_amount, totals?.overdue_max_days, encoursPartners.map((p) => `${p.partner_id}:${p.overdue_amount ?? 0}:${p.partner_name ?? ""}`).join("|")]
  );

  // freshness unknown = aucun encours client dans le Vault pour cette période (ex. toutes factures payées)
  if (freshness === "unknown") {
    return (
      <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-2">
        <p className="text-sm text-[var(--text-secondary)]" role="status">
          Aucun encours client sur cette période
        </p>
        {hasMultiCurrency && (
          <p className="text-xs text-amber-400" role="status">
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
          <p className="text-xs text-amber-400" role="status">
            Factures non-EUR exclues (P0)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-[var(--border)] pt-4 space-y-4">
      {/* Titre de section — niveau 2 */}
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text)]">
        Exposition de marge
      </h3>

      {/* Warnings — discrets */}
      {freshness !== "event_driven" && (
        <p className="text-xs text-amber-400" role="status">
          Donnée snapshot (dernière mise à jour au posting)
        </p>
      )}
      {hasMultiCurrency && (
        <p className="text-xs text-amber-400" role="status">
          Factures non-EUR exclues (P0)
        </p>
      )}
      {missingDue >= MISSING_DUE_DATE_WARNING_THRESHOLD && (
        <p className="text-xs text-amber-400" role="status">
          {missingDue} facture{missingDue > 1 ? "s" : ""} sans échéance
        </p>
      )}

      {/* Mini panneau synthétique — encours, retard, temporalité, concentration */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/50 px-4 py-3 space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-[var(--text-secondary)]">Encours client</span>
          <span className="text-sm font-semibold tabular-nums text-[var(--text)]">{formatAmount(openAmount, currency)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-[var(--text-secondary)]">Dont en retard</span>
          <span className="text-sm font-semibold tabular-nums text-amber-400">{formatAmount(overdueAmount, currency)}</span>
        </div>
        {overdueAmount > 0 && (totals?.overdue_avg_days != null || totals?.overdue_max_days != null) && (
          <>
            {totals?.overdue_avg_days != null && totals.overdue_avg_days > 0 && (
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-[var(--text-secondary)]">Retard moyen pondéré</span>
                <span className="text-sm font-semibold tabular-nums text-[var(--text)]">{Math.round(totals.overdue_avg_days)} j</span>
              </div>
            )}
            {totals?.overdue_max_days != null && totals.overdue_max_days > 0 && (
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-[var(--text-secondary)]">Pire retard</span>
                <span className="text-sm font-semibold tabular-nums text-amber-400">{totals.overdue_max_days} j</span>
              </div>
            )}
          </>
        )}
        {overdueAmount > 0 && topOverdueSharePct > 0 && (
          <div className="flex justify-between items-baseline flex-wrap gap-x-2">
            <span className="text-sm text-[var(--text-secondary)]">Risque concentré</span>
            <span className="text-sm font-semibold tabular-nums text-[var(--text)]">
              {topOverduePartnerName
                ? `${topOverduePartnerName} (${topOverdueSharePct.toFixed(1)} % du retard)`
                : `1 client concentre ${topOverdueSharePct.toFixed(1)} % du retard`}
            </span>
          </div>
        )}
        <ExposureBadge label={exposureLabel} />
      </div>

      {/* Encours total par partenaire */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setExpandedEncours(!expandedEncours)}
          className="flex w-full items-center justify-between text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
        >
          <span>Encours client — exposition par partenaire</span>
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
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                  <th className="py-2 pr-2 font-medium">Partenaire</th>
                  <th className="py-2 pr-2 font-medium text-right">Encours</th>
                  <th className="py-2 pr-2 font-medium text-right">En retard</th>
                  <th className="py-2 pr-2 font-medium text-right">Délai moy. paiement</th>
                  <th className="py-2 pr-2 font-medium text-right">Retard Jrs</th>
                  <th className="py-2 pr-2 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {encoursPartners.map((row) => (
                  <tr key={row.partner_id} className="border-b border-[var(--border)]/50">
                    <td className="py-1.5 pr-2">{row.partner_name || row.partner_id || "(sans nom)"}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{formatAmount(row.open_amount ?? 0, currency)}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums text-amber-400">{(row.overdue_amount ?? 0) > 0 ? formatAmount(row.overdue_amount ?? 0, currency) : "—"}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums text-[var(--text-secondary)]">{formatPaymentDelayDays(row.payment_delay_avg_days ?? null)}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{(row.overdue_amount ?? 0) > 0 && (row.overdue_max_days != null || row.overdue_avg_days != null) ? `${Math.round((row.overdue_max_days ?? row.overdue_avg_days) ?? 0)} j` : "—"}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{(row.share_percent ?? 0).toFixed(1)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Clients à risque — zone sensible, temporalité du retard */}
      <div className="pt-4 mt-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => setExpandedRisque(!expandedRisque)}
          className="flex w-full items-center justify-between text-sm font-semibold text-[var(--text)] hover:text-[var(--accent)] transition-colors"
        >
          <span>Clients à risque (retard)</span>
          <span className="tabular-nums text-amber-400 font-medium">
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
        {overdueAmount > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
            {totals?.overdue_avg_days != null && totals.overdue_avg_days > 0 && (
              <span>Retard moyen des clients à risque : <span className="font-semibold tabular-nums text-[var(--text)]">{Math.round(totals.overdue_avg_days)} j</span></span>
            )}
            {totals?.overdue_max_days != null && totals.overdue_max_days > 0 && (
              <span>Plus ancien retard : <span className="font-semibold tabular-nums text-amber-400">{totals.overdue_max_days} j</span></span>
            )}
            {(() => {
              const days = (p: (typeof risquePartners)[0]) => p.overdue_max_days ?? p.overdue_avg_days ?? 0;
              const countGe30 = risquePartners.filter((p) => days(p) >= 30).length;
              const countGt60 = risquePartners.filter((p) => days(p) > 60).length;
              if (countGe30 === 0) return null;
              return (
                <span>
                  {countGe30} partenaire{countGe30 > 1 ? "s" : ""} ≥ 30 j, dont {countGt60} &gt; 60 j
                </span>
              );
            })()}
          </div>
        )}
        {expandedRisque && risquePartners.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[440px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                  <th className="py-2 pr-2 font-medium">Partenaire</th>
                  <th className="py-2 pr-2 font-medium text-right">En retard</th>
                  <th className="py-2 pr-2 font-medium text-right">Délai moy. paiement</th>
                  <th className="py-2 pr-2 font-medium text-right">Retard Jrs</th>
                  <th className="py-2 pr-2 font-medium">Priorité</th>
                  <th className="py-2 pr-2 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {risquePartners.map((row) => (
                  <tr key={row.partner_id} className="border-b border-[var(--border)]/50">
                    <td className="py-1.5 pr-2">{row.partner_name || row.partner_id || "(sans nom)"}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums text-amber-400">{formatAmount(row.overdue_amount ?? 0, currency)}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums text-[var(--text-secondary)]">{formatPaymentDelayDays(row.payment_delay_avg_days ?? null)}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{(row.overdue_max_days != null || row.overdue_avg_days != null) ? `${Math.round((row.overdue_max_days ?? row.overdue_avg_days) ?? 0)} j` : "—"}</td>
                    <td className="py-1.5 pr-2">
                      <PriorityBadge label={row.priority_label} />
                    </td>
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

type ParetoTab = "A" | "B" | "C";

/** Partition items en classes ABC selon cumul % : A ≤80 %, B 80–95 %, C >95 % */
function partitionByABC(items: SalesByPartnerItem[]): { A: SalesByPartnerItem[]; B: SalesByPartnerItem[]; C: SalesByPartnerItem[] } {
  const A: SalesByPartnerItem[] = [];
  const B: SalesByPartnerItem[] = [];
  const C: SalesByPartnerItem[] = [];
  for (const row of items) {
    const cumul = row.cumulative_pct ?? 0;
    if (cumul <= 80) A.push(row);
    else if (cumul <= 95) B.push(row);
    else C.push(row);
  }
  return { A, B, C };
}

function ParetoTableSection({
  salesByPartner,
  arByPartner,
  currency,
}: {
  salesByPartner: SalesByPartnerResponse;
  arByPartner?: ArByPartnerResponse | null;
  currency: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<ParetoTab>("A");
  const items = salesByPartner.items ?? [];
  const { A, B, C } = partitionByABC(items);
  const paretoSet = useMemo(() => new Set(A.map((i) => i.partner_name)), [A]);

  // Map partenaire (nom) → délai moyen paiement (pour colonne Délai moy. paiement)
  const paymentDelayByPartnerName = useMemo(() => {
    const m = new Map<string, number | null>();
    if (!arByPartner?.partners?.length) return m;
    for (const p of arByPartner.partners) {
      const name = (p.partner_name ?? String(p.partner_id ?? "")).trim() || String(p.partner_id ?? "");
      if (name && p.payment_delay_avg_days != null) m.set(name, p.payment_delay_avg_days);
      else if (name) m.set(name, null);
    }
    return m;
  }, [arByPartner?.partners]);

  const tabConfig: { id: ParetoTab; label: string; count: number; items: SalesByPartnerItem[] }[] = [
    { id: "A", label: "Classe A", count: A.length, items: A },
    { id: "B", label: "Classe B", count: B.length, items: B },
    { id: "C", label: "Classe C", count: C.length, items: C },
  ];

  const currentItems = activeTab === "A" ? A : activeTab === "B" ? B : C;

  // SPEC §4.6 — vérité calculée : résumé = valeur réellement affichée (pas "80 %" fixe)
  const topCount = A.length;
  const classARealtimePct = A.length > 0 ? A[A.length - 1].cumulative_pct : 0;
  const paretoInsight = topCount > 0 ? `Top ${topCount} = ${classARealtimePct.toFixed(1)} % du CA` : null;

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
      >
        <span>Concentration clients (Pareto 80/20)</span>
        <span className="tabular-nums text-[var(--accent)]">
          {items.length} partenaire{items.length > 1 ? "s" : ""}
          {paretoInsight && ` · ${paretoInsight}`}
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
        <>
          {paretoInsight && (
            <p className="mt-3 text-sm font-semibold text-[var(--accent)] tabular-nums" role="status">
              {paretoInsight}
            </p>
          )}
          <div className="mt-3 flex gap-1 border-b border-[var(--border)]" role="tablist" aria-label="Classes Pareto">
            {tabConfig.map(({ id, label, count }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`pareto-tabpanel-${id}`}
                id={`pareto-tab-${id}`}
                onClick={() => setActiveTab(id)}
                className={`rounded-t px-3 py-2 text-xs font-semibold transition-colors ${
                  activeTab === id
                    ? "border-b-2 border-[var(--accent)] bg-[var(--accent-soft)]/20 text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
                }`}
              >
                {label}
                <span className="ml-1.5 tabular-nums text-[var(--muted)]">({count})</span>
              </button>
            ))}
          </div>
          <div
            id={`pareto-tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`pareto-tab-${activeTab}`}
            className="mt-0 overflow-x-auto"
          >
            {currentItems.length > 0 ? (
              <table className="w-full min-w-[380px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                    <th className="py-2 pr-2 font-medium">Partenaire</th>
                    <th className="py-2 pr-2 font-medium text-right">CA HT</th>
                    <th className="py-2 pr-2 font-medium text-right">Délai moy. paiement</th>
                    <th className="py-2 pr-2 font-medium text-right">% total</th>
                    <th className="py-2 pr-2 font-medium text-right">Cumul %</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((row) => {
                    const isPareto80 = paretoSet.has(row.partner_name); // Classe A = partenaire dans le Top X
                    const delay = paymentDelayByPartnerName.has(row.partner_name)
                      ? paymentDelayByPartnerName.get(row.partner_name) ?? null
                      : null;
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
                        <td className="py-1.5 pr-2 text-right tabular-nums text-[var(--text-secondary)]">
                          {formatPaymentDelayDays(delay)}
                        </td>
                        <td className="py-1.5 pr-2 text-right tabular-nums">{row.pct_of_total.toFixed(1)} %</td>
                        <td className="py-1.5 pr-2 text-right tabular-nums">{row.cumulative_pct.toFixed(1)} %</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="py-4 text-center text-sm text-[var(--text-secondary)]">
                Aucun partenaire en classe {activeTab}.
              </p>
            )}
          </div>
        </>
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
  /** Slot rendu après le footer standard */
  footer?: React.ReactNode;
  cardId?: CardId;
  onNavigateToCard?: (cardId: CardId) => void;
}

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
  cardId,
  onNavigateToCard,
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

  const iconNode = onFocusRequest ? (
    <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label="Ouvrir la card Business">
      <IconBusiness className="h-6 w-6 shrink-0 text-[var(--accent)]" />
    </button>
  ) : (
    <IconBusiness className="h-6 w-6 shrink-0 text-[var(--accent)]" />
  );

  if (loading) {
    return (
      <section className={INSTRUMENT_CARD_BASE}>
        {cardId && onNavigateToCard && (
          <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
        )}
        <InstrumentCardHeader
          icon={iconNode}
          title="BUSINESS"
          kpiValue={<div className="skeleton h-6 w-28" />}
        />
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
      <section className={`${INSTRUMENT_CARD_BASE} bg-[var(--negative-soft)]`}>
        {cardId && onNavigateToCard && (
          <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
        )}
        <InstrumentCardHeader icon={iconNode} title="BUSINESS" />
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

  const marginStatus =
    tauxRaw != null
      ? tauxRaw >= 0.25
        ? { label: "Solide", severity: "success" as const }
        : tauxRaw >= 0.1
          ? { label: "À surveiller", severity: "vigilance" as const }
          : { label: "Exposée", severity: "alert" as const }
      : null;

  const businessFooterMeta = useMemo(() => {
    const items = salesByPartner?.items ?? [];
    if (items.length > 0) {
      const { A } = partitionByABC(items);
      const topCount = A.length;
      const classAPct = A.length > 0 ? A[A.length - 1].cumulative_pct : 0;
      const pareto = topCount > 0 ? `Top ${topCount} = ${classAPct.toFixed(1)} % du CA` : null;
      return `Exercice à date · ${items.length} partenaire${items.length > 1 ? "s" : ""}${pareto ? ` · ${pareto}` : ""}`;
    }
    return "Snapshot au posting · Source Vault";
  }, [salesByPartner?.items]);

  return (
    <section className={`${INSTRUMENT_CARD_BASE} ${net >= 0 ? "border-[var(--positive)]" : "border-[var(--negative)]"}`}>
      {cardId && onNavigateToCard && (
        <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
      )}
      <InstrumentCardHeader
        icon={iconNode}
        title="BUSINESS"
        badges={
          marginStatus ? (
            <InstrumentCardStatusBadge label={marginStatus.label} severity={marginStatus.severity} />
          ) : undefined
        }
        kpiLabel="Marge commerciale"
        kpiValue={
          <span className={net >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
            {formatSignedAmount(net)}
          </span>
        }
      />

      {/* Synthèse : marge d’abord, puis ventes, achats + statut marge */}
      <div className="space-y-2 text-sm">
        {tauxDisplay != null && (
          <div className="flex justify-between items-baseline">
            <span className="text-[var(--text-secondary)]">Taux de marge</span>
            <span className="tabular-nums font-semibold text-[var(--text)]">{tauxDisplay} %</span>
          </div>
        )}
        <div className="flex justify-between items-baseline">
          <span className="text-[var(--text-secondary)]">Ventes HT</span>
          <span className="tabular-nums font-semibold text-[var(--text)]">{formatAmount(salesTotal, currency)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[var(--text-secondary)]">Achats HT</span>
          <span className="tabular-nums font-semibold text-[var(--text)]">{formatAmount(purchasesTotal, currency)}</span>
        </div>
      </div>

      <CardChartSection
        storageKey="linky-business-chart-expanded"
        sectionTitle="Évolution"
        interpretationOverride={{
          primary: "Ventes vs achats sur la période.",
          secondary: "Marge : écart entre les deux séries.",
        }}
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
        <ParetoTableSection salesByPartner={salesByPartner} arByPartner={arByPartner} currency={currency} />
      )}
      {showArSection && arByPartner && (
        <ArByPartnerSection arByPartner={arByPartner} currency={currency} />
      )}
      <InstrumentCardFooter meta={businessFooterMeta} />
      {footer}
    </section>
  );
}
