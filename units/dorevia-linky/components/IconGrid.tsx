"use client";

/**
 * Grille d'icônes KPI — SPEC_UI_LINKY_v3_BUILD_READY.
 * Tuiles A/B/C : priorité visuelle, tabular-nums, hauteurs min.
 * Tooltips : NOTE_IMPLÉMENTATION_TOOLTIPS_TUILES_LINKY_SYNTHÈSE_v1.0 ;
 * placement mobile : ZeDocs/web48 PRECONISATIONS_MOBILE_TOOLTIPS_TUILES_LINKY_v1.2.
 */
import { useState, useEffect, useRef } from "react";

const GRID_COLS_BREAKPOINTS = { sm: 640, md: 768 } as const;

function useGridCols(): 2 | 3 | 4 {
  const [cols, setCols] = useState<2 | 3 | 4>(2);
  useEffect(() => {
    const mqMd = window.matchMedia(`(min-width: ${GRID_COLS_BREAKPOINTS.md}px)`);
    const mqSm = window.matchMedia(`(min-width: ${GRID_COLS_BREAKPOINTS.sm}px)`);
    const update = () => {
      setCols(mqMd.matches ? 4 : mqSm.matches ? 3 : 2);
    };
    update();
    mqMd.addEventListener("change", update);
    mqSm.addEventListener("change", update);
    return () => {
      mqMd.removeEventListener("change", update);
      mqSm.removeEventListener("change", update);
    };
  }, []);
  return cols;
}
import {
  IconTreasury,
  IconCash,
  IconBusiness,
  IconTaxes,
  IconCreditNotes,
  IconRefunds,
  IconPosShops,
  IconZReport,
  IconWorkingCapital,
  IconEncours,
  IconEbe,
} from "@/components/CardIcons";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import {
  type CardId,
  CARD_PRIORITY,
  getTileClasses,
  type TileStatus,
} from "@/app/types/linky-tiles";
import { getTileHelp } from "@/app/lib/tile-help";

export type { CardId } from "@/app/types/linky-tiles";

interface IconGridItem {
  id: CardId;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

// Ordre : A en ligne 1, B en lignes 2-3 (EBE en B = rang affiché avant les C)
const GRID_ITEMS: IconGridItem[] = [
  { id: "treasury", label: "Trésorerie", Icon: IconTreasury },
  { id: "business", label: "Business", Icon: IconBusiness },
  { id: "cash", label: "Flux net", Icon: IconCash },
  { id: "treasury_position", label: "Paiements", Icon: IconTreasury },
  { id: "working_capital", label: "BFR", Icon: IconWorkingCapital },
  { id: "encours", label: "Encours", Icon: IconEncours },
  { id: "taxes", label: "Taxes", Icon: IconTaxes },
  { id: "ebitda", label: "EBE", Icon: IconEbe },
  { id: "credit_notes", label: "Notes de crédit", Icon: IconCreditNotes },
  { id: "refunds", label: "Remboursements", Icon: IconRefunds },
  { id: "pos_shops", label: "Points de vente", Icon: IconPosShops },
  { id: "pos_z", label: "Z de caisse", Icon: IconZReport },
];

const STATUS_COLORS: Record<string, string> = {
  neutral: "#60a5fa",
  ok: "#22c55e",
  watch: "#f97316",
  alert: "#ef4444",
  critical: "#ef4444",
};

const STATUS_BG: Record<string, string> = {
  neutral: "rgba(96,165,250,0.10)",
  ok: "rgba(34,197,94,0.12)",
  watch: "rgba(249,115,22,0.12)",
  alert: "rgba(239,68,68,0.12)",
  critical: "rgba(239,68,68,0.12)",
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

const TOTAL_TILES = GRID_ITEMS.length;

export function IconGrid({ tenantId, companyId, period, metrics: metricsProp, metricsLoading = false, onSelect }: IconGridProps) {
  const [localMetrics, setLocalMetrics] = useState<DashboardMetricsResponse | null>(null);
  const metrics = metricsProp ?? localMetrics;
  const [openTooltipId, setOpenTooltipId] = useState<CardId | null>(null);
  const tooltipCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridCols = useGridCols();

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

  // Fermer le tooltip au clic en dehors (NOTE tooltips §5.2)
  useEffect(() => {
    if (openTooltipId === null) return;
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-tile-help-trigger]") || target.closest("[data-tile-help-popover]")) return;
      setOpenTooltipId(null);
    };
    document.addEventListener("mousedown", handleDocClick, true);
    return () => document.removeEventListener("mousedown", handleDocClick, true);
  }, [openTooltipId]);

