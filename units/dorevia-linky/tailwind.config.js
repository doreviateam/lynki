/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "900px",
      lg: "1280px",
    },
    extend: {
      fontFamily: {
        /* Corps / UI : Inter (Stitch). Titres : Manrope (réf. ZeDocs/web61/references/observatory-mock.html). */
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        headline: ["var(--font-manrope)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        "linky-bg": "var(--bg)",
        "linky-bg-secondary": "var(--bg-secondary)",
        "linky-surface": "var(--surface)",
        "linky-border": "var(--border)",
        "linky-text": "var(--text)",
        "linky-muted": "var(--muted)",
        "linky-hover": "var(--hover)",
        "linky-success": "var(--positive)",
        "linky-warning": "var(--warning)",
        "linky-danger": "var(--negative)",
        "linky-info": "var(--accent)",
        "linky-confidence-fiable": "var(--confidence-fiable)",
        "linky-confidence-partielle": "var(--confidence-partielle)",
        "linky-confidence-proxy": "var(--confidence-proxy)",
        "linky-confidence-estimee": "var(--confidence-estimee)",
        "linky-primary-container": "var(--primary-container)",
      },
      fontSize: {
        "linky-kpi": ["44px", { lineHeight: "1.2" }],
        "linky-title": ["16px", { lineHeight: "1.4" }],
        "linky-small": ["13px", { lineHeight: "1.4" }],
        "linky-label": ["12px", { lineHeight: "1.4" }],
      },
      spacing: {
        "linky-gap": "16px",
        "linky-gap-lg": "24px",
        "linky-padding": "16px",
        "linky-padding-lg": "24px",
      },
      /* pilotage_desktop_v_r_na_canon_v5 : DEFAULT 0.125rem, lg 0.25rem, xl 0.5rem — on n’écrase pas `full` (pills / spinners) */
      borderRadius: {
        xl: "0.75rem",
        "linky-card": "var(--radius-card)",
        "linky-badge": "6px",
      },
      transitionDuration: {
        linky: "150ms",
      },
    },
  },
  plugins: [],
};
