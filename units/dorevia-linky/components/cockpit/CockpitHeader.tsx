"use client";

import { Badge } from "./Badge";
import {
  COCKPIT_FLUX_INTEGRITY,
  type CockpitFluxIntegrityLevel,
} from "@/app/lib/cockpit/ui-state-labels";

export interface CockpitHeaderProps {
  tenantName: string;
  period: string;
  fluxBadge?: CockpitFluxIntegrityLevel;
  sourceBadge?: string;
}

export function CockpitHeader({
  tenantName,
  period,
  fluxBadge = "reliable",
  sourceBadge = "Vault",
}: CockpitHeaderProps) {
  const flux = COCKPIT_FLUX_INTEGRITY[fluxBadge];
  return (
    <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-6">
      <div className="text-xl font-semibold tracking-[0.02em]">
        Linky — Cockpit financier
      </div>
      <div className="flex flex-wrap items-center gap-2.5 text-sm text-linky-muted">
        <span>
          {tenantName} • {period}
        </span>
        <Badge variant={flux.badgeVariant}>{flux.label}</Badge>
        <Badge variant="info">{sourceBadge}</Badge>
      </div>
    </header>
  );
}
