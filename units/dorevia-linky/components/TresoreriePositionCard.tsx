"use client";

import { formatAmount, formatNumber } from "@/app/lib/format";
import { IconTreasury } from "@/components/CardIcons";

export interface TresoreriePositionData {
  position?: {
    erp_balance?: number | null;
    validated_balance?: number;
    unvalidated_exposure?: number | null;
  };
  reconciliation_rate?: number | null;
  currency?: string;
  /** Couverture structurelle (mois) — Position validée ÷ masse salariale mensuelle (SPEC Masse Salariale P0) */
  couverture_salariale_mois?: number | null;
  flags?: {
    large_delta?: boolean;
    sign_mismatch?: boolean;
    structural_delta?: boolean;
  };
  generated_at?: string | null;
}

interface TresoreriePositionCardProps {
  data: TresoreriePositionData | null;
  loading: boolean;
  onRefresh?: () => void;
  footer?: React.ReactNode;
}

const CARD_BASE =
  "rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] border-l-4";

function formatSnapshotDate(iso: string | null | undefined): string {
  if (!iso || typeof iso !== "string") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** NO_DATA si validated_balance, unvalidated_exposure et reconciliation_rate sont tous null ou 0 */
function isNoData(d: TresoreriePositionData | null | undefined): boolean {
  if (!d) return true;

  const vb = d.position?.validated_balance ?? null;
  const uv = d.position?.unvalidated_exposure ?? null;
  const rate = d.reconciliation_rate ?? null;

  const vbEmpty = vb == null || vb === 0;
  const uvEmpty = uv == null || uv === 0;
  const rateEmpty = rate == null || rate === 0;

  return vbEmpty && uvEmpty && rateEmpty;
}

function getUiState(
  noData: boolean,
  rate: number | null | undefined,
  largeDelta: boolean | undefined
): "no_data" | "tension" | "vigilance" | "normal" {
  if (noData) return "no_data";
  if (rate != null && rate < 70) return "tension";
  if (largeDelta || (rate != null && rate >= 70 && rate < 90)) return "vigilance";
  return "normal";
}

export function TresoreriePositionCard({ data, loading, onRefresh, footer }: TresoreriePositionCardProps) {
  const currency = data?.currency ?? "EUR";
  const pos = data?.position;
  const erpBalance = pos?.erp_balance;
  const validatedBalance = pos?.validated_balance ?? 0;
  const rate = data?.reconciliation_rate;
  const rateRounded = rate != null && !Number.isNaN(rate) ? Math.round(rate) : null;
  const generatedAt = data?.generated_at;
  const largeDelta = data?.flags?.large_delta;

  const couvertureMois = data?.couverture_salariale_mois;
  const noData = isNoData(data);
  const uiState = getUiState(noData, rateRounded, largeDelta);
  const dateStr = formatSnapshotDate(generatedAt);

  const couvertureFormatted =
    couvertureMois != null && Number.isFinite(couvertureMois)
      ? formatNumber(couvertureMois, { minFraction: 0, maxFraction: 2 })
      : "—";

  const borderClass =
    uiState === "no_data"
      ? "border-l-[var(--muted)]"
      : uiState === "tension"
        ? "border-l-[var(--warning)]"
        : uiState === "vigilance"
          ? "border-l-[var(--warning)]"
          : "border-l-[var(--accent)]";

  if (loading && !data) {
    return (
      <section className={`${CARD_BASE} border-l-[var(--muted)]`}>
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <IconTreasury className="h-6 w-6 shrink-0 text-[var(--accent)]" />
            <span className="text-lg font-bold uppercase tracking-wide text-[var(--accent)]">Trésorerie</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-4 w-24" />
        </div>
        <p className="mt-3 text-xs text-[var(--text-secondary)]">Dernière mise à jour : —</p>
      </section>
    );
  }

  return (
    <section className={`${CARD_BASE} ${borderClass}`}>
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <IconTreasury className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          <span className="text-lg font-bold uppercase tracking-wide text-[var(--accent)]">Trésorerie</span>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="rounded px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]/30 hover:text-[var(--accent)] transition-colors"
            aria-label="Rafraîchir la position"
          >
            Rafraîchir
          </button>
        )}
      </div>

      {uiState === "no_data" && (
        <p className="mb-3 text-sm text-[var(--text-secondary)] italic">Aucune donnée disponible</p>
      )}
      {uiState === "tension" && (
        <div className="mb-3 rounded bg-[var(--warning)]/20 px-2 py-1 text-xs font-medium text-[var(--warning)]">
          Validation partielle
        </div>
      )}
      {uiState === "vigilance" && (
        <div className="mb-3 rounded bg-[var(--warning)]/20 px-2 py-1 text-xs font-medium text-[var(--warning)]">
          Écart à analyser
        </div>
      )}

      <div className="space-y-2 text-sm">
        {erpBalance != null && (
          <div
            className="flex justify-between items-baseline"
            title="Solde banque issu de la comptabilité (ERP)"
          >
            <span className="text-[var(--text-secondary)]">💰 Solde comptable (ERP)</span>
            <span className="text-xl font-bold tabular-nums text-[var(--text)]">
              {formatAmount(erpBalance, currency)}
            </span>
          </div>
        )}
        {erpBalance == null && (
          <p className="text-xs text-[var(--text-secondary)] italic">Solde comptable : non configuré</p>
        )}

        <div
          className="flex justify-between items-baseline"
          title="Montant confirmé par rapprochement bancaire"
        >
          <span className="text-[var(--text-secondary)]">🔐 Position validée (Vault)</span>
          <span className="font-semibold tabular-nums text-[var(--text)]">
            {noData ? "—" : formatAmount(validatedBalance, currency)}
          </span>
        </div>

        <div
          className="flex justify-between items-baseline"
          title={rateRounded == null ? "Taux indisponible" : "Pourcentage des flux couverts par preuve bancaire"}
        >
          <span className="text-[var(--text-secondary)]">📊 Couverture probante des flux</span>
          <span className="font-semibold tabular-nums text-[var(--text)]">
            {noData ? "—" : rateRounded != null ? `${rateRounded} %` : "— %"}
          </span>
        </div>

        <div
          className="flex justify-between items-baseline"
          title="Position validée ÷ masse salariale mensuelle (mois de trésorerie)"
        >
          <span className="text-[var(--text-secondary)]">💼 Couverture structurelle</span>
          <span className="font-semibold tabular-nums text-[var(--text)]">
            {couvertureFormatted} mois
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--text-secondary)]">
        {dateStr !== "—" ? `Au ${dateStr}` : "Dernière mise à jour : —"}
      </p>

      {footer}
    </section>
  );
}
