"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChartExpandedProvider } from "@/app/context/ChartExpandedContext";
import { ReportHeader, type ViewMode } from "@/components/ReportHeader";
import { BusinessCardWithPolling } from "@/components/BusinessCardWithPolling";
import { FluxCashCardWithPolling } from "@/components/FluxCashCardWithPolling";
import { TreasuryCardWithPolling } from "@/components/TreasuryCardWithPolling";
import { PosShopsView } from "@/components/PosShopsView";
import { PosComingSoonView } from "@/components/PosComingSoonView";
import { TaxesCardWithPolling } from "@/components/TaxesCardWithPolling";
import { CreditNotesCardWithPolling } from "@/components/CreditNotesCardWithPolling";
import { RefundsCardWithPolling } from "@/components/RefundsCardWithPolling";
import { LinkyFooter } from "@/components/LinkyFooter";
import { IconGrid, type CardId } from "@/components/IconGrid";
import { DivaFlashBlock } from "@/components/DivaFlashBlock";
import { DecisionsBlock } from "@/components/DecisionsBlock";
import { getDefaultPeriod, type PeriodRange } from "@/app/lib/period-utils";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";

const COMPANIES_TIMEOUT_MS = 5000;
const DASHBOARD_METRICS_POLL_MS = 2 * 60 * 1000; // 2 min
const METRICS_CACHE_KEY = "linky_dashboard_metrics";
const METRICS_CACHE_TTL_MS = 30 * 1000; // 30 s

function getCachedMetrics(tenantId: string, companyId: string | null, period: { from: string; to: string }): DashboardMetricsResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(METRICS_CACHE_KEY);
    if (!raw) return null;
    const { data, tenant, company, from, to, t } = JSON.parse(raw);
    if (tenant !== tenantId || company !== (companyId ?? "") || from !== period.from || to !== period.to) return null;
    if (Date.now() - t > METRICS_CACHE_TTL_MS) return null;
    return data && typeof data.treasury === "object" ? data : null;
  } catch {
    return null;
  }
}

function setCachedMetrics(tenantId: string, companyId: string | null, period: { from: string; to: string }, data: DashboardMetricsResponse) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(METRICS_CACHE_KEY, JSON.stringify({
      data,
      tenant: tenantId,
      company: companyId ?? "",
      from: period.from,
      to: period.to,
      t: Date.now(),
    }));
  } catch { /* ignore */ }
}
const DEFAULT_TENANT = "core";

interface CompanyItem {
  company_id: string;
  documents_count: number;
  display_name?: string;
}

