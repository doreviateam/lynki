import type React from "react";
import type { PeriodStatusMap } from "@/app/lib/use-accounting-periods";

export type ViewMode = "all" | "cash" | "business" | "corrections" | "pos_shops" | "pos_z";

export interface ReportHeaderContentProps {
  productName: string;
  tagline: string;
  tenantBadgeOrSelector: React.ReactNode;
  currentApp: "linky" | "odoo";
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  ODOO_URL: string;
  tenantCtx: { availableTenants?: Array<{ id: string }> } | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  workspace: { sources?: Array<{ id: string; href: string; label: string }>; apps?: Array<{ id: string; href?: string; label: string }> } | undefined;
  chromeAdaptive: { chromePinned: boolean; setChromePinned: (v: boolean) => void } | null;
  appView?: "pilotage" | "synthese";
  onNavigateToAppView?: (view: "pilotage" | "synthese") => void;
  showPinChrome: boolean;
  showCompanyFilter: boolean;
  showPeriodFilter: boolean;
  chromeCompact: boolean;
  periodKey: string;
  periodYear: number;
  onPeriodKeyChange: (key: string) => void;
  onPeriodYearChange: (year: number) => void;
  periodOptionsToShow: Array<{ value: string; label: string }>;
  yearsToShow: number[];
  companies: Array<{ company_id: string; display_name?: string }>;
  companiesLoading: boolean;
  selectedCompanyId: string | null;
  onCompanyChange: (id: string | null) => void;
  moduleActif: string;
  showIntegrityBadge: boolean;
  tenantId: string;
  sealedCount: number | null;
  sealedCountComplete: boolean | undefined;
  onRefreshMetrics: (() => void) | undefined;
  onExpandChrome: (() => void) | undefined;
  periodStatuses?: PeriodStatusMap;
}
