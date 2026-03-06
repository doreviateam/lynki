"use client";

import { DualSeriesChart } from "@/components/DualSeriesChart";
import type { SeriesPoint } from "@/app/types/aggregations";
import { toPositiveSeries } from "@/app/lib/chart-utils";
import type { ChartGranularity } from "@/app/lib/chart-granularity";
import type { ChartType } from "@/app/lib/chart-type";

interface BusinessChartProps {
  salesSeries: SeriesPoint[];
  purchasesSeries: SeriesPoint[];
  salesTotal: number;
  purchasesTotal: number;
  granularity: ChartGranularity;
  chartType: ChartType;
  currency?: string;
  relativeTo100?: boolean;
}

export function BusinessChart(props: BusinessChartProps) {
  const purchasesSeriesNorm = toPositiveSeries(props.purchasesSeries);
  return (
    <DualSeriesChart
      {...props}
      series1={props.salesSeries}
      series2={purchasesSeriesNorm}
      total1={props.salesTotal}
      total2={props.purchasesTotal}
      label1="Ventes TTC"
      label2="Achats TTC"
      pieLabel1="Ventes HT"
      pieLabel2="Achats HT"
    />
  );
}
