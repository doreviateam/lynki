"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTenantContextOptional } from "@/app/context/TenantContext";

/**
 * Sélecteur de tenant : dropdown qui se replie automatiquement à la sélection.
 * Inline (header) : bouton + liste déroulante, fermeture automatique au choix.
 * Menu (burger) : liste directe dans le menu.
 */
export function TenantSelector({
  variant = "inline",
  onCloseMenu,
}: {
  variant?: "inline" | "menu";
  onCloseMenu?: () => void;
}) {
  const ctx = useTenantContextOptional();
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; minWidth: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const availableTenants = ctx?.availableTenants ?? [];
  const resolvedTenant = ctx?.resolvedTenant ?? null;
  const setTenant = ctx?.setTenant;
  const isLoading = ctx?.isLoading ?? false;

  const currentLabel =
    resolvedTenant &&
    (availableTenants.find((t) => t.id === resolvedTenant)?.label ?? resolvedTenant);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const updateMenuRect = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const minW = Math.max(168, r.width);
    setMenuRect({
      top: r.bottom + 4,
      left: Math.max(8, r.right - minW),
      minWidth: minW,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuRect(null);
      return;
    }
    updateMenuRect();
    const onReposition = () => updateMenuRect();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, updateMenuRect]);

  useEffect(() => {
    if (!open || !menuRect) return;
    const first = listRef.current?.querySelector<HTMLElement>("[role='option']");
    first?.focus();
  }, [open, menuRect]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (availableTenants.length <= 1 || !setTenant) return null;

  const handleSelect = (id: string) => {
    if (id !== resolvedTenant) setTenant(id);
    setOpen(false);
    onCloseMenu?.();
  };

  if (variant === "menu") {
    return (
      <>
        <div className="mt-2 border-t border-[var(--border)] px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
          Tenant
        </div>
        {availableTenants.map((t) => (
          <button
            key={t.id}
            type="button"
            role="menuitem"
            onClick={() => handleSelect(t.id)}
            disabled={isLoading}
            className={`block w-full px-3 py-2 text-left text-sm ${
              t.id === resolvedTenant
                ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"
            }`}
          >
            {t.label ?? t.id}
          </button>
        ))}
      </>
    );
  }

  const dropdown =
    portalReady &&
    open &&
    menuRect &&
    createPortal(
      <>
        <div
          className="fixed inset-0 z-[200]"
          aria-hidden
          data-chrome-lock="true"
          onClick={() => setOpen(false)}
        />
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Choisir le tenant"
          style={{
            position: "fixed",
            top: menuRect.top,
            left: menuRect.left,
            minWidth: menuRect.minWidth,
          }}
          className="z-[201] max-h-[min(320px,70vh)] overflow-y-auto overflow-x-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
        >
          {availableTenants.map((t) => (
            <li key={t.id} role="option" aria-selected={t.id === resolvedTenant}>
              <button
                type="button"
                onClick={() => handleSelect(t.id)}
                disabled={isLoading}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  t.id === resolvedTenant
                    ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                    : "text-[var(--text)] hover:bg-[var(--accent-soft)]/50"
                } focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)] disabled:opacity-70`}
              >
                {t.id === resolvedTenant && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
                {t.id !== resolvedTenant && <span className="w-3.5 shrink-0" />}
                {t.label ?? t.id}
              </button>
            </li>
          ))}
        </ul>
      </>,
      document.body
    );

  return (
    <div className="relative min-w-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isLoading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Tenant : ${currentLabel ?? resolvedTenant ?? "Choisir"}`}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--accent-soft)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-70 transition-colors"
      >
        <span className="max-w-[120px] truncate font-medium">
          {currentLabel ?? resolvedTenant ?? "Tenant…"}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdown}
    </div>
  );
}
