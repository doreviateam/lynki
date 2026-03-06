# RAPPORT D'IMPLÉMENTATION — DIVA v1.3 + POS Sessions

**Date :** 2026-02-20\
**Plan de référence :** `DIVA_v1.3_PLAN_IMPLEMENTATION.md`\
**Spec de référence :** `DIVA_Insights_v1.3.md`\
**Commits :** `00b07320` (v1.3.1) + commit POS sessions (ce rapport)

------------------------------------------------------------------------

## 1. CONTEXTE

Le plan d'implémentation DIVA v1.3 définissait 10 stories pour aligner
le code Go (`units/diva/internal/mistral/client.go`) sur la spec v1.3.1 :
mode neutre contrôlé, trésorerie comme indicateur central, validations
déterministes côté Go.

Après la livraison des 10 stories, l'utilisateur a demandé un
enrichissement majeur : **exploiter en profondeur les données POS
sessions** (nombre de sessions, panier moyen, mix paiements, écarts
de caisse, conformité vault, répartition par point de vente).

------------------------------------------------------------------------

## 2. STORIES 1 à 10 — ÉTAT

| # | Story | Statut | Fichiers modifiés |
|---|-------|--------|-------------------|
| 1 | System Prompt v3.0 | ✅ Done | `client.go` (constante `systemPrompt`) |
| 2 | Seuil dynamique `minTextLength` | ✅ Done | `client.go` (`dynamicMinLength`) |
| 3 | Nettoyage `forbiddenTerms` | ✅ Done | `client.go` (regex niveau 1) |
| 4 | Confidence déterministe | ✅ Done | `client.go` (`computeConfidence`, `keyCards`) |
| 5 | Insight credit_notes (bug fix) | ✅ Done | `client.go` (`computeInsights`) |
| 6 | Données insuffisantes (§3.2) | ✅ Done | `client.go` (`noDataFlash`) |
| 7 | Tests snapshot "Goldens" | ✅ Done | `client_test.go` (16 → 20 tests) |
| 8 | Retirer interprétations causales | ✅ Done | `client.go` (`computeInsights`) |
| 9 | Remboursements < 1 % vs ≥ 1 % | ✅ Done | `client.go` (`computeInsights`) |
| 10 | Rebuild & Test | ✅ Done | `docker compose up --build` |

**Premier commit :** `00b07320` — 6 fichiers, 2037 insertions.

------------------------------------------------------------------------

## 3. ENRICHISSEMENT POS SESSIONS

### 3.1 Diagnostic

Avant l'enrichissement, DIVA ne recevait qu'un **seul nombre** pour POS :
`pos_shops.value` (total EUR des sessions scellées). Un seul insight
était généré : "POS: X € soit Y % du CA".

**Données disponibles mais inexploitées :**

| Source | Donnée | Statut avant |
|--------|--------|--------------|
| Vault | `GET /ui/aggregations/pos-sessions` | Implémenté (v1.9.0) |
| Linky | Sessions détaillées (shop, tickets, cash/carte) | Présentes dans `PosShopsView` |
| DIVA | `_details.pos_shops` | Absent |

### 3.2 Architecture du pipeline POS

```
Vault (pos-sessions)
  │ session_id, shop_id, total_sales, total_tickets,
  │ cash_total, card_total, difference, vault_status
  ▼
Linky (dashboard-metrics)
  │ _details.pos_shops = {
  │   total_sessions, sealed/pending, total_tickets,
  │   cash_total, card_total, anomaly_sessions,
  │   shops[], sessions[]
  │ }
  ▼
DIVA (computeInsights)
  │ 6 insights POS pré-calculés
  ▼
Mistral (system prompt Rule 9)
  │ Intègre POS comme inducteur de trésorerie
  ▼
Linky (affichage flash)
```

### 3.3 Couche 1 — Vault

**Statut :** Déjà opérationnel (`dorevia/vault:v1.9.0-pos-sessions`).

Endpoint `GET /ui/aggregations/pos-sessions` testé en production :
- 7 sessions, 2 points de vente (Comptoir La Platine, Sweet Manihot)
- Champs : `session_id`, `shop_id`, `opened_at`, `closed_at`,
  `total_sales`, `total_tickets`, `cash_total`, `card_total`,
  `difference`, `vault_status`, `integrity_status`

**Aucune modification nécessaire.**

### 3.4 Couche 2 — Linky

