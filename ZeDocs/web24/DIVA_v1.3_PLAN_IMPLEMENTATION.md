# PLAN D'IMPLÉMENTATION — DIVA Spec v1.3

**Date :** 2026-02-20\
**Spec de référence :** `DIVA_Insights_v1.3.md`\
**Fichier principal :** `units/diva/internal/mistral/client.go`\
**Objectif :** Aligner le code Go sur la spec v1.3

------------------------------------------------------------------------

## STORY 1 — System Prompt v3.0

**Priorité :** P0 | **Effort :** M | **Risque :** moyen (régression qualité texte)

**Tâches :**

- [ ] Réécrire `systemPrompt` avec la whitelist vocabulaire (spec §2.2)
- [ ] Intégrer les termes de niveau 2 en "découragé" (pas interdit)
- [ ] Cadrer `to_check` : constats vérifiables, zéro prescription (spec §4.4)
- [ ] Cadrer `headline` : reformulation du POINT DOMINANT (spec §4.2)
- [ ] Ajouter l'interdiction de déduire hors données transmises (spec §6)
- [ ] Verrouiller la sortie JSON : "Réponds uniquement par un objet JSON valide", "N'utilise pas de balises ```json", "Aucune phrase hors JSON" (spec §4.1)

**Critère d'acceptation :** le prompt tient dans ~350 tokens pour laisser ~1700 tokens au user prompt + réponse

------------------------------------------------------------------------

## STORY 2 — Seuil dynamique `minTextLength`

**Priorité :** P0 | **Effort :** S | **Risque :** faible

**Tâches :**

- [ ] Créer `dynamicMinLength(cards []models.Card) int`
- [ ] Compter les cartes dont `Value != nil && *Value != 0`
- [ ] Si `cardsWithData == 0` → retourner 0 (bypass : la réponse sera la phrase imposée §3.2 ou le fallback)
- [ ] Sinon → `max(80, cardsWithData × 35)`
- [ ] Remplacer la constante `minTextLength = 200` par l'appel dynamique dans `validateAndBuildFlash`
- [ ] Passer `cards` en paramètre à `validateAndBuildFlash` (déjà le cas)

**Critère d'acceptation :**

| Contexte | Cartes non nulles | Seuil |
|---|---|---|
| Aucune donnée | 0 | 0 (bypass → phrase imposée ou fallback) |
| Sweet Manihot | 2 | 80 |
| SARL La Platine | 6 | 210 |

------------------------------------------------------------------------

## STORY 3 — Nettoyage `forbiddenTerms` (Niveau 1 uniquement)

**Priorité :** P1 | **Effort :** XS | **Risque :** faible

**Tâches :**

- [ ] Mettre à jour le regex `forbiddenTerms` : niveau 1 seulement
- [ ] Ajouter : "devraient être", "il conviendrait", "nécessite une action"
- [ ] Conserver : "vous devez", "il faut", anglicismes
- [ ] Remplacer `obligat` (trop large, matche "obligation légale" dans un constat factuel) par des patterns ciblés : `obligatoire de`, `obligatoirement`
- [ ] Retirer tout qualificatif (niveau 2 = prompt only, pas de rejet Go)
- [ ] Documenter dans un commentaire Go que `englishDetect` cible les mots structurels anglais (articles, pronoms, modaux), pas les termes métier tolérés en français (cash, business, POS, KPI)

**Critère d'acceptation :**

| Texte | Résultat |
|---|---|
| "les taxes représentent 18,9 % du chiffre d'affaires" | ✅ passe |
| "vous devez optimiser vos taxes" | ❌ rejet |
| "il conviendrait de vérifier" | ❌ rejet |

------------------------------------------------------------------------

## STORY 4 — Confidence déterministe côté Go

**Priorité :** P1 | **Effort :** S | **Risque :** faible

**Tâches :**

- [ ] Définir la liste des **cartes clés** : `business`, `cash`, `taxes`, `refunds`, `treasury_validated`
- [ ] "Renseignée" = carte présente avec `Value != nil` (indépendamment de la valeur — 0 compte comme renseignée)
- [ ] Créer `computeConfidence(cards []models.Card) string`
- [ ] Logique :

| Condition | Valeur |
|---|---|
| 5/5 cartes clés renseignées (`Value != nil`) ET `treasury_validated > 0` | `high` |
| 5/5 cartes clés renseignées (`Value != nil`) ET `treasury_validated = 0` | `medium` |
| < 5 cartes clés renseignées | `low` |

- [ ] Remplacer la valeur Mistral par le résultat calculé dans `validateAndBuildFlash`

