# SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0

**Document :** `SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0.md`  
**Répertoire :** `ZeDocs/web50/`  
**Date :** 2026-03-15  
**Produit :** Dorevia Vault + Linky  
**Objet :** Spec de recette et tests d’acceptation EBE — backend (OD payroll) + front (card EBE selon `payroll_source`)  
**Références :** LINKY-EBE-OD-01, SPEC_BACKEND_VAULT_EBE_OD_PAYROLL_v1.0, SPEC_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0, plans d’implémentation associés

---

## 1. Objectif

Cette spec de recette verrouille les **tests d’acceptation** du Lot 2 EBE (intégration OD de paie + adaptation UI) de bout en bout :

- **Backend** : agrégat payroll Vault (source `payslip` | `od` | `none`), comptes 641\*/645\*, exclusion 421\*/431\*, exposition `payroll_source`.
- **Front** : card EBE Linky affiche badge et messages selon `payroll_source` ; suppression du wording « Aucun bulletin dans le Vault » ; rétrocompatibilité legacy.

Les scénarios ci-dessous sont **exécutables** en recette manuelle ou automatisée et servent de référence pour valider la livraison globale.

---

## 2. Périmètre de la recette

### 2.1 Inclus

- Vault : `GET /ui/aggregations/payroll` (ou via proxy Linky `GET /api/payroll`) avec paramètres tenant, période, granularity.
- Linky : card EBE (tuile + bloc composantes manquantes + évolution) pour un tenant donné.
- Cas métier : tenant **laplatine2026** avec OD de paie (21 500 € au 28/02/2026) comme référence de non-régression.
- Cas front : 4 états UI (payslip, od, none, legacy_fallback) et conformité microcopy.

### 2.2 Exclus

- Recette des autres cards Linky.
- Recette du calcul EBE hors composante paie (ventes, achats, autres charges).
- Tests de charge ou de sécurité.

---

## 3. Préconditions

| Précondition | Description |
|--------------|-------------|
| **Backend déployé** | Vault avec agrégat payroll enrichi (OD + `payroll_source`) déployé et joignable par Linky. |
| **Données OD ingérées** | Pour laplatine2026 : lignes 641\*/645\* (ex. 21 500 € sur 01/01–28/02/2026) présentes dans le stock Vault. |
| **Linky déployé** | Application Linky (card EBE) déployée avec la logique `payroll_source` / `PAYROLL_SOURCE_UI` (plan front implémenté). |
| **Environnement de test** | Accès à l’UI Linky (ex. lab laplatine2026) et possibilité d’appeler l’API payroll (directe ou via UI). |

Si le backend n’est pas encore déployé : les scénarios **Backend** et **Intégration E2E** sont en attente ; seuls les scénarios **Front (mock)** sont exécutables.

---

## 4. Scénarios de recette

### 4.1 Backend — API payroll

#### S-BE-1 — Agrégat payroll source OD (tenant La Platine)

| Élément | Détail |
|--------|--------|
| **Objectif** | Vérifier que l’agrégat payroll retourne le bon total et `payroll_source = "od"` pour une période avec OD et sans payslip. |
| **Précondition** | Tenant laplatine2026 ; OD de paie ingérées pour 01/01/2026–28/02/2026. |
| **Étapes** | 1. Appeler `GET /ui/aggregations/payroll` (ou `GET /api/payroll`) avec `tenant=laplatine2026`, `date_debut=2026-01-01`, `date_fin=2026-02-28`, `granularity=month`. 2. Lire la réponse JSON. |
| **Résultat attendu** | `total` (ou `total_charges`) = **21 500** ; `payroll_source` = **"od"** ; `payroll_unavailable` = false (ou absent). `count` = 2. *Note :* `count` représente le nombre d’écritures contributives **distinctes** (`move_id`), et non le nombre de lignes comptables. Optionnel : `breakdown.accounts_641`, `breakdown.accounts_645` cohérents. |
| **Critère pass** | Total 21 500 € et `payroll_source = "od"`. |

