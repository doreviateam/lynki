/**
 * POST /api/diva/accounting-insight — Proxy vers DIVA POST /diva/accounting/insight
 * Sprint 12 T70 — Envoie les données comptables à Diva et retourne l'insight.
 */
import { NextRequest, NextResponse } from "next/server";

const DIVA_URL = process.env.DIVA_URL || process.env.VAULT_URL || "http://localhost:8080";
const TIMEOUT_MS = 15_000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

export interface AccountingInsightResponse {
  headline: string;
  what_i_see: string;
  to_check: string;
  scope_note: string;
  facts_hash: string;
  generated_at: string;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Corps JSON invalide." } },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const base = DIVA_URL.replace(/\/$/, "");
    const res = await fetch(`${base}/diva/accounting/insight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { error: { code: isTimeout ? "TIMEOUT" : "SERVICE_UNAVAILABLE", message: "Insight comptable indisponible." } },
      { status: isTimeout ? 408 : 503 }
    );
  }
}
