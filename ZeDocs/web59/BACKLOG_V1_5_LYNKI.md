# Backlog V1.5 — Lynki (convergence créa & consolidation visuelle)

*Tickets ciblés sur le **cycle V1.5** : rapprochement **créa cible ↔ implémentation**, cohérence visuelle, qualité d’usage et lisibilité produit — **sans** refonte globale implicite, **sans** backend nouveau sauf décision formelle, **sans** mélange avec chantiers ERP / Odoo historiques (voir [`PLAN_V1_5_LYNKI.md`](./PLAN_V1_5_LYNKI.md)).*

**Référence plan (cadrage publié)** : [`PLAN_V1_5_LYNKI.md`](./PLAN_V1_5_LYNKI.md) · **Jalon précédent** : tag **`lynki-v1.4`** · [`RELEASE_NOTE_LYNKI_V1_4.md`](./RELEASE_NOTE_LYNKI_V1_4.md)

**Ouverture (squelette)** : 24 mars 2026  
**Règle** : chaque ticket **nomme** un écart ou un lot **borné** ; pas de « polish » non priorisé ni de fourre-tout.

> **En l’absence de validation directe de la créa**, V1.5 ne traite d’abord que les **écarts visuels objectivables** et à **faible ambiguïté** (voir § **Arbitrage à partir de la créa figée** ci-dessous).

### Arbitrage à partir de la créa figée *(méthode « froide » — pas d’atelier synchrone requis)*

*La **créa sert de référence muette** : maquette / fichiers figés, écrans actuels, intention produit. On compare **ce qui est montré** à **ce qui est livré**, sans deviner des intentions au-delà de l’évidence visuelle.*

1. **Écarts objectivables seulement** pour démarrer — formulations du type : hiérarchie visuelle plus faible que la créa ; rythme / espacements / densité qui cassent la lecture ; composant fonctionnel mais moins « premium » ; grammaire non homogène avec le reste. Si l’écart repose sur une **interprétation** de designer, le noter en **interprétatif / à arbitrer**, pas en ticket immédiat.
2. **Deux catégories** dans l’inventaire : **écarts certains** (visibles, concrets, fermables sans présence créa) · **écarts interprétatifs** (plus tard ou avec prudence) — éviter les faux tickets design.
3. **Premier lot très sûr** sans créa en direct : fort impact visuel, faible ambiguïté, **faisable en front seul**, peu de débat conceptuel — ex. hiérarchie, espacements, alignements, chrome commun, densité des cards, cohérence headers / sections ; reporter ton, narration visuelle fine, sujets « intention ».
4. **Démarrage possible sans attendre** une personne : viser au début **3 écarts certains maximum**, puis **V1.5-1 à V1.5-3** sur cette base — V1.5 **sobre, objectivable, discipliné**.

### Discipline d’arbitrage *(à respecter avant de remplir le backlog en masse)*

* Ne pas **surcharger** l’inventaire d’un coup (éviter une liste de 15 écarts non priorisés).
* Viser d’abord **3 à 6 écarts les plus structurants**, les ordonner, puis figer **V1.5-1 / V1.5-2 / V1.5-3** (et au-delà seulement si l’arbitrage le justifie).
* **Premier lot livrable** : viser **2 à 4 tickets maximum** ; les lots suivants après clôture ou validation du premier.

### Règle d’atelier *(5 points par écart retenu)*

*En atelier **synchrone** créa / produit **ou** en revue **asynchrone** sur la même base : pour **chaque** écart retenu, ne valider que ce qui suit — le backlog se remplit proprement sans dériver.*

1. **Où** est l’écart (zone, route, capture prod ou référence écran actuel si utile).
2. **En quoi** il est visible (symptôme concret à l’écran).
3. **Pourquoi** il compte (lisibilité, cohérence, usage, perception, etc.).
4. **Quel niveau de fidélité** à la créa est attendu (reproduction stricte, adaptation raisonnée, équivalent fonctionnel).
5. **Comment on saura qu’il est fermé** (aligné sur la **preuve de fin** du ticket).

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

## Inventaire des écarts créa ↔ produit *(à alimenter)*