#### S-BE-2 — Source none (période sans paie)

| Élément | Détail |
|--------|--------|
| **Objectif** | Vérifier que l’API retourne `payroll_source = "none"` et total 0 lorsqu’aucune donnée payslip ni OD. |
| **Précondition** | Tenant avec période sans aucune ligne 641/645 ni bulletin (ou tenant sans données paie). |
| **Étapes** | 1. Appeler l’API payroll pour ce tenant et cette période. 2. Lire la réponse. |
| **Résultat attendu** | `payroll_source` = **"none"** ; `payroll_unavailable` = true ; `total` = 0 ; `count` = 0. |
| **Critère pass** | Champs conformes. |

#### S-BE-3 — Priorité payslip (pas de double comptage)

| Élément | Détail |
|--------|--------|
| **Objectif** | Vérifier qu’en présence de payslip et d’OD sur la même période, la source retenue est `payslip` et le total ne double pas. |
| **Précondition** | Tenant disposant de données hr.payslip et d’OD 641/645 sur la période. |
| **Étapes** | 1. Appeler l’API payroll sur cette période. 2. Vérifier la réponse. |
| **Résultat attendu** | `payroll_source` = **"payslip"** ; total = total bulletins (pas somme bulletins + OD). |
| **Critère pass** | Source payslip et total cohérent avec bulletins uniquement. |

#### S-BE-4 — Extourne / correction OD

| Élément | Détail |
|--------|--------|
| **Objectif** | Vérifier qu’une écriture de correction créditant un compte `641*` ou `645*` diminue bien le total (règle net signé = débit − crédit). |
| **Précondition** | Tenant avec au moins une OD de paie et une écriture d’extourne/correction créditant 641\* ou 645\* sur la période. |
| **Étapes** | 1. Appeler l’API payroll sur cette période. 2. Vérifier le total et le count. |
| **Résultat attendu** | Total agrégé diminué correctement par le crédit ; `count` cohérent (écritures distinctes) ; pas de double comptage ni d’inversion de signe. |
| **Critère pass** | Total reflète le net signé ; pas d’anomalie sur les corrections. |

---

### 4.2 Front — Affichage card EBE (avec réponses API réelles ou mockées)

#### S-FR-1 — Affichage source OD

| Élément | Détail |
|--------|--------|
| **Objectif** | Vérifier que lorsque l’API renvoie `payroll_source = "od"`, la card EBE affiche le badge et les messages OD. |
| **Précondition** | Backend (ou mock) renvoie `payroll_source: "od"`, `total` > 0. Linky connecté à ce backend ou mock. |
| **Étapes** | 1. Ouvrir Linky, sélectionner le tenant et une période couverte par des OD. 2. Ouvrir la card EBE (détail). 3. Observer le bloc « composantes manquantes » ou zone source paie. |
| **Résultat attendu** | Badge : **« Source paie : OD comptables »**. Message d’aide indiquant que les charges de personnel sont intégrées via les OD comptables. Aucune occurrence de « Aucun bulletin dans le Vault ». |
| **Critère pass** | Badge et message conformes au mapping spec front §10 ; wording obsolète absent. |

#### S-FR-2 — Affichage source bulletins

| Élément | Détail |
|--------|--------|
| **Objectif** | Vérifier l’affichage lorsque la source est bulletins. |
| **Précondition** | Réponse API avec `payroll_source = "payslip"`. |
| **Étapes** | 1. Ouvrir la card EBE pour un tenant/période avec bulletins. 2. Vérifier badge et message. |
| **Résultat attendu** | Badge : **« Source paie : bulletins »**. Message : charges intégrées via les bulletins de paie. Pas de message d’absence de paie. |
| **Critère pass** | Conforme spec front. |

#### S-FR-3 — Affichage source indisponible

