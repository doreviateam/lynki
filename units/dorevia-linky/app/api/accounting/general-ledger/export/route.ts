import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const TIMEOUT_MS = 30_000;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/accounting/general-ledger/export — Sprint 05 T29 / Sprint 06 T35
// Proxy CSV depuis Vault /api/accounting/general-ledger/export.
// Doctrine : export uniquement depuis Vault — 502 si Vault injoignable.
// Params requis : tenant, account_code, date_debut, date_fin.
// Params optionnels (T35) : company_id, journal_code, partner_id.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const tenant = searchParams.get("tenant") || process.env.TENANT_ID || "core";
  const accountCode = searchParams.get("account_code") || "";
  const dateDebut = searchParams.get("date_debut") || "";
  const dateFin = searchParams.get("date_fin") || "";
  const companyId = searchParams.get("company_id") || null;
  const companyIds = searchParams.get("company_ids") || null;
  const journalCode = searchParams.get("journal_code") || "";
  const partnerId = searchParams.get("partner_id") || "";
  const partnerName = searchParams.get("partner_name") || "";

  if (!accountCode || !dateDebut || !dateFin) {
    return NextResponse.json(
      { error: "account_code, date_debut et date_fin sont requis" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    tenant,
    account_code: accountCode,
    date_debut: dateDebut,
    date_fin: dateFin,
    ...(companyIds ? { company_ids: companyIds } : companyId ? { company_id: companyId } : {}),
    ...(journalCode ? { journal_code: journalCode } : {}),
    ...(partnerId ? { partner_id: partnerId } : {}),
    ...(partnerName ? { partner_name: partnerName } : {}),
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const vaultRes = await fetch(
      `${VAULT_URL}/api/accounting/general-ledger/export?${params}`,
      { cache: "no-store", signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!vaultRes.ok) {
      return NextResponse.json(
        { error: "vault_gl_export_unavailable", vault_status: vaultRes.status },
        { status: 502 }
      );
    }

    const csvBody = await vaultRes.arrayBuffer();
    const filename =
      vaultRes.headers.get("Content-Disposition") ??
      `attachment; filename="grand_livre_${accountCode}_${tenant}_${dateDebut}_${dateFin}.csv"`;

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
    const exportJournal = vaultRes.headers.get("X-Lynki-Export-Journal");
    if (exportJournal) headers.set("X-Lynki-Export-Journal", exportJournal);

    return new NextResponse(csvBody, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { error: "vault_gl_export_unreachable" },
      { status: 502 }
    );
  }
}
