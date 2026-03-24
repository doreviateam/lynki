"use client";

interface AccountingSummaryBreadcrumbProps {
  /** Filtre rubrique / préfixe BG actif — sinon null */
  drillFilter: { prefixes: string; label: string } | null;
  /** Remonte à la balance générale complète (efface le filtre drill) */
  onClearDrill: () => void;
}

/**
 * Fil d'Ariane réel pour la Synthèse : reflète l'état de drill-down BG,
 * pas une décoration statique (Sprint 16 T89).
 */
export function AccountingSummaryBreadcrumb({ drillFilter, onClearDrill }: AccountingSummaryBreadcrumbProps) {
  return (
    <nav aria-label="Fil d'Ariane Synthèse" className="flex flex-wrap items-center gap-1 text-xs text-[var(--text-muted)]">
      <span className="font-medium text-[var(--text)]" aria-current={!drillFilter ? "page" : undefined}>
        Synthèse
      </span>

      <span aria-hidden className="text-[var(--border)]">
        ›
      </span>

      {drillFilter ? (
        <>
          <button
            type="button"
            onClick={() => {
              onClearDrill();
              document.getElementById("balance-generale")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="text-[var(--accent)] hover:underline focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded"
          >
            Balance générale
          </button>
          <span aria-hidden className="text-[var(--border)]">
            ›
          </span>
          <span className="max-w-[min(100%,12rem)] truncate font-medium text-[var(--text)]" title={drillFilter.label}>
            {drillFilter.label}
          </span>
        </>
      ) : (
        <button
          type="button"
          onClick={() => document.getElementById("balance-generale")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="text-[var(--accent)] hover:underline focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded"
        >
          Balance générale
        </button>
      )}
    </nav>
  );
}