| Élément | Détail |
|--------|--------|
| **Objectif** | Vérifier l’affichage lorsque `payroll_source = "none"`. |
| **Précondition** | Réponse API avec `payroll_source = "none"` (ou `payroll_unavailable: true`). |
| **Étapes** | 1. Ouvrir la card EBE pour une période sans paie. 2. Vérifier badge et message. |
| **Résultat attendu** | Badge : **« Source paie indisponible »**. Message générique (charges non disponibles sur la période ; aucun bulletin ni OD intégrés). **Pas** « Aucun bulletin dans le Vault ». |
| **Critère pass** | Message générique uniquement ; wording obsolète absent. |

#### S-FR-4 — Rétrocompatibilité (API sans payroll_source)

| Élément | Détail |
|--------|--------|
| **Objectif** | Vérifier que si l’API ne renvoie pas `payroll_source`, le front reste en legacy_fallback sans message trompeur. |
| **Précondition** | Réponse API sans champ `payroll_source` (backend ancien ou mock). |
| **Étapes** | 1. Ouvrir la card EBE. 2. Vérifier l’affichage. |
| **Résultat attendu** | Badge générique (ex. « Source paie actuelle non disponible »). Message d’aide générique. Aucune affirmation fausse sur l’absence de bulletins uniquement. |
| **Critère pass** | Pas de crash ; microcopy générique ; pas « Aucun bulletin dans le Vault ». |

#### S-FR-5 — Suppression wording obsolète

| Élément | Détail |
|--------|--------|
| **Objectif** | Vérifier qu’aucun endroit de l’interface n’affiche « Aucun bulletin dans le Vault ». |
| **Précondition** | Tous les états UI sont testables (payslip, od, none, legacy_fallback). |
| **Étapes** | 1. Parcourir la card EBE pour chaque état (en changeant tenant/période ou en mockant). 2. Rechercher la chaîne dans l’UI (ou dans le code source / bundle). |
| **Résultat attendu** | La chaîne **« Aucun bulletin dans le Vault »** n’apparaît nulle part. |
| **Critère pass** | Zéro occurrence. |

---

### 4.3 Intégration E2E — Backend + Front

#### S-E2E-1 — La Platine : OD → API → affichage EBE

| Élément | Détail |
|--------|--------|
| **Objectif** | Valider la chaîne complète : OD ingérées dans Vault → API payroll renvoie total + source od → Linky affiche EBE avec source OD, sans état « paie indisponible ». |
| **Précondition** | Tenant laplatine2026 ; OD 641/645 ingérées (21 500 € sur 01/01–28/02/2026) ; Vault et Linky déployés. |
| **Étapes** | 1. Ouvrir Linky, tenant laplatine2026, période « Exercice à date » ou 01/01/2026–28/02/2026. 2. Ouvrir la card EBE. 3. Vérifier : badge « Source paie : OD comptables » ; message d’aide OD ; **aucun** état « paie indisponible » ni message « Aucun bulletin ». 4. Optionnel : appeler `GET /api/payroll` avec la même période et vérifier `total: 21500`, `payroll_source: "od"`. 5. Optionnel : vérifier le montant EBE affiché (dépend des autres composantes hors périmètre). |
| **Résultat attendu** | API : total 21 500 €, `payroll_source = "od"`. UI : badge et message OD ; pas de message « Aucun bulletin » ; **pas d’affichage « paie indisponible »** alors que la source OD est disponible. Le critère principal E2E porte sur la **disponibilité de la source OD** et l’absence d’état « paie indisponible » ; la vérification du montant EBE complet dépend des autres composantes hors périmètre. |
| **Critère pass** | API conforme + source OD affichée + absence d’état « paie indisponible ». |

#### S-E2E-2 — Non-régression : tenant avec bulletins

