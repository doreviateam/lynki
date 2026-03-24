"use client";

import { IconZReport } from "@/components/CardIcons";
import { INSTRUMENT_CARD_BASE, InstrumentCardHeader, InstrumentCardNav } from "@/components/InstrumentCardChrome";
import type { CardId } from "@/app/types/linky-tiles";

interface PosComingSoonViewProps {
  title: string;
  onFocusRequest?: () => void;
  footer?: React.ReactNode;
  cardId?: CardId;
  onNavigateToCard?: (cardId: CardId) => void;
  onBackToCockpit?: () => void;
}

export function PosComingSoonView({ title, onFocusRequest, footer, cardId, onNavigateToCard, onBackToCockpit }: PosComingSoonViewProps) {
  const iconNode = onFocusRequest ? (
    <button
      type="button"
      onClick={onFocusRequest}
      className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors"
      aria-label={`Ouvrir la card ${title}`}
    >
      <IconZReport className="h-6 w-6 shrink-0 text-[var(--accent)]" />
    </button>
  ) : (
    <IconZReport className="h-6 w-6 shrink-0 text-[var(--accent)]" />
  );

  return (
    <section className={INSTRUMENT_CARD_BASE} role="region" aria-label={`Instrument ${title} — bientôt disponible`}>
      {cardId && onNavigateToCard && (
        <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} onBackToCockpit={onBackToCockpit} />
      )}
      <InstrumentCardHeader icon={iconNode} title={title} />
      <p className="text-[var(--text-muted)]">Bientôt disponible</p>
      {footer}
    </section>
  );
}
