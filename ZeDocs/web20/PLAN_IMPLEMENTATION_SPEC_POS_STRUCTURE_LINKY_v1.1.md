# Plan d'implémentation — SPEC_POS_STRUCTURE_LINKY_v1.1

**Dernière mise à jour :** 15 février 2026  
**Document source :** SPEC_POS_STRUCTURE_LINKY_v1.1.md  
**Statut :** Implémenté (v1.93)

---

## 1. Vue d'ensemble

| Phase | Objectif | Fichiers principaux |
|-------|----------|---------------------|
| 1 | Supprimer l'onglet Sessions de la navigation | ReportHeader.tsx |
| 2 | Fusionner PosShopsView + PosSessionsView en bloc unique | PosShopsView.tsx, PosSessionsView.tsx |
| 3 | Réordonner les cartes du Dashboard | DashboardWithFilters.tsx |
| 4 | Appliquer la grammaire visuelle (•, statuts, emoji) | PosShopsView.tsx |
| 5 | Nettoyage et vérification | — |

---

## 2. Phase 1 — Navigation

### 2.1 Modifications ReportHeader.tsx

**Type ViewMode :**
```typescript
// Avant
export type ViewMode = "all" | "cash" | "business" | "corrections" | "pos_shops" | "pos_sessions" | "pos_z";

// Après
export type ViewMode = "all" | "cash" | "business" | "corrections" | "pos_shops" | "pos_z";
```

**Supprimer** le bouton "Sessions" dans les deux menus (mobile et desktop) :
- Bloquer lignes 210-223 (menu mobile)
- Bloquer lignes 378-391 (menu desktop)

Navigation finale affichée :
- Tout
- Cash
- Business
- Corrections
- Points de vente
- Z de caisse

### 2.2 Migration viewMode

Si l'utilisateur a `pos_sessions` en session/localStorage, rediriger vers `pos_shops` au chargement (fallback dans `useState` ou effet initial).

---

## 3. Phase 2 — Fusion des vues POS

### 3.1 Stratégie

Conserver **PosShopsView** comme composant unique.  
**Intégrer** la logique "Détail" (liste des sessions) dans PosShopsView.  
**Supprimer** PosSessionsView en tant que section racine (on peut garder le fichier comme module interne ou supprimer après extraction).

### 3.2 PosShopsView — structure cible par carte

```
[Nom du point de vente]                    [Montant total €]

X sessions
✓ X sécurisées
N en attente

> Évolution     (CardChartSection + DualSeriesChart)
> Détail        (liste des sessions, expandable)
```

### 3.3 Éléments à récupérer de PosSessionsView

| Élément | Destination |
|---------|-------------|
| `VAULT_STATUS_LABEL` | PosShopsView (pour liste sessions) |
| `groupSessionsByShop` | Déjà équivalent via `aggregateByShop` — adapter pour garder items bruts |
| Liste sessions (session_id, closed_at, total_sales, vault_status, difference) | Composant interne ou JSX dans PosShopsView |
| `getShopDisplayName` | Déjà dans PosShopsView |

### 3.4 PosShopsView — changements détaillés

1. **Ajouter** état `expandedDetailShops: Set<string>` pour savoir quel shop affiche le Détail.
2. **Après** CardChartSection (Évolution), ajouter lien "> Détail" cliquable.
3. **Si** Détail ouvert : afficher la liste des sessions du shop (même rendu que PosSessionsView actuel dans la section Détail).
4. **Réutiliser** l'API `/api/pos-sessions` — les `items` contiennent déjà `shop_id`, on filtre par shop.

---

## 4. Phase 3 — Réordonnancement Dashboard

### 4.1 Ordre normatif (spec § 5)

1. Trésorerie validée
2. Cash
3. Business
4. Points de vente
5. Taxes
6. Notes de crédit
7. Remboursements
8. Z de caisse

### 4.2 Modifications DashboardWithFilters.tsx

**Ordre actuel (viewMode "all") :**
- Trésorerie, Cash
- Remboursements
- Business
- Taxes
- Notes de crédit
- PosShopsView
- PosSessionsView ← à supprimer
- PosComingSoonView (Z)

**Nouvel ordre :**
- Trésorerie
- Cash (FluxCashCardWithPolling)
- Business
- PosShopsView
- Taxes
- Notes de crédit
- Remboursements
- PosComingSoonView (Z de caisse)

**Logique par viewMode :**
- `all` : afficher toutes les cartes dans l'ordre ci-dessus.
- `pos_shops` : afficher uniquement PosShopsView.
- `pos_z` : afficher uniquement PosComingSoonView (Z de caisse).
- Supprimer toute référence à `pos_sessions` et `PosSessionsView`.

---

## 5. Phase 4 — Grammaire visuelle

### 5.1 Ligne synthèse (PosShopsView)

**Format spec :**
```
X points de vente • Y sessions • Z sécurisées • N en attente         Total : M €
```

**Implémentation :**
- Séparateur ` • ` (caractère U+2022) entre les éléments.
- Total déplacé dans le header (aligné Business), supprimé de la synthèse pour éviter redondance.

### 5.2 Statuts par carte (spec § 3.2)

**Format :**
```
X sessions
✓ X sécurisées
N en attente
```

**Règles :**
- Une ligne par information (pas de ligne compacte).
- Supprimer l'emoji ⏳ pour "en attente" — texte uniquement : "0 en attente" ou "N en attente".
- ✓ conservé pour "sécurisées".
- Couleurs : `--positive` pour sécurisées, `--warning` pour en attente.

