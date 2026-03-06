#!/bin/bash
# Force le vaulting d'une facture (ID = account.move)
# Usage: ./scripts/force_vault_invoice.sh 2727

INVOICE_ID=${1:?Usage: $0 <invoice_id>}
ODOO_CONTAINER="${ODOO_CONTAINER:-odoo_stinger_sarl-la-platine}"
DB_NAME="${DB_NAME:-odoo_stinger_sarl-la-platine}"

echo "🔄 Vaulting forcé pour la facture ID: $INVOICE_ID (DB: $DB_NAME)"

cat > /tmp/force_vault_${INVOICE_ID}.py << PYEOF
move = env['account.move'].browse(INVOICE_ID)
if not move.exists():
    print("ERROR|Facture %s introuvable" % INVOICE_ID)
    exit(1)
if move.state != 'posted':
    print("ERROR|Facture non postée (state=%s)" % move.state)
    exit(1)
if not move.dorevia_vault_status or move.dorevia_vault_status == 'todo':
    pass
elif move.dorevia_vault_status == 'pending_proof':
    print("INFO|Statut pending_proof - trigger worker + fetch")
elif move.dorevia_vault_status in ('failed_soft', 'failed_hard'):
    if move.dorevia_vault_status == 'failed_hard':
        move.write({'dorevia_vault_status': 'todo', 'dorevia_vault_next_retry_at': False})
        env.cr.commit()
    print("INFO|Relance du vaulting")
else:
    print("ERROR|Statut inattendu: %s" % move.dorevia_vault_status)
    exit(1)
try:
    move.action_securiser_maintenant()
    env.cr.commit()
    print("SUCCESS|Vaulting lancé - statut Protégée attendu sous 5-15 s")
except Exception as e:
    print("ERROR|%s" % str(e))
    exit(1)
PYEOF

sed -i "s/INVOICE_ID/$INVOICE_ID/g" /tmp/force_vault_${INVOICE_ID}.py

docker exec "$ODOO_CONTAINER" odoo shell -d "$DB_NAME" --no-http --stop-after-init < /tmp/force_vault_${INVOICE_ID}.py 2>&1

rm -f /tmp/force_vault_${INVOICE_ID}.py