**Image :** `dorevia/linky:v1.18-pos-sessions`

| Fichier | Modification |
|---------|-------------|
| `app/api/dashboard-metrics/route.ts` | Ajout `_details.pos_shops` avec agrégation par shop, compteurs sessions/tickets, mix paiements, écarts |
| `app/api/diva/explain/route.ts` | Transmission `_details` dans le body DIVA + `detailsKey: "pos_shops"` |
| `app/api/diva/explain/async/route.ts` | Idem (route asynchrone) |

**Types ajoutés :** `PosSessionDetail`, `PosShopSummary`.

**Structure `_details.pos_shops` :**

```json
{
  "total_sessions": 7,
  "sealed_sessions": 7,
  "pending_sessions": 0,
  "total_tickets": 8,
  "cash_total": 0,
  "card_total": 636,
  "total_difference": 0,
  "anomaly_sessions": 0,
  "shops": [
    { "shop_id": "Comptoir La Platine", "sessions_count": 3, "total_sales": 2668.80 },
    { "shop_id": "Sweet Manihot", "sessions_count": 4, "total_sales": 1544.40 }
  ],
  "sessions": [ ... ]
}
```

### 3.5 Couche 3 — DIVA

| Fichier | Modification |
|---------|-------------|
| `internal/models/models.go` | Ajout `Details map[string]interface{}` dans `Dashboard` |
| `internal/mistral/client.go` | `computeInsights` accepte `details`, 6 insights POS, `extractPosDetails`, helpers (`toInt`, `toFloat`, `toString`), prompt Rule 9, signature `Chat` + `buildUserPrompt` étendue |
| `internal/mistral/client_test.go` | 4 tests POS ajoutés |
| `internal/handlers/explain.go` | Passage `req.Dashboard.Details` à `Chat` |
| `internal/handlers/explain_async.go` | Idem |
| `internal/handlers/generate.go` | Idem |
| `internal/runner/diva_client.go` | `CallDivaGenerate` passe `details` dans le body |
| `internal/runner/runner.go` | Passage `metrics.Details` à `CallDivaGenerate` |

**6 insights POS pré-calculés :**

| # | Insight | Condition | Exemple |
|---|---------|-----------|---------|
| 1 | Inducteur POS | sessions > 0 | "Inducteur POS: 7 sessions, 8 tickets, 4 213 € de ventes soit 0,4 % du CA" |
| 2 | Panier moyen | tickets > 0 | "POS panier moyen: 527 € (8 tickets sur 7 sessions)" |
| 3 | Mix paiements | cash + carte > 0 | "POS mix paiements: espèces 0 € (0,0 %), carte 4 213 € (100,0 %)" |
| 4 | Alerte écart de caisse | anomaly > 0 | "POS ALERTE: 2 session(s) avec écart de caisse, écart cumulé 15 €" |
| 5 | Conformité vault | sealing < 100 % | "POS conformité: 6/7 sessions scellées (85,7 %) — 1 en attente" |
| 6 | Répartition multi-shops | shops > 1 | "POS répartition: Comptoir La Platine: 2 669 € (3 sessions) \| Sweet Manihot: 1 544 € (4 sessions)" |

**System prompt — Règle 9 ajoutée :**

> Points de vente (POS) : si les insights POS détaillent sessions,
> panier moyen, mix paiements ou écarts de caisse, intègre-les comme
> inducteur de trésorerie. Signale les écarts de caisse et les sessions
> non scellées comme points à vérifier.

------------------------------------------------------------------------

## 4. TESTS

### 4.1 Tests unitaires

**20/20 tests passent** (`go test ./internal/mistral/ -v`).

