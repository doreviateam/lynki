"use client";

import { SkeletonCard } from "./SkeletonCard";

export function CockpitSkeleton() {
  return (
    <main
      className="max-w-[1200px] mx-auto px-6 py-6 space-y-6 bg-linky-bg min-h-screen"
      aria-label="Chargement du cockpit"
    >
      <div className="flex justify-between h-10 animate-pulse bg-linky-bg-secondary rounded" />
      <div className="h-20 animate-pulse bg-linky-bg-secondary rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} variant="kpi" />
        ))}
      </div>
      <SkeletonCard variant="proof" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard variant="chart" />
        <SkeletonCard variant="table" />
      </div>
    </main>
  );
}
