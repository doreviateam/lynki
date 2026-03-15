"use client";

/**
 * EbeCard — Instrument EBE (Excédent Brut d'Exploitation)
 * SPEC_LINKY_COCKPIT_INSTRUMENTS_v1.0 — instrument: ebitda
 * PLAN_IMPLEMENTATION_DATA_EVOLUTION_VAULT_LINKY : bloc Évolution en available si série EBE.
 *
 * EBE complet  = Marge brute − Charges de personnel (payroll_charges)
 * EBE proxy    = Marge brute (si payroll non disponible)
 *
 * Bascule automatique : si payslip_count > 0, affiche EBE complet.
 */

import { useState } from "react";
import { formatSignedAmount, formatAmount } from "@/app/lib/format";
import { IconEbe } from "@/components/CardIcons";
import {
  INSTRUMENT_CARD_BASE,
  InstrumentCardHeader,
  InstrumentCardNav,
  InstrumentCardStatusBadge,
  InstrumentCardFooter,
} from "@/components/InstrumentCardChrome";
import type { CardId } from "@/app/types/linky-tiles";
import { InstrumentCardEvolutionBlock } from "@/components/InstrumentCardEvolutionBlock";
import { DualSeriesChart } from "@/components/DualSeriesChart";
import type { SeriesPoint } from "@/app/types/aggregations";
import type { ChartType } from "@/app/lib/chart-type";
import type { ChartGranularity } from "@/app/lib/chart-granularity";
import { PAYROLL_SOURCE_UI, type PayrollSourceUi } from "@/app/lib/payroll-source-ui";

interface EbeCardProps {
  salesTotal: number | null;
  purchasesTotal: number | null;
  creditNotesNet?: number | null;
  /** Charges de personnel — null si non disponible dans le Vault */
  payrollTotal?: number | null;
  /** Nombre de bulletins / écritures contributives */
  payslipCount?: number;
  /** État UI source paie (dérivé par le parent de payroll_source) */
  payrollSourceUi?: PayrollSourceUi;
  /** Paie disponible (bulletins ou OD) — calculé par le parent */
  hasPayroll?: boolean;
  /** Détail 641/645 si source OD */
  payrollBreakdown?: { accounts_641?: number; accounts_645?: number } | null;
  currency?: string;
  loading?: boolean;
  onFocusRequest?: () => void;
  /** Série EBE par période (évolution) — si non vide, bloc Évolution en available */
  ebeSeries?: SeriesPoint[];
  /** Erreur lors du chargement de la série d’évolution */
  evolutionError?: boolean;
  /** Retry pour recharger la série d’évolution */
  onEvolutionRetry?: () => void;
  /** Série EBE sans payroll (série partielle) */
  payrollUnavailableInEvolution?: boolean;
  /** Granularité du graphique (mois, semaine, jour selon période) */
  chartGranularity?: ChartGranularity;
  /** Granularités proposées selon la période */
  availableGranularities?: ChartGranularity[];
  /** Callback changement de granularité */
  onChartGranularityChange?: (g: ChartGranularity) => void;
  cardId?: CardId;
  onNavigateToCard?: (cardId: CardId) => void;
}

