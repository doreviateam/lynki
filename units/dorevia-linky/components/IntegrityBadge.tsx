"use client";

import { useState, useEffect } from "react";

type IntegrityState = "STATE_OK" | "STATE_PARTIAL" | "STATE_ALERT";

interface PlatformStatus {
  integrity_state: IntegrityState;
  tooltip_cause: string | null;
  sealed_pct: number | null;
  /** Fallback si le cockpit ne fournit pas sealedCount — total tenant (aligné footer) */
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
  /** Classes additionnelles sur le conteneur (ex. densité contextuelle header). */
  className?: string;
  /**
   * `secondary` : signal de confiance — même information, rendu plus discret (ne rivalise pas avec les filtres).
   */
  visualWeight?: "default" | "secondary";
}

export function IntegrityBadge({
  tenantId,
  sealedCount,
  sealedCountComplete = true,
  onRefresh,
  className = "",
  visualWeight = "default",
}: IntegrityBadgeProps) {
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
  const isViewScopedCount = typeof sealedCount === "number" && sealedCount >= 0;
  /** Prop cockpit (période + périmètre affichés) en priorité, sinon fallback platform/status (total ≈ footer) */
  const displayCount = isViewScopedCount ? sealedCount : countFromStatus;
  const hasCount = displayCount != null;
  const pct = status.sealed_pct;
  const complete = sealedCountComplete !== false;
  const viewLabelSuffix = isViewScopedCount ? "preuves de la vue" : "preuves cumulées";
  const label =
    hasCount && displayCount != null
      ? complete
        ? `${displayCount} ${viewLabelSuffix}`
        : `${displayCount} ${viewLabelSuffix} (partiel)`
      : pct != null && (state === "STATE_OK" || state === "STATE_PARTIAL")
        ? `${pct} % couverts`
        : baseLabel;
  const icon = ICONS[state];
  const tooltipViewComplete = "Preuves scellées correspondant au périmètre et à la période affichés.";
  const tooltipCumulativeComplete =
    "Total des preuves scellées disponibles pour ce tenant et la société affichée (si une société est sélectionnée), toutes périodes confondues.";
  let tooltipBase = hasCount
    ? complete
      ? isViewScopedCount
        ? tooltipViewComplete
        : tooltipCumulativeComplete
      : isViewScopedCount
        ? `${tooltipViewComplete} Données partielles : certaines sources n'ont pas répondu. Le chiffre peut être incomplet. Rafraîchir pour réessayer.`
        : `${tooltipCumulativeComplete} Données partielles : le total peut être incomplet. Rafraîchir pour réessayer.`
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

  const leftAccentClass =
    !complete || state === "STATE_PARTIAL"
      ? "border-l-amber-500/45"
      : state === "STATE_OK"
        ? "border-l-emerald-500/40"
        : "border-l-red-500/50";

  const shellClass =
    visualWeight === "secondary"
      ? `border border-[color-mix(in_srgb,var(--border)_30%,transparent)] border-l-2 ${leftAccentClass} bg-[color-mix(in_srgb,var(--surface)_96%,transparent)] text-[color-mix(in_srgb,var(--text-secondary)_88%,var(--muted)_12%)] !font-normal text-[10px] sm:text-[10px]`
      : colorClass;

  return (
    <span
      className={`inline-flex w-max max-w-full shrink-0 flex-nowrap items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${visualWeight === "secondary" ? "!gap-1 !px-1.5 !py-px" : ""} ${shellClass} ${className}`.trim()}
      title={title}
      data-testid="integrity-badge"
    >
      <span className="inline-flex shrink-0 items-center gap-1">
        <span aria-hidden>{icon}</span>
        <span className="hidden sm:inline" data-testid="integrity-badge-label">
          {label}
        </span>
      </span>
      {onRefresh ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRefresh();
          }}
          className="shrink-0 rounded p-0.5 hover:bg-black/10 hover:bg-white/10"
          title="Rafraîchir le nombre de preuves"
          aria-label="Rafraîchir"
        >
          <span aria-hidden>↻</span>
        </button>
      ) : null}
    </span>
  );
}
