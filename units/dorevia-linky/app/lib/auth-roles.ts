/**
 * Rôles / habilitations Lynki — Sprint 06 T32.
 * Modèle minimal : 3 rôles fixes, tokens par rôle définis en variables d'env.
 *
 * Droits :
 *   Admin      — accès complet (Synthèse, GL, admin, export)
 *   Controller — accès Synthèse + GL + export ; pas de pages /admin
 *   Manager    — accès lecture Synthèse uniquement ; pas d'export, pas de GL dédié, pas d'admin
 *
 * Authentification : token opaque fourni à la connexion, stocké en cookie httpOnly `lynki_session`.
 * En production, remplacer par un système SSO/OIDC adapté.
 */

export type LynkiRole = "admin" | "controller" | "manager";

export interface LynkiSession {
  role: LynkiRole;
  /** timestamp d'expiration (ms) */
  expiresAt: number;
}

// ─── Durée de session ────────────────────────────────────────────────────────
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 heures
export const SESSION_COOKIE = "lynki_session";

// ─── Droits par route (préfixes) ─────────────────────────────────────────────

/** Routes accessibles uniquement aux Admins */
export const ADMIN_ONLY_PREFIXES = ["/admin"];

/** Routes comptables protégées par rôle (Sprint 07 T41) */
export const ACCOUNTING_PREFIXES = [
  "/accounting",
  "/api/accounting",
  "/synthese",
];

/** Sous-routes GL / export : Admin + Controller uniquement (Manager exclu) */
export const ACCOUNTING_GL_EXPORT_PREFIXES = [
  "/api/accounting/general-ledger",
  "/api/accounting/trial-balance/export",
  "/accounting/gl",
];

/** Routes publiques (pas de vérification de rôle) */
export const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth",
  "/_next",
  "/favicon",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function canAccessAdmin(role: LynkiRole): boolean {
  return role === "admin";
}

export function canAccessGL(role: LynkiRole): boolean {
  return role === "admin" || role === "controller";
}

export function canExport(role: LynkiRole): boolean {
  return role === "admin" || role === "controller";
}

export function canAccessAccounting(role: LynkiRole): boolean {
  return role === "admin" || role === "controller" || role === "manager";
}

/**
 * Retourne le rôle associé à un token, ou null si invalide.
 * Lit les tokens depuis les variables d'env (côté serveur uniquement).
 */
export function resolveRoleFromToken(token: string): LynkiRole | null {
  if (!token) return null;
  const adminToken = process.env.LINKY_ADMIN_TOKEN || "";
  const controllerToken = process.env.LINKY_CONTROLLER_TOKEN || "";
  const managerToken = process.env.LINKY_MANAGER_TOKEN || "";

  if (adminToken && token === adminToken) return "admin";
  if (controllerToken && token === controllerToken) return "controller";
  if (managerToken && token === managerToken) return "manager";
  return null;
}

/**
 * Décode la session depuis un cookie JSON.
 * Retourne null si absent, malformé ou expiré.
 */
export function decodeSession(raw: string | undefined): LynkiSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf-8")) as LynkiSession;
    if (!parsed.role || !parsed.expiresAt) return null;
    if (Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function encodeSession(session: LynkiSession): string {
  return Buffer.from(JSON.stringify(session)).toString("base64");
}
