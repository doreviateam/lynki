import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const TIMEOUT_MS = 10000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * GET /api/stock-valuation — proxy vers Vault GET /ui/aggregations/stock-valuation (ZeDocs/web52 Option B).
 * Paramètres : tenant (requis), company_id (requis), as_of_date (optionnel).
 * 404 si aucun snapshot → propagé au client.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant");
  const companyId = searchParams.get("company_id");
  const asOfDate = searchParams.get("as_of_date");

  if (!tenant) {
    return NextResponse.json({ error: "tenant is required" }, { status: 400 });
  }
  if (!companyId) {
    return NextResponse.json({ error: "company_id is required" }, { status: 400 });
  }

  const qs = new URLSearchParams({ tenant, company_id: companyId });
  if (asOfDate) qs.set("as_of_date", asOfDate);

  const vaultBase = VAULT_URL.replace(/\/$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${vaultBase}/ui/aggregations/stock-valuation?${qs}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 404) {
      return new NextResponse(null, { status: 404 });
    }
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
