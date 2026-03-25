/**
 * Valeurs normatives pour la tenant-config (spec §3bis, backlog TC1-2).
 * Garantissent un rendu sûr et cohérent en cas de config partielle.
 */

import type { TenantChromeConfig, TenantWorkspaceConfig } from "./tenant-types";

export const DEFAULT_PRODUCT_NAME = "Dorevia Lynki";

export const defaultChromeConfig: TenantChromeConfig = {
  branding: {
    productName: DEFAULT_PRODUCT_NAME,
  },
  header: {
    showCompanyFilter: true,
    showPeriodFilter: true,
    showPinChrome: true,
  },
  footer: {
    showTrustDrawer: true,
  },
  behavior: {
    allowAutoHide: true,
    defaultChromePinned: true,
  },
};

export const defaultWorkspaceConfig: TenantWorkspaceConfig = {
  apps: [],
  sources: [],
};

/** Retourne les defaults complets (merge côté client avec réponse API) */
export function getDefaultTenantConfig(): {
  chrome: TenantChromeConfig;
  workspace: TenantWorkspaceConfig;
} {
  return {
    chrome: { ...defaultChromeConfig },
    workspace: { ...defaultWorkspaceConfig },
  };
}
