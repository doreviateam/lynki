# SPEC --- DOREVIA LINKY --- Business Card v2 (Ultra Detailed)

**Version :** 2.1\
**Date :** 2026-02-22\
**Auteur :** Dorevia Platform\
**Statut :** Validé (décisions produit 2026-02-22)\
**Références principales :**\
- PLAN_IMPLEMENTATION_AR_BY_PARTNER_SCRUM.md v1.3\
- SPEC_Vault_UI_Aggregations_AR_by_Partner_v1.0.1.md\
- Compte rendu AR by Partner (Sprints 1--4)

------------------------------------------------------------------------

# 1. CONTEXTE STRATÉGIQUE

Les Sprints 1 à 4 AR by Partner ont introduit :

-   `amount_residual`
-   `invoice_date_due`
-   `partner_id`
-   Route residual idempotente
-   Agrégation `/ui/aggregations/ar-by-partner`
-   Proxy Linky + intégration DIVA
-   Notion de `freshness` (event_driven / snapshot / unknown)

La chaîne économique est désormais complète :

Activité → Facturation → Résiduel → Encours → Retard → Concentration →
Insight.

La Business Card doit évoluer pour exploiter cette maturité.

------------------------------------------------------------------------

# 2. OBJECTIF PRODUIT

Transformer la Business Card d'un indicateur analytique (marge brute) en
un **instrument décisionnel intégrant :**

1.  Création de valeur
2.  Qualité d'encaissement
3.  Concentration du risque client
4.  Cohérence avec Trésorerie

Sans surcharge visuelle.

------------------------------------------------------------------------

# 3. RÔLE FONCTIONNEL DE LA BUSINESS CARD

Elle doit répondre à :

> L'activité crée-t-elle de la valeur et cette valeur est-elle sécurisée
> ?

Elle ne doit PAS :

-   Remplacer la carte Trésorerie
-   Refaire l'agrégation AR complète
-   Devenir un module CRM

------------------------------------------------------------------------

# 4. ARCHITECTURE FONCTIONNELLE V2

## 4.1 Bloc A --- Création de valeur (Marge)

### 4.1.1 Données source

API sales/purchases (ou `_details.business` si cohérent) :

-   ventes_ht
-   achats_ht

La BusinessCard a son propre polling ; la source est celle des agrégats ventes/achats.

### 4.1.2 Calculs

marge_brute = ventes_ht - achats_ht\
taux_marge = marge_brute / ventes_ht

Arrondis : - Montants : 2 décimales - Pourcentage : 1 décimale

### 4.1.3 Affichage

Marge brute : X €\
Taux de marge : Y %

------------------------------------------------------------------------

## 4.2 Bloc B --- Qualité d'encaissement (Nouveau)

### 4.2.1 Source

`_details.business.ar_by_partner` (ou agrégation ar-by-partner)

Champs utilisés :

-   totals.open_amount
-   totals.overdue_amount
-   totals.open_count_invoices
-   partners\[\].overdue_amount (pour calcul de la concentration)
-   meta.freshness
-   meta.warnings

### 4.2.2 Affichage synthétique

Encours client : X €\
Dont en retard : Y €\
Concentration AR : Z % (si overdue_amount \> 0)

**Définition officielle — Concentration AR :**

Part du retard détenue par le principal débiteur, exprimée en % du retard total :

> Z = 100 × max(partner.overdue_amount) / totals.overdue_amount

Si `overdue_amount == 0` → ligne Concentration AR non affichée.

### 4.2.3 Règles d'affichage

  Condition                         Action
  --------------------------------- ------------------------------------------
  open_amount == 0                  Bloc masqué
  freshness == unknown              Bloc masqué + « Données AR non exploitables pour cette période »
  freshness == snapshot             Badge discret « Donnée snapshot »
  meta.warnings multi_currency      « Factures non-EUR exclues (P0) »

------------------------------------------------------------------------

## 4.3 Bloc C --- Signal de risque

