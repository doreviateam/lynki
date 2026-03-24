"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChartExpandedProvider, useChartExpanded } from "@/app/context/ChartExpandedContext";
import { ChromeAdaptiveProvider, useChromeAdaptive } from "@/app/context/ChromeAdaptiveContext";
import { TenantProvider, useTenantContext } from "@/app/context/TenantContext";
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
import { TenantErrorView } from "@/components/TenantErrorView";
import { TenantLoadingGate } from "@/components/TenantLoadingGate";
import { DashboardErrorBoundary } from "@/components/DashboardErrorBoundary";
import { TenantChoiceView } from "@/components/TenantChoiceView";
import { ChromeTriggerBar } from "@/components/ChromeTriggerBar";
import type { CardId } from "@/app/types/linky-tiles";
import { CockpitMobileView } from "@/components/CockpitMobileView";
import { CockpitDesktopView } from "@/components/CockpitDesktopView";
import { WorkingCapitalCardWithPolling } from "@/components/WorkingCapitalCardWithPolling";
import { EncoursCardWithPolling } from "@/components/EncoursCardWithPolling";
import { EbeCardWithPolling } from "@/components/EbeCardWithPolling";
import { SyncInProgress } from "@/components/SyncInProgress";
import { AccountingSummaryView } from "@/components/AccountingSummaryView";
import { getDefaultPeriod, type PeriodRange } from "@/app/lib/period-utils";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import { recordUxSample } from "@/app/lib/ux-metrics";
import { companyDisplayLabel, normalizeCompanyId } from "@/app/lib/company-id";

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

/** Host unique lab Linky : tenant par query ?tenant= ; sans param = écran de choix */
const LAB_LINKY_HOST = "lab.linky.doreviateam.com";

