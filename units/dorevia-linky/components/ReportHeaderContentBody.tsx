"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const tenantQs = searchParams.get("tenant");
  const pilotageHomeHref = navHrefWithTenant("/", tenantQs);
  const syntheseHrefTablet = navHrefWithTenant("/synthese", tenantQs);
  const aideHrefTablet = navHrefWithTenant("/aide", tenantQs);
  const aideLexiqueHrefTablet = `${aideHrefTablet}#lexique`;

  const pilotageActiveTablet =
    pathname === "/" ||
    ["/tresorerie", "/business", "/flux-net", "/encours", "/alerts", "/cockpit"].some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
  const syntheseActiveTablet = pathname === "/synthese" || pathname.startsWith("/synthese/");
  const aideActiveTablet = pathname === "/aide" || pathname.startsWith("/aide/");
  const [isClient, setIsClient] = useState(false);
  const [locationHash, setLocationHash] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncHash = () => setLocationHash(window.location.hash ?? "");
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const lexiqueActiveTablet = aideActiveTablet && locationHash.toLowerCase().includes("lexique");
  const aideMainActiveTablet = aideActiveTablet && !lexiqueActiveTablet;

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

  /** Bandeau desktop immersif : slot utilitaires (V1 vide). Tablette iPad : burger + tiroir dans le JSX dédié. */
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

  /** iPad ligne 1 : preuves / confiance dans le chrome (cloche · preuves · contexte · burger). */
  const cockpitTabletChromeTrust =
    cockpitBandTablet && showCockpitContextRow ? (
      showIntegrityBadge ? (
        <div className="flex max-w-[min(6.25rem,28vw)] min-w-0 shrink-0 items-center justify-center">
          <IntegrityBadge
            tenantId={tenantId}
            sealedCount={sealedCount}
            sealedCountComplete={sealedCountComplete}
            onRefresh={onRefreshMetrics}
            visualWeight="secondary"
            countLabelMode="compact"
            className="origin-center scale-[0.92] [&_[data-testid=integrity-badge-label]]:!inline"
          />
        </div>
      ) : (
        <span
          className="inline-flex h-7 max-w-[6.5rem] shrink-0 items-center gap-1 rounded-md border border-[color-mix(in_srgb,var(--border)_40%,transparent)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] px-1.5 text-[10px] text-[var(--text-secondary)]"
          title="Synchronisation en cours"
        >
          {UI_STATE_LABELS.pending}
        </span>
      )
    ) : null;

  /** Filtres cockpit — coquilles type maquette Carole / `carole_suggest_01.html` (sélecteurs sans cadre interne). */
  const cockpitShellSelectClass = cockpitBandTablet
    ? "mt-0.5 block w-full min-w-0 max-w-full cursor-pointer border-0 bg-transparent p-0 text-center text-[12px] font-semibold text-[var(--text)] focus:outline-none focus:ring-0 disabled:opacity-60"
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
    ? "mt-0.5 min-w-0 [&_button]:!min-h-0 [&_button]:h-auto [&_button]:min-w-0 [&_button]:w-full [&_button]:justify-center [&_button]:gap-1.5 [&_button]:rounded-none [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-0 [&_button]:py-0 [&_button]:text-center [&_button]:text-[12px] [&_button]:font-semibold [&_button]:leading-snug [&_button]:shadow-none [&_button]:hover:bg-transparent [&_span]:text-[12px] [&_span]:font-semibold [&_span]:leading-snug [&_span]:text-center"
    : "mt-1 min-w-0 [&_button]:!min-h-0 [&_button]:h-auto [&_button]:min-w-0 [&_button]:w-full [&_button]:justify-start [&_button]:gap-2 [&_button]:rounded-none [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-0 [&_button]:py-0 [&_button]:text-left [&_button]:text-[13px] [&_button]:font-semibold [&_button]:leading-tight [&_button]:shadow-none [&_button]:hover:bg-transparent [&_span]:text-[13px] [&_span]:font-semibold";

  const tenantShellSingleClass = cockpitBandTablet
    ? `${tenantShellInnerClass} [&>span]:!inline [&>span]:max-w-[8.75rem] [&>span]:truncate [&>span]:text-[12px] [&>span]:font-semibold [&>span]:text-[var(--text)] [&>span]:leading-snug`
    : `${tenantShellInnerClass} [&>span]:!inline [&>span]:max-w-[10rem] [&>span]:truncate [&>span]:text-[13px] [&>span]:font-semibold [&>span]:text-[var(--text)] [&>span]:leading-tight`;

  const cockpitCaroleFilterCenter =
    showCockpitContextRow && !cockpitBandTablet && (cockpitContextHasFilters || cockpitContextTrustSignal) ? (
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

  /** Ligne 2 iPad : filtres centrés + badge technique à droite (preuves sur la ligne 1). */
  const cockpitTabletBusinessFiltersRow =
    showCockpitContextRow && cockpitBandTablet && (cockpitContextHasFilters || cockpitContextTrustSignal) ? (
      <div
        className="flex min-w-0 flex-nowrap items-center gap-2 border-t border-[var(--border)] px-3 py-2.5 min-[900px]:gap-2.5 sm:px-3.5"
        role="group"
        aria-label="Filtres métier"
      >
        <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
          <div className="flex min-w-full justify-center">
            <div className="flex w-max min-w-max items-center gap-2 min-[900px]:gap-2.5">
        {cockpitContextHasFilters ? (
          <>
            {tenantBadgeOrSelector ? (
              <div
                className={`${cockpitFilterShellClass} min-w-[120px] max-w-[13rem] shrink-0 justify-center overflow-hidden min-[900px]:min-w-[132px]`}
              >
                <Icon name="filter_alt" size={15} className="shrink-0 text-[var(--accent)]" aria-hidden />
                <div className="min-w-0 leading-tight text-center">
                  <div className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Tenant</div>
                  <div className={tenantShellSingleClass}>{tenantBadgeOrSelector}</div>
                </div>
              </div>
            ) : null}
            {showCompanyFilter ? (
              <div
                className={`${cockpitFilterShellClass} min-w-[180px] max-w-[200px] shrink-0 justify-center overflow-hidden min-[900px]:min-w-[200px]`}
              >
                <div className="flex min-w-0 w-full max-w-full flex-1 flex-col items-center justify-center overflow-hidden leading-tight text-center">
                  <label htmlFor="company-select-cockpit-tb" className="flex min-w-0 w-full cursor-pointer flex-col items-center text-center">
                    <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Société</span>
                    <select
                      id="company-select-cockpit-tb"
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
            ) : null}
            {showPeriodFilter ? (
              <>
                <div className={`${cockpitFilterShellClass} min-w-[140px] max-w-[160px] shrink-0 justify-center overflow-hidden min-[900px]:min-w-[152px]`}>
                  <div className="flex min-w-0 w-full max-w-full flex-1 flex-col items-center justify-center overflow-hidden leading-tight text-center">
                    <label htmlFor="period-key-cockpit-tb" className="flex min-w-0 w-full cursor-pointer flex-col items-center text-center">
                      <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Période</span>
                      <select
                        id="period-key-cockpit-tb"
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
                  </div>
                </div>
                <div
                  className={`${cockpitFilterShellClass} flex min-h-[46px] w-[84px] min-w-[84px] shrink-0 flex-col items-center justify-center gap-0 px-2 py-1.5 text-center min-[900px]:w-[88px]`}
                >
                  <label htmlFor="period-year-cockpit-tb" className="flex w-full cursor-pointer flex-col items-center gap-0 text-center">
                    <span className="whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      Année
                    </span>
                    <select
                      id="period-year-cockpit-tb"
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
              </>
            ) : null}
          </>
        ) : null}
            </div>
          </div>
        </div>
        <span
          className="inline-flex max-w-[120px] shrink-0 items-center gap-1 self-center rounded-md border border-[color-mix(in_srgb,var(--border)_38%,transparent)] bg-[color-mix(in_srgb,var(--panel)_82%,transparent)] px-1.5 py-0.5 text-[9px] font-medium leading-tight tabular-nums text-[color-mix(in_srgb,var(--muted)_92%,transparent)] opacity-90"
          title={tenantId}
        >
          <Icon name="badge" size={10} className="shrink-0 opacity-70" aria-hidden />
          <span className="min-w-0 truncate">{tenantId}</span>
        </span>
      </div>
    ) : null;

  const tabletNavSectionTitle = "px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]";
  const tabletNavLinkBase =
    "mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-colors hover:bg-[color-mix(in_srgb,var(--panel)_50%,transparent)] hover:text-[var(--text)]";
  const tabletNavLinkInactive = `${tabletNavLinkBase} text-[var(--muted)]`;
  const tabletNavLinkActive = `${tabletNavLinkBase} border border-[var(--border)] bg-[var(--panel-2)] font-medium text-[var(--text)] shadow-[0_10px_30px_rgba(0,0,0,0.18)]`;
  /** T-PH-002 : même drawer complet que l’iPad (overlay + panneau pleine hauteur) — phone et tablette &lt; 1024. */
  const tactileNavigationDrawer =
    (cockpitBandTablet || !!pilotagePhoneCompact) && menuOpen && isClient && currentApp === "linky"
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-[2px]"
              aria-hidden
              data-chrome-lock="true"
              onClick={() => setMenuOpen(false)}
            />
            <aside
              id="linky-tactile-nav-drawer"
              className="fixed inset-y-0 left-0 z-[121] flex h-[100svh] w-[min(20rem,92vw)] max-w-[20rem] flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--sidebar-bg)] shadow-[12px_0_36px_rgba(0,0,0,0.38)] md:h-[100dvh]"
              role="dialog"
              aria-modal="true"
              aria-label={pilotagePhoneCompact ? "Outils et session" : "Navigation"}
              data-chrome-lock="true"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--sidebar-bg)] px-4 py-4">
                <span className="font-headline text-lg font-extrabold text-[var(--text)]">
                  {pilotagePhoneCompact ? "Plus" : "Navigation"}
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--panel)_50%,transparent)]"
                  aria-label="Fermer le menu"
                >
                  <Icon name="close" size={22} />
                </button>
              </div>
              <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
                <nav
                  className="flex flex-col px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
                  aria-label={pilotagePhoneCompact ? "Outils et session" : "Navigation principale"}
                >
                  {/*
                    Phone (T-PH-002) : Pilotage / Synthèse = bottom nav uniquement — pas de duplication dans ce tiroir.
                    Tablette : section Dashboard inchangée.
                  */}
                  {!pilotagePhoneCompact ? (
                    <div>
                      <div className={tabletNavSectionTitle}>Dashboard</div>
                      <Link
                        href={pilotageHomeHref}
                        className={pilotageActiveTablet ? tabletNavLinkActive : tabletNavLinkInactive}
                        aria-current={pilotageActiveTablet ? "page" : undefined}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Icon name="bar_chart" size={20} className={pilotageActiveTablet ? "text-[var(--text)]" : "text-[var(--muted)]"} />
                        <span>Pilotage</span>
                      </Link>
                      <Link
                        href={syntheseHrefTablet}
                        className={syntheseActiveTablet ? tabletNavLinkActive : tabletNavLinkInactive}
                        aria-current={syntheseActiveTablet ? "page" : undefined}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Icon name="account_balance" size={20} className={syntheseActiveTablet ? "text-[var(--text)]" : "text-[var(--muted)]"} />
                        <span>Synthèse comptable</span>
                      </Link>
                    </div>
                  ) : null}
                  <div className={`px-0 pb-2 ${pilotagePhoneCompact ? "pt-0" : "pt-6"}`}>
                    <div className={tabletNavSectionTitle}>Outils</div>
                    <Link
                      href={aideLexiqueHrefTablet}
                      className={lexiqueActiveTablet ? tabletNavLinkActive : tabletNavLinkInactive}
                      aria-current={lexiqueActiveTablet ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon name="menu_book" size={20} className={lexiqueActiveTablet ? "text-[var(--text)]" : "text-[var(--muted)]"} />
                      <span>Lexique</span>
                    </Link>
                    <Link
                      href={aideHrefTablet}
                      className={aideMainActiveTablet ? tabletNavLinkActive : tabletNavLinkInactive}
                      aria-current={aideMainActiveTablet ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon name="help" size={20} className={aideMainActiveTablet ? "text-[var(--text)]" : "text-[var(--muted)]"} />
                      <span>Aide</span>
                    </Link>
                  </div>
                  <div className="mt-3 border-t border-[var(--border)] pt-4">
                    <div className={tabletNavSectionTitle}>Session</div>
                    <div className="flex flex-col gap-1">
                      <ThemeToggle variant="sidebarRow" />
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] text-[var(--muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--panel)_50%,transparent)] hover:text-[var(--text)]"
                        title="Déconnexion — le raccourci session est aussi disponible via l’avatar en haut à droite du pilotage."
                        onClick={async () => {
                          await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                          setMenuOpen(false);
                          window.location.href = "/login";
                        }}
                      >
                        <Icon name="logout" size={20} className="text-[var(--muted)]" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>
                </nav>
              </div>
            </aside>
          </>,
          document.body
        )
      : null;

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
                    <>
                      <div className="flex min-w-0 flex-col">
                        {/* Ligne 1 — chrome cockpit (maquette iPad) : Pilotage dominant · Lynki secondaire · zone droite utilitaires */}
                        <div className="flex min-w-0 flex-nowrap items-center gap-3 px-3 py-2.5 md:px-3.5 md:py-3">
                          <Link
                            href={pilotageHomeHref}
                            className="group flex min-w-0 shrink-0 items-center gap-2 rounded-xl outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--panel-2)_55%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                            aria-label="Retour au cockpit de pilotage"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] font-headline text-base font-extrabold leading-none tracking-tight text-white shadow-[0_4px_12px_rgba(0,0,0,0.14)]">
                              DL
                            </div>
                            <div className="min-w-0 leading-tight">
                              <div className="whitespace-nowrap font-headline text-[1.05rem] font-bold leading-none tracking-tight text-[var(--text-secondary)] sm:text-[1.125rem]">
                                {tabletBrandName}
                              </div>
                              <div
                                className="mt-0.5 hidden min-[860px]:block whitespace-nowrap text-xs leading-snug text-[color-mix(in_srgb,var(--text-secondary)_80%,transparent)]"
                                title={tagline}
                              >
                                Cockpit financier
                              </div>
                            </div>
                          </Link>
                          <div
                            className="hidden h-8 w-px shrink-0 self-center bg-[color-mix(in_srgb,var(--text)_10%,transparent)] min-[480px]:block"
                            aria-hidden
                          />
                          <h1 className="shrink-0 whitespace-nowrap pl-0.5 font-headline text-[1.3rem] font-extrabold leading-none tracking-[-0.02em] text-[var(--text)] min-[900px]:text-[1.45rem]">
                            Pilotage
                          </h1>
                          <div className="min-h-0 min-w-0 flex-1" aria-hidden />
                          <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
                            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-[color-mix(in_srgb,var(--border)_25%,transparent)] bg-[color-mix(in_srgb,var(--panel-2)_55%,transparent)] px-0.5 py-0.5">
                              <button
                                type="button"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--panel)_40%,transparent)] active:bg-[var(--panel-2)] md:h-9 md:w-9"
                                aria-label="Notifications (bientôt disponible)"
                              >
                                <Icon name="notifications" size={17} />
                              </button>
                              {cockpitTabletChromeTrust}
                            </div>
                            <div
                              className="flex min-w-0 max-w-[min(11rem,42vw)] shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-1.5 py-1 shadow-[0_3px_11px_rgba(0,0,0,0.11)] md:gap-2 md:px-2 md:py-1.5"
                              title={tenantDisplayLabel}
                            >
                              <div
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] font-headline text-xs font-extrabold text-white md:h-8 md:w-8 md:text-sm"
                                aria-hidden
                              >
                                {sessionInitial}
                              </div>
                              <span className="min-w-0 truncate text-left text-[12px] font-semibold leading-tight text-[var(--text)] md:text-[13px]">
                                {tenantDisplayLabel}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setMenuOpen(true)}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:bg-[var(--panel-2)]"
                              aria-label="Menu navigation"
                              aria-expanded={menuOpen}
                              aria-controls="linky-tactile-nav-drawer"
                            >
                              {menuIcon}
                            </button>
                          </div>
                        </div>
                        {cockpitTabletBusinessFiltersRow}
                      </div>
                    </>
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
        <div className="min-w-0 px-3 pt-1 pb-0" role="region" aria-label="En-tête pilotage">
          {/*
            T-PH-002 — compaction : [DL] Pilotage · spacer · [N preuves] · avatar · burger.
            Pas de « Lynki » ni nom d’entité en ligne 1 ; preuves en libellé compact (période/vue).
          */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[0_8px_22px_rgba(0,0,0,0.14)]">
            <div className="flex min-w-0 flex-nowrap items-center gap-2 px-2.5 py-2 min-[480px]:gap-2.5 min-[480px]:px-3 min-[480px]:py-2.5">
              <Link
                href={pilotageHomeHref}
                className="group flex shrink-0 items-center rounded-xl outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--panel-2)_55%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label={`${tabletBrandName} — retour au cockpit`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] font-headline text-sm font-extrabold leading-none tracking-tight text-white shadow-[0_4px_12px_rgba(0,0,0,0.14)] min-[480px]:h-9 min-[480px]:w-9 min-[480px]:text-base">
                  DL
                </div>
              </Link>
              <h1 className="min-w-0 shrink-0 whitespace-nowrap font-headline text-[1.1rem] font-extrabold leading-none tracking-[-0.02em] text-[var(--text)] min-[480px]:text-[1.2rem]">
                Pilotage
              </h1>
              <div className="min-h-0 min-w-0 flex-1" aria-hidden />
              <div className="flex min-w-0 shrink-0 items-center gap-1.5 min-[480px]:gap-2">
                <div className="flex min-w-0 max-w-[min(11rem,46vw)] shrink-0 items-center justify-center">
                  {showIntegrityBadge ? (
                    <IntegrityBadge
                      tenantId={tenantId}
                      sealedCount={sealedCount}
                      sealedCountComplete={sealedCountComplete}
                      onRefresh={onRefreshMetrics}
                      visualWeight="secondary"
                      countLabelMode="compact"
                      className="origin-center scale-[0.92] [&_[data-testid=integrity-badge-label]]:!inline"
                    />
                  ) : (
                    <span
                      className="inline-flex h-6 max-w-[6rem] shrink-0 items-center gap-1 rounded-md border border-[color-mix(in_srgb,var(--border)_40%,transparent)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] px-1 text-[10px] text-[var(--text-secondary)]"
                      title="Synchronisation en cours"
                    >
                      {UI_STATE_LABELS.pending}
                    </span>
                  )}
                </div>
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--border)_35%,transparent)] bg-[var(--accent)] font-headline text-[11px] font-extrabold leading-none text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] min-[480px]:h-9 min-[480px]:w-9 min-[480px]:text-xs"
                  title={tenantDisplayLabel}
                  aria-label={tenantDisplayLabel}
                >
                  {sessionInitial}
                </div>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPilotagePerimeterOpen(false);
                      setMenuOpen(!menuOpen);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:bg-[var(--panel-2)] min-[480px]:h-9 min-[480px]:w-9"
                    aria-label={pilotagePhoneCompact ? "Outils et session" : "Menu navigation"}
                    aria-expanded={menuOpen}
                    aria-controls="linky-tactile-nav-drawer"
                  >
                    {menuIcon}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="relative mt-1.5">
            <button
              type="button"
              id="pilotage-perimeter-nav-trigger"
              className="flex w-full cursor-pointer items-center gap-1.5 rounded-lg py-1.5 pl-0.5 pr-1 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--panel)_35%,transparent)] active:bg-[color-mix(in_srgb,var(--panel)_50%,transparent)]"
              aria-expanded={pilotagePerimeterOpen}
              aria-controls="pilotage-perimeter-panel"
              aria-label="Ouvrir le périmètre et les filtres détaillés"
              onClick={() => {
                setMenuOpen(false);
                setPilotagePerimeterOpen(!pilotagePerimeterOpen);
              }}
            >
              <span className="min-w-0 flex-1 truncate text-left text-[13px] font-medium leading-snug text-[color-mix(in_srgb,var(--text-secondary)_92%,var(--text)_8%)]">
                {pilotagePhoneCompact.contextSummary}
              </span>
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]">Filtres</span>
              <Icon
                name="expand_more"
                size={18}
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
                    <div className="mt-2 border-t border-[var(--border)] pt-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Affichage et données</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <ThemeToggle />
                        {onRefreshMetrics ? (
                          <button
                            type="button"
                            onClick={() => onRefreshMetrics()}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border)] px-2 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--hover)]"
                            aria-label="Actualiser les indicateurs"
                          >
                            <Icon name="sync_saved_locally" size={17} className="text-[var(--muted)]" />
                            Actualiser
                          </button>
                        ) : null}
                      </div>
                    </div>
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
  return (
    <>
      {content}
      {tactileNavigationDrawer}
    </>
  );
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
