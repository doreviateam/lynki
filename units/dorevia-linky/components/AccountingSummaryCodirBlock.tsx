"use client";

/**
 * Sprint 18 T103 — Documentation / préparation CODIR V1.
 * Lien vers les exports existants (DOCX Diva, CSV). Pas de surpromesse.
 */

interface AccountingSummaryCodirBlockProps {
  tenantId: string;
  companyId: string | null;
  companyLabel: string;
  period: { from: string; to: string };
  onExportDocx?: () => void;
  docxAvailable: boolean;
}

export function AccountingSummaryCodirBlock({
  period,
  companyLabel,
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
            Document Word généré par Diva à partir d’agrégats sur {period.from} → {period.to}, {companyLabel}. Ce n’est pas un export
            unique du dossier ni un regroupement des CSV des blocs.
          </p>
        </div>

        {docxAvailable && onExportDocx ? (
          <button type="button" onClick={onExportDocx} className="sv2-btn-primary sv2-btn w-full text-center">
            DOCX · Rapport Diva
          </button>
        ) : (
          <div className="sv2-inner p-4 text-center">
            <p className="text-xs text-[var(--sv2-text-muted)]">
              Le rapport DOCX (Diva) se lance depuis le bloc « Observation traçable » ci-dessus — pas d’action fantôme ici.
            </p>
          </div>
        )}

        <p className="sv2-ref">
          CSV : un fichier par bloc (balance générale, rubriques bilan, rubriques CdR, balances âgées clients et fournisseurs). DOCX : uniquement
          via Diva, distinct des CSV.
        </p>
      </div>
    </div>
  );
}
