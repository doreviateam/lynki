import { NextRequest, NextResponse } from "next/server";
import { dlpFetch } from "@/app/lib/dlpClient";

const DEFAULT_TENANT = process.env.TENANT_ID || "core";

export const revalidate = 0;
export const dynamic = "force-dynamic";

/** GET /api/dlp/dlps — Liste des DLP (proxy vers DLP) */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const status = searchParams.get("status") ?? "active";

  try {
    const res = await dlpFetch("/api/v1/dlps", { params: { tenant, status } });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}

/** POST /api/dlp/dlps — Création DLP (proxy vers DLP) */
export async function POST(request: NextRequest) {
  const tenant = process.env.TENANT_ID ?? DEFAULT_TENANT;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const payload = { ...body, tenant_id: body.tenant_id ?? tenant };

  try {
    const res = await dlpFetch("/api/v1/dlps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}
