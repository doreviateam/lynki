"use client";

/**
 * Indicateur Vaultage (🔒) — SPEC_INDICATEUR_CONFIANCE_VAULTAGE_LINKY v1.0
 * Source : DVIG outbox_events (forwarded / total). En attendant l'API, état neutre.
 */
export function VaultageIndicator() {
  const unavailable = true;
  const color = "text-[var(--text-secondary)]";
  const title = "Indicateur temporairement indisponible";

  return (
    <div className="relative group" title={title}>
      <button
        type="button"
        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-transparent transition-colors ${color}`}
        aria-label="Vaultage"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </button>
    </div>
  );
}
