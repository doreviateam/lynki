/**
 * Types pour la tenant-config multi-tenant (spec SPEC_TENANT_CONTEXT_ET_CHROME §3.2, §3.3).
 * ERP-agnostique : pas de clé produit en dur.
 */

/** Version du schéma de config (évolution future chrome/workspace) */
export type TenantConfigVersion = string;

/** Erreur normalisée du client tenant-config (backlog TC1-1, Phase 6) */
export type TenantConfigErrorType =
  | "forbidden"
  | "not_found"
  | "network"
  | "server"
  | "unknown";

export interface TenantConfigError {
  type: TenantConfigErrorType;
  message?: string;
}

/** Branding (logo, nom produit, tagline) */
export interface TenantBrandingConfig {
  logoUrl?: string;
  productName?: string;
  tagline?: string;
}

/** Options header (filtres, "Garder le bandeau") */
export interface TenantHeaderConfig {
  showCompanyFilter?: boolean;
  showPeriodFilter?: boolean;
  showPinChrome?: boolean;
}

/** Options footer (drawer confiance, libellé Vault) */
export interface TenantFooterConfig {
  showTrustDrawer?: boolean;
  vaultLinkLabel?: string;
}

/** Comportement chrome (auto-hide, pin par défaut) */
export interface TenantBehaviorConfig {
  allowAutoHide?: boolean;
  defaultChromePinned?: boolean;
}

/** Bloc chrome (spec §3.2) */
export interface TenantChromeConfig {
  branding?: TenantBrandingConfig;
  header?: TenantHeaderConfig;
  footer?: TenantFooterConfig;
  behavior?: TenantBehaviorConfig;
}

/** Entrée menu app (navigation interne Linky) */
export interface TenantWorkspaceApp {
  id: string;
  label: string;
  href?: string;
  viewMode?: string;
}

/** Entrée source externe (ERP, POS, Banque, Admin, etc.) */
export interface TenantWorkspaceSource {
  id: string;
  label: string;
  href: string;
  type?: "erp" | "pos" | "banque" | "facturation" | "paie" | "crm" | "admin";
}

/** Bloc workspace (spec §3.3) */
export interface TenantWorkspaceConfig {
  apps?: TenantWorkspaceApp[];
  sources?: TenantWorkspaceSource[];
}

/** Permissions (droits utilisateur ; config ≠ permissions) */
export interface TenantPermissions {
  [key: string]: boolean | string[] | undefined;
}

/** Tenant accessible (liste sélecteur) */
export interface TenantOption {
  id: string;
  label?: string;
}

/** Réponse API tenant-config (spec §3.1) */
export interface TenantConfigResponse {
  configVersion: string;
  chrome: TenantChromeConfig;
  workspace: TenantWorkspaceConfig;
  permissions?: TenantPermissions;
  availableTenants?: TenantOption[];
}
