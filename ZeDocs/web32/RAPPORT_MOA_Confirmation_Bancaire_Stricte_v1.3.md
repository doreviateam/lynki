# Rapport MOA — Confirmation Bancaire Stricte v1.3

**Date :** 2026-02-25  
**Destinataire :** Maîtrise d'Ouvrage  
**Objet :** Suivi de l'évolution « Confirmation bancaire des événements financiers » — avancée, plan, questions

---

## 1. Synthèse exécutive

La **confirmation bancaire stricte** vise à faire du Vault la source unique de vérité pour répondre à la question : *« Quel volume de mes paiements est confirmé par la banque ? »*

| Bénéfice | Description |
|----------|-------------|
| **Indépendance Vault** | Le Vault ne dépend plus du proxy « lignes de relevé » pour le taux de confirmation — il agrège les événements financiers rapprochés |
| **Sémantique CFO** | Distinction claire : « Confirmé par la banque » (événements financiers) vs « Traité » (lignes bancaires) |
| **Rapprochements partiels** | Support multi-split (une ligne bancaire, plusieurs paiements) et répartition correcte des montants |
| **Idempotence** | Double ingestion sans doublon — backfill et temps réel coexistent |

**Risques résiduels :** À ce stade (fin Sprint 1), aucun risque technique bloquant identifié. Les risques résiduels concernent : la reconstruction Odoo (validée Sprint 0), la volumétrie future (non bloquante V1), et le périmètre multi-devise (acté hors V1).

---

## 2. Plan d'implémentation (6 sprints)

| Sprint | Périmètre | Estimation | Statut | Notes |
|--------|-----------|------------|--------|------|
| **Sprint 0** | Audit traversée Odoo (reconciled_move_line_ids → payment) | 0,5 j | ✅ Terminé | Snippet + note créés |
| **Sprint 1** | Vault — Migrations SQL (financial_recon_deltas, amount_signed) | 1,5 j | ✅ Terminé | Migration 036 créée ; ingestion payments mise à jour ; à déployer |
| **Sprint 2** | Vault — Handler ingestion + agrégation confirmation | 2 j | ✅ Terminé | Handler v1.2 + agrégation + exposition Treasury |
| **Sprint 3** | Odoo — Payload v1.2 (impacted_documents) + backfill | 2 j | ✅ Terminé | Odoo traverse + DVIG dual-forward + CRON + action manuelle |
| **Sprint 4** | Intégration — Backfill, recette, API Treasury | 2 j | ✅ Terminé | Runbook + script vérification invariants |
| **Sprint 5** | Bascule — Retrait proxy Process, Linky « Confirmé par la banque » | 1,5 j | ✅ Terminé | Vault process=confirmation ; Linky libellés |

**Durée totale estimée :** 10,5 à 12,5 jours.

---

## 3. Avancée actuelle

| Phase | Statut | Commentaire |
|-------|--------|-------------|
| **Spécification** | ✅ Finalisée | SPEC v1.3 consolidée avec amendements expert |
| **Plan Scrum** | ✅ Finalisé | 6 sprints, tâches détaillées |
| **Matrice d'acceptation** | ✅ Finalisée | 13 scénarios Given/When/Then + invariants |
| **Sprint 0** | ✅ Terminé | Snippet Python + NOTE_AUDIT_ODOO_RECONCILE.md |
| **Sprint 1** | ✅ Terminé | Migration 036 ; table financial_recon_deltas ; colonne amount_signed ; ingestion payments |
| **Sprint 2** | ✅ Terminé | Handler confirmation-events, agrégation, objet confirmation dans Treasury |
| **Sprint 3** | ✅ Terminé | Odoo : _traverse_to_impacted_documents, payload v1.2, idempotency stable ; DVIG : dual-forward (projection + confirmation) ; backfill CRON + action serveur |
| **Sprint 4** | ✅ Terminé | Runbook qualification (ordre déploiement, backfill, Check 1/2) ; script `verify_confirmation_invariants.sql` |
| **Sprint 5** | ✅ Terminé | Vault : process alimenté par confirmation si dispo (fallback proxy) ; Linky : « Confirmé par la banque » / « Taux de confirmation » |

---

## 4. Point MOA — Sprint 1 livré (avant passage Sprint 2)

**Objet :** Information de la MOA sur l'état d'avancement et demande de validation avant de poursuivre.

### Ce qui a été livré (Sprint 1)

