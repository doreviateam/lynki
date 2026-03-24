/** Préférence thème Lynki — alignement clair sur `ZeDocs/web59/stitch_carole_61` (canon V5). */

export const LINKY_THEME_STORAGE_KEY = "linky-theme";

export type LinkyTheme = "light" | "dark";

export function applyLinkyTheme(theme: LinkyTheme): void {
  if (typeof document === "undefined") return;
  const r = document.documentElement;
  if (theme === "light") {
    r.classList.add("light");
    r.classList.remove("dark");
  } else {
    r.classList.remove("light");
    r.classList.add("dark");
  }
  try {
    localStorage.setItem(LINKY_THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}