| Élément | Détail |
|--------|--------|
| **Objectif** | Vérifier qu’un tenant utilisant uniquement des bulletins (hr.payslip) continue d’afficher EBE et source bulletins sans régression. |
| **Précondition** | Tenant avec données payroll issues de bulletins (pas d’OD) ; backend et front déployés. |
| **Étapes** | 1. Ouvrir Linky pour ce tenant et une période avec bulletins. 2. Vérifier la card EBE : badge « Source paie : bulletins », montant EBE cohérent. 3. Vérifier l’API payroll : `payroll_source = "payslip"`. |
| **Résultat attendu** | Comportement identique à l’existant (avant Lot 2) pour la source bulletins ; pas de régression visuelle ni de calcul. |
| **Critère pass** | Source payslip affichée ; EBE correct. |

---

## 5. Récapitulatif des scénarios

*Suivi des statuts : voir **RESULTATS_RECETTE_EBE_OD_PAYROLL_2026-03-15.md**.*

| Id | Type | Titre | Critère pass | Statut |
|----|------|--------|--------------|--------|
| S-BE-1 | Backend | Agrégat payroll source OD (La Platine) | total 21 500 €, `payroll_source = "od"` | **PASS** (tests intégration 2026-03-15) |
| S-BE-2 | Backend | Source none | `payroll_source = "none"`, total 0 | **PASS** (tests intégration 2026-03-15) |
| S-BE-3 | Backend | Priorité payslip (pas de double comptage) | source payslip, total sans OD | **N/A hors périmètre** (scénario payslip ; recette v1.0 = OD) |
| S-BE-4 | Backend | Extourne / correction OD | Total net signé ; pas d’anomalie corrections | **PASS** (tests intégration 2026-03-15) |
| S-FR-1 | Front | Affichage source OD | Badge + message OD ; pas wording obsolète | **PASS** (gel v1.0, capture 2026-03-15) |
| S-FR-2 | Front | Affichage source bulletins | Badge + message bulletins | **N/A hors périmètre** (scénario payslip ; recette v1.0 = OD) |
| S-FR-3 | Front | Affichage source indisponible | Badge + message générique ; pas « Aucun bulletin… » | **PASS** (tests unitaires 2026-03-15) |
| S-FR-4 | Front | Rétrocompatibilité API sans payroll_source | legacy_fallback ; pas message trompeur | **PASS** (tests unitaires 2026-03-15) |
| S-FR-5 | Front | Suppression wording obsolète | Zéro occurrence « Aucun bulletin dans le Vault » | **PASS** (vérif. code 2026-03-15) |
| S-E2E-1 | E2E | La Platine OD → API → EBE | Source OD affichée ; pas « paie indisponible » | **PASS** (déploiement + capture 2026-03-15) |
| S-E2E-2 | E2E | Non-régression tenant bulletins | Comportement inchangé | **N/A hors périmètre** (module Paie ERP non installé ; recette v1.0 = OD) |

---

## 6. Ordre d’exécution recommandé

1. **Backend seul** : S-BE-1, S-BE-2, S-BE-3, S-BE-4 (dès que Vault est déployé avec OD).
2. **Front seul** (mocks ou API réelle) : S-FR-1 à S-FR-5 (dès que Linky intègre la logique payroll_source).
3. **E2E** : S-E2E-1 (La Platine), S-E2E-2 (tenant bulletins) une fois backend + front déployés.

---

## 6 bis. Statut d’exécution

Pour chaque scénario, renseigner en campagne de recette :

| Champ | Valeurs / description |
|-------|------------------------|
| **Statut** | `PASS` / `FAIL` / `N/A` / `BLOCKED` |
| **Date** | Date d’exécution |
| **Exécutant** | Nom ou identifiant du recetteur |
| **Commentaire / écart constaté** | Note libre en cas de FAIL, N/A ou BLOCKED |

Le tableau récapitulatif (§5) comporte une colonne **Statut** à remplir ; un suivi détaillé (date, exécutant, commentaire) peut être tenu dans un tableau annexe ou un outil de suivi des tests.

