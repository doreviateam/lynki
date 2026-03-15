import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirige /odoo/* vers Odoo (évite 404 quand un lien pointe vers ui.xxx/odoo/... au lieu de odoo.xxx/odoo/...).
 * Ex: ui.lab.o19.doreviateam.com/odoo/customer-payments/1 → odoo.lab.o19.doreviateam.com/odoo/customer-payments/1
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!path.startsWith("/odoo")) {
    return NextResponse.next();
  }

  const odooUrl =
    process.env.NEXT_PUBLIC_ODOO_URL ||
    deriveOdooUrlFromHost(request.nextUrl.host);

  if (!odooUrl) {
    return NextResponse.next();
  }

  // base = https://odoo.xxx/odoo ; path = /odoo/customer-payments/1 → /odoo/customer-payments/1 (pas /odoo/odoo)
  const base = odooUrl.replace(/\/$/, "");
  const pathSuffix = path.length > 5 ? "/" + path.slice(6) : "/"; // /odoo/xxx → /xxx, /odoo → /
  const target = `${base}${pathSuffix}`;
  return NextResponse.redirect(target, 302);
}

function deriveOdooUrlFromHost(host: string): string {
  const hostname = host.split(":")[0];
  if (hostname.startsWith("ui.")) {
    const odooHost = "odoo." + hostname.slice(3);
    return `https://${odooHost}/odoo`;
  }
  return "";
}

export const config = {
  matcher: "/odoo/:path*",
};
