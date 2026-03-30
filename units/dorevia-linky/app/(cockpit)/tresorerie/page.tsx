"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IconTreasury } from "@/components/CardIcons";
import { Icon } from "@/components/Icon";
import { ChromeAdaptiveProvider, useChromeAdaptive } from "@/app/context/ChromeAdaptiveContext";
import { TenantProvider } from "@/app/context/TenantContext";
import { ReportHeader, type ViewMode } from "@/components/ReportHeader";
import { TenantChoiceView } from "@/components/TenantChoiceView";
import { useDashboardData, type DashboardData } from "@/hooks/useDashboardData";
import { computeConfidenceScore } from "@/app/lib/confidence";
import { navHrefWithTenant } from "@/components/layout/navTenantHref";
import type { TreasuryEvolutionSeriesPoint } from "@/app/api/treasury-evolution/route";
import {
  CockpitTreasuryLoadingSkeleton,
  CockpitTreasuryPartialBanner,
  CockpitTreasuryUnavailable,
} from "@/components/cockpit-detail/cockpitTreasuryStates";
import { TreasuryDetailBandeau } from "@/components/cockpit-detail/TreasuryDetailBandeau";
import { TreasuryDetailGapBlock } from "@/components/cockpit-detail/TreasuryDetailGapBlock";
import { TreasuryDetailDecompositionAggregate } from "@/components/cockpit-detail/TreasuryDetailDecompositionAggregate";
import { TreasuryDetailUnreconciledLinesBlock } from "@/components/cockpit-detail/TreasuryDetailUnreconciledLinesBlock";
import { TreasuryDetailVigilancesBlock } from "@/components/cockpit-detail/TreasuryDetailVigilancesBlock";
import { TreasuryDetailEvolutionPanel } from "@/components/cockpit-detail/TreasuryDetailEvolutionPanel";
import {
  buildTreasuryDetailCsvContent,
  buildTreasuryDetailCsvFilename,
  downloadTreasuryDetailCsv,
} from "@/app/lib/treasury-detail-export-csv";
import { getDefaultPeriod } from "@/app/lib/period-utils";
import type { TenantConfigResponse } from "@/app/lib/tenant-types";

const USE_METRIC_ENGINE = process.env.NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE === "1";

const ODOO_BASE_URL =
  process.env.NEXT_PUBLIC_ODOO_URL ?? "https://odoo.stinger.sarl-la-platine.doreviateam.com/odoo";
