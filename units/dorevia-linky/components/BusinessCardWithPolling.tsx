"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { BusinessCard } from "@/components/BusinessCard";
import type {
  SalesAggregation,
  PurchasesAggregation,
  SalesByPartnerResponse,
  ArByPartnerResponse,
} from "@/app/types/aggregations";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import { getDefaultPeriod } from "@/app/lib/period-utils";
import {
  getAvailableGranularities,
  getDefaultChartGranularity,
  type ChartGranularity,
} from "@/app/lib/chart-granularity";
import type { ChartType } from "@/app/lib/chart-type";

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const ENABLE_LIVE_POLLING = process.env.NEXT_PUBLIC_LINKY_ENABLE_LIVE_POLLING === "1";

export interface PeriodRange {
  from: string;
  to: string;
}

interface BusinessCardWithPollingProps {
  initialSalesData: SalesAggregation | null;
  initialPurchasesData: PurchasesAggregation | null;
  initialErrorSales?: string;
  initialErrorPurchases?: string;
  period?: PeriodRange;
  companyId?: string | null;
  tenantId?: string;
  /** Source : Linky ne voit que le Vault (toujours "vault") */
  primarySource?: "erp" | "vault";
  dashboardSnapshot?: DashboardMetricsResponse | null;
  onEffectivePeriodChange?: (from: string, to: string) => void;
  onFocusRequest?: () => void;
  footer?: React.ReactNode;
  cardId?: import("@/app/types/linky-tiles").CardId;
  onNavigateToCard?: (cardId: import("@/app/types/linky-tiles").CardId) => void;
}

