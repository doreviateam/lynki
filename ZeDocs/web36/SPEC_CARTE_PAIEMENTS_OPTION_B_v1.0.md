# SPEC — Carte Paiements Option B (flux payment.reconciled)

**Version :** 1.0  
**Date :** 2026-03-03  
**Statut :** Planification (Étape 4)  
**Référence :** SPEC_CARTE_PAIEMENTS_v1.0.md, AVIS_EXPERT_SPEC_CARTE_PAIEMENTS_v1.0.md

---

## 1. Objectif

Passer du modèle **dérivation** (Option A — `financial_recon_deltas` + `impacted_documents`) au modèle **payment-centric** : Odoo émet des événements `payment.reconciled` / `payment.unreconciled` ; le Vault stocke le statut par paiement ; la carte Paiements agrège directement depuis cette source.

---

## 2. Écart Option A → Option B

| Aspect | Option A | Option B |
|--------|----------|----------|
| **Événement source** | `bank.move.reconciled` (BSL) + `impacted_documents` | `payment.reconciled` / `payment.unreconciled` |
| **Granularité** | Ligne de relevé → documents impactés | Paiement directement |
| **Source de vérité** | Dérivée (`confirmed_abs` depuis deltas) | Stockée (`reconciled` sur document) |
| **Limitation** | Dépend de `impacted_documents` correctement renseigné | Indépendant, événement natif |
| **Paiement partiel** | Géré via `delta_amount_abs` cumulé | Géré via statut `reconciled` (full) ou `partial` |

---

## 3. Flux Option B

```
Odoo (rapprochement bancaire)
    → détection paiement impacté
    → émission payment.reconciled ou payment.unreconciled
        ↓
DVIG (ingest + forward)
        ↓
Vault (handler payment-reconciliation)
    → mise à jour documents.reconciled / documents.reconciled_at
        ↓
Linky (agrégation A, B depuis documents)
```

---

## 4. Événements Odoo

### 4.1 payment.reconciled

**Déclencheur :** Un rapprochement bancaire dans Odoo affecte un paiement (ligne `account.payment` rapprochée avec une ligne de relevé).

**Payload proposé :**

```json
{
  "source": "odoo",
  "event_type": "payment.reconciled",
  "idempotency_key": "payment-reconciled:tenant:payment_id:bsl_id:suffix",
  "data": {
    "db": "laplatine2026",
    "model": "account.payment",
    "id": 901,
    "amount_abs": 700.00,
    "currency": "EUR",
    "occurred_at": "2026-03-03T14:00:00Z",
    "bank_statement_line_id": 123
  }
}
```

**Règle paiement partiel :**  
Si `amount_abs` < montant total du paiement → statut `partial` (ou logique à définir).  
Si `amount_abs` ≥ montant total → `reconciled = true`.

### 4.2 payment.unreconciled

**Déclencheur :** Annulation (dé-rapprochement) d’un rapprochement qui concernait un paiement.

**Payload proposé :**

```json
{
  "source": "odoo",
  "event_type": "payment.unreconciled",
  "idempotency_key": "payment-unreconciled:tenant:payment_id:bsl_id:suffix",
  "data": {
    "db": "laplatine2026",
    "model": "account.payment",
    "id": 901,
    "amount_abs": 700.00,
    "currency": "EUR",
    "occurred_at": "2026-03-03T15:00:00Z",
    "bank_statement_line_id": 123
  }
}
```

**Effet :** Réduction du montant confirmé ; si montant restant = 0 → `reconciled = false`.

---

## 5. Schéma Vault

### 5.1 Option B1 — Champ sur documents (recommandé)

**Migration SQL :**

```sql
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS reconciled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_documents_reconciled
  ON documents(tenant, reconciled)
  WHERE odoo_model = 'account.payment' OR source = 'payment';
```

| Champ | Type | Description |
|-------|------|--------------|
| `reconciled` | BOOLEAN | `true` = rapproché (confirmé par la banque) |
| `reconciled_at` | TIMESTAMPTZ | Date du dernier rapprochement complet |

**Paiement partiel :** En V1, on peut considérer `reconciled = true` uniquement lorsque le montant total est rapproché. Sinon `reconciled = false`. Une évolution ultérieure peut introduire un statut `partial` ou un champ `reconciled_amount_abs`.

### 5.2 Option B2 — Table d’événements (audit)

Table `payment_reconciliation_events` pour traçabilité immuable :

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| tenant | TEXT | Tenant |
| document_id | UUID | FK documents.id |
| event_type | TEXT | `reconciled` ou `unreconciled` |
| amount_abs | NUMERIC(16,2) | Montant concerné |
| occurred_at | TIMESTAMPTZ | Date métier |
| event_uid | TEXT | Clé idempotente UNIQUE |
| ingested_at | TIMESTAMPTZ | DEFAULT now() |

