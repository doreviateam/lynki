import { NextRequest, NextResponse } from "next/server";
import { companyDisplayLabel, normalizeCompanyId } from "@/app/lib/company-id";

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

function normalizeVaultRow(raw: unknown): VaultCompanyItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const company_id = normalizeCompanyId(r.company_id);
  if (!company_id) return null;
  const documents_count =
    typeof r.documents_count === "number" && Number.isFinite(r.documents_count)
      ? r.documents_count
      : 0;
  return { company_id, documents_count };
}

interface EnrichedCompanyItem extends VaultCompanyItem {
  display_name?: string;
}

/** Résout le libellé : flat { "odoo:1": "X" } ou par tenant { "laplatine2026": { "odoo:1": "X" } }. */
function getDisplayNames(
  raw: string | undefined,
  tenant: string
): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};
    const byTenant = parsed[tenant];
    if (byTenant && typeof byTenant === "object" && !Array.isArray(byTenant)) {
      return byTenant as Record<string, string>;
    }
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * GET /api/companies — proxy vers Vault GET /ui/companies avec enrichissement display_name
 * depuis COMPANY_DISPLAY_NAMES (env JSON : flat {"company_id": "Libellé"} ou par tenant {"tenant_id": {"company_id": "Libellé"}}).
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
      const parsed = await res.json();
      const rows = Array.isArray(parsed) ? parsed : [];
      for (const row of rows) {
        const norm = normalizeVaultRow(row);
        if (norm) data.push(norm);
      }
    }
    // Si Vault erre ou renvoie vide, on continue pour appliquer le fallback manifest

    const displayNames = getDisplayNames(process.env.COMPANY_DISPLAY_NAMES, tenant);

    // Enrichir les sociétés Vault avec display_name (manifest)
    // Exclure odoo:0 (placeholder/test) pour éviter l'auto-sélection par défaut
    const byId = new Map<string, EnrichedCompanyItem>();
    for (const c of data) {
      if (c.company_id === "odoo:0") continue;
      byId.set(c.company_id, {
        ...c,
        display_name: companyDisplayLabel(displayNames[c.company_id], c.company_id),
      });
    }

    // Ajouter les entreprises du manifest manquantes (toujours afficher toutes celles du tenant)
    for (const [company_id, display_name] of Object.entries(displayNames)) {
      if (!byId.has(company_id)) {
        byId.set(company_id, {
          company_id,
          documents_count: 0,
          display_name: companyDisplayLabel(display_name, company_id),
        });
      }
    }

    const sortLabel = (x: EnrichedCompanyItem) => String(x.display_name ?? x.company_id);
    const enriched = Array.from(byId.values()).sort((a, b) => sortLabel(a).localeCompare(sortLabel(b)));

    return NextResponse.json(enriched);
  } catch {
    clearTimeout(timeoutId);
    // Fallback : utiliser les entreprises du manifest quand Vault indisponible
    const displayNames = getDisplayNames(process.env.COMPANY_DISPLAY_NAMES, tenant);
    const fallback = Object.entries(displayNames).map(([company_id, display_name]) => ({
      company_id,
      documents_count: 0,
      display_name: display_name || company_id,
    }));
    return NextResponse.json(fallback, { status: 200 });
  }
}
