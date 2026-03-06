"use client";

import { useEffect, useState, useCallback } from "react";
import { FluxCashCard } from "@/components/FluxCashCard";
import type { PaymentsAggregation } from "@/app/types/aggregations";
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

interface FluxCashCardWithPollingProps {
  initialDataIn: PaymentsAggregation | null;
  initialDataOut: PaymentsAggregation | null;
  initialErrorIn?: string;
  initialErrorOut?: string;
  period?: PeriodRange;
  companyId?: string | null;
  tenantId?: string;
  onEffectivePeriodChange?: (from: string, to: string) => void;
  onFocusRequest?: () => void;
  footer?: React.ReactNode;
}

export function FluxCashCardWithPolling({
  initialDataIn,
  initialDataOut,
  initialErrorIn,
  initialErrorOut,
  period = getDefaultPeriod(),
  companyId,
  tenantId,
  onEffectivePeriodChange,
  onFocusRequest,
  footer,
}: FluxCashCardWithPollingProps) {
  const [dataIn, setDataIn] = useState<PaymentsAggregation | null>(initialDataIn);
  const [dataOut, setDataOut] = useState<PaymentsAggregation | null>(initialDataOut);
  const [errorIn, setErrorIn] = useState<string | undefined>(initialErrorIn);
  const [errorOut, setErrorOut] = useState<string | undefined>(initialErrorOut);
  const [loading, setLoading] = useState(!initialDataIn && !initialDataOut && !initialErrorIn && !initialErrorOut);

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
    setDataIn(null);
    setDataOut(null);
    setErrorIn(undefined);
    setErrorOut(undefined);
    setLoading(true);
    const fetchBoth = async () => {
      const params = new URLSearchParams({
        tenant: tenantId ?? "core",
        date_debut: period.from,
        date_fin: period.to,
        granularity: chartGranularity,
        ...(companyId && { company_id: companyId }),
      });
      try {
        const [resIn, resOut] = await Promise.all([
          fetch(`/api/payments-in?${params.toString()}`, { cache: "no-store", headers: { Accept: "application/json" } }),
          fetch(`/api/payments-out?${params.toString()}`, { cache: "no-store", headers: { Accept: "application/json" } }),
        ]);
        const jsonIn = await resIn.json();
        const jsonOut = await resOut.json();
        if (!resIn.ok) {
          setErrorIn(jsonIn?.error ?? "Erreur");
          setDataIn(null);
        } else {
          setErrorIn(undefined);
          setDataIn(jsonIn as PaymentsAggregation);
        }
        if (!resOut.ok) {
          setErrorOut(jsonOut?.error ?? "Erreur");
          setDataOut(null);
        } else {
          setErrorOut(undefined);
          setDataOut(jsonOut as PaymentsAggregation);
        }
        const def = getDefaultPeriod();
        const payload = resIn.ok ? jsonIn : resOut.ok ? jsonOut : null;
        if (onEffectivePeriodChange && period.from === def.from && period.to === def.to && payload?.effective_from && payload?.effective_to) {
          onEffectivePeriodChange(payload.effective_from, payload.effective_to);
        }
      } catch (err) {
        setErrorIn(err instanceof Error ? err.message : "Erreur réseau");
        setErrorOut(err instanceof Error ? err.message : "Erreur réseau");
        setDataIn(null);
        setDataOut(null);
      }
      setLoading(false);
    };

    fetchBoth();
    const intervalId = setInterval(fetchBoth, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [tenantId, period.from, period.to, companyId, chartGranularity, onEffectivePeriodChange]);

  return (
    <FluxCashCard
      paymentsIn={dataIn}
      paymentsOut={dataOut}
      loading={loading}
      errorIn={errorIn}
      errorOut={errorOut}
      chartGranularity={chartGranularity}
      availableGranularities={availableGranularities}
      onChartGranularityChange={handleGranularityChange}
      chartType={chartType}
      onChartTypeChange={handleChartTypeChange}
      whyContent={{
        periodLabel: `Du ${period.from} au ${period.to}`,
        tenantId: tenantId ?? undefined,
        dataSource: "Vault (payments-in, payments-out)",
        calculationRule: "TTC, scellé",
      }}
      onFocusRequest={onFocusRequest}
      footer={footer}
    />
  );
}
