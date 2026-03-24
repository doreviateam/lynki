"use client";

import { useEffect, useState, useCallback } from "react";
import { WorkingCapitalCard } from "@/components/WorkingCapitalCard";
import type { ArByPartnerDetail } from "@/app/api/dashboard-metrics/route";
import type { SeriesPoint } from "@/app/types/aggregations";
import type { CardId } from "@/app/types/linky-tiles";

/** Réponse GET /api/stock-valuation (ZeDocs/web52 Option B) */
export interface StockValuationSnapshot {
  value: number;
  currency: string;
  as_of_date: string;
  company_id: string;
}

interface WorkingCapitalCardWithPollingProps {
  period: { from: string; to: string };
  companyId: string | null;
  tenantId: string;
  onFocusRequest?: () => void;
  cardId?: CardId;
  onNavigateToCard?: (cardId: CardId) => void;
  onBackToCockpit?: () => void;
}

export function WorkingCapitalCardWithPolling({
  period,
  companyId,
  tenantId,
  onFocusRequest,
  cardId,
  onNavigateToCard,
  onBackToCockpit,
}: WorkingCapitalCardWithPollingProps) {
  const [arData, setArData] = useState<ArByPartnerDetail | null>(null);
  const [apData, setApData] = useState<ArByPartnerDetail | null>(null);
  const [bfrSeries, setBfrSeries] = useState<SeriesPoint[]>([]);
  const [stockValuation, setStockValuation] = useState<StockValuationSnapshot | null>(null);
  const [evolutionError, setEvolutionError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
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

      const stockParams = new URLSearchParams({ tenant: tenantId, ...(companyId && { company_id: companyId }) });
      const [arRes, apRes, bfrEvolutionRes, stockRes] = await Promise.allSettled([
        fetch(`/api/ar-by-partner?${params}`, { cache: "no-store", headers: { Accept: "application/json" } }),
        fetch(`/api/ap-by-partner?${params}`, { cache: "no-store", headers: { Accept: "application/json" } }),
        fetch(`/api/bfr-evolution?${evolutionParams}`, { cache: "no-store", headers: { Accept: "application/json" } }),
        companyId
          ? fetch(`/api/stock-valuation?${stockParams}`, { cache: "no-store", headers: { Accept: "application/json" } })
          : Promise.resolve({ ok: false, status: 400 } as Response),
      ]);

      if (arRes.status === "fulfilled" && arRes.value.ok) {
        setArData((await arRes.value.json()) ?? null);
      } else {
        setArData(null);
      }
      if (apRes.status === "fulfilled" && apRes.value.ok) {
        setApData((await apRes.value.json()) ?? null);
      } else {
        setApData(null);
      }
      if (bfrEvolutionRes.status === "fulfilled" && bfrEvolutionRes.value.ok) {
        const ev = await bfrEvolutionRes.value.json();
        setBfrSeries(ev.series ?? []);
      } else {
        setBfrSeries([]);
        setEvolutionError(true);
      }
      if (stockRes.status === "fulfilled" && stockRes.value.ok) {
        const sv = await stockRes.value.json();
        setStockValuation(sv);
      } else {
        setStockValuation(null);
      }
    } catch {
      setArData(null);
      setApData(null);
      setBfrSeries([]);
      setStockValuation(null);
      setEvolutionError(true);
    } finally {
      setLoading(false);
    }
  }, [tenantId, period.from, period.to, companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <WorkingCapitalCard
      arByPartner={arData}
      apByPartner={apData}
      currency="EUR"
      loading={loading}
      onFocusRequest={onFocusRequest}
      cardId={cardId}
      onNavigateToCard={onNavigateToCard}
      onBackToCockpit={onBackToCockpit}
      bfrSeries={bfrSeries}
      stockValuation={stockValuation}
      evolutionError={evolutionError}
      onEvolutionRetry={fetchData}
    />
  );
}
