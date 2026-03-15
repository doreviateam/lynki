import React from "react";

import { ContactForm } from "@/components/blocks/contact-form";

const REASSURANCE = [
  "Découvrir si Dorevia correspond à votre contexte",
  "Explorer un cas d'usage concret",
  "Échanger autour d'un partenariat ou d'une collaboration",
  "Poser une question produit, métier ou architecture",
];

const PROJECTION = [
  "Production",
  "Association",
  "Commerce et point de vente",
];

export default function Contact() {
  return (
    <section className="py-28 lg:py-32 lg:pt-44">
      <div className="container max-w-2xl">
        {/* Hero */}
        <h1 className="text-center text-2xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
          Parlons de votre contexte
        </h1>
        <p className="text-muted-foreground mt-4 text-center leading-relaxed">
          Que vous souhaitiez découvrir Dorevia, explorer un cas d&apos;usage ou
          envisager une collaboration, nous serons ravis d&apos;échanger avec
          vous.
        </p>

        {/* Intro */}
        <p className="text-muted-foreground mt-8 leading-relaxed">
          Dorevia aide les organisations à fiabiliser leurs données financières
          avant le pilotage. Si votre enjeu porte sur la trésorerie, les
          paiements, les rapprochements ou la lisibilité financière, cette
          conversation est le bon point de départ.
        </p>

        {/* Formulaire */}
        <div className="mt-10">
          <ContactForm />
        </div>

        {/* Bloc réassurance */}
        <div className="mt-16 border-t pt-12">
          <h2 className="text-lg font-semibold">
            Quelques raisons de nous écrire
          </h2>
          <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5">
            {REASSURANCE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Bloc projection */}
        <div className="mt-12 border-t pt-12">
          <h2 className="text-lg font-semibold">
            Là où Dorevia peut déjà prendre sens
          </h2>
          <ul className="text-muted-foreground mt-4 flex flex-wrap gap-3">
            {PROJECTION.map((item) => (
              <li
                key={item}
                className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
