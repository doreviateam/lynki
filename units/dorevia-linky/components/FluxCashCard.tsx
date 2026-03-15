"use client";

import { useMemo } from "react";
import type { PaymentsAggregation } from "@/app/types/aggregations";
import { formatSignedAmount, formatAmount } from "@/app/lib/format";
import { toPositiveSeries } from "@/app/lib/chart-utils";
import { computeFluxNetInsight } from "@/app/lib/flux-net-insight";
import { DualSeriesChart } from "@/components/DualSeriesChart";
import { CardChartSection, type WhyContent, type InterpretationOverride } from "@/components/CardChartSection";
import { IconCash } from "@/components/CardIcons";
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

interface FluxCashCardProps {
  paymentsIn: PaymentsAggregation | null;
  paymentsOut: PaymentsAggregation | null;
  loading?: boolean;
  errorIn?: string;
  errorOut?: string;
  chartGranularity?: ChartGranularity;
  availableGranularities?: ChartGranularity[];
  onChartGranularityChange?: (g: ChartGranularity) => void;
  chartType?: ChartType;
  onChartTypeChange?: (t: ChartType) => void;
  whyContent?: WhyContent;
  onFocusRequest?: () => void;
  /** Slot rendu en bas de la carte (ex. DivaFlashBlock) */
  footer?: React.ReactNode;
  cardId?: CardId;
  onNavigateToCard?: (cardId: CardId) => void;
}

