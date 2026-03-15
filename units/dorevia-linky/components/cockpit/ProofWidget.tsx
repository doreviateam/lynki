"use client";

import { Badge } from "./Badge";

export interface ProofSource {
  name: string;
  status: string;
  variant: "success" | "warning";
}

export interface ProofWidgetProps {
  percentage: number;
  sources: ProofSource[];
}

const CIRCUMFERENCE = 2 * Math.PI * 70;

export function ProofWidget({ percentage, sources }: ProofWidgetProps) {
  const offset = Math.round(CIRCUMFERENCE * (1 - percentage / 100));

  return (
    <section
      className="bg-linky-surface border border-linky-border rounded-linky-card p-linky-padding mb-6 transition-colors duration-linky ease-out hover:bg-linky-hover"
      aria-label="Couverture probante"
    >
      <h3 className="m-0 text-linky-title text-linky-muted font-medium mb-4">
        Couverture probante
      </h3>
      <div className="flex flex-col lg:flex-row lg:items-center gap-8">
        <div className="flex-shrink-0 relative w-[140px] h-[140px] mx-auto lg:mx-0">
          <svg
            width="140"
            height="140"
            viewBox="0 0 140 140"
            className="rotate-[-90deg]"
            aria-hidden
          >
            <circle
              cx="70"
              cy="70"
              r="70"
              fill="none"
              stroke="#14243A"
              strokeWidth="10"
            />
            <circle
              cx="70"
              cy="70"
              r="70"
              fill="none"
              stroke="#22C55E"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-500 ease-out"
            />
          </svg>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[26px] font-semibold"
            aria-live="polite"
          >
            {percentage} %
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2 text-linky-small text-linky-muted">
          {sources.map((source) => (
            <div
              key={source.name}
              className="flex justify-between items-center"
            >
              <span>{source.name}</span>
              <Badge variant={source.variant}>{source.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
