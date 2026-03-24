"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { LynkiTrialBalanceResponse, TrialBalanceLine } from "@/app/api/accounting/trial-balance/route";
import type { LynkiGeneralLedgerResponse, GeneralLedgerLine } from "@/app/api/accounting/general-ledger/route";
import type { LynkiBalanceSheetResponse, ClassBalanceLine } from "@/app/api/accounting/balance-sheet/route";
import type { LynkiIncomeStatementResponse } from "@/app/api/accounting/income-statement/route";
import type { LynkiBalanceSheetRubricsResponse, RubricLine } from "@/app/api/accounting/balance-sheet/rubrics/route";
import type { LynkiIncomeStatementRubricsResponse } from "@/app/api/accounting/income-statement/rubrics/route";
import type { LynkiAgedReceivablesResponse, AgedBalanceLine } from "@/app/api/accounting/aged-receivables/route";
import type { LynkiAgedPayablesResponse } from "@/app/api/accounting/aged-payables/route";
import AccountingInsightBlock from "@/components/AccountingInsightBlock";
import { BankReconciliationBlock } from "@/components/BankReconciliationBlock";
import { AccountingSummaryKpiCards } from "@/components/AccountingSummaryKpiCards";
import { AccountingSummaryBreadcrumb } from "@/components/AccountingSummaryBreadcrumb";
import { AccountingSummaryTrendChart } from "@/components/AccountingSummaryTrendChart";
import { AccountingSummaryBreakdownChart } from "@/components/AccountingSummaryBreakdownChart";
import { AccountingSummaryProofBlock } from "@/components/AccountingSummaryProofBlock";
import { AccountingSummaryAlerts } from "@/components/AccountingSummaryAlerts";
import { AccountingSummaryCodirBlock } from "@/components/AccountingSummaryCodirBlock";
import { AccountingSummaryExecutiveBlock } from "@/components/AccountingSummaryExecutiveBlock";
import {
  ACCOUNTING_BADGE_PARTIAL,
  ACCOUNTING_BADGE_STUB,
  AccountingBlockEmptyNotice,
  AccountingBlockLoadingSkeleton,
  AccountingBlockUnavailable,
} from "@/components/accounting-summary/accountingBlockStates";

// ─────────────────────────────────────────────────────────────────────────────
// AccountingSummaryView — Surface Synthèse comptable Lynki
// Spec : SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md (version en-tête du fichier)
// Sprint 01 : navigation + shell ; Sprint 02 : bloc BG pilote + Vault ; Sprint 03 : drill BG→GL
// Libellé produit (RAPPORT_SPRINT_02 §1.1) — pas de "BG métier complète".
const TRIAL_BALANCE_BLOCK_TITLE = "Balance générale — périmètre partiel (OD paie)";
// Doctrine Vault : toutes les données transitent par /api/accounting/* (Vault)
// ─────────────────────────────────────────────────────────────────────────────

interface CompanyOption {
  company_id: string;
  display_name?: string;
}

function extractNumericId(raw: string): number | null {
  const match = raw.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

function buildCompanyIdsParam(ids: number[]): string | null {
  if (ids.length === 0) return null;
  const sorted = Array.from(new Set(ids)).sort((a, b) => a - b);
  return sorted.join(",");
}

interface AccountingSummaryViewProps {
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
}

type AccountingCoverageState = "loading" | "ready" | "partial" | "empty" | "unavailable";

function formatAmount(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// Panneau Grand livre (drill BG → GL — Sprint 03 T18)
// ─────────────────────────────────────────────────────────────────────────────

interface GeneralLedgerPanelProps {
  tenantId: string;
  companyId: string | null;
  accountCode: string;
  period: { from: string; to: string };
  onClose: () => void;
}

function GLSkeleton() {
  return (
    <div className="space-y-2 py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-[var(--border)] animate-pulse" style={{ width: `${60 + (i % 4) * 10}%` }} />
      ))}
    </div>
  );
}

