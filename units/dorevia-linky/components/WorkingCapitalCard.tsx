"use client";

/**
 * WorkingCapitalCard — Instrument BFR (Besoin en Fonds de Roulement)
 * SPEC_LINKY_COCKPIT_INSTRUMENTS_v1.0 — instrument: working_capital
 *
 * BFR = Créances clients (AR open) - Dettes fournisseurs (AP open)
 * Stocks : hors périmètre Vault.
 */

import { useState } from "react";
import { formatAmount, formatSignedAmount } from "@/app/lib/format";
import { IconWorkingCapital } from "@/components/CardIcons";
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

interface WorkingCapitalCardProps {
  arByPartner?: ArByPartnerDetail | null;
  apByPartner?: ArByPartnerDetail | null;
  currency?: string;
  loading?: boolean;
  onFocusRequest?: () => void;
  cardId?: CardId;
  onNavigateToCard?: (cardId: CardId) => void;
  /** Série Évolution (snapshots BFR = AR − AP) — si ≥ 2 points, bloc en available */
  bfrSeries?: SeriesPoint[];
  evolutionError?: boolean;
  onEvolutionRetry?: () => void;
}

function ProgressBar({ pct, colorClass }: { pct: number; colorClass: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--border)]">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

export function WorkingCapitalCard({
  arByPartner,
  apByPartner,
  currency = "EUR",
  loading = false,
  onFocusRequest,
  cardId,
  onNavigateToCard,
  bfrSeries = [],
  evolutionError = false,
  onEvolutionRetry,
}: WorkingCapitalCardProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const arOpen = arByPartner?.totals?.open_amount ?? null;
  const arOverdue = arByPartner?.totals?.overdue_amount ?? null;
  const arCount = arByPartner?.totals?.open_count_invoices ?? 0;
  const arOverdueCount = arByPartner?.totals?.overdue_count_invoices ?? 0;
  const missingDueDateCount = arByPartner?.totals?.missing_due_date_count ?? 0;

  const apOpen = apByPartner?.totals?.open_amount ?? null;
  const apOverdue = apByPartner?.totals?.overdue_amount ?? null;
  const apCount = apByPartner?.totals?.open_count_invoices ?? 0;

  // BFR = AR - AP (si AP disponible) ; sinon proxy = AR only
  const bfr = arOpen != null && apOpen != null ? arOpen - apOpen : arOpen;
  const hasFullData = arOpen != null && apOpen != null;

  const overdueRatio = arOpen != null && arOpen > 0 && arOverdue != null
    ? (arOverdue / arOpen) * 100
    : 0;

  const bfrStatus =
    bfr == null ? "neutral"
    : bfr < 0 ? "danger"
    : bfr < (arOpen ?? 0) * 0.2 ? "warning"
    : "ok";

  const statusSeverity =
    bfrStatus === "danger" ? "alert" as const
    : bfrStatus === "warning" ? "vigilance" as const
    : bfr != null && bfr > 0 ? "success" as const
    : "info" as const;

  const statusLabelShort =
    bfr == null ? "Données non disponibles"
    : bfr < 0 ? "BFR négatif"
    : bfr === 0 ? "Cycle équilibré"
    : hasFullData ? "Créances > dettes"
    : "Créances actives";

  const iconNode = onFocusRequest ? (
    <button
      type="button"
      onClick={onFocusRequest}
      className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors"
      aria-label="Voir le détail BFR"
    >
      <IconWorkingCapital className="h-6 w-6 shrink-0 text-[var(--accent)]" />
    </button>
  ) : (
    <IconWorkingCapital className="h-6 w-6 shrink-0 text-[var(--accent)]" />
  );

  const kpiColor =
    bfrStatus === "danger" ? "text-[var(--negative)]"
    : bfrStatus === "warning" ? "text-[var(--warning)]"
    : bfr != null && bfr > 0 ? "text-[var(--positive)]"
    : "text-[var(--text-secondary)]";

  if (loading) {
    return (
      <section className={INSTRUMENT_CARD_BASE} role="region" aria-label="Instrument BFR — chargement">
        {cardId && onNavigateToCard && (
          <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
        )}
        <InstrumentCardHeader icon={iconNode} title="BFR" kpiValue={<div className="skeleton h-6 w-28" />} />
        <div className="space-y-3">
          <div className="h-10 animate-pulse rounded-lg bg-[var(--hover)]" />
          <div className="h-4 animate-pulse rounded bg-[var(--hover)]" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--hover)]" />
        </div>
      </section>
    );
  }

  return (
    <section
      className={INSTRUMENT_CARD_BASE}
      role="region"
      aria-label="Instrument BFR — Besoin en Fonds de Roulement"
    >
      {cardId && onNavigateToCard && (
        <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
      )}
      <InstrumentCardHeader
        icon={iconNode}
        title="BFR"
        badges={<InstrumentCardStatusBadge label={statusLabelShort} severity={statusSeverity} />}
        kpiLabel={hasFullData ? "BFR net (AR − AP)" : "Créances clients"}
        kpiValue={
          <span className={kpiColor}>
            {bfr != null ? formatSignedAmount(bfr, currency) : "—"}
          </span>
        }
      />

      {/* Body : expansion éditoriale + détail */}
      <p className="mb-2 text-xs text-[var(--text-muted)]">
        Besoin en fonds de roulement · {hasFullData ? "Cycle d'exploitation · AR − AP" : "Créances clients"}
      </p>

          {/* Deux colonnes : AR et AP */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            {/* AR */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs font-medium text-[var(--text-secondary)]">Créances clients</p>
              <p className="mt-1 text-base font-bold tabular-nums text-[var(--text)]">
                {arOpen != null ? formatAmount(arOpen, currency) : "—"}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {arCount > 0 ? `${arCount} facture${arCount > 1 ? "s" : ""}` : "Aucune"}
                {arOverdueCount > 0 ? ` · ${arOverdueCount} échu${arOverdueCount > 1 ? "s" : ""}` : ""}
              </p>
              {arOverdue != null && arOverdue > 0 && (
                <p className="mt-0.5 text-xs text-[var(--negative)]">
                  {formatAmount(arOverdue, currency)} échus
                </p>
              )}
            </div>

            {/* AP */}
            <div className={`rounded-lg border px-3 py-2 ${apOpen != null ? "border-[var(--border)] bg-[var(--surface)]" : "border-dashed border-[var(--border)] bg-[var(--surface)]"}`}>
              <p className="text-xs font-medium text-[var(--text-secondary)]">Dettes fournisseurs</p>
              {apOpen != null ? (
                <>
                  <p className="mt-1 text-base font-bold tabular-nums text-[var(--text)]">
                    {formatAmount(apOpen, currency)}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {apCount > 0 ? `${apCount} facture${apCount > 1 ? "s" : ""}` : "Aucune"}
                    {apOverdue != null && apOverdue > 0 ? ` · ${formatAmount(apOverdue, currency)} échus` : ""}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs text-[var(--text-muted)]">Non disponible</p>
              )}
            </div>
          </div>

          {/* Barre échus */}
          {arOpen != null && arOpen > 0 && (
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-xs text-[var(--text-muted)]">
                <span>Taux échus (clients)</span>
                <span>{overdueRatio.toFixed(1)} %</span>
              </div>
              <ProgressBar
                pct={overdueRatio}
                colorClass={overdueRatio > 20 ? "bg-[var(--negative)]" : overdueRatio > 5 ? "bg-[var(--warning)]" : "bg-[var(--positive)]"}
              />
            </div>
          )}

          {/* Avertissements */}
          {missingDueDateCount > 0 && (
            <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="text-xs text-[var(--warning)]">
                {missingDueDateCount} facture{missingDueDateCount > 1 ? "s" : ""} sans date d&apos;échéance
              </p>
            </div>
          )}

          {/* Note stocks */}
          <div className="flex items-center justify-between rounded-lg border border-dashed border-[var(--border)] px-3 py-2">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">Stocks</p>
              <p className="text-xs text-[var(--text-muted)]">Valorisation inventaire</p>
            </div>
            <span className="rounded bg-[var(--surface)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
              Hors périmètre
            </span>
          </div>

      <InstrumentCardEvolutionBlock
        storageKey="linky-bfr-evolution"
        state={bfrSeries.length >= 2 ? "available" : evolutionError ? "error" : "empty"}
        onRetry={onEvolutionRetry}
        emptyMessage={EVOLUTION_EMPTY_MESSAGE}
        chartType={chartType}
        onChartTypeChange={setChartType}
        chartGranularity="month"
        onChartGranularityChange={() => {}}
        availableGranularities={["month"]}
      >
        {bfrSeries.length >= 2 && (
          <DualSeriesChart
            series1={bfrSeries}
            series2={[]}
            total1={bfrSeries.reduce((s, p) => s + p.amount, 0)}
            total2={0}
            label1="BFR net"
            label2=""
            granularity="month"
            chartType={chartType}
            currency={currency}
            showSeries2={false}
          />
        )}
      </InstrumentCardEvolutionBlock>

      <InstrumentCardFooter
        meta={`Cycle d'exploitation · AR − AP · Source Vault${apOpen != null ? " · ar-by-partner · ap-by-partner" : " · ar-by-partner"}`}
      />
    </section>
  );
}
