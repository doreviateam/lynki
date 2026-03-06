# Spécification — Découpage des graphiques (Linky)

**Version :** 1.3  
**Date :** 15 février 2026  
**Référence visuelle :** Carte Cash — section Évolution (barres, Mois, Montants)  
**Parent :** [SPEC_LINKY_CARD_BUSINESS_GRAPHIQUE.md](SPEC_LINKY_CARD_BUSINESS_GRAPHIQUE.md) v1.4  
**Orientation :** Rigueur + Flexibilité maîtrisée + Pédagogie progressive

---

## 1. Objectif

Définir les options de découpage affichées à l'utilisateur selon le **contexte du graphique**, tout en intégrant une dimension pédagogique progressive.

L'utilisateur dispose de trois sélecteurs dans un ordre cohérent :

**Type → Granularité → Mode**

La compréhension doit être immédiate, mais approfondissable à la demande.

---

## 2. Disposition (layout)

Les sélecteurs sont alignés sur une seule ligne, blocs arrondis (`bg-[var(--muted-soft)]`), `gap-2`.

```
[ Type ]   [ Granularité ]   [ Mode ]
```

- **Type** : icônes uniquement (bar, line, pie)
- **Granularité** : texte (Jour, Semaine, Mois)
- **Mode** : texte (Montants, Répartition %)

Option active :

- Fond `var(--accent)`
- Texte blanc

---

## 3. Affichage selon le contexte

### 3.1 Bloc Type

Toujours visible sauf cas spécifique (Trésorerie validée → camembert unique).

Types disponibles :

- Barres
- Courbe
- Camembert

### 3.2 Bloc Granularité

Visible uniquement si Type ≠ Camembert.

Options dynamiques selon période :

| Longueur période | Options | Défaut |
|------------------|---------|--------|
| ≤ 31 jours | Jour / Semaine / Mois | Jour |
| 32–180 jours | Semaine / Mois | Mois |
| > 180 jours | Mois | Mois |

Si une seule option → bloc désactivé (non masqué).

### 3.3 Bloc Mode

Visible uniquement si Type ≠ Camembert.

Options :

- Montants
- Répartition %

Répartition % = normalisation à 100 % par période.

---

## 4. Pédagogie intégrée

### 4.1 Principes

- Aucune surcharge visuelle
- Explication contextuelle uniquement
- Progressive disclosure
- Toujours accessible

### 4.2 Tooltips contextuels

#### Type

- **Barres** : « Compare les volumes par période. »
- **Courbe** : « Visualise la tendance dans le temps. »
- **Camembert** : « Montre la répartition totale sur la période. »

#### Granularité

« Définit la taille des pas de temps. »

#### Mode

- **Montants** : « Valeurs absolues en €. »
- **Répartition %** : « Chaque période est normalisée à 100 %. »

---

## 5. Ligne de résumé d'interprétation

En bas à gauche du graphique, ligne discrète (12px, `--text-secondary`). Positionnée après le graphique, alignée à gauche.

Exemples dynamiques :

- « Lecture : volumes mensuels en €. »
- « Lecture : tendance hebdomadaire. »
- « Lecture : répartition par mois (100 % par mois). »
- « Lecture : répartition sur la période sélectionnée. »

Cette ligne change automatiquement selon Type + Granularité + Mode.

---

## 6. Pédagogie progressive (First-time UX)

### 6.1 Changement vers Répartition %

Au premier passage vers « Répartition % » :

Toast discret (une seule fois par utilisateur) :

« Astuce : en Répartition %, chaque période est normalisée à 100 %. »

Stockage localStorage : `linky_graph_mode_hint_shown = true`

### 6.2 Bouton « Pourquoi ? »

Bouton texte discret à droite des sélecteurs.

Affiche un popover contenant :

- Période active
- Tenant actif
- Source des données
- Règle de calcul (TTC, net, scellé, etc.)

Ce bloc prépare l'intégration future DLP.

---

## 7. Couleurs des séries

| Carte | Série 1 | Série 2 |
|-------|---------|---------|
| Cash | Encaissements (vert) | Décaissements (orange) |
| Business | Ventes TTC (vert) | Achats TTC (orange) |
| Taxes | Collectées (vert) | Déductibles (orange) |
| Notes de crédit | Avoirs clients (vert) | Avoirs fournisseurs (orange) |
| Remboursements | Remb. clients (vert) | Remb. fournisseurs (orange) |
| Trésorerie validée | Rapproché (vert) | En attente (orange) |
| POS | Ventes scellées (vert) | En attente (orange) |

---

## 8. Accessibilité

- `aria-label` complet pour chaque icône
- Ordre tab logique
- Tooltips accessibles clavier
- Contraste minimum WCAG AA

---

## 9. Interdictions

- Masquage brutal de blocs (préférer désactivation)
- Tooltips techniques (pas de serie1/serie2)
- Animations agressives
- Changement de layout brusque

---

## 10. Résumé stratégique

Linky doit permettre :

1. Voir immédiatement
2. Comprendre progressivement
3. Expliquer si nécessaire

La pédagogie est intégrée mais jamais imposée.

---

---

## 11. Historique des versions

| Version | Date | Modification |
|---------|------|--------------|
| 1.0 | 15/02/2026 | Spécification initiale — Type, Granularité, Mode selon contexte |
| 1.1 | 15/02/2026 | Pédagogie intégrée (tooltips, ligne interprétation, toast first-time, bouton Pourquoi ?) ; Mode libellé « Répartition % » ; bloc Granularité désactivé si une seule option |
| 1.2 | 15/02/2026 | Ligne de résumé d'interprétation déplacée **en bas à gauche du graphique** (v1.59) |
| 1.3 | 15/02/2026 | Trésorerie validée (Répartition) dépliée par défaut ; autres cartes repliées |

---

**Fin SPEC v1.3**