function GeneralLedgerPanel({ tenantId, companyId, accountCode, period, onClose }: GeneralLedgerPanelProps) {
  const [data, setData] = useState<LynkiGeneralLedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchGL = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({
      tenant: tenantId,
      account_code: accountCode,
      date_debut: period.from,
      date_fin: period.to,
      ...(companyId ? { company_ids: companyId } : {}),
    });
    fetch(`/api/accounting/general-ledger?${params}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`gl_http_${r.status}`);
        return r.json();
      })
      .then((d: LynkiGeneralLedgerResponse) => { setData(d); setLoading(false); })
      .catch(() => { setLoading(false); setError(true); });
  }, [tenantId, companyId, accountCode, period.from, period.to]);

  useEffect(() => { fetchGL(); }, [fetchGL]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} aria-label="Fermer" />

      {/* Panneau latéral */}
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-[var(--border)] bg-[var(--bg)] shadow-2xl">
        {/* En-tête panneau */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Grand livre · BG → GL</p>
            <h3 className="mt-0.5 font-mono text-sm font-semibold text-[var(--text)]">{accountCode}</h3>
            <p className="text-[10px] text-[var(--text-muted)]">
              {period.from} → {period.to}
              {data && (
                <span className="ml-2 rounded-full bg-[var(--border)] px-1.5 py-0.5 font-sans text-[9px]">
                  {data.data_source}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors"
            aria-label="Fermer le grand livre"
          >
            ✕
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && <GLSkeleton />}

          {!loading && error && (
            <AccountingBlockUnavailable title="Grand livre — écritures" onRetry={fetchGL} />
          )}

          {!loading && !error && data && (
            <>
              {/* Stub badge */}
              {data.data_source === "stub" && (
                <div className="mb-3 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-3 py-2 text-xs text-[var(--warning)]">
                  {ACCOUNTING_BADGE_STUB} — Vault non joignable pour ce compte.
                </div>
              )}

              {/* Aucune ligne */}
              {data.lines.length === 0 ? (
                <AccountingBlockEmptyNotice>
                  Aucune écriture {data.data_source === "stub" ? "(secours documenté)" : "sur cette période pour ce compte"}.
                </AccountingBlockEmptyNotice>
              ) : (
                <>
                  {/* Tableau écritures */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          <th className="pb-2 pr-3 text-left">Date</th>
                          <th className="pb-2 pr-3 text-left">Pièce</th>
                          <th className="pb-2 pr-3 text-right">Débit</th>
                          <th className="pb-2 pr-3 text-right">Crédit</th>
                          <th className="pb-2 text-right">Solde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lines.map((line: GeneralLedgerLine) => {
                          const balCls = line.balance < 0 ? "text-[var(--negative)]" : line.balance > 0 ? "text-[var(--positive)]" : "text-[var(--text-secondary)]";
                          return (
                            <tr key={`${line.move_id}-${line.line_id}`}
                              className="border-b border-[var(--border)] last:border-0">
                              <td className="py-1.5 pr-3 text-[var(--text-secondary)]">{line.line_date}</td>
                              <td className="py-1.5 pr-3 font-mono text-[var(--text-muted)]">
                                M{line.move_id}·L{line.line_id}
                              </td>
                              <td className="py-1.5 pr-3 text-right tabular-nums text-[var(--text-secondary)]">
                                {line.debit > 0 ? formatAmount(line.debit) : ""}
                              </td>
                              <td className="py-1.5 pr-3 text-right tabular-nums text-[var(--text-secondary)]">
                                {line.credit > 0 ? formatAmount(line.credit) : ""}
                              </td>
                              <td className={`py-1.5 text-right tabular-nums font-semibold ${balCls}`}>
                                {formatAmount(line.balance)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="border-t-2 border-[var(--border)]">
                        <tr className="text-xs font-bold text-[var(--text)]">
                          <td colSpan={2} className="pt-2 pr-3">Total</td>
                          <td className="pt-2 pr-3 text-right tabular-nums">{formatAmount(data.total_debit)}</td>
                          <td className="pt-2 pr-3 text-right tabular-nums">{formatAmount(data.total_credit)}</td>
                          <td className="pt-2 text-right tabular-nums">
                            {formatAmount(data.total_debit - data.total_credit)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Métadonnées */}
                  <div className="mt-4 space-y-1 text-[10px] text-[var(--text-muted)]">
                    <p>Couverture : {data.coverage ?? "—"}</p>
                    <p>Référentiel v{data.referentiel_version}</p>
                    {data.vault_freshness && <p>{data.vault_freshness}</p>}
                    {!data.complete && <p className="text-[var(--warning)]">Couverture partielle (OD paie)</p>}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ligne de balance cliquable (drill → GL)
// ─────────────────────────────────────────────────────────────────────────────

interface TrialBalanceRowProps {
  line: TrialBalanceLine;
  onDrill: (accountCode: string, accountName?: string) => void;
}

function TrialBalanceRow({ line, onDrill }: TrialBalanceRowProps) {
  const balanceClass = line.balance < 0
    ? "text-[var(--negative)]"
    : line.balance > 0
    ? "text-[var(--positive)]"
    : "text-[var(--text-secondary)]";
  return (
    <tr
      className="group border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent-soft)]/20 cursor-pointer transition-colors"
      onClick={() => onDrill(line.account_code, line.account_name)}
      title={`Voir le grand livre du compte ${line.account_code}`}
    >
      <td className="py-2 pr-4 font-mono text-xs text-[var(--text-secondary)] whitespace-nowrap">{line.account_code}</td>
      <td className="py-2 pr-4 text-sm text-[var(--text)] truncate max-w-[200px]" title={line.account_name}>{line.account_name}</td>
      <td className="py-2 pr-4 text-right text-sm tabular-nums whitespace-nowrap text-[var(--text-secondary)]">{formatAmount(line.debit)}</td>
      <td className="py-2 pr-4 text-right text-sm tabular-nums whitespace-nowrap text-[var(--text-secondary)]">{formatAmount(line.credit)}</td>
      <td className={`py-2 text-right text-sm font-semibold tabular-nums whitespace-nowrap ${balanceClass}`}>{formatAmount(line.balance)}</td>
      <td className="py-2 pl-2 text-right">
        <span className="inline-flex items-center text-[10px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
          GL →
        </span>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bloc BG pilote (lynki.accounting.trial_balance) + drill GL
// ─────────────────────────────────────────────────────────────────────────────

interface TrialBalanceBlockProps extends AccountingSummaryViewProps {
  accountPrefixes?: string;
  rubricLabel?: string;
}

function TrialBalanceBlock({ tenantId, companyId, period, accountPrefixes, rubricLabel }: TrialBalanceBlockProps) {
  const [data, setData] = useState<LynkiTrialBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleDrill = useCallback((accountCode: string, accountName?: string) => {
    const params = new URLSearchParams({
      tenant: tenantId,
      date_debut: period.from,
      date_fin: period.to,
      ...(companyId ? { company_ids: companyId } : {}),
      ...(accountName ? { account_name: encodeURIComponent(accountName) } : {}),
    });
    router.push(`/accounting/gl/${encodeURIComponent(accountCode)}?${params}`);
  }, [router, tenantId, companyId, period.from, period.to]);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({
      tenant: tenantId,
      date_debut: period.from,
      date_fin: period.to,
      ...(companyId ? { company_ids: companyId } : {}),
      ...(accountPrefixes ? { account_prefixes: accountPrefixes } : {}),
    });
    fetch(`/api/accounting/trial-balance?${params}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`trial_balance_http_${r.status}`);
        return r.json();
      })
      .then((d: LynkiTrialBalanceResponse) => { setData(d); setLoading(false); })
      .catch(() => { setLoading(false); setError(true); });
  }, [tenantId, companyId, period.from, period.to, accountPrefixes]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const blockTitle = rubricLabel
    ? `Balance générale — ${rubricLabel}`
    : TRIAL_BALANCE_BLOCK_TITLE;

  // ── Chargement ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AccountingBlockLoadingSkeleton id="balance-generale" label="Balance générale" rows={6} />
    );
  }

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <AccountingBlockUnavailable id="balance-generale" title={blockTitle} onRetry={fetchData} />
    );
  }

  // ── Vide / stub ───────────────────────────────────────────────────────────
  if (!data || data.lines.length === 0) {
    const isStub = data?.data_source === "stub";
    return (
      <div id="balance-generale" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--text)]">{blockTitle}</h2>
          <span className="rounded-full bg-[var(--warning)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)] uppercase tracking-wider">
            {isStub ? ACCOUNTING_BADGE_STUB : "Aucune ligne"}
          </span>
          {data && (
            <span className="rounded-full bg-[var(--border)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">
              {data.data_source}
            </span>
          )}
        </div>
        <AccountingBlockEmptyNotice>
          {isStub
            ? "Réponse de secours : le Vault n'a pas répondu. Activez le Vault ou désactivez le mode strict côté API."
            : "Aucune ligne comptable sur cette période (couverture actuelle : OD paie). Élargissez la période ou vérifiez les écritures importées."}
        </AccountingBlockEmptyNotice>
        {data?.referentiel_version && (
          <p className="mt-3 text-[10px] text-[var(--text-muted)]">Référentiel mapping v{data.referentiel_version}</p>
        )}
      </div>
    );
  }

  // ── Données présentes ─────────────────────────────────────────────────────
  const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
  const totalBalance = data.lines.reduce((s, l) => s + l.balance, 0);
  const balanced = Math.abs(totalBalance) < 0.02;

  return (
    <>
      <div id="balance-generale" className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--text)]">{blockTitle}</h2>
            {accountPrefixes && (
              <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider">
                Filtré
              </span>
            )}
            <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider">
              {data.lines.length} compte{data.lines.length > 1 ? "s" : ""}
            </span>
            {balanced && (
              <span className="rounded-full bg-[var(--positive)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--positive)] uppercase tracking-wider">
                Équilibrée
              </span>
            )}
            {!data.complete && (
              <span className="rounded-full bg-[var(--warning)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)] uppercase tracking-wider"
                title="Couverture partielle — périmètre limité">
                {ACCOUNTING_BADGE_PARTIAL}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[10px] text-[var(--text-muted)]">
              Réf. v{data.referentiel_version}
              {data.vault_freshness && <> · {data.vault_freshness}</>}
            </div>
            <ExportButton
              tenantId={tenantId}
              companyId={companyId}
              period={period}
              dataSource={data.data_source}
            />
          </div>
        </div>

        {/* Tableau (lignes cliquables → drill GL) */}
        <div className="overflow-x-auto px-5 pb-4 pt-2">
          <p className="mb-2 text-[10px] text-[var(--text-muted)]">Cliquez sur un compte pour voir le grand livre</p>
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="pb-2 pr-4 text-left">Compte</th>
                <th className="pb-2 pr-4 text-left">Libellé</th>
                <th className="pb-2 pr-4 text-right">Débit</th>
                <th className="pb-2 pr-4 text-right">Crédit</th>
                <th className="pb-2 text-right">Solde</th>
                <th className="pb-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line) => (
              <TrialBalanceRow
                key={line.account_code}
                line={line}
                onDrill={handleDrill}
              />
              ))}
            </tbody>
            <tfoot className="border-t-2 border-[var(--border)]">
              <tr className="bg-[var(--accent-soft)]/10 text-xs font-bold text-[var(--text)]">
                <td colSpan={2} className="pt-2.5 pr-4">Total</td>
                <td className="pt-2.5 pr-4 text-right tabular-nums whitespace-nowrap">{formatAmount(totalDebit)}</td>
                <td className="pt-2.5 pr-4 text-right tabular-nums whitespace-nowrap">{formatAmount(totalCredit)}</td>
                <td className={`pt-2.5 text-right tabular-nums whitespace-nowrap ${balanced ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                  {formatAmount(totalBalance)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Panneau GL retiré — navigation vers /accounting/gl/[account_code] (Sprint 05 T27) */}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bilan / CR par classe PCG (Sprint 07 T39/T40) — lynki.accounting.balance_sheet / income_statement
// ─────────────────────────────────────────────────────────────────────────────

type ClassAggregationApiPath = "/api/accounting/balance-sheet" | "/api/accounting/income-statement";

function ClassAggregationBlock({
  title,
  apiPath,
  tenantId,
  companyId,
  period,
}: {
  title: string;
  apiPath: ClassAggregationApiPath;
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
}) {
  const [data, setData] = useState<LynkiBalanceSheetResponse | LynkiIncomeStatementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({
      tenant: tenantId,
      date_debut: period.from,
      date_fin: period.to,
      ...(companyId ? { company_ids: companyId } : {}),
    });
    fetch(`${apiPath}?${params}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`class_agg_http_${r.status}`);
        return r.json();
      })
      .then((d: LynkiBalanceSheetResponse | LynkiIncomeStatementResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  }, [tenantId, companyId, period.from, period.to, apiPath]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <AccountingBlockLoadingSkeleton label={title} rows={4} />;
  }

  if (error || !data) {
    return <AccountingBlockUnavailable title={title} onRetry={fetchData} />;
  }

  const lines: ClassBalanceLine[] = data.lines ?? [];
  const isStub = data.data_source === "stub";
  const empty = lines.length === 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
          {isStub && (
            <span className="rounded-full bg-[var(--warning)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)] uppercase tracking-wider">
              {ACCOUNTING_BADGE_STUB}
            </span>
          )}
          {!data.complete && !empty && (
            <span className="rounded-full bg-[var(--warning)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)] uppercase tracking-wider">
              {ACCOUNTING_BADGE_PARTIAL}
            </span>
          )}
          <span className="rounded-full bg-[var(--border)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">{data.data_source}</span>
        </div>
        <div className="text-[10px] text-[var(--text-muted)]">
          Réf. v{data.referentiel_version}
          {data.vault_freshness && <> · {data.vault_freshness}</>}
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">
        <p className="text-[10px] leading-relaxed text-[var(--text-secondary)]">{data.perimeter_note}</p>
        {data.coverage && (
          <p className="text-[10px] text-[var(--text-muted)]">
            Couverture : <span className="font-mono">{data.coverage}</span>
          </p>
        )}
        {empty ? (
          <AccountingBlockEmptyNotice>
            {isStub
              ? "Réponse de secours : aucune donnée agrégée."
              : "Aucune ligne pour les classes concernées sur cette période (ou données absentes dans le Vault)."}
          </AccountingBlockEmptyNotice>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="pb-2 pr-4 text-left">Classe</th>
                  <th className="pb-2 pr-4 text-left">Libellé</th>
                  <th className="pb-2 text-right">Solde net</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((row) => (
                  <tr key={row.class} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs text-[var(--text-secondary)]">{row.class}</td>
                    <td className="py-2 pr-4 text-[var(--text)]">{row.label}</td>
                    <td className={`py-2 text-right tabular-nums whitespace-nowrap font-medium ${
                      row.balance < 0 ? "text-[var(--negative)]" : row.balance > 0 ? "text-[var(--positive)]" : "text-[var(--text-secondary)]"
                    }`}>
                      {formatAmount(row.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bouton Export CSV (Sprint 04 T24) — uniquement si data_source=vault
// ─────────────────────────────────────────────────────────────────────────────

interface ExportButtonProps {
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
  dataSource: "vault" | "stub";
}

function ExportButton({ tenantId, companyId, period, dataSource }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (dataSource !== "vault") return null;

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    const params = new URLSearchParams({
      tenant: tenantId,
      date_debut: period.from,
      date_fin: period.to,
      ...(companyId ? { company_ids: companyId } : {}),
    });
    try {
      const res = await fetch(`/api/accounting/trial-balance/export?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setExportError("Export indisponible (Vault non joignable).");
        return;
      }
      const truncated = res.headers.get("X-Lynki-Export-Truncated");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `balance_generale_${tenantId}_${period.from}_${period.to}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (truncated) {
        setExportError(`Export limité à 10 000 lignes (données tronquées).`);
      }
    } catch {
      setExportError("Erreur lors du téléchargement.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] disabled:opacity-50 transition-colors"
      >
        {exporting ? "Export…" : "↓ Exporter CSV"}
      </button>
      {exportError && (
        <p className="text-[10px] text-[var(--warning)]">{exportError}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bloc Rubriques Bilan / CR (Sprint 08 T45/T46)
// ─────────────────────────────────────────────────────────────────────────────

type RubricsApiPath = "/api/accounting/balance-sheet/rubrics" | "/api/accounting/income-statement/rubrics";

const FAVORABLE_UP_IDS = new Set([
  "lynki.rubric.is.gross_margin",
  "lynki.rubric.is.value_added",
  "lynki.rubric.is.ebitda",
  "lynki.rubric.is.operating_profit",
  "lynki.rubric.is.net_income",
  "lynki.rubric.is.revenue",
  "lynki.rubric.is.other_operating_income",
  "lynki.rubric.is.financial_income",
  "lynki.rubric.is.exceptional_income",
]);

const SIG_IDS = new Set([
  "lynki.rubric.is.gross_margin",
  "lynki.rubric.is.value_added",
  "lynki.rubric.is.ebitda",
]);

const FORMULA_IDS = new Set([
  "lynki.rubric.is.gross_margin",
  "lynki.rubric.is.value_added",
  "lynki.rubric.is.ebitda",
  "lynki.rubric.is.operating_profit",
  "lynki.rubric.is.financial_result",
  "lynki.rubric.is.exceptional_result",
  "lynki.rubric.is.net_income",
]);

function variationColor(rubricId: string, delta: number | null): string {
  if (delta === null || Math.abs(delta) < 0.01) return "text-[var(--text-muted)]";
  if (!FAVORABLE_UP_IDS.has(rubricId)) return "text-[var(--text-secondary)]";
  return delta > 0 ? "text-[var(--positive)]" : "text-[var(--negative)]";
}

function formatDeltaPct(current: number, previous: number | null): string {
  if (previous === null || previous === 0) return "—";
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)} %`;
}

function RubricsBlock({
  title,
  apiPath,
  tenantId,
  companyId,
  period,
  onDrillBG,
  enableCompare,
}: {
  title: string;
  apiPath: RubricsApiPath;
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
  onDrillBG?: (prefixes: string, label: string) => void;
  enableCompare?: boolean;
}) {
  const [data, setData] = useState<LynkiBalanceSheetRubricsResponse | LynkiIncomeStatementRubricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({
      tenant: tenantId,
      date_debut: period.from,
      date_fin: period.to,
      ...(companyId ? { company_ids: companyId } : {}),
      ...(enableCompare ? { compare: "n-1" } : {}),
    });
    fetch(`${apiPath}?${params}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`rubrics_http_${r.status}`);
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setLoading(false); setError(true); });
  }, [tenantId, companyId, period.from, period.to, apiPath, enableCompare]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <AccountingBlockLoadingSkeleton label={title} rows={6} />;
  }

  if (error || !data) {
    return <AccountingBlockUnavailable title={title} onRetry={fetchData} />;
  }

  const lines: RubricLine[] = data.lines ?? [];
  const isStub = data.data_source === "stub";
  const empty = lines.length === 0;
  const hasComparison = data.compare === "n-1" && Array.isArray(data.lines_previous);

  const previousByRubricId = new Map<string, RubricLine>();
  if (hasComparison && data.lines_previous) {
    for (const prev of data.lines_previous) {
      previousByRubricId.set(prev.rubric_id, prev);
    }
  }

  const sections = Array.from(new Set(lines.map((l) => l.section)));
  const bsData = data as LynkiBalanceSheetRubricsResponse;
  const hasTotals = bsData.total_actif !== undefined;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider">
            rubriques
          </span>
          {hasComparison && (
            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
              Comparatif N/N-1
            </span>
          )}
          {isStub && (
            <span className="rounded-full bg-[var(--warning)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)] uppercase tracking-wider">
              {ACCOUNTING_BADGE_STUB}
            </span>
          )}
          {!data.complete && !empty && (
            <span className="rounded-full bg-[var(--warning)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)] uppercase tracking-wider">
              {ACCOUNTING_BADGE_PARTIAL}
            </span>
          )}
          <span className="rounded-full bg-[var(--border)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">{data.data_source}</span>
        </div>
        <div className="text-[10px] text-[var(--text-muted)]">
          Réf. v{data.referentiel_version} · {data.detail_level}
          {data.vault_freshness && <> · {data.vault_freshness}</>}
          {hasComparison && data.period_previous_from && (
            <> · N-1 : {data.period_previous_from} → {data.period_previous_to}</>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        {!empty && !isStub && (
          <div className="mb-4 flex justify-end">
            <RubricsExportButton apiPath={apiPath} tenantId={tenantId} companyId={companyId} period={period} enableCompare={enableCompare} />
          </div>
        )}
        {empty ? (
          <AccountingBlockEmptyNotice>
            {isStub ? "Réponse de secours — aucune donnée." : "Aucune rubrique peuplée sur cette période."}
          </AccountingBlockEmptyNotice>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => {
              const sectionLines = lines.filter((l) => l.section === section);
              const sectionTotal = sectionLines.reduce((s, l) => s + l.amount, 0);
              const sectionLabel = section === "actif" ? "Actif" : section === "passif" ? "Passif" : section === "exploitation" ? "Exploitation" : "Résultats";
              return (
                <div key={section}>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">{sectionLabel}</h3>
                  <table className="w-full border-separate border-spacing-0 text-sm">
                    {hasComparison && (
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                          <th className="pb-1 text-left font-medium">Rubrique</th>
                          <th className="pb-1 text-right font-medium">N</th>
                          <th className="pb-1 text-right font-medium">N-1</th>
                          <th className="pb-1 text-right font-medium">Δ</th>
                          <th className="pb-1 text-right font-medium">Δ %</th>
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {sectionLines.map((row) => {
                        const isFormula = FORMULA_IDS.has(row.rubric_id);
                        const isSIG = SIG_IDS.has(row.rubric_id);
                        const hasDrill = !isFormula && row.account_filter && row.account_filter.length > 0 && onDrillBG;
                        const handleDrill = hasDrill ? () => {
                          onDrillBG(row.account_filter!.join(","), row.label);
                        } : undefined;

                        const prevLine = previousByRubricId.get(row.rubric_id);
                        const amountN1 = prevLine ? prevLine.amount : null;
                        const delta = amountN1 !== null ? row.amount - amountN1 : null;

                        return (
                          <tr key={row.rubric_id}
                            className={`border-b border-[var(--border)] last:border-0 ${isFormula ? "bg-[var(--accent-soft)]/10" : ""} ${hasDrill ? "cursor-pointer hover:bg-[var(--accent-soft)]/5" : ""}`}
                            onClick={handleDrill}
                            title={hasDrill ? `Voir la BG filtrée : comptes ${row.account_filter!.join(", ")}` : undefined}>
                            <td className="py-2 pr-4 text-[var(--text)]">
                              <span className={isFormula || isSIG ? "font-semibold" : ""}>{row.label}</span>
                              <span className="ml-2 text-[9px] font-mono text-[var(--text-muted)]">{row.rubric_id.split(".").pop()}</span>
                              {isSIG && <span className="ml-1 text-[9px] text-blue-400">SIG</span>}
                              {hasDrill && <span className="ml-1 text-[9px] text-[var(--accent)]">→ BG</span>}
                            </td>
                            <td className={`py-2 text-right tabular-nums whitespace-nowrap font-medium ${
                              row.amount < 0 ? "text-[var(--negative)]" : row.amount > 0 ? "text-[var(--positive)]" : "text-[var(--text-secondary)]"
                            } ${isFormula ? "font-bold" : ""}`}>
                              {formatAmount(row.amount)}
                            </td>
                            {hasComparison && (
                              <>
                                <td className={`py-2 text-right tabular-nums whitespace-nowrap text-[var(--text-secondary)] ${isFormula ? "font-semibold" : ""}`}>
                                  {amountN1 !== null ? formatAmount(amountN1) : "—"}
                                </td>
                                <td className={`py-2 text-right tabular-nums whitespace-nowrap ${variationColor(row.rubric_id, delta)} ${isFormula ? "font-semibold" : ""}`}>
                                  {delta !== null ? (delta > 0 ? "+" : "") + formatAmount(delta) : "—"}
                                </td>
                                <td className={`py-2 text-right tabular-nums whitespace-nowrap text-xs ${variationColor(row.rubric_id, delta)}`}>
                                  {formatDeltaPct(row.amount, amountN1)}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-[var(--border)]">
                      <tr className="bg-[var(--accent-soft)]/10 text-xs font-bold text-[var(--text)]">
                        <td className="pt-2.5">Total {sectionLabel}</td>
                        <td className={`pt-2.5 text-right tabular-nums whitespace-nowrap ${sectionTotal < 0 ? "text-[var(--negative)]" : "text-[var(--positive)]"}`}>
                          {formatAmount(sectionTotal)}
                        </td>
                        {hasComparison && (
                          <>
                            <td className="pt-2.5 text-right tabular-nums whitespace-nowrap text-[var(--text-secondary)]">
                              {(() => {
                                const prevTotal = sectionLines.reduce((s, l) => {
                                  const p = previousByRubricId.get(l.rubric_id);
                                  return s + (p ? p.amount : 0);
                                }, 0);
                                return formatAmount(prevTotal);
                              })()}
                            </td>
                            <td className="pt-2" />
                            <td className="pt-2" />
                          </>
                        )}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })}
            {hasTotals && bsData.total_actif !== undefined && bsData.total_passif !== undefined && (
              <div className="flex items-center justify-between rounded-lg bg-[var(--accent-soft)]/20 px-4 py-2 text-xs">
                <span className="font-semibold text-[var(--text)]">Total Actif : {formatAmount(bsData.total_actif)}</span>
                <span className="font-semibold text-[var(--text)]">Total Passif : {formatAmount(bsData.total_passif)}</span>
                {Math.abs(bsData.total_actif - bsData.total_passif) < 0.02 ? (
                  <span className="rounded-full bg-[var(--positive)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--positive)] uppercase">Équilibré</span>
                ) : (
                  <span className="rounded-full bg-[var(--warning)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)] uppercase"
                    title={`Écart : ${formatAmount(bsData.total_actif - bsData.total_passif)}`}>
                    Écart : {formatAmount(bsData.total_actif - bsData.total_passif)}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bouton Export CSV Rubriques (Sprint 08 T47)
// ─────────────────────────────────────────────────────────────────────────────

function RubricsExportButton({
  apiPath,
  tenantId,
  companyId,
  period,
  enableCompare,
}: {
  apiPath: RubricsApiPath;
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
  enableCompare?: boolean;
}) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    const params = new URLSearchParams({
      tenant: tenantId,
      date_debut: period.from,
      date_fin: period.to,
      ...(companyId ? { company_ids: companyId } : {}),
      ...(enableCompare ? { compare: "n-1" } : {}),
    });
    try {
      const res = await fetch(`${apiPath}/export?${params}`, { cache: "no-store" });
      if (!res.ok) {
        setExportError("Export indisponible (Vault non joignable).");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const fallbackName = apiPath.includes("balance-sheet")
        ? `bilan_rubriques_${tenantId}_${period.from}_${period.to}.csv`
        : `cr_rubriques_${tenantId}_${period.from}_${period.to}.csv`;
      const filename = match ? match[1] : fallbackName;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Erreur lors du téléchargement.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={handleExport} disabled={exporting}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] disabled:opacity-50 transition-colors">
        {exporting ? "Export…" : "↓ Exporter CSV (rubriques)"}
      </button>
      {exportError && (
        <p className="text-[10px] text-[var(--warning)]">{exportError}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bloc Balances tiers (Sprint 09 T52)
// ─────────────────────────────────────────────────────────────────────────────

type AgedApiPath = "/api/accounting/aged-receivables" | "/api/accounting/aged-payables";

const AGED_TRANCHES = [
  { key: "not_due" as const, label: "Non échu" },
  { key: "range_0_30" as const, label: "0–30j" },
  { key: "range_31_60" as const, label: "31–60j" },
  { key: "range_61_90" as const, label: "61–90j" },
  { key: "range_91_180" as const, label: "91–180j" },
  { key: "range_over_180" as const, label: ">180j" },
];

function AgedBalanceExportButton({
  apiPath,
  tenantId,
  companyId,
  asOfDate,
}: {
  apiPath: AgedApiPath;
  tenantId: string;
  companyId: string | null;
  asOfDate: string;
}) {
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        tenant: tenantId,
        as_of_date: asOfDate,
        ...(companyId ? { company_ids: companyId } : {}),
      });
      const res = await fetch(`${apiPath}/export?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("export_failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      a.download = filenameMatch ? filenameMatch[1] : `aged_balance_${tenantId}_${asOfDate}.csv`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
    setExporting(false);
  };
  return (
    <button type="button" onClick={handleExport} disabled={exporting}
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors disabled:opacity-50">
      {exporting ? "Export…" : "Exporter CSV"}
    </button>
  );
}

function AgedBalanceBlock({
  title,
  apiPath,
  tenantId,
  companyId,
  period,
}: {
  title: string;
  apiPath: AgedApiPath;
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
}) {
  const [data, setData] = useState<LynkiAgedReceivablesResponse | LynkiAgedPayablesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({
      tenant: tenantId,
      as_of_date: period.to,
      ...(companyId ? { company_ids: companyId } : {}),
    });
    fetch(`${apiPath}?${params}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`aged_http_${r.status}`);
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setLoading(false); setError(true); });
  }, [tenantId, companyId, period.to, apiPath]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <AccountingBlockLoadingSkeleton label={title} rows={4} />;
  }

  if (error || !data) {
    return <AccountingBlockUnavailable title={title} onRetry={fetchData} />;
  }

  const lines: AgedBalanceLine[] = data.lines ?? [];
  const isStub = data.data_source === "stub";
  const empty = lines.length === 0;

  const totals = {
    not_due: lines.reduce((s, l) => s + l.not_due, 0),
    range_0_30: lines.reduce((s, l) => s + l.range_0_30, 0),
    range_31_60: lines.reduce((s, l) => s + l.range_31_60, 0),
    range_61_90: lines.reduce((s, l) => s + l.range_61_90, 0),
    range_91_180: lines.reduce((s, l) => s + l.range_91_180, 0),
    range_over_180: lines.reduce((s, l) => s + l.range_over_180, 0),
    total: lines.reduce((s, l) => s + l.total, 0),
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider">
            {lines.length} partenaire{lines.length > 1 ? "s" : ""}
          </span>
          {isStub && (
            <span className="rounded-full bg-[var(--warning)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)] uppercase tracking-wider">
              {ACCOUNTING_BADGE_STUB}
            </span>
          )}
          <span className="rounded-full bg-[var(--border)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">{data.data_source}</span>
        </div>
        <div className="text-[10px] text-[var(--text-muted)]">
          Au {data.as_of_date} · Réf. v{data.referentiel_version}
        </div>
      </div>

      <div className="px-5 py-4">
        {data.aging_basis && (
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              data.aging_basis === "date_maturity"
                ? "bg-emerald-500/15 text-emerald-400"
                : data.aging_basis === "mixed"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-[var(--border)] text-[var(--text-muted)]"
            }`}>
              {data.aging_basis === "date_maturity" ? "Échéance" : data.aging_basis === "mixed" ? "Mixte" : "Date écriture"}
            </span>
          </div>
        )}
        {data.v2_limitations && data.v2_limitations.length > 0 && (
          <div className="mb-3 rounded-lg bg-[var(--warning)]/5 border border-[var(--warning)]/20 px-3 py-2 text-[10px] text-[var(--text-secondary)] space-y-0.5">
            {data.v2_limitations.map((lim, i) => (
              <p key={i}>{lim}</p>
            ))}
          </div>
        )}
        {data.v1_limitations && !data.v2_limitations && (
          <p className="mb-3 rounded-lg bg-[var(--warning)]/5 border border-[var(--warning)]/20 px-3 py-2 text-[10px] text-[var(--text-secondary)]">
            V1 : {data.v1_limitations}
          </p>
        )}
        {!empty && !isStub && (
          <div className="mb-3 flex justify-end">
            <AgedBalanceExportButton apiPath={apiPath} tenantId={tenantId} companyId={companyId} asOfDate={period.to} />
          </div>
        )}
        {empty ? (
          <AccountingBlockEmptyNotice>
            {isStub ? "Réponse de secours — aucune donnée." : "Aucun encours tiers sur cette date."}
          </AccountingBlockEmptyNotice>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-xs">
              <thead>
                <tr className="border-b-2 border-[var(--border)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="py-2 text-left font-semibold">Partenaire</th>
                  {AGED_TRANCHES.map((t) => (
                    <th key={t.key} className="py-2 text-right font-semibold">{t.label}</th>
                  ))}
                  <th className="py-2 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((row) => (
                  <tr key={row.partner_id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent-soft)]/5">
                    <td className="py-1.5 pr-3 text-[var(--text)]">
                      {row.partner_name}
                      <span className="ml-1 text-[9px] font-mono text-[var(--text-muted)]">#{row.partner_id}</span>
                    </td>
                    {AGED_TRANCHES.map((t) => {
                      const val = row[t.key];
                      return (
                        <td key={t.key} className={`py-1.5 text-right tabular-nums whitespace-nowrap ${
                          Math.abs(val) < 0.01 ? "text-[var(--text-muted)]" : val > 0 ? "text-[var(--text)]" : "text-[var(--negative)]"
                        }`}>
                          {Math.abs(val) < 0.01 ? "—" : formatAmount(val)}
                        </td>
                      );
                    })}
                    <td className={`py-1.5 text-right tabular-nums whitespace-nowrap font-semibold ${
                      row.total < 0 ? "text-[var(--negative)]" : "text-[var(--text)]"
                    }`}>
                      {formatAmount(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-[var(--border)]">
                <tr className="bg-[var(--accent-soft)]/10 text-xs font-bold text-[var(--text)]">
                  <td className="pt-2.5">Total</td>
                  {AGED_TRANCHES.map((t) => (
                    <td key={t.key} className="pt-2.5 text-right tabular-nums whitespace-nowrap">{formatAmount(totals[t.key])}</td>
                  ))}
                  <td className="pt-2.5 text-right tabular-nums whitespace-nowrap">{formatAmount(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shell Synthèse comptable
// ─────────────────────────────────────────────────────────────────────────────

type PeriodMode = "current" | "n-1" | "quarter" | "semester" | "custom";

function quarterPeriod(base: { from: string; to: string }): { from: string; to: string } {
  const now = new Date();
  const year = parseInt(base.from.slice(0, 4), 10);
  const q = Math.floor(now.getMonth() / 3);
  const qStart = new Date(year, q * 3, 1);
  const qEnd = new Date(year, q * 3 + 3, 0);
  return { from: qStart.toISOString().slice(0, 10), to: qEnd.toISOString().slice(0, 10) };
}

function semesterPeriod(base: { from: string; to: string }): { from: string; to: string } {
  const now = new Date();
  const year = parseInt(base.from.slice(0, 4), 10);
  const half = now.getMonth() < 6 ? 0 : 1;
  const sStart = new Date(year, half * 6, 1);
  const sEnd = new Date(year, half * 6 + 6, 0);
  return { from: sStart.toISOString().slice(0, 10), to: sEnd.toISOString().slice(0, 10) };
}

function shiftYear(d: string): string {
  const dt = new Date(d + "T00:00:00");
  dt.setFullYear(dt.getFullYear() - 1);
  return dt.toISOString().slice(0, 10);
}

function computePeriod(
  base: { from: string; to: string },
  mode: PeriodMode,
  customRange?: { from: string; to: string }
): { from: string; to: string } {
  switch (mode) {
    case "current": return base;
    case "n-1": return { from: shiftYear(base.from), to: shiftYear(base.to) };
    case "quarter": return quarterPeriod(base);
    case "semester": return semesterPeriod(base);
    case "custom": return customRange ?? base;
  }
}

function periodLabel(mode: PeriodMode, p: { from: string; to: string }): string {
  switch (mode) {
    case "current": return `Exercice ${p.from.slice(0, 4)}`;
    case "n-1": return `Exercice N-1 (${p.from.slice(0, 4)})`;
    case "quarter": return `Trimestre ${p.from} → ${p.to}`;
    case "semester": return `Semestre ${p.from} → ${p.to}`;
    case "custom": return `${p.from} → ${p.to}`;
  }
}

export function AccountingSummaryView({ tenantId, companyId, period }: AccountingSummaryViewProps) {
  const [drillBG, setDrillBG] = useState<{ prefixes: string; label: string } | null>(null);
  const [periodMode, setPeriodMode] = useState<PeriodMode>("current");
  const [customRange, setCustomRange] = useState<{ from: string; to: string }>({ from: period.from, to: period.to });
  const effectivePeriod = computePeriod(period, periodMode, customRange);
  const enableCompare = periodMode !== "n-1";
  const [coverageState, setCoverageState] = useState<AccountingCoverageState>("loading");

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/companies?tenant=${encodeURIComponent(tenantId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: CompanyOption[]) => {
        const list = Array.isArray(data) ? data : [];
        setCompanies(list);
        if (companyId) {
          const n = extractNumericId(companyId);
          if (n !== null) setSelectedIds([n]);
        }
      })
      .catch(() => setCompanies([]))
      .finally(() => setCompaniesLoaded(true));
  }, [tenantId, companyId]);

  const companyIdsParam = buildCompanyIdsParam(selectedIds);
  const companyLabel = selectedIds.length === 0
    ? "Toutes les sociétés"
    : selectedIds.length === 1
      ? companies.find((c) => extractNumericId(c.company_id) === selectedIds[0])?.display_name ?? `Société ${selectedIds[0]}`
      : `${selectedIds.length} sociétés`;

  const toggleCompany = useCallback((numId: number) => {
    setSelectedIds((prev) =>
      prev.includes(numId) ? prev.filter((id) => id !== numId) : Array.from(new Set([...prev, numId])).sort((a, b) => a - b)
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    setCoverageState("loading");

    const params = new URLSearchParams({
      tenant: tenantId,
      date_debut: effectivePeriod.from,
      date_fin: effectivePeriod.to,
      ...(companyIdsParam ? { company_ids: companyIdsParam } : {}),
    });

    const parseCount = (raw: unknown): number => {
      if (!raw || typeof raw !== "object") return 0;
      const data = raw as { lines?: unknown[] };
      return Array.isArray(data.lines) ? data.lines.length : 0;
    };

    Promise.allSettled([
      fetch(`/api/accounting/trial-balance?${params}`, { cache: "no-store", signal: controller.signal }).then((r) => r.ok ? r.json() : null),
      fetch(`/api/accounting/balance-sheet/rubrics?${params}`, { cache: "no-store", signal: controller.signal }).then((r) => r.ok ? r.json() : null),
      fetch(`/api/accounting/income-statement/rubrics?${params}`, { cache: "no-store", signal: controller.signal }).then((r) => r.ok ? r.json() : null),
    ])
      .then((results) => {
        if (controller.signal.aborted) return;
        const fulfilled = results
          .filter((r): r is PromiseFulfilledResult<unknown> => r.status === "fulfilled")
          .map((r) => r.value)
          .filter(Boolean);

        if (fulfilled.length === 0) {
          setCoverageState("unavailable");
          return;
        }

        const counts = fulfilled.map((v) => parseCount(v));
        const totalLines = counts.reduce((sum, c) => sum + c, 0);
        const hasAnyLine = totalLines > 0;

        let hasPartial = false;
        for (const v of fulfilled) {
          if (typeof v === "object" && v !== null && "complete" in (v as object)) {
            const complete = (v as { complete?: boolean }).complete;
            if (complete === false) hasPartial = true;
          }
        }

        if (!hasAnyLine) {
          setCoverageState("empty");
          return;
        }
        setCoverageState(hasPartial ? "partial" : "ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setCoverageState("unavailable");
      })
      .finally(() => clearTimeout(timer));

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [tenantId, companyIdsParam, effectivePeriod.from, effectivePeriod.to]);

  return (
    <div className="synthese-scope mx-auto flex min-h-0 flex-1 w-full max-w-5xl flex-col px-4 pb-16 pt-6 space-y-6">
      {/* ─── Header S18 : titre + filtres + metadata ─── */}
      <header className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="sv2-label text-[var(--sv2-text-muted)] mb-1">Synthèse comptable</p>
            <h1 className="text-xl font-bold text-[var(--sv2-text)]">Lecture synthétique du dossier</h1>
            <p className="mt-1 text-xs text-[var(--sv2-text-muted)]">
              Source : Vault · {periodLabel(periodMode, effectivePeriod)}
              {companiesLoaded && <span className="ml-1">· {companyLabel}</span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {companiesLoaded && companies.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="sv2-label text-[var(--sv2-text-muted)]">Sociétés</label>
                <div className="relative group">
                  <button type="button"
                    className="sv2-btn text-xs min-w-[140px] text-left">
                    {companyLabel}
                  </button>
                  <div className="absolute right-0 top-full z-50 mt-1 hidden group-focus-within:block sv2-inner shadow-lg min-w-[200px] max-h-60 overflow-auto">
                    <button type="button"
                      onClick={() => setSelectedIds([])}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--sv2-accent)]/10 transition-colors ${selectedIds.length === 0 ? "font-bold text-[var(--sv2-accent)]" : "text-[var(--sv2-text)]"}`}>
                      Toutes les sociétés
                    </button>
                    {companies.map((c) => {
                      const numId = extractNumericId(c.company_id);
                      if (numId === null) return null;
                      const isSelected = selectedIds.includes(numId);
                      return (
                        <button type="button" key={c.company_id}
                          onClick={() => toggleCompany(numId)}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--sv2-accent)]/10 transition-colors ${isSelected ? "font-bold text-[var(--sv2-accent)]" : "text-[var(--sv2-text)]"}`}>
                          {isSelected ? "✓ " : ""}{c.display_name ?? c.company_id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <label htmlFor="period-selector" className="sv2-label text-[var(--sv2-text-muted)]">
                Période
              </label>
              <select
                id="period-selector"
                value={periodMode}
                onChange={(e) => setPeriodMode(e.target.value as PeriodMode)}
                className="sv2-btn text-xs"
              >
                <option value="current">Exercice courant ({period.from.slice(0, 4)})</option>
                <option value="n-1">Exercice N-1 ({parseInt(period.from.slice(0, 4), 10) - 1})</option>
                <option value="quarter">Trimestre courant</option>
                <option value="semester">Semestre courant</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>
            {periodMode === "custom" && (
              <div className="flex items-center gap-1.5">
                <input type="date" value={customRange.from}
                  onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value }))}
                  className="sv2-btn text-xs px-2 py-1" />
                <span className="text-xs text-[var(--sv2-text-muted)]">→</span>
                <input type="date" value={customRange.to}
                  onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value }))}
                  className="sv2-btn text-xs px-2 py-1" />
              </div>
            )}
          </div>
        </div>

        {/* Badges contextuels (S18 T99 — matrice #1 : header badges honnêtes) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="sv2-badge sv2-badge-accent">Source : Vault</span>
          <span className="sv2-badge sv2-badge-unavailable">{companyLabel}</span>
          <span className="sv2-badge sv2-badge-unavailable">{periodLabel(periodMode, effectivePeriod)}</span>
        </div>

        {coverageState !== "ready" && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor:
                coverageState === "unavailable"
                  ? "color-mix(in srgb, var(--sv2-warning) 40%, transparent)"
                  : "var(--sv2-border)",
              background:
                coverageState === "unavailable"
                  ? "color-mix(in srgb, var(--sv2-warning) 10%, transparent)"
                  : "var(--sv2-surface)",
            }}
          >
            {coverageState === "loading" && (
              <p className="text-[var(--sv2-text-muted)]">
                Vérification du périmètre comptable en cours…
              </p>
            )}
            {coverageState === "empty" && (
              <p className="text-[var(--sv2-text-muted)]">
                Les données comptables sont actuellement insuffisantes pour alimenter toutes les sections.
                La structure de synthèse reste disponible avec des états vides par bloc.
              </p>
            )}
            {coverageState === "partial" && (
              <p className="text-[var(--sv2-text-muted)]">
                La synthèse est disponible avec une couverture partielle sur ce périmètre.
                Certains blocs peuvent afficher des valeurs incomplètes.
              </p>
            )}
            {coverageState === "unavailable" && (
              <p className="text-[var(--sv2-text-muted)]">
                Les restitutions comptables ne sont pas joignables pour le moment.
                Les blocs conservent un affichage stable et indiquent leur indisponibilité.
              </p>
            )}
          </div>
        )}
      </header>

      <AccountingSummaryExecutiveBlock
        periodLabel={periodLabel(periodMode, effectivePeriod)}
        companyLabel={companyLabel}
        companiesLoaded={companiesLoaded}
        coverageState={coverageState}
        enableCompare={enableCompare}
      />

      {/* ─── Vue d'ensemble : chaîne de lecture (T99 matrice #2) ─── */}
      <div className="sv2-card sv2-card-highlight p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="sv2-label text-[var(--sv2-text-muted)]">Vue d&apos;ensemble</p>
            <p className="mt-1 text-sm text-[var(--sv2-text-muted)]">
              Surface de restitution comptable. Les données affichées proviennent du Vault et sont restituées sur le périmètre sélectionné.
            </p>
          </div>
          <div className="sv2-inner px-4 py-2.5 text-xs font-medium text-[var(--sv2-text)]">
            Synthèse → Balance générale → Grand livre → Écriture
          </div>
        </div>
      </div>

      {/* Sprint 16 T89 — Fil d'Ariane réel (drill BG) */}
      <AccountingSummaryBreadcrumb drillFilter={drillBG} onClearDrill={() => setDrillBG(null)} />

      {/* S15 T84 — Bloc confiance (invariant §1.1 : toujours en tête) */}
      <BankReconciliationBlock tenantId={tenantId} companyId={companyIdsParam} period={effectivePeriod} />

      {/* S16 T88 — Lecture haute (KPI) */}
      <AccountingSummaryKpiCards tenantId={tenantId} companyId={companyIdsParam} period={effectivePeriod} />

      {/* S17/S18 — Lecture visuelle (charts) */}
      <section className="space-y-5" aria-label="Lecture graphique">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          <AccountingSummaryTrendChart tenantId={tenantId} companyId={companyIdsParam} period={effectivePeriod} />
          <AccountingSummaryBreakdownChart tenantId={tenantId} companyId={companyIdsParam} period={effectivePeriod} />
        </div>
      </section>

      {/* S17/S18 — Diva + Preuve (grille côte à côte sur xl) */}
      <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-5 items-start" aria-label="Analyse et preuve">
        <AccountingInsightBlock
          tenantId={tenantId}
          companyId={companyIdsParam}
          period={effectivePeriod}
          referentielVersion="1.1"
        />
        <AccountingSummaryProofBlock tenantId={tenantId} companyId={companyIdsParam} period={effectivePeriod} />
      </section>

      {/* S18 T103 — Points d'attention + Documentation / CODIR */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start" aria-label="Points d'attention et documentation">
        <AccountingSummaryAlerts tenantId={tenantId} companyId={companyIdsParam} period={effectivePeriod} />
        <AccountingSummaryCodirBlock
          tenantId={tenantId}
          companyId={companyIdsParam}
          period={effectivePeriod}
          docxAvailable={false}
        />
      </section>

      {/* Chaîne : Synthèse → BG pilote → GL (drill Sprint 03) */}
      <TrialBalanceBlock tenantId={tenantId} companyId={companyIdsParam} period={effectivePeriod}
        accountPrefixes={drillBG?.prefixes} rubricLabel={drillBG?.label} />
      {drillBG && (
        <button type="button" onClick={() => setDrillBG(null)}
          className="self-start sv2-btn text-xs -mt-4">
          ← Revenir à la BG complète
        </button>
      )}

      {/* Sprint 08 — Bilan / CR par rubriques PCG */}
      <RubricsBlock
        title="Bilan"
        apiPath="/api/accounting/balance-sheet/rubrics"
        tenantId={tenantId}
        companyId={companyIdsParam}
        period={effectivePeriod}
        onDrillBG={(prefixes, label) => setDrillBG({ prefixes, label })}
        enableCompare={enableCompare}
      />
      <RubricsBlock
        title="Compte de résultat"
        apiPath="/api/accounting/income-statement/rubrics"
        tenantId={tenantId}
        companyId={companyIdsParam}
        period={effectivePeriod}
        onDrillBG={(prefixes, label) => setDrillBG({ prefixes, label })}
        enableCompare={enableCompare}
      />

      {/* Sprint 07 — vue classes PCG (backward compatibility) */}
      <details className="group">
        <summary className="cursor-pointer text-xs text-[var(--sv2-text-muted)] hover:text-[var(--sv2-accent)] transition-colors">
          Afficher l&apos;agrégat par classes PCG (premier incrément)
        </summary>
        <div className="mt-3 space-y-4">
          <ClassAggregationBlock
            title="Bilan (agrégat par classe 1–5) — premier incrément"
            apiPath="/api/accounting/balance-sheet"
            tenantId={tenantId}
            companyId={companyIdsParam}
            period={effectivePeriod}
          />
          <ClassAggregationBlock
            title="Compte de résultat (agrégat par classe 6–7) — premier incrément"
            apiPath="/api/accounting/income-statement"
            tenantId={tenantId}
            companyId={companyIdsParam}
            period={effectivePeriod}
          />
        </div>
      </details>

      {/* Sprint 09 — Bloc 3 : Balances tiers */}
      <AgedBalanceBlock
        title="Balance clients"
        apiPath="/api/accounting/aged-receivables"
        tenantId={tenantId}
        companyId={companyIdsParam}
        period={effectivePeriod}
      />
      <AgedBalanceBlock
        title="Balance fournisseurs"
        apiPath="/api/accounting/aged-payables"
        tenantId={tenantId}
        companyId={companyIdsParam}
        period={effectivePeriod}
      />
    </div>
  );
}
