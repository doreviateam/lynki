import { NextRequest, NextResponse } from "next/server";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DVIG_URL = process.env.DVIG_URL || "";
const DVIG_INTERNAL_TOKEN = process.env.DVIG_INTERNAL_TOKEN || "";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const TIMEOUT_MS = 5000; // Réactivité footer — ne pas bloquer l'affichage

export const revalidate = 0;
export const dynamic = "force-dynamic";

type IntegrityState = "STATE_OK" | "STATE_PARTIAL" | "STATE_ALERT";

/**
 * GET /api/platform/status — agrège vault-health pour l'Integrity State Machine (SPEC v1.3).
 * Dérive integrity_state à partir des données disponibles.
 */
export async function GET(request: NextRequest) {
  const tenant = new URL(request.url).searchParams.get("tenant") ?? DEFAULT_TENANT;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let vaultRate: number | null = null;
  let pendingEvents = 0;
  let failedEvents = 0;
  let lastSyncAt: string | null = null;
  let vaultStatus: "ok" | "error" = "ok";
  let sealedCountTotal: number | null = null;

  // SPEC Footer stratégique — sealed_count total tenant (période large 2000-2030)
  const fetchSealedCountTotal = async (): Promise<number | null> => {
    try {
      const base = VAULT_URL.replace(/\/$/, "");
      const params = new URLSearchParams({
        tenant,
        date_debut: "2000-01-01",
        date_fin: "2030-12-31",
      });
      const res = await fetch(`${base}/ui/completeness-snapshot?${params}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { sealed_count?: number };
      return typeof data.sealed_count === "number" ? data.sealed_count : null;
    } catch {
      return null;
    }
  };

  const fetchDvig = async (): Promise<Response | null> => {
    if (!DVIG_URL || !DVIG_INTERNAL_TOKEN) return null;
    try {
      return await fetch(
        `${DVIG_URL.replace(/\/$/, "")}/internal/vault-health?tenant=${encodeURIComponent(tenant)}`,
        {
          headers: { Accept: "application/json", Authorization: `Bearer ${DVIG_INTERNAL_TOKEN}` },
          cache: "no-store",
          signal: controller.signal,
        }
      );
    } catch {
      return null;
    }
  };

  try {
    let res: Response;
    const [vaultRes, sealedTotal] = await Promise.all([
      (async () => {
        try {
          const vaultUrl = `${VAULT_URL.replace(/\/$/, "")}/ui/system/vault-health?tenant=${encodeURIComponent(tenant)}`;
          let r = await fetch(vaultUrl, {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          });
          if ((r.status === 404 || !r.ok) && DVIG_URL && DVIG_INTERNAL_TOKEN) {
            const dvigRes = await fetchDvig();
            if (dvigRes?.ok) r = dvigRes;
          }
          return r;
        } catch (err) {
          console.error("[platform/status] Vault fetch failed:", err instanceof Error ? err.message : err);
          return (await fetchDvig()) ?? new Response(null, { status: 502 });
        }
      })(),
      fetchSealedCountTotal(),
    ]);
    res = vaultRes;
    sealedCountTotal = sealedTotal;
    clearTimeout(timeoutId);
    if (res.ok) {
      try {
        const data = (await res.json()) as {
          vault_rate?: number | null;
          pending_events?: number;
          failed_events?: number;
          last_sync_at?: string | null;
        };
        // vault_rate : ratio 0-1 (Linky) ou % 0-100 (DVIG spec) — normaliser en 0-1
        const raw = data.vault_rate ?? null;
        vaultRate = raw != null ? (raw > 1 ? raw / 100 : raw) : null;
        pendingEvents = data.pending_events ?? 0;
        failedEvents = data.failed_events ?? 0;
        lastSyncAt = data.last_sync_at ?? null;
      } catch (parseErr) {
        console.error("[platform/status] JSON parse failed:", parseErr instanceof Error ? parseErr.message : parseErr);
        vaultStatus = "error";
      }
    } else {
      vaultStatus = "error";
      console.error("[platform/status] Vault/DVIG returned", res?.status ?? "?");
    }
  } catch (err) {
    clearTimeout(timeoutId);
    vaultStatus = "error";
    console.error("[platform/status] Outer catch:", err instanceof Error ? err.message : err);
  }

  const environment = process.env.NODE_ENV === "production" ? "prod" : "lab";

  // Integrity State Machine (spec §3)
  let integrityState: IntegrityState = "STATE_OK";
  let tooltipCause = "";

  if (vaultStatus !== "ok" || (failedEvents > 0 && (vaultRate == null || vaultRate < 0.5))) {
    integrityState = "STATE_ALERT";
    tooltipCause = vaultStatus !== "ok" ? "Vault indisponible" : "Événements en échec";
  } else if (
    pendingEvents > 0 ||
    (vaultRate != null && vaultRate < 1.0) ||
    failedEvents > 0
  ) {
    integrityState = "STATE_PARTIAL";
    if (pendingEvents > 0) tooltipCause = `${pendingEvents} événement(s) en attente`;
    else if (vaultRate != null && vaultRate < 1.0) tooltipCause = `Ratio scellé ${((vaultRate ?? 0) * 100).toFixed(0)} %`;
    else if (failedEvents > 0) tooltipCause = `${failedEvents} événement(s) en échec`;
  }

  // LAB mode gradué : assouplir STATE_OK
  if (environment === "lab" && integrityState === "STATE_PARTIAL") {
    if (vaultRate != null && vaultRate >= 0.98 && pendingEvents < 10) {
      integrityState = "STATE_OK";
      tooltipCause = "";
    }
  }

  const lastSyncFormatted = lastSyncAt
    ? (() => {
        const d = new Date(lastSyncAt);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${pad(d.getFullYear() % 100)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      })()
    : null;

  // SPEC Footer stratégique — "Dernier scellé : X s" (temps relatif)
  const lastSealAgoSeconds = lastSyncAt
    ? Math.max(0, Math.floor((Date.now() - new Date(lastSyncAt).getTime()) / 1000))
    : null;

  return NextResponse.json({
    environment,
    integrity_state: integrityState,
    vault_status: vaultStatus,
    sealed_ratio: vaultRate ?? 0,
    sealed_pct: vaultRate != null ? Math.round((vaultRate ?? 0) * 100) : null,
    pending_events: pendingEvents,
    failed_events: failedEvents,
    tooltip_cause: tooltipCause || null,
    sources: [{ name: "odoo", status: "ok" }, { name: "pos", status: "ok" }],
    last_sync: lastSyncAt,
    last_sync_formatted: lastSyncFormatted,
    last_seal_ago_seconds: lastSealAgoSeconds,
    sealed_count_total: sealedCountTotal,
    version: process.env.LINKY_VERSION ?? "1.0.0",
  });
}
