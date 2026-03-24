/**
 * Télémétrie UX du chrome adaptatif (Phase 5, spec § 7duodecies).
 * Cause de révélation et événements pour ajuster timers et comportements.
 */

/** Aligné avec ChromeState du contexte (évite import circulaire) */
export type ChromeStateForTelemetry = "expanded" | "compact" | "hidden" | "frozen";

/** Cause de révélation du header (quand il réapparaît) */
export type ChromeRevealCause =
  | "hover"
  | "scroll_up"
  | "focus"
  | "tap_trigger"
  | "manual_pin";

export interface ChromeRevealEvent {
  type: "chrome_reveal";
  cause: ChromeRevealCause;
  ts: number;
}

export interface ChromePinnedToggleEvent {
  type: "chrome_pinned_toggle";
  pinned: boolean;
  ts: number;
}

export interface ChromeTimeInStateEvent {
  type: "chrome_time_in_state";
  state: ChromeStateForTelemetry;
  durationMs: number;
  ts: number;
}

export interface ChromeTrustDrawerOpenEvent {
  type: "chrome_trust_drawer_open";
  ts: number;
}

export interface ChromeFrozenEnterEvent {
  type: "chrome_frozen_enter";
  ts: number;
}

export type ChromeTelemetryEvent =
  | ChromeRevealEvent
  | ChromePinnedToggleEvent
  | ChromeTimeInStateEvent
  | ChromeTrustDrawerOpenEvent
  | ChromeFrozenEnterEvent;

const buffer: ChromeTelemetryEvent[] = [];
const maxBufferSize = 200;

type TelemetryCallback = (event: ChromeTelemetryEvent) => void;
let callback: TelemetryCallback | null = null;

function push(event: ChromeTelemetryEvent) {
  buffer.push(event);
  if (buffer.length > maxBufferSize) buffer.shift();
  callback?.(event);
}

/** Enregistre une révélation du header avec sa cause */
export function recordChromeReveal(cause: ChromeRevealCause): void {
  push({ type: "chrome_reveal", cause, ts: Date.now() });
}

/** Enregistre un basculement "Garder le bandeau visible" */
export function recordChromePinnedToggle(pinned: boolean): void {
  push({ type: "chrome_pinned_toggle", pinned, ts: Date.now() });
}

/** Enregistre le temps passé dans un état avant transition */
export function recordTimeInState(
  state: ChromeStateForTelemetry,
  durationMs: number
): void {
  push({ type: "chrome_time_in_state", state, durationMs, ts: Date.now() });
}

/** Enregistre l'ouverture du drawer confiance système (footer mobile) */
export function recordTrustDrawerOpen(): void {
  push({ type: "chrome_trust_drawer_open", ts: Date.now() });
}

/** Enregistre l'entrée en état frozen (overlay ouvert) */
export function recordFrozenEnter(): void {
  push({ type: "chrome_frozen_enter", ts: Date.now() });
}

/** Récupère les événements en buffer (pour envoi batch ou debug) */
export function getChromeTelemetryEvents(): ChromeTelemetryEvent[] {
  return [...buffer];
}

/** Vide le buffer */
export function clearChromeTelemetryEvents(): void {
  buffer.length = 0;
}

/** Définit un callback appelé à chaque événement (ex. envoi vers API) */
export function setChromeTelemetryCallback(fn: TelemetryCallback | null): void {
  callback = fn;
}
