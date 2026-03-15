"use client";

import { Badge, type BadgeVariant } from "./Badge";

export interface AlertItem {
  text: string;
  badge: { label: string; variant: BadgeVariant };
}

export interface AlertCardProps {
  title: string;
  status?: string;
  alerts: AlertItem[];
}

export function AlertCard({ title, status, alerts }: AlertCardProps) {
  return (
    <div className="bg-linky-surface border border-linky-border rounded-linky-card p-linky-padding transition-colors duration-linky ease-out hover:bg-linky-hover">
      <h3 className="text-linky-title text-linky-muted font-medium m-0 mb-2">
        {title}
      </h3>
      {status && (
        <div className="text-linky-small text-linky-muted mb-3">{status}</div>
      )}
      {alerts.length === 0 ? (
        <div className="py-8 text-center text-linky-muted text-linky-small">
          Aucune alerte
        </div>
      ) : (
      <div className="space-y-0">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-2.5 border-b border-linky-border last:border-b-0"
          >
            <span className="text-linky-small">{alert.text}</span>
            <Badge variant={alert.badge.variant}>{alert.badge.label}</Badge>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
