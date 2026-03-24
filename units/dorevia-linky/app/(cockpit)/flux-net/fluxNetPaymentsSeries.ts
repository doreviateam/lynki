/** Réponse typique GET /api/payments-in | payments-out (proxy Vault). */
export interface PaymentsAggJson {
  series?: { period: string; amount: number }[];
  currency?: string;
}

export interface FluxNetPeriodPoint {
  period: string;
  encaissements: number;
  decaissements: number;
  net: number;
}

export function pickPaymentsGranularity(dateDebut: string, dateFin: string): "week" | "month" {
  const a = new Date(dateDebut).getTime();
  const b = new Date(dateFin).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return "month";
  const days = Math.abs(b - a) / 86_400_000;
  return days <= 62 ? "week" : "month";
}

/** Fusionne les séries in / out par période (décaissements en valeur absolue). */
export function mergePaymentsInOutSeries(
  inbound: PaymentsAggJson | null,
  outbound: PaymentsAggJson | null
): FluxNetPeriodPoint[] {
  const ins = inbound?.series ?? [];
  const outs = outbound?.series ?? [];
  const periods = new Set<string>();
  ins.forEach((s) => periods.add(s.period));
  outs.forEach((s) => periods.add(s.period));
  const sorted = Array.from(periods).sort();
  const inM = new Map(ins.map((s) => [s.period, s.amount]));
  const outM = new Map(outs.map((s) => [s.period, s.amount]));
  return sorted.map((period) => {
    const encaissements = inM.get(period) ?? 0;
    const decaissements = Math.abs(outM.get(period) ?? 0);
    return { period, encaissements, decaissements, net: encaissements - decaissements };
  });
}

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
