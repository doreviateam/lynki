"use client";

import { useState, useEffect, useMemo } from "react";
import type { LynkiBalanceSheetRubricsResponse } from "@/app/api/accounting/balance-sheet/rubrics/route";
import type { LynkiIncomeStatementRubricsResponse } from "@/app/api/accounting/income-statement/rubrics/route";
import type { LynkiTrialBalanceResponse } from "@/app/api/accounting/trial-balance/route";
import type { LynkiAgedReceivablesResponse } from "@/app/api/accounting/aged-receivables/route";
import type { LynkiAgedPayablesResponse } from "@/app/api/accounting/aged-payables/route";

export interface AccountingSummaryKpiCardsProps {
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
}

type KpiState = "ok" | "partial" | "unavailable";

interface CardModel {
  title: string;
  subtitle: string;
  value: string;
  state: KpiState;
  refLine: string;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatInt(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

export function AccountingSummaryKpiCards({ tenantId, companyId, period }: AccountingSummaryKpiCardsProps) {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<CardModel[] | null>(null);

  const qsBase = useMemo(() => {
    const q = new URLSearchParams({
      tenant: tenantId,
      date_debut: period.from,
      date_fin: period.to,
    });
    if (companyId) q.set("company_ids", companyId);
    return q;
  }, [tenantId, companyId, period.from, period.to]);

  const qsTb = useMemo(() => {
    const q = new URLSearchParams({
      tenant: tenantId,
      date_debut: period.from,
      date_fin: period.to,
    });
    if (companyId) q.set("company_ids", companyId);
    return q;
  }, [tenantId, companyId, period.from, period.to]);

  useEffect(() => {
    setLoading(true);
    const c = new AbortController();
    const asOf = period.to;

    Promise.all([
      fetch(`/api/accounting/balance-sheet/rubrics?${qsBase}`, { cache: "no-store", signal: c.signal }).then((r) =>
        r.ok ? r.json() : null
      ) as Promise<LynkiBalanceSheetRubricsResponse | null>,
      fetch(`/api/accounting/income-statement/rubrics?${qsBase}`, { cache: "no-store", signal: c.signal }).then((r) =>
        r.ok ? r.json() : null
      ) as Promise<LynkiIncomeStatementRubricsResponse | null>,
      fetch(`/api/accounting/aged-receivables?${new URLSearchParams({
        tenant: tenantId,
        as_of_date: asOf,
        ...(companyId ? { company_ids: companyId } : {}),
      })}`, { cache: "no-store", signal: c.signal }).then((r) => (r.ok ? r.json() : null)) as Promise<
        LynkiAgedReceivablesResponse | null
      >,
      fetch(`/api/accounting/aged-payables?${new URLSearchParams({
        tenant: tenantId,
        as_of_date: asOf,
        ...(companyId ? { company_ids: companyId } : {}),
      })}`, { cache: "no-store", signal: c.signal }).then((r) => (r.ok ? r.json() : null)) as Promise<
        LynkiAgedPayablesResponse | null
      >,
      fetch(`/api/accounting/trial-balance?${qsTb}`, { cache: "no-store", signal: c.signal }).then((r) =>
        r.ok ? r.json() : null
      ) as Promise<LynkiTrialBalanceResponse | null>,
    ])
      .then(([bs, is, ar, ap, tb]) => {
        const out: CardModel[] = [];

        // 1 — Bilan : total actif
        if (bs && typeof bs.total_actif === "number" && Number.isFinite(bs.total_actif)) {
          out.push({
            title: "Bilan",
            subtitle: "Total actif (rubriques)",
            value: formatMoney(bs.total_actif),
            state: bs.complete ? "ok" : "partial",
            refLine: `Réf. lynki.accounting.balance_sheet · ${bs.data_source}`,
          });
        } else {
          out.push({
            title: "Bilan",
            subtitle: "Total actif (rubriques)",
            value: "—",
            state: "unavailable",
            refLine: "Réf. lynki.accounting.balance_sheet — indisponible",
          });
        }

        // 2 — CdR : résultat net (somme des rubriques sur la période)
        if (is && Array.isArray(is.lines) && is.lines.length > 0) {
          const net = is.lines.reduce((s, l) => s + (typeof l.amount === "number" ? l.amount : 0), 0);
          out.push({
            title: "Compte de résultat",
            subtitle: "Résultat net (somme rubriques)",
            value: formatMoney(net),
            state: is.complete ? "ok" : "partial",
            refLine: `Réf. lynki.accounting.income_statement · ${is.data_source}`,
          });
        } else {
          out.push({
            title: "Compte de résultat",
            subtitle: "Résultat net (somme rubriques)",
            value: "—",
            state: "unavailable",
            refLine: "Réf. lynki.accounting.income_statement — indisponible",
          });
        }

        // 3 — Tiers : partenaires distincts AR ∪ AP
        const arLines = ar?.lines ?? [];
        const apLines = ap?.lines ?? [];
        const ids = new Set<number>();
        for (const l of arLines) {
          if (typeof l.partner_id === "number") ids.add(l.partner_id);
        }
        for (const l of apLines) {
          if (typeof l.partner_id === "number") ids.add(l.partner_id);
        }
        const arOk = ar != null;
        const apOk = ap != null;
        if (arOk || apOk) {
          const bothComplete = ar?.complete === true && ap?.complete === true;
          const state: KpiState = arOk && apOk ? (bothComplete ? "ok" : "partial") : "partial";
          out.push({
            title: "Tiers",
            subtitle: "Partenaires suivis (clients + fourn.)",
            value: formatInt(ids.size),
            state,
            refLine: `Réf. aged_receivables + aged_payables · ${ar?.data_source ?? "?"} / ${ap?.data_source ?? "?"}`,
          });
        } else {
          out.push({
            title: "Tiers",
            subtitle: "Partenaires suivis (clients + fourn.)",
            value: "—",
            state: "unavailable",
            refLine: "Réf. balances âgées — indisponible",
          });
        }

        // 4 — « Grand livre » : proxy = comptes avec mouvement sur la BG (pas le nombre d'écritures ligne à ligne)
        if (tb && Array.isArray(tb.lines) && tb.lines.length > 0) {
          out.push({
            title: "Grand livre",
            subtitle: "Comptes actifs (balance générale)",
            value: formatInt(tb.lines.length),
            state: tb.complete ? "ok" : "partial",
            refLine: `Réf. lynki.accounting.trial_balance · ${tb.data_source} · le détail des écritures est au GL par compte`,
          });
        } else {
          out.push({
            title: "Grand livre",
            subtitle: "Comptes actifs (balance générale)",
            value: "—",
            state: "unavailable",
            refLine: "Réf. lynki.accounting.trial_balance — indisponible",
          });
        }

        setCards(out);
      })
      .catch(() => setCards(null))
      .finally(() => setLoading(false));

    return () => c.abort();
  }, [qsBase, qsTb, tenantId, period.to, companyId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Chargement des indicateurs synthèse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="sv2-card p-5">
            <div className="mb-3 h-3 w-24 rounded bg-[var(--sv2-border)] animate-pulse" />
            <div className="h-8 w-20 rounded bg-[var(--sv2-border)] animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div key={c.title} className="sv2-card sv2-card-highlight flex flex-col p-5 relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="sv2-label text-[var(--sv2-text-muted)]">{c.title}</h3>
            {c.state === "partial" && (
              <span className="sv2-badge sv2-badge-partial">Partiel</span>
            )}
            {c.state === "unavailable" && (
              <span className="sv2-badge sv2-badge-unavailable">Indisp.</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-[var(--sv2-text-muted)] leading-snug">{c.subtitle}</p>
          <p className="mt-3 text-2xl font-bold tabular-nums text-[var(--sv2-text)]">{c.value}</p>
          <p className="sv2-ref">{c.refLine}</p>
        </div>
      ))}
    </div>
  );
}
