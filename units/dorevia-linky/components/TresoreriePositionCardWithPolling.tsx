"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { TresoreriePositionCard, type TresoreriePositionData } from "@/components/TresoreriePositionCard";
import type { SeriesPoint } from "@/app/types/aggregations";

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const ENABLE_LIVE_POLLING = process.env.NEXT_PUBLIC_LINKY_ENABLE_LIVE_POLLING === "1";

import type { CardId } from "@/app/types/linky-tiles";

/** Période pour la série Évolution (date_debut / date_fin) */
interface PeriodRange {
  from: string;
  to: string;
}

function defaultEvolutionPeriod(): PeriodRange {
  const to = new Date();
  const from = new Date(to);
  from.setFullYear(from.getFullYear() - 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

interface TresoreriePositionCardWithPollingProps {
  tenantId: string;
  companyId: string | null;
  /** Période pour le bloc Évolution (série). Si absent, dernière année. */
  period?: PeriodRange;
  footer?: React.ReactNode;
  cardId?: CardId;
  onNavigateToCard?: (cardId: CardId) => void;
  onBackToCockpit?: () => void;
}

export function TresoreriePositionCardWithPolling({
  tenantId,
  companyId,
  period,
  footer,
  cardId,
  onNavigateToCard,
  onBackToCockpit,
}: TresoreriePositionCardWithPollingProps) {
  const [data, setData] = useState<TresoreriePositionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [treasurySeries, setTreasurySeries] = useState<SeriesPoint[]>([]);
  const [evolutionError, setEvolutionError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const periodToUse = period ?? defaultEvolutionPeriod();

  const fetchData = useCallback(async () => {
    if (!data) setLoading(true);
    const params = new URLSearchParams({ tenant: tenantId });
    if (companyId != null && companyId !== "") {
      params.set("company_id", companyId);
    }
    // Aligner période treasury (et payroll côté API) sur la période du bloc Évolution (MINI_SPEC couverture structurelle)
    params.set("date_debut", periodToUse.from);
    params.set("date_fin", periodToUse.to);
    try {
      const [treasuryRes, evolutionRes] = await Promise.all([
        fetch(`/api/treasury?${params}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        }),
        fetch(
          `/api/treasury-evolution?${new URLSearchParams({
            tenant: tenantId,
            date_debut: periodToUse.from,
            date_fin: periodToUse.to,
            ...(companyId != null && companyId !== "" && { company_id: companyId }),
          })}`,
          { cache: "no-store", headers: { Accept: "application/json" } }
        ),
      ]);
      const json = await treasuryRes.json();
      setData(json);
      setEvolutionError(false);
      if (evolutionRes.ok) {
        const ev = await evolutionRes.json();
        setTreasurySeries(ev.series ?? []);
      } else {
        setTreasurySeries([]);
        setEvolutionError(true);
      }
    } catch {
      setData(null);
      setTreasurySeries([]);
      setEvolutionError(true);
    } finally {
      setLoading(false);
    }
  }, [tenantId, companyId, periodToUse.from, periodToUse.to]);

  useEffect(() => {
    fetchData();
    if (ENABLE_LIVE_POLLING) {
      intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    fetchData();
    if (ENABLE_LIVE_POLLING) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);
    }
  }, [fetchData]);

  return (
    <TresoreriePositionCard
      data={data}
      loading={loading}
      onRefresh={handleRefresh}
      footer={footer}
      cardId={cardId}
      onNavigateToCard={onNavigateToCard}
      onBackToCockpit={onBackToCockpit}
      treasurySeries={treasurySeries}
      evolutionError={evolutionError}
      onEvolutionRetry={handleRefresh}
    />
  );
}
