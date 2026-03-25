"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  CHROME_HIDE_AFTER_MS,
  CHROME_TRIGGER_ZONE_PX,
  CHROME_TRANSITION_COOLDOWN_MS,
} from "@/app/lib/chrome-constants";
import { getScrollTop, shouldRevealChrome, type ScrollRevealState } from "@/app/lib/chrome-scroll";
import { useInteractionMode, type InteractionMode } from "@/app/lib/chrome-device";
import {
  recordChromeReveal,
  recordChromePinnedToggle,
  recordTimeInState,
  recordFrozenEnter,
  type ChromeRevealCause,
} from "@/app/lib/chrome-telemetry";

/** Machine d'états du chrome (spec v1.1 § 7ter) */
export type ChromeState = "expanded" | "compact" | "hidden" | "frozen";

/** États dérivés (plan v1.1 § 1.3) — éviter conditions dispersées */
export function isChromeVisible(state: ChromeState): boolean {
  return state === "expanded" || state === "compact";
}

export function isChromeCollapsed(state: ChromeState): boolean {
  return state === "compact" || state === "hidden";
}

interface ChromeAdaptiveContextValue {
  /** État courant du header */
  chromeState: ChromeState;
  /** Header affiché (expanded ou compact) */
  isChromeVisible: boolean;
  /** Header non expanded (compact ou hidden) */
  isChromeCollapsed: boolean;
  /** Mode d'interaction (desktop / tablet / mobile) — Phase 2 */
  interactionMode: InteractionMode;
  /** Suspendre tous les timers (overlay ouvert, etc.) */
  setFrozen: (frozen: boolean) => void;
  /** Préférence "garder le bandeau visible" (session) */
  chromePinned: boolean;
  setChromePinned: (pinned: boolean) => void;
  /** Révéler le header (scroll top, hover desktop, tap bandeau). Optionnel : cause pour la télémétrie. */
  revealChrome: (cause?: ChromeRevealCause) => void;
}

const ChromeAdaptiveContext = createContext<ChromeAdaptiveContextValue | null>(null);

