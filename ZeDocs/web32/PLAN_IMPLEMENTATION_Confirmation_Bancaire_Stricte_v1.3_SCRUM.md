# Plan d'implémentation Scrum — Confirmation Bancaire Stricte v1.3

**Date :** 2026-02-25  
**Référence :** `ZeDocs/web32/SPEC_Confirmation_Bancaire_Stricte_v1.3.md`  
**Durée estimée :** 6 sprints (10,5–12,5 jours)  
**Stack :** Vault (Go), Odoo (Python), DVIG (Python), Linky (Next.js)

---

## 0. Vue d'ensemble

| Sprint | Périmètre | Estimation | Statut | Dépendance |
|--------|-----------|------------|--------|-------------|
| **Sprint 0** | Audit traversée Odoo (reconciled_move_line_ids → payment) | 0,5 j | ✅ Terminé | — |
| **Sprint 1** | Vault — Migrations SQL (financial_recon_deltas, amount_signed) | 1,5 j | ✅ Terminé | — |
| **Sprint 2** | Vault — Handler ingestion v1.2 + agrégation confirmation | 2 j | ✅ Terminé | Sprint 1 |
| **Sprint 3** | Odoo — Payload v1.2 (impacted_documents) + script backfill | 2 j | À faire | — |
| **Sprint 4** | Integration — Backfill, double écriture, API Treasury confirmation | 2 j | À faire | Sprint 2, Sprint 3 |
| **Sprint 5** | Bascule — Retrait proxy Process, Linky UI confirmation | 1,5 j | À faire | Sprint 4 |

**Principe :** Le Vault devient la source stricte de confirmation bancaire. Odoo émet le payload enrichi ; le Vault ingère sans dépendance runtime. Sprint 0 évite de perdre 2 jours sur un détail Odoo/OCA.

---

## Sprint 0 — Audit traversée Odoo (0,5 j)

**Objectif :** Vérifier que l'on peut reconstruire `impacted_documents` avant de coder 3.1. Si `payment_id` n'est pas fiable selon le contexte, le savoir en amont.

| Tâche | Action | Livrable |
|-------|--------|----------|
| 0.1 | Vérifier `bank_statement_line → reconciled_move_line_ids` | Note technique |
| 0.2 | Vérifier lien `move_line → payment_id` (ou alternative) | Note technique |
| 0.3 | Vérifier montant attribué par move_line (clé pour multi-split) | Snippet Python traversée |
| 0.4 | Rédiger note technique 1 page | `ZeDocs/web32/NOTE_AUDIT_ODOO_RECONCILE.md` |

**Livrables :**
- Note technique : `ZeDocs/web32/NOTE_AUDIT_ODOO_RECONCILE.md`
- Snippet Python : `scripts/snippet_traverse_reconcile_to_payment.py`

**DoD Sprint 0 :**
- [ ] Note technique validée
- [ ] Snippet exécutable sur Odoo lab (ou prod lecture seule)
- [ ] Go / No-go pour démarrer Sprint 3.1

---

## Sprint 1 — Vault : Migrations SQL

**Objectif :** Créer la table `financial_recon_deltas` et ajouter `amount_signed` sur `documents`.

### User Story 1.1 — Table financial_recon_deltas

> En tant que Vault, je dispose d'une table pour stocker les deltas de confirmation par document.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 1.1.1 | Créer migration SQL : table `financial_recon_deltas` (id, tenant, document_id, odoo_move_id nullable, bank_statement_line_id, delta_amount_abs, direction, currency, event_uid, occurred_at, ingested_at) | `sources/vault/migrations/` | 0,5 j |
| 1.1.1a | **Règle occurred_at / ingested_at :** occurred_at = date métier Odoo ; ingested_at = NOW() côté Vault ; `ingested_at DEFAULT now()` en SQL | — | — |
| 1.1.1b | **direction** : type strict `CHAR(1)` avec `CHECK (direction IN ('+','-'))` ou ENUM — évite bugs bêtes | — | — |
| 1.1.1c | **event_uid** : TEXT. Si idempotency_key Odoo → string directe. Si hash → documenter hex/base64 | — | — |
| 1.1.2 | Contraintes : UNIQUE(tenant, event_uid), INDEX(tenant, document_id), INDEX(tenant, odoo_move_id) | — | 0,1 j |
| 1.1.3 | Tests migration : appliquer sur DB test, rollback possible | — | 0,2 j |

### User Story 1.2 — Colonne amount_signed sur documents

