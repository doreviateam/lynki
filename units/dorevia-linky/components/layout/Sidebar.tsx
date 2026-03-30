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

/** Aligné `ZeDocs/web61/references/carole_suggest_01.html` — grain typo & survol. */
const NAV_SECTION_TITLE =
  "px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]";

const navLinkInactiveClass =
  "mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] text-[var(--muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--panel)_50%,transparent)] hover:text-[var(--text)]";

const navLinkActiveClass =
  "mb-1 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-[15px] font-medium text-[var(--text)] shadow-[0_10px_30px_rgba(0,0,0,0.18)]";

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
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-72 shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--sidebar-bg)] lg:flex">
      <Link
        href={pilotageHref}
        className="flex items-center gap-4 px-5 py-6 outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--panel)_45%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]"
        aria-label="Retour au cockpit de pilotage"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] font-headline text-lg font-extrabold leading-none tracking-tight text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:text-xl">
          DL
        </div>
        <div className="min-w-0">
          <div className="font-headline text-2xl font-extrabold tracking-tight text-[var(--text)]">Lynki</div>
          <div className="mt-1 text-sm text-[var(--muted)]">Cockpit financier</div>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col px-3 pb-4" aria-label="Navigation principale">
        <div>
          <div className={NAV_SECTION_TITLE}>Dashboard</div>
          <div>
            <Link
              href={pilotageHref}
              className={pilotageActive ? navLinkActiveClass : navLinkInactiveClass}
              aria-current={pilotageActive ? "page" : undefined}
            >
              <Icon name="bar_chart" size={20} className={pilotageActive ? "text-[var(--text)]" : "text-[var(--muted)]"} />
              <span>Pilotage</span>
            </Link>
            <Link
              href={syntheseHref}
              className={syntheseActive ? navLinkActiveClass : navLinkInactiveClass}
              aria-current={syntheseActive ? "page" : undefined}
            >
              <Icon name="account_balance" size={20} className={syntheseActive ? "text-[var(--text)]" : "text-[var(--muted)]"} />
              <span>Synthèse comptable</span>
            </Link>
          </div>
        </div>

        <div className="mt-auto px-0 pb-2 pt-10">
          <div className={NAV_SECTION_TITLE}>Outils</div>
          <div>
            <Link
              href={aideLexiqueHref}
              className={lexiqueActive ? navLinkActiveClass : navLinkInactiveClass}
              aria-current={lexiqueActive ? "page" : undefined}
            >
              <Icon name="menu_book" size={20} className={lexiqueActive ? "text-[var(--text)]" : "text-[var(--muted)]"} />
              <span>Lexique</span>
            </Link>
            <Link href={aideHref} className={aideActive ? navLinkActiveClass : navLinkInactiveClass} aria-current={aideActive ? "page" : undefined}>
              <Icon name="help" size={20} className={aideActive ? "text-[var(--text)]" : "text-[var(--muted)]"} />
              <span>Aide</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="border-t border-[var(--border)] px-3 py-4">
        <div className={NAV_SECTION_TITLE}>Session</div>
        <ThemeToggle variant="sidebarRow" />
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] text-[var(--muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--panel)_50%,transparent)] hover:text-[var(--text)]"
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
    </aside>
  );
}
