"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { TopBar } from "@/components/layout/TopBar";
import { useDashboardData } from "@/hooks/useDashboardData";
import { computeConfidenceScore } from "@/app/lib/confidence";
import { navHrefWithTenant } from "@/components/layout/navTenantHref";
import {
  CockpitFluxNetEmptyNotice,
  CockpitFluxNetLoadingSkeleton,
  CockpitFluxNetPartialBanner,
  CockpitFluxNetUnavailable,
} from "@/components/cockpit-detail/cockpitFluxNetStates";
import type { PaymentsAggregation } from "@/app/types/aggregations";
import { toPositiveSeries } from "@/app/lib/chart-utils";
import {
  getAvailableGranularities,
  getDefaultChartGranularity,
  GRANULARITY_LABELS,
  type ChartGranularity,
} from "@/app/lib/chart-granularity";
import { computeFluxNetInsight } from "@/app/lib/flux-net-insight";
import { DualSeriesChart } from "@/components/DualSeriesChart";
import { formatSeriesPeriodLabel } from "./fluxNetPaymentsSeries";

const USE_METRIC_ENGINE = process.env.NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE === "1";
/** Tolérance affichage EUR sur écart KPI tuile vs net détail (normalisation côté API). */
const KPI_NET_EPSILON = 0.5;

function formatCurrency(n: number | null | undefined, currency = "EUR"): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
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

