/**
 * GET /api/diva/jobs/[contextHash] — Proxy vers DIVA GET /diva/jobs/{context_hash}
 * Poll pour récupérer le résultat d'un job async
 * SPEC : ZeDocs/web22/SPEC_DIVA_Async_Persistent_Analysis_Store_v1.0.md
 */

import { NextRequest, NextResponse } from "next/server";

const DIVA_URL = process.env.DIVA_URL || "http://diva:8010";
const TIMEOUT_MS = 5000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { contextHash: string } }
) {
  let contextHash = params.contextHash;
  if (!contextHash) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "context_hash manquant" } },
      { status: 400 }
    );
  }
  // DIVA store utilise le hash brut ; le préfixe "sha256:" pose problème au routeur Fiber dans l'URL
  if (contextHash.startsWith("sha256:")) {
    contextHash = contextHash.slice(7);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const base = DIVA_URL.replace(/\/$/, "");
    const res = await fetch(`${base}/diva/jobs/${contextHash}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (res.status === 404) {
      return NextResponse.json(
        data?.error ?? { code: "NOT_FOUND", message: "Job inconnu ou expiré." },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    clearTimeout(timeoutId);

    return NextResponse.json(
      {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Lecture DIVA momentanément indisponible.",
        },
      },
      { status: 503 }
    );
  }
}
