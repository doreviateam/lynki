"use client";

/**
 * Card Énergie stratégique — DLP (SPEC_DLP_v0.3 §6, SPEC_DLP_UX_v0.1).
 * Répartition de l'énergie organisationnelle (allocation de temps validé).
 * Vocabulaire : "X décisions", pas "DLP actives". Lien "Gérer les DLP" supprimé.
 */
import { useEffect, useState, useCallback } from "react";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const DLP_DISCLAIMER =
  "Répartition de l'énergie organisationnelle (allocation de temps validé), pas une mesure de performance individuelle. Les heures ne sont jamais exposées.";

interface EnergySummaryRow {
  perimeter_id?: string;
  perimeter_name?: string;
  company_id: string;
  company_name?: string;
  hits: number;
  pct: number;
}

interface EnergySummaryResponse {
  dlp_active_count: number;
  hits_total: number;
  period_days: number;
  by_perimeter: EnergySummaryRow[];
  by_company: EnergySummaryRow[];
  error?: string;
}

interface StrategicEnergyCardProps {
  tenantId: string;
  companyId: string | null;
  onFocusRequest?: () => void;
}

const CARD_BASE =
  "rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] border-l-4 border-l-[var(--accent)]";

export function StrategicEnergyCard({ tenantId, companyId, onFocusRequest }: StrategicEnergyCardProps) {
  const [periodDays, setPeriodDays] = useState(90);
  const [data, setData] = useState<EnergySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    const params = new URLSearchParams({
      tenant: tenantId,
      period_days: String(periodDays),
    });
    if (companyId) params.set("company_id", companyId);
    fetch(`/api/dlp/energy-summary?${params}`, { cache: "no-store", headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => setData(d && typeof d === "object" ? d : null))
      .catch(() =>
        setData({
          dlp_active_count: 0,
          hits_total: 0,
          period_days: periodDays,
          by_perimeter: [],
          by_company: [],
          error: "Service DLP temporairement indisponible.",
        })
      )
      .finally(() => setLoading(false));
  }, [tenantId, companyId, periodDays]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  return (
    <article className={CARD_BASE} aria-labelledby="strategic-energy-title">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 id="strategic-energy-title" className="text-lg font-semibold text-[var(--text)]">
          Énergie stratégique
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="dlp-period" className="text-sm text-[var(--text-secondary)]">
            Période :
          </label>
          <select
            id="dlp-period"
            value={periodDays}
            onChange={(e) => setPeriodDays(parseInt(e.target.value, 10) || 90)}
            className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-sm text-[var(--text)]"
          >
            <option value={30}>30 jours</option>
            <option value={60}>60 jours</option>
            <option value={90}>90 jours</option>
          </select>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Chargement…</p>
      ) : data?.error ? (
        <p className="text-sm text-[var(--negative)]">
          {data.error.includes("fetch failed") || data.error.includes("TypeError")
            ? "Service DLP temporairement indisponible."
            : data.error}
        </p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-3">
              <div className="text-2xl font-bold text-[var(--accent)]">{data?.dlp_active_count ?? 0}</div>
              <div className="text-xs text-[var(--text-secondary)]">
                {data?.dlp_active_count === 1 ? "décision" : "décisions"}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-3">
              <div className="text-2xl font-bold text-[var(--text)]">{data?.hits_total ?? 0}</div>
              <div className="text-xs text-[var(--text-secondary)]">Hits ({data?.period_days ?? 90} j)</div>
            </div>
          </div>

          {data?.by_perimeter && data.by_perimeter.length > 0 && (
            <section className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-[var(--text)]">Par périmètre métier</h3>
              <ul className="space-y-1.5">
                {data.by_perimeter.map((row, i) => (
                  <li key={row.perimeter_id ?? i} className="flex justify-between text-sm">
                    <span className="text-[var(--text)]">{row.perimeter_name ?? "—"}</span>
                    <span className="tabular-nums text-[var(--accent)]">
                      {row.hits} hits ({row.pct}%)
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data?.by_company && data.by_company.length > 0 && (
            <section className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-[var(--text)]">Par société</h3>
              <ul className="space-y-1.5">
                {data.by_company.map((row, i) => (
                  <li key={row.company_id ?? i} className="flex justify-between text-sm">
                    <span className="text-[var(--text)]">{row.company_name ?? "—"}</span>
                    <span className="tabular-nums text-[var(--accent)]">
                      {row.hits} hits ({row.pct}%)
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!data?.by_perimeter?.length && !data?.by_company?.length && !data?.error && (
            <p className="text-sm text-[var(--text-secondary)]">Aucune donnée sur la période.</p>
          )}

          <p className="mt-4 text-xs italic text-[var(--text-secondary)]">{DLP_DISCLAIMER}</p>
        </>
      )}
    </article>
  );
}
