"use client";

import { Badge, type BadgeVariant } from "./Badge";

export interface InsightCardProps {
  text: string;
  badge?: { label: string; variant: BadgeVariant };
  borderVariant?: "warning" | "success" | "danger";
}

const borderColors = {
  warning: "border-l-linky-warning",
  success: "border-l-linky-success",
  danger: "border-l-linky-danger",
};

export function InsightCard({
  text,
  badge,
  borderVariant = "warning",
}: InsightCardProps) {
  return (
    <section
      className={`bg-linky-bg-secondary border border-linky-border border-l-4 ${borderColors[borderVariant]} rounded-lg p-4 mb-6`}
      aria-label="Insight principal"
    >
      <strong>Insight</strong>
      <br />
      <span className="inline-block mt-1">{text}</span>
      {badge && (
        <span className="inline-block mt-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </span>
      )}
    </section>
  );
}
