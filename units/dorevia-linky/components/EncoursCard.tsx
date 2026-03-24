"use client";

/**
 * EncoursCard — Instrument Encours (créances clients ouvertes)
 * SPEC_LINKY_COCKPIT_INSTRUMENTS_v1.0 — instrument: encours (receivables)
 *
 * Affiche le détail des encours clients : top partenaires, montants échus/non échus,
 * alertes sur les factures sans date d'échéance.
 */

import { useState } from "react";
import { formatAmount } from "@/app/lib/format";
import { IconEncours } from "@/components/CardIcons";
import {
  INSTRUMENT_CARD_BASE,
  InstrumentCardHeader,
  InstrumentCardNav,
  InstrumentCardStatusBadge,
  InstrumentCardFooter,
} from "@/components/InstrumentCardChrome";
import type { CardId } from "@/app/types/linky-tiles";
import { InstrumentCardEvolutionBlock } from "@/components/InstrumentCardEvolutionBlock";
import { EVOLUTION_EMPTY_MESSAGE } from "@/app/lib/evolution-block-constants";
import { DualSeriesChart } from "@/components/DualSeriesChart";
import type { SeriesPoint } from "@/app/types/aggregations";
import type { ChartType } from "@/app/lib/chart-type";
import type { ArByPartnerDetail } from "@/app/api/dashboard-metrics/route";

interface EncoursCardProps {
  arByPartner: ArByPartnerDetail | null;
  currency?: string;
  loading?: boolean;
  error?: boolean;
  onFocusRequest?: () => void;
  cardId?: CardId;
  onNavigateToCard?: (cardId: CardId) => void;
  onBackToCockpit?: () => void;
  /** Série Évolution (snapshots AR / receivables_overdue) — si ≥ 2 points, bloc en available */
  arSeries?: SeriesPoint[];
  evolutionError?: boolean;
  onEvolutionRetry?: () => void;
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="h-4 w-32 animate-pulse rounded bg-[var(--hover)]" />
      <div className="h-4 w-20 animate-pulse rounded bg-[var(--hover)]" />
    </div>
  );
}

