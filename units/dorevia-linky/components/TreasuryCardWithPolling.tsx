"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { PeriodRange } from "@/app/lib/period-utils";
import { formatAmount } from "@/app/lib/format";
import { DualSeriesChart } from "@/components/DualSeriesChart";
import { CardChartSection } from "@/components/CardChartSection";
import { IconTreasury } from "@/components/CardIcons";
import {
  INSTRUMENT_CARD_BASE,
  InstrumentCardHeader,
  InstrumentCardNav,
  InstrumentCardStatusBadge,
  InstrumentCardFooter,
} from "@/components/InstrumentCardChrome";
import type { CardId } from "@/app/types/linky-tiles";
import { getAvailableGranularities, getDefaultChartGranularity, type ChartGranularity } from "@/app/lib/chart-granularity";
import type { ChartType } from "@/app/lib/chart-type";
import type { SeriesPoint } from "@/app/types/aggregations";

const POLL_INTERVAL_MS = 5 * 1000; // 5 s — sync Linky / Vault / Odoo < 7 s
const ENABLE_LIVE_POLLING = process.env.NEXT_PUBLIC_LINKY_ENABLE_LIVE_POLLING === "1";

interface TreasuryData {
  total?: number;
  reconciled?: number;
  unreconciled?: number;
  reconciliation_rate?: number | null;
  currency?: string;
  error?: string;
  unreconciled_lines_count?: number | null;
  oldest_unreconciled_date?: string | null;
  journals_count?: number | null;
  last_statement_import_date?: string | null;
  /** SPEC Trésorerie v4.1 */
  generated_at?: string | null;
  position?: {
    validated_balance?: number;
    erp_balance?: number | null;
    unvalidated_exposure?: number | null;
    reliability_position?: number | null;
  };
  process?: {
    reconciled_volume?: number;
    unreconciled_volume?: number;
    reliability_volume?: number;
    /** Sprint 5 — "confirmation" = événements financiers ; "proxy" = lignes bancaires */
    source?: "confirmation" | "proxy";
  };
  /** Sprint 5 — Métriques confirmation bancaire (événements financiers) */
  confirmation?: {
    total_amount_abs?: number;
    confirmed_amount_abs?: number;
    unconfirmed_amount_abs?: number;
    confirmation_rate?: number;
    full_count?: number;
    partial_count?: number;
    unconfirmed_count?: number;
  };
  flags?: {
    sign_mismatch?: boolean;
    large_delta?: boolean;
    structural_delta?: boolean;
  };
  /** SPEC Carte Paiements v1.1 — contrôle complétude avant affichage KPI */
  completeness_check?: { ok: boolean; badge: string; message: string } | null;
  /** SPEC web38 — Reste à rapprocher */
  reconciliation_metrics?: {
    total_amount_abs?: number;
    reconciled_amount_abs?: number;
    remaining_amount_abs?: number;
    remaining_ratio?: number;
    generated_at?: string;
  } | null;
}

interface TreasuryCardWithPollingProps {
  period: PeriodRange;
  companyId: string | null;
  tenantId: string;
  /** Source : Linky ne voit que le Vault (toujours "vault") */
  primarySource?: "erp" | "vault";
  onFocusRequest?: () => void;
  footer?: React.ReactNode;
  cardId?: CardId;
  onNavigateToCard?: (cardId: CardId) => void;
}

const ODOO_BASE_URL =
  process.env.NEXT_PUBLIC_ODOO_URL ?? "https://odoo.stinger.sarl-la-platine.doreviateam.com/odoo";

