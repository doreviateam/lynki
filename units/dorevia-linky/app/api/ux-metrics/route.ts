import { NextRequest, NextResponse } from "next/server";
import { computeUxMetrics } from "@/app/lib/ux-metrics";

const DEFAULT_TENANT = process.env.TENANT_ID || "core";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const lookbackMinutesRaw = Number(searchParams.get("lookback_minutes") ?? "30");
  const lookbackMinutes = Number.isFinite(lookbackMinutesRaw)
    ? Math.min(120, Math.max(1, Math.floor(lookbackMinutesRaw)))
    : 30;

  const metrics = computeUxMetrics(tenant, lookbackMinutes * 60 * 1000);
  return NextResponse.json(
    {
      tenant,
      lookback_minutes: lookbackMinutes,
      objective_p95_ms: 2000,
      objective_p99_ms: 4000,
      ...metrics,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}
