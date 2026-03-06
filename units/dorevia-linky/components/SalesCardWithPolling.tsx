"use client";

import { useEffect, useState } from "react";
import { SalesCard } from "@/components/SalesCard";
import type { SalesAggregation } from "@/app/types/aggregations";
import { getDefaultPeriod } from "@/app/lib/period-utils";

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export interface PeriodRange {
  from: string;
  to: string;
}

interface SalesCardWithPollingProps {
  initialData: SalesAggregation | null;
  initialError?: string;
  initialPostedSalesCount: number | null;
  period?: PeriodRange;
  /** Company sélectionnée (invariant de session). Envoyé aux API quand défini. */
  companyId?: string | null;
  /** Appelé quand les données renvoient effective_from/to (ex. "Toutes périodes") pour l’en-tête. */
  onEffectivePeriodChange?: (from: string, to: string) => void;
}

export function SalesCardWithPolling({
  initialData,
  initialError,
  initialPostedSalesCount,
  period = getDefaultPeriod(),
  companyId,
  onEffectivePeriodChange,
}: SalesCardWithPollingProps) {
  const [data, setData] = useState<SalesAggregation | null>(initialData);
  const [error, setError] = useState<string | undefined>(initialError);
  const [postedSalesCount, setPostedSalesCount] = useState<number | null>(
    initialPostedSalesCount
  );

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const params = new URLSearchParams({
          date_debut: period.from,
          date_fin: period.to,
          granularity: "month",
          ...(companyId && { company_id: companyId }),
        });
        const res = await fetch(`/api/sales?${params.toString()}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error ?? "Erreur");
          setData(null);
          return;
        }
        setError(undefined);
        setData(json as SalesAggregation);
        if (typeof json.posted_sales_count === "number") {
          setPostedSalesCount(json.posted_sales_count);
        }
        const def = getDefaultPeriod();
        if (
          onEffectivePeriodChange &&
          period.from === def.from &&
          period.to === def.to &&
          json.effective_from &&
          json.effective_to
        ) {
          onEffectivePeriodChange(json.effective_from, json.effective_to);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur réseau");
        setData(null);
      }
    };

    fetchSales();
    const intervalId = setInterval(fetchSales, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [period.from, period.to, companyId, onEffectivePeriodChange]);

  return (
    <SalesCard
      data={data}
      error={error}
      loading={false}
      postedSalesCount={postedSalesCount}
    />
  );
}
