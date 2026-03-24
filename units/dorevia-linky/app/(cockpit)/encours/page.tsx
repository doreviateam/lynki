"use client";

import { Suspense, useMemo } from "react";
import { Icon } from "@/components/Icon";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { TopBar } from "@/components/layout/TopBar";
import { useDashboardData } from "@/hooks/useDashboardData";
import { computeConfidenceScore } from "@/app/lib/confidence";
import type { ArByPartnerDetail } from "@/app/api/dashboard-metrics/route";
import {
  CockpitEncoursEmptyNotice,
  CockpitEncoursLoadingSkeleton,
  CockpitEncoursPartialBanner,
  CockpitEncoursUnavailable,
} from "@/components/cockpit-detail/cockpitEncoursStates";

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
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

function hasRetardColumns(ar: ArByPartnerDetail | null | undefined): boolean {
  if (!ar?.partners?.length) return false;
  return ar.partners.some(
    (p) => (p.overdue_max_days != null && p.overdue_max_days > 0) || (p.overdue_avg_days != null && p.overdue_avg_days > 0)
  );
}

function formatRetardDays(avg: number | undefined, max: number | undefined): string {
  if (max != null && max > 0) {
    if (avg != null && avg > 0 && Math.round(avg) !== Math.round(max)) return `max ${Math.round(max)} j · moy ${Math.round(avg)} j`;
    return `${Math.round(max)} j`;
  }
  if (avg != null && avg > 0) return `moy ${Math.round(avg)} j`;
  return "—";
}