**Critère d'acceptation :** la confidence ne dépend plus du LLM ; la liste des cartes clés est définie dans une constante Go avec un commentaire explicite : `// confidence = qualité du bloc DIVA, pas exhaustivité financière`

------------------------------------------------------------------------

## STORY 5 — Insight "absence notes de crédit" corrigé

**Priorité :** P2 | **Effort :** XS | **Risque :** faible

**Tâches :**

- [ ] **Bug fix** : le code actuel vérifie `hasCreditNotes` (carte présente) mais ne vérifie pas `value == 0`. Si `credit_notes = 5000`, l'insight "Aucune note de crédit" est émis à tort
- [ ] Récupérer la valeur : `creditNotes, hasCreditNotes := cardVal(cards, "credit_notes")`
- [ ] Corriger la condition : `hasCreditNotes && creditNotes == 0 && hasBiz && biz > 100000`
- [ ] Ajouter le cas carte absente : `!hasCreditNotes && hasBiz && biz > 100000`
- [ ] Retirer le qualificatif "significatif" du message
- [ ] Nouvelle formulation : "Aucune note de crédit émise sur la période malgré un volume d'activité de X €"

**Critère d'acceptation :**

| Contexte | credit_notes | business | Insight émis ? |
|---|---|---|---|
| SARL La Platine | 0 | 1 162 748 € | ✅ oui |
| Sweet Manihot | 0 | 0 € | ❌ non |
| Petit tenant | 0 | 45 000 € | ❌ non |

------------------------------------------------------------------------

## STORY 6 — Détection "données insuffisantes" (spec §3.2)

**Priorité :** P1 | **Effort :** S | **Risque :** faible

**Tâches :**

- [ ] Créer un helper `noDataFlash() models.Flash` qui retourne directement :
  - `headline`: "Les données disponibles ne permettent pas d'établir une analyse significative sur cette période."
  - `what_i_see`: `[]`
  - `to_check`: `[]`
  - `confidence`: "low"
- [ ] Dans `Chat`, avant l'appel Mistral, vérifier si `business = 0 ET cash = 0 ET taxes = 0`
- [ ] Si oui → `return noDataFlash(), nil` immédiatement (pas de passage par `validateAndBuildFlash`, pas de validation longueur/regex)
- [ ] S'assurer que Story 2 (`dynamicMinLength`) n'interfère pas : quand `cardsWithData == 0`, le chemin est court-circuité par `noDataFlash()` avant même d'atteindre le seuil dynamique

**Critère d'acceptation :**

