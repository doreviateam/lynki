# Plan Sprint 04 — Lynki (Phase 2)

**Fichier canonique :** `PLAN_SPRINT_04_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** sprint exécutable — suite du [RAPPORT_SPRINT_03_LYNKI.md](RAPPORT_SPRINT_03_LYNKI.md) **v1.1**.

**Sources :** [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) **v1.1.1** · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v1.3** · [PLAN_SPRINT_03_LYNKI.md](PLAN_SPRINT_03_LYNKI.md) **v1.0** · [ADR_T19_TRIAL_BALANCE_EXTENSION.md](ADR_T19_TRIAL_BALANCE_EXTENSION.md)

---

## 1. Objectif du sprint

Le Sprint 03 a livré la **chaîne de preuve BG → GL** sur périmètre OD paie (`payroll_od_lines`) — Gate C **partiellement atteinte**.

Les deux limites identifiées sont claires :
1. **Couverture BG** : `complete=false` tant qu'on n'a que les journaux paie — Gate B non atteinte comme gate pleine.
2. **Profondeur GL** : le panneau latéral est fonctionnel mais sans page dédiée, ni export, ni filtre journal.

Le Sprint 04 a **trois axes** :

1. **Extension couverture balance** — brancher une deuxième source dans `TrialBalanceAggregation` (migration `account_move_lines` ou tout autre journal vaulté prioritaire selon arbitrage produit) ; mettre `complete=true` dès que le périmètre cible est atteint → **Gate B pleine**.
2. **Homogénéisation `referentiel_version`** — répercuter le champ sur toutes les restitutions `lynki.accounting.*` restantes (au-delà de `trial_balance` et `general_ledger` déjà exposés — Lot 4B).
3. **Exports** — première capacité d'export (PDF ou CSV) depuis la Synthèse comptable pour la trace BG ; périmètre minimal mais utilisable — Lot 6.

**Résultat attendu :** **Gate B pleine** si la couverture BG atteint la cible produit ; **Gate C** renforcée (GL en page dédiée ou export GL) ; Lot 4B complet sur les restitutions courantes.

---

## 2. Périmètre (lots / epics)

| Lot | Epic |
|-----|------|
| **Vault / données** | **Extension `trial_balance`** : migration `account_move_lines` (ou source arbitrée) + règle `complete` / `coverage` — [ADR_T19_TRIAL_BALANCE_EXTENSION.md](ADR_T19_TRIAL_BALANCE_EXTENSION.md) |
| **4B** | **Homogénéisation `referentiel_version`** sur toutes les restitutions `lynki.accounting.*` courantes |
| **6** | **Export** BG (et GL si faisable) — PDF ou CSV minimal, depuis la Synthèse |
| **0 / transversal** | Doc, [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md), backlog, Gate B / Gate C prononcées |

**Optionnel / hors sprint sauf arbitrage** : recette Gate A (T3, R1–R7) si non encore close ; page dédiée GL `/accounting/gl/[account_code]` (promotion du panneau latéral Sprint 03) ; rôles formalisés (Lot 6 profond).

---

## 3. Dépendances

```
Migration account_move_lines ──> TrialBalanceAggregation étendue ──> complete=true possible
                                                                     └──> Gate B pleine
T16–T17 (Sprint 03) ──> referentiel_version GL déjà exposé ──> T22 (autres restitutions)
                                                                └──> Lot 4B complet
