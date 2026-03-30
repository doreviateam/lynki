import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";
import { buildTreasuryCockpitTileModel, treasuryCockpitPrimaryBadge } from "@/app/lib/cockpit/treasury-cockpit-tile";
import { confidenceLabelFromScore } from "@/app/lib/cockpit/ui-state-labels";

function csvEscape(cell: string): string {
  if (/[;"\r\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

function row(section: string, key: string, value: string): string {
  return [section, key, value].map(csvEscape).join(";");
}

function num(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  return String(n);
}

export interface TreasuryDetailCsvParams {
  exportedAtIso: string;
  periodFrom: string;
  periodTo: string;
  tenantId: string;
  companyId: string | null;
  companyLabel: string;
  primarySource: string;
  metrics: DashboardMetricsResponse;
  confidenceScore: number | null;
  bankHealthUnreconciledAmt: number | null;
  bankHealthEntries: number | null;
  evolutionMainPoints: number;
  evolutionUnreconciledPoints: number;
  evolutionCoveragePoints: number;
}

/** Snapshot des indicateurs affichés (séparateur `;` — ouverture confortable dans Excel FR). */
export function buildTreasuryDetailCsvContent(p: TreasuryDetailCsvParams): string {
  const m = p.metrics;
  const d = m._details?.treasury;
  const tile = buildTreasuryCockpitTileModel(m);
  const badge = treasuryCockpitPrimaryBadge(m.treasury.status);
  const lines: string[] = [];

  lines.push(row("Métadonnées", "Export (ISO)", p.exportedAtIso));
  lines.push(row("Métadonnées", "Écran", "Détail Trésorerie Lynki"));
  lines.push(row("Périmètre", "Période (début)", p.periodFrom));
  lines.push(row("Périmètre", "Période (fin)", p.periodTo));
  lines.push(row("Périmètre", "Tenant", p.tenantId));
  lines.push(row("Périmètre", "Société (libellé)", p.companyLabel));
  lines.push(row("Périmètre", "Société (id)", p.companyId ?? ""));
  lines.push(row("Périmètre", "Source flux", p.primarySource === "erp" ? "ERP" : "Vault"));
  lines.push(row("Périmètre", "Complétude (score)", num(p.confidenceScore)));
  lines.push(row("Périmètre", "Complétude (libellé)", confidenceLabelFromScore(p.confidenceScore) ?? ""));

  lines.push(row("Bandeau", "Solde validé (nombre)", num(m.treasury.value)));
  lines.push(row("Bandeau", "Devise", tile.currency));
  lines.push(row("Bandeau", "Badge état", badge.label));
  lines.push(row("Bandeau", "Couverture probante (%)", num(tile.coveragePct)));
  lines.push(row("Bandeau", "Montant à rapprocher (texte UI)", tile.rapproFormatted ?? ""));
  lines.push(row("Bandeau", "Écart à confirmer (abs., nombre)", tile.erpDelta != null ? String(Math.abs(tile.erpDelta)) : ""));
  lines.push(row("Bandeau", "Écart signé ERP − validé (nombre)", num(tile.erpDelta)));

  if (d) {
    lines.push(row("Rapprochement", "Taux couverture agrégat (%)", num(d.treasury_validated_pct ?? undefined)));
    lines.push(row("Rapprochement", "Montant rapproché", num(d.reconciled)));
    lines.push(row("Rapprochement", "Montant à rapprocher", num(d.unreconciled)));
    lines.push(row("Rapprochement", "Nombre journaux", num(d.journals_count ?? undefined)));
    lines.push(row("Rapprochement", "Lignes non rapprochées (compteur)", num(d.unreconciled_lines_count ?? undefined)));
    lines.push(row("Rapprochement", "Date écriture ouverte la plus ancienne (ISO)", d.oldest_unreconciled_date ?? ""));
    lines.push(row("Rapprochement", "Dernier relevé importé (ISO)", d.last_statement_import_date ?? ""));
    lines.push(row("Écart détail", "Solde ERP", num(d.erp_balance ?? undefined)));
    lines.push(
      row(
        "Écart détail",
        "Position validée",
        num(d.validated_balance ?? (m.treasury.value != null ? m.treasury.value : undefined))
      )
    );

    const br = d.account_volume_breakdown;
    if (br != null && br.length > 0) {
      let idx = 0;
      for (const r of br) {
        idx += 1;
        const label = r.account_id != null ? `Compte #${r.account_id}` : "Compte non identifié";
        const lineTotal = r.reconciled_volume + r.unreconciled_volume;
        const cov =
          lineTotal > 0 ? Math.round((r.reconciled_volume / lineTotal) * 100) : null;
        lines.push(row("Décomposition (compte)", `${idx}. ${label} — volume rapproché`, num(r.reconciled_volume)));
        lines.push(row("Décomposition (compte)", `${idx}. ${label} — volume à rapprocher`, num(r.unreconciled_volume)));
        lines.push(row("Décomposition (compte)", `${idx}. ${label} — couverture ligne (%)`, cov != null ? String(cov) : ""));
      }
    }
  }

  lines.push(row("Santé bancaire (proxy)", "Montant ouvert", num(p.bankHealthUnreconciledAmt)));
  lines.push(row("Santé bancaire (proxy)", "Écritures signalées", num(p.bankHealthEntries)));

  lines.push(row("Évolution (séries)", "Points série principale", String(p.evolutionMainPoints)));
  lines.push(row("Évolution (séries)", "Points À rapprocher", String(p.evolutionUnreconciledPoints)));
  lines.push(row("Évolution (séries)", "Points couverture %", String(p.evolutionCoveragePoints)));

  lines.push(row("Note", "Liste ligne à ligne", "Non incluse — T-TR-DETAIL-003"));

  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadTreasuryDetailCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildTreasuryDetailCsvFilename(tenantId: string): string {
  const safe = (tenantId || "tenant").replace(/[^\w.-]+/g, "_");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `linky-tresorerie-detail_${safe}_${stamp}.csv`;
}
