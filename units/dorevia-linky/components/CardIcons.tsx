"use client";

/**
 * Icônes SVG pour les cards KPI Linky (SPEC_LINKY_HOME_GRID_ICONS_KPI_CARDS v1.0).
 * Style : ligne fine (stroke), currentColor, ~24–28px.
 */
const ICON_CLASS = "h-6 w-6 shrink-0";
const STROKE_PROPS = {
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconTreasury({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? ICON_CLASS}
      aria-hidden
    >
      {/* Fronton / temple — symbole institutionnel trésorerie */}
      <path d="M3 9L12 4L21 9" />
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="7" y1="9" x2="7" y2="17" />
      <line x1="12" y1="9" x2="12" y2="17" />
      <line x1="17" y1="9" x2="17" y2="17" />
      <line x1="4" y1="17" x2="20" y2="17" />
      <line x1="3" y1="20" x2="21" y2="20" />
    </svg>
  );
}

export function IconCash({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className ?? ICON_CLASS}
      aria-hidden
      {...STROKE_PROPS}
    >
      {/* Billet / flux encaissements-décaissements */}
      <path d="M2 8h20v8H2z" />
      <path d="M6 12h2M10 12h2M14 12h2" />
    </svg>
  );
}

export function IconBusiness({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className ?? ICON_CLASS}
      aria-hidden
      {...STROKE_PROPS}
    >
      {/* Barres (ventes/achats) */}
      <path d="M4 18v-6M8 18v-4M12 18v-8M16 18v-3M20 18v-5" />
      <path d="M4 12h16" />
    </svg>
  );
}

export function IconTaxes({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className ?? ICON_CLASS}
      aria-hidden
      {...STROKE_PROPS}
    >
      {/* Symbole % (pourcentage / TVA) */}
      <path d="M5 7l14 14" />
      <circle cx="8" cy="7" r="2.5" />
      <circle cx="16" cy="17" r="2.5" />
    </svg>
  );
}

export function IconCreditNotes({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className ?? ICON_CLASS}
      aria-hidden
      {...STROKE_PROPS}
    >
      {/* Document avec minus (avoir) */}
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 14h8" />
    </svg>
  );
}

export function IconRefunds({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className ?? ICON_CLASS}
      aria-hidden
      {...STROKE_PROPS}
    >
      {/* Flèche retour (remboursement) */}
      <path d="M3 12h14M3 12l4-4M3 12l4 4" />
      <path d="M21 12a6 6 0 11-12 0 6 6 0 0112 0z" />
    </svg>
  );
}

export function IconPosShops({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className ?? ICON_CLASS}
      aria-hidden
      {...STROKE_PROPS}
    >
      {/* Façade de magasin */}
      <path d="M3 21h18" />
      <path d="M5 21V9l7-4 7 4v12" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 9h6" />
    </svg>
  );
}

export function IconZReport({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className ?? ICON_CLASS}
      aria-hidden
      {...STROKE_PROPS}
    >
      {/* Reçu / ticket Z */}
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 12h8M8 16h6" />
    </svg>
  );
}

/** Icône Énergie stratégique — DLP (SPEC_DLP_v0.3 §6) */
export function IconStrategicEnergy({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className ?? ICON_CLASS}
      aria-hidden
      {...STROKE_PROPS}
    >
      {/* Boussole / cible — orientation stratégique */}
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <path d="M12 8l2 4 2 2-4 2-2-4-2-2 4-2z" />
    </svg>
  );
}
