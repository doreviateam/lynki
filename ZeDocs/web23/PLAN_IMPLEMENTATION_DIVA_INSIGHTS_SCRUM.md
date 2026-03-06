# Plan d'implémentation Scrum — DIVA Insights v1.1

**Version :** 1.1  
**Date :** 2026-02-18  
**Dernière mise à jour :** 2026-02-16 (implémentation terminée)  
**Référence :** `SPEC_DIVA_Insights_v1.0.md`, `ANALYSE_IMPACT_DIVA_INSIGHTS_v1.0.md`

**Statut :** ✅ **Implémenté** — voir `POINT_ETAPE_IMPLEMENTATION_DIVA_INSIGHTS_2026-02-16.md`

---

## 1. Vue d'ensemble

| Sprint | Périmètre | Estimation | Livrable | Statut |
|--------|-----------|------------|----------|--------|
| **Sprint 1** | Backend (DIVA + Runner) | 4–5 j | Génération dans `diva_insights`, GET opérationnel | ✅ |
| **Sprint 2** | Linky + E2E | 2–3 j | UX instantanée, flux explain/async déprécié | ✅ |

**Total :** 6–8 jours.

**Définition of Done :** Code review, tests passent, doc à jour. Pas de régression sur le flux existant (coexistence pendant transition).

---

## 2. Sprint 1 — Backend

### S1.1 Migration SQL — table, index, purge

**Estimation :** 0,5 j

**Tâches :**
- Créer migration : table `diva_insights` (schéma §5.1)
- Créer index : `idx_diva_insights_unique_ok`, `idx_diva_insights_lookup`, `idx_diva_insights_expires`, `idx_diva_insights_context_ok`
- Script ou job purge par lots (CTE + `ORDER BY id` + `LIMIT 500`, §5.5)

**Critères d'acceptation :**
- [x] Migration s'exécute sans erreur
- [x] Contraintes CHECK (mode/card_key) validées
- [x] Purge testée manuellement ou unitaire

