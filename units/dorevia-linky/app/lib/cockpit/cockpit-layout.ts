"use client";

import { useState, useLayoutEffect, useEffect } from "react";
import { CHROME_BREAKPOINT_MOBILE_PX } from "@/app/lib/chrome-constants";

/**
 * Seuil (px) : au-delà, layout cockpit « bureau » (grille 3 maîtresses + bandeau fusionné éligible).
 * Aligné sur `lg` dans tailwind.config (1024px).
 *
 * T-TB-003 : à partir de ce seuil, **bandeau desktop** uniquement (pas de burger / drawer nav) ;
 * sidebar visible (`lg:`). Voir `getResponsiveRegime` / `DESKTOP_MIN_PX` dans `responsive-regime.ts`.
 */
export const COCKPIT_LAYOUT_DESKTOP_MIN_PX = 1024;

export type CockpitLayoutMode = "phone" | "tablet" | "desktop";

export function getCockpitLayoutMode(viewportWidth: number): CockpitLayoutMode {
  if (viewportWidth < CHROME_BREAKPOINT_MOBILE_PX) return "phone";
  if (viewportWidth < COCKPIT_LAYOUT_DESKTOP_MIN_PX) return "tablet";
  return "desktop";
}

/**
 * Mode de grille cockpit piloté par la largeur (indépendant du mode interaction chrome §7bis).
 * SSR / premier rendu : `tablet` pour éviter le layout immersif trop tôt.
 */
export function useCockpitLayoutMode(): CockpitLayoutMode {
  const [mode, setMode] = useState<CockpitLayoutMode>("tablet");

  useLayoutEffect(() => {
    setMode(getCockpitLayoutMode(window.innerWidth));
  }, []);

  useEffect(() => {
    const update = () => setMode(getCockpitLayoutMode(window.innerWidth));
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return mode;
}