export function BusinessCardWithPolling({
  initialSalesData,
  initialPurchasesData,
  initialErrorSales,
  initialErrorPurchases,
  period = getDefaultPeriod(),
  companyId,
  tenantId,
  primarySource = "vault",
  dashboardSnapshot,
  onEffectivePeriodChange,
  onFocusRequest,
  footer,
  cardId,
  onNavigateToCard,
}: BusinessCardWithPollingProps) {
  const requestSeqRef = useRef(0);
  const [salesData, setSalesData] = useState<SalesAggregation | null>(initialSalesData);
  const [purchasesData, setPurchasesData] = useState<PurchasesAggregation | null>(initialPurchasesData);
  const [salesByPartner, setSalesByPartner] = useState<SalesByPartnerResponse | null>(null);
  const [arByPartner, setArByPartner] = useState<ArByPartnerResponse | null>(null);
  const [errorSales, setErrorSales] = useState<string | undefined>(initialErrorSales);
  const [errorPurchases, setErrorPurchases] = useState<string | undefined>(initialErrorPurchases);
  const [dataSourceFallback, setDataSourceFallback] = useState(false);
  const [loading, setLoading] = useState(!initialSalesData && !initialPurchasesData && !initialErrorSales && !initialErrorPurchases);

  const availableGranularities = getAvailableGranularities(period.from, period.to);
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>(() =>
    getDefaultChartGranularity(period.from, period.to)
  );

  // Réinitialiser la granularité si la période change et que la courante n'est plus disponible
  useEffect(() => {
    const available = getAvailableGranularities(period.from, period.to);
    setChartGranularity((prev) =>
      available.includes(prev) ? prev : getDefaultChartGranularity(period.from, period.to)
    );
  }, [period.from, period.to]);

  const handleGranularityChange = useCallback((g: ChartGranularity) => setChartGranularity(g), []);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const handleChartTypeChange = useCallback((t: ChartType) => setChartType(t), []);
  const snapshotBusiness = dashboardSnapshot?._details?.business;
  const useSnapshotBusiness = Boolean(snapshotBusiness);

  useEffect(() => {
    if (!useSnapshotBusiness || !snapshotBusiness) return;
    const currency = snapshotBusiness.currency ?? "EUR";
    setSalesData({
      total_ht: snapshotBusiness.ventes ?? 0,
      currency,
      series: [],
      verifiable: true,
    } as SalesAggregation);
    setPurchasesData({
      total_ht: snapshotBusiness.achats ?? 0,
      currency,
      series: [],
      verifiable: true,
    } as PurchasesAggregation);
    setSalesByPartner((snapshotBusiness.sales_by_partner as SalesByPartnerResponse) ?? null);
    setArByPartner((snapshotBusiness.ar_by_partner as ArByPartnerResponse) ?? null);
    setErrorSales(undefined);
    setErrorPurchases(undefined);
    setDataSourceFallback(false);
    setLoading(false);
  }, [useSnapshotBusiness, snapshotBusiness]);

  useEffect(() => {
    if (useSnapshotBusiness) return;
    setSalesData(null);
    setPurchasesData(null);
    setErrorSales(undefined);
    setErrorPurchases(undefined);
    setSalesByPartner(null);
    setArByPartner(null);
    setLoading(true);
    const fetchBoth = async () => {
      const seq = ++requestSeqRef.current;
        const params = new URLSearchParams({
        tenant: tenantId ?? "core",
        date_debut: period.from,
        date_fin: period.to,
        granularity: chartGranularity,
        ...(companyId && { company_id: companyId }),
      });
      const partnerParams = new URLSearchParams({
        tenant: tenantId ?? "core",
        date_debut: period.from,
        date_fin: period.to,
        ...(companyId && { company_id: companyId }),
      });
      try {
        const [resSales, resPurchases, resSalesByPartner, resArByPartner] = await Promise.all([
          fetch(`/api/sales?${params.toString()}`, { cache: "no-store", headers: { Accept: "application/json" } }),
          fetch(`/api/purchases?${params.toString()}`, { cache: "no-store", headers: { Accept: "application/json" } }),
          fetch(`/api/sales-by-partner?${partnerParams.toString()}`, { cache: "no-store", headers: { Accept: "application/json" } }),
          fetch(`/api/ar-by-partner?${partnerParams.toString()}`, { cache: "no-store", headers: { Accept: "application/json" } }),
        ]);
        // Ignore les réponses d'une requête obsolète (changement rapide de filtres / refresh).
        if (seq !== requestSeqRef.current) return;
        // Linky ne récolte qu'au Vault : pas de fallback ERP, source toujours Vault
        setDataSourceFallback(false);
        const jsonSales = await resSales.json();
        const jsonPurchases = await resPurchases.json();
        if (!resSales.ok) {
          setErrorSales(jsonSales?.error ?? "Erreur");
          setSalesData(null);
        } else {
          setErrorSales(undefined);
          setSalesData(jsonSales as SalesAggregation);
        }
        if (!resPurchases.ok) {
          setErrorPurchases(jsonPurchases?.error ?? "Erreur");
          setPurchasesData(null);
        } else {
          setErrorPurchases(undefined);
          setPurchasesData(jsonPurchases as PurchasesAggregation);
        }
        if (resSalesByPartner.ok) {
          setSalesByPartner(await resSalesByPartner.json());
        } else {
          setSalesByPartner(null);
        }
        if (resArByPartner.ok) {
          setArByPartner(await resArByPartner.json());
        } else {
          setArByPartner(null);
        }
        const def = getDefaultPeriod();
        const payload = resSales.ok ? jsonSales : resPurchases.ok ? jsonPurchases : null;
        if (onEffectivePeriodChange && period.from === def.from && period.to === def.to && payload?.effective_from && payload?.effective_to) {
          onEffectivePeriodChange(payload.effective_from, payload.effective_to);
        }
      } catch (err) {
        if (seq !== requestSeqRef.current) return;
        const msg = err instanceof Error ? err.message : "Erreur réseau";
        setErrorSales(msg);
        setErrorPurchases(msg);
        setSalesData(null);
        setPurchasesData(null);
        setSalesByPartner(null);
        setArByPartner(null);
      }
      if (seq === requestSeqRef.current) setLoading(false);
    };

    fetchBoth();
    const intervalId = ENABLE_LIVE_POLLING ? setInterval(fetchBoth, POLL_INTERVAL_MS) : null;
    return () => {
      requestSeqRef.current += 1;
      if (intervalId) clearInterval(intervalId);
    };
  }, [tenantId, period.from, period.to, companyId, chartGranularity, onEffectivePeriodChange, useSnapshotBusiness]);

  return (
    <BusinessCard
      salesData={salesData}
      purchasesData={purchasesData}
      salesByPartner={salesByPartner}
      arByPartner={arByPartner}
      loading={loading}
      errorSales={errorSales}
      errorPurchases={errorPurchases}
      postedSalesCount={salesData?.posted_sales_count ?? null}
      postedPurchasesCount={purchasesData?.posted_purchases_count ?? null}
      chartGranularity={chartGranularity}
      availableGranularities={availableGranularities}
      onChartGranularityChange={handleGranularityChange}
      chartType={chartType}
      onChartTypeChange={handleChartTypeChange}
      whyContent={{
        periodLabel: `Du ${period.from} au ${period.to}`,
        tenantId: tenantId ?? undefined,
        dataSource: dataSourceFallback
          ? "Source temporaire : Vault (ERP indisponible)"
          : primarySource === "erp"
            ? "Source : ERP (Odoo)"
            : "Source : Vault",
        calculationRule: primarySource === "erp" ? "TTC, depuis l'ERP" : "TTC, scellé",
      }}
      onFocusRequest={onFocusRequest}
      footer={footer}
      cardId={cardId}
      onNavigateToCard={onNavigateToCard}
    />
  );
}
