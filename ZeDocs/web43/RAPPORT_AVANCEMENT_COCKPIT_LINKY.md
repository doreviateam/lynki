# Rapport d'avancement — Refonte Cockpit Linky

**Document de suivi projet**

Version : 1.1  
Date : Mars 2026  
Période couverte : Sprint 1 + Sprint 2 + Sprint 3 + Sprint 4

---

## 1. Synthèse exécutive

| Indicateur | Valeur |
|------------|--------|
| **Sprints réalisés** | 4 / 4 |
| **User stories livrées** | 22 / 24 |
| **Story points** | 63 / 66 (95 %) |
| **Composants créés** | 17 |
| **URL cockpit** | `/cockpit` |

**État :** Le cockpit est fonctionnel avec chargement des données (APIs + fallback mock), graphiques Recharts, états loading/erreur. Sprint 4 terminé (états vides, responsive, accessibilité, tests E2E). Reste : LS-406 Recette MOA.

---

## 2. Détail par sprint

### 2.1 Sprint 1 — Fondations ✅

| ID | User Story | SP | Statut |
|----|------------|-----|--------|
| LS-101 | Tokens Tailwind Linky | 1 | ✅ Done |
| LS-102 | IBM Plex Sans | 1 | ✅ Done |
| LS-103 | Composant Badge | 2 | ✅ Done |
| LS-104 | Composant KpiCard | 3 | ✅ Done |
| LS-105 | Composant KpiGrid | 2 | ✅ Done |
| LS-106 | SkeletonCard + CockpitSkeleton | 2 | ✅ Done |

**Livrables :**
- `tailwind.config.js` — tokens Linky (colors, fontSize, spacing, borderRadius)
- `app/layout.tsx` — IBM Plex Sans + Inter (fallback)
- `components/cockpit/Badge.tsx`
- `components/cockpit/KpiCard.tsx`
- `components/cockpit/KpiGrid.tsx`
- `components/cockpit/SkeletonCard.tsx`
- `components/cockpit/CockpitSkeleton.tsx`
- `app/cockpit/page.tsx` — page avec 4 KPI mock

---

### 2.2 Sprint 2 — Layout et structure ✅

| ID | User Story | SP | Statut |
|----|------------|-----|--------|
| LS-201 | CockpitLayout | 2 | ✅ Done |
| LS-202 | CockpitHeader | 3 | ✅ Done |
| LS-203 | InsightCard | 2 | ✅ Done |
| LS-204 | ProofWidget (Couverture probante) | 5 | ✅ Done |
| LS-205 | SectionGrid | 2 | ✅ Done |

**Livrables :**
- `components/cockpit/CockpitLayout.tsx`
- `components/cockpit/CockpitHeader.tsx`
- `components/cockpit/InsightCard.tsx`
- `components/cockpit/ProofWidget.tsx` — jauge radiale SVG
- `components/cockpit/SectionGrid.tsx`

**Bonus (anticipation Sprint 3) :**
- `components/cockpit/ChartCard.tsx`
- `components/cockpit/TableCard.tsx` — avec colonne Preuve
- `components/cockpit/AlertCard.tsx`
- `components/cockpit/BarChartPlaceholder.tsx` — barres statiques
- `app/globals.css` — `*:focus-visible` pour accessibilité

---

## 3. Structure du cockpit actuel

```
/cockpit
├── CockpitHeader
│   └── Tenant • Période • Flux validés • Vault
├── InsightCard
│   └── Risque modéré — 41% retard sur 2 partenaires • Surveillance
├── KpiGrid (4 cartes)
│   ├── Trésorerie 62 480 € (+8 %)
│   ├── Marge 58.4 % (−2 pts)
│   ├── Encours clients 23 292 € (−12 %)
│   └── Retard paiement 41 % (+5 pts)
├── ProofWidget
│   ├── Jauge radiale 78 %
│   └── Sources : Vault, Odoo, POS, Banque
├── SectionGrid
│   ├── Flux économiques (CockpitBarChart / Recharts)
│   └── Exposition clients (TableCard + Preuve)
└── SectionGrid
    ├── Position trésorerie (CockpitBarChart / Recharts)
    └── Alertes financières (AlertCard)
```

---

## 4. Fichiers créés/modifiés

### 4.1 Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `units/dorevia-linky/tailwind.config.js` | Tokens Linky |
| `units/dorevia-linky/app/layout.tsx` | IBM Plex Sans |
| `units/dorevia-linky/app/globals.css` | Focus visible |

