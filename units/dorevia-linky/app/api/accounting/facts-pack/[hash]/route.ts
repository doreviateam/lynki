import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const TIMEOUT_MS = 5000;

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  const { hash } = params;
  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant");

  if (!tenant) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "tenant requis" },
      { status: 400 }
    );
  }

  const vaultParams = new URLSearchParams({ tenant });
  const source = searchParams.get("source");
  if (source) {
    vaultParams.set("source", source);
  }

  const base = VAULT_URL.replace(/\/$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `${base}/api/accounting/facts-pack/${encodeURIComponent(hash)}?${vaultParams}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (res.status === 404) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    if (res.status === 409) {
      const body = await res.json();
      return NextResponse.json(body, { status: 409 });
    }

    if (res.status === 400) {
      const body = await res.json();
      return NextResponse.json(body, { status: 400 });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "UPSTREAM_ERROR", status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json(
      { error: "UPSTREAM_UNAVAILABLE", message: "Vault timeout" },
      { status: 502 }
    );
  }
}
