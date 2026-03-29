"use client";

import { Icon } from "@/components/Icon";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { CompactTile, type ConfidenceLevel } from "@/components/InstrumentCardChrome";
import { DivaFlashBlock } from "@/components/DivaFlashBlock";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import type { PeriodRange } from "@/app/lib/period-utils";
import type { CardId } from "@/app/types/linky-tiles";
import { computeConfidenceScore } from "@/app/lib/confidence";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  buildTreasuryCockpitTileModel,
  treasuryCockpitPrimaryBadge,
} from "@/app/lib/cockpit/treasury-cockpit-tile";
import {
  metricConfidenceOutlineClass,
  treasuryMasterCardOutlineClass,
} from "@/app/lib/cockpit/cockpit-master-card-outline";
import { cockpitMasterMetricBadgeMobilePill } from "@/app/lib/cockpit/cockpit-master-metric-badge";
import { CockpitMasterKpiValue } from "@/components/cockpit/CockpitMasterKpiValue";
import { ensureCockpitKpiShowsEuro, formatSignedAmount } from "@/app/lib/format";
import {
  COCKPIT_T4_CARD_LABEL,
  COCKPIT_T4_MICRO_UPPER,
  COCKPIT_T5_CAPTION,
  COCKPIT_T5_DETAIL_LABEL,
  COCKPIT_T5_DETAIL_VALUE,
  COCKPIT_T5_STATE_BADGE,
} from "@/app/lib/cockpit/cockpit-typography";

interface CockpitMobileViewProps {
  tenantId: string;
  companyId: string | null;
  period: PeriodRange;
  metrics: DashboardMetricsResponse | null;
  metricsLoading: boolean;
  /** Échec du chargement des métriques cockpit (affichage dégradé + contour Trésorerie « alert »). */
  metricsError?: boolean;
  onSelectCard?: (id: CardId) => void;
}

