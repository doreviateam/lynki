import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const LOCKED_TENANT = (process.env.TENANT_ID || "").trim();
const COMPANIES_TIMEOUT_MS = 5000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

interface VaultCompanyItem {
  company_id: string;
  documents_count: number;
}

interface EnrichedCompanyItem extends VaultCompanyItem {
  display_name?: string;
}

/**
 * GET /api/companies — proxy vers Vault GET /ui/companies avec enrichissement display_name
 * depuis COMPANY_DISPLAY_NAMES (env JSON {"company_id": "Libellé"}).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedTenant = searchParams.get("tenant");
  if (LOCKED_TENANT && requestedTenant && requestedTenant !== LOCKED_TENANT) {
    return NextResponse.json(
      {
        error: "tenant_mismatch",
        message: `This Linky deployment is locked to tenant '${LOCKED_TENANT}'.`,
        requested_tenant: requestedTenant,
        effective_tenant: LOCKED_TENANT,
      },
      { status: 400 }
    );
  }
  const tenant = LOCKED_TENANT || requestedTenant || DEFAULT_TENANT;

  const url = `${VAULT_URL.replace(/\/$/, "")}/ui/companies?tenant=${encodeURIComponent(tenant)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), COMPANIES_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Tenant": tenant,
      },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    let data: VaultCompanyItem[] = [];
    if (res.ok) {
      data = (await res.json()) as VaultCompanyItem[];
    }
    // Si Vault erre ou renvoie vide, on continue pour appliquer le fallback manifest

    let displayNames: Record<string, string> = {};
    try {
      const raw = process.env.COMPANY_DISPLAY_NAMES;
      if (raw) {
        displayNames = (JSON.parse(raw) as Record<string, string>) || {};
      }
    } catch {
      // Ignorer si JSON invalide
    }

    // Enrichir les sociétés Vault avec display_name (manifest)
    // Exclure odoo:0 (placeholder/test) pour éviter l'auto-sélection par défaut
    const byId = new Map<string, EnrichedCompanyItem>();
    for (const c of data) {
      if (c.company_id === "odoo:0") continue;
      byId.set(c.company_id, {
        ...c,
        display_name: displayNames[c.company_id] ?? c.company_id,
      });
    }

    // Ajouter les entreprises du manifest manquantes (toujours afficher toutes celles du tenant)
    for (const [company_id, display_name] of Object.entries(displayNames)) {
      if (!byId.has(company_id)) {
        byId.set(company_id, { company_id, documents_count: 0, display_name });
      }
    }

    const enriched = Array.from(byId.values()).sort((a, b) =>
      (a.display_name ?? a.company_id).localeCompare(b.display_name ?? b.company_id)
    );

    return NextResponse.json(enriched);
  } catch {
    clearTimeout(timeoutId);
    // Fallback : utiliser les entreprises du manifest quand Vault indisponible
    let displayNames: Record<string, string> = {};
    try {
      const raw = process.env.COMPANY_DISPLAY_NAMES;
      if (raw) displayNames = (JSON.parse(raw) as Record<string, string>) || {};
    } catch {
      /* ignore */
    }
    const fallback = Object.entries(displayNames).map(([company_id, display_name]) => ({
      company_id,
      documents_count: 0,
      display_name,
    }));
    return NextResponse.json(fallback, { status: 200 });
  }
}
