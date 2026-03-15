"use client";

import { useState } from "react";
import { formatAmount, formatNumber } from "@/app/lib/format";
import { IconTreasury } from "@/components/CardIcons";
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

export interface TresoreriePositionData {
  position?: {
    erp_balance?: number | null;
    validated_balance?: number;
    unvalidated_exposure?: number | null;
  };
  reconciliation_rate?: number | null;
  currency?: string;
  /** Couverture structurelle (mois) — Position validée ÷ masse salariale mensuelle (SPEC Masse Salariale P0) */
  couverture_salariale_mois?: number | null;
  flags?: {
    large_delta?: boolean;
    sign_mismatch?: boolean;
    structural_delta?: boolean;
  };
  generated_at?: string | null;
}

interface TresoreriePositionCardProps {
  data: TresoreriePositionData | null;
  loading: boolean;
  onRefresh?: () => void;
  /** Slot rendu après le footer standard (ex. DivaFlashBlock) */
  footer?: React.ReactNode;
  /** Navigation card → card (lien Précédent / Suivant en haut) */
  cardId?: CardId;
  onNavigateToCard?: (cardId: CardId) => void;
  /** Série Évolution (snapshots trésorerie) — si ≥ 2 points, bloc en available (spec §10.2) */
  treasurySeries?: SeriesPoint[];
  evolutionError?: boolean;
  onEvolutionRetry?: () => void;
}

