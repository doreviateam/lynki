/**
 * POST /api/dlp/sync-companies
 * Synchronise les sociétés DLP depuis la config tenant (COMPANY_DISPLAY_NAMES / Vault).
 * Crée en DLP les sociétés manquantes sans recréer les existantes.
 */
import { NextRequest, NextResponse } from "next/server";
import { dlpFetch } from "@/app/lib/dlpClient";

const DEFAULT_TENANT = process.env.TENANT_ID || "core";

export const revalidate = 0;
export const dynamic = "force-dynamic";

interface ConfigCompany {
  company_id: string;
  display_name?: string;
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;

  // Appel interne (évite fetch vers URL publique depuis le conteneur)
  const port = process.env.PORT || "3000";
  const companiesUrl = `http://127.0.0.1:${port}/api/companies?tenant=${encodeURIComponent(tenant)}`;

  try {
    // 1. Sociétés depuis la config (manifest / Vault)
    const configRes = await fetch(companiesUrl, { cache: "no-store" });
    const configCompanies = (await configRes.json()) as ConfigCompany[];
    if (!Array.isArray(configCompanies) || configCompanies.length === 0) {
      return NextResponse.json({ created: 0, skipped: 0, message: "Aucune société dans la configuration" });
    }

    // 2. Sociétés déjà en DLP
    const dlpRes = await dlpFetch("/api/v1/companies", { params: { tenant } });
    const dlpData = await dlpRes.json();
    const existingExternalIds = new Set<string>();
    if (Array.isArray(dlpData)) {
      for (const c of dlpData as { external_id: string }[]) {
        if (c?.external_id) existingExternalIds.add(c.external_id);
      }
    }

    // 3. Créer les sociétés manquantes
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];
    for (const c of configCompanies) {
      if (!c?.company_id || c.company_id === "odoo:0") continue;
      if (existingExternalIds.has(c.company_id)) {
        skipped++;
        continue;
      }

      const name = (c.display_name || c.company_id).trim() || c.company_id;
      const res = await dlpFetch("/api/v1/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant,
          external_id: c.company_id,
          name,
        }),
      });
      if (res.ok) {
        created++;
        existingExternalIds.add(c.company_id);
      } else {
        const errData = await res.json().catch(() => ({}));
        errors.push(`${c.company_id}: ${(errData as { error?: string }).error ?? res.statusText}`);
      }
    }
    const message =
      created > 0
        ? `${created} société(s) créée(s)${skipped > 0 ? `, ${skipped} déjà présente(s)` : ""}`
        : skipped > 0
          ? `Toutes les sociétés existaient déjà (${skipped})`
          : errors.length
            ? "Erreurs lors de la synchronisation"
            : "Aucune société dans la configuration";

    return NextResponse.json({
      created,
      skipped,
      errors: errors.length ? errors : undefined,
      message,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}
