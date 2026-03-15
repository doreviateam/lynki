/**
 * SPEC_UI_LINKY_v3_BUILD_READY — contrat TypeScript et helper variantes tuiles KPI.
 * Socle partagé pour la grille IconGrid (classes A/B/C).
 */

export type CardId =
  | "treasury"
  | "treasury_position"
  | "cash"
  | "business"
  | "taxes"
  | "credit_notes"
  | "refunds"
  | "pos_shops"
  | "pos_z"
  | "working_capital"
  | "encours"
  | "ebitda";

export type TilePriority = "A" | "B" | "C";

export type TileStatus = "ready" | "loading" | "partial" | "unavailable" | "error" | "empty";

/** Aligné avec l’API dashboard-metrics (ValueKind). */
export type TileValueKind =
  | "positive"
  | "negative"
  | "zero"
  | "accent"
  | "accent_soft"
  | "neutral"
  | "placeholder";

export interface KpiTileViewModel {
  id: CardId;
  label: string;
  priority: TilePriority;
  status: TileStatus;
  valueKind: TileValueKind;
  formattedValue: string;
  meta?: string;
  disabled?: boolean;
}

/** Mapping CardId → Classe visuelle (SPEC v3 §6.3, §14). */
export const CARD_PRIORITY: Record<CardId, TilePriority> = {
  treasury: "A",
  treasury_position: "B",
  business: "A",
  cash: "A",
  working_capital: "B",
  taxes: "B",
  encours: "B",
  ebitda: "B",
  credit_notes: "C",
  refunds: "C",
  pos_shops: "C",
  pos_z: "C",
};

const PRIORITY_CONTAINER_CLASSES: Record<TilePriority, string> = {
  // Classe A : fond + contour + padding généreux + gap label/valeur plus marqué
  A:
    "min-h-[var(--tile-a-min-h)] gap-3 border border-[var(--tile-a-border-color)] p-[var(--tile-a-padding)] rounded-xl bg-[var(--tile-a-bg)] shadow-[var(--shadow-card)]",
  B:
    "min-h-[var(--tile-b-min-h)] gap-2 border border-[var(--border)] p-4 rounded-xl bg-[var(--card)] shadow-[var(--shadow-card)]",
  C:
    "min-h-[var(--tile-c-min-h)] gap-2 border border-[var(--border)] p-3 rounded-xl bg-[var(--card)] shadow-[var(--shadow-card)]",
};

const PRIORITY_VALUE_CLASSES: Record<TilePriority, string> = {
  A: "text-[length:var(--tile-a-value-size)] font-bold tabular-nums",
  B: "text-[length:var(--tile-b-value-size)] font-bold tabular-nums",
  C: "text-[length:var(--tile-c-value-size)] font-semibold tabular-nums",
};

/** Classes couleur par valueKind (couleur appliquée séparément en composant si override, ex. Trésorerie ok/watch). */
export const VALUE_KIND_COLOR_CLASSES: Record<TileValueKind, string> = {
  positive: "text-[var(--positive)]",
  negative: "text-[var(--negative)]",
  zero: "text-[var(--accent-soft)]",
  accent: "text-[var(--accent)]",
  accent_soft: "text-[var(--accent-soft)]",
  neutral: "text-[var(--text)]",
  placeholder: "text-[var(--text-secondary)]",
};

const BASE_TILE_CLASSES =
  "group flex flex-col items-center justify-center gap-2 transition-all duration-150 hover:border-[var(--accent)]/60 hover:bg-[var(--hover)] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]";

export interface TileClassesResult {
  container: string;
  valueSize: string;
}

/**
 * Helper central : retourne les classes Tailwind pour une tuile (conteneur + taille valeur).
 * La couleur de la valeur est à appliquer côté composant (ex. override Trésorerie ok/watch).
 * SPEC v3 §6.4bis — centralise priorité, état.
 */
export function getTileClasses(priority: TilePriority, status: TileStatus): TileClassesResult {
  const container =
    BASE_TILE_CLASSES +
    " " +
    PRIORITY_CONTAINER_CLASSES[priority] +
    (status === "loading" ? " opacity-90" : "");
  const valueSize =
    PRIORITY_VALUE_CLASSES[priority] +
    " text-center leading-tight " +
    (status === "loading" ? "animate-pulse opacity-60" : "");
  return { container, valueSize };
}
