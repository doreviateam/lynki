import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export const VoyezDoreviaSection = () => {
  return (
    <section
      id="voyez-dorevia"
      className="scroll-mt-24 py-24 lg:py-32"
    >
      <div className="container">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[#1e3a5f] md:text-4xl lg:text-5xl">
          Voyez ce que Linky peut changer dans votre pilotage
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center leading-relaxed">
          Découvrez comment Dorevia Linky peut aider votre entreprise à
          piloter plus clairement la marge, la trésorerie, le BFR et le risque
          client.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button variant="cta" size="lg" className="px-8 text-base" asChild>
            <Link href="/contact">
              Demander une démo
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button variant="ctaOutline" size="lg" className="px-8 text-base" asChild>
            <Link href="#linky-en-action">Voir Linky en action</Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-8 text-center text-sm">
          Démonstration sur cas réel ou simulé, selon votre contexte.
        </p>
      </div>
    </section>
  );
};