export function EncoursCard({
  arByPartner,
  currency = "EUR",
  loading,
  error,
  onFocusRequest,
  cardId,
  onNavigateToCard,
  onBackToCockpit,
  arSeries = [],
  evolutionError = false,
  onEvolutionRetry,
}: EncoursCardProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const totals = arByPartner?.totals;
  const partners = arByPartner?.partners ?? [];
  const openAmount = totals?.open_amount ?? null;
  const overdueAmount = totals?.overdue_amount ?? null;
  const openCount = totals?.open_count_invoices ?? 0;
  const overdueCount = totals?.overdue_count_invoices ?? 0;
  const missingDueDateCount = totals?.missing_due_date_count ?? 0;
  const freshness = arByPartner?.meta?.freshness ?? null;
  const warnings = arByPartner?.meta?.warnings ?? [];

  const overdueRatio =
    openAmount != null && openAmount > 0 && overdueAmount != null
      ? (overdueAmount / openAmount) * 100
      : 0;

  const topPartners = partners.slice(0, 5);

  const encoursBadge =
    overdueAmount != null && overdueAmount > 0
      ? (overdueRatio > 20 ? "vigilance" : "vigilance" as const)
      : undefined;
  const encoursBadgeLabel =
    overdueAmount != null && overdueAmount > 0
      ? (overdueRatio > 20 ? "À surveiller" : "Retard partiel")
      : null;

  const iconNode = onFocusRequest ? (
    <button
      type="button"
      onClick={onFocusRequest}
      className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors"
      aria-label="Ouvrir le détail Encours"
    >
      <IconEncours className="h-6 w-6 shrink-0 text-[var(--accent)]" />
    </button>
  ) : (
    <IconEncours className="h-6 w-6 shrink-0 text-[var(--accent)]" />
  );

  const footerMeta =
    freshness != null
      ? `Source : Vault · ar-by-partner · ${freshness === "event_driven" ? "temps réel" : freshness === "snapshot" ? "instantané" : freshness}`
      : "Source : Vault · ar-by-partner";

  if (loading) {
    return (
      <section className={INSTRUMENT_CARD_BASE} aria-label="Encours clients — chargement">
        {cardId && onNavigateToCard && (
          <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} onBackToCockpit={onBackToCockpit} />
        )}
        <InstrumentCardHeader icon={iconNode} title="ENCOURS" kpiValue={<div className="skeleton h-6 w-28" />} />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        </div>
      </section>
    );
  }

  return (
    <section className={INSTRUMENT_CARD_BASE} role="region" aria-label="Instrument Encours — créances clients ouvertes">
      {cardId && onNavigateToCard && (
        <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} onBackToCockpit={onBackToCockpit} />
      )}
      <InstrumentCardHeader
        icon={iconNode}
        title="ENCOURS"
        badges={
          encoursBadgeLabel ? (
            <InstrumentCardStatusBadge label={encoursBadgeLabel} severity={encoursBadge ?? "vigilance"} />
          ) : undefined
        }
        kpiLabel="Créances ouvertes"
        kpiValue={
          <span className={openAmount != null && openAmount > 0 ? "text-[var(--text)]" : "text-[var(--positive)]"}>
            {openAmount != null ? formatAmount(openAmount, currency) : "—"}
          </span>
        }
      />

      {error && (
        <div className="rounded-lg border border-[var(--negative)]/30 bg-[var(--negative)]/10 px-3 py-2 text-sm text-[var(--negative)]">
          Données d&apos;encours indisponibles
        </div>
      )}

      {!error && (
        <>
          {/* Synthèse échus / non échus */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[var(--surface)] px-3 py-2 text-center">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Non échus</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-[var(--positive)]">
                {openAmount != null && overdueAmount != null
                  ? formatAmount(openAmount - overdueAmount, currency)
                  : "—"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{openCount - overdueCount > 0 ? `${openCount - overdueCount} facture${(openCount - overdueCount) > 1 ? "s" : ""}` : "—"}</p>
            </div>
            <div className="rounded-lg bg-[var(--surface)] px-3 py-2 text-center">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Échus</p>
              <p className={`mt-1 text-lg font-bold tabular-nums ${overdueAmount != null && overdueAmount > 0 ? "text-[var(--negative)]" : "text-[var(--positive)]"}`}>
                {overdueAmount != null ? formatAmount(overdueAmount, currency) : "—"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{overdueCount > 0 ? `${overdueCount} en retard` : "Aucun retard"}</p>
            </div>
          </div>

          {/* Barre échus */}
          {openAmount != null && openAmount > 0 && (
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-xs text-[var(--text-muted)]">
                <span>Taux d&apos;échéance dépassée</span>
                <span className={overdueRatio > 20 ? "text-[var(--negative)] font-medium" : ""}>
                  {overdueRatio.toFixed(1)} %
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[var(--border)]">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${overdueRatio > 20 ? "bg-[var(--negative)]" : overdueRatio > 5 ? "bg-[var(--warning)]" : "bg-[var(--positive)]"}`}
                  style={{ width: `${Math.min(100, overdueRatio)}%` }}
                />
              </div>
            </div>
          )}

          {/* Top partenaires */}
          {topPartners.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Top créanciers
              </p>
              <div className="space-y-1.5">
                {topPartners.map((p) => (
                  <div key={p.partner_id} className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-[var(--hover)] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text)]">
                        {p.partner_name ?? p.partner_id}
                      </p>
                      {p.overdue_amount > 0 && (
                        <p className="text-xs text-[var(--negative)]">
                          {formatAmount(p.overdue_amount, currency)} échu
                        </p>
                      )}
                    </div>
                    <div className="ml-3 text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums text-[var(--text)]">
                        {formatAmount(p.open_amount, currency)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {p.share_percent.toFixed(1)} %
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {partners.length > 5 && (
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  + {partners.length - 5} autre{partners.length - 5 > 1 ? "s" : ""} créancier{partners.length - 5 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          {/* Alertes */}
          {missingDueDateCount > 0 && (
            <div className="mb-3 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-3 py-2">
              <p className="text-xs font-medium text-[var(--warning)]">
                {missingDueDateCount} facture{missingDueDateCount > 1 ? "s" : ""} sans date d&apos;échéance
              </p>
            </div>
          )}

          {warnings.map((w, i) => (
            <div key={i} className="mb-2 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-3 py-2">
              <p className="text-xs text-[var(--warning)]">{w}</p>
            </div>
          ))}

          {/* Aucun encours */}
          {openAmount === 0 && (
            <div className="rounded-lg border border-[var(--positive)]/30 bg-[var(--positive)]/10 px-3 py-2">
              <p className="text-sm font-medium text-[var(--positive)]">Aucune créance ouverte</p>
            </div>
          )}

        </>
      )}

      <InstrumentCardEvolutionBlock
        storageKey="linky-encours-evolution"
        state={arSeries.length >= 2 ? "available" : evolutionError ? "error" : "empty"}
        onRetry={onEvolutionRetry}
        emptyMessage={EVOLUTION_EMPTY_MESSAGE}
        chartType={chartType}
        onChartTypeChange={setChartType}
        chartGranularity="month"
        onChartGranularityChange={() => {}}
        availableGranularities={["month"]}
      >
        {arSeries.length >= 2 && (
          <DualSeriesChart
            series1={arSeries}
            series2={[]}
            total1={arSeries.reduce((s, p) => s + p.amount, 0)}
            total2={0}
            label1="Encours échus"
            label2=""
            granularity="month"
            chartType={chartType}
            currency={currency}
            showSeries2={false}
          />
        )}
      </InstrumentCardEvolutionBlock>
      {!error && <InstrumentCardFooter meta={footerMeta} />}
    </section>
  );
}
