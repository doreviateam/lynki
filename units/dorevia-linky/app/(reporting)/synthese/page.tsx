"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { TopBar } from "@/components/layout/TopBar";
import { navHrefWithTenant } from "@/components/layout/navTenantHref";
import { AccountingSummaryView } from "@/components/AccountingSummaryView";
import { TenantChoiceView } from "@/components/TenantChoiceView";
import { useDashboardData } from "@/hooks/useDashboardData";
import { computeConfidenceScore } from "@/app/lib/confidence";
import { confidenceLabelFromScore } from "@/app/lib/cockpit/ui-state-labels";

function formatPeriodLine(from: string | undefined, to: string | undefined): string | null {
  if (!from || !to) return null;
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return `${a.toLocaleDateString("fr-FR")} – ${b.toLocaleDateString("fr-FR")}`;
}

function SyntheseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantParam = searchParams.get("tenant");
  const {
    scopeTenantId,
    effectiveCompanyId,
    period,
    dashboardMetrics,
    showTenantChoice,
    onSetTenantNavigate,
  } = useDashboardData();

  const tenantId = tenantParam ?? scopeTenantId;
  const confidenceScore = computeConfidenceScore(dashboardMetrics);
  const pilotageHref = navHrefWithTenant("/", tenantId);
  const periodLine = useMemo(() => formatPeriodLine(period.from, period.to), [period.from, period.to]);

  if (showTenantChoice) {
    return <TenantChoiceView onSelect={(id) => onSetTenantNavigate(id)} />;
  }

  const scoreRounded = confidenceScore != null ? Math.round(confidenceScore) : null;

  return (
    <>
      <TopBar
        confidenceScore={confidenceScore}
        confidenceLabel={confidenceLabelFromScore(confidenceScore)}
        title="Lynki Desktop Cockpit"
        subtitle="Synthèse comptable · Reporting"
      />

      <main className="flex-1 overflow-y-auto">
        {/* En-tête type `synth_se_desktop_esther_canon_v5` — sans nom persona en UI */}
        <div className="border-b border-[var(--border)] bg-[var(--bg)] px-6 py-8 md:px-8">
          <Link
            href={pilotageHref}
            className="group mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          >
            <Icon name="arrow_back" size={18} className="transition-transform group-hover:-translate-x-1" />
            Pilotage
          </Link>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-[var(--text)]">Synthèse comptable</h1>
              <p className="max-w-2xl text-sm font-medium leading-relaxed text-[var(--muted)]">
                Reporting consolidé · lecture de la performance et de la structure
                {periodLine ? ` · ${periodLine}` : ""}
              </p>
            </div>

            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-stretch">
              <div className="flex flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Audit Ready
                  </span>
                  {confidenceScore === 100 ? (
                    <div className="mt-1 flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                      <Icon name="verified" size={20} filled />
                      <span>CONFORME</span>
                    </div>
                  ) : confidenceScore !== null ? (
                    <div className="mt-1 flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                      <Icon name="warning" size={20} filled />
                      <span>PARTIEL</span>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-1.5 font-bold text-[var(--muted)]">
                      <Icon name="sync" size={20} />
                      <span>EN ATTENTE</span>
                    </div>
                  )}
                </div>
                <div className="hidden h-10 w-px bg-[var(--border)] sm:block" aria-hidden />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Fiabilité cockpit
                  </span>
                  <div className="mt-1 font-black tabular-nums text-[var(--text)]">
                    <span className="text-xl">{scoreRounded ?? "—"}</span>
                    {scoreRounded != null ? (
                      <span className="text-sm font-medium text-[var(--muted)]">/100</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center border-t border-[var(--border)] pt-3 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
                  <ConfidenceScore score={confidenceScore} compact />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 text-xs text-[var(--muted)] sm:flex-col sm:items-end sm:justify-center">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  Données temps réel
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="synthese-scope px-6 py-8 md:px-8 md:pb-32">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20 text-sm text-[var(--muted)]">
                <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                Chargement de la synthèse comptable…
              </div>
            }
          >
            <AccountingSummaryView
              tenantId={tenantId}
              companyId={effectiveCompanyId}
              period={period}
            />
          </Suspense>
        </div>

        <div className="sticky bottom-0 flex items-center border-t border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-3">
          <button
            type="button"
            onClick={() => router.push(pilotageHref)}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)]"
          >
            <Icon name="arrow_back" size={16} />
            Retour Pilotage
          </button>
        </div>
      </main>
    </>
  );
}

export default function SynthesePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
          <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Chargement…
        </div>
      }
    >
      <SyntheseContent />
    </Suspense>
  );
}
