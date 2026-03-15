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
import { WorkingCapitalCardWithPolling } from "@/components/WorkingCapitalCardWithPolling";
import { EncoursCardWithPolling } from "@/components/EncoursCardWithPolling";
import { EbeCardWithPolling } from "@/components/EbeCardWithPolling";
import { DivaFlashBlock } from "@/components/DivaFlashBlock";
import { DecisionsBlock } from "@/components/DecisionsBlock";
import { SyncInProgress } from "@/components/SyncInProgress";
import { getDefaultPeriod, type PeriodRange } from "@/app/lib/period-utils";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import { recordUxSample } from "@/app/lib/ux-metrics";

const COMPANIES_TIMEOUT_MS = 5000;
const DASHBOARD_METRICS_POLL_MS = 2 * 60 * 1000; // 2 min
const INCOMPLETE_RETRY_MS = 2000; // Si sealed_count_complete=false, retry une fois après 2 s
const ENABLE_LIVE_POLLING = process.env.NEXT_PUBLIC_LINKY_ENABLE_LIVE_POLLING === "1";
/** Feature flag : utiliser le Metric Engine (GET /api/instruments) à la place de dashboard-metrics */
const USE_METRIC_ENGINE = process.env.NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE === "1";
const FORCED_COMPANY_ID =
  typeof process.env.NEXT_PUBLIC_FORCE_COMPANY_ID === "string" && process.env.NEXT_PUBLIC_FORCE_COMPANY_ID.trim()
    ? process.env.NEXT_PUBLIC_FORCE_COMPANY_ID.trim()
    : null;
const TREASURY_UNBLOCK_AFTER_MS = 5000; // Après 5 s d'incomplétude : libérer carte Trésorerie en priorité (Option C)
const METRICS_CACHE_KEY = "linky_dashboard_metrics";
const METRICS_CACHE_TTL_MS = Number(process.env.NEXT_PUBLIC_LINKY_METRICS_CACHE_TTL_MS ?? "0"); // 0 = cache désactivé par défaut

function deriveTenantFromHost(): string {
  if (typeof window === "undefined") return DEFAULT_TENANT;
  const host = window.location.hostname; // ex: ui.lab.o19.doreviateam.com
  const parts = host.split(".");
  // Pattern attendu: ui.<env>.<tenant>.doreviateam.com
  if (parts.length >= 5 && parts[0] === "ui") {
    const tenant = parts[2];
    if (tenant) return tenant;
  }
  return DEFAULT_TENANT;
}

