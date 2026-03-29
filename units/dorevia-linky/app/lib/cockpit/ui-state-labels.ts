/**
 * Lexique canonique des états visibles — Pilotage (Web60 / T-W60-001, T-W60-002).
 * Source de vérité pour les libellés affichés ; normalisation ciblée des variantes API / héritées.
 */

export type UiStateKey =
  | "reliable"
  | "partial"
  | "to_confirm"
  | "certified"
  | "sealed"
  | "proxy"
  | "estimated"
  | "sync_ok"
  | "pending"
  | "unavailable"
  | "empty_useful";

export const UI_STATE_LABELS: Record<UiStateKey, string> = {
  reliable: "Fiable",
  partial: "Partiel",
  to_confirm: "À confirmer",
  certified: "Certifié",
  sealed: "Scellé",
  proxy: "Proxy",
  estimated: "Estimé",
  sync_ok: "Synchro OK",
  pending: "En attente",
  unavailable: "Indisponible",
  empty_useful: "Vide utile",
};

/** Statuts visibles carte Paiements (gouvernance) — lexique court canon. */
export const PAYMENTS_GOV_LABEL = {
  partial: UI_STATE_LABELS.partial,
  critical: UI_STATE_LABELS.to_confirm,
  progress: UI_STATE_LABELS.pending,
  ok: UI_STATE_LABELS.reliable,
} as const;

/** Page `/cockpit` — intégrité flux : clés sémantiques (évite « validé / partiel / à vérifier » comme contrat de données). */
export type CockpitFluxIntegrityLevel = "reliable" | "partial" | "to_confirm";

export const COCKPIT_FLUX_INTEGRITY: Record<
  CockpitFluxIntegrityLevel,
  { label: string; badgeVariant: "success" | "warning" | "danger" }
> = {
  reliable: { label: UI_STATE_LABELS.reliable, badgeVariant: "success" },
  partial: { label: UI_STATE_LABELS.partial, badgeVariant: "warning" },
  to_confirm: { label: UI_STATE_LABELS.to_confirm, badgeVariant: "danger" },
};

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normalise un libellé d’état affiché. Retourne `null` pour les formulations à supprimer (OK, Valide, etc.).
 * Branches textuelles : compat entrées héritées / API ; préférer en code les clés `UI_STATE_LABELS` ou `CockpitFluxIntegrityLevel`.
 * Chaînes descriptives non reconnues : retour inchangé (trim).
 */
export function normalizeUiStateLabel(input?: string | null): string | null {
  if (input == null) return null;
  const trimmed = input.trim();
  if (trimmed === "") return null;

  const emDash = "\u2014";
  if (trimmed === emDash || trimmed === "—" || trimmed === "-" || trimmed === "–") return null;

  const value = stripDiacritics(trimmed.toLowerCase());

  if (/validée/i.test(trimmed)) return UI_STATE_LABELS.reliable;
  if (/validé/i.test(trimmed)) return UI_STATE_LABELS.certified;

  if (value === "ok" || value === "valide" || value === "healthy") return null;
  if (value === "sur" || value === "solide") return null;

  // Compat chaînes héritées (« proxy data ») — doctrine §9.5 : affichage Partiel (lectures Vault)
  if (value === "proxy data" || value === "proxy") return UI_STATE_LABELS.partial;
  if (value === "fiable") return UI_STATE_LABELS.reliable;
  if (value === "partiel" || value === "partielle" || value === "donnees partielles" || value === "données partielles") {
    return UI_STATE_LABELS.partial;
  }
  if (value === "a confirmer" || value === "a verifier" || value === "à vérifier") return UI_STATE_LABELS.to_confirm;
  if (value === "certifie" || value === "certifié" || value === "certified") return UI_STATE_LABELS.certified;
  if (value === "scelle" || value === "scellé") return UI_STATE_LABELS.sealed;
  if (value === "estime" || value === "estimé" || value === "estimee" || value === "estimée") return UI_STATE_LABELS.estimated;
  if (value === "synchro ok" || value === "sync" || value === "synchro") return UI_STATE_LABELS.sync_ok;
  if (value === "en attente") return UI_STATE_LABELS.pending;
  if (value === "indisponible") return UI_STATE_LABELS.unavailable;
  if (value === "vide utile") return UI_STATE_LABELS.empty_useful;

  if (value === "confirme" || value === "confirmé") return UI_STATE_LABELS.reliable;
  if (value === "validation partielle") return UI_STATE_LABELS.partial;
  if (value === "ecart a analyser" || value === "écart à analyser") return UI_STATE_LABELS.to_confirm;
  if (value === "retard partiel") return UI_STATE_LABELS.partial;

  if (value === "donnees non disponibles" || value === "données non disponibles") return UI_STATE_LABELS.unavailable;

  return trimmed;
}

/** Libellé confiance cockpit (100 % vs partiel) — canon « Partiel » (masculin). */
export function confidenceLabelFromScore(score: number | null | undefined): string | undefined {
  if (score === null || score === undefined) return undefined;
  return score === 100 ? UI_STATE_LABELS.reliable : UI_STATE_LABELS.partial;
}
