import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const TIMEOUT_MS = 30_000; // export peut être plus lent que la consultation

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/accounting/trial-balance/export — Sprint 04 T24
// Proxy CSV depuis Vault /api/accounting/trial-balance/export.
// Doctrine : export uniquement depuis Vault (data_source=vault).
//            Si Vault indisponible → 502 (pas d'export depuis stub).
// Params : tenant, date_debut, date_fin (requis), company_id (opt).
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const tenant = searchParams.get("tenant") || process.env.TENANT_ID || "core";
  const dateDebut = searchParams.get("date_debut") || "";
  const dateFin = searchParams.get("date_fin") || "";
  const companyId = searchParams.get("company_id") || null;
  const companyIds = searchParams.get("company_ids") || null;

  if (!dateDebut || !dateFin) {
    return NextResponse.json(
      { error: "date_debut et date_fin sont requis" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    tenant,
    date_debut: dateDebut,
    date_fin: dateFin,
    ...(companyIds ? { company_ids: companyIds } : companyId ? { company_id: companyId } : {}),
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const vaultRes = await fetch(
      `${VAULT_URL}/api/accounting/trial-balance/export?${params}`,
      { cache: "no-store", signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!vaultRes.ok) {
      return NextResponse.json(
        { error: "vault_export_unavailable", vault_status: vaultRes.status },
        { status: 502 }
      );
    }

    // Transmettre la réponse CSV directement
    const csvBody = await vaultRes.arrayBuffer();
    const filename =
      vaultRes.headers.get("Content-Disposition") ??
      `attachment; filename="balance_generale_${tenant}_${dateDebut}_${dateFin}.csv"`;

    const headers = new Headers({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": filename,
      "X-Lynki-Accounting-Source": "vault",
      "X-Lynki-Export-Coverage":
        vaultRes.headers.get("X-Lynki-Export-Coverage") ?? "",
      "X-Lynki-Export-Complete":
        vaultRes.headers.get("X-Lynki-Export-Complete") ?? "false",
    });
    const truncated = vaultRes.headers.get("X-Lynki-Export-Truncated");
    if (truncated) headers.set("X-Lynki-Export-Truncated", truncated);

    return new NextResponse(csvBody, { status: 200, headers });
  } catch {
    // Export refusé si Vault injoignable — pas d'export depuis un stub
    return NextResponse.json(
      { error: "vault_export_unreachable" },
      { status: 502 }
    );
  }
}
