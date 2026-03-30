"use client";

import { Icon } from "@/components/Icon";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { CompactTile, type ConfidenceLevel } from "@/components/InstrumentCardChrome";
import { DivaFlashBlock } from "@/components/DivaFlashBlock";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import type { PeriodRange } from "@/app/lib/period-utils";
import type { CardId } from "@/app/types/linky-tiles";
import { computeConfidenceScore } from "@/app/lib/confidence";
import { navHrefWithTenant } from "@/components/layout/navTenantHref";
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

const SECONDARY_B: { id: CardId; icon: string; label: string; metricKey: string; href?: string }[] = [
  { id: "working_capital", icon: "account_balance_wallet", label: "BFR", metricKey: "working_capital" },
  { id: "encours", icon: "pending_actions", label: "Encours", metricKey: "encours", href: "/encours" },
  { id: "taxes", icon: "receipt_long", label: "Taxes", metricKey: "taxes" },
  { id: "ebitda", icon: "trending_up", label: "EBE", metricKey: "ebitda" },
];

const SECONDARY_C: { id: CardId; icon: string; label: string; metricKey: string }[] = [
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
  const h = (p: string) => navHrefWithTenant(p, tenantId);

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
    <main className="flex flex-1 flex-col gap-3 px-4 pb-24 pt-0">
      {/* Cartes maîtresses — lecture métier d’abord ; score de confiance après le bloc A (T-PH-001 bis) */}
      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onSelectCard?.("treasury")}
          className={`w-full rounded-2xl bg-[var(--card)] p-4 text-left shadow-sm transition-all active:scale-[0.99] ${treasuryOutline}`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className={COCKPIT_T4_CARD_LABEL}>Trésorerie</span>
            <span
              className={`inline-flex max-w-[10rem] shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight ${treasuryPrimaryBadge.mobileClassName}`}
              title={treasury?.status_reason ?? undefined}
            >
              <Icon
                name={treasuryPrimaryBadge.iconName}
                size={12}
                filled={treasuryTile.treasuryStatus === "ok"}
              />
              <span className="truncate">{treasuryPrimaryBadge.label}</span>
            </span>
          </div>
          <CockpitMasterKpiValue display={formatKpi(treasury)} variant="mobile" mobileWeight="black" />
          <p className={`mt-0.5 ${COCKPIT_T5_CAPTION}`}>Solde validé (Vault)</p>
          <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3 text-left">
            <div title="Part des flux couverts par preuve bancaire">
              <div className="flex justify-between gap-2">
                <span className={COCKPIT_T4_MICRO_UPPER}>Couverture probante</span>
                <span className={`tabular-nums ${COCKPIT_T5_DETAIL_VALUE}`}>
                  {treasuryTile.coveragePct != null ? `${treasuryTile.coveragePct} %` : "—"}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--coverage-track)]">
                <div
                  className={`h-full rounded-full ${
                    treasuryTile.treasuryStatus === "ok"
                      ? "bg-[var(--confidence-fiable)]"
                      : "bg-[var(--coverage-fill-muted)]"
                  }`}
                  style={{ width: treasuryTile.coveragePct != null ? `${treasuryTile.coveragePct}%` : "0%" }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-2">
              <div className="flex justify-between gap-2">
                <span className={COCKPIT_T5_DETAIL_LABEL}>Écart ERP − Vault</span>
                <span className={`max-w-[55%] truncate text-right ${COCKPIT_T5_DETAIL_VALUE}`}>
                  {treasuryTile.erpDeltaFormatted ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className={COCKPIT_T5_DETAIL_LABEL}>À rapprocher</span>
                <span className={`max-w-[55%] truncate text-right ${COCKPIT_T5_DETAIL_VALUE}`}>
                  {treasuryTile.rapproFormatted ?? "—"}
                </span>
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectCard?.("business")}
          className={`w-full rounded-2xl bg-[var(--card)] p-4 text-left shadow-sm transition-all active:scale-[0.99] ${businessOutline}`}
        >
          <div className="flex items-center gap-2">
            <Icon name="business_center" size={18} className="shrink-0 text-[var(--muted)]" />
            <span className={COCKPIT_T4_CARD_LABEL}>Business</span>
          </div>
          <CockpitMasterKpiValue display={formatKpi(business)} variant="mobile" mobileWeight="bold" />
          <p className={`mt-0.5 ${COCKPIT_T5_CAPTION}`}>Ventes nettes après achats (période)</p>
          <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
            <div className="flex justify-between gap-2">
              <span className={COCKPIT_T5_DETAIL_LABEL}>Ventes</span>
              <span className={`shrink-0 ${COCKPIT_T5_DETAIL_VALUE}`}>
                {businessDetail != null ? formatSignedAmount(businessDetail.ventes, businessDetail.currency) : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className={COCKPIT_T5_DETAIL_LABEL}>Achats</span>
              <span className={`shrink-0 ${COCKPIT_T5_DETAIL_VALUE}`}>
                {businessDetail != null ? formatSignedAmount(-Math.abs(businessDetail.achats), businessDetail.currency) : "—"}
              </span>
            </div>
          </div>
          <span className={`mt-3 inline-flex max-w-full items-center truncate text-xs ${businessMasterPill.className}`}>
            {businessMasterPill.label}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectCard?.("cash")}
          className={`w-full rounded-2xl bg-[var(--card)] p-4 text-left shadow-sm transition-all active:scale-[0.99] ${cashOutline}`}
        >
          <div className="flex items-center gap-2">
            <Icon name="swap_vert" size={18} className="shrink-0 text-[var(--muted)]" />
            <span className={COCKPIT_T4_CARD_LABEL}>Flux Net</span>
          </div>
          <CockpitMasterKpiValue display={formatKpi(cash)} variant="mobile" mobileWeight="bold" />
          <p className={`mt-0.5 ${COCKPIT_T5_CAPTION}`}>Encaissements et décaissements (période)</p>
          <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
            <div className="flex justify-between gap-2">
              <span className={COCKPIT_T5_DETAIL_LABEL}>Encaissements</span>
              <span className={`shrink-0 ${COCKPIT_T5_DETAIL_VALUE}`}>
                {cashDetail != null ? formatSignedAmount(cashDetail.encaissements, cashDetail.currency) : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className={COCKPIT_T5_DETAIL_LABEL}>Décaissements</span>
              <span className={`shrink-0 ${COCKPIT_T5_DETAIL_VALUE}`}>
                {cashDetail != null ? formatSignedAmount(-Math.abs(cashDetail.decaissements), cashDetail.currency) : "—"}
              </span>
            </div>
          </div>
          <span className={`mt-3 inline-flex max-w-full items-center truncate text-xs ${cashMasterPill.className}`}>
            {cashMasterPill.label}
          </span>
        </button>
      </section>

      {integrityScore != null ? (
        <div className="flex flex-wrap items-center gap-2 px-0.5" aria-label="Confiance des données scellées">
          <ConfidenceScore score={integrityScore} compact />
        </div>
      ) : null}

      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Indicateurs clés</p>
        <div className="grid grid-cols-2 gap-3">
          {SECONDARY_B.map((tile) => {
            const metric = metrics?.[tile.metricKey as keyof DashboardMetricsResponse] as
              | { value?: unknown; formatted?: string; valueKind?: string }
              | undefined;
            return (
              <CompactTile
                key={tile.id}
                icon={tile.icon}
                label={tile.label}
                value={formatKpi(metric)}
                confidence={inferConfidence(metric)}
                href={tile.href ? h(tile.href) : undefined}
                onClick={tile.href ? undefined : () => onSelectCard?.(tile.id)}
              />
            );
          })}
        </div>
      </section>

      <details className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 shadow-sm open:pb-3">
        <summary className="cursor-pointer list-none py-2 text-sm font-semibold text-[var(--text)] marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            Capteurs complémentaires
            <Icon name="expand_more" size={20} className="text-[var(--muted)] transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3">
          {SECONDARY_C.map((tile) => {
            const metric = metrics?.[tile.metricKey as keyof DashboardMetricsResponse] as
              | { value?: unknown; formatted?: string; valueKind?: string }
              | undefined;
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
        </div>
      </details>

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
