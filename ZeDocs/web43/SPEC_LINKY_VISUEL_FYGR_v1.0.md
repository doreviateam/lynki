# Spécification — Transformation visuelle Linky style Fygr

**Document de référence MOA / Équipe projet**

Version : 1.3  
Date : Mars 2026  
Statut : Spécification — À valider

---

## 1. Résumé exécutif

### 1.1 Objet

Transformer visuellement **ui.lab.o19.doreviateam.com** (Dorevia Linky) pour présenter l'application comme une interface professionnelle fintech, proche de [Fygr](https://www.fygr.io/) (logiciel de trésorerie / prévisionnel), en s'appuyant sur le **Design System du cockpit** déjà réalisé.

> **Positionnement produit :** Linky doit évoquer un **cockpit de pilotage financier temps réel** plutôt qu'un simple dashboard analytique. Le design doit inspirer rigueur, précision et confiance — en cohérence avec la promesse « données financières vérifiables ».

### 1.2 Objectifs

| Objectif | Description |
|----------|-------------|
| **Professionnalisme** | Interface perçue comme une vraie application fintech (type Fygr) |
| **Cohérence** | Réutiliser le design du cockpit (tokens, palette, composants) |
| **Référence** | S'inspirer de Fygr : clarté, espace, hiérarchie, confiance |
| **Périmètre** | Cible prioritaire : `ui.lab.o19.doreviateam.com` |

### 1.3 Documents de référence

