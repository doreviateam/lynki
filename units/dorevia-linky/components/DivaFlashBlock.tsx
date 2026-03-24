"use client";

/**
 * Bloc synthèse DIVA — lecture instantanée
 * SPEC : ZeDocs/web23/SPEC_DIVA_Insights_v1.0.md
 * Flux : GET /api/diva/insight → 200 (affichage) ou 404 (fallback "Analyse en cours")
 * Linky ne dépend jamais de Mistral pour afficher.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { CardId } from "@/components/IconGrid";
import { formatAmountsInText } from "@/app/lib/format";
import type { DashboardMetricsResponse } from "@/app/api/dashboard-metrics/route";

const DEBOUNCE_MS = 200;
const CACHE_KEY_PREFIX = "diva_flash_";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const POLL_INTERVAL_MS = 6000;  // poll état "pending" (pas d'insight) : 6 s
const POLL_MAX_ATTEMPTS = 12;   // ~72 s max
// Background refresh après prewarm : poll silencieux pour détecter un insight plus récent
const BG_POLL_INTERVAL_MS = 8000;   // 8 s — moins agressif que le poll pending
const BG_POLL_MAX_ATTEMPTS = 15;    // ~120 s — le temps que Mistral génère
// Auto-reload silencieux continu : vérifie si Diva a produit un insight plus récent (aligné sur le runner 1–5 min)
const AUTO_RELOAD_MIN_MS = 60_000;   // 1 min
const AUTO_RELOAD_MAX_MS = 300_000;  // 5 min
function randomBetween(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function extractNumericCompanyId(raw: string | null): string {
  if (!raw) return "0";
  const match = raw.match(/(\d+)/);
  return match ? match[1] : "0";
}

interface DivaFlashBlockProps {
  tenantId: string;
  companyId: string | null;
  period: { from: string; to: string };
  /** Métriques partagées (parent) — évite double fetch pour prewarm */
  dashboardMetrics?: DashboardMetricsResponse | null;
  /** Carte en focus (vue détaillée) — pour future synthèse ciblée par indicateur */
  focusCardId?: CardId | null;
  /** Intégré en bas d'une carte (supprime bordure externe, margin réduit) */
  embedded?: boolean;
}

interface DivaFlash {
  headline: string;
  /** 3 formulations alternatives générées par Mistral — cycling local sans rappel API */
  headlines?: string[];
  what_i_see: string[];
  to_check: string[];
  confidence: "low" | "medium" | "high";
}

interface InsightResponse {
  state?: "ready" | "pending" | "failed";
  insight?: {
    message_text: string;
    flash?: DivaFlash;
    confidence?: string;
    created_at?: string;
    expires_at?: string;
    /** Âge de l'insight en secondes au moment de la lecture (Phase 3A). */
    insight_age_seconds?: number;
    /** Empreinte courte du FactsPack (12 hex) — invalide si les données changent (Phase 3A). */
    facts_version?: string;
    /** Durée de génération Mistral en ms (Phase 3A). */
    latency_ms?: number;
  };
  error?: { code?: string; message?: string };
  error_code?: string;
}

const CARD_ID_TO_SPEC_KEY: Record<string, string> = {
  treasury: "treasury_validated_pct",
  treasury_position: "treasury_position",
  cash: "cash",
  business: "business",
  taxes: "taxes",
  credit_notes: "credit_notes",
  refunds: "refunds",
  pos_shops: "pos_shops",
  pos_z: "pos_z",
};

function cacheKey(
  tenantId: string,
  companyId: string | null,
  period: { from: string; to: string },
  focusCardId?: CardId | null
) {
  const focus = focusCardId ?? "";
  return `${CACHE_KEY_PREFIX}${tenantId}_${companyId ?? "all"}_${period.from}_${period.to}_${focus}`;
}

const HEADLINE_JSON_RE = /"headline"\s*:\s*"((?:[^"\\]|\\.)*)"/;

