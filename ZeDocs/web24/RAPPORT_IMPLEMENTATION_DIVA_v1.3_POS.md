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

## 8. PROCHAINES ÉTAPES POSSIBLES

- [ ] Filtrer `pos-sessions` par `company_id` dans Linky
- [ ] Exploiter `pos_z` quand disponible
- [ ] Ajouter `pos_shops` dans `keyCards` pour influencer `confidence`
- [ ] Insights temporels POS (tendances, pics d'activité)
- [ ] Optimisation mémoire Mistral (modèle Q3 ou inference en batch)

------------------------------------------------------------------------

*Rapport généré le 2026-02-20 — Dorevia DIVA v1.3.1 + POS Sessions.*
