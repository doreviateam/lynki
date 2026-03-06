/**
 * Formattage des nombres avec séparateur de milliers = espace (norme française).
 * Garantit un affichage cohérent dans toute l'app.
 */

const SPACE = "\u0020";

function ensureSpaceThousands(formatted: string): string {
  return formatted.replace(/\u202f|\u00a0/g, SPACE);
}

/**
 * Montant avec devise (ex. 1 434 786,21 €).
 * Formatage manuel pour garantir le séparateur de milliers partout.
 */
export function formatAmount(value: number, currency = "EUR"): string {
  return `${formatWithThousands(value, 2)} €`;
}

/**
 * Montant signé (ex. + 1 434 786,21 € ou − 480 000,00 €).
 * Formatage manuel pour garantir le séparateur de milliers partout.
 */
export function formatSignedAmount(value: number, currency = "EUR"): string {
  const sign = value >= 0 ? "+" : "\u2212";
  return `${sign} ${formatWithThousands(Math.abs(value), 2)} €`;
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
 */
export function formatAmountsInText(text: string): string {
  // Montants ≥ 1000 : 4+ chiffres consécutifs devant €, euros, EUR ou fin de segment
  const amountPattern = /\b(\d{4,})(?:[.,](\d+))?(?=\s*[€eE]|\s*[eE]uros?|\s*EUR|[\s)\]%\-–—]|$)/g;
  return text.replace(amountPattern, (_, intPart, decPart) => {
    const num = decPart ? parseFloat(`${intPart}.${decPart}`) : parseInt(intPart, 10);
    const dec = decPart ? Math.min(decPart.length, 2) : 0;
    return formatWithThousands(num, dec);
  });
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
