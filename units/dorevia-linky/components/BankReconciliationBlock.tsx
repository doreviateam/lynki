"use client";

import { useState, useEffect } from "react";

interface BankReconciliationBlockProps {
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
}

type BlockState = "loading" | "ok" | "partial" | "unavailable" | "not_aligned";

interface ReconciliationData {
  reconciliation_rate: number | null;
  reconciliation_metrics: {
    total_amount_abs?: number;
    reconciled_amount_abs?: number;
    remaining_amount_abs?: number;
    remaining_ratio?: number;
    generated_at?: string;
  } | null;
  unreconciled_lines_count: number | null;
  oldest_unreconciled_date: string | null;
  last_statement_import_date: string | null;
  journals_count: number | null;
  generated_at: string | null;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("fr-FR");
  } catch {
    return "—";
  }
}

function formatAmount(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function formatRate(rate: number | null | undefined): string {
  if (rate == null || !Number.isFinite(rate)) return "—";
  return `${Math.round(rate)} %`;
}

function deriveState(data: ReconciliationData | null, error: boolean): BlockState {
  if (error || !data) return "unavailable";

  const hasRate = data.reconciliation_rate != null && Number.isFinite(data.reconciliation_rate);
  const hasMetrics = data.reconciliation_metrics != null &&
    data.reconciliation_metrics.remaining_amount_abs != null;

  if (!hasRate && !hasMetrics) return "unavailable";
  if (hasRate && hasMetrics) return "ok";
  return "partial";
}

const STATE_LABELS: Record<BlockState, { label: string; color: string }> = {
  loading: { label: "", color: "" },
  ok: { label: "Aligné", color: "text-[var(--positive)]" },
  partial: { label: "Partiel", color: "text-[var(--warning)]" },
  unavailable: { label: "Indisponible", color: "text-[var(--text-muted)]" },
  not_aligned: { label: "Non aligné", color: "text-[var(--warning)]" },
};

function refLabel(data: ReconciliationData | null, state: BlockState): string {
  const source = "treasury · Vault";
  const gen = data?.generated_at ? ` · ${formatDate(data.generated_at)}` : "";
  return `Réf. source ${source}${gen}${state !== "ok" ? ` · état : ${STATE_LABELS[state].label}` : ""}`;
}

export function BankReconciliationBlock({ tenantId, companyId, period }: BankReconciliationBlockProps) {
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const qs = new URLSearchParams({ tenant: tenantId });
    if (companyId) qs.set("company_id", companyId);
    if (period.from) qs.set("date_debut", period.from);
    if (period.to) qs.set("date_fin", period.to);

    fetch(`/api/treasury?${qs}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((raw) => {
        setData({
          reconciliation_rate: typeof raw.reconciliation_rate === "number" ? raw.reconciliation_rate : null,
          reconciliation_metrics: raw.reconciliation_metrics ?? null,
          unreconciled_lines_count: typeof raw.unreconciled_lines_count === "number" ? raw.unreconciled_lines_count : null,
          oldest_unreconciled_date: raw.oldest_unreconciled_date ?? null,
          last_statement_import_date: raw.last_statement_import_date ?? null,
          journals_count: typeof raw.journals_count === "number" ? raw.journals_count : null,
          generated_at: raw.generated_at ?? null,
        });
      })
      .catch(() => {
        setData(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [tenantId, companyId, period.from, period.to]);

  if (loading) {
    return (
      <div className="sv2-card p-5 sm:p-6" aria-busy="true">
        <div className="mb-3 h-4 w-64 rounded bg-[var(--sv2-border)] animate-pulse" />
        <div className="h-8 w-24 rounded bg-[var(--sv2-border)] animate-pulse" />
      </div>
    );
  }

  const state = deriveState(data, error);
  const stateInfo = STATE_LABELS[state];

  const rate = data?.reconciliation_rate;
  const remaining = data?.reconciliation_metrics?.remaining_amount_abs;
  const lines = data?.unreconciled_lines_count;
  const oldest = data?.oldest_unreconciled_date;

  let rateColor = "text-[var(--sv2-text)]";
  if (rate != null) {
    if (rate >= 95) rateColor = "text-[var(--sv2-positive)]";
    else if (rate >= 60) rateColor = "text-[var(--sv2-warning)]";
    else rateColor = "text-[var(--sv2-negative)]";
  }

  const hasPrimaryValue = state === "ok" || state === "partial";

  const secondaryMetrics: { label: string; value: string }[] = [];
  if (remaining != null && Number.isFinite(remaining)) {
    secondaryMetrics.push({ label: "Reste à rapprocher", value: formatAmount(remaining) });
  }
  if (lines != null && Number.isFinite(lines)) {
    secondaryMetrics.push({ label: "Écritures non rapprochées", value: String(lines) });
  }
  if (oldest) {
    secondaryMetrics.push({ label: "Plus ancienne non rapprochée", value: formatDate(oldest) });
  }

  const badgeClass = state === "ok" ? "sv2-badge-ok"
    : state === "partial" ? "sv2-badge-partial"
    : "sv2-badge-unavailable";

  return (
    <div className="sv2-card sv2-card-highlight overflow-hidden">
      <div className="px-5 py-5 sm:px-6 sm:py-5 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="sv2-label text-[var(--sv2-text-muted)]">Confiance des flux</p>
          <h2 className="text-lg font-bold text-[var(--sv2-text)]">
            État du rapprochement bancaire
          </h2>
          {state !== "loading" && (
            <span className={`sv2-badge ${badgeClass}`}>{stateInfo.label}</span>
          )}
        </div>

        {hasPrimaryValue ? (
          <div className="flex items-baseline gap-3">
            <span className={`text-3xl font-bold tabular-nums ${rateColor}`}>
              {formatRate(rate)}
            </span>
            <span className="text-sm text-[var(--sv2-text-muted)]">rapproché</span>
          </div>
        ) : (
          <div className="py-1">
            <p className="text-sm text-[var(--sv2-text-muted)]">
              {state === "unavailable"
                ? "Les données de rapprochement bancaire ne sont pas disponibles sur ce périmètre."
                : "Les données de rapprochement ne correspondent pas au périmètre affiché."}
            </p>
          </div>
        )}

        {secondaryMetrics.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-2">
            {secondaryMetrics.slice(0, 3).map((m) => (
              <div key={m.label} className="sv2-inner p-3">
                <p className="sv2-label text-[var(--sv2-text-muted)]">{m.label}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--sv2-text)]">{m.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sv2-ref mx-5 mb-4 sm:mx-6">
        {refLabel(data, state)}
      </div>
    </div>
  );
}