> En tant que Vault, chaque document événement financier a un montant signé matérialisé (amendement A).

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 1.2.1 | Migration : ALTER TABLE documents ADD COLUMN amount_signed NUMERIC(16,2) | `sources/vault/migrations/` | 0,1 j |
| 1.2.2 | Backfill : UPDATE documents SET amount_signed = (payload_json->>'amount')::numeric WHERE ... ; fallback total_ttc ; convention signe (encaissement +, décaissement −) | Script ou migration data | 0,4 j |
| 1.2.3 | Mettre à jour l'ingestion payments pour peupler amount_signed à la création | `sources/vault/internal/services/payments_service.go` | 0,2 j |

**DoD Sprint 1 :**
- [ ] Table `financial_recon_deltas` créée, contraintes OK
- [ ] Colonne `amount_signed` sur documents, backfill exécuté
- [ ] Ingestion payments remplit amount_signed
- [ ] Migrations réversibles testées

---

## Sprint 2 — Vault : Handler ingestion + agrégation

**Objectif :** Handler pour bank.move.reconciled/unreconciled au format v1.2 ; agrégation X, Y, Z, confirmation_rate.

### User Story 2.1 — Handler ingestion format v1.2

> En tant que Vault, j'ingère les événements bank.move.reconciled et bank.move.unreconciled avec impacted_documents.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 2.1.1 | Nouveau payload struct : event_type, tenant, bank_statement_line_id, impacted_documents[], occurred_at, idempotency_key | `bank_reconciliation_events.go` ou nouveau handler | 0,3 j |
| 2.1.2 | Résolution document_id depuis odoo_model + odoo_id (GetDocumentBySourceID ou équivalent) | `storage/` | 0,3 j |
| 2.1.3 | Garde-fou : document inexistant → ignorer + log warning (Q3) | — | 0,1 j |
| 2.1.4 | Garde-fou cross-currency : currency delta ≠ document.currency → ignorer + log warning (§13.4) | — | 0,2 j |
| 2.1.5 | Insertion delta par impacted_document ; event_uid = idempotency_key (priorité) ou hash sans occurred_at | — | 0,3 j |
| 2.1.6 | Support bank.move.unreconciled (direction '-') | — | 0,2 j |
| 2.1.7 | Idempotence : ON CONFLICT (tenant, event_uid) DO NOTHING ou check avant insert | — | 0,2 j |

### User Story 2.2 — Agrégation confirmation (X, Y, Z, taux)

> En tant que handler Treasury, je calcule les métriques confirmation depuis financial_recon_deltas et documents.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 2.2.1 | Requête/agrégation : périmètre X = documents WHERE odoo_model IN ('account.payment', 'pos.payment') | `storage/` ou `aggregations_treasury.go` | 0,3 j |
| 2.2.2 | **Agrégation 2 passes :** (1) Récupérer liste documents périmètre X ; (2) Agréger deltas groupés par document_id — évite N SUM. Clamp SQL : `LEAST(GREATEST(sum,0), abs(amount_signed))` | — | 0,4 j |
| 2.2.2a | **Règle dégradée :** Si amount_signed NULL (doc ancien sans backfill) → confirmed_abs = 0, log warning `missing_amount_signed` — évite NaN silencieux | — | — |
| 2.2.3 | X_abs, Y_abs, Z_abs, confirmation_rate ; full_count, partial_count, unconfirmed_count | — | 0,3 j |
| 2.2.4 | Exposition dans réponse Treasury : objet `confirmation` (total_amount_abs, confirmed_amount_abs, unconfirmed_amount_abs, confirmation_rate, full_count, partial_count, unconfirmed_count) | `aggregations_treasury.go` | 0,2 j |

**DoD Sprint 2 :**
- [ ] POST reçoit payload v1.2 avec impacted_documents
- [ ] Cross-currency ignoré + warning
- [ ] Idempotence validée (double ingestion → 1 seul delta)
- [ ] GET /ui/aggregations/treasury renvoie `confirmation`
- [ ] Tests unitaires : Partiel, Full, Unreconcile, Idempotence, Underflow, Multi-split, Cross-currency

---

## Sprint 3 — Odoo : Payload v1.2 + backfill

**Objectif :** Odoo émet le format v1.2 (impacted_documents) ; script/action backfill état courant.

### User Story 3.1 — Enrichissement payload temps réel

