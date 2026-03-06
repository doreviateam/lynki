# Runbook — Backfill complet vers le Vault

**Tenant** : laplatine2026 (SARL La Platine)  
**Date** : 2026-03-02

## Remontée rapide (script unique)

```bash
./scripts/remonter_donnees_linky.sh laplatine2026
```

Exécute : backfill factures + paiements, outbox DVIG, preuves, confirmation bancaire.

---

## Objectif

Vaulter toutes les données Odoo :
- **341** factures clients
- **305** factures fournisseurs
- **329** paiements clients
- **342** paiements fournisseurs

---

## Prérequis

- Odoo, DVIG et Vault en cours d'exécution
- `dorevia.dvig.url`, `dorevia.dvig.token`, `dorevia.dvig.internal.token` configurés dans Odoo
- Volume tenant monté dans Odoo : `/mnt/tenant-scripts`

---

## Étape 1 — Backfill des factures

```bash
echo "exec(open('/mnt/tenant-scripts/scripts/backfill_all_invoices_to_vault.py').read())" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
```

---

## Étape 2 — Backfill des paiements

```bash
echo "exec(open('/mnt/tenant-scripts/scripts/backfill_all_payments_to_vault.py').read())" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
```

---

## Étape 3 — Traiter l'outbox DVIG

Le worker DVIG traite les événements un par un. Pour accélérer, lancer en boucle :

```bash
# Traiter jusqu'à épuisement (0 processed)
TOKEN="${DVIG_INTERNAL_TOKEN:-dvig_internal_core-stinger_stinger}"
while true; do
  r=$(docker exec dvig-core-stinger curl -s -X POST \
    http://127.0.0.1:8080/internal/outbox/process \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"limit":100}' 2>/dev/null | grep -o '"processed":[0-9]*' | cut -d: -f2)
  r=${r:-0}
  [ "$r" = "0" ] && break
  echo "  Processed: $r"
  sleep 0.5
done
echo "Outbox traitée."
```

---

## Étape 4 — Vérifications

```bash
# Documents dans le Vault
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "
SELECT source, move_type, COUNT(*) 
FROM documents 
WHERE tenant = 'laplatine2026' 
GROUP BY 1, 2 ORDER BY 1, 2;
"

# État outbox DVIG
docker exec dvig-db-core-stinger psql -U dvig_user -d dvig_db -c "
SELECT status, COUNT(*) FROM outbox_events GROUP BY status;
"

# Paiements dans le Vault
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "
SELECT COUNT(*) as payment_docs 
FROM documents 
WHERE tenant = 'laplatine2026' AND source = 'payment';
"
```

---

## En cas de blocage

### Cron Odoo limité à 50 par run

Relancer manuellement (factures + paiements) :

```bash
for i in 1 2 3 4 5 6 7 8 9 10; do
  echo "env['account.move'].cron_vault_send_dvig(); env['account.payment'].cron_vault_send_payments(); env.cr.commit(); env['dorevia.dvig.service'].trigger_worker(limit=100); print('round $i')" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http 2>/dev/null | grep round
  sleep 2
done
```

### Vérifier les factures en todo

```bash
docker exec odoo_db_lab_laplatine2026 psql -U odoo -d laplatine2026 -c "
SELECT dorevia_vault_status, COUNT(*) 
FROM account_move 
WHERE state = 'posted' AND move_type IN ('out_invoice','in_invoice','out_refund','in_refund')
GROUP BY dorevia_vault_status;
"
```

### Vérifier les paiements en todo

```bash
docker exec odoo_db_lab_laplatine2026 psql -U odoo -d laplatine2026 -c "
SELECT dorevia_vault_status, COUNT(*) 
FROM account_payment 
WHERE state IN ('posted','paid')
GROUP BY dorevia_vault_status;
"
```

---

## Factures manquantes dans le Vault (card Business)

Si la card Business affiche des montants inférieurs à Odoo (factures vaulted dans Odoo mais absentes du Vault) :

### 1. Diagnostic

```bash
./tenants/laplatine2026/scripts/diagnostic_missing_invoices.sh
```

Génère `missing_invoice_ids.txt` avec les IDs à ré-envoyer.

### 2. Ré-envoi des factures manquantes

```bash
echo "exec(open('/mnt/tenant-scripts/scripts/resend_missing_invoices_to_vault.py').read())" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
```

### 3. Traiter l'outbox DVIG

Voir Étape 3 ci-dessus.

### 4. Récupérer les preuves

```bash
echo "exec(open('/mnt/tenant-scripts/scripts/fetch_all_invoice_proofs.py').read())" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
```

---

## Scripts disponibles

| Script | Rôle |
|--------|------|
| `backfill_all_invoices_to_vault.py` | Toutes les factures (client + fournisseur), 15 rounds |
| `backfill_all_payments_to_vault.py` | Tous les paiements (client + fournisseur) |
| `backfill_2026_payments_and_send.py` | Paiements 2026 uniquement |
| `reset_2026_vault_and_send.py` | Factures 2026 uniquement |
| `diagnostic_missing_invoices.sh` | Compare Odoo vs Vault → `missing_invoice_ids.txt` |
| `resend_missing_invoices_to_vault.py` | Ré-envoie les factures listées dans `missing_invoice_ids.txt` |
| `fetch_all_invoice_proofs.py` | Récupère les preuves pour toutes les factures pending_proof |
