# Rapport de cohérence — Specs Linky

**Date :** 15 février 2026  
**Objectif :** Vérifier l’alignement entre specs, implémentation et docs de synthèse

---

## 1. Synthèse

| Zone | Statut | Détail |
|------|--------|--------|
| **Logo** | ✅ Cohérent | BRAND_LOCK, RAPPORT_ENSEMBLE, CHANGELOG alignés |
| **Typographie** | ✅ Cohérent | SPEC_TYPOGRAPHY, layout, globals.css |
| **SPEC_CARD §1 (logo)** | ❌ Incohérent | Phrase obsolète « dégradé, lueur » |
| **SPEC_CARD §3.3 (Mode)** | ⚠️ À harmoniser | Libellé « % » vs « Répartition % » |
| **SPEC_DECOUPAGE vs Impl** | ⚠️ Écarts | Fonctionnalités v1.1 non implémentées |
| **Granularité (1 option)** | ⚠️ Écart | Spec : désactivé ; Impl : masqué |
| **DIRECTION_ARTISTIQUE** | ⚠️ Écart typo | Poids 800 vs SPEC_TYPOGRAPHY (max 700) |

---

## 2. Détail des écarts

### 2.1 SPEC_LINKY_CARD_BUSINESS_GRAPHIQUE — Phrase obsolète §1

**Ligne 12 :**
> Le logo « Dorevia Linky » en header permet le retour à l'accueil et dispose **d'effets visuels (dégradé, lueur)**.

**Problème :** BRAND_LOCK v1.0 interdit dégradé et glow. L’implémentation v1.56+ est conforme (brightness 1.04 uniquement).

**Action :** Remplacer par :  
« Le logo permet le retour à l'accueil (hover : brightness 1.04, BRAND_LOCK v1.0). »

---

### 2.2 Libellé Mode : % vs Répartition %

| Document | Valeur |
|----------|--------|
| SPEC_LINKY_DECOUPAGE v1.1 | « Répartition % » |
| SPEC_LINKY_CARD_BUSINESS §3.3 | « % » |
| Implémentation CardChartSection | « % » |

**Action :** Harmoniser sur « Répartition % » (spec découpage v1.1) ou documenter une exception si on conserve « % » pour compacité.

---

### 2.3 Bloc Granularité — 1 seule option

| Spec | Comportement |
|------|--------------|
| SPEC_DECOUPAGE v1.1 §3.2 | « Bloc désactivé (non masqué) » |
| Implémentation | `availableGranularities.length > 1` → bloc **masqué** |

**Action :** Soit modifier l’impl pour afficher le bloc désactivé (option grisée), soit mettre à jour la spec pour « masqué ».

---

### 2.4 Pédagogie SPEC_DECOUPAGE v1.1 — Non implémentée

| Élément | Spec | Impl |
|---------|------|------|
| Tooltips contextuels Type | « Compare les volumes par période », etc. | title = CHART_TYPE_LABELS (Barres, Courbe, Camembert) |
| Tooltips Granularité | « Définit la taille des pas de temps. » | Absent |
| Ligne de résumé | « Lecture : volumes mensuels en € » | Absente |
| Toast first-time Répartition % | localStorage + toast | Absent |
| Bouton « Pourquoi ? » | Popover période/tenant/source | Absent |

**Action :** Planifier l’implémentation ou noter « backlog » dans la spec.

---

### 2.5 DIRECTION_ARTISTIQUE vs SPEC_TYPOGRAPHY

| Élément | DIRECTION_ARTISTIQUE | SPEC_TYPOGRAPHY |
|---------|----------------------|-----------------|
| Titre écran | 800 | Max 700 |
| Titre carte | 800 | Max 700 |

**Problème :** SPEC_TYPOGRAPHY interdit 800+.

**Action :** Aligner DIRECTION_ARTISTIQUE sur 700 (font-bold) pour les titres.

---

## 3. Ce qui est cohérent

- **Logo** : BRAND_LOCK, RAPPORT_ENSEMBLE, CHANGELOG, implémentation alignés (DOREVIA+Linky+tagline, brightness 1.04).
- **Typographie** : Inter, tabular-nums, poids 400–700 appliqués.
- **Couleurs graphiques** : Vert/orange (--positive, --warning) pour les séries, conforme aux specs.
- **Structure découpage** : Type → Granularité → Mode, ordre correct dans l’UI.
- **RAPPORT_ENSEMBLE** : Référence correctement les specs à jour.

---

## 4. Recommandations

| Priorité | Action | État |
|----------|--------|------|
| **P0** | Corriger SPEC_CARD §1 (supprimer « dégradé, lueur ») | ✓ Appliquée |
| **P1** | Harmoniser libellé Mode : « Répartition % » partout | ✓ Appliquée (CardChartSection) |
| **P1** | Aligner DIRECTION_ARTISTIQUE (800 → 700) | ✓ Appliquée |
| **P2** | Bloc Granularité désactivé si 1 option | ✓ Appliquée |
| **P1** | Ligne résumé dynamique | ✓ Implémentée |
| **P1** | Bouton « Pourquoi ? » avec popover | ✓ Implémentée (whyContent sur Cash) |
| **P3** | Tooltips enrichis, toast first-time | Backlog |

---

**Fin du rapport**
