/**
 * POST /api/dlp/decisions — Création simplifiée (SPEC_DLP_UX_v0.1)
 * Accepte un message unique, dérive title/intention, hypothesis="", scope=Option A.
 * Garde-fou : refus si aucune société ou périmètre.
 */
import { NextRequest, NextResponse } from "next/server";
import { dlpFetch } from "@/app/lib/dlpClient";

const DEFAULT_TENANT = process.env.TENANT_ID || "core";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const GUARD_MESSAGE = "Le paramétrage initial n'est pas configuré. Contactez un administrateur.";

export async function POST(request: NextRequest) {
  let body: { message?: string; tenant_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "message requis" }, { status: 400 });
  }
  if (message.length > 140) {
    return NextResponse.json({ error: "La décision doit tenir en 140 caractères maximum." }, { status: 400 });
  }

  const tenant = body?.tenant_id ?? DEFAULT_TENANT;

  try {
    // 1. Récupérer companies et perimeters (scope Option A)
    const [companiesRes, perimetersRes] = await Promise.all([
      dlpFetch("/api/v1/companies", { params: { tenant } }),
      dlpFetch("/api/v1/perimeters", { params: { tenant } }),
    ]);

    const companies = (await companiesRes.json()) as { id: string }[];
    const perimeters = (await perimetersRes.json()) as { id: string }[];

    const companyIds = Array.isArray(companies) ? companies.map((c) => c?.id).filter(Boolean) : [];
    const perimeterIds = Array.isArray(perimeters) ? perimeters.map((p) => p?.id).filter(Boolean) : [];

    // 2. Garde-fou : refuser si vide
    if (companyIds.length === 0 || perimeterIds.length === 0) {
      return NextResponse.json({ error: GUARD_MESSAGE }, { status: 400 });
    }

    // 3. Dérivation title (80 car.), intention, hypothesis=""
    const title = message.length > 80 ? message.slice(0, 80) : message;

    // 4. Appel DLP
    const res = await dlpFetch("/api/v1/dlps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: tenant,
        title,
        intention: message,
        hypothesis: "",
        created_by: "linky",
        scope_company_ids: companyIds,
        scope_perimeter_ids: perimeterIds,
      }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}
