# Plan V1.3 — Lynki (mini-cadrage)

*Ouverture courte du chantier **Lynki V1.3** après clôture sérieuse de **V1.2** (`lynki-v1.2`) et prolongation **V1.2.1** (`lynki-v1.2.1`). Ce document ne lance pas une refonte : il **choisit le prochain gain métier réel** et un **axe prioritaire unique**.*

**Ouverture** : 24 mars 2026

**Références** : [`PLAN_V1_2_LYNKI.md`](./PLAN_V1_2_LYNKI.md) · [`BACKLOG_V1_2_LYNKI.md`](./BACKLOG_V1_2_LYNKI.md) · [`RELEASE_NOTE_LYNKI_V1_2_1.md`](./RELEASE_NOTE_LYNKI_V1_2_1.md) · [`BACKLOG_V1_3_LYNKI.md`](./BACKLOG_V1_3_LYNKI.md) · [`RELEASE_NOTE_LYNKI_V1_3.md`](./RELEASE_NOTE_LYNKI_V1_3.md) · tag **`lynki-v1.3`** · suite axe 2 : [`PLAN_V1_4_LYNKI.md`](./PLAN_V1_4_LYNKI.md)

---

## 1. Objet du document

Définir **une intention V1.3** et **un seul axe prioritaire** pour la suite du produit, sans rouvrir V1.2 ni traiter **V1.2-6** (sparklines mobile) par inertie.

**Règle** : V1.2 est **figée** ; V1.2-6 reste un **bonus isolé** reportable à tout moment dans V1.3 ou hors release si besoin.

---

## 2. Point de départ

* **V1.2** : clôturée — jalon `lynki-v1.2` (milestone fonctionnelle : navigation desktop, alertes, projection J+30 honnête, canon 12 tuiles).
* **V1.2.1** : cohérence produit — `lynki-v1.2.1` (suppression export PDF fantôme sur `/synthese`, V1.2-5).
* **V1.2-6** : **non engagé** dans ce cadrage — polish mobile / sparklines, faible levier métier par rapport à un palier de lecture financière.

---

## 3. Trois axes candidats et arbitrage recommandé

| Axe | Intitulé | Levier |
|-----|----------|--------|
| **1** | **Synthèse comptable / reporting** | Différenciation, usage Esther / Véréna, promesse « lecture financière sérieuse » |
| **2** | Profondeur métier de certaines pages détail | Compléter `/business`, `/flux-net`, `/encours`, `/tresorerie` au-delà des shells |
| **3** | Polish mobile | Sparklines et densité Max — **rebascule naturelle de V1.2-6** |

**Arbitrage recommandé (à valider en équipe)** : **Axe 1** en priorité V1.3.

> La suite la plus intelligente n’est pas d’ajouter un effet visuel mobile supplémentaire, mais d’ouvrir le prochain palier métier **lisible et crédible** de Lynki.

**Critère de choix d’axe** : l’axe V1.3 retenu devra être celui qui améliore le plus la **lecture financière utile**, avec le **moins de dette** visuelle, métier ou technique.

---

## 4. Périmètre V1.3 (brouillon — à affiner en backlog)

Tant que l’axe 1 est retenu, V1.3 vise typiquement :

* enrichir **`/synthese`** et les **blocs comptables** (rubriques, balances, preuves, exports déjà présents) avec des **lectures ou restitutions** plus utiles pour comité / RAF, **sans transformer `/synthese` en rapport lourd ni en écran comptable exhaustif** ;
* **sans** refonte du shell Lynki ni du design system ;
* **sans** promesses non tenues (même discipline que V1.2-3 / V1.2-5).

**Hors périmètre par défaut** : refonte navigation globale, nouveau moteur d’alertes backend, sparklines mobile **sauf** décision explicite de reprioriser l’axe 3.

---

## 5. Suite immédiate

1. **Valider** l’axe prioritaire (idéalement **Axe 1**) en une réunion courte ou arbitrage écrit.
2. **Exécuter** le backlog : [`BACKLOG_V1_3_LYNKI.md`](./BACKLOG_V1_3_LYNKI.md) — **5 mini-tickets** sur l’axe 1 uniquement ; **ordre de build** : V1.3-1 → V1.3-2 → V1.3-3 → V1.3-5, puis **V1.3-4 seulement si** verdict post-audit et post-V1.3-3 (détail et audit figés dans le backlog). *État au 24 mars 2026 : axe 1 substantiellement livré ; V1.3-4 **non retenu** (abandonné pour cette séquence) après micro-arbitrage produit.*
3. **Ne pas** modifier les tags `lynki-v1.2` / `lynki-v1.2.1` ; le tag **`lynki-v1.3`** est posé **à la clôture** de l’axe 1 — voir [`RELEASE_NOTE_LYNKI_V1_3.md`](./RELEASE_NOTE_LYNKI_V1_3.md).

---

*Mini-cadrage V1.3 — backlog axe 1 : [`BACKLOG_V1_3_LYNKI.md`](./BACKLOG_V1_3_LYNKI.md).*
