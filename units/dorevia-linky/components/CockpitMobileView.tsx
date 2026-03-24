"use client";

import { Icon } from "@/components/Icon";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { CompactTile, type ConfidenceLevel } from "@/components/InstrumentCardChrome";
import { DivaFlashBlock } from "@/components/DivaFlashBlock";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import type { PeriodRange } from "@/app/lib/period-utils";
import type { CardId } from "@/app/types/linky-tiles";
import { computeConfidenceScore } from "@/app/lib/confidence";

interface CockpitMobileViewProps {
  tenantId: string;
  companyId: string | null;
  period: PeriodRange;
  metrics: DashboardMetricsResponse | null;
  metricsLoading: boolean;
  onSelectCard?: (id: CardId) => void;
}

function formatKpi(raw: { value?: unknown; formatted?: string } | null | undefined): string {
  if (!raw) return "—";
  if (typeof raw.formatted === "string" && raw.formatted !== "—") return raw.formatted;
  if (raw.value != null && typeof raw.value === "number") {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(raw.value);
  }
  return "—";
}

function inferConfidence(raw: { valueKind?: string } | null | undefined): ConfidenceLevel {
  if (!raw?.valueKind) return "fiable";
  switch (raw.valueKind) {
    case "proxy": return "proxy";
    case "partial": return "partielle";
    case "estimated": return "estimee";
    default: return "fiable";
  }
}

const SECONDARY_TILES: { id: CardId; icon: string; label: string; metricKey: string }[] = [
  { id: "working_capital", icon: "account_balance_wallet", label: "BFR", metricKey: "working_capital" },
  { id: "encours", icon: "pending_actions", label: "Encours", metricKey: "encours" },
  { id: "taxes", icon: "receipt_long", label: "Taxes", metricKey: "taxes" },
  { id: "ebitda", icon: "trending_up", label: "EBE", metricKey: "ebitda" },
  { id: "credit_notes", icon: "note_alt", label: "Notes crédit", metricKey: "credit_notes" },
  { id: "refunds", icon: "currency_exchange", label: "Rembours.", metricKey: "refunds" },
  { id: "pos_shops", icon: "storefront", label: "POS", metricKey: "pos_shops" },
  { id: "pos_z", icon: "point_of_sale", label: "Z caisse", metricKey: "pos_z" },
];

export function CockpitMobileView({
  tenantId,
  companyId,
  period,
  metrics,
  metricsLoading,
  onSelectCard,
}: CockpitMobileViewProps) {
  const treasury = metrics?.treasury;
  const business = metrics?.business;
  const cash = metrics?.cash;
  const integrityScore = computeConfidenceScore(metrics);

  if (metricsLoading && !metrics) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="text-sm">Chargement du cockpit…</span>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pb-24 pt-6">
      {/* Header mobile — avatar + titre + sync */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
            M
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--text)]">Lynki Cockpit</h1>
            <p className="text-xs text-[var(--muted)]">Pilotage dirigeant</p>
          </div>
        </div>
        <button className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--hover)]">
          <Icon name="sync_saved_locally" size={20} />
        </button>
      </header>

      {/* Data Integrity Score */}
      <ConfidenceScore score={integrityScore} />

      {/* Master tiles — Trésorerie full width, Business + Flux 2 col */}
      <section className="space-y-4">
        {/* Trésorerie — full width, fond primary-container */}
        <button
          type="button"
          onClick={() => onSelectCard?.("treasury")}
          className="w-full rounded-xl bg-[var(--primary-container)] p-5 text-left shadow-lg transition-all hover:shadow-xl active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="account_balance" size={20} className="text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Trésorerie</span>
            </div>
            {inferConfidence(treasury) === "fiable" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <Icon name="verified" size={12} filled />
                Fiable
              </span>
            ) : inferConfidence(treasury) === "partielle" ? (
              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">Partielle</span>
            ) : inferConfidence(treasury) === "proxy" ? (
              <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400">Proxy</span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-semibold text-slate-400">Estimée</span>
            )}
          </div>
          <div className="mt-3 text-2xl font-bold tabular-nums text-white">
            {formatKpi(treasury)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Projection J+30 — aperçu V2</div>
        </button>

        {/* Business + Flux Net — 2 colonnes */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onSelectCard?.("business")}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-left transition-all hover:border-emerald-600/30 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Icon name="business_center" size={16} className="text-[var(--muted)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Business</span>
            </div>
            <div className="mt-2 text-lg font-bold tabular-nums text-[var(--text)]">
              {formatKpi(business)}
            </div>
            {inferConfidence(business) === "fiable" ? (
              <span className="mt-1 inline-flex items-center rounded-full bg-emerald-600/15 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">Fiable</span>
            ) : inferConfidence(business) === "proxy" ? (
              <span className="mt-1 inline-flex items-center rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] font-semibold text-blue-400">Proxy</span>
            ) : inferConfidence(business) === "estimee" ? (
              <span className="mt-1 inline-flex items-center rounded-full bg-slate-500/15 px-2 py-0.5 text-[9px] font-semibold text-slate-400">Estimée</span>
            ) : (
              <span className="mt-1 inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold text-amber-400">Partielle</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectCard?.("cash")}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-left transition-all hover:border-emerald-600/30 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Icon name="swap_vert" size={16} className="text-[var(--muted)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Flux Net</span>
            </div>
            <div className="mt-2 text-lg font-bold tabular-nums text-[var(--text)]">
              {formatKpi(cash)}
            </div>
            {inferConfidence(cash) === "fiable" ? (
              <span className="mt-1 inline-flex items-center rounded-full bg-emerald-600/15 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">Fiable</span>
            ) : inferConfidence(cash) === "proxy" ? (
              <span className="mt-1 inline-flex items-center rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] font-semibold text-blue-400">Proxy</span>
            ) : inferConfidence(cash) === "partielle" ? (
              <span className="mt-1 inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold text-amber-400">Partielle</span>
            ) : (
              <span className="mt-1 inline-flex items-center rounded-full bg-slate-500/15 px-2 py-0.5 text-[9px] font-semibold text-slate-400">Estimée</span>
            )}
          </button>
        </div>
      </section>

      {/* Secondary tiles — bento 2×N grid */}
      <section className="grid grid-cols-2 gap-3">
        {SECONDARY_TILES.map((tile) => {
          const metric = metrics?.[tile.metricKey as keyof DashboardMetricsResponse] as { value?: unknown; formatted?: string; valueKind?: string } | undefined;
          return (
            <CompactTile
              key={tile.id}
              icon={tile.icon}
              label={tile.label}
              value={formatKpi(metric)}
              confidence={inferConfidence(metric)}
              onClick={() => onSelectCard?.(tile.id)}
            />
          );
        })}
      </section>

      {/* Insight banner */}
      <DivaFlashBlock
        tenantId={tenantId}
        companyId={companyId}
        period={{ from: period.from, to: period.to }}
        dashboardMetrics={metrics}
      />
    </main>
  );
}
