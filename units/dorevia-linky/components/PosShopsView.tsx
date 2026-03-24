"use client";

import { useEffect, useState, useCallback } from "react";
import type { PeriodRange } from "@/app/lib/period-utils";
import { formatNumber, formatSignedAmount } from "@/app/lib/format";
import { CardChartSection } from "@/components/CardChartSection";
import { IconPosShops } from "@/components/CardIcons";
import {
  INSTRUMENT_CARD_BASE,
  InstrumentCardHeader,
  InstrumentCardNav,
  InstrumentCardStatusBadge,
  InstrumentCardFooter,
} from "@/components/InstrumentCardChrome";
import type { CardId } from "@/app/types/linky-tiles";
import { DualSeriesChart } from "@/components/DualSeriesChart";
import { PosSessionChart } from "@/components/PosSessionChart";
import {
  getPosChartGranularities,
  getDefaultPosChartGranularity,
  getDefaultChartGranularity,
  type ChartGranularity,
} from "@/app/lib/chart-granularity";
import type { ChartType } from "@/app/lib/chart-type";
import type { SeriesPoint } from "@/app/types/aggregations";
import { companyDisplayLabel, normalizeCompanyId } from "@/app/lib/company-id";

interface PosSessionItem {
  session_id: string;
  shop_id?: string;
  opened_at: string;
  closed_at: string;
  total_sales: number;
  total_tickets?: number;
  cash_total?: number;
  card_total?: number;
  difference?: number;
  vault_status: "sealed" | "pending" | "failed" | "missing";
}

interface PosSessionsData {
  total_sessions: number;
  sealed_sessions: number;
  pending_sessions: number;
  items: PosSessionItem[];
}

interface PosShopAggregation {
  shop_id: string;
  total_sessions: number;
  sealed_sessions: number;
  pending_sessions: number;
  total_sales: number;
  total_tickets: number;
}

interface CompanyItem {
  company_id: string;
  display_name?: string;
}

interface PosShopsViewProps {
  tenantId: string;
  period: PeriodRange;
  companies?: CompanyItem[];
  onFocusRequest?: () => void;
  footer?: React.ReactNode;
  cardId?: CardId;
  onNavigateToCard?: (cardId: CardId) => void;
  onBackToCockpit?: () => void;
}

function toPeriod(date: Date, granularity: ChartGranularity): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  if (granularity === "month") return `${y}-${m}`;
  if (granularity === "day") return `${y}-${m}-${d}`;
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  const my = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const md = String(monday.getDate()).padStart(2, "0");
  return `${my}-${mm}-${md}`;
}

function buildPosSeriesForShop(
  sessions: PosSessionItem[],
  granularity: ChartGranularity
): { series1: SeriesPoint[]; series2: SeriesPoint[]; total1: number; total2: number } {
  const byPeriodSealed = new Map<string, number>();
  const byPeriodPending = new Map<string, number>();
  let total1 = 0;
  let total2 = 0;
  for (const s of sessions) {
    const period = toPeriod(new Date(s.closed_at), granularity);
    const amount = s.total_sales ?? 0;
    if (s.vault_status === "sealed") {
      byPeriodSealed.set(period, (byPeriodSealed.get(period) ?? 0) + amount);
      total1 += amount;
    } else if (s.vault_status === "pending") {
      byPeriodPending.set(period, (byPeriodPending.get(period) ?? 0) + amount);
      total2 += amount;
    }
  }
  const allPeriods = new Set([
    ...Array.from(byPeriodSealed.keys()),
    ...Array.from(byPeriodPending.keys()),
  ]);
  const sorted = Array.from(allPeriods).sort();
  const series1: SeriesPoint[] = sorted.map((period) => ({ period, amount: byPeriodSealed.get(period) ?? 0 }));
  const series2: SeriesPoint[] = sorted.map((period) => ({ period, amount: byPeriodPending.get(period) ?? 0 }));
  return { series1, series2, total1, total2 };
}

function aggregateByShop(items: PosSessionItem[]): PosShopAggregation[] {
  const byShop = new Map<string, PosShopAggregation>();
  for (const item of items) {
    const shopId = item.shop_id ?? "(Sans point de vente)";
    const cur = byShop.get(shopId);
    if (cur) {
      cur.total_sessions += 1;
      cur.total_sales += item.total_sales;
      cur.total_tickets += item.total_tickets ?? 0;
      if (item.vault_status === "sealed") cur.sealed_sessions += 1;
      else if (item.vault_status === "pending") cur.pending_sessions += 1;
    } else {
      byShop.set(shopId, {
        shop_id: shopId,
        total_sessions: 1,
        sealed_sessions: item.vault_status === "sealed" ? 1 : 0,
        pending_sessions: item.vault_status === "pending" ? 1 : 0,
        total_sales: item.total_sales,
        total_tickets: item.total_tickets ?? 0,
      });
    }
  }
  return Array.from(byShop.values()).sort((a, b) => b.total_sales - a.total_sales);
}

