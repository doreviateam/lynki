"use client";

/**
 * Grille d'icônes style Odoo — page d'accueil Linky (SPEC_LINKY_HOME_GRID v1.1).
 * 8 tuiles KPI : icône → label → valeur (structure finale tuile KPI).
 */
import { useState, useEffect, useCallback } from "react";
import {
  IconTreasury,
  IconCash,
  IconBusiness,
  IconTaxes,
  IconCreditNotes,
  IconRefunds,
  IconPosShops,
  IconZReport,
} from "@/components/CardIcons";
import type { DashboardMetricsResponse, ValueKind } from "@/app/api/dashboard-metrics/route";

export type CardId =
  | "treasury"
  | "cash"
  | "business"
  | "taxes"
  | "credit_notes"
  | "refunds"
  | "pos_shops"
  | "pos_z";

interface IconGridItem {
  id: CardId;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const GRID_ITEMS: IconGridItem[] = [
  { id: "treasury", label: "Trésorerie validée", Icon: IconTreasury },
  { id: "cash", label: "Cash", Icon: IconCash },
  { id: "business", label: "Business", Icon: IconBusiness },
  { id: "taxes", label: "Taxes", Icon: IconTaxes },
  { id: "credit_notes", label: "Notes de crédit", Icon: IconCreditNotes },
  { id: "refunds", label: "Remboursements", Icon: IconRefunds },
  { id: "pos_shops", label: "Points de vente", Icon: IconPosShops },
  { id: "pos_z", label: "Z de caisse", Icon: IconZReport },
];

function valueKindToClass(kind: ValueKind): string {
  switch (kind) {
    case "positive":
      return "text-[var(--positive)]";
    case "negative":
      return "text-[var(--negative)]";
    case "zero":
      return "text-[var(--accent-soft)]";
    case "accent":
      return "text-[var(--accent)]";
    case "accent_soft":
      return "text-[var(--accent-soft)]";
    case "neutral":
      return "text-[var(--text)]";
    case "placeholder":
    default:
      return "text-[var(--text-secondary)]";
  }
}

const STATUS_COLORS: Record<string, string> = {
  neutral: "#60a5fa",
  ok: "#22c55e",
  watch: "#f97316",
  alert: "#ef4444",
};

const STATUS_BG: Record<string, string> = {
  neutral: "rgba(96,165,250,0.10)",
  ok: "rgba(34,197,94,0.12)",
  watch: "rgba(249,115,22,0.12)",
  alert: "rgba(239,68,68,0.12)",
};

interface IconGridProps {
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
  /** Métriques partagées (parent) — évite double fetch avec DivaFlashBlock */
  metrics?: DashboardMetricsResponse | null;
  /** En cours de chargement (affiche skeleton) */
  metricsLoading?: boolean;
  onSelect: (cardId: CardId) => void;
}

export function IconGrid({ tenantId, companyId, period, metrics: metricsProp, metricsLoading = false, onSelect }: IconGridProps) {
  const [localMetrics, setLocalMetrics] = useState<DashboardMetricsResponse | null>(null);
  const metrics = metricsProp ?? localMetrics;

  useEffect(() => {
    if (metricsProp !== undefined) return;
    const params = new URLSearchParams({
      tenant: tenantId,
      date_debut: period.from,
      date_fin: period.to,
      ...(companyId && { company_id: companyId }),
    });
    fetch(`/api/dashboard-metrics?${params}`, { cache: "no-store", headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => (d && typeof d === "object" ? setLocalMetrics(d) : setLocalMetrics(null)))
      .catch(() => setLocalMetrics(null));
  }, [metricsProp, tenantId, companyId, period.from, period.to]);

  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
      role="navigation"
      aria-label="Grille des indicateurs KPI"
    >
      {GRID_ITEMS.map(({ id, label, Icon }) => {
        const metric = metrics?.[id];
        const formatted = metric?.formatted ?? "—";
        const valueKind = (metric?.valueKind ?? "neutral") as ValueKind;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
            aria-label={`Ouvrir ${label}`}
          >
            {/* Icône — encadrement coloré selon le statut */}
            <div
              className="flex h-16 w-16 items-center justify-center rounded-lg text-[var(--accent)]"
              style={{
                border: `1.5px solid ${STATUS_COLORS[metric?.status ?? ""] ?? "transparent"}`,
                backgroundColor: STATUS_BG[metric?.status ?? ""] ?? "rgba(96,165,250,0.15)",
              }}
              title={metric?.status_reason ?? ""}
            >
              <Icon className="h-10 w-10 shrink-0" />
            </div>
            {/* Label */}
            <span className="text-center text-sm font-semibold text-[var(--text)]">{label}</span>
            {/* Valeur — skeleton si chargement, sinon donnée */}
            <span
              className={`text-center text-sm font-bold tabular-nums ${valueKindToClass(valueKind)} ${metricsLoading && !metric ? "animate-pulse opacity-60" : ""}`}
              aria-busy={metricsLoading && !metric}
            >
              {formatted}
            </span>
          </button>
        );
      })}
    </div>
  );
}
