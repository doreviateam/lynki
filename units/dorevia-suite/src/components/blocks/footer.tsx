import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-[#1e3a5f] py-20 md:py-24 text-white">
      <div className="container flex flex-col items-center gap-10 text-center">
        <p className="text-xl font-bold tracking-tight md:text-2xl">
          Pilotez votre entreprise sur des données financières plus fiables.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-[#e67e22] hover:bg-[#d35400] text-white shadow-lg"
        >
          <Link href="/contact">
            Demander une démo <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
        <Link
          href="/contact"
          className="text-sm font-medium text-white/90 transition-opacity hover:opacity-80"
        >
          Nous contacter
        </Link>
        <div className="border-t border-white/20 pt-10 w-full max-w-md">
          <p className="text-sm text-white/70">
            © 2026 Doreviateam. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
