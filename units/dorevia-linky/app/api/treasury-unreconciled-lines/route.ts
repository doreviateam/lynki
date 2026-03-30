import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 8000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

function parseIntClamped(s: string | null, def: number, min: number, max: number): number {
  if (s == null || !/^\d+$/.test(s)) return def;
  return Math.min(max, Math.max(min, parseInt(s, 10)));
}

/**
 * GET /api/treasury-unreconciled-lines — proxy Vault GET /ui/aggregations/treasury-unreconciled-lines
 * (projection bank_reconciliation — T-TR-DETAIL-003 V1).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const companyId = searchParams.get("company_id") ?? "";
  const limit = parseIntClamped(searchParams.get("limit"), 50, 1, 200);
  const offset = parseIntClamped(searchParams.get("offset"), 0, 0, 10000);

  const qs = new URLSearchParams({ tenant, limit: String(limit), offset: String(offset) });
  if (companyId) qs.set("company_id", companyId);

  const url = `${VAULT_URL.replace(/\/$/, "")}/ui/aggregations/treasury-unreconciled-lines?${qs}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

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
          items: [],
          source: "error",
          partial: true,
          limit,
          offset,
          has_more: false,
          aging_buckets: { "0_7": 0, "8_30": 0, "30_plus": 0 },
        },
        { status: res.status >= 500 ? 503 : 200 }
      );
    }
    const data = (await res.json()) as {
      items?: unknown[];
      source?: string;
      partial?: boolean;
      limit?: number;
      offset?: number;
      has_more?: boolean;
      aging_buckets?: Record<string, unknown>;
    };
    const ab = data.aging_buckets;
    const aging =
      ab && typeof ab === "object"
        ? {
            "0_7": typeof ab["0_7"] === "number" && Number.isFinite(ab["0_7"]) ? ab["0_7"] : 0,
            "8_30": typeof ab["8_30"] === "number" && Number.isFinite(ab["8_30"]) ? ab["8_30"] : 0,
            "30_plus": typeof ab["30_plus"] === "number" && Number.isFinite(ab["30_plus"]) ? ab["30_plus"] : 0,
          }
        : { "0_7": 0, "8_30": 0, "30_plus": 0 };

    return NextResponse.json({
      items: Array.isArray(data.items) ? data.items : [],
      source: typeof data.source === "string" ? data.source : "bank_reconciliation_projection",
      partial: data.partial !== false,
      limit: typeof data.limit === "number" ? data.limit : limit,
      offset: typeof data.offset === "number" ? data.offset : offset,
      has_more: data.has_more === true,
      aging_buckets: aging,
    });
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json(
      {
        items: [],
        source: "unavailable",
        partial: true,
        limit,
        offset,
        has_more: false,
        aging_buckets: { "0_7": 0, "8_30": 0, "30_plus": 0 },
      },
      { status: 503 }
    );
  }
}
