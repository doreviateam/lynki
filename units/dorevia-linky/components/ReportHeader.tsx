"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PERIOD_OPTIONS,
  getAvailableYears,
  getPeriodFromKeyAndYear,
  getKeyAndYearFromPeriod,
  getDefaultPeriod,
  type PeriodRange,
} from "@/app/lib/period-utils";
import { IntegrityBadge } from "@/components/IntegrityBadge";
import { useChromeAdaptive, useChromeLock } from "@/app/context/ChromeAdaptiveContext";
import { useTenantContextOptional } from "@/app/context/TenantContext";
import { useAccountingPeriods } from "@/app/lib/use-accounting-periods";
import { DEFAULT_PRODUCT_NAME } from "@/app/lib/tenant-config-defaults";
import { TenantSelector } from "@/components/TenantSelector";
import { ReportHeaderContent } from "@/components/ReportHeaderContent";
import { companyDisplayLabel, normalizeCompanyId } from "@/app/lib/company-id";

export type ViewMode = "all" | "cash" | "business" | "corrections" | "pos_shops" | "pos_z";

interface CompanyItem {
  company_id: string;
  documents_count: number;
  display_name?: string;
}

/** Mois (1..12) par année ayant des données */
interface MonthsByYear {
  [year: string]: number[];
}

interface ReportHeaderProps {
  tenantId: string;
  companies: CompanyItem[];
  companiesLoading: boolean;
  selectedCompanyId: string | null;
  onCompanyChange: (companyId: string | null) => void;
  period: PeriodRange;
  onPeriodChange: (period: PeriodRange) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  /** Années contenant des données (si null, fallback sur getAvailableYears) */
  availableYears?: number[] | null;
  /** Mois (1..12) par année ayant des données : { "2026": [1, 2, 3], ... } */
  monthsWithDataByYear?: MonthsByYear;
  /** Nombre de documents scellés sur la période (pour le badge intégrité) */
  sealedCount?: number | null;
  /** true = les 5 sources ont répondu, comptage fiable. false = partiel, à rafraîchir. */
  sealedCountComplete?: boolean;
  /** Rafraîchir les métriques (badge preuves scellées) */
  onRefreshMetrics?: () => void;
  /** Masquer le badge ou afficher version neutre quand complétude non validée (spec AT5) */
  showIntegrityBadge?: boolean;
  /** Application affichée (linky = dashboard, odoo = iframe Odoo) */
  currentApp?: "linky" | "odoo";
  /** Bascule vers Linky ou Odoo */
  onAppChange?: (appId: "linky" | "odoo") => void;
  /** Phase 2 : affichage compact (une ligne, badge période, filtres secondaires masqués) */
  chromeCompact?: boolean;
  /** Phase 2 : callback pour révéler le header (tap sur bandeau compact) */
  onExpandChrome?: () => void;
  /** SPEC_UX_NAVIGATION §5 : masquer kpiMode en Synthèse */
  appView?: "pilotage" | "synthese";
  onNavigateToAppView?: (view: "pilotage" | "synthese") => void;
  /** Barre type maquette canon (évite le double bandeau avec CockpitDesktopView) */
  cockpitAppBar?: {
    confidenceScore: number | null;
    confidenceLabel?: string;
    subtitle?: string;
  };
}

