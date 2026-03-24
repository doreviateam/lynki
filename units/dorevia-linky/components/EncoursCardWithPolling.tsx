"use client";

import { useEffect, useState, useCallback } from "react";
import { EncoursCard } from "@/components/EncoursCard";
import type { ArByPartnerDetail } from "@/app/api/dashboard-metrics/route";
import type { SeriesPoint } from "@/app/types/aggregations";
import type { CardId } from "@/app/types/linky-tiles";

interface EncoursCardWithPollingProps {
  period: { from: string; to: string };
  companyId: string | null;
  tenantId: string;
  onFocusRequest?: () => void;
  cardId?: CardId;
  onNavigateToCard?: (cardId: CardId) => void;
  onBackToCockpit?: () => void;
}

export function EncoursCardWithPolling({
  period,
  companyId,
  tenantId,
  onFocusRequest,
  cardId,
  onNavigateToCard,
  onBackToCockpit,
}: EncoursCardWithPollingProps) {
  const [arData, setArData] = useState<ArByPartnerDetail | null>(null);
  const [arSeries, setArSeries] = useState<SeriesPoint[]>([]);
  const [evolutionError, setEvolutionError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    setEvolutionError(false);
    try {
      const params = new URLSearchParams({
        tenant: tenantId,
        date_debut: period.from,
        date_fin: period.to,
        overdue: "false",
        limit: "50",
        ...(companyId && { company_id: companyId }),
      });
      const evolutionParams = new URLSearchParams({
        tenant: tenantId,
        date_debut: period.from,
        date_fin: period.to,
        ...(companyId && { company_id: companyId }),
      });
      const [arRes, evolutionRes] = await Promise.all([
        fetch(`/api/ar-by-partner?${params}`, { cache: "no-store", headers: { Accept: "application/json" } }),
        fetch(`/api/ar-evolution?${evolutionParams}`, { cache: "no-store", headers: { Accept: "application/json" } }),
      ]);
      if (arRes.ok) {
        const d = await arRes.json();
        setArData(d ?? null);
      } else {
        setArData(null);
        setError(true);
      }
      if (evolutionRes.ok) {
        const ev = await evolutionRes.json();
        setArSeries(ev.series ?? []);
      } else {
        setArSeries([]);
        setEvolutionError(true);
      }
    } catch {
      setArData(null);
      setArSeries([]);
      setError(true);
      setEvolutionError(true);
    } finally {
      setLoading(false);
    }
  }, [tenantId, period.from, period.to, companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <EncoursCard
      arByPartner={arData}
      currency="EUR"
      loading={loading}
      error={error}
      onFocusRequest={onFocusRequest}
      cardId={cardId}
      onNavigateToCard={onNavigateToCard}
      onBackToCockpit={onBackToCockpit}
      arSeries={arSeries}
      evolutionError={evolutionError}
      onEvolutionRetry={fetchData}
    />
  );
}
