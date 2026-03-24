/**
 * Client tenant-config : fetch, merge defaults, cache mémoire (spec §3.4, backlog TC1-3).
 * En erreur retourne TenantConfigError (forbidden, not_found, network, server, unknown).
 */

import type {
  TenantConfigResponse,
  TenantConfigError,
  TenantChromeConfig,
  TenantWorkspaceConfig,
} from "./tenant-types";
import {
  defaultChromeConfig,
  defaultWorkspaceConfig,
} from "./tenant-config-defaults";

export type FetchTenantConfigResult =
  | { ok: true; data: TenantConfigResponse }
  | { ok: false; error: TenantConfigError };

/** Cache mémoire par tenant (v1 only) ; invalidation implicite au switch (nouveau tenant = nouvelle entrée). */
const memoryCache = new Map<string, TenantConfigResponse>();

function mergeChrome(
  partial: TenantChromeConfig | undefined
): TenantConfigResponse["chrome"] {
  return {
    branding: {
      ...defaultChromeConfig.branding,
      ...partial?.branding,
    },
    header: {
      ...defaultChromeConfig.header,
      ...partial?.header,
    },
    footer: {
      ...defaultChromeConfig.footer,
      ...partial?.footer,
    },
    behavior: {
      ...defaultChromeConfig.behavior,
      ...partial?.behavior,
    },
  };
}

function mergeWorkspace(
  partial: TenantWorkspaceConfig | undefined
): TenantConfigResponse["workspace"] {
  return {
    apps: partial?.apps ?? defaultWorkspaceConfig.apps ?? [],
    sources: partial?.sources ?? defaultWorkspaceConfig.sources ?? [],
  };
}

/**
 * Récupère la config pour un tenant : GET /api/tenant-config?tenant=...
 * Merge avec les valeurs normatives ; cache en mémoire (v1).
 */
export async function fetchTenantConfig(
  tenantId: string
): Promise<FetchTenantConfigResult> {
  const cached = memoryCache.get(tenantId);
  if (cached) {
    return { ok: true, data: cached };
  }

  const url = `/api/tenant-config?tenant=${encodeURIComponent(tenantId)}`;
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (_e) {
    return {
      ok: false,
      error: { type: "network", message: "Réseau indisponible" },
    };
  }

  if (res.status === 403) {
    return {
      ok: false,
      error: { type: "forbidden", message: "Accès refusé" },
    };
  }
  if (res.status === 404) {
    return {
      ok: false,
      error: { type: "not_found", message: "Tenant introuvable" },
    };
  }
  if (res.status >= 500) {
    return {
      ok: false,
      error: { type: "server", message: `Erreur serveur ${res.status}` },
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      error: { type: "unknown", message: `Erreur ${res.status}` },
    };
  }

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    return {
      ok: false,
      error: { type: "server", message: "Réponse invalide" },
    };
  }

  const obj = raw as Record<string, unknown>;
  const configVersion =
    typeof obj.configVersion === "string" ? obj.configVersion : "1.0";
  const chrome = mergeChrome(obj.chrome as TenantChromeConfig | undefined);
  const workspace = mergeWorkspace(
    obj.workspace as TenantWorkspaceConfig | undefined
  );
  const permissions =
    obj.permissions && typeof obj.permissions === "object"
      ? (obj.permissions as TenantConfigResponse["permissions"])
      : undefined;
  const availableTenants = Array.isArray(obj.availableTenants)
    ? (obj.availableTenants as TenantConfigResponse["availableTenants"])
    : undefined;

  const data: TenantConfigResponse = {
    configVersion,
    chrome,
    workspace,
    permissions,
    availableTenants,
  };

  memoryCache.set(tenantId, data);
  return { ok: true, data };
}

/** Invalide le cache pour un tenant (appelé au switch si besoin). */
export function invalidateTenantConfigCache(tenantId: string): void {
  memoryCache.delete(tenantId);
}

/** Vide tout le cache (ex. au logout ou changement de contexte global). */
export function clearTenantConfigCache(): void {
  memoryCache.clear();
}