  useEffect(() => {
    return () => {
      if (tooltipCloseTimeoutRef.current) clearTimeout(tooltipCloseTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className="grid w-full auto-rows-[160px] grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
      role="navigation"
      aria-label="Grille des indicateurs KPI"
    >
      {GRID_ITEMS.map(({ id, label, Icon }, index) => {
        const metric = metrics?.[id];
        // Placement selon nombre réel de colonnes et rangée (ZeDocs/web48 v1.2)
        const col = index % gridCols;
        const row = Math.floor(index / gridCols);
        const totalRows = Math.ceil(TOTAL_TILES / gridCols);
        const isFirstRow = row === 0;
        const isLastRow = row === totalRows - 1;
        const isLeftCol = col === 0;
        const isRightCol = col === gridCols - 1;
        const isCenterCol = gridCols > 2 && !isLeftCol && !isRightCol;
        // EBE : libellé métier explicite si pas encore de données paie.
        // Garde-fou React #31 : n'afficher que des chaînes (jamais d'objet comme child).
        const rawFormatted =
          metric?.formatted ??
          (id === "ebitda" ? "En attente" : "—");
        const formatted =
          typeof rawFormatted === "string" ? rawFormatted : (id === "ebitda" ? "En attente" : "—");
        const priority = CARD_PRIORITY[id];
        const status: TileStatus =
          metricsLoading && !metric ? "loading" : !metric ? "unavailable" : "ready";
        const { container, valueSize: valueSizeFromPriority } = getTileClasses(priority, status);

        // Hiérarchie tuiles (NOTE_EXPLICATIVE_MISE_EN_OEUVRE_HIERARCHIE_TUILES_LINKY_v1.0) :
        // Tuiles maîtresses (encadrées) : Trésorerie, Business, Flux net — contour + montant coloré selon statut.
        // Tuiles secondaires (non encadrées) : montant sobre (--text), accent uniquement en alerte métier (alert).
        const isMasterTile = id === "treasury" || id === "business" || id === "cash";
        const iconBorderColor = STATUS_COLORS[metric?.status ?? ""] ?? STATUS_COLORS.neutral;
        const tileBorderStyle = isMasterTile ? { borderColor: iconBorderColor } : undefined;
        const amountColor =
          isMasterTile
            ? iconBorderColor
            : metric?.status === "alert" || metric?.status === "critical"
              ? STATUS_COLORS.alert
              : "var(--text)";

        const help = getTileHelp(id);
        const isTooltipOpen = openTooltipId === id;

        return (
          <div key={id} className="relative flex min-h-0 w-full">
            <button
              type="button"
              onClick={() => onSelect(id)}
              className={`${container} relative flex h-full w-full min-h-0 flex-col items-center justify-start text-center`}
              style={tileBorderStyle}
              aria-label={`Ouvrir ${label}`}
            >
              {/* Icône "i" aide à l'intérieur de la tuile — NOTE_IMPLÉMENTATION_TOOLTIPS_TUILES_LINKY_SYNTHÈSE_v1.0 §5 */}
              {help && (
                <span
                  role="button"
                  tabIndex={0}
                  data-tile-help-trigger
                  className="absolute top-2 right-2 flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-inset"
                  aria-label={`Informations sur la tuile ${help.title}`}
                  aria-expanded={isTooltipOpen}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Un seul tooltip ouvert à la fois (ZeDocs/web48 v1.2 §4.0) : ouvrir celui-ci ferme le précédent
                    setOpenTooltipId((prev) => (prev === id ? null : id));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenTooltipId((prev) => (prev === id ? null : id));
                    }
                  }}
                  onMouseEnter={() => {
                    if (tooltipCloseTimeoutRef.current) {
                      clearTimeout(tooltipCloseTimeoutRef.current);
                      tooltipCloseTimeoutRef.current = null;
                    }
                    setOpenTooltipId(id);
                  }}
                  onMouseLeave={() => {
                    tooltipCloseTimeoutRef.current = setTimeout(() => setOpenTooltipId(null), 150);
                  }}
                >
                  <span className="tile-help-trigger flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold">
                    i
                  </span>
                </span>
              )}
              {/* Icône — encadrement coloré selon le statut */}
              <div
                className="flex h-14 w-14 items-center justify-center rounded-lg text-[var(--accent)] transition-transform duration-150 group-hover:scale-105"
                style={{
                  border: `1.5px solid ${STATUS_COLORS[metric?.status ?? ""] ?? "transparent"}`,
                  backgroundColor: STATUS_BG[metric?.status ?? ""] ?? "rgba(96,165,250,0.15)",
                }}
                title={metric?.status_reason ?? ""}
              >
                <Icon className="h-8 w-8 shrink-0" />
              </div>
              {/* Label — tooltip natif au survol pour rappel du sens de l’indicateur */}
              <span
                className="text-center text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
                title={help?.tooltip}
              >
                {label}
              </span>
              {/* Valeur — taille homogène, centrée */}
              <div className="w-full min-w-0 flex justify-center">
                <span
                  className={`${valueSizeFromPriority} whitespace-nowrap ${status === "loading" ? "animate-pulse opacity-60" : ""}`}
                  style={{ color: amountColor }}
                  aria-busy={status === "loading"}
                >
                  {formatted}
                </span>
              </div>
            </button>
            {/* Bulle tooltip : placement selon gridCols + première/dernière rangée (ZeDocs/web48 v1.2) */}
            {help && isTooltipOpen && (
              <div
                data-tile-help-popover
                role="tooltip"
                className={`absolute z-[100] w-72 max-w-[calc(100vw-2rem)] rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-left text-sm leading-snug text-[var(--text)] shadow-lg ${
                  isLastRow
                    ? "bottom-full mb-0.5"
                    : "top-8 mt-0.5"
                } ${
                  isLeftCol ? "left-0 right-auto" : isRightCol ? "right-0 left-auto" : "left-1/2 right-auto -translate-x-1/2"
                }`}
                style={{ marginLeft: "max(0px, env(safe-area-inset-left))", marginRight: "max(0px, env(safe-area-inset-right))" }}
                onMouseEnter={() => {
                  if (tooltipCloseTimeoutRef.current) {
                    clearTimeout(tooltipCloseTimeoutRef.current);
                    tooltipCloseTimeoutRef.current = null;
                  }
                }}
                onMouseLeave={() => {
                  tooltipCloseTimeoutRef.current = setTimeout(() => setOpenTooltipId(null), 150);
                }}
              >
                {isLastRow ? (
                  <span className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 translate-y-full border-[5px] border-transparent border-t-[var(--border)]" aria-hidden />
                ) : isCenterCol ? (
                  <span className="absolute -top-1 left-1/2 h-0 w-0 -translate-x-1/2 border-[5px] border-transparent border-b-[var(--border)]" aria-hidden />
                ) : null}
                {help.tooltip}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
