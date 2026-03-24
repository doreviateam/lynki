# Backlog V1.4 — Lynki (axe 2 : profondeur pages détail)

*Tickets ciblés sur **l’axe 2** uniquement — pas de synthèse comptable (`/synthese` figée en V1.3) ni sparklines mobile (V1.2-6) sauf décision explicite.*
*Référence plan : [`PLAN_V1_4_LYNKI.md`](./PLAN_V1_4_LYNKI.md)*

**Ouverture** : 24 mars 2026  
**Règle** : pas de refonte, pas de tunnel, pas de faux détail ; gains **lisibles et tenus** uniquement.

---

## Convention de statut

| Statut | Signification |
|--------|--------------|
| `À faire` | Non démarré |
| `En cours` | En cours |
| `Fait` | DoD validé |
| `Abandonné` | Décision explicite |
| `Reporté` | Repoussé avec motif |

---

## Ordre d’exécution (figé)

1. **V1.4-1 — `/encours`** — le plus directement actionnable pour un RAF ; **premier ticket exécutable** après mini-recette `/synthese` + push `lynki-v1.3`.
2. **V1.4-2 — `/flux-net`** — lecture du mouvement réel, une fois la grammaire détail amorcée sur Encours.
3. **V1.4-3 — `/business`** — enrichissement quand la grammaire des pages détail est mieux posée.
4. **V1.4-4 — `/tresorerie`** — **alignement final** avec la grammaire V1.4 ; pas un point de départ (page souvent la plus mature — éviter d’y toucher avant d’avoir cadré le reste).

---

## Tableau de bord

| ID | Titre | Zone | Statut |
|----|-------|------|--------|
| V1.4-1 | Encours — risque, segmentation, exposition client | `/encours` | `Fait` · passe 1 (24/03/2026) |
| V1.4-2 | Flux net — dynamique encaissements / décaissements | `/flux-net` | `Fait` · passe 1 (24/03/2026) |
| V1.4-3 | Business — activité sans pseudo-P&L | `/business` | `Fait` · passe 1 (24/03/2026) |
| V1.4-4 | Harmonisation `/tresorerie` | `/tresorerie` | `À faire` |

---

## V1.4-1 — Encours (`/encours`) — **premier ticket exécutable**

### Intention produit

Faire de `/encours` une page qui aide à répondre rapidement à :

* **où** est le risque ;
* **chez qui** ;
* avec **quel niveau d’ancienneté** ;
* et **quelle lecture prioritaire** en tirer.

### Règles

* **Pas** de nouvelle promesse de recouvrement, **pas** de recommandation automatique.
* **Pas** de backend nouveau **si** les données déjà exposées (ou proxifiées) suffisent pour une **première vraie page** ; toute évolution API se fait **explicitement** et hors scope tacite.

### Séquence globale (release → axe 2)

1. Mini-recette **`/synthese`** puis **push** branche + tags (dont **`lynki-v1.3`**).
2. **Ouverture V1.4-1** — **sans re-cadrage documentaire supplémentaire** : ce ticket est déjà cadré ci-dessous.

### Premier mouvement sain (V1.4-1, avant code significatif)

1. **Audit** selon la grille **§ Audit V1.4-1** ci-dessous (point de départ code : `units/dorevia-linky/app/(cockpit)/encours/page.tsx` + **hooks, routes API et agrégats réellement consommés** par cette page).
2. **Trancher** la **première segmentation** affichable de façon honnête (équivalence métier ↔ champs disponibles).
3. **Implémenter** la première version lisible selon la **structure cible** et le **DoD** (pas de « smart » implicite).

### Audit V1.4-1 — grille (4 vérifications)

**Point de départ** : `app/(cockpit)/encours/page.tsx` et tout ce qu’elle tire (fetch clients, hooks, `/api/*`, types de réponse).

1. **Surface actuelle** — ce que la page affiche **réellement** ; ce qui reste **shell**, **placeholder** ou **fallback** non qualifié.
2. **Données tenues** — KPI principal **oui/non** ; détail **par client** **oui/non** ; **échéances / ancienneté** réellement présentes **oui/non** ; **trous de périmètre** (période, société, source) documentés.
3. **Segmentation honnête possible** — ex. à échoir / échu / critique **si** la donnée le porte ; sinon **version plus sobre** explicitement motivée par l’audit.
4. **Écart à la structure cible** — header, KPI, segmentation, exposition par client, états homogènes : **déjà là / partiel / absent**.

**Livrable d’audit** : répondre à **une seule question** —

