"use client";

import type { AdjustmentsAggregation } from "@/app/types/aggregations";
import { formatPeriodLabel } from "@/app/lib/period-utils";
import { formatAmount } from "@/app/lib/format";

interface AdjustmentsCardProps {
  title: string;
  data: AdjustmentsAggregation | null;
  error?: string;
  loading?: boolean;
  periodFrom?: string;
  periodTo?: string;
}

const CARD_STYLE =
  "rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]";
const CARD_TITLE =
  "text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] whitespace-nowrap overflow-hidden text-ellipsis min-w-0";

export function AdjustmentsCard(props: AdjustmentsCardProps) {
  const { title, data, error, loading, periodFrom, periodTo } = props;

  if (loading) {
    return (
      <section className={CARD_STYLE}>
        <div className={`${CARD_TITLE} mb-2.5`}>{title}</div>
        <p className="text-[var(--muted)]">Chargement…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`${CARD_STYLE} border-red-200 bg-red-50/80`}>
        <div className={`${CARD_TITLE} mb-2.5`}>{title}</div>
        <p className="text-red-600">{error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className={CARD_STYLE}>
        <div className={`${CARD_TITLE} mb-2.5`}>{title}</div>
        <p className="text-[var(--muted)]">Aucune donnée</p>
      </section>
    );
  }

  const period =
    periodFrom && periodTo
      ? formatPeriodLabel(periodFrom, periodTo)
      : "Période";

  return (
    <section className={CARD_STYLE}>
      <div className="flex items-start justify-between gap-2">
        <div className={`${CARD_TITLE} mb-2.5`}>{title}</div>
        <span
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
          title="Données certifiées"
        >
          <span className="sr-only">Données certifiées</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
        </span>
      </div>
      <div className="text-3xl font-bold tabular-nums tracking-tight text-[var(--text)]">
        {formatAmount(data.total_amount ?? 0, data.currency ?? "EUR")}
      </div>
      <div className="mt-2 flex justify-between text-sm font-semibold text-[var(--muted)]">
        <span>Période</span>
        <span>{period}</span>
      </div>
      {typeof data.event_count === "number" && (
        <div className="mt-1.5 flex justify-between text-sm font-semibold text-[var(--muted)]">
          <span>Événements</span>
          <span>{data.event_count}</span>
        </div>
      )}
    </section>
  );
}
