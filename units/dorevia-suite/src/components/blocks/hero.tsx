"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";

const cockpitMetrics = [
  { label: "Trésorerie", value: "284 320\u00A0€", trend: "+3.2%" },
  { label: "Chiffre d'affaires", value: "1 245 800\u00A0€", trend: "+7.1%" },
  { label: "Paiements reçus", value: "98.4%", trend: "stable" },
  { label: "Écarts détectés", value: "2", trend: "↓" },
];

export const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 md:pb-32 md:pt-40">
      {/* Dégradé de fond discret */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#e67e22]/10 via-background to-background"
        aria-hidden
      />

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[#e67e22] text-sm font-semibold uppercase tracking-widest"
          >
            Dorevia Linky
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-balance text-4xl font-extrabold leading-[1.15] tracking-tight text-[#1e3a5f] md:text-5xl lg:text-6xl"
          >
            {"L\u2019assistant de contrôle de gestion des PME"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-muted-foreground mx-auto mt-8 max-w-lg text-balance text-base leading-snug md:text-lg"
          >
            Pilotez la marge, la trésorerie, le BFR et le risque client à partir
            de données fiables.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-muted-foreground mx-auto mt-4 max-w-xl text-balance text-sm leading-snug md:text-base"
          >
            Linky aide les dirigeants et équipes finance à voir plus clairement,
            décider plus vite et piloter plus sereinement.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button variant="cta" size="lg" className="px-8 text-base" asChild>
              <Link href="/contact">
                Demander une démo
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button variant="ctaOutline" size="lg" className="px-8 text-base" asChild>
              <Link href="#linky-en-action">Voir Linky en action</Link>
            </Button>
          </motion.div>
          <div className="mx-auto mt-16 h-px w-16 bg-[#1e3a5f]/20" aria-hidden />
        </div>

        {/* Aperçu cockpit — ancre pour "Voir Linky en action" */}
        <motion.div
          id="linky-en-action"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="scroll-mt-24 mx-auto mt-28 max-w-4xl md:mt-32"
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/[0.06] ring-1 ring-black/[0.04]">
            {/* Chrome : barre d’app (effacé pour laisser dominer le contenu métier) */}
            <div className="border-border/60 flex items-center justify-between border-b bg-[#1e3a5f]/[0.04] px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className="size-2.5 rounded-full bg-[#e67e22]" />
                <span className="size-2.5 rounded-full bg-[#1e3a5f]/30" />
                <span className="size-2.5 rounded-full bg-[#1e3a5f]/30" />
                <span className="text-[#1e3a5f] ml-2 text-xs font-semibold tracking-wide">
                  Dorevia · Linky
                </span>
              </div>
              <span className="text-muted-foreground/80 text-[10px] uppercase tracking-wider">
                Aperçu cockpit
              </span>
            </div>
            <div className="flex">
              {/* Sidebar (effacée : contenu métier en avant) */}
              <div className="hidden w-12 shrink-0 border-r border-border/50 bg-muted/20 md:block" aria-hidden>
                <div className="flex flex-col gap-2.5 p-2.5 pt-5">
                  <div className="bg-[#1e3a5f]/15 size-9 rounded-lg" />
                  <div className="bg-muted/80 size-9 rounded-lg" />
                  <div className="bg-muted/80 size-9 rounded-lg" />
                </div>
              </div>
              {/* Zone données métier — plus présente que le chrome */}
              <div className="min-w-0 flex-1 border-t border-border/40 bg-background">
                <div className="flex items-end justify-between gap-4 border-b border-border/40 px-6 py-5 md:px-10 md:py-6">
                  <div>
                    <p className="text-muted-foreground/90 text-[10px] font-medium uppercase tracking-widest">
                      Vue · Cockpit financier
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-[#1e3a5f] md:text-xl">
                      Linky · Exercice à date
                    </h3>
                  </div>
                  <div className="hidden shrink-0 gap-2 sm:flex">
                    <span className="rounded-md bg-[#e67e22]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#d35400]">
                      Actualisé
                    </span>
                    <span className="rounded-md bg-muted/60 px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
                      5 flux connectés
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-border/40 md:grid-cols-4">
                  {cockpitMetrics.map((item) => (
                    <div
                      key={item.label}
                      className="bg-card p-5 md:p-7"
                    >
                      <p className="text-muted-foreground/80 text-[10px] font-medium uppercase tracking-widest">
                        {item.label}
                      </p>
                      <p className="text-foreground mt-2.5 tabular-nums text-[1.75rem] font-black tracking-tight md:text-[2rem]">
                        <span className="whitespace-nowrap">{item.value}</span>
                      </p>
                      <p className="text-[#d35400] mt-1.5 text-[11px] font-bold uppercase tracking-wide">
                        {item.trend}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
