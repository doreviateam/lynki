"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import { buildTreasuryCockpitTileModel } from "@/app/lib/cockpit/treasury-cockpit-tile";

const MAX_VIGILANCES_HEAD = 5;

export type VigilanceSeverity = "critical" | "important" | "info";

export interface TreasuryVigilanceRow {
  id: string;
  severity: VigilanceSeverity;
  icon: string;
  label: string;
  body: string;
}

function daysSince(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function severityOrder(s: VigilanceSeverity): number {
  switch (s) {
    case "critical":
      return 0;
    case "important":
      return 1;
    default:
      return 2;
  }
}

/** Règles alignées sur `treasury.status` (badge tuile) — pas de contradiction « Fiable » vs alerte critique sans lien. */
export function buildTreasuryVigilanceRows(
  metrics: DashboardMetricsResponse,
  formatCurrency: (n: number | null | undefined) => string
): TreasuryVigilanceRow[] {
  const t = metrics.treasury;
  const st = t.status;
  const reason = (t.status_reason ?? "").trim();
  const d = metrics._details?.treasury;
  const reconciliationRate = d?.treasury_validated_pct ?? null;
  const unreconciledAmount = d?.unreconciled ?? null;
  const unreconciledLines = d?.unreconciled_lines_count ?? null;
  const oldestUnreconciled = d?.oldest_unreconciled_date ?? null;
  const tile = buildTreasuryCockpitTileModel(metrics);
  const erpDelta = tile.erpDelta;

  const rows: TreasuryVigilanceRow[] = [];

  if (st === "critical" || st === "alert") {
    rows.push({
      id: "status-critical",
      severity: "critical",
      icon: "error",
      label: "Critique",
      body:
        reason ||
        (reconciliationRate != null
          ? `Couverture probante très faible (${Math.round(reconciliationRate)} %) — lecture à stabiliser avant pilotage.`
          : "Couverture probante insuffisante — lecture à stabiliser."),
    });
  } else if (st === "watch") {
    rows.push({
      id: "status-watch",
      severity: "important",
      icon: "priority_high",
      label: "À surveiller",
      body:
        reason ||
        (reconciliationRate != null
          ? `Couverture / rapprochement encore partiel (${Math.round(reconciliationRate)} %).`
          : "Rapprochement encore partiel sur le périmètre affiché."),
    });
  } else if (st === "neutral") {
    rows.push({
      id: "status-neutral",
      severity: "info",
      icon: "pending",
      label: "Information",
      body: reason || "Couverture probante non disponible — lecture en attente de données.",
    });
  }

  if (unreconciledAmount != null && unreconciledAmount > 0) {
    const suffix = unreconciledLines != null ? ` · ${unreconciledLines} ligne(s) ouverte(s)` : "";
    rows.push({
      id: "unreconciled-amt",
      severity: "important",
      icon: "account_balance",
      label: "À surveiller",
      body: `Montant encore à rapprocher : ${formatCurrency(unreconciledAmount)}${suffix}.`,
    });
  }

  if (oldestUnreconciled) {
    const days = daysSince(oldestUnreconciled);
    const dateStr = new Date(oldestUnreconciled).toLocaleDateString("fr-FR");
    const sev: VigilanceSeverity =
      days != null && days > 30 ? "important" : "info";
    rows.push({
      id: "oldest-unreconciled",
      severity: sev,
      icon: "schedule",
      label: sev === "important" ? "À surveiller" : "Information",
      body:
        days != null && days > 30
          ? `Ancienneté élevée : écriture ouverte la plus ancienne au ${dateStr} (${days} jour(s)).`
          : `Écriture non rapprochée la plus ancienne : ${dateStr}${days != null ? ` (${days} jour(s))` : ""}.`,
    });
  }

  if (erpDelta != null && Number.isFinite(erpDelta) && Math.abs(erpDelta) >= 0.01) {
    const signed = tile.erpDeltaFormatted ?? `${erpDelta}`;
    rows.push({
      id: "erp-gap",
      severity: "important",
      icon: "compare_arrows",
      label: "À surveiller",
      body: `Écart ERP − position validée : ${signed} — détail dans le bloc « Écart à confirmer ».`,
    });
  }

  rows.sort((a, b) => {
    const o = severityOrder(a.severity) - severityOrder(b.severity);
    if (o !== 0) return o;
    return a.id.localeCompare(b.id);
  });

  return rows;
}

function rowSurface(severity: VigilanceSeverity): string {
  switch (severity) {
    case "critical":
      return "border border-red-400/40 bg-red-500/10 text-red-950 dark:border-red-500/30 dark:text-red-200";
    case "important":
      return "border border-amber-400/35 bg-amber-500/10 text-amber-950 dark:text-amber-200";
    default:
      return "border border-[var(--border)] bg-[var(--bg-secondary)]/40 text-[var(--text-secondary)]";
  }
}

export function TreasuryDetailVigilancesBlock({
  metrics,
  confidenceScore,
  pilotageHref,
  odooBankStatementLinesHref,
  formatCurrency,
}: {
  metrics: DashboardMetricsResponse;
  confidenceScore: number | null;
  pilotageHref: string;
  odooBankStatementLinesHref: string;
  formatCurrency: (n: number | null | undefined) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  const { rows, showSuccess } = useMemo(() => {
    const base = buildTreasuryVigilanceRows(metrics, formatCurrency);
    const st = metrics.treasury.status;
    const major = base.filter((r) => r.severity === "critical" || r.severity === "important");

    let completeness: TreasuryVigilanceRow | null = null;
    if (confidenceScore != null && confidenceScore < 100) {
      completeness = {
        id: "data-completeness",
        severity: "info",
        icon: "info",
        label: "Information",
        body: `Complétude des données scellées sur le périmètre : ${Math.round(confidenceScore)} %.`,
      };
    }

    const success = st === "ok" && major.length === 0;
    const allRows = completeness ? [...base, completeness] : base;
    allRows.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity) || a.id.localeCompare(b.id));

    return { rows: allRows, showSuccess: success };
  }, [metrics, confidenceScore, formatCurrency]);

  const visibleRows = expanded ? rows : rows.slice(0, MAX_VIGILANCES_HEAD);
  const hiddenCount =
    !expanded && rows.length > MAX_VIGILANCES_HEAD ? rows.length - MAX_VIGILANCES_HEAD : 0;

  return (
    <section
      aria-labelledby="treso-vigilances-heading"
      className="order-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm lg:order-6 lg:col-span-2"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Icon name="policy" size={22} className="text-[var(--text)]" />
        <h2 id="treso-vigilances-heading" className="text-sm font-bold uppercase tracking-tight text-[var(--text)]">
          Vigilances et actions
        </h2>
      </div>
      <p className="mb-4 text-xs text-[var(--text-secondary)]">
        Priorisation sur 3 niveaux (critique · à surveiller · information). Affichage limité à{" "}
        {MAX_VIGILANCES_HEAD} vigilances — aligné sur le badge Trésorerie et les blocs détail.
      </p>

      <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        <span className="rounded border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-red-800 dark:text-red-300">Critique</span>
        <span className="rounded border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-amber-900 dark:text-amber-300">
          À surveiller
        </span>
        <span className="rounded border border-[var(--border)] px-2 py-0.5">Information</span>
      </div>

      {showSuccess ? (
        <div className="mb-4 flex gap-2 rounded-lg border border-emerald-300/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-300">
          <Icon name="check_circle" size={18} className="shrink-0" />
          <div>
            <span className="font-semibold">Lecture fiable sur le périmètre.</span>{" "}
            <span className="text-emerald-800/90 dark:text-emerald-200/90">
              Aucune vigilance majeure sur les signaux disponibles (couverture, reste à rapprocher, ancienneté, écart ERP).
            </span>
          </div>
        </div>
      ) : null}

      {visibleRows.length > 0 ? (
        <ul className="space-y-3 text-sm">
          {visibleRows.map((r) => (
            <li
              key={r.id}
              className={`flex gap-2 rounded-lg px-3 py-2 ${rowSurface(r.severity)}`}
              aria-label={`${r.label} : ${r.body}`}
            >
              <Icon name={r.icon} size={18} className="shrink-0 opacity-90" />
              <div className="min-w-0 flex-1">
                <span className="sr-only">{r.label} — </span>
                <span>{r.body}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!expanded && hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 text-xs font-semibold text-[var(--text-secondary)] underline decoration-dotted underline-offset-2 hover:text-[var(--text)]"
        >
          Afficher {hiddenCount} vigilance{hiddenCount > 1 ? "s" : ""} supplémentaire{hiddenCount > 1 ? "s" : ""}
        </button>
      ) : null}
      {expanded && rows.length > MAX_VIGILANCES_HEAD ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-3 text-xs font-semibold text-[var(--text-secondary)] underline decoration-dotted underline-offset-2 hover:text-[var(--text)]"
        >
          Réduire
        </button>
      ) : null}

      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Actions prioritaires</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={pilotageHref}
            className="inline-flex items-center justify-center rounded bg-slate-900 px-4 py-2 text-center text-xs font-bold text-white transition-opacity hover:opacity-90 dark:bg-slate-100 dark:text-slate-900"
          >
            Retour au pilotage
          </Link>
          <a
            href={odooBankStatementLinesHref}
            target="_blank"
            rel="noopener noreferrer"
            title="Ouvre les lignes de relevé bancaire dans Odoo (nouvel onglet)"
            className="inline-flex items-center justify-center rounded border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-bold text-[var(--text)] transition-opacity hover:opacity-90"
          >
            Ouvrir le rapprochement
          </a>
        </div>
      </div>
    </section>
  );
}
