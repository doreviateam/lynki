/**
 * Client pour le service DLP — proxy Linky → Vault (ADR-001 ZeDocs/web51).
 * Toutes les routes appellent VAULT_URL + /ui/dlp/... ; le Vault gateway appelle DLP en aval.
 * Toutes les routes acceptent tenant par slug (ex: sarl-la-platine).
 */

const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const TIMEOUT_MS = 10000;

function getBaseUrl(): string {
  return VAULT_URL.replace(/\/$/, "");
}

/** Transforme le chemin DLP /api/v1/xxx en chemin Vault /ui/dlp/xxx */
function toVaultPath(path: string): string {
  if (path.startsWith("/api/v1/")) {
    return "/ui/dlp" + path.slice(7); // /api/v1 -> /ui/dlp
  }
  return path;
}

export async function dlpFetch(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<Response> {
  const { params, ...fetchOpts } = options;
  const vaultPath = toVaultPath(path);
  const qs = params ? new URLSearchParams(params).toString() : "";
  const url = `${getBaseUrl()}${vaultPath}${qs ? `?${qs}` : ""}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...fetchOpts,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(params?.tenant && { "X-Tenant": params.tenant }),
        ...(fetchOpts.headers as HeadersInit),
      } as HeadersInit,
      cache: "no-store",
    });
    clearTimeout(timeoutId);
    return res;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}