function formatDateOnly(d: string | null | undefined): string {
  if (!d || typeof d !== "string") return "—";
  const dt = new Date(d + "T00:00:00");
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(d: string | null | undefined): string {
  if (!d || typeof d !== "string") return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TreasuryCardWithPolling({ period, companyId, tenantId, primarySource = "vault", onFocusRequest, footer, cardId, onNavigateToCard }: TreasuryCardWithPollingProps) {
  const availableGranularities = getAvailableGranularities(period.from, period.to);
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>(() =>
    getDefaultChartGranularity(period.from, period.to)
  );
  useEffect(() => {
    const available = getAvailableGranularities(period.from, period.to);
    setChartGranularity((prev) =>
      available.includes(prev) ? prev : getDefaultChartGranularity(period.from, period.to)
    );
  }, [period.from, period.to]);
  const handleGranularityChange = useCallback((g: ChartGranularity) => setChartGranularity(g), []);
  const [chartType, setChartType] = useState<ChartType>("pie");
  const handleChartTypeChange = useCallback((t: ChartType) => setChartType(t), []);
  const [data, setData] = useState<TreasuryData | null>(null);
  const [loading, setLoading] = useState(true);
  const prevRateRef = useRef<number | null>(null);
  const [isCelebrating100, setIsCelebrating100] = useState(false);
  const [evolutionSeries, setEvolutionSeries] = useState<{ seriesReconciled: SeriesPoint[]; seriesUnreconciled: SeriesPoint[] }>({
    seriesReconciled: [],
    seriesUnreconciled: [],
  });

  const fetchData = useCallback(async () => {
    // Ne pas afficher le loading lors du polling : uniquement au premier chargement
    if (!data) setLoading(true);
    const params = new URLSearchParams({
      tenant: tenantId,
      date_debut: period.from,
      date_fin: period.to,
      ...(companyId && { company_id: companyId }),
    });
    const evolutionParams = new URLSearchParams({
      tenant: tenantId,
      date_debut: period.from,
      date_fin: period.to,
      ...(companyId && { company_id: companyId }),
    });
    try {
      const [res, evolutionRes] = await Promise.all([
        fetch(`/api/treasury?${params}`, { cache: "no-store", headers: { Accept: "application/json" } }),
        fetch(`/api/treasury-evolution?${evolutionParams}`, { cache: "no-store", headers: { Accept: "application/json" } }),
      ]);
      const json = await res.json();
      setData(json);
      if (evolutionRes.ok) {
        const ev = await evolutionRes.json();
        setEvolutionSeries({
          seriesReconciled: ev.series_reconciled ?? [],
          seriesUnreconciled: ev.series_unreconciled ?? [],
        });
      } else {
        setEvolutionSeries({ seriesReconciled: [], seriesUnreconciled: [] });
      }
    } catch {
      setData({ error: "treasury_unavailable" });
      setEvolutionSeries({ seriesReconciled: [], seriesUnreconciled: [] });
    } finally {
      setLoading(false);
    }
  }, [period.from, period.to, companyId, tenantId]);

  useEffect(() => {
    setData(null);
    setLoading(true);
    fetchData();
    const id = ENABLE_LIVE_POLLING ? setInterval(fetchData, POLL_INTERVAL_MS) : null;
    return () => {
      if (id) clearInterval(id);
    };
  }, [fetchData]);

  const currency = data?.currency ?? "EUR";
  const pos = data?.position;
  const proc = data?.process;
  const flags = data?.flags ?? {};
  const generatedAt = data?.generated_at;

  // V4.1 : position (net) vs process (volume)
  const validatedBalance = pos?.validated_balance ?? data?.reconciled ?? 0;
  const unvalidatedExposure = pos?.unvalidated_exposure ?? (pos?.erp_balance != null ? (pos.erp_balance - validatedBalance) : null);
  const erpBalance = pos?.erp_balance;
  const reliabilityPosition = pos?.reliability_position;

  const reconciledVol = proc?.reconciled_volume ?? data?.reconciled ?? 0;
  const unreconciledVol = proc?.unreconciled_volume ?? data?.unreconciled ?? 0;

  const journalsCount = data?.journals_count ?? null;
  const lastImportDate = data?.last_statement_import_date ?? null;

  // SPEC web38 — Reste à rapprocher (remaining_ratio 0–1 → %)
  const reconMetrics = data?.reconciliation_metrics;
  const remainingRatioPct =
    reconMetrics?.remaining_ratio != null && Number.isFinite(reconMetrics.remaining_ratio)
      ? reconMetrics.remaining_ratio * 100
      : null;
  const totalAmountAbs = reconMetrics?.total_amount_abs ?? 0;
  const reconciledAmountAbs = reconMetrics?.reconciled_amount_abs ?? 0;
  const remainingAmountAbs = reconMetrics?.remaining_amount_abs ?? 0;
  const completenessOk = data?.completeness_check?.ok === true;
  /** Afficher les données dès qu'on les a — même si complétude partielle (moins strict) */
  const showResteARapprocher = remainingRatioPct != null && totalAmountAbs > 0;

  /** Mode Gouvernance v1.0 — statut fiabilité dominant. Complétude KO → orange (données partielles), pas rouge. */
  type GovernanceStatus = "partial" | "critical" | "progress" | "ok";
  const governanceStatus: GovernanceStatus = !completenessOk
    ? "partial"
    : totalAmountAbs === 0
      ? "ok"
      : remainingRatioPct! > 30
        ? "critical"
        : remainingRatioPct! >= 10
          ? "progress"
          : "ok";

  const governanceConfig = {
    partial: {
      border: "border-l-[var(--warning)]",
      status: "DONNÉES PARTIELLES",
      subtitle: (pct: number | null) =>
        pct != null && totalAmountAbs > 0
          ? `${pct.toFixed(1)} % des flux non couverts par preuve bancaire`
          : data?.completeness_check?.message || "Certains paiements ERP ne sont pas encore enregistrés dans le Vault.",
      statusColor: "text-[var(--warning)]",
    },
    critical: {
      border: "border-l-[var(--warning)]",
      status: "RAPPROCHEMENT INSUFFISANT",
      subtitle: (pct: number) => `${pct.toFixed(1)} % des flux non couverts par preuve bancaire`,
      statusColor: "text-[var(--warning)]",
    },
    progress: {
      border: "border-l-[var(--governance-yellow)]",
      status: "RAPPROCHEMENT EN COURS",
      subtitle: (pct: number) => `${pct.toFixed(1)} % des flux non couverts par preuve bancaire`,
      statusColor: "text-[var(--governance-yellow)]",
    },
    ok: {
      border: "border-l-[var(--positive)]",
      status: "COUVERTURE PROBANTE MAÎTRISÉE",
      subtitle: totalAmountAbs === 0 ? "Aucun paiement sur la période" : ((pct: number) => `${pct.toFixed(1)} % des flux non couverts par preuve bancaire`),
      statusColor: "text-[var(--positive)]",
    },
  } as const;

  const gov = governanceConfig[governanceStatus];

  /** Sévérité badge charte (pas de border-l sur la card) */
  const badgeSeverity =
    governanceStatus === "critical" || governanceStatus === "partial" ? "vigilance" as const
    : governanceStatus === "progress" ? "vigilance" as const
    : "success" as const;

  const updatedAgo =
    generatedAt && typeof generatedAt === "string"
      ? Math.max(0, Math.floor((Date.now() - new Date(generatedAt).getTime()) / 1000))
      : null;

  const showCTAs = unreconciledVol > 0;

  /** Célébration 100 % — Mode Gouvernance : remainingRatioPct passe à 0 */
  useEffect(() => {
    const justHit100 =
      totalAmountAbs > 0 &&
      remainingRatioPct === 0 &&
      prevRateRef.current !== null &&
      prevRateRef.current > 0;
    if (justHit100) {
      setIsCelebrating100(true);
    } else if (remainingRatioPct !== 0) {
      setIsCelebrating100(false);
    }
    prevRateRef.current = remainingRatioPct ?? -1;
  }, [remainingRatioPct, totalAmountAbs]);

  const IconWrap = onFocusRequest
    ? ({ children }: { children: React.ReactNode }) => (
        <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label="Ouvrir la card Paiements">
          {children}
        </button>
      )
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  if (loading && !data) {
    return (
      <section className={INSTRUMENT_CARD_BASE} role="region" aria-label="Instrument Paiements — chargement">
        {cardId && onNavigateToCard && (
          <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
        )}
        <InstrumentCardHeader
          icon={<IconWrap><IconTreasury className="h-6 w-6 shrink-0 text-[var(--accent)]" /></IconWrap>}
          title="PAIEMENTS"
          kpiValue={<div className="skeleton h-5 w-28" />}
        />
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-24" />
          </div>
        </div>
      </section>
    );
  }

  /** Subtitle pour affichage — string ou fonction (pct) */
  const govSubtitle =
    typeof gov.subtitle === "string"
      ? gov.subtitle
      : typeof gov.subtitle === "function"
        ? gov.subtitle(remainingRatioPct ?? 0)
        : "";

  const kpiLabel = showResteARapprocher ? "Reste à rapprocher" : totalAmountAbs === 0 ? "Complétude" : "Reste à rapprocher";
  const kpiValueStr = totalAmountAbs === 0
    ? "Complet"
    : remainingRatioPct != null
      ? `${remainingRatioPct.toFixed(1)} %`
      : "—";

  return (
    <section className={INSTRUMENT_CARD_BASE} role="region" aria-label="Instrument Paiements — rapprochement bancaire">
      {cardId && onNavigateToCard && (
        <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} />
      )}
      <InstrumentCardHeader
        icon={<IconWrap><IconTreasury className="h-6 w-6 shrink-0 text-[var(--accent)]" /></IconWrap>}
        title="PAIEMENTS"
        badges={<InstrumentCardStatusBadge label={gov.status} severity={badgeSeverity} />}
        kpiLabel={kpiLabel}
        kpiValue={<span className={gov.statusColor}>{kpiValueStr}</span>}
      />

      {/* Mode Gouvernance v1.0 — 1. Statut fiabilité (dominant) + 2. Pourcentage (typographie forte) */}
      <div className="mb-4">
        <p className={`text-xl font-bold uppercase tracking-wide ${gov.statusColor}`}>{gov.status}</p>
        {showResteARapprocher ? (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            <span className={`text-2xl font-bold tabular-nums ${gov.statusColor}`} title="Cet indicateur ne mesure pas la qualité comptable, mais la couverture probante des flux par des preuves bancaires.">
              {remainingRatioPct!.toFixed(1)} %
            </span>{" "}
            des flux non couverts par preuve bancaire
          </p>
        ) : (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{govSubtitle}</p>
        )}
      </div>

      {/* Données partielles — message d'avertissement en orange */}
      {governanceStatus === "partial" && (
        <div className="rounded bg-[var(--warning)]/15 px-3 py-2 text-sm text-[var(--warning)] mb-3">
          {data?.completeness_check?.message || "Certains paiements ERP ne sont pas encore enregistrés dans le Vault."}
        </div>
      )}

      {/* 3. Total période + 4. Détails — afficher dès qu'on a des données */}
      {totalAmountAbs > 0 && (
        <>
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            Total période : <span className="font-semibold tabular-nums text-[var(--text)]">{formatAmount(totalAmountAbs, currency)}</span>
          </p>
          <div className="space-y-1 text-sm text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Rapproché</span>
              <span className="font-medium tabular-nums text-[var(--text)]">{formatAmount(reconciledAmountAbs, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>À rapprocher</span>
              <span className="font-medium tabular-nums text-[var(--text)]">
                {remainingAmountAbs === 0 ? "Rapprocher" : formatAmount(remainingAmountAbs, currency)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Flags métier (sign_mismatch, etc.) */}
      {(flags.sign_mismatch || flags.large_delta || flags.structural_delta) && (
        <>
          {flags.sign_mismatch && (
            <div className="mt-2 rounded bg-[var(--warning)]/20 px-2 py-1 text-xs text-[var(--warning)]">⚠ Signes incohérents</div>
          )}
          {flags.large_delta && (
            <div className="mt-2 rounded bg-[var(--warning)]/20 px-2 py-1 text-xs text-[var(--warning)]">⚠ Écart important</div>
          )}
          {flags.structural_delta && (
            <div className="mt-2 rounded bg-[var(--warning)]/20 px-2 py-1 text-xs text-[var(--warning)]">⚠ Écart structurel</div>
          )}
        </>
      )}

      {updatedAgo != null && (
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          Données actualisées il y a {updatedAgo < 60 ? `${updatedAgo}s` : updatedAgo < 3600 ? `${Math.floor(updatedAgo / 60)}min` : `${Math.floor(updatedAgo / 3600)}h`}
        </p>
      )}

      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {governanceStatus === "partial"
          ? "Données partielles — certains paiements ERP ne sont pas encore enregistrés dans le Vault."
          : "Cet indicateur mesure la couverture probante des flux par des preuves bancaires."}
      </p>

      <div className="mt-3 space-y-1 text-xs text-[var(--text-secondary)]">
        {/* Lignes à rapprocher / Plus ancien mouvement : non déterminables (sémantique Odoo vs périmètre vaulté) */}
        <div className="flex justify-between">
          <span>Journaux concernés</span>
          <span className="tabular-nums">{journalsCount != null ? journalsCount : "—"}</span>
        </div>
        <div className="flex justify-between">
          <span>Dernier relevé importé</span>
          <span className="tabular-nums">
            {lastImportDate
              ? lastImportDate.length <= 10
                ? formatDateOnly(lastImportDate)
                : formatDateTime(lastImportDate)
              : "—"}
          </span>
        </div>
      </div>

      {/* CTAs masqués pour l'instant — réactiver en passant showCTAs à true */}
      {false && showCTAs && (
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`${ODOO_BASE_URL.replace(/\/$/, "")}/web#model=account.bank.statement.line`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--accent-soft)]/20 transition-colors"
          >
            Rapprocher maintenant
          </a>
          <a
            href={`${ODOO_BASE_URL.replace(/\/$/, "")}/web#model=account.bank.statement`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--accent-soft)]/20 transition-colors"
          >
            Importer relevés
          </a>
        </div>
      )}

      {/* 5. Donut en support — afficher dès qu'on a des données */}
      {(totalAmountAbs > 0 || reconciledVol > 0 || unreconciledVol > 0) && (
        <CardChartSection
          storageKey="linky-treasury-chart-expanded"
          sectionTitle="Évolution"
          chartType={chartType}
          onChartTypeChange={handleChartTypeChange}
          chartGranularity={chartGranularity}
          onChartGranularityChange={handleGranularityChange}
          availableGranularities={availableGranularities}
          whyContent={{
            periodLabel: `Du ${period.from} au ${period.to}`,
            tenantId: tenantId ?? undefined,
            dataSource: primarySource === "erp" ? "Source : ERP (Odoo)" : "Source : Vault",
            calculationRule: primarySource === "erp" ? "Depuis l'ERP (rapprochement)" : "TTC, scellé",
          }}
          interpretationOverride={
            isCelebrating100 && chartType === "pie"
              ? { primary: "100 % rapproché", secondary: "✔ Tous les paiements traités" }
              : { primary: "Répartition rapproché / à rapprocher", secondary: "Couverture probante sur la période" }
          }
        >
          <DualSeriesChart
            series1={evolutionSeries.seriesReconciled}
            series2={evolutionSeries.seriesUnreconciled}
            total1={showResteARapprocher ? Math.max(0, reconciledAmountAbs) : Math.max(0, reconciledVol)}
            total2={showResteARapprocher ? Math.max(0, remainingAmountAbs) : Math.max(0, unreconciledVol)}
            label1="Rapproché"
            label2="À rapprocher"
            granularity={chartGranularity}
            chartType={chartType}
            currency={currency}
            celebrating100={isCelebrating100 && chartType === "pie"}
            pieColor2={governanceStatus === "progress" ? "var(--governance-yellow)" : undefined}
          />
        </CardChartSection>
      )}
      <InstrumentCardFooter
        meta={
          governanceStatus === "partial"
            ? "Données partielles · Source Vault"
            : "Couverture probante · Source Vault"
        }
      />
      {footer}
    </section>
  );
}
