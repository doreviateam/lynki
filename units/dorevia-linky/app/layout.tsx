import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./synthese-v2.css";

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
    <html lang="fr" className={inter.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-screen font-sans antialiased" style={{ background: "var(--bg)" }}>{children}</body>
    </html>
  );
}
