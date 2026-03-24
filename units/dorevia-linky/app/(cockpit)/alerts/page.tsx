"use client";

import { Suspense, useState } from "react";
import { Icon } from "@/components/Icon";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { useDashboardData } from "@/hooks/useDashboardData";
import { computeConfidenceScore } from "@/app/lib/confidence";
import { adaptMetricsToAlerts, type AlertSeverity, type AlertItem } from "@/app/lib/alerts-adapter";

type FilterLevel = "all" | AlertSeverity;

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; icon: string; borderColor: string; badgeClass: string }> = {
  urgent: {
    label: "Urgence",
    icon: "error",
    borderColor: "border-l-red-500",
    badgeClass: "bg-red-500/15 text-red-400",
  },
  vigilance: {
    label: "Vigilance",
    icon: "warning",
    borderColor: "border-l-amber-500",
    badgeClass: "bg-amber-500/15 text-amber-400",
  },
  suivi: {
    label: "Suivi",
    icon: "info",
    borderColor: "border-l-slate-500",
    badgeClass: "bg-slate-500/15 text-slate-400",
  },
};

function AlertCard({ alert }: { alert: AlertItem }) {
  const config = SEVERITY_CONFIG[alert.severity];
  return (
    <article className={`rounded-xl border border-[var(--border)] ${config.borderColor} border-l-4 bg-[var(--card)] p-5 shadow-sm`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            name={config.icon}
            size={18}
            filled
            className={
              alert.severity === "urgent"
                ? "text-red-400"
                : alert.severity === "vigilance"
                ? "text-amber-400"
                : "text-slate-400"
            }
          />
          <h3 className="text-sm font-bold text-[var(--text)]">{alert.title}</h3>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.badgeClass}`}>
          {config.label}
        </span>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">{alert.description}</p>

      {alert.metrics && alert.metrics.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          {alert.metrics.map((m) => (
            <div key={m.label} className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
              <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">{m.label}</div>
              <div className="text-sm font-bold tabular-nums text-[var(--text)]">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {alert.source && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Icon name="database" size={12} />
          Source : {alert.source}
        </div>
      )}
    </article>
  );
}

const FILTER_OPTIONS: {
  id: FilterLevel;
  label: string;
  icon: string;
  activeClass: string;
}[] = [
  {
    id: "all",
    label: "Toutes",
    icon: "filter_list",
    activeClass: "bg-[var(--text)] text-[var(--bg)] border-[var(--text)]",
  },
  {
    id: "urgent",
    label: "Urgence",
    icon: "error",
    activeClass: "bg-red-500/20 text-red-400 border-red-500/50",
  },
  {
    id: "vigilance",
    label: "Vigilance",
    icon: "warning",
    activeClass: "bg-amber-500/20 text-amber-400 border-amber-500/50",
  },
  {
    id: "suivi",
    label: "Suivi",
    icon: "info",
    activeClass: "bg-slate-500/20 text-slate-300 border-slate-500/50",
  },
];

function AlertsContent() {
  const { dashboardMetrics, metricsLoading } = useDashboardData();
  const confidenceScore = computeConfidenceScore(dashboardMetrics);
  const alerts = adaptMetricsToAlerts(dashboardMetrics);
  const [activeFilter, setActiveFilter] = useState<FilterLevel>("all");

  const alertsBySeverity = {
    urgent: alerts.filter((a) => a.severity === "urgent"),
    vigilance: alerts.filter((a) => a.severity === "vigilance"),
    suivi: alerts.filter((a) => a.severity === "suivi"),
  };

  const counters: Record<FilterLevel, number> = {
    all: alerts.length,
    urgent: alertsBySeverity.urgent.length,
    vigilance: alertsBySeverity.vigilance.length,
    suivi: alertsBySeverity.suivi.length,
  };

  const filteredAlerts: AlertItem[] =
    activeFilter === "all" ? alerts : alerts.filter((a) => a.severity === activeFilter);

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-4 pb-24 pt-6">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white md:hidden">
            M
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text)]">Alertes &amp; Signaux</h1>
            <p className="text-xs text-[var(--muted)]">Signaux priorisés · Source : données réelles</p>
          </div>
        </div>
        <ConfidenceScore score={confidenceScore} compact />
      </header>

      {/* Filtre par niveau */}
      {!metricsLoading && alerts.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filtrer par niveau d'alerte">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt.id;
            const count = counters[opt.id];
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActiveFilter(opt.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                  isActive
                    ? opt.activeClass
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                }`}
              >
                <Icon name={opt.icon} size={12} filled={isActive} />
                {opt.label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums leading-none ${isActive ? "bg-white/20" : "bg-[var(--border)]"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {metricsLoading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <div className="flex items-center gap-2 text-[var(--muted)]">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <span className="text-sm">Analyse des signaux…</span>
          </div>
        </div>
      ) : alerts.length === 0 ? (
        /* État vide global — aucune alerte toutes catégories */
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Icon name="check_circle" size={48} className="text-emerald-500" />
          <p className="text-lg font-medium text-[var(--text)]">Aucune alerte majeure</p>
          <p className="text-sm text-[var(--muted)]">
            Les signaux apparaîtront ici lorsque des anomalies seront détectées dans vos données.
          </p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        /* État vide par filtre actif */
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border)] py-16 text-center">
          <Icon
            name={FILTER_OPTIONS.find((o) => o.id === activeFilter)?.icon ?? "filter_list"}
            size={32}
            className="text-[var(--muted)]"
          />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Aucune alerte dans cette catégorie.
          </p>
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className="mt-1 text-xs text-[var(--muted)] underline-offset-2 hover:text-[var(--text)] hover:underline"
          >
            Voir toutes les alertes
          </button>
        </div>
      ) : activeFilter === "all" ? (
        /* Vue globale — sections par niveau */
        <div className="space-y-8">
          {alertsBySeverity.urgent.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400">
                <Icon name="error" size={16} filled />
                Urgence ({alertsBySeverity.urgent.length})
              </h2>
              <div className="space-y-4">
                {alertsBySeverity.urgent.map((a) => <AlertCard key={a.id} alert={a} />)}
              </div>
            </section>
          )}

          {alertsBySeverity.vigilance.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
                <Icon name="warning" size={16} filled />
                Vigilance ({alertsBySeverity.vigilance.length})
              </h2>
              <div className="space-y-4">
                {alertsBySeverity.vigilance.map((a) => <AlertCard key={a.id} alert={a} />)}
              </div>
            </section>
          )}

          {alertsBySeverity.suivi.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Icon name="info" size={16} filled />
                Suivi ({alertsBySeverity.suivi.length})
              </h2>
              <div className="space-y-3">
                {alertsBySeverity.suivi.map((a) => <AlertCard key={a.id} alert={a} />)}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* Vue filtrée — liste plate pour le niveau sélectionné */
        <div className="space-y-4">
          {filteredAlerts.map((a) => <AlertCard key={a.id} alert={a} />)}
        </div>
      )}
    </main>
  );
}

export default function AlertsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[var(--muted)]">Chargement…</div>}>
      <AlertsContent />
    </Suspense>
  );
}
