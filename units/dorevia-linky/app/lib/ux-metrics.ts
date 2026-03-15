type UxSample = {
  tenant: string;
  company: string;
  periodFrom: string;
  periodTo: string;
  latencyMs: number;
  atIso: string;
};

type UxWindow = {
  samples: UxSample[];
  maxSize: number;
};

const DEFAULT_MAX_SIZE = 2000;
const windowsByTenant = new Map<string, UxWindow>();

function getWindow(tenant: string): UxWindow {
  const existing = windowsByTenant.get(tenant);
  if (existing) return existing;
  const created: UxWindow = { samples: [], maxSize: DEFAULT_MAX_SIZE };
  windowsByTenant.set(tenant, created);
  return created;
}

function percentile(sortedValues: number[], p: number): number | null {
  if (sortedValues.length === 0) return null;
  if (sortedValues.length === 1) return sortedValues[0];
  const rank = (p / 100) * (sortedValues.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return sortedValues[lower];
  const weight = rank - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

export function recordUxSample(input: {
  tenant: string;
  company?: string;
  periodFrom?: string;
  periodTo?: string;
  latencyMs: number;
  atIso?: string;
}): void {
  const latencyMs = input.latencyMs;
  // Fenêtre volontairement bornée pour ignorer les valeurs non représentatives.
  if (!Number.isFinite(latencyMs) || latencyMs < 0 || latencyMs > 15000) return;
  const tenant = input.tenant || "core";
  const window = getWindow(tenant);
  window.samples.push({
    tenant,
    company: input.company ?? "",
    periodFrom: input.periodFrom ?? "",
    periodTo: input.periodTo ?? "",
    latencyMs,
    atIso: input.atIso ?? new Date().toISOString(),
  });
  if (window.samples.length > window.maxSize) {
    window.samples.splice(0, window.samples.length - window.maxSize);
  }
}

export function computeUxMetrics(tenant: string, lookbackMs = 30 * 60 * 1000): {
  count: number;
  p50_ms: number | null;
  p95_ms: number | null;
  p99_ms: number | null;
  min_ms: number | null;
  max_ms: number | null;
  slo_state: "ok" | "watch" | "alert" | "insufficient_data";
} {
  const window = getWindow(tenant || "core");
  const cutoff = Date.now() - Math.max(1000, lookbackMs);
  const values = window.samples
    .filter((s) => {
      const t = Date.parse(s.atIso);
      return Number.isFinite(t) && t >= cutoff;
    })
    .map((s) => s.latencyMs)
    .sort((a, b) => a - b);

  const count = values.length;
  const p50 = percentile(values, 50);
  const p95 = percentile(values, 95);
  const p99 = percentile(values, 99);
  const min = count > 0 ? values[0] : null;
  const max = count > 0 ? values[count - 1] : null;

  let sloState: "ok" | "watch" | "alert" | "insufficient_data" = "insufficient_data";
  if (count >= 20 && p95 != null && p99 != null) {
    if (p95 <= 2000 && p99 <= 4000) sloState = "ok";
    else if (p95 <= 3000 && p99 <= 6000) sloState = "watch";
    else sloState = "alert";
  }

  return {
    count,
    p50_ms: p50,
    p95_ms: p95,
    p99_ms: p99,
    min_ms: min,
    max_ms: max,
    slo_state: sloState,
  };
}
