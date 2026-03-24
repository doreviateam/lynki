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

function BusinessContent() {
  const { dashboardMetrics, metricsLoading } = useDashboardData();
  const confidenceScore = computeConfidenceScore(dashboardMetrics);

  const businessKpi = dashboardMetrics?.business;
  const details = dashboardMetrics?._details?.business;
  const salesByPartner = details?.sales_by_partner;
  const arByPartner = details?.ar_by_partner;

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
            <span className="font-medium text-[var(--text)]">Détail : Business</span>
          </nav>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI principal */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                CA facturé
              </div>
              {metricsLoading ? (
                <div className="mt-2 h-8 w-32 animate-pulse rounded bg-[var(--border)]" />
              ) : (
                <div className="mt-2 text-3xl font-bold tabular-nums text-[var(--text)]">
                  {businessKpi?.formatted ?? "—"}
                </div>
              )}
              <div className="mt-2 flex items-center gap-3">
                <ConfidenceScore score={confidenceScore} compact />
              </div>
              {businessKpi?.status_reason && (
                <p className="mt-3 text-xs text-[var(--muted)]">{businessKpi.status_reason}</p>
              )}
            </div>

            {/* Décomposition ventes / achats */}
            <div className="col-span-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="receipt" size={16} className="text-[var(--muted)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Flux commerciaux
                </span>
              </div>
              {metricsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-5 animate-pulse rounded bg-[var(--border)]" />)}
                </div>
              ) : details ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Ventes HT</div>
                    <div className="text-lg font-bold tabular-nums text-emerald-400">{formatCurrency(details.ventes)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Achats HT</div>
                    <div className="text-lg font-bold tabular-nums text-amber-400">{formatCurrency(details.achats)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Flux net</div>
                    <div className={`text-lg font-bold tabular-nums ${(details.net ?? 0) >= 0 ? "text-[var(--text)]" : "text-red-400"}`}>
                      {formatCurrency(details.net)}
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

          {/* Top clients */}
          {salesByPartner && salesByPartner.items.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Top clients — CA facturé
                </h3>
                <span className="text-xs text-[var(--muted)]">
                  {salesByPartner.partners_count} client{salesByPartner.partners_count > 1 ? "s" : ""}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="border-b border-[var(--border)] pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Client</th>
                      <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">CA HT</th>
                      <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Factures</th>
                      <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">% du total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesByPartner.items.slice(0, 8).map((item, i) => (
                      <tr key={i} className="border-b border-[var(--border)]/50">
                        <td className="py-2 pr-4 text-[var(--text)]">{item.partner_name}</td>
                        <td className="whitespace-nowrap py-2 text-right tabular-nums text-[var(--text)]">{formatCurrency(item.total_ht)}</td>
                        <td className="py-2 text-right tabular-nums text-[var(--text-secondary)]">{item.invoices_count}</td>
                        <td className="py-2 text-right tabular-nums text-[var(--muted)]">{Math.round(item.pct_of_total)} %</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {salesByPartner.pareto_80_partners.length > 0 && (
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Pareto 80 % : {salesByPartner.pareto_80_partners.length} client{salesByPartner.pareto_80_partners.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          {/* Créances clients (AR) */}
          {arByPartner && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Créances clients ouvertes
                </h3>
                {arByPartner.totals.overdue_amount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                    <Icon name="warning" size={12} />
                    {formatCurrency(arByPartner.totals.overdue_amount)} échu
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Ouvert</div>
                  <div className="text-lg font-bold tabular-nums text-[var(--text)]">{formatCurrency(arByPartner.totals.open_amount)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Échu</div>
                  <div className={`text-lg font-bold tabular-nums ${arByPartner.totals.overdue_amount > 0 ? "text-amber-400" : "text-[var(--text)]"}`}>
                    {formatCurrency(arByPartner.totals.overdue_amount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Factures</div>
                  <div className="text-lg font-bold tabular-nums text-[var(--text)]">{arByPartner.totals.open_count_invoices}</div>
                </div>
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Factures échues</div>
                  <div className={`text-lg font-bold tabular-nums ${arByPartner.totals.overdue_count_invoices > 0 ? "text-amber-400" : "text-[var(--text)]"}`}>
                    {arByPartner.totals.overdue_count_invoices}
                  </div>
                </div>
              </div>
              {arByPartner.partners.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between border-t border-[var(--border)]/50 py-2 text-sm">
                  <span className="text-[var(--text-secondary)]">{p.partner_name ?? p.partner_id}</span>
                  <div className="flex items-center gap-4 text-right">
                    <span className="tabular-nums text-[var(--text)]">{formatCurrency(p.open_amount)}</span>
                    {p.overdue_amount > 0 && (
                      <span className="tabular-nums text-amber-400 text-xs">{formatCurrency(p.overdue_amount)} échu</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* État vide global */}
          {!metricsLoading && !businessKpi && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
              <div>
                <Icon name="storefront" size={40} className="mb-3 text-[var(--muted)]" />
                <p className="text-sm font-medium text-[var(--text-secondary)]">Données Business non disponibles</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Vérifiez que la facturation est synchronisée avec Vault.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function BusinessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[var(--muted)]">Chargement Business…</div>}>
      <BusinessContent />
    </Suspense>
  );
}
