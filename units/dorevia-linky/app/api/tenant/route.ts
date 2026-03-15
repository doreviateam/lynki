import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/tenant — retourne le tenant ID et la source de vérité.
 * Linky ne voit que le Vault : primary_source est toujours "vault".
 */
export async function GET() {
  const tenantId = process.env.TENANT_ID || "core";
  return NextResponse.json({
    tenant_id: tenantId,
    primary_source: "vault" as const,
  });
}
