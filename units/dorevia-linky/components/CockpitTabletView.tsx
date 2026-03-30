"use client";

import Link from "next/link";
import { IconTreasury } from "@/components/CardIcons";
import { Icon } from "@/components/Icon";
import { CockpitMasterKpiValue } from "@/components/cockpit/CockpitMasterKpiValue";
import { CompactTile, type ConfidenceLevel } from "@/components/InstrumentCardChrome";
import { DivaFlashBlock } from "@/components/DivaFlashBlock";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import type { PeriodRange } from "@/app/lib/period-utils";
import type { CardId } from "@/app/types/linky-tiles";
import { navHrefWithTenant } from "@/components/layout/navTenantHref";
import { UI_STATE_LABELS } from "@/app/lib/cockpit/ui-state-labels";
import {
  buildTreasuryCockpitTileModel,
  treasuryCockpitCoverageBarFillClass,
  treasuryCockpitPrimaryBadge,
} from "@/app/lib/cockpit/treasury-cockpit-tile";
import {
  metricConfidenceOutlineClass,
  treasuryMasterCardOutlineClass,
} from "@/app/lib/cockpit/cockpit-master-card-outline";
import { cockpitMasterMetricBadgeDesktop } from "@/app/lib/cockpit/cockpit-master-metric-badge";
import { ensureCockpitKpiShowsEuro, formatSignedAmount } from "@/app/lib/format";
import {
  COCKPIT_T4_CARD_LABEL,
  COCKPIT_T4_MICRO_UPPER,
  COCKPIT_T5_CAPTION,
  COCKPIT_T5_DETAIL_LABEL,
  COCKPIT_T5_DETAIL_VALUE,
  COCKPIT_T5_STATE_BADGE,
} from "@/app/lib/cockpit/cockpit-typography";