/** Assure que le message commence par une majuscule. */
function capitalizeFirst(str: string): string {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Retourne le headline affichable — jamais d'accolade ni de JSON brut au rendu. */
function toDisplayHeadline(raw: string | undefined): string {
  const s = raw?.trim() ?? "";
  if (!s || (!s.startsWith("{") && !s.startsWith('"') && !s.includes('"headline"'))) return s;
  try {
    const parsed = JSON.parse(s);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed.headline === "string") return parsed.headline;
  } catch {
    const m = s.match(HEADLINE_JSON_RE);
    if (m?.[1]) return m[1].replace(/\\"/g, '"');
  }
  if (s.startsWith("{") || s.startsWith('"')) return "";
  return s;
}

/** SPEC v3 : cockpit = max 2 phrases. Découpe sur . ? ! et garde les 2 premières. */
function takeFirstTwoSentences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const parts = trimmed.split(/(?<=[.!?])\s+/);
  if (parts.length <= 2) return trimmed;
  return parts.slice(0, 2).join(" ").trim();
}

/** Normalisation éditoriale : termes EN → FR + épargne → trésorerie (langage cockpit). */
function normalizeInsightFr(text: string): string {
  return text
    .replace(/\bépargne\b/gi, "trésorerie")
    .replace(/d'épargne\b/gi, "de trésorerie")
    .replace(/\breceivables\b/gi, "créances")
    .replace(/\bAR\b/g, "créances clients")
    .replace(/\bretardades\b/gi, "retards")
    .replace(/\bpayables\b/gi, "dettes fournisseurs")
    .replace(/\bAP\b/g, "dettes fournisseurs")
    .replace(/\bpost-impôts\b/gi, "après impôts");
}

/** Headline prêt pour affichage cockpit : 2 phrases max + normalisation FR. */
function cockpitHeadline(raw: string | undefined): string {
  const displayed = toDisplayHeadline(raw);
  const normalized = normalizeInsightFr(displayed);
  return takeFirstTwoSentences(normalized);
}

/** Extrait le headline propre si l'API renvoie du JSON brut dans le champ headline. */
function normalizeFlash(flash: DivaFlash): DivaFlash {
  let headline = flash.headline?.trim() ?? "";
  if (!headline) return flash;
  if (headline.startsWith("{") || headline.startsWith('"') || headline.includes('"headline"')) {
    try {
      const parsed = JSON.parse(headline);
      if (typeof parsed === "string") {
        headline = parsed;
      } else if (parsed && typeof parsed.headline === "string") {
        headline = parsed.headline;
      }
    } catch {
      const m = headline.match(HEADLINE_JSON_RE);
      if (m?.[1]) {
        headline = m[1].replace(/\\"/g, '"');
      }
    }
  }
  if (headline === flash.headline) return flash;
  return { ...flash, headline };
}

function getCachedFlash(key: string): DivaFlash | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (!raw) return null;
    const { flash, ts } = JSON.parse(raw) as { flash: DivaFlash; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return flash;
  } catch {
    return null;
  }
}

function setCachedFlash(key: string, flash: DivaFlash) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify({ flash, ts: Date.now() }));
    }
  } catch {
    // quota exceeded, ignorer
  }
}

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "Élevé",
  medium: "Moyen",
  low: "Faible",
};

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const style =
    confidence === "high"
      ? "bg-[var(--positive)]/20 text-[var(--positive)]"
      : confidence === "medium"
        ? "bg-[var(--warning)]/20 text-[var(--warning)]"
        : "bg-[var(--muted)]/30 text-[var(--text-secondary)]";
  const label = CONFIDENCE_LABELS[confidence] ?? confidence;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}
      title={`Niveau de confiance : ${label}`}
    >
      {label}
    </span>
  );
}

