"use client";

/**
 * Sprint 17 T93 — Line chart : évolution du résultat (somme des rubriques CdR par mois).
 * Source : GET /api/accounting/income-statement/rubrics (une requête par mois calendaire dans la période).
 * Fiche métier : voir PLAN_SPRINT_17 §3.1 / §3.5 (série = somme rubriques CdR sur sous-périodes mensuelles).
 */

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { LynkiIncomeStatementRubricsResponse } from "@/app/api/accounting/income-statement/rubrics/route";

export interface AccountingSummaryTrendChartProps {
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
}

type Point = { label: string; net: number; partial: boolean };

function monthSlices(periodFrom: string, periodTo: string, maxMonths: number): { from: string; to: string; label: string }[] {
  if (!periodFrom || !periodTo || periodFrom > periodTo) return [];

  const out: { from: string; to: string; label: string }[] = [];
  let y = parseInt(periodFrom.slice(0, 4), 10);
  let m = parseInt(periodFrom.slice(5, 7), 10) - 1;
  const endY = parseInt(periodTo.slice(0, 4), 10);
  const endM = parseInt(periodTo.slice(5, 7), 10) - 1;

  while (out.length < maxMonths) {
    if (y > endY || (y === endY && m > endM)) break;
    const monthStart = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const monthEnd = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const effFrom = monthStart < periodFrom ? periodFrom : monthStart;
    const effTo = monthEnd > periodTo ? periodTo : monthEnd;
    if (effFrom <= effTo) {
      out.push({
        from: effFrom,
        to: effTo,
        label: `${String(m + 1).padStart(2, "0")}/${String(y).slice(2)}`,
      });
    }
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return out;
}

function sumRubricsNet(data: LynkiIncomeStatementRubricsResponse | null): number {
  if (!data?.lines?.length) return 0;
  return data.lines.reduce((s, l) => s + (typeof l.amount === "number" ? l.amount : 0), 0);
}

export function AccountingSummaryTrendChart({ tenantId, companyId, period }: AccountingSummaryTrendChartProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [dataSource, setDataSource] = useState<string>("—");

  const slices = useMemo(() => monthSlices(period.from, period.to, 14), [period.from, period.to]);

  useEffect(() => {
    if (slices.length === 0) {
      setLoading(false);
      setPoints([]);
      setError(false);
      return;
    }

    const c = new AbortController();
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const results = await Promise.all(
          slices.map(async (sl) => {
            const q = new URLSearchParams({
              tenant: tenantId,
              date_debut: sl.from,
              date_fin: sl.to,
            });
            if (companyId) q.set("company_ids", companyId);
            const r = await fetch(`/api/accounting/income-statement/rubrics?${q}`, {
              cache: "no-store",
              signal: c.signal,
            });
            if (!r.ok) return { label: sl.label, net: 0, partial: true, src: "http_error" as const };
            const j = (await r.json()) as LynkiIncomeStatementRubricsResponse;
            return {
              label: sl.label,
              net: sumRubricsNet(j),
              partial: !j.complete || j.data_source === "stub",
              src: j.data_source,
            };
          })
        );
        if (c.signal.aborted) return;
        setPoints(results.map(({ label, net, partial }) => ({ label, net, partial })));
        const srcs = new Set(results.map((r) => r.src));
        setDataSource(srcs.size === 1 ? Array.from(srcs)[0] : "mixte");
        setLoading(false);
      } catch {
        if (c.signal.aborted) return;
        setError(true);
        setLoading(false);
      }
    })();

    return () => c.abort();
  }, [tenantId, companyId, slices]);

  if (slices.length === 0) {
    return (
      <div className="sv2-card p-5 sm:p-6 text-xs text-[var(--sv2-text-muted)]">
        <p className="sv2-label text-[var(--sv2-text-muted)]">Lecture graphique</p>
        <p className="mt-1 font-semibold text-[var(--sv2-text)]">Évolution (compte de résultat)</p>
        <p className="mt-2">Période invalide ou vide — graphique non affiché.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="sv2-card p-5 sm:p-6 h-[280px] flex items-center justify-center" aria-busy="true">
        <div className="h-5 w-5 rounded-full border-2 border-[var(--sv2-accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="sv2-card p-5 sm:p-6 text-xs" style={{ borderColor: "color-mix(in srgb, var(--sv2-warning) 40%, transparent)" }}>
        <p className="sv2-label text-[var(--sv2-text-muted)]">Lecture graphique</p>
        <p className="mt-1 font-semibold text-[var(--sv2-text)]">Évolution (compte de résultat)</p>
        <p className="mt-2 text-[var(--sv2-text-muted)]">Impossible de charger la série temporelle.</p>
      </div>
    );
  }

  const anyPartial = points.some((p) => p.partial);
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="sv2-card sv2-card-highlight p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <p className="sv2-label text-[var(--sv2-text-muted)]">Lecture graphique</p>
          <h3 className="mt-1 text-base font-bold text-[var(--sv2-text)]">Tendance d&apos;activité</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="sv2-badge sv2-badge-accent">Résultat CdR</span>
          {anyPartial && <span className="sv2-badge sv2-badge-partial">Partiel</span>}
        </div>
      </div>
      <div className="h-[220px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--sv2-border)" opacity={0.5} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--sv2-text-muted)" }} />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--sv2-text-muted)" }}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              formatter={(value: number) => [fmt(value), "Résultat"]}
              labelFormatter={(l) => `Période ${l}`}
              contentStyle={{
                fontSize: 11,
                borderRadius: 12,
                border: "1px solid var(--sv2-border)",
                background: "var(--sv2-surface)",
              }}
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="var(--sv2-accent)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--sv2-accent)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="sv2-ref">
        Réf. lynki.accounting.income_statement · rubriques · source {dataSource} · Somme des rubriques CdR par mois (indicatif).
      </p>
    </div>
  );
}
