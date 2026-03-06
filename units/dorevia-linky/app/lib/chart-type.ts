/** Types de représentation graphique pour la carte Business */
export type ChartType = "bar" | "line" | "pie";

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: "Barres",
  line: "Courbe",
  pie: "Camembert",
};