export function ReportHeader({
  tenantId,
  companies,
  companiesLoading,
  selectedCompanyId,
  onCompanyChange,
  period,
  onPeriodChange,
  viewMode,
  onViewModeChange,
  availableYears = null,
  monthsWithDataByYear = {},
  sealedCount = null,
  sealedCountComplete,
  onRefreshMetrics,
  showIntegrityBadge = true,
  currentApp = "linky",
  onAppChange,
  chromeCompact = false,
  onExpandChrome,
  appView = "pilotage",
  onNavigateToAppView,
  cockpitAppBar,
}: ReportHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectFocused, setSelectFocused] = useState(false);
  const chromeAdaptive = useChromeAdaptive();
  useChromeLock(menuOpen || selectFocused);
  const tenantCtx = useTenantContextOptional();
  // Rules of switch (§5.3) : fermer le menu au changement de tenant
  useEffect(() => {
    setMenuOpen(false);
  }, [tenantCtx?.resolvedTenant]);
  const branding = tenantCtx?.tenantConfig?.chrome?.branding;
  const headerOpts = tenantCtx?.tenantConfig?.chrome?.header;
  const workspace = tenantCtx?.tenantConfig?.workspace;
  const productName = branding?.productName ?? DEFAULT_PRODUCT_NAME;
  const tagline = branding?.tagline ?? "Décidez sur des données vérifiables. En temps réel.";
  const showCompanyFilter = headerOpts?.showCompanyFilter ?? true;
  const showPeriodFilter = headerOpts?.showPeriodFilter ?? true;
  const showPinChrome = headerOpts?.showPinChrome ?? true;
  const ODOO_URL = process.env.NEXT_PUBLIC_ODOO_URL ?? "https://odoo.stinger.sarl-la-platine.doreviateam.com/odoo";

  const [periodKey, setPeriodKey] = useState(() => {
    const { key } = getKeyAndYearFromPeriod(period.from, period.to);
    return key;
  });
  const [periodYear, setPeriodYear] = useState(() => {
    const { year } = getKeyAndYearFromPeriod(period.from, period.to);
    return year;
  });

  const sanitizedCompanies = useMemo(() => {
    return companies
      .map((c) => {
        const id = normalizeCompanyId(c.company_id);
        if (!id) return null;
        const label = companyDisplayLabel(c.display_name, c.company_id);
        return {
          company_id: id,
          documents_count:
            typeof c.documents_count === "number" && Number.isFinite(c.documents_count) ? c.documents_count : 0,
          display_name: label.length > 0 ? label : id,
        };
      })
      .filter((c) => c != null) as CompanyItem[];
  }, [companies]);

  const selectedCompanyIdForSelect = useMemo(() => {
    if (selectedCompanyId == null || selectedCompanyId === "") return "";
    if (typeof selectedCompanyId === "string") return selectedCompanyId;
    return normalizeCompanyId(selectedCompanyId) ?? "";
  }, [selectedCompanyId]);

  const { periodStatuses } = useAccountingPeriods(
    tenantId,
    selectedCompanyIdForSelect || null,
    periodYear
  );

  // Synchroniser period prop → state local (si period vient d'une source externe)
  // getKeyAndYearFromPeriod reconnaît la période par défaut comme "ytd" pour éviter d'afficher "Janvier"
  useEffect(() => {
    const { key, year } = getKeyAndYearFromPeriod(period.from, period.to);
    setPeriodKey((prev) => (prev !== key ? key : prev));
    setPeriodYear((prev) => (prev !== year ? year : prev));
  }, [period.from, period.to]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = getPeriodFromKeyAndYear(periodKey, periodYear);
      onPeriodChange(next);
    }, 200); // Debounce : évite saturation navigateur au changement d'année
    return () => clearTimeout(t);
  }, [periodKey, periodYear, onPeriodChange]);

  const yearsToShow = useMemo(() => {
    const currentYear = new Date().getFullYear();
    if (availableYears && availableYears.length > 0) {
      const set = new Set(availableYears);
      set.add(currentYear);
      if (!set.has(periodYear)) set.add(periodYear);
      return Array.from(set).sort((a, b) => b - a);
    }
    // Fallback (tenant sans données dans years-with-data, ex. laplatine2026) : année courante + passées
    return getAvailableYears();
  }, [availableYears, periodYear]);

  const periodOptionsToShow = useMemo(() => {
    const allOpt = PERIOD_OPTIONS[0]; // Toutes périodes (toutes années)
    const ytd = PERIOD_OPTIONS[1]; // Exercice à date
    const months = PERIOD_OPTIONS.slice(2); // Janvier…Décembre
    const yearKey = `${periodYear}`;
    const monthsForYear = monthsWithDataByYear[yearKey];
    if (monthsForYear && monthsForYear.length > 0) {
      const monthSet = new Set(monthsForYear);
      const filtered = months.filter((opt) => monthSet.has(parseInt(opt.value, 10)));
      return [allOpt, ytd, ...filtered];
    }
    // Pas de données par mois (ex. tenant laplatine2026, API vide) : afficher toutes les options pour permettre "Exercice à date"
    return PERIOD_OPTIONS;
  }, [monthsWithDataByYear, periodYear]);

  useEffect(() => {
    const monthKey = parseInt(periodKey, 10);
    if (periodKey !== "ytd" && periodKey !== "all" && !Number.isNaN(monthKey)) {
      const monthsForYear = monthsWithDataByYear[`${periodYear}`];
      if (monthsForYear && monthsForYear.length > 0 && !monthsForYear.includes(monthKey)) {
        setPeriodKey("ytd");
      }
    }
  }, [periodYear, monthsWithDataByYear, periodKey]);

  const VIEW_MODE_LABELS = {
    all: "Tout",
    cash: "Cash",
    business: "Business",
    corrections: "Corrections",
    pos_shops: "Points de vente",
    pos_z: "Z de caisse",
  };

  const moduleActif = VIEW_MODE_LABELS[viewMode];

  const tenantBadgeOrSelector =
    currentApp !== "linky"
      ? null
      : tenantCtx?.availableTenants && tenantCtx.availableTenants.length > 1
        ? React.createElement(TenantSelector, { variant: "inline" })
        : React.createElement("span", { className: "hidden shrink-0 rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)] whitespace-nowrap sm:inline" }, tenantId);

  const headerContent = (
    <ReportHeaderContent
      productName={productName}
      tagline={tagline}
      tenantBadgeOrSelector={tenantBadgeOrSelector}
      currentApp={currentApp}
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
      ODOO_URL={ODOO_URL}
      tenantCtx={tenantCtx}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      workspace={workspace}
      chromeAdaptive={chromeAdaptive}
      appView={appView}
      showPinChrome={showPinChrome}
      showCompanyFilter={showCompanyFilter}
      showPeriodFilter={showPeriodFilter}
      chromeCompact={chromeCompact}
      periodKey={periodKey}
      periodYear={periodYear}
      onPeriodKeyChange={setPeriodKey}
      onPeriodYearChange={setPeriodYear}
      periodOptionsToShow={periodOptionsToShow}
      yearsToShow={yearsToShow}
      companies={sanitizedCompanies}
      companiesLoading={companiesLoading}
      selectedCompanyId={selectedCompanyIdForSelect || null}
      onCompanyChange={onCompanyChange}
      moduleActif={moduleActif}
      showIntegrityBadge={showIntegrityBadge}
      tenantId={tenantId}
      sealedCount={sealedCount}
      sealedCountComplete={sealedCountComplete}
      onRefreshMetrics={onRefreshMetrics}
      onExpandChrome={onExpandChrome}
      onNavigateToAppView={onNavigateToAppView}
      periodStatuses={periodStatuses}
      cockpitAppBar={cockpitAppBar}
    />
  );

  return (
    <header
      className={`sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-secondary)]/95 backdrop-blur-sm shadow-sm ${chromeCompact ? "max-h-[72px]" : "max-h-[140px]"}`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {headerContent}
    </header>
  );
}
