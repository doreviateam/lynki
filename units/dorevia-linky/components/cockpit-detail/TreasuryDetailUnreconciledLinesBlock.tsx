"use client";

import { useCallback, useEffect, useState } from "react";

export interface TreasuryUnreconciledLineRow {
  move_id: number;
  amount: number;
  account_id?: number | null;
  company_id?: number | null;
  last_transition_at: string;
}

const PAGE_SIZE = 50;

function daysSince(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function parseRows(raw: unknown[]): TreasuryUnreconciledLineRow[] {
  const rows: TreasuryUnreconciledLineRow[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const mid = o.move_id;
    const amt = o.amount;
    const lta = o.last_transition_at;
    if (typeof mid !== "number" || !Number.isFinite(mid)) continue;
    if (typeof amt !== "number" || !Number.isFinite(amt)) continue;
    if (typeof lta !== "string") continue;
    rows.push({
      move_id: mid,
      amount: amt,
      account_id: typeof o.account_id === "number" && Number.isFinite(o.account_id) ? o.account_id : null,
      company_id: typeof o.company_id === "number" && Number.isFinite(o.company_id) ? o.company_id : null,
      last_transition_at: lta,
    });
  }
  return rows;
}

/**
 * T-TR-DETAIL-003 : lignes projection Vault + comptage global par tranche d’ancienneté + pagination.
 */
export function TreasuryDetailUnreconciledLinesBlock({
  tenantId,
  companyId,
  formatCurrency,
}: {
  tenantId: string;
  companyId: string | null;
  formatCurrency: (n: number | null | undefined) => string;
}) {
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<TreasuryUnreconciledLineRow[]>([]);
  const [aging, setAging] = useState<{ d07: number; d830: number; d30p: number }>({ d07: 0, d830: 0, d30p: 0 });
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const qs = new URLSearchParams({
      tenant: tenantId,
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (companyId) qs.set("company_id", companyId);
    fetch(`/api/treasury-unreconciled-lines?${qs}`, { cache: "no-store" })
      .then(async (r) => (r.ok ? r.json() : { items: [], source: "error" }))
      .then(
        (d: {
          items?: unknown;
          source?: string;
          has_more?: boolean;
          aging_buckets?: { "0_7"?: number; "8_30"?: number; "30_plus"?: number };
        }) => {
          const raw = Array.isArray(d.items) ? d.items : [];
          setItems(parseRows(raw));
          setSource(typeof d.source === "string" ? d.source : null);
          setHasMore(d.has_more === true);
          const ab = d.aging_buckets;
          setAging({
            d07: typeof ab?.["0_7"] === "number" && Number.isFinite(ab["0_7"]) ? ab["0_7"] : 0,
            d830: typeof ab?.["8_30"] === "number" && Number.isFinite(ab["8_30"]) ? ab["8_30"] : 0,
            d30p: typeof ab?.["30_plus"] === "number" && Number.isFinite(ab["30_plus"]) ? ab["30_plus"] : 0,
          });
        }
      )
      .catch(() => {
        setItems([]);
        setSource("unavailable");
        setHasMore(false);
        setAging({ d07: 0, d830: 0, d30p: 0 });
      })
      .finally(() => setLoading(false));
  }, [tenantId, companyId, offset]);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    load();
  }, [tenantId, load]);

  const totalAging = aging.d07 + aging.d830 + aging.d30p;

  if (loading && items.length === 0) {
    return (
      <div
        id="treso-lignes-ouvertes"
        className="mt-6 scroll-mt-28 flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-6 text-xs text-[var(--muted)]"
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        Chargement des lignes à traiter…
      </div>
    );
  }

  const topByAmount =
    offset === 0 && items.length > 0
      ? [...items].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 5)
      : [];

  return (
    <div id="treso-lignes-ouvertes" className="mt-6 scroll-mt-28">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
        Lignes ouvertes — détail
      </h3>
      <details className="mb-3 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)]/40 px-2 py-1.5">
        <summary className="cursor-pointer select-none text-[10px] font-medium text-[var(--muted)]">
          Détail technique (tri, pagination, source)
        </summary>
        <p className="mt-2 text-[10px] leading-relaxed text-[var(--muted)]">
          Projection de rapprochement (sans libellé relevé Odoo). Tri par montant décroissant · {PAGE_SIZE} lignes par page. Source :{" "}
          <code className="text-[10px]">{source ?? "—"}</code>.
        </p>
      </details>

      {topByAmount.length > 0 ? (
        <div className="mb-4">
          <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
            Cinq montants les plus significatifs (extrait)
          </h4>
          <ul className="space-y-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/20 px-3 py-2 text-xs">
            {topByAmount.map((row) => (
              <li
                key={`top-${row.move_id}-${row.last_transition_at}`}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border)]/60 py-1.5 last:border-b-0"
              >
                <span className="font-medium text-[var(--text)]">
                  Mouvement #{row.move_id}
                  {row.account_id != null ? (
                    <span className="ml-1 font-normal text-[var(--text-secondary)]">· compte {row.account_id}</span>
                  ) : null}
                </span>
                <span className="shrink-0 tabular-nums font-semibold text-[var(--text)]">{formatCurrency(row.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {totalAging > 0 || items.length > 0 ? (
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--border)] bg-emerald-500/5 px-3 py-2 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">0–7 j</div>
            <div className="text-lg font-bold tabular-nums text-[var(--text)]">{aging.d07}</div>
            <div className="text-[10px] text-[var(--text-secondary)]">ligne(s)</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-amber-500/5 px-3 py-2 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">8–30 j</div>
            <div className="text-lg font-bold tabular-nums text-[var(--text)]">{aging.d830}</div>
            <div className="text-[10px] text-[var(--text-secondary)]">ligne(s)</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-red-500/5 px-3 py-2 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">&gt; 30 j</div>
            <div className="text-lg font-bold tabular-nums text-[var(--text)]">{aging.d30p}</div>
            <div className="text-[10px] text-[var(--text-secondary)]">ligne(s)</div>
          </div>
        </div>
      ) : null}

      {items.length === 0 && !loading ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/30 px-3 py-4 text-xs text-[var(--text-secondary)]">
          {offset > 0 ? (
            <p>Fin de liste ou page vide — revenir à la page précédente.</p>
          ) : (
            <p>
              Aucune ligne ouverte dans la projection pour ce périmètre, ou service indisponible. Pour le détail métier complet,
              utiliser <strong>Ouvrir le rapprochement</strong> (Odoo).
            </p>
          )}
        </div>
      ) : null}

      {items.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full min-w-[520px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
                  <th className="px-3 py-2 font-semibold text-[var(--text-secondary)]">Dernière transition</th>
                  <th className="px-3 py-2 font-semibold text-[var(--text-secondary)]">Libellé</th>
                  <th className="px-3 py-2 font-semibold text-[var(--text-secondary)]">Compte</th>
                  <th className="px-3 py-2 text-right font-semibold text-[var(--text-secondary)]">Montant</th>
                  <th className="px-3 py-2 text-right font-semibold text-[var(--text-secondary)]">Ancienneté</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {items.map((row) => {
                  const days = daysSince(row.last_transition_at);
                  const dateStr = new Date(row.last_transition_at).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  });
                  return (
                    <tr key={`${row.move_id}-${row.last_transition_at}`} className="border-b border-[var(--border)]">
                      <td className="px-3 py-2 text-[var(--text)]">{dateStr}</td>
                      <td className="px-3 py-2 font-medium text-[var(--text)]">Mouvement #{row.move_id}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">
                        {row.account_id != null ? `#${row.account_id}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-[var(--text)]">{formatCurrency(row.amount)}</td>
                      <td className="px-3 py-2 text-right text-[var(--text-secondary)]">
                        {days != null ? `${days} j` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-[var(--muted)]">
              Page {offset / PAGE_SIZE + 1} · lignes {offset + 1}–{offset + items.length}
              {loading ? " · actualisation…" : ""}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={offset < PAGE_SIZE || loading}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                className="min-h-[44px] rounded-lg border border-[var(--border)] px-4 text-xs font-semibold text-[var(--text)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0"
              >
                Précédent
              </button>
              <button
                type="button"
                disabled={!hasMore || loading}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
                className="min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 text-xs font-semibold text-[var(--text)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0"
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
