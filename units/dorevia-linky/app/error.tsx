"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log pour debug (console navigateur)
    console.error("Linky client-side error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm text-[var(--text-secondary)]">
        Un problème est survenu au chargement.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Réessayer
      </button>
    </div>
  );
}
