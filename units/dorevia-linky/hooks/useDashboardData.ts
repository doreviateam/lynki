"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { getDefaultPeriod, type PeriodRange } from "@/app/lib/period-utils";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import { recordUxSample } from "@/app/lib/ux-metrics";

const COMPANIES_TIMEOUT_MS = 5000;
const DASHBOARD_METRICS_POLL_MS = 2 * 60 * 1000;
const INCOMPLETE_RETRY_MS = 2000;
const ENABLE_LIVE_POLLING = process.env.NEXT_PUBLIC_LINKY_ENABLE_LIVE_POLLING === "1";
const USE_METRIC_ENGINE = process.env.NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE === "1";
const FORCED_COMPANY_ID =
  typeof process.env.NEXT_PUBLIC_FORCE_COMPANY_ID === "string" && process.env.NEXT_PUBLIC_FORCE_COMPANY_ID.trim()
    ? process.env.NEXT_PUBLIC_FORCE_COMPANY_ID.trim()
    : null;
const TREASURY_UNBLOCK_AFTER_MS = 5000;
const METRICS_CACHE_KEY = "linky_dashboard_metrics";
const METRICS_CACHE_TTL_MS = Number(process.env.NEXT_PUBLIC_LINKY_METRICS_CACHE_TTL_MS ?? "0");
const DEFAULT_TENANT = "core";
const LAB_LINKY_HOST = "lab.linky.doreviateam.com";

export interface CompanyItem {
  company_id: string;
  documents_count: number;
  display_name?: string;
}

function deriveTenantFromHost(): string {
  if (typeof window === "undefined") return DEFAULT_TENANT;
  const host = window.location.hostname;
  if (host === LAB_LINKY_HOST) return DEFAULT_TENANT;
  const parts = host.split(".");
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
  } catch { return null; }
}

function setCachedMetrics(tenantId: string, companyId: string | null, period: { from: string; to: string }, data: DashboardMetricsResponse) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(METRICS_CACHE_KEY, JSON.stringify({
      data, tenant: tenantId, company: companyId ?? "", from: period.from, to: period.to, t: Date.now(),
    }));
  } catch { /* ignore */ }
}

function clearCachedMetrics() {
  if (typeof window === "undefined") return;
  try { sessionStorage.removeItem(METRICS_CACHE_KEY); } catch { /* ignore */ }
}

function adaptInstrumentsToDashboard(
  instruments: Record<string, { value: unknown; formatted: string; valueKind: string }>
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
    sealed_count_complete: true,
    sealed_count: undefined,
    generated_at: undefined,
  } as DashboardMetricsResponse;
}

export interface DashboardData {
  tenantId: string;
  scopeTenantId: string;
  showTenantChoice: boolean;
  onSetTenantNavigate: (id: string) => void;

  companies: CompanyItem[];
  companiesLoading: boolean;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  effectiveCompanyId: string | null;

  period: PeriodRange;
  setPeriod: (p: PeriodRange) => void;
  availableYears: number[] | null;
  monthsWithDataByYear: Record<string, number[]>;

  primarySource: "erp" | "vault";

  dashboardMetrics: DashboardMetricsResponse | null;
  metricsLoading: boolean;
  metricsError: boolean;
  attemptCount: number;
  showCards: boolean;
  isIncomplete: boolean;
  showTreasuryAfterIncomplete: boolean;
  userBypassIncomplete: boolean;
  handleRefreshMetrics: () => void;
  handleViewAnyway: () => void;
}

export function useDashboardData(initialShowTenantChoice = false): DashboardData {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tenantFromUrl = searchParams.get("tenant");

  const [tenantId, setTenantId] = useState<string>(DEFAULT_TENANT);
  const [showTenantChoice, setShowTenantChoice] = useState(!!initialShowTenantChoice);
  const [primarySource, setPrimarySource] = useState<"erp" | "vault">("vault");
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodRange>(getDefaultPeriod);
  const [availableYears, setAvailableYears] = useState<number[] | null>(null);
  const [monthsWithDataByYear, setMonthsWithDataByYear] = useState<Record<string, number[]>>({});
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showTreasuryAfterIncomplete, setShowTreasuryAfterIncomplete] = useState(false);
  const [userBypassIncomplete, setUserBypassIncomplete] = useState(false);
  const prevScopeRef = useRef("");
  const fetchMetricsRef = useRef<() => void>(() => {});

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
  const scopeTenantId = requestedTenant ?? tenantId;

  const onSetTenantNavigate = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("tenant", id);
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, searchParams]
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
        const list = Array.isArray(data) ? data : [];
        setCompanies(list);
        const hasVaultData = list.some((c) => c.documents_count > 0);
        if (list.length > 0 && hasVaultData) {
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

  const effectiveCompanyId =
    FORCED_COMPANY_ID ??
    selectedCompanyId ??
    (companies.length > 0 && companies.some((c) => c.documents_count > 0) ? companies[0].company_id : null);
  const scopeKey = `${scopeTenantId}|${effectiveCompanyId ?? ""}|${period.from}|${period.to}`;

  useEffect(() => {
    if (companiesLoading) return;
    const hasVaultData = companies.some((c) => c.documents_count > 0);
    if (hasVaultData && !effectiveCompanyId) return;

    let cancelled = false;
    const retryTimeoutRef = { id: null as ReturnType<typeof setTimeout> | null };
    const retryCountRef = { count: 0 };

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
      });
      const apiPath = USE_METRIC_ENGINE ? `/api/instruments?${params}` : `/api/dashboard-metrics?${params}`;
      const fetchStart = Date.now();
      fetch(apiPath, { cache: "no-store", headers: { Accept: "application/json" } })
        .then((r) => r.json())
        .then((raw) => {
          recordUxSample({
            tenant: scopeTenantId,
            company: effectiveCompanyId ?? "",
            periodFrom: period.from,
            periodTo: period.to,
            latencyMs: Date.now() - fetchStart,
          });
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
  }, [scopeTenantId, selectedCompanyId, effectiveCompanyId, period.from, period.to, companiesLoading, companies, scopeKey]);

  const showCards =
    (dashboardMetrics?.sealed_count_complete === true || userBypassIncomplete) &&
    dashboardMetrics != null &&
    !metricsLoading &&
    !metricsError;
  const isIncomplete = !metricsLoading && !metricsError && (dashboardMetrics?.sealed_count_complete === false) && !userBypassIncomplete;

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

  return {
    tenantId,
    scopeTenantId,
    showTenantChoice,
    onSetTenantNavigate,
    companies,
    companiesLoading,
    selectedCompanyId,
    setSelectedCompanyId,
    effectiveCompanyId,
    period,
    setPeriod: handlePeriodChange,
    availableYears,
    monthsWithDataByYear,
    primarySource,
    dashboardMetrics,
    metricsLoading,
    metricsError,
    attemptCount,
    showCards,
    isIncomplete,
    showTreasuryAfterIncomplete,
    userBypassIncomplete,
    handleRefreshMetrics,
    handleViewAnyway,
  };
}
