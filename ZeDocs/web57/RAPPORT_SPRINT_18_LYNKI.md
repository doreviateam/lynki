# Rapport de Sprint 18 — Lynki

**Fichier canonique :** `RAPPORT_SPRINT_18_LYNKI.md`  
**Version :** 1.1 — mars 2026 — **gel canonique**  
**Plan :** [PLAN_SPRINT_18_LYNKI.md](PLAN_SPRINT_18_LYNKI.md) v1.0.3  
**Tickets :** [EXECUTION_TICKETS_SPRINT_18_LYNKI.md](EXECUTION_TICKETS_SPRINT_18_LYNKI.md) v1.1  
**Référence UI cible :** [REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) v0.3.1  
**Maquette :** [ANNEXE_UI_CIBLE_SYNTHESE_LYNKI_S18.html](ANNEXE_UI_CIBLE_SYNTHESE_LYNKI_S18.html) *(north star, figée)*  
**Sprint précédent :** [RAPPORT_SPRINT_17_LYNKI.md](RAPPORT_SPRINT_17_LYNKI.md) v1.5  

---

## 1. Résumé exécutif

Le Sprint 18 **atteint l'objectif « maturité visuelle contrôlée »** de la Synthèse comptable : un **design system V2 localisé** (`synthese-v2.css`) scoped sous `.synthese-scope`, une **recomposition structurelle** alignée sur la maquette HTML (north star) via une **matrice d'adaptation bloc par bloc**, des **états vides nobles** pour chaque composant, et deux **nouveaux blocs** (Points d'attention V1, Documentation / CODIR V1) — le tout **sans toucher aux tokens globaux** (`globals.css` inchangé) et en **préservant l'invariant de lecture S15–S17** (bloc confiance → KPI → graphiques → Diva/preuve → documentation).

**Gate D — Maturité visuelle contrôlée :** la Gate D est **fermée complètement** sur le périmètre Sprint 18 : composition, DS local, états nobles, responsive et documentation V1 honnête. Aucune promesse non tenue, aucun libellé de certification non adossé à un backend. Build vert, 0 lint.

**Statut de la maquette HTML :** la maquette reste une **north star figée de composition** ; elle n'a pas valeur de contrat backend. Toute reprise bloc par bloc est documentée dans la matrice d'adaptation (§3 T99 ci-dessous, source de vérité dans `REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md` §5.1).

**Non-régression visuelle :** la structure de lecture héritée S15–S17 reste **intacte** malgré la recomposition visuelle — bloc confiance en tête, KPI juste après, graphiques et Diva/preuve ensuite, documentation en fin.

---

## 2. Tickets livrés

| # | Titre | Statut |
|---|-------|--------|
| T99 | Composition Synthèse vs maquette (matrice d'adaptation + restructuration) | Livré |
| T100 | Design system V2 localisé Synthèse (cards, badges, typo, surfaces) | Livré |
| T101 | États métier + vides nobles (hiérarchie visuelle) | Livré |
| T102 | Responsive mature Synthèse (desktop / tablette / mobile) | Livré |
| T103 | Points d'attention + documentation / CODIR V1 | Livré |
| T104 | Clôture sprint, Gate D, non-régression, rapport | Livré (présent document) |

---

## 3. Détail par ticket

### T99 — Composition Synthèse vs maquette

**Matrice d'adaptation** (source de vérité dans `REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md` §5.1) :

| Bloc maquette | Décision S18 |
|---|---|
| Header | Repris — hiérarchie typo enrichie, badges contextuels honnêtes |
| Vue d'ensemble / chaîne de lecture | Repris (version sobre) — nouveau bandeau intro + chaîne drill |
| 4 KPI cards | Repris — glass cards sv2 + badges état uniformisés |
| Tendance 12 mois | Repris — chart existant reskinné sv2 |
| Répartition charges | Repris — donut + légende latérale |
| Diva | Repris — grille Diva+Preuve côte à côte (xl) |
| Preuve | Repris — carte structurée sv2 avec items inner |
| Points d'attention | Repris partiellement — V1 état vide noble (pas de backend dédié) |
| CODIR / documentation | Repris partiellement — V1 lien vers export DOCX existant |
| Nav bottom mobile | Reporté — hors S18 |
| Bloc confiance | Repris — conservé en tête (invariant §1.1) |

**Wordings filtrés** (plan §3.3) :
- « Vault certifié » → remplacé par badge « Source : Vault »
- « Base certifiée » → supprimé
- « Analyse contrôlée » → supprimé, badge « Diva » conservé
- « Certifié » (bloc preuve) → conservé S17 honnête (« Consolidé sur périmètre » / « Partiel »)

**Restructuration** du `return` dans `AccountingSummaryView.tsx` :
- Header S18 enrichi (label sv2 + h1 + badges contextuels)
- Vue d'ensemble avec chaîne de lecture
- Breadcrumb → BankReconciliationBlock → KPI → Charts → Diva+Preuve (grille xl) → Alerts+CODIR (grille xl)
- Le reste (BG/Rubriques/Aged) préservé en séquence

### T100 — Design system V2 localisé

**Fichier créé :** `app/synthese-v2.css` — 100% scopé sous `.synthese-scope`

Tokens locaux `--sv2-*` qui référencent les tokens globaux existants (jamais de remplacement) :

| Token | Référence |
|---|---|
| `--sv2-bg` | `var(--bg)` |
| `--sv2-surface` | `var(--surface)` |
| `--sv2-surface-2` | `var(--bg-secondary)` |
| `--sv2-border` | `var(--border)` |
| `--sv2-text` | `var(--text)` |
| `--sv2-text-muted` | `var(--text-secondary)` |
| `--sv2-accent` | `var(--accent)` |
| `--sv2-positive` / negative / warning | `var(--positive)` / etc. |

Classes :
- `.sv2-card` — glass-card (gradient + shadow + border accent subtil)
- `.sv2-card-highlight` — highlight top/left
- `.sv2-inner` — sous-bloc (mini-card, ligne preuve)
- `.sv2-label` — section label (11px, uppercase, tracking 0.2em)
- `.sv2-badge` + variants (`-ok`, `-partial`, `-unavailable`, `-accent`, `-danger`)
- `.sv2-btn` + `.sv2-btn-primary`
- `.sv2-empty` — état vide noble
- `.sv2-ref` — ligne de référence/source

**Import :** ajouté dans `layout.tsx` après `globals.css`

**Globals.css :** zéro modification.

### T101 — États métier + vides nobles

Tous les composants ont des états cohérents :

| Composant | Loading | Error | No data / Empty | Partial |
|---|---|---|---|---|
| BankReconciliationBlock | sv2-card skeleton | sv2-card + message | message périmètre | badge partial |
| AccountingSummaryKpiCards | sv2-card skeleton ×4 | — | null (masqué) | badge partial |
| TrendChart | sv2-card spinner | sv2-card + message | sv2-card + message | badge partial |
| BreakdownChart | sv2-card spinner | sv2-card + message | sv2-card + message | badge partial |
| AccountingInsightBlock | sv2-card spinner | sv2-card + retry | sv2-card + explication + retry | badge Diva |
| AccountingSummaryProofBlock | sv2-card skeleton | sv2-card + message | inline message | — |
| AccountingSummaryAlerts | — | — | **État vide noble** (icône + message + périmètre + explication future) | — |
| AccountingSummaryCodirBlock | — | — | sv2-inner + lien vers Diva | — |

**Conventions états vides nobles (plan §8.4) :**
- Icône SVG discrète (opacity 0.4)
- Message neutre indiquant l'absence (pas de « rien à signaler »)
- Périmètre rappelé (dates)
- Note explicative (quand le backend alimentera ce bloc)

### T102 — Responsive mature

| Breakpoint | Comportement |
|---|---|
| < 640px (mobile) | Cartes single column, KPI 2×2, rayon réduit, labels/badges plus compacts |
| 640–1023px (tablette) | Grilles 2 cols, padding intermédiaire |
| 1024–1279px (desktop) | Grilles charts 2 cols, Diva+Preuve côte à côte |
| ≥ 1280px (large) | Max-width 76rem, grilles complètes |

L'ordre de lecture est **préservé à tous les paliers** : confiance → KPI → graphiques → Diva/Preuve → Alerts/CODIR → Détail.

### T103 — Points d'attention + Documentation CODIR V1

Deux nouveaux composants :

- **`AccountingSummaryAlerts.tsx`** — Points d'attention V1. État vide noble (pas de backend dédié). Structure prête pour brancher un endpoint futur.
- **`AccountingSummaryCodirBlock.tsx`** — Bloc documentation / préparation CODIR V1. Lien vers l'export DOCX Diva existant. Pas de checkboxes « Inclure BG » (backend ne les gère pas).

### T104 — Clôture

- **Build :** ✓ `next build` réussi, 0 erreur, 0 warning
- **Lint :** 0 erreur sur les fichiers modifiés
- **Non-régression fonctionnelle :** tous les composants existants (BG, KPI, charts, Diva, Preuve, Rubriques, Aged) conservent leur logique métier et leurs données ; seul le rendu visuel évolue
- **Non-régression visuelle :** la structure de lecture héritée S15–S17 (confiance → KPI → graphiques → Diva/preuve → documentation) reste intacte malgré la recomposition ; l'ordre de parcours est identique à tous les breakpoints
- **Matrice d'adaptation :** source de vérité unique dans `REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md` §5.1

---

## 4. Fichiers modifiés / créés

### Créés
| Fichier | Rôle |
|---|---|
| `app/synthese-v2.css` | Design system V2 localisé (scopé `.synthese-scope`) |
| `components/AccountingSummaryAlerts.tsx` | Points d'attention V1 |
| `components/AccountingSummaryCodirBlock.tsx` | Documentation / CODIR V1 |

### Modifiés
| Fichier | Nature du changement |
|---|---|
| `app/layout.tsx` | Import `synthese-v2.css` |
| `components/AccountingSummaryView.tsx` | Wrapper `.synthese-scope`, recomposition header, vue d'ensemble, grille Diva+Preuve, section Alerts+CODIR |
| `components/AccountingSummaryKpiCards.tsx` | Classes sv2-card + badges uniformisés |
| `components/BankReconciliationBlock.tsx` | Classes sv2-card + inner, labels sv2-label |
| `components/AccountingSummaryProofBlock.tsx` | Classes sv2-card + inner + items structurés |
| `components/AccountingInsightBlock.tsx` | Classes sv2-card + grille mini-cards sources/horodatage/hash |
| `components/AccountingSummaryTrendChart.tsx` | Classes sv2-card, labels section, badge légende |
| `components/AccountingSummaryBreakdownChart.tsx` | Classes sv2-card, donut+légende latérale, items inner |

### Documentation
| Fichier | Version |
|---|---|
| `REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md` | §5.1 matrice d'adaptation remplie (11 blocs) |
| `RAPPORT_SPRINT_18_LYNKI.md` | v1.0 (présent document) |

---

## 5. Ce qui n'a PAS été fait (et pourquoi)

| Élément | Raison | Motivation produit |
|---|---|---|
| Nav bottom mobile | Hors périmètre S18 (navigation globale, plan §3.1 matrice #10) | Concerne la nav Lynki globale, pas la Synthèse |
| Onglets Pilotage/Synthèse | Déjà dans `DashboardWithFilters`, pas de refonte nav | Fonctionnel existant suffisant |
| Vocabulaire « certifié » | Interdit sans backend (plan §3.3) — remplacé par libellés honnêtes | **Pour rester cohérent avec la vérité backend** — aucune API ne certifie au sens comptable |
| Orbes décoratifs (blur-3xl) | Non repris — cosmétique pure | **Pour rester honnête** — l'habillage ne doit pas suggérer un niveau de finition que le produit n'a pas |
| Checkboxes CODIR | Backend ne gère pas encore la composition de rapport | **Pour rester honnête** — afficher des checkboxes non fonctionnelles serait mentir sur la capacité réelle |
| Tokens globaux | Aucune modification de `globals.css` (plan §3.1 T100) | Discipline de scope — le DS V2 ne fuit pas hors Synthèse |

---

## 6. Suite logique (Sprint 19 — indicative)

| Sujet | Description |
|---|---|
| Points d'attention V2 | Brancher un moteur de détection d'écarts sur le backend |
| CODIR V2 | Composition de rapport avec checkboxes (backend) |
| Nav bottom mobile | Barre de navigation contextuelle |
| DS V2 global | Étendre les tokens sv2 au-delà de la Synthèse si validé en MOA |

---

## 7. Historique des versions

| Version | Date | Changements |
|---|---|---|
| 1.1 | Mars 2026 | **Gel canonique** — 4 micro-ajustements MOA intégrés : Gate D phrase autonome dans §1, statut maquette explicité §1, colonne « Motivation produit » dans §5, non-régression visuelle dans §3 T104 |
| 1.0 | Mars 2026 | Rapport initial — Sprint 18 livré complet |
