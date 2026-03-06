"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { TresoreriePositionCard, type TresoreriePositionData } from "@/components/TresoreriePositionCard";

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

interface TresoreriePositionCardWithPollingProps {
  tenantId: string;
  companyId: string | null;
  footer?: React.ReactNode;
}

export function TresoreriePositionCardWithPolling({
  tenantId,
  companyId,
  footer,
}: TresoreriePositionCardWithPollingProps) {
  const [data, setData] = useState<TresoreriePositionData | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!data) setLoading(true);
    const params = new URLSearchParams({ tenant: tenantId });
    if (companyId != null && companyId !== "") {
      params.set("company_id", companyId);
    }
    try {
      const res = await fetch(`/api/treasury?${params}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId, companyId]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    fetchData();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);
  }, [fetchData]);

  return (
    <TresoreriePositionCard
      data={data}
      loading={loading}
      onRefresh={handleRefresh}
      footer={footer}
    />
  );
}
