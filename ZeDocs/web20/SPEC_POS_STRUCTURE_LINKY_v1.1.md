# SPEC_POS_STRUCTURE_LINKY_v1.1

**Produit :** Dorevia Linky
**Périmètre :** Module Points de Vente (POS)
**Date :** 15 février 2026
**Statut :** Spécification normative — Version consolidée — **Implémenté v1.81**

---

# 1. Objectif

Définir la structure officielle et homogène du module **Points de Vente** dans Linky afin de :

* Supprimer toute redondance structurelle
* Éviter les ruptures cognitives
* Aligner le POS sur la grammaire cockpit des cartes comptables
* Garantir une lecture en 5 secondes

Le POS n’est pas une interface de caisse.
C’est un instrument de contrôle financier.

---

# 2. Architecture officielle

## 2.1 Suppression d’une section racine

La section :

```
SESSIONS POINT DE VENTE
```

est supprimée en tant que bloc principal.

Les sessions deviennent un **attribut interne** de chaque point de vente.

---

## 2.2 Bloc racine unique

Structure finale :

```
POINTS DE VENTE
```

Sous-ligne synthèse :

```
X points de vente • Y sessions • Z sécurisées • N en attente         Total : M € 
```

### Règles :

* Séparateur officiel : `•`
* Total aligné à droite
* Aucun emoji ⏳
* ✓ autorisé uniquement pour “sécurisées”
* Aucune décoration superflue

---

# 3. Structure d’une carte Point de Vente

Chaque shop suit strictement la même structure.

```
[Nom du point de vente]                                [Montant total]

X sessions
✓ X sécurisées
N en attente

> Évolution
> Détail
```

---

## 3.1 Règles typographiques

* Nom shop : poids 600
* Montant : poids 600–700 (tabular-nums obligatoire)
* Statuts : poids 400–500
* Alignement vertical des statuts (jamais sur une seule ligne condensée)

---

## 3.2 Statuts

Format officiel :

```
3 sessions
✓ 3 sécurisées
0 en attente
```

Interdits :

* ⏳ emoji
* Ligne compacte type ERP
* Couleur décorative sans sens métier

---

# 4. Navigation et header

## 4.1 Onglets header

Suppression de :

```
Sessions
```

Navigation finale :

* Tout
* Cash
* Business
* Corrections
* Points de vente
* Z de caisse

---

## 4.2 Drill-down

Les sessions sont accessibles via :

```
Points de vente → [Shop] → Détail
```

Pas de section parallèle.

---

# 5. Ordre officiel des cartes Dashboard

Ordre normatif :

1. Trésorerie validée
2. Cash
3. Business
4. Points de vente
5. Taxes
6. Notes de crédit
7. Remboursements
8. Z de caisse

Ce classement suit la logique :

* Fiabilité bancaire
* Flux financiers
* Ventes / Achats
* Opérationnel POS
* Corrections
* Clôture fiscale

---

# 6. Total général POS

Le total agrégé est obligatoire.

Position :

* Aligné à droite de la ligne synthèse
* Même hiérarchie visuelle que Cash

Format :

```
Total : 4 213,20 €
```

tabular-nums obligatoire.

---

# 7. Z de caisse

Bloc distinct de Points de Vente.

Justification :

* Logique fiscale
* Clôture réglementaire
* Différente de la dynamique sessionnelle

Structure similaire aux autres cartes.

---

# 8. Cohérence UX globale

Le module POS doit :

* Respecter la grammaire visuelle des cartes comptables
* Ne jamais introduire une seconde hiérarchie parallèle
* Ne jamais surcharger l’information
* Maintenir lecture en 5 secondes

---

# 9. Interdictions

* Double titre POS / Sessions
* Emoji sablier
* Ligne compacte “3 sessions — 3 sécurisées”
* Bloc densifié type ERP
* Variation de pattern entre shops

---

# 10. Résumé exécutif

Le POS dans Linky devient :

* Un bloc unique
* Structuré
* Stable
* Homogène avec les cartes financières
* Sans redondance

Il renforce la nature cockpit de Linky.

---

---

**Implémentation :** v1.81 (15 février 2026) — Cf. [CHANGELOG_POS_STRUCTURE_LINKY_v1.1.md](./CHANGELOG_POS_STRUCTURE_LINKY_v1.1.md)

---

**Fin — SPEC_POS_STRUCTURE_LINKY_v1.1**