| Contexte | business | cash | taxes | Résultat |
|---|---|---|---|---|
| Tenant vide | 0 | 0 | 0 | Phrase imposée (pas d'appel Mistral) |
| Activité partielle | 0 | 1 440 | 0 | Appel Mistral normal |
| Données complètes | 1 162 748 | 1 400 952 | 231 097 | Appel Mistral normal |

------------------------------------------------------------------------

## STORY 7 — Tests snapshot "Goldens" (filet anti-régression)

**Priorité :** P0 | **Effort :** M | **Risque :** faible

**Principe :** 3 payloads JSON réels capturés, avec assertions strictes sur la structure (pas sur le texte exact — Mistral est non déterministe).

**Tâches :**

- [ ] Créer `units/diva/internal/mistral/client_test.go`
- [ ] Définir 3 fixtures de payloads réels :

| # | Contexte | Caractéristiques |
|---|---|---|
| 1 | SARL La Platine (YTD) | Données complètes, 6+ cartes, treasury = 0, business > 1 M€ |
| 2 | Sweet Manihot (YTD) | Données partielles, 2 cartes non nulles (POS + cash) |
| 3 | Association (aucune donnée) | business = 0, cash = 0, taxes = 0 → phrase imposée |

- [ ] Pour chaque fixture, tester `computeInsights` + `dynamicMinLength` + `computeConfidence` (fonctions pures, pas besoin de Mistral)
- [ ] Pour chaque fixture, tester `validateAndBuildFlash` avec une réponse JSON simulée :

**Assertions strictes (doivent passer) :**

| Règle | Assertion |
|---|---|
| Langue | `englishDetect` ne matche pas |
| Structure JSON | `headline` non vide, `what_i_see` = tableau, `to_check` = tableau |
| Termes interdits | `forbiddenTerms` ne matche pas |
| Longueur dynamique | `textLength(raw) >= dynamicMinLength(cards)` |
| `to_check` max 2 | `len(to_check) <= 2` |
| `what_i_see` max cards+2 | `len(what_i_see) <= len(cards)+2` |
| `confidence` valide | valeur dans `{"low", "medium", "high"}` |
| Fixture 3 (aucune donnée) | headline = phrase imposée, confidence = "low" |

- [ ] Test anti faux-positifs `englishDetect` : vérifier que des phrases françaises contenant des termes métier tolérés ("cash", "business", "POS", "KPI") ne sont PAS rejetées par le détecteur anglais
- [ ] Assertions souples (vérifications informatives, pas bloquantes) :
  - Headline ne commence pas par "Dans ce rapport"
  - Aucun montant brut recopié tel quel dans what_i_see

**Critère d'acceptation :** `go test ./internal/mistral/...` passe sans Mistral (tests unitaires purs sur les fonctions Go)

------------------------------------------------------------------------

## STORY 8 — Retirer les interprétations causales des insights (spec §6)

**Priorité :** P1 | **Effort :** XS | **Risque :** faible

**Tâches :**

- [ ] Dans `computeInsights`, retirer les explications causales de Cash vs Business :
  - Supprimer "— marge de trésorerie ou encaissements anticipés"
  - Supprimer "— créances non encaissées ou décaissements anticipés"
- [ ] Nouvelles formulations conformes à la spec §3.3 :
  - "Le solde de trésorerie (%s) dépasse l'activité commerciale (%s) de %s"
  - "L'activité commerciale (%s) dépasse le solde de trésorerie (%s) de %s"

**Critère d'acceptation :** aucune interprétation causale dans les insights pré-calculés

------------------------------------------------------------------------

## STORY 9 — Différenciation remboursements < 1 % vs ≥ 1 % (spec §3.4)

**Priorité :** P2 | **Effort :** XS | **Risque :** faible

**Tâches :**

- [ ] Dans `computeInsights`, après le calcul du ratio remboursements/CA :
  - Toujours afficher le montant en **valeur absolue** (pas de signe négatif) : ce sont des "montants remboursés", pas des flux signés
  - Si ratio < 1 % → "Remboursements: %s soit %s du CA, part marginale"
  - Si ratio ≥ 1 % → "Remboursements: %s soit %s du CA"
- [ ] Vérifier que `fmtEUR(absVal(refunds))` est bien utilisé (déjà le cas dans le code actuel, à confirmer)

**Critère d'acceptation :**

| refunds (brut) | business | ratio | Texte insight |
|---|---|---|---|
| -1 687 € | 1 162 748 € | 0,1 % | "Remboursements: 1 687 € soit 0.1% du CA, part marginale" |
| -15 000 € | 500 000 € | 3,0 % | "Remboursements: 15 000 € soit 3.0% du CA" |

------------------------------------------------------------------------

## STORY 10 — Rebuild & Test

**Priorité :** P0 | **Effort :** S | **Risque :** moyen

**Dépendances :** Stories 1–9

**Tâches :**

- [ ] `go test ./internal/mistral/...` (Story 7 — goldens)
- [ ] Test `TestContextHashScopeIsolation` : vérifier que le hash de cache est différent entre scope global (company_id=0) et scope société (company_id=1), même tenant, mêmes dates
  - Construire 2 contextes identiques sauf `CompanyID` (0 vs 1)
  - Calculer le `context_hash` pour chacun
  - `assert hashA != hashB`
- [ ] `docker compose up --build diva`
- [ ] Vérifier les logs (pas d'erreur de compilation)
- [ ] Déclencher une analyse scope global (company_id=0)
- [ ] Déclencher une analyse scope société (company_id=1)
- [ ] Vérifier JSON retourné : structure, langue, longueur, confidence, absence de prescriptions

------------------------------------------------------------------------

## RÉSUMÉ

| # | Story | Priorité | Effort | Dépendances |
|---|---|---|---|---|
| 1 | System Prompt v3.0 | P0 | M | — |
| 2 | Seuil dynamique | P0 | S | — |
| 3 | forbiddenTerms nettoyage | P1 | XS | — |
| 4 | Confidence déterministe | P1 | S | — |
| 5 | Insight credit_notes (bug fix) | P1 | XS | — |
| 6 | Données insuffisantes (§3.2) | P1 | S | — |
| 7 | Tests snapshot "Goldens" | P0 | M | — |
| 8 | Retirer interprétations causales (§6) | P1 | XS | — |
| 9 | Remboursements < 1 % vs ≥ 1 % (§3.4) | P2 | XS | — |
| 10 | Rebuild & Test | P0 | S | 1–9 |

**Stories 1 à 9 sont indépendantes** — implémentables en parallèle dans `client.go`, puis rebuild + goldens (Story 10).

**Vélocité estimée :** 1 sprint court (< 2h)
