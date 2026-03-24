"use client";

import { useState, useEffect, Suspense } from "react";
import { Icon } from "@/components/Icon";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { TopBar } from "@/components/layout/TopBar";
import { useDashboardData } from "@/hooks/useDashboardData";
import { computeConfidenceScore } from "@/app/lib/confidence";
import type { TreasuryEvolutionSeriesPoint } from "@/app/api/treasury-evolution/route";

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function formatPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${Math.round(n)} %`;
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
  const { scopeTenantId, effectiveCompanyId, period, dashboardMetrics, metricsLoading } = useDashboardData();
  const confidenceScore = computeConfidenceScore(dashboardMetrics);

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
    fetch(`/api/treasury-evolution?${qs}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setEvolutionSeries(Array.isArray(d?.series) ? d.series : []);
        setEvolutionLoading(false);
      })
      .catch(() => {
        setEvolutionSeries([]);
        setEvolutionLoading(false);
        setEvolutionError(true);
      });
  }, [scopeTenantId, effectiveCompanyId, period.from, period.to]);

  const treasuryKpi = dashboardMetrics?.treasury;
  const tDetails = dashboardMetrics?._details?.treasury;
  const reconciliationRate = tDetails?.treasury_validated_pct ?? null;
  const reconciledAmount = tDetails?.reconciled ?? null;
  const unreconciledAmount = tDetails?.unreconciled ?? null;
  const journalsCount = tDetails?.journals_count ?? null;
  const oldestUnreconciled = tDetails?.oldest_unreconciled_date ?? null;

  return (
    <>
      <TopBar
        confidenceScore={confidenceScore}
        confidenceLabel={confidenceScore === 100 ? "Fiable" : confidenceScore !== null ? "Partielle" : undefined}
        title="Lynki Desktop Cockpit"
      />

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Breadcrumb */}
        <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-3">
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <a href="/" className="transition-colors hover:text-[var(--text)]">Pilotage</a>
              <Icon name="chevron_right" size={16} />
              <span className="font-medium text-[var(--text)]">Détail : Trésorerie</span>
            </nav>
            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
              {tDetails?.last_statement_import_date && (
                <span>Dernier relevé : {new Date(tDetails.last_statement_import_date).toLocaleDateString("fr-FR")}</span>
              )}
              <button className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--hover)]">
                <Icon name="refresh" size={16} />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* KPI row */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="col-span-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Trésorerie nette
              </div>
              {metricsLoading ? (
                <div className="mt-2 h-8 w-32 animate-pulse rounded bg-[var(--border)]" />
              ) : (
                <div className="mt-2 text-3xl font-bold tabular-nums text-[var(--text)]">
                  {treasuryKpi?.formatted ?? "—"}
                </div>
              )}
              <div className="mt-2 flex items-center gap-3">
                <ConfidenceScore score={confidenceScore} compact />
              </div>
            </div>

            {/* Rapprochement bancaire */}
            <div className="col-span-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="account_balance" size={16} className="text-[var(--muted)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Rapprochement bancaire
                </span>
              </div>
              {metricsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-5 animate-pulse rounded bg-[var(--border)]" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Taux</div>
                    <div className={`text-lg font-bold tabular-nums ${reconciliationRate != null && reconciliationRate >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                      {formatPct(reconciliationRate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Rapproché</div>
                    <div className="text-sm font-bold tabular-nums text-[var(--text)]">{formatCurrency(reconciledAmount)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">À rapprocher</div>
                    <div className={`text-sm font-bold tabular-nums ${unreconciledAmount != null && unreconciledAmount > 0 ? "text-amber-400" : "text-[var(--text)]"}`}>
                      {formatCurrency(unreconciledAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Journaux</div>
                    <div className="text-sm font-bold tabular-nums text-[var(--text)]">{journalsCount ?? "—"}</div>
                  </div>
                </div>
              )}
              {oldestUnreconciled && (
                <div className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                  <Icon name="warning" size={14} className="mr-1 inline" />
                  Écriture non rapprochée la plus ancienne : {new Date(oldestUnreconciled).toLocaleDateString("fr-FR")}
                </div>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Évolution du solde
            </h3>
            {evolutionLoading ? (
              <div className="flex h-48 items-center justify-center text-sm text-[var(--muted)]">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mr-2" />
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
            {evolutionSeries.length >= 2 && (
              <div className="mt-3 flex items-center gap-4 text-xs text-[var(--muted)]">
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded bg-emerald-500" />
                  Solde réel
                </span>
              </div>
            )}
          </div>

          {/* Gouvernance */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Gouvernance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Santé synchro</span>
                  <span className={`font-medium ${confidenceScore === 100 ? "text-emerald-400" : confidenceScore !== null ? "text-amber-400" : "text-[var(--muted)]"}`}>
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
                    className={reconciliationRate != null && reconciliationRate >= 80 ? "text-emerald-400" : "text-amber-400"}
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
