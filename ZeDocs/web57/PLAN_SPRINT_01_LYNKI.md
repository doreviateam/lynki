# Plan Sprint 01 — Lynki (Phase 2)

**Fichier canonique :** `PLAN_SPRINT_01_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** sprint exécutable — à dupliquer (`PLAN_SPRINT_02_…`) pour les sprints suivants.

**Sources :** [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v1.1** · [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) **v1.1.1**

---

## 1. Objectif du sprint

Poser les fondations Phase 2 : **gel documentaire**, **navigation Pilotage / Synthèse** (**Gate A**), **contrats & identifiants** (Lot **4A**) **stabilisés** pour le premier incrément Synthèse, et **amorce Lot 2** avec **bloc pilote = balance générale** (charnière preuve au centre de la chaîne restitution → compte → **BG** → grand livre).

---

## 2. Périmètre (lots / epics retenus)

| Lot | Epic (rappel backlog) |
|-----|---------------------|
| **0** | Gel documentaire / renvois croisés |
| **1** | Navigation `appView`, `?view=`, chrome, non-régression Pilotage |
| **4A** | Inventaire endpoints, proposition contrat `lynki.*`, décision stubs |
| **2** *(amorce)* | Vue Synthèse : shell + **un seul bloc pilote — balance générale** branché Vault + états chargement/erreur + **critères d’acceptation écrits** |

**Hors sprint :** 4B, 3, 5, 6 (sauf amorce rédactionnelle optionnelle du DICO hors chemin critique).

---

## 3. Dépendances entre items

```
Lot 0 ──┬──> Lot 1 (Gate A)
        │
Lot 0 ──┼──> Lot 4A (peut démarrer en parallèle de Lot 1 après passage Lot 0 minimal)
        │
Lot 1 + 4A (stabilisé ou stubs documentés) ──> Lot 2 amorce (bloc BG)
```

---

## 4. Tickets (à recopier dans l’outil avec IDs)

| # | Titre | Lot | Dépend de | Statut |
|---|--------|-----|-----------|--------|
| T1 | Relecture en-têtes + renvois (SPEC Synthèse, référentiel, ALIGNEMENT, plan) | 0 | — | todo |
| T2 | Implémentation navigation SPEC_UX + wireframes | 1 | T1 (souhaitable) | todo |
| T3 | Tests manuels bascule / URL / régression Pilotage | 1 | T2 | todo |
| T4 | Inventaire API vs dictionnaire restitutions | 4A | T1 | todo |
| T5 | Proposition contrat stable `lynki.accounting.*` / `lynki.rubric.*` | 4A | T4 | todo |
| T6 | Décision documentée stubs vs données réelles (pour débloquer Synthèse) | 4A | T5 | todo |
| T7 | Shell vue Synthèse (routing, layout) | 2 | T2, T6 | todo |
| T8 | **Bloc pilote balance générale** — données Vault + critères d’acceptation écrits | 2 | T7, T6 | todo |
| T9 | États chargement / erreur sur périmètre bloc BG (§11 spec) | 2 | T8 | todo |

*(Ajuster la granularité : un ticket peut être découpé en sous-tâches.)*

---

## 5. Definition of Done par ticket (opérationnelle)

| Ticket | DoD minimum |
|--------|-------------|
| **T1** | Renvois cohérents ; pas d’ambiguïté de version sur la spec Synthèse (en-tête = vérité). |
| **T2** | Comportement conforme [SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md) ; header aligné wireframes. |
| **T3** | Liste de scénarios manuels passés ; régression Pilotage OK. |
| **T4** | Tableau ou doc : endpoint ↔ restitution ↔ écart. |
| **T5** | Contrat lisible par l’équipe UI + back (format choisi : OpenAPI, types, markdown). |
| **T6** | Décision tracée (ADR court ou section backlog) ; pas de flou sur ce que consomme le bloc BG. |
| **T7** | Route / vue Synthèse accessible depuis navigation ; layout vide acceptable hors bloc pilote. |
| **T8** | **Balance générale** : données via **Vault** ; critères d’acceptation **écrits** (copier-coller recette). |
| **T9** | Chargement + erreur visibles et testables sur le bloc BG uniquement. |

**Renvoi plan consolidé :** [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) §8 (DoD lots).

---

## 6. Risque principal du sprint

| Risque | Mitigation |
|--------|------------|
| **4A pas assez avancé** pour brancher le bloc BG | Stubs **documentés** (T6) + périmètre réduit explicite ; ne pas élargir à d’autres blocs avant stabilisation. |

---

## 7. Sortie attendue (fin de sprint)

**Sortie Sprint 1 visée :**

* **Gate A validé** (navigation Pilotage / Synthèse stable, non-régression Pilotage) ;
* **Lot 4A suffisamment stabilisé** pour **supporter le premier incrément Synthèse** (contrat ou stubs explicitement acceptés) ;
* **Lot 2 amorcé** avec **bloc pilote = balance générale** branché **Vault** et **critères d’acceptation écrits** pour ce bloc.

---

## 8. Après ce sprint

* Passer en revue **Gate B** (écran Synthèse exploitable) : probablement **sprint suivant** si le périmètre reste au bloc BG + coquille.
* Mettre à jour [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) (cases cochées, nouveaux tickets).
* Suite documentée : **[PLAN_SPRINT_02_LYNKI.md](PLAN_SPRINT_02_LYNKI.md)** (Vault `trial_balance`, retrait stub, 4B, BG→GL).

---

*Document d’exécution — ne pas confondre avec le [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) (stratégie lots) ni le [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) (liste vivante).*