### 5.3 Liens Évolution / Détail

- Ordre strict : `> Évolution` puis `> Détail`.
- Style : `text-[var(--accent)]`, taille 0.875rem, poids 500.

---

## 6. Phase 5 — Nettoyage

### 6.1 Fichiers

| Fichier | Action |
|---------|--------|
| PosSessionsView.tsx | Supprimer ou conserver comme utilitaire — recommandation : supprimer après fusion complète |
| PosShopsView.tsx | Renommer éventuellement en `PosView.tsx` (optionnel, la spec parle de "Points de vente") |
| DashboardWithFilters.tsx | Supprimer import et usage de PosSessionsView |
| ReportHeader.tsx | Supprimer `pos_sessions` du type et des menus |

### 6.2 Références à mettre à jour

- `showPosSessions` : supprimer.
- `isPosView` : `viewMode === "pos_shops" || viewMode === "pos_z"`.
- Toute condition `viewMode === "pos_sessions"` : supprimer.

---

## 7. Phase 6 — Granularité par session (graphique POS)

**Choix de conception retenu :** le graphique est associé au point de vente. Par défaut, **chaque session** est distinguée sur le graphique (une barre ou un point par session).

### 7.1 Granularité

- **Par défaut** : granularité « Session » — une barre (ou un point) par session
- **Option** : Semaine, Mois — agrégation par période
- Structure : une carte par shop avec nom, montant, graphique Évolution, Détail

### 7.2 Données affichées

- **Ventes scellées uniquement** : pas de « ventes en attente » sur le graphique
- **Libellé session** : l'axe X affiche l'identifiant de la session (ex. POS/00020, POS/00019, POS/00015)

### 7.3 Lisibilité des petites valeurs

- **minPointSize** : hauteur minimale de 6 px pour les barres non nulles, afin que les petits montants (ex. 7,20 €) restent visibles malgré l'échelle (ex. jusqu'à 2 100 €)

### 7.4 Fichiers

| Fichier | Rôle |
|---------|------|
| PosSessionChart.tsx | Graphique par session (bar, line, pie) |
| PosShopsView.tsx | Orchestration, granularité Session par défaut |
| DualSeriesChart.tsx | Prop `showSeries2` pour masquer la série 2 (mode période) |

### 7.5 Scroll horizontal — graphiques denses (v1.93)

**Implémenté.** Lorsqu'un graphique comporte plus de 12 items sur l'axe X :
- Seuil : 12 items (`SCROLL_THRESHOLD`)
- Largeur min. par item : 48 px
- S'applique au bar chart et au line chart (pas au pie chart)
- Conteneur : `overflow-x-auto`, `scroll-smooth`, `scrollbarGutter: stable`

---

## 8. Checklist d'exécution

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 1 | Supprimer `pos_sessions` du type ViewMode | ReportHeader.tsx | ✓ |
| 2 | Supprimer le bouton Sessions (2 occurrences) | ReportHeader.tsx | ✓ |
| 3 | Fusionner Détail dans PosShopsView | PosShopsView.tsx | ✓ |
| 4 | Appliquer synthèse avec •, Total en header (aligné Business) | PosShopsView.tsx | ✓ |
| 5 | Statuts sur lignes séparées, pas d'emoji ⏳ | PosShopsView.tsx | ✓ |
| 6 | Réordonner les cartes | DashboardWithFilters.tsx | ✓ |
| 7 | Supprimer PosSessionsView du render | DashboardWithFilters.tsx | ✓ |
| 8 | Supprimer showPosSessions, isPosView | DashboardWithFilters.tsx | ✓ |
| 9 | Supprimer import PosSessionsView | DashboardWithFilters.tsx | ✓ |
| 10 | Supprimer fichier PosSessionsView.tsx | — | ✓ |
| 11 | Granularité « Session » par défaut — une barre/point par session sur le graphique | PosShopsView, PosSessionChart | ✓ |
| 12 | Ne pas afficher ventes en attente sur le graphique POS | PosSessionChart, DualSeriesChart | ✓ |
| 13 | Libellé de la session (ex. POS/00020) sur l'axe X du graphique | PosSessionChart | ✓ |
| 14 | minPointSize pour les petites valeurs visibles | PosSessionChart | ✓ |
| 15 | Scroll horizontal pour graphiques denses (> 12 sessions) | PosSessionChart | ✓ |

---

## 9. Ordre de réalisation recommandé

1. **ReportHeader** — suppression Sessions (Phase 1)
2. **PosShopsView** — intégrer Détail + grammaire (Phases 2 + 4)
3. **DashboardWithFilters** — réordre + supprimer PosSessionsView (Phase 3)
4. **Supprimer** PosSessionsView.tsx (Phase 5)
5. **Build & tests** — vérifier vue "all", vue "pos_shops", vue "pos_z"

---

---

## 10. Références

- **Changelog détaillé :** [CHANGELOG_POS_STRUCTURE_LINKY_v1.1.md](./CHANGELOG_POS_STRUCTURE_LINKY_v1.1.md)
- **Spec source :** [SPEC_POS_STRUCTURE_LINKY_v1.1.md](./SPEC_POS_STRUCTURE_LINKY_v1.1.md)

---

**Fin — PLAN_IMPLEMENTATION_SPEC_POS_STRUCTURE_LINKY_v1.1**
