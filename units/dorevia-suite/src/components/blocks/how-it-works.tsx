"use client";

import { BarChart3, Database, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";

const steps = [
  {
    icon: Database,
    number: "01",
    role: "Source",
    title: "Connecter",
    description:
      "ERP, paiements, banque, POS, documents, comptabilité.",
    borderClass: "border-l-[#1e3a5f]/15",
  },
  {
    icon: ShieldCheck,
    number: "02",
    role: "Fiabilité",
    title: "Fiabiliser",
    description:
      "Les données utiles au pilotage sont consolidées, fiabilisées et préparées.",
    borderClass: "border-l-[#1e3a5f]/30",
  },
  {
    icon: BarChart3,
    number: "03",
    role: "Cockpit",
    title: "Piloter",
    description:
      "Linky restitue une lecture exploitable de la marge, du cash, du BFR et du risque client.",
    borderClass: "border-l-[#1e3a5f]/50",
  },
];

export const HowItWorks = () => {
  return (
    <section
      id="comment-ca-marche"
      className="scroll-mt-24 py-24 md:py-32"
    >
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-[#1e3a5f] md:text-4xl">
            Une lecture plus claire commence par une base plus fiable.
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            Les données sont connectées, fiabilisées, puis restituées dans
            Linky pour une lecture exploitable.
          </p>
        </motion.div>

        <div className="relative mx-auto mt-20 max-w-4xl rounded-2xl border border-border/60 bg-muted/[0.03] p-6 md:p-8">
          <div
            className="absolute left-1/2 top-1/2 hidden h-1 w-[calc(100%-10rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-[#1e3a5f]/40 to-transparent md:block"
            aria-hidden
          />
          <div className="relative grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="relative"
                >
                  <div
                    className={`flex h-full flex-col rounded-xl border border-border border-l-4 bg-card p-6 shadow-sm transition-shadow hover:shadow-md ${step.borderClass}`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#e67e22]">
                        {step.number}
                      </span>
                      <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                        {step.role}
                      </span>
                    </div>
                    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-[#1e3a5f]/10">
                      <Icon className="size-5 text-[#1e3a5f]" />
                    </div>
                    <h3 className="text-foreground mb-2 text-lg font-bold">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-center text-sm">
          En arrière-plan, l&apos;infrastructure Dorevia renforce la cohérence
          des données avant leur restitution dans Linky.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mx-auto mt-10 max-w-md"
        >
          <div className="flex items-center gap-4 rounded-xl border border-[#e67e22]/15 bg-[#e67e22]/5 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e67e22]/15">
              <Sparkles className="size-5 text-[#d35400]" />
            </div>
            <div>
              <div className="text-foreground text-sm font-bold">DIVA</div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Assiste la lecture avec analyse et alertes.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
