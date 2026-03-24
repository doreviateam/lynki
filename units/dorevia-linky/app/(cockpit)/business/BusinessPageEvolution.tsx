"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SalesAggregation, PurchasesAggregation } from "@/app/types/aggregations";
import {
  getAvailableGranularities,
  getDefaultChartGranularity,
  GRANULARITY_LABELS,
  type ChartGranularity,
} from "@/app/lib/chart-granularity";
import type { ChartType } from "@/app/lib/chart-type";
import { BusinessChart } from "@/components/BusinessChart";

type Props = {
  tenantId: string;
  companyId: string | null;
  periodFrom: string;
  periodTo: string;
  showBlock?: boolean;
};

export function BusinessPageEvolution({
  tenantId,
  companyId,
  periodFrom,
  periodTo,
  showBlock = true,
}: Props) {
  const seqRef = useRef(0);
  const [salesData, setSalesData] = useState<SalesAggregation | null>(null);
  const [purchasesData, setPurchasesData] = useState<PurchasesAggregation | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const availableGranularities = getAvailableGranularities(periodFrom, periodTo);
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>(() =>
    getDefaultChartGranularity(periodFrom, periodTo)
  );

  useEffect(() => {
    const available = getAvailableGranularities(periodFrom, periodTo);
    setChartGranularity((prev) =>
      available.includes(prev) ? prev : getDefaultChartGranularity(periodFrom, periodTo)
    );
  }, [periodFrom, periodTo]);

  const handleGranularityChange = useCallback((g: ChartGranularity) => setChartGranularity(g), []);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [relativeTo100, setRelativeTo100] = useState(false);
  /** Barres / courbes : choix explicite ; camembert à part. */
  const barOrLine: ChartType = chartType === "line" ? "line" : "bar";

  useEffect(() => {
    if (!showBlock || !periodFrom || !periodTo) return;
    const seq = ++seqRef.current;
    setLoading(true);
    setFetchError(false);
    const params = new URLSearchParams({
      tenant: tenantId,
      date_debut: periodFrom,
      date_fin: periodTo,
      granularity: chartGranularity,
    });
    if (companyId) params.set("company_id", companyId);

    const load = async () => {
      try {
        const [resS, resP] = await Promise.all([
          fetch(`/api/sales?${params}`, { cache: "no-store", headers: { Accept: "application/json" } }),
          fetch(`/api/purchases?${params}`, { cache: "no-store", headers: { Accept: "application/json" } }),
        ]);
        if (seq !== seqRef.current) return;
        const jS = resS.ok ? ((await resS.json()) as SalesAggregation) : null;
        const jP = resP.ok ? ((await resP.json()) as PurchasesAggregation) : null;
        if (seq !== seqRef.current) return;
        if (!resS.ok && !resP.ok) {
          setSalesData(null);
          setPurchasesData(null);
          setFetchError(true);
        } else {
          setSalesData(jS);
          setPurchasesData(jP);
          setFetchError(!resS.ok || !resP.ok);
        }
      } catch {
        if (seq === seqRef.current) {
          setSalesData(null);
          setPurchasesData(null);
          setFetchError(true);
        }
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    };
    void load();
    return () => {
      seqRef.current += 1;
    };
  }, [showBlock, tenantId, companyId, periodFrom, periodTo, chartGranularity]);

  if (!showBlock) return null;

  const salesTotal = salesData?.total_ht ?? salesData?.total ?? 0;
  const purchasesTotal = Math.abs(purchasesData?.total_ht ?? purchasesData?.total ?? 0);
  const currency = salesData?.currency ?? purchasesData?.currency ?? "EUR";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
        Évolution du CA et des achats (HT)
      </h2>
      <p className="mb-4 text-[10px] leading-relaxed text-[var(--muted)]">
        Agrégats Vault sales et purchases par période (comme la carte Business). Semaine : courbes ; sinon : barres. Pas un compte de
        résultat.
      </p>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-[var(--muted)]">
          <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Chargement du graphique
        </div>
      ) : fetchError && !salesData && !purchasesData ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--text-secondary)]">
          Évolution indisponible sur cette période.
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-md bg-[var(--muted-soft)] p-0.5">
              {availableGranularities.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => availableGranularities.length > 1 && handleGranularityChange(g)}
                  aria-pressed={chartGranularity === g}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    chartGranularity === g
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  {GRANULARITY_LABELS[g]}
                </button>
              ))}
            </div>
            <div className="flex gap-1 rounded-md bg-[var(--muted-soft)] p-0.5">
              <button
                type="button"
                onClick={() => setChartType("bar")}
                aria-pressed={chartType === "bar"}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  chartType === "bar" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
                }`}
              >
                Barres
              </button>
              <button
                type="button"
                onClick={() => setChartType("line")}
                aria-pressed={chartType === "line"}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  chartType === "line" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
                }`}
              >
                Courbes
              </button>
              <button
                type="button"
                onClick={() => setChartType("pie")}
                aria-pressed={chartType === "pie"}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  chartType === "pie" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
                }`}
              >
                Camembert
              </button>
            </div>
            {chartType !== "pie" && (
              <div className="flex gap-1 rounded-md bg-[var(--muted-soft)] p-0.5">
                <button
                  type="button"
                  onClick={() => setRelativeTo100(false)}
                  aria-pressed={!relativeTo100}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    !relativeTo100 ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  Montants
                </button>
                <button
                  type="button"
                  onClick={() => setRelativeTo100(true)}
                  aria-pressed={relativeTo100}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    relativeTo100 ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  Répartition %
                </button>
              </div>
            )}
          </div>
          <BusinessChart
            salesSeries={salesData?.series ?? []}
            purchasesSeries={purchasesData?.series ?? []}
            salesTotal={salesTotal}
            purchasesTotal={purchasesTotal}
            granularity={chartGranularity}
            chartType={chartType === "pie" ? "pie" : barOrLine}
            currency={currency}
            relativeTo100={relativeTo100 && chartType !== "pie"}
          />
          {fetchError ? (
            <p className="mt-2 text-[10px] text-amber-400">Une série (ventes ou achats) n’a pas pu être chargée.</p>
          ) : null}
        </>
      )}
    </div>
  );
}
