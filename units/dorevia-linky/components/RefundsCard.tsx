"use client";

import type { AdjustmentsAggregation } from "@/app/types/aggregations";
import { formatSignedAmount } from "@/app/lib/format";
import { toPositiveSeries } from "@/app/lib/chart-utils";
import { DualSeriesChart } from "@/components/DualSeriesChart";
import { CardChartSection, type WhyContent } from "@/components/CardChartSection";
import { IconRefunds } from "@/components/CardIcons";
import {
  INSTRUMENT_CARD_BASE,
  InstrumentCardHeader,
  InstrumentCardNav,
  InstrumentCardFooter,
} from "@/components/InstrumentCardChrome";
import type { CardId } from "@/app/types/linky-tiles";
import type { ChartGranularity } from "@/app/lib/chart-granularity";
import type { ChartType } from "@/app/lib/chart-type";

interface RefundsCardProps {
  clientData: AdjustmentsAggregation | null;
  supplierData: AdjustmentsAggregation | null;
  loading?: boolean;
  errorClient?: string;
  errorSupplier?: string;
  chartGranularity?: ChartGranularity;
  availableGranularities?: ChartGranularity[];
  onChartGranularityChange?: (g: ChartGranularity) => void;
  chartType?: ChartType;
  onChartTypeChange?: (t: ChartType) => void;
  whyContent?: WhyContent;
  onFocusRequest?: () => void;
  footer?: React.ReactNode;
  cardId?: CardId;
  onNavigateToCard?: (cardId: CardId) => void;
  onBackToCockpit?: () => void;
}

export function RefundsCard({
  clientData,
  supplierData,
  loading,
  errorClient,
  errorSupplier,
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
  onBackToCockpit,
}: RefundsCardProps) {
  const error = errorClient || errorSupplier;

  const iconNode = onFocusRequest ? (
    <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label="Ouvrir la card Remboursements">
      <IconRefunds className="h-6 w-6 shrink-0 text-[var(--accent)]" />
    </button>
  ) : (
    <IconRefunds className="h-6 w-6 shrink-0 text-[var(--accent)]" />
  );

  if (loading) {
    return (
      <section className={INSTRUMENT_CARD_BASE}>
        {cardId && onNavigateToCard && (
          <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} onBackToCockpit={onBackToCockpit} />
        )}
        <InstrumentCardHeader icon={iconNode} title="REMBOURSEMENTS" kpiValue={<div className="skeleton h-6 w-28" />} />
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <div className="skeleton h-4 w-36" />
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
          <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} onBackToCockpit={onBackToCockpit} />
        )}
        <InstrumentCardHeader icon={iconNode} title="REMBOURSEMENTS" />
        <p className="text-[var(--negative)]">{error}</p>
      </section>
    );
  }

  const clientTotal = clientData?.total_amount ?? clientData?.total ?? 0;
  const supplierTotal = supplierData?.total_amount ?? supplierData?.total ?? 0;
  const flux = supplierTotal - clientTotal;
  const currency = clientData?.currency ?? supplierData?.currency ?? "EUR";

  return (
    <section className={INSTRUMENT_CARD_BASE}>
      {cardId && onNavigateToCard && (
        <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} onBackToCockpit={onBackToCockpit} />
      )}
      <InstrumentCardHeader
        icon={iconNode}
        title="REMBOURSEMENTS"
        kpiLabel="Solde remboursements"
        kpiValue={
          <span className={flux === 0 ? "text-[var(--text-secondary)]" : "text-[var(--accent)]"}>
            {formatSignedAmount(flux)}
          </span>
        }
      />
      <div className="space-y-2 text-sm font-semibold text-[var(--text-secondary)]">
        <div className="flex justify-between">
          <span>Remboursements clients</span>
          <span className="tabular-nums">{formatSignedAmount(-clientTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Remboursements fournisseurs</span>
          <span className="tabular-nums">{formatSignedAmount(supplierTotal)}</span>
        </div>
      </div>

      <CardChartSection
        storageKey="linky-refunds-chart-expanded"
        sectionTitle="Évolution"
        chartType={chartType}
        onChartTypeChange={onChartTypeChange ?? (() => {})}
        chartGranularity={chartGranularity}
        onChartGranularityChange={onChartGranularityChange ?? (() => {})}
        availableGranularities={availableGranularities}
        whyContent={whyContent}
      >
        <DualSeriesChart
          series1={toPositiveSeries(clientData?.series ?? [])}
          series2={toPositiveSeries(supplierData?.series ?? [])}
          total1={Math.abs(clientTotal)}
          total2={Math.abs(supplierTotal)}
          label1="Remboursements clients"
          label2="Remboursements fournisseurs"
          granularity={chartGranularity}
          chartType={chartType}
          currency={currency}
        />
      </CardChartSection>
      <InstrumentCardFooter meta="Période : exercice à date · Source Vault" />
      {footer}
    </section>
  );
}
