"use client";

import type { SalesAggregation, PurchasesAggregation } from "@/app/types/aggregations";
import { formatSignedAmount } from "@/app/lib/format";
import { TaxesChart } from "@/components/TaxesChart";
import { CardChartSection, type WhyContent } from "@/components/CardChartSection";
import { IconTaxes } from "@/components/CardIcons";
import {
  INSTRUMENT_CARD_BASE,
  InstrumentCardHeader,
  InstrumentCardNav,
  InstrumentCardFooter,
} from "@/components/InstrumentCardChrome";
import type { CardId } from "@/app/types/linky-tiles";
import type { ChartGranularity } from "@/app/lib/chart-granularity";
import type { ChartType } from "@/app/lib/chart-type";

interface TaxesCardProps {
  salesData: SalesAggregation | null;
  purchasesData: PurchasesAggregation | null;
  loading?: boolean;
  errorSales?: string;
  errorPurchases?: string;
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
}

export function TaxesCard({
  salesData,
  purchasesData,
  loading,
  errorSales,
  errorPurchases,
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
}: TaxesCardProps) {
  const error = errorSales || errorPurchases;

  const iconNode = onFocusRequest ? (
    <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label="Ouvrir la card Taxes">
      <IconTaxes className="h-6 w-6 shrink-0 text-[var(--accent)]" />
    </button>
  ) : (
    <IconTaxes className="h-6 w-6 shrink-0 text-[var(--accent)]" />
  );

  if (loading) {
    return (
      <section className={INSTRUMENT_CARD_BASE}>
        {cardId && onNavigateToCard && (
          <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
        )}
        <InstrumentCardHeader icon={iconNode} title="TAXES" kpiValue={<div className="skeleton h-6 w-28" />} />
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <div className="skeleton h-4 w-28" />
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
        <InstrumentCardHeader icon={iconNode} title="TAXES" />
        <p className="text-[var(--negative)]">{error}</p>
      </section>
    );
  }

  const tvaCollectee = salesData?.total_tax ?? 0;
  const tvaDeductible = purchasesData?.total_tax ?? 0;
  const flux = tvaCollectee - tvaDeductible;
  const salesTotalTtc = salesData?.total ?? salesData?.total_ht ?? 0;
  const purchasesTotalTtc = purchasesData?.total ?? purchasesData?.total_ht ?? 0;
  const currency = salesData?.currency ?? purchasesData?.currency ?? "EUR";

  return (
    <section className={INSTRUMENT_CARD_BASE}>
      {cardId && onNavigateToCard && (
        <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
      )}
      <InstrumentCardHeader
        icon={iconNode}
        title="TAXES"
        kpiLabel="Solde taxes"
        kpiValue={
          <span className={flux === 0 ? "text-[var(--text-secondary)]" : "text-[var(--accent)]"}>
            {formatSignedAmount(flux)}
          </span>
        }
      />
      <div className="space-y-2 text-sm font-semibold text-[var(--text-secondary)]">
        <div className="flex justify-between">
          <span>Taxes collectées</span>
          <span className="tabular-nums">{formatSignedAmount(tvaCollectee)}</span>
        </div>
        <div className="flex justify-between">
          <span>Taxes déductibles</span>
          <span className="tabular-nums">{formatSignedAmount(-tvaDeductible)}</span>
        </div>
      </div>

      <CardChartSection
        storageKey="linky-taxes-chart-expanded"
        sectionTitle="Évolution"
        chartType={chartType}
        onChartTypeChange={onChartTypeChange ?? (() => {})}
        chartGranularity={chartGranularity}
        onChartGranularityChange={onChartGranularityChange ?? (() => {})}
        availableGranularities={availableGranularities}
        whyContent={whyContent}
      >
        <TaxesChart
          salesSeries={salesData?.series ?? []}
          purchasesSeries={purchasesData?.series ?? []}
          taxesCollectees={tvaCollectee}
          taxesDeductibles={tvaDeductible}
          salesTotalTtc={salesTotalTtc}
          purchasesTotalTtc={purchasesTotalTtc}
          granularity={chartGranularity}
          chartType={chartType}
          currency={currency}
        />
      </CardChartSection>
      <InstrumentCardFooter meta="Période : exercice à date · Source Odoo / Vault" />
      {footer}
    </section>
  );
}