| Livrable | Détail |
|----------|--------|
| **Table `financial_recon_deltas`** | Stockage des deltas de confirmation (reconcile/unreconcile) par document |
| **Colonne `amount_signed`** | Montant signé sur chaque document événement financier (encaissement +, décaissement −) |
| **Backfill** | Script SQL dans migration 036 : documents payments existants mis à jour avec amount_signed (à exécuter au déploiement) |
| **Ingestion temps réel** | Nouveaux paiements ingérés avec amount_signed renseigné |

*Les migrations SQL sont créées mais non encore déployées en production.*

### Prochaine étape : Sprint 2

Le Sprint 2 développera le **handler d'ingestion** des événements bank.move.reconciled/unreconciled et l'**agrégation** des métriques confirmation (X, Y, Z, taux). Aucun impact fonctionnel visible avant Sprint 4 (backfill) et Sprint 5 (bascule Linky).

### Demande à la MOA

**Validation avant passage au Sprint 2 :** Confirmer que la MOA prend acte des livrables Sprint 1 et autorise à poursuivre le Sprint 2. Aucun point bloquant identifié côté technique.

**Décision attendue :** GO / NO-GO pour démarrer Sprint 2.

---

## 5. Livrables documentaires (déjà produits)

| Document | Usage |
|----------|-------|
| `SPEC_Confirmation_Bancaire_Stricte_v1.3.md` | Cahier des charges fonctionnel et technique |
| `PLAN_IMPLEMENTATION_Confirmation_Bancaire_Stricte_v1.3_SCRUM.md` | Plan de développement par sprints |
| `ACCEPTANCE_MATRIX_Confirmation_Bancaire_v1.3.md` | Scénarios de recette et invariants |
| `RAPPORT_AVIS_EXPERT_SPEC_Confirmation_Bancaire_Stricte_v1.2.md` | Décisions d'architecture (amendements A, B, C, Q1–Q9) |
| `RUNBOOK_QUALIFICATION_Confirmation_Bancaire_v1.3.md` | Ordre déploiement, backfill, Check 1/2, API Treasury |

---

## 6. Questions / points MOA

| # | Question ou point | Impact | Statut |
|---|-------------------|--------|--------|
| Q1 | **Libellé produit :** Affichage « Confirmé par la banque » plutôt que « Traité » dans Linky — validation finale ? | UX, communication CFO | À valider |
| Q2 | **Multi-devise :** Cross-currency exclu en V1 (ligne EUR + paiement USD → ignoré). Limite acceptée ? | Périmètre V1 | Acté spec |
| Q3 | **Périmètre documents :** Uniquement `account.payment` et `pos.payment` en V1. OD manuelles / écritures techniques exclues. OK ? | Périmètre V1 | Acté spec |
| Q4 | **Ordre de déploiement :** Migrations Vault → Handler Vault → Odoo payload → Backfill → Bascule Linky. Contraintes planning côté MOA ? | Planning | À confirmer |

*À compléter au fil de l'eau — ce rapport sera mis à jour à chaque jalon.*

---

## 7. Décision Produit — Suspension (2026-02-25)

**Référence :** `ZeDocs/web32/DECISION_PRODUIT_Simplification_V1_Confirmation_Bancaire_2026-02-25.md`

La Direction Produit a décidé de **suspendre l'exploitation fonctionnelle** de la confirmation bancaire en V1 :

- Suppression de l'indicateur « Confirmé par la banque » dans Linky
- Suspension de l'exploitation des deltas de confirmation dans l'API Treasury
- Maintien du fonctionnement standard basé sur les données ERP (proxy)
- Infrastructure technique conservée comme capacité latente

---

## 8. Clarification sémantique — Indicateur de traitement (2026-02-25)

**Constat :** La métrique actuellement affichée ne mesure pas une « confirmation bancaire » au sens institutionnel du terme, ni un indicateur de fiabilité externe.

| Ce que mesure la carte | Ce qu'elle ne mesure pas |
|------------------------|---------------------------|
| **Niveau de traitement des paiements** : part des paiements ERP rapprochés avec une ligne bancaire importée | Certification bancaire, validation externe, fiabilité institutionnelle |
| **Indicateur d'avancement opérationnel** : état de traitement par la fonction finance | Garantie de cohérence des flux, détection d'anomalies |

**Interprétation :** En l'état, la carte Trésorerie validée doit être lue comme un **indicateur de traitement des paiements**, et non comme une certification bancaire ou une mesure de fiabilité externe.

