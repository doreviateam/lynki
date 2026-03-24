"use client";

/**
 * Charte commune des cards Linky — composants partagés.
 *
 * Référence : ZeDocs/web46/charte_commune_des_cards_Linky.md (v2.0)
 * Plan d’implémentation : ZeDocs/web46/PLAN_IMPLEMENTATION_CHARTE_CARDS_LINKY_v1.0.md
 *
 * Règles UI non négociables (figées produit) :
 * - Header commun : gauche = icône + titre + badge(s) ; droite = libellé KPI + valeur
 * - Footer contextuel commun : contexte de lecture uniquement, pas d’action
 * - Contour commun : INSTRUMENT_CARD_BASE (radius, bordure, ombre identiques)
 * - Badges communs : InstrumentCardStatusBadge (sévérité, hauteur et spacing fixes)
 * - Métadonnées footer : ordre recommandé Source · Période · Fraîcheur (séparateur " · ")
 *
 * Composants :
 * - INSTRUMENT_CARD_BASE : silhouette commune
 * - InstrumentCardHeader : bloc gauche (icône, titre, badges) + bloc droit (KPI)
 * - InstrumentCardNav : lien Précédent / Suivant pour naviguer de card en card
 * - InstrumentCardStatusBadge : badge de statut (sévérité info | success | vigilance | alert)
 * - InstrumentCardFooter : ligne de contexte (meta) ; hauteur minimale et typo fixes
 */

import type { ReactNode } from "react";
import type { CardId } from "@/app/types/linky-tiles";

/** Ordre de navigation entre cards (aligné sur l’ordre d’affichage dans le cockpit). */
export const CARD_NAV_ORDER: { id: CardId; label: string }[] = [
  { id: "treasury", label: "Trésorerie" },
  { id: "treasury_position", label: "Paiements" },
  { id: "cash", label: "Flux net" },
  { id: "business", label: "Business" },
  { id: "working_capital", label: "BFR" },
  { id: "encours", label: "Encours" },
  { id: "ebitda", label: "EBE" },
  { id: "pos_shops", label: "Points de vente" },
  { id: "taxes", label: "Taxes" },
  { id: "credit_notes", label: "Notes de crédit" },
  { id: "refunds", label: "Remboursements" },
  { id: "pos_z", label: "Z de caisse" },
];

export interface InstrumentCardNavProps {
  currentCardId: CardId;
  onNavigate: (cardId: CardId) => void;
  /** Ordre et libellés (défaut : CARD_NAV_ORDER) */
  cardOrder?: { id: CardId; label: string }[];
  /** Si fourni, affiche le lien "Cockpit" au centre entre Précédent et Suivant (retour au cockpit). */
  onBackToCockpit?: () => void;
}

/** Barre de navigation card → card : Précédent | Cockpit (centré) | Suivant en haut de la card. */
export function InstrumentCardNav({
  currentCardId,
  onNavigate,
  cardOrder = CARD_NAV_ORDER,
  onBackToCockpit,
}: InstrumentCardNavProps) {
  const idx = cardOrder.findIndex((c) => c.id === currentCardId);
  const prev = idx > 0 ? cardOrder[idx - 1] : null;
  const next = idx >= 0 && idx < cardOrder.length - 1 ? cardOrder[idx + 1] : null;

  if (!prev && !next && !onBackToCockpit) return null;

  const linkClass =
    "text-xs font-medium text-[var(--accent)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 rounded";

  return (
    <nav
      className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[var(--border)]"
      aria-label="Navigation entre cards"
    >
      <span className="min-w-0 flex-shrink-0">
        {prev ? (
          <button
            type="button"
            onClick={() => onNavigate(prev.id)}
            className={`${linkClass} flex items-center gap-1`}
          >
            <span aria-hidden>←</span>
            <span>{prev.label}</span>
          </button>
        ) : (
          <span className="text-xs text-[var(--text-muted)]" aria-hidden>—</span>
        )}
      </span>
      <span className="flex-1 flex justify-center min-w-0">
        {onBackToCockpit ? (
          <button
            type="button"
            onClick={onBackToCockpit}
            className={`${linkClass} flex items-center gap-1`}
          >
            Cockpit
          </button>
        ) : (
          <span className="text-xs text-[var(--text-muted)]" aria-hidden>—</span>
        )}
      </span>
      <span className="min-w-0 flex-shrink-0 text-right">
        {next ? (
          <button
            type="button"
            onClick={() => onNavigate(next.id)}
            className={`${linkClass} flex items-center gap-1 ml-auto`}
          >
            <span>{next.label}</span>
            <span aria-hidden>→</span>
          </button>
        ) : (
          <span className="text-xs text-[var(--text-muted)]" aria-hidden>—</span>
        )}
      </span>
    </nav>
  );
}

/** Base commune pour toutes les cards instrument (même radius, bordure, ombre). */
export const INSTRUMENT_CARD_BASE =
  "rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]";

/** Séparateur header/body et body/footer — même opacité et marges. */
const SEP = "border-[var(--border)]";

export interface InstrumentCardHeaderProps {
  /** Icône (ou bouton icône si onFocusRequest) */
  icon: ReactNode;
  /** Titre court en capitales (ex. TRÉSORERIE, BUSINESS, FLUX NET) */
  title: string;
  /** Badge(s) de statut à côté du titre (système unique, discret) */
  badges?: ReactNode;
  /** Libellé optionnel au-dessus du KPI (ex. "Trésorerie validée Vault") */
  kpiLabel?: string;
  /** Valeur KPI principale (zone droite du header) */
  kpiValue?: ReactNode;
  /** Action secondaire discrète (ex. Rafraîchir) — ne doit pas dominer le header */
  headerAction?: ReactNode;
  /** Classe optionnelle sur la zone gauche (ex. bordure vigilance) */
  leftClassName?: string;
}