export function DashboardWithFilters() {
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodRange>(getDefaultPeriod);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [focusedCardId, setFocusedCardId] = useState<CardId | null>(null);
  const [availableYears, setAvailableYears] = useState<number[] | null>(null);
  const [monthsWithDataByYear, setMonthsWithDataByYear] = useState<Record<string, number[]>>({});
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant")
      .then((r) => r.json())
      .then((d) => setTenantId(d?.tenant_id ?? DEFAULT_TENANT))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), COMPANIES_TIMEOUT_MS);
    fetch(`/api/companies?tenant=${encodeURIComponent(tenantId)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: CompanyItem[]) => {
        const list = Array.isArray(data) ? data : [];
        setCompanies(list);
        // COMPTE_RENDU : auto-sélection première société si liste non vide
        if (list.length > 0) {
          setSelectedCompanyId((prev) => (prev === null ? list[0].company_id : prev));
        }
      })
      .catch(() => setCompanies([]))
      .finally(() => {
        clearTimeout(timeoutId);
        setCompaniesLoading(false);
      });
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [tenantId]);

  useEffect(() => {
    const params = new URLSearchParams({ tenant: tenantId });
    if (selectedCompanyId) params.set("company_id", selectedCompanyId);
    fetch(`/api/years-with-data?${params}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setAvailableYears(Array.isArray(d?.years) ? d.years : null);
        setMonthsWithDataByYear(d?.monthsWithDataByYear && typeof d.monthsWithDataByYear === "object" ? d.monthsWithDataByYear : {});
      })
      .catch(() => {
        setAvailableYears(null);
        setMonthsWithDataByYear({});
      });
  }, [tenantId, selectedCompanyId]);

  // Fetch dashboard-metrics : pour IconGrid/Diva quand vue "all", et sealed_count pour le badge (toujours)
  const showIconGrid = viewMode === "all" && !focusedCardId;
  const fetchMetricsRef = useRef<() => void>(() => {});
  useEffect(() => {
    let cancelled = false;
    const cached = getCachedMetrics(tenantId, selectedCompanyId, period);
    if (cached) {
      setDashboardMetrics(cached);
      setMetricsLoading(false);
    } else {
      setDashboardMetrics(null);
      setMetricsLoading(true);
    }
    const fetchMetrics = () => {
      const params = new URLSearchParams({
        tenant: tenantId,
        date_debut: period.from,
        date_fin: period.to,
        ...(selectedCompanyId && { company_id: selectedCompanyId }),
      });
      fetch(`/api/dashboard-metrics?${params}`, { cache: "no-store", headers: { Accept: "application/json" } })
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && d && typeof d === "object" && typeof d.treasury === "object") {
            setDashboardMetrics(d);
            setCachedMetrics(tenantId, selectedCompanyId, period, d);
            setMetricsLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setDashboardMetrics(null);
            setMetricsLoading(false);
          }
        });
    };
    fetchMetricsRef.current = fetchMetrics;
    fetchMetrics();
    const id = setInterval(fetchMetrics, DASHBOARD_METRICS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [tenantId, selectedCompanyId, period.from, period.to]);
  const handleRefreshMetrics = useCallback(() => {
    fetchMetricsRef.current();
  }, []);

  const handlePeriodChange = useCallback((p: PeriodRange) => setPeriod(p), []);

  const isPosView = viewMode === "pos_shops" || viewMode === "pos_z";
  const showCard = (cardId: CardId) => !focusedCardId || focusedCardId === cardId;
  const showWhenFocused = (cardId: CardId) => focusedCardId === cardId;
  const onFocusRequest = useCallback((cardId: CardId) => setFocusedCardId(cardId), []);
  const showPosShops = viewMode === "pos_shops";
  const showPosZ = viewMode === "pos_z";
  const posPeriod: PeriodRange =
    viewMode === "pos_shops"
      ? (() => {
          const t = new Date().toISOString().slice(0, 10);
          return { from: t, to: t };
        })()
      : period;
  const showCash = !isPosView && (viewMode === "all" || viewMode === "cash");
  const showBusiness = !isPosView && (viewMode === "all" || viewMode === "business");
  const showTaxes = !isPosView && (viewMode === "all" || viewMode === "business");
  const showCreditNotes = !isPosView && (viewMode === "all" || viewMode === "corrections");
  const showRefunds = !isPosView && (viewMode === "all" || viewMode === "cash" || viewMode === "corrections");

  return (
    <ChartExpandedProvider>
    <div className="flex min-h-screen flex-col">
      <ReportHeader
        tenantId={tenantId}
        companies={companies}
        companiesLoading={companiesLoading}
        selectedCompanyId={selectedCompanyId}
        onCompanyChange={setSelectedCompanyId}
        period={period}
        onPeriodChange={handlePeriodChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        availableYears={availableYears}
        monthsWithDataByYear={monthsWithDataByYear}
        sealedCount={dashboardMetrics?.sealed_count}
        onRefreshMetrics={handleRefreshMetrics}
      />
      <main className="mx-auto flex min-h-0 flex-1 w-full max-w-4xl flex-col px-4 py-6 pb-16">
        <>
        {focusedCardId && (
          <button
            type="button"
            onClick={() => setFocusedCardId(null)}
            className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            ← Retour au cockpit
          </button>
        )}
        {showIconGrid ? (
          <div className="flex flex-1 min-h-0 flex-col items-center pt-6">
            <div className="flex items-start justify-center">
              <IconGrid
                tenantId={tenantId}
                companyId={selectedCompanyId}
                period={period}
                metrics={dashboardMetrics}
                metricsLoading={metricsLoading}
                onSelect={(id: CardId) => setFocusedCardId(id)}
              />
            </div>
            <DivaFlashBlock
              tenantId={tenantId}
              companyId={selectedCompanyId}
              period={{ from: period.from, to: period.to }}
              dashboardMetrics={dashboardMetrics}
            />
            <DecisionsBlock tenantId={tenantId} />
          </div>
        ) : (
        <section className="space-y-6">
          {showPosZ && (
            <PosComingSoonView title="Z de caisse" />
          )}
          {(showCash || showWhenFocused("treasury")) && showCard("treasury") && (
            <TreasuryCardWithPolling
              period={period}
              companyId={selectedCompanyId}
              tenantId={tenantId}
              onFocusRequest={() => onFocusRequest("treasury")}
            />
          )}
          {(showCash || showWhenFocused("cash")) && showCard("cash") && (
            <FluxCashCardWithPolling
              initialDataIn={null}
              initialDataOut={null}
              period={period}
              companyId={selectedCompanyId}
              tenantId={tenantId}
              onFocusRequest={() => onFocusRequest("cash")}
            />
          )}
          {(showBusiness || showWhenFocused("business")) && showCard("business") && (
            <BusinessCardWithPolling
              initialSalesData={null}
              initialPurchasesData={null}
              period={period}
              companyId={selectedCompanyId}
              tenantId={tenantId}
              onFocusRequest={() => onFocusRequest("business")}
            />
          )}
          {(viewMode === "all" || viewMode === "pos_shops" || showWhenFocused("pos_shops")) && showCard("pos_shops") && (
            <PosShopsView
              tenantId={tenantId}
              period={posPeriod}
              companies={companies}
              onFocusRequest={() => onFocusRequest("pos_shops")}
            />
          )}
          {(showTaxes || showWhenFocused("taxes")) && showCard("taxes") && (
            <TaxesCardWithPolling
              initialSalesData={null}
              initialPurchasesData={null}
              period={period}
              companyId={selectedCompanyId}
              tenantId={tenantId}
              onFocusRequest={() => onFocusRequest("taxes")}
            />
          )}
          {(showCreditNotes || showWhenFocused("credit_notes")) && showCard("credit_notes") && (
            <CreditNotesCardWithPolling
              initialClientData={null}
              initialSupplierData={null}
              period={period}
              companyId={selectedCompanyId}
              tenantId={tenantId}
              onFocusRequest={() => onFocusRequest("credit_notes")}
            />
          )}
          {(showRefunds || showWhenFocused("refunds")) && showCard("refunds") && (
            <RefundsCardWithPolling
              initialClientData={null}
              initialSupplierData={null}
              period={period}
              companyId={selectedCompanyId}
              tenantId={tenantId}
              onFocusRequest={() => onFocusRequest("refunds")}
            />
          )}
          {(viewMode === "all" || showWhenFocused("pos_z")) && showCard("pos_z") && (
            <PosComingSoonView
              title="Z de caisse"
              onFocusRequest={() => onFocusRequest("pos_z")}
            />
          )}
        </section>
        )}
        </>
      </main>
      <LinkyFooter tenantId={tenantId} />
    </div>
    </ChartExpandedProvider>
  );
}
