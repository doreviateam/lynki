# Changelog — SPEC_POS_STRUCTURE_LINKY_v1.1

**Périmètre :** ZeDocs/web20 — Module Points de vente Linky  
**Implémentation :** v1.93 (15 février 2026)  
**Document source :** SPEC_POS_STRUCTURE_LINKY_v1.1.md

---

## Résumé des modifications

Refonte complète du module POS selon la spec v1.1 : suppression de la section "Sessions point de vente" redondante, fusion en un bloc unique "Points de vente", alignement visuel sur les cartes comptables (Business, Cash), total en header, grammaire cohérente.

---

## 1. Architecture

### 1.1 Suppression de la section racine "Sessions point de vente"

- La section indépendante "SESSIONS POINT DE VENTE" a été supprimée.
- Les sessions deviennent un attribut interne de chaque point de vente, accessible via le lien "> Détail".

### 1.2 Bloc racine unique "Points de vente"

- Un seul bloc "POINTS DE VENTE" contient :
  - Header avec titre et total (comme Business)
  - Ligne synthèse : X points • Y sessions • Z sécurisées • N en attente
  - Cartes par shop avec Évolution et Détail

### 1.3 Fichiers modifiés / supprimés

| Fichier | Action |
|---------|--------|
| PosShopsView.tsx | Modifié — fusion avec logique Détail |
| PosSessionsView.tsx | Supprimé |
| ReportHeader.tsx | Modifié — suppression onglet Sessions |
| DashboardWithFilters.tsx | Modifié — réordonnancement, suppression PosSessionsView |

---

## 2. Navigation

### 2.1 Onglets header

- **Supprimé :** Onglet "Sessions"
- **Navigation finale :** Tout | Cash | Business | Corrections | Points de vente | Z de caisse

### 2.2 Type ViewMode

```typescript
type ViewMode = "all" | "cash" | "business" | "corrections" | "pos_shops" | "pos_z";
```

---

## 3. Structure visuelle

### 3.1 Header (aligné Business)

- **Titre :** "Points de vente" (gauche)
- **Total :** `formatSignedAmount(totalSales)` à droite (ex. + 4 213,20 €)
- **Style :** `text-lg font-bold tabular-nums text-[var(--positive)]`
- **Bordure gauche :** verte si données, grise si vide
- **Ligne de séparation :** border-b sous le header

### 3.2 Ligne synthèse

- Format : `X point(s) de vente • Y sessions • Z sécurisées • N en attente`
- Séparateur : ` • ` (caractère U+2022)
- Pas de total dans la synthèse (évite redondance avec header)
- Emoji ⏳ interdit pour "en attente"

### 3.3 Cartes par point de vente

**Alignement sur Ventes HT / Achats HT (Business) :**

- Première ligne : `flex justify-between` — nom shop à gauche, montant à droite
- Classes : `text-sm font-semibold text-[var(--text-secondary)]` / `tabular-nums text-[var(--text)]`
- Lignes suivantes : X sessions, ✓ X sécurisées, N en attente (sur lignes séparées)

**Sections dépliables :**

- `> Évolution` : CardChartSection + PosSessionChart ou DualSeriesChart (ventes scellées uniquement)
- `> Détail` : liste des sessions (session_id, créneau horaire, montant, statut vault)

---

## 4. Ordre des cartes Dashboard

Ordre normatif (viewMode "all") :

1. Trésorerie validée  
2. Cash  
3. Business  
4. Points de vente  
5. Taxes  
6. Notes de crédit  
7. Remboursements  
8. Z de caisse  

---

## 5. Évolutions post-spec

- **Total en header :** comme Business, montant affiché à droite du titre (spec § 6)
- **Alignement lignes shop :** structure identique à "Ventes HT" pour cohérence visuelle

---

## 6. Phase 6 — Graphique par session (v1.89–v1.92)

### 6.1 Granularité par défaut

- **Session** : une barre (ou un point) par session, option par défaut
- **Semaine, Mois** : agrégation par période (mode alternatif)
- Nouveau composant `PosSessionChart.tsx` pour l'affichage par session

### 6.2 Données affichées

- **Ventes scellées uniquement** : les ventes en attente ne sont plus affichées sur le graphique
- Prop `showSeries2={false}` sur `DualSeriesChart` pour le mode période (Semaine/Mois)

### 6.3 Libellé de la session

- L'axe X du graphique affiche l'identifiant de la session (ex. POS/00020, POS/00019, POS/00015)

### 6.4 Lisibilité des petites valeurs

- **minPointSize** (6 px) : hauteur minimale pour les barres non nulles, afin que les petits montants restent visibles malgré l'échelle

### 6.5 Fichiers ajoutés / modifiés

| Fichier | Action |
|---------|--------|
| PosSessionChart.tsx | Nouveau — graphique bar/line/pie par session |
| chart-granularity.ts | Ajout type "session", `getPosChartGranularities`, `getDefaultPosChartGranularity` |
| DualSeriesChart.tsx | Prop `showSeries2` pour masquer la série 2 |
| CardChartSection.tsx | Gestion granularité "session", masquage Montants/Répartition % en mode session |

### 6.6 Scroll horizontal — graphiques denses (v1.93)

Lorsqu'un graphique comporte plus de 12 sessions sur l'axe X, un **scroll horizontal** est activé :
- Seuil : 12 items (`SCROLL_THRESHOLD`)
- Largeur min. par item : 48 px
- S'applique au **bar chart** et au **line chart** (pas au pie chart)
- Conteneur : `overflow-x-auto`, `scroll-smooth`, `scrollbarGutter: stable`

---

**Fin — CHANGELOG_POS_STRUCTURE_LINKY_v1.1**
