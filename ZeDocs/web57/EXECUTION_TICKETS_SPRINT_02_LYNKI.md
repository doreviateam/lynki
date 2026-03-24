# Exécution tickets — Sprint 02 Lynki

**Fichier canonique :** `EXECUTION_TICKETS_SPRINT_02_LYNKI.md`  
**Version :** 1.1 — mars 2026  
**Date :** 20 mars 2026  
**Révision 1.1 :** vue terrain enrichie (tableau synthèse, tickets détaillés, ordre d’attaque, checkpoints) — **vérité contractuelle** : [PLAN_SPRINT_02_LYNKI.md](PLAN_SPRINT_02_LYNKI.md) **v1.1** §5 (DoD).

**Sprint source :** [PLAN_SPRINT_02_LYNKI.md](PLAN_SPRINT_02_LYNKI.md) **v1.1**  
**Clôture Sprint 01 :** [RAPPORT_SPRINT_01_LYNKI.md](RAPPORT_SPRINT_01_LYNKI.md)  
**Statut :** exécution terrain — compléter **Owner** dans l’outil ; mettre à jour **Statut** au fil de l’eau.

**Objectif :** suivre l’avancement opérationnel des tickets **T10 à T15**, avec dépendances, livrables et statut réel.

---

## 1. Vue d’ensemble

| Ticket | Objet | Lot | Priorité | Dépend de | Owner | Statut |
| ------ | ----- | --- | -------- | --------- | ----- | ------ |
| **T10** | Clôture recette Sprint 01 / Gate A | 1 | Haute | Sprint 01 livré | _À assigner_ | todo |
| **T11** | Vault — `GET /api/accounting/trial-balance` | Vault | Critique | Contrat Sprint 01 | _À assigner_ | todo |
| **T12** | Linky — retrait stub / consommation réel | 4A | Critique | T11 | _À assigner_ | todo |
| **T13** | 4B — version référentiel sur `trial_balance` | 4B | Haute | T11 | _À assigner_ | todo |
| **T14** | Lot 3 — BG → GL minimal canonique | 3 | Haute | T11, T12 | _À assigner_ | todo |
| **T15** | Mise à jour doc / alignement / backlog | transversal | Moyenne | T12–T14 | _À assigner_ | todo |

**Légende statut :** `todo` · `in_progress` · `blocked` · `done`

---

## 2. Tickets détaillés

### T10 — Clôture recette Sprint 01 / Gate A

**But**  
Valider les scénarios R1–R7 du Sprint 01 et prononcer explicitement Gate A.

**Entrées**

* [RAPPORT_SPRINT_01_LYNKI.md](RAPPORT_SPRINT_01_LYNKI.md) §4
* Environnement exécutable (dev ou déployé)

**Actions**

* Exécuter R1 à R7 (et R8 si pertinent)
* Noter le résultat réel
* Consigner Gate A atteint / non atteint

**Sorties**

* Statut Gate A documenté
* Trace de recette archivée

**DoD**

* Gate A explicitement prononcé ou reporté avec motif

**Statut**

* todo

---

### T11 — Vault : `GET /api/accounting/trial-balance`

**But**  
Exposer dans `sources/vault` une route HTTP réelle dont le payload correspond à la restitution canonique **`lynki.accounting.trial_balance`** (chemin HTTP **`GET /api/accounting/trial-balance`** — distinction stricte avec l’identifiant métier).

**Entrées**