export function EbeCard({
  salesTotal,
  purchasesTotal,
  creditNotesNet = null,
  payrollTotal = null,
  payslipCount = 0,
  payrollSourceUi = "legacy_fallback",
  hasPayroll: hasPayrollProp,
  payrollBreakdown = null,
  currency = "EUR",
  loading,
  onFocusRequest,
  ebeSeries = [],
  evolutionError = false,
  onEvolutionRetry,
  payrollUnavailableInEvolution = false,
  chartGranularity = "month",
  availableGranularities = ["month"],
  onChartGranularityChange = () => {},
  cardId,
  onNavigateToCard,
}: EbeCardProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const hasData = salesTotal != null && purchasesTotal != null;
  const margeBrute = hasData ? salesTotal! - purchasesTotal! : null;

  // Proxy EBE = marge brute + avoirs nets
  const ebeProxy =
    margeBrute != null && creditNotesNet != null
      ? margeBrute + creditNotesNet
      : margeBrute;

  // EBE complet : hasPayroll fourni par le parent (source de vérité)
  const hasPayroll = hasPayrollProp === true;
  const ebeFull = hasPayroll && ebeProxy != null
    ? ebeProxy - payrollTotal!
    : null;

  // Valeur affichée : EBE complet si disponible, sinon proxy
  const ebeDisplay = ebeFull ?? ebeProxy;
  const isFullEbe = ebeFull != null;

  const marginRatio =
    salesTotal != null && salesTotal > 0 && margeBrute != null
      ? (margeBrute / salesTotal) * 100
      : null;

  const ebeMarginRatio =
    salesTotal != null && salesTotal > 0 && ebeDisplay != null
      ? (ebeDisplay / salesTotal) * 100
      : null;

  const iconNode = onFocusRequest ? (
    <button
      type="button"
      onClick={onFocusRequest}
      className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors"
      aria-label="Ouvrir le détail EBE"
    >
      <IconEbe className="h-6 w-6 shrink-0 text-[var(--accent)]" />
    </button>
  ) : (
    <IconEbe className="h-6 w-6 shrink-0 text-[var(--accent)]" />
  );

  const ebeFooterMeta = isFullEbe
    ? "Source : Vault · Marge brute − Charges personnel"
    : "Proxy : marge brute + avoirs · Source Vault";

  if (loading) {
    return (
      <section className={INSTRUMENT_CARD_BASE} aria-label="EBE — chargement">
        {cardId && onNavigateToCard && (
          <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
        )}
        <InstrumentCardHeader icon={iconNode} title="EBE" kpiValue={<div className="skeleton h-6 w-28" />} />
        <div className="space-y-3">
          <div className="h-10 animate-pulse rounded-lg bg-[var(--hover)]" />
          <div className="h-4 animate-pulse rounded bg-[var(--hover)]" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--hover)]" />
        </div>
      </section>
    );
  }

  return (
    <section className={INSTRUMENT_CARD_BASE} role="region" aria-label="Instrument EBE — Excédent Brut d'Exploitation">
      {cardId && onNavigateToCard && (
        <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
      )}
      <InstrumentCardHeader
        icon={iconNode}
        title="EBE"
        badges={
          <InstrumentCardStatusBadge
            label={isFullEbe ? "Complet" : "Proxy"}
            severity={isFullEbe ? "success" : "info"}
          />
        }
        kpiLabel={isFullEbe ? "EBE net" : "Marge brute"}
        kpiValue={
          <span className={ebeDisplay == null ? "text-[var(--text-secondary)]" : ebeDisplay >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
            {ebeDisplay != null ? formatSignedAmount(ebeDisplay, currency) : "—"}
          </span>
        }
      />

      {/* Décomposition */}
      {hasData && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between rounded px-2 py-1.5">
            <span className="text-sm text-[var(--text-secondary)]">CA ventes HT</span>
            <span className="font-bold tabular-nums text-[var(--positive)]">
              + {formatAmount(salesTotal!, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded px-2 py-1.5">
            <span className="text-sm text-[var(--text-secondary)]">Achats HT</span>
            <span className="font-bold tabular-nums text-[var(--negative)]">
              − {formatAmount(purchasesTotal!, currency)}
            </span>
          </div>
          {creditNotesNet != null && creditNotesNet !== 0 && (
            <div className="flex items-center justify-between rounded px-2 py-1.5">
              <span className="text-sm text-[var(--text-secondary)]">Avoirs nets</span>
              <span className={`font-bold tabular-nums ${creditNotesNet >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                {formatSignedAmount(creditNotesNet, currency)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between rounded border-t border-[var(--border)] px-2 pt-2">
            <span className="text-sm font-semibold text-[var(--text)]">Marge brute</span>
            <span className={`text-base font-bold tabular-nums ${margeBrute != null && margeBrute >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
              {margeBrute != null ? formatSignedAmount(margeBrute, currency) : "—"}
            </span>
          </div>
          {marginRatio != null && (
            <p className="px-2 text-xs text-[var(--text-muted)]">
              Taux de marge brute : <span className="font-medium">{marginRatio.toFixed(1)} %</span>
            </p>
          )}

          {/* Charges de personnel (si disponibles) */}
          {hasPayroll && (
            <div className="flex items-center justify-between rounded border-t border-[var(--border)] px-2 pt-2">
              <div>
                <span className="text-sm text-[var(--text-secondary)]">Charges de personnel</span>
                <span className="ml-2 text-xs text-[var(--text-muted)]">
                  {payrollSourceUi === "od"
                    ? `(${payslipCount} écriture${payslipCount > 1 ? "s" : ""} OD)`
                    : `(${payslipCount} bulletin${payslipCount > 1 ? "s" : ""})`}
                </span>
              </div>
              <span className="font-bold tabular-nums text-[var(--negative)]">
                − {formatAmount(payrollTotal!, currency)}
              </span>
            </div>
          )}

          {hasPayroll && (
            <div className="flex items-center justify-between rounded border-t border-[var(--border)] bg-[var(--surface)] px-2 pt-2 pb-2 mt-1">
              <span className="text-sm font-bold text-[var(--text)]">EBE complet</span>
              <span className={`text-base font-bold tabular-nums ${ebeFull != null && ebeFull >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                {ebeFull != null ? formatSignedAmount(ebeFull, currency) : "—"}
              </span>
            </div>
          )}
        </div>
      )}

      {!hasData && (
        <div className="mb-4 rounded-lg bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-muted)]">
          Données CA/achats non disponibles pour la période sélectionnée.
        </div>
      )}

      {/* Composantes manquantes ou partielles — badge et messages selon PAYROLL_SOURCE_UI (spec §10) */}
      {!isFullEbe && (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            EBE complet — composantes manquantes
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">Charges de personnel</span>
              <span className="rounded bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                {PAYROLL_SOURCE_UI[payrollSourceUi].badge}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">Autres charges externes</span>
              <span className="rounded bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                Partiel (via ajustements)
              </span>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-[var(--text-muted)]">
            {PAYROLL_SOURCE_UI[payrollSourceUi].messagePrimary}
          </p>
          {PAYROLL_SOURCE_UI[payrollSourceUi].messageSecondary && (
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              {PAYROLL_SOURCE_UI[payrollSourceUi].messageSecondary}
            </p>
          )}
          {payrollSourceUi === "od" && payrollBreakdown && (payrollBreakdown.accounts_641 != null || payrollBreakdown.accounts_645 != null) && (
            <p className="mt-2 text-[10px] text-[var(--text-muted)]">
              {payrollBreakdown.accounts_641 != null && `Salaires (641*) : ${formatAmount(payrollBreakdown.accounts_641, currency)}`}
              {payrollBreakdown.accounts_641 != null && payrollBreakdown.accounts_645 != null && " · "}
              {payrollBreakdown.accounts_645 != null && `Charges sociales (645*) : ${formatAmount(payrollBreakdown.accounts_645, currency)}`}
            </p>
          )}
        </div>
      )}

      <InstrumentCardEvolutionBlock
        storageKey="linky-ebe-evolution"
        state={ebeSeries.length > 0 ? "available" : evolutionError ? "error" : "empty"}
        onRetry={onEvolutionRetry}
        emptyMessage="Aucune série EBE sur la période."
        chartType={chartType}
        onChartTypeChange={setChartType}
        chartGranularity={chartGranularity}
        onChartGranularityChange={onChartGranularityChange}
        availableGranularities={availableGranularities}
        interpretationOverride={
          payrollUnavailableInEvolution
            ? { primary: "Évolution EBE (marge brute − achats).", secondary: "Charges de personnel non incluses (source indisponible par mois)." }
            : { primary: "Évolution EBE (marge brute − achats − charges personnel).", secondary: "" }
        }
      >
        {ebeSeries.length > 0 && (
          <DualSeriesChart
            series1={ebeSeries}
            series2={[]}
            total1={ebeSeries.reduce((s, p) => s + p.amount, 0)}
            total2={0}
            label1="EBE"
            label2=""
            granularity={chartGranularity}
            chartType={chartType}
            currency={currency}
            showSeries2={false}
            selectedPeriod={selectedPeriod}
            onPeriodSelect={setSelectedPeriod}
          />
        )}
      </InstrumentCardEvolutionBlock>

      <InstrumentCardFooter meta={ebeFooterMeta} />
    </section>
  );
}
