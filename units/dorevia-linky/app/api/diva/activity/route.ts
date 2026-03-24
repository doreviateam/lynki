/**
 * POST /api/diva/activity — Signal de dernière consultation cockpit
 * Proxy vers Vault /ui/diva/activity → Diva /diva/activity
 * Garde d'inactivité Option B : Mistral ne tourne que si un utilisateur est actif.
 */

import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 3000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { tenant?: string; company_id?: number } = {};
  try {
    body = await request.json();
  } catch {
    // corps vide ou invalide — on utilise les defaults
  }

  const tenant = body.tenant ?? DEFAULT_TENANT;
  const companyId = body.company_id ?? 0;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const base = VAULT_URL.replace(/\/$/, "");
    const res = await fetch(`${base}/ui/diva/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Tenant": tenant,
      },
      body: JSON.stringify({ tenant, company_id: companyId }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    // 204 ou tout 2xx → succès silencieux
    return new NextResponse(null, { status: res.ok ? 204 : res.status });
  } catch {
    clearTimeout(timeoutId);
    // Fire-and-forget : on ne remonte jamais l'erreur au client
    return new NextResponse(null, { status: 204 });
  }
}
