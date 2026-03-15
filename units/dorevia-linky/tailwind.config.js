/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        tablet: "900px",
        mobile: "600px",
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex)", "var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-ibm-plex)", "ui-monospace", "monospace"],
      },
      colors: {
        // Palette Linky Cockpit (Design System v1.1)
        "linky-bg": "#0F1B2D",
        "linky-bg-secondary": "#14243A",
        "linky-surface": "#1A2E47",
        "linky-border": "#223B5B",
        "linky-text": "#E6EEF8",
        "linky-muted": "#9FB3C8",
        "linky-hover": "#1F3653",
        "linky-success": "#22C55E",
        "linky-warning": "#F59E0B",
        "linky-danger": "#EF4444",
        "linky-info": "#3B82F6",
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
      borderRadius: {
        "linky-card": "12px",
        "linky-badge": "6px",
      },
      transitionDuration: {
        "linky": "150ms",
      },
    },
  },
  plugins: [],
};
