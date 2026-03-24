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
| V1.4-1 | Encours — risque, segmentation, exposition client | `/encours` | `À faire` |
| V1.4-2 | Flux net — dynamique encaissements / décaissements | `/flux-net` | `À faire` |
| V1.4-3 | Business — activité sans pseudo-P&L | `/business` | `À faire` |
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

### Structure cible

* en-tête de page ;
* bloc **indicateur principal** ;
* bloc **répartition / statut** des créances (segmentation lisible : à échoir / échu / critique, ou **équivalent strictement aligné sur la donnée tenue**) ;
* bloc **exposition par client** avec **échéances visibles** ;
* états **vide / partiel / indisponible** homogènes (réutiliser la grammaire V1.3 si pertinent).

### DoD

- [ ] indicateur principal **clair** ;
- [ ] segmentation lisible du portefeuille (libellés honnêtes si agrégation partielle) ;
- [ ] exposition **par client** avec échéances visibles lorsque la donnée le permet ;
- [ ] **aucun** CTA ou lien sans action réelle ;
- [ ] **périmètre explicite** (période, société, source / limites) ;
- [ ] **fallback propre** si une sous-partie manque (pas de silence trompeur) ;
- [ ] typecheck / lint OK sur les fichiers impactés.

---

## V1.4-2 — Flux net (`/flux-net`)

**Objectif** : rendre la page lisible comme **lecture de dynamique**, pas comme simple reprise d’un KPI.

### DoD

- [ ] lecture **distincte** encaissements / décaissements ;
- [ ] **période** clairement affichée ;
- [ ] mention **explicite** si la lecture reste **proxy** ou **partielle** ;
- [ ] structure **stable** même si certaines sous-données manquent ;
- [ ] **aucun** vocabulaire suggérant une précision non tenue ;
- [ ] typecheck / lint OK.

---

## V1.4-3 — Business (`/business`)

**Objectif** : lecture **activité + exposition**, sans pseudo-P&L.

### DoD

- [ ] **CA facturé** lisible ;
- [ ] décomposition **ventes / achats** **si** tenue par les données ;
- [ ] **top clients** ou **concentration** **si** tenue ;
- [ ] rappel de l’**exposition AR** si pertinent et non redondant de façon trompeuse avec `/encours` ;
- [ ] **pas** de synthèse trop ambitieuse (titre / sous-textes calibrés) ;
- [ ] typecheck / lint OK.

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
| *—* | *—* | *À compléter au fil des livraisons.* |

---

*Backlog V1.4 Lynki — axe 2 — ordre : Encours → Flux net → Business → Trésorerie.*
