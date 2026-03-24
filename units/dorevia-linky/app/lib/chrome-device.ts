"use client";

import { useState, useEffect } from "react";
import {
  CHROME_BREAKPOINT_MOBILE_PX,
  CHROME_BREAKPOINT_DESKTOP_PX,
} from "@/app/lib/chrome-constants";

/**
 * Mode d'interaction (spec v1.1 § 7bis, plan Phase 2).
 * - desktop : largeur ≥ 1280 + hover + pointer fine → immersif (expanded → hidden)
 * - tablet  : largeur ≥ 768 ou 1280 sans hover/pointer fine → expanded → compact
 * - mobile  : largeur < 768 → expanded → compact, jamais hidden
 */
export type InteractionMode = "desktop" | "tablet" | "mobile";

/**
 * Détermine le mode d'interaction à partir du viewport et des media queries.
 * Fallback (SSR / avant résolution client) : 'tablet' pour ne jamais déclencher
 * le mode desktop immersif trop tôt (plan § 1.4).
 */
export function useInteractionMode(): InteractionMode {
  const [mode, setMode] = useState<InteractionMode>("tablet");

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      const w = window.innerWidth;
      const hasHover = window.matchMedia("(hover: hover)").matches;
      const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

      if (w < CHROME_BREAKPOINT_MOBILE_PX) {
        setMode("mobile");
        return;
      }
      if (
        w >= CHROME_BREAKPOINT_DESKTOP_PX &&
        hasHover &&
        hasFinePointer
      ) {
        setMode("desktop");
        return;
      }
      setMode("tablet");
    };

    update();
    const mqHover = window.matchMedia("(hover: hover)");
    const mqPointer = window.matchMedia("(pointer: fine)");
    const onResize = () => update();
    mqHover.addEventListener("change", update);
    mqPointer.addEventListener("change", update);
    window.addEventListener("resize", onResize);
    return () => {
      mqHover.removeEventListener("change", update);
      mqPointer.removeEventListener("change", update);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return mode;
}
