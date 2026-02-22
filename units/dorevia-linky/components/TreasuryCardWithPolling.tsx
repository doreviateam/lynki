"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { PeriodRange } from "@/app/lib/period-utils";
import { formatAmount } from "@/app/lib/format";
import { DualSeriesChart } from "@/components/DualSeriesChart";
import { CardChartSection } from "@/components/CardChartSection";
import { IconTreasury } from "@/components/CardIcons";
import { getAvailableGranularities, getDefaultChartGranularity, type ChartGranularity } from "@/app/lib/chart-granularity";
import type { ChartType } from "@/app/lib/chart-type";

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

interface TreasuryData {
  total?: number;
  reconciled?: number;
  unreconciled?: number;
  reconciliation_rate?: number | null;
  currency?: string;
  error?: string;
  /** SPEC Trésorerie v1.1 — agrégats rapprochement */
  unreconciled_lines_count?: number | null;
  oldest_unreconciled_date?: string | null;
  journals_count?: number | null;
  last_statement_import_date?: string | null;
}

interface TreasuryCardWithPollingProps {
  period: PeriodRange;
  companyId: string | null;
  tenantId: string;
  onFocusRequest?: () => void;
  footer?: React.ReactNode;
}

const CARD_BASE =
  "rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] border-l-4";

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

export function TreasuryCardWithPolling({ period, companyId, tenantId, onFocusRequest, footer }: TreasuryCardWithPollingProps) {
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

  const fetchData = useCallback(async () => {
    // Ne pas afficher le loading lors du polling : uniquement au premier chargement
    if (!data) setLoading(true);
    const params = new URLSearchParams({
      tenant: tenantId,
      date_debut: period.from,
      date_fin: period.to,
      ...(companyId && { company_id: companyId }),
    });
    try {
      const res = await fetch(`/api/treasury?${params}`, { cache: "no-store", headers: { Accept: "application/json" } });
      const json = await res.json();
      setData(json);
    } catch {
      setData({ error: "treasury_unavailable" });
    } finally {
      setLoading(false);
    }
  }, [period.from, period.to, companyId, tenantId]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  const total = data?.total ?? 0;
  const reconciled = data?.reconciled ?? 0;
  const unreconciled = data?.unreconciled ?? 0;
  const rate = data?.reconciliation_rate;
  const currency = data?.currency ?? "EUR";
  const rateRounded =
    typeof rate === "number" && !Number.isNaN(rate) ? Math.round(rate) : null;

  const unreconciledLines = data?.unreconciled_lines_count ?? null;
  const oldestDate = data?.oldest_unreconciled_date ?? null;
  const journalsCount = data?.journals_count ?? null;
  const lastImportDate = data?.last_statement_import_date ?? null;

  const borderVerdict =
    rateRounded === 100
      ? "border-l-[var(--positive)]"
      : rateRounded === 0
        ? "border-l-[var(--warning)]"
        : "border-l-[var(--accent)]";

  const verdictPhrase =
    rateRounded === 100
      ? "Toutes les écritures sont rapprochées et validées."
      : rateRounded === 0
        ? "Aucun rapprochement effectué sur la période sélectionnée."
        : "Rapprochement partiel. Montants non validés présents.";

  const showCTAs = unreconciled > 0;

  useEffect(() => {
    if (
      rateRounded === 100 &&
      prevRateRef.current !== null &&
      prevRateRef.current < 100 &&
      total > 0
    ) {
      setIsCelebrating100(true);
    } else if (rateRounded !== 100) {
      setIsCelebrating100(false);
    }
    prevRateRef.current = rateRounded;
  }, [rateRounded, total]);

  const IconWrap = onFocusRequest
    ? ({ children }: { children: React.ReactNode }) => (
        <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label="Ouvrir la card Trésorerie">
          {children}
        </button>
      )
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  if (loading && !data) {
    return (
      <section className={`${CARD_BASE} border-l-[var(--muted)]`}>
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <IconWrap>
              <IconTreasury className="h-6 w-6 shrink-0 text-[var(--accent)]" />
            </IconWrap>
            <span className="text-lg font-bold uppercase tracking-wide text-[var(--accent)]">Trésorerie validée</span>
          </div>
          <div className="skeleton h-5 w-28" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-24" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${CARD_BASE} ${borderVerdict}`}>
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <IconWrap>
            <IconTreasury className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          </IconWrap>
          <span className="text-lg font-bold uppercase tracking-wide text-[var(--accent)]">Trésorerie validée</span>
        </div>
        <span className="text-xl font-semibold tabular-nums text-[var(--text)] shrink-0">{formatAmount(reconciled, currency)}</span>
      </div>
      <div className="space-y-2 text-sm font-semibold text-[var(--text-secondary)]">
        <div className="flex justify-between">
          <span>En attente de rapprochement</span>
          <span className="font-medium tabular-nums text-[var(--warning)]">{formatAmount(unreconciled, currency)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-[var(--border)]">
          <span>Fiabilité bancaire</span>
          <span className="font-semibold tabular-nums">{rate != null ? `${Math.round(rate)} %` : "—"}</span>
        </div>
      </div>

      <p className="mt-2 text-sm text-[var(--text-secondary)]">{verdictPhrase}</p>

      <div className="mt-3 space-y-1 text-xs text-[var(--text-secondary)]">
        <div className="flex justify-between">
          <span>Lignes à rapprocher</span>
          <span className="tabular-nums">{unreconciledLines != null ? unreconciledLines : "—"}</span>
        </div>
        <div className="flex justify-between">
          <span>Plus ancien mouvement</span>
          <span className="tabular-nums">{formatDateOnly(oldestDate)}</span>
        </div>
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

      {showCTAs && (
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

      <CardChartSection
        storageKey="linky-treasury-chart-expanded"
        sectionTitle="Répartition"
        chartType={chartType}
        onChartTypeChange={handleChartTypeChange}
        chartGranularity={chartGranularity}
        onChartGranularityChange={handleGranularityChange}
        availableGranularities={availableGranularities}
        whyContent={{
          periodLabel: `Du ${period.from} au ${period.to}`,
          tenantId: tenantId ?? undefined,
          dataSource: "Vault (agrégations)",
          calculationRule: "TTC, scellé",
        }}
        interpretationOverride={
          isCelebrating100 && chartType === "pie"
            ? { primary: "100 % rapproché", secondary: "✔ Cohérence bancaire confirmée" }
            : undefined
        }
      >
        <DualSeriesChart
          series1={[]}
          series2={[]}
          total1={Math.max(0, reconciled)}
          total2={Math.max(0, unreconciled)}
          label1="Rapproché"
          label2="En attente"
          granularity={chartGranularity}
          chartType={chartType}
          currency={currency}
          celebrating100={isCelebrating100 && chartType === "pie"}
        />
      </CardChartSection>
      {footer}
    </section>
  );
}
