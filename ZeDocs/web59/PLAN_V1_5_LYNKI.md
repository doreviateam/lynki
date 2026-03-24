# Plan V1.5 — Lynki (convergence créa & consolidation visuelle)

*Ouverture du chantier **Lynki V1.5** après **gel** de **V1.4** (axe 2 pages détail) — tag **`lynki-v1.4`**, image lab de référence **`lynki-v1.4-20260324-r13`**. **Changement de nature** : on ne rouvre pas V1.4 ; on vise à **rapprocher l’implémentation de la créa cible** et à **renforcer cohérence visuelle, qualité d’usage et lisibilité produit**.*

**Ouverture** : 24 mars 2026

**Références** : [`RELEASE_NOTE_LYNKI_V1_4.md`](./RELEASE_NOTE_LYNKI_V1_4.md) · [`PLAN_V1_4_LYNKI.md`](./PLAN_V1_4_LYNKI.md) · [`BACKLOG_V1_4_LYNKI.md`](./BACKLOG_V1_4_LYNKI.md)

---

## 1. Intention officielle

> **V1.5 vise à rapprocher l’implémentation Lynki de la créa cible, en renforçant la cohérence visuelle, la qualité d’usage et la lisibilité produit.**

**Référence haute** : la créa portée par Carole sert de cible pour réduire l’écart avec ce que Lynki affiche déjà, sans surpromesse ni refonte globale implicite.

---

## 2. Positionnement du cycle

| Formulation | Statut |
|-------------|--------|
| **Consolidation visuelle et convergence produit** | **Choix retenu pour V1.5** |
| **Axe 3 / qualité d’usage transverse** | Peut être embarqué partiellement dans V1.5 selon arbitrage |
| **Découplage cockpit / socle ERP** | Hors périmètre par défaut ; à traiter comme chantier distinct sauf décision explicite |

---

## 3. Règles de conduite

- **Ne pas rouvrir V1.4** : jalon figé, documenté, tagué.
- **Pas de faux “petit ticket V1.4”** : tout nouveau travail relève de **V1.5** ou d’un autre cycle nommé.
- **Ligne de base exécutable** : image lab **`lynki-v1.4-20260324-r13`**.
- **Stinger** : aligner ou assumer l’écart par écrit, sans zone grise prolongée.

---

## 4. Non-objectifs

- Pas de refonte globale implicite de Lynki.
- Pas de nouveau backend implicite dans V1.5, sauf décision formelle.
- Pas de mélange avec les chantiers ERP / Odoo historiques.
- Pas de backlog flou constitué de “polish” non priorisés.

---

## 5. Périmètre de travail

V1.5 couvre prioritairement les écarts les plus visibles entre la créa cible et l’implémentation actuelle sur les écrans structurants de Lynki, notamment :

- cockpit / pilotage ;
- pages détail ;
- écrans transverses de synthèse si retenus au backlog.

Le backlog V1.5 devra nommer explicitement les écarts créa ↔ produit, les ordonner, et les découper en lots livrables courts.

---

## 6. Critère de succès du cycle

V1.5 sera considéré comme réussi si :

- les écarts visuels majeurs avec la créa cible sont réduits sur les écrans prioritaires ;
- la cohérence de grammaire produit est renforcée entre cockpit, détail et synthèse ;
- la qualité d’usage progresse sans régression sur les acquis V1.4 ;
- le chantier reste lisible, borné et sans glissement vers une refonte implicite.

---

## 7. Suite immédiate

1. **Git** : push branche, push tag **`lynki-v1.4`**, merge selon le process du dépôt.
2. **Stinger** : décision explicite (alignement image ou écart documenté).
3. **Backlog V1.5** : ouverture de **`BACKLOG_V1_5_LYNKI.md`** avec :
   - inventaire ciblé des écarts majeurs ;
   - arbitrage produit / créa ;
   - ordre de traitement ;
   - premier lot livrable.

---

*Plan Lynki V1.5 — convergence créa & consolidation visuelle — **cadrage publié** le 24 mars 2026 ; **backlog détaillé** (`BACKLOG_V1_5_LYNKI.md`) **à compléter**.*