export function ChromeAdaptiveProvider({ children }: { children: React.ReactNode }) {
  const interactionMode = useInteractionMode();
  // État initial toujours expanded (spec v1.1.1 § 7decies) ; pas de transition avant montage client
  const [chromeState, setChromeState] = useState<ChromeState>("expanded");
  /** Par défaut épinglé : pas de masquage auto (lab / usage produit) ; l’utilisateur peut désactiver via le menu. */
  const [chromePinned, setChromePinnedState] = useState(true);
  const mountedRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownUntilRef = useRef(0);
  const frozenRef = useRef(false);
  const chromePinnedRef = useRef(chromePinned);
  const lastScrollTopRef = useRef(0);
  const deltaCumulatedUpRef = useRef(0);
  const interactionModeRef = useRef(interactionMode);
  const reducedMotionRef = useRef(false);
  const stateEnteredAtRef = useRef(Date.now());
  const prevStateRef = useRef<ChromeState>(chromeState);
  chromePinnedRef.current = chromePinned;
  interactionModeRef.current = interactionMode;

  const setFrozen = useCallback((frozen: boolean) => {
    if (frozen) recordFrozenEnter();
    frozenRef.current = frozen;
    if (frozen && hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    if (frozenRef.current || chromePinnedRef.current || reducedMotionRef.current) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      if (frozenRef.current || chromePinnedRef.current || reducedMotionRef.current) return;
      const mode = interactionModeRef.current;
      setChromeState((prev) => {
        if (prev === "frozen") return prev;
        return mode === "desktop" ? "hidden" : "compact";
      });
      cooldownUntilRef.current = Date.now() + CHROME_TRANSITION_COOLDOWN_MS;
    }, CHROME_HIDE_AFTER_MS);
  }, []);

  const setChromePinned = useCallback((pinned: boolean) => {
    recordChromePinnedToggle(pinned);
    chromePinnedRef.current = pinned;
    setChromePinnedState(pinned);
    if (pinned && hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    } else if (!pinned) {
      scheduleHide();
    }
  }, [scheduleHide]);

  const revealChrome = useCallback((cause?: ChromeRevealCause) => {
    const now = Date.now();
    if (now < cooldownUntilRef.current) return;

    if (cause) recordChromeReveal(cause);
    setChromeState((prev) => {
      if (prev === "frozen") return prev;
      return "expanded";
    });
    cooldownUntilRef.current = now + CHROME_TRANSITION_COOLDOWN_MS;
    deltaCumulatedUpRef.current = 0;

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (frozenRef.current || chromePinnedRef.current || reducedMotionRef.current) return;
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      if (frozenRef.current || chromePinnedRef.current || reducedMotionRef.current) return;
      const mode = interactionModeRef.current;
      setChromeState((prev) => {
        if (prev === "frozen") return prev;
        return mode === "desktop" ? "hidden" : "compact";
      });
      cooldownUntilRef.current = Date.now() + CHROME_TRANSITION_COOLDOWN_MS;
    }, CHROME_HIDE_AFTER_MS);
  }, []);

  // Phase 4.4 : prefers-reduced-motion — pas d'auto-hide si activé
  useEffect(() => {
    const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    if (!mq) return;
    const update = () => {
      reducedMotionRef.current = mq.matches;
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Phase 4.2 : clavier mobile — freeze chrome quand un input/select a le focus
  useEffect(() => {
    if (interactionMode !== "mobile") return;
    const isFormControl = (el: EventTarget | null): el is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "select" || tag === "textarea";
    };
    const onFocusIn = (e: FocusEvent) => {
      if (isFormControl(e.target)) setFrozen(true);
    };
    const onFocusOut = (e: FocusEvent) => {
      setTimeout(() => {
        const next = document.activeElement;
        if (!isFormControl(next)) setFrozen(false);
      }, 0);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [interactionMode, setFrozen]);

  // Phase 5 : time_in_state à chaque transition d'état
  useEffect(() => {
    const now = Date.now();
    if (prevStateRef.current !== chromeState) {
      recordTimeInState(prevStateRef.current, now - stateEnteredAtRef.current);
      prevStateRef.current = chromeState;
      stateEnteredAtRef.current = now;
    }
  }, [chromeState]);

  // Montage client : autoriser les transitions, démarrer le premier cycle (spec § 7decies)
  useEffect(() => {
    mountedRef.current = true;
    scheduleHide();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [scheduleHide]);

  // scrollRoot = window uniquement (plan § Phase 0)
  useEffect(() => {
    lastScrollTopRef.current = getScrollTop();
    const onScroll = () => {
      const scrollTop = getScrollTop();
      const prev = lastScrollTopRef.current;
      const delta = scrollTop - prev;
      lastScrollTopRef.current = scrollTop;

      const direction: ScrollRevealState["direction"] = delta < 0 ? "up" : delta > 0 ? "down" : null;
      if (direction === "up") {
        deltaCumulatedUpRef.current += Math.abs(delta);
      } else {
        deltaCumulatedUpRef.current = 0;
      }

      const state: ScrollRevealState = {
        scrollTop,
        direction,
        deltaCumulated: deltaCumulatedUpRef.current,
      };
      if (shouldRevealChrome(state)) {
        revealChrome("scroll_up");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealChrome]);

  // Hover zone haute/basse — réapparition uniquement sur desktop (Phase 2, spec § 5.3)
  useEffect(() => {
    if (interactionMode !== "desktop") return;
    const onMouseMove = (e: MouseEvent) => {
      const y = e.clientY;
      const h = typeof window !== "undefined" ? window.innerHeight : 0;
      if (y < CHROME_TRIGGER_ZONE_PX || y > h - CHROME_TRIGGER_ZONE_PX) revealChrome("hover");
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [interactionMode, revealChrome]);

  const value = useMemo<ChromeAdaptiveContextValue>(
    () => ({
      chromeState,
      isChromeVisible: isChromeVisible(chromeState),
      isChromeCollapsed: isChromeCollapsed(chromeState),
      interactionMode,
      setFrozen,
      chromePinned,
      setChromePinned,
      revealChrome,
    }),
    [chromeState, interactionMode, chromePinned, setFrozen, setChromePinned, revealChrome]
  );

  return (
    <ChromeAdaptiveContext.Provider value={value}>
      {children}
    </ChromeAdaptiveContext.Provider>
  );
}

export function useChromeAdaptive() {
  const ctx = useContext(ChromeAdaptiveContext);
  return ctx;
}

/**
 * Phase 3 : verrouiller le chrome quand un overlay est ouvert (menu, select, modal, drawer).
 * Quand open === true → setFrozen(true) ; quand open === false ou démontage → setFrozen(false).
 */
export function useChromeLock(open: boolean) {
  const ctx = useContext(ChromeAdaptiveContext);
  useEffect(() => {
    ctx?.setFrozen(open);
    return () => {
      ctx?.setFrozen(false);
    };
  }, [open, ctx]);
}
