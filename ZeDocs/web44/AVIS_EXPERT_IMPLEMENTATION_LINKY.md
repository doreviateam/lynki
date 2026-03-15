# Avis d'expert — Implémentation Linky (mars 2026)

**Document d'évaluation technique et produit**

Date : 13 mars 2026  
Périmètre : Implémentation (visuel, Pareto ABC) + Spécifications (cockpit, instruments, métriques, moteur)

---

## 1. Synthèse

L'ensemble réalisé couvre **deux dimensions** :

| Dimension | Contenu | Statut |
|-----------|---------|--------|
| **Implémentation** | Transformation visuelle (style Fygr), onglets Pareto A/B/C, déploiement o19/laplatine2026 | ✓ Livré |
| **Spécifications** | Cockpit Instruments, Instrument Model, Metric Registry, Metric Engine, diagramme architecture | ✓ Livré |

Le projet est passé d'un **dashboard** à un **système d'observation financière structuré** : Vault = truth layer, Metric Engine = semantic layer, Cockpit = governance UI. Architecture **ERP-agnostic** et **audit-friendly**.

---

## 2. Implémentation — Transformation visuelle (SPEC_LINKY_VISUEL_FYGR)

### 2.1 Points forts

| Aspect | Évaluation |
|--------|------------|
| **Design System** | Palette cockpit dark bien définie (`--bg`, `--surface`, `--hover`). Tokens centralisés, réutilisables. |
| **Typographie** | IBM Plex Sans en priorité, `tabular-nums` sur les montants — aligné aux bonnes pratiques fintech. |
| **Hiérarchie** | Valeurs KPI en `text-base font-bold`, labels en `text-xs uppercase` — lecture rapide respectée. |
| **Non-régression** | Aucune perte de bloc, filtre ou action. Contrainte respectée. |
| **Accessibilité** | `focus-visible`, `aria-label`, contrastes conformes. |

### 2.2 Écart par rapport à la spec

- **Grille 12 instruments** : La spec Cockpit Instruments prévoit 12 tuiles. L'implémentation actuelle en affiche **8**. Manquent : **BFR**, **Encours** (instrument distinct), **EBE**.
- **Disposition** : Grille responsive 2/3/4 colonnes — adaptée au responsive, disposition fixe 4×3 non appliquée sur desktop.

### 2.3 Recommandation

Transformation visuelle **solide et exploitable**. Prioriser l'ajout des instruments manquants (BFR, Encours dédié, EBE).

---

## 3. Implémentation — Pareto ABC (carte Business)

### 3.1 Points forts

- **Partition sémantique** : Classes A (≤80 % cumul), B (80–95 %), C (>95 %) — logique ABC standard.
- **UX** : Onglets clairs, compteurs par classe, message explicite si une classe est vide.
- **Accessibilité** : `role="tablist"`, `aria-selected`, `aria-controls`.
- **Cohérence** : Mise en évidence Pareto 80 conservée dans chaque onglet.

### 3.2 Limite

Partition **front-end uniquement** : calcul ABC côté client. Pour de gros volumes, une agrégation côté Vault ou API serait préférable — acceptable pour l'état actuel.

### 3.3 Recommandation

Conserver l'implémentation. Documenter la règle ABC (seuils 80 % / 95 %) dans la spec ou un glossaire.

---

## 4. Spécifications — Couche sémantique

### 4.1 Documents livrés

| Document | Version | Rôle |
|----------|---------|------|
| `SPEC_LINKY_COCKPIT_INSTRUMENTS_v1.0.md` | 1.0 | Instruments, grille 4×3, architecture Vault-centric |
| `SPEC_LINKY_INSTRUMENT_MODEL_v1.0.md` | 1.1 | Modèle structurel (metric, aggregation, time_window, source_events), mapping implémentation |
| `SPEC_LINKY_METRIC_REGISTRY_v1.0.md` | 1.1 | Registre des 12 métriques (metric_class, metric_type, calculation_scope) |
| `SPEC_LINKY_METRIC_ENGINE_v1.0.md` | 1.1 | Moteur d'exécution (DAG, cache, API, observabilité) |
| `DIAGRAMME_ARCHITECTURE_LINKY_v1.0.md` | 1.0 | Vue d'ensemble ERP → DVIG → Vault → Base Metrics → Derived → Instruments → Cockpit |

### 4.2 Points forts

| Aspect | Évaluation |
|--------|------------|
| **Architecture** | DAG base → derived, aligné dbt/cube.js. Twist : données probantes (Vault). |
| **Extensibilité** | Nouvelle métrique = entrée dans le Registry. Pas de déploiement front pour une nouvelle métrique. |
| **Auditabilité** | Chaîne traçable : événements Vault → métriques → instruments. |
| **Implémentabilité** | Specs Metric Engine (graph compilation, cycle detection, cache par nœud, invalidation granulaire, data_freshness, status, observabilité) prêtes pour le développement. |

