"use client";

interface SkeletonCardProps {
  variant?: "kpi" | "chart" | "table" | "proof";
}

const variantHeights: Record<string, string> = {
  kpi: "h-24",
  chart: "h-64",
  table: "h-48",
  proof: "h-40",
};

export function SkeletonCard({ variant = "kpi" }: SkeletonCardProps) {
  return (
    <div
      className={`bg-linky-bg-secondary animate-pulse rounded-linky-card ${variantHeights[variant]}`}
      aria-hidden
    />
  );
}
