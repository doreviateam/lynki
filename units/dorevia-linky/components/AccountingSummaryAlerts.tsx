"use client";

/**
 * Sprint 18 T103 — Points d'attention V1.
 * Affiche les faits récents / écarts si disponibles ; sinon état vide noble (plan §8.4).
 */

interface AccountingSummaryAlertsProps {
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
}

export function AccountingSummaryAlerts({ period }: AccountingSummaryAlertsProps) {
  /* V1 : pas de backend dédié "points d'attention" ; on affiche l'état vide noble.
     Sprint 19+ pourra brancher un endpoint réel. */

  return (
    <div className="sv2-card sv2-card-highlight p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="sv2-label text-[var(--sv2-text-muted)]">Points d&apos;attention</p>
          <h3 className="mt-1 text-lg font-bold text-[var(--sv2-text)]">Faits récents sur la période</h3>
        </div>
      </div>

      <div className="sv2-empty">
        <svg className="sv2-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-medium text-[var(--sv2-text)]">
          Aucun écart notable sur la période et le périmètre sélectionnés.
        </p>
        <p className="mt-2 text-xs text-[var(--sv2-text-muted)]">
          Période : {period.from} → {period.to}
        </p>
        <p className="mt-1 text-[10px] text-[var(--sv2-text-muted)]">
          Les points d&apos;attention seront alimentés quand un moteur de détection sera disponible.
        </p>
      </div>
    </div>
  );
}
