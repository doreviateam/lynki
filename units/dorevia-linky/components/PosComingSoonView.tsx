"use client";

import { IconZReport } from "@/components/CardIcons";

interface PosComingSoonViewProps {
  title: string;
  onFocusRequest?: () => void;
  footer?: React.ReactNode;
}

export function PosComingSoonView({ title, onFocusRequest, footer }: PosComingSoonViewProps) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-[var(--shadow-card)] border-l-4 border-l-[var(--muted)]">
      <div className="flex items-center justify-center gap-2 border-b border-[var(--border)] pb-3 mb-4">
        {onFocusRequest ? (
          <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label={`Ouvrir la card ${title}`}>
            <IconZReport className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          </button>
        ) : (
          <IconZReport className="h-6 w-6 shrink-0 text-[var(--accent)]" />
        )}
        <p className="text-lg font-bold uppercase tracking-wide text-[var(--accent)]">{title}</p>
      </div>
      <p className="text-center text-[var(--muted)]">Bientôt disponible</p>
      {footer}
    </section>
  );
}
