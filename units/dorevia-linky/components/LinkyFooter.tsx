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

interface UxMetricsStatus {
  count: number;
  p95_ms: number | null;
  p99_ms: number | null;
  slo_state: "ok" | "watch" | "alert" | "insufficient_data";
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

export function LinkyFooter({
  tenantId,
  primarySource = "vault",
  sealedCountTotal: sealedCountTotalProp,
}: {
  tenantId: string;
  /** Source des indicateurs : Linky ne voit que le Vault (toujours "vault") */
  primarySource?: "erp" | "vault";
  /** Nombre de preuves (même source que le badge header) pour affichage cohérent */
  sealedCountTotal?: number | null;
}) {
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [uxStatus, setUxStatus] = useState<UxMetricsStatus | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ux-metrics?tenant=${encodeURIComponent(tenantId)}&lookback_minutes=30`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setUxStatus({
          count: typeof d?.count === "number" ? d.count : 0,
          p95_ms: typeof d?.p95_ms === "number" ? d.p95_ms : null,
          p99_ms: typeof d?.p99_ms === "number" ? d.p99_ms : null,
          slo_state:
            d?.slo_state === "ok" || d?.slo_state === "watch" || d?.slo_state === "alert"
              ? d.slo_state
              : "insufficient_data",
        });
      })
      .catch(() => {
        if (!cancelled) setUxStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const sources = status?.sources ?? [
    { name: "odoo", status: "ok" as const },
    { name: "pos", status: "ok" as const },
  ];
  /** Une seule source : prop (dashboard-metrics) prioritaire pour aligner header et footer */
  const sealedCount = sealedCountTotalProp != null ? sealedCountTotalProp : status?.sealed_count_total;
  const lastSealAgo = status?.last_seal_ago_seconds;
  const version = status?.version ?? "—";
  const uxP95Ms = uxStatus?.p95_ms ?? null;
  const uxP95Text = uxP95Ms != null ? `${Math.round(uxP95Ms)} ms` : "—";
  const uxState = uxStatus?.slo_state ?? "insufficient_data";
  const uxIndicator = uxState === "ok" ? "✔" : uxState === "watch" ? "⚠" : uxState === "alert" ? "✖" : "·";
  const uxTitle =
    uxStatus == null || uxStatus.count < 20
      ? "UX SLO: données insuffisantes (au moins 20 échantillons récents requis)"
      : `UX SLO 30 min — P95: ${uxP95Text}, P99: ${uxStatus.p99_ms != null ? Math.round(uxStatus.p99_ms) : "—"} ms`;

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

  const truthBlock = (
    <span className="text-[var(--text-secondary)]" title="Linky ne voit que le Vault. Les montants proviennent des documents scellés dans le Vault.">
      Source : Vault
    </span>
  );

  const sep = <span className="text-[var(--border)] select-none" aria-hidden>|</span>;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 shrink-0 border-t border-[var(--border)] bg-[var(--bg-secondary)]/98 backdrop-blur-sm px-4 py-3">
      <div className="mx-auto max-w-4xl">
        {/* Ligne 1 — Trust bar : Source + Preuves + UX + Sources (contraste renforcé, séparateurs nets) */}
        <div className="hidden sm:flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-[var(--text)]">
          <span className="font-medium text-[var(--text-secondary)]">{truthBlock}</span>
          {sep}
          <span className="font-medium tabular-nums">{proofBlock}</span>
          {sep}
          <span className="tabular-nums" title={uxTitle}>UX P95 : {uxP95Text} {uxIndicator}</span>
          {lastSealBlock && (
            <>
              {sep}
              {lastSealBlock}
            </>
          )}
          {sep}
          {sourcesBlock}
        </div>
        {/* Ligne 2 — Lien Dorevia Vault + version */}
        <div className="hidden sm:flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)] mt-1.5">
          <a
            href={DOREVIA_VAULT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-80 hover:opacity-100 hover:text-[var(--text)] hover:underline transition-all"
          >
            Powered by Dorevia Vault — données financières vérifiables
          </a>
          {sep}
          <span className="tabular-nums">{version}</span>
        </div>
        {/* Mobile — compact, même logique contraste/séparateurs */}
        <div className="sm:hidden flex flex-col items-center justify-center gap-y-1 text-xs text-[var(--text-secondary)] py-1">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5">
            <span className="text-[var(--text)]">Source : Vault</span>
            <span className="text-[var(--border)]">|</span>
            {sealedCount != null ? (
              <span className="tabular-nums">{sealedCount.toLocaleString("fr-FR")} preuves ✓</span>
            ) : (
              <span>— preuves</span>
            )}
            <span className="text-[var(--border)]">|</span>
            <span className="tabular-nums" title={uxTitle}>UX P95 : {uxP95Text} {uxIndicator}</span>
            <span className="text-[var(--border)]">|</span>
            {sourcesBlock}
            {lastSealAgo != null && (
              <>
                <span className="text-[var(--border)]">|</span>
                <span>il y a {formatLastSealAgo(lastSealAgo)}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-x-3">
            <a
              href={DOREVIA_VAULT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100 hover:underline transition-all"
            >
              Dorevia Vault
            </a>
            <span className="text-[var(--border)]">|</span>
            <span className="tabular-nums">{version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
