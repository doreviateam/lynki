"use client";

import type { AdjustmentsAggregation } from "@/app/types/aggregations";
import { formatSignedAmount } from "@/app/lib/format";
import { toPositiveSeries } from "@/app/lib/chart-utils";
import { DualSeriesChart } from "@/components/DualSeriesChart";
import { CardChartSection, type WhyContent } from "@/components/CardChartSection";
import { IconCreditNotes } from "@/components/CardIcons";
import type { ChartGranularity } from "@/app/lib/chart-granularity";
import type { ChartType } from "@/app/lib/chart-type";

interface CreditNotesCardProps {
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
}

const CARD_BASE =
  "rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] border-l-4";
const SECTION_TITLE_TEXT =
  "text-lg font-bold uppercase tracking-wide text-[var(--accent)]";

export function CreditNotesCard({
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
}: CreditNotesCardProps) {
  const error = errorClient || errorSupplier;

  if (loading) {
    return (
      <section className={`${CARD_BASE} border-l-[var(--muted)]`}>
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            {onFocusRequest ? (
              <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label="Ouvrir la card Notes de crédit">
                <IconCreditNotes className="h-6 w-6 shrink-0 text-[var(--accent)]" />
              </button>
            ) : (
              <IconCreditNotes className="h-6 w-6 shrink-0 text-[var(--accent)]" />
            )}
            <span className={SECTION_TITLE_TEXT}>Notes de crédit</span>
          </div>
          <div className="skeleton h-5 w-28" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="skeleton h-4 w-24" />
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
      <section className={`${CARD_BASE} border-l-[var(--negative)] border-[var(--border-error)] bg-[var(--negative-soft)]`}>
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-4">
          {onFocusRequest ? (
            <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label="Ouvrir la card Notes de crédit">
              <IconCreditNotes className="h-6 w-6 shrink-0 text-[var(--accent)]" />
            </button>
          ) : (
            <IconCreditNotes className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          )}
          <span className={SECTION_TITLE_TEXT}>Notes de crédit</span>
        </div>
        <p className="text-[var(--negative)]">{error}</p>
      </section>
    );
  }

  const clientTotal = clientData?.total_amount ?? clientData?.total ?? 0;
  const supplierTotal = supplierData?.total_amount ?? supplierData?.total ?? 0;
  const flux = supplierTotal - clientTotal;
  const currency = clientData?.currency ?? supplierData?.currency ?? "EUR";

  return (
    <section
      className={`${CARD_BASE} ${flux === 0 ? "border-l-[var(--accent-soft)]" : "border-l-[var(--accent)]"}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {onFocusRequest ? (
            <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label="Ouvrir la card Notes de crédit">
              <IconCreditNotes className="h-6 w-6 shrink-0 text-[var(--accent)]" />
            </button>
          ) : (
            <IconCreditNotes className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          )}
          <span className={SECTION_TITLE_TEXT}>Notes de crédit</span>
        </div>
        <span className={`text-lg font-bold tabular-nums shrink-0 ${flux === 0 ? "text-[var(--accent-soft)]" : "text-[var(--accent)]"}`}>
          {formatSignedAmount(flux)}
        </span>
      </div>
      <div className="space-y-2 text-sm font-semibold text-[var(--text-secondary)]">
        <div className="flex justify-between">
          <span>Avoirs clients</span>
          <span className="tabular-nums">{formatSignedAmount(-clientTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Avoirs fournisseurs</span>
          <span className="tabular-nums">{formatSignedAmount(supplierTotal)}</span>
        </div>
      </div>

      <CardChartSection
        storageKey="linky-credit-notes-chart-expanded"
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
          label1="Avoirs clients"
          label2="Avoirs fournisseurs"
          granularity={chartGranularity}
          chartType={chartType}
          currency={currency}
        />
      </CardChartSection>
      {footer}
    </section>
  );
}
