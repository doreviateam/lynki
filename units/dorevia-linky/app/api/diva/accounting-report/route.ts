/**
 * POST /api/diva/accounting-report — Proxy vers DIVA POST /diva/accounting/report
 * Sprint 13 T76 — Retourne le DOCX binaire en passthrough.
 */
import { NextRequest, NextResponse } from "next/server";

const DIVA_URL = process.env.DIVA_URL || process.env.VAULT_URL || "http://localhost:8080";
const TIMEOUT_MS = 30_000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Corps JSON invalide." } },
      { status: 400 }
    );
  }

  const tenant = (body.context as Record<string, unknown>)?.tenant as string ?? "unknown";
  const dateStart = (body.context as Record<string, unknown>)?.date_start as string ?? "";
  const dateEnd = (body.context as Record<string, unknown>)?.date_end as string ?? "";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const base = DIVA_URL.replace(/\/$/, "");
    const res = await fetch(`${base}/diva/accounting/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }

    const docxBuffer = await res.arrayBuffer();
    const filename = `synthese-comptable-${tenant}-${dateStart}_${dateEnd}.docx`;

    return new NextResponse(docxBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { error: { code: isTimeout ? "TIMEOUT" : "SERVICE_UNAVAILABLE", message: "Rapport DOCX indisponible." } },
      { status: isTimeout ? 408 : 503 }
    );
  }
}