**Dépendances :** Aucune (point d'entrée).

---

### S1.2 hash_input — construction et canonicalisation

**Estimation :** 1 j

**Tâches :**
- Implémenter `toMinor(value, minorUnit) → *int64` avec `round_half_away_from_zero`
- Implémenter `toBasisPoints(value) → *int64` pour treasury_validated_pct
- Implémenter `buildHashInput(payload) → HashInput` selon CARD_VALUE_SCALE et FOCUS_CARD_DETAILS_SCALE (§4.4.5)
- Implémenter `canonicalJSON(v any) []byte` — tri lexicographique des clés (attention Go map order)
- Implémenter `payload_hash = SHA256(canonicalJSON(buildHashInput(payload)))`
- Tests unitaires : idempotence (même payload → même hash), cas null, cas négatifs

**Critères d'acceptation :**
- [x] Même payload for AI → même payload_hash (test déterministe)
- [x] Variation formatted/label n'impacte pas le hash
- [x] Float 1686.84 → 168684 (centimes)
- [x] `value == null` → `*_minor == null`

**Dépendances :** Aucune (logique pure).

**Référence :** §4.4.5, `EXEMPLES_PAYLOAD_IA_DASHBOARD_METRICS.md`.

---

### S1.3 GET /diva/insights

**Estimation :** 0,5 j

**Tâches :**
- Handler GET avec paramètres : tenant, company_id, mode, card_key, period (ou date_start/date_end)
- Résoudre period → dates (YTD, MTD) via `INSIGHTS_TIMEZONE`
- Calculer `context_key` (SHA-256 du contexte)
- Requête SQL : `WHERE context_key = $1 AND status = 'ok' AND expires_at > now() ORDER BY created_at DESC LIMIT 1`
- Réponse 200 (insight) ou 404

**Critères d'acceptation :**
- [x] GET cockpit YTD retourne un insight frais si présent
- [x] GET card cash retourne l'insight correspondant
- [x] 404 si aucun insight ou expiré

**Dépendances :** S1.1 (table existe).

---

### S1.4 POST /diva/generate

**Estimation :** 1,5 j

**Tâches :**
- Validation payload (400 si champs manquants)
- Calcul `context_key` et `payload_hash` (via S1.2)
- Lock session sur `context_key` (Option 1 ou 2, §5.5) — defer unlock
- Double-check : si insight frais identique (payload_hash) → 204
- Appel Mistral (réutiliser client existant)
- Insert dans `diva_insights` si succès ; ne rien écrire si échec
- Réponses : 200, 204, 400, 500, 503 (lock timeout)

**Critères d'acceptation :**
- [x] Même payload → 204 (pas de double Mistral)
- [x] Lock évite les races (test concurrence)
- [x] 503 si lock timeout
- [x] Erreur Mistral → pas d'insert, dernier insight conservé

**Dépendances :** S1.1, S1.2.

---

### S1.5 Runner — cockpit + 2–3 cartes

**Estimation :** 1 j

**Tâches :**
- Remplacer appel `explain/async` par `POST /diva/generate`
- Construire payload depuis `dashboard-metrics` (GET Linky ou équivalent)
- Contexte cockpit : YTD, MTD
- Contexte card : treasury_validated_pct, cash, business (2–3 cartes max)
- Paramètre `generated_from_runner: true`
- Guard : max 1–2 jobs Mistral simultanés

**Critères d'acceptation :**
- [x] Runner alimente diva_insights pour cockpit YTD/MTD
- [x] Runner alimente 2–3 cartes (treasury, cash, business)
- [x] Pas de blocage sur erreur ; retry au cycle suivant

**Dépendances :** S1.4.

---

## 3. Sprint 2 — Linky + E2E

### S2.1 GET /api/diva/insight (proxy)

**Estimation :** 0,5 j

**Tâches :**
- Route proxy vers DIVA `GET /diva/insights`
- Enrichissement : tenant, company_id depuis session/config
- Relayer paramètres : mode, card_key, period (ou date_start/date_end)
- Réponse : JSON DIVA ou 404

**Critères d'acceptation :**
- [x] GET ?mode=cockpit&period=YTD retourne insight ou 404
- [x] GET ?mode=card&card_key=cash&period=YTD retourne insight ou 404

**Dépendances :** S1.3 (DIVA GET opérationnel).

---

### S2.2 DivaFlashBlock — lecture GET uniquement

**Estimation :** 1 j

**Tâches :**
- Remplacer POST + poll par GET /api/diva/insight
- Supprimer logique poll, retry, jobs proxy
- Fallback : "Analyse en cours" si 404
- Conserver affichage message_text / flash_json

**Critères d'acceptation :**
- [x] Affichage instantané si insight présent
- [x] Fallback propre si 404
- [x] Pas de blocage UI

**Dépendances :** S2.1.

---

### S2.3 Warmup opportuniste

**Estimation :** 0,5 j

**Tâches :**
- Au chargement Home ou carte : GET insight
- Si 404 : déclencher POST /diva/generate en fire-and-forget (timeout court)
- Pas de re-fetch en boucle
- Modifier prewarm si nécessaire pour appeler /generate

**Critères d'acceptation :**
- [x] Warmup déclenché 1 fois si 404
- [x] Pas de boucle de requêtes

**Dépendances :** S2.2, S1.4.

---

### S2.4 Tests e2e et documentation

**Estimation :** 1 j

**Tâches :**
- Test e2e : dashboard-metrics → generate → GET insight
- Doc : mise à jour README, variables d'environnement
- Option : feature flag GET vs POST pour rollback

**Critères d'acceptation :**
- [x] Scénario cockpit + carte couvert
- [ ] Doc déploiement à jour (reste à faire)

**Dépendances :** S2.3.

---

## 4. Dépendances (graphe)

```
S1.1 (Migration)
   │
   ├─► S1.3 (GET)
   │      │
   └─► S1.4 (POST) ◄── S1.2 (hash_input)
            │
            └─► S1.5 (Runner)

S2.1 (Proxy) ◄── S1.3
   │
   └─► S2.2 (DivaFlashBlock)
            │
            └─► S2.3 (Warmup)
                     │
                     └─► S2.4 (E2E)
```

---

## 5. Risques et mitigation

| Risque | Mitigation |
|--------|------------|
| Régression UX | Coexistence explain/async ; bascule progressive |
| hash_input bug | Tests unitaires idempotence ; validation croisée |
| Lock timeout 503 | Monitoring ; augmenter INSIGHTS_LOCK_TIMEOUT si besoin |

---

## 6. Cohérence avec la doc

| Doc | Alignement |
|-----|-------------|
| **SPEC_DIVA_Insights** | Plan §12 et §13 référencent ce plan ; estimations alignées 6–8 j |
| **ANALYSE_IMPACT** | v1.1 ; computeContextHash → buildHashInput ; schéma context_key + payload_hash |
| **EXEMPLES_PAYLOAD_IA** | hash_input, CARD_VALUE_SCALE, FOCUS_CARD_DETAILS_SCALE |

---

## 7. Références

- `SPEC_DIVA_Insights_v1.0.md` — spec complète (contenu v1.1)
- `EXEMPLES_PAYLOAD_IA_DASHBOARD_METRICS.md` — hash_input, CARD_VALUE_SCALE, mapping
- `ANALYSE_IMPACT_DIVA_INSIGHTS_v1.0.md` — impact par composant

---

## 8. La suite

Voir **`POINT_ETAPE_IMPLEMENTATION_DIVA_INSIGHTS_2026-02-16.md` §7** pour le détail.

| Priorité | Action |
|----------|--------|
| **Immédiat** | Validation : `./scripts/test_diva_insights_s2.sh <LINKY_URL>` ; `npm run build` (Linky) |
| **À faire** | Bouton Rafraîchir : POST /diva/generate avec force_refresh (spec §9.3) |
| **À faire** | Doc déploiement : README, variables INSIGHTS_*, purge |
| **Optionnel v2** | Étendre runner à 8 cartes ; déprécier explain/async ; feature flag rollback |
