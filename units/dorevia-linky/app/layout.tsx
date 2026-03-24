import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "./synthese-v2.css";

/** Anti-flash : défaut = clair (canon Stitch) ; `linky-theme=dark` pour l’ancien cockpit sombre. */
const LINKY_THEME_INIT = `(function(){try{var k="linky-theme";var t=localStorage.getItem(k);var r=document.documentElement;if(t==="dark"){r.classList.remove("light");r.classList.add("dark");}else{r.classList.add("light");r.classList.remove("dark");}}catch(e){document.documentElement.classList.add("light");document.documentElement.classList.remove("dark");}})();`;

/** Poids alignés sur les maquettes canon (`stitch_carole_61` / pilotage_*_canon_v5) */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Dorevia Lynki",
  description: "Cockpit financier certifié",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-screen font-sans antialiased" style={{ background: "var(--bg)" }} suppressHydrationWarning>
        <Script id="linky-theme-init" strategy="beforeInteractive">
          {LINKY_THEME_INIT}
        </Script>
        {children}
      </body>
    </html>
  );
}
