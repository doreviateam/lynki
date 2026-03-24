"use client";

/**
 * CardChartSection — Implémentation technique du bloc Évolution (SPEC_LINKY_BLOC_EVOLUTION_COMMUN_v1.0).
 * API produit officielle : InstrumentCardEvolutionBlock (fixe libellé « Évolution », prop state).
 */

import { useState, useEffect, useCallback, cloneElement, isValidElement } from "react";
import { useChartExpanded } from "@/app/context/ChartExpandedContext";
import { CHART_TYPE_LABELS, type ChartType } from "@/app/lib/chart-type";
import { GRANULARITY_LABELS, type ChartGranularity } from "@/app/lib/chart-granularity";
import { EVOLUTION_EMPTY_MESSAGE } from "@/app/lib/evolution-block-constants";

export interface WhyContent {
  periodLabel?: string;
  tenantId?: string;
  dataSource?: string;
  calculationRule?: string;
}

export interface InterpretationOverride {
  primary: string;
  secondary?: string;
}

/** États normalisés du bloc Évolution (SPEC §6). En empty/loading/error/coming_soon le contenu chart est remplacé par un rendu dédié. */
export type EvolutionBlockState = "available" | "partial" | "empty" | "coming_soon" | "error" | "loading";

const EVOLUTION_BLOCK_CONTENT_MIN_H = "min-h-[7rem]";

interface CardChartSectionProps {
  storageKey: string;
  sectionTitle?: string;
  /** État du bloc : quand empty/loading/error/coming_soon, affichage dédié (hauteur min conservée). */
  state?: EvolutionBlockState;
  /** Callback pour l’action Réessayer (état error) — action dans le body du bloc uniquement. */
  onRetry?: () => void;
  /** Message personnalisé pour état empty (défaut : message standard SPEC). */
  emptyMessage?: string;
  chartType: ChartType;
  onChartTypeChange: (t: ChartType) => void;
  chartGranularity: ChartGranularity;
  onChartGranularityChange: (g: ChartGranularity) => void;
  availableGranularities: ChartGranularity[];
  whyContent?: WhyContent;
  interpretationOverride?: InterpretationOverride;
  /** SPEC FLUX NET v1.1 : masquer le sélecteur barre/courbe/camembert (type piloté par granularité) */
  hideChartTypeSelector?: boolean;
  /**
   * Bloc toujours déplié, sans concurrence `ChartExpandedContext` (ex. carte Business : graphique CA visible
   * même si une autre carte monopolise la clé active du contexte partagé).
   */
  alwaysOpen?: boolean;
  children: React.ReactNode;
}

function getInterpretationLine(
  chartType: ChartType,
  granularity: ChartGranularity,
  relativeTo100: boolean
): string {
  if (chartType === "pie") return "Lecture : répartition sur la période sélectionnée.";
  if (granularity === "session") return "Lecture : une barre (ou un point) par session.";
  const granLabels: Record<string, string> = {
    day: "journalière",
    week: "hebdomadaire",
    month: "mensuelle",
  };
  const granLabel = granLabels[granularity];
  if (relativeTo100) return `Lecture : répartition par ${granLabel === "mensuelle" ? "mois" : granLabel === "hebdomadaire" ? "semaine" : "jour"} (100 % par période).`;
  if (chartType === "line") return `Lecture : tendance ${granLabel}.`;
  const volLabels: Record<string, string> = { day: "journaliers", week: "hebdomadaires", month: "mensuels" };
  return `Lecture : volumes ${volLabels[granularity] ?? "mensuels"} en €.`;
}