| Document | Rôle |
|----------|------|
| `RAPPORT_AVANCEMENT_COCKPIT_LINKY.md` | Design System cockpit, §5 Conformité |
| `SPECIFICATION_REFONTE_COCKPIT_LINKY.md` | Structure cockpit, exigences |
| `tailwind.config.js` (Linky) | Tokens linky-bg, linky-surface, etc. |
| [Fygr.io](https://www.fygr.io/) | Référence visuelle fintech |

### 1.4 Wireframes — référence d'implémentation

Les wireframes HTML ci-dessous servent de **référence visuelle** pour l'implémentation. Ils font autorité pour le layout, la hiérarchie et le rendu attendu.

| Élément | Fichier |
|---------|---------|
| Vue d'ensemble (cockpit) | `ZeDocs/web43/WIREFRAME_LINKY_FYGR_v1.html` |
| Carte Business (détail) | `ZeDocs/web43/WIREFRAME_LINKY_BUSINESS_CARD_v1.html` |

Ouvrir ces fichiers dans un navigateur pour prévisualiser le résultat cible.

### 1.5 Contrainte : pas de régression fonctionnelle

> **La transformation est visuelle uniquement.** Aucune régression sur les propositions fonctionnelles déjà implémentées.

| Règle | Application |
|-------|-------------|
| Conserver | Tous les blocs, filtres, cartes, tableaux, graphiques, actions existants |
| Conserver | Comportements (navigation, drill-down, accordéons, onglets) |
| Conserver | Logique métier (calculs, statuts, badges) |
| Modifier | Uniquement les styles (couleurs, typo, espacements, bordures) |
| Modifier | Layout uniquement si aligné avec les wireframes (sans supprimer de contenu) |

En cas de doute : **préférer conserver la fonctionnalité** et ajuster le style autour.

---

## 2. Référence visuelle Fygr

### 2.1 Caractéristiques observées

| Aspect | Fygr | À appliquer à Linky |
|--------|------|---------------------|
| **Layout** | Clair, aéré, sections bien délimitées | Espacement généreux, grille claire |
| **Couleurs** | Fond sombre ou léger, accent bleu/vert | Palette cockpit (#0F1B2D, #14243A, #1A2E47) |
| **Typographie** | Moderne, lisible, hiérarchie nette | IBM Plex Sans, KPI 44px, titres 16px |
| **Cartes** | Bordures discrètes, coins arrondis | 12px radius, padding 16px |
| **Chiffres** | Dominants, mise en avant | KPI semibold, tabular-nums |
| **Statuts** | Badges discrets, couleurs sémantiques | Vert = ok, Orange = watch, Rouge = alert |

### 2.2 Ton visuel

- **Professionnel** : pas de fioritures, pas de décor superflu
- **Confiant** : données chiffrées, clarté, lisibilité
- **Moderne** : sans être "tech", sans être "corporate" daté

### 2.3 Principe : densité maîtrisée

Les dashboards fintech réussis partagent un secret : **beaucoup d'information mais très lisible**.

| Principe | Application |
|----------|-------------|
| Beaucoup d'information | Tous les KPIs et flux pertinents restent visibles |
| Organisée | Hiérarchie claire, regroupements logiques |
| Jamais saturée | Espacement généreux, pas de surcharge visuelle |

---

## 3. Hiérarchie de lecture

### 3.1 Ordre de lecture recommandé

Le vrai sujet de Linky est **la lecture des informations**. L'ordre de lecture doit guider l'œil :

| Priorité | Bloc | Rôle |
|----------|------|------|
| 1️⃣ | KPI globaux (grille) | Vue d'ensemble immédiate |
| 2️⃣ | Indicateurs de santé (badge intégrité, couverture) | Confiance dans les données |
| 3️⃣ | Flux financiers (Trésorerie, Cash, Business) | Détail par axe |
| 4️⃣ | Détails opérationnels (tables, graphiques) | Drill-down si besoin |

Sans cette hiérarchie, on risque un dashboard **joli mais illisible**.

---

## 4. Design System à appliquer (Cockpit)

### 4.1 Palette (dark mode)

| Token | Valeur | Usage |
|-------|--------|-------|
| `linky-bg` | #0F1B2D | Fond principal |
| `linky-bg-secondary` | #14243A | Fond secondaire |
| `linky-surface` | #1A2E47 | Surfaces cartes |
| `linky-border` | #223B5B | Bordures |
| `linky-text` | #E6EEF8 | Texte principal |
| `linky-muted` | #9FB3C8 | Texte secondaire |
| `linky-hover` | #1F3653 | Hover cartes |
| `linky-success` | #22C55E | OK, positif |
| `linky-warning` | #F59E0B | Attention |
| `linky-danger` | #EF4444 | Alerte |
| `linky-info` | #3B82F6 | Accent, focus |

### 4.2 Typographie

| Élément | Spec | Usage |
|--------|------|-------|
| Corps | IBM Plex Sans 400/500/600 | Texte général |
| KPI | 44px, semibold | Valeurs principales |
| Titre | 16px, line-height 1.4 | Titres des cartes |
| Petit | 13px | Labels, métadonnées |
| Badge | 12px, semibold | Badges statut |

**Règle typographique pour les montants :**

| Bon | Mauvais |
|-----|---------|
| `124 540 €` | `124540€` |
| `+ 8 053,09 €` | `+8053.09€` |

- `tabular-nums` obligatoire pour les chiffres
- Alignement vertical des colonnes
- Unité (€) discrète, en fin de valeur
- Espace insécable pour les milliers

### 4.3 Espacement

| Token | Valeur | Usage |
|-------|--------|-------|
| `linky-gap` | 16px | Espace entre cartes |
| `linky-gap-lg` | 24px | Espace entre sections |
| `linky-padding` | 16px | Padding cartes |
| `linky-padding-lg` | 24px | Padding sections |

### 4.4 Composants

| Composant | Fichier | Réutilisation |
|-----------|---------|---------------|
| KpiCard | `cockpit/KpiCard.tsx` | Tuiles KPI |
| Badge | `cockpit/Badge.tsx` | Statuts |
| ProofWidget | `cockpit/ProofWidget.tsx` | Jauge couverture |
| ChartCard | `cockpit/ChartCard.tsx` | Graphiques |
| TableCard | `cockpit/TableCard.tsx` | Tableaux |

### 4.5 Sémantique des statuts

Les couleurs de statut doivent avoir une **signification claire** pour éviter les interprétations :

| Couleur | Token | Signification |
|---------|-------|----------------|
| Vert | `linky-success` | OK / cohérence / données validées |
| Orange | `linky-warning` | Anomalie légère / à surveiller |
| Rouge | `linky-danger` | Incohérence forte / action requise |
| Bleu | `linky-info` | Neutre / info / focus |

---

## 5. Périmètre de transformation

### 5.1 Cible

- **URL** : https://ui.lab.o19.doreviateam.com/
- **Page** : Dashboard principal (`/`) — `DashboardWithFilters`
- **Tenant** : o19 (configurable via `TENANT_ID`)

### 5.2 Fichiers impactés

| Fichier | Modification |
|---------|--------------|
| `app/globals.css` | Variables CSS → palette cockpit |
| `app/layout.tsx` | Typo IBM Plex prioritaire |
| `tailwind.config.js` | Tokens Linky déjà présents |
| `components/ReportHeader.tsx` | Style cockpit |
| `components/IconGrid.tsx` | Cartes style KpiCard |
| `components/LinkyFooter.tsx` | Style cockpit |
| `components/SyncInProgress.tsx` | Style cockpit |
| `components/TreasuryCardWithPolling.tsx` | Cartes détaillées |
| `components/BusinessCard.tsx` | Cartes détaillées |
| `components/FluxCashCardWithPolling.tsx` | Cartes détaillées |
| Autres cartes (Taxes, CreditNotes, Refunds, PosShops) | Style cohérent |

### 5.3 Option : mode light

Fygr propose aussi un mode clair. À prévoir en v1.1 si souhaité.

---

## 6. Exigences par bloc

### 6.1 Interaction des cartes

Au-delà du style (couleur, padding, radius), définir le **comportement** :

| Action | Comportement |
|--------|--------------|
| Hover | Élévation légère (shadow) ou fond `linky-hover` |
| Click | Navigation vers la vue détail de la carte |
| Focus | Outline visible (#3B82F6), accessibilité clavier |

### 6.2 Header (ReportHeader)

| Élément | Spécification |
|--------|---------------|
| Fond | `linky-bg` ou `linky-bg-secondary` |
| Texte | `linky-text` / `linky-muted` |
| Bordures | `linky-border` |
| Logo / titre | IBM Plex Sans, semibold |
| Filtres (société, période) | Style cockpit, dropdowns cohérents |
| Badge intégrité | Composant Badge cockpit |

### 6.3 Grille KPI (IconGrid)

| Élément | Spécification |
|--------|---------------|
| Fond cartes | `linky-surface` |
| Hover | `linky-hover` |
| Border-radius | 12px |
| Padding | 16px |
| Valeurs KPI | 44px, semibold, tabular-nums |
| Labels | 16px, `linky-muted` |
| Contour statut | Vert / Orange / Rouge selon status |

### 6.4 Cartes détaillées (Treasury, Business, Cash, etc.)

| Élément | Spécification |
|--------|---------------|
| Titre | `text-lg font-bold uppercase tracking-wide text-[var(--accent)]` → `text-linky-title text-linky-muted font-medium` |
| Fond | `linky-surface` |
| Bordures | `linky-border` |
| Transitions | 150ms ease-out |

### 6.5 Bloc Synchronisation (SyncInProgress)

| Élément | Spécification |
|--------|---------------|
| Message | Style cockpit, `linky-muted` |
| Boutons | Style cockpit (primary / secondary) |

### 6.6 Footer (LinkyFooter)

| Élément | Spécification |
|--------|---------------|
| Fond | `linky-bg-secondary` |
| Texte | `linky-muted` |
| Sources | Badges style cockpit |

---

## 7. Plan de mise en œuvre

### 7.0 Pré-requis : wireframe (recommandé)

**Avant de coder**, produire un wireframe rapide du futur écran Linky pour valider :

- Ordre de lecture
- Équilibre des blocs
- Densité visuelle

Un exemple concret d'écran Linky « style Fygr » (layout, grid, cartes, KPI) permet de vérifier immédiatement si **ça fait fintech ou pas**.

> **Wireframes disponibles (référence d'implémentation) :**
> - `ZeDocs/web43/WIREFRAME_LINKY_FYGR_v1.html` — Vue d'ensemble
> - `ZeDocs/web43/WIREFRAME_LINKY_BUSINESS_CARD_v1.html` — Carte Business

### 7.1 Phase 1 — Fondations (1–2 h)

1. Appliquer palette cockpit en variables CSS (`globals.css`)
2. Forcer fond `linky-bg` sur body / layout
3. Vérifier typo IBM Plex Sans (déjà layout)

### 7.2 Phase 2 — Header et Footer (1 h)

1. Restyler ReportHeader avec tokens cockpit
2. Restyler LinkyFooter avec tokens cockpit

### 7.3 Phase 3 — Grille et cartes (2–3 h)

1. Adapter IconGrid (style KpiCard)
2. Adapter cartes détaillées (Treasury, Business, Cash, etc.)
3. SyncInProgress, DivaFlashBlock, DecisionsBlock

### 7.4 Phase 4 — Ajustements (1 h)

1. Responsive, breakpoints
2. Focus visible, accessibilité
3. Recette visuelle

---

## 8. Critères de succès

| Critère | Indicateur |
|---------|------------|
| Cohérence visuelle | Palette cockpit appliquée partout |
| Référence Fygr | Impression "app fintech pro" |
| Réutilisation | Composants cockpit utilisés où pertinent |
| Accessibilité | Focus visible, contrastes OK |
| **Non-régression fonctionnelle** | Aucune perte de bloc, filtre, action ou donnée déjà implémentée |

---

## 9. Hors périmètre v1.0

- Mode clair (light)
- Refonte structurelle (layout / navigation)
- Nouveaux composants (hors réutilisation cockpit)
- Autres tenants (laplatine2026, etc.) — à décider

---

## 10. Annexe — Mapping composants

| Composant actuel | Style cible |
|------------------|-------------|
| `var(--card)` | `linky-surface` |
| `var(--text)` | `linky-text` |
| `var(--muted)` | `linky-muted` |
| `var(--border)` | `linky-border` |
| `var(--accent)` | `linky-info` |
| `var(--positive)` | `linky-success` |
| `var(--warning)` | `linky-warning` |
| `var(--negative)` | `linky-danger` |

---

---

## Historique des versions

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | Mars 2026 | Version initiale |
| 1.1 | Mars 2026 | Revue produit : positionnement cockpit, hiérarchie de lecture, densité maîtrisée, sémantique statuts, interaction cartes, typo montants, pré-requis wireframe |
| 1.2 | Mars 2026 | Wireframes comme référence d'implémentation (§1.4) |
| 1.3 | Mars 2026 | Contrainte pas de régression fonctionnelle (§1.5) |

---

*Spécification — Transformation visuelle Linky style Fygr — Mars 2026*
