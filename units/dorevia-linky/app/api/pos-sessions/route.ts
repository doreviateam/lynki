import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 10000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * GET /api/pos-sessions — proxy vers Vault GET /ui/aggregations/pos-sessions (SPEC Dorevia POS Sessions)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const dateDebut = searchParams.get("date_debut");
  const dateFin = searchParams.get("date_fin");
  const shopId = searchParams.get("shop_id") ?? "";

  const qs = new URLSearchParams({ tenant });
  if (dateDebut) qs.set("date_debut", dateDebut);
  if (dateFin) qs.set("date_fin", dateFin);
  if (shopId) qs.set("shop_id", shopId);

  const url = `${VAULT_URL.replace(/\/$/, "")}/ui/aggregations/pos-sessions?${qs}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      return NextResponse.json(
        { total_sessions: 0, sealed_sessions: 0, pending_sessions: 0, items: [] },
        { status: 200 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json(
      { total_sessions: 0, sealed_sessions: 0, pending_sessions: 0, items: [] },
      { status: 200 }
    );
  }
}
