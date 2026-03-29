/**
 * Formattage des nombres avec séparateur de milliers = espace (norme française).
 * Garantit un affichage cohérent dans toute l'app.
 */

const SPACE = "\u0020";

function getCurrencyLabel(currency = "EUR"): string {
  const code = (currency || "EUR").toUpperCase();
  if (code === "EUR") return "€";
  if (code === "USD") return "$";
  if (code === "GBP") return "£";
  return code;
}

/** Détecte si la chaîne porte déjà un symbole ou code devise. */
function stringHasCurrencySymbol(s: string): boolean {
  return /[\u20AC€]|\$|£|\b(?:EUR|USD|GBP)\b/i.test(s);
}

function ensureSpaceThousands(formatted: string): string {
  return formatted.replace(/\u202f|\u00a0/g, SPACE);
}

/**
 * Montant avec devise (ex. 1 434 786,21 €).
 * Formatage manuel pour garantir le séparateur de milliers partout.
 */
export function formatAmount(value: number, currency = "EUR"): string {
  return `${formatWithThousands(value, 2)} ${getCurrencyLabel(currency)}`;
}

/**
 * Montant signé (ex. + 1 434 786,21 € ou − 480 000,00 €).
 * Formatage manuel pour garantir le séparateur de milliers partout.
 */
export function formatSignedAmount(value: number, currency = "EUR"): string {
  const sign = value >= 0 ? "+" : "\u2212";
  return `${sign} ${formatWithThousands(Math.abs(value), 2)} ${getCurrencyLabel(currency)}`;
}

/**
 * Cockpit : complète la devise, réaligne 2 décimales depuis `value` si affichage EUR
 * (évite chaînes tronquées type « 118 179,4 € » venant du Metric Engine / cache).
 * Laisse inchangés hits, %, devises non EUR, libellés sans chiffres.
 */
export function ensureCockpitKpiShowsEuro(raw: { formatted?: string | null; value?: unknown }): string {
  const f = raw?.formatted;
  const s = f != null ? String(f).trim() : "";

  /** Même grammaire que `formatSignedAmount` (espaces milliers, 2 décimales, espace avant €). */
  const fromNumberUnsigned = (n: number) => formatAmount(n, "EUR");

  if (s === "" || s === "—") {
    if (typeof raw.value === "number" && Number.isFinite(raw.value)) {
      return fromNumberUnsigned(raw.value);
    }
    return "—";
  }

  if (stringHasCurrencySymbol(s)) {
    const isEurDisplay = /[\u20AC€]|EUR/i.test(s) && !/\$|£|\bUSD\b|\bGBP\b/i.test(s);
    if (isEurDisplay && typeof raw.value === "number" && Number.isFinite(raw.value)) {
      const lead = s.trimStart();
      if (lead.startsWith("+") || lead.startsWith("−") || lead.startsWith("-")) {
        return formatSignedAmount(raw.value, "EUR");
      }
      return fromNumberUnsigned(raw.value);
    }
    return ensureSpaceThousands(s);
  }

  if (!/\d/.test(s)) {
    return s;
  }
  if (/\b(?:hits?|hit)\b/i.test(s) || /%\s*$/.test(s) || /\bn\.?\s*d\.?\b/i.test(s)) {
    return s;
  }

  if (typeof raw.value === "number" && Number.isFinite(raw.value)) {
    return fromNumberUnsigned(raw.value);
  }

  return `${s.replace(/\s+$/, "")} ${getCurrencyLabel("EUR")}`;
}

/**
 * Sépare le corps numérique et le suffixe « € » pour le layout cockpit :
 * seul le corps défile en overflow-x ; le symbole reste toujours visible à droite.
 */
export function splitMasterAmountForNoWrapEuro(display: string): { body: string; euroTail: string } {
  const t = display.trimEnd();
  if (t === "" || t === "—") return { body: t, euroTail: "" };
  const idx = Math.max(t.lastIndexOf("€"), t.lastIndexOf("\u20AC"));
  if (idx < 0) return { body: t, euroTail: "" };
  const body = t.slice(0, idx).replace(/[\s\u00a0\u202f]+$/, "");
  const euroTail = t.slice(idx);
  return { body, euroTail };
}

/** Formate manuellement un nombre avec séparateur de milliers (espace), indépendant de Intl. */
function formatWithThousands(n: number, decimals = 0): string {
  const fixed = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
  const [intPart, decPart] = fixed.split(".");
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, SPACE);
  return decPart ? `${withSpaces},${decPart}` : withSpaces;
}

/**
 * Formate les montants dans un texte (ex. "1434786 €" ou "1440 €" → "1 434 786 €" / "1 440 €").
 * Utile pour le discours DIVA généré par Mistral.
 * Utilise un formatage manuel pour garantir le séparateur de milliers partout.
 * Accepte tout type (API parfois non strictement string) pour éviter un crash au rendu.
 */
export function formatAmountsInText(text: string | number | null | undefined): string {
  if (text == null) return "";
  const s = typeof text === "string" ? text : String(text);
  // Montants ≥ 1000 : 4+ chiffres consécutifs devant €, euros, EUR ou fin de segment
  const amountPattern = /\b(\d{4,})(?:[.,](\d+))?(?=\s*[€eE]|\s*[eE]uros?|\s*EUR|[\s)\]%\-–—]|$)/g;
  return s.replace(amountPattern, (_, intPart, decPart) => {
    const num = decPart ? parseFloat(`${intPart}.${decPart}`) : parseInt(intPart, 10);
    const dec = decPart ? Math.min(decPart.length, 2) : 0;
    return formatWithThousands(num, dec);
  });
}

/**
 * Délai moyen de paiement — SPEC Priorisation v1.1 §7.
 * > 0 → "X j" ; 0 → "0 j" ; < 0 → "X j d'avance" ; null/undefined → "n.d."
 */
export function formatPaymentDelayDays(days: number | null | undefined): string {
  if (days == null) return "n.d.";
  const n = Math.round(days);
  if (n > 0) return `${n} j`;
  if (n === 0) return "0 j";
  return `${Math.abs(n)} j d'avance`;
}

/**
 * Nombre avec décimales optionnelles (ex. 1 400 952 ou 1 400 952,21).
 */
export function formatNumber(
  value: number,
  options?: { minFraction?: number; maxFraction?: number }
): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: options?.minFraction ?? 0,
    maximumFractionDigits: options?.maxFraction ?? 2,
  }).format(value);
  return ensureSpaceThousands(formatted);
}