interface CockpitTabletViewProps {
  tenantId: string;
  companyId: string | null;
  period: PeriodRange;
  metrics: DashboardMetricsResponse | null;
  metricsLoading: boolean;
  metricsError?: boolean;
  onSelectCard?: (id: CardId) => void;
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

const SECONDARY_B = SECONDARY.slice(0, 4);
const SECONDARY_C = SECONDARY.slice(4);

function renderSecondaryTile(
  tile: (typeof SECONDARY)[0],
  metrics: DashboardMetricsResponse | null,
  h: (p: string) => string,
  onSelectCard?: (id: CardId) => void,
) {
  const metric = metrics?.[tile.key as keyof DashboardMetricsResponse] as
    | { value?: unknown; formatted?: string; valueKind?: string }
    | undefined;
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
}

/**
 * Cockpit tactile intermédiaire (768–1023 px) : trésorerie pleine largeur, Business / Flux en 7+5,
 * bloc B (grille 2×2) + colonne C (capteurs complémentaires), sans dupliquer le bandeau ReportHeader.
 */
export function CockpitTabletView({
  tenantId,
  companyId,
  period,
  metrics,
  metricsLoading,
  metricsError = false,
  onSelectCard,
}: CockpitTabletViewProps) {
  const treasury = metrics?.treasury;
  const business = metrics?.business;
  const cash = metrics?.cash;
  const treasuryTile = buildTreasuryCockpitTileModel(metrics);
  const h = (p: string) => navHrefWithTenant(p, tenantId);

  const treasuryStatusForChrome = metricsError ? "alert" : treasuryTile.treasuryStatus;
  const treasuryPrimaryBadge = treasuryCockpitPrimaryBadge(treasuryStatusForChrome);
  const treasuryOutline = treasuryMasterCardOutlineClass(treasuryStatusForChrome);
  const treasuryCoverageFill = treasuryCockpitCoverageBarFillClass(treasuryStatusForChrome);
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
    <main className="flex-1 space-y-5 overflow-y-auto px-0 pb-4 pt-0 md:space-y-6 md:pb-6">
      <div className="flex flex-col gap-4 md:gap-5">
        <Link
          href={h("/tresorerie")}
          className={`group relative isolate flex min-h-[260px] min-w-0 flex-col rounded-2xl bg-[var(--card)] p-5 text-left shadow-sm transition-all active:scale-[0.99] md:min-h-[280px] md:p-6 md:hover:shadow-md ${treasuryOutline}`}
        >
          <div className="mb-1 flex items-start justify-between gap-3 pr-0.5">
            <span className={`inline-flex min-w-0 items-center gap-2 ${COCKPIT_T4_CARD_LABEL}`}>
              <IconTreasury className="h-5 w-5 shrink-0 text-[var(--accent)] opacity-90 transition-opacity group-hover:opacity-100" />
              Trésorerie
            </span>
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
            <p className={`mt-0.5 ${COCKPIT_T5_CAPTION}`}>Solde validé</p>
          </div>
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
                  className={`h-full rounded-full transition-[width] duration-300 ${treasuryCoverageFill}`}
                  style={{ width: treasuryTile.coveragePct != null ? `${treasuryTile.coveragePct}%` : "0%" }}
                />
              </div>
            </div>
            <div className={`flex items-baseline justify-between gap-2 border-t border-[var(--border)] pt-3 text-lg`}>
              <span className={COCKPIT_T5_DETAIL_LABEL}>Montant à rapprocher</span>
              <span className={`shrink-0 text-right ${COCKPIT_T5_DETAIL_VALUE}`} title={treasuryTile.rapproTooltip}>
                {treasuryTile.rapproFormatted ?? "—"}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-lg">
              <span className={COCKPIT_T5_DETAIL_LABEL}>Écart à confirmer</span>
              <span className={`shrink-0 ${COCKPIT_T5_DETAIL_VALUE}`} title={treasuryTile.erpDeltaTooltip}>
                {treasuryTile.erpDeltaAbsFormatted ?? "—"}
              </span>
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-4 md:items-stretch">
          <Link
            href={h("/business")}
            className={`relative isolate flex min-h-[260px] min-w-0 flex-col rounded-2xl p-5 text-left shadow-sm transition-all active:scale-[0.99] md:col-span-7 md:min-h-[280px] md:p-6 md:hover:shadow-md ${
              conf(business) === "fiable"
                ? "border border-[var(--tile-business-border)] bg-[var(--primary-container)]"
                : `bg-[var(--card)] ${businessOutline}`
            }`}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
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
                  {businessDetail != null
                    ? formatSignedAmount(-Math.abs(businessDetail.achats), businessDetail.currency)
                    : "—"}
                </span>
              </div>
            </div>
            <div className="relative z-[1] mt-auto flex items-center justify-between pt-3">
              <span
                className={`inline-flex items-center gap-1 ${COCKPIT_T5_DETAIL_LABEL} font-semibold text-[var(--confidence-fiable)]`}
              >
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

          <Link
            href={h("/flux-net")}
            className={`flex min-h-[260px] min-w-0 flex-col rounded-2xl bg-[var(--card)] p-5 text-left shadow-sm transition-all active:scale-[0.99] md:col-span-5 md:min-h-[280px] md:p-6 md:hover:shadow-md ${
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
              <p className={`mt-0.5 ${COCKPIT_T5_CAPTION}`}>Encaissements et décaissements (période)</p>
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
                  {cashDetail != null
                    ? formatSignedAmount(-Math.abs(cashDetail.decaissements), cashDetail.currency)
                    : "—"}
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-4">
        <div className="md:col-span-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Indicateurs clés
          </p>
          <div className="grid grid-cols-2 gap-3">{SECONDARY_B.map((t) => renderSecondaryTile(t, metrics, h, onSelectCard))}</div>
        </div>
        <div className="md:col-span-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Capteurs complémentaires
          </p>
          <div className="flex flex-col gap-3">
            {SECONDARY_C.map((t) => renderSecondaryTile(t, metrics, h, onSelectCard))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-4">
        <Link
          href={h("/tresorerie")}
          className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors active:scale-[0.99] md:col-span-8 md:p-6 md:hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))]"
        >
          <div>
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Détail trésorerie
            </h3>
            <p className="font-headline text-xl font-bold leading-snug text-[var(--text)] md:text-2xl">
              Rapprochement bancaire, évolution du solde et gouvernance
            </p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--panel)] text-[var(--text)]">
            <Icon name="chevron_right" size={22} className="text-[var(--muted)]" />
          </span>
        </Link>

        <Link
          href={h("/alerts")}
          className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors active:scale-[0.99] md:col-span-4 md:p-6 md:hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))]"
        >
          <div>
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Alertes &amp; signaux
            </h3>
            <p className="font-headline mt-1 text-xl font-bold text-[var(--text)] md:text-2xl">Voir les alertes</p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--panel)] text-[var(--text)]">
            <Icon name="chevron_right" size={22} className="text-[var(--muted)]" />
          </span>
        </Link>
      </div>

      <div className="mt-2">
        <DivaFlashBlock
          tenantId={tenantId}
          companyId={companyId}
          period={{ from: period.from, to: period.to }}
          dashboardMetrics={metrics}
        />
      </div>
    </main>
  );
}
