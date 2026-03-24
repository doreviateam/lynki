/**
 * POST /api/diva/prewarm — Fire-and-forget DIVA warm-up
 * SPEC : ZeDocs/web22/SPEC_DIVA_Warmup_Runner_CODIR_v1.0.md
 * Déclenche un job DIVA en arrière-plan sans bloquer l'UI.
 * Toujours 204, erreurs silencieuses (logs serveur uniquement).
 */

import { NextRequest, NextResponse } from "next/server";
import type { DashboardMetricsResponse, KpiMetric } from "@/app/api/dashboard-metrics/route";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
// SPEC v1.1: warmup fire-and-forget court (500–1000 ms), sans bloquer l'UI.
const PREWARM_TIMEOUT_MS = parseInt(process.env.DIVA_PREWARM_TIMEOUT_MS || "700", 10);
const PREWARM_ENABLED = process.env.DIVA_PREWARM_ENABLED !== "false";

type KpiMetricKey = Exclude<keyof DashboardMetricsResponse, "_details">;

const CARD_MAPPING: Array<{
  dmKey: KpiMetricKey;
  specKey: string;
  label: string;
  unit: string;
}> = [
  { dmKey: "treasury", specKey: "treasury_validated_pct", label: "Trésorerie validée", unit: "%" },
  { dmKey: "treasury_position", specKey: "treasury_position", label: "Position trésorerie", unit: "EUR" },
  { dmKey: "cash", specKey: "cash", label: "Cash", unit: "EUR" },
  { dmKey: "business", specKey: "business", label: "Business", unit: "EUR" },
  { dmKey: "taxes", specKey: "taxes", label: "Taxes", unit: "EUR" },
  { dmKey: "credit_notes", specKey: "credit_notes", label: "Notes de crédit", unit: "EUR" },
  { dmKey: "refunds", specKey: "refunds", label: "Remboursements", unit: "EUR" },
  { dmKey: "pos_shops", specKey: "pos_shops", label: "POS magasins", unit: "EUR" },
  { dmKey: "pos_z", specKey: "pos_z", label: "Z de caisse", unit: "EUR" },
  { dmKey: "working_capital", specKey: "bfr", label: "BFR", unit: "EUR" },
  { dmKey: "ebitda", specKey: "ebe", label: "EBE", unit: "EUR" },
  { dmKey: "encours", specKey: "encours", label: "Encours clients", unit: "EUR" },
];

function metricsToCards(metrics: DashboardMetricsResponse) {
  return CARD_MAPPING.map(({ dmKey, specKey, label, unit }) => {
    const m = metrics[dmKey] as KpiMetric | undefined;
    return {
      key: specKey,
      label,
      value: m?.value ?? null,
      formatted: m?.formatted ?? "—",
      unit,
    };
  });
}

export const revalidate = 0;
export const dynamic = "force-dynamic";

interface PrewarmRequestBody {
  context?: {
    tenant?: string;
    company_id?: number;
    date_debut?: string;
    date_fin?: string;
    timezone?: string;
    currency?: string;
    locale?: string;
    partner_name?: string;
  };
  dashboard?: DashboardMetricsResponse;
  /** Carte ciblée (focus_card) — si présent, génère uniquement cette carte. Phase 2 SPEC_REGLES_INFERENCE. */
  focus_card?: string;
  options?: { mode?: string; force_refresh?: boolean; prewarm?: boolean };
}

/** Mapping spec key → _details key pour focus_card_details (cartes avec détails) */
const FOCUS_CARD_DETAILS_KEYS: Record<string, string> = {
  treasury_validated_pct: "treasury",
  treasury_position: "treasury",
  cash: "cash",
  business: "business",
  credit_notes: "credit_notes",
  refunds: "refunds",
};

export async function POST(request: NextRequest) {
  if (!PREWARM_ENABLED) {
    return new NextResponse(null, { status: 204 });
  }

  const start = Date.now();

  try {
    const body: PrewarmRequestBody = await request.json();
    const context = body.context ?? {};
    const metrics = body.dashboard;
    const focusCard = body.focus_card ?? "";

    if (!metrics) {
      return new NextResponse(null, { status: 204 });
    }

    let cards = metricsToCards(metrics);
    const forceRefresh = body.options?.force_refresh === true;
    const options: Record<string, unknown> = {
      mode: "flash",
      force_refresh: forceRefresh,
      prewarm: !forceRefresh,
    };

    if (focusCard) {
      // Mode Focus Card : une seule carte + focus_card_details
      const mapping = CARD_MAPPING.find((m) => m.specKey === focusCard);
      if (mapping) {
        const card = cards.find((c) => c.key === focusCard);
        if (card) {
          cards = [card];
          options.focus_card = focusCard;
          const detailsKey = FOCUS_CARD_DETAILS_KEYS[focusCard];
          const details = detailsKey && metrics._details?.[detailsKey as keyof typeof metrics._details];
          if (details && typeof details === "object") {
            options.focus_card_details = details;
          }
        }
      }
    }

    const divaBody = {
      context: {
        tenant: context.tenant ?? DEFAULT_TENANT,
        company_id: context.company_id ?? 0,
        date_start: context.date_debut ?? "2000-01-01",
        date_end: context.date_fin ?? "2030-12-31",
        timezone: context.timezone ?? "Europe/Paris",
        currency: context.currency ?? "EUR",
        locale: context.locale ?? "fr-FR",
        ...(context.partner_name && { partner_name: context.partner_name }),
      },
      dashboard: {
        cards,
        _details: metrics._details,
        data_completeness: metrics.data_completeness ?? { bank_health_metrics: "absent" as const },
      },
      options,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PREWARM_TIMEOUT_MS);

    const base = VAULT_URL.replace(/\/$/, "");
    const res = await fetch(`${base}/ui/diva/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Tenant": context.tenant ?? DEFAULT_TENANT },
      body: JSON.stringify(divaBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;

    if (process.env.NODE_ENV !== "test") {
      console.info(
        JSON.stringify({
          event: "diva_prewarm",
          tenant: context.tenant ?? DEFAULT_TENANT,
          company_id: context.company_id ?? 0,
          date_start: context.date_debut,
          date_end: context.date_fin,
          focus_card: focusCard || undefined,
          status: res.status,
          latency_ms: latencyMs,
        })
      );
    }
  } catch (err) {
    const latencyMs = Date.now() - start;
    const status = err instanceof Error && err.name === "AbortError" ? "timeout" : "error";
    if (process.env.NODE_ENV !== "test") {
      console.info(
        JSON.stringify({
          event: "diva_prewarm",
          status,
          latency_ms: latencyMs,
        })
      );
    }
  }

  return new NextResponse(null, { status: 204 });
}
