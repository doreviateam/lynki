# Diagnostic — Tuiles Linky 2026 incomplètes

**Date** : 2026-03-02  
**Tenant** : laplatine2026 (SARL La Platine)

## État actuel du dashboard 2026

| Tuile | Valeur | Statut |
|-------|--------|--------|
| Business | + 5 391 € | ✅ OK (ventes - achats) |
| Taxes | + 92,20 € | ✅ OK |
| Notes de crédit | + 124,02 € | ✅ OK |
| **Paiements** | — | ❌ Vide |
| **Cash** | 0,00 € | ❌ Vide |
| **Remboursements** | 0,00 € | ❌ Vide |
| **Points de vente** | 0,00 € | ❌ Vide |
| **Z de caisse** | — | ⏳ À venir (non implémenté) |

## Cause racine

### Données dans le Vault (laplatine2026)

```
Documents 2026 :
  - sales    : 82  (factures clients)
  - purchase : 62  (factures fournisseurs)
  - payment  : 0   ← MANQUANT
```

Les tuiles **Paiements**, **Cash** et **Remboursements** s’appuient sur des documents `source = 'payment'` dans le Vault. Il n’y en a aucun pour 2026.

### Flux des paiements

```
Odoo account.payment (todo)
  → DVIG /ingest (payment.posted)
  → Vault POST /api/v1/payments
  → documents.source = 'payment'
```

Les paiements Odoo ne sont pas encore vaultés pour 2026.

## Plan d’action

### 1. Backfill des paiements 2026 (prioritaire)

Mettre les paiements 2026 en `todo` et les envoyer au Vault :

```bash
# Connexion au shell Odoo
docker exec -it odoo_lab_laplatine2026 odoo shell -d laplatine2026

# Dans le shell Python :
n = env['account.payment'].backfill_vault_todo(payment_type='outbound')  # fournisseurs
n += env['account.payment'].backfill_vault_todo(payment_type='inbound')  # clients
print(f"Paiements initialisés en todo : {n}")

# Déclencher l’envoi (ou attendre le CRON Vault Send Payments)
env['dorevia.dvig.service'].trigger_worker(limit=100)
```

Ou via script :

```bash
# Créer un script similaire à reset_2026_vault_and_send.py pour les paiements
tenants/laplatine2026/scripts/backfill_vault_payments.py
```

### 2. Points de vente (POS)

Les tuiles **Points de vente** et **Z de caisse** viennent des sessions POS (pos.order, pos.payment). Si le tenant utilise le POS Odoo, il faut :

- Vérifier que les sessions POS sont envoyées à DVIG
- Vérifier la route Vault pour les POS (pos-sessions)

### 3. Remboursements

Les remboursements sont dérivés des agrégations `refund.customer.paid` et `refund.supplier.received`. Ils peuvent être :

- Inclus dans les factures d’avoir (credit_note)
- Ou envoyés via des événements `payment.posted` avec `is_refund=true`

À vérifier selon le modèle métier Odoo.

## Vérifications après backfill

```bash
# Nombre de documents payment dans le Vault
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c \
  "SELECT source, COUNT(*) FROM documents WHERE tenant = 'laplatine2026' AND source = 'payment' GROUP BY source;"

# Événements outbox DVIG (payment.posted)
docker exec dvig-db-core-stinger psql -U dvig_user -d dvig_db -c \
  "SELECT status, COUNT(*) FROM outbox_events WHERE payload::text LIKE '%payment.posted%' GROUP BY status;"
```

## Références

- `tenants/laplatine2026/scripts/backfill_vault_payments.py` — backfill paiements
- `units/odoo/custom-addons/dorevia_vault_connector/models/account_payment.py` — vaulting paiements
- `sources/vault/internal/storage/aggregations_payments.go` — agrégation payments-in/out
