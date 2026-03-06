import { NextRequest, NextResponse } from "next/server";
import type { VaultHealthResponse } from "@/app/types/aggregations";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const VAULT_HEALTH_TIMEOUT_MS = 5000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * GET /api/vault-health — proxy vers Vault GET /ui/system/vault-health (SPEC Indicateur Confiance Vaultage Linky v1.0).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;

  const url = `${VAULT_URL.replace(/\/$/, "")}/ui/system/vault-health?tenant=${encodeURIComponent(tenant)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VAULT_HEALTH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      return NextResponse.json(
        {
          vault_rate: null,
          pending_events: 0,
          failed_events: 0,
          last_sync_at: null,
        } as VaultHealthResponse,
        { status: res.status }
      );
    }
    const data = (await res.json()) as VaultHealthResponse;
    return NextResponse.json(data);
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json(
      {
        vault_rate: null,
        pending_events: 0,
        failed_events: 0,
        last_sync_at: null,
      } as VaultHealthResponse,
      { status: 503 }
    );
  }
}