### 4.3.1 Logique (badge basé sur overdue_concentration)

**Définition :** overdue_concentration = max(partner.overdue_amount) / totals.overdue_amount (en décimal, ou × 100 pour %)

Le risque concerne le retard, pas l'encours. On n'utilise pas `share_percent` (part dans l'encours total).

  Condition                                                Badge
  -------------------------------------------------------- ------------------------------------------
  overdue_amount == 0                                      Vert : « Marge sécurisée »
  overdue_amount \> 0 ET overdue_concentration \>= 0,50   Orange : « Risque concentré »
  overdue_amount \> 0 ET overdue_concentration \< 0,50     Orange léger : « Marge partiellement exposée »

------------------------------------------------------------------------

# 5. UX & DESIGN

## 5.1 Principes

-   Sobriété
-   Pas de nouveau graphique
-   Pas d'animation
-   Cohérence palette Linky
-   Respect du dark mode existant

## 5.2 Hiérarchie visuelle

1.  Marge brute
2.  Taux de marge
3.  Bloc encours
4.  Badge signal

------------------------------------------------------------------------

# 6. INTÉGRATION TECHNIQUE

## 6.1 Backend

Aucune modification nécessaire.

Sources déjà disponibles :

-   GET /api/dashboard-metrics
-   GET /ui/aggregations/ar-by-partner

------------------------------------------------------------------------

## 6.2 Frontend

Fichier principal :

units/dorevia-linky/components/BusinessCard.tsx

Ajouter :

-   Calcul taux_marge
-   Section AR synthétique
-   Logique badge conditionnelle

------------------------------------------------------------------------

# 7. IMPACT DIVA

## 7.1 Court terme

Aucun changement requis.

## 7.2 Évolution future possible

Inclure taux_marge dans hash_input\
Permettre lecture croisée Marge + AR

------------------------------------------------------------------------

# 8. CAS LIMITES

  Cas                             Comportement
  ------------------------------- --------------------
  ventes_ht == 0                  Taux non affiché
  ventes_ht \> 0, marge \< 0      Taux négatif affiché (couleur neutre, signal utile). Badge marge \< 0 : future itération.
  open_amount null                Bloc masqué
  données incohérentes            Ne pas afficher AR
  documents snapshot uniquement   Mention snapshot

------------------------------------------------------------------------

# 9. PERFORMANCE

Aucun impact backend supplémentaire.\
Agrégation AR déjà optimisée (index + EPS 0,01).

------------------------------------------------------------------------

# 10. SÉCURITÉ & COHÉRENCE PRODUIT

Respect de la posture :

> Ne jamais afficher un AR mensonger.

Si données incomplètes : - Bloc AR masqué - Pas de signal partiel

------------------------------------------------------------------------

# 11. CRITÈRES D'ACCEPTATION

-   Marge brute correctement recalculée
-   Taux affiché si ventes \> 0 (y compris taux négatif, couleur neutre)
-   Bloc AR affiché uniquement si exploitable
-   Badge basé sur overdue_concentration (pas share_percent)
-   Concentration AR = part du retard du principal débiteur
-   freshness == unknown → message « Données AR non exploitables pour cette période »
-   meta.warnings multi_currency → « Factures non-EUR exclues (P0) »
-   Aucune régression sur affichage existant
-   Aucun impact sur polling

------------------------------------------------------------------------

# 12. STRATÉGIE D'ITÉRATION

Étape 1 : Implémentation minimaliste\
Étape 2 : Observation usage réel\
Étape 3 : Ajustement signal ou wording\
Étape 4 (future) : Badge dédié si marge \< 0

------------------------------------------------------------------------

# 13. CONCLUSION

Cette évolution aligne Business avec :

-   Architecture Vault
-   Chaîne AR by Partner
-   Vision cockpit décisionnel
-   Cohérence Trésorerie

La Business Card devient un instrument économique complet, sans
complexifier l'expérience utilisateur.

------------------------------------------------------------------------

**Fin du document**