function getCachedMetrics(tenantId: string, companyId: string | null, period: { from: string; to: string }): DashboardMetricsResponse | null {
  if (!Number.isFinite(METRICS_CACHE_TTL_MS) || METRICS_CACHE_TTL_MS <= 0) return null;
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

/**
 * Adaptateur Phase 2 (SPEC §9.2) :
 * Convertit la réponse de GET /api/instruments vers DashboardMetricsResponse
 * pour assurer la compatibilité avec IconGrid et les cards existantes.
 */
function adaptInstrumentsToDashboard(
  instruments: Record<string, import("@/app/api/dashboard-metrics/route").KpiMetric>
): DashboardMetricsResponse {
  const empty = { value: null, formatted: "—", valueKind: "neutral" as const };
  return {
    treasury: instruments.treasury ?? empty,
    treasury_position: instruments.treasury_position ?? empty,
    cash: instruments.cash ?? empty,
    business: instruments.business ?? empty,
    taxes: instruments.taxes ?? empty,
    credit_notes: instruments.credit_notes ?? empty,
    refunds: instruments.refunds ?? empty,
    pos_shops: instruments.pos_shops ?? empty,
    pos_z: instruments.pos_z ?? { value: null, formatted: "—", valueKind: "placeholder" as const },
    working_capital: instruments.working_capital ?? empty,
    encours: instruments.encours ?? empty,
    ebitda: instruments.ebitda ?? empty,
    // Champs non disponibles via Metric Engine (Phase 2) — inchangés
    sealed_count_complete: true, // Metric Engine ne bloque pas sur sealed_count
    sealed_count: undefined,
    generated_at: undefined,
  };
}

const DEFAULT_TENANT = "core";

interface CompanyItem {
  company_id: string;
  documents_count: number;
  display_name?: string;
}

export function DashboardWithFilters() {
  const [tenantId, setTenantId] = useState<string>(() => deriveTenantFromHost());
  const [primarySource, setPrimarySource] = useState<"erp" | "vault">("vault");
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
  const [userBypassIncomplete, setUserBypassIncomplete] = useState(false);
  const prevScopeRef = useRef("");

  useEffect(() => {
    fetch("/api/tenant")
      .then((r) => r.json())
      .then((d) => {
        setTenantId(d?.tenant_id ?? DEFAULT_TENANT);
        setPrimarySource(d?.primary_source === "erp" ? "erp" : "vault");
      })
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
  const effectiveCompanyId =
    FORCED_COMPANY_ID ??
    selectedCompanyId ??
    (companies.length > 0 && companies.some((c) => c.documents_count > 0) ? companies[0].company_id : null);
  const scopeKey = `${tenantId}|${effectiveCompanyId ?? ""}|${period.from}|${period.to}`;
  const fetchMetricsRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (companiesLoading) return;
    const hasVaultData = companies.some((c) => c.documents_count > 0);
    if (hasVaultData && !effectiveCompanyId) return;

    let cancelled = false;
    const retryTimeoutRef = { id: null as ReturnType<typeof setTimeout> | null };
    const retryCountRef = { count: 0 };

    // T1.8 — Invalider le cache au changement de scope (anti-stale)
    if (prevScopeRef.current && prevScopeRef.current !== scopeKey) {
      clearCachedMetrics();
      setUserBypassIncomplete(false);
    }
    prevScopeRef.current = scopeKey;

    const cached = getCachedMetrics(tenantId, effectiveCompanyId, period);
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
        ...(effectiveCompanyId && { company_id: effectiveCompanyId }),
        ...(!USE_METRIC_ENGINE && showIconGrid && { minimal: "1" }),
      });

      // Phase 2 (SPEC §9.2) : si le Metric Engine est activé, consommer /api/instruments
      const apiPath = USE_METRIC_ENGINE ? `/api/instruments?${params}` : `/api/dashboard-metrics?${params}`;

      const fetchStart = Date.now();
      fetch(apiPath, { cache: "no-store", headers: { Accept: "application/json" } })
        .then((r) => r.json())
        .then((raw) => {
          // UX metrics : latence mesurée dès la réponse reçue
          recordUxSample({
            tenant: tenantId,
            company: effectiveCompanyId ?? "",
            periodFrom: period.from,
            periodTo: period.to,
            latencyMs: Date.now() - fetchStart,
          });

          // Adaptateur : si le Metric Engine est actif, convertir vers DashboardMetricsResponse
          const d: DashboardMetricsResponse | null = USE_METRIC_ENGINE && raw?.instruments
            ? adaptInstrumentsToDashboard(raw.instruments)
            : raw;

          if (!cancelled && d && typeof d === "object" && typeof d.treasury === "object") {
            setAttemptCount((c) => c + 1);
            setDashboardMetrics(d);
            setCachedMetrics(tenantId, effectiveCompanyId, period, d);
            setMetricsLoading(false);
            setMetricsError(false);
            if (ENABLE_LIVE_POLLING && !USE_METRIC_ENGINE && d.sealed_count_complete === false && retryCountRef.count < 1) {
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
    const pollId = ENABLE_LIVE_POLLING ? setInterval(fetchMetrics, DASHBOARD_METRICS_POLL_MS) : null;
    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
      if (retryTimeoutRef.id) clearTimeout(retryTimeoutRef.id);
    };
  }, [tenantId, selectedCompanyId, effectiveCompanyId, period.from, period.to, showIconGrid, companiesLoading, companies]);

  // Spec §4.1 — Aucune carte si incomplet OU loading OU erreur (sauf bypass utilisateur)
  const showCards =
    (dashboardMetrics?.sealed_count_complete === true || userBypassIncomplete) &&
    dashboardMetrics != null &&
    !metricsLoading &&
    !metricsError;
  const isIncomplete = !metricsLoading && !metricsError && (dashboardMetrics?.sealed_count_complete === false) && !userBypassIncomplete;

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

  const handleViewAnyway = useCallback(() => {
    setUserBypassIncomplete(true);
  }, []);

  const handlePeriodChange = useCallback((p: PeriodRange) => setPeriod(p), []);

  const isPosView = viewMode === "pos_shops" || viewMode === "pos_z";
  const showCard = (cardId: CardId) => !focusedCardId || focusedCardId === cardId;
  const showWhenFocused = (cardId: CardId) => focusedCardId === cardId;
  const onFocusRequest = useCallback((cardId: CardId) => setFocusedCardId(cardId), []);
  const onNavigateToCard = useCallback((cardId: CardId) => setFocusedCardId(cardId), []);
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
  const showWorkingCapital = !isPosView && (viewMode === "all" || viewMode === "business");
  const showEncours = !isPosView && (viewMode === "all" || viewMode === "business");
  const showEbe = !isPosView && (viewMode === "all" || viewMode === "business");

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
        {userBypassIncomplete && (
          <div className="mb-4 rounded-lg border border-[var(--warning)]/50 bg-[var(--warning)]/10 px-4 py-2 text-sm text-[var(--text)]">
            Données partiellement synchronisées — certaines métriques peuvent être incomplètes.
          </div>
        )}
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
            <div className="w-full">
              <IconGrid
                tenantId={tenantId}
                companyId={effectiveCompanyId}
                period={period}
                metrics={dashboardMetrics}
                metricsLoading={metricsLoading}
                onSelect={(id: CardId) => setFocusedCardId(id)}
              />
            </div>
            {!metricsLoading && (
              <DivaFlashBlock
                tenantId={tenantId}
                companyId={effectiveCompanyId}
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
          {!isPosView && (viewMode === "all" || showWhenFocused("treasury")) && showCard("treasury") && (
            <TresoreriePositionCardWithPolling
              tenantId={tenantId}
              companyId={effectiveCompanyId}
              period={{ from: period.from, to: period.to }}
              cardId="treasury"
              onNavigateToCard={onNavigateToCard}
            />
          )}
          {(showCash || showWhenFocused("treasury_position")) && showCard("treasury_position") && (
            <TreasuryCardWithPolling
              period={period}
              companyId={effectiveCompanyId}
              tenantId={tenantId}
              primarySource={primarySource}
              onFocusRequest={() => onFocusRequest("treasury_position")}
              cardId="treasury_position"
              onNavigateToCard={onNavigateToCard}
            />
          )}
          {(showCash || showWhenFocused("cash")) && showCard("cash") && (
            <FluxCashCardWithPolling
              initialDataIn={null}
              initialDataOut={null}
              period={period}
              companyId={effectiveCompanyId}
              tenantId={tenantId}
              onFocusRequest={() => onFocusRequest("cash")}
              cardId="cash"
              onNavigateToCard={onNavigateToCard}
            />
          )}
          {(showBusiness || showWhenFocused("business")) && showCard("business") && (
            <BusinessCardWithPolling
              initialSalesData={null}
              initialPurchasesData={null}
              period={period}
              companyId={effectiveCompanyId}
              tenantId={tenantId}
              primarySource={primarySource}
              dashboardSnapshot={focusedCardId === "business" ? null : dashboardMetrics}
              onFocusRequest={() => onFocusRequest("business")}
              cardId="business"
              onNavigateToCard={onNavigateToCard}
            />
          )}
          {(showWorkingCapital || showWhenFocused("working_capital")) && showCard("working_capital") && (
            <WorkingCapitalCardWithPolling
              period={period}
              companyId={effectiveCompanyId}
              tenantId={tenantId}
              onFocusRequest={() => onFocusRequest("working_capital")}
              cardId="working_capital"
              onNavigateToCard={onNavigateToCard}
            />
          )}
          {(showEncours || showWhenFocused("encours")) && showCard("encours") && (
            <EncoursCardWithPolling
              period={period}
              companyId={effectiveCompanyId}
              tenantId={tenantId}
              onFocusRequest={() => onFocusRequest("encours")}
              cardId="encours"
              onNavigateToCard={onNavigateToCard}
            />
          )}
          {(showEbe || showWhenFocused("ebitda")) && showCard("ebitda") && (
            <EbeCardWithPolling
              period={period}
              companyId={effectiveCompanyId}
              tenantId={tenantId}
              dashboardSnapshot={dashboardMetrics}
              onFocusRequest={() => onFocusRequest("ebitda")}
              cardId="ebitda"
              onNavigateToCard={onNavigateToCard}
            />
          )}
          {(viewMode === "all" || viewMode === "pos_shops" || showWhenFocused("pos_shops")) && showCard("pos_shops") && (
            <PosShopsView
              tenantId={tenantId}
              period={posPeriod}
              companies={companies}
              onFocusRequest={() => onFocusRequest("pos_shops")}
              cardId="pos_shops"
              onNavigateToCard={onNavigateToCard}
            />
          )}
          {(showTaxes || showWhenFocused("taxes")) && showCard("taxes") && (
            <TaxesCardWithPolling
              initialSalesData={null}
              initialPurchasesData={null}
              period={period}
              companyId={effectiveCompanyId}
              tenantId={tenantId}
              onFocusRequest={() => onFocusRequest("taxes")}
              cardId="taxes"
              onNavigateToCard={onNavigateToCard}
            />
          )}
          {(showCreditNotes || showWhenFocused("credit_notes")) && showCard("credit_notes") && (
            <CreditNotesCardWithPolling
              initialClientData={null}
              initialSupplierData={null}
              period={period}
              companyId={effectiveCompanyId}
              tenantId={tenantId}
              onFocusRequest={() => onFocusRequest("credit_notes")}
              cardId="credit_notes"
              onNavigateToCard={onNavigateToCard}
            />
          )}
          {(showRefunds || showWhenFocused("refunds")) && showCard("refunds") && (
            <RefundsCardWithPolling
              initialClientData={null}
              initialSupplierData={null}
              period={period}
              companyId={effectiveCompanyId}
              tenantId={tenantId}
              onFocusRequest={() => onFocusRequest("refunds")}
              cardId="refunds"
              onNavigateToCard={onNavigateToCard}
            />
          )}
          {(viewMode === "all" || showWhenFocused("pos_z")) && showCard("pos_z") && (
            <PosComingSoonView
              title="Z de caisse"
              onFocusRequest={() => onFocusRequest("pos_z")}
              cardId="pos_z"
              onNavigateToCard={onNavigateToCard}
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
                  companyId={effectiveCompanyId}
                  period={{ from: period.from, to: period.to }}
                />
              </div>
            )}
            <SyncInProgress
              sealedCount={dashboardMetrics?.sealed_count}
              sealedCountComplete={dashboardMetrics?.sealed_count_complete}
              expectedCount={dashboardMetrics?.expected_count}
              generatedAt={dashboardMetrics?.generated_at}
              onRetry={handleRefreshMetrics}
              onViewAnyway={handleViewAnyway}
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
            onViewAnyway={handleViewAnyway}
            loading={metricsLoading}
            attemptCount={attemptCount}
          />
        )}
      </main>
      <LinkyFooter tenantId={tenantId} primarySource={primarySource} sealedCountTotal={dashboardMetrics?.sealed_count} />
    </div>
    </ChartExpandedProvider>
  );
}
