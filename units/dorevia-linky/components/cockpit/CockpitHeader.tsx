"use client";

import { Badge } from "./Badge";

export interface CockpitHeaderProps {
  tenantName: string;
  period: string;
  fluxBadge?: "validé" | "partiel" | "à vérifier";
  sourceBadge?: string;
}

const fluxBadgeVariant = {
  validé: "success" as const,
  partiel: "warning" as const,
  "à vérifier": "danger" as const,
};

export function CockpitHeader({
  tenantName,
  period,
  fluxBadge = "validé",
  sourceBadge = "Vault",
}: CockpitHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-6">
      <div className="text-xl font-semibold tracking-[0.02em]">
        Linky — Cockpit financier
      </div>
      <div className="flex flex-wrap items-center gap-2.5 text-sm text-linky-muted">
        <span>
          {tenantName} • {period}
        </span>
        <Badge variant={fluxBadgeVariant[fluxBadge]}>
          {fluxBadge === "validé" ? "Flux validés" : fluxBadge === "partiel" ? "Partiel" : "À vérifier"}
        </Badge>
        <Badge variant="info">{sourceBadge}</Badge>
      </div>
    </header>
  );
}
