"use client";

import type { PurchasesAggregation } from "@/app/types/aggregations";
import { formatPeriodLabel } from "@/app/lib/period-utils";

import { formatAmount } from "@/app/lib/format";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface PurchasesCardProps {
  data: PurchasesAggregation | null;
  error?: string;
  loading?: boolean;
  postedPurchasesCount?: number | null;
}

export function PurchasesCard({
  data,
  error,
  loading,
  postedPurchasesCount,
}: PurchasesCardProps) {
  const cardStyle = "rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]";
  const cardTitle = "text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]";

  if (loading) {
    return (
      <section className={cardStyle}>
        <div className={`${cardTitle} mb-2.5`}>Achats</div>
        <p className="text-[var(--muted)]">Chargement…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`${cardStyle} border-red-200 bg-red-50/80`}>
        <div className={`${cardTitle} mb-2.5`}>Achats</div>
        <p className="text-red-600">{error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className={cardStyle}>
        <div className={`${cardTitle} mb-2.5`}>Achats</div>
        <p className="text-[var(--muted)]">Aucune donnée</p>
      </section>
    );
  }

  const isAllPeriod =
    data.from === "2000-01-01" && data.to === "2030-12-31";
  const period =
    data.effective_from && data.effective_to
      ? formatPeriodLabel(data.effective_from, data.effective_to)
      : isAllPeriod
        ? "Toutes périodes"
        : formatPeriodLabel(data.from ?? "", data.to ?? "");
  const hasHT = typeof data.total_ht === "number";
  const hasTax = typeof data.total_tax === "number";

  const globalVaulted = data.global_invoices_count ?? data.invoices_count;
  const certifiedLabel =
    postedPurchasesCount != null &&
    typeof globalVaulted === "number" &&
    postedPurchasesCount > 0
      ? `Certifié : ${Math.min(100, Math.round((globalVaulted / postedPurchasesCount) * 100))} %`
      : postedPurchasesCount != null &&
          (typeof globalVaulted !== "number" || postedPurchasesCount <= 0)
        ? `Certifié : ${globalVaulted ?? 0} / ${postedPurchasesCount}`
        : data.verifiable
          ? "Données certifiées"
          : null;

  return (
    <section className={cardStyle}>
      <div className="flex items-start justify-between gap-2">
        <div className={`${cardTitle} mb-2.5`}>Achats</div>
        {certifiedLabel && (
          <span
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
            title={certifiedLabel}
          >
            <span className="sr-only">{certifiedLabel}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>
      <div className="text-3xl font-bold tabular-nums tracking-tight text-[var(--text)]">
        {formatAmount(data.total ?? 0, data.currency ?? "EUR")}
      </div>
      {(hasHT || hasTax) && (
        <div className="mt-3 space-y-1.5 text-sm font-semibold text-[var(--muted)]">
          {hasHT && (
            <div className="flex justify-between">
              <span>Hors taxes</span>
              <span className="tabular-nums">{formatAmount(data.total_ht!, data.currency ?? "EUR")}</span>
            </div>
          )}
          {hasTax && (
            <div className="flex justify-between">
              <span>Dont taxes</span>
              <span className="tabular-nums">{formatAmount(data.total_tax!, data.currency ?? "EUR")}</span>
            </div>
          )}
        </div>
      )}
      <div className="mt-2 flex justify-between text-sm font-semibold text-[var(--muted)]">
        <span>Période</span>
        <span>{period}</span>
      </div>
      {typeof data.invoices_count === "number" && (
        <div className="mt-1.5 flex justify-between text-sm font-semibold text-[var(--muted)]">
          <span>Factures</span>
          <span>{data.invoices_count} concernée{data.invoices_count > 1 ? "s" : ""}</span>
        </div>
      )}
      {data.last_seal_at && (
        <div className="mt-1.5 flex justify-between text-xs font-semibold text-[var(--muted)]">
          <span>Dernier scellement</span>
          <span>{formatDate(data.last_seal_at)}</span>
        </div>
      )}
    </section>
  );
}
