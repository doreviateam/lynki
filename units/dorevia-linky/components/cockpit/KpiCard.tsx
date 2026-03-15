"use client";

import { Badge, type BadgeVariant } from "./Badge";

export interface KpiCardProps {
  title: string;
  value: string | number;
  delta?: {
    text: string;
    variant?: "success" | "danger" | "neutral";
  };
  subtitle?: string;
  badge?: { label: string; variant: BadgeVariant };
}

const deltaStyles: Record<string, string> = {
  success: "text-linky-success",
  danger: "text-linky-danger",
  neutral: "text-linky-muted",
};

export function KpiCard({ title, value, delta, subtitle, badge }: KpiCardProps) {
  return (
    <div className="bg-linky-surface border border-linky-border rounded-linky-card p-linky-padding transition-colors duration-linky ease-out hover:bg-linky-hover">
      <div className="text-linky-small text-linky-muted">{title}</div>
      <div className="text-linky-kpi font-semibold text-linky-text">{value}</div>
      {delta && (
        <div
          className={`text-linky-small mt-1 ${deltaStyles[delta.variant ?? "neutral"]}`}
        >
          {delta.text}
        </div>
      )}
      {subtitle && (
        <div className="text-linky-small text-linky-muted mt-1">{subtitle}</div>
      )}
      {badge && (
        <div className="mt-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      )}
    </div>
  );
}
