"use client";

import { useState, useEffect } from "react";

const DOREVIA_VAULT_LINK =
  typeof process.env.NEXT_PUBLIC_DOREVIA_VAULT_LINK === "string" && process.env.NEXT_PUBLIC_DOREVIA_VAULT_LINK
    ? process.env.NEXT_PUBLIC_DOREVIA_VAULT_LINK
    : "https://sylius.lab.core.doreviateam.com/accueil";

interface PlatformStatus {
  vault_status: string;
  sources: Array<{ name: string; status: string }>;
  last_sync_formatted: string | null;
  last_seal_ago_seconds: number | null;
  sealed_count_total: number | null;
  version: string;
}

function SourceIcon({ status }: { status: string }) {
  if (status === "ok") return <span className="text-[var(--positive)]">✔</span>;
  if (status === "warn" || status === "delay") return <span className="text-[var(--warning)]">⚠</span>;
  return <span className="text-[var(--negative)]">✖</span>;
}

function formatLastSealAgo(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  return `${Math.floor(seconds / 3600)} h`;
}

export function LinkyFooter({ tenantId }: { tenantId: string }) {
  const [status, setStatus] = useState<PlatformStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/platform/status?tenant=${encodeURIComponent(tenantId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setStatus(d);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const sources = status?.sources ?? [
    { name: "odoo", status: "ok" as const },
    { name: "pos", status: "ok" as const },
  ];
  const sealedCount = status?.sealed_count_total;
  const lastSealAgo = status?.last_seal_ago_seconds;
  const version = status?.version ?? "—";

  const proofBlock =
    sealedCount != null ? (
      <span>Preuves scellées : {sealedCount.toLocaleString("fr-FR")} ✓</span>
    ) : (
      <span>Preuves scellées : —</span>
    );
  const lastSealBlock =
    lastSealAgo != null ? (
      <span>Dernier scellé : {formatLastSealAgo(lastSealAgo)}</span>
    ) : status?.last_sync_formatted ? (
      <span>Dernier scellé : {status.last_sync_formatted}</span>
    ) : null;
  const sourcesBlock = (
    <span title="Sources des données utilisées pour ce cockpit.">
      Sources : {sources.map((s, i) => (
        <span key={s.name}>
          {i > 0 ? " " : ""}
          {s.name.charAt(0).toUpperCase() + s.name.slice(1)} <SourceIcon status={s.status} />
        </span>
      ))}
    </span>
  );

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 shrink-0 border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-sm px-4 py-2">
      <div className="mx-auto max-w-4xl">
        {/* Ligne 1 — Preuve + Sources (SPEC Footer stratégique §11.3) */}
        <div className="hidden sm:flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5 text-[10px] text-[var(--text-secondary)]">
          {proofBlock}
          {lastSealBlock && (
            <>
              <span className="text-[var(--text-secondary)]/60">·</span>
              {lastSealBlock}
            </>
          )}
          <span className="text-[var(--text-secondary)]/60">·</span>
          {sourcesBlock}
        </div>
        {/* Ligne 2 — Lien Dorevia Vault + version */}
        <div className="hidden sm:flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] text-[var(--text-secondary)] mt-0.5">
          <a
            href={DOREVIA_VAULT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-secondary)] opacity-70 hover:opacity-100 hover:underline transition-all"
          >
            Powered by Dorevia Vault — données financières vérifiables
          </a>
          <span className="text-[var(--text-secondary)]/60">·</span>
          <span>{version}</span>
        </div>
        {/* Mobile — compact */}
        <div className="sm:hidden flex flex-col items-center justify-center gap-y-0.5 text-[10px] text-[var(--text-secondary)]">
          <div className="flex flex-wrap justify-center gap-x-2">
            {sealedCount != null ? (
              <span>{sealedCount.toLocaleString("fr-FR")} preuves ✓</span>
            ) : (
              <span>— preuves</span>
            )}
            <span className="text-[var(--text-secondary)]/60">·</span>
            {sourcesBlock}
            {lastSealAgo != null && (
              <>
                <span className="text-[var(--text-secondary)]/60">·</span>
                <span>il y a {formatLastSealAgo(lastSealAgo)}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-x-2">
            <a
              href={DOREVIA_VAULT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 hover:underline transition-all"
            >
              Dorevia Vault
            </a>
            <span className="text-[var(--text-secondary)]/60">·</span>
            <span>{version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
