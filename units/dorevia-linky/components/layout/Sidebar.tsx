"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { navHrefWithTenant } from "@/components/layout/navTenantHref";

interface NavItem {
  label: string;
  icon: string;
  href: string;
  matchPrefix?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/", matchPrefix: "/" },
  { label: "Trésorerie", icon: "account_balance", href: "/tresorerie", matchPrefix: "/tresorerie" },
  { label: "Alertes", icon: "notifications_active", href: "/alerts", matchPrefix: "/alerts" },
  { label: "Synthèse", icon: "insert_chart", href: "/synthese", matchPrefix: "/synthese" },
];

const SECONDARY_ITEMS: NavItem[] = [
  { label: "Facturation", icon: "description", href: "#" },
  { label: "Analytique", icon: "analytics", href: "#" },
  { label: "Documents", icon: "folder_open", href: "#" },
  { label: "Ventes", icon: "trending_up", href: "#" },
  { label: "Achats", icon: "shopping_cart", href: "#" },
  { label: "Banque", icon: "payments", href: "#" },
  { label: "Audit", icon: "verified_user", href: "#" },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.matchPrefix === "/") return pathname === "/";
  return !!item.matchPrefix && pathname.startsWith(item.matchPrefix);
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantQs = searchParams.get("tenant");

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-full w-64 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 px-3 py-4 text-sm font-medium text-white shadow-xl md:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-[var(--confidence-fiable)] font-black tracking-tight text-white">
          L
        </div>
        <div>
          <div className="font-black leading-tight tracking-tight text-white">Lynki</div>
          <div className="text-xs text-slate-400">Cockpit financier</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={navHrefWithTenant(item.href, tenantQs)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all duration-200 active:origin-left active:scale-95 ${
                active
                  ? "bg-[var(--confidence-fiable)] text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon name={item.icon} size={20} filled={active} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="my-3 border-t border-slate-800" />

        {SECONDARY_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-white active:origin-left active:scale-95"
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-slate-800 pt-6">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2 text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
        >
          <Icon name="help" size={20} />
          <span>Aide</span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2 text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
        >
          <Icon name="logout" size={20} />
          <span>Déconnexion</span>
        </Link>
      </div>
    </aside>
  );
}
