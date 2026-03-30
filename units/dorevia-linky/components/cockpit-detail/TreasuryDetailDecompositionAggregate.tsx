"use client";

import { Icon } from "@/components/Icon";
import type { TreasuryAccountVolumeRow, TreasuryDetail } from "@/app/api/dashboard-metrics/route";

function pctPart(n: number, total: number): string {
  if (!Number.isFinite(n) || !Number.isFinite(total) || total <= 0) return "—";
  return `${Math.round((n / total) * 100)} %`;
}

function rowCoveragePct(reconciled: number, unreconciled: number): number | null {
  const sum = reconciled + unreconciled;
  if (!Number.isFinite(sum) || sum <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((reconciled / sum) * 100)));
}

function accountLabel(row: TreasuryAccountVolumeRow): string {
  if (row.account_id != null) return `Compte bancaire n° ${row.account_id}`;
  return "Compte bancaire non identifié";
}

function formatFreshness(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { dateStyle: "medium" });
}

/**
 * Section « position validée » : lecture par comptes, poids et couverture ; synthèse volumes en secondaire.
 */
export function TreasuryDetailDecompositionAggregate({
  detail,
  formatCurrency,
}: {
  detail: TreasuryDetail;
  formatCurrency: (n: number | null | undefined) => string;
}) {
  const { reconciled, unreconciled, total, currency, account_volume_breakdown: breakdown, last_statement_import_date } = detail;
  const sum = reconciled + unreconciled;
  const displayTotal = total > 0 ? total : sum;

  const breakdownTotal =
    breakdown && breakdown.length > 0
      ? breakdown.reduce((acc, r) => acc + r.reconciled_volume + r.unreconciled_volume, 0)
      : 0;

  const freshness = formatFreshness(last_statement_import_date);
  const sortedBreakdown =
    breakdown && breakdown.length > 0
      ? [...breakdown].sort((a, b) => {
          const ta = a.reconciled_volume + a.unreconciled_volume;
          const tb = b.reconciled_volume + b.unreconciled_volume;
          return tb - ta;
        })
      : [];

  const volumeSynthèse = (
    <table className="w-full min-w-[280px] text-sm">
      <thead>
        <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
          <th className="px-3 py-2">Synthèse volumes</th>
          <th className="px-3 py-2 text-right">Montant</th>
          <th className="hidden px-3 py-2 text-right sm:table-cell">Poids</th>
        </tr>
      </thead>
      <tbody className="tabular-nums">
        <tr className="border-b border-[var(--border)]">
          <td className="px-3 py-2 font-medium text-[var(--text)]">Montant rapproché (volume)</td>
          <td className="px-3 py-2 text-right font-semibold text-emerald-700 dark:text-emerald-400">
            {formatCurrency(reconciled)}
          </td>
          <td className="hidden px-3 py-2 text-right text-[var(--text-secondary)] sm:table-cell">
            {pctPart(reconciled, displayTotal)}
          </td>
        </tr>
        <tr className="border-b border-[var(--border)]">
          <td className="px-3 py-2 font-medium text-[var(--text)]">Montant encore ouvert (volume)</td>
          <td className="px-3 py-2 text-right font-semibold text-amber-700 dark:text-amber-400">
            {formatCurrency(unreconciled)}
          </td>
          <td className="hidden px-3 py-2 text-right text-[var(--text-secondary)] sm:table-cell">
            {pctPart(unreconciled, displayTotal)}
          </td>
        </tr>
        <tr>
          <td className="px-3 py-2 font-medium text-[var(--text)]">Total mouvements</td>
          <td className="px-3 py-2 text-right font-bold text-[var(--text)]">{formatCurrency(displayTotal)}</td>
          <td className="hidden px-3 py-2 text-right text-[var(--text-secondary)] sm:table-cell">100 %</td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <section
      aria-labelledby="treso-decomp-heading"
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon name="pie_chart" size={20} className="text-[var(--muted)]" />
        <h2 id="treso-decomp-heading" className="text-sm font-bold uppercase tracking-tight text-[var(--text)]">
          Décomposition de la trésorerie
        </h2>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-[var(--text-secondary)]">
        Sur quoi repose la position : <strong>répartition par compte bancaire</strong>, poids dans la masse analysée et part
        couverte par le rapprochement. Les montants suivent les agrégats du périmètre ({currency}
        {freshness ? ` · dernier relevé connu : ${freshness}` : ""}).
      </p>

      {sortedBreakdown.length > 0 && breakdownTotal > 0 ? (
        <div className="mb-4">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
            Par compte (contribution décroissante)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-left font-bold uppercase tracking-wide text-[var(--muted)]">
                  <th className="px-3 py-2">Compte</th>
                  <th className="px-3 py-2 text-right">Montant porté</th>
                  <th className="hidden px-3 py-2 text-right sm:table-cell">Poids</th>
                  <th className="px-3 py-2 text-right">Couverture</th>
                  <th className="hidden px-3 py-2 text-right md:table-cell">Rapproché</th>
                  <th className="hidden px-3 py-2 text-right md:table-cell">Ouvert</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {sortedBreakdown.map((row, idx) => {
                  const lineTotal = row.reconciled_volume + row.unreconciled_volume;
                  const weightPct = lineTotal / breakdownTotal;
                  const coverage = rowCoveragePct(row.reconciled_volume, row.unreconciled_volume);
                  const degradedVisual = weightPct >= 0.5 && coverage != null && coverage < 70;
                  return (
                    <tr
                      key={`${row.account_id ?? "null"}-${idx}`}
                      className={
                        degradedVisual
                          ? "border-b border-amber-500/30 bg-amber-500/10"
                          : "border-b border-[var(--border)]"
                      }
                    >
                      <td className="max-w-[220px] px-3 py-2 font-medium text-[var(--text)]">
                        <span className="break-words">{accountLabel(row)}</span>
                        {degradedVisual ? (
                          <span className="ml-1 inline-flex align-middle" title="Poids élevé et couverture sous 70 %">
                            <Icon name="priority_high" size={14} className="text-amber-600 dark:text-amber-400" />
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-[var(--text)]">{formatCurrency(lineTotal)}</td>
                      <td className="hidden px-3 py-2 text-right text-[var(--text-secondary)] sm:table-cell">
                        {pctPart(lineTotal, breakdownTotal)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {coverage != null ? (
                          <span
                            className={
                              coverage >= 80
                                ? "text-emerald-600 dark:text-emerald-400"
                                : coverage >= 70
                                  ? "text-[var(--text-secondary)]"
                                  : "text-amber-700 dark:text-amber-400"
                            }
                          >
                            {coverage} %
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="hidden px-3 py-2 text-right text-emerald-700 dark:text-emerald-400 md:table-cell">
                        {formatCurrency(row.reconciled_volume)}
                      </td>
                      <td className="hidden px-3 py-2 text-right text-amber-700 dark:text-amber-400 md:table-cell">
                        {formatCurrency(row.unreconciled_volume)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[var(--muted)]">
            « Poids » : part du compte dans la somme des montants portés sur ce périmètre (indicateur de concentration du risque
            restant à traiter).
          </p>
        </div>
      ) : (
        <p className="mb-4 text-xs text-[var(--text-secondary)]">
          La ventilation par compte s’affiche dès que les agrégats par compte sont disponibles pour ce périmètre. En attendant,
          la synthèse volumique ci-dessous reste la lecture principale.
        </p>
      )}

      <details className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/30 open:bg-[var(--bg-secondary)]/50">
        <summary className="cursor-pointer select-none px-3 py-2 text-[11px] font-semibold text-[var(--text-secondary)]">
          Synthèse secondaire — volumes rapproché / ouvert / total
        </summary>
        <div className="overflow-x-auto border-t border-[var(--border)] px-1 pb-2 pt-1">{volumeSynthèse}</div>
      </details>
    </section>
  );
}