*Sortie attendue : écarts **nommés**, **ordonnés**, reliés à la **créa figée** (maquette / doc) et à l’**écran actuel** — avec ou sans atelier synchrone avec la création graphique.*

**Catégorie** : **`Certain`** *(objectivable, fermable sans interprétation fragile)* · **`Interprétatif`** *(à arbitrer plus tard ou avec prudence — pas ticket immédiat du premier lot).*

**Impact** *(exemples de valeurs)* : lisibilité produit · cohérence visuelle · qualité d’usage · perception premium · dette UI *(une ou plusieurs, explicites)*.

**Risque / dépendance** *(exemples)* : front seul · arbitrage design requis · composant transverse · **bloqué** : référence créa manquante ou imprécise.

| # | Zone (écran) | Écart (résumé factuel) | Réf. créa / figma / doc | Catégorie | Impact | Risque / dépendance | Priorité (P1…) | Notes |
|---|--------------|------------------------|-------------------------|-----------|--------|---------------------|----------------|-------|
| 1 | _ex. cockpit / pilotage_ | _…_ | _…_ | _Certain \| Interprétatif_ | _…_ | _…_ | _…_ | |
| 2 | _ex. page détail_ | _…_ | _…_ | _…_ | _…_ | _…_ | _…_ | |
| 3 | _ex. synthèse / transverse_ | _…_ | _…_ | _…_ | _…_ | _…_ | _…_ | |

---

## Ordre d’exécution *(à figer après arbitrage)*

*Une fois l’inventaire validé, lister ici l’ordre **figé** des tickets (ex. V1.5-1 → V1.5-2 …) avec une phrase de rationale par étape.*

1. _[À compléter]_
2. _[À compléter]_

---

## Tableau de bord

| ID | Titre | Zone | Statut |
|----|-------|------|--------|
| _V1.5-1_ | _[À intituler après arbitrage]_ | _[cockpit \| détail \| synthèse \| transverse]_ | `À faire` |

---

## Premier lot livrable *(à définir)*

*Cible : **2 à 4 tickets** maximum pour le premier lot.*

- [ ] **Périmètre** : _écrans / composants inclus_
- [ ] **DoD** : _critères de fin testables (dont non-régression grammaire V1.4)_
- [ ] **Référence créa** : _lien ou version figée_
- [ ] **Preuve de fin** : _voir § Détail des tickets — aligné avec captures / routes / validations_

---

## Détail des tickets *(à rédiger ticket par ticket)*

*Chaque ticket V1.5-x reprendra : intention produit, règles, structure cible, DoD, fichiers / composants touchés (indicatif).*

### Preuve de fin *(chaque ticket — à cocher à la clôture)*

* Objectif : fermeture **vérifiable** et communicable (comité / créa / interne).

- [ ] **Capture avant / après** (ou équivalent objectif : maquette vs prod).
- [ ] **Route(s) / zone(s)** concernées, nommées explicitement.
- [ ] **Validation** : créa et/ou produit selon le périmètre du ticket ; **si pas de créa en direct** : validation **produit** et/ou **revue interne** suffisante pour les lots **objectivables** (aligné avec la § Arbitrage créa figée).
- [ ] **Non-régression V1.4** : grammaire pages détail / synthèse **OK** (aucune régression connue non assumée).

---

## Journal

| Date | Notes |
|------|-------|
| 24 mars 2026 | Ouverture du fichier — squelette ; inventaire et ordre **à compléter** après arbitrage. |
| 24 mars 2026 | Renforts : colonnes **Impact** et **Risque / dépendance** ; discipline 3–6 écarts / lot 2–4 tickets ; **preuve de fin** par ticket. |
| 24 mars 2026 | **Règle d’atelier** : 5 points par écart (où / visible / pourquoi / fidélité créa / critère de fermeture). |
| 24 mars 2026 | **Arbitrage sans créa en direct** : créa figée comme référence muette ; catégories **Certain / Interprétatif** ; premier lot conservateur ; règle noire sur blanc objectivable + faible ambiguïté. |

---

*Backlog Lynki V1.5 — **brouillon vivant** : le plan fixe la doctrine ; ce fichier porte l’exécution une fois l’inventaire des écarts posé.*
