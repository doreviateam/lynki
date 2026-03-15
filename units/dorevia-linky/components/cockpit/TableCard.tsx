"use client";

import { Badge } from "./Badge";

export interface TableRow {
  partner: string;
  encours: number;
  retard: number;
  retardVariant: "warning" | "danger";
  preuve: string;
  preuveValidated?: boolean;
}

export interface TableCardProps {
  title: string;
  status?: string;
  rows: TableRow[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function TableCard({ title, status, rows }: TableCardProps) {
  return (
    <div className="bg-linky-surface border border-linky-border rounded-linky-card p-linky-padding transition-colors duration-linky ease-out hover:bg-linky-hover">
      <h3 className="text-linky-title text-linky-muted font-medium m-0 mb-2">
        {title}
      </h3>
      {status && (
        <div className="text-linky-small text-linky-muted mb-3">{status}</div>
      )}
      {rows.length === 0 ? (
        <div className="py-8 text-center text-linky-muted text-linky-small">
          Aucune donnée disponible
        </div>
      ) : (
      <table className="w-full border-collapse mt-3">
        <thead>
          <tr>
            <th className="text-left text-linky-small font-medium text-linky-muted pb-2.5">
              Partenaire
            </th>
            <th className="text-right text-linky-small font-medium text-linky-muted pb-2.5">
              Encours
            </th>
            <th className="text-right text-linky-small font-medium text-linky-muted pb-2.5">
              Retard
            </th>
            <th className="text-left text-linky-small font-medium text-linky-muted pb-2.5">
              Preuve
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="transition-colors duration-linky ease-out hover:bg-linky-bg-secondary"
            >
              <td className="py-2.5 border-b border-linky-border">{row.partner}</td>
              <td className="py-2.5 border-b border-linky-border text-right">
                {formatCurrency(row.encours)}
              </td>
              <td className="py-2.5 border-b border-linky-border text-right">
                <Badge variant={row.retardVariant}>{row.retard} %</Badge>
              </td>
              <td
                className={`py-2.5 border-b border-linky-border text-linky-label ${
                  row.preuveValidated ? "text-linky-success" : "text-linky-muted"
                }`}
              >
                {row.preuve}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}
