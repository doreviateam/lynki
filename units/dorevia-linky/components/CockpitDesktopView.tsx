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
import { UI_STATE_LABELS } from "@/app/lib/cockpit/ui-state-labels";
import { buildTreasuryCockpitTileModel } from "@/app/lib/cockpit/treasury-cockpit-tile";

interface CockpitDesktopViewProps {
  tenantId: string;
  companyId: string | null;
  period: PeriodRange;
  metrics: DashboardMetricsResponse | null;
  metricsLoading: boolean;
  onSelectCard?: (id: CardId) => void;
  /** Quand la barre est fusionnée dans `ReportHeader` (canon Stitch desktop). */
  hideTopBar?: boolean;
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
  hideTopBar = false,
}: CockpitDesktopViewProps) {
  const integrityScore = computeConfidenceScore(metrics);
  const treasury = metrics?.treasury;
  const business = metrics?.business;
  const cash = metrics?.cash;
  const treasuryTile = buildTreasuryCockpitTileModel(metrics);
  const h = (p: string) => navHrefWithTenant(p, tenantId);
  const periodLine = formatCockpitPeriodRange(period);

  const treasuryBadge =
    treasuryTile.treasuryStatus === "ok"
      ? { label: UI_STATE_LABELS.sync_ok, wrap: "border-[color-mix(in_srgb,var(--confidence-fiable)_35%,var(--border))] bg-[color-mix(in_srgb,var(--confidence-fiable)_10%,var(--card))] text-[var(--confidence-fiable)]" }
      : treasuryTile.treasuryStatus === "watch"
        ? {
            label: UI_STATE_LABELS.to_confirm,
            wrap: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-400",
          }
        : {
            label: UI_STATE_LABELS.unavailable,
            wrap: "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
          };

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
      {!hideTopBar ? (
        <TopBar
          confidenceScore={integrityScore}
          confidenceLabel={UI_STATE_LABELS.reliable}
          title="Lynki Desktop Cockpit"
          subtitle={`Arrêté ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
        />
      ) : null}

      <main className={`flex-1 overflow-y-auto ${hideTopBar ? "px-0 py-4 md:py-6" : "p-6"}`}>
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
            <div className="mb-3 flex items-start justify-between gap-2 pr-1">
              <div className="min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Trésorerie</span>
                <div className="mt-2 text-3xl font-black tabular-nums tracking-tight text-[var(--text)]">{fmt(treasury)}</div>
                <p className="mt-0.5 text-[11px] font-medium text-[var(--text-secondary)]">Solde validé (Vault)</p>
              </div>
              <span className="shrink-0 rounded-lg bg-[color-mix(in_srgb,var(--confidence-fiable)_12%,var(--card))] p-2 text-[var(--confidence-fiable)]">
                <Icon name="account_balance_wallet" size={22} filled />
              </span>
            </div>

            {/* W60-101 — zone centrale lisible (données réelles, pas de barres décoratives) */}
            <div className="mt-auto flex min-h-0 flex-col gap-2.5 pr-1">
              <div title="Part des flux couverts par preuve bancaire sur la période affichée">
                <div className="flex items-baseline justify-between gap-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                  <span>Couverture probante</span>
                  <span className="tabular-nums text-[var(--text)]">
                    {treasuryTile.coveragePct != null ? `${treasuryTile.coveragePct} %` : "—"}
                  </span>
                </div>
                <div
                  className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]"
                  role="progressbar"
                  aria-valuenow={treasuryTile.coveragePct ?? undefined}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Couverture probante"
                >
                  <div
                    className="h-full rounded-full bg-[var(--confidence-fiable)] transition-[width] duration-300"
                    style={{ width: treasuryTile.coveragePct != null ? `${treasuryTile.coveragePct}%` : "0%" }}
                  />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-[var(--text-secondary)]">Écart ERP − Vault</span>
                <span
                  className="shrink-0 font-semibold tabular-nums text-[var(--text)]"
                  title="Solde comptable (ERP) moins position validée (Vault)"
                >
                  {treasuryTile.erpDeltaFormatted ?? "—"}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-[var(--text-secondary)]">Volume à rapprocher</span>
                <span className="shrink-0 font-semibold tabular-nums text-[var(--text)]">
                  {treasuryTile.rapproFormatted ?? "—"}
                </span>
              </div>
            </div>

            <div
              className={`pointer-events-none absolute bottom-4 right-4 flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold ${treasuryBadge.wrap}`}
              title={treasury?.status_reason ?? undefined}
            >
              <Icon
                name={treasuryTile.treasuryStatus === "ok" ? "check_circle" : treasuryTile.treasuryStatus === "watch" ? "warning" : "info"}
                size={12}
              />
              {treasuryBadge.label}
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
                {UI_STATE_LABELS.certified.toUpperCase()}
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
                  {UI_STATE_LABELS.proxy.toUpperCase()}
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
