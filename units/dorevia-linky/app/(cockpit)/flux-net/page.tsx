"use client";

import { Suspense } from "react";
import { Icon } from "@/components/Icon";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { TopBar } from "@/components/layout/TopBar";
import { useDashboardData } from "@/hooks/useDashboardData";
import { computeConfidenceScore } from "@/app/lib/confidence";

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function FluxNetContent() {
  const { dashboardMetrics, metricsLoading } = useDashboardData();
  const confidenceScore = computeConfidenceScore(dashboardMetrics);

  const cashKpi = dashboardMetrics?.cash;
  const details = dashboardMetrics?._details?.cash;

  const net = details?.net ?? null;
  const encaissements = details?.encaissements ?? null;
  const decaissements = details?.decaissements ?? null;

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
          <nav className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <a href="/" className="transition-colors hover:text-[var(--text)]">Pilotage</a>
            <Icon name="chevron_right" size={16} />
            <span className="font-medium text-[var(--text)]">Détail : Flux Net</span>
          </nav>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI principal */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Flux net de trésorerie
              </div>
              {metricsLoading ? (
                <div className="mt-2 h-8 w-32 animate-pulse rounded bg-[var(--border)]" />
              ) : (
                <div className="mt-2 text-3xl font-bold tabular-nums text-[var(--text)]">
                  {cashKpi?.formatted ?? "—"}
                </div>
              )}
              <div className="mt-2 flex items-center gap-3">
                <ConfidenceScore score={confidenceScore} compact />
              </div>
              {cashKpi?.status_reason && (
                <p className="mt-3 text-xs text-[var(--muted)]">{cashKpi.status_reason}</p>
              )}
            </div>

            {/* Encaissements / décaissements */}
            <div className="col-span-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="swap_horiz" size={16} className="text-[var(--muted)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Mouvements de trésorerie
                </span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                  PROXY DATA
                </span>
              </div>
              {metricsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-5 animate-pulse rounded bg-[var(--border)]" />)}
                </div>
              ) : details ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Encaissements</div>
                    <div className="text-lg font-bold tabular-nums text-emerald-400">{formatCurrency(encaissements)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Décaissements</div>
                    <div className="text-lg font-bold tabular-nums text-amber-400">{formatCurrency(decaissements)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Flux net</div>
                    <div className={`text-lg font-bold tabular-nums ${(net ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatCurrency(net)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--text-secondary)]">
                  <Icon name="info" size={16} className="mr-2 text-[var(--muted)]" />
                  Décomposition non disponible pour cette période.
                </div>
              )}
            </div>
          </div>

          {/* Lecture / qualité de la donnée */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Lecture de la donnée
            </h3>
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <p>
                Le flux net correspond à la différence entre les encaissements et les décaissements
                constatés sur la période. Il est calculé à partir des mouvements bancaires rapprochés.
              </p>
              <div className="mt-3 rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-400">
                <Icon name="info" size={14} className="mr-1 inline" />
                Donnée proxy : calculée à partir de la trésorerie rapprochée, pas d'une comptabilité analytique directe.
              </div>
              {!details && !metricsLoading && (
                <div className="mt-3 rounded-lg bg-[var(--accent-soft)]/10 px-3 py-2 text-xs text-[var(--muted)]">
                  <Icon name="info" size={14} className="mr-1 inline" />
                  Le détail encaissements / décaissements n'est pas encore disponible pour ce tenant.
                </div>
              )}
            </div>
          </div>

          {/* État vide global */}
          {!metricsLoading && !cashKpi && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
              <div>
                <Icon name="swap_horiz" size={40} className="mb-3 text-[var(--muted)]" />
                <p className="text-sm font-medium text-[var(--text-secondary)]">Flux net non disponible</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Vérifiez que la trésorerie est synchronisée avec Vault.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function FluxNetPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[var(--muted)]">Chargement Flux Net…</div>}>
      <FluxNetContent />
    </Suspense>
  );
}
