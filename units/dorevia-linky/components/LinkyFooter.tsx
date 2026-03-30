"use client";

import { useState, useEffect } from "react";
import { useTenantContextOptional } from "@/app/context/TenantContext";

const DOREVIA_VAULT_LINK =
  typeof process.env.NEXT_PUBLIC_DOREVIA_VAULT_LINK === "string" && process.env.NEXT_PUBLIC_DOREVIA_VAULT_LINK
    ? process.env.NEXT_PUBLIC_DOREVIA_VAULT_LINK
    : "https://sylius.lab.core.doreviateam.com/accueil";

const DEFAULT_VAULT_LINK_LABEL = "Dorevia-Vault";

/** W60-005 : distinguer le total cumulé (footer) du compteur « vue » (header) */
const PROOF_CUMULATIVE_TITLE =
  "Total des preuves scellées disponibles pour ce tenant et la société affichée (si une société est sélectionnée), toutes périodes confondues.";

/** Révision du bundle Next (injectée au build Docker) — permet de vérifier que le lab sert bien la dernière image */
const LINKY_UI_BUILD_REF =
  typeof process.env.NEXT_PUBLIC_LINKY_UI_BUILD_REF === "string" && process.env.NEXT_PUBLIC_LINKY_UI_BUILD_REF.length > 0
    ? process.env.NEXT_PUBLIC_LINKY_UI_BUILD_REF
    : "—";

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
  /** Total preuves scellées pour le tenant et la société (toutes périodes) — prioritaire sur platform/status */
  sealedCountTotal?: number | null;
}) {
  const tenantCtx = useTenantContextOptional();
  const vaultLinkLabel = tenantCtx?.tenantConfig?.chrome?.footer?.vaultLinkLabel ?? DEFAULT_VAULT_LINK_LABEL;

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
      <span title={PROOF_CUMULATIVE_TITLE}>Cumul preuves · {sealedCount.toLocaleString("fr-FR")} ✓</span>
    ) : (
      <span title={PROOF_CUMULATIVE_TITLE}>Cumul preuves · —</span>
    );
  const lastSealBlock =
    lastSealAgo != null ? (
      <span>Dernier scellé : {formatLastSealAgo(lastSealAgo)}</span>
    ) : status?.last_sync_formatted ? (
      <span>Dernier scellé : {status.last_sync_formatted}</span>
    ) : null;
  const sourceTitle = (s: { name: string; status: string }) => {
    if (s.name === "odoo" && s.status === "error") {
      return "Odoo ne répond pas depuis le serveur Linky (ERP indisponible ou réseau). Les données cockpit peuvent s’appuyer sur le Vault uniquement.";
    }
    return undefined;
  };

  const sourcesBlock = (
    <span title="Sources des données utilisées pour ce cockpit.">
      Sources : {sources.map((s, i) => (
        <span key={s.name} title={sourceTitle(s)}>
          {i > 0 ? " " : ""}
          {s.name.charAt(0).toUpperCase() + s.name.slice(1)} <SourceIcon status={s.status} />
        </span>
      ))}
    </span>
  );

  const sep = <span className="text-[var(--border)] select-none" aria-hidden>|</span>;
  const dot = <span className="text-[color-mix(in_srgb,var(--border)_70%,transparent)] select-none">·</span>;

  /** Libellés courts pour footer tablette / iPad (une ligne, wrap toléré). */
  const proofCumulativeShort =
    sealedCount != null ? (
      <span className="shrink-0 tabular-nums" title={PROOF_CUMULATIVE_TITLE}>
        {sealedCount.toLocaleString("fr-FR")} preuves cumulées ✓
      </span>
    ) : (
      <span className="shrink-0 tabular-nums" title={PROOF_CUMULATIVE_TITLE}>
        — preuves cumulées
      </span>
    );
  const sourcesInlineTablet = (
    <span className="min-w-0 max-w-[min(100%,42rem)]" title="Sources des données utilisées pour ce cockpit.">
      Sources :{" "}
      {sources.map((s, i) => (
        <span key={s.name} title={sourceTitle(s)}>
          {i > 0 ? " / " : ""}
          {s.name.charAt(0).toUpperCase() + s.name.slice(1)}
          <SourceIcon status={s.status} />
        </span>
      ))}
    </span>
  );

  return (
    <footer
      className="hidden w-full shrink-0 border-t border-[var(--border)] bg-[var(--footer-bar)] px-2 py-1 sm:block sm:px-3 sm:py-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))]
        max-lg:fixed max-lg:left-0 max-lg:right-0 max-lg:z-40
        max-lg:bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]
        lg:fixed lg:bottom-0 lg:left-72 lg:right-0 lg:z-30"
      aria-label="Métadonnées globales du cockpit"
    >
      <div className="mx-auto w-full min-w-0 max-w-none overflow-x-auto">
        {/*
          Grille 1fr | auto | 1fr : le bloc métadonnées reste centré dans la barre ;
          le copyright reste ancré à droite (même largeur de colonnes latérales pour un vrai centrage).
          Uniquement lg+ : tablette / iPad (sm–lg) utilise la ligne compacte ci-dessous.
        */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-x-2 lg:py-0">
          <span className="min-w-0" aria-hidden />
          <div className="flex min-w-0 flex-nowrap items-center justify-center gap-x-2 overflow-x-auto text-[10px] leading-snug text-[color-mix(in_srgb,var(--text-secondary)_86%,var(--muted)_14%)] opacity-[0.88] [scrollbar-width:thin]">
            <span className="shrink-0 tabular-nums">{proofBlock}</span>
            {sep}
            <span className="shrink-0 tabular-nums" title={uxTitle}>
              UX {uxP95Text} {uxIndicator}
            </span>
            {lastSealBlock && (
              <>
                {sep}
                <span className="shrink-0">{lastSealBlock}</span>
              </>
            )}
            {sep}
            <span className="shrink-0">{sourcesBlock}</span>
            {sep}
            <a
              href={DOREVIA_VAULT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              title="Données financières vérifiables — Linky consomme les documents scellés dans le Vault"
              className="shrink-0 text-[color-mix(in_srgb,var(--text-secondary)_88%,var(--muted)_12%)] transition-all hover:text-[var(--text)] hover:underline"
            >
              {vaultLinkLabel}
            </a>
            {sep}
            <span className="shrink-0 tabular-nums" title="Version plateforme (API status)">
              {version}
            </span>
            {sep}
            <span
              className="shrink-0 tabular-nums"
              title="Révision UI Linky (build image Docker / NEXT_PUBLIC_LINKY_UI_BUILD_REF)"
            >
              UI {LINKY_UI_BUILD_REF}
            </span>
          </div>
          <div className="flex min-w-0 justify-end pl-2">
            <span className="shrink-0 text-xs text-[var(--text-secondary)]">© doreviateam 2026</span>
          </div>
        </div>
        {/* Tablette & iPad (sm à lg) : footer cockpit compact — preuves cumulées, UX, sources, version (sans répliquer la grille desktop). */}
        <div
          className="hidden sm:flex lg:hidden min-w-0 flex-wrap items-center justify-center gap-x-1 gap-y-1 px-0.5 py-1 text-center text-[9px] leading-snug text-[color-mix(in_srgb,var(--text-secondary)_88%,var(--muted)_12%)] sm:text-[10px] sm:py-1.5"
          aria-label="Métadonnées cockpit (preuves cumulées, UX, sources, version)"
        >
          {proofCumulativeShort}
          {dot}
          <span className="shrink-0 tabular-nums" title={uxTitle}>
            UX {uxP95Text} {uxIndicator}
          </span>
          {dot}
          {sourcesInlineTablet}
          {dot}
          <span className="shrink-0 tabular-nums" title="Version plateforme (API status)">
            {version}
          </span>
          {dot}
          <span className="shrink-0 tabular-nums" title="Révision UI Linky (build image Docker / NEXT_PUBLIC_LINKY_UI_BUILD_REF)">
            UI {LINKY_UI_BUILD_REF}
          </span>
        </div>
      </div>
    </footer>
  );
}
