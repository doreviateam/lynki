"use client";

import { useMemo } from "react";
import { DualSeriesChart } from "@/components/DualSeriesChart";
import type { SeriesPoint } from "@/app/types/aggregations";
import { toPositiveSeries } from "@/app/lib/chart-utils";
import type { ChartGranularity } from "@/app/lib/chart-granularity";
import type { ChartType } from "@/app/lib/chart-type";

interface TaxesChartProps {
  salesSeries: SeriesPoint[];
  purchasesSeries: SeriesPoint[];
  taxesCollectees: number;
  taxesDeductibles: number;
  salesTotalTtc: number;
  purchasesTotalTtc: number;
  granularity: ChartGranularity;
  chartType: ChartType;
  currency?: string;
  relativeTo100?: boolean;
}

/** Dérive une série de montants de taxe à partir d'une série TTC en proratisant le total_tax. */
function prorateTaxSeries(series: SeriesPoint[], totalTtc: number, totalTax: number): SeriesPoint[] {
  if (totalTtc <= 0 || totalTax <= 0) return series.map((p) => ({ ...p, amount: 0 }));
  const ratio = totalTax / totalTtc;
  return series.map((p) => ({ period: p.period, amount: Math.round(p.amount * ratio * 100) / 100 }));
}

export function TaxesChart({
  salesSeries,
  purchasesSeries,
  taxesCollectees,
  taxesDeductibles,
  salesTotalTtc,
  purchasesTotalTtc,
  granularity,
  chartType,
  currency = "EUR",
  relativeTo100,
}: TaxesChartProps) {
  const taxCollecteesSeries = useMemo(
    () =>
      prorateTaxSeries(
        toPositiveSeries(salesSeries),
        Math.abs(salesTotalTtc),
        Math.abs(taxesCollectees)
      ),
    [salesSeries, salesTotalTtc, taxesCollectees]
  );
  const taxDeductiblesSeries = useMemo(
    () =>
      prorateTaxSeries(
        toPositiveSeries(purchasesSeries),
        Math.abs(purchasesTotalTtc),
        Math.abs(taxesDeductibles)
      ),
    [purchasesSeries, purchasesTotalTtc, taxesDeductibles]
  );

  return (
    <DualSeriesChart
      series1={taxCollecteesSeries}
      series2={taxDeductiblesSeries}
      total1={Math.abs(taxesCollectees)}
      total2={Math.abs(taxesDeductibles)}
      label1="Taxes collectées"
      label2="Taxes déductibles"
      granularity={granularity}
      chartType={chartType}
      currency={currency}
      relativeTo100={relativeTo100}
    />
  );
}
