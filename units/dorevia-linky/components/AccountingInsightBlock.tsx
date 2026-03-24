"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import type { AccountingInsightResponse } from "@/app/api/diva/accounting-insight/route";

interface AccountingInsightBlockProps {
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
  referentielVersion: string;
}

type InsightState = "loading" | "ready" | "error" | "no_data";
type ReportState = "idle" | "loading" | "done" | "error";

interface RubricsApiResponse {
  lines?: { code: string; label: string; amount: number; previous?: number }[];
  total?: number;
  total_n1?: number;
  complete?: boolean;
}

interface AgedApiResponse {
  lines?: { partner_id: number; partner_name: string; not_due: number; range_0_30: number; range_31_60: number; range_61_90: number; range_91_180: number; range_over_180: number; total: number }[];
  aging_basis?: string;
  complete?: boolean;
}

export default function AccountingInsightBlock({
  tenantId,
  companyId,
  period,
  referentielVersion,
}: AccountingInsightBlockProps) {
  const [state, setState] = useState<InsightState>("loading");
  const [insight, setInsight] = useState<AccountingInsightResponse | null>(null);
  const [reportState, setReportState] = useState<ReportState>("idle");
  const fetchedRef = useRef("");
  const lastBodyRef = useRef<Record<string, unknown> | null>(null);

  const fetchInsight = useCallback(async () => {
    const cacheKey = `${tenantId}|${companyId}|${period.from}|${period.to}`;
    if (fetchedRef.current === cacheKey && state === "ready") return;

    setState("loading");

    const baseParams = new URLSearchParams({ tenant: tenantId });
    if (companyId) baseParams.set("company_ids", companyId);

    const rubricsParams = new URLSearchParams(baseParams);
    rubricsParams.set("date_start", period.from);
    rubricsParams.set("date_end", period.to);

    const agedParams = new URLSearchParams(baseParams);
    agedParams.set("as_of_date", period.to);

    try {
      const [bsRes, isRes, arRes, apRes] = await Promise.allSettled([
        fetch(`/api/accounting/balance-sheet/rubrics?${rubricsParams}`, { cache: "no-store" }).then(r => r.ok ? r.json() as Promise<RubricsApiResponse> : null),
        fetch(`/api/accounting/income-statement/rubrics?${rubricsParams}`, { cache: "no-store" }).then(r => r.ok ? r.json() as Promise<RubricsApiResponse> : null),
        fetch(`/api/accounting/aged-receivables?${agedParams}`, { cache: "no-store" }).then(r => r.ok ? r.json() as Promise<AgedApiResponse> : null),
        fetch(`/api/accounting/aged-payables?${agedParams}`, { cache: "no-store" }).then(r => r.ok ? r.json() as Promise<AgedApiResponse> : null),
      ]);

      const bs = bsRes.status === "fulfilled" ? bsRes.value : null;
      const is = isRes.status === "fulfilled" ? isRes.value : null;
      const ar = arRes.status === "fulfilled" ? arRes.value : null;
      const ap = apRes.status === "fulfilled" ? apRes.value : null;

      if (!bs && !is && !ar && !ap) {
        setState("no_data");
        return;
      }

      const companyIds = companyId
        ? companyId.split(",").map(Number).filter(Boolean)
        : [];

      const body = {
        context: {
          tenant: tenantId,
          company_ids: companyIds.length > 0 ? companyIds : undefined,
          date_start: period.from,
          date_end: period.to,
          referentiel_version: referentielVersion,
        },
        balance_sheet: bs?.lines ? { lines: bs.lines, total: bs.total ?? 0, total_n1: bs.total_n1, complete: bs.complete ?? false } : undefined,
        income_statement: is?.lines ? { lines: is.lines, total: is.total ?? 0, total_n1: is.total_n1, complete: is.complete ?? false } : undefined,
        aged_receivables: ar?.lines ? { lines: ar.lines, aging_basis: ar.aging_basis ?? "mixed", complete: ar.complete ?? false } : undefined,
        aged_payables: ap?.lines ? { lines: ap.lines, aging_basis: ap.aging_basis ?? "mixed", complete: ap.complete ?? false } : undefined,
        options: { force_refresh: false, use_mistral: false },
      };

      lastBodyRef.current = body;

      const res = await fetch("/api/diva/accounting-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setState("error");
        return;
      }

      const data: AccountingInsightResponse = await res.json();
      setInsight(data);
      setState("ready");
      fetchedRef.current = cacheKey;
    } catch {
      setState("error");
    }
  }, [tenantId, companyId, period.from, period.to, referentielVersion, state]);

  useEffect(() => {
    fetchInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, companyId, period.from, period.to]);

  const downloadReport = useCallback(async () => {
    if (!lastBodyRef.current) return;
    setReportState("loading");
    try {
      const res = await fetch("/api/diva/accounting-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lastBodyRef.current),
      });
      if (!res.ok) {
        setReportState("error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `synthese-comptable-${tenantId}-${period.from}_${period.to}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setReportState("done");
      setTimeout(() => setReportState("idle"), 3000);
    } catch {
      setReportState("error");
    }
  }, [tenantId, period.from, period.to]);

  const scopeLine = (
    <p className="text-[10px] text-[var(--text-muted)] mt-2 leading-relaxed">
      <span className="font-semibold text-[var(--text-secondary)]">Périmètre :</span> tenant {tenantId}
      {companyId ? ` · société(s) ${companyId}` : " · toutes sociétés"} · {period.from} → {period.to} · réf. {referentielVersion}
    </p>
  );
  const sourcesLine = (
    <p className="text-[10px] text-[var(--text-muted)] mt-1">
      <span className="font-semibold text-[var(--text-secondary)]">Sources :</span> rubriques bilan, compte de résultat, balances
      clients &amp; fournisseurs (agrégations Lynki envoyées à Diva).
    </p>
  );

  if (state === "no_data") {
    return (
      <div className="sv2-card sv2-card-highlight p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <p className="sv2-label text-[var(--sv2-text-muted)]">Lecture Diva</p>
          <h3 className="text-base font-bold text-[var(--sv2-text)]">Analyse comptable</h3>
          <span className="sv2-badge sv2-badge-unavailable">Indisponible</span>
        </div>
        <p className="text-xs text-[var(--sv2-text-muted)]">
          Données agrégées insuffisantes pour lancer l&apos;analyse Diva (aucune rubrique ou balance chargée).
        </p>
        {scopeLine}
        {sourcesLine}
        <button type="button" onClick={() => { fetchedRef.current = ""; fetchInsight(); }} className="mt-3 sv2-btn text-xs">
          Réessayer
        </button>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="sv2-card p-5 sm:p-6" aria-busy="true">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full border-2 border-[var(--sv2-accent)] border-t-transparent animate-spin" />
          <span className="text-xs text-[var(--sv2-text-muted)]">Analyse comptable en cours…</span>
        </div>
        {scopeLine}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="sv2-card p-5 sm:p-6" style={{ borderColor: "color-mix(in srgb, var(--sv2-warning) 30%, transparent)" }}>
        <p className="text-xs text-[var(--sv2-text-muted)]">Insight comptable temporairement indisponible</p>
        {scopeLine}
        {sourcesLine}
        <button type="button" onClick={() => { fetchedRef.current = ""; fetchInsight(); }} className="mt-2 sv2-btn text-xs">
          Réessayer
        </button>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="sv2-card sv2-card-highlight overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 sm:px-6" style={{ borderBottom: "1px solid color-mix(in srgb, var(--sv2-accent) 12%, transparent)" }}>
        <div className="flex items-center gap-3">
          <p className="sv2-label text-[var(--sv2-text-muted)]">Lecture Diva</p>
          <h3 className="text-base font-bold text-[var(--sv2-text)]">Observation traçable</h3>
          <span className="sv2-badge sv2-badge-accent">Diva</span>
        </div>
        <button
          type="button"
          onClick={fetchInsight}
          className="sv2-btn p-1.5"
          title="Rafraîchir l'analyse"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 8A6 6 0 1 1 8 2m0 0v4m0-4h4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-4 sm:px-6 space-y-4">
        {sourcesLine}
        <p className="text-sm font-semibold text-[var(--sv2-text)] leading-snug">
          {insight.headline}
        </p>

        <div className="text-xs text-[var(--sv2-text-muted)] leading-relaxed">
          {insight.what_i_see}
        </div>

        {insight.to_check && insight.to_check !== "Aucun point de vigilance particulier détecté" && (
          <div className="sv2-inner p-3" style={{ borderColor: "color-mix(in srgb, var(--sv2-warning) 20%, transparent)" }}>
            <p className="sv2-label text-[var(--sv2-warning)] mb-1">Points de vigilance</p>
            <p className="text-xs text-[var(--sv2-text-muted)] leading-relaxed">{insight.to_check}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="sv2-inner p-3">
            <p className="sv2-label text-[var(--sv2-text-muted)]">Sources</p>
            <p className="mt-1 text-xs text-[var(--sv2-text)]">Rubriques bilan, CdR, balances tiers</p>
          </div>
          <div className="sv2-inner p-3">
            <p className="sv2-label text-[var(--sv2-text-muted)]">Horodatage</p>
            <p className="mt-1 text-xs tabular-nums text-[var(--sv2-text)]">
              {new Date(insight.generated_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
            </p>
          </div>
          <div className="sv2-inner p-3">
            <p className="sv2-label text-[var(--sv2-text-muted)]">Hash faits</p>
            <p className="mt-1 text-xs font-mono text-[var(--sv2-text)]">{insight.facts_hash.slice(0, 8)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2" style={{ borderTop: "1px solid color-mix(in srgb, var(--sv2-border) 50%, transparent)" }}>
          <button
            type="button"
            disabled={state !== "ready" || reportState === "loading"}
            onClick={downloadReport}
            className="sv2-btn text-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reportState === "loading" ? (
              <div className="h-3 w-3 rounded-full border-2 border-[var(--sv2-accent)] border-t-transparent animate-spin" />
            ) : null}
            {reportState === "loading" ? "Génération…" : reportState === "done" ? "Téléchargé" : "Télécharger le rapport DOCX"}
          </button>
          {reportState === "error" && (
            <span className="text-[10px] text-[var(--sv2-warning)]">Échec — réessayez</span>
          )}
        </div>

        <div className="sv2-ref">
          <p className="leading-snug">{insight.scope_note}</p>
          {scopeLine}
        </div>
      </div>
    </div>
  );
}
