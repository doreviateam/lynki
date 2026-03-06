import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 5000;

interface VaultCompanyItem {
  company_id: string;
  documents_count: number;
}

/**
 * GET /api/cockpit/companies — Liste des company_id actifs pour un tenant.
 * SPEC : DIVA_Cockpit_Only.md v1.3 §3, PLAN §2.2
 *
 * Retourne les company_id numériques extraits de Vault (format "odoo:N"),
 * plus 0 (consolidé) si le tenant le supporte.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${VAULT_URL.replace(/\/$/, "")}/ui/companies?tenant=${encodeURIComponent(tenant)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { schema: "dorevia.cockpit_companies.v1", companies: [] },
        { status: 502 },
      );
    }

    const data = (await res.json()) as VaultCompanyItem[];
    const ids: number[] = [];

    for (const c of data) {
      const match = c.company_id.match(/(\d+)/);
      if (match) {
        ids.push(parseInt(match[1], 10));
      }
    }

    ids.sort((a, b) => a - b);

    if (ids.length > 0) {
      ids.unshift(0);
    }

    return NextResponse.json({
      schema: "dorevia.cockpit_companies.v1",
      companies: ids,
    });
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json(
      { schema: "dorevia.cockpit_companies.v1", companies: [] },
      { status: 502 },
    );
  }
}