> **Quelle est la première version crédible de `/encours` qu’on peut livrer sans faux signal ni backend implicite ?**

*(La réponse peut tenir en quelques paragraphes + liste de champs / écrans ; pas de rapport lourd.)*

**Livrable réalisé** : [`AUDIT_V1_4_1_ENCOURS.md`](./AUDIT_V1_4_1_ENCOURS.md).

### Structure cible

* en-tête de page ;
* bloc **indicateur principal** ;
* bloc **répartition / statut** des créances (segmentation lisible : à échoir / échu / critique, ou **équivalent strictement aligné sur la donnée tenue**) ;
* bloc **exposition par client** avec **échéances visibles** ;
* états **vide / partiel / indisponible** homogènes (réutiliser la grammaire V1.3 si pertinent).

### DoD

- [x] indicateur principal **clair** ;
- [x] segmentation lisible du portefeuille (libellés honnêtes si agrégation partielle) ;
- [x] exposition **par client** avec échéances visibles lorsque la donnée le permet *(p.1 : pas d’échéance facture dans le flux ; colonne **Retard** (j) si `overdue_*_days` présents ; texte explicite sinon)* ;
- [x] **aucun** CTA ou lien sans action réelle *(bouton Réessayer → `handleRefreshMetrics`)* ;
- [x] **périmètre explicite** (période, société, source / limites) ;
- [x] **fallback propre** si une sous-partie manque (pas de silence trompeur) *(loading / erreur réseau / vide / partiel via `cockpitEncoursStates`)* ;
- [x] typecheck / lint OK sur les fichiers impactés.

**Journal passe 1** : `units/dorevia-linky/app/(cockpit)/encours/page.tsx` (périmètre, `metricsError`, états, blocs Ouvert/Échu, alertes `missing_due_date` + `meta.warnings`) ; `units/dorevia-linky/components/cockpit-detail/cockpitEncoursStates.tsx` ; élargissement typage `ArByPartnerDetail` dans `app/api/dashboard-metrics/route.ts` (champs retard optionnels).

### Clôture passe 1 (produit)

**V1.4-1 est livrée en première passe crédible** : périmètre, erreur réseau, états homogènes et segmentation honnête (Ouvert / Échu) sont en place **sans nouveau backend**. La page est **exploitable** pour une lecture RAF encours / exposition ; les enrichissements éventuels relèvent d’une **passe ultérieure non bloquante** et ne conditionnent pas l’ouverture de **V1.4-2**.

**Suites possibles (non bloquantes)** : bouton **Actualiser** aligné sur `/tresorerie` ; microcopy source ERP/Vault ; colonnes supplémentaires **uniquement** si l’API les porte mieux plus tard.

**Prochain ticket recommandé** : **V1.4-2 — `/flux-net`** (dynamique de mouvement, après le risque client sur `/encours`).

**Recette** : courte passe visuelle sur `/encours` ; si rien ne choque, en rester à cette clôture et enchaîner V1.4-2.

---

## V1.4-2 — Flux net (`/flux-net`)

**Objectif** : rendre la page lisible comme **lecture de dynamique** (pilotage), pas comme simple reprise d’un KPI — **sans** équivalence implicite avec un **tableau de flux comptable complet**.

**Audit (cadrage exécutable)** : [`AUDIT_V1_4_2_FLUX_NET.md`](./AUDIT_V1_4_2_FLUX_NET.md).

### Règles produit (verrou)

* Ne pas laisser croire à un **cash-flow comptable exhaustif** si le périmètre est **agrégé scellé / proxy** côté API.
* Distinguer **lecture de pilotage** (encaissements − décaissements sur le périmètre servi) et **vérité comptable globale** si pertinent.
* Ne pas surinterpréter le **KPI agrégé** ; expliciter si **`cash.value`** (tuile) peut **différer** du **`net`** du bloc détail (normalisation devise / complétude — voir audit §2).
* **Pas** de backend nouveau **implicite** ; graphique / série temporelle = **hors passe 1** sauf décision explicite.

### Structure cible — passe 1

1. Fil d’Ariane + **titre** « Flux net » (ou équivalent).
2. **Phrase source / limites** (même endpoint que la synthèse, détail si renvoyé).
3. **Ligne de périmètre** : période, société, tenant.
4. Bloc **`metricsError`** + réessai (`handleRefreshMetrics`).
5. **Skeleton** au chargement (grammaire cockpit, comme Encours).
6. **KPI principal** : flux net (`dashboardMetrics.cash`).
7. **Deux cartes** : **Encaissements** / **Décaissements** (données `_details.cash` si présentes).
8. Bloc **lecture / limites** (proxy, périmètre scellé, mode partiel si pas de `_details` ou metric engine sans détail).
9. Pas de **graphique imposé** si la donnée ne l’exige pas.

