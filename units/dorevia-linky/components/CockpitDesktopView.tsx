"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { TopBar } from "@/components/layout/TopBar";
import { CompactTile, type ConfidenceLevel } from "@/components/InstrumentCardChrome";
import { DivaFlashBlock } from "@/components/DivaFlashBlock";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import type { PeriodRange } from "@/app/lib/period-utils";
import type { CardId } from "@/app/types/linky-tiles";
import { computeConfidenceScore } from "@/app/lib/confidence";
import { navHrefWithTenant } from "@/components/layout/navTenantHref";

interface CockpitDesktopViewProps {
  tenantId: string;
  companyId: string | null;
  period: PeriodRange;
  metrics: DashboardMetricsResponse | null;
  metricsLoading: boolean;
  onSelectCard?: (id: CardId) => void;
}

function fmt(raw: { value?: unknown; formatted?: string } | null | undefined): string {
  if (!raw) return "—";
  if (typeof raw.formatted === "string" && raw.formatted !== "—") return raw.formatted;
  if (raw.value != null && typeof raw.value === "number") {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(raw.value);
  }
  return "—";
}

function conf(raw: { valueKind?: string } | null | undefined): ConfidenceLevel {
  if (!raw?.valueKind) return "fiable";
  switch (raw.valueKind) {
    case "proxy": return "proxy";
    case "partial": return "partielle";
    case "estimated": return "estimee";
    default: return "fiable";
  }
}

const SECONDARY: { id: CardId; icon: string; label: string; key: string; href?: string }[] = [
  { id: "working_capital", icon: "account_balance_wallet", label: "BFR", key: "working_capital" },
  { id: "encours", icon: "pending_actions", label: "Encours", key: "encours", href: "/encours" },
  { id: "taxes", icon: "receipt_long", label: "Taxes", key: "taxes" },
  { id: "ebitda", icon: "trending_up", label: "EBE", key: "ebitda" },
  { id: "credit_notes", icon: "note_alt", label: "Notes crédit", key: "credit_notes" },
  { id: "refunds", icon: "currency_exchange", label: "Rembours.", key: "refunds" },
  { id: "pos_shops", icon: "storefront", label: "Points de vente", key: "pos_shops" },
  { id: "pos_z", icon: "receipt", label: "Z de caisse", key: "pos_z" },
];

export function CockpitDesktopView({
  tenantId,
  companyId,
  period,
  metrics,
  metricsLoading,
  onSelectCard,
}: CockpitDesktopViewProps) {
  const integrityScore = computeConfidenceScore(metrics);
  const treasury = metrics?.treasury;
  const business = metrics?.business;
  const cash = metrics?.cash;
  const h = (p: string) => navHrefWithTenant(p, tenantId);

  if (metricsLoading && !metrics) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="text-sm">Chargement…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar
        confidenceScore={integrityScore}
        confidenceLabel="Fiable"
        title="Lynki Desktop Cockpit"
        subtitle={`Arrêté ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
      />

      <main className="flex-1 p-6">
        <h2 className="mb-6 text-lg font-bold text-[var(--text)]">Pilotage Stratégique</h2>

        {/* Bento grid — 3 tuiles maîtresses 2×2 */}
        <div className="grid auto-rows-[160px] grid-cols-6 gap-4">
          {/* Trésorerie — 2×2 */}
          <Link
            href={h("/tresorerie")}
            className="col-span-2 row-span-2 flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-left shadow-sm transition-all hover:shadow-md"
          >
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Trésorerie</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  SYNCHRO OK
                </span>
              </div>
              <div className="mt-3 text-2xl font-bold tabular-nums text-[var(--text)]">{fmt(treasury)}</div>
            </div>
            <div className="mt-auto flex items-end gap-1">
              {[40, 55, 45, 60, 50, 65, 70, 60, 75, 80, 72, 85].map((h, i) => (
                <div key={i} className="w-2 rounded-t bg-emerald-500/60" style={{ height: `${h}%` }} />
              ))}
            </div>
          </Link>

          {/* Business — 2×2 fond slate-900 */}
          <Link
            href={h("/business")}
            className="col-span-2 row-span-2 flex flex-col justify-between rounded-xl bg-slate-900 p-5 text-left shadow-sm transition-all hover:shadow-md"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Business</span>
              <div className="mt-3 text-2xl font-bold tabular-nums text-white">{fmt(business)}</div>
            </div>
            <div className="mt-auto">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                CERTIFIÉ
              </span>
            </div>
          </Link>

          {/* Flux Net — 2×2 */}
          <Link
            href={h("/flux-net")}
            className="col-span-2 row-span-2 flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-left shadow-sm transition-all hover:shadow-md"
          >
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Flux Net</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                  PROXY DATA
                </span>
              </div>
              <div className="mt-3 text-2xl font-bold tabular-nums text-[var(--text)]">{fmt(cash)}</div>
            </div>
          </Link>
        </div>

        {/* Tuiles secondaires — 8 tuiles B+C, 4 colonnes × 2 lignes */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          {SECONDARY.map((tile) => {
            const metric = metrics?.[tile.key as keyof DashboardMetricsResponse] as { value?: unknown; formatted?: string; valueKind?: string } | undefined;
            return (
              <CompactTile
                key={tile.id}
                icon={tile.icon}
                label={tile.label}
                value={fmt(metric)}
                confidence={conf(metric)}
                href={tile.href ? h(tile.href) : undefined}
                onClick={tile.href ? undefined : () => onSelectCard?.(tile.id)}
              />
            );
          })}
        </div>

        {/* Bottom section — trésorerie détail + alertes */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {/* Lien vers le détail trésorerie */}
          <Link
            href={h("/tresorerie")}
            className="col-span-2 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-emerald-600/30"
          >
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Détail trésorerie</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Rapprochement bancaire, évolution du solde et gouvernance
              </p>
            </div>
            <Icon name="chevron_right" size={20} className="text-[var(--muted)]" />
          </Link>

          <Link
            href={h("/alerts")}
            className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-emerald-600/30"
          >
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Alertes &amp; signaux</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Voir les alertes</p>
            </div>
            <Icon name="chevron_right" size={20} className="text-[var(--muted)]" />
          </Link>
        </div>

        {/* Insight Diva */}
        <div className="mt-6">
          <DivaFlashBlock
            tenantId={tenantId}
            companyId={companyId}
            period={{ from: period.from, to: period.to }}
            dashboardMetrics={metrics}
          />
        </div>
      </main>
    </>
  );
}
