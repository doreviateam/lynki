/**
 * POST /api/diva/explain — Proxy vers le service DIVA
 * Transforme dashboard-metrics (format Linky) → format cards (SPEC DIVA)
 * SPEC : ZeDocs/web22/SPEC_DIVA_API_v1.0.md
 * Plan : ZeDocs/web22/PLAN_IMPLEMENTATION_DIVA_SCRUM_v1.0.md
 */

import { NextRequest, NextResponse } from "next/server";
import type { DashboardMetricsResponse, KpiMetric } from "@/app/api/dashboard-metrics/route";

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const DEFAULT_TENANT = process.env.TENANT_ID || "core";
// Mistral local (cold start) peut dépasser 30 s ; marge 60 s
const TIMEOUT_UX_MS = parseInt(process.env.DIVA_TIMEOUT_MS || "60000", 10);

// Table de correspondance : clé dashboard-metrics → { key SPEC, label, unit, detailsKey }
type KpiMetricKey = Exclude<keyof DashboardMetricsResponse, "_details">;

const CARD_MAPPING: Array<{
  dmKey: KpiMetricKey;
  specKey: string;
  label: string;
  unit: string;
  detailsKey?: keyof NonNullable<DashboardMetricsResponse["_details"]>;
}> = [
  // treasury.value = solde validé en EUR (validatedBalance) — clé "treasury_validated_pct" pour compat Diva engine
  { dmKey: "treasury", specKey: "treasury_validated_pct", label: "Trésorerie", unit: "EUR", detailsKey: "treasury" },
  // treasury_position.value = % restant à rapprocher
  { dmKey: "treasury_position", specKey: "treasury_position", label: "Couverture trésorerie", unit: "%", detailsKey: "treasury" },
  // cash.value = flux net (encaissements − décaissements) = card FLUX NET
  { dmKey: "cash", specKey: "cash", label: "Flux net", unit: "EUR", detailsKey: "cash" },
  { dmKey: "business", specKey: "business", label: "Activité commerciale", unit: "EUR", detailsKey: "business" },
  { dmKey: "taxes", specKey: "taxes", label: "Taxes", unit: "EUR" },
  { dmKey: "credit_notes", specKey: "credit_notes", label: "Notes de crédit", unit: "EUR", detailsKey: "credit_notes" },
  { dmKey: "refunds", specKey: "refunds", label: "Remboursements", unit: "EUR", detailsKey: "refunds" },
  { dmKey: "pos_shops", specKey: "pos_shops", label: "POS", unit: "EUR", detailsKey: "pos_shops" },
  { dmKey: "pos_z", specKey: "pos_z", label: "Z de caisse", unit: "EUR" },
  // Cards secondaires — transmises à Diva pour faits traçables
  { dmKey: "working_capital", specKey: "bfr", label: "BFR", unit: "EUR" },
  { dmKey: "encours", specKey: "encours", label: "Encours clients", unit: "EUR" },
  { dmKey: "ebitda", specKey: "ebe", label: "EBE", unit: "EUR" },
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

interface ExplainRequestBody {
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
  options?: {
    mode?: string;
    force_refresh?: boolean;
    focus_card?: string;
  };
}

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_UX_MS);

  try {
    const body: ExplainRequestBody = await request.json();

    const context = body.context ?? {};
    const metrics = body.dashboard;
    const options = body.options ?? {};

    if (!metrics) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "dashboard requis" } },
        { status: 400 }
      );
    }

    const cards = metricsToCards(metrics);

    const focusCard = options.focus_card;
    const details = metrics._details;
    const mapping = CARD_MAPPING.find((m) => m.specKey === focusCard);
    const focusCardDetails =
      focusCard && mapping?.detailsKey && details?.[mapping.detailsKey]
        ? details[mapping.detailsKey]
        : undefined;

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
        _details: details ?? undefined,
        data_completeness: metrics.data_completeness ?? { bank_health_metrics: "absent" as const },
      },
      options: {
        mode: options.mode ?? "flash",
        force_refresh: options.force_refresh ?? false,
        ...(focusCard && { focus_card: focusCard }),
        ...(focusCardDetails && { focus_card_details: focusCardDetails }),
      },
    };

    const base = VAULT_URL.replace(/\/$/, "");
    const res = await fetch(`${base}/ui/diva/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Tenant": context.tenant ?? DEFAULT_TENANT },
      body: JSON.stringify(divaBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (res.status === 408 || res.status === 503) {
      return NextResponse.json(
        {
          error: {
            code: res.status === 408 ? "MISTRAL_TIMEOUT" : "SERVICE_UNAVAILABLE",
            message: "Lecture DIVA momentanément indisponible. Les cartes restent consultables.",
          },
        },
        { status: res.status }
      );
    }

    if (!res.ok) {
      return NextResponse.json(data ?? { error: { code: "UNKNOWN", message: "Erreur DIVA" } }, {
        status: res.status,
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    clearTimeout(timeoutId);

    const isTimeout = err instanceof Error && err.name === "AbortError";

    return NextResponse.json(
      {
        error: {
          code: isTimeout ? "MISTRAL_TIMEOUT" : "SERVICE_UNAVAILABLE",
          message: "Lecture DIVA momentanément indisponible. Les cartes restent consultables.",
        },
      },
      { status: isTimeout ? 408 : 503 }
    );
  }
}
