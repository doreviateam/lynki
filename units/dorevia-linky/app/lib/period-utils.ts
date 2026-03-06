/** Utilitaires période pour Linky */

export interface PeriodRange {
  from: string;
  to: string;
}

/** Options pour le select période : Toutes périodes + Exercice à date + Janvier…Décembre */
export const PERIOD_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Toutes périodes (toutes années)" },
  { value: "ytd", label: "Exercice à date" },
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Août" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

/** Années disponibles : année courante + 5 passées */
export function getAvailableYears(pastYears = 5): number[] {
  const year = new Date().getFullYear();
  return Array.from({ length: pastYears + 1 }, (_, i) => year - i);
}

/** Par défaut : Exercice à date (1er janv. → aujourd'hui ou fin d'année) */
export function getDefaultPeriod(): PeriodRange {
  const year = new Date().getFullYear();
  return getPeriodFromKeyAndYear("ytd", year);
}

/** Calcule from/to à partir de key (all|ytd|1-12|T1-T4|S1-S53) et année */
export function getPeriodFromKeyAndYear(key: string, year: number): PeriodRange {
  if (key === "all") {
    return { from: "2000-01-01", to: "2030-12-31" };
  }
  if (key === "ytd") {
    const now = new Date();
    const from = `${year}-01-01`;
    const to =
      now.getFullYear() === year
        ? `${year}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
        : `${year}-12-31`;
    return { from, to };
  }
  const month = parseInt(key, 10);
  if (month >= 1 && month <= 12) {
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0);
    const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
    return { from, to };
  }
  if (key === "T1" || key === "T2" || key === "T3" || key === "T4") {
    const q = parseInt(key[1] ?? "1", 10);
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = q * 3;
    const from = `${year}-${String(startMonth).padStart(2, "0")}-01`;
    const lastDay = new Date(year, endMonth, 0);
    const to = `${year}-${String(endMonth).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
    return { from, to };
  }
  const weekMatch = key.match(/^S(\d+)$/);
  if (weekMatch) {
    const weekNum = parseInt(weekMatch[1] ?? "1", 10);
    if (weekNum >= 1 && weekNum <= 53) {
      const [from, to] = getISOWeekRange(year, weekNum);
      return { from, to };
    }
  }
  return getDefaultPeriod();
}

/** Plage lundi-dimanche pour semaine ISO (ISO 8601) - semaine 1 = celle contenant le 4 janvier */
function getISOWeekRange(year: number, week: number): [string, string] {
  const jan4 = new Date(year, 0, 4);
  const daysToMonday = jan4.getDay() === 0 ? 6 : jan4.getDay() - 1;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - daysToMonday);
  const targetMonday = new Date(firstMonday);
  targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7);
  const targetSunday = new Date(targetMonday);
  targetSunday.setDate(targetSunday.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return [fmt(targetMonday), fmt(targetSunday)];
}

/** Extrait key et année à partir de from/to (pour présélection des selects) */
export function getKeyAndYearFromPeriod(from: string, to: string): { key: string; year: number } {
  try {
    if (from === "2000-01-01" && to === "2030-12-31") {
      return { key: "all", year: new Date().getFullYear() };
    }
    const [y, m] = from.split("-").map(Number);
    const year = y;
    const jan1 = `${year}-01-01`;
    // Exercice à date : 1er janv. → aujourd'hui (année courante)
    if (from === jan1 && year === new Date().getFullYear()) {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const ytdTo = today;
      if (to === ytdTo) return { key: "ytd", year };
    }
    const lastDayOfMonth = new Date(year, m, 0);
    const expectedTo = `${year}-${String(m).padStart(2, "0")}-${String(lastDayOfMonth.getDate()).padStart(2, "0")}`;
    if (to === expectedTo && m >= 1 && m <= 12) {
      return { key: String(m), year };
    }
    for (const q of ["T1", "T2", "T3", "T4"]) {
      const r = getPeriodFromKeyAndYear(q, year);
      if (r.from === from && r.to === to) return { key: q, year };
    }
    for (let w = 1; w <= 53; w++) {
      const [wf, wt] = getISOWeekRange(year, w);
      if (wf === from && wt === to) return { key: `S${w}`, year };
    }
    return { key: String(m), year };
  } catch {
    return { key: "ytd", year: new Date().getFullYear() };
  }
}

export function formatPeriodLabel(from: string, to: string): string {
  if (!from || !to) return "Toutes périodes";
  if (from === "2000-01-01" && to === "2030-12-31") return "Toutes périodes (toutes années)";
  try {
    const d1 = new Date(from + "T00:00:00");
    const d2 = new Date(to + "T00:00:00");
    return `${d1.toLocaleDateString("fr-FR")} – ${d2.toLocaleDateString("fr-FR")}`;
  } catch {
    return "Toutes périodes";
  }
}
