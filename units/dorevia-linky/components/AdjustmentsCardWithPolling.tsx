"use client";

import { useEffect, useState } from "react";
import { AdjustmentsCard } from "@/components/AdjustmentsCard";
import type { AdjustmentsAggregation } from "@/app/types/aggregations";
import { getDefaultPeriod } from "@/app/lib/period-utils";

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export interface PeriodRange {
  from: string;
  to: string;
}

const EVENT_TYPES = [
  "refund.customer.paid",
  "refund.supplier.received",
  "credit_note.customer.issued",
  "credit_note.supplier.received",
] as const;

interface AdjustmentsCardWithPollingProps {
  title: string;
  eventType: (typeof EVENT_TYPES)[number];
  initialData: AdjustmentsAggregation | null;
  initialError?: string;
  period?: PeriodRange;
  companyId?: string | null;
}

export function AdjustmentsCardWithPolling({
  title,
  eventType,
  initialData,
  initialError,
  period = getDefaultPeriod(),
  companyId,
}: AdjustmentsCardWithPollingProps) {
  const [data, setData] = useState<AdjustmentsAggregation | null>(initialData);
  const [error, setError] = useState<string | undefined>(initialError);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          date_debut: period.from,
          date_fin: period.to,
          granularity: "month",
          event_type: eventType,
          ...(companyId && { company_id: companyId }),
        });
        const res = await fetch(`/api/adjustments?${params.toString()}`, {
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
        setData(json as AdjustmentsAggregation);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur réseau");
        setData(null);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [eventType, period.from, period.to, companyId]);

  return (
    <AdjustmentsCard
      title={title}
      data={data}
      error={error}
      loading={false}
      periodFrom={period.from}
      periodTo={period.to}
    />
  );
}
