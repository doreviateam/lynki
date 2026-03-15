import { Inter } from "next/font/google";
import localFont from "next/font/local";

import type { Metadata } from "next";

import { Footer } from "@/components/blocks/footer";
import { Navbar } from "@/components/blocks/navbar";
import { StyleGlideProvider } from "@/components/styleglide-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";

const dmSans = localFont({
  src: [
    {
      path: "../../fonts/dm-sans/DMSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../fonts/dm-sans/DMSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../fonts/dm-sans/DMSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../fonts/dm-sans/DMSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Dorevia Linky — L\u2019assistant de contrôle de gestion des PME",
    template: "%s | Dorevia",
  },
  description:
    "Pilotez la marge, la trésorerie, le BFR et le risque client avec Dorevia Linky, l\u2019assistant de contrôle de gestion des PME, fondé sur des données fiables.",
  keywords: [
    "pilotage",
    "contrôle de gestion",
    "Linky",
    "marge",
    "trésorerie",
    "BFR",
    "risque client",
    "PME",
    "DAF",
  ],
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon/favicon.svg",
  },
  openGraph: {
    title: "Dorevia Linky — L\u2019assistant de contrôle de gestion des PME",
    description:
      "Pilotez la marge, la trésorerie, le BFR et le risque client avec Dorevia Linky, l\u2019assistant de contrôle de gestion des PME.",
    siteName: "Dorevia",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head />
      <body className={`${dmSans.variable} ${inter.variable} antialiased`}>
        <div id="navbar-portal" />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <StyleGlideProvider />
          <Navbar />
          <main className="pt-16 md:pt-[4.5rem]">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
