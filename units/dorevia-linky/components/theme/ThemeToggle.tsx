"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { applyLinkyTheme, type LinkyTheme } from "@/app/lib/theme";

type ThemeToggleProps = {
  /**
   * Rangée pleine largeur alignée maquette `carole_suggest_01.html` (Session : Thème + picto contrast).
   */
  variant?: "icon" | "sidebarRow";
};

/**
 * Bascule clair (canon Stitch) / sombre (cockpit historique).
 * Le script `beforeInteractive` dans `layout.tsx` pose déjà la classe sur `<html>`.
 */
export function ThemeToggle({ variant = "icon" }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<LinkyTheme>("light");

  useEffect(() => {
    setMounted(true);
    setMode(document.documentElement.classList.contains("light") ? "light" : "dark");
  }, []);

  const handleClick = useCallback(() => {
    const next = document.documentElement.classList.contains("light") ? "dark" : "light";
    applyLinkyTheme(next);
    setMode(next);
  }, []);

  const isLight = mode === "light";

  if (!mounted) {
    return variant === "sidebarRow" ? (
      <div className="mb-1 h-[48px] w-full rounded-xl px-4 py-3" aria-hidden />
    ) : (
      <span className="inline-flex h-9 w-9 shrink-0" aria-hidden />
    );
  }

  if (variant === "sidebarRow") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="mb-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-[15px] text-[var(--muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--panel)_50%,transparent)]"
        title={isLight ? "Passer au thème sombre (cockpit historique)" : "Passer au thème clair — aligné créa Stitch"}
        aria-label={isLight ? "Activer le thème sombre" : "Activer le thème clair (créa canon)"}
        aria-pressed={isLight}
      >
        <span className="flex items-center gap-3">
          <Icon name="dark_mode" size={20} className="text-[var(--muted)]" />
          <span>Thème</span>
        </span>
        <Icon name="contrast" size={20} className="text-[var(--muted)]" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
      title={isLight ? "Passer au thème sombre (cockpit historique)" : "Passer au thème clair — aligné créa Stitch"}
      aria-label={isLight ? "Activer le thème sombre" : "Activer le thème clair (créa canon)"}
      aria-pressed={isLight}
    >
      <Icon name={isLight ? "dark_mode" : "light_mode"} size={20} />
    </button>
  );
}
