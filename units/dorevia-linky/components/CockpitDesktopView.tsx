"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { TopBar } from "@/components/layout/TopBar";
import { CockpitMasterKpiValue } from "@/components/cockpit/CockpitMasterKpiValue";
import { CompactTile, type ConfidenceLevel } from "@/components/InstrumentCardChrome";
import { DivaFlashBlock } from "@/components/DivaFlashBlock";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import type { PeriodRange } from "@/app/lib/period-utils";
import type { CardId } from "@/app/types/linky-tiles";
import { computeConfidenceScore } from "@/app/lib/confidence";
import { navHrefWithTenant } from "@/components/layout/navTenantHref";
import { UI_STATE_LABELS } from "@/app/lib/cockpit/ui-state-labels";
import {
  buildTreasuryCockpitTileModel,
  treasuryCockpitPrimaryBadge,
} from "@/app/lib/cockpit/treasury-cockpit-tile";
import {
  metricConfidenceOutlineClass,
  treasuryMasterCardOutlineClass,
} from "@/app/lib/cockpit/cockpit-master-card-outline";
import { cockpitMasterMetricBadgeDesktop } from "@/app/lib/cockpit/cockpit-master-metric-badge";
import { ensureCockpitKpiShowsEuro, formatSignedAmount } from "@/app/lib/format";
import {
  COCKPIT_T1_PAGE_META,
  COCKPIT_T1_PAGE_TITLE,
  COCKPIT_T4_CARD_LABEL,
  COCKPIT_T4_MICRO_UPPER,
  COCKPIT_T5_CAPTION,
  COCKPIT_T5_DETAIL_LABEL,
  COCKPIT_T5_DETAIL_VALUE,
  COCKPIT_T5_STATE_BADGE,
} from "@/app/lib/cockpit/cockpit-typography";

interface CockpitDesktopViewProps {
  tenantId: string;
  companyId: string | null;
  period: PeriodRange;
  metrics: DashboardMetricsResponse | null;
  metricsLoading: boolean;
  /** Échec du chargement des métriques cockpit (affichage dégradé + contour Trésorerie « alert »). */
  metricsError?: boolean;
  onSelectCard?: (id: CardId) => void;
  /** Quand la barre est fusionnée dans `ReportHeader` (canon Stitch desktop). */
  hideTopBar?: boolean;
}

