"use client";

/**
 * InstrumentCardEvolutionBlock — API produit officielle du bloc Évolution (SPEC_LINKY_BLOC_EVOLUTION_COMMUN_v1.0).
 *
 * Règles (DoD composant, PLAN_IMPLEMENTATION_BLOC_EVOLUTION_COMMUN_v1.0 §5.2) :
 * - Ligne d’entrée toujours visible ; libellé principal toujours « Évolution ».
 * - Support des états available | partial | empty | coming_soon | error | loading.
 * - Toute action (ex. Réessayer) dans le body du bloc uniquement.
 * - Le composant n’impacte ni le header ni le footer de la card.
 *
 * État partial (SPEC_CONSOLIDEE §9.4) : le state partial est évalué sur les
 * points effectivement affichés (après agrégation), pas sur les snapshots bruts.
 *
 * Implémentation : délègue à CardChartSection (sectionTitle fixé à « Évolution »).
 */

import {
  CardChartSection,
  type WhyContent,
  type InterpretationOverride,
  type EvolutionBlockState,
} from "@/components/CardChartSection";
import type { ChartType } from "@/app/lib/chart-type";
import type { ChartGranularity } from "@/app/lib/chart-granularity";

export type { EvolutionBlockState };

interface InstrumentCardEvolutionBlockProps {
  storageKey: string;
  /** État du bloc. Quand empty/loading/error/coming_soon, les props chart sont optionnelles (valeurs par défaut utilisées). */
  state?: EvolutionBlockState;
  onRetry?: () => void;
  emptyMessage?: string;
  chartType?: ChartType;
  onChartTypeChange?: (t: ChartType) => void;
  chartGranularity?: ChartGranularity;
  onChartGranularityChange?: (g: ChartGranularity) => void;
  availableGranularities?: ChartGranularity[];
  whyContent?: WhyContent;
  interpretationOverride?: InterpretationOverride;
  hideChartTypeSelector?: boolean;
  children?: React.ReactNode;
}

/**
 * Bloc Évolution canonique : titre fixe « Évolution », délégation à CardChartSection.
 * Les cards doivent utiliser ce composant (et non CardChartSection directement) pour le bloc Évolution.
 */
export function InstrumentCardEvolutionBlock({
  storageKey,
  state,
  onRetry,
  emptyMessage,
  chartType = "bar",
  onChartTypeChange = () => {},
  chartGranularity = "month",
  onChartGranularityChange = () => {},
  availableGranularities = ["month"],
  whyContent,
  interpretationOverride,
  hideChartTypeSelector = false,
  children = null,
}: InstrumentCardEvolutionBlockProps) {
  return (
    <CardChartSection
      storageKey={storageKey}
      sectionTitle="Évolution"
      state={state}
      onRetry={onRetry}
      emptyMessage={emptyMessage}
      chartType={chartType}
      onChartTypeChange={onChartTypeChange}
      chartGranularity={chartGranularity}
      onChartGranularityChange={onChartGranularityChange}
      availableGranularities={availableGranularities}
      whyContent={whyContent}
      interpretationOverride={interpretationOverride}
      hideChartTypeSelector={hideChartTypeSelector}
    >
      {children}
    </CardChartSection>
  );
}
