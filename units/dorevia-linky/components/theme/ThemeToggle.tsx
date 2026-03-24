"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { applyLinkyTheme, type LinkyTheme } from "@/app/lib/theme";

/**
 * Bascule clair (canon Stitch) / sombre (cockpit historique).
 * Le script `beforeInteractive` dans `layout.tsx` pose déjà la classe sur `<html>`.
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<LinkyTheme>("dark");

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
    return <span className="inline-flex h-9 w-9 shrink-0" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
      title={isLight ? "Passer au thème sombre" : "Passer au thème clair (canon Stitch)"}
      aria-label={isLight ? "Activer le thème sombre" : "Activer le thème clair"}
      aria-pressed={isLight}
    >
      <Icon name={isLight ? "dark_mode" : "light_mode"} size={20} />
    </button>
  );
}