function FluxNetContent() {
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
  const cashKpi = dashboardMetrics?.cash;
  const details = dashboardMetrics?._details?.cash;

  const companyLabel = useMemo(
    () => companyLabelFromHook(companies, effectiveCompanyId, companiesLoading),
    [companies, effectiveCompanyId, companiesLoading]
  );
  const periodLabel = period.from && period.to ? formatPeriodFr(period.from, period.to) : "—";
  const pilotageHref = navHrefWithTenant("/", scopeTenantId);

  const [paymentsIn, setPaymentsIn] = useState<PaymentsAggregation | null>(null);
  const [paymentsOut, setPaymentsOut] = useState<PaymentsAggregation | null>(null);
  const [evolutionLoading, setEvolutionLoading] = useState(true);
  const [evolutionError, setEvolutionError] = useState(false);

  const availableGranularities = useMemo(
    () =>
      period.from && period.to ? getAvailableGranularities(period.from, period.to) : (["month"] as ChartGranularity[]),
    [period.from, period.to]
  );

  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>("month");
  const [relativeTo100, setRelativeTo100] = useState(false);
  const handleChartGranularityChange = useCallback((g: ChartGranularity) => setChartGranularity(g), []);

  useEffect(() => {
    if (!period.from || !period.to) return;
    setChartGranularity((prev) =>
      availableGranularities.includes(prev) ? prev : getDefaultChartGranularity(period.from, period.to)
    );
  }, [period.from, period.to, availableGranularities]);

  useEffect(() => {
    if (!period.from || !period.to) return;
    const qs = new URLSearchParams({
      tenant: scopeTenantId,
      date_debut: period.from,
      date_fin: period.to,
      granularity: chartGranularity,
    });
    if (effectiveCompanyId) qs.set("company_id", effectiveCompanyId);

    let cancelled = false;
    setEvolutionLoading(true);
    setEvolutionError(false);

    const load = async () => {
      try {
        const [inRes, outRes] = await Promise.all([
          fetch(`/api/payments-in?${qs}`, { cache: "no-store" }),
          fetch(`/api/payments-out?${qs}`, { cache: "no-store" }),
        ]);
        if (cancelled) return;
        const inOk = inRes.ok;
        const outOk = outRes.ok;
        const inJson: PaymentsAggregation | null = inOk ? await inRes.json().catch(() => null) : null;
        const outJson: PaymentsAggregation | null = outOk ? await outRes.json().catch(() => null) : null;
        if (cancelled) return;
        setPaymentsIn(inJson);
        setPaymentsOut(outJson);
        setEvolutionError(!inOk && !outOk);
      } catch {
        if (!cancelled) {
          setPaymentsIn(null);
          setPaymentsOut(null);
          setEvolutionError(true);
        }
      } finally {
        if (!cancelled) setEvolutionLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [scopeTenantId, effectiveCompanyId, period.from, period.to, chartGranularity]);

  const inTotal = paymentsIn?.total ?? 0;
  const outTotalRaw = paymentsOut?.total ?? 0;
  const outTotal = Math.abs(outTotalRaw);
  const seriesInRaw = paymentsIn?.series ?? [];
  const seriesOutRaw = paymentsOut?.series ?? [];
  const evolutionCurrency = paymentsIn?.currency ?? paymentsOut?.currency ?? "EUR";
  const effectiveChartType = chartGranularity === "week" ? "line" : "bar";

  const { primary: insightPrimary } = useMemo(
    () => computeFluxNetInsight(inTotal, outTotal, seriesInRaw, seriesOutRaw, chartGranularity),
    [inTotal, outTotal, seriesInRaw, seriesOutRaw, chartGranularity]
  );

  const periodExtent = useMemo(() => {
    const periods = Array.from(
      new Set([...seriesInRaw.map((p) => p.period), ...seriesOutRaw.map((p) => p.period)])
    ).sort();
    if (periods.length === 0) return null;
    return { first: periods[0], last: periods[periods.length - 1] };
  }, [seriesInRaw, seriesOutRaw]);

  const granuleFr =
    chartGranularity === "week" ? "hebdomadaire" : chartGranularity === "day" ? "journalière" : "mensuelle";

  const hasDetails = Boolean(details);
  const encaissements = details?.encaissements ?? null;
  const decaissements = details?.decaissements ?? null;
  const detailNet = details?.net ?? null;
  const detailCurrency = details?.currency ?? "EUR";

  const kpiNum = typeof cashKpi?.value === "number" ? cashKpi.value : null;
  const kpiVsNetDiffer =
    kpiNum != null &&
    detailNet != null &&
    Number.isFinite(kpiNum) &&
    Number.isFinite(detailNet) &&
    Math.abs(kpiNum - detailNet) > KPI_NET_EPSILON;

  const cashValuePresent = cashKpi?.value != null;
  const showInstrumentPartial =
    !metricsLoading && !metricsError && USE_METRIC_ENGINE && !hasDetails && cashValuePresent;
  const showPartialNoBreakdown =
    !metricsLoading && !metricsError && !USE_METRIC_ENGINE && cashValuePresent && !hasDetails;
  const showGlobalEmpty =
    !metricsLoading && !metricsError && dashboardMetrics != null && !cashValuePresent && !hasDetails;

  const sourceLine =
    primarySource === "erp"
      ? "Flux : agrégation cockpit (ERP), même endpoint que la synthèse (`/api/dashboard-metrics` ou instruments si activé). Lecture de pilotage sur le périmètre choisi — pas un tableau de trésorerie normé (IFRS) ni une image exhaustive de tous les flux comptables."
      : "Flux : agrégation cockpit (Vault), même endpoint que la synthèse (`/api/dashboard-metrics` ou instruments si activé). Lecture de pilotage sur le périmètre choisi — pas un tableau de trésorerie normé (IFRS) ni une image exhaustive de tous les flux comptables.";

  return (
    <>
      <TopBar
        confidenceScore={confidenceScore}
        confidenceLabel={confidenceScore === 100 ? "Fiable" : confidenceScore !== null ? "Partielle" : undefined}
        title="Lynki Desktop Cockpit"
      />

      <main className="flex-1 overflow-y-auto pb-24">
        <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-4">
          <nav className="mb-2 flex items-center gap-2 text-sm text-[var(--muted)]">
            <Link href={pilotageHref} className="transition-colors hover:text-[var(--text)]">
              Pilotage
            </Link>
            <Icon name="chevron_right" size={16} />
            <span className="font-medium text-[var(--text)]">Flux net</span>
          </nav>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--text)]">Flux net</h1>
          <p className="mt-1 max-w-3xl text-xs text-[var(--muted)]">{sourceLine}</p>
        </header>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-xs text-[var(--text-secondary)]">
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
          </div>

          {metricsError ? (
            <CockpitFluxNetUnavailable
              title="Indicateurs de flux indisponibles"
              onRetry={handleRefreshMetrics}
              attemptHint={attemptCount > 0 ? `Tentatives de chargement : ${attemptCount}` : undefined}
            />
          ) : null}

          {metricsLoading && !metricsError ? (
            <div className="space-y-4">
              <CockpitFluxNetLoadingSkeleton label="Flux net — indicateur" rows={3} />
              <CockpitFluxNetLoadingSkeleton label="Flux net — mouvements" rows={2} />
            </div>
          ) : null}

          {!metricsLoading && !metricsError ? (
            <>
              {showInstrumentPartial ? (
                <CockpitFluxNetPartialBanner>
                  Mode <strong>instruments</strong> (<code className="text-[10px]">NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE</code>) : le
                  détail encaissements / décaissements (<code className="text-[10px]">_details.cash</code>) n’est pas fourni dans ce
                  flux. Seul l’indicateur agrégé affiché ci-dessous est disponible ici.
                </CockpitFluxNetPartialBanner>
              ) : null}
              {showPartialNoBreakdown ? (
                <CockpitFluxNetPartialBanner>
                  Vue partielle : un flux net est affiché sur la tuile, mais la décomposition encaissements / décaissements n’est pas
                  présente dans la réponse pour ce périmètre.
                </CockpitFluxNetPartialBanner>
              ) : null}
              {kpiVsNetDiffer ? (
                <CockpitFluxNetPartialBanner>
                  L’indicateur principal (tuile) peut différer du solde <strong>encaissements − décaissements</strong> ci-dessous
                  (normalisation devise, complétude des paiements ou garde-fous côté agrégateur). Les deux lectures restent dans le
                  périmètre cockpit, sans équivalence avec un tableau de flux comptable complet.
                </CockpitFluxNetPartialBanner>
              ) : null}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Flux net (indicateur cockpit)
                  </div>
                  <div
                    className={`mt-2 text-3xl font-bold tabular-nums ${(kpiNum ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {cashKpi?.formatted ?? "—"}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <ConfidenceScore score={confidenceScore} compact />
                  </div>
                  {cashKpi?.status_reason ? (
                    <p className="mt-3 text-xs text-[var(--muted)]">{cashKpi.status_reason}</p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Encaissements</div>
                    {hasDetails ? (
                      <div className="mt-2 text-2xl font-bold tabular-nums text-emerald-400">
                        {formatCurrency(encaissements, detailCurrency)}
                      </div>
                    ) : (
                      <div className="mt-3">
                        <CockpitFluxNetEmptyNotice>
                          Non disponible dans ce flux — voir la bannière partielle ci-dessus si besoin.
                        </CockpitFluxNetEmptyNotice>
                      </div>
                    )}
                    <p className="mt-3 text-[10px] leading-relaxed text-[var(--muted)]">
                      Total des entrées sur la période selon l’agrégat paiements du cockpit (pas toutes les catégories de produit d’un
                      état de flux normé).
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Décaissements</div>
                    {hasDetails ? (
                      <div className="mt-2 text-2xl font-bold tabular-nums text-amber-400">
                        {formatCurrency(decaissements, detailCurrency)}
                      </div>
                    ) : (
                      <div className="mt-3">
                        <CockpitFluxNetEmptyNotice>
                          Non disponible dans ce flux — voir la bannière partielle ci-dessus si besoin.
                        </CockpitFluxNetEmptyNotice>
                      </div>
                    )}
                    <p className="mt-3 text-[10px] leading-relaxed text-[var(--muted)]">
                      Total des sorties sur la période selon le même agrégat (montants en valeur absolue côté affichage détail).
                    </p>
                  </div>
                </div>
              </div>

              {hasDetails ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Contrôle lecture
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Solde <span className="font-medium text-[var(--text)]">encaissements − décaissements</span> sur la période :{" "}
                    <span
                      className={`font-bold tabular-nums ${(detailNet ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {formatCurrency(detailNet, detailCurrency)}
                    </span>
                    {kpiVsNetDiffer ? (
                      <span className="ml-1 text-xs text-[var(--muted)]">(peut différer du KPI tuile — voir encadré)</span>
                    ) : null}
                  </p>
                </div>
              ) : null}

              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Évolution
                </h2>
                <p className="mb-4 text-[10px] leading-relaxed text-[var(--muted)]">
                  Même lecture que la carte <strong>FLUX NET</strong> du tableau de bord : volumes{" "}
                  <strong>encaissements</strong> et <strong>décaissements</strong> (Vault), granularité{" "}
                  <strong>{granuleFr}</strong> selon le sélecteur ci-dessous. En semaine : courbes ; sinon : barres groupées.
                  Ce n’est pas le solde de trésorerie bancaire.
                </p>
                {evolutionLoading ? (
                  <div className="flex h-48 items-center justify-center text-sm text-[var(--muted)]">
                    <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    Chargement de la série…
                  </div>
                ) : evolutionError ? (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--text-secondary)]">
                    <div className="px-4 text-center">
                      <Icon name="show_chart" size={32} className="mx-auto mb-2 text-[var(--muted)]" />
                      <p>Évolution non disponible pour cette période ou agrégats indisponibles.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="sr-only">Granularité du graphique</span>
                      <div className="flex gap-1 rounded-md bg-[var(--muted-soft)] p-0.5">
                        {availableGranularities.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              if (availableGranularities.length > 1) handleChartGranularityChange(g);
                            }}
                            aria-pressed={chartGranularity === g}
                            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                              chartGranularity === g
                                ? "bg-[var(--accent)] text-white"
                                : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
                            } ${availableGranularities.length === 1 ? "cursor-default" : ""}`}
                          >
                            {GRANULARITY_LABELS[g]}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1 rounded-md bg-[var(--muted-soft)] p-0.5">
                        <button
                          type="button"
                          onClick={() => setRelativeTo100(false)}
                          aria-pressed={!relativeTo100}
                          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                            !relativeTo100
                              ? "bg-[var(--accent)] text-white"
                              : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
                          }`}
                        >
                          Montants
                        </button>
                        <button
                          type="button"
                          onClick={() => setRelativeTo100(true)}
                          aria-pressed={relativeTo100}
                          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                            relativeTo100
                              ? "bg-[var(--accent)] text-white"
                              : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
                          }`}
                        >
                          Répartition %
                        </button>
                      </div>
                    </div>
                    <DualSeriesChart
                      series1={toPositiveSeries(seriesInRaw)}
                      series2={toPositiveSeries(seriesOutRaw)}
                      total1={Math.abs(inTotal)}
                      total2={outTotal}
                      label1="Encaissements"
                      label2="Décaissements"
                      granularity={chartGranularity}
                      chartType={effectiveChartType}
                      currency={evolutionCurrency}
                      relativeTo100={relativeTo100}
                    />
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      <span className="font-semibold text-[var(--positive)]">{insightPrimary}</span>
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--muted)]">
                      Source : Vault (<code className="text-[10px]">payments-in</code>,{" "}
                      <code className="text-[10px]">payments-out</code>) — mêmes séries que la carte FLUX NET.
                    </p>
                    {periodExtent ? (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[var(--muted)]">
                        <span>
                          {formatSeriesPeriodLabel(periodExtent.first)} → {formatSeriesPeriodLabel(periodExtent.last)}
                        </span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Lecture et limites
                </h2>
                <ul className="list-inside list-disc space-y-2 text-xs text-[var(--text-secondary)]">
                  <li>
                    Cette page sert au <strong>pilotage</strong> sur le périmètre (dates, société, tenant) décrit en tête de page, à
                    partir des mêmes agrégats que le tableau de bord.
                  </li>
                  <li>
                    Ce n’est <strong>pas</strong> un tableau de trésorerie IFRS ni une vision exhaustive des flux comptables hors
                    périmètre servi.
                  </li>
                  <li>
                    Lorsque le détail est présent, le flux net affiché sur la tuile est calibré côté API ; le solde encaissements −
                    décaissements permet de recouper la lecture sur la même brique <code className="text-[10px]">_details.cash</code>.
                  </li>
                </ul>
              </div>

              {showGlobalEmpty ? (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
                  <div>
                    <Icon name="swap_horiz" size={40} className="mb-3 text-[var(--muted)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Flux net non disponible</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Aucun indicateur exploitable sur ce périmètre. Vérifiez la synchronisation trésorerie / paiements avec la source.
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

export default function FluxNetPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center text-[var(--muted)]">Chargement Flux net…</div>}
    >
      <FluxNetContent />
    </Suspense>
  );
}