const ODOO_BANK_STATEMENT_LINES_HREF = `${ODOO_BASE_URL.replace(/\/$/, "")}/web#model=account.bank.statement.line`;

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function formatPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${Math.round(n)} %`;
}

function companyLabelFromHook(
  companies: { company_id: string; display_name?: string }[],
  effectiveCompanyId: string | null,
  companiesLoading: boolean
): string {
  if (companiesLoading) return "Chargement société…";
  if (!effectiveCompanyId) return "Toutes les sociétés visibles";
  const c = companies.find((x) => x.company_id === effectiveCompanyId);
  return c?.display_name?.trim() || effectiveCompanyId;
}

/** Jours écoulés depuis la date la plus ancienne (écriture ouverte). */
function daysSinceOldestUnreconciled(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

/** Réserve sous le header fixe (périmètre discret + filtres) — mesure réelle du bloc. */
function useTreasuryDetailHeaderSpacer(chromeVisible: boolean) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [spacerPx, setSpacerPx] = useState(128);
  useLayoutEffect(() => {
    if (!chromeVisible) {
      setSpacerPx(0);
      return;
    }
    const el = shellRef.current;
    if (!el) return;
    const measure = () => setSpacerPx(Math.max(72, Math.ceil(el.getBoundingClientRect().height)));
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [chromeVisible]);
  return { shellRef, headerSpacerHeightPx: chromeVisible ? spacerPx : 0 };
}

function TresorerieWithChrome({ dashboard }: { dashboard: DashboardData }) {
  const searchParams = useSearchParams();
  const chromeAdaptive = useChromeAdaptive();
  const tenantFromUrl = searchParams.get("tenant");
  const requestedTenant = tenantFromUrl ?? dashboard.tenantId;

  const onResolvedTenantChange = useCallback(
    (_tenantId: string, config: TenantConfigResponse) => {
      dashboard.setSelectedCompanyId(null);
      dashboard.setPeriod(getDefaultPeriod());
      chromeAdaptive?.revealChrome?.();
      chromeAdaptive?.setChromePinned?.(config?.chrome?.behavior?.defaultChromePinned ?? true);
    },
    [chromeAdaptive, dashboard]
  );

  return (
    <TenantProvider
      requestedTenant={requestedTenant}
      onSetTenantNavigate={dashboard.onSetTenantNavigate}
      onResolvedTenantChange={onResolvedTenantChange}
    >
      <TresorerieMain dashboard={dashboard} />
    </TenantProvider>
  );
}

function TresorerieMain({ dashboard }: { dashboard: DashboardData }) {
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const {
    scopeTenantId,
    effectiveCompanyId,
    period,
    companies,
    companiesLoading,
    selectedCompanyId,
    setSelectedCompanyId,
    primarySource,
    dashboardMetrics,
    metricsLoading,
    metricsError,
    attemptCount,
    handleRefreshMetrics,
    availableYears,
    monthsWithDataByYear,
    setPeriod,
  } = dashboard;

  const chromeAdaptive = useChromeAdaptive();
  const chromeVisible = chromeAdaptive?.isChromeVisible ?? true;
  const chromeState = chromeAdaptive?.chromeState ?? "expanded";
  const revealChrome = chromeAdaptive?.revealChrome ?? (() => {});
  const { shellRef: headerShellRef, headerSpacerHeightPx } = useTreasuryDetailHeaderSpacer(chromeVisible);

  const showHeaderIntegrity =
    (dashboardMetrics?.sealed_count_complete === true || dashboard.userBypassIncomplete) &&
    dashboardMetrics != null &&
    !metricsLoading &&
    !metricsError;

  const companyLabel = useMemo(
    () => companyLabelFromHook(companies, effectiveCompanyId, companiesLoading),
    [companies, effectiveCompanyId, companiesLoading]
  );
  const pilotageHref = navHrefWithTenant("/", scopeTenantId);

  const [evolutionSeries, setEvolutionSeries] = useState<TreasuryEvolutionSeriesPoint[]>([]);
  const [evolutionUnreconciledSeries, setEvolutionUnreconciledSeries] = useState<TreasuryEvolutionSeriesPoint[]>([]);
  const [evolutionReconciledSeries, setEvolutionReconciledSeries] = useState<TreasuryEvolutionSeriesPoint[]>([]);
  const [evolutionCoverageSeries, setEvolutionCoverageSeries] = useState<{ period: string; pct: number | null }[]>([]);
  const [evolutionPartialReason, setEvolutionPartialReason] = useState<string | null>(null);
  const [evolutionLoading, setEvolutionLoading] = useState(true);
  const [evolutionError, setEvolutionError] = useState(false);

  const [bankHealthUnreconciledAmt, setBankHealthUnreconciledAmt] = useState<number | null>(null);
  const [bankHealthEntries, setBankHealthEntries] = useState<number | null>(null);

  useEffect(() => {
    if (!scopeTenantId) return;
    let cancelled = false;
    const qs = new URLSearchParams({ tenant: scopeTenantId });
    if (effectiveCompanyId) qs.set("company_id", effectiveCompanyId);
    fetch(`/api/bank-reconciliation-health?${qs}`, { cache: "no-store" })
      .then(async (r) => (r.ok ? r.json() : {}))
      .then((d: Record<string, unknown>) => {
        if (cancelled) return;
        const amt = d.unreconciled_amount;
        const ent = d.unreconciled_entries;
        setBankHealthUnreconciledAmt(typeof amt === "number" && Number.isFinite(amt) ? amt : null);
        setBankHealthEntries(typeof ent === "number" && Number.isFinite(ent) ? ent : null);
      })
      .catch(() => {
        if (!cancelled) {
          setBankHealthUnreconciledAmt(null);
          setBankHealthEntries(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [scopeTenantId, effectiveCompanyId]);

  useEffect(() => {
    if (!period.from || !period.to) return;
    setEvolutionLoading(true);
    setEvolutionError(false);
    const qs = new URLSearchParams({
      tenant: scopeTenantId,
      date_debut: period.from,
      date_fin: period.to,
    });
    if (effectiveCompanyId) qs.set("company_id", effectiveCompanyId);

    let cancelled = false;
    fetch(`/api/treasury-evolution?${qs}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("bad status");
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        setEvolutionSeries(Array.isArray(d?.series) ? d.series : []);
        setEvolutionUnreconciledSeries(Array.isArray(d?.series_unreconciled) ? d.series_unreconciled : []);
        setEvolutionReconciledSeries(Array.isArray(d?.series_reconciled) ? d.series_reconciled : []);
        setEvolutionCoverageSeries(Array.isArray(d?.coverage_series) ? d.coverage_series : []);
        setEvolutionPartialReason(typeof d?.partial_reason === "string" && d.partial_reason.trim() ? d.partial_reason.trim() : null);
        setEvolutionLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setEvolutionSeries([]);
          setEvolutionUnreconciledSeries([]);
          setEvolutionReconciledSeries([]);
          setEvolutionCoverageSeries([]);
          setEvolutionPartialReason(null);
          setEvolutionLoading(false);
          setEvolutionError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [scopeTenantId, effectiveCompanyId, period.from, period.to]);

  const confidenceScore = computeConfidenceScore(dashboardMetrics);
  const treasuryKpi = dashboardMetrics?.treasury;
  const tDetails = dashboardMetrics?._details?.treasury;
  const reconciliationRate = tDetails?.treasury_validated_pct ?? null;
  const reconciledAmount = tDetails?.reconciled ?? null;
  const unreconciledAmount = tDetails?.unreconciled ?? null;
  const journalsCount = tDetails?.journals_count ?? null;
  const oldestUnreconciled = tDetails?.oldest_unreconciled_date ?? null;
  const unreconciledLines = tDetails?.unreconciled_lines_count ?? null;

  const treasuryValuePresent = treasuryKpi?.value != null;
  const hasDetails = Boolean(tDetails);
  const showInstrumentPartial =
    !metricsLoading && !metricsError && USE_METRIC_ENGINE && treasuryValuePresent && !hasDetails;
  const showPartialNoBreakdown =
    !metricsLoading && !metricsError && !USE_METRIC_ENGINE && treasuryValuePresent && !hasDetails;
  const showGlobalEmpty =
    !metricsLoading && !metricsError && dashboardMetrics != null && !treasuryValuePresent && !hasDetails;

  const showBlocks = !metricsLoading && !metricsError && dashboardMetrics != null && !showGlobalEmpty;

  const oldestDays = daysSinceOldestUnreconciled(oldestUnreconciled);

  const handleExportCsv = useCallback(() => {
    if (!dashboardMetrics || !scopeTenantId || !period.from || !period.to) return;
    const content = buildTreasuryDetailCsvContent({
      exportedAtIso: new Date().toISOString(),
      periodFrom: period.from,
      periodTo: period.to,
      tenantId: scopeTenantId,
      companyId: effectiveCompanyId,
      companyLabel,
      primarySource,
      metrics: dashboardMetrics,
      confidenceScore,
      bankHealthUnreconciledAmt,
      bankHealthEntries,
      evolutionMainPoints: evolutionSeries.length,
      evolutionUnreconciledPoints: evolutionUnreconciledSeries.length,
      evolutionCoveragePoints: evolutionCoverageSeries.length,
    });
    downloadTreasuryDetailCsv(buildTreasuryDetailCsvFilename(scopeTenantId), content);
  }, [
    dashboardMetrics,
    scopeTenantId,
    period.from,
    period.to,
    effectiveCompanyId,
    companyLabel,
    primarySource,
    confidenceScore,
    bankHealthUnreconciledAmt,
    bankHealthEntries,
    evolutionSeries.length,
    evolutionUnreconciledSeries.length,
    evolutionCoverageSeries.length,
  ]);

  const exportDisabled = metricsLoading || metricsError || dashboardMetrics == null;

  return (
    <div key={scopeTenantId} className="flex min-h-screen flex-col">
      <div
        aria-hidden
        className="shrink-0 transition-[height,max-height] duration-300 ease-out motion-reduce:duration-0"
        style={{
          height: headerSpacerHeightPx,
          maxHeight: headerSpacerHeightPx,
          overflow: "hidden",
        }}
      />
      <div
        ref={headerShellRef}
        className={`fixed top-0 left-0 right-0 z-40 border-b border-[var(--border)] bg-[var(--bg-secondary)] transition-[transform,max-height] duration-300 ease-out motion-reduce:duration-0 lg:left-72 ${chromeVisible ? "max-h-none overflow-visible" : "max-h-0 overflow-hidden"}`}
        style={{
          transform: chromeVisible ? "translateY(0)" : "translateY(-100%)",
        }}
      >
        <ReportHeader
          tenantId={scopeTenantId}
          companies={companies}
          companiesLoading={companiesLoading}
          selectedCompanyId={selectedCompanyId}
          onCompanyChange={setSelectedCompanyId}
          period={period}
          onPeriodChange={setPeriod}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          availableYears={availableYears}
          monthsWithDataByYear={monthsWithDataByYear}
          sealedCount={dashboardMetrics?.sealed_count}
          sealedCountComplete={dashboardMetrics?.sealed_count_complete}
          onRefreshMetrics={handleRefreshMetrics}
          showIntegrityBadge={showHeaderIntegrity}
          chromeCompact={chromeState === "compact"}
          onExpandChrome={() => revealChrome("tap_trigger")}
          appView="pilotage"
          onNavigateToAppView={undefined}
          depthDetailContext
        />
      </div>

      <main className="mx-auto flex min-h-0 w-full max-w-none flex-1 flex-col overflow-y-auto px-4 pb-24 pt-2 sm:px-6 sm:pt-3 lg:px-10 xl:px-12 2xl:mx-auto 2xl:max-w-[1920px] 2xl:px-14">
        <header className="border-b border-[var(--border)] bg-[var(--card)] px-0 py-4 md:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-3 font-headline text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-3xl">
                <IconTreasury className="h-8 w-8 shrink-0 text-[var(--accent)] sm:h-9 sm:w-9" aria-hidden />
                Trésorerie
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-snug text-[var(--text-secondary)] sm:text-base">
                Détail de la position validée, du rapprochement et des écarts sur le périmètre sélectionné.
              </p>
            </div>
            <div className="flex shrink-0">
              <button
                type="button"
                disabled={exportDisabled}
                onClick={handleExportCsv}
                title={
                  exportDisabled
                    ? "Export indisponible tant que les indicateurs ne sont pas chargés"
                    : "Télécharger un snapshot CSV des indicateurs affichés (séparateur ;)"
                }
                className="inline-flex min-h-[44px] items-center gap-2 rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0"
              >
                <Icon name="download" size={18} />
                Exporter
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-8 py-5 md:py-7">
          {metricsError ? (
            <CockpitTreasuryUnavailable
              title="Indicateurs de trésorerie indisponibles"
              onRetry={handleRefreshMetrics}
              attemptHint={attemptCount > 0 ? `Tentatives de chargement : ${attemptCount}` : undefined}
            />
          ) : null}

          {metricsLoading && !metricsError ? (
            <div className="space-y-4">
              <CockpitTreasuryLoadingSkeleton label="Trésorerie — indicateurs" rows={3} />
              <CockpitTreasuryLoadingSkeleton label="Trésorerie — blocs" rows={4} />
            </div>
          ) : null}

          {showBlocks ? (
            <>
              {showInstrumentPartial ? (
                <CockpitTreasuryPartialBanner>
                  Affichage partiel : le moteur « instruments » ne fournit pas ici le détail rapprochement et soldes, seulement
                  l&apos;agrégat principal.
                </CockpitTreasuryPartialBanner>
              ) : null}
              {showPartialNoBreakdown ? (
                <CockpitTreasuryPartialBanner>
                  Vue partielle : la position s&apos;affiche, mais le détail rapprochement et les lignes ne sont pas disponibles pour ce
                  périmètre dans la réponse actuelle.
                </CockpitTreasuryPartialBanner>
              ) : null}

              <TreasuryDetailBandeau metrics={dashboardMetrics} />

              {hasDetails && tDetails ? (
                <TreasuryDetailDecompositionAggregate detail={tDetails} formatCurrency={formatCurrency} />
              ) : (
                <section
                  aria-labelledby="treso-decomp-placeholder"
                  className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Icon name="pie_chart" size={20} className="text-[var(--muted)]" />
                    <h2 id="treso-decomp-placeholder" className="text-sm font-bold uppercase tracking-tight text-[var(--text)]">
                      Décomposition de la trésorerie
                    </h2>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Indisponible sans agrégat détaillé sur ce périmètre.
                  </p>
                </section>
              )}

              <section
                aria-labelledby="treso-rappro-heading"
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Icon name="account_balance" size={20} className="text-[var(--muted)]" />
                  <h2 id="treso-rappro-heading" className="text-sm font-bold uppercase tracking-tight text-[var(--text)]">
                    Rapprochement bancaire
                  </h2>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-[var(--text-secondary)]">
                  Ce qu&apos;il reste à sécuriser : taux, montants encore ouverts, volumétrie des lignes. Les libellés et actions de
                  traitement restent dans l&apos;ERP.
                </p>
                {hasDetails ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Taux</div>
                        <div
                          className={`text-lg font-bold tabular-nums ${
                            reconciliationRate != null && reconciliationRate >= 80
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {formatPct(reconciliationRate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Montant rapproché</div>
                        <div className="text-sm font-bold tabular-nums text-[var(--text)]">{formatCurrency(reconciledAmount)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Montant à rapprocher</div>
                        <div
                          className={`text-sm font-bold tabular-nums ${
                            unreconciledAmount != null && unreconciledAmount > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-[var(--text)]"
                          }`}
                        >
                          {formatCurrency(unreconciledAmount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                          {unreconciledLines != null ? "Lignes ouvertes" : "Journaux suivis"}
                        </div>
                        <div className="text-sm font-bold tabular-nums text-[var(--text)]">
                          {unreconciledLines != null ? unreconciledLines : (journalsCount ?? "—")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="#treso-lignes-ouvertes"
                        className="inline-flex min-h-[44px] items-center rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition-opacity hover:opacity-90 sm:min-h-0"
                      >
                        Voir les lignes à traiter
                      </Link>
                      <a
                        href={ODOO_BANK_STATEMENT_LINES_HREF}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)]/30 px-3 py-2 text-xs font-semibold text-[var(--accent)] transition-opacity hover:opacity-90 sm:min-h-0"
                      >
                        Ouvrir le rapprochement (ERP)
                      </a>
                    </div>

                    {bankHealthUnreconciledAmt != null ? (
                      <details className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/30 px-2 py-1.5">
                        <summary className="cursor-pointer select-none text-[10px] font-medium text-[var(--muted)]">
                          Contrôle complémentaire (santé bancaire)
                        </summary>
                        <p className="mt-2 text-[10px] leading-relaxed text-[var(--muted)]">
                          Montant ouvert signalé <strong>{formatCurrency(bankHealthUnreconciledAmt)}</strong>
                          {bankHealthEntries != null ? ` · ${bankHealthEntries} écriture(s)` : ""}.
                        </p>
                      </details>
                    ) : null}

                    <div className="mt-6 border-t border-[var(--border)] pt-4">
                      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                        Ancienneté des lignes ouvertes
                      </h3>
                      {oldestUnreconciled ? (
                        <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-400">
                          <Icon name="schedule" size={16} className="mr-1 inline align-text-bottom" />
                          Plus ancienne écriture ouverte :{" "}
                          <strong>{new Date(oldestUnreconciled).toLocaleDateString("fr-FR")}</strong>
                          {oldestDays != null ? (
                            <span className="text-[var(--text-secondary)]"> — {oldestDays} jour(s)</span>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--text-secondary)]">Aucune date d&apos;ancienneté pour ce périmètre.</p>
                      )}
                      <p className="mt-2 text-[10px] text-[var(--muted)]">
                        Répartition par tranches (0–7 j, 8–30 j, &gt; 30 j) : voir le tableau ci-dessous.
                      </p>
                    </div>
                    <TreasuryDetailUnreconciledLinesBlock
                      key={`${scopeTenantId}-${effectiveCompanyId ?? "all"}`}
                      tenantId={scopeTenantId}
                      companyId={effectiveCompanyId}
                      formatCurrency={formatCurrency}
                    />
                  </>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Détail rapprochement non disponible pour ce périmètre ou ce mode de flux.
                  </p>
                )}
              </section>

              <TreasuryDetailGapBlock metrics={dashboardMetrics} />

              <div className="space-y-8 border-t border-[var(--border)] pt-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Contexte et tendances</p>
                <TreasuryDetailVigilancesBlock
                  metrics={dashboardMetrics}
                  confidenceScore={confidenceScore}
                  pilotageHref={pilotageHref}
                  odooBankStatementLinesHref={ODOO_BANK_STATEMENT_LINES_HREF}
                  formatCurrency={formatCurrency}
                />
                <TreasuryDetailEvolutionPanel
                  primarySourceLabel={primarySource === "erp" ? "ERP" : "Vault"}
                  evolutionLoading={evolutionLoading}
                  evolutionError={evolutionError}
                  evolutionSeriesFull={evolutionSeries}
                  evolutionUnreconciledFull={evolutionUnreconciledSeries}
                  evolutionReconciledFull={evolutionReconciledSeries}
                  evolutionCoverageFull={evolutionCoverageSeries}
                  partialReason={evolutionPartialReason}
                  formatCurrency={formatCurrency}
                  formatPct={formatPct}
                />
              </div>
            </>
          ) : null}

          {!metricsLoading && !metricsError && showGlobalEmpty ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
              <div>
                <Icon name="account_balance" size={40} className="mb-3 text-[var(--muted)]" />
                <p className="text-sm font-medium text-[var(--text-secondary)]">Trésorerie non disponible</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Aucun indicateur exploitable sur ce périmètre. Vérifiez la synchronisation bancaire ou la source de données.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function TresorerieDataGate() {
  const dashboard = useDashboardData();
  if (dashboard.showTenantChoice) {
    return <TenantChoiceView onSelect={(id) => dashboard.onSetTenantNavigate(id)} />;
  }
  return <TresorerieWithChrome dashboard={dashboard} />;
}

export default function TresoreriePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[var(--muted)]">Chargement trésorerie…</div>}>
      <ChromeAdaptiveProvider>
        <TresorerieDataGate />
      </ChromeAdaptiveProvider>
    </Suspense>
  );
}
