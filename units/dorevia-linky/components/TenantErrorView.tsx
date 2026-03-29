"use client";

import Link from "next/link";
import { useTenantContextOptional } from "@/app/context/TenantContext";
import type { TenantConfigError } from "@/app/lib/tenant-types";
import { DEFAULT_PRODUCT_NAME } from "@/app/lib/tenant-config-defaults";

function getMessage(error: TenantConfigError): string {
  switch (error.type) {
    case "forbidden":
      return "Accès refusé à cet espace de pilotage.";
    case "not_found":
      return "Tenant introuvable.";
    case "network":
      return "Impossible de joindre le service. Vérifiez votre connexion et réessayez.";
    case "server":
      return "Le service est temporairement indisponible. Veuillez réessayer plus tard.";
    default:
      return "Une erreur est survenue. Veuillez réessayer ou choisir un autre espace.";
  }
}

/**
 * Affiche un message utilisateur en cas d’erreur de résolution tenant (Phase 6).
 * Pas de détail technique (stack, message API). Propose accueil et/ou autre tenant.
 */
export function TenantErrorView({ children }: { children: React.ReactNode }) {
  const ctx = useTenantContextOptional();
  if (!ctx?.error) return <>{children}</>;

  const message = getMessage(ctx.error);
  const hasOtherTenants = Array.isArray(ctx.availableTenants) && ctx.availableTenants.length > 0;
  const previousTenant =
    ctx.resolvedTenant &&
    ctx.availableTenants?.find((t) => t.id === ctx.resolvedTenant);
  const otherTenants = hasOtherTenants
    ? ctx.availableTenants!.filter((t) => t.id !== ctx.requestedTenant).slice(0, 3)
    : [];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--text)]">
          {DEFAULT_PRODUCT_NAME}
        </h1>
        <p className="mt-4 text-sm text-[var(--text-secondary)]" role="alert">
          {message}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            Retour à l’accueil
          </Link>
          {previousTenant && ctx.resolvedTenant && ctx.setTenant && ctx.requestedTenant !== ctx.resolvedTenant && (
            <button
              type="button"
              onClick={() => ctx.setTenant(ctx.resolvedTenant!)}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              Revenir à {previousTenant.label ?? previousTenant.id}
            </button>
          )}
          {otherTenants.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => ctx.setTenant(t.id)}
              className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
            >
              {t.label ?? t.id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
