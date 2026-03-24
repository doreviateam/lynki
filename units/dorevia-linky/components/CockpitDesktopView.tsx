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

/** Libellé période — même esprit que les sous-titres `pilotage_*_canon_v5` (Stitch). */
function formatCockpitPeriodRange(p: PeriodRange): string {
  const a = new Date(`${p.from}T12:00:00`);
  const b = new Date(`${p.to}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "";
  return `${a.toLocaleDateString("fr-FR")} – ${b.toLocaleDateString("fr-FR")}`;
}

/** Barres sparkline — teinte unique `--confidence-fiable` (Stitch), intensité selon hauteur. */
function sparkBarClass(pct: number): string {
  if (pct >= 80) return "bg-linky-confidence-fiable";
  if (pct >= 65) return "bg-linky-confidence-fiable/90";
  if (pct >= 55) return "bg-linky-confidence-fiable/75";
  return "bg-linky-confidence-fiable/55";
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
  const periodLine = formatCockpitPeriodRange(period);
  const sparkHeights = [40, 55, 45, 70, 65, 85, 60, 75, 50, 80, 72, 78];

  if (metricsLoading && !metrics) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-linky-confidence-fiable border-t-transparent" />
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

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text)]">Pilotage Stratégique</h2>
          {periodLine ? (
            <p className="mt-1 text-sm text-[var(--muted)]">Période affichée : {periodLine}</p>
          ) : null}
        </div>

        {/* Bento — grille responsive comme `pilotage_desktop_v_r_na_canon_v5` (1 / 4 / 6 colonnes) */}
        <div className="grid auto-rows-[160px] grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {/* Trésorerie — bandeau emerald, icône wallet, sparkline, badge SYNCHRO */}
          <Link
            href={h("/tresorerie")}
            className="group relative col-span-1 row-span-2 flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-left shadow-sm transition-all hover:shadow-md md:col-span-2 lg:col-span-2"
          >
            <div className="absolute left-0 top-0 h-1 w-full bg-[var(--confidence-fiable)]" aria-hidden />
            <div className="mb-4 flex items-start justify-between gap-2 pr-1">
              <div className="min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Trésorerie</span>
                <div className="mt-2 text-3xl font-black tabular-nums tracking-tight text-[var(--text)]">{fmt(treasury)}</div>
              </div>
              <span className="shrink-0 rounded-lg bg-[color-mix(in_srgb,var(--confidence-fiable)_12%,var(--card))] p-2 text-[var(--confidence-fiable)]">
                <Icon name="account_balance_wallet" size={22} filled />
              </span>
            </div>
            <div className="mt-auto flex h-24 max-w-full items-end gap-0.5 sm:gap-1">
              {sparkHeights.map((ht, i) => (
                <div
                  key={i}
                  className={`min-w-0 flex-1 rounded-t ${sparkBarClass(ht)}`}
                  style={{ height: `${ht}%` }}
                />
              ))}
            </div>
            <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1 rounded border border-[color-mix(in_srgb,var(--confidence-fiable)_35%,var(--border))] bg-[color-mix(in_srgb,var(--confidence-fiable)_10%,var(--card))] px-2 py-0.5 text-[10px] font-bold text-[var(--confidence-fiable)]">
              <Icon name="check_circle" size={12} />
              SYNCHRO OK
            </div>
          </Link>

          {/* Business — même enveloppe que les autres tuiles en clair ; accent sombre réservé au thème dark */}
          <Link
            href={h("/business")}
            className="relative col-span-1 row-span-2 flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-left shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-xl dark:hover:shadow-2xl md:col-span-2 lg:col-span-2"
          >
            <div
              className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--confidence-fiable)_18%,transparent)] blur-3xl dark:bg-emerald-900/20"
              aria-hidden
            />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-slate-400">
                Business
              </span>
              <div className="mt-3 text-3xl font-black tabular-nums tracking-tight text-[var(--text)] dark:text-white">
                {fmt(business)}
              </div>
            </div>
            <div className="relative mt-auto flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--confidence-fiable)]">
                <Icon name="trending_up" size={14} />
                MTD
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--confidence-fiable)_15%,transparent)] px-2 py-0.5 text-[10px] font-bold text-[var(--confidence-fiable)] dark:bg-emerald-500/15 dark:text-emerald-400">
                <Icon name="verified" size={12} filled />
                CERTIFIÉ
              </span>
            </div>
          </Link>

          {/* Flux Net — badge PROXY en ambre (canon Stitch, pas bleu) */}
          <Link
            href={h("/flux-net")}
            className="col-span-1 row-span-2 flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-left shadow-sm transition-all hover:shadow-md md:col-span-2 lg:col-span-2"
          >
            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Flux Net</span>
                <span className="inline-flex items-center gap-1 rounded border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-400">
                  <Icon name="warning" size={12} />
                  PROXY DATA
                </span>
              </div>
              <div className="mt-3 text-3xl font-black tabular-nums tracking-tight text-[var(--text)]">{fmt(cash)}</div>
            </div>
          </Link>
        </div>

        {/* Tuiles secondaires — 2 col. mobile, 4 desktop (canon) */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
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

        {/* Bottom — pleine largeur sur mobile */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href={h("/tresorerie")}
            className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[color-mix(in_srgb,var(--confidence-fiable)_40%,var(--border))] md:col-span-2"
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
            className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[color-mix(in_srgb,var(--confidence-fiable)_40%,var(--border))]"
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