* Contrat Sprint 01 (T5)
* [DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md) · [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1**

**Actions**

* Implémenter le handler Vault
* Produire un payload conforme au contrat
* Gérer des erreurs HTTP cohérentes
* Vérifier la doctrine Vault : **aucune** lecture comptable ne contourne le Vault pour ce flux

**Sorties**

* Endpoint réel disponible
* Payload conforme
* Test d’appel concluant

**DoD**

* JSON conforme au contrat
* Appel end-to-end OK
* Doctrine Vault respectée

**Pistes fichiers (non exhaustif)**  
`sources/vault/internal/handlers/` (ex. nouveau handler) ; enregistrement route dans `internal/server/` — à affiner au grooming.

**Statut**

* todo

---

### T12 — Linky : retrait du stub / consommation réel

**But**  
Utiliser la réponse Vault réelle et interdire tout **stub silencieux** en **environnement de référence**.

**Entrées**

* T11 livré

**Actions**

* Brancher le bloc BG (ex. `AccountingSummaryView`) sur la réponse réelle
* Désactiver le stub par défaut en env de référence
* Conserver un fallback uniquement **documenté** et **visible** ailleurs si nécessaire
* Tester chargement / erreur / retry

**Sorties**

* Bloc BG alimenté par le réel
* Plus de confusion possible entre réel et secours

**DoD**

* Pas de stub silencieux en environnement de référence
* Fallback visible si encore nécessaire hors référence
* États UI testables

**Pistes fichiers (non exhaustif)**  
`units/dorevia-linky/app/api/accounting/trial-balance/route.ts` ; `units/dorevia-linky/components/AccountingSummaryView.tsx`

**Statut**

* todo

---

### T13 — 4B : version référentiel sur `trial_balance`

**But**  
Porter la version du référentiel sur la réponse `trial_balance` ou la journaliser selon la règle retenue.

**Entrées**

* T11 livré
* [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1**

**Actions**

* Ajouter champ ou mécanisme de trace
* Aligner la valeur avec la version documentaire
* Documenter le comportement

**Sorties**

* Version référentiel visible ou journalisée
* Cohérence doc ↔ API

**DoD**

* Mécanisme observable
* Correspondance avec le référentiel en vigueur

**Statut**

* todo

---

### T14 — Lot 3 : BG → GL minimal canonique

**But**  
Livrer un premier parcours de preuve depuis une ligne de balance vers un grand livre **minimal mais canonique**.

**Entrées**

* T11 livré
* T12 livré

**Actions**

* Figer le contrat **`lynki.accounting.general_ledger`**
* Filtrer au minimum par **compte + période + périmètre**
* Relier une ligne BG à ce détail
* Écrire les critères d’acceptation du scénario

**Sorties**

* Premier drill-down réel BG → GL
* Filtres explicites et stables

**DoD**

* Au moins un scénario complet utilisable
* Pas de drill flou
* Identifiants stables
* Pas de régression Gate A

**Statut**

* todo

---

### T15 — Mise à jour doc / backlog / alignement

**But**  
Réconcilier la documentation avec ce qui a effectivement été livré.

**Entrées**

* T12 à T14 terminés ou statés

**Actions**

* Mettre à jour [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md)
* Noter la fin du stub / comportement par environnement
* Ajuster [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) / sprint suivant

**Sorties**

* Traçabilité doc ↔ code à jour

**DoD**

* Documents mis à jour
* Renvois croisés cohérents

**Statut**

* todo

---

## 3. Ordre d’attaque recommandé

1. **T11** — verrou technique du sprint
2. **T10** et **T13** en parallèle (recette Gate A / mécanisme 4B sur `trial_balance`)
3. **T12** — doctrine Vault visible dans l’UI
4. **T14** — chaîne de preuve BG → GL
5. **T15** — clôture documentaire

*Variante terrain :* **T10** peut démarrer dès qu’un env est dispo, **en parallèle** de **T11** / **T13** (pas de dépendance code).

---

## 4. Points de contrôle sprint

| Checkpoint | Critère |
| ---------- | ------- |
| **CP1** | T11 répond correctement |
| **CP2** | T12 retire le stub en env de référence |
| **CP3** | T13 expose ou journalise la version référentiel |
| **CP4** | T14 ouvre un BG → GL minimal |
| **CP5** | T15 remet la doc à jour |

---

## 5. Résultat attendu fin de sprint

* `trial_balance` **réel** côté Vault (`GET /api/accounting/trial-balance` → `lynki.accounting.trial_balance`)
* Linky branché sur le réel
* Stub **neutralisé** en environnement de référence (pas de secours silencieux)
* Version référentiel **traçable** (4B amorcé)
* Premier drill **BG → GL** utilisable (filtres compte + période + périmètre)

---

## 6. Graphe de dépendances (rappel)

```
T10 // parallèle (recette Gate A — pas de dépendance code vers T11)

T11 ──> T12 ──> T14
T11 ──> T13

T12 … T14 ──> T15
```

---

*Document d’exécution — ne remplace pas [PLAN_SPRINT_02_LYNKI.md](PLAN_SPRINT_02_LYNKI.md) (gouvernance lots, DoD officiels).*
