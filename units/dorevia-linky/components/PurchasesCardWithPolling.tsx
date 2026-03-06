"use client";

import { useEffect, useState } from "react";
import { PurchasesCard } from "@/components/PurchasesCard";
import type { PurchasesAggregation } from "@/app/types/aggregations";
import { getDefaultPeriod } from "@/app/lib/period-utils";

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export interface PeriodRange {
  from: string;
  to: string;
}

interface PurchasesCardWithPollingProps {
  initialData: PurchasesAggregation | null;
  initialError?: string;
  initialPostedPurchasesCount: number | null;
  period?: PeriodRange;
  /** Company sélectionnée (invariant de session). Envoyé aux API quand défini. */
  companyId?: string | null;
  onEffectivePeriodChange?: (from: string, to: string) => void;
}

export function PurchasesCardWithPolling({
  initialData,
  initialError,
  initialPostedPurchasesCount,
  period = getDefaultPeriod(),
  companyId,
  onEffectivePeriodChange,
}: PurchasesCardWithPollingProps) {
  const [data, setData] = useState<PurchasesAggregation | null>(initialData);
  const [error, setError] = useState<string | undefined>(initialError);
  const [postedPurchasesCount, setPostedPurchasesCount] = useState<number | null>(
    initialPostedPurchasesCount
  );

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const params = new URLSearchParams({
          date_debut: period.from,
          date_fin: period.to,
          granularity: "month",
          ...(companyId && { company_id: companyId }),
        });
        const res = await fetch(`/api/purchases?${params.toString()}`, {
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
        setData(json as PurchasesAggregation);
        if (typeof json.posted_purchases_count === "number") {
          setPostedPurchasesCount(json.posted_purchases_count);
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

    fetchPurchases();
    const intervalId = setInterval(fetchPurchases, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [period.from, period.to, companyId, onEffectivePeriodChange]);

  return (
    <PurchasesCard
      data={data}
      error={error}
      loading={false}
      postedPurchasesCount={postedPurchasesCount}
    />
  );
}
