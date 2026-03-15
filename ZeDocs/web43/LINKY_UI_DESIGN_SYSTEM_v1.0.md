# LINKY UI DESIGN SYSTEM

**Dorevia Linky Cockpit**

Version : 1.1  
Statut : Specification

---

# 1. Objectif

Formaliser les règles UI pour l'interface **Dorevia Linky** afin de garantir :

- cohérence visuelle
- lisibilité financière
- densité maîtrisée
- implémentation rapide côté front

Ce document complète : **Direction Artistique — Linky Cockpit v1.1**

---

# 2. Design Tokens

## Couleurs principales

| Token | Valeur |
|-------|--------|
| `color-bg-primary` | `#0F1B2D` |
| `color-bg-secondary` | `#14243A` |
| `color-surface` | `#1A2E47` |
| `color-border` | `#223B5B` |
| `color-text-primary` | `#E6EEF8` |
| `color-text-secondary` | `#9FB3C8` |

## Couleurs fonctionnelles

| Token | Valeur |
|-------|--------|
| `color-info` | `#3B82F6` |
| `color-success` | `#22C55E` |
| `color-warning` | `#F59E0B` |
| `color-danger` | `#EF4444` |

## Teintes badges

| Token | Valeur |
|-------|--------|
| `success-bg` | `rgba(34,197,94,0.15)` |
| `warning-bg` | `rgba(245,158,11,0.15)` |
| `danger-bg` | `rgba(239,68,68,0.15)` |
| `info-bg` | `rgba(59,130,246,0.15)` |

---

# 3. Typographie

## Police principale

**IBM Plex Sans**

## Fallback

- Inter
- system-ui

## Hiérarchie

| Élément | Taille | Poids |
|---------|--------|-------|
| KPI principal | 44px | semibold |
| titre bloc | 18px | medium |
| sous-titre | 16px | medium |
| table | 14px | regular |
| label | 12px | medium |

---

# 4. Grid système

## Base

**8px**

## Layout cockpit

| Élément | Valeur |
|---------|--------|
| container padding | 24px |
| gap cartes | 16px |
| gap blocs | 24px |

## Largeur max cockpit

**1440px**

## Breakpoints responsive

| Breakpoint | Largeur | Usage |
|------------|---------|-------|
| desktop | ≥ 1440px | layout complet |
| laptop | 1024–1439px | layout adapté |
| tablet | 768–1023px | colonnes réduites |
| mobile | < 768px | usage limité (consultation) |

---

# 5. Composants UI

## 5.1 KPI Card

### Structure

```
+-------------------------+
| Title                   |
|                         |
| 58.4%                   |
|                         |
| ventes / achats         |
+-------------------------+
```

### Style

```
background: #1A2E47
border: 1px solid #223B5B
border-radius: 12px
padding: 16px
```

---

## 5.2 Insight Card

Bloc narratif prioritaire.

### Structure

```
Insight
Trésorerie partiellement validée
Couverture probante insuffisante
```

### Style

```
background: #14243A
border-left: 4px solid #F59E0B  /* ou var(--color-warning) */
padding: 16px
```

---

## 5.3 Badge

### Structure

```
Validation partielle
```

### Style

```
padding: 4px 8px
border-radius: 6px
font-size: 12px
font-weight: 600
```

### Couleur

- `background`: success-bg
- `color`: success

---

## 5.4 Table décisionnelle

### Structure

| Partenaire | Encours | Retard |
|------------|---------|--------|

### Style

- row-height : 40px
- font-size : 14px
- border-bottom : 1px #223B5B

### Hover

- background : #14243A

---

## 5.5 Composants à venir

À documenter en v1.2 :

- **Header** — tenant, périmètre, période, statut données, preuves scellées
- **Filtres / sélecteurs** — période, périmètre
- **États vides** — aucune donnée disponible
- **États d'erreur** — échec API, timeout

---

# 6. Graphiques

## Librairies recommandées

- Recharts
- ou Tremor

## Style graphique

| Élément | Couleur |
|---------|---------|
| ventes | success |
| achats | warning |
| axes | `#9FB3C8` |
| fond | transparent |

---

# 7. Animation

Micro-interactions uniquement.

| Élément | Valeur |
|---------|--------|
| durée | 150–200 ms |
| easing | ease-out |

### Autorisé

- hover
- apparition graphique
- loading skeleton

### Interdit

- animation décorative
- parallax
- effets crypto

---

# 8. Skeleton Loading

Pour les données financières.

### Style

```
background: #14243A
animation: pulse
border-radius: 8px
```

---

# 9. Icônes

## Style

- outline
- stroke 1.5px

## Sets recommandés

- Lucide
- Heroicons
- Phosphor

---

# 10. Accessibilité

| Critère | Valeur |
|---------|--------|
| Contraste | minimum WCAG AA |
| Focus | outline `#3B82F6` |
| Navigation clavier | tab accessible |

---

## Z-index scale

| Couche | Valeur | Usage |
|--------|--------|-------|
| base | 0 | contenu |
| dropdown | 100 | menus déroulants |
| sticky | 200 | header fixe |
| modal | 300 | modales |
| toast | 400 | notifications |

---

# 11. Densité informationnelle

**Objectif :** cockpit lisible.

## Règles

- max 3 niveaux hiérarchiques
- max 4 KPI par ligne
- 1 insight principal

---

# 12. Signature visuelle Linky

Chaque écran doit exposer :

## Source

- Vault
- Odoo
- POS

## Fiabilité

- flux couverts
- couverture probante
- validation

## Traçabilité

- preuves scellées

---

# 13. Anti-patterns

Interdits :

- gradients marketing
- look Dribbble
- couleurs décoratives
- 3D

---

# 14. Exemple layout cockpit

```
HEADER

INSIGHT

KPI  KPI  KPI

GRAPH

TABLE DECISION
```

---

# 15. Stack recommandée

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js, Tailwind, shadcn |
| Graph | Recharts |
| Icons | Lucide |

---

# 16. Roadmap UI

## v1

- cockpit financier
- marge
- trésorerie
- AR clients

## v2

- analytics avancées
- alerting
- DIVA insights

---

# 17. Principe fondamental

**Linky n'est pas un dashboard.**

C'est :

> un cockpit financier basé sur des données vérifiables.
