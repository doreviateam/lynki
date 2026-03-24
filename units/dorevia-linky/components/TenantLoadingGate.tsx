"use client";

import { useTenantContextOptional } from "@/app/context/TenantContext";
import { DEFAULT_PRODUCT_NAME } from "@/app/lib/tenant-config-defaults";

/**
 * Affiche un écran de chargement tant que la config du tenant n’est pas résolue.
 * Évite de rendre le dashboard (ReportHeader, cartes) avant que le contexte soit prêt,
 * ce qui supprime l’erreur « Un problème est survenu au chargement » au premier clic sur un espace.
 */
export function TenantLoadingGate({ children }: { children: React.ReactNode }) {
  const ctx = useTenantContextOptional();
  if (!ctx) return <>{children}</>;
  if (ctx.error) return <>{children}</>;
  const waiting =
    ctx.requestedTenant &&
    (ctx.isLoading || !ctx.resolvedTenant || !ctx.tenantConfig);
  if (!waiting) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm text-center">
        <h1 className="text-lg font-semibold text-[var(--text)]">
          {DEFAULT_PRODUCT_NAME}
        </h1>
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Chargement de l’espace…
        </p>
        <div className="mt-6 flex justify-center" aria-hidden>
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
        </div>
      </div>
    </div>
  );
}
