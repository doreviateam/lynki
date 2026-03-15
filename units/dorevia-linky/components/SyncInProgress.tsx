"use client";

/** Spec §6.1 — Synchronisation des preuves en cours. Ton neutre, pas d'alarme. */
export interface SyncInProgressProps {
  /** Nombre de preuves scellées (partiel si incomplet) */
  sealedCount?: number | null;
  /** true = complétude atteinte, false = en attente ou erreur */
  sealedCountComplete?: boolean;
  /** Callback déclenché au clic sur "Réessayer" */
  onRetry?: () => void;
  /** Callback pour afficher le dashboard malgré l'incomplétude */
  onViewAnyway?: () => void;
  /** true = fetch en cours (spinner) */
  loading?: boolean;
  /** Nombre de tentatives effectuées (>= 1 → afficher Réessayer si incomplet) */
  attemptCount?: number;
  /** Total attendu (Sprint 2) — si absent, afficher "—" */
  expectedCount?: number | null;
  /** Timestamp ISO 8601 — Dernière synchronisation (connecteur) */
  generatedAt?: string | null;
}

function formatGeneratedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function SyncInProgress({
  sealedCount,
  sealedCountComplete,
  onRetry,
  onViewAnyway,
  loading = false,
  attemptCount = 0,
  expectedCount,
  generatedAt,
}: SyncInProgressProps) {
  const canRetry = !sealedCountComplete && attemptCount >= 1 && onRetry;
  const canViewAnyway = !sealedCountComplete && attemptCount >= 1 && onViewAnyway;
  const hasCount = sealedCount != null && sealedCount >= 0;
  const totalStr = expectedCount != null ? String(expectedCount) : "—";
  const progression = hasCount ? `${sealedCount} / ${totalStr} preuves scellées` : null;

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-12 px-4 text-center"
      role="status"
      aria-live="polite"
      data-testid="sync-in-progress"
    >
      {loading && (
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent"
          aria-hidden
        />
      )}
      <p className="text-[var(--text-secondary)] text-sm">
        {canRetry
          ? "Synchronisation en cours… Vous pouvez réessayer."
          : "Synchronisation des preuves en cours…"}
      </p>
      {progression && (
        <p className="text-xs text-[var(--text-muted)]" data-testid="sync-progression">
          {progression}
        </p>
      )}
      {generatedAt && (
        <p className="text-xs text-[var(--text-muted)]" data-testid="sync-generated-at">
          Dernière synchronisation : {formatGeneratedAt(generatedAt)}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {canRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-[var(--accent)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
            data-testid="sync-retry-button"
          >
            Réessayer
          </button>
        )}
        {canViewAnyway && (
          <button
            type="button"
            onClick={onViewAnyway}
            className="rounded-md border border-[var(--muted)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--muted)]/20 transition-colors"
            data-testid="sync-view-anyway-button"
          >
            Voir le dashboard
          </button>
        )}
      </div>
    </div>
  );
}
