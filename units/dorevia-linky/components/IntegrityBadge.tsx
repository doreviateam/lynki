"use client";

import { useState, useEffect } from "react";

type IntegrityState = "STATE_OK" | "STATE_PARTIAL" | "STATE_ALERT";

interface PlatformStatus {
  integrity_state: IntegrityState;
  tooltip_cause: string | null;
  sealed_pct: number | null;
  /** Même source que le footer — pour afficher 8 partout (header = footer) */
  sealed_count_total: number | null;
}

const LABELS: Record<IntegrityState, string> = {
  STATE_OK: "Données scellées",
  STATE_PARTIAL: "Données partielles",
  STATE_ALERT: "Intégrité non conforme",
};

const ICONS: Record<IntegrityState, string> = {
  STATE_OK: "🔐",
  STATE_PARTIAL: "⚠",
  STATE_ALERT: "✖",
};

interface IntegrityBadgeProps {
  tenantId: string;
  /** Nombre de preuves scellées sur la période (depuis dashboard-metrics) */
  sealedCount?: number | null;
  /** true = les 5 sources ont répondu, comptage total fiable. false/undefined = partiel, à rafraîchir. */
  sealedCountComplete?: boolean;
  /** Rafraîchir les métriques (recalcule le nombre de preuves) */
  onRefresh?: () => void;
}

export function IntegrityBadge({ tenantId, sealedCount, sealedCountComplete = true, onRefresh }: IntegrityBadgeProps) {
  const [status, setStatus] = useState<PlatformStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/platform/status?tenant=${encodeURIComponent(tenantId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.integrity_state) {
          setStatus({
            integrity_state: d.integrity_state,
            tooltip_cause: d.tooltip_cause ?? null,
            sealed_pct: d.sealed_pct ?? d.sealed_ratio != null ? Math.round((d.sealed_ratio ?? 0) * 100) : null,
            sealed_count_total: typeof d.sealed_count_total === "number" ? d.sealed_count_total : null,
          });
        }
      })
        .catch(() => {
        if (!cancelled) {
          setStatus({ integrity_state: "STATE_ALERT", tooltip_cause: "Service indisponible", sealed_pct: null, sealed_count_total: null });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  if (!status) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-secondary)]"
        title="Chargement..."
      >
        —
      </span>
    );
  }

  const state = status.integrity_state;
  const baseLabel = LABELS[state];
  const countFromStatus = status.sealed_count_total != null && status.sealed_count_total >= 0 ? status.sealed_count_total : null;
  /** Une seule source : priorité au prop (dashboard-metrics) pour aligner header et footer, sinon platform/status */
  const displayCount = typeof sealedCount === "number" && sealedCount >= 0 ? sealedCount : countFromStatus;
  const hasCount = displayCount != null;
  const pct = status.sealed_pct;
  const complete = sealedCountComplete !== false;
  const label =
    hasCount && displayCount != null
      ? complete
        ? `${displayCount} preuves scellées`
        : `${displayCount} preuves (partiel)`
      : pct != null && (state === "STATE_OK" || state === "STATE_PARTIAL")
        ? `${pct} % couverts`
        : baseLabel;
  const icon = ICONS[state];
  let tooltipBase = hasCount
    ? complete
      ? "Factures, paiements et sessions POS scellés. Comptage total pour la période."
      : "Données partielles : certaines sources n'ont pas répondu. Le chiffre peut être incomplet. Rafraîchir pour réessayer."
    : label;
  if (hasCount && complete && pct === 100) {
    tooltipBase += "\n\nCouverture : 100 % des flux détectés";
  }
  const title = status.tooltip_cause ? `${tooltipBase}\n${status.tooltip_cause}` : tooltipBase;

  const colorClass =
    !complete || state === "STATE_PARTIAL"
      ? "text-[var(--warning)] border-[var(--warning)]/30 bg-[var(--warning)]/5"
      : state === "STATE_OK"
        ? "text-[var(--positive)] border-[var(--positive)]/30 bg-[var(--positive)]/5"
        : "text-[var(--negative)] border-[var(--negative)]/30 bg-[var(--negative)]/5";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${colorClass}`}
      title={title}
      data-testid="integrity-badge"
    >
      <span aria-hidden>{icon}</span>
      <span className="hidden sm:inline" data-testid="integrity-badge-label">{label}</span>
      {onRefresh && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRefresh();
          }}
          className="ml-0.5 rounded p-0.5 hover:bg-black/10 hover:bg-white/10"
          title="Rafraîchir le nombre de preuves"
          aria-label="Rafraîchir"
        >
          <span aria-hidden>↻</span>
        </button>
      )}
    </span>
  );
}
