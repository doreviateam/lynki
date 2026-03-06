# SPEC_POS_STRUCTURE_LINKY_v1.0

**Produit :** Dorevia Linky
**Module :** Points de Vente (POS)
**Date :** 15 février 2026
**Statut :** Spécification officielle — Structure & Cohérence UX

---

# 1. Objectif

Harmoniser définitivement la structure UX du module POS afin de :

* Supprimer les redondances hiérarchiques
* Garantir une lecture en 5 secondes
* Assurer la cohérence avec les autres cartes comptables
* Renforcer la posture cockpit financier (non CMS, non ERP clone)

---

# 2. Principe directeur

Le module POS suit la même logique que les autres cartes Linky :

> Synthèse → Détail par entité → Évolution → Analyse

Il n'existe qu'une seule hiérarchie.

Aucune duplication de titres.

---

# 3. Suppression formelle

## ❌ Élément supprimé

```
SESSIONS POINT DE VENTE
```

### Justification

* Redondant avec “Points de Vente”
* Double hiérarchie inutile
* Rupture cognitive
* Impression de deux modules distincts

Les sessions sont un attribut du point de vente, pas un module séparé.

---

# 4. Structure officielle du bloc POS

## 4.1 Bloc racine

Titre :

```
POINTS DE VENTE
```

Sous-ligne synthèse :

```
X points de vente • Y sessions • Z sécurisées • N en attente
```

### Règles

* Pas d’emoji
* Couleur informationnelle uniquement
* Ordre fixe des informations
* Séparateur typographique "•"

---

# 5. Structure carte Point de Vente

Chaque point de vente suit strictement le pattern suivant :

```
[Nom du point de vente]                         [Montant total €]

X sessions
✓ X sécurisées
N en attente

> Évolution
> Détail
```

---

## 5.1 Hiérarchie typographique

| Élément                    | Poids   | Taille          |
| -------------------------- | ------- | --------------- |
| Nom shop                   | 600     | 1rem – 1.125rem |
| Montant total              | 600–700 | Dominant        |
| Sessions                   | 400     | 0.875rem        |
| Statuts                    | 500     | 0.875rem        |
| Liens (Évolution / Détail) | 500     | 0.875rem        |

Poids maximum autorisé : 700 (cf SPEC_TYPOGRAPHY_LINKY_v1.0).

---

## 5.2 Règles visuelles

* Montant aligné à droite
* Même alignement que carte Cash
* Même spacing vertical que autres cartes comptables
* Même rayon de bordure
* Même ombre légère

---

# 6. Statuts

## 6.1 Format obligatoire

```
✓ X sécurisées
N en attente
```

## 6.2 Couleurs

| Statut     | Variable     |
| ---------- | ------------ |
| Sécurisées | `--positive` |
| En attente | `--warning`  |

⚠ Interdits :

* Emoji ⏳
* Couleur rouge saturée
* Animation de statut

Le POS reste financier, pas opérationnel ludique.

---

# 7. Actions

Chaque carte contient toujours :

```
> Évolution
> Détail
```

## 7.1 Évolution

Déploie la section graphique (DualSeriesChart).

## 7.2 Détail

Affiche la liste des sessions.

Toujours dans cet ordre.

---

# 8. Cohérence avec l’ensemble Linky

Ordre mental global :

1. Trésorerie validée
2. Cash
3. Business
4. Points de vente
5. Taxes
6. Notes de crédit
7. Remboursements

Le POS n’est pas une exception visuelle.

Il suit la grammaire du cockpit.

---

# 9. Lecture en 5 secondes

À l’ouverture :

1. Combien de shops ?
2. Combien de sessions ?
3. Combien sécurisées ?
4. Montant total par shop ?

Tout doit être compris sans ouvrir Évolution ni Détail.

---

# 10. Interdictions

* Double titre
* Sous-module séparé “Sessions point de vente”
* Emoji sablier
* Hiérarchie horizontale complexe
* Bloc densifié type ERP

---

# 11. Vision produit

Le module POS doit transmettre :

* Maîtrise
* Traçabilité
* Sécurisation
* Continuité ERP → Vault
* Alignement banque ↔ opérationnel

Il n’est pas une interface de caisse.
Il est un instrument de contrôle.

---

# 12. Résumé exécutif

✔ Suppression du bloc “Sessions point de vente”
✔ Structure unique et cohérente
✔ Pattern uniforme par shop
✔ Aucune gamification
✔ Lecture immédiate

Sobre.
Aligné.
Maîtrisé.

---

**Fin — SPEC_POS_STRUCTURE_LINKY_v1.0**
