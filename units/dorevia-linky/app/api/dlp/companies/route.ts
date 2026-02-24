import { NextRequest, NextResponse } from "next/server";
import { dlpFetch } from "@/app/lib/dlpClient";

const DEFAULT_TENANT = process.env.TENANT_ID || "core";

export const revalidate = 0;
export const dynamic = "force-dynamic";

/** GET /api/dlp/companies — Liste des sociétés */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;

  try {
    const res = await dlpFetch("/api/v1/companies", { params: { tenant } });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}

/** POST /api/dlp/companies — Création société */
export async function POST(request: NextRequest) {
  const tenant = process.env.TENANT_ID ?? DEFAULT_TENANT;
  let body: { tenant_id?: string; external_id: string; name: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const payload = { ...body, tenant_id: body.tenant_id ?? tenant };

  try {
    const res = await dlpFetch("/api/v1/companies", {
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
