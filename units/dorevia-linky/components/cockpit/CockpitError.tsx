"use client";

interface CockpitErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function CockpitError({
  message = "Impossible de charger les données du cockpit.",
  onRetry,
}: CockpitErrorProps) {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-6 bg-linky-bg min-h-screen flex flex-col items-center justify-center text-linky-text">
      <div className="border border-linky-danger rounded-linky-card p-8 text-center max-w-md">
        <p className="text-linky-danger font-medium mb-2">Erreur</p>
        <p className="text-linky-muted text-linky-small mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-linky-surface border border-linky-border rounded-linky-badge text-linky-text hover:bg-linky-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-linky-info focus-visible:ring-offset-2 focus-visible:ring-offset-linky-bg transition-colors duration-linky"
          >
            Réessayer
          </button>
        )}
      </div>
    </main>
  );
}
