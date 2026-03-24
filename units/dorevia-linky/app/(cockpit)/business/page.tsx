"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import type { ArByPartnerDetail } from "@/app/api/dashboard-metrics/route";
import { formatPaymentDelayDays } from "@/app/lib/format";
import { BusinessPageEvolution } from "./BusinessPageEvolution";
import { Icon } from "@/components/Icon";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { TopBar } from "@/components/layout/TopBar";
import { useDashboardData } from "@/hooks/useDashboardData";
import { computeConfidenceScore } from "@/app/lib/confidence";
import { navHrefWithTenant } from "@/components/layout/navTenantHref";
import {
  CockpitBusinessEmptyNotice,
  CockpitBusinessLoadingSkeleton,
  CockpitBusinessPartialBanner,
  CockpitBusinessUnavailable,
} from "@/components/cockpit-detail/cockpitBusinessStates";

const USE_METRIC_ENGINE = process.env.NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE === "1";

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

function BusinessContent() {
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
  const businessKpi = dashboardMetrics?.business;
  const details = dashboardMetrics?._details?.business;
  const salesByPartner = details?.sales_by_partner;
  const arByPartner = details?.ar_by_partner;
  const businessCurrency = details?.currency ?? "EUR";

  const companyLabel = useMemo(
    () => companyLabelFromHook(companies, effectiveCompanyId, companiesLoading),
    [companies, effectiveCompanyId, companiesLoading]
  );
  const periodLabel = period.from && period.to ? formatPeriodFr(period.from, period.to) : "—";
  const pilotageHref = navHrefWithTenant("/", scopeTenantId);
  const encoursHref = navHrefWithTenant("/encours", scopeTenantId);

  const hasDetails = Boolean(details);
  const businessValuePresent = businessKpi?.value != null;
  const hasTopClients = Boolean(salesByPartner && salesByPartner.items.length > 0);
  const hasArSlice = Boolean(arByPartner);

  const showInstrumentPartial =
    !metricsLoading && !metricsError && USE_METRIC_ENGINE && businessValuePresent && !hasDetails;
  const showPartialNoBreakdown =
    !metricsLoading && !metricsError && !USE_METRIC_ENGINE && businessValuePresent && !hasDetails;
  const showGlobalEmpty =
    !metricsLoading &&
    !metricsError &&
    dashboardMetrics != null &&
    !businessValuePresent &&
    !hasDetails &&
    !hasTopClients &&
    !hasArSlice;

  const sourceLine = `Lecture d’activité (facturation / achats) sur le périmètre choisi — source ${
    primarySource === "erp" ? "ERP" : "Vault"
  }, même agrégation que le cockpit (/api/dashboard-metrics ou instruments si activé). Ce n’est pas un compte de résultat, ni une marge métier ; les montants viennent des flux scellés disponibles.`;

  const arByPartnerName = useMemo(() => {
    const m = new Map<string, ArByPartnerDetail["partners"][number]>();
    for (const p of arByPartner?.partners ?? []) {
      const key = (p.partner_name ?? String(p.partner_id ?? "")).trim().toLowerCase();
      if (key) m.set(key, p);
    }
    return m;
  }, [arByPartner?.partners]);

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
            <span className="font-medium text-[var(--text)]">Business</span>
          </nav>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--text)]">Activité commerciale</h1>
          <p className="mt-1 max-w-3xl text-xs text-[var(--muted)]">{sourceLine}</p>
        </header>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-xs text-[var(--text-secondary)]">
            <span>
              <span className="font-semibold text-[var(--text)]">Période :</span> {periodLabel}
            </span>
            <span className="max-sm:hidden text-[var(--border)]">·</span>
            <span>
              <span className="font-semibold text-[var(--text)]">Société :</span> {companyLabel}
            </span>
            <span className="max-sm:hidden text-[var(--border)]">·</span>
            <span>
              <span className="font-semibold text-[var(--text)]">Tenant :</span> {scopeTenantId}
            </span>
          </div>

          {metricsError ? (
            <CockpitBusinessUnavailable
              title="Indicateurs Business indisponibles"
              onRetry={handleRefreshMetrics}
              attemptHint={attemptCount > 0 ? `Tentatives de chargement : ${attemptCount}` : undefined}
            />
          ) : null}

          {metricsLoading && !metricsError ? (
            <div className="space-y-4">
              <CockpitBusinessLoadingSkeleton label="Business — CA facturé" rows={3} />
              <CockpitBusinessLoadingSkeleton label="Business — flux commercial" rows={2} />
            </div>
          ) : null}

          {!metricsLoading && !metricsError ? (
            <>
              {showInstrumentPartial ? (
                <CockpitBusinessPartialBanner>
                  Mode <strong>instruments</strong> (<code className="text-[10px]">NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE</code>) : le
                  détail ventes / achats et les listes partenaires (<code className="text-[10px]">_details.business</code>) ne sont pas
                  fournis dans ce flux. Seul l’indicateur agrégé affiché ci-dessous est disponible ici.
                </CockpitBusinessPartialBanner>
              ) : null}
              {showPartialNoBreakdown ? (
                <CockpitBusinessPartialBanner>
                  Vue partielle : un indicateur de CA est affiché sur la tuile, mais la décomposition ventes / achats HT n’est pas
                  présente dans la réponse pour ce périmètre.
                </CockpitBusinessPartialBanner>
              ) : null}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">CA facturé</div>
                  <div className="mt-2 text-3xl font-bold tabular-nums text-[var(--text)]">{businessKpi?.formatted ?? "—"}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <ConfidenceScore score={confidenceScore} compact />
                  </div>
                  {businessKpi?.status_reason ? (
                    <p className="mt-3 text-xs text-[var(--muted)]">{businessKpi.status_reason}</p>
                  ) : null}
                  <p className="mt-3 text-[10px] leading-relaxed text-[var(--muted)]">
                    Indicateur cockpit (facturation retenue par l’agrégateur) — pas un chiffre d’affaires comptable exhaustif hors
                    périmètre servi.
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 md:col-span-2">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon name="receipt" size={16} className="text-[var(--muted)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Ventes et achats HT
                    </span>
                  </div>
                  {hasDetails ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Ventes HT</div>
                        <div className="text-lg font-bold tabular-nums text-emerald-400">
                          {formatCurrency(details!.ventes, businessCurrency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Achats HT</div>
                        <div className="text-lg font-bold tabular-nums text-amber-400">
                          {formatCurrency(details!.achats, businessCurrency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Solde ventes − achats</div>
                        <div
                          className={`text-lg font-bold tabular-nums ${(details!.net ?? 0) >= 0 ? "text-[var(--text)]" : "text-red-400"}`}
                        >
                          {formatCurrency(details!.net, businessCurrency)}
                        </div>
                        <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
                          Différence sur masses HT agrégées — <strong>pas</strong> un résultat d’exploitation.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <CockpitBusinessEmptyNotice>
                      Décomposition non disponible dans ce flux — voir l’encadré ci-dessus si besoin.
                    </CockpitBusinessEmptyNotice>
                  )}
                </div>
              </div>

              {!metricsLoading && !metricsError && period.from && period.to ? (
                <BusinessPageEvolution
                  tenantId={scopeTenantId}
                  companyId={effectiveCompanyId}
                  periodFrom={period.from}
                  periodTo={period.to}
                />
              ) : null}

              {hasTopClients ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Concentration — CA par client (délais si disponibles)
                    </h2>
                    <span className="text-xs text-[var(--muted)]">
                      {salesByPartner!.partners_count} client{salesByPartner!.partners_count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0 text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="border-b border-[var(--border)] pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Client
                          </th>
                          <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            CA HT
                          </th>
                          <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Factures
                          </th>
                          <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            % du total
                          </th>
                          <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Délai moy. paiement
                          </th>
                          <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Retard max (j)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesByPartner!.items.slice(0, 8).map((item, i) => {
                          const ar = arByPartnerName.get(item.partner_name.trim().toLowerCase());
                          return (
                          <tr key={i} className="border-b border-[var(--border)]/50">
                            <td className="py-2 pr-4 text-[var(--text)]">{item.partner_name}</td>
                            <td className="whitespace-nowrap py-2 text-right tabular-nums text-[var(--text)]">
                              {formatCurrency(item.total_ht, businessCurrency)}
                            </td>
                            <td className="py-2 text-right tabular-nums text-[var(--text-secondary)]">{item.invoices_count}</td>
                            <td className="py-2 text-right tabular-nums text-[var(--muted)]">{Math.round(item.pct_of_total)} %</td>
                            <td className="py-2 text-right tabular-nums text-[var(--text-secondary)]">
                              {formatPaymentDelayDays(ar?.payment_delay_avg_days ?? null)}
                            </td>
                            <td className="py-2 text-right tabular-nums text-[var(--text-secondary)]">
                              {ar != null && (ar.overdue_max_days ?? 0) > 0 ? `${Math.round(ar.overdue_max_days ?? 0)} j` : "—"}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {salesByPartner!.pareto_80_partners.length > 0 ? (
                    <p className="mt-3 text-xs text-[var(--muted)]">
                      ~80 % du CA sur {salesByPartner!.pareto_80_partners.length} client
                      {salesByPartner!.pareto_80_partners.length > 1 ? "s" : ""} (Pareto indicatif sur la période).
                    </p>
                  ) : null}
                </div>
              ) : null}

              {hasArSlice ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Aperçu créances clients (même agrégat cockpit)
                    </h2>
                    {arByPartner!.totals.overdue_amount > 0 ? (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                        <Icon name="warning" size={12} />
                        {formatCurrency(arByPartner!.totals.overdue_amount, businessCurrency)} échu
                      </span>
                    ) : null}
                  </div>
                  <p className="mb-4 text-xs leading-relaxed text-[var(--text-secondary)]">
                    Totaux et extraits ci-dessous reprennent les créances ouvertes du même pipeline que le cockpit — pour la lecture
                    prioritaire (échus, ancienneté, segmentation), utiliser{" "}
                    <Link href={encoursHref} className="font-medium text-[var(--accent)] underline-offset-2 hover:underline">
                      Encours clients
                    </Link>
                    .
                  </p>
                  <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Ouvert</div>
                      <div className="text-lg font-bold tabular-nums text-[var(--text)]">
                        {formatCurrency(arByPartner!.totals.open_amount, businessCurrency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Échu</div>
                      <div
                        className={`text-lg font-bold tabular-nums ${arByPartner!.totals.overdue_amount > 0 ? "text-amber-400" : "text-[var(--text)]"}`}
                      >
                        {formatCurrency(arByPartner!.totals.overdue_amount, businessCurrency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Factures</div>
                      <div className="text-lg font-bold tabular-nums text-[var(--text)]">{arByPartner!.totals.open_count_invoices}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Factures échues</div>
                      <div
                        className={`text-lg font-bold tabular-nums ${arByPartner!.totals.overdue_count_invoices > 0 ? "text-amber-400" : "text-[var(--text)]"}`}
                      >
                        {arByPartner!.totals.overdue_count_invoices}
                      </div>
                    </div>
                  </div>
                  {(arByPartner!.totals.overdue_avg_days != null && arByPartner!.totals.overdue_avg_days! > 0) ||
                  (arByPartner!.totals.overdue_max_days != null && arByPartner!.totals.overdue_max_days! > 0) ? (
                    <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--text-secondary)]">
                      {arByPartner!.totals.overdue_avg_days != null && arByPartner!.totals.overdue_avg_days! > 0 ? (
                        <span>
                          Retard moyen pondéré (échus) :{" "}
                          <strong className="tabular-nums text-[var(--text)]">
                            {Math.round(arByPartner!.totals.overdue_avg_days!)} j
                          </strong>
                        </span>
                      ) : null}
                      {arByPartner!.totals.overdue_max_days != null && arByPartner!.totals.overdue_max_days! > 0 ? (
                        <span>
                          Pire retard :{" "}
                          <strong className="tabular-nums text-amber-400">{arByPartner!.totals.overdue_max_days} j</strong>
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="border-b border-[var(--border)] pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Client
                          </th>
                          <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Encours
                          </th>
                          <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Échu
                          </th>
                          <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Délai moy. paiement
                          </th>
                          <th className="border-b border-[var(--border)] pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            Retard max (j)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {arByPartner!.partners.slice(0, 12).map((p, i) => (
                          <tr key={i} className="border-b border-[var(--border)]/50">
                            <td className="py-2 pr-3 text-[var(--text)]">{p.partner_name ?? p.partner_id}</td>
                            <td className="whitespace-nowrap py-2 text-right tabular-nums text-[var(--text)]">
                              {formatCurrency(p.open_amount, businessCurrency)}
                            </td>
                            <td className="whitespace-nowrap py-2 text-right tabular-nums text-amber-400">
                              {p.overdue_amount > 0 ? formatCurrency(p.overdue_amount, businessCurrency) : "—"}
                            </td>
                            <td className="py-2 text-right tabular-nums text-[var(--text-secondary)]">
                              {formatPaymentDelayDays(p.payment_delay_avg_days ?? null)}
                            </td>
                            <td className="py-2 text-right tabular-nums text-[var(--text-secondary)]">
                              {(p.overdue_max_days ?? 0) > 0 || (p.overdue_avg_days ?? 0) > 0
                                ? `${Math.round(p.overdue_max_days ?? p.overdue_avg_days ?? 0)} j`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {arByPartner!.partners.length > 12 ? (
                    <p className="mt-2 text-[10px] text-[var(--muted)]">
                      Affichage des 12 premiers partenaires par encours — détail complet sur{" "}
                      <Link href={encoursHref} className="font-medium text-[var(--accent)] underline-offset-2 hover:underline">
                        Encours clients
                      </Link>
                      .
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Lecture et limites</h2>
                <ul className="list-inside list-disc space-y-2 text-xs text-[var(--text-secondary)]">
                  <li>
                    Cette page résume l’<strong>activité facturée</strong> et, lorsque les données sont renvoyées, la{" "}
                    <strong>concentration client</strong> et un <strong>aperçu</strong> des créances sur le périmètre affiché en tête.
                  </li>
                  <li>
                    Ce n’est <strong>pas</strong> un compte de résultat, ni une promesse de marge : le solde « ventes − achats » est un
                    écart de masses HT agrégées, pas un EBE ou un résultat net.
                  </li>
                  <li>
                    Les tableaux partenaires et créances ne s’affichent que si l’agrégateur les fournit pour la période ; sinon la section
                    est omise plutôt qu’inventée.
                  </li>
                </ul>
              </div>

              {showGlobalEmpty ? (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-12 text-center">
                  <div>
                    <Icon name="storefront" size={40} className="mb-3 text-[var(--muted)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Activité commerciale non disponible</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Aucun indicateur exploitable sur ce périmètre. Vérifiez la synchronisation facturation avec la source.
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

export default function BusinessPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center text-[var(--muted)]">Chargement Business…</div>}
    >
      <BusinessContent />
    </Suspense>
  );
}
