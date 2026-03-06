import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/tenant — retourne le tenant ID (pour affichage client) */
export async function GET() {
  const tenantId = process.env.TENANT_ID || "core";
  return NextResponse.json({ tenant_id: tenantId });
}
