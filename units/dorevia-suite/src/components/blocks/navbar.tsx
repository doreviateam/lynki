"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Menu, X } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Comment ça marche", href: "/#comment-ca-marche" },
  { label: "Voir Linky en action", href: "/#linky-en-action" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const portalTarget =
    typeof document !== "undefined" ? document.getElementById("navbar-portal") : null;

  const headerContent = (
    <header
      className={`fixed inset-x-0 top-0 z-[9999] isolate border-b border-border/60 transition-all duration-300 ${
        scrolled ? "bg-white shadow-sm backdrop-blur-md" : "bg-white"
      }`}
      style={{ position: "fixed", top: 0, left: 0, right: 0 }}
    >
      <div className="container flex h-16 items-center justify-between md:h-[4.5rem]">
        <Link
          href="/"
          className="transition-opacity hover:opacity-90"
          aria-label="Dorevia Suite — Accueil"
        >
          <span className="font-display text-xl font-extrabold tracking-tight text-[#1e3a5f] md:text-2xl">
            Dorevia Suite
          </span>
        </Link>

        {/* Desktop : espace entre logo et liens, liens regroupés, CTA à droite */}
        <div className="hidden items-center md:flex">
          <nav className="mr-8 flex items-center gap-6">
            {isHome &&
              NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
          </nav>
          <Button
            asChild
            size="sm"
            className="rounded-xl bg-[#e67e22] text-white hover:bg-[#d35400]"
          >
            <Link href="/contact">Demander une démo</Link>
          </Button>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-3 md:hidden">
          <Button
            asChild
            size="sm"
            className="rounded-xl bg-[#e67e22] text-white hover:bg-[#d35400]"
          >
            <Link href="/contact">Démo</Link>
          </Button>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-foreground p-1"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-border bg-white space-y-3 border-b px-6 py-4 md:hidden">
          {isHome &&
            NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground block text-sm font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          <Link
            href="/contact"
            className="text-muted-foreground hover:text-foreground block text-sm font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Demander une démo
          </Link>
        </div>
      )}
    </header>
  );

  if (!mounted || !portalTarget) {
    return (
      <header
        className="fixed inset-x-0 top-0 z-[9999] h-16 border-b border-border/60 bg-white md:h-[4.5rem]"
        aria-hidden
      >
        <div className="container flex h-full items-center justify-between" />
      </header>
    );
  }

  return createPortal(headerContent, portalTarget);
};