function getShopDisplayName(shopId: string, companies: CompanyItem[] = []): string {
  const byId = new Map(
    companies
      .map((c) => {
        const id = normalizeCompanyId(c.company_id) ?? "";
        return [id, companyDisplayLabel(c.display_name, c.company_id)] as const;
      })
      .filter(([id]) => id.length > 0)
  );
  return byId.get(shopId) ?? byId.get(`odoo:${shopId}`) ?? shopId;
}

function formatSessionTime(value: string | undefined): string {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const ENABLE_LIVE_POLLING = process.env.NEXT_PUBLIC_LINKY_ENABLE_LIVE_POLLING === "1";

const VAULT_STATUS_LABEL: Record<string, string> = {
  sealed: "✓ Scellée",
  pending: "En attente",
  failed: "⚠ Échec",
  missing: "⚠ Non vaultée",
};

export function PosShopsView({ tenantId, period, companies = [], onFocusRequest, footer, cardId, onNavigateToCard, onBackToCockpit }: PosShopsViewProps) {
  const [data, setData] = useState<PosSessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDetailShops, setExpandedDetailShops] = useState<Set<string>>(new Set());

  const availableGranularities = getPosChartGranularities(period.from, period.to);
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>(getDefaultPosChartGranularity);
  useEffect(() => {
    const available = getPosChartGranularities(period.from, period.to);
    setChartGranularity((prev) =>
      available.includes(prev) ? prev : getDefaultPosChartGranularity()
    );
  }, [period.from, period.to]);
  const handleGranularityChange = useCallback((g: ChartGranularity) => setChartGranularity(g), []);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const handleChartTypeChange = useCallback((t: ChartType) => setChartType(t), []);
  useEffect(() => {
    setData(null);
    setLoading(true);
    const fetchPosSessions = () => {
      const params = new URLSearchParams({
        tenant: tenantId,
        date_debut: period.from,
        date_fin: period.to,
      });
      fetch(`/api/pos-sessions?${params}`, { cache: "no-store", headers: { Accept: "application/json" } })
        .then((r) => r.json())
        .then(setData)
        .catch(() => setData({ total_sessions: 0, sealed_sessions: 0, pending_sessions: 0, items: [] }))
        .finally(() => setLoading(false));
    };
    fetchPosSessions();
    const intervalId = ENABLE_LIVE_POLLING ? setInterval(fetchPosSessions, POLL_INTERVAL_MS) : null;
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [tenantId, period.from, period.to]);

  const IconWrap = onFocusRequest
    ? ({ children }: { children: React.ReactNode }) => (
        <button type="button" onClick={onFocusRequest} className="flex cursor-pointer rounded p-1 -m-1 hover:bg-[var(--accent-soft)]/30 transition-colors" aria-label="Ouvrir la card Points de vente">
          {children}
        </button>
      )
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  if (loading) {
    return (
      <section className={INSTRUMENT_CARD_BASE} role="region" aria-label="Instrument Points de vente — chargement">
        {cardId && onNavigateToCard && (
          <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} onBackToCockpit={onBackToCockpit} />
        )}
        <InstrumentCardHeader
          icon={<IconWrap><IconPosShops className="h-6 w-6 shrink-0 text-[var(--accent)]" /></IconWrap>}
          title="POINTS DE VENTE"
          kpiValue={<div className="skeleton h-5 w-28" />}
        />
        <div className="skeleton h-24 w-full" />
      </section>
    );
  }

  const items = data?.items ?? [];
  const shops = aggregateByShop(items);
  const totalSessions = data?.total_sessions ?? 0;
  const totalSealed = data?.sealed_sessions ?? 0;
  const unsealedSessions = Math.max(0, totalSessions - totalSealed);
  const verdict = unsealedSessions > 0 ? "WARNING" : "OK";
  const totalSales = shops.reduce((s, shop) => s + shop.total_sales, 0);
  const totalTickets = items.reduce((acc, i) => acc + (i.total_tickets ?? 0), 0);

  return (
    <section className={INSTRUMENT_CARD_BASE} role="region" aria-label="Instrument Points de vente">
      {cardId && onNavigateToCard && (
        <InstrumentCardNav currentCardId={cardId} onNavigate={onNavigateToCard} onBackToCockpit={onBackToCockpit} />
      )}
      <InstrumentCardHeader
        icon={<IconWrap><IconPosShops className="h-6 w-6 shrink-0 text-[var(--accent)]" /></IconWrap>}
        title="POINTS DE VENTE"
        badges={
          <InstrumentCardStatusBadge
            label={verdict === "OK" ? "Région opérationnelle" : "Session à sécuriser"}
            severity={verdict === "OK" ? "success" : "vigilance"}
          />
        }
        kpiLabel="Sessions"
        kpiValue={<span className="font-semibold tabular-nums">{totalSessions}</span>}
      />
      <div className="mb-4 flex flex-wrap gap-4 text-sm items-center">
        <span className="font-semibold text-[var(--text)]">{shops.length} magasin{shops.length > 1 ? "s" : ""} actif{shops.length > 1 ? "s" : ""}</span>
        <span className="text-[var(--text-secondary)]">•</span>
        <span>{totalSessions} session{totalSessions > 1 ? "s" : ""} remontée{totalSessions > 1 ? "s" : ""}</span>
        <span className="text-[var(--text-secondary)]">•</span>
        <span className="text-[var(--positive)]">✓ {totalSealed} scellée{totalSealed > 1 ? "s" : ""}</span>
        {unsealedSessions > 0 && (
          <>
            <span className="text-[var(--text-secondary)]">•</span>
            <span className="text-amber-400">{unsealedSessions} non scellée{unsealedSessions > 1 ? "s" : ""}</span>
          </>
        )}
      </div>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-[var(--text-secondary)]">
        <span>
          CA moyen par session :{" "}
          <span className="tabular-nums text-[var(--text)]">
            {totalSessions > 0 ? `${formatNumber(totalSales / totalSessions, { minFraction: 2, maxFraction: 2 })} €` : "—"}
          </span>
        </span>
        <span>
          Ticket moyen :{" "}
          <span className="tabular-nums text-[var(--text)]">
            {totalTickets > 0 ? `${formatNumber(totalSales / totalTickets, { minFraction: 2, maxFraction: 2 })} €` : "—"}
          </span>
        </span>
      </div>
      {shops.length > 0 && (
        <div className="mb-6 text-sm text-[var(--text-secondary)]">
          <span>Volume total : </span>
          <span className="tabular-nums font-medium text-[var(--text)]">{formatSignedAmount(totalSales)}</span>
        </div>
      )}
      {!shops.length ? (
        <p className="text-[var(--muted)] text-sm">Aucun point de vente pour la période sélectionnée.</p>
      ) : (
        <ul className="space-y-4">
          {shops.map((shop) => {
            const shopSessions = (data?.items ?? []).filter(
              (i) => (i.shop_id ?? "(Sans point de vente)") === shop.shop_id
            );
            const isSessionGranularity = chartGranularity === "session";
            const { series1, series2, total1, total2 } = buildPosSeriesForShop(
              shopSessions,
              isSessionGranularity ? "month" : chartGranularity
            );
            const storageKey = `linky-pos-shop-${shop.shop_id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
            const shopUnsealed = Math.max(0, shop.total_sessions - shop.sealed_sessions);
            return (
              <li
                key={shop.shop_id}
                className="rounded-lg border border-[var(--border)] p-4"
              >
                <div className="space-y-1.5 text-sm">
                  <div className="font-semibold text-[var(--text)]">{getShopDisplayName(shop.shop_id, companies)}</div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span className="tabular-nums font-medium text-[var(--text)]">{formatNumber(shop.total_sales, { minFraction: 2, maxFraction: 2 })} €</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
                    <span>{shop.total_sessions} session{shop.total_sessions > 1 ? "s" : ""}</span>
                    <span className="text-[var(--positive)]">✔ {shop.sealed_sessions} scellée{shop.sealed_sessions > 1 ? "s" : ""}</span>
                    {shopUnsealed > 0 && (
                      <span className="text-amber-400">
                        ⚠ {shopUnsealed} non scellée{shopUnsealed > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <CardChartSection
                  storageKey={storageKey}
                  sectionTitle="Évolution"
                  chartType={chartType}
                  onChartTypeChange={handleChartTypeChange}
                  chartGranularity={chartGranularity}
                  onChartGranularityChange={handleGranularityChange}
                  availableGranularities={availableGranularities}
                  whyContent={{
                    periodLabel: `Du ${period.from} au ${period.to}`,
                    tenantId: tenantId ?? undefined,
                    dataSource: "Vault (agrégations)",
                    calculationRule: "TTC, scellé",
                  }}
                >
                  {isSessionGranularity ? (
                    <PosSessionChart
                      sessions={shopSessions}
                      chartType={chartType}
                      currency="EUR"
                    />
                  ) : (
                    <DualSeriesChart
                      series1={series1}
                      series2={[]}
                      total1={total1}
                      total2={0}
                      label1={`Ventes scellées (${shop.sealed_sessions})`}
                      label2="Ventes en attente"
                      granularity={chartGranularity}
                      chartType={chartType}
                      currency="EUR"
                      showSeries2={false}
                    />
                  )}
                </CardChartSection>
                {(() => {
                  const isDetailExpanded = expandedDetailShops.has(shop.shop_id);
                  const sortedSessions = [...shopSessions].sort(
                    (a, b) => new Date(b.closed_at).getTime() - new Date(a.closed_at).getTime()
                  );
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedDetailShops((prev) => {
                            const next = new Set(prev);
                            if (next.has(shop.shop_id)) next.delete(shop.shop_id);
                            else next.add(shop.shop_id);
                            return next;
                          });
                        }}
                        className="mt-3 flex items-center gap-1 text-sm text-[var(--accent)] hover:underline font-medium"
                        aria-expanded={isDetailExpanded}
                      >
                        <span className="transition-transform" style={{ transform: isDetailExpanded ? "rotate(90deg)" : "none" }}>▸</span>
                        Détail
                      </button>
                      {isDetailExpanded && (
                        <div className="mt-3 border-t border-[var(--border)] pt-3">
                          <div className="space-y-1 text-sm font-semibold text-[var(--text-secondary)] mb-4">
                            <div>{shop.total_sessions} session{shop.total_sessions > 1 ? "s" : ""} • {shop.total_tickets} ticket{shop.total_tickets > 1 ? "s" : ""} compté{shop.total_tickets > 1 ? "s" : ""}</div>
                            <div className="text-[var(--positive)]">✓ {shop.sealed_sessions} scellée{shop.sealed_sessions > 1 ? "s" : ""}</div>
                            {shopUnsealed > 0 && (
                              <div className="text-amber-400">{shopUnsealed} non scellée{shopUnsealed > 1 ? "s" : ""}</div>
                            )}
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                              {shop.total_sessions > 0 && (
                                <span className="tabular-nums font-medium text-[var(--text)]">
                                  CA moyen par session : {formatNumber(shop.total_sales / shop.total_sessions, { minFraction: 2, maxFraction: 2 })} €
                                </span>
                              )}
                              {shop.total_tickets > 0 && (
                                <span className="tabular-nums font-medium text-[var(--text)]">
                                  Ticket moyen : {formatNumber(shop.total_sales / shop.total_tickets, { minFraction: 2, maxFraction: 2 })} €
                                </span>
                              )}
                            </div>
                          </div>
                          <ul className="divide-y divide-[var(--border)]">
                            {sortedSessions.map((item) => (
                            <li key={item.session_id} className="pt-3 first:pt-3 flex flex-wrap gap-4 justify-between items-start">
                              <div>
                                <span className="font-mono text-sm font-semibold">{item.session_id}</span>
                                <div className="text-xs text-[var(--muted)] mt-0.5">
                                  {formatSessionTime(item.opened_at)}
                                  {" → "}
                                  {formatSessionTime(item.closed_at)}
                                </div>
                              </div>
                              <div className="text-right text-sm">
                                <span className="tabular-nums font-medium">{formatNumber(item.total_sales, { minFraction: 2, maxFraction: 2 })} €</span>
                                {(item.difference ?? 0) !== 0 && (
                                  <div className="text-[var(--negative)] text-xs">Écart : {formatNumber(item.difference!, { minFraction: 2, maxFraction: 2 })} €</div>
                                )}
                              </div>
                              <span
                                className={`text-xs font-medium ${
                                  item.vault_status === "sealed"
                                    ? "text-[var(--positive)]"
                                    : item.vault_status === "pending"
                                    ? "text-[var(--warning)]"
                                    : "text-[var(--negative)]"
                                }`}
                              >
                                {VAULT_STATUS_LABEL[item.vault_status] ?? item.vault_status}
                              </span>
                            </li>
                          ))}
                          </ul>
                        </div>
                      )}
                    </>
                  );
                })()}
              </li>
            );
          })}
        </ul>
      )}
      <InstrumentCardFooter meta="Données : instantané · Source POS (Vault)" />
      {footer}
    </section>
  );
}