function formatSnapshotDate(iso: string | null | undefined): string {
  if (!iso || typeof iso !== "string") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** NO_DATA si validated_balance, unvalidated_exposure et reconciliation_rate sont tous null ou 0 */
function isNoData(d: TresoreriePositionData | null | undefined): boolean {
  if (!d) return true;

  const vb = d.position?.validated_balance ?? null;
  const uv = d.position?.unvalidated_exposure ?? null;
  const rate = d.reconciliation_rate ?? null;

  const vbEmpty = vb == null || vb === 0;
  const uvEmpty = uv == null || uv === 0;
  const rateEmpty = rate == null || rate === 0;

  return vbEmpty && uvEmpty && rateEmpty;
}

function getUiState(
  noData: boolean,
  rate: number | null | undefined,
  largeDelta: boolean | undefined
): "no_data" | "tension" | "vigilance" | "normal" {
  if (noData) return "no_data";
  if (rate != null && rate < 70) return "tension";
  if (largeDelta || (rate != null && rate >= 70 && rate < 90)) return "vigilance";
  return "normal";
}

export function TresoreriePositionCard({
  data,
  loading,
  onRefresh,
  footer,
  cardId,
  onNavigateToCard,
  treasurySeries = [],
  evolutionError = false,
  onEvolutionRetry,
}: TresoreriePositionCardProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const currency = data?.currency ?? "EUR";
  const pos = data?.position;
  const erpBalance = pos?.erp_balance;
  const validatedBalance = pos?.validated_balance ?? 0;
  const rate = data?.reconciliation_rate;
  const rateRounded = rate != null && !Number.isNaN(rate) ? Math.round(rate) : null;
  const generatedAt = data?.generated_at;
  const largeDelta = data?.flags?.large_delta;

  const couvertureMois = data?.couverture_salariale_mois;
  const noData = isNoData(data);
  const uiState = getUiState(noData, rateRounded, largeDelta);
  const dateStr = formatSnapshotDate(generatedAt);

  const couvertureFormatted =
    couvertureMois != null && Number.isFinite(couvertureMois)
      ? formatNumber(couvertureMois, { minFraction: 0, maxFraction: 2 })
      : "—";

  const hasVigilance = uiState === "vigilance" || uiState === "tension";
  const statusLabel =
    uiState === "tension" ? "Validation partielle" : uiState === "vigilance" ? "Écart à analyser" : null;
  const footerStatusLabel = hasVigilance ? statusLabel : "Validée";
  const badgeSeverity = uiState === "tension" ? "vigilance" : uiState === "vigilance" ? "vigilance" : undefined;

  const couvertureDisplay =
    couvertureMois != null && Number.isFinite(couvertureMois)
      ? `${couvertureFormatted} mois`
      : "Non disponible";

  if (loading && !data) {
    return (
      <section className={`${INSTRUMENT_CARD_BASE} border-[var(--warning)]`}>
        {cardId && onNavigateToCard && (
          <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
        )}
        <InstrumentCardHeader
          icon={<IconTreasury className="h-6 w-6 shrink-0 text-[var(--accent)]" />}
          title="TRÉSORERIE"
        />
        <div className="space-y-3">
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-4 w-24" />
        </div>
        <InstrumentCardFooter meta="Dernière mise à jour : —" />
      </section>
    );
  }

  return (
    <section className={`${INSTRUMENT_CARD_BASE} border-[var(--warning)]`}>
      {cardId && onNavigateToCard && (
        <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
      )}
      <InstrumentCardHeader
        icon={<IconTreasury className="h-6 w-6 shrink-0 text-[var(--accent)]" />}
        title="TRÉSORERIE"
        badges={
          statusLabel ? (
            <InstrumentCardStatusBadge
              label={statusLabel}
              severity={badgeSeverity}
              title="Niveau de validation des flux"
            />
          ) : undefined
        }
        kpiLabel="Trésorerie validée Vault"
        kpiValue={
          <span className="text-[var(--warning)]">{noData ? "—" : formatAmount(validatedBalance, currency)}</span>
        }
      />

      {uiState === "no_data" && (
        <p className="mb-3 text-sm text-[var(--text-secondary)] italic">Aucune donnée disponible</p>
      )}

      {/* Body : lignes secondaires — libellés courts */}
      <div className="space-y-2 text-sm">
        {erpBalance != null && (
          <div
            className="flex justify-between items-baseline gap-4"
            title="Solde banque issu de la comptabilité (ERP)"
          >
            <span className="text-[var(--text-secondary)]">Solde comptable ERP</span>
            <span className="font-semibold tabular-nums text-[var(--text)]">
              {formatAmount(erpBalance, currency)}
            </span>
          </div>
        )}
        {erpBalance == null && (
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-[var(--text-secondary)]">Solde comptable ERP</span>
            <span className="text-xs italic text-[var(--text-secondary)]">Non configuré</span>
          </div>
        )}

        <div
          className="flex justify-between items-baseline gap-4"
          title="Pourcentage des flux couverts par preuve bancaire"
        >
          <span className="text-[var(--text-secondary)]">Couverture probante</span>
          <span className="font-semibold tabular-nums text-[var(--text)]">
            {noData ? "—" : rateRounded != null ? `${rateRounded} %` : "—"}
          </span>
        </div>

        <div
          className="flex justify-between items-baseline gap-4"
          title="Position validée ÷ masse salariale mensuelle (mois de trésorerie)"
        >
          <span className="text-[var(--text-secondary)]">Couverture structurelle</span>
          <span className="font-semibold tabular-nums text-[var(--text)]">
            {couvertureDisplay}
          </span>
        </div>
      </div>

      <InstrumentCardEvolutionBlock
        storageKey="linky-tresorerie-position-evolution"
        state={treasurySeries.length >= 2 ? "available" : evolutionError ? "error" : "empty"}
        onRetry={onEvolutionRetry}
        emptyMessage={EVOLUTION_EMPTY_MESSAGE}
        chartType={chartType}
        onChartTypeChange={setChartType}
        chartGranularity="month"
        onChartGranularityChange={() => {}}
        availableGranularities={["month"]}
      >
        {treasurySeries.length >= 2 && (
          <DualSeriesChart
            series1={treasurySeries}
            series2={[]}
            total1={treasurySeries.reduce((s, p) => s + p.amount, 0)}
            total2={0}
            label1="Trésorerie validée"
            label2=""
            granularity="month"
            chartType={chartType}
            currency={currency}
            showSeries2={false}
          />
        )}
      </InstrumentCardEvolutionBlock>

      <InstrumentCardFooter
        meta={
          <>
            {dateStr !== "—" ? `Lecture au ${dateStr}` : "Lecture : —"}
            <span className="mx-1.5">·</span>
            Source Vault + ERP
            <span className="mx-1.5">·</span>
            {footerStatusLabel}
          </>
        }
      />

      {footer}
    </section>
  );
}
