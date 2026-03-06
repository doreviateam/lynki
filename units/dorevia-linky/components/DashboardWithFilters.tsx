"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChartExpandedProvider } from "@/app/context/ChartExpandedContext";
import { ReportHeader, type ViewMode } from "@/components/ReportHeader";
import { BusinessCardWithPolling } from "@/components/BusinessCardWithPolling";
import { FluxCashCardWithPolling } from "@/components/FluxCashCardWithPolling";
import { TreasuryCardWithPolling } from "@/components/TreasuryCardWithPolling";
import { TresoreriePositionCardWithPolling } from "@/components/TresoreriePositionCardWithPolling";
import { PosShopsView } from "@/components/PosShopsView";
import { PosComingSoonView } from "@/components/PosComingSoonView";
import { TaxesCardWithPolling } from "@/components/TaxesCardWithPolling";
import { CreditNotesCardWithPolling } from "@/components/CreditNotesCardWithPolling";
import { RefundsCardWithPolling } from "@/components/RefundsCardWithPolling";
import { LinkyFooter } from "@/components/LinkyFooter";
import { IconGrid, type CardId } from "@/components/IconGrid";
import { DivaFlashBlock } from "@/components/DivaFlashBlock";
import { DecisionsBlock } from "@/components/DecisionsBlock";
import { SyncInProgress } from "@/components/SyncInProgress";
import { getDefaultPeriod, type PeriodRange } from "@/app/lib/period-utils";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";

const COMPANIES_TIMEOUT_MS = 5000;
const DASHBOARD_METRICS_POLL_MS = 2 * 60 * 1000; // 2 min
const INCOMPLETE_RETRY_MS = 2000; // Si sealed_count_complete=false, retry une fois après 2 s
const TREASURY_UNBLOCK_AFTER_MS = 5000; // Après 5 s d'incomplétude : libérer carte Trésorerie en priorité (Option C)
const METRICS_CACHE_KEY = "linky_dashboard_metrics";
const METRICS_CACHE_TTL_MS = 90 * 1000; // 90 s — affichage instantané si retour sur la même vue

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

