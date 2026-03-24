"use client";

/**
 * Sprint 17 T94 — Donut : répartition des rubriques CdR (top 5 par |montant| + Autres).
 * Source : GET /api/accounting/income-statement/rubrics sur la période complète.
 * Les parts utilisent |montant| pour la lisibilité visuelle ; la légende indique le montant signé.
 */

import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { LynkiIncomeStatementRubricsResponse, RubricLine } from "@/app/api/accounting/income-statement/rubrics/route";

export interface AccountingSummaryBreakdownChartProps {
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
}

const MAX_SLICES = 5;
const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#64748b"];

type Slice = { name: string; value: number; signed: number };

function buildSlices(lines: RubricLine[]): Slice[] {
  if (!lines.length) return [];
  const scored = lines.map((l) => ({
    label: l.label?.trim() || l.rubric_id,
    abs: Math.abs(typeof l.amount === "number" ? l.amount : 0),
    signed: typeof l.amount === "number" ? l.amount : 0,
  }));
  scored.sort((a, b) => b.abs - a.abs);
  const top = scored.slice(0, MAX_SLICES);
  const rest = scored.slice(MAX_SLICES);
  const restAbs = rest.reduce((s, x) => s + x.abs, 0);
  const out: Slice[] = top.map((t) => ({ name: t.label, value: t.abs, signed: t.signed }));
  if (restAbs > 0) {
    const restSigned = rest.reduce((s, x) => s + x.signed, 0);
    out.push({ name: "Autres", value: restAbs, signed: restSigned });
  }
  return out;
}

export function AccountingSummaryBreakdownChart({ tenantId, companyId, period }: AccountingSummaryBreakdownChartProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [slices, setSlices] = useState<Slice[]>([]);
  const [meta, setMeta] = useState<{ complete: boolean; data_source: string }>({
    complete: false,
    data_source: "—",
  });

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
    setLoading(true);
    setError(false);
    fetch(`/api/accounting/income-statement/rubrics?${qs}`, { cache: "no-store", signal: c.signal })
      .then((r) => {
        if (!r.ok) throw new Error("rubrics");
        return r.json() as Promise<LynkiIncomeStatementRubricsResponse>;
      })
      .then((d) => {
        setSlices(buildSlices(d.lines ?? []));
        setMeta({ complete: d.complete, data_source: d.data_source });
        setLoading(false);
      })
      .catch(() => {
        if (c.signal.aborted) return;
        setError(true);
        setLoading(false);
      });
    return () => c.abort();
  }, [qs]);

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
        <p className="mt-1 font-semibold text-[var(--sv2-text)]">Répartition des charges</p>
        <p className="mt-2 text-[var(--sv2-text-muted)]">Impossible de charger les rubriques pour le graphique.</p>
      </div>
    );
  }

  if (slices.length === 0) {
    return (
      <div className="sv2-card p-5 sm:p-6 text-xs text-[var(--sv2-text-muted)]">
        <p className="sv2-label text-[var(--sv2-text-muted)]">Lecture graphique</p>
        <p className="mt-1 font-semibold text-[var(--sv2-text)]">Répartition des charges</p>
        <p className="mt-2">Aucune rubrique sur cette période — graphique non affiché.</p>
      </div>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="sv2-card sv2-card-highlight p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <p className="sv2-label text-[var(--sv2-text-muted)]">Lecture graphique</p>
          <h3 className="mt-1 text-base font-bold text-[var(--sv2-text)]">Répartition des charges</h3>
        </div>
        {!meta.complete && <span className="sv2-badge sv2-badge-partial">Partiel</span>}
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="h-[200px] w-[200px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
              >
                {slices.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--sv2-border)" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip
                formatter={(_v: number, _n: string, item: { payload?: Slice }) => {
                  const s = item.payload;
                  if (!s) return "";
                  return [`${fmt(s.signed)} (|·| ${fmt(s.value)})`, s.name];
                }}
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 12,
                  border: "1px solid var(--sv2-border)",
                  background: "var(--sv2-surface)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 space-y-2 text-xs" aria-label="Légende des rubriques">
          {slices.map((s, i) => (
            <li key={s.name + i} className="sv2-inner p-2.5 flex items-center gap-3">
              <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="flex-1">
                <span className="text-[var(--sv2-text)] font-medium">{s.name}</span>
              </span>
              <span className="tabular-nums text-[var(--sv2-text-muted)]">{fmt(s.signed)}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="sv2-ref">
        Réf. lynki.accounting.income_statement · rubriques · source {meta.data_source} · Regroupement « Autres » = rubriques hors top {MAX_SLICES}.
      </p>
    </div>
  );
}
