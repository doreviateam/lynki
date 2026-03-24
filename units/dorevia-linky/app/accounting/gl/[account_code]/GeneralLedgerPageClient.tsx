"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type {
  LynkiGeneralLedgerResponse,
  GeneralLedgerLine,
} from "@/app/api/accounting/general-ledger/route";

const DEFAULT_PAGE_SIZE = 100;

interface Props {
  accountCode: string;
  accountName: string;
  tenant: string;
  dateDebut: string;
  dateFin: string;
  companyId: string | null;
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// Bouton Export GL (T29/T35) — uniquement si data_source=vault
// ─────────────────────────────────────────────────────────────────────────────

function GLExportButton({ accountCode, tenant, dateDebut, dateFin, companyId, journalCode, partnerName, dataSource }: {
  accountCode: string; tenant: string; dateDebut: string; dateFin: string;
  companyId: string | null; journalCode: string; partnerName: string; dataSource: "vault" | "stub";
}) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (dataSource !== "vault") return null;

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    const params = new URLSearchParams({
      tenant, account_code: accountCode, date_debut: dateDebut, date_fin: dateFin,
      ...(companyId ? { company_id: companyId } : {}),
      ...(journalCode ? { journal_code: journalCode } : {}),
      ...(partnerName ? { partner_name: partnerName } : {}),
    });
    try {
      const res = await fetch(`/api/accounting/general-ledger/export?${params}`, { cache: "no-store" });
      if (!res.ok) { setExportError("Export indisponible (Vault non joignable)."); return; }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `grand_livre_${accountCode}_${tenant}_${dateDebut}_${dateFin}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      const truncated = res.headers.get("X-Lynki-Export-Truncated");
      if (truncated) setExportError("Export limité à 10 000 lignes.");
    } catch { setExportError("Erreur lors du téléchargement."); }
    finally { setExporting(false); }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={handleExport} disabled={exporting}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] disabled:opacity-50 transition-colors">
        {exporting ? "Export…" : "↓ Exporter CSV"}
      </button>
      {exportError && <p className="text-[10px] text-[var(--warning)]">{exportError}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Breadcrumb (T28)
// ─────────────────────────────────────────────────────────────────────────────

function Breadcrumb({ accountCode, accountName, dateDebut, dateFin, tenant, companyId }: {
  accountCode: string; accountName: string;
  dateDebut: string; dateFin: string; tenant: string; companyId: string | null;
}) {
  const bgParams = new URLSearchParams({
    view: "synthese",
    ...(tenant !== "core" ? { tenant } : {}),
    ...(dateDebut ? { date_debut: dateDebut } : {}),
    ...(dateFin ? { date_fin: dateFin } : {}),
    ...(companyId ? { company_id: companyId } : {}),
  });
  const bgHref = `/?${bgParams.toString()}#balance-generale`;

  return (
    <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
      <Link href={bgHref.replace(/#.*$/, "")} className="hover:text-[var(--text)] transition-colors">Synthèse</Link>
      <span aria-hidden>›</span>
      <Link href={bgHref} className="hover:text-[var(--text)] transition-colors">Balance générale</Link>
      <span aria-hidden>›</span>
      <span className="text-[var(--text-secondary)]">Grand livre</span>
      <span aria-hidden>›</span>
      <span className="font-mono font-semibold text-[var(--text)]" aria-current="page">
        {accountCode}
        {accountName !== accountCode && (
          <span className="ml-1 font-sans font-normal text-[var(--text-muted)]">— {accountName}</span>
        )}
      </span>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Barre de filtres (T33)
// ─────────────────────────────────────────────────────────────────────────────

function FilterBar({ journalCode, partnerName, onJournalChange, onPartnerNameChange }: {
  journalCode: string;
  partnerName: string;
  onJournalChange: (v: string) => void;
  onPartnerNameChange: (v: string) => void;
}) {
  const [draftJournal, setDraftJournal] = useState(journalCode);
  const [draftPartner, setDraftPartner] = useState(partnerName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJournalChange(draftJournal.trim().toUpperCase());
    onPartnerNameChange(draftPartner.trim());
  };

  const hasFilter = journalCode || partnerName;
  const handleClear = () => {
    setDraftJournal("");
    setDraftPartner("");
    onJournalChange("");
    onPartnerNameChange("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap">
          Journal
        </label>
        <input
          type="text"
          value={draftJournal}
          onChange={(e) => setDraftJournal(e.target.value.toUpperCase())}
          placeholder="ex. VEN, ACH, OD"
          maxLength={32}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 font-mono text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] w-36 transition"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap">
          Partenaire
        </label>
        <input
          type="text"
          value={draftPartner}
          onChange={(e) => setDraftPartner(e.target.value)}
          placeholder="Nom du partenaire"
          maxLength={128}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] w-48 transition"
        />
      </div>
      <button type="submit"
        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors">
        Filtrer
      </button>
      {hasFilter && (
        <button type="button" onClick={handleClear}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          Effacer filtres
        </button>
      )}
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination (T34)
// ─────────────────────────────────────────────────────────────────────────────

function Pagination({ page, pageSize, totalCount, onPageChange }: {
  page: number; pageSize: number; totalCount: number; onPageChange: (p: number) => void;
}) {
  if (totalCount <= pageSize) return null;
  const totalPages = Math.ceil(totalCount / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
      <p className="text-[10px] text-[var(--text-muted)]">
        {from}–{to} sur {totalCount} écriture{totalCount > 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded border border-[var(--border)] px-2.5 py-1 text-xs disabled:opacity-40 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors"
        >
          ‹
        </button>
        <span className="text-xs text-[var(--text-secondary)] min-w-[5rem] text-center">
          p. {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded border border-[var(--border)] px-2.5 py-1 text-xs disabled:opacity-40 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function GLSkeleton() {
  return (
    <div className="space-y-2 py-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-5 rounded bg-[var(--border)] animate-pulse" style={{ width: `${55 + (i % 5) * 9}%` }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal (T27 + T33/T34)
// ─────────────────────────────────────────────────────────────────────────────

export function GeneralLedgerPageClient({ accountCode, accountName, tenant, dateDebut, dateFin, companyId }: Props) {
  const [data, setData] = useState<LynkiGeneralLedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filtres T33/T34 + T38
  const [journalCode, setJournalCode] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = DEFAULT_PAGE_SIZE;

  const fetchGL = useCallback(() => {
    if (!dateDebut || !dateFin) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({
      tenant, account_code: accountCode,
      date_debut: dateDebut, date_fin: dateFin,
      ...(companyId ? { company_id: companyId } : {}),
      ...(journalCode ? { journal_code: journalCode } : {}),
      ...(partnerName ? { partner_name: partnerName } : {}),
      page: String(page),
      page_size: String(pageSize),
    });
    fetch(`/api/accounting/general-ledger?${params}`, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(`gl_${r.status}`); return r.json(); })
      .then((d: LynkiGeneralLedgerResponse) => { setData(d); setLoading(false); })
      .catch(() => { setLoading(false); setError(true); });
  }, [tenant, accountCode, dateDebut, dateFin, companyId, journalCode, partnerName, page, pageSize]);

  useEffect(() => { fetchGL(); }, [fetchGL]);

  const handleJournalChange = (v: string) => {
    setJournalCode(v);
    setPage(1);
  };

  const handlePartnerNameChange = (v: string) => {
    setPartnerName(v);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
  };

  const totalCount = data?.total_count ?? data?.lines.length ?? 0;
  const openingBalance = data?.opening_balance ?? 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-6 sm:px-8">
      {/* Breadcrumb + titre */}
      <div className="mb-6">
        <Breadcrumb
          accountCode={accountCode} accountName={accountName}
          dateDebut={dateDebut} dateFin={dateFin} tenant={tenant} companyId={companyId}
        />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-mono text-2xl font-bold text-[var(--text)]">{accountCode}</h1>
            {accountName !== accountCode && (
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{accountName}</p>
            )}
            {dateDebut && dateFin && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Période {dateDebut} → {dateFin}
                {companyId && <> · Société {companyId}</>}
              </p>
            )}
          </div>
          {data && (
            <GLExportButton
              accountCode={accountCode} tenant={tenant}
              dateDebut={dateDebut} dateFin={dateFin}
              companyId={companyId} journalCode={journalCode}
              partnerName={partnerName}
              dataSource={data.data_source}
            />
          )}
        </div>
      </div>

      {/* Filtres T33 + T38 */}
      <FilterBar journalCode={journalCode} partnerName={partnerName} onJournalChange={handleJournalChange} onPartnerNameChange={handlePartnerNameChange} />

      {/* Corps */}
      {!dateDebut || !dateFin ? (
        <div className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/10 p-6">
          <p className="text-sm font-semibold text-[var(--text)]">Paramètres manquants</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">date_debut et date_fin sont requis dans l&apos;URL.</p>
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <GLSkeleton />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/10 p-6" role="alert">
          <p className="text-sm font-semibold text-[var(--text)]">Impossible de charger les écritures</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Vérifiez la connexion au Vault.</p>
          <button type="button" onClick={fetchGL}
            className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors">
            Réessayer
          </button>
        </div>
      ) : !data || data.lines.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-[var(--text)]">Grand livre — {accountCode}</span>
            {data?.data_source === "stub" && (
              <span className="rounded-full bg-[var(--warning)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)] uppercase">
                Secours documenté
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            {data?.data_source === "stub"
              ? "Réponse de secours — Vault non joignable."
              : partnerName
              ? `Aucune écriture pour le partenaire « ${partnerName} » sur cette période.`
              : journalCode
              ? `Aucune écriture pour le journal « ${journalCode} » sur cette période.`
              : "Aucune écriture sur cette période pour ce compte."}
          </p>
          {(journalCode || partnerName) && (
            <button type="button" onClick={() => { handleJournalChange(""); handlePartnerNameChange(""); }}
              className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors">
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {/* En-tête */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text)]">Grand livre</span>
              <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider">
                {totalCount} écriture{totalCount > 1 ? "s" : ""}
              </span>
              {journalCode && (
                <span className="rounded-full border border-[var(--border)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--text-secondary)]">
                  Journal : {journalCode}
                </span>
              )}
              {partnerName && (
                <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                  Partenaire : {partnerName}
                </span>
              )}
              {data.data_source === "stub" && (
                <span className="rounded-full bg-[var(--warning)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)] uppercase">
                  Secours documenté
                </span>
              )}
              {!data.complete && (
                <span className="rounded-full bg-[var(--warning)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)] uppercase"
                  title={`Couverture : ${data.coverage ?? "partielle"}`}>
                  Partiel
                </span>
              )}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              Réf. v{data.referentiel_version}
            </div>
          </div>

          {/* Tableau T33/T34 */}
          <div className="overflow-x-auto px-5 pb-4 pt-2">
            <GLTableBody
              lines={data.lines}
              totalDebit={data.total_debit}
              totalCredit={data.total_credit}
              openingBalance={openingBalance}
              showJournal={!!journalCode || data.lines.some((l) => !!l.journal_code)}
              showPartner={data.data_source === "vault" || data.lines.some((l) => !!l.partner_name)}
            />
          </div>

          {/* Pagination T34 */}
          <Pagination
            page={page} pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={handlePageChange}
          />

          {/* Pied — coverage / source */}
          <div className="border-t border-[var(--border)] px-5 py-2 flex items-center justify-between">
            <p className="text-[10px] text-[var(--text-muted)]">
              Source : <span className="font-mono">{data.data_source}</span>
              {data.coverage && <> · Couverture : <span className="font-mono">{data.coverage}</span></>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function GLTableBody({ lines, totalDebit, totalCredit, openingBalance, showJournal, showPartner }: {
  lines: GeneralLedgerLine[];
  totalDebit: number;
  totalCredit: number;
  openingBalance: number;
  showJournal: boolean;
  showPartner: boolean;
}) {
  let runningBalance = openingBalance;

  return (
    <table className="w-full">
      <thead>
        <tr className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          <th className="pb-2 pr-4 text-left">Date</th>
          {showJournal && <th className="pb-2 pr-4 text-left">Journal</th>}
          {showPartner && <th className="pb-2 pr-4 text-left">Partenaire</th>}
          <th className="pb-2 pr-4 text-left">Pièce</th>
          <th className="pb-2 pr-4 text-right">Débit</th>
          <th className="pb-2 pr-4 text-right">Crédit</th>
          <th className="pb-2 text-right">Solde cumulé</th>
        </tr>
      </thead>
      <tbody>
        {openingBalance !== 0 && (
          <tr className="border-b border-[var(--border)] bg-[var(--accent-soft)]/10">
            <td className="py-1.5 pr-4 text-[10px] text-[var(--text-muted)] italic whitespace-nowrap">
              Solde d&apos;ouverture
            </td>
            {showJournal && <td className="py-1.5 pr-4" />}
            {showPartner && <td className="py-1.5 pr-4" />}
            <td className="py-1.5 pr-4" />
            <td className="py-1.5 pr-4" />
            <td className="py-1.5 pr-4" />
            <td className={`py-1.5 text-right text-xs font-semibold tabular-nums ${openingBalance < 0 ? "text-[var(--negative)]" : openingBalance > 0 ? "text-[var(--positive)]" : "text-[var(--text-secondary)]"}`}>
              {formatAmount(openingBalance)}
            </td>
          </tr>
        )}
        {lines.map((line) => {
          runningBalance += line.debit - line.credit;
          const balCls = runningBalance < 0
            ? "text-[var(--negative)]"
            : runningBalance > 0
            ? "text-[var(--positive)]"
            : "text-[var(--text-secondary)]";
          return (
            <tr key={`${line.move_id}-${line.line_id}`}
              className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent-soft)]/20">
              <td className="py-1.5 pr-4 text-xs text-[var(--text-secondary)] whitespace-nowrap">{line.line_date}</td>
              {showJournal && (
                <td className="py-1.5 pr-4 font-mono text-xs text-[var(--text-muted)]">
                  {line.journal_code || "—"}
                </td>
              )}
              {showPartner && (
                <td className="py-1.5 pr-4 text-xs text-[var(--text-secondary)] max-w-[140px] truncate" title={line.partner_name}>
                  {line.partner_name || "—"}
                </td>
              )}
              <td className="py-1.5 pr-4 font-mono text-xs text-[var(--text-muted)]">
                M{line.move_id}·L{line.line_id}
              </td>
              <td className="py-1.5 pr-4 text-right text-xs tabular-nums text-[var(--text-secondary)]">
                {line.debit > 0 ? formatAmount(line.debit) : ""}
              </td>
              <td className="py-1.5 pr-4 text-right text-xs tabular-nums text-[var(--text-secondary)]">
                {line.credit > 0 ? formatAmount(line.credit) : ""}
              </td>
              <td className={`py-1.5 text-right text-xs font-semibold tabular-nums ${balCls}`}>
                {formatAmount(runningBalance)}
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot className="border-t-2 border-[var(--border)]">
        <tr className="text-xs font-bold text-[var(--text)]">
          <td colSpan={showJournal && showPartner ? 4 : showJournal || showPartner ? 3 : 2} className="pt-2 pr-4">Total page</td>
          <td className="pt-2 pr-4 text-right tabular-nums">{formatAmount(totalDebit)}</td>
          <td className="pt-2 pr-4 text-right tabular-nums">{formatAmount(totalCredit)}</td>
          <td className={`pt-2 text-right tabular-nums ${runningBalance < 0 ? "text-[var(--negative)]" : runningBalance > 0 ? "text-[var(--positive)]" : "text-[var(--text-secondary)]"}`}>
            {formatAmount(runningBalance)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
