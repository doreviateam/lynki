# Avis, recommandations et questions — SPEC_DIVA_API

**Document évalué** : `SPEC_DIVA_API_v1.0.md` (v1.0 initiale)  
**Date** : 2026-02-17  
**Référence** : `PRE_SPEC_DIVA_v0.1.md`, `RAPPORT_IMPLEMENTATION_MISTRAL_2026-02-17.md`  

**Mise à jour** : La v1.1 de la spec a intégré la plupart des recommandations (architecture, context_hash, confidence, request_id, UX, logs, disclaimer). Ce document conserve les questions résiduelles.

---

# 1. Avis général

La SPEC est **solide et actionnable**. Elle traduit bien le besoin du mockup (synthèse flash, ton doux) en contrat API concret. Les principes UX "Douceur", l’idempotence, le cache et la gestion des erreurs sont bien cadrés.

**Points forts** :
- Objectif clair (≤ 10 s, lecture CFO flash)
- Contrat request/response détaillé et implémentable
- Cohérence avec PRE_SPEC (pas de DLP, lecture seule)
- Gestion d’erreur non anxiogène
- Périmètre v1 explicite

**Points à préciser** avant implémentation :
- Architecture (où vit DIVA, qui appelle qui)
- Alignement format des cartes avec `dashboard-metrics`
- Définition du prompt Mistral
- Valeurs possibles de `confidence`

---

# 2. Recommandations

## 2.1 Architecture et déploiement

| Reco | Détail |
|------|--------|
| **Définir l’hébergement de DIVA** | Clarifier si DIVA est : (a) un service dédié (`units/diva/`, API Go), (b) une route proxy dans Linky (`/api/diva/explain` → Mistral), ou (c) une route dans le Vault. La SPEC suppose un endpoint `/diva/explain` mais ne précise pas le host. |
| **Schéma d’appel** | Documenter explicitement : `Linky (front) → [qui?] /diva/explain → Mistral`. Si DIVA = service, préciser son URL (ex. `http://diva:8000` sur `dorevia-network`). |
| **Réseau** | Si DIVA est un service : confirmer qu’il est sur `dorevia-network` pour atteindre `mistral-llamacpp:8000`. |

## 2.2 Alignement données Linky

| Reco | Détail |
|------|--------|
| **Adapter le format des cartes** | La SPEC utilise `cards[].value` numérique. `dashboard-metrics` renvoie `{ treasury: { value, formatted, valueKind }, ... }`. Prévoir soit une transformation côté Linky (mapper vers le format SPEC), soit adapter la SPEC pour accepter le format actuel. |
| **Clés des cartes** | Harmoniser les clés : SPEC utilise `treasury_validated_pct`, Linky a `treasury` avec `reliability_rate`. Prévoir une table de correspondance (SPEC §4 ou annexe). |
| **Convention de dates** | SPEC : `date_start`, `date_end`. Vault/Linky : `date_debut`, `date_fin`. Soit standardiser sur `date_debut`/`date_fin` pour cohérence plateforme, soit documenter la conversion. |

## 2.3 Comportement et robustesse

| Reco | Détail |
|------|--------|
| **Définir `confidence`** | Lister les valeurs : `low` \| `medium` \| `high` ? Et leur usage : affichage conditionnel, style visuel, etc. |
| **Définir `context_hash`** | Spécifier le contenu du hash (ex. SHA256 de `tenant + company_id + date_start + date_end + JSON.stringify(cards)` trié) pour que Linky et DIVA calculent le même hash pour le cache. |
| **Cas `cards` vides** | Prévoir le comportement : refus (400) ou réponse avec message du type « Données insuffisantes pour une synthèse » ? |
| **Rate limiting** | En v1, optionnel si réseau interne. Documenter si prévu pour v1.1. |

## 2.4 Prompt et Mistral

| Reco | Détail |
|------|--------|
| **Annexe prompt** | Ajouter une annexe ou doc séparée avec le template du prompt envoyé à Mistral (système + user avec les placeholders). Indispensable pour l’implémentation et les tests. |
| **JSON strict** | Confirmer que l’image `ghcr.io/ggml-org/llama.cpp:server` gère un mode JSON structuré (paramètre `response_format` ou équivalent). Sinon, prévoir parsing + fallback. |
| **Timeout 30 s vs 10 s** | `max_seconds: 10` dans les options vs timeout Mistral 30 s. Clarifier : 10 s = objectif UX, 30 s = limite technique avant 408 ? |

