"use client";

import type { PaymentsAggregation } from "@/app/types/aggregations";
import { formatSignedAmount } from "@/app/lib/format";
import { toPositiveSeries } from "@/app/lib/chart-utils";
import { DualSeriesChart } from "@/components/DualSeriesChart";
import { CardChartSection, type WhyContent } from "@/components/CardChartSection";
import { IconCash } from "@/components/CardIcons";
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
}

const CARD_BASE =
  "rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] border-l-4";

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
}: FluxCashCardProps) {
  const error = errorIn || errorOut;

  if (loading) {
    return (
      <section className={`${CARD_BASE} border-l-[var(--muted)]`}>
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <IconCash className="h-6 w-6 shrink-0 text-[var(--accent)]" />
            <span className="text-lg font-bold uppercase tracking-wide text-[var(--accent)]">Cash</span>
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
          <IconCash className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          <span className="text-lg font-bold uppercase tracking-wide text-[var(--accent)]">Cash</span>
        </div>
        <p className="text-[var(--negative)]">{error}</p>
      </section>
    );
  }

  const inTotal = paymentsIn?.total ?? 0;
  const outTotalRaw = paymentsOut?.total ?? 0;
  const outTotal = Math.abs(outTotalRaw);
  const net = inTotal - outTotal;
  const currency = paymentsIn?.currency ?? paymentsOut?.currency ?? "EUR";

  // Espèces / Banque (aligné Odoo)
  const hasByMethod =
    (paymentsIn?.by_method && Object.keys(paymentsIn.by_method).length > 0) ||
    (paymentsOut?.by_method && Object.keys(paymentsOut.by_method).length > 0);
  const cashIn = paymentsIn?.by_method?.cash ?? 0;
  const transferIn = paymentsIn?.by_method?.transfer ?? 0;
  const cashOut = paymentsOut?.by_method?.cash ?? 0;
  const transferOut = paymentsOut?.by_method?.transfer ?? 0;
  const checkIn = paymentsIn?.by_method?.check ?? 0;
  const checkOut = paymentsOut?.by_method?.check ?? 0;
  const hasCheck = checkIn > 0 || checkOut > 0;

  return (
    <section
      className={`${CARD_BASE} ${net >= 0 ? "border-l-[var(--positive)]" : "border-l-[var(--negative)]"}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {onFocusRequest ? (
            <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label="Ouvrir la card Cash">
              <IconCash className="h-6 w-6 shrink-0 text-[var(--accent)]" />
            </button>
          ) : (
            <IconCash className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          )}
          <span className="text-lg font-bold uppercase tracking-wide text-[var(--accent)]">Cash</span>
        </div>
        <span className={`text-lg font-bold tabular-nums shrink-0 ${net >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
          {formatSignedAmount(net)}
        </span>
      </div>
      <div className="space-y-2 text-sm font-semibold text-[var(--text-secondary)]">
        <div className="flex justify-between">
          <span>Encaissements</span>
          <span className="tabular-nums">{formatSignedAmount(inTotal)}</span>
        </div>
        {hasByMethod && (cashIn > 0 || transferIn > 0 || checkIn > 0) && (
          <div className="flex justify-between pl-3 text-xs text-[var(--text-muted)] font-normal">
            <span>
              Espèces / Banque{hasCheck ? " / Chèques" : ""}
            </span>
            <span className="tabular-nums">
              {formatSignedAmount(cashIn)} / {formatSignedAmount(transferIn)}
              {hasCheck ? ` / ${formatSignedAmount(checkIn)}` : ""}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Décaissements</span>
          <span className="tabular-nums">{formatSignedAmount(-outTotal)}</span>
        </div>
        {hasByMethod && (cashOut > 0 || transferOut > 0 || checkOut > 0) && (
          <div className="flex justify-between pl-3 text-xs text-[var(--text-muted)] font-normal">
            <span>
              Espèces / Banque{hasCheck ? " / Chèques" : ""}
            </span>
            <span className="tabular-nums">
              {formatSignedAmount(-cashOut)} / {formatSignedAmount(-transferOut)}
              {hasCheck ? ` / ${formatSignedAmount(-checkOut)}` : ""}
            </span>
          </div>
        )}
        {hasByMethod &&
          inTotal + outTotal > 0 &&
          cashIn === 0 &&
          cashOut === 0 &&
          (transferIn > 0 || transferOut > 0) && (
            <p className="mt-2 text-xs text-[var(--text-muted)] italic">
              Ventilation Espèces/Banque disponible pour les paiements postérieurs au 2026-02-28.
            </p>
          )}
      </div>

      <CardChartSection
        storageKey="linky-cash-chart-expanded"
        sectionTitle="Évolution"
        chartType={chartType}
        onChartTypeChange={onChartTypeChange ?? (() => {})}
        chartGranularity={chartGranularity}
        onChartGranularityChange={onChartGranularityChange ?? (() => {})}
        availableGranularities={availableGranularities}
        whyContent={whyContent}
      >
        <DualSeriesChart
          series1={toPositiveSeries(paymentsIn?.series ?? [])}
          series2={toPositiveSeries(paymentsOut?.series ?? [])}
          total1={Math.abs(inTotal)}
          total2={outTotal}
          label1="Encaissements"
          label2="Décaissements"
          granularity={chartGranularity}
          chartType={chartType}
          currency={currency}
        />
      </CardChartSection>
      {footer}
    </section>
  );
}
