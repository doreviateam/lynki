"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { navHrefWithTenant } from "@/components/layout/navTenantHref";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

/** Sous-pages cockpit : même entrée « Pilotage » que la grille (pas de lien direct Trésorerie / Banque en rail). */
const PILOTAGE_DETAIL_PREFIXES = [
  "/tresorerie",
  "/business",
  "/flux-net",
  "/encours",
  "/alerts",
  "/cockpit",
] as const;

function isPilotagePath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PILOTAGE_DETAIL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function NavSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{children}</div>
  );
}

function dashLinkClass(active: boolean): string {
  return `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
    active
      ? "border border-[var(--border)] bg-[var(--panel-2)] text-[var(--text)]"
      : "border border-transparent text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--panel)_55%,transparent)]"
  }`;
}

function supportLinkClass(active: boolean): string {
  return `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
    active
      ? "border border-[var(--border)] bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] text-[var(--text)]"
      : "border border-transparent text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--panel)_55%,transparent)]"
  }`;
}

function useLocationHash(): string {
  const [hash, setHash] = useState("");
  useEffect(() => {
    const update = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return hash;
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantQs = searchParams.get("tenant");
  const hash = useLocationHash();

  const pilotageHref = navHrefWithTenant("/", tenantQs);
  const syntheseHref = navHrefWithTenant("/synthese", tenantQs);
  const aideHref = navHrefWithTenant("/aide", tenantQs);
  const aideLexiqueHref = `${aideHref}#lexique`;

  const pilotageActive = isPilotagePath(pathname);
  const syntheseActive = pathname === "/synthese" || pathname.startsWith("/synthese/");
  const onAide = pathname === "/aide" || pathname.startsWith("/aide/");
  const lexiqueActive = onAide && hash.toLowerCase().includes("lexique");
  const aideActive = onAide && !lexiqueActive;

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-full w-72 shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--sidebar-bg)] shadow-xl md:flex">
      <div className="flex items-start gap-4 px-5 py-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] font-headline text-2xl font-extrabold text-white">
          L
        </div>
        <div className="min-w-0">
          <div className="font-headline text-2xl font-extrabold leading-none tracking-tight text-[var(--text)]">Lynki</div>
          <div className="mt-1 text-sm text-[var(--muted)]">Cockpit financier</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col px-3 pt-2" aria-label="Navigation principale">
        <div className="space-y-6">
          <div>
            <NavSectionTitle>Dashboard</NavSectionTitle>
            <div className="space-y-1">
              <Link href={pilotageHref} className={dashLinkClass(pilotageActive)} aria-current={pilotageActive ? "page" : undefined}>
                <Icon name="monitoring" size={20} filled={pilotageActive} className={pilotageActive ? "text-[var(--text)]" : "text-[var(--muted)]"} />
                <span>Pilotage</span>
              </Link>
              <Link href={syntheseHref} className={dashLinkClass(syntheseActive)} aria-current={syntheseActive ? "page" : undefined}>
                <Icon name="account_balance" size={20} filled={syntheseActive} className={syntheseActive ? "text-[var(--text)]" : "text-[var(--muted)]"} />
                <span>Synthèse comptable</span>
              </Link>
            </div>
          </div>

          <div>
            <NavSectionTitle>Outils</NavSectionTitle>
            <div className="space-y-1">
              <Link href={aideLexiqueHref} className={supportLinkClass(lexiqueActive)} aria-current={lexiqueActive ? "page" : undefined}>
                <Icon name="menu_book" size={20} filled={lexiqueActive} className={lexiqueActive ? "text-[var(--text)]" : "text-[var(--muted)]"} />
                <span>Lexique</span>
              </Link>
              <Link href={aideHref} className={supportLinkClass(aideActive)} aria-current={aideActive ? "page" : undefined}>
                <Icon name="help" size={20} filled={aideActive} className={aideActive ? "text-[var(--text)]" : "text-[var(--muted)]"} />
                <span>Aide</span>
              </Link>
              <div className="flex items-center justify-between rounded-xl border border-transparent px-4 py-2">
                <span className="text-sm font-medium text-[var(--muted)]">Thème</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="mt-auto border-t border-[var(--border)] px-3 py-4">
        <NavSectionTitle>Session</NavSectionTitle>
        <div className="space-y-1">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-left text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--panel)_55%,transparent)]"
            title="Déconnexion — le raccourci session est aussi disponible via l’avatar en haut à droite du pilotage."
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
              window.location.href = "/login";
            }}
          >
            <Icon name="logout" size={20} className="text-[var(--muted)]" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
