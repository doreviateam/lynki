/**
 * Constantes du chrome adaptatif Linky (spec v1.1 + v1.1.1).
 * Référence : ZeDocs/web53/PLAN_IMPLEMENTATION_FRONT_LINKY_CHROME_v1.1.md
 */

/** Seuil de position "en haut" (px) pour réapparition du header — scrollRoot.scrollTop <= ce seuil */
export const NEAR_TOP_THRESHOLD_PX = 100;

/** Délai (ms) après une transition du chrome avant d'autoriser une nouvelle transition — anti-oscillation */
export const CHROME_TRANSITION_COOLDOWN_MS = 400;

/** Délai (ms) avant masquage du header (desktop) — configurable via env */
export const CHROME_HIDE_AFTER_MS = Number(
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_LINKY_CHROME_HIDE_AFTER_MS) || "4500"
);

/** Hauteur (px) de la zone en haut/bas qui réaffiche le header au survol (desktop) */
export const CHROME_TRIGGER_ZONE_PX = 72;

/** Delta de scroll cumulé minimum (px) pour déclencher la réapparition — évite micro-scrolls */
export const CHROME_SCROLL_REVEAL_MIN_DELTA_PX = 24;

/** Breakpoint (px) : largeur viewport au-dessus = desktop/tablette, en-dessous = mobile */
export const CHROME_BREAKPOINT_MOBILE_PX = 768;

/** Breakpoint (px) : largeur viewport au-dessus + hover + pointer fine = desktop immersif */
export const CHROME_BREAKPOINT_DESKTOP_PX = 1280;
