"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IntegrityBadge } from "@/components/IntegrityBadge";
import { Icon } from "@/components/Icon";
import { TenantSelector } from "@/components/TenantSelector";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { CockpitChromeUtilities } from "@/components/layout/CockpitAppBarRow";
import type { ReportHeaderContentProps } from "./ReportHeaderContent.types";
import type { PeriodStatusMap } from "@/app/lib/use-accounting-periods";
import { companyDisplayLabel, normalizeCompanyId, safeReactText } from "@/app/lib/company-id";
import { UI_STATE_LABELS } from "@/app/lib/cockpit/ui-state-labels";
import { COCKPIT_HEADER_SHOW_TRUST_IN_CONTEXT_STRIP } from "@/app/lib/cockpit/cockpit-header-flags";
import { COCKPIT_HEADER_FILTER_LABEL } from "@/app/lib/cockpit/cockpit-typography";
import { navHrefWithTenant } from "@/components/layout/navTenantHref";

export function ReportHeaderContentBody(props: ReportHeaderContentProps) {
  const searchParams = useSearchParams();
  const tenantQs = searchParams.get("tenant");
  const pilotageHomeHref = navHrefWithTenant("/", tenantQs);

  const {
    productName,
    tagline,
    tenantBadgeOrSelector,
    currentApp,
    menuOpen,
    setMenuOpen,
    ODOO_URL,
    tenantCtx,
    viewMode,
    onViewModeChange,
    workspace,
    chromeAdaptive,
    appView,
    showPinChrome,
    showCompanyFilter,
    showPeriodFilter,
    chromeCompact,
    periodKey,
    periodYear,
    onPeriodKeyChange,
    onPeriodYearChange,
    periodOptionsToShow,
    yearsToShow,
    companies,
    companiesLoading,
    selectedCompanyId,
    onCompanyChange,
    moduleActif,
    showIntegrityBadge,
    tenantId,
    sealedCount,
    sealedCountComplete,
    onRefreshMetrics,
    onExpandChrome,
    onNavigateToAppView,
    periodStatuses,
    cockpitAppBar,
    pilotagePhoneCompact,
    pilotagePerimeterOpen,
    setPilotagePerimeterOpen,
  } = props;

  /** Bandeau Carole fusionné en régime tablette : cockpit tactile compact, pas desktop rétréci. */
  const cockpitBandTablet = cockpitAppBar?.bandLayout === "tablet";

  /** iPad / tablette : lockup aligné sidebar — « Lynki » + sous-texte (sans préfixe type « Dorevia »). */
  const tabletBrandName = useMemo(() => {
    const parts = productName.trim().split(/\s+/);
    if (parts.length >= 2) return parts[parts.length - 1] ?? productName;
    return productName;
  }, [productName]);

  const periodStatusLabel = useMemo(() => getPeriodContextLabel(periodKey, periodYear, periodStatuses), [periodKey, periodYear, periodStatuses]);

  const tenantDisplayLabel = useMemo(() => {
    if (!tenantCtx?.resolvedTenant) return tenantId;
    const opt = tenantCtx.availableTenants?.find((t) => t.id === tenantCtx.resolvedTenant);
    return opt?.label ?? tenantCtx.resolvedTenant ?? tenantId;
  }, [tenantCtx?.resolvedTenant, tenantCtx?.availableTenants, tenantId]);

  const sessionInitial = useMemo(() => {
    const s = tenantDisplayLabel.trim();
    const ch = s.length > 0 ? s.charAt(0) : tenantId.charAt(0);
    return ch.toUpperCase();
  }, [tenantDisplayLabel, tenantId]);

  const selectedCompanyTitle = useMemo(() => {
    if (!selectedCompanyId) return "Toutes les sociétés";
    const c = companies.find((x) => normalizeCompanyId(x.company_id) === selectedCompanyId);
    return c ? companyDisplayLabel(c.display_name, c.company_id) : "";
  }, [companies, selectedCompanyId]);

  const showCockpitContextRow =
    !!cockpitAppBar &&
    currentApp === "linky" &&
    (tenantBadgeOrSelector ||
      showCompanyFilter ||
      showPeriodFilter ||
      (showIntegrityBadge && COCKPIT_HEADER_SHOW_TRUST_IN_CONTEXT_STRIP));

  const menuIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6 text-[var(--text)]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );

  /** Corps du menu (sans entrée tenant menu) — réutilisé quand le tenant est déjà dans le panneau Périmètre fusionné phone. */
  const overflowNavBody = (
    <>
      {appView !== "synthese" && (
        <>
          <div className="border-b border-[var(--border)] px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Comptabilité</div>
          {(
            [
              ["all", "Tout"],
              ["cash", "Cash"],
              ["business", "Business"],
              ["corrections", "Corrections"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              role="menuitem"
              onClick={() => {
                onViewModeChange(mode);
                setMenuOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm ${viewMode === mode ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"}`}
            >
              {label}
            </button>
          ))}
          <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Point de vente</div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onViewModeChange("pos_shops");
              setMenuOpen(false);
            }}
            className={`block w-full px-3 py-2 text-left text-sm ${viewMode === "pos_shops" ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"}`}
          >
            Points de vente
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onViewModeChange("pos_z");
              setMenuOpen(false);
            }}
            className={`block w-full px-3 py-2 text-left text-sm ${viewMode === "pos_z" ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"}`}
          >
            Z de caisse <span className="text-[10px] text-[var(--muted)]">(à venir)</span>
          </button>
        </>
      )}
      <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Applications</div>
      <a
        href={ODOO_URL}
        target="_blank"
        rel="noopener noreferrer"
        role="menuitem"
        onClick={() => setMenuOpen(false)}
        className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
      >
        Odoo (système source)
      </a>
      <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Administration</div>
      <a
        href="/admin/dlp-config"
        role="menuitem"
        onClick={() => setMenuOpen(false)}
        className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
      >
        Paramétrage des décisions
      </a>
      {workspace?.sources?.map((s) => (
        <a
          key={s.id}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          role="menuitem"
          onClick={() => setMenuOpen(false)}
          className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
        >
          {s.label}
        </a>
      ))}
      {workspace?.apps?.map((a) => (
        <a
          key={a.id}
          href={a.href ?? "#"}
          role="menuitem"
          onClick={() => setMenuOpen(false)}
          className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
        >
          {a.label}
        </a>
      ))}
      {chromeAdaptive && showPinChrome && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            chromeAdaptive.setChromePinned(!chromeAdaptive.chromePinned);
            setMenuOpen(false);
          }}
          className={`block w-full px-3 py-2 text-left text-sm ${chromeAdaptive.chromePinned ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"}`}
        >
          Garder le bandeau visible
        </button>
      )}
    </>
  );

  const overflowNav = (
    <>
      {tenantCtx?.availableTenants && tenantCtx.availableTenants.length > 1 && (
        <TenantSelector variant="menu" onCloseMenu={() => setMenuOpen(false)} />
      )}
      {overflowNavBody}
    </>
  );

  /** Pas de menu burger en bandeau cockpit : navigation = sidebar + bottom nav + filtres (évite doublons / promesses non cadrées). */
  const cockpitChromeTrailingSlot = null;

  const cockpitContextHasFilters =
    !!tenantBadgeOrSelector || showCompanyFilter || showPeriodFilter;

  /** Option B (CDCF) : badge confiance à droite du bloc contexte ; désactivé en V1 canonique (Option A). */
  const cockpitContextTrustSignal =
    showCockpitContextRow && COCKPIT_HEADER_SHOW_TRUST_IN_CONTEXT_STRIP ? (
      showIntegrityBadge ? (
        <IntegrityBadge
          tenantId={tenantId}
          sealedCount={sealedCount}
          sealedCountComplete={sealedCountComplete}
          onRefresh={onRefreshMetrics}
          visualWeight="secondary"
        />
      ) : (
        <span
          className="inline-flex h-7 items-center gap-1 rounded-md border border-[color-mix(in_srgb,var(--border)_40%,transparent)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] px-1.5 text-[10px] text-[var(--text-secondary)]"
          title="Synchronisation en cours"
        >
          {UI_STATE_LABELS.pending}
        </span>
      )
    ) : null;

  /** Filtres cockpit — coquilles type maquette Carole / `carole_suggest_01.html` (sélecteurs sans cadre interne). */
  const cockpitShellSelectClass = cockpitBandTablet
    ? "mt-0.5 block w-full min-w-0 max-w-full cursor-pointer border-0 bg-transparent p-0 text-[12px] font-semibold text-[var(--text)] focus:outline-none focus:ring-0 disabled:opacity-60"
    : "mt-1 block w-full min-w-0 max-w-full cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-[var(--text)] focus:outline-none focus:ring-0 disabled:opacity-60";

  /** Select année : centré dans la coquille (alignement vertical avec les autres filtres). */
  const cockpitShellSelectYearClass = cockpitBandTablet
    ? "mt-0.5 block w-full min-w-0 cursor-pointer border-0 bg-transparent p-0 text-center text-[12px] font-semibold tabular-nums text-[var(--text)] focus:outline-none focus:ring-0 disabled:opacity-60"
    : "mt-0.5 block w-full min-w-0 cursor-pointer border-0 bg-transparent p-0 text-center text-[13px] font-semibold tabular-nums text-[var(--text)] focus:outline-none focus:ring-0 disabled:opacity-60";

  const cockpitFilterShellClass = cockpitBandTablet
    ? "flex min-h-[46px] shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1.5 shadow-[0_3px_11px_rgba(0,0,0,0.11)]"
    : "flex min-h-[52px] shrink-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.14)]";

  /** Zone valeur tenant dans la coquille (TenantSelector inline ou libellé seul) — tablette : moins bavard. */
  const tenantShellInnerClass = cockpitBandTablet
    ? "mt-0.5 min-w-0 [&_button]:!min-h-0 [&_button]:h-auto [&_button]:min-w-0 [&_button]:w-full [&_button]:justify-start [&_button]:gap-1.5 [&_button]:rounded-none [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-0 [&_button]:py-0 [&_button]:text-left [&_button]:text-[12px] [&_button]:font-semibold [&_button]:leading-snug [&_button]:shadow-none [&_button]:hover:bg-transparent [&_span]:text-[12px] [&_span]:font-semibold [&_span]:leading-snug"
    : "mt-1 min-w-0 [&_button]:!min-h-0 [&_button]:h-auto [&_button]:min-w-0 [&_button]:w-full [&_button]:justify-start [&_button]:gap-2 [&_button]:rounded-none [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-0 [&_button]:py-0 [&_button]:text-left [&_button]:text-[13px] [&_button]:font-semibold [&_button]:leading-tight [&_button]:shadow-none [&_button]:hover:bg-transparent [&_span]:text-[13px] [&_span]:font-semibold";

  const tenantShellSingleClass = cockpitBandTablet
    ? `${tenantShellInnerClass} [&>span]:!inline [&>span]:max-w-[8.75rem] [&>span]:truncate [&>span]:text-[12px] [&>span]:font-semibold [&>span]:text-[var(--text)] [&>span]:leading-snug`
    : `${tenantShellInnerClass} [&>span]:!inline [&>span]:max-w-[10rem] [&>span]:truncate [&>span]:text-[13px] [&>span]:font-semibold [&>span]:text-[var(--text)] [&>span]:leading-tight`;

  const cockpitCaroleFilterCenter =
    showCockpitContextRow && (cockpitContextHasFilters || cockpitContextTrustSignal) ? (
      <div
        className={
          cockpitBandTablet
            ? "flex w-max min-w-full max-w-none flex-nowrap items-center gap-2 py-0.5 min-[900px]:gap-2.5"
            : "mx-auto flex w-full min-w-0 max-w-full flex-wrap items-center justify-center gap-2 sm:gap-3 md:mx-0 md:w-full md:min-w-0 md:flex-nowrap md:justify-start md:gap-3.5 lg:mx-auto lg:w-auto lg:justify-center"
        }
        role="group"
        aria-label={cockpitContextTrustSignal ? "Périmètre de lecture et confiance" : "Périmètre de lecture"}
      >
        {cockpitContextHasFilters ? (
          <div
            className={
              cockpitBandTablet
                ? "flex w-max max-w-none flex-nowrap items-center gap-2 min-[900px]:gap-2.5"
                : "flex min-w-0 w-full max-w-full flex-nowrap items-center justify-center gap-2.5 sm:gap-3 md:w-full md:justify-start md:gap-3.5 lg:w-auto lg:justify-center"
            }
          >
            {/* flex-1 + min-w-0 : sur laptop la zone Tenant/Société rétrécit et scroll en interne ; Période + Année restent visibles (shrink-0). */}
            <div
              className={
                cockpitBandTablet
                  ? "flex shrink-0 flex-nowrap items-center gap-2 min-[900px]:gap-2.5"
                  : "touch-pan-x flex min-w-0 flex-1 basis-0 flex-nowrap items-center justify-start gap-2.5 overflow-x-auto overflow-y-visible py-0.5 [scrollbar-width:thin] sm:gap-3 md:gap-3.5 lg:flex-none lg:basis-auto"
              }
              aria-label="Filtres tenant et société"
            >
              {tenantBadgeOrSelector ? (
                <div
                  className={
                    cockpitBandTablet
                      ? `${cockpitFilterShellClass} min-w-[120px] max-w-[13rem] shrink-0 overflow-hidden min-[900px]:min-w-[132px]`
                      : `${cockpitFilterShellClass} min-w-[124px] max-w-[16rem] md:max-w-[11.5rem] lg:max-w-[13rem] xl:max-w-[16rem]`
                  }
                >
                  <Icon name="filter_alt" size={cockpitBandTablet ? 15 : 16} className="shrink-0 text-[var(--accent)]" aria-hidden />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div
                      className={
                        cockpitBandTablet
                          ? "text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]"
                          : "text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]"
                      }
                    >
                      Tenant
                    </div>
                    <div className={tenantShellSingleClass}>{tenantBadgeOrSelector}</div>
                  </div>
                </div>
              ) : null}
              {showCompanyFilter && (
                <div
                  className={
                    cockpitBandTablet
                      ? `${cockpitFilterShellClass} min-w-[180px] max-w-[14rem] shrink-0 overflow-hidden min-[900px]:min-w-[200px]`
                      : `${cockpitFilterShellClass} min-w-[9rem] max-w-[11.25rem] shrink-0 overflow-hidden sm:max-w-[11.75rem] md:max-w-[12rem] lg:max-w-[12.5rem] xl:max-w-[13.25rem]`
                  }
                >
                  <div className="min-w-0 w-full max-w-full flex-1 overflow-hidden leading-tight">
                    <label htmlFor="company-select-cockpit" className="block min-w-0 cursor-pointer">
                      <span
                        className={
                          cockpitBandTablet
                            ? "text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]"
                            : "text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]"
                        }
                      >
                        Société
                      </span>
                      <select
                        id="company-select-cockpit"
                        disabled={companiesLoading}
                        value={selectedCompanyId ?? ""}
                        onChange={(e) => onCompanyChange(e.target.value || null)}
                        className={`w-full min-w-0 max-w-full truncate ${cockpitShellSelectClass}`}
                        aria-label="Société"
                        title={selectedCompanyTitle}
                      >
                        <option value="">Toutes les sociétés</option>
                        {companies.map((c) => {
                          const id = normalizeCompanyId(c.company_id);
                          if (!id) return null;
                          return (
                            <option key={id} value={id}>
                              {companyDisplayLabel(c.display_name, c.company_id)}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </div>
            {showPeriodFilter ? (
              cockpitBandTablet ? (
                /** iPad : une seule coquille Période + Année (sinon l’année restait hors écran dans le scroll horizontal). */
                <div
                  className="flex min-h-0 min-w-[132px] max-w-[12rem] shrink-0 flex-col items-stretch gap-0 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 shadow-[0_3px_11px_rgba(0,0,0,0.11)] min-[900px]:min-w-[144px]"
                >
                  <div className="flex min-w-0 flex-col gap-2 leading-tight">
                    <label htmlFor="period-key-cockpit" className="block min-w-0 cursor-pointer">
                      <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Période
                      </span>
                      <select
                        id="period-key-cockpit"
                        value={periodKey}
                        onChange={(e) => onPeriodKeyChange(e.target.value)}
                        className={`w-full min-w-0 max-w-full truncate ${cockpitShellSelectClass}`}
                        title={periodOptionsToShow.find((o) => o.value === periodKey)?.label}
                      >
                        {periodOptionsToShow.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {enrichPeriodLabel(opt, periodYear, periodStatuses)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label htmlFor="period-year-cockpit" className="block min-w-0 cursor-pointer">
                      <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Année
                      </span>
                      <select
                        id="period-year-cockpit"
                        value={periodYear}
                        onChange={(e) => onPeriodYearChange(Number(e.target.value))}
                        className={`w-full min-w-0 max-w-full tabular-nums ${cockpitShellSelectClass}`}
                        aria-label="Année"
                      >
                        {yearsToShow.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex shrink-0 flex-nowrap items-center gap-2.5 sm:gap-3 md:gap-3.5">
                  <div
                    className={`${cockpitFilterShellClass} min-w-[6.5rem] max-w-[7.75rem] shrink-0 sm:max-w-[8rem] md:w-[8rem] md:max-w-[8rem] lg:w-[8.25rem] lg:max-w-[8.25rem] xl:w-auto xl:max-w-[9.5rem] overflow-hidden`}
                  >
                    <div className="min-w-0 w-full max-w-full flex-1 overflow-hidden leading-tight">
                      <label htmlFor="period-key-cockpit" className="block cursor-pointer">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                          Période
                        </span>
                        <select
                          id="period-key-cockpit"
                          value={periodKey}
                          onChange={(e) => onPeriodKeyChange(e.target.value)}
                          className={`min-w-0 max-w-full truncate ${cockpitShellSelectClass}`}
                          title={periodOptionsToShow.find((o) => o.value === periodKey)?.label}
                        >
                          {periodOptionsToShow.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {enrichPeriodLabel(opt, periodYear, periodStatuses)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                  <div className="flex min-h-[52px] w-[5.75rem] shrink-0 flex-col items-center justify-center gap-0 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-center shadow-[0_4px_14px_rgba(0,0,0,0.14)]">
                    <label htmlFor="period-year-cockpit" className="flex w-full cursor-pointer flex-col items-center gap-0 text-center">
                      <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        Année
                      </span>
                      <select
                        id="period-year-cockpit"
                        value={periodYear}
                        onChange={(e) => onPeriodYearChange(Number(e.target.value))}
                        className={cockpitShellSelectYearClass}
                        aria-label="Année"
                      >
                        {yearsToShow.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )
            ) : null}
          </div>
        ) : null}
        {cockpitContextTrustSignal ? (
          <div
            className={
              cockpitBandTablet
                ? `flex min-h-[46px] shrink-0 flex-col justify-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1.5 ${
                    cockpitContextHasFilters ? "" : ""
                  }`
                : `flex min-h-[52px] shrink-0 flex-col justify-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-2 ${
                    cockpitContextHasFilters ? "" : ""
                  }`
            }
          >
            <span className={`shrink-0 whitespace-nowrap ${COCKPIT_HEADER_FILTER_LABEL}`}>Confiance</span>
            <div className={cockpitBandTablet ? "flex min-h-[26px] items-center" : "flex min-h-[28px] items-center"}>
              {cockpitContextTrustSignal}
            </div>
          </div>
        ) : null}
      </div>
    ) : null;

  const content = (
    <div
      className={`mx-auto ${cockpitAppBar ? "max-w-none px-0 pt-0 pb-0" : "max-w-4xl px-4 py-3"}`}
    >
      {cockpitAppBar && currentApp === "linky" ? (
        <>
          {!chromeCompact ? (
            <div
              className="min-w-0 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-secondary)_94%,transparent)] backdrop-blur-md"
              role="region"
              aria-label="En-tête pilotage"
            >
              {/* Même échelle horizontale que le `main` cockpit fusionné (DashboardWithFilters) ; tablette = enveloppe plus serrée. */}
              <div
                className={
                  cockpitBandTablet
                    ? "mx-auto max-w-none px-3.5 pb-2.5 pt-2.5 sm:px-5 sm:pb-3 sm:pt-3"
                    : "mx-auto max-w-none px-5 pb-3 pt-3 sm:px-7 sm:pb-3.5 sm:pt-3.5 lg:px-10 lg:pb-4 lg:pt-4 xl:px-12 2xl:mx-auto 2xl:max-w-[1920px] 2xl:px-14"
                }
              >
                <div
                  className={
                    cockpitBandTablet
                      ? "rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[0_8px_22px_rgba(0,0,0,0.14)]"
                      : "rounded-[20px] border border-[var(--border)] bg-[var(--panel)] shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                  }
                >
                  {cockpitBandTablet ? (
                    <div className="flex min-w-0 flex-col">
                      {/* Tablette / iPad — deux rangées fixes (CDCF / spec header dédié) : marque + vue + filtres + actions, puis périmètre actif. */}
                      <div className="flex min-w-0 flex-nowrap items-center gap-2.5 px-3 py-2.5 min-[900px]:gap-3.5 md:px-3.5 md:py-3">
                        <Link
                          href={pilotageHomeHref}
                          className="group flex shrink-0 items-center gap-2.5 rounded-xl outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--panel-2)_55%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                          aria-label="Retour au cockpit de pilotage"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] font-headline text-sm font-extrabold leading-none tracking-tight text-white shadow-[0_4px_12px_rgba(0,0,0,0.14)] sm:h-10 sm:w-10 sm:text-base">
                            DL
                          </div>
                          <div className="min-w-0 leading-tight">
                            <div className="font-headline text-[1.05rem] font-extrabold leading-none tracking-tight text-[var(--text)] sm:text-[1.125rem]">
                              {tabletBrandName}
                            </div>
                            <div className="mt-1 text-[11px] leading-snug text-[var(--muted)] sm:text-xs" title={tagline}>
                              Cockpit financier
                            </div>
                          </div>
                        </Link>
                        <div
                          className="hidden h-9 w-px shrink-0 self-center bg-[color-mix(in_srgb,var(--border)_65%,transparent)] min-[480px]:block sm:h-10"
                          aria-hidden
                        />
                        <h1 className="shrink-0 whitespace-nowrap pl-0.5 font-headline text-[1.3rem] font-extrabold leading-none tracking-[-0.02em] text-[var(--text)] min-[900px]:text-[1.45rem]">
                          Pilotage
                        </h1>
                        <div className="min-w-0 flex-1 self-center overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 pt-0.5 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
                          {cockpitCaroleFilterCenter}
                        </div>
                        <button
                          type="button"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--panel-2)] active:bg-[var(--panel-2)]"
                          aria-label="Notifications (bientôt disponible)"
                        >
                          <Icon name="notifications" size={17} />
                        </button>
                      </div>
                      <div
                        className="flex min-w-0 flex-nowrap items-center gap-3 border-t border-[var(--border)] px-3 py-2.5 sm:px-3.5"
                        aria-label="Périmètre actif"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] font-headline text-sm font-extrabold text-white"
                            aria-hidden
                          >
                            {sessionInitial}
                          </div>
                          <span
                            className="min-w-0 truncate text-[13px] font-semibold leading-snug text-[var(--text)]"
                            title={tenantDisplayLabel}
                          >
                            {tenantDisplayLabel}
                          </span>
                        </div>
                        <span
                          className="ml-auto inline-flex max-w-[120px] shrink-0 items-center gap-1 rounded-md border border-[color-mix(in_srgb,var(--border)_45%,transparent)] bg-[color-mix(in_srgb,var(--panel)_88%,transparent)] px-2 py-0.5 text-[10px] font-medium leading-tight tabular-nums text-[var(--text-secondary)]"
                          title={tenantId}
                        >
                          <Icon name="badge" size={11} className="shrink-0 opacity-80" aria-hidden />
                          <span className="min-w-0 truncate">{tenantId}</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                  <div className="grid grid-cols-1 gap-4 px-4 py-3.5 sm:px-5 sm:py-4 md:grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto] md:items-center md:gap-4 md:px-5 md:py-4 lg:gap-6 lg:px-6 lg:py-5">
                    <div className="relative z-10 min-w-0 shrink-0 md:max-w-[12rem] md:pr-3 lg:max-w-none lg:pr-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Vue active</div>
                      <h1 className="font-headline mt-1 text-[1.5rem] font-extrabold tracking-tight text-[var(--text)] sm:text-[1.625rem]">
                        Pilotage
                      </h1>
                    </div>
                    <div className="flex min-w-0 justify-center md:justify-start lg:justify-center">
                      {cockpitCaroleFilterCenter}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-start gap-2.5 sm:gap-3 md:justify-end md:pl-2 lg:pl-3">
                      <button
                        type="button"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--panel-2)]"
                        aria-label="Notifications (bientôt disponible)"
                      >
                        <Icon name="notifications" size={18} />
                      </button>
                      <div className="flex min-w-0 max-w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.12)]">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] font-headline text-base font-extrabold text-white"
                          aria-hidden
                        >
                          {sessionInitial}
                        </div>
                        <div className="min-w-0 leading-tight">
                          <div className="truncate text-sm font-semibold text-[var(--text)]">{tenantDisplayLabel}</div>
                          <div className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--panel)] px-2 py-0.5 text-[11px] font-semibold text-[var(--warning)]">
                            <Icon name="badge" size={14} className="shrink-0" aria-hidden />
                            <span className="truncate">{tenantId}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                  {periodStatusLabel ? (
                    <div
                      className={
                        cockpitBandTablet
                          ? "border-t border-[var(--border)] px-3 py-1.5 sm:px-4"
                          : "border-t border-[var(--border)] px-4 py-2 sm:px-5 md:px-5 lg:px-6"
                      }
                    >
                      <p className="text-[10px] leading-snug text-[var(--muted)]">{periodStatusLabel}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-2 min-w-0">
              {/* Mode compact : bandeau shell (actions uniquement), sans recherche niveau 1 */}
              <div className="flex w-full items-center justify-end gap-2">
                <CockpitChromeUtilities variant="orientation" trailingSlot={cockpitChromeTrailingSlot} />
              </div>
            </div>
          )}
        </>
      ) : pilotagePhoneCompact && currentApp === "linky" && !chromeCompact ? (
        <div className="min-w-0 px-3 pt-0.5 pb-0" role="region" aria-label="Pilotage">
          <div className="flex items-center justify-between gap-2">
            <h2 className="shrink-0 font-headline text-xl font-extrabold leading-[1.15] tracking-tight text-[var(--text)]">
              Pilotage
            </h2>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-0">
              {showIntegrityBadge ? (
                <div className="max-w-[min(7.5rem,30vw)] min-w-0 shrink scale-[0.92] origin-right">
                  <IntegrityBadge
                    tenantId={tenantId}
                    sealedCount={sealedCount}
                    sealedCountComplete={sealedCountComplete}
                    onRefresh={onRefreshMetrics}
                    visualWeight="secondary"
                  />
                </div>
              ) : (
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--border)] px-1.5 py-px text-[10px] text-[var(--text-secondary)]"
                  title="Synchronisation en cours"
                >
                  {UI_STATE_LABELS.pending}
                </span>
              )}
              <div className="flex shrink-0 scale-90 origin-center">
                <ThemeToggle />
              </div>
              {onRefreshMetrics ? (
                <button
                  type="button"
                  onClick={() => onRefreshMetrics()}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--hover)] active:bg-[var(--hover)]"
                  aria-label="Actualiser les indicateurs"
                >
                  <Icon name="sync_saved_locally" size={17} />
                </button>
              ) : null}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setPilotagePerimeterOpen(false);
                    setMenuOpen(!menuOpen);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                  aria-label="Menu application"
                  aria-expanded={menuOpen}
                >
                  {menuIcon}
                </button>
                {menuOpen ? (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      aria-hidden
                      data-chrome-lock="true"
                      onClick={() => setMenuOpen(false)}
                    />
                    <nav
                      className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 shadow-lg"
                      role="menu"
                      data-chrome-lock="true"
                    >
                      {overflowNav}
                    </nav>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <div className="relative mt-0">
            <button
              type="button"
              id="pilotage-perimeter-nav-trigger"
              className="flex w-full cursor-pointer items-center gap-1.5 rounded-md py-0.5 text-left hover:bg-[color-mix(in_srgb,var(--panel)_40%,transparent)] active:bg-[color-mix(in_srgb,var(--panel)_55%,transparent)]"
              aria-expanded={pilotagePerimeterOpen}
              aria-controls="pilotage-perimeter-panel"
              onClick={() => {
                setMenuOpen(false);
                setPilotagePerimeterOpen(!pilotagePerimeterOpen);
              }}
            >
              <span className="min-w-0 flex-1 truncate text-left text-sm font-medium leading-snug text-[var(--text)]">
                {pilotagePhoneCompact.contextSummary}
              </span>
              <span className="shrink-0 text-xs font-bold tracking-wide text-[var(--accent)]">Périmètre</span>
              <Icon
                name="expand_more"
                size={20}
                className={`shrink-0 text-[var(--muted)] transition-transform ${pilotagePerimeterOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {pilotagePerimeterOpen ? (
              <>
                <div
                  className="fixed inset-0 z-40"
                  aria-hidden
                  data-chrome-lock="true"
                  onClick={() => setPilotagePerimeterOpen(false)}
                />
                <div
                  id="pilotage-perimeter-panel"
                  role="dialog"
                  aria-label="Périmètre"
                  aria-modal="true"
                  data-chrome-lock="true"
                  className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(60vh,420px)] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg"
                >
                  <div className="flex flex-col gap-1.5 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Périmètre</p>
                    {tenantCtx?.availableTenants && tenantCtx.availableTenants.length > 1 ? (
                      <div className="min-w-0 text-xs">{tenantBadgeOrSelector}</div>
                    ) : null}
                    {showCompanyFilter ? (
                      <>
                        <label htmlFor="company-select-pilotage-phone" className="sr-only">
                          Société
                        </label>
                        <select
                          id="company-select-pilotage-phone"
                          disabled={companiesLoading}
                          value={selectedCompanyId ?? ""}
                          onChange={(e) => onCompanyChange(e.target.value || null)}
                          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          aria-label="Société"
                          title={selectedCompanyTitle}
                        >
                          <option value="">Toutes les sociétés</option>
                          {companies.map((c) => {
                            const id = normalizeCompanyId(c.company_id);
                            if (!id) return null;
                            return (
                              <option key={id} value={id}>
                                {companyDisplayLabel(c.display_name, c.company_id)}
                              </option>
                            );
                          })}
                        </select>
                      </>
                    ) : null}
                    {showPeriodFilter ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <label htmlFor="period-key-pilotage-phone" className="sr-only">
                          Période
                        </label>
                        <select
                          id="period-key-pilotage-phone"
                          value={periodKey}
                          onChange={(e) => onPeriodKeyChange(e.target.value)}
                          className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          aria-label="Période"
                          title={periodOptionsToShow.find((o) => o.value === periodKey)?.label}
                        >
                          {periodOptionsToShow.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {enrichPeriodLabel(opt, periodYear, periodStatuses)}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label="Année"
                          value={periodYear}
                          onChange={(e) => onPeriodYearChange(Number(e.target.value))}
                          className="w-[4.75rem] shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        >
                          {yearsToShow.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    {periodStatusLabel ? (
                      <p className="text-[9px] leading-tight text-[var(--muted)]">{periodStatusLabel}</p>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : (
      <div className="relative flex items-center justify-between gap-3">
        <div className="z-10 flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          {currentApp === "linky" ? (
            <Link
              href={pilotageHomeHref}
              className="group flex max-w-full items-center gap-2.5 rounded-xl outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--panel-2)_55%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label="Retour au cockpit de pilotage"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] font-headline text-sm font-extrabold leading-none tracking-tight text-white shadow-[0_4px_12px_rgba(0,0,0,0.14)] sm:h-10 sm:w-10 sm:text-base">
                DL
              </div>
              <div className="min-w-0 leading-tight">
                <div className="font-headline text-[1.05rem] font-extrabold leading-none tracking-tight text-[var(--text)] sm:text-[1.125rem]">
                  {tabletBrandName}
                </div>
                <div className="mt-1 text-[11px] leading-snug text-[var(--muted)] sm:text-xs" title={tagline}>
                  Cockpit financier
                </div>
              </div>
            </Link>
          ) : (
            <a href="/" className="group transition-[filter] duration-[160ms] ease-out hover:brightness-[1.04]" aria-label="Retour à l'accueil">
              <h1 className="flex items-baseline gap-1.5 sm:gap-2">
                {productName.includes(" ") ? (
                  <>
                    <span className="text-lg font-bold tracking-[-0.02em] text-[var(--logo-dorevia)] sm:text-xl">{productName.split(" ")[0]}</span>
                    <span className="text-lg font-bold tracking-[-0.02em] text-[var(--logo-lynki)] sm:text-xl">{productName.slice(productName.indexOf(" ") + 1)}</span>
                  </>
                ) : (
                  <span className="text-lg font-bold tracking-[-0.02em] text-[var(--text)] sm:text-xl">{productName}</span>
                )}
              </h1>
            </a>
          )}
        </div>
        {currentApp !== "linky" ? (
          <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[10px] text-[var(--text-secondary)] sm:text-xs">{tagline}</p>
        ) : null}
        <div className="z-10 flex items-center gap-2">
          {currentApp === "linky" && tenantBadgeOrSelector}
          {currentApp === "linky" && (
            <div className="relative sm:hidden">
              <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]" aria-label="Menu" aria-expanded={menuOpen}>
                {menuIcon}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" aria-hidden data-chrome-lock="true" onClick={() => setMenuOpen(false)} />
                  <nav className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 shadow-lg" role="menu" data-chrome-lock="true">
                    {overflowNav}
                  </nav>
                </>
              )}
            </div>
          )}
          {currentApp === "linky" && (
            <div className="relative hidden sm:block">
              <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]" aria-label="Menu" aria-expanded={menuOpen}>
                {menuIcon}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" aria-hidden data-chrome-lock="true" onClick={() => setMenuOpen(false)} />
                  <nav className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 shadow-lg" role="menu" data-chrome-lock="true">
                    {overflowNav}
                  </nav>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      )}
      {currentApp === "linky" && !chromeCompact && !cockpitAppBar && !pilotagePhoneCompact && (showCompanyFilter || showPeriodFilter) && (
        <div className="mt-2 hidden sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4">
          {showCompanyFilter && (
            <div className="flex min-w-0 items-center gap-2">
              <label htmlFor="company-select" className="sr-only">Société</label>
              <select id="company-select" disabled={companiesLoading} value={selectedCompanyId ?? ""} onChange={(e) => onCompanyChange(e.target.value || null)} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" aria-label="Société">
                <option value="">Toutes les sociétés</option>
                {companies.map((c) => {
                  const id = normalizeCompanyId(c.company_id);
                  if (!id) return null;
                  return (
                    <option key={id} value={id}>
                      {companyDisplayLabel(c.display_name, c.company_id)}
                    </option>
                  );
                })}
              </select>
              {appView !== "synthese" && <span className="truncate text-sm text-[var(--muted)]">· {moduleActif}</span>}
            </div>
          )}
          {showPeriodFilter && (
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-2">
                <label htmlFor="period-key" className="sr-only">Période</label>
                <select id="period-key" value={periodKey} onChange={(e) => onPeriodKeyChange(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                  {periodOptionsToShow.map((opt) => <option key={opt.value} value={opt.value}>{enrichPeriodLabel(opt, periodYear, periodStatuses)}</option>)}
                </select>
                <select aria-label="Année" value={periodYear} onChange={(e) => onPeriodYearChange(Number(e.target.value))} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                  {yearsToShow.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {periodStatusLabel && <span className="text-[10px] text-[var(--muted)]">{periodStatusLabel}</span>}
            </div>
          )}
          <div className="flex justify-end">
            {showIntegrityBadge ? <IntegrityBadge tenantId={tenantId} sealedCount={sealedCount} sealedCountComplete={sealedCountComplete} onRefresh={onRefreshMetrics} /> : <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-secondary)]" title="Synchronisation en cours">{UI_STATE_LABELS.pending}</span>}
          </div>
        </div>
      )}
      {currentApp === "linky" && !chromeCompact && !pilotagePhoneCompact && (
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:hidden">
          <label htmlFor="company-select-mobile" className="sr-only">Société</label>
          <select id="company-select-mobile" disabled={companiesLoading} value={selectedCompanyId ?? ""} onChange={(e) => onCompanyChange(e.target.value || null)} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" aria-label="Société">
            <option value="">Toutes les sociétés</option>
            {companies.map((c) => {
              const id = normalizeCompanyId(c.company_id);
              if (!id) return null;
              return (
                <option key={id} value={id}>
                  {companyDisplayLabel(c.display_name, c.company_id)}
                </option>
              );
            })}
          </select>
          <label htmlFor="period-key-mobile" className="sr-only">Période</label>
          <select id="period-key-mobile" value={periodKey} onChange={(e) => onPeriodKeyChange(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
            {periodOptionsToShow.map((opt) => <option key={opt.value} value={opt.value}>{enrichPeriodLabel(opt, periodYear, periodStatuses)}</option>)}
          </select>
          <select aria-label="Année" value={periodYear} onChange={(e) => onPeriodYearChange(Number(e.target.value))} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
            {yearsToShow.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="ml-auto">
            {showIntegrityBadge ? <IntegrityBadge tenantId={tenantId} sealedCount={sealedCount} sealedCountComplete={sealedCountComplete} onRefresh={onRefreshMetrics} /> : <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-secondary)]" title="Synchronisation en cours">{UI_STATE_LABELS.pending}</span>}
          </div>
        </div>
      )}
      {currentApp === "linky" && chromeCompact && onExpandChrome && (
        <div className="mt-1 flex cursor-pointer items-center justify-center gap-2 py-1" role="button" tabIndex={0} aria-label="Afficher le bandeau complet" onClick={onExpandChrome} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onExpandChrome(); } }}>
          <span className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
            {periodKey === "all" ? "Toutes périodes" : periodKey === "ytd" ? `Exercice ${periodYear}` : `${periodOptionsToShow.find((o) => o.value === periodKey)?.label ?? periodKey} ${periodYear}`}
          </span>
          {showIntegrityBadge ? <IntegrityBadge tenantId={tenantId} sealedCount={sealedCount} sealedCountComplete={sealedCountComplete} onRefresh={onRefreshMetrics} /> : <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-secondary)]" title="Synchronisation en cours">{UI_STATE_LABELS.pending}</span>}
        </div>
      )}
    </div>
  );
  return content;
}

const STATUS_SUFFIX: Record<string, string> = {
  closed: " \u{1F512}",
  locked: " \u{1F512}",
  partial: " \u26A0\uFE0F",
};

function enrichPeriodLabel(
  opt: { value: string; label: string },
  year: number,
  statuses?: PeriodStatusMap,
): string {
  const base = safeReactText(opt.label) || safeReactText(opt.value);
  if (!statuses || statuses.size === 0) return base;
  const month = parseInt(opt.value, 10);
  if (Number.isNaN(month) || month < 1 || month > 12) return base;
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const info = statuses.get(key);
  if (!info || info.status === "open") return base;
  return base + (STATUS_SUFFIX[info.status] ?? "");
}

function getPeriodContextLabel(
  periodKey: string,
  year: number,
  statuses?: PeriodStatusMap,
): string | null {
  if (!statuses || statuses.size === 0) return null;
  const month = parseInt(periodKey, 10);
  if (Number.isNaN(month) || month < 1 || month > 12) return null;
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const info = statuses.get(key);
  if (!info || info.status === "open") return null;
  if (info.heterogeneous) return "P\u00E9riode partiellement cl\u00F4tur\u00E9e (h\u00E9t\u00E9rog\u00E9n\u00E9it\u00E9 multi-soci\u00E9t\u00E9s)";
  if (info.status === "locked") {
    return info.closedAt
      ? `P\u00E9riode verrouill\u00E9e le ${formatDateFR(info.closedAt)}`
      : "P\u00E9riode verrouill\u00E9e";
  }
  if (info.status === "closed") {
    return info.closedAt
      ? `P\u00E9riode cl\u00F4tur\u00E9e le ${formatDateFR(info.closedAt)}`
      : "P\u00E9riode cl\u00F4tur\u00E9e";
  }
  return null;
}

function formatDateFR(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR");
  } catch {
    return iso;
  }
}