function EncoursContent() {
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
  const encoursKpi = dashboardMetrics?.encours;
  const arByPartner = dashboardMetrics?._details?.business?.ar_by_partner;

  const companyLabel = useMemo(
    () => companyLabelFromHook(companies, effectiveCompanyId, companiesLoading),
    [companies, effectiveCompanyId, companiesLoading]
  );
  const periodLabel = period.from && period.to ? formatPeriodFr(period.from, period.to) : "—";
  const showRetardCol = hasRetardColumns(arByPartner);

  const totalOpen = arByPartner?.totals.open_amount ?? null;
  const totalOverdue = arByPartner?.totals.overdue_amount ?? null;
  const openInvoices = arByPartner?.totals.open_count_invoices ?? null;
  const overdueInvoices = arByPartner?.totals.overdue_count_invoices ?? null;
  const missingDueDate = arByPartner?.totals.missing_due_date_count ?? null;
  const warnings = arByPartner?.meta?.warnings ?? [];

  const hasSlice = Boolean(arByPartner);
  const hasPartnerRows = Boolean(arByPartner && arByPartner.partners.length > 0);
  const encoursValuePresent = encoursKpi?.value != null;
  const showPartialDetail = !metricsLoading && !metricsError && encoursValuePresent && !hasSlice;
  const showGlobalEmpty =
    !metricsLoading && !metricsError && dashboardMetrics != null && !encoursValuePresent && !hasSlice;

  const sourceLine =
    primarySource === "erp"
      ? "Flux : agrégation cockpit (ERP). Même endpoint que la synthèse (`/api/dashboard-metrics`). Détail par client uniquement si renvoyé par l’agrégat."
      : "Flux : agrégation cockpit (Vault). Même endpoint que la synthèse (`/api/dashboard-metrics`). Détail par client uniquement si renvoyé par l’agrégat.";

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
            <a href="/" className="transition-colors hover:text-[var(--text)]">
              Pilotage
            </a>
            <Icon name="chevron_right" size={16} />
            <span className="font-medium text-[var(--text)]">Encours clients</span>
          </nav>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--text)]">Encours clients</h1>
          <p className="mt-1 max-w-3xl text-xs text-[var(--muted)]">{sourceLine}</p>
        </header>

        <div className="p-6 space-y-6">
          {/* Périmètre */}
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
            <CockpitEncoursUnavailable
              title="Indicateurs encours indisponibles"
              onRetry={handleRefreshMetrics}
              attemptHint={attemptCount > 0 ? `Tentatives de chargement : ${attemptCount}` : undefined}
            />
          ) : null}

          {metricsLoading && !metricsError ? (
            <div className="space-y-4">
              <CockpitEncoursLoadingSkeleton label="Encours — indicateurs" rows={3} />
              <CockpitEncoursLoadingSkeleton label="Encours — segmentation" rows={2} />
            </div>
          ) : null}

          {!metricsLoading && !metricsError ? (
            <>
              {showPartialDetail ? (
                <CockpitEncoursPartialBanner>
                  Vue partielle : le solde d’encours est affiché, mais la répartition ouvert / échu et le détail par client ne sont pas fournis par l’agrégat pour ce périmètre.
                </CockpitEncoursPartialBanner>
              ) : null}

              {/* KPI + segmentation ouvert / échu */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Créances clients ouvertes (KPI)
                  </div>
                  <div
                    className={`mt-2 text-3xl font-bold tabular-nums ${(encoursKpi?.value as number ?? 0) > 0 ? "text-amber-400" : "text-[var(--text)]"}`}
                  >
                    {encoursKpi?.formatted ?? "—"}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <ConfidenceScore score={confidenceScore} compact />
                  </div>
                  {encoursKpi?.status_reason ? (
                    <p className="mt-3 text-xs text-[var(--muted)]">{encoursKpi.status_reason}</p>
                  ) : null}
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 lg:col-span-2">
                  <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Segmentation (montants facturés non soldés)
                  </div>
                  {hasSlice ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                        <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Ouvert</div>
                        <div className="mt-1 text-xl font-bold tabular-nums text-[var(--text)]">{formatCurrency(totalOpen)}</div>
                        <div className="mt-2 text-xs text-[var(--text-secondary)]">
                          Factures ouvertes : <span className="tabular-nums text-[var(--text)]">{openInvoices ?? "—"}</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                        <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Échu</div>
                        <div
                          className={`mt-1 text-xl font-bold tabular-nums ${(totalOverdue ?? 0) > 0 ? "text-amber-400" : "text-[var(--text)]"}`}
                        >
                          {formatCurrency(totalOverdue)}
                        </div>
                        <div className="mt-2 text-xs text-[var(--text-secondary)]">
                          Factures échues :{" "}
                          <span className="tabular-nums text-[var(--text)]">{overdueInvoices ?? "—"}</span>
                        </div>
                      </div>
                    </div>
                  ) : encoursValuePresent ? (
                    <CockpitEncoursEmptyNotice>
                      Pas de bloc ouvert / échu : l’agrégat ne fournit pas `ar_by_partner` sur ce périmètre.
                    </CockpitEncoursEmptyNotice>
                  ) : (
                    <CockpitEncoursEmptyNotice>Aucune donnée d’encours pour afficher la segmentation.</CockpitEncoursEmptyNotice>
                  )}
                </div>
              </div>

              {/* Alertes & qualité de périmètre */}
              {(missingDueDate ?? 0) > 0 || warnings.length > 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    <Icon name="warning" size={14} className="text-amber-400" />
                    Alertes et limites de la source
                  </div>
                  <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                    {(missingDueDate ?? 0) > 0 ? (
                      <li className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-400">
                        {missingDueDate} facture{(missingDueDate ?? 0) > 1 ? "s" : ""} sans date d’échéance renseignée dans la source
                        (comptabilisées dans les totaux, mais moins lisibles pour le pilotage des échéances).
                      </li>
                    ) : null}
                    {warnings.map((w, i) => (
                      <li key={i} className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-400">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Exposition par client */}
              {hasPartnerRows ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Exposition par client
                    </h2>
                    <span className="text-xs text-[var(--muted)]">
                      {arByPartner!.partners.length} client{arByPartner!.partners.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-[var(--muted)]">
                    Les dates d’échéance par facture ne sont pas exposées dans ce flux. Lorsque la source les fournit, un indicateur de
                    retard (jours) peut apparaître pour les lignes concernées.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0 text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="border-b border-[var(--border)] pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Client
                          </th>
                          <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Ouvert
                          </th>
                          <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Échu
                          </th>
                          {showRetardCol ? (
                            <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                              Retard
                            </th>
                          ) : null}
                          <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Part
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {arByPartner!.partners.map((p, i) => (
                          <tr key={i} className="border-b border-[var(--border)]/50">
                            <td className="py-2 pr-4 text-[var(--text)]">{p.partner_name ?? p.partner_id}</td>
                            <td className="whitespace-nowrap py-2 text-right tabular-nums text-[var(--text)]">
                              {formatCurrency(p.open_amount)}
                            </td>
                            <td
                              className={`whitespace-nowrap py-2 text-right tabular-nums ${p.overdue_amount > 0 ? "text-amber-400" : "text-[var(--text-secondary)]"}`}
                            >
                              {p.overdue_amount > 0 ? formatCurrency(p.overdue_amount) : "—"}
                            </td>
                            {showRetardCol ? (
                              <td className="whitespace-nowrap py-2 text-right tabular-nums text-[var(--muted)]">
                                {formatRetardDays(p.overdue_avg_days, p.overdue_max_days)}
                              </td>
                            ) : null}
                            <td className="py-2 text-right tabular-nums text-[var(--muted)]">{Math.round(p.share_percent)} %</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[var(--accent-soft)]/10">
                          <td className="py-2 text-xs font-bold text-[var(--text-secondary)]">Total</td>
                          <td className="whitespace-nowrap py-2 text-right text-xs font-bold tabular-nums text-[var(--text)]">
                            {formatCurrency(totalOpen)}
                          </td>
                          <td
                            className={`whitespace-nowrap py-2 text-right text-xs font-bold tabular-nums ${(totalOverdue ?? 0) > 0 ? "text-amber-400" : "text-[var(--text-secondary)]"}`}
                          >
                            {(totalOverdue ?? 0) > 0 ? formatCurrency(totalOverdue) : "—"}
                          </td>
                          {showRetardCol ? (
                            <td className="whitespace-nowrap py-2 text-right text-xs tabular-nums text-[var(--muted)]">
                              {arByPartner!.totals.overdue_max_days != null && arByPartner!.totals.overdue_max_days > 0
                                ? `max ${Math.round(arByPartner!.totals.overdue_max_days!)} j`
                                : "—"}
                            </td>
                          ) : null}
                          <td className="py-2 text-right text-xs text-[var(--muted)]">100 %</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : hasSlice && !hasPartnerRows ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
                  <Icon name="pending_actions" size={36} className="mx-auto mb-2 text-[var(--muted)]" />
                  <p className="text-sm text-[var(--text-secondary)]">Aucun client listé dans l’agrégat pour ce périmètre.</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Les totaux ouvert / échu peuvent toutefois être non nuls côté source.</p>
                </div>
              ) : null}

              {showGlobalEmpty ? (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
                  <div>
                    <Icon name="pending_actions" size={40} className="mb-3 text-[var(--muted)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Encours clients non disponibles</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Aucun indicateur exploitable sur ce périmètre. Vérifiez la synchronisation facturation / Vault.
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

export default function EncoursPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center text-[var(--muted)]">Chargement Encours…</div>}
    >
      <EncoursContent />
    </Suspense>
  );
}
