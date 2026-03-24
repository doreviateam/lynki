"use client";

/**
 * Sprint 18 T103 — Documentation / préparation CODIR V1.
 * Lien vers les exports existants (DOCX Diva, CSV). Pas de surpromesse.
 */

interface AccountingSummaryCodirBlockProps {
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
  onExportDocx?: () => void;
  docxAvailable: boolean;
}

export function AccountingSummaryCodirBlock({
  period,
  onExportDocx,
  docxAvailable,
}: AccountingSummaryCodirBlockProps) {
  return (
    <div className="sv2-card sv2-card-highlight p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="sv2-label text-[var(--sv2-accent)]">Préparation documentaire</p>
          <h3 className="mt-1 text-lg font-bold text-[var(--sv2-text)]">Export &amp; documentation</h3>
        </div>
      </div>

      <div className="space-y-3">
        <div className="sv2-inner p-4">
          <p className="text-sm font-semibold text-[var(--sv2-text)]">Rapport de synthèse</p>
          <p className="mt-1 text-xs text-[var(--sv2-text-muted)]">
            Inclut la lecture Diva et les éléments comptables disponibles sur la période {period.from} → {period.to}.
          </p>
        </div>

        {docxAvailable && onExportDocx ? (
          <button type="button" onClick={onExportDocx} className="sv2-btn-primary sv2-btn w-full text-center">
            Générer le rapport DOCX
          </button>
        ) : (
          <div className="sv2-inner p-4 text-center">
            <p className="text-xs text-[var(--sv2-text-muted)]">
              L&apos;export DOCX est disponible depuis le bloc Diva (ci-dessus).
            </p>
          </div>
        )}

        <p className="sv2-ref">
          Exports disponibles : DOCX (via Diva) · CSV rubriques (via les blocs Bilan / CdR).
        </p>
      </div>
    </div>
  );
}
