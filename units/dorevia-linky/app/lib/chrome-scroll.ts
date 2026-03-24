/**
 * Helpers scroll pour le chrome adaptatif Linky.
 * scrollRoot = window (décision verrouillée, spec v1.1).
 * Les scrolls internes de cards/panels ne doivent jamais piloter le chrome.
 */

import { NEAR_TOP_THRESHOLD_PX, CHROME_SCROLL_REVEAL_MIN_DELTA_PX } from "./chrome-constants";

/** Position de scroll du scrollRoot officiel (window) */
export function getScrollTop(): number {
  if (typeof window === "undefined") return 0;
  return window.scrollY ?? document.documentElement.scrollTop ?? 0;
}

/** true si la position actuelle est "en haut" (≤ nearTopThresholdPx) */
export function isNearTop(scrollTop?: number): boolean {
  const top = scrollTop ?? getScrollTop();
  return top <= NEAR_TOP_THRESHOLD_PX;
}

export type ScrollDirection = "up" | "down" | null;

export interface ScrollRevealState {
  scrollTop: number;
  direction: ScrollDirection;
  deltaCumulated: number;
}

/**
 * Vérifie si les conditions de réapparition du header sont réunies (spec § 5.2, 7nonies) :
 * - direction = haut
 * - delta cumulé > 24 px
 * - position top ≤ nearTopThresholdPx
 */
export function shouldRevealChrome(state: ScrollRevealState): boolean {
  return (
    state.direction === "up" &&
    state.deltaCumulated > CHROME_SCROLL_REVEAL_MIN_DELTA_PX &&
    state.scrollTop <= NEAR_TOP_THRESHOLD_PX
  );
}