function EvolutionBlockStateContent({
  state,
  onRetry,
  emptyMessage,
}: {
  state: "empty" | "coming_soon" | "error" | "loading";
  onRetry?: () => void;
  emptyMessage?: string;
}) {
  if (state === "loading") {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 py-6 ${EVOLUTION_BLOCK_CONTENT_MIN_H} rounded-lg bg-[var(--surface)]`}>
        <div className="skeleton h-4 w-48" />
        <div className="skeleton h-3 w-32" />
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className={`flex flex-col items-start justify-center gap-3 py-6 px-3 ${EVOLUTION_BLOCK_CONTENT_MIN_H} rounded-lg bg-[var(--surface)]`}>
        <p className="text-sm text-[var(--text-secondary)]">Impossible de charger l’évolution pour le moment.</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)]/20 transition-colors"
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }
  if (state === "coming_soon") {
    return (
      <div className={`flex flex-col items-start justify-center py-6 px-3 ${EVOLUTION_BLOCK_CONTENT_MIN_H} rounded-lg bg-[var(--surface)]`}>
        <p className="text-sm text-[var(--text-muted)]">Bloc Évolution à venir.</p>
      </div>
    );
  }
  // empty
  return (
    <div className={`flex flex-col items-start justify-center gap-1 py-6 px-3 ${EVOLUTION_BLOCK_CONTENT_MIN_H} rounded-lg bg-[var(--surface)]`}>
      <p className="text-sm text-[var(--text-secondary)]">{emptyMessage ?? EVOLUTION_EMPTY_MESSAGE}</p>
      <p className="text-xs text-[var(--text-muted)]">La card reste pilotable sur l’état courant.</p>
    </div>
  );
}

export function CardChartSection({
  storageKey,
  sectionTitle = "Évolution",
  state,
  onRetry,
  emptyMessage,
  chartType,
  onChartTypeChange,
  chartGranularity,
  onChartGranularityChange,
  availableGranularities,
  whyContent,
  interpretationOverride,
  hideChartTypeSelector = false,
  alwaysOpen = false,
  children,
}: CardChartSectionProps) {
  const [relativeTo100, setRelativeTo100] = useState(false);
  const [localExpanded, setLocalExpanded] = useState(false);
  const [showWhyPopover, setShowWhyPopover] = useState(false);
  const chartCtx = useChartExpanded();

  useEffect(() => {
    if (alwaysOpen) return;
    if (!chartCtx) {
      try {
        if (sessionStorage.getItem(storageKey) === "true") setLocalExpanded(true);
      } catch {
        /* ignore */
      }
    }
  }, [alwaysOpen, chartCtx, storageKey]);

  const expanded = alwaysOpen ? true : chartCtx ? chartCtx.activeKey === storageKey : localExpanded;
  const toggleExpanded = useCallback(() => {
    if (alwaysOpen) return;
    if (chartCtx) {
      chartCtx.setActiveKey(expanded ? null : storageKey);
    } else {
      setLocalExpanded((v) => {
        const next = !v;
        try {
          sessionStorage.setItem(storageKey, String(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    }
  }, [alwaysOpen, chartCtx, expanded, storageKey]);

  const showStateContent = state && (state === "empty" || state === "coming_soon" || state === "error" || state === "loading");

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)]">
      {alwaysOpen ? (
        <h3 className="mb-2 text-sm font-semibold text-[var(--text-secondary)]">{sectionTitle}</h3>
      ) : (
        <button
          type="button"
          onClick={toggleExpanded}
          className="flex w-full items-center justify-between gap-2 rounded py-1 -mx-1 px-1 text-left hover:bg-[var(--muted-soft)] transition-colors"
          aria-expanded={expanded}
        >
          <span className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-4 w-4 text-[var(--text-secondary)] transition-transform ${expanded ? "rotate-90" : ""}`}
              aria-hidden
            >
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.06l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
            {sectionTitle}
          </span>
          <span className="text-xs text-[var(--text-secondary)]">{expanded ? "Réduire" : "Afficher"}</span>
        </button>
      )}
      {expanded && (
        <>
          {showStateContent ? (
            <div className="mt-3">
              <EvolutionBlockStateContent state={state as "empty" | "coming_soon" | "error" | "loading"} onRetry={onRetry} emptyMessage={emptyMessage} />
            </div>
          ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 mb-3">
            <span className="sr-only">Options d&apos;affichage</span>
            <div className="flex flex-wrap gap-2">
              {!hideChartTypeSelector && (
                <div className="flex gap-1 rounded-md bg-[var(--muted-soft)] p-0.5">
                  {(["bar", "line", "pie"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onChartTypeChange(t); }}
                      title={CHART_TYPE_LABELS[t]}
                      aria-label={CHART_TYPE_LABELS[t]}
                      className={`rounded p-1.5 transition-colors ${
                        chartType === t ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
                      }`}
                    >
                      {t === "bar" && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                          <path d="M3 13h2v8H3v-8zm4-4h2v12H7V9zm4-5h2v17h-2V4zm4 8h2v9h-2v-9zm4-6h2v15h-2V7z" />
                        </svg>
                      )}
                      {t === "line" && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                          <path d="M3 17l6-6 4 4 8-12" />
                        </svg>
                      )}
                      {t === "pie" && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden>
                          <path d="M7.5 1.018a7 7 0 0 0-4.79 11.566L7.5 7.793zm1 0V7.5h6.482A7 7 0 0 0 8.5 1.018M14.982 8.5H8.207l-4.79 4.79A7 7 0 0 0 14.982 8.5M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {chartType !== "pie" && (
                <div className="flex gap-1 rounded-md bg-[var(--muted-soft)] p-0.5">
                  {availableGranularities.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (availableGranularities.length > 1) {
                          onChartGranularityChange(g);
                        }
                      }}
                      aria-pressed={chartGranularity === g}
                      aria-disabled={availableGranularities.length === 1 ? undefined : false}
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                        chartGranularity === g
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
                      } ${availableGranularities.length === 1 ? "cursor-default" : ""}`}
                    >
                      {GRANULARITY_LABELS[g]}
                    </button>
                  ))}
                </div>
              )}
              {chartType !== "pie" && chartGranularity !== "session" && (
                <div className="flex gap-1 rounded-md bg-[var(--muted-soft)] p-0.5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setRelativeTo100(false); }}
                    title="Montants absolus"
                    aria-label="Montants absolus"
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      !relativeTo100 ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
                    }`}
                  >
                    Montants
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setRelativeTo100(true); }}
                    title="Chaque période est normalisée à 100 %"
                    aria-label="Répartition relative sur 100 %"
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      relativeTo100 ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
                    }`}
                  >
                    Répartition %
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            {isValidElement(children) && typeof (children as React.ReactElement & { type?: { displayName?: string } }).type !== "string"
              ? cloneElement(children as React.ReactElement<{ relativeTo100?: boolean }>, { relativeTo100 })
              : children}
            <div className="mt-2 text-xs">
              <p className="text-[var(--text-secondary)]">
                {interpretationOverride ? (
                  <span className="flex flex-col gap-0.5 text-[var(--positive)]">
                    <span className="font-semibold">{interpretationOverride.primary}</span>
                    {interpretationOverride.secondary && (
                      <span className="font-medium">{interpretationOverride.secondary}</span>
                    )}
                  </span>
                ) : (
                  chartType === "pie"
                    ? getInterpretationLine("pie", chartGranularity, false)
                    : getInterpretationLine(chartType, chartGranularity, relativeTo100)
                )}
              </p>
              <div className="relative mt-1.5 flex justify-end">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowWhyPopover((v) => !v); }}
                  className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors rounded"
                  aria-label="Afficher les détails de calcul"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                </button>
                {showWhyPopover && (
                  <div
                    className="absolute right-0 bottom-full mb-1 z-[100] max-w-sm rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-xs text-[var(--text)] shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
                    role="dialog"
                    aria-label="Détails de calcul"
                  >
                    <p className="text-[var(--text-secondary)]">
                      <strong className="text-[var(--text)]">Période :</strong> {whyContent?.periodLabel ?? "Selon filtre header"}
                      <br />
                      <strong className="text-[var(--text)]">Tenant :</strong> {whyContent?.tenantId ?? "Selon filtre header"}
                      <br />
                      <strong className="text-[var(--text)]">Source :</strong> {whyContent?.dataSource ?? "Vault (agrégations)"}
                      <br />
                      <strong className="text-[var(--text)]">Règle :</strong> {whyContent?.calculationRule ?? "TTC, scellé"}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowWhyPopover(false); }}
                      className="mt-2 text-[var(--accent)] hover:underline"
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
          )}
        </>
      )}
    </div>
  );
}
