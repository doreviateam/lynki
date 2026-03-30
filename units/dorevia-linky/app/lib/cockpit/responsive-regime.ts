"use client";

/**
 * T-TB-003 — Doctrine responsive Lynki : constantes et régime (mobile / tablette / desktop).
 * Seuils alignés sur `getCockpitLayoutMode` et sur les breakpoints Tailwind `md` (768) / `lg` (1024).
 */

import { useState, useLayoutEffect, useEffect } from "react";
import { CHROME_BREAKPOINT_MOBILE_PX } from "@/app/lib/chrome-constants";
import { COCKPIT_LAYOUT_DESKTOP_MIN_PX, getCockpitLayoutMode, type CockpitLayoutMode } from "@/app/lib/cockpit/cockpit-layout";

/** Dernière largeur (px) strictement considérée comme mobile — &lt; 768 */
export const MOBILE_MAX_PX = CHROME_BREAKPOINT_MOBILE_PX - 1;

/** Première largeur (px) tablette — ≥ 768 */
export const TABLET_MIN_PX = CHROME_BREAKPOINT_MOBILE_PX;

/** Première largeur (px) desktop (sidebar, footer plein, pas de burger / bottom nav) — ≥ 1024 */
export const DESKTOP_MIN_PX = COCKPIT_LAYOUT_DESKTOP_MIN_PX;

/** Palier confort filtres tablette (Annexe A / T-TB-002) */
export const TABLET_COMFORT_MIN_PX = 900;

export type ResponsiveRegime = "mobile" | "tablet" | "desktop";

/** Régime produit T-TB-003 (`mobile` = ancien `phone` cockpit). */
export function getResponsiveRegime(viewportWidth: number): ResponsiveRegime {
  const mode = getCockpitLayoutMode(viewportWidth);
  if (mode === "phone") return "mobile";
  if (mode === "tablet") return "tablet";
  return "desktop";
}

/** Alias lecture code : mode grille cockpit inchangé côté layout cartes. */
export function cockpitModeToRegime(mode: CockpitLayoutMode): ResponsiveRegime {
  if (mode === "phone") return "mobile";
  if (mode === "tablet") return "tablet";
  return "desktop";
}

/**
 * Régime viewport courant (client). Premier rendu : `tablet` (cohérent SSR avec `useCockpitLayoutMode`).
 */
export function useResponsiveRegime(): ResponsiveRegime {
  const [regime, setRegime] = useState<ResponsiveRegime>("tablet");

  useLayoutEffect(() => {
    setRegime(getResponsiveRegime(window.innerWidth));
  }, []);

  useEffect(() => {
    const update = () => setRegime(getResponsiveRegime(window.innerWidth));
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return regime;
}