## 2.5 `optional_details`

| Reco | Détail |
|------|--------|
| **Précision sur `optional_details`** | `deltas`, `top_partners`, `notes` sont vides en v1. Soit les retirer du format v1 (YAGNI), soit indiquer qu’ils sont réservés pour v2. |

---

# 3. Questions ouvertes

## 3.1 Produit / UX

| # | Question |
|---|----------|
| Q1 | La structure `headline` + `what_i_see` + `to_check` fusionne "Points d’attention" et "Vérifications suggérées" du mockup. Est-ce volontaire ou faut-il une 3e section dédiée (`suggested_checks`) ? |
| Q2 | `to_check` mélange "pourquoi la trésorerie est à 0%" (diagnostic) et "pourquoi le Z de caisse est absent" (alerte). Faut-il distinguer types (alerte / action) pour un affichage différent ? |
| Q3 | Faut-il un disclaimer UI du type « Synthèse à titre indicatif — l’humain reste décisionnaire » ? (lié à PRE_SPEC Q2) |

## 3.2 Technique

| # | Question |
|---|----------|
| Q4 | Linky appelle-t-il DIVA directement (CORS, même domaine ou proxy) ou via le backend Linky (`/api/diva/explain` en proxy) ? |
| Q5 | En cas de cache hit, la réponse est renvoyée sans appel Mistral. La `latency_ms` reflète-t-elle le temps total (incluant lookup cache) ou uniquement l’appel Mistral ? |
| Q6 | Les codes 408 et 503 : le corps de réponse doit-il suivre le format `error` défini en §7 pour tous les cas d’erreur ? |
| Q7 | Faut-il un identifiant de requête (`request_id`) dans `meta` pour le debug / corrélation de logs ? |

## 3.3 Données et conformité

| # | Question |
|---|----------|
| Q8 | Les valeurs des cartes sont des totaux agrégés. Y a-t-il un risque de données nominatives dans `optional_details` si utilisé plus tard (ex. `top_partners`) ? |
| Q9 | Logs : faut-il tracer les appels (sans payload) pour observabilité ? Durée de rétention ? |

---

# 4. Cohérence avec la PRE_SPEC

| Question PRE_SPEC | Réponse dans la SPEC |
|------------------|---------------------|
| Q1 (factuel vs interprétatif) | Implicite : ton "neutre", "pas d’hypothèses non supportées" → plutôt factuel |
| Q2 (responsabilité IA) | Non traité — pas de disclaimer explicite |
| Q3 (énoncés neutres) | Oui (§5 "Pas de conseil juridique ou comptable") |
| Q5 (position bloc) | Hors scope API — à traiter dans spec UX Linky |
| Q6 (moment génération) | Implicite : appel à chaque chargement (ou sur demande) — côté client |
| Q9 (erreur) | Oui : message doux, ancienne synthèse conservée |
| Q10 (qui appelle Mistral) | Choix : Linky → DIVA → Mistral (DIVA = service) |
| Q12 (cache) | Oui : TTL 5 min, `context_hash` |
| Q13 (timeout) | 30 s Mistral, 408 si dépassé |
| Q14 (qui récupère agrégats) | Linky transmet (`dashboard` dans le body) |

---

# 5. Synthèse

| Verdict | La SPEC v1.1 est **prête pour implémentation**. Architecture, context_hash, confidence, UX et logs sont clarifiés. |
|---------|---------------------------------------------------------------------------------------------------------------------|
| v1.1 traité | Architecture, flux, confidence, request_id, disclaimer, logs, annexe (v1.1 créée) |
| Reste | Mapping cards ↔ dashboard-metrics côté Linky (transformation avant envoi DIVA) |

---

# 6. Références

| Document | Rôle |
|----------|------|
| `SPEC_DIVA_API_v1.0.md` | Spécification (contenu v1.1) |
| `PRE_SPEC_DIVA_v0.1.md` | Expression du besoin |
| `units/dorevia-linky/app/api/dashboard-metrics/route.ts` | Format actuel des métriques |

---

**Fin du document.**
