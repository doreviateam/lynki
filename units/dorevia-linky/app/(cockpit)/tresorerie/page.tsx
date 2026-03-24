"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { TopBar } from "@/components/layout/TopBar";
import { useDashboardData } from "@/hooks/useDashboardData";
import { computeConfidenceScore } from "@/app/lib/confidence";
import { navHrefWithTenant } from "@/components/layout/navTenantHref";
import type { TreasuryEvolutionSeriesPoint } from "@/app/api/treasury-evolution/route";
import {
  CockpitTreasuryLoadingSkeleton,
  CockpitTreasuryPartialBanner,
  CockpitTreasuryUnavailable,
} from "@/components/cockpit-detail/cockpitTreasuryStates";

const USE_METRIC_ENGINE = process.env.NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE === "1";

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function formatPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${Math.round(n)} %`;
}

function formatPeriodFr(from: string, to: string): string {
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "—";
  return `${a.toLocaleDateString("fr-FR")} – ${b.toLocaleDateString("fr-FR")}`;
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

interface TreasurySvgChartProps {
  series: TreasuryEvolutionSeriesPoint[];
}

function TreasurySvgChart({ series }: TreasurySvgChartProps) {
  if (series.length < 2) return null;
  const values = series.map((p) => p.amount);
  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;
  const w = 600;
  const h = 200;
  const toX = (i: number) => (i / (series.length - 1)) * w;
  const toY = (v: number) => h - ((v - min) / (max - min || 1)) * h;
  const path = series.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.amount).toFixed(1)}`).join(" ");
  const area = `${path} L ${toX(series.length - 1).toFixed(1)} ${h} L 0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-64 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--confidence-fiable)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--confidence-fiable)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#tGrad)" />
      <path
        d={path}
        fill="none"
        stroke="var(--confidence-fiable)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TresorerieContent() {
  const {
    scopeTenantId,
    effectiveCompanyId,
    period,
    companies,
    companiesLoading,
    primarySource,
    dashboardMetrics,
    metricsLoading,
    metricsError,
    attemptCount,
    handleRefreshMetrics,
  } = useDashboardData();
  const confidenceScore = computeConfidenceScore(dashboardMetrics);

  const companyLabel = useMemo(
    () => companyLabelFromHook(companies, effectiveCompanyId, companiesLoading),
    [companies, effectiveCompanyId, companiesLoading]
  );
  const periodLabel = period.from && period.to ? formatPeriodFr(period.from, period.to) : "—";
  const pilotageHref = navHrefWithTenant("/", scopeTenantId);

  const sourceLine =
    primarySource === "erp"
      ? "Flux : position de trésorerie et discipline de rapprochement (ERP), même agrégation que la synthèse (`/api/dashboard-metrics` ou instruments si activé). Lecture de pilotage sur le périmètre choisi — pas une image exhaustive ni une norme IFRS."
      : "Flux : position de trésorerie et discipline de rapprochement (Vault), même agrégation que la synthèse (`/api/dashboard-metrics` ou instruments si activé). Lecture de pilotage sur le périmètre choisi — pas une image exhaustive ni une norme IFRS.";

  const insightExcerpt = useMemo(() => {
    if (sourceLine.length <= 260) return sourceLine;
    return `${sourceLine.slice(0, 257)}…`;
  }, [sourceLine]);

  const [evolutionSeries, setEvolutionSeries] = useState<TreasuryEvolutionSeriesPoint[]>([]);
  const [evolutionLoading, setEvolutionLoading] = useState(true);
  const [evolutionError, setEvolutionError] = useState(false);

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
        setEvolutionLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setEvolutionSeries([]);
          setEvolutionLoading(false);
          setEvolutionError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [scopeTenantId, effectiveCompanyId, period.from, period.to]);

  const treasuryKpi = dashboardMetrics?.treasury;
  const tDetails = dashboardMetrics?._details?.treasury;
  const reconciliationRate = tDetails?.treasury_validated_pct ?? null;
  const reconciledAmount = tDetails?.reconciled ?? null;
  const unreconciledAmount = tDetails?.unreconciled ?? null;
  const journalsCount = tDetails?.journals_count ?? null;
  const oldestUnreconciled = tDetails?.oldest_unreconciled_date ?? null;

  const treasuryValuePresent = treasuryKpi?.value != null;
  const hasDetails = Boolean(tDetails);
  const showInstrumentPartial =
    !metricsLoading && !metricsError && USE_METRIC_ENGINE && treasuryValuePresent && !hasDetails;
  const showPartialNoBreakdown =
    !metricsLoading && !metricsError && !USE_METRIC_ENGINE && treasuryValuePresent && !hasDetails;
  const showGlobalEmpty =
    !metricsLoading && !metricsError && dashboardMetrics != null && !treasuryValuePresent && !hasDetails;

  return (
    <>
      <TopBar
        confidenceScore={confidenceScore}
        confidenceLabel={confidenceScore === 100 ? "Fiable" : confidenceScore !== null ? "Partielle" : undefined}
        title="Lynki Desktop Cockpit"
      />

      <main className="flex-1 overflow-y-auto pb-24">
        {/* En-tête contextuel — `d_tail_tr_sorerie_v_r_na_canon_v5` */}
        <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-6 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Link
                href={pilotageHref}
                className="group mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--text)]"
              >
                <Icon name="arrow_back" size={18} className="transition-transform group-hover:-translate-x-1" />
                Pilotage
              </Link>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Détail : Trésorerie</h1>
                {tDetails?.last_statement_import_date ? (
                  <span className="text-xs text-[var(--muted)]">
                    Dernière synchro :{" "}
                    {new Date(tDetails.last_statement_import_date).toLocaleString("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[var(--muted)]">{sourceLine}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                disabled
                title="Export CSV — bientôt disponible"
                className="inline-flex cursor-not-allowed items-center gap-2 rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--muted)] opacity-50"
              >
                <Icon name="download" size={18} />
                Exporter
              </button>
              <button
                type="button"
                onClick={handleRefreshMetrics}
                className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-slate-100 dark:text-slate-900"
              >
                <Icon name="refresh" size={18} />
                Actualiser
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-8 p-6 md:p-8">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
              <span>
                <span className="font-semibold text-[var(--text)]">Période :</span> {periodLabel}
              </span>
              <span className="text-[var(--border)] max-sm:hidden">·</span>
              <span>
                <span className="font-semibold text-[var(--text)]">Société :</span> {companyLabel}
              </span>
              <span className="text-[var(--border)] max-sm:hidden">·</span>
              <span>
                <span className="font-semibold text-[var(--text)]">Tenant :</span> {scopeTenantId}
              </span>
              {tDetails?.last_statement_import_date ? (
                <>
                  <span className="text-[var(--border)] max-sm:hidden">·</span>
                  <span>
                    <span className="font-semibold text-[var(--text)]">Dernier relevé :</span>{" "}
                    {new Date(tDetails.last_statement_import_date).toLocaleDateString("fr-FR")}
                  </span>
                </>
              ) : null}
            </div>
          </div>

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
              <CockpitTreasuryLoadingSkeleton label="Trésorerie — graphique" rows={2} />
            </div>
          ) : null}

          {!metricsLoading && !metricsError ? (
            <>
              {showInstrumentPartial ? (
                <CockpitTreasuryPartialBanner>
                  Mode <strong>instruments</strong> (<code className="text-[10px]">NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE</code>) : le
                  détail rapprochement / soldes (<code className="text-[10px]">_details.treasury</code>) n&apos;est pas fourni dans ce
                  flux. Seul l&apos;indicateur agrégé affiché ci-dessous est disponible ici.
                </CockpitTreasuryPartialBanner>
              ) : null}
              {showPartialNoBreakdown ? (
                <CockpitTreasuryPartialBanner>
                  Vue partielle : une position de trésorerie est affichée sur la tuile, mais le détail rapprochement / lignes n&apos;est
                  pas présent dans la réponse pour ce périmètre.
                </CockpitTreasuryPartialBanner>
              ) : null}

              {/* Rangée 1 — KPI héro + bloc insight (canon détail trésorerie V5) */}
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 flex flex-col justify-between gap-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8 xl:col-span-8 xl:flex-row xl:items-center">
                  <div className="min-w-0 space-y-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                      Trésorerie nette disponible
                    </span>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="text-4xl font-black tabular-nums tracking-tighter text-[var(--text)] sm:text-5xl">
                        {treasuryKpi?.formatted ?? "—"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/50 dark:text-emerald-400">
                      <Icon name="verified" size={20} filled className="text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-extrabold">
                        {confidenceScore === 100 ? "FIABLE" : confidenceScore != null ? "PARTIELLE" : "—"}
                      </span>
                    </div>
                    {reconciliationRate != null ? (
                      <span className="text-[10px] font-medium text-[var(--muted)]">
                        {formatPct(reconciliationRate)} de rapprochement complété
                      </span>
                    ) : (
                      <ConfidenceScore score={confidenceScore} compact />
                    )}
                  </div>
                </div>

                <div className="col-span-12 flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-50 shadow-lg dark:shadow-black/40 xl:col-span-4">
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <Icon name="auto_awesome" size={20} filled className="text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Contexte données</span>
                    </div>
                    <p className="text-sm italic leading-relaxed text-slate-300">&ldquo;{insightExcerpt}&rdquo;</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
                    <span className="text-[10px] text-slate-500">Lynki · même périmètre que le pilotage</span>
                  </div>
                </div>
              </div>

              {/* Rangée 2 — graphique (9) + gouvernance (3) */}
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm lg:col-span-9">
                  <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-bold text-[var(--text)]">Évolution du solde</h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Série sur la période sélectionnée · source {primarySource === "erp" ? "ERP" : "Vault"}
                      </p>
                    </div>
                  </div>
                  {evolutionLoading ? (
                    <div className="flex h-64 items-center justify-center text-sm text-[var(--muted)]">
                      <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                      Chargement de la série…
                    </div>
                  ) : evolutionError || evolutionSeries.length < 2 ? (
                    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--text-secondary)]">
                      <div className="text-center">
                        <Icon name="show_chart" size={32} className="mb-2 text-[var(--muted)]" />
                        <p>Historique non encore disponible pour cette période.</p>
                      </div>
                    </div>
                  ) : (
                    <TreasurySvgChart series={evolutionSeries} />
                  )}
                  {evolutionSeries.length >= 2 ? (
                    <div className="mt-8 flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                          Solde réel (historique)
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-8 border-t border-[var(--border)] pt-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Icon name="account_balance" size={18} className="text-[var(--muted)]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Rapprochement bancaire
                      </span>
                    </div>
                    {hasDetails ? (
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Taux</div>
                          <div
                            className={`text-lg font-bold tabular-nums ${
                              reconciliationRate != null && reconciliationRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {formatPct(reconciliationRate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Rapproché</div>
                          <div className="text-sm font-bold tabular-nums text-[var(--text)]">{formatCurrency(reconciledAmount)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">À rapprocher</div>
                          <div
                            className={`text-sm font-bold tabular-nums ${
                              unreconciledAmount != null && unreconciledAmount > 0 ? "text-amber-600 dark:text-amber-400" : "text-[var(--text)]"
                            }`}
                          >
                            {formatCurrency(unreconciledAmount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Journaux</div>
                          <div className="text-sm font-bold tabular-nums text-[var(--text)]">{journalsCount ?? "—"}</div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)]">
                        Détail rapprochement non disponible pour ce périmètre ou ce mode de flux.
                      </p>
                    )}
                    {oldestUnreconciled ? (
                      <div className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                        <Icon name="warning" size={14} className="mr-1 inline" />
                        Écriture non rapprochée la plus ancienne : {new Date(oldestUnreconciled).toLocaleDateString("fr-FR")}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="col-span-12 flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm lg:col-span-3">
                  <div className="mb-6 flex items-center gap-2">
                    <Icon name="policy" size={22} className="text-[var(--text)]" />
                    <h3 className="text-sm font-bold uppercase tracking-tight text-[var(--text)]">Gouvernance</h3>
                  </div>
                  <div className="flex flex-1 flex-col space-y-6">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">Santé synchro</span>
                        <span
                          className={`text-xs font-black ${
                            confidenceScore === 100
                              ? "text-emerald-600 dark:text-emerald-400"
                              : confidenceScore != null
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-[var(--muted)]"
                          }`}
                        >
                          {confidenceScore !== null ? `${Math.round(confidenceScore)} %` : "—"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[var(--border)]">
                        <div
                          className={`h-full rounded-full ${confidenceScore === 100 ? "bg-emerald-600 dark:bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: confidenceScore !== null ? `${confidenceScore}%` : "0%" }}
                        />
                      </div>
                    </div>
                    <div className="space-y-4 text-sm">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            reconciliationRate != null && reconciliationRate >= 80
                              ? "bg-emerald-100 dark:bg-emerald-500/20"
                              : "bg-amber-100 dark:bg-amber-500/20"
                          }`}
                        >
                          <Icon
                            name={reconciliationRate != null && reconciliationRate >= 80 ? "check" : "priority_high"}
                            size={14}
                            className={
                              reconciliationRate != null && reconciliationRate >= 80
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-[var(--text)]">Rapprochement bancaire</div>
                          <div className="text-[10px] text-[var(--muted)]">Taux {formatPct(reconciliationRate)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            confidenceScore === 100 ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-amber-100 dark:bg-amber-500/20"
                          }`}
                        >
                          <Icon
                            name={confidenceScore === 100 ? "check" : "priority_high"}
                            size={14}
                            className={
                              confidenceScore === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                            }
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-[var(--text)]">Complétude des données</div>
                          <div className="text-[10px] text-[var(--muted)]">
                            {confidenceScore != null ? `${Math.round(confidenceScore)} % intégrité` : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled
                    title="Bientôt disponible"
                    className="mt-6 w-full cursor-not-allowed rounded border border-[var(--border)] py-2 text-xs font-bold text-[var(--text)] opacity-50"
                  >
                    RAPPORT DE CONFORMITÉ
                  </button>
                </div>
              </div>

              {showGlobalEmpty ? (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
                  <div>
                    <Icon name="account_balance" size={40} className="mb-3 text-[var(--muted)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Trésorerie non disponible</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Aucun indicateur exploitable sur ce périmètre. Vérifiez la synchronisation bancaire / Vault.
                    </p>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </main>
    </>
  );
}

export default function TresoreriePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[var(--muted)]">Chargement trésorerie…</div>}>
      <TresorerieContent />
    </Suspense>
  );
}
