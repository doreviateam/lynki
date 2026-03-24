/** Libellé d’une clé de période API (YYYY-MM, YYYY-MM-DD, YYYY-Www). */
export function formatSeriesPeriodLabel(period: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    return new Date(period + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [y, m] = period.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
  }
  if (/^\d{4}-W\d{2}$/i.test(period)) return period.replace("W", " sem. ");
  return period;
}
