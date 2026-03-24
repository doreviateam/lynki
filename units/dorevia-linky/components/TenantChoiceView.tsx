"use client";

import { useState, useEffect } from "react";
import { DEFAULT_PRODUCT_NAME } from "@/app/lib/tenant-config-defaults";

interface TenantOption {
  id: string;
  label: string;
}

/**
 * Écran d’accueil sur linky.doreviateam.com quand aucun ?tenant= dans l’URL.
 * Affiche la liste des espaces disponibles (availableTenants) et redirige au clic.
 */
export function TenantChoiceView({ onSelect }: { onSelect: (tenantId: string) => void }) {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant-config?tenant=core", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { availableTenants?: TenantOption[] }) => {
        setTenants(Array.isArray(data?.availableTenants) ? data.availableTenants : []);
      })
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--text)]">
          {DEFAULT_PRODUCT_NAME}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Choisissez un espace de pilotage pour continuer.
        </p>
        {loading ? (
          <p className="mt-6 text-sm text-[var(--text-secondary)]">Chargement…</p>
        ) : tenants.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--text-secondary)]">Aucun espace disponible.</p>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {tenants.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onSelect(t.id)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-sm font-medium text-[var(--text)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  {t.label || t.id}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
