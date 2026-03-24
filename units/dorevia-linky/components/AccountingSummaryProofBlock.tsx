"use client";

/**
 * Sprint 17 T96 — Bloc preuve / intégrité V1 (plan §3.4.1).
 * Cohérence synthèse ↔ balance : alignement des indicateurs complete / data_source entre BG et CdR.
 */

import { useEffect, useMemo, useState } from "react";
import type { LynkiTrialBalanceResponse } from "@/app/api/accounting/trial-balance/route";
import type { LynkiIncomeStatementRubricsResponse } from "@/app/api/accounting/income-statement/rubrics/route";

export interface AccountingSummaryProofBlockProps {
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
}

type LoadState = "loading" | "ready" | "error";

export function AccountingSummaryProofBlock({ tenantId, companyId, period }: AccountingSummaryProofBlockProps) {
  const [state, setState] = useState<LoadState>("loading");
  const [tb, setTb] = useState<LynkiTrialBalanceResponse | null>(null);
  const [is, setIs] = useState<LynkiIncomeStatementRubricsResponse | null>(null);

  const qs = useMemo(() => {
    const q = new URLSearchParams({
      tenant: tenantId,
      date_debut: period.from,
      date_fin: period.to,
    });
    if (companyId) q.set("company_ids", companyId);
    return q;
  }, [tenantId, companyId, period.from, period.to]);

  useEffect(() => {
    const c = new AbortController();
    setState("loading");
    Promise.all([
      fetch(`/api/accounting/trial-balance?${qs}`, { cache: "no-store", signal: c.signal }).then((r) =>
        r.ok ? r.json() : null
      ) as Promise<LynkiTrialBalanceResponse | null>,
      fetch(`/api/accounting/income-statement/rubrics?${qs}`, { cache: "no-store", signal: c.signal }).then((r) =>
        r.ok ? r.json() : null
      ) as Promise<LynkiIncomeStatementRubricsResponse | null>,
    ])
      .then(([t, i]) => {
        if (c.signal.aborted) return;
        setTb(t);
        setIs(i);
        setState("ready");
      })
      .catch(() => {
        if (c.signal.aborted) return;
        setState("error");
      });
    return () => c.abort();
  }, [qs]);

  const coherenceLabel = useMemo(() => {
    if (state !== "ready") return "—";
    if (!tb || !is) return "Indisponible — une restitution n’a pas pu être chargée.";
    if (tb.data_source !== is.data_source) {
      return "À contrôler — les sources (Vault / secours) diffèrent entre la balance générale et le compte de résultat.";
    }
    if (tb.complete && is.complete) {
      return "Cohérence vérifiée — restitutions complètes sur le périmètre affiché (balance générale et rubriques CdR).";
    }
    if (!tb.complete && !is.complete) {
      return "Cohérence à contrôler — balance générale et rubriques CdR signalées partielles.";
    }
    if (!tb.complete) {
      return "Cohérence à contrôler — balance générale partielle ; vérifier le compte de résultat.";
    }
    return "Cohérence à contrôler — rubriques compte de résultat partielles ; vérifier la balance générale.";
  }, [state, tb, is]);

  const horodatage = useMemo(() => {
    if (!tb?.generated_at && !is?.generated_at) return "Non disponible";
    const dates = [tb?.generated_at, is?.generated_at].filter(Boolean) as string[];
    const latest = dates.sort().slice(-1)[0];
    try {
      return new Date(latest).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return latest;
    }
  }, [tb, is]);

  const statutPreuve = useMemo(() => {
    if (state === "error") return "Indisponible";
    if (state === "loading") return "Chargement…";
    if (!tb || !is) return "Partiel";
    if (tb.data_source === "stub" || is.data_source === "stub") return "Brouillon / secours";
    if (tb.complete && is.complete) return "Consolidé sur périmètre";
    return "Partiel";
  }, [state, tb, is]);

  if (state === "loading") {
    return (
      <div className="sv2-card p-5" aria-busy="true">
        <div className="h-4 w-40 rounded bg-[var(--sv2-border)] animate-pulse" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="sv2-card p-5 text-xs" style={{ borderColor: "color-mix(in srgb, var(--sv2-warning) 40%, transparent)" }}>
        <p className="sv2-label text-[var(--sv2-text-muted)]">Statut de preuve</p>
        <h3 className="mt-1 text-base font-bold text-[var(--sv2-text)]">Intégrité du dossier</h3>
        <p className="mt-2 text-[var(--sv2-text-muted)]">Impossible de vérifier la cohérence des restitutions.</p>
      </div>
    );
  }

  const proofItems = [
    { label: "Cohérence synthèse ↔ balance", value: coherenceLabel, mono: false },
    { label: "Horodatage", value: horodatage, mono: true },
    { label: "Statut de preuve", value: statutPreuve, mono: false },
  ];

  return (
    <div className="sv2-card sv2-card-highlight p-5 sm:p-6 space-y-4">
      <div>
        <p className="sv2-label text-[var(--sv2-text-muted)]">Statut de preuve</p>
        <h3 className="mt-1 text-lg font-bold text-[var(--sv2-text)]">Intégrité du dossier</h3>
      </div>
      <div className="space-y-2">
        {proofItems.map((item) => (
          <div key={item.label} className="sv2-inner p-3">
            <dt className="sv2-label text-[var(--sv2-text-muted)]">{item.label}</dt>
            <dd className={`mt-1 text-xs text-[var(--sv2-text-muted)] leading-snug ${item.mono ? "tabular-nums" : ""}`}>{item.value}</dd>
          </div>
        ))}
        <div className="sv2-inner p-3">
          <dt className="sv2-label text-[var(--sv2-text-muted)]">Identifiant court (hash)</dt>
          <dd className="mt-1 text-xs text-[var(--sv2-text-muted)] leading-snug">
            Non exposé par l&apos;API sur ces restitutions — ligne affichée pour transparence.
          </dd>
        </div>
      </div>
      <p className="sv2-ref">
        Réf. lynki.accounting.trial_balance + lynki.accounting.income_statement (rubriques) · Même périmètre société / dates que la Synthèse.
      </p>
    </div>
  );
}
