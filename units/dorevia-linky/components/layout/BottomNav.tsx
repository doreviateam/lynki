"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { navHrefWithTenant } from "@/components/layout/navTenantHref";

interface BottomNavItem {
  label: string;
  icon: string;
  href: string;
  matchPrefix?: string;
}

const ITEMS: BottomNavItem[] = [
  { label: "Pilotage", icon: "insights", href: "/", matchPrefix: "/" },
  { label: "Alertes", icon: "notifications_active", href: "/alerts", matchPrefix: "/alerts" },
  { label: "Synthèse", icon: "insert_chart", href: "/synthese", matchPrefix: "/synthese" },
];

function isActive(pathname: string, item: BottomNavItem): boolean {
  if (item.matchPrefix === "/") return pathname === "/" || pathname.startsWith("/tresorerie");
  return !!item.matchPrefix && pathname.startsWith(item.matchPrefix);
}

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantQs = searchParams.get("tenant");

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-slate-200 bg-white/80 pb-6 pt-2 shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 md:hidden">
      {ITEMS.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={navHrefWithTenant(item.href, tenantQs)}
            className={`flex flex-col items-center justify-center transition-all duration-200 ${
              active
                ? "scale-95 font-semibold text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            <Icon name={item.icon} size={24} filled={active} />
            <span className="text-[11px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