### 4.2 Fichiers créés

| Fichier |
|---------|
| `units/dorevia-linky/app/cockpit/page.tsx` |
| `units/dorevia-linky/components/cockpit/index.ts` |
| `units/dorevia-linky/components/cockpit/Badge.tsx` |
| `units/dorevia-linky/components/cockpit/KpiCard.tsx` |
| `units/dorevia-linky/components/cockpit/KpiGrid.tsx` |
| `units/dorevia-linky/components/cockpit/SkeletonCard.tsx` |
| `units/dorevia-linky/components/cockpit/CockpitSkeleton.tsx` |
| `units/dorevia-linky/components/cockpit/CockpitLayout.tsx` |
| `units/dorevia-linky/components/cockpit/CockpitHeader.tsx` |
| `units/dorevia-linky/components/cockpit/InsightCard.tsx` |
| `units/dorevia-linky/components/cockpit/ProofWidget.tsx` |
| `units/dorevia-linky/components/cockpit/SectionGrid.tsx` |
| `units/dorevia-linky/components/cockpit/ChartCard.tsx` |
| `units/dorevia-linky/components/cockpit/TableCard.tsx` |
| `units/dorevia-linky/components/cockpit/AlertCard.tsx` |
| `units/dorevia-linky/components/cockpit/BarChartPlaceholder.tsx` |
| `units/dorevia-linky/components/cockpit/CockpitBarChart.tsx` |
| `units/dorevia-linky/components/cockpit/CockpitError.tsx` |
| `units/dorevia-linky/app/types/cockpit.ts` |
| `units/dorevia-linky/app/lib/cockpit/loadCockpitData.ts` |

---

## 5. Conformité Design System

