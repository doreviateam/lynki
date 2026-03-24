"use client";

import { useState, useEffect, useCallback } from "react";

export interface PeriodStatusInfo {
  status: "open" | "closed" | "locked" | "partial";
  closedAt: string | null;
  heterogeneous: boolean;
}

export type PeriodStatusMap = Map<string, PeriodStatusInfo>;

/**
 * Hook — charge les statuts de clôture des périodes comptables depuis Vault.
 * Clé de la Map : "YYYY-MM" (ex. "2026-03").
 * Cache invalidé au changement de tenant/company/year.
 */
export function useAccountingPeriods(
  tenantId: string,
  companyId: string | null,
  year: number,
): { periodStatuses: PeriodStatusMap; loading: boolean } {
  const [periodStatuses, setPeriodStatuses] = useState<PeriodStatusMap>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ tenant: tenantId, year: String(year) });
      if (companyId) qs.set("company_ids", companyId);

      const res = await fetch(`/api/accounting/periods?${qs}`, { cache: "no-store" });
      if (!res.ok) {
        setPeriodStatuses(new Map());
        return;
      }

      const data = await res.json();
      const map = new Map<string, PeriodStatusInfo>();

      for (const p of data.periods ?? []) {
        const key = `${p.year}-${String(p.month).padStart(2, "0")}`;
        map.set(key, {
          status: p.status,
          closedAt: p.closed_at ?? null,
          heterogeneous: p.heterogeneous === true,
        });
      }

      setPeriodStatuses(map);
    } catch {
      setPeriodStatuses(new Map());
    } finally {
      setLoading(false);
    }
  }, [tenantId, companyId, year]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  return { periodStatuses, loading };
}