function fmt(raw: { value?: unknown; formatted?: string } | null | undefined): string {
  if (!raw) return "—";
  return ensureCockpitKpiShowsEuro(raw);
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
  metricsError = false,
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

  const treasuryStatusForChrome = metricsError ? "alert" : treasuryTile.treasuryStatus;
  const treasuryPrimaryBadge = treasuryCockpitPrimaryBadge(treasuryStatusForChrome);
  const treasuryOutline = treasuryMasterCardOutlineClass(treasuryStatusForChrome);
  const businessOutline = metricConfidenceOutlineClass(conf(business));
  const cashOutline = metricConfidenceOutlineClass(conf(cash));
  const cashMasterBadge = cockpitMasterMetricBadgeDesktop(conf(cash));
  const businessDetail = metrics?._details?.business;
  const cashDetail = metrics?._details?.cash;

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

      <main
        className={`flex-1 overflow-y-auto ${hideTopBar ? "space-y-6 px-0 pb-4 pt-0 md:pb-6" : "p-4 sm:p-5 lg:p-6"}`}
      >
        {!hideTopBar ? (
          <div className="mb-6">
            <h2 className={COCKPIT_T1_PAGE_TITLE}>Pilotage</h2>
            {periodLine ? (
              <p className={`mt-1 ${COCKPIT_T1_PAGE_META}`}>Période affichée : {periodLine}</p>
            ) : null}
          </div>
        ) : null}

        {/* Trois cartes maîtresses — une colonne avant md, trois colonnes dès md (laptop) ; gaps plus larges en lg+ (bureau). */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch md:gap-5 lg:gap-6 lg:mt-1">
          {/* Trésorerie — contour fin = fiabilité (doctrine §5.4) ; pas de liseré haut vert si Partiel */}
          <Link
            href={h("/tresorerie")}
            className={`group relative isolate flex min-h-[280px] min-w-0 flex-col rounded-2xl bg-[var(--card)] p-6 text-left shadow-sm transition-all hover:shadow-md ${treasuryOutline}`}
          >
            {/* En-tête : même logique que Flux net — KPI maître en pleine largeur sous le titre. */}
            <div className="mb-1 flex items-start justify-between gap-3 pr-0.5">
              <span className={COCKPIT_T4_CARD_LABEL}>Trésorerie</span>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded border px-2 py-0.5 ${COCKPIT_T5_STATE_BADGE} ${treasuryPrimaryBadge.desktopWrap}`}
                title={treasury?.status_reason ?? undefined}
              >
                <Icon name={treasuryPrimaryBadge.iconName} size={12} />
                {treasuryPrimaryBadge.label}
              </span>
            </div>
            <div className="min-w-0 w-full">
              <CockpitMasterKpiValue display={fmt(treasury)} />
              <p className={`mt-0.5 ${COCKPIT_T5_CAPTION}`}>Solde validé (Vault)</p>
            </div>

            {/* Bloc métier : rempli le bas de carte en répartissant le groupe (flex-1 + justify-center) */}
            <div className="mt-3 flex min-h-0 flex-1 flex-col justify-center gap-3 pr-0.5">
              <div title="Part des flux couverts par preuve bancaire sur la période affichée">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={COCKPIT_T4_MICRO_UPPER}>Couverture probante</span>
                  <span className={`tabular-nums ${COCKPIT_T5_DETAIL_VALUE}`}>
                    {treasuryTile.coveragePct != null ? `${treasuryTile.coveragePct} %` : "—"}
                  </span>
                </div>
                <div
                  className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[var(--coverage-track)]"
                  role="progressbar"
                  aria-valuenow={treasuryTile.coveragePct ?? undefined}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Couverture probante"
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${
                      treasuryTile.treasuryStatus === "ok"
                        ? "bg-[var(--confidence-fiable)]"
                        : "bg-[var(--coverage-fill-muted)]"
                    }`}
                    style={{ width: treasuryTile.coveragePct != null ? `${treasuryTile.coveragePct}%` : "0%" }}
                  />
                </div>
              </div>
              <div className={`flex items-baseline justify-between gap-2 border-t border-[var(--border)] pt-3 text-lg`}>
                <span className={COCKPIT_T5_DETAIL_LABEL}>Écart ERP − Vault</span>
                <span
                  className={`shrink-0 ${COCKPIT_T5_DETAIL_VALUE}`}
                  title="Solde comptable (ERP) moins position validée (Vault)"
                >
                  {treasuryTile.erpDeltaFormatted ?? "—"}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 text-lg">
                <span className={COCKPIT_T5_DETAIL_LABEL}>Volume à rapprocher</span>
                <span className={`shrink-0 text-right ${COCKPIT_T5_DETAIL_VALUE}`}>
                  {treasuryTile.rapproFormatted ?? "—"}
                </span>
              </div>
            </div>
          </Link>

          {/* Business — fond primaire + bordure teal (maquette) */}
          <Link
            href={h("/business")}
            className={`relative isolate flex min-h-[280px] min-w-0 flex-col rounded-2xl p-6 text-left shadow-sm transition-all hover:shadow-md ${
              conf(business) === "fiable"
                ? "border border-[var(--tile-business-border)] bg-[var(--primary-container)]"
                : `bg-[var(--card)] ${businessOutline}`
            }`}
          >
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
              aria-hidden
            >
              <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--confidence-fiable)_18%,transparent)] blur-3xl dark:bg-emerald-900/20" />
            </div>
            <div className="relative z-[1] min-w-0">
              <span className={COCKPIT_T4_CARD_LABEL}>Business</span>
              <CockpitMasterKpiValue display={fmt(business)} />
              <p className={`mt-0.5 ${COCKPIT_T5_CAPTION}`}>Ventes nettes après achats (période)</p>
            </div>
            <div className="relative z-[1] mt-3 flex min-h-0 flex-1 flex-col justify-center gap-2 border-t border-[var(--border)] pt-3 text-xl">
              <div className="flex items-baseline justify-between gap-2">
                <span className={COCKPIT_T5_DETAIL_LABEL}>Ventes</span>
                <span className={`shrink-0 ${COCKPIT_T5_DETAIL_VALUE}`}>
                  {businessDetail != null ? formatSignedAmount(businessDetail.ventes, businessDetail.currency) : "—"}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className={COCKPIT_T5_DETAIL_LABEL}>Achats</span>
                <span className={`shrink-0 ${COCKPIT_T5_DETAIL_VALUE}`}>
                  {businessDetail != null ? formatSignedAmount(-Math.abs(businessDetail.achats), businessDetail.currency) : "—"}
                </span>
              </div>
            </div>
            <div className="relative z-[1] mt-auto flex items-center justify-between pt-3">
              <span className={`inline-flex items-center gap-1 ${COCKPIT_T5_DETAIL_LABEL} font-semibold text-[var(--confidence-fiable)]`}>
                <Icon name="trending_up" size={14} />
                MTD
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_14%,var(--card))] px-3 py-1 ${COCKPIT_T5_STATE_BADGE} text-[var(--accent)]`}
              >
                <Icon name="verified" size={12} filled />
                {UI_STATE_LABELS.certified.toUpperCase()}
              </span>
            </div>
          </Link>

          {/* Flux Net — badge = maturité de lecture (§9.5 : clé `proxy` → Partiel) */}
          <Link
            href={h("/flux-net")}
            className={`flex min-h-[280px] min-w-0 flex-col rounded-2xl bg-[var(--card)] p-6 text-left shadow-sm transition-all hover:shadow-md ${
              conf(cash) === "fiable" ? "border border-[var(--tile-flux-border)]" : cashOutline
            }`}
          >
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className={COCKPIT_T4_CARD_LABEL}>Flux Net</span>
                <span className={cashMasterBadge.wrapperClassName}>
                  <Icon name={cashMasterBadge.iconName} size={12} filled={cashMasterBadge.iconFilled} />
                  {cashMasterBadge.labelUpper}
                </span>
              </div>
              <CockpitMasterKpiValue display={fmt(cash)} />
              <p className={`mt-0.5 ${COCKPIT_T5_CAPTION}`}>
                Encaissements et décaissements (période)
              </p>
            </div>
            <div className="mt-3 flex min-h-0 flex-1 flex-col justify-center gap-2 border-t border-[var(--border)] pt-3 text-xl">
              <div className="flex items-baseline justify-between gap-2">
                <span className={COCKPIT_T5_DETAIL_LABEL}>Encaissements</span>
                <span className={`shrink-0 ${COCKPIT_T5_DETAIL_VALUE}`}>
                  {cashDetail != null ? formatSignedAmount(cashDetail.encaissements, cashDetail.currency) : "—"}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className={COCKPIT_T5_DETAIL_LABEL}>Décaissements</span>
                <span className={`shrink-0 ${COCKPIT_T5_DETAIL_VALUE}`}>
                  {cashDetail != null ? formatSignedAmount(-Math.abs(cashDetail.decaissements), cashDetail.currency) : "—"}
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Tuiles secondaires — 1 col avant md, 3 col dès md ; 4 col dès xl (≥1400px) pour éviter 4 col sur laptop 1280–1366 */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4 xl:gap-5">
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

        {/* Bottom — pile sur mobile ; côte à côte dès lg (laptop), comme la maquette Carole */}
        <div className="mt-2 grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12">
          <Link
            href={h("/tresorerie")}
            className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] md:p-6 lg:col-span-8"
          >
            <div>
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Détail trésorerie</h3>
              <p className="font-headline text-2xl font-bold leading-snug text-[var(--text)]">
                Rapprochement bancaire, évolution du solde et gouvernance
              </p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--panel)] text-[var(--text)]">
              <Icon name="chevron_right" size={22} className="text-[var(--muted)]" />
            </span>
          </Link>

          <Link
            href={h("/alerts")}
            className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] md:p-6 lg:col-span-4"
          >
            <div>
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Alertes &amp; signaux</h3>
              <p className="font-headline mt-1 text-2xl font-bold text-[var(--text)]">Voir les alertes</p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--panel)] text-[var(--text)]">
              <Icon name="chevron_right" size={22} className="text-[var(--muted)]" />
            </span>
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
