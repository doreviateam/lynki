"use client";

import { useEffect, useState, useCallback } from "react";
import { TaxesCard } from "@/components/TaxesCard";
import type { SalesAggregation, PurchasesAggregation } from "@/app/types/aggregations";
import { getDefaultPeriod } from "@/app/lib/period-utils";
import {
  getAvailableGranularities,
  getDefaultChartGranularity,
  type ChartGranularity,
} from "@/app/lib/chart-granularity";
import type { ChartType } from "@/app/lib/chart-type";

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export interface PeriodRange {
  from: string;
  to: string;
}

interface TaxesCardWithPollingProps {
  initialSalesData: SalesAggregation | null;
  initialPurchasesData: PurchasesAggregation | null;
  initialErrorSales?: string;
  initialErrorPurchases?: string;
  period?: PeriodRange;
  companyId?: string | null;
  tenantId?: string;
  onEffectivePeriodChange?: (from: string, to: string) => void;
  onFocusRequest?: () => void;
  footer?: React.ReactNode;
}

export function TaxesCardWithPolling({
  initialSalesData,
  initialPurchasesData,
  initialErrorSales,
  initialErrorPurchases,
  period = getDefaultPeriod(),
  companyId,
  tenantId,
  onEffectivePeriodChange,
  onFocusRequest,
  footer,
}: TaxesCardWithPollingProps) {
  const [salesData, setSalesData] = useState<SalesAggregation | null>(initialSalesData);
  const [purchasesData, setPurchasesData] = useState<PurchasesAggregation | null>(initialPurchasesData);
  const [errorSales, setErrorSales] = useState<string | undefined>(initialErrorSales);
  const [errorPurchases, setErrorPurchases] = useState<string | undefined>(initialErrorPurchases);
  const [loading, setLoading] = useState(!initialSalesData && !initialPurchasesData && !initialErrorSales && !initialErrorPurchases);

  const availableGranularities = getAvailableGranularities(period.from, period.to);
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>(() =>
    getDefaultChartGranularity(period.from, period.to)
  );

  useEffect(() => {
    const available = getAvailableGranularities(period.from, period.to);
    setChartGranularity((prev) =>
      available.includes(prev) ? prev : getDefaultChartGranularity(period.from, period.to)
    );
  }, [period.from, period.to]);

  const handleGranularityChange = useCallback((g: ChartGranularity) => setChartGranularity(g), []);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const handleChartTypeChange = useCallback((t: ChartType) => setChartType(t), []);

  useEffect(() => {
    setSalesData(null);
    setPurchasesData(null);
    setErrorSales(undefined);
    setErrorPurchases(undefined);
    setLoading(true);
    const fetchBoth = async () => {
      const params = new URLSearchParams({
        date_debut: period.from,
        date_fin: period.to,
        granularity: chartGranularity,
        ...(companyId && { company_id: companyId }),
      });
      try {
        const [resSales, resPurchases] = await Promise.all([
          fetch(`/api/sales?${params.toString()}`, { cache: "no-store", headers: { Accept: "application/json" } }),
          fetch(`/api/purchases?${params.toString()}`, { cache: "no-store", headers: { Accept: "application/json" } }),
        ]);
        const jsonSales = await resSales.json();
        const jsonPurchases = await resPurchases.json();
        if (!resSales.ok) {
          setErrorSales(jsonSales?.error ?? "Erreur");
          setSalesData(null);
        } else {
          setErrorSales(undefined);
          setSalesData(jsonSales as SalesAggregation);
        }
        if (!resPurchases.ok) {
          setErrorPurchases(jsonPurchases?.error ?? "Erreur");
          setPurchasesData(null);
        } else {
          setErrorPurchases(undefined);
          setPurchasesData(jsonPurchases as PurchasesAggregation);
        }
        const def = getDefaultPeriod();
        const payload = resSales.ok ? jsonSales : resPurchases.ok ? jsonPurchases : null;
        if (onEffectivePeriodChange && period.from === def.from && period.to === def.to && payload?.effective_from && payload?.effective_to) {
          onEffectivePeriodChange(payload.effective_from, payload.effective_to);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur réseau";
        setErrorSales(msg);
        setErrorPurchases(msg);
        setSalesData(null);
        setPurchasesData(null);
      }
      setLoading(false);
    };

    fetchBoth();
    const intervalId = setInterval(fetchBoth, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [period.from, period.to, companyId, chartGranularity, onEffectivePeriodChange]);

  return (
    <TaxesCard
      salesData={salesData}
      purchasesData={purchasesData}
      loading={loading}
      errorSales={errorSales}
      errorPurchases={errorPurchases}
      chartGranularity={chartGranularity}
      availableGranularities={availableGranularities}
      onChartGranularityChange={handleGranularityChange}
      chartType={chartType}
      onChartTypeChange={handleChartTypeChange}
      whyContent={{
        periodLabel: `Du ${period.from} au ${period.to}`,
        tenantId: tenantId ?? undefined,
        dataSource: "Vault (agrégations)",
        calculationRule: "TTC, prorata TVA",
      }}
      onFocusRequest={onFocusRequest}
      footer={footer}
    />
  );
}