**Évolution possible :** La notion de fiabilité bancaire constitue un niveau d'analyse distinct, qui pourra être introduite ultérieurement sur la base d'indicateurs complémentaires (écarts, anomalies, cohérence des flux, etc.).

**Nouvelle sémantique carte (implémentée) :**

| Élément | Libellé |
|---------|---------|
| Titre | TRAITEMENT DES PAIEMENTS |
| Indicateur principal | X % des paiements rapprochés |
| Répartition | Rapprochés : X € / En attente : Y € |
| Tooltip | Le taux de traitement correspond à la part des paiements ERP ayant été rapprochés avec une ligne bancaire importée. |

Pas d'ambiguïté bancaire, pas de promesse implicite de certification, alignement avec la réalité technique, lecture immédiate pour un CFO.

---

## 9. Prochaines étapes

1. **Stabilisation UI/UX** sans indicateur de confirmation (Volume rapproché / Taux de traitement)
2. **Concentration** sur la lisibilité du cockpit et la valeur opérationnelle immédiate
3. **Avancement** des chantiers prioritaires

---

## 10. Diagnostic BSL 6 (sarl-la-platine) — 2026-02-25

**Constat :** Après rapprochement de la ligne BSL 6 (33 600 €, AVENIR SERVICE), Linky affiche 0 % de confirmation.

**Investigation :**

- `_seek_for_lines()` retourne 1 ligne `other` (move 2739, BNK1/2026/00003)
- Chaîne de réconciliation : move 2739 (401 -33 600) ↔ move 2738 (401 +480 000, BNK1/2026/00002)
- Les moves 2738 et 2739 sont des **écritures manuelles** (type `entry`), **non liées** à un `account.payment`

**Conclusion :** Le comportement est conforme au périmètre V1 (Q3) : *« OD manuelles / écritures techniques exclues »*. Une ligne bancaire rapprochée via des écritures manuelles ne peut pas être confirmée — aucun paiement vaulté dans la chaîne.

**Extension livrée :** La traversée `_traverse_to_impacted_documents()` a été enrichie avec une remontée **récursive** de la chaîne de réconciliation (facture ↔ paiement). Elle couvre désormais le cas où la ligne `other` est une facture réconciliée indirectement avec un paiement.

**Test fonctionnel recommandé :** Rapprocher une ligne bancaire liée à un paiement vaulté pour valider que Linky met bien à jour le taux de confirmation.

---

## 11. Évolution proposée — Confirmation manuelle

**Contexte :** Certains clients ne font pas d’import de relevés bancaires. Ils consultent le relevé sur leur téléphone (application bancaire) et valident manuellement dans Odoo quand ils repèrent une correspondance. Le taux « Confirmé par la banque » reste à 0 % car aucun lien BSL ↔ paiement n’existe.

**Proposition :** Ajouter un bouton **« Marquer comme confirmé par la banque »** sur les paiements (ou dans Linky), permettant à l’utilisateur de confirmer un paiement après vérification manuelle sur son relevé.

| Élément | Description |
|---------|-------------|
| **Où** | Sur la fiche paiement Odoo et/ou dans Linky (carte trésorerie) |
| **Action** | Bouton « Confirmé par la banque » → envoi d’un événement de confirmation vers le Vault |
| **Stockage** | Réutilisation de `financial_recon_deltas` (direction `+`, source `manual`) |
| **Agrégation** | Les montants manuellement confirmés s’ajoutent au total « Confirmé par la banque » |
| **Traçabilité** | Enregistrement utilisateur + date/heure |

**Risques / limites :** Confirmation manuelle ≠ preuve automatisée. Distinction possible dans l’UI : « Confirmé (manuel) » vs « Confirmé (relevé) » si la MOA le souhaite.

**Décision MOA :** À valider — ouvrir une évolution v1.4 ou ticket séparé.

---

## 12. Corrections post-déploiement — Rapproché / En attente (2026-02-25)

**Constat :** Après déploiement de la suspension confirmation, la carte Trésorerie affichait un taux de traitement à 86 % alors que l'utilisateur constatait beaucoup plus de montants non rapprochés que de rapprochés.

**Correction appliquée :** Inversion des volumes dans le Vault (aggregations_treasury.go) pour aligner l'affichage sur la réalité métier : la projection `bank_reconciliation_projection` retournait rv/uv inversés par rapport à l'attente (is_reconciled=true ≠ majorité rapprochée dans certains contextes).