> En tant qu'Odoo, j'émets bank.move.reconciled avec impacted_documents (odoo_model, odoo_id, amount_abs) lors du rapprochement.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 3.1.1 | Traverser reconciled_move_line_ids → account.move.line → account.move → account.payment (si payment_id) | `account_bank_statement_line.py` | 0,5 j |
| 3.1.2 | Construire impacted_documents : [{odoo_model, odoo_id, amount_abs}] ; répartition multi-split (§9.1). **Source amount_abs V1 :** amount_abs = ABS(montant sur move_line rapprochée attribuée à ce payment) — pas le montant du payment (dangereux si partiel). Puis regroupement par payment. Garantit : SUM(amount_abs) = montant ligne bancaire | — | 0,5 j |
| 3.1.3 | Exclure cross-currency : si ligne bancaire devise ≠ payment devise → ne pas inclure ce payment | — | 0,2 j |
| 3.1.4 | idempotency_key stable : reconcil:tenant:bsl:{line_id}:reconcile (ou unreconcile) | — | 0,1 j |
| 3.1.5 | Adapter DVIG format_vault_payload_bank_reconciliation pour transmettre impacted_documents et idempotency_key | `sources/dvig/workers/outbox_worker.py` | 0,3 j |

### User Story 3.2 — Script backfill état courant

> En tant qu'Odoo, je peux lancer un backfill qui émet un événement reconcile par ligne rapprochée (snapshot état courant).

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 3.2.1 | Action serveur ou CRON : parcourir account.bank.statement.line WHERE is_reconciled | `dorevia_vault_connector` | 0,3 j |
| 3.2.2 | Pour chaque ligne : reconstituer impacted_documents (reconciled_move_line_ids → payment) | — | 0,5 j |
| 3.2.3 | Répartition montants, exclusion cross-currency | — | 0,2 j |
| 3.2.4 | Envoi vers DVIG /ingest (ou Vault direct) au format v1.2 | — | 0,2 j |

**DoD Sprint 3 :**
- [ ] Rapprochement temps réel émet impacted_documents
- [ ] Règle multi-split respectée (SUM amount_abs = montant ligne)
- [ ] Backfill exécutable manuellement
- [ ] Contrat Odoo v1.2 documenté

---

## Sprint 4 — Integration : Backfill + double écriture + recette

**Objectif :** Exécuter le backfill ; valider double écriture (RECONCIL + deltas) ; API Treasury confirmation opérationnelle.

### User Story 4.1 — Backfill et recette

> En tant que DevOps, je peux lancer le backfill et vérifier que les deltas sont cohérents.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 4.1.1 | Exécuter backfill Odoo sur tenant sarl-la-platine (ou lab) | — | 0,3 j |
| 4.1.2 | Vérifier table financial_recon_deltas : nombre de lignes attendu | — | 0,1 j |
| 4.1.3 | Vérifier API Treasury : confirmation.total_amount_abs, confirmed_amount_abs, confirmation_rate cohérents avec données métier | — | 0,4 j |

### User Story 4.2 — Double écriture (transition)

> En tant que système, je continue d'écrire dans bank_reconciliation_projection (Position) tout en écrivant dans financial_recon_deltas (confirmation).

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 4.2.1 | S'assurer que le flux RECONCIL existant reste actif (projection Position) | — | — |
| 4.2.2 | Handler v1.2 écrit dans financial_recon_deltas ; pas d'écriture projection depuis ce handler (séparation claire) | — | 0,2 j |
| 4.2.3 | Runbook qualification : étapes de déploiement, ordre Odoo/Vault | `ZeDocs/web32/` | 0,3 j |

**Checks de recette obligatoires :**
- **Check 1 — Invariant multi-split :** Pour chaque `bank_statement_line_id` backfillé : somme des deltas "+" sur cette line = montant ligne (abs), sauf exclusions cross-currency.
- **Check 2 — Invariant document clamp :** Pour chaque document : `confirmed_abs ≤ ABS(amount_signed)`. Vérifier explicitement une fois.

**DoD Sprint 4 :**
- [ ] Backfill exécuté, deltas insérés
- [ ] Check 1 et Check 2 validés
- [ ] API Treasury confirmation renvoie des valeurs cohérentes
- [ ] Projection RECONCIL inchangée (Position)
- [ ] Runbook qualification rédigé

---

## Sprint 5 — Bascule : Retrait proxy + Linky

**Objectif :** Remplacer le proxy Process (lignes de relevé) par les métriques confirmation (événements financiers) ; adapter Linky.

### User Story 5.1 — Bascule métriques Process

