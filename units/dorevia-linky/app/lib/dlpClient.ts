/**
 * Client pour le service DLP — proxy Linky → DLP
 * Toutes les routes acceptent tenant par slug (ex: sarl-la-platine)
 */

const DLP_URL = process.env.DLP_URL || "http://dlp:8020";
const TIMEOUT_MS = 10000;

function getBaseUrl() {
  return DLP_URL.replace(/\/$/, "");
}

export async function dlpFetch(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<Response> {
  const { params, ...fetchOpts } = options;
  const qs = params ? new URLSearchParams(params).toString() : "";
  const url = `${getBaseUrl()}${path}${qs ? `?${qs}` : ""}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...fetchOpts,
      signal: controller.signal,
      headers: { Accept: "application/json", ...fetchOpts.headers } as HeadersInit,
      cache: "no-store",
    });
    clearTimeout(timeoutId);
    return res;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}
