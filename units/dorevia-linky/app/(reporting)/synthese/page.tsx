"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { TopBar } from "@/components/layout/TopBar";
import { AccountingSummaryView } from "@/components/AccountingSummaryView";
import { TenantChoiceView } from "@/components/TenantChoiceView";
import { useDashboardData } from "@/hooks/useDashboardData";
import { computeConfidenceScore } from "@/app/lib/confidence";
import { useRouter } from "next/navigation";

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

  if (showTenantChoice) {
    return <TenantChoiceView onSelect={(id) => onSetTenantNavigate(id)} />;
  }

  return (
    <>
      <TopBar
        confidenceScore={confidenceScore}
        confidenceLabel={
          confidenceScore === 100
            ? "Fiable"
            : confidenceScore !== null
            ? "Partielle"
            : undefined
        }
        title="Lynki Desktop Cockpit"
        subtitle="Synthèse comptable · Période en cours"
      />

      <main className="flex-1 overflow-y-auto">
        {/* Bannière de statut */}
        <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {confidenceScore === 100 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <Icon name="verified_user" size={14} filled />
                  Audit Ready — CONFORME
                </span>
              ) : confidenceScore !== null ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
                  <Icon name="warning" size={14} filled />
                  Données partiellement synchronisées
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700/50 px-3 py-1 text-xs font-semibold text-slate-400">
                  <Icon name="sync" size={14} />
                  Synchronisation en cours…
                </span>
              )}
              <ConfidenceScore score={confidenceScore} compact />
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Données temps réel
            </div>
          </div>
        </div>

        {/* Vue comptable — Suspense isolée pour ne pas remonter au parent */}
        <div className="synthese-scope p-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20 text-sm text-[var(--muted)]">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mr-2" />
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

        {/* Barre d'actions */}
        <div className="sticky bottom-0 flex items-center border-t border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-3">
          <button
            onClick={() => router.push("/")}
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
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mr-2" />
          Chargement…
        </div>
      }
    >
      <SyntheseContent />
    </Suspense>
  );
}
