/**
 * Vault / JSON peuvent exposer company_id soit en chaîne "odoo:N", soit en objet { odoo: N }.
 */
export function normalizeCompanyId(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    return t.length > 0 ? t : null;
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if (typeof o.odoo === "number" && Number.isFinite(o.odoo)) {
      return `odoo:${o.odoo}`;
    }
    if (typeof o.odoo === "string") {
      const digits = o.odoo.trim();
      if (/^\d+$/.test(digits)) return `odoo:${digits}`;
    }
  }
  return null;
}

/**
 * Texte sûr pour enfants React (évite l’erreur #31 si la source est un objet, ex. { odoo: 1 }).
 */
export function safeReactText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  const id = normalizeCompanyId(value);
  if (id) return id;
  return "";
}

/** Libellé affichable : display_name si exploitable, sinon id normalisé. */
export function companyDisplayLabel(displayName: unknown, companyIdRaw: unknown): string {
  const fromName = safeReactText(displayName);
  if (fromName) return fromName;
  return normalizeCompanyId(companyIdRaw) ?? "";
}