function clearCachedMetrics() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(METRICS_CACHE_KEY);
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
  const [metricsError, setMetricsError] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showTreasuryAfterIncomplete, setShowTreasuryAfterIncomplete] = useState(false);
  const prevScopeRef = useRef("");

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
        // Auto-sélection : seulement si au moins une société a des documents Vault.
        // Si tout vient du manifest (documents_count: 0), garder "Tout" pour afficher les données agrégées.
        const hasVaultData = list.some((c) => c.documents_count > 0);
        if (list.length > 0 && hasVaultData) {
          setSelectedCompanyId((prev) => (prev === null ? list[0].company_id : prev));
        } else if (list.length > 0 && !hasVaultData) {
          setSelectedCompanyId((prev) => prev); // Garder "Tout" (null) par défaut
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
  const scopeKey = `${tenantId}|${selectedCompanyId ?? ""}|${period.from}|${period.to}`;
  const fetchMetricsRef = useRef<() => void>(() => {});
  useEffect(() => {
    let cancelled = false;
    const retryTimeoutRef = { id: null as ReturnType<typeof setTimeout> | null };
    const retryCountRef = { count: 0 };

    // T1.8 — Invalider le cache au changement de scope (anti-stale)
    if (prevScopeRef.current && prevScopeRef.current !== scopeKey) {
      clearCachedMetrics();
    }
    prevScopeRef.current = scopeKey;

    const cached = getCachedMetrics(tenantId, selectedCompanyId, period);
    if (cached) {
      setDashboardMetrics(cached);
      setMetricsLoading(false);
      setMetricsError(false);
    } else {
      setDashboardMetrics(null);
      setMetricsLoading(true);
      setMetricsError(false);
      setAttemptCount(0);
    }
    const fetchMetrics = () => {
      const params = new URLSearchParams({
        tenant: tenantId,
        date_debut: period.from,
        date_fin: period.to,
        ...(selectedCompanyId && { company_id: selectedCompanyId }),
        ...(showIconGrid && { minimal: "1" }), // Vue grille : skip sales-by-partner, ar-by-partner (allège payload)
      });
      fetch(`/api/dashboard-metrics?${params}`, { cache: "no-store", headers: { Accept: "application/json" } })
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && d && typeof d === "object" && typeof d.treasury === "object") {
            setAttemptCount((c) => c + 1);
            setDashboardMetrics(d);
            setCachedMetrics(tenantId, selectedCompanyId, period, d);
            setMetricsLoading(false);
            setMetricsError(false);
            if (d.sealed_count_complete === false && retryCountRef.count < 1) {
              retryCountRef.count += 1;
              retryTimeoutRef.id = setTimeout(() => {
                retryTimeoutRef.id = null;
                fetchMetricsRef.current();
              }, INCOMPLETE_RETRY_MS);
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            setAttemptCount((c) => c + 1);
            setDashboardMetrics(null);
            setMetricsLoading(false);
            setMetricsError(true);
          }
        });
    };
    fetchMetricsRef.current = fetchMetrics;
    fetchMetrics();
    const pollId = setInterval(fetchMetrics, DASHBOARD_METRICS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(pollId);
      if (retryTimeoutRef.id) clearTimeout(retryTimeoutRef.id);
    };
  }, [tenantId, selectedCompanyId, period.from, period.to, showIconGrid]);

  // Spec §4.1 — Aucune carte si incomplet OU loading OU erreur
  const showCards =
    dashboardMetrics?.sealed_count_complete === true &&
    !metricsLoading &&
    !metricsError;
  const isIncomplete = !metricsLoading && !metricsError && (dashboardMetrics?.sealed_count_complete === false);

  // Option C : après 5 s d'incomplétude, libérer la carte Trésorerie en priorité
  useEffect(() => {
    if (!isIncomplete) {
      setShowTreasuryAfterIncomplete(false);
      return;
    }
    const t = setTimeout(() => setShowTreasuryAfterIncomplete(true), TREASURY_UNBLOCK_AFTER_MS);
    return () => clearTimeout(t);
  }, [isIncomplete]);

  const handleRefreshMetrics = useCallback(() => {
    setMetricsLoading(true);
    setMetricsError(false);
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
        sealedCountComplete={dashboardMetrics?.sealed_count_complete}
        onRefreshMetrics={handleRefreshMetrics}
        showIntegrityBadge={showCards}
      />
      <main className="mx-auto flex min-h-0 flex-1 w-full max-w-4xl flex-col px-4 py-6 pb-16">
        {showCards ? (
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
            {!isPosView && (
              <div className="w-full max-w-4xl mb-6">
                <TresoreriePositionCardWithPolling
                  tenantId={tenantId}
                  companyId={selectedCompanyId}
                />
              </div>
            )}
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
            {!metricsLoading && (
              <DivaFlashBlock
                tenantId={tenantId}
                companyId={selectedCompanyId}
                period={{ from: period.from, to: period.to }}
                dashboardMetrics={dashboardMetrics}
              />
            )}
            <DecisionsBlock tenantId={tenantId} />
          </div>
        ) : (
        <section className="space-y-6">
          {showPosZ && (
            <PosComingSoonView title="Z de caisse" />
          )}
          {!isPosView && (
            <TresoreriePositionCardWithPolling
              tenantId={tenantId}
              companyId={selectedCompanyId}
            />
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
        ) : showTreasuryAfterIncomplete ? (
          <>
            {!isPosView && (
              <div className="mb-6">
                <p className="mb-3 text-xs text-[var(--text-muted)]" aria-live="polite">
                  Consolidation globale en cours
                </p>
                <TresoreriePositionCardWithPolling
                  tenantId={tenantId}
                  companyId={selectedCompanyId}
                />
              </div>
            )}
            <SyncInProgress
              sealedCount={dashboardMetrics?.sealed_count}
              sealedCountComplete={dashboardMetrics?.sealed_count_complete}
              expectedCount={dashboardMetrics?.expected_count}
              generatedAt={dashboardMetrics?.generated_at}
              onRetry={handleRefreshMetrics}
              loading={metricsLoading}
              attemptCount={attemptCount}
            />
          </>
        ) : (
          <SyncInProgress
            sealedCount={dashboardMetrics?.sealed_count}
            sealedCountComplete={dashboardMetrics?.sealed_count_complete}
            expectedCount={dashboardMetrics?.expected_count}
            generatedAt={dashboardMetrics?.generated_at}
            onRetry={handleRefreshMetrics}
            loading={metricsLoading}
            attemptCount={attemptCount}
          />
        )}
      </main>
      <LinkyFooter tenantId={tenantId} />
    </div>
    </ChartExpandedProvider>
  );
}
