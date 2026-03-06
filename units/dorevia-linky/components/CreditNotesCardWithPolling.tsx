"use client";

import { useEffect, useState, useCallback } from "react";
import { CreditNotesCard } from "@/components/CreditNotesCard";
import type { AdjustmentsAggregation } from "@/app/types/aggregations";
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

interface CreditNotesCardWithPollingProps {
  initialClientData: AdjustmentsAggregation | null;
  initialSupplierData: AdjustmentsAggregation | null;
  initialErrorClient?: string;
  initialErrorSupplier?: string;
  period?: PeriodRange;
  companyId?: string | null;
  tenantId?: string;
  onFocusRequest?: () => void;
  footer?: React.ReactNode;
}

export function CreditNotesCardWithPolling({
  initialClientData,
  initialSupplierData,
  initialErrorClient,
  initialErrorSupplier,
  period = getDefaultPeriod(),
  companyId,
  tenantId,
  onFocusRequest,
  footer,
}: CreditNotesCardWithPollingProps) {
  const [clientData, setClientData] = useState<AdjustmentsAggregation | null>(initialClientData);
  const [supplierData, setSupplierData] = useState<AdjustmentsAggregation | null>(initialSupplierData);
  const [errorClient, setErrorClient] = useState<string | undefined>(initialErrorClient);
  const [errorSupplier, setErrorSupplier] = useState<string | undefined>(initialErrorSupplier);
  const [loading, setLoading] = useState(!initialClientData && !initialSupplierData && !initialErrorClient && !initialErrorSupplier);

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
    setClientData(null);
    setSupplierData(null);
    setErrorClient(undefined);
    setErrorSupplier(undefined);
    setLoading(true);
    const fetchBoth = async () => {
      const baseParams = {
        date_debut: period.from,
        date_fin: period.to,
        granularity: chartGranularity,
        ...(companyId && { company_id: companyId }),
      };
      try {
        const [resClient, resSupplier] = await Promise.all([
          fetch(`/api/adjustments?${new URLSearchParams({ ...baseParams, event_type: "credit_note.customer.issued" }).toString()}`, {
            cache: "no-store",
            headers: { Accept: "application/json" },
          }),
          fetch(`/api/adjustments?${new URLSearchParams({ ...baseParams, event_type: "credit_note.supplier.received" }).toString()}`, {
            cache: "no-store",
            headers: { Accept: "application/json" },
          }),
        ]);
        const jsonClient = await resClient.json();
        const jsonSupplier = await resSupplier.json();
        if (!resClient.ok) {
          setErrorClient(jsonClient?.error ?? "Erreur");
          setClientData(null);
        } else {
          setErrorClient(undefined);
          setClientData(jsonClient as AdjustmentsAggregation);
        }
        if (!resSupplier.ok) {
          setErrorSupplier(jsonSupplier?.error ?? "Erreur");
          setSupplierData(null);
        } else {
          setErrorSupplier(undefined);
          setSupplierData(jsonSupplier as AdjustmentsAggregation);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur réseau";
        setErrorClient(msg);
        setErrorSupplier(msg);
        setClientData(null);
        setSupplierData(null);
      }
      setLoading(false);
    };

    fetchBoth();
    const intervalId = setInterval(fetchBoth, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [period.from, period.to, companyId, chartGranularity]);

  return (
    <CreditNotesCard
      clientData={clientData}
      supplierData={supplierData}
      loading={loading}
      errorClient={errorClient}
      errorSupplier={errorSupplier}
      chartGranularity={chartGranularity}
      availableGranularities={availableGranularities}
      onChartGranularityChange={handleGranularityChange}
      chartType={chartType}
      onChartTypeChange={handleChartTypeChange}
      whyContent={{
        periodLabel: `Du ${period.from} au ${period.to}`,
        tenantId: tenantId ?? undefined,
        dataSource: "Vault (agrégations)",
        calculationRule: "TTC, scellé",
      }}
      onFocusRequest={onFocusRequest}
      footer={footer}
    />
  );
}
