"use client";

export interface ChartCardProps {
  title: string;
  status?: string;
  children?: React.ReactNode;
}

export function ChartCard({ title, status, children }: ChartCardProps) {
  return (
    <div className="bg-linky-surface border border-linky-border rounded-linky-card p-linky-padding transition-colors duration-linky ease-out hover:bg-linky-hover">
      <h3 className="text-linky-title text-linky-muted font-medium m-0 mb-2">
        {title}
      </h3>
      {status && (
        <div className="text-linky-small text-linky-muted mb-2">{status}</div>
      )}
      <div className="border-t border-linky-border pt-3 min-h-[180px]">
        {children ?? (
          <div className="h-full flex items-center justify-center text-linky-muted text-linky-small">
            Aucune donnée disponible
          </div>
        )}
      </div>
    </div>
  );
}