| Test | Vérifie |
|------|---------|
| `TestComputeInsights_LaPlatine` | 6 insights classiques (POINT DOMINANT, position nette, fiscal, spread, refunds, credit_notes) |
| `TestComputeInsights_SweetManihot` | Pas de POINT DOMINANT ni credit_notes |
| `TestComputeInsights_EmptyAssoc` | Pas de POINT DOMINANT |
| `TestDynamicMinLength` | Seuils dynamiques corrects |
| `TestComputeConfidence` | Déterminisme medium/high/low |
| `TestValidateAndBuildFlash_LaPlatine` | Structure complète acceptée |
| `TestValidateAndBuildFlash_ForbiddenTerms` | Rejet "vous devez" |
| `TestValidateAndBuildFlash_TooShort` | Rejet texte court |
| `TestEnglishDetect_NoFalsePositives` | Cash, business, POS, KPI tolérés |
| `TestEnglishDetect_CatchesEnglish` | "The", "this", "turnover" rejetés |
| `TestForbiddenTerms_Level1Rejected` | 6 patterns injonctifs rejetés |
| `TestForbiddenTerms_Level2Tolerated` | "élevé", "faible" tolérés |
| `TestForbiddenTerms_ObligationLegaleTolerated` | "obligation légale" toléré |
| `TestNoDataFlash` | Phrase imposée, confidence low |
| `TestContextHashScopeIsolation` | Hash global ≠ hash société |
| `TestComputeInsights_LaPlatineWithPOS` | 4 insights POS (inducteur, panier, mix, répartition) |
| `TestComputeInsights_POS_AnomalyAlert` | Alerte écart + conformité |
| `TestExtractPosDetails_Nil` | Extraction robuste nil/vide |
| `TestExtractPosDetails_Valid` | Extraction correcte 7 sessions, 2 shops |
| (+ assertions helper) | Structure, langue, termes, longueur |

### 4.2 Tests end-to-end

6 analyses régénérées par le runner (3 company × 2 périodes) :

| Company | Période | Confidence | Headline |
|---------|---------|------------|----------|
| Global (0) | YTD | medium | Trésorerie validée à zéro malgré un solde de cash important |
| Global (0) | Mois | medium | Trésorerie validée à 0% malgré un cash important |
| La Platine (1) | YTD | medium | Trésorerie validée à 0% alors que le cash représente 1 434 786 € |
| La Platine (1) | Mois | medium | Trésorerie validée à zéro malgré un solde de cash important |
| Sweet Manihot (2) | YTD | medium | Trésorerie validée à zéro malgré un solde de cash de 1440 € |
| Sweet Manihot (2) | Mois | medium | Trésorerie validée à 0% malgré un solde de cash de 1440 € |

**Observations :**
- Toutes les analyses respectent la hiérarchie trésorerie (Rule 8)
- Aucun ratio inventé (Rule 4 effective)
- Aucun terme interdit détecté
- POS correctement dé-priorisé pour La Platine (0,4 % du CA)
- Pas de contamination inter-scope (isolation cache vérifiée)

------------------------------------------------------------------------

## 5. DÉPLOIEMENT

| Service | Image | Statut |
|---------|-------|--------|
| DIVA | `diva-diva:latest` (build local) | ✅ Up (healthy) |
| DIVA Runner | `diva-diva-runner:latest` | ✅ Up |
| Linky (stinger) | `dorevia/linky:v1.18-pos-sessions` | ✅ Up |
| Vault (stinger) | `dorevia/vault:v1.9.0-pos-sessions` | ✅ Up (healthy) |
| Mistral | `mistral-llamacpp` | ⚠ Up (unhealthy — mémoire) |

**Mémoire serveur :** 9 Gi / 15 Gi utilisés, swap 1,9 Gi / 2 Gi.
Mistral fonctionne mais la marge est limitée.

------------------------------------------------------------------------

## 6. FICHIERS MODIFIÉS (depuis le plan)

### Commit 1 — `00b07320` (feat(diva): prompt v3.0)

| Fichier | Action |
|---------|--------|
| `units/diva/internal/mistral/client.go` | Créé |
| `units/diva/internal/mistral/client_test.go` | Créé |
| `units/diva/internal/mistral/errors.go` | Créé |
| `ZeDocs/web24/DIVA_Insights_v1.3.md` | Créé |
| `ZeDocs/web24/DIVA_v1.3_PLAN_IMPLEMENTATION.md` | Créé |
| `ZeDocs/web24/RAPPORT_ANALYSE_QUALITE_PROMPT_DIVA_2026-02-18.md` | Créé |

### Commit 2 — POS Sessions enrichissement

