/**
 * Sur lab.linky (`?tenant=`), conserver le paramètre sur les liens internes
 * pour ne pas casser le scope des APIs / useDashboardData.
 */
export function navHrefWithTenant(path: string, tenant: string | null | undefined): string {
  if (path === "#" || !tenant?.trim()) return path;
  if (path === "/") return `/?tenant=${encodeURIComponent(tenant)}`;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}tenant=${encodeURIComponent(tenant)}`;
}
