import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const TIMEOUT_MS = 30_000;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const tenant = searchParams.get("tenant") || process.env.TENANT_ID || "core";
  const asOfDate = searchParams.get("as_of_date") || "";
  const companyId = searchParams.get("company_id") || null;
  const companyIds = searchParams.get("company_ids") || null;

  if (!asOfDate) {
    return NextResponse.json({ error: "as_of_date est requis" }, { status: 400 });
  }

  const params = new URLSearchParams({
    tenant,
    as_of_date: asOfDate,
    ...(companyIds ? { company_ids: companyIds } : companyId ? { company_id: companyId } : {}),
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const vaultRes = await fetch(
      `${VAULT_URL}/api/accounting/aged-payables/export?${params}`,
      { cache: "no-store", signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!vaultRes.ok) {
      return NextResponse.json(
        { error: "vault_export_unavailable", vault_status: vaultRes.status },
        { status: 502 }
      );
    }

    const csvBody = await vaultRes.arrayBuffer();
    const filename =
      vaultRes.headers.get("Content-Disposition") ??
      `attachment; filename="aged_payables_${tenant}_${asOfDate}.csv"`;

    const headers = new Headers({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": filename,
      "X-Lynki-Accounting-Source": "vault",
      "X-Lynki-Export-Coverage": vaultRes.headers.get("X-Lynki-Export-Coverage") ?? "",
      "X-Lynki-Export-Complete": vaultRes.headers.get("X-Lynki-Export-Complete") ?? "false",
    });

    return new NextResponse(csvBody, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "vault_export_unreachable" }, { status: 502 });
  }
}
