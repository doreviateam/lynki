import { BarChart3, CreditCard, TrendingUp, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    title: "Marge",
    description:
      "Où elle se crée, où elle se dégrade, où elle mérite votre attention.",
    icon: TrendingUp,
  },
  {
    title: "Trésorerie",
    description:
      "Les tensions, les écarts et les signaux faibles à traiter avant qu'ils deviennent critiques.",
    icon: CreditCard,
  },
  {
    title: "BFR et encours",
    description:
      "Les encours, les retards, les concentrations et leur impact sur votre équilibre financier.",
    icon: BarChart3,
  },
  {
    title: "Risque client",
    description:
      "Les dépendances, anomalies de portefeuille et priorités de recouvrement.",
    icon: Users,
  },
];

export const BenefitsSection = () => {
  return (
    <section
      id="benefices"
      className="scroll-mt-24 bg-muted/15 py-24 lg:py-32"
    >
      <div className="container">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[#1e3a5f] md:text-4xl lg:text-5xl">
          Ce que Linky vous aide à voir immédiatement
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed md:text-base">
          Marge, trésorerie, BFR, risque client : une lecture structurée pour
          piloter.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <Card
                key={b.title}
                className="rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex size-12 items-center justify-center rounded-full bg-[#1e3a5f]/10 text-[#1e3a5f]">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#1e3a5f]">
                    {b.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {b.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="text-muted-foreground mx-auto mt-10 max-w-xl text-center text-sm">
          Données fiables · Lecture structurée · Pilotage actionnable
        </p>
      </div>
    </section>
  );
};
