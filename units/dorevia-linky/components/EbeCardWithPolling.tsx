"use client";

import { useEffect, useState, useCallback } from "react";
import { EbeCard } from "@/components/EbeCard";
import type { SeriesPoint } from "@/app/types/aggregations";
import { getAvailableGranularities, getDefaultChartGranularity, type ChartGranularity } from "@/app/lib/chart-granularity";
import {
  normalizePayrollResponse,
  resolvePayrollSourceUi,
  type PayrollSourceUi,
} from "@/app/lib/payroll-source-ui";

import type { CardId } from "@/app/types/linky-tiles";

interface EbeCardWithPollingProps {
  period: { from: string; to: string };
  companyId: string | null;
  tenantId: string;
  /** Snapshot dashboard pour éviter un double fetch (sales/purchases déjà chargés) */
  dashboardSnapshot?: {
    _details?: {
      business?: { ventes: number; achats: number; currency?: string };
      credit_notes?: { clients: number; fournisseurs: number };
    };
  } | null;
  onFocusRequest?: () => void;
  cardId?: CardId;
  onNavigateToCard?: (cardId: CardId) => void;
}

export function EbeCardWithPolling({
  period,
  companyId,
  tenantId,
  dashboardSnapshot,
  onFocusRequest,
  cardId,
  onNavigateToCard,
}: EbeCardWithPollingProps) {
  const [salesTotal, setSalesTotal] = useState<number | null>(null);
  const [purchasesTotal, setPurchasesTotal] = useState<number | null>(null);
  const [creditNotesNet, setCreditNotesNet] = useState<number | null>(null);
  const [payrollTotal, setPayrollTotal] = useState<number | null>(null);
  const [payslipCount, setPayslipCount] = useState<number>(0);
  const [payrollSourceUi, setPayrollSourceUi] = useState<PayrollSourceUi>("legacy_fallback");
  const [payrollBreakdown, setPayrollBreakdown] = useState<{ accounts_641?: number; accounts_645?: number } | null>(null);
  const [currency, setCurrency] = useState("EUR");
  const [loading, setLoading] = useState(true);
  const [ebeSeries, setEbeSeries] = useState<SeriesPoint[]>([]);
  const [evolutionError, setEvolutionError] = useState(false);
  const [payrollUnavailableInEvolution, setPayrollUnavailableInEvolution] = useState(false);

  const availableGranularities = getAvailableGranularities(period.from, period.to);
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>(() =>
    getDefaultChartGranularity(period.from, period.to)
  );

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({
      tenant: tenantId,
      date_debut: period.from,
      date_fin: period.to,
      granularity: chartGranularity,
      ...(companyId && { company_id: companyId }),
    });

    const payrollPromise = fetch(`/api/payroll?${params}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    const ebeEvolutionPromise = fetch(`/api/ebe-evolution?${params}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    if (dashboardSnapshot?._details?.business) {
      const biz = dashboardSnapshot._details.business;
      setSalesTotal(biz.ventes);
      setPurchasesTotal(biz.achats);
      setCurrency(biz.currency ?? "EUR");
      if (dashboardSnapshot._details.credit_notes) {
        const cn = dashboardSnapshot._details.credit_notes;
        setCreditNotesNet(cn.fournisseurs - cn.clients);
      }
      setLoading(false);

      const [payrollRes, ebeEvolution] = await Promise.all([payrollPromise, ebeEvolutionPromise]);
      const normalized = normalizePayrollResponse(payrollRes);
      setPayrollTotal(normalized.total);
      setPayslipCount(normalized.count);
      setPayrollSourceUi(resolvePayrollSourceUi(normalized));
      setPayrollBreakdown(normalized.breakdown ?? null);
      setEbeSeries(Array.isArray(ebeEvolution?.series) ? ebeEvolution.series : []);
      setEvolutionError(ebeEvolution === null);
      setPayrollUnavailableInEvolution(!!ebeEvolution?.payroll_unavailable);
      return;
    }

    setLoading(true);
    try {
      const [salesRes, purchasesRes, payrollRes, ebeEvolution] = await Promise.all([
        fetch(`/api/sales?${params}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`/api/purchases?${params}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        payrollPromise,
        ebeEvolutionPromise,
      ]);
      setSalesTotal(typeof salesRes?.total_ht === "number" ? salesRes.total_ht : null);
      setPurchasesTotal(typeof purchasesRes?.total_ht === "number" ? Math.abs(purchasesRes.total_ht) : null);
      setCurrency(salesRes?.currency ?? purchasesRes?.currency ?? "EUR");
      const normalized = normalizePayrollResponse(payrollRes);
      setPayrollTotal(normalized.total);
      setPayslipCount(normalized.count);
      setPayrollSourceUi(resolvePayrollSourceUi(normalized));
      setPayrollBreakdown(normalized.breakdown ?? null);
      setEbeSeries(Array.isArray(ebeEvolution?.series) ? ebeEvolution.series : []);
      setEvolutionError(ebeEvolution === null);
      setPayrollUnavailableInEvolution(!!ebeEvolution?.payroll_unavailable);
    } catch {
      setSalesTotal(null);
      setPurchasesTotal(null);
      setEbeSeries([]);
      setEvolutionError(true);
    } finally {
      setLoading(false);
    }
  }, [tenantId, period.from, period.to, companyId, chartGranularity, dashboardSnapshot]);

  useEffect(() => {
    if (!availableGranularities.includes(chartGranularity)) {
      setChartGranularity(getDefaultChartGranularity(period.from, period.to));
    }
  }, [period.from, period.to, availableGranularities, chartGranularity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasPayroll =
    (payrollSourceUi === "payslip" || payrollSourceUi === "od") && payrollTotal != null;

  return (
    <EbeCard
      salesTotal={salesTotal}
      purchasesTotal={purchasesTotal}
      creditNotesNet={creditNotesNet}
      payrollTotal={payrollTotal}
      payslipCount={payslipCount}
      payrollSourceUi={payrollSourceUi}
      hasPayroll={hasPayroll}
      payrollBreakdown={payrollBreakdown}
      currency={currency}
      loading={loading}
      onFocusRequest={onFocusRequest}
      ebeSeries={ebeSeries}
      evolutionError={evolutionError}
      onEvolutionRetry={fetchData}
      payrollUnavailableInEvolution={payrollUnavailableInEvolution}
      chartGranularity={chartGranularity}
      availableGranularities={availableGranularities}
      onChartGranularityChange={setChartGranularity}
      cardId={cardId}
      onNavigateToCard={onNavigateToCard}
    />
  );
}
