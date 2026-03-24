# Plan Sprint 03 — Lynki (Phase 2)

**Fichier canonique :** `PLAN_SPRINT_03_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** sprint exécutable — suite du [RAPPORT_SPRINT_02_LYNKI.md](RAPPORT_SPRINT_02_LYNKI.md) **v1.1**.

**Sources :** [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) **v1.1.1** · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v1.2** · [PLAN_SPRINT_02_LYNKI.md](PLAN_SPRINT_02_LYNKI.md) **v1.1**

---

## 1. Objectif du sprint

Le Sprint 02 a livré **`lynki.accounting.trial_balance`** côté Vault avec une **couverture partielle** (agrégat `payroll_od_lines`) — **ne pas présenter comme une balance générale métier complète** (formulation **[RAPPORT_SPRINT_02_LYNKI.md](RAPPORT_SPRINT_02_LYNKI.md) §1.1**).

Le Sprint 03 a **deux axes parallèles complémentaires** :

1. **Chaîne de preuve BG → GL (Lot 3)** — reporter **T14** du Sprint 02 : contrat **`lynki.accounting.general_ledger`**, exposition HTTP canonique côté Vault, route Linky, **premier parcours utilisateur** depuis une **ligne** de balance vers les **écritures** du grand livre, filtres **compte + période + périmètre** explicites (pas de drill flou).
2. **Extension de la couverture de la balance (trial_balance)** — au-delà de `payroll_od_lines` : élargir les sources agrégées dans le Vault (priorisation avec produit : journaux additionnels, lignes issues d’autres tables vaultées, ou interrogation contrôlée amont selon doctrine — **arbitrage documenté** si dérogation).

**Résultat attendu :** **Gate C** **amorcée** (première preuve GL joignable depuis la Synthèse) ; **Gate B** **renforcée** si la couverture BG s’étend (sinon Gate B reste **partielle** jusqu’à BG complète cible).

---

## 2. Périmètre (lots / epics)

| Lot | Epic |
|-----|------|
| **3** | **`lynki.accounting.general_ledger`** — handler Vault, `GET` HTTP aligné sur le contrat, route Linky, UI drill minimal |
| **Vault / données** | **Extension** `trial_balance` — nouvelles sources ou jointures documentées ; critères `complete` / `coverage` mis à jour |
| **4B** | Poursuite : version référentiel sur **GL** ; cohérence avec [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) |
| **0 / transversal** | Doc [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md), backlog, libellés produit **§1.1** rapport S02 (BG pilote) |

**Hors sprint ou optionnel** : repositionnement onglets header (D2) ; blocs Bilan / CR complets ; Lot 5 DICO KPI.

---

## 3. Dépendances

```
Extension trial_balance (sources) ──┐
                                      ├──> cohérence métier + tests
T11 réel (Sprint 02) ──> GL (T16–T18) ──> Gate C amorcée
```

---

## 4. Tickets (Sprint 03)

| # | Titre | Lot | Dépend de | Statut |
|---|--------|-----|-----------|--------|
| **T16** | **Contrat + types** `lynki.accounting.general_ledger` (TS + doc dictionnaire) | 3 / 4A | — | todo |
| **T17** | **Vault** : `GET` HTTP canonique grand livre (ex. `/api/accounting/general-ledger`) ↔ `lynki.accounting.general_ledger` ; filtres **compte, date_debut, date_fin, tenant, company_id** | Vault | T16, T11 (S02) | todo |
| **T18** | **Linky** : route `/api/accounting/general-ledger` ou proxy ; **UI** : action sur ligne BG → panneau / page **écritures GL** | 3 | T17 | todo |
| **T19** | **Extension** `trial_balance` : nouvelles sources / règles `complete` & `coverage` | Vault | T11 | todo |
| **T20** | **Doc** : ALIGNEMENT, backlog, **libellé UI** « Balance générale — périmètre partiel (OD paie) » tant que pertinent ; recette | 0 | T17–T19 | todo |

*(Ajuster les IDs dans l’outil ; T16–T20 évitent la collision avec les tickets Sprint 02.)*

---

## 5. Definition of Done (extraits)

| Ticket | DoD minimum |
|--------|-------------|
| **T16** | Contrat **figé** et cité dans [DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md) ou annexe sprint. |
| **T17** | JSON conforme ; **GET** HTTP explicite ; **aucun** contournement Vault pour la lecture GL Lynki. |
| **T18** | **Un** scénario E2E : ligne BG → liste GL **stable** ; filtres visibles ; **pas** de régression navigation S01. |
| **T19** | **Décision** documentée (ADR court ou section backlog) : nouvelles lignes incluses, impact sur `complete`. |
| **T20** | ALIGNEMENT / backlog à jour ; **§11** [RAPPORT_SPRINT_02_LYNKI.md](RAPPORT_SPRINT_02_LYNKI.md) complété pour **GL** si applicable. |

---

## 6. Recette — contrôles (héritage Sprint 02 + GL)

En plus de [RAPPORT_SPRINT_02_LYNKI.md](RAPPORT_SPRINT_02_LYNKI.md) **§11** (`data_source`, `complete`, `coverage`, `referentiel_version`, header) :

| Champ / signal | Vérification |
|----------------|--------------|
| Réponse **GL** | `restitution_id` = `lynki.accounting.general_ledger` ; lignes cohérentes ; **referentiel_version** présent. |
| Drill **BG → GL** | Même **compte** et **période** que la ligne source (à la tolérance documentée). |
| **trial_balance** étendu | `coverage` reflète les **nouvelles** sources ; `complete` mis à jour si règle produit le permet. |

---

## 7. Risques

| Risque | Mitigation |
|--------|------------|
| Données GL insuffisantes en base Vault | Périmètre **minimal** + message explicite ; pas d’élargissement UI sans données. |
| **T19** trop large | Découper en **sous-lots** (ex. une source à la fois) ; timebox. |

---

## 8. Sortie attendue (fin de sprint)

* Premier **`lynki.accounting.general_ledger`** **utilisable** (Vault + Linky + **au moins un** parcours UI).
* **trial_balance** : **couverture étendue** **ou** décision **report** datée avec motif.
* **Gate C** : **amorcée** (chaîne de preuve **BG → GL**).
* **Rapport** : `RAPPORT_SPRINT_03_LYNKI.md` à rédiger en clôture.

---

## 9. Après ce sprint

* Étendre **4B** aux autres `lynki.accounting.*`.
* Poursuivre la spec [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) (colonnes BG/GL prévues).
* **Plan Sprint 04** — exports, rôles, ou profondeur drill-down supplémentaire.

---

*Doctrine Vault : [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) §3.1.*