> En tant que Linky, je consomme confirmation (total_amount_abs, confirmed_amount_abs, confirmation_rate) pour le bloc Process au lieu du proxy lignes de relevé.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 5.1.1 | Handler Treasury : si confirmation disponible (deltas présents), utiliser confirmation pour process ; sinon fallback proxy (transition douce) | `aggregations_treasury.go` | 0,3 j |
| 5.1.2 | Retirer le fallback Odoo pour process (reconciled_balance, unreconciled_balance) une fois confirmation fiable | — | 0,2 j |

### User Story 5.2 — Linky UI (optionnel)

> En tant qu'utilisateur, je vois le taux de confirmation bancaire (événements financiers) si disponible.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 5.2.1 | TreasuryCardWithPolling : consommer confirmation.confirmation_rate, confirmed_amount_abs, unconfirmed_amount_abs | `TreasuryCardWithPolling.tsx` | 0,3 j |
| 5.2.2 | **Libellé produit :** Afficher "Confirmé par la banque" plutôt que "Traité". Process (ancienne sémantique) = état des lignes bancaires ; Confirmation bancaire (nouvelle) = état des événements financiers. Évite confusion CFO | — | 0,1 j |
| 5.2.3 | Fallback : si confirmation absente, conserver affichage process actuel | — | 0,1 j |

**DoD Sprint 5 :**
- [ ] Bloc Process alimenté par confirmation (priorité) ou proxy (fallback)
- [ ] Linky affiche taux de confirmation si disponible
- [ ] Aucune régression sur Position (RECONCIL conservée)

---

## 6. Dépendances transverses

### DVIG

Le payload v1.2 (impacted_documents, idempotency_key) doit transiter de Odoo → DVIG → Vault. Adapter `format_vault_payload_bank_reconciliation` pour ne pas perdre ces champs.

### Ordre de déploiement

0. Audit Odoo (Sprint 0) — go/no-go avant 3.1
1. Vault migrations (Sprint 1)
2. Vault handler v1.2 (Sprint 2) — accepte nouveau format
3. Odoo payload v1.2 (Sprint 3) — émet nouveau format
4. Backfill (Sprint 4)
5. Bascule (Sprint 5)

### Rétrocompatibilité

- Pendant la transition : événements sans impacted_documents → rejetés ou ignorés (pas de fallback silencieux, amendement B)
- Linky : détection présence de `confirmation` → utiliser en priorité ; sinon process legacy

---

## 7. Risques et parades

| Risque | Parade |
|--------|--------|
| Odoo ne peut pas reconstituer impacted_documents (modèle OCA différent) | Analyser account_reconcile_oca ; adapter traversée reconciled_move_line_ids |
| Backfill partiel (certaines lignes sans payment vaulté) | Ignorer + log ; document vaulté = prérequis |
| Latence SUM(deltas) à l'échelle | Prévoir confirmed_amount_abs_cached ou table agrégat (§13.3) ; non bloquant V1 |
| Multi-devise en production | Cross-currency interdit ; exclure du backfill ; documenter limite |

---

## 8. Références

- **SPEC :** `ZeDocs/web32/SPEC_Confirmation_Bancaire_Stricte_v1.3.md`
- **Matrice d'acceptation :** `ZeDocs/web32/ACCEPTANCE_MATRIX_Confirmation_Bancaire_v1.3.md` — guide de recette et tests unitaires
- **Rapport MOA :** `ZeDocs/web32/RAPPORT_MOA_Confirmation_Bancaire_Stricte_v1.3.md` — suivi avancée, questions
- **Sprint 0 :** `ZeDocs/web32/NOTE_AUDIT_ODOO_RECONCILE.md`, `scripts/snippet_traverse_reconcile_to_payment.py`
- **Rapport avis expert :** `ZeDocs/web32/RAPPORT_AVIS_EXPERT_SPEC_Confirmation_Bancaire_Stricte_v1.2.md`
- **Fichiers impactés :**
  - `sources/vault/migrations/` (nouvelle migration)
  - `sources/vault/internal/storage/` (financial_recon_deltas, amount_signed)
  - `sources/vault/internal/handlers/` (bank_reconciliation ou nouveau handler)
  - `sources/vault/internal/handlers/aggregations_treasury.go`
  - `sources/dvig/workers/outbox_worker.py`
  - `units/odoo/custom-addons/dorevia_vault_connector/models/account_bank_statement_line.py`
  - `units/odoo/custom-addons/dorevia_vault_connector/` (backfill)
  - `units/dorevia-linky/components/TreasuryCardWithPolling.tsx`