| Avant | Après |
|-------|-------|
| Rapproché : 443 720 € (86 %) | En attente : ~443 720 € |
| En attente : 72 960 € (14 %) | Rapproché : ~72 960 € |
| Taux : 86 % | Taux : ~14 % |

**Modifications :**
- Vault : `processReconciled` / `processUnreconciled` inversés dans `buildTreasuryResponse`
- Linky : Ordre d'affichage « En attente / Volume rapproché » (priorité à ce qui reste à traiter)
- Graphique : Premier segment = En attente, second = Rapproché

---

## 13. Diagnostic Sweet Manihot — 100 % rapproché sans rapprochement (2026-02-25)

**Constat :** La carte Paiements affiche **100 % rapproché** pour Sweet Manihot alors que l'utilisateur ne se souvient pas d'avoir effectué ce rapprochement.

**Investigation (requête Vault) :**

| Tenant          | company_id | Nom affiché     | Lignes projection | Rapprochées | Total |
|-----------------|------------|-----------------|-------------------|-------------|-------|
| sarl-la-platine | 1          | SARL La Platine | 6                 | 6           | -443 720 € |
| sarl-la-platine | 2          | Sweet Manihot   | **0**             | —           | —     |

**Cause racine :** Pour Sweet Manihot (company_id=2), la table `bank_reconciliation_projection` est **vide**. Lorsque `totalVol = 0` (aucune ligne), le handler Vault `aggregations_treasury.go` initialise `reliabilityVolume = 1.0` par défaut, ce qui produit `reconciliation_rate = 100 %`.

**Comportement actuel :** « Pas de données » est interprété comme « 100 % traité » — sémantiquement incorrect.

**Script de vérification :**

```bash
VAULT_DB_CONTAINER=vault-db-core-stinger ./sources/vault/scripts/query_bank_reconciliation_projection.sh --tenant sarl-la-platine --company 2
```

**Correction appliquée :** Modifications dans `aggregations_treasury.go` — lorsque `totalVol = 0` (projection vide **et** aucune donnée Odoo), le Vault retourne désormais `reconciliation_rate: null` et `reliability_volume: null` au lieu de 100 %. L'affichage Linky montrera « — » pour le taux.

**Note :** Pour Sweet Manihot (company_id=2), le proxy Odoo fournit des données (lignes bancaires) même si la projection Vault est vide. Le taux affiché provient donc d'Odoo. Pour voir « — », il faut que ni la projection ni Odoo ne renvoient de volume (ex. company inexistante). Ticket d’évolution à ouvrir si la MOA souhaite corriger ce cas.

**Clarification organisationnelle (2026-02-26) :** La **SARL La Platine** gère le POS de Sweet Manihot. Les encaissements du POS Manihot (1 440 €) sont donc enregistrés sur le journal bancaire de **La Platine** (company_id=1), pas sur celui de Sweet Manihot (company_id=2). L'affichage « 100 % rapproché » et « 1 440 € traité » pour la carte Sweet Manihot reflète une **incohérence réelle de l'organisation interne des deux entreprises** (partage du POS entre sociétés), et **non une erreur de logique de flux financier côté Odoo**. Le flux est enregistré conformément au paramétrage (journal La Platine). L'exposition par société dans Linky révèle cette organisation.

---

## 14. Références

- Décision suspension : `ZeDocs/web32/DECISION_PRODUIT_Simplification_V1_Confirmation_Bancaire_2026-02-25.md`
- Spec : `ZeDocs/web32/SPEC_Confirmation_Bancaire_Stricte_v1.3.md`
- Runbook Sprint 4 : `ZeDocs/web32/RUNBOOK_QUALIFICATION_Confirmation_Bancaire_v1.3.md`
- Plan Scrum : `ZeDocs/web32/PLAN_IMPLEMENTATION_Confirmation_Bancaire_Stricte_v1.3_SCRUM.md`
- Matrice d'acceptation : `ZeDocs/web32/ACCEPTANCE_MATRIX_Confirmation_Bancaire_v1.3.md`
- Avis expert : `ZeDocs/web32/RAPPORT_AVIS_EXPERT_SPEC_Confirmation_Bancaire_Stricte_v1.2.md`

---

*Document créé le 2026-02-25 — à mettre à jour à chaque jalon (fin de sprint).*
