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
    <svg viewBox={`0 0 ${w} ${h}`} className="h-48 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#tGrad)" />
      <path d={path} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
        <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-4">
          <nav className="mb-2 flex items-center gap-2 text-sm text-[var(--muted)]">
            <Link href={pilotageHref} className="transition-colors hover:text-[var(--text)]">
              Pilotage
            </Link>
            <Icon name="chevron_right" size={16} />
            <span className="font-medium text-[var(--text)]">Trésorerie</span>
          </nav>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--text)]">Trésorerie</h1>
          <p className="mt-1 max-w-3xl text-xs text-[var(--muted)]">{sourceLine}</p>
        </header>

        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
            <button
              type="button"
              onClick={handleRefreshMetrics}
              className="flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--hover)] sm:self-auto"
            >
              <Icon name="refresh" size={16} />
              Actualiser
            </button>
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

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="col-span-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Trésorerie nette
                  </div>
                  <div className="mt-2 text-3xl font-bold tabular-nums text-[var(--text)]">
                    {treasuryKpi?.formatted ?? "—"}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <ConfidenceScore score={confidenceScore} compact />
                  </div>
                </div>

                <div className="col-span-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon name="account_balance" size={16} className="text-[var(--muted)]" />
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
                            reconciliationRate != null && reconciliationRate >= 80 ? "text-emerald-400" : "text-amber-400"
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
                            unreconciledAmount != null && unreconciledAmount > 0 ? "text-amber-400" : "text-[var(--text)]"
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
                    <div className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                      <Icon name="warning" size={14} className="mr-1 inline" />
                      Écriture non rapprochée la plus ancienne : {new Date(oldestUnreconciled).toLocaleDateString("fr-FR")}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Évolution du solde
                </h3>
                {evolutionLoading ? (
                  <div className="flex h-48 items-center justify-center text-sm text-[var(--muted)]">
                    <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    Chargement de la série…
                  </div>
                ) : evolutionError || evolutionSeries.length < 2 ? (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--text-secondary)]">
                    <div className="text-center">
                      <Icon name="show_chart" size={32} className="mb-2 text-[var(--muted)]" />
                      <p>Historique non encore disponible pour cette période.</p>
                    </div>
                  </div>
                ) : (
                  <TreasurySvgChart series={evolutionSeries} />
                )}
                {evolutionSeries.length >= 2 ? (
                  <div className="mt-3 flex items-center gap-4 text-xs text-[var(--muted)]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-0.5 w-4 rounded bg-emerald-500" />
                      Solde réel
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Gouvernance</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Santé synchro</span>
                      <span
                        className={`font-medium ${
                          confidenceScore === 100 ? "text-emerald-400" : confidenceScore !== null ? "text-amber-400" : "text-[var(--muted)]"
                        }`}
                      >
                        {confidenceScore !== null ? `${confidenceScore} %` : "—"}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className={`h-full rounded-full ${confidenceScore === 100 ? "bg-emerald-500" : "bg-amber-500"}`}
                        style={{ width: confidenceScore !== null ? `${confidenceScore}%` : "0%" }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Icon
                        name={reconciliationRate != null && reconciliationRate >= 80 ? "check_circle" : "warning"}
                        size={16}
                        filled
                        className={
                          reconciliationRate != null && reconciliationRate >= 80 ? "text-emerald-400" : "text-amber-400"
                        }
                      />
                      <span className="text-[var(--text-secondary)]">
                        Rapprochement bancaire ({formatPct(reconciliationRate)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon
                        name={confidenceScore === 100 ? "check_circle" : "warning"}
                        size={16}
                        filled
                        className={confidenceScore === 100 ? "text-emerald-400" : "text-amber-400"}
                      />
                      <span className="text-[var(--text-secondary)]">Complétude des données</span>
                    </div>
                  </div>
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
