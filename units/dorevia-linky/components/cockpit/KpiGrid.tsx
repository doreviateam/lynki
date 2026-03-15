"use client";

import { KpiCard, type KpiCardProps } from "./KpiCard";

interface KpiGridProps {
  items: KpiCardProps[];
}

export function KpiGrid({ items }: KpiGridProps) {
  const displayItems = items.slice(0, 4);

  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 tablet:grid-cols-4 gap-linky-gap mb-linky-gap-lg"
      aria-label="Indicateurs clés de performance"
    >
      {displayItems.map((item, index) => (
        <KpiCard key={index} {...item} />
      ))}
    </section>
  );
}
