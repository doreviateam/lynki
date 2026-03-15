"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CockpitLayout,
  CockpitHeader,
  InsightCard,
  KpiGrid,
  ProofWidget,
  SectionGrid,
  ChartCard,
  TableCard,
  AlertCard,
  CockpitSkeleton,
  CockpitError,
} from "@/components/cockpit";
import { CockpitBarChart } from "@/components/cockpit/CockpitBarChart";
import { loadCockpitData } from "@/app/lib/cockpit/loadCockpitData";
import { getDefaultPeriod } from "@/app/lib/period-utils";

const DEFAULT_TENANT = "core";

function deriveTenantFromHost(): string {
  if (typeof window === "undefined") return DEFAULT_TENANT;
  const host = window.location.hostname;
  const parts = host.split(".");
  if (parts.length >= 5 && parts[0] === "ui") {
    const tenant = parts[2];
    if (tenant) return tenant;
  }
  return DEFAULT_TENANT;
}

function getTenantDisplayName(tenantId: string): string {
  const names: Record<string, string> = {
    core: "Core",
    laplatine2026: "La Platine",
    doreviateam: "Dorevia Team",
  };
  return names[tenantId] ?? tenantId;
}

export default function CockpitPage() {
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT);
  const [data, setData] = useState<Awaited<ReturnType<typeof loadCockpitData>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const period = getDefaultPeriod();
    try {
      const result = await loadCockpitData({
        tenantId,
        companyId: null,
        period,
      });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Erreur de chargement"));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetch("/api/tenant")
      .then((r) => r.json())
      .then((d) => setTenantId(d?.tenant_id ?? deriveTenantFromHost()))
      .catch(() => setTenantId(deriveTenantFromHost()));
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    fetchData();
  }, [tenantId, fetchData]);

  if (loading) {
    return <CockpitSkeleton />;
  }

  if (error) {
    return (
      <CockpitError
        message={error.message}
        onRetry={fetchData}
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <CockpitLayout>
      <CockpitHeader
        tenantName={getTenantDisplayName(data.header.tenantName)}
        period={data.header.period}
        fluxBadge={data.header.fluxStatus}
        sourceBadge={data.header.source}
      />

      <InsightCard
        text={data.insight.text}
        badge={data.insight.badge}
      />

      <KpiGrid items={data.kpis} />

      <ProofWidget percentage={data.proof.percentage} sources={data.proof.sources} />

      <SectionGrid>
        <ChartCard title={data.flux.title} status={data.flux.status}>
          <CockpitBarChart data={data.flux.data} />
        </ChartCard>
        <TableCard
          title={data.exposure.title}
          status={data.exposure.status}
          rows={data.exposure.rows}
        />
      </SectionGrid>

      <SectionGrid>
        <ChartCard title={data.treasury.title} status={data.treasury.status}>
          <CockpitBarChart data={data.treasury.data} />
        </ChartCard>
        <AlertCard
          title={data.alerts.title}
          status={data.alerts.status}
          alerts={data.alerts.alerts}
        />
      </SectionGrid>
    </CockpitLayout>
  );
}
