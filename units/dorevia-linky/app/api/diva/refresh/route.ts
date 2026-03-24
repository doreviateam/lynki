/**
 * POST /api/diva/refresh — Force régénération d'un insight
 * Appelle DIVA POST /diva/generate avec force_refresh pour contourner le cache.
 * Bloquant (attend la réponse Mistral). SPEC_REGLES_INFERENCE — test du prompt Focus Card.
 */

import { NextRequest, NextResponse } from "next/server";
import type { DashboardMetricsResponse, KpiMetric } from "@/app/api/dashboard-metrics/route";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const REFRESH_TIMEOUT_MS = parseInt(process.env.DIVA_REFRESH_TIMEOUT_MS || "120000", 10); // 120s — Mistral peut prendre 30–60 s

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
];

const FOCUS_CARD_DETAILS_KEYS: Record<string, string> = {
  treasury_validated_pct: "treasury",
  cash: "cash",
  business: "business",
  credit_notes: "credit_notes",
  refunds: "refunds",
};

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

interface RefreshRequestBody {
  context?: {
    tenant?: string;
    company_id?: number;
    date_debut?: string;
    date_fin?: string;
    partner_name?: string;
  };
  dashboard: DashboardMetricsResponse;
  focus_card?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RefreshRequestBody = await request.json();
    const context = body.context ?? {};
    const metrics = body.dashboard;
    const focusCard = body.focus_card ?? "";

    if (!metrics) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "dashboard requis" } },
        { status: 400 }
      );
    }

    let cards = metricsToCards(metrics);
    const options: Record<string, unknown> = {
      mode: "flash",
      force_refresh: true,
      prewarm: false,
    };

    if (focusCard) {
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
        timezone: "Europe/Paris",
        currency: "EUR",
        locale: "fr-FR",
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
    const timeoutId = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);

    const base = VAULT_URL.replace(/\/$/, "");
    const res = await fetch(`${base}/ui/diva/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Tenant": context.tenant ?? DEFAULT_TENANT },
      body: JSON.stringify(divaBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 200) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }
    if (res.status === 204) {
      return NextResponse.json({ status: "ok", message: "Insight déjà frais" }, { status: 200 });
    }
    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(errData ?? { error: { message: "Erreur DIVA" } }, { status: res.status });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      {
        error: {
          code: isTimeout ? "TIMEOUT" : "SERVICE_UNAVAILABLE",
          message: isTimeout ? "Génération trop longue." : "DIVA indisponible.",
        },
      },
      { status: isTimeout ? 408 : 503 }
    );
  }
}
