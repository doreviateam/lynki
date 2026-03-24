import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  decodeSession,
  canAccessAdmin,
  canAccessAccounting,
  canAccessGL,
  PUBLIC_PREFIXES,
  ADMIN_ONLY_PREFIXES,
  ACCOUNTING_PREFIXES,
  ACCOUNTING_GL_EXPORT_PREFIXES,
} from "@/app/lib/auth-roles";

/**
 * Middleware Lynki — Sprint 06 T32 + Sprint 07 T41 (habilitations /accounting/*).
 *
 * Ordre de traitement :
 * 1. Routes publiques et _next → pass-through
 * 2. /odoo/* → redirection Odoo (comportement existant)
 * 3. /admin/* → Admin uniquement
 * 4. /accounting/* + /api/accounting/* — matrice rôles Sprint 07 T41 :
 *    a. GL pages + GL/TB export → Admin ou Controller (canAccessGL)
 *    b. Synthèse (balance, bilan, CR) → Admin, Controller ou Manager (canAccessAccounting)
 * 5. Tout le reste → pass-through
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // ── 1. Routes toujours publiques ─────────────────────────────────────────
  if (PUBLIC_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }

  // ── 2. Redirection /odoo/* ────────────────────────────────────────────────
  if (path.startsWith("/odoo")) {
    const odooUrl =
      process.env.NEXT_PUBLIC_ODOO_URL ||
      deriveOdooUrlFromHost(request.nextUrl.host);
    if (odooUrl) {
      const base = odooUrl.replace(/\/$/, "");
      const pathSuffix = path.length > 5 ? "/" + path.slice(6) : "/";
      return NextResponse.redirect(`${base}${pathSuffix}`, 302);
    }
    return NextResponse.next();
  }

  // ── 3. Routes /admin/* — Admin uniquement ────────────────────────────────
  if (ADMIN_ONLY_PREFIXES.some((p) => path.startsWith(p))) {
    const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      return unauthenticatedResponse(request, path);
    }
    if (!canAccessAdmin(session.role)) {
      return forbiddenResponse(path, "admin", session.role);
    }
    return NextResponse.next();
  }

  // ── 4. Routes /accounting/* + /api/accounting/* — Sprint 07 T41 ─────────
  if (ACCOUNTING_PREFIXES.some((p) => path.startsWith(p))) {
    const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      return unauthenticatedResponse(request, path);
    }
    // 4a. GL + exports → Admin / Controller uniquement
    if (ACCOUNTING_GL_EXPORT_PREFIXES.some((p) => path.startsWith(p))) {
      if (!canAccessGL(session.role)) {
        return forbiddenResponse(path, "controller", session.role);
      }
      return NextResponse.next();
    }
    // 4b. Synthèse (balance, bilan, CR) → Admin / Controller / Manager
    if (!canAccessAccounting(session.role)) {
      return forbiddenResponse(path, "manager", session.role);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

function unauthenticatedResponse(request: NextRequest, path: string) {
  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", path);
  return NextResponse.redirect(loginUrl);
}

function forbiddenResponse(path: string, requiredMin: string, current: string) {
  if (path.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Accès refusé", required: requiredMin, current },
      { status: 403 }
    );
  }
  return NextResponse.json(
    { error: "Accès refusé", required: requiredMin, current },
    { status: 403 }
  );
}

function deriveOdooUrlFromHost(host: string): string {
  const hostname = host.split(":")[0];
  if (hostname.startsWith("ui.")) {
    return `https://odoo.${hostname.slice(3)}/odoo`;
  }
  return "";
}

export const config = {
  matcher: [
    "/odoo/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/accounting/:path*",
    "/api/accounting/:path*",
    "/synthese/:path*",
    "/synthese",
  ],
};