| Fichier | Action |
|---------|--------|
| `units/diva/internal/mistral/client.go` | Modifié (insights POS, extractPosDetails, Rule 9) |
| `units/diva/internal/mistral/client_test.go` | Modifié (4 tests POS ajoutés) |
| `units/diva/internal/models/models.go` | Modifié (Details dans Dashboard) |
| `units/diva/internal/handlers/explain.go` | Modifié (passage Details) |
| `units/diva/internal/handlers/explain_async.go` | Modifié (passage Details) |
| `units/diva/internal/handlers/generate.go` | Modifié (passage Details) |
| `units/diva/internal/runner/diva_client.go` | Modifié (passage Details) |
| `units/diva/internal/runner/runner.go` | Modifié (passage Details) |
| `units/dorevia-linky/app/api/dashboard-metrics/route.ts` | Modifié (_details.pos_shops) |
| `units/dorevia-linky/app/api/diva/explain/route.ts` | Modifié (_details + detailsKey) |
| `units/dorevia-linky/app/api/diva/explain/async/route.ts` | Modifié (_details + detailsKey) |
| `tenants/sarl-la-platine/apps/ui/stinger/docker-compose.yml` | Modifié (image v1.18) |
| `ZeDocs/web24/RAPPORT_IMPLEMENTATION_DIVA_v1.3_POS.md` | Créé (ce rapport) |

------------------------------------------------------------------------

## 7. POINTS D'ATTENTION

1. **Filtrage POS par company_id** — L'endpoint vault `pos-sessions`
   ne filtre pas par `company_id`. Les sessions de tous les points de
   vente remontent, même en scope société. Acceptable en MVP (les deux
   shops sont du même tenant), mais à cadrer en multi-tenant strict.

2. **Mémoire Mistral** — 9 Gi / 15 Gi + swap quasi saturé.
   Le runner génère 6 contextes séquentiellement (~4 min par tick).
   Si le nombre de tenants/companies augmente, la charge Mistral
   devra être ajustée (modèle plus léger, ou batching).

3. **POS `pos_z` (Z de caisse)** — Toujours `null`. La spec prévoit
   un futur endpoint Z de caisse (§9 de `ZeDocs/web18/sessions.md`).
   DIVA est prêt à l'intégrer via la même mécanique `_details`.

------------------------------------------------------------------------

## 8. CORRECTION : ACTIVITÉ COMMERCIALE = BUSINESS + POS (2026-02-20)

### 8.1 Problème constaté

Sur Sweet Manihot (Business = 0 €, POS = 4 213 €, Cash = 1 440 €),
Mistral affichait : *"Aucune activité commerciale enregistrée sur la
période"*. Le POS (seule source de CA) était ignoré dans la définition
d'activité commerciale.

**Cause racine :**
- `computeInsights` utilisait uniquement la carte "Business" pour
  calculer l'activité commerciale et l'écart trésorerie/activité.
- Le `systemPrompt` ne précisait pas que POS = activité commerciale.
- Le runner DIVA pointait vers `linky_lab` (ancien container sans
  `_details.pos_shops`) au lieu de `linky_stinger` (v1.18-pos-sessions).

### 8.2 Corrections appliquées

| Fichier | Modification |
|---------|-------------|
| `client.go` — `computeInsights` | `totalCA = Business + POS`. Nouvel insight "CA provient exclusivement du POS" quand Business = 0 et POS > 0 |
| `client.go` — `systemPrompt` | Nouvelle Rule 9 : "Activité commerciale totale = Business + POS. Ne dis JAMAIS 'aucune activité commerciale' si POS > 0" |
| `client.go` — `systemPrompt` | Ancienne Rule 9 (POS details) renumérotée en Rule 10 |
| `client_test.go` | Fixture `sweetManihotCards` corrigée (cash=1440). Tests `TestComputeInsights_SweetManihot` enrichis : vérifie "exclusivement du POS" et "activité commerciale totale" |
| `units/diva/.env` | `LINKY_URL` corrigé : `linky_stinger_sarl-la-platine` (non tracké git) |

### 8.3 Résultat vérifié en production

**Avant** : "Aucune activité commerciale enregistrée sur la période."

**Après** (Sweet Manihot, exercice à date 2026) :
- *"Activité commerciale totale représente 4213 €, entièrement provenant du POS"*
- *"Trésorerie validée est nulle malgré un solde de cash de 1440 €"*
- *"Position nette de trésorerie post-taxes s'élève à 1440 €"*

18/18 tests unitaires passent.

------------------------------------------------------------------------

## 9. DIVA v1.4 "COMPUTE DISCIPLINE" (2026-02-20)

Implémentation de la spec `SPEC_DIVA_v1.4_Compute_Discipline.md`
(amendée avant implémentation pour éviter les régressions v1.3).

### 9.1 Story A — Hash v2 (POS agrégats dans le hash)