| Critère | Statut |
|---------|--------|
| Palette (#0F1B2D, #14243A, #1A2E47, #223B5B) | ✅ |
| IBM Plex Sans | ✅ |
| KPI 44px, semibold | ✅ |
| Cards border-radius 12px, padding 16px | ✅ |
| Badges padding 4px 8px, border-radius 6px | ✅ |
| Transitions 150ms ease-out | ✅ |
| Hover card #1F3653 | ✅ |
| Table hover #14243A | ✅ |
| Proof radial stroke-dashoffset | ✅ |
| Focus visible #3B82F6 | ✅ |

---

### 2.3 Sprint 3 — Contenu et données ✅

| ID | User Story | SP | Statut |
|----|------------|-----|--------|
| LS-301 | Type CockpitData + loadCockpitData() | 3 | ✅ Done |
| LS-302 | Graphique Flux (Recharts) | 5 | ✅ Done |
| LS-303 | Table Exposition + API | 5 | ✅ Done |
| LS-304 | Graphique Position trésorerie (Recharts) | 3 | ✅ Done |
| LS-305 | Bloc Alertes | 3 | ✅ Done |
| LS-306 | Connexion APIs réelles | 5 | ✅ Done |

**Livrables :**
- `app/types/cockpit.ts` — type CockpitData
- `app/lib/cockpit/loadCockpitData.ts` — Data Loader avec fallback mock
- `components/cockpit/CockpitBarChart.tsx` — Recharts
- `components/cockpit/CockpitError.tsx` — état erreur + retry
- Page cockpit : loading → données (APIs ou mock) → affichage

---

### 2.4 Sprint 4 — Finalisation ✅

| ID | User Story | SP | Statut |
|----|------------|-----|--------|
| LS-401 | Message d'erreur + retry | 2 | ✅ Done |
| LS-402 | Messages "Aucune donnée" | 2 | ✅ Done |
| LS-403 | Responsive tablette (900px, 600px) | 2 | ✅ Done |
| LS-404 | Accessibilité clavier | 2 | ✅ Done |
| LS-405 | Tests E2E cockpit | 3 | ✅ Done |
| LS-406 | Recette MOA | 2 | ⏳ À faire |

**Livrables :**
- `TableCard`, `AlertCard`, `ChartCard`, `CockpitBarChart` — états vides « Aucune donnée » / « Aucune alerte »
- `tailwind.config.js` — breakpoints `tablet:900px`, `mobile:600px`
- `CockpitLayout` — padding responsive `px-4` mobile → `px-6` tablette
- `SectionGrid`, `KpiGrid` — grille `tablet:grid-cols-2` / `tablet:grid-cols-4`
- `CockpitLayout` — `id="main"` pour skip link, `CockpitError` — focus-visible sur bouton Réessayer
- `tests/e2e/cockpit.spec.ts` — 6 tests Playwright (affichage, KPIs, sections, alertes, retry)

---

## 6. Prochaines étapes

| ID | User Story | Priorité |
|----|------------|----------|
| LS-406 | Recette MOA | P0 |

---

## 7. Risques et points d'attention

| Point | État |
|-------|------|
| APIs compatibles CockpitData | À vérifier |
| Recharts en remplacement de BarChartPlaceholder | À faire |
| Dashboard existant (/) non impacté | ✅ OK |

---

## 9. Incidents résolus

### 9.1 OwlError Odoo — `models[modelName].fields[...] is undefined` ✅ Résolu

**Date :** 2026-03-13  
**Environnement :** `odoo.lab.laplatine2026.doreviateam.com`

#### Symptôme

```
TypeError: can't access property "type", models[modelName].fields[node.getAttribute(...)] is undefined
  parse/<  →  loadView  →  props  (web.assets_web.min.js)
```

Erreur répétée à chaque navigation vers le module **Inventaire** (vue kanban des types d'opérations).

#### Cause racine

Le module OCA `stock_picking_invoicing` avait été installé précédemment. Sa dépendance `stock_picking_invoice_link` est depuis devenue non-installable (absent des sources). Le module ne charge plus côté Python, **mais ses 9 vues XML sont restées actives en base de données.**

Ces vues héritées injectaient des champs inexistants dans les vues de `stock.picking.type`, `stock.picking` et `stock.move` :

| Champ fantôme | Vue | Modèle |
|---------------|-----|--------|
| `count_picking_2binvoiced` | `stock_picking_type_kanban` | `stock.picking.type` |
| `invoice_state` | plusieurs vues | `stock.picking`, `stock.move` |

Le client web Odoo 18 (`get_views`) construit un dict `models[modelName].fields` avec les champs connus. Si un champ est présent dans l'arch XML mais absent du dict (champ d'un module non chargé), le parseur JS lève une `TypeError`.

#### Méthode de diagnostic

1. **Corrélation log/erreur** : le timestamp de l'OwlError (09:38:55) correspond au log serveur :  
   `POST /web/dataset/call_kw/stock.picking.type/get_views HTTP/1.1`

2. **Vérification côté serveur** via `odoo shell` :
   ```python
   result = env["stock.picking.type"].get_views(views=[[False, "kanban"]])
   # → champ "count_picking_2binvoiced" absent du dict fields
   ```

3. **Identification des vues orphelines** :
   ```python
   env["ir.ui.view"].search([("xml_id", "like", "stock_picking_invoicing%")])
   # → 9 vues actives issues d'un module non chargé
   ```

#### Correction appliquée

Désactivation des 9 vues orphelines directement en base :

```python
orphan_view_ids = [1887, 1888, 1889, 1890, 1891, 1892, 1893, 1894, 1895]
env["ir.ui.view"].sudo().browse(orphan_view_ids).write({"active": False})
env.cr.commit()
```

Vues désactivées :

| id | xml_id | modèle |
|----|--------|--------|
| 1887 | `stock_picking_invoicing.view_stock_return_picking_form_inherit` | `stock.return.picking` |
| 1888 | `stock_picking_invoicing.view_move_picking_form` | `stock.move` |
| 1889 | `stock_picking_invoicing.view_move_form_inherit` | `stock.move` |
| 1890 | `stock_picking_invoicing.view_move_tree` | `stock.move` |
| 1891 | `stock_picking_invoicing.view_picking_move_tree` | `stock.move` |
| 1892 | `stock_picking_invoicing.view_picking_inherit_tree2` | `stock.picking` |
| 1893 | `stock_picking_invoicing.view_picking_invoicing_internal_search` | `stock.picking` |
| 1894 | `stock_picking_invoicing.view_picking_form` | `stock.picking` |
| 1895 | `stock_picking_invoicing.stock_picking_type_kanban` | `stock.picking.type` |

Purge du cache assets + redémarrage Odoo.

#### Leçon retenue

> Quand un module OCA est retiré des sources sans désinstallation propre (`-u` + suppression), ses vues restent en base. Si ses champs ne sont plus chargés, toute vue héritée qui les référence devient une bombe à retardement pour le client web. **Toujours désinstaller un module via l'interface Odoo ou `-u base` avant de retirer ses sources.**

---

## 8. Comment tester

```bash
cd units/dorevia-linky
npm run dev
```

Ouvrir : **http://localhost:3000/cockpit**

---

*Rapport d'avancement — Cockpit Linky — Mars 2026*