function formatKpi(raw: { value?: unknown; formatted?: string } | null | undefined): string {
  if (!raw) return "—";
  return ensureCockpitKpiShowsEuro(raw);
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
  metricsError = false,
  onSelectCard,
}: CockpitMobileViewProps) {
  const treasury = metrics?.treasury;
  const business = metrics?.business;
  const cash = metrics?.cash;
  const treasuryTile = buildTreasuryCockpitTileModel(metrics);
  const integrityScore = computeConfidenceScore(metrics);

  const treasuryStatusForChrome = metricsError ? "alert" : treasuryTile.treasuryStatus;
  const treasuryPrimaryBadge = treasuryCockpitPrimaryBadge(treasuryStatusForChrome);
  const treasuryOutline = treasuryMasterCardOutlineClass(treasuryStatusForChrome);
  const businessConf = inferConfidence(business);
  const cashConf = inferConfidence(cash);
  const businessOutline = metricConfidenceOutlineClass(businessConf);
  const cashOutline = metricConfidenceOutlineClass(cashConf);
  const businessMasterPill = cockpitMasterMetricBadgeMobilePill(businessConf);
  const cashMasterPill = cockpitMasterMetricBadgeMobilePill(cashConf);
  const businessDetail = metrics?._details?.business;
  const cashDetail = metrics?._details?.cash;

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
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <button type="button" className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--hover)]" aria-label="Synchroniser">
            <Icon name="sync_saved_locally" size={20} />
          </button>
        </div>
      </header>

      {/* Data Integrity Score */}
      <ConfidenceScore score={integrityScore} />

      {/* Trois cartes maîtresses — une seule ligne (3 colonnes) */}
      <section className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => onSelectCard?.("treasury")}
          className={`min-h-0 min-w-0 rounded-xl bg-[var(--card)] p-2.5 text-left shadow-lg transition-all hover:shadow-xl active:scale-[0.99] sm:p-4 ${treasuryOutline}`}
        >
          <div className="flex items-start justify-between gap-1">
            <span className={`${COCKPIT_T4_CARD_LABEL} !text-[9px] !tracking-[0.08em]`}>Trésorerie</span>
            <span
              className={`inline-flex max-w-[4.5rem] shrink-0 items-center gap-0.5 rounded-full px-1 py-0.5 text-[8px] font-semibold leading-none ${treasuryPrimaryBadge.mobileClassName}`}
              title={treasury?.status_reason ?? undefined}
            >
              <Icon
                name={treasuryPrimaryBadge.iconName}
                size={10}
                filled={treasuryTile.treasuryStatus === "ok"}
              />
              <span className="truncate">{treasuryPrimaryBadge.label}</span>
            </span>
          </div>
          <CockpitMasterKpiValue display={formatKpi(treasury)} variant="mobile" mobileWeight="black" />
          <p className={`mt-0.5 line-clamp-2 ${COCKPIT_T5_CAPTION} !text-[9px]`}>Solde validé (Vault)</p>
          <div className="mt-2 space-y-1.5 border-t border-[var(--border)] pt-2 text-left">
            <div title="Part des flux couverts par preuve bancaire">
              <div className="flex justify-between gap-0.5">
                <span className="text-[8px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Couv.</span>
                <span className="tabular-nums text-[9px] font-semibold text-[var(--text)]">
                  {treasuryTile.coveragePct != null ? `${treasuryTile.coveragePct} %` : "—"}
                </span>
              </div>
              <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className={`h-full rounded-full ${
                    treasuryTile.treasuryStatus === "ok"
                      ? "bg-[var(--confidence-fiable)]"
                      : "bg-slate-400 dark:bg-slate-500"
                  }`}
                  style={{ width: treasuryTile.coveragePct != null ? `${treasuryTile.coveragePct}%` : "0%" }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-0.5 border-t border-[var(--border)] pt-1.5">
              <div className="flex justify-between gap-0.5">
                <span className="text-[8px] text-[var(--text-secondary)]">ERP−Vault</span>
                <span className={`max-w-[55%] truncate text-right text-[8px] font-semibold ${COCKPIT_T5_DETAIL_VALUE}`}>
                  {treasuryTile.erpDeltaFormatted ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-0.5">
                <span className="text-[8px] text-[var(--text-secondary)]">À rappr.</span>
                <span className={`max-w-[55%] truncate text-right text-[8px] font-semibold ${COCKPIT_T5_DETAIL_VALUE}`}>
                  {treasuryTile.rapproFormatted ?? "—"}
                </span>
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectCard?.("business")}
          className={`min-h-0 min-w-0 rounded-xl bg-[var(--card)] p-2.5 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98] sm:p-4 ${businessOutline}`}
        >
          <div className="flex items-center gap-1">
            <Icon name="business_center" size={14} className="shrink-0 text-[var(--muted)]" />
            <span className={`${COCKPIT_T4_CARD_LABEL} !text-[9px]`}>Business</span>
          </div>
          <CockpitMasterKpiValue display={formatKpi(business)} variant="mobile" mobileWeight="bold" />
          <p className={`mt-0.5 line-clamp-2 ${COCKPIT_T5_CAPTION} !text-[9px]`}>Ventes − achats</p>
          <div className="mt-2 space-y-1 border-t border-[var(--border)] pt-2">
            <div className="flex justify-between gap-0.5">
              <span className="text-[8px] text-[var(--text-secondary)]">Ventes</span>
              <span className={`max-w-[58%] truncate text-right text-[8px] font-semibold ${COCKPIT_T5_DETAIL_VALUE}`}>
                {businessDetail != null ? formatSignedAmount(businessDetail.ventes, businessDetail.currency) : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-0.5">
              <span className="text-[8px] text-[var(--text-secondary)]">Achats</span>
              <span className={`max-w-[58%] truncate text-right text-[8px] font-semibold ${COCKPIT_T5_DETAIL_VALUE}`}>
                {businessDetail != null ? formatSignedAmount(-Math.abs(businessDetail.achats), businessDetail.currency) : "—"}
              </span>
            </div>
          </div>
          <span className={`mt-2 inline-block max-w-full truncate text-[8px] ${businessMasterPill.className}`}>
            {businessMasterPill.label}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectCard?.("cash")}
          className={`min-h-0 min-w-0 rounded-xl bg-[var(--card)] p-2.5 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98] sm:p-4 ${cashOutline}`}
        >
          <div className="flex items-center gap-1">
            <Icon name="swap_vert" size={14} className="shrink-0 text-[var(--muted)]" />
            <span className={`${COCKPIT_T4_CARD_LABEL} !text-[9px]`}>Flux Net</span>
          </div>
          <CockpitMasterKpiValue display={formatKpi(cash)} variant="mobile" mobileWeight="bold" />
          <p className={`mt-0.5 line-clamp-2 ${COCKPIT_T5_CAPTION} !text-[9px]`}>Enc./Déc.</p>
          <div className="mt-2 space-y-1 border-t border-[var(--border)] pt-2">
            <div className="flex justify-between gap-0.5">
              <span className="text-[8px] text-[var(--text-secondary)]">Enc.</span>
              <span className={`max-w-[58%] truncate text-right text-[8px] font-semibold ${COCKPIT_T5_DETAIL_VALUE}`}>
                {cashDetail != null ? formatSignedAmount(cashDetail.encaissements, cashDetail.currency) : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-0.5">
              <span className="text-[8px] text-[var(--text-secondary)]">Déc.</span>
              <span className={`max-w-[58%] truncate text-right text-[8px] font-semibold ${COCKPIT_T5_DETAIL_VALUE}`}>
                {cashDetail != null ? formatSignedAmount(-Math.abs(cashDetail.decaissements), cashDetail.currency) : "—"}
              </span>
            </div>
          </div>
          <span className={`mt-2 inline-block max-w-full truncate text-[8px] ${cashMasterPill.className}`}>
            {cashMasterPill.label}
          </span>
        </button>
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