---

## 7. Critères de validation globale (recette terminée)

La recette EBE Lot 2 est réputée **validée (recette complète)** lorsque :

- tous les scénarios **S-BE-*** (S-BE-1 à S-BE-4) sont passés (ou N/A si backend non déployé, avec report explicite) ;
- tous les scénarios **S-FR-*** sont passés ;
- au moins **S-E2E-1** est passé pour le tenant laplatine2026 (chaîne OD → EBE) ;
- **S-E2E-2** est passé pour au moins un tenant avec bulletins (non-régression) ;
- la chaîne **« Aucun bulletin dans le Vault »** n’apparaît dans aucun scénario (S-FR-5 et vérification visuelle E2E).

**Périmètre de validation v1.0 (2026-03-15)** : La recette v1.0 porte sur les **flux de paie par OD comptables**. Le module Paie sera installé dans l’ERP lorsqu’il aura été identifié et cadré ; en attendant, la paie est gérée via des OD. Les tests liés à la source payslip ne sont pas exécutés dans le cadre du présent lot et sont classés **N/A hors périmètre**. Une validation **limitée au périmètre « OD payroll »** est prononcée lorsque S-BE-1, S-BE-2, S-BE-4, S-FR-1, S-FR-3, S-FR-4, S-FR-5 et S-E2E-1 sont passés ; **S-BE-3, S-FR-2, S-E2E-2** = N/A hors périmètre. La **clôture du lot** est réalisable (recette v1.0 OD complète). Voir RESULTATS_RECETTE_EBE_OD_PAYROLL_2026-03-15.md.

---

## 8. Références

- **Ticket :** LINKY-EBE-OD-01 (LINKY_EBE_OD_01.md).
- **Spec backend :** SPEC_BACKEND_VAULT_EBE_OD_PAYROLL_v1.0.
- **Spec front :** SPEC_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0.
- **Plans :** PLAN_IMPLEMENTATION_VAULT_EBE_OD_PAYROLL_v1.0 ; PLAN_IMPLEMENTATION_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0.
- **Évaluation / décision :** LINKY_EBE_OD_01_EVALUATION.md.

---

## Validation du document

Le document `SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0` est **validé comme référence de recette** du Lot 2 EBE. Il couvre le backend, le frontend et la chaîne E2E, avec un cas de référence La Platine à 21 500 € sur la période 2026-01-01 au 2026-02-28, et verrouille la suppression du wording obsolète « Aucun bulletin dans le Vault ».

---

## Gel v1.0

**`SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0` est validée comme référence de recette v1.0** et considérée **bonne pour gel**.

Une capture d’écran de la card EBE (tenant laplatine2026, période 2026-01-01 / 2026-02-28) constitue un **indice fort de PASS** pour :

| Scénario | Constat |
|----------|--------|
| **S-FR-1** — Affichage source OD | Libellé « 2 écritures OD », charges - 21 500 €, pas de message d’absence. |
| **S-FR-5** — Suppression wording obsolète | Aucune occurrence de « Aucun bulletin dans le Vault ». |
| **S-E2E-1** — La Platine OD → API → EBE | Statut EBE Complet ; pas d’état « paie indisponible » ; EBE complet cohérent avec marge brute − charges personnel + autres composantes (ex. avoirs nets). |

Pour **S-E2E-1**, la confirmation finale passe par la vérification de l’API : `GET /api/payroll` (ou équivalent) avec `payroll_source = "od"` et `total` (ou `total_charges`) = **21 500** sur la période.

Le critère principal E2E porte sur la **disponibilité de la source OD** et l’absence d’état « paie indisponible » ; le montant EBE affiché dépend des autres composantes (avoirs nets, etc.) et n’est pas un simple « marge brute − 21 500 ».

---

*ZeDocs/web50 — Spec de recette EBE OD payroll (backend + front) — v1.0 — gelée.*
