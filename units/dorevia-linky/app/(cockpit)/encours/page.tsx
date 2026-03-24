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

function EncoursContent() {
  const { dashboardMetrics, metricsLoading } = useDashboardData();
  const confidenceScore = computeConfidenceScore(dashboardMetrics);

  const encoursKpi = dashboardMetrics?.encours;
  const arByPartner = dashboardMetrics?._details?.business?.ar_by_partner;

  const totalOpen = arByPartner?.totals.open_amount ?? null;
  const totalOverdue = arByPartner?.totals.overdue_amount ?? null;
  const openInvoices = arByPartner?.totals.open_count_invoices ?? null;
  const overdueInvoices = arByPartner?.totals.overdue_count_invoices ?? null;
  const missingDueDate = arByPartner?.totals.missing_due_date_count ?? null;

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
            <span className="font-medium text-[var(--text)]">Détail : Encours clients</span>
          </nav>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI principal */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Créances clients ouvertes
              </div>
              {metricsLoading ? (
                <div className="mt-2 h-8 w-32 animate-pulse rounded bg-[var(--border)]" />
              ) : (
                <div className={`mt-2 text-3xl font-bold tabular-nums ${(encoursKpi?.value as number ?? 0) > 0 ? "text-amber-400" : "text-[var(--text)]"}`}>
                  {encoursKpi?.formatted ?? "—"}
                </div>
              )}
              <div className="mt-2 flex items-center gap-3">
                <ConfidenceScore score={confidenceScore} compact />
              </div>
              {encoursKpi?.status_reason && (
                <p className="mt-3 text-xs text-[var(--muted)]">{encoursKpi.status_reason}</p>
              )}
            </div>

            {/* Synthèse AR */}
            <div className="col-span-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="pending_actions" size={16} className="text-[var(--muted)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Synthèse des créances
                </span>
              </div>
              {metricsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-5 animate-pulse rounded bg-[var(--border)]" />)}
                </div>
              ) : arByPartner ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Ouvert</div>
                    <div className="text-lg font-bold tabular-nums text-[var(--text)]">{formatCurrency(totalOpen)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Échu</div>
                    <div className={`text-lg font-bold tabular-nums ${(totalOverdue ?? 0) > 0 ? "text-amber-400" : "text-[var(--text)]"}`}>
                      {formatCurrency(totalOverdue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Factures</div>
                    <div className="text-lg font-bold tabular-nums text-[var(--text)]">{openInvoices ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Échues</div>
                    <div className={`text-lg font-bold tabular-nums ${(overdueInvoices ?? 0) > 0 ? "text-amber-400" : "text-[var(--text)]"}`}>
                      {overdueInvoices ?? "—"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--text-secondary)]">
                  <Icon name="info" size={16} className="mr-2 text-[var(--muted)]" />
                  Détail des créances non disponible pour cette période.
                </div>
              )}
              {(missingDueDate ?? 0) > 0 && (
                <div className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                  <Icon name="warning" size={14} className="mr-1 inline" />
                  {missingDueDate} facture{(missingDueDate ?? 0) > 1 ? "s" : ""} sans date d'échéance renseignée.
                </div>
              )}
            </div>
          </div>

          {/* Exposition par client */}
          {arByPartner && arByPartner.partners.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Exposition par client
                </h3>
                <span className="text-xs text-[var(--muted)]">
                  {arByPartner.partners.length} client{arByPartner.partners.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="border-b border-[var(--border)] pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Client</th>
                      <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Ouvert</th>
                      <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Échu</th>
                      <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Part</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arByPartner.partners.map((p, i) => (
                      <tr key={i} className="border-b border-[var(--border)]/50">
                        <td className="py-2 pr-4 text-[var(--text)]">{p.partner_name ?? p.partner_id}</td>
                        <td className="whitespace-nowrap py-2 text-right tabular-nums text-[var(--text)]">{formatCurrency(p.open_amount)}</td>
                        <td className={`whitespace-nowrap py-2 text-right tabular-nums ${p.overdue_amount > 0 ? "text-amber-400" : "text-[var(--text-secondary)]"}`}>
                          {p.overdue_amount > 0 ? formatCurrency(p.overdue_amount) : "—"}
                        </td>
                        <td className="py-2 text-right tabular-nums text-[var(--muted)]">{Math.round(p.share_percent)} %</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[var(--accent-soft)]/10">
                      <td className="py-2 text-xs font-bold text-[var(--text-secondary)]">Total</td>
                      <td className="whitespace-nowrap py-2 text-right text-xs font-bold tabular-nums text-[var(--text)]">{formatCurrency(totalOpen)}</td>
                      <td className={`whitespace-nowrap py-2 text-right text-xs font-bold tabular-nums ${(totalOverdue ?? 0) > 0 ? "text-amber-400" : "text-[var(--text-secondary)]"}`}>
                        {(totalOverdue ?? 0) > 0 ? formatCurrency(totalOverdue) : "—"}
                      </td>
                      <td className="py-2 text-right text-xs text-[var(--muted)]">100 %</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {arByPartner.meta?.warnings && arByPartner.meta.warnings.length > 0 && (
                <div className="mt-3 space-y-1">
                  {arByPartner.meta.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-400">
                      <Icon name="warning" size={12} className="mr-1 inline" />{w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* État vide global */}
          {!metricsLoading && !encoursKpi && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
              <div>
                <Icon name="pending_actions" size={40} className="mb-3 text-[var(--muted)]" />
                <p className="text-sm font-medium text-[var(--text-secondary)]">Encours clients non disponibles</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Vérifiez que la facturation AR est synchronisée avec Vault.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function EncoursPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[var(--muted)]">Chargement Encours…</div>}>
      <EncoursContent />
    </Suspense>
  );
}
