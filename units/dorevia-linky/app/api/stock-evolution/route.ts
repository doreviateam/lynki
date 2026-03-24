import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const TIMEOUT_MS = 10000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * GET /api/stock-evolution — proxy vers Vault GET /ui/aggregations/stock-series (ZeDocs/web52 Option B).
 * Paramètres : tenant, company_id, date_debut, date_fin (tous requis).
 * 200 + { series: [], currency } si série vide.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant");
  const companyId = searchParams.get("company_id");
  const dateDebut = searchParams.get("date_debut");
  const dateFin = searchParams.get("date_fin");

  if (!tenant) {
    return NextResponse.json({ error: "tenant is required" }, { status: 400 });
  }
  if (!companyId) {
    return NextResponse.json({ error: "company_id is required" }, { status: 400 });
  }
  if (!dateDebut) {
    return NextResponse.json({ error: "date_debut is required" }, { status: 400 });
  }
  if (!dateFin) {
    return NextResponse.json({ error: "date_fin is required" }, { status: 400 });
  }

  const qs = new URLSearchParams({ tenant, company_id: companyId, date_debut: dateDebut, date_fin: dateFin });
  const vaultBase = VAULT_URL.replace(/\/$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${vaultBase}/ui/aggregations/stock-series?${qs}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || res.statusText },
        { status: res.status >= 500 ? 503 : res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json({ error: "Vault unavailable" }, { status: 503 });
  }
}