Le statut `reconciled` sur `documents` serait dérivé ou mis à jour par le handler à partir de ces événements. Permet un audit complet des changements d’état.

**Recommandation :** Option B1 pour la V1 (simplicité). Option B2 si exigence d’audit strict.

---

## 6. Handler Vault

**Endpoint :** Extension de l’ingest existant ou nouvel endpoint dédié.

**Logique :**

1. Réception événement `payment.reconciled` ou `payment.unreconciled`
2. Résolution `document_id` depuis `odoo_model` + `odoo_id`
3. Idempotence via `event_uid` ou `idempotency_key`
4. Pour `payment.reconciled` :  
   - Cumuler `amount_abs` par document (si partiel) ou marquer `reconciled = true` si total
5. Pour `payment.unreconciled` :  
   - Réduire le cumul ou mettre `reconciled = false`

---

## 7. Agrégation Linky

Les formules restent identiques à la SPEC Carte Paiements v1.0 :

- **A** = Σ `amount_signed` des documents payment avec `reconciled = false` (ou `reconciled IS NULL`)
- **B** = Σ `amount_signed` des documents payment avec `reconciled = true`
- **Couverture** = `B / (A + B)` si `A + B > 0`

La source change : au lieu de `financial_recon_deltas` (confirmation), on lit directement `documents.reconciled`.

---

## 8. Plan de migration A → B

### 8.1 Prérequis

- Option A opérationnelle
- `financial_recon_deltas` peuplée
- `impacted_documents` correctement émis par Odoo

### 8.2 Étapes

| Ordre | Tâche | Composant |
|-------|-------|-----------|
| 1 | Migration SQL : ajouter `reconciled`, `reconciled_at` sur documents | Vault |
| 2 | Backfill : pour chaque document payment, calculer `reconciled` depuis `financial_recon_deltas` (confirmed_abs ≥ amount_signed) | Vault |
| 3 | Implémenter handler `payment.reconciled` / `payment.unreconciled` | Vault |
| 4 | Implémenter émission Odoo (hook `reconcile_bank_line` ou équivalent) | Odoo |
| 5 | Adapter DVIG pour forward des nouveaux event_types | DVIG |
| 6 | Basculer agrégation treasury/confirmation pour utiliser `documents.reconciled` | Vault |
| 7 | Désactiver ou conserver en parallèle le flux Option A (transition) | — |

### 8.3 Backfill statut reconciled

```sql
-- Pseudo-logique : document reconcilié si confirmed_abs >= amount_signed
UPDATE documents d
SET reconciled = true,
    reconciled_at = (
      SELECT MAX(fr.occurred_at)
      FROM financial_recon_deltas fr
      WHERE fr.document_id = d.id
        AND fr.direction = '+'
    )
WHERE d.odoo_model = 'account.payment' OR d.source = 'payment'
  AND EXISTS (
    SELECT 1 FROM financial_recon_deltas fr
    WHERE fr.document_id = d.id
    HAVING SUM(fr.delta_amount_abs * CASE fr.direction WHEN '+' THEN 1 ELSE -1 END)
           >= COALESCE(ABS(d.amount_signed), 0) - 0.01
  );
```

(À adapter selon le schéma exact de `financial_recon_deltas` et la logique de cumul.)

---

## 9. Estimation de charge

| Composant | Tâche | Estimation |
|-----------|-------|------------|
| **Vault** | Migration SQL + backfill | 0,5 j |
| **Vault** | Handler payment.reconciled / unreconciled | 1 j |
| **Vault** | Adapter agrégation treasury → documents.reconciled | 0,5 j |
| **Odoo** | Hook émission payment.reconciled / unreconciled | 1,5 j |
| **DVIG** | Forward nouveaux event_types | 0,25 j |
| **Linky** | Aucun (API inchangée) | 0 j |
| **Tests** | Tests unitaires + intégration | 1 j |
| **Doc / Runbook** | Mise à jour documentation | 0,25 j |
| **Total** | | **5 j** |

---

## 10. Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Double écriture pendant transition (A et B) | Période de coexistence ; vérifier cohérence A vs B avant bascule |
| Odoo ne peut pas émettre payment.reconciled (hook absent) | Analyser `account.bank.statement.line` ou module OCA ; fallback : enrichissement DVIG depuis bank.move.reconciled + impacted_documents |
| Paiement partiel mal géré | Spécifier règle V1 : reconciled = true uniquement si total rapproché |

---

## 11. Références

- SPEC_CARTE_PAIEMENTS_v1.0.md
- AVIS_EXPERT_SPEC_CARTE_PAIEMENTS_v1.0.md
- SPEC_Confirmation_Bancaire_Stricte_v1.3.md
- PLAN_IMPLEMENTATION_CARTE_PAIEMENTS_v1.0.md (Étape 4)

---

**Fin de la spécification Option B v1.0**
