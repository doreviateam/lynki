"use client";

/**
 * Bandeau de réapparition du header (plan Phase 2, spec § 7).
 * Affiché lorsque le header est masqué (état hidden, desktop).
 * Focusable au clavier, aria-label, onMouseEnter → revealChrome (desktop).
 * Sur tactile, le tap déclenche aussi revealChrome.
 */

interface ChromeTriggerBarProps {
  onReveal: () => void;
  /** true = mode desktop, onMouseEnter déclenche la réapparition */
  enableHover?: boolean;
}

export function ChromeTriggerBar({ onReveal, enableHover = true }: ChromeTriggerBarProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="fixed left-0 right-0 top-0 z-50 h-6 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-inset md:left-64"
      style={{ background: "transparent" }}
      aria-label="Afficher le bandeau"
      onMouseEnter={enableHover ? onReveal : undefined}
      onClick={onReveal}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onReveal();
        }
      }}
    />
  );
}