export function InstrumentCardHeader({
  icon,
  title,
  badges,
  kpiLabel,
  kpiValue,
  headerAction,
  leftClassName = "",
}: InstrumentCardHeaderProps) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 ${SEP} border-b pb-3 mb-4`}>
      <div className={`flex items-center gap-3 min-w-0 ${leftClassName}`}>
        {icon}
        <span className="text-lg font-bold uppercase tracking-wide text-[var(--text)]">{title}</span>
        {badges}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {(kpiLabel != null || kpiValue != null) && (
          <div className="text-right">
            {kpiLabel != null && (
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-0.5">
                {kpiLabel}
              </p>
            )}
            {kpiValue != null && <div className="text-sm font-bold tabular-nums whitespace-nowrap">{kpiValue}</div>}
          </div>
        )}
        {headerAction}
      </div>
    </div>
  );
}

/** Badge de statut unique : compact, fond faiblement teinté, ne concurrence pas le KPI. */
export interface InstrumentCardStatusBadgeProps {
  label: string;
  /** info | success | vigilance | alert — pour couleur cohérente */
  severity?: "info" | "success" | "vigilance" | "alert";
  title?: string;
}

/** Hauteur et spacing badge figés (règle UI non négociable). */
const BADGE_SIZE = "min-h-[1.25rem] inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium leading-tight";

const BADGE_CLASS: Record<NonNullable<InstrumentCardStatusBadgeProps["severity"]>, string> = {
  info: "bg-[var(--muted)]/20 text-[var(--text-secondary)]",
  success: "bg-[var(--confidence-fiable)]/15 text-[var(--confidence-fiable)]",
  vigilance: "bg-[var(--confidence-partielle)]/15 text-[var(--confidence-partielle)]",
  alert: "bg-[var(--negative)]/15 text-[var(--negative)]",
};

const BADGE_ICON: Record<NonNullable<InstrumentCardStatusBadgeProps["severity"]>, string> = {
  info: "info",
  success: "verified",
  vigilance: "warning",
  alert: "error",
};

export function InstrumentCardStatusBadge({
  label,
  severity = "info",
  title,
}: InstrumentCardStatusBadgeProps) {
  return (
    <span
      className={`${BADGE_SIZE} ${BADGE_CLASS[severity]}`}
      title={title}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 14, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 14" }}
      >
        {BADGE_ICON[severity]}
      </span>
      {label}
    </span>
  );
}

export type ConfidenceLevel = "fiable" | "partielle" | "proxy" | "estimee";

const CONFIDENCE_SEVERITY: Record<ConfidenceLevel, NonNullable<InstrumentCardStatusBadgeProps["severity"]>> = {
  fiable: "success",
  partielle: "vigilance",
  proxy: "info",
  estimee: "info",
};

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  fiable: "Fiable",
  partielle: "Partielle",
  proxy: "Proxy",
  estimee: "Estimée",
};

export function ConfidenceBadge({ level, title }: { level: ConfidenceLevel; title?: string }) {
  return (
    <InstrumentCardStatusBadge
      label={CONFIDENCE_LABEL[level]}
      severity={CONFIDENCE_SEVERITY[level]}
      title={title}
    />
  );
}

/** Variante compacte pour la grille bento (1×1 : icône, label, valeur, badge). */
export interface CompactTileProps {
  icon: string;
  label: string;
  value: string;
  confidence?: ConfidenceLevel;
  trend?: string;
  trendPositive?: boolean;
  onClick?: () => void;
}

export function CompactTile({ icon, label, value, confidence, trend, trendPositive, onClick }: CompactTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-4 text-left shadow-sm transition-all hover:border-emerald-600/40 hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-[var(--muted)]"
          style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 16" }}
        >
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{label}</span>
      </div>
      <span className="text-lg font-bold tabular-nums text-[var(--text)]">{value}</span>
      <div className="flex items-center gap-2">
        {confidence && <ConfidenceBadge level={confidence} />}
        {trend && (
          <span className={`text-[9px] font-semibold ${trendPositive ? "text-[var(--confidence-fiable)]" : "text-[var(--negative)]"}`}>
            {trend}
          </span>
        )}
      </div>
    </button>
  );
}

export interface InstrumentCardFooterProps {
  /** Contexte de lecture (date, source, type, fiabilité) */
  meta: ReactNode;
  /** Action secondaire à droite (ex. "Afficher détail", "Voir exposition") */
  actionLabel?: string;
  onAction?: () => void;
}

/** Hauteur minimale et typo footer figées (règle UI non négociable). */
const FOOTER_MIN_HEIGHT = "min-h-[2.25rem]";
const FOOTER_PADDING = "pt-3 mt-4";
const FOOTER_TYPO = "text-xs leading-5 text-[var(--text-secondary)]";

export function InstrumentCardFooter({ meta, actionLabel, onAction }: InstrumentCardFooterProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 ${SEP} border-t ${FOOTER_PADDING} ${FOOTER_MIN_HEIGHT} ${FOOTER_TYPO}`}
    >
      <span className="min-w-0">{meta}</span>
      {actionLabel != null && (
        onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 font-medium text-[var(--accent)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
          >
            {actionLabel}
          </button>
        ) : (
          <span className="shrink-0 font-medium text-[var(--text-secondary)]">{actionLabel}</span>
        )
      )}
    </div>
  );
}
