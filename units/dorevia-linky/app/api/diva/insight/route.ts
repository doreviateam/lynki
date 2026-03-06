/**
 * GET /api/diva/insight — Proxy vers DIVA GET /diva/insights
 * Lecture instantanée : Linky ne dépend jamais de Mistral pour afficher.
 * SPEC : ZeDocs/web23/SPEC_DIVA_Insights_v1.0.md §6.2
 */

import { NextRequest, NextResponse } from "next/server";

const DIVA_URL = process.env.DIVA_URL || "http://diva:8010";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 5000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const companyId = searchParams.get("company_id") ?? "0";
  const mode = searchParams.get("mode") ?? "cockpit";
  const cardKey = searchParams.get("card_key") ?? "";
  const period = searchParams.get("period");
  const dateStart = searchParams.get("date_start");
  const dateEnd = searchParams.get("date_end");
  const timezone = searchParams.get("timezone") ?? "";
  const partnerName = searchParams.get("partner_name") ?? "";

  if (mode !== "cockpit" && mode !== "card") {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "mode doit être cockpit ou card" } },
      { status: 400 }
    );
  }

  if (mode === "card" && !cardKey) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "card_key requis en mode card" } },
      { status: 400 }
    );
  }

  if (!period && (!dateStart || !dateEnd)) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "period ou (date_start, date_end) requis" } },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    tenant,
    company_id: companyId,
    mode,
  });
  if (mode === "card") {
    params.set("card_key", cardKey);
  }
  if (period) {
    params.set("period", period);
  } else {
    params.set("date_start", dateStart!);
    params.set("date_end", dateEnd!);
  }
  if (timezone) {
    params.set("timezone", timezone);
  }
  if (partnerName) {
    params.set("partner_name", partnerName);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const base = DIVA_URL.replace(/\/$/, "");
    const res = await fetch(`${base}/diva/insights?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(data ?? { error: { code: "UNKNOWN", message: "Lecture indisponible." } }, {
        status: res.status,
      });
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      {
        error: {
          code: isTimeout ? "TIMEOUT" : "SERVICE_UNAVAILABLE",
          message: "Lecture insight indisponible.",
        },
      },
      { status: isTimeout ? 408 : 503 }
    );
  }
}