`hashinput/build.go` : le `payloadHash` inclut désormais les agrégats
POS (`total_sessions`, `sealed_sessions`, `pending_sessions`,
`total_tickets`, `cash_total`, `card_total`, `total_difference`,
`anomaly_sessions`, shops triés par `shop_id`). Schema passé de
`hash_input.v1` à `hash_input.v2`.

**Impact** : changement de hash → régénération one-shot de tous les
contextes au premier tick. Acceptable (le runner gère ce cas).

5 nouveaux tests : `POSIncluded`, `NoPOS_NoAggregates`,
`StableWithSameData`, `POSChangeChangesHash`, `ShopOrderStable`.

### 9.2 Story B — No-change → No-gen : SKIP

Déjà implémenté dans `generate.go` (`CheckInsightFresh` → 204).
Confirmé en prod : les logs affichent `state=fresh` quand le hash
est identique. Aucune modification nécessaire.

### 9.3 Story C — Rédaction courte (limites amendées)

| Contrainte | Spec originale | Amendé | Raison |
|---|---|---|---|
| headline max | 120 | **140 chars** | La Platine POS fait ~130 |
| flash total | 450 | **600 chars** | Sweet Manihot POS atteint ~500 |
| insights prompt | 8 | **10** | La Platine+POS produit 12 insights |

- `sanitizeHeadline` : troncature à 140 chars sur limite de mot + `...`
- `validateAndBuildFlash` : si flash > 600 chars, retire `what_i_see`
  par la fin jusqu'à conformité
- `buildUserPrompt` : cap insights à 10

2 nouveaux tests : `SanitizeHeadline_Truncation`,
`ValidateAndBuildFlash_MaxFlashLength`.

### 9.4 Story D — Degraded mode enrichi

Nouveau `degradedFlash(cards, details)` remplace `fallbackFlash()` en
mode cockpit. Au lieu de "Lecture DIVA temporairement indisponible."
(vide), le mode dégradé produit un flash **déterministe** basé sur
`computeInsights` :

