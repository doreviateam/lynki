import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_TENANT = process.env.TENANT_ID || "core";
const LOCKED_TENANT = (process.env.TENANT_ID || "").trim();

/**
 * GET /api/tenant-config — config chrome + workspace pour un tenant (spec §3.1).
 * Phase 1 : retourne une config mock dérivée de l’env TENANT_ID (et de la query tenant si cohérent).
 * Backend dédié pourra remplacer plus tard (DECISIONS_PHASE0).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedTenant = searchParams.get("tenant");

  if (LOCKED_TENANT && requestedTenant && requestedTenant !== LOCKED_TENANT) {
    return NextResponse.json(
      { error: "tenant_mismatch", message: "Tenant non autorisé pour ce déploiement." },
      { status: 403 }
    );
  }

  const tenant = LOCKED_TENANT || requestedTenant || DEFAULT_TENANT;

  const config = {
    configVersion: "1.0",
    chrome: {
      branding: {
        productName: "Dorevia Lynki",
        tagline: tenant === "laplatine2026" ? "Cockpit La Platine" : tenant === "o19" ? "Cockpit O19" : undefined,
      },
      header: {
        showCompanyFilter: true,
        showPeriodFilter: true,
        showPinChrome: true,
      },
      footer: {
        showTrustDrawer: true,
        vaultLinkLabel: "Vault",
      },
      behavior: {
        allowAutoHide: true,
        defaultChromePinned: false,
      },
    },
    workspace: {
      apps: [],
      sources: [],
    },
    permissions: {} as Record<string, unknown>,
    availableTenants: [
      { id: "laplatine2026", label: "La Platine" },
      { id: "o19", label: "O19" },
    ],
  };

  return NextResponse.json(config);
}