function deriveTenantFromHost(): string {
  if (typeof window === "undefined") return DEFAULT_TENANT;
  const host = window.location.hostname;
  // lab.linky.doreviateam.com : pas de tenant dans l’URL, uniquement ?tenant= ou écran de choix
  if (host === LAB_LINKY_HOST) return DEFAULT_TENANT;
  const parts = host.split(".");
  // Rétrocompatibilité : ui.lab.<tenant>.doreviateam.com
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

function chartCardIdForViewMode(viewMode: ViewMode): CardId | null {
  if (viewMode === "business") return "business";
  if (viewMode === "cash") return "cash";
  if (viewMode === "corrections") return "credit_notes";
  return null;
}

/** Clés `storageKey` des blocs Évolution — une seule ouverte à la fois (`ChartExpandedContext`). */
const FOCUS_CARD_CHART_STORAGE_KEY: Partial<Record<CardId, string>> = {
  treasury: "linky-tresorerie-position-evolution",
  treasury_position: "linky-treasury-chart-expanded",
  cash: "linky-cash-chart-expanded",
  business: "linky-business-chart-expanded",
  working_capital: "linky-bfr-evolution",
  encours: "linky-encours-evolution",
  ebitda: "linky-ebe-evolution",
  taxes: "linky-taxes-chart-expanded",
  credit_notes: "linky-credit-notes-chart-expanded",
  refunds: "linky-refunds-chart-expanded",
};

function FocusChartSync({
  focusedCardId,
  viewMode,
}: {
  focusedCardId: CardId | null;
  viewMode: ViewMode;
}) {
  const chartExpanded = useChartExpanded();
  useEffect(() => {
    if (!chartExpanded) return;
    const cardId = focusedCardId ?? chartCardIdForViewMode(viewMode);
    if (!cardId) return;
    const key = FOCUS_CARD_CHART_STORAGE_KEY[cardId];
    if (key) chartExpanded.setActiveKey(key);
  }, [focusedCardId, viewMode, chartExpanded]);
  return null;
}

interface CompanyItem {
  company_id: string;
  documents_count: number;
  display_name?: string;
}

// ─── Spec navigation §2 : valeurs autorisées pour ?view= ─────────────────────
export type AppView = "pilotage" | "synthese";

function parseAppView(raw: string | null): AppView {
  return raw === "synthese" ? "synthese" : "pilotage";
}

/** Contenu du cockpit ; consomme ChromeAdaptiveContext (doit être rendu dans ChromeAdaptiveProvider). */
function DashboardWithFiltersContent({
  initialShowTenantChoice = false,
  initialAppView = "pilotage",
}: {
  initialShowTenantChoice?: boolean;
  initialAppView?: AppView;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tenantFromUrl = searchParams.get("tenant");
  const [tenantId, setTenantId] = useState<string>(DEFAULT_TENANT);
  const [showTenantChoice, setShowTenantChoice] = useState(!!initialShowTenantChoice);
  // Après hydratation : déduire le tenant depuis l’hôte (ui.lab.<tenant>.doreviateam.com) ou /api/tenant (conteneur)
  useEffect(() => {
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    if (host === LAB_LINKY_HOST && !tenantFromUrl) {
      setShowTenantChoice(true);
      return;
    }
    setShowTenantChoice(false);
    const fromHost = deriveTenantFromHost();
    if (fromHost !== DEFAULT_TENANT) {
      setTenantId(fromHost);
      return;
    }
    fetch("/api/tenant", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { tenant_id?: string }) => setTenantId(d?.tenant_id || DEFAULT_TENANT))
      .catch(() => {});
  }, [tenantFromUrl]);
  const requestedTenant = tenantFromUrl ?? tenantId;
  /** Scope des données : URL (tenant) prime pour que le switch recharge le bon tenant. */
  const scopeTenantId = requestedTenant ?? tenantId;
  const onSetTenantNavigate = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("tenant", id);
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, searchParams]
  );
  // ── Navigation Pilotage / Synthèse (SPEC_UX_NAVIGATION_LYNKI §2–§4) ──────
  // Source de vérité : URL ?view=pilotage|synthese  — fallback "pilotage"
  const [appView, setAppViewState] = useState<AppView>(() => parseAppView(searchParams.get("view")) ?? initialAppView);

  // Synchroniser avec l'URL dès hydratation et à chaque changement de searchParams
  useEffect(() => {
    setAppViewState(parseAppView(searchParams.get("view")));
  }, [searchParams]);

  const setAppView = useCallback(
    (view: AppView) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("view", view);
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, searchParams]
  );

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

  const chromeAdaptive = useChromeAdaptive();
  const chromeVisible = chromeAdaptive?.isChromeVisible ?? true;
  const chromeState = chromeAdaptive?.chromeState ?? "expanded";
  const interactionMode = chromeAdaptive?.interactionMode ?? "tablet";
  const revealChrome = chromeAdaptive?.revealChrome ?? (() => {});

  const onResolvedTenantChange = useCallback(
    (_tenantId: string, config: import("@/app/lib/tenant-types").TenantConfigResponse) => {
      setSelectedCompanyId(null);
      setPeriod(getDefaultPeriod());
      chromeAdaptive?.revealChrome?.();
      chromeAdaptive?.setChromePinned?.(config?.chrome?.behavior?.defaultChromePinned ?? false);
    },
    [chromeAdaptive]
  );

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
    fetch(`/api/companies?tenant=${encodeURIComponent(scopeTenantId)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: CompanyItem[]) => {
        const raw = Array.isArray(data) ? data : [];
        const list: CompanyItem[] = [];
        for (const c of raw) {
          const id = normalizeCompanyId(c.company_id);
          if (!id) continue;
          const documents_count =
            typeof c.documents_count === "number" && Number.isFinite(c.documents_count)
              ? c.documents_count
              : 0;
          const label = companyDisplayLabel(c.display_name, c.company_id);
          list.push({
            company_id: id,
            documents_count,
            ...(label && label !== id ? { display_name: label } : {}),
          });
        }
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
  }, [scopeTenantId]);

  useEffect(() => {
    const params = new URLSearchParams({ tenant: scopeTenantId });
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
  }, [scopeTenantId, selectedCompanyId]);

  // Fetch dashboard-metrics : pour IconGrid/Diva quand vue "all", et sealed_count pour le badge (toujours)
  const showIconGrid = viewMode === "all" && !focusedCardId;
  const effectiveCompanyId =
    FORCED_COMPANY_ID ??
    selectedCompanyId ??
    (companies.length > 0 && companies.some((c) => c.documents_count > 0) ? companies[0].company_id : null);
  const scopeKey = `${scopeTenantId}|${effectiveCompanyId ?? ""}|${period.from}|${period.to}`;
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

    const cached = getCachedMetrics(scopeTenantId, effectiveCompanyId, period);
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
        tenant: scopeTenantId,
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
            tenant: scopeTenantId,
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
            setCachedMetrics(scopeTenantId, effectiveCompanyId, period, d);
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
  }, [scopeTenantId, selectedCompanyId, effectiveCompanyId, period.from, period.to, showIconGrid, companiesLoading, companies]);

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
  const onBackToCockpit = useCallback(() => setFocusedCardId(null), []);
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

  // lab.linky.doreviateam.com sans ?tenant= : écran de choix (après tous les hooks pour éviter React #310)
  if (showTenantChoice) {
    return <TenantChoiceView onSelect={(id) => onSetTenantNavigate(id)} />;
  }

  return (
    <ChartExpandedProvider>
    <FocusChartSync focusedCardId={focusedCardId} viewMode={viewMode} />
    <TenantProvider requestedTenant={requestedTenant} onSetTenantNavigate={onSetTenantNavigate} onResolvedTenantChange={onResolvedTenantChange}>
    <DashboardErrorBoundary>
    <TenantLoadingGate>
    <TenantErrorView>
    <div key={scopeTenantId} className="flex min-h-screen flex-col">
      {/* Header : fond opaque (aligné footer), bordure basse ; masqué après inactivité */}
      <div
        className={`sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-secondary)] transition-[transform,max-height] duration-300 ease-out motion-reduce:duration-0 ${chromeVisible ? "overflow-visible" : "overflow-hidden"}`}
        style={{
          transform: chromeVisible ? "translateY(0)" : "translateY(-100%)",
          maxHeight: chromeVisible ? "140px" : "0",
        }}
      >
        <ReportHeader
          tenantId={scopeTenantId}
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
          chromeCompact={chromeState === "compact"}
          onExpandChrome={() => revealChrome("tap_trigger")}
          appView={appView}
          onNavigateToAppView={setAppView}
        />
      </div>

      <main className={`mx-auto flex min-h-0 flex-1 w-full max-w-4xl flex-col px-4 pb-16 ${chromeVisible ? "pt-6" : "pt-4"}`}>
        {/* Vue Synthèse comptable (Lot 2 — AccountingSummaryView) */}
        {appView === "synthese" ? (
          <AccountingSummaryView
            tenantId={scopeTenantId}
            companyId={effectiveCompanyId}
            period={period}
          />
        ) : showCards ? (
        <>
        {userBypassIncomplete && (
          <div className="mb-4 rounded-lg border border-[var(--warning)]/50 bg-[var(--warning)]/10 px-4 py-2 text-sm text-[var(--text)]">
            Données partiellement synchronisées — certaines métriques peuvent être incomplètes.
          </div>
        )}
        {showIconGrid ? (
          interactionMode === "mobile" ? (
            <CockpitMobileView
              tenantId={scopeTenantId}
              companyId={effectiveCompanyId}
              period={period}
              metrics={dashboardMetrics}
              metricsLoading={metricsLoading}
              onSelectCard={(id) => setFocusedCardId(id)}
            />
          ) : (
            <CockpitDesktopView
              tenantId={scopeTenantId}
              companyId={effectiveCompanyId}
              period={period}
              metrics={dashboardMetrics}
              metricsLoading={metricsLoading}
              onSelectCard={(id) => setFocusedCardId(id)}
            />
          )
        ) : (
        <section className="space-y-6">
          {showPosZ && (
            <PosComingSoonView title="Z de caisse" />
          )}
          {!isPosView && (viewMode === "all" || showWhenFocused("treasury")) && showCard("treasury") && (
            <TresoreriePositionCardWithPolling
              tenantId={scopeTenantId}
              companyId={effectiveCompanyId}
              period={{ from: period.from, to: period.to }}
              cardId="treasury"
              onNavigateToCard={onNavigateToCard}
              onBackToCockpit={onBackToCockpit}
            />
          )}
          {(showCash || showWhenFocused("treasury_position")) && showCard("treasury_position") && (
            <TreasuryCardWithPolling
              period={period}
              companyId={effectiveCompanyId}
              tenantId={scopeTenantId}
              primarySource={primarySource}
              onFocusRequest={() => onFocusRequest("treasury_position")}
              cardId="treasury_position"
              onNavigateToCard={onNavigateToCard}
              onBackToCockpit={onBackToCockpit}
            />
          )}
          {(showCash || showWhenFocused("cash")) && showCard("cash") && (
            <FluxCashCardWithPolling
              initialDataIn={null}
              initialDataOut={null}
              period={period}
              companyId={effectiveCompanyId}
              tenantId={scopeTenantId}
              onFocusRequest={() => onFocusRequest("cash")}
              cardId="cash"
              onNavigateToCard={onNavigateToCard}
              onBackToCockpit={onBackToCockpit}
            />
          )}
          {(showBusiness || showWhenFocused("business")) && showCard("business") && (
            <BusinessCardWithPolling
              initialSalesData={null}
              initialPurchasesData={null}
              period={period}
              companyId={effectiveCompanyId}
              tenantId={scopeTenantId}
              primarySource={primarySource}
              dashboardSnapshot={focusedCardId === "business" ? null : dashboardMetrics}
              onFocusRequest={() => onFocusRequest("business")}
              cardId="business"
              onNavigateToCard={onNavigateToCard}
              onBackToCockpit={onBackToCockpit}
            />
          )}
          {(showWorkingCapital || showWhenFocused("working_capital")) && showCard("working_capital") && (
            <WorkingCapitalCardWithPolling
              period={period}
              companyId={effectiveCompanyId}
              tenantId={scopeTenantId}
              onFocusRequest={() => onFocusRequest("working_capital")}
              cardId="working_capital"
              onNavigateToCard={onNavigateToCard}
              onBackToCockpit={onBackToCockpit}
            />
          )}
          {(showEncours || showWhenFocused("encours")) && showCard("encours") && (
            <EncoursCardWithPolling
              period={period}
              companyId={effectiveCompanyId}
              tenantId={scopeTenantId}
              onFocusRequest={() => onFocusRequest("encours")}
              cardId="encours"
              onNavigateToCard={onNavigateToCard}
              onBackToCockpit={onBackToCockpit}
            />
          )}
          {(showEbe || showWhenFocused("ebitda")) && showCard("ebitda") && (
            <EbeCardWithPolling
              period={period}
              companyId={effectiveCompanyId}
              tenantId={scopeTenantId}
              dashboardSnapshot={dashboardMetrics}
              onFocusRequest={() => onFocusRequest("ebitda")}
              cardId="ebitda"
              onNavigateToCard={onNavigateToCard}
              onBackToCockpit={onBackToCockpit}
            />
          )}
          {(viewMode === "all" || viewMode === "pos_shops" || showWhenFocused("pos_shops")) && showCard("pos_shops") && (
            <PosShopsView
              tenantId={scopeTenantId}
              period={posPeriod}
              companies={companies}
              onFocusRequest={() => onFocusRequest("pos_shops")}
              cardId="pos_shops"
              onNavigateToCard={onNavigateToCard}
              onBackToCockpit={onBackToCockpit}
            />
          )}
          {(showTaxes || showWhenFocused("taxes")) && showCard("taxes") && (
            <TaxesCardWithPolling
              initialSalesData={null}
              initialPurchasesData={null}
              period={period}
              companyId={effectiveCompanyId}
              tenantId={scopeTenantId}
              onFocusRequest={() => onFocusRequest("taxes")}
              cardId="taxes"
              onNavigateToCard={onNavigateToCard}
              onBackToCockpit={onBackToCockpit}
            />
          )}
          {(showCreditNotes || showWhenFocused("credit_notes")) && showCard("credit_notes") && (
            <CreditNotesCardWithPolling
              initialClientData={null}
              initialSupplierData={null}
              period={period}
              companyId={effectiveCompanyId}
              tenantId={scopeTenantId}
              onFocusRequest={() => onFocusRequest("credit_notes")}
              cardId="credit_notes"
              onNavigateToCard={onNavigateToCard}
              onBackToCockpit={onBackToCockpit}
            />
          )}
          {(showRefunds || showWhenFocused("refunds")) && showCard("refunds") && (
            <RefundsCardWithPolling
              initialClientData={null}
              initialSupplierData={null}
              period={period}
              companyId={effectiveCompanyId}
              tenantId={scopeTenantId}
              onFocusRequest={() => onFocusRequest("refunds")}
              cardId="refunds"
              onNavigateToCard={onNavigateToCard}
              onBackToCockpit={onBackToCockpit}
            />
          )}
          {(viewMode === "all" || showWhenFocused("pos_z")) && showCard("pos_z") && (
            <PosComingSoonView
              title="Z de caisse"
              onFocusRequest={() => onFocusRequest("pos_z")}
              cardId="pos_z"
              onNavigateToCard={onNavigateToCard}
              onBackToCockpit={onBackToCockpit}
            />
          )}
        </section>
        )}
        </>
        ) : null}
        {appView === "pilotage" && !showCards && showTreasuryAfterIncomplete ? (
          <>
            {!isPosView && (
              <div className="mb-6">
                <p className="mb-3 text-xs text-[var(--text-muted)]" aria-live="polite">
                  Consolidation globale en cours
                </p>
                <TresoreriePositionCardWithPolling
                  tenantId={scopeTenantId}
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
        ) : appView === "pilotage" ? (
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
        ) : null}
      </main>
      {/* Footer : toujours affiché (pas de masquage auto) */}
      <LinkyFooter tenantId={scopeTenantId} primarySource={primarySource} sealedCountTotal={dashboardMetrics?.sealed_count_total} />
      {/* Bandeau réapparition : affiché uniquement quand header masqué (hidden) — Phase 2 */}
      {chromeState === "hidden" && (
        <ChromeTriggerBar
          onReveal={() => revealChrome("tap_trigger")}
          enableHover={interactionMode === "desktop"}
        />
      )}
    </div>
    </TenantErrorView>
    </TenantLoadingGate>
    </DashboardErrorBoundary>
    </TenantProvider>
    </ChartExpandedProvider>
  );
}

export function DashboardWithFilters({
  initialShowTenantChoice = false,
  initialAppView = "pilotage",
}: {
  initialShowTenantChoice?: boolean;
  initialAppView?: AppView;
} = {}) {
  return (
    <ChromeAdaptiveProvider>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Chargement…</div>}>
        <DashboardWithFiltersContent
          initialShowTenantChoice={initialShowTenantChoice}
          initialAppView={initialAppView}
        />
      </Suspense>
    </ChromeAdaptiveProvider>
  );
}
