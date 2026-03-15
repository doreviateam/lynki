"use client";

import { useState, useEffect, useMemo } from "react";
import {
  PERIOD_OPTIONS,
  getAvailableYears,
  getPeriodFromKeyAndYear,
  getKeyAndYearFromPeriod,
  getDefaultPeriod,
  type PeriodRange,
} from "@/app/lib/period-utils";
import { IntegrityBadge } from "@/components/IntegrityBadge";

export type ViewMode = "all" | "cash" | "business" | "corrections" | "pos_shops" | "pos_z";

interface CompanyItem {
  company_id: string;
  documents_count: number;
  display_name?: string;
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
  monthsWithDataByYear?: Record<string, number[]>;
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
}: ReportHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ODOO_URL = process.env.NEXT_PUBLIC_ODOO_URL ?? "https://odoo.stinger.sarl-la-platine.doreviateam.com/odoo";

  const [periodKey, setPeriodKey] = useState(() => {
    const { key } = getKeyAndYearFromPeriod(period.from, period.to);
    return key;
  });
  const [periodYear, setPeriodYear] = useState(() => {
    const { year } = getKeyAndYearFromPeriod(period.from, period.to);
    return year;
  });

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
    const monthsForYear = monthsWithDataByYear[String(periodYear)];
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
      const monthsForYear = monthsWithDataByYear[String(periodYear)];
      if (monthsForYear && monthsForYear.length > 0 && !monthsForYear.includes(monthKey)) {
        setPeriodKey("ytd");
      }
    }
  }, [periodYear, monthsWithDataByYear, periodKey]);

  const VIEW_MODE_LABELS: Record<ViewMode, string> = {
    all: "Tout",
    cash: "Cash",
    business: "Business",
    corrections: "Corrections",
    pos_shops: "Points de vente",
    pos_z: "Z de caisse",
  };

  const moduleActif = VIEW_MODE_LABELS[viewMode];

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-secondary)]/95 backdrop-blur-sm shadow-sm max-h-[110px]">
      <div className="mx-auto max-w-4xl px-4 py-3">
        {/* Ligne 1 — Logo (gauche) | Tagline (centre) | Badge + Menu (droite) */}
        <div className="relative flex items-center justify-between gap-3">
          <a
            href="/"
            className="group z-10 shrink-0 transition-[filter] duration-[160ms] ease-out hover:brightness-[1.04]"
            aria-label="Retour à l'accueil"
          >
            <h1 className="flex items-baseline gap-1.5 text-base sm:gap-2 sm:text-lg">
              <span className="text-[0.9em] font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                DOREVIA
              </span>
              <span className="text-base font-semibold tracking-[-0.01em] text-[var(--text)] sm:text-lg">
                Linky
              </span>
            </h1>
          </a>

          <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[10px] text-[var(--text-secondary)] sm:text-xs">
            Décidez sur des données vérifiables. En temps réel.
          </p>

          {/* Applications + Badge tenant + Menu — droite */}
          <div className="z-10 flex items-center gap-2">
            <span className="hidden shrink-0 rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)] whitespace-nowrap sm:inline">
              {tenantId}
            </span>

          {/* Hamburger (Comptabilité / POS) — masqué pour Odoo */}
          {currentApp === "linky" && (
          <div className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="#FFF"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  aria-hidden
                  onClick={() => setMenuOpen(false)}
                />
                <nav
                  className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 shadow-lg"
                  role="menu"
                >
                    <div className="border-b border-[var(--border)] px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                      Comptabilité
                    </div>
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
                        className={`block w-full px-3 py-2 text-left text-sm ${
                          viewMode === mode
                            ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                            : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                    <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                      Point de vente
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onViewModeChange("pos_shops");
                        setMenuOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm ${
                        viewMode === "pos_shops"
                          ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                          : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"
                      }`}
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
                      className={`block w-full px-3 py-2 text-left text-sm ${
                        viewMode === "pos_z"
                          ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                          : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"
                      }`}
                    >
                      Z de caisse <span className="text-[10px] text-[var(--muted)]">(à venir)</span>
                    </button>
                    <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                      Applications
                    </div>
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
                    <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                      Administration
                    </div>
                    <a
                      href="/admin/dlp-config"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                    >
                      Paramétrage des décisions
                    </a>
                  </nav>
                </>
              )}
            </div>
          )}

          {currentApp === "linky" && (
          <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                aria-label="Menu"
                aria-expanded={menuOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="#FFF"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    aria-hidden
                    onClick={() => setMenuOpen(false)}
                  />
                  <nav
                    className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 shadow-lg"
                    role="menu"
                  >
                    <div className="border-b border-[var(--border)] px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                      Comptabilité
                    </div>
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
                        className={`block w-full px-3 py-2 text-left text-sm ${
                          viewMode === mode
                            ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                            : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                    <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                      Point de vente
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onViewModeChange("pos_shops");
                        setMenuOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm ${
                        viewMode === "pos_shops"
                          ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                          : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"
                      }`}
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
                      className={`block w-full px-3 py-2 text-left text-sm ${
                        viewMode === "pos_z"
                          ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                          : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"
                      }`}
                    >
                      Z de caisse <span className="text-[10px] text-[var(--muted)]">(à venir)</span>
                    </button>
                    <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                      Applications
                    </div>
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
                    <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                      Administration
                    </div>
                    <a
                      href="/admin/dlp-config"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-3 py-2 text-left text-sm text-[var(--text)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                    >
                      Paramétrage des décisions
                    </a>
                  </nav>
                </>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Ligne 2 (desktop) : Société + Module | Période | Badge intégrité — masqué pour Odoo */}
        {currentApp === "linky" && (
        <div className="mt-2 hidden sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <label htmlFor="company-select" className="sr-only">
              Société
            </label>
            <select
              id="company-select"
              disabled={companiesLoading}
              value={selectedCompanyId ?? ""}
              onChange={(e) => onCompanyChange(e.target.value || null)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              aria-label="Société"
            >
              <option value="">Toutes les sociétés</option>
              {companies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.display_name ?? c.company_id}
                </option>
              ))}
            </select>
            <span className="truncate text-sm text-[var(--muted)]">
              · {moduleActif}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <label htmlFor="period-key" className="sr-only">
              Période
            </label>
            <select
              id="period-key"
              value={periodKey}
              onChange={(e) => setPeriodKey(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              {periodOptionsToShow.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Année"
              value={periodYear}
              onChange={(e) => setPeriodYear(Number(e.target.value))}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              {yearsToShow.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            {showIntegrityBadge ? (
              <IntegrityBadge tenantId={tenantId} sealedCount={sealedCount} sealedCountComplete={sealedCountComplete} onRefresh={onRefreshMetrics} />
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-secondary)]" title="Synchronisation en cours">—</span>
            )}
          </div>
        </div>
        )}

        {/* Ligne 2 (mobile) : société + période + badge intégrité compact — masqué pour Odoo */}
        {currentApp === "linky" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:hidden">
          <label htmlFor="company-select-mobile" className="sr-only">
            Société
          </label>
          <select
            id="company-select-mobile"
            disabled={companiesLoading}
            value={selectedCompanyId ?? ""}
            onChange={(e) => onCompanyChange(e.target.value || null)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            aria-label="Société"
          >
            <option value="">Toutes les sociétés</option>
            {companies.map((c) => (
              <option key={c.company_id} value={c.company_id}>
                {c.display_name ?? c.company_id}
              </option>
            ))}
          </select>
          <label htmlFor="period-key-mobile" className="sr-only">
            Période
          </label>
          <select
            id="period-key-mobile"
            value={periodKey}
            onChange={(e) => setPeriodKey(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {periodOptionsToShow.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Année"
            value={periodYear}
            onChange={(e) => setPeriodYear(Number(e.target.value))}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {yearsToShow.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <div className="ml-auto">
            {showIntegrityBadge ? (
              <IntegrityBadge tenantId={tenantId} sealedCount={sealedCount} sealedCountComplete={sealedCountComplete} onRefresh={onRefreshMetrics} />
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-secondary)]" title="Synchronisation en cours">—</span>
            )}
          </div>
        </div>
        )}
      </div>
    </header>
  );
}