### DoD

- [x] lecture **distincte** encaissements / décaissements (ou état **partiel** honnête si absent) ;
- [x] **période** (et société / tenant) **clairement affichées** ;
- [x] **erreur réseau** explicite (`metricsError`) + action de réessai ;
- [x] **états homogènes** : chargement / vide / partiel / indisponible ;
- [x] mention **explicite** si la lecture reste **proxy** ou **partielle** (vocabulaire non trompeur) ;
- [x] **aucune** promesse de précision non tenue *(bannière si écart KPI `cash.value` vs `_details.cash.net` supérieur à 0,5 € ; mode instruments sans `_details`)* ;
- [x] structure **stable** même si certaines sous-données manquent ;
- [x] typecheck / lint OK.

**Livrable audit** : [`AUDIT_V1_4_2_FLUX_NET.md`](./AUDIT_V1_4_2_FLUX_NET.md).

**Journal passe 1** : `units/dorevia-linky/app/(cockpit)/flux-net/page.tsx` ; `units/dorevia-linky/components/cockpit-detail/cockpitFluxNetStates.tsx`.

### Clôture passe 1 (produit)

**V1.4-2 est livrée en première passe crédible** : périmètre, erreur réseau, états homogènes, KPI flux net + cartes encaissements / décaissements, bloc « contrôle lecture » (net détail), honnêteté sur **instruments sans `_details`** et sur **écart KPI vs net**, rappel **non-IFRS** — **sans nouveau backend**. Suites possibles non bloquantes : graphique d’évolution, bouton Actualiser aligné `/tresorerie`.

**Enchaînement axe 2** : **V1.4-3 — `/business`** (voir ci-dessous), puis **V1.4-4 — `/tresorerie`**.

---

## V1.4-3 — Business (`/business`)

**Objectif** : lecture **activité + exposition**, sans pseudo-P&L.

### DoD

- [x] **CA facturé** lisible ;
- [x] décomposition **ventes / achats** **si** tenue par les données ;
- [x] **top clients** ou **concentration** **si** tenue ;
- [x] rappel de l’**exposition AR** si pertinent et non redondant de façon trompeuse avec `/encours` ;
- [x] **pas** de synthèse trop ambitieuse (titre / sous-textes calibrés) ;
- [x] typecheck / lint OK.

**Journal passe 1** : `units/dorevia-linky/app/(cockpit)/business/page.tsx` ; `units/dorevia-linky/components/cockpit-detail/cockpitBusinessStates.tsx`.

**V1.4-3 est livrée en première passe crédible** : périmètre (période, société, tenant), erreur réseau + réessai, squelettes de chargement, bannières partielles (Metric Engine sans `_details`, KPI sans décomposition), CA facturé + bloc ventes/achats HT avec libellé **non P&L** sur le solde, concentration clients si `sales_by_partner`, aperçu AR avec renvoi explicite vers **`/encours`** — **sans nouveau backend**. Suites possibles non bloquantes : bouton Actualiser aligné `/tresorerie`, harmonisation fil d’Ariane sur les autres pages détail.

**Prochain ticket naturel** : **V1.4-4 — `/tresorerie`** (harmonisation grammaire V1.4).

---

## V1.4-4 — Harmonisation `/tresorerie`

**Objectif** : aligner la page **existante** avec la **grammaire V1.4** des autres détails.

### DoD

- [ ] header, périmètre, états et vocabulaire **alignés** avec le reste de l’axe 2 ;
- [ ] **aucune régression** sur la page la plus mature (régression visuelle / fonctionnelle / perf à vérifier) ;
- [ ] harmonisation **sans refonte** (pas de redesign large) ;
- [ ] typecheck / lint OK.

---

## Journal de clôture

| ID / jalons | Date | Notes |
|-------------|------|-------|
| Audit V1.4-1 | 24 mars 2026 | [`AUDIT_V1_4_1_ENCOURS.md`](./AUDIT_V1_4_1_ENCOURS.md) — surface, données, segmentation, écarts, verdict. |
| *—* | *—* | *À compléter au fil des livraisons.* |

---

*Backlog V1.4 Lynki — axe 2 — ordre : Encours → Flux net → Business → Trésorerie.*
