# Addendum — Carte Trésorerie (25 février 2026, suite)

---

## 9. Correction sémantique — Valeurs absolues

### Contexte

Clarification métier : **« En attente de rapprochement » = somme des montants (en valeur absolue) des lignes non rapprochées.**

### Modifications

| Fichier | Modification |
|---------|--------------|
| `sources/vault/internal/storage/bank_reconciliation.go` | `GetBankReconciliationProjectionSums` : utilisation de `ABS(amount)` pour reconciled et unreconciled |
| `sources/vault/internal/handlers/aggregations_treasury.go` | Suppression du « gap » ; fiabilité = `reconciled / (reconciled + unreconciled)` ; accounting_balance = total projection |

### Résultat

- **Trésorerie validée** : Σ \|amount\| des lignes rapprochées
- **En attente** : Σ \|amount\| des lignes non rapprochées  
- **Fiabilité** : part du volume des relevés effectivement rapprochée

---

## 10. Backfill et déploiement effectués

| Action | Résultat |
|--------|----------|
| **Backfill RECONCIL** | 5 lignes envoyées vers DVIG, 0 erreur |
| **Ligne 480 k€** | Intégrée dans `bank_reconciliation_projection` (move_id=5, amount=-480000) |
| **Rebuild Vault** | Image `dorevia/vault:vaulting-routes` reconstruite, conteneur recréé |
| **Vérification API** | reconciled_balance=483 400,60 €, unreconciled=0, reliability_rate=100 % |

---

## 11. Annexe technique — Données dans le Vault

### Tables RECONCIL

| Table | Rôle |
|-------|------|
| **bank_reconciliation_events** | Historique (idempotence, traçabilité). Colonnes : tenant, idempotency_key, event_type, move_id, amount, occurred_at |
| **bank_reconciliation_projection** | État courant par ligne. Colonnes : tenant, move_id, is_reconciled, amount, last_transition_at, company_id, account_id |

### Flux

1. Odoo (lettrage OCA) → `reconcile_bank_line()` / `unreconcile_bank_line()` → DVIG
2. DVIG → `POST /api/v1/bank-reconciliation/events` → Vault
3. Vault → INSERT events + UPSERT projection
4. Carte Trésorerie → lecture projection (agrégation Σ \|amount\|)
