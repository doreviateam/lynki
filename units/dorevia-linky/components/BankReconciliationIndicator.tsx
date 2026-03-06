"use client";

import { useState, useEffect } from "react";
import { formatAmount as formatAmountLib } from "@/app/lib/format";

interface BankReconciliationIndicatorProps {
  tenantId: string;
  companyId: string | null;
}

interface HealthData {
  reconciliation_rate: number | null;
  last_statement_date?: string | null;
  unreconciled_entries?: number;
  unreconciled_amount?: number;
  bank_accounts_count?: number;
}

export function BankReconciliationIndicator({ tenantId, companyId }: BankReconciliationIndicatorProps) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = new URLSearchParams({ tenant: tenantId });
    if (companyId) qs.set("company_id", companyId);
    fetch(`/api/bank-reconciliation-health?${qs}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [tenantId, companyId]);

  const rate = data?.reconciliation_rate ?? null;
  const unavailable = loading || rate === null;

  let color = "text-[var(--text-secondary)]";
  let title = "Indicateur temporairement indisponible";
  if (!unavailable && rate !== null) {
    if (rate >= 95) {
      color = "text-[var(--positive)] opacity-80";
      title = "Rapprochement bancaire à jour";
    } else if (rate >= 80) {
      color = "text-[var(--warning)]";
      title = "Rapprochement bancaire partiel";
    } else {
      color = "text-[var(--negative)]";
      title = "Rapprochement bancaire insuffisant — La trésorerie affichée peut ne pas être totalement alignée avec la banque";
    }
  }

  const formatDate = (d?: string | null) =>
    d ? new Date(d + "T00:00:00").toLocaleDateString("fr-FR") : "—";
  const formatAmount = (a?: number) => (a != null ? formatAmountLib(a) : "—");

  return (
    <div className="relative group" title={title}>
      <button
        type="button"
        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-transparent transition-colors ${color}`}
        aria-label="Rapprochement bancaire"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
          />
        </svg>
      </button>
      {!unavailable && (
        <div
          className="pointer-events-none absolute right-0 top-full z-50 mt-1 hidden min-w-[220px] rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-xs shadow-lg group-hover:block"
          role="tooltip"
        >
          <p className="font-semibold text-[var(--text)]">
            Rapprochement bancaire : {rate != null ? `${Math.round(rate)} %` : "—"}
          </p>
          <p className="mt-1 text-[var(--muted)]">Dernier relevé : {formatDate(data?.last_statement_date)}</p>
          <p className="text-[var(--muted)]">Écritures non rapprochées : {data?.unreconciled_entries ?? "—"}</p>
          <p className="text-[var(--muted)]">Montant non rapproché : <span className="tabular-nums">{formatAmount(data?.unreconciled_amount)}</span></p>
          <p className="text-[var(--muted)]">Comptes bancaires : {data?.bank_accounts_count ?? "—"}</p>
        </div>
      )}
    </div>
  );
}