/** "Calculé il y a X min" à partir de created_at ISO */
function formatComputedAgo(createdAt: string | undefined): string {
  if (!createdAt) return "";
  try {
    const t = new Date(createdAt).getTime();
    const diffMs = Date.now() - t;
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "Calculé à l'instant";
    if (diffMin === 1) return "Calculé il y a 1 min";
    if (diffMin < 60) return `Calculé il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    return diffH === 1 ? "Calculé il y a 1 h" : `Calculé il y a ${diffH} h`;
  } catch {
    return "";
  }
}

export function DivaFlashBlock({ tenantId, companyId, period, dashboardMetrics: dashboardMetricsProp, focusCardId, embedded }: DivaFlashBlockProps) {
  const [flash, setFlash] = useState<DivaFlash | null>(null);
  const [computedAt, setComputedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchRef = useRef<string>("");
  const requestIdRef = useRef(0);
  const prewarmSentRef = useRef<Set<string>>(new Set());
  const isManualRefreshRef = useRef(false);
  const pollAttemptRef = useRef(0);
  // Background refresh : created_at du dernier insight affiché + état du poll silencieux
  const displayedCreatedAtRef = useRef<string | null>(null);
  const bgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgPollAttemptsRef = useRef(0);
  // Indicateur discret "Actualisé" après mise à jour silencieuse
  const [justUpdated, setJustUpdated] = useState(false);
  // Auto-reload silencieux continu (intervalle aléatoire 1–5 min)
  const autoReloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // BEH-18 : tick 60s pour mettre à jour le label "Calculé il y a X min" en temps réel
  const [, setLabelTick] = useState(0);
  // BEH-15/16/17 : opacité du contenu flash pour transition silencieuse sans "saut"
  const [flashOpacity, setFlashOpacity] = useState(1);
  // Cycling headlines : index dans flash.headlines[] — "Reformuler" cycle sans rappel API
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const fetchDiva = useCallback(
    async (forceRefresh = false, fromCache = false) => {
      const myId = ++requestIdRef.current;
      if (!fromCache) {
        setLoading(true);
        setError(null);
      }

      try {
        const numericCompanyId = extractNumericCompanyId(companyId);
        const params = new URLSearchParams({
          tenant: tenantId,
          company_id: numericCompanyId,
          mode: focusCardId ? "card" : "cockpit",
          date_start: period.from,
          date_end: period.to,
        });
        if (focusCardId) {
          const specKey = CARD_ID_TO_SPEC_KEY[focusCardId] ?? focusCardId;
          params.set("card_key", specKey);
        }
        if (forceRefresh) {
          params.set("_t", Date.now().toString());
        }

        const res = await fetch(`/api/diva/insight?${params.toString()}`, {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        const data: InsightResponse = await res.json();

        if (myId !== requestIdRef.current) return;

        if (!res.ok || data.error) {
          setError(data.error?.message ?? "Lecture indisponible.");
          setFlash(null);
          return;
        }

        if (data.state === "ready" && data.insight) {
          const insight = data.insight;
          let flashFromInsight: DivaFlash;
          if (insight.flash) {
            flashFromInsight = insight.flash;
          } else if (insight.message_text) {
            try {
              const parsed = JSON.parse(insight.message_text);
              if (parsed && typeof parsed.headline === "string") {
                flashFromInsight = {
                  headline: parsed.headline,
                  what_i_see: Array.isArray(parsed.what_i_see) ? parsed.what_i_see : [],
                  to_check: Array.isArray(parsed.to_check) ? parsed.to_check : [],
                  confidence: (parsed.confidence ?? insight.confidence ?? "medium") as "low" | "medium" | "high",
                };
              } else {
                flashFromInsight = {
                  headline: insight.message_text,
                  what_i_see: [],
                  to_check: [],
                  confidence: (insight.confidence as "low" | "medium" | "high") ?? "medium",
                };
              }
            } catch {
              flashFromInsight = {
                headline: insight.message_text,
                what_i_see: [],
                to_check: [],
                confidence: (insight.confidence as "low" | "medium" | "high") ?? "medium",
              };
            }
          } else {
            flashFromInsight = {
              headline: "Analyse disponible.",
              what_i_see: [],
              to_check: [],
              confidence: (insight.confidence as "low" | "medium" | "high") ?? "medium",
            };
          }
          setError(null);
          const newCreatedAt = insight.created_at ?? null;
          // Mise à jour silencieuse détectée (BEH-15/16/17) : fade-out → swap → fade-in
          const isSilentUpdate = fromCache && displayedCreatedAtRef.current && newCreatedAt && newCreatedAt !== displayedCreatedAtRef.current;
          if (isSilentUpdate) {
            setJustUpdated(true);
            setTimeout(() => setJustUpdated(false), 4000);
          }
          setComputedAt(newCreatedAt);
          displayedCreatedAtRef.current = newCreatedAt;
          const normalized = normalizeFlash(flashFromInsight);
          setCachedFlash(cacheKey(tenantId, companyId, period, focusCardId), normalized);
          if (isSilentUpdate) {
            // Transition douce : fade-out 150 ms, swap, fade-in 150 ms
            setFlashOpacity(0);
            setTimeout(() => {
              setFlash(normalized);
              setHeadlineIndex(0);
              setFlashOpacity(1);
            }, 150);
          } else {
            setFlash(normalized);
            setHeadlineIndex(0);
          }
          // Signal d'activité → le runner sait qu'un utilisateur est actif (garde d'inactivité Option B).
          fetch("/api/diva/activity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenant: tenantId, company_id: parseInt(extractNumericCompanyId(companyId), 10) }),
          }).catch(() => { /* fire-and-forget */ });
          pollAttemptRef.current = 0;
          // Arrêter le poll de fond si l'insight est maintenant à jour
          if (bgPollRef.current) { clearInterval(bgPollRef.current); bgPollRef.current = null; }
          return;
        }

        if (data.state === "failed") {
          setError("Analyse temporairement indisponible (mise à jour automatique en cours).");
          setFlash(null);
          return;
        }

        // state === "pending" : le runner n'est pas encore passé ou cache expiré
        // On affiche la dernière version locale si disponible, sinon "Analyse en cours"
        if (!fromCache) {
          // Signal d'activité dès la consultation (même en pending) → évite idle_skip du runner (cercle vicieux).
          fetch("/api/diva/activity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenant: tenantId, company_id: parseInt(extractNumericCompanyId(companyId), 10) }),
          }).catch(() => { /* fire-and-forget */ });
          const cached = getCachedFlash(cacheKey(tenantId, companyId, period, focusCardId));
          if (cached) {
            setFlash(normalizeFlash(cached));
            setError(null);
          } else {
            setError("Synthèse en préparation… Affichage automatique dans quelques secondes.");
            setFlash(null);
          }
          // Prewarm fire-and-forget (1 seule fois par contexte) + démarrage du background poll
          const prewarmKey = cacheKey(tenantId, companyId, period, focusCardId);
          if (!prewarmSentRef.current.has(prewarmKey)) {
            prewarmSentRef.current.add(prewarmKey);
            const specKey = focusCardId ? (CARD_ID_TO_SPEC_KEY[focusCardId] ?? focusCardId) : undefined;
            const doPrewarm = (dashboard: DashboardMetricsResponse) => {
              if (!dashboard || typeof dashboard !== "object") return;
              fetch("/api/diva/prewarm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  context: {
                    tenant: tenantId,
                    company_id: parseInt(extractNumericCompanyId(companyId), 10),
                    date_debut: period.from,
                    date_fin: period.to,
                  },
                  dashboard,
                  ...(specKey && { focus_card: specKey }),
                }),
              }).catch(() => { /* fire-and-forget */ });
              // Démarrer le poll de fond silencieux pour détecter le nouvel insight
              if (!bgPollRef.current) {
                bgPollAttemptsRef.current = 0;
                bgPollRef.current = setInterval(() => {
                  bgPollAttemptsRef.current += 1;
                  if (bgPollAttemptsRef.current > BG_POLL_MAX_ATTEMPTS) {
                    if (bgPollRef.current) { clearInterval(bgPollRef.current); bgPollRef.current = null; }
                    return;
                  }
                  // Lecture silencieuse (fromCache=true → pas de spinner)
                  fetchDiva(false, true);
                }, BG_POLL_INTERVAL_MS);
              }
            };
            if (dashboardMetricsProp && typeof dashboardMetricsProp === "object") {
              doPrewarm(dashboardMetricsProp);
            } else if (dashboardMetricsProp === undefined) {
              // Standalone : pas de parent, on fetch nous-même
              fetch(`/api/dashboard-metrics?${new URLSearchParams({
                tenant: tenantId,
                date_debut: period.from,
                date_fin: period.to,
                ...(companyId && { company_id: companyId }),
              })}`, { cache: "no-store", headers: { Accept: "application/json" } })
                .then((r) => r.ok ? r.json() : null)
                .then(doPrewarm)
                .catch(() => {});
            }
            // Si dashboardMetricsProp === null : parent en chargement, l'effet prewarm différé enverra
          }
        }
      } catch {
        if (myId === requestIdRef.current && !fromCache) {
          setError("Lecture insight indisponible.");
        }
      } finally {
        if (myId === requestIdRef.current && !fromCache) {
          setLoading(false);
        }
      }
    },
    [tenantId, companyId, period.from, period.to, focusCardId, dashboardMetricsProp]
  );

  // Polling quand pending : re-fetch périodiquement jusqu'à ready ou max tentatives
  const isPending = error?.startsWith("Synthèse en préparation") && !flash;

  // Prewarm différé : si métriques arrivent via props pendant pending, envoyer sans fetch
  useEffect(() => {
    if (!isPending || !dashboardMetricsProp || typeof dashboardMetricsProp !== "object") return;
    const prewarmKey = cacheKey(tenantId, companyId, period, focusCardId);
    if (prewarmSentRef.current.has(prewarmKey)) return;
    prewarmSentRef.current.add(prewarmKey);
    const specKey = focusCardId ? (CARD_ID_TO_SPEC_KEY[focusCardId] ?? focusCardId) : undefined;
    fetch("/api/diva/prewarm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: {
          tenant: tenantId,
          company_id: parseInt(extractNumericCompanyId(companyId), 10),
          date_debut: period.from,
          date_fin: period.to,
        },
        dashboard: dashboardMetricsProp,
        ...(specKey && { focus_card: specKey }),
      }),
    }).catch(() => {});
  }, [isPending, dashboardMetricsProp, tenantId, companyId, period.from, period.to, focusCardId]);

  // Poll "pending" : aucun insight affiché, on attend que le runner produise
  useEffect(() => {
    if (!isPending) return;
    let mounted = true;
    pollAttemptRef.current = 0;
    const id = setInterval(() => {
      if (!mounted) return;
      pollAttemptRef.current += 1;
      if (pollAttemptRef.current > POLL_MAX_ATTEMPTS) {
        if (mounted) {
          setError("Analyse indisponible (service temporairement arrêté).");
          setFlash(null);
        }
        return;
      }
      fetchDiva(false, true);
    }, POLL_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [isPending, tenantId, companyId, period.from, period.to, focusCardId, fetchDiva]);

  // Nettoyage du poll de fond au démontage ou changement de contexte
  useEffect(() => {
    return () => {
      if (bgPollRef.current) { clearInterval(bgPollRef.current); bgPollRef.current = null; }
    };
  }, [tenantId, companyId, period.from, period.to, focusCardId]);

  // BEH-18 : tick toutes les 60 s pour re-rendre le label "Calculé il y a X min" en temps réel
  useEffect(() => {
    const id = setInterval(() => setLabelTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Auto-reload silencieux continu : quand un insight est affiché, on replanifie
  // une vérification dans 1–5 min (aléatoire, aligné sur le cycle diva-runner).
  // Si Diva a un insight plus récent (created_at différent), le badge "✓ Actualisé" s'affiche 4 s.
  useEffect(() => {
    if (!flash) return;
    if (autoReloadTimerRef.current) clearTimeout(autoReloadTimerRef.current);
    const delay = randomBetween(AUTO_RELOAD_MIN_MS, AUTO_RELOAD_MAX_MS);
    autoReloadTimerRef.current = setTimeout(() => {
      fetchDiva(false, true); // silencieux : pas de spinner, pas d'écrasement si inchangé
    }, delay);
    return () => {
      if (autoReloadTimerRef.current) clearTimeout(autoReloadTimerRef.current);
    };
  }, [flash, tenantId, companyId, period.from, period.to, focusCardId, fetchDiva]);

  // Réinitialiser lastFetch pour forcer un nouveau fetch quand le contexte (société, période) change
  useEffect(() => {
    lastFetchRef.current = "";
  }, [tenantId, companyId, period.from, period.to, focusCardId]);

  // Cache navigateur : affichage immédiat si même filtres récents (< 5 min)
  useEffect(() => {
    const cached = getCachedFlash(cacheKey(tenantId, companyId, period, focusCardId));
    if (cached) {
      setFlash(normalizeFlash(cached));
      setError(null);
    } else {
      setFlash(null);
      setError(null);
      setComputedAt(null);
    }
  }, [tenantId, companyId, period.from, period.to, focusCardId]);

  // Debounce puis fetch (refresh silencieux si cache affiché)
  // Ne pas déclencher si une reformulation manuelle est en cours (évite 404 qui écrase le résultat)
  useEffect(() => {
    const key = `${tenantId}-${companyId ?? ""}-${period.from}-${period.to}-${focusCardId ?? ""}`;
    if (key === lastFetchRef.current && !loading) return;
    if (isManualRefreshRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (isManualRefreshRef.current) return;
      lastFetchRef.current = key;
      const fromCache = !!getCachedFlash(cacheKey(tenantId, companyId, period, focusCardId));
      fetchDiva(false, fromCache);
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [tenantId, companyId, period.from, period.to, focusCardId, fetchDiva, loading]);

  const handleRefresh = useCallback(() => {
    // Cycle pur dans headlines[] avec wrap-around — jamais d'appel réseau
    if (!flash?.headlines || flash.headlines.length === 0) return;
    setHeadlineIndex((prev) => (prev + 1) % flash.headlines!.length);
  }, [flash]);

  const wrapperClass = embedded
    ? "mt-4 pt-4 border-t border-[var(--border)] w-full"
    : "mt-8 w-full max-w-2xl md:max-w-3xl";
  const innerClass = embedded
    ? "pt-2"
    : "rounded-xl border border-emerald-600/30 bg-slate-900 p-5 md:p-6 shadow-lg shadow-emerald-600/5";

  return (
    <div className={wrapperClass}>
      <div className={innerClass}>

        {/* Zone 1 — Titre du module */}
        {!embedded && (
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="material-symbols-outlined text-emerald-400"
                style={{ fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 18" }}
              >
                auto_awesome
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Optimization Insight
              </span>
              {/* Badge "Actualisé" — apparaît 4 s après une mise à jour silencieuse */}
              {justUpdated && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--positive)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--positive)] animate-pulse">
                  ✓ Actualisé
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {flash?.headlines && flash.headlines.length > 1 && (
                <span className="text-[10px] text-[var(--text-secondary)] tabular-nums select-none">
                  {headlineIndex + 1}&thinsp;/&thinsp;{flash.headlines.length}
                </span>
              )}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={!flash?.headlines || flash.headlines.length === 0}
                className="flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40"
                title="Afficher une autre formulation du même message"
                aria-label="Reformuler l'analyse"
              >
                <span aria-hidden>↻</span>
                <span>Reformuler</span>
              </button>
            </div>
          </div>
        )}

        {/* Chargement initial */}
        {loading && !flash && (
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <span className="text-sm">Synthèse en cours…</span>
          </div>
        )}

        {error && !flash && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
            <p>{error}</p>
            {isPending && (
              <span
                className="inline-flex items-center gap-1.5 text-xs text-[var(--accent-soft)]"
                title="Vérification automatique en cours"
              >
                <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[var(--accent)]" />
                <span>Vérification…</span>
              </span>
            )}
          </div>
        )}

        {error && flash && (
          <p className="mb-2 text-sm text-[var(--warning)]">{error}</p>
        )}

        {flash && (
          // BEH-15/16/17 : transition opacity 150ms — pas de saut, pas de reflow brutal
          <div style={{ opacity: flashOpacity, transition: "opacity 150ms ease-in-out" }}>
            {/* Zone 2 — SPEC v3 cockpit : 2 phrases max (phrase principale + phrase d'écart)
                headlines[headlineIndex] si disponible, sinon fallback sur headline */}
            <p
              className="whitespace-pre-wrap text-base font-medium leading-relaxed text-[var(--text)]"
              title={capitalizeFirst(toDisplayHeadline(flash.headlines?.[headlineIndex] ?? flash.headline))}
            >
              {formatAmountsInText(capitalizeFirst(cockpitHeadline(flash.headlines?.[headlineIndex] ?? flash.headline)))}
            </p>

            <hr className="my-3 border-t border-[var(--border)]" aria-hidden />

            {/* Zone 3 — Desktop : contenu déployé directement / Mobile : dépliable */}
            {(flash.what_i_see?.length > 0 || flash.to_check?.length > 0) ? (
              <>
                {/* Desktop md+ : what_i_see + to_check visibles sans interaction */}
                <div className="hidden md:block space-y-3">
                  {flash.what_i_see && flash.what_i_see.length > 0 && (
                    <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-[var(--text-secondary)]">
                      {flash.what_i_see.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-[var(--accent)]/50" aria-hidden />
                          {formatAmountsInText(item)}
                        </li>
                      ))}
                    </ul>
                  )}
                  {flash.to_check && flash.to_check.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Points de vigilance</p>
                      <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                        {flash.to_check.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-[var(--warning)]/60" aria-hidden />
                            {formatAmountsInText(normalizeInsightFr(item))}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="pt-1">
                    <ConfidenceBadge confidence={flash.confidence} />
                  </div>
                </div>

                {/* Mobile : dépliable compact */}
                <details className="group md:hidden">
                  <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)]">
                    <span className="transition-transform group-open:rotate-90" aria-hidden>▶</span>
                    <span>Données utilisées</span>
                    <ConfidenceBadge confidence={flash.confidence} />
                  </summary>
                  <div className="mt-2 pl-4 space-y-2">
                    {flash.to_check && flash.to_check.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Points de vigilance</p>
                        <ul className="grid grid-cols-1 gap-y-0.5 text-xs text-[var(--text-secondary)]">
                          {flash.to_check.map((item, i) => (
                            <li key={i}>{formatAmountsInText(normalizeInsightFr(item))}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {flash.what_i_see && flash.what_i_see.length > 0 && (
                      <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-[var(--text-secondary)]">
                        {flash.what_i_see.map((item, i) => (
                          <li key={i}>{formatAmountsInText(item)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              </>
            ) : (
              <div className="mt-1">
                <ConfidenceBadge confidence={flash.confidence} />
              </div>
            )}

            {loading && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                <span>Mise à jour…</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pied du bloc : horodatage + bouton Rafraîchir (mode embedded ou si pas de titre) */}
      {(embedded || !flash) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[var(--text-secondary)]">
            {computedAt && formatComputedAgo(computedAt) ? (
              <>
                <span title={computedAt}>{formatComputedAgo(computedAt)}</span>
                <span className="mx-1.5">·</span>
              </>
            ) : null}
            Lecture assistée par DIVA. L&apos;analyse finale relève de l&apos;utilisateur.
          </p>
          {embedded && (
            <div className="flex items-center gap-2 shrink-0">
              {flash?.headlines && flash.headlines.length > 1 && (
                <span className="text-[10px] text-[var(--text-secondary)] tabular-nums select-none">
                  {headlineIndex + 1}&thinsp;/&thinsp;{flash.headlines.length}
                </span>
              )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={!flash?.headlines || flash.headlines.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40"
              title="Afficher une autre formulation du même message"
              aria-label="Reformuler l'analyse"
            >
              <span aria-hidden>↻</span>
              <span>Reformuler</span>
            </button>
            </div>
          )}
        </div>
      )}
      {/* Mode non-embedded avec flash : horodatage discret sous le bouton dans le titre */}
      {!embedded && flash && computedAt && formatComputedAgo(computedAt) && (
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          <span title={computedAt}>{formatComputedAgo(computedAt)}</span>
          <span className="mx-1.5">·</span>
          Lecture assistée par DIVA. L&apos;analyse finale relève de l&apos;utilisateur.
        </p>
      )}
    </div>
  );
}