export function FluxCashCard({
  paymentsIn,
  paymentsOut,
  loading,
  errorIn,
  errorOut,
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
}: FluxCashCardProps) {
  const error = errorIn || errorOut;

  const iconNode = onFocusRequest ? (
    <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label="Ouvrir la card FLUX NET">
      <IconCash className="h-6 w-6 shrink-0 text-[var(--accent)]" />
    </button>
  ) : (
    <IconCash className="h-6 w-6 shrink-0 text-[var(--accent)]" />
  );

  if (loading) {
    return (
      <section className={INSTRUMENT_CARD_BASE}>
        {cardId && onNavigateToCard && (
          <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
        )}
        <InstrumentCardHeader
          icon={iconNode}
          title="FLUX NET"
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
        <InstrumentCardHeader icon={iconNode} title="FLUX NET" />
        <p className="text-[var(--negative)]">{error}</p>
      </section>
    );
  }

  const inTotal = paymentsIn?.total ?? 0;
  const outTotalRaw = paymentsOut?.total ?? 0;
  const outTotal = Math.abs(outTotalRaw);
  const net = inTotal - outTotal;
  const currency = paymentsIn?.currency ?? paymentsOut?.currency ?? "EUR";

  // Espèces / Banque (SPEC §5.4 — libellés lisibles "Espèces : X €", "Banque : Y €")
  const hasByMethod =
    (paymentsIn?.by_method && Object.keys(paymentsIn.by_method).length > 0) ||
    (paymentsOut?.by_method && Object.keys(paymentsOut.by_method).length > 0);
  const inflowsCash = paymentsIn?.by_method?.cash ?? 0;
  const inflowsBank = (paymentsIn?.by_method?.transfer ?? 0) + (paymentsIn?.by_method?.check ?? 0);
  const outflowsCash = paymentsOut?.by_method?.cash ?? 0;
  const outflowsBank = (paymentsOut?.by_method?.transfer ?? 0) + (paymentsOut?.by_method?.check ?? 0);
  const hasInflowsBreakdown = inflowsCash > 0 || inflowsBank > 0;
  const hasOutflowsBreakdown = outflowsCash > 0 || outflowsBank > 0;

  const seriesIn = paymentsIn?.series ?? [];
  const seriesOut = paymentsOut?.series ?? [];
  const { primary: insightPrimary, statusLabel } = useMemo(
    () => computeFluxNetInsight(inTotal, outTotal, seriesIn, seriesOut, chartGranularity),
    [inTotal, outTotal, seriesIn, seriesOut, chartGranularity]
  );
  const interpretationOverride: InterpretationOverride = { primary: insightPrimary };

  const fluxBadgeSeverity =
    statusLabel && /négatif|défavorable/i.test(statusLabel)
      ? ("alert" as const)
      : statusLabel && /volatil|surveillance|exposé/i.test(statusLabel)
        ? ("vigilance" as const)
        : ("success" as const);

  // SPEC FLUX NET v1.1 §4 : Semaine = courbes, Mois = barres (type piloté par granularité)
  const effectiveChartType = chartGranularity === "week" ? "line" : "bar";

  return (
    <section className={`${INSTRUMENT_CARD_BASE} ${net >= 0 ? "border-[var(--positive)]" : "border-[var(--negative)]"}`}>
      {cardId && onNavigateToCard && (
        <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
      )}
      <InstrumentCardHeader
        icon={iconNode}
        title="FLUX NET"
        badges={
          statusLabel ? (
            <InstrumentCardStatusBadge label={statusLabel} severity={fluxBadgeSeverity} />
          ) : undefined
        }
        kpiLabel="Flux net"
        kpiValue={
          <span className={net >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
            {formatSignedAmount(net, currency)}
          </span>
        }
      />
      <div className="space-y-3 text-sm font-semibold text-[var(--text-secondary)]">
        <div>
          <div className="flex justify-between items-baseline">
            <span>Encaissements</span>
            <span className="tabular-nums text-[var(--text)]">{formatAmount(inTotal, currency)}</span>
          </div>
          {hasByMethod && hasInflowsBreakdown && (
            <div className="pl-4 mt-0.5 space-y-0.5 text-[11px] font-normal text-[var(--text-muted)]">
              <div className="flex justify-between">
                <span>Espèces</span>
                <span className="tabular-nums">{formatAmount(inflowsCash, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Banque</span>
                <span className="tabular-nums">{formatAmount(inflowsBank, currency)}</span>
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="flex justify-between items-baseline">
            <span>Décaissements</span>
            <span className="tabular-nums text-[var(--text)]">{formatAmount(outTotal, currency)}</span>
          </div>
          {hasByMethod && hasOutflowsBreakdown && (
            <div className="pl-4 mt-0.5 space-y-0.5 text-[11px] font-normal text-[var(--text-muted)]">
              <div className="flex justify-between">
                <span>Espèces</span>
                <span className="tabular-nums">{formatAmount(outflowsCash, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Banque</span>
                <span className="tabular-nums">{formatAmount(outflowsBank, currency)}</span>
              </div>
            </div>
          )}
        </div>
        {hasByMethod &&
          inTotal + outTotal > 0 &&
          inflowsCash === 0 &&
          outflowsCash === 0 &&
          (inflowsBank > 0 || outflowsBank > 0) && (
            <p className="mt-2 text-xs text-[var(--text-muted)] italic">
              Ventilation Espèces/Banque disponible pour les paiements postérieurs au 2026-02-28.
            </p>
          )}
      </div>

      <CardChartSection
        storageKey="linky-cash-chart-expanded"
        sectionTitle="Évolution"
        chartType={effectiveChartType}
        onChartTypeChange={onChartTypeChange ?? (() => {})}
        chartGranularity={chartGranularity}
        onChartGranularityChange={onChartGranularityChange ?? (() => {})}
        availableGranularities={availableGranularities}
        whyContent={whyContent}
        interpretationOverride={interpretationOverride}
        hideChartTypeSelector
      >
        <DualSeriesChart
          series1={toPositiveSeries(paymentsIn?.series ?? [])}
          series2={toPositiveSeries(paymentsOut?.series ?? [])}
          total1={Math.abs(inTotal)}
          total2={outTotal}
          label1="Encaissements"
          label2="Décaissements"
          granularity={chartGranularity}
          chartType={effectiveChartType}
          currency={currency}
        />
      </CardChartSection>
      <InstrumentCardFooter meta="Période : exercice à date · Source Odoo + POS" />
      {footer}
    </section>
  );
}
