"use client";

import { useMemo } from "react";
import { IntegrityBadge } from "@/components/IntegrityBadge";
import { TenantSelector } from "@/components/TenantSelector";
import type { ReportHeaderContentProps } from "./ReportHeaderContent.types";
import type { PeriodStatusMap } from "@/app/lib/use-accounting-periods";
import { companyDisplayLabel, normalizeCompanyId, safeReactText } from "@/app/lib/company-id";

export function ReportHeaderContentBody(props: ReportHeaderContentProps) {
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
  } = props;

  const periodStatusLabel = useMemo(() => getPeriodContextLabel(periodKey, periodYear, periodStatuses), [periodKey, periodYear, periodStatuses]);

  const content = (
    <div className="mx-auto max-w-4xl px-4 py-3">
      <div className="relative flex items-center justify-between gap-3">
        <div className="z-10 flex shrink-0 items-center gap-2 sm:gap-3">
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
        </div>
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[10px] text-[var(--text-secondary)] sm:text-xs">{tagline}</p>
        <div className="z-10 flex items-center gap-2">
          {currentApp === "linky" && tenantBadgeOrSelector}
          {currentApp === "linky" && (
            <div className="relative sm:hidden">
              <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]" aria-label="Menu" aria-expanded={menuOpen}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#FFF" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" aria-hidden data-chrome-lock="true" onClick={() => setMenuOpen(false)} />
                  <nav className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 shadow-lg" role="menu" data-chrome-lock="true">
                    {tenantCtx?.availableTenants && tenantCtx.availableTenants.length > 1 && <TenantSelector variant="menu" onCloseMenu={() => setMenuOpen(false)} />}
                    {appView !== "synthese" && (<>
                    <div className="border-b border-[var(--border)] px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Comptabilité</div>
                    {([["all", "Tout"], ["cash", "Cash"], ["business", "Business"], ["corrections", "Corrections"]] as const).map(([mode, label]) => (
                      <button key={mode} type="button" role="menuitem" onClick={() => { onViewModeChange(mode); setMenuOpen(false); }} className={`block w-full px-3 py-2 text-left text-sm ${viewMode === mode ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"}`}>{label}</button>
                    ))}
                    <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Point de vente</div>
                    <button type="button" role="menuitem" onClick={() => { onViewModeChange("pos_shops"); setMenuOpen(false); }} className={`block w-full px-3 py-2 text-left text-sm ${viewMode === "pos_shops" ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"}`}>Points de vente</button>
                    <button type="button" role="menuitem" onClick={() => { onViewModeChange("pos_z"); setMenuOpen(false); }} className={`block w-full px-3 py-2 text-left text-sm ${viewMode === "pos_z" ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"}`}>Z de caisse <span className="text-[10px] text-[var(--muted)]">(à venir)</span></button>
                    </>)}
                    <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Applications</div>
                    <a href={ODOO_URL} target="_blank" rel="noopener noreferrer" role="menuitem" onClick={() => setMenuOpen(false)} className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]">Odoo (système source)</a>
                    <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Administration</div>
                    <a href="/admin/dlp-config" role="menuitem" onClick={() => setMenuOpen(false)} className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]">Paramétrage des décisions</a>
                    {workspace?.sources?.map((s) => <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" role="menuitem" onClick={() => setMenuOpen(false)} className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]">{s.label}</a>)}
                    {workspace?.apps?.map((a) => <a key={a.id} href={a.href ?? "#"} role="menuitem" onClick={() => setMenuOpen(false)} className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]">{a.label}</a>)}
                    {chromeAdaptive && showPinChrome && <button type="button" role="menuitem" onClick={() => { chromeAdaptive.setChromePinned(!chromeAdaptive.chromePinned); setMenuOpen(false); }} className={`block w-full px-3 py-2 text-left text-sm ${chromeAdaptive.chromePinned ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"}`}>Garder le bandeau visible</button>}
                  </nav>
                </>
              )}
            </div>
          )}
          {currentApp === "linky" && (
            <div className="relative hidden sm:block">
              <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]" aria-label="Menu" aria-expanded={menuOpen}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#FFF" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" aria-hidden data-chrome-lock="true" onClick={() => setMenuOpen(false)} />
                  <nav className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 shadow-lg" role="menu" data-chrome-lock="true">
                    {tenantCtx?.availableTenants && tenantCtx.availableTenants.length > 1 && <TenantSelector variant="menu" onCloseMenu={() => setMenuOpen(false)} />}
                    {appView !== "synthese" && (<>
                    <div className="border-b border-[var(--border)] px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Comptabilité</div>
                    {([["all", "Tout"], ["cash", "Cash"], ["business", "Business"], ["corrections", "Corrections"]] as const).map(([mode, label]) => (
                      <button key={mode} type="button" role="menuitem" onClick={() => { onViewModeChange(mode); setMenuOpen(false); }} className={`block w-full px-3 py-2 text-left text-sm ${viewMode === mode ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"}`}>{label}</button>
                    ))}
                    <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Point de vente</div>
                    <button type="button" role="menuitem" onClick={() => { onViewModeChange("pos_shops"); setMenuOpen(false); }} className={`block w-full px-3 py-2 text-left text-sm ${viewMode === "pos_shops" ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"}`}>Points de vente</button>
                    <button type="button" role="menuitem" onClick={() => { onViewModeChange("pos_z"); setMenuOpen(false); }} className={`block w-full px-3 py-2 text-left text-sm ${viewMode === "pos_z" ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"}`}>Z de caisse <span className="text-[10px] text-[var(--muted)]">(à venir)</span></button>
                    </>)}
                    <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Applications</div>
                    <a href={ODOO_URL} target="_blank" rel="noopener noreferrer" role="menuitem" onClick={() => setMenuOpen(false)} className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]">Odoo (système source)</a>
                    <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Administration</div>
                    <a href="/admin/dlp-config" role="menuitem" onClick={() => setMenuOpen(false)} className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]">Paramétrage des décisions</a>
                    {workspace?.sources?.map((s) => <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" role="menuitem" onClick={() => setMenuOpen(false)} className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]">{s.label}</a>)}
                    {workspace?.apps?.map((a) => <a key={a.id} href={a.href ?? "#"} role="menuitem" onClick={() => setMenuOpen(false)} className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]">{a.label}</a>)}
                    {chromeAdaptive && showPinChrome && <button type="button" role="menuitem" onClick={() => { chromeAdaptive.setChromePinned(!chromeAdaptive.chromePinned); setMenuOpen(false); }} className={`block w-full px-3 py-2 text-left text-sm ${chromeAdaptive.chromePinned ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"}`}>Garder le bandeau visible</button>}
                  </nav>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {currentApp === "linky" && !chromeCompact && onNavigateToAppView && (
        <div className="mt-2 mb-1 hidden sm:flex sm:justify-center" role="tablist" aria-label="Vue de l'application">
          {(["pilotage", "synthese"] as const).map((view) => {
            const labels = { pilotage: "Pilotage", synthese: "Synthèse comptable" } as const;
            const active = appView === view;
            return (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onNavigateToAppView(view)}
                className={`px-4 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus:outline-none ${
                  active
                    ? "rounded-lg bg-[var(--accent)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
              >
                {labels[view]}
              </button>
            );
          })}
        </div>
      )}
      {currentApp === "linky" && !chromeCompact && (showCompanyFilter || showPeriodFilter) && (
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
            {showIntegrityBadge ? <IntegrityBadge tenantId={tenantId} sealedCount={sealedCount} sealedCountComplete={sealedCountComplete} onRefresh={onRefreshMetrics} /> : <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-secondary)]" title="Synchronisation en cours">—</span>}
          </div>
        </div>
      )}
      {currentApp === "linky" && !chromeCompact && onNavigateToAppView && (
        <div className="mt-2 mb-1 flex justify-center sm:hidden" role="tablist" aria-label="Vue de l'application">
          {(["pilotage", "synthese"] as const).map((view) => {
            const labels = { pilotage: "Pilotage", synthese: "Synthèse comptable" } as const;
            const active = appView === view;
            return (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onNavigateToAppView(view)}
                className={`px-3 py-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus:outline-none ${
                  active
                    ? "rounded-lg bg-[var(--accent)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
              >
                {labels[view]}
              </button>
            );
          })}
        </div>
      )}
      {currentApp === "linky" && !chromeCompact && (
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
            {showIntegrityBadge ? <IntegrityBadge tenantId={tenantId} sealedCount={sealedCount} sealedCountComplete={sealedCountComplete} onRefresh={onRefreshMetrics} /> : <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-secondary)]" title="Synchronisation en cours">—</span>}
          </div>
        </div>
      )}
      {currentApp === "linky" && chromeCompact && onExpandChrome && (
        <div className="mt-1 flex cursor-pointer items-center justify-center gap-2 py-1" role="button" tabIndex={0} aria-label="Afficher le bandeau complet" onClick={onExpandChrome} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onExpandChrome(); } }}>
          <span className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
            {periodKey === "all" ? "Toutes périodes" : periodKey === "ytd" ? `Exercice ${periodYear}` : `${periodOptionsToShow.find((o) => o.value === periodKey)?.label ?? periodKey} ${periodYear}`}
          </span>
          {onNavigateToAppView && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onNavigateToAppView(appView === "pilotage" ? "synthese" : "pilotage"); }}
              className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]"
            >
              {appView === "pilotage" ? "Pilotage" : "Synthèse"}
            </button>
          )}
          {showIntegrityBadge ? <IntegrityBadge tenantId={tenantId} sealedCount={sealedCount} sealedCountComplete={sealedCountComplete} onRefresh={onRefreshMetrics} /> : <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">—</span>}
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