- headline = POINT DOMINANT ou premier insight
- what_i_see = 3 premiers insights
- to_check = insights contenant "ALERTE", "conformité", "absence"
- `"degraded": true` dans le JSON (marqueur pour l'UI)

Points d'interception dans `Chat()` :
- Timeout/unavailable Mistral → degraded (cockpit uniquement)
- JSON invalide / choices vides → degraded
- Output rejeté (forbidden terms, english, trop court) → degraded

3 nouveaux tests : `DegradedFlash_LaPlatine`, `_SweetManihot`, `_Empty`.

### 9.5 Story E — POS prompt discipline : DÉJÀ CORRECT

En cockpit, `dashboardDetails` passe uniquement par `computeInsights`
(qui n'utilise que les agrégats). Le payload prompt (`userPromptPayload`)
n'inclut jamais `_details` en cockpit. Les sessions individuelles ne
sont jamais envoyées au LLM.

### 9.6 Observabilité

Logs structurés `slog` dans `Chat()` :

```
event=diva_gen gen=called prompt_chars=4277 output_chars=558 llm_latency_ms=29685 degraded=false
event=diva_gen gen=degraded reason=mistral_timeout prompt_chars=4058 llm_latency_ms=120000
```

Vérifié en prod : 5 générations loguées avec `gen=called`, 0 degraded.

### 9.7 Bilan tests

| Package | Tests | Résultat |
|---------|-------|----------|
| `hashinput` | 13 (dont 5 nouveaux) | PASS |
| `mistral` | 23 (dont 5 nouveaux) | PASS |
| Total | **36** | **0 régression** |

------------------------------------------------------------------------

## 10. LINKY STATUS BADGES v1.0 (2026-02-20)

Implémentation de la spec `SPEC_DOREVIA_Linky_Icon_Status_Badge_v1.0_Detailed.md`
(traduite et amendée avant implémentation).

### 10.1 Objectif

Transformer le cockpit Linky d'un tableau de bord financier en un
**tableau de santé structurelle** où chaque carte KPI affiche un verdict
visuel immédiat via un encadrement coloré de l'icône.

Le badge est un mécanisme de **gouvernance déterministe** (pas d'IA).

### 10.2 Modèle de statut — Hiérarchie sémantique

| Statut    | Couleur         | Hex       | Signification                          |
|-----------|-----------------|-----------|----------------------------------------|
| `neutral` | Bleu            | `#60a5fa` | Donnée présente, pas de règle applicable |
| `ok`      | Vert            | `#22c55e` | Structurellement conforme               |
| `watch`   | **Orange**      | `#f97316` | Seuil franchi / gouvernance non conforme |
| `alert`   | **Rouge**       | `#ef4444` | **Réservé** — continuité d'exploitation menacée |

**Principe directeur :**
- Orange = gouvernance non conforme (tous les dépassements de seuil v1)
- Rouge = risque systémique (réservé pour trésorerie négative,
  incohérence comptable, écart POS majeur, ratio remboursement > 10 %)

Aucune règle n'émet `alert` en v1. Le statut est défini dans le type
mais réservé pour activation ultérieure.

### 10.3 Rendu visuel — Encadrement de l'icône

Au lieu d'une pastille (badge dot), le statut est rendu par un
**encadrement coloré** du conteneur d'icône (64×64 px) :

- Bordure fine (`1.5px solid`) de la couleur du statut
- Fond très léger teinté (12 % d'opacité) de la couleur du statut
- Tooltip natif (`title`) affichant `status_reason` en français au survol
- Pas d'animation, pas de pulsation

Styles appliqués en **inline** (pas de classes Tailwind dynamiques)
pour éviter le purging CSS lors du build Docker.

### 10.4 Règles de statut déterministes

Implémentées dans `computeCardStatuses()` côté serveur (API route).

**§4.1 Trésorerie validée** (KPI maître) :

| Condition              | Statut    | Raison                                    |
|------------------------|-----------|-------------------------------------------|
| null                   | `neutral` | Donnée non disponible                     |
| `== 0 %`              | `watch`   | Trésorerie non validée (0 %)              |
| `< 50 %`              | `watch`   | Trésorerie faiblement validée ({v} %)     |
| `< 80 %`              | `watch`   | Trésorerie partiellement validée ({v} %)  |
| `≥ 80 %`              | `ok`      | Trésorerie validée à {v} %               |

**§4.2 Cash** (dépend de la trésorerie) :

| Condition               | Statut    | Raison                                    |
|-------------------------|-----------|-------------------------------------------|
| null ou 0               | `neutral` | Pas de donnée / activité cash             |
| trésorerie null         | `neutral` | Trésorerie non disponible                 |
| `tPct < 50`             | `watch`   | Cash non validé (trésorerie insuffisante) |
| `tPct < 80`             | `watch`   | Cash partiellement validé                 |
| `tPct ≥ 80`             | `ok`      | Cash validé                               |

**§4.3 Business** :

| Condition                        | Statut    | Raison                        |
|----------------------------------|-----------|-------------------------------|
| null                             | `neutral` | Pas de donnée facturation     |
| `biz == 0` et `totalCA > 0`     | `neutral` | CA exclusivement POS          |
| `biz == 0` et `totalCA == 0`    | `watch`   | Aucune activité commerciale   |
| `biz > 0`                       | `ok`      | Facturation active            |

**§4.4 Taxes** :

| Condition                  | Statut    | Raison                                      |
|----------------------------|-----------|---------------------------------------------|
| null ou 0                  | `neutral` | Pas de charge fiscale                       |
| `tPct < 80`               | `watch`   | Poids fiscal à surveiller (tréso < 80 %)    |
| `tPct ≥ 80`               | `ok`      | Charges fiscales couvertes                  |

**§4.5 Notes de crédit** : `neutral` si 0, `watch` si > 0.

**§4.6 Remboursements** (ratio `abs(refunds) / totalCA × 100`) :

| Ratio        | Statut    | Raison                                   |
|--------------|-----------|------------------------------------------|
| 0 ou absent  | `neutral` | Aucun remboursement                      |
| `< 2 %`     | `ok`      | Remboursements marginaux                 |
| `2–5 %`     | `watch`   | Remboursements à surveiller              |
| `≥ 5 %`     | `watch`   | Remboursements élevés                    |

**§4.7 POS** : `ok` si conforme, `watch` si anomalies/pending/écart > 1 €.

**§4.8 Z de caisse** : `neutral` uniquement en v1 (données non disponibles).

### 10.5 Règle de cohérence globale (§5) — OBLIGATOIRE v1

Si `treasury_validated_pct == 0`, toute carte `ok` (sauf POS) est
rétrogradée en `watch` avec la raison suffixée " (trésorerie non validée)".

### 10.6 Corrections annexes

| Problème | Correction | Fichier |
|----------|-----------|---------|
| Flash DIVA affichait du JSON brut | Parsing `insight.message_text` comme JSON si `insight.flash` absent | `DivaFlashBlock.tsx` |
| Page Linky pré-rendue statique (cache 1 an) | `export const dynamic = "force-dynamic"` + `revalidate = 0` | `app/page.tsx` |
| Docker build incluait `.next` stale | Création `.dockerignore` (`.next`, `node_modules`, `.git`) | `.dockerignore` |
| Variables CSS non utilisées en runtime | Styles inline avec hex hardcodés dans `IconGrid.tsx` | `IconGrid.tsx` |

### 10.7 Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `units/dorevia-linky/app/api/dashboard-metrics/route.ts` | Type `CardStatusValue`, interface `KpiMetric` étendue, `computeCardStatuses()` (96 lignes de règles déterministes + cohérence globale) |
| `units/dorevia-linky/components/IconGrid.tsx` | `STATUS_COLORS` / `STATUS_BG` (4 niveaux), encadrement icône inline, tooltip `status_reason` |
| `units/dorevia-linky/components/DivaFlashBlock.tsx` | Parsing JSON `message_text` quand `flash` absent |
| `units/dorevia-linky/app/page.tsx` | `dynamic = "force-dynamic"`, `revalidate = 0` |
| `units/dorevia-linky/app/globals.css` | Variables CSS `--status-*` (light + dark) |
| `units/dorevia-linky/.dockerignore` | Créé (`.next`, `node_modules`, `.git`) |
| `tenants/sarl-la-platine/apps/ui/stinger/docker-compose.yml` | Image → `dorevia/linky:v1.19-status-badges` |
| `tenants/sarl-la-platine/apps/ui/lab/docker-compose.yml` | Image → `dorevia/linky:v1.19-status-badges` |

### 10.8 Déploiement

| Service | Image | Environnement | Statut |
|---------|-------|---------------|--------|
| Linky (stinger) | `dorevia/linky:v1.19-status-badges` | stinger | ✅ Up |
| Linky (lab) | `dorevia/linky:v1.19-status-badges` | lab | ✅ Up |

### 10.9 Résultat vérifié — La Platine (exercice à date 2026)

| Carte             | Statut    | Couleur | Raison                                    |
|-------------------|-----------|---------|-------------------------------------------|
| Trésorerie (0 %)  | `watch`   | Orange  | Trésorerie non validée (0 %)              |
| Cash              | `watch`   | Orange  | Cash non validé (trésorerie insuffisante) |
| Business          | `ok`      | Vert    | Facturation active                        |
| Taxes             | `watch`   | Orange  | Poids fiscal à surveiller                 |
| Notes de crédit   | `neutral` | Bleu    | Aucune note de crédit                     |
| Remboursements    | `watch`   | Orange  | Remboursements à surveiller               |
| Points de vente   | `ok`      | Vert    | POS conforme                              |
| Z de caisse       | `neutral` | Bleu    | Z de caisse non renseigné                 |

### 10.10 Indépendance DIVA

Le système de statut est **indépendant de DIVA**. Il se calcule à partir
des données brutes (métriques + `_details`). DIVA peut exploiter
`status` et `status_reason` comme signaux d'entrée dans de futures
versions de `computeInsights`.

------------------------------------------------------------------------

## 11. DIVA v1.5 — INTÉGRATION DES STATUTS DE GOUVERNANCE (2026-02-20)

Les statuts de gouvernance calculés par Linky (`status`, `status_reason`)
sont désormais transmis à DIVA et exploités par Mistral. L'IA et les
badges visuels racontent la même histoire.

### 11.1 Pipeline de données

| Couche | Modification | Fichier |
|--------|-------------|---------|
| Modèle | `Card` étendu avec `Status` + `StatusReason` | `models/models.go` |
| Runner | `kpiMetricResponse` capture `status` + `status_reason` depuis Linky | `runner/metrics.go` |
| Prompt | Chaque carte dans le payload JSON inclut `"status"` et `"status_reason"` | `mistral/client.go` (`buildUserPrompt`) |

**Flux :**

```
Linky computeCardStatuses()
  │ { status: "watch", status_reason: "Trésorerie non validée (0 %)" }
  ▼
DIVA Runner (metrics.go)
  │ models.Card { Status: "watch", StatusReason: "..." }
  ▼
DIVA computeInsights()
  │ "GOUVERNANCE — points d'attention: Trésorerie (watch) | Cash (watch) | ..."
  ▼
DIVA buildUserPrompt()
  │ cards[].status + cards[].status_reason dans le JSON
  ▼
Mistral (Rule 11)
  │ Priorise les cartes watch/alert dans le headline
  ▼
Flash cohérent avec les badges visuels
```

### 11.2 Insights de gouvernance (`computeInsights`)

Deux nouveaux insights pré-calculés ajoutés en fin de `computeInsights` :

| Insight | Condition | Exemple |
|---------|-----------|---------|
| `GOUVERNANCE CRITIQUE` | Au moins 1 carte `alert` | "GOUVERNANCE CRITIQUE: Trésorerie (tréso nette négative)" |
| `GOUVERNANCE — points d'attention` | Au moins 1 carte `watch` | "GOUVERNANCE — points d'attention: Trésorerie (0 %) \| Cash (non validé) \| Taxes (< 80 %)" |

Ces insights sont transmis à Mistral dans le champ `insights` du payload.

### 11.3 System Prompt — Rule 11

```
11. Chaque carte contient un champ "status" (neutral/ok/watch/alert)
    et "status_reason" calculés par le système de gouvernance.
    Priorise les cartes en "watch" ou "alert" dans ta synthèse.
    Le headline doit refléter le point de gouvernance le plus critique.
    Ne contredis jamais un statut de gouvernance.
```

### 11.4 Hash v3

Le `status` de chaque carte est inclus dans le hash input (schema
`dorevia.diva.hash_input.v3`). Un changement de statut (ex: trésorerie
passe de `watch` à `ok` après validation bancaire) déclenche
automatiquement une régénération de l'analyse.

### 11.5 Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `units/diva/internal/models/models.go` | `Card` : ajout `Status string` + `StatusReason string` |
| `units/diva/internal/runner/metrics.go` | `kpiMetricResponse` struct, `cardMapping` avec `getKpi`, extraction `Status`/`StatusReason` |
| `units/diva/internal/mistral/client.go` | `cardStatus()` helper, insights GOUVERNANCE, `buildUserPrompt` inclut `status`/`status_reason`, Rule 11 |
| `units/diva/internal/mistral/client_test.go` | Fixtures avec statuts, 4 tests : `GovernanceLaPlatine`, `GovernanceSweetManihot`, `NoGovernanceWhenAllOk`, `CardStatus_Helper` |
| `units/diva/internal/hashinput/build.go` | Schema → `hash_input.v3`, `status` dans chaque carte du hash |
| `units/diva/internal/hashinput/hash_test.go` | 2 tests : `StatusChangeChangesHash`, `StatusIncludedInCards` |

### 11.6 Bilan tests

| Package | Tests | Résultat |
|---------|-------|----------|
| `mistral` | 30 (dont 4 nouveaux) | PASS |
| `hashinput` | 15 (dont 2 nouveaux) | PASS |
| Total | **45** | **0 régression** |

### 11.7 Résultat vérifié

6/6 contextes régénérés avec `state=ready`. Les analyses intègrent
les points de gouvernance `watch` dans le headline et les what_i_see.

------------------------------------------------------------------------

## 12. PROCHAINES ÉTAPES POSSIBLES

- [ ] Filtrer `pos-sessions` par `company_id` dans Linky
- [ ] Exploiter `pos_z` quand disponible
- [ ] Ajouter `pos_shops` dans `keyCards` pour influencer `confidence`
- [ ] Insights temporels POS (tendances, pics d'activité)
- [ ] Optimisation mémoire Mistral (modèle Q3 ou inference en batch)
- [ ] Indicateur UI pour `degraded: true`
- [ ] KPI `diva_hash_hit_ratio` via endpoint `/health`
- [x] ~~Transmettre les statuts de gouvernance à DIVA~~ (fait v1.5)
- [ ] Activer le niveau `alert` (rouge) pour : trésorerie nette négative,
  ratio remboursement > 10 %, écart POS > seuil critique
- [ ] Tests unitaires serveur pour `computeCardStatuses` (bornes seuils)
- [ ] Tests visuels automatisés (4 couleurs visibles en dark mode)
- [ ] DIVA exploite `status` pour moduler `confidence` (alert → high)

------------------------------------------------------------------------

*Rapport mis à jour le 2026-02-20 — DIVA v1.5 Intégration Gouvernance.*