### 4.3 Écart : Metric Engine non implémenté

L'implémentation actuelle utilise `dashboard-metrics` (agrégation ad hoc). Le Metric Engine (DAG, cache, API `/instruments`) est **spécifié mais non implémenté**.

**Stratégie de migration** (SPEC Metric Engine §9) : Phase 1 = Engine en parallèle, Phase 2 = cockpit consomme `/instruments`, Phase 3 = dépréciation `dashboard-metrics`.

---

## 5. Alignement implémentation ↔ specs

### 5.1 Mapping spec ↔ code (Instrument Model §6)

| instrument_id | Composant Linky | Statut |
|---------------|-----------------|--------|
| treasury | TresoreriePositionCard, TreasuryCard | ✓ |
| business | BusinessCard | ✓ |
| cash_flow | FluxCashCard | ✓ |
| working_capital | — | À venir |
| payments | Intégré TreasuryCard | ✓ |
| receivables | ArByPartner (BusinessCard) | ✓ |
| taxes | TaxesCard | ✓ |
| pos_activity | PosShopsView | ✓ |
| credit_notes | CreditNotesCard | ✓ |
| refunds | RefundsCard | ✓ |
| pos_closure | PosComingSoonView (Z caisse) | En cours |
| ebitda | — | À venir |

### 5.2 Architecture des données

- **Spec** : Linky ne lit que le Vault. ERP/POS = émetteurs d'événements.
- **Implémentation** : `dashboard-metrics` agrège Vault + DVIG. Aligné.

---

## 6. Qualité technique

### 6.1 Code

- **Structure** : Composants React bien découpés, props typées.
- **CSS** : Variables CSS, Tailwind cohérent.
- **État** : Flux de données lisible.

### 6.2 Déploiement

- Build Docker reproductible.
- Déploiement o19 et laplatine2026 opérationnel.
- Image `cockpit-2026-03-13` taguée.

### 6.3 Dette technique

- **Tests** : Pas de tests automatisés pour Pareto ABC, IconGrid. Recommandation : tests unitaires ou visuels.
- **Constantes** : `STATUS_COLORS` et `STATUS_BG` dans IconGrid → extraire vers module partagé ou tokens CSS.
- **SPEC_DVIG_EVENT_REGISTRY** : À créer pour aligner la nomenclature des événements.

---

## 7. Conclusion et priorités

### 7.1 Bilan

| Critère | Évaluation |
|---------|------------|
| Implémentation | ⭐⭐⭐⭐ — Qualité professionnelle, exploitable en prod |
| Spécifications | ⭐⭐⭐⭐⭐ — Architecture fintech complète, semantic layer défini |
| Cohérence | ⭐⭐⭐⭐ — Alignement Vault-centric, mapping documenté |

---

### 7.2 Priorités recommandées

| Priorité | Action | Effort estimé |
|----------|--------|---------------|
| **P1** | Compléter la grille vers 12 instruments (BFR, Encours, EBE) | Moyen |
| **P2** | Implémenter le Metric Engine (spec v1.1) | Élevé |
| **P3** | Créer SPEC_DVIG_EVENT_REGISTRY (nomenclature événements) | Faible |
| **P4** | Tests automatisés (Pareto ABC, grille KPI) | Moyen |
| **P5** | Migration cockpit : `dashboard-metrics` → `GET /api/instruments` | Moyen |

### 7.3 Verdict

> **Recommandation : valider pour mise en production** sur o19 et laplatine2026.  
> L'implémentation + les specs constituent une **base solide** pour une architecture fintech ERP-agnostic. Prioriser P1 (instruments manquants) et P3 (Event Registry) avant P2 (Metric Engine) pour une montée en charge progressive.

---

## 8. Références

| Document | Rôle |
|----------|------|
| `SPEC_LINKY_VISUEL_FYGR_v1.0.md` | Transformation visuelle |
| `SPEC_LINKY_COCKPIT_INSTRUMENTS_v1.0.md` | Instruments, architecture |
| `SPEC_LINKY_INSTRUMENT_MODEL_v1.0.md` | Modèle structurel des instruments |
| `SPEC_LINKY_METRIC_REGISTRY_v1.0.md` | Registre des métriques |
| `SPEC_LINKY_METRIC_ENGINE_v1.0.md` | Moteur d'exécution |
| `DIAGRAMME_ARCHITECTURE_LINKY_v1.0.md` | Vue d'ensemble |
| `RAPPORT_TECHNIQUE_IMPLEMENTATION_LINKY_FYGR.md` | Détail technique implémentation |

---

*Document rédigé à des fins d'évaluation technique et de pilotage produit. À partager avec l'équipe tech et la MOA.*
