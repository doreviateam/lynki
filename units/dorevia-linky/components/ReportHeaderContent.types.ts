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
  tenantCtx: { availableTenants?: Array<{ id: string; label?: string }>; resolvedTenant?: string | null } | null;
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
  /**
   * Mode aligné `stitch_carole_61` / `pilotage_desktop_v_r_na_canon_v5` :
   * première ligne = barre cockpit (titre Lynki, badge fiabilité, recherche) au lieu du bloc produit Dorevia.
   */
  /** Mode bandeau pilotage fusionné : champs optionnels (score non affiché en V1 minimal). */
  cockpitAppBar?: {
    confidenceScore?: number | null;
    confidenceLabel?: string;
    /**
     * `tablet` : densité et cibles tactiles intermédiaires (layout cockpit 768–1023 px).
     * `desktop` (défaut) : bandeau immersif large écran.
     */
    bandLayout?: "desktop" | "tablet";
  };
  /**
   * Cockpit pilotage grille, layout phone (T-PH-001) : bandeau 2 niveaux, périmètre replié dans `<details>`.
   */
  pilotagePhoneCompact?: {
    contextSummary: string;
  };
  /** Panneau filtres « Périmètre » (phone pilotage) — distinct du menu app (`menuOpen`). */
  pilotagePerimeterOpen: boolean;
  setPilotagePerimeterOpen: (v: boolean) => void;
  /**
   * Pages « profondeur » (ex. détail Trésorerie) : premier rang réduit (retour pilotage, actions),
   * sans bloc « Pilotage » dominant — le périmètre reste sur la ligne filtres dessous.
   */
  depthDetailContext?: boolean;
}
