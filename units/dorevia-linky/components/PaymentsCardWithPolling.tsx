"use client";

import { useEffect, useState } from "react";
import { PaymentsCard } from "@/components/PaymentsCard";
import type { PaymentsAggregation } from "@/app/types/aggregations";
import { getDefaultPeriod } from "@/app/lib/period-utils";

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export interface PeriodRange {
  from: string;
  to: string;
}

interface PaymentsCardWithPollingProps {
  title: string;
  apiPath: "payments-in" | "payments-out";
  initialData: PaymentsAggregation | null;
  initialError?: string;
  period?: PeriodRange;
  companyId?: string | null;
  onEffectivePeriodChange?: (from: string, to: string) => void;
}

export function PaymentsCardWithPolling({
  title,
  apiPath,
  initialData,
  initialError,
  period = getDefaultPeriod(),
  companyId,
  onEffectivePeriodChange,
}: PaymentsCardWithPollingProps) {
  const [data, setData] = useState<PaymentsAggregation | null>(initialData);
  const [error, setError] = useState<string | undefined>(initialError);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          date_debut: period.from,
          date_fin: period.to,
          granularity: "month",
          ...(companyId && { company_id: companyId }),
        });
        const res = await fetch(`/api/${apiPath}?${params.toString()}`, {
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
        setData(json as PaymentsAggregation);
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

    fetchData();
    const intervalId = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [apiPath, period.from, period.to, companyId, onEffectivePeriodChange]);

  return (
    <PaymentsCard
      title={title}
      data={data}
      error={error}
      loading={false}
      accent={apiPath === "payments-out" ? "out" : "in"}
    />
  );
}