```

---

## 4. Tickets (Sprint 04)

| # | Titre | Lot | Dépend de | Statut |
|---|--------|-----|-----------|--------|
| **T21** | **Migration** `account_move_lines` (ou source arbitrée) + connecteur Odoo / alimentation Vault | Vault | ADR T19 | todo |
| **T22** | **Extension** `TrialBalanceAggregation` : nouvelle source, règle `complete`, `coverage` mis à jour | Vault | T21 | todo |
| **T23** | **Homogénéisation** `referentiel_version` sur toutes les restitutions `lynki.accounting.*` restantes | 4B | T16–T17 (S03) | todo |
| **T24** | **Export** BG — endpoint Vault `GET /api/accounting/trial-balance/export` (CSV ou JSON téléchargeable) + bouton Linky | 6 | T22 | todo |
| **T25** | **Doc** : ALIGNEMENT v1.6, backlog v1.4, prononcé Gate B (si T22 OK) / Gate C renforcée, recette exports | 0 | T22–T24 | todo |

*(T21–T25 évitent la collision avec les tickets Sprint 03 T16–T20.)*

---

## 5. Definition of Done (extraits)

| Ticket | DoD minimum |
|--------|-------------|
| **T21** | Migration appliquée sans régression ; données `account_move_lines` visibles en base Vault sur périmètre de recette. |
| **T22** | `complete=true` quand le périmètre produit est atteint ; `coverage` reflète les nouvelles sources ; **aucune** régression sur `trial_balance` existant. |
| **T23** | Toutes les routes Vault / Linky exposant une restitution `lynki.accounting.*` incluent `referentiel_version` ; valeur alignée sur [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md). |
| **T24** | Fichier téléchargeable depuis Linky ; colonnes minimales : compte, libellé, débit, crédit, solde ; **pas de données sans Vault** (doctrine). |
| **T25** | ALIGNEMENT / backlog à jour ; Gate B **prononcée ou explicitement conditionnée** (critère documenté) ; §11 [RAPPORT_SPRINT_03_LYNKI.md](RAPPORT_SPRINT_03_LYNKI.md) complété si applicable. |

---

## 6. Recette — contrôles (héritage Sprint 03 + extensions)

En plus des contrôles Sprint 03 ([RAPPORT_SPRINT_03_LYNKI.md](RAPPORT_SPRINT_03_LYNKI.md) §9) :

| Champ / signal | Vérification |
|----------------|--------------|
| `complete` BG | `true` si la nouvelle source couvre le périmètre produit ; `false` sinon avec `coverage` mis à jour. |
| `coverage` BG | Reflète **toutes** les sources actives (ex. `payroll_od_lines + account_move_lines`). |
| `referentiel_version` | Présent et cohérent sur **toutes** les restitutions `lynki.accounting.*` exposées. |
| Export BG | Fichier téléchargeable ; `data_source` : `vault` uniquement (pas d'export depuis stub). |

---

## 7. Risques

| Risque | Mitigation |
|--------|------------|
| Migration `account_move_lines` complexe (modèle Odoo) | Périmètre **minimal** d'abord (journaux posted) ; timebox T21 ; arbitrage produit si > 3 jours. |
| `complete=true` trop tôt | Critère de complétude **défini explicitement** (ex. : tous journaux `posted` du périmètre tenant) avant de passer le flag. |
| Export : volume / performance | Limite de lignes (ex. 10 000) documentée + message UI ; pagination si nécessaire. |

---

## 8. Sortie attendue (fin de sprint)

* **`trial_balance`** : `complete=true` **ou** décision d'extension report datée avec motif et critère de complétude figé.
* **Gate B** : **prononcée** (si `complete=true` sur périmètre cible) **ou** condition de prononcé **explicitement documentée**.
* **`referentiel_version`** : homogène sur toutes les restitutions `lynki.accounting.*` courantes.
* **Export** : au moins un format (CSV ou JSON) téléchargeable depuis la Synthèse BG.
* **Rapport** : [RAPPORT_SPRINT_04_LYNKI.md](RAPPORT_SPRINT_04_LYNKI.md) — **v1.0** documente une clôture **sans livraison code** ; produire une **révision** après exécution T21–T25.

---

## 9. Après ce sprint

* Si **Gate B prononcée** : passer au volet **rôles / habilitations** (Lot 6 profond) et **Bilan / Compte de résultat** (Lot 2 extension).
* **Plan Sprint 05** — profondeur drill-down supplémentaire (GL page dédiée, filtres journal, export GL), ou rôles formalisés selon arbitrage.
* Poursuivre la spec [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) (colonnes Bilan / CR prévues).

---

**Exécution terrain :** [EXECUTION_TICKETS_SPRINT_04_LYNKI.md](EXECUTION_TICKETS_SPRINT_04_LYNKI.md)

---

*Doctrine Vault : [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) §3.1.*

*Suite : [PLAN_SPRINT_05_LYNKI.md](PLAN_SPRINT_05_LYNKI.md) — Gate B pleine + GL route dédiée.*
