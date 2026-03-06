#!/usr/bin/env bash
# Remonter les données Odoo vers le Vault pour alimenter Linky
# Usage: ./scripts/remonter_donnees_linky.sh [tenant]
# Tenant par défaut: laplatine2026
#
# Étapes:
#   1. Backfill factures + paiements (Odoo → todo)
#   2. Envoi DVIG (cron send)
#   3. Traitement outbox DVIG (→ Vault)
#   4. Récupération preuves (pending_proof → vaulted)
#   5. Backfill confirmation bancaire (rapprochements → financial_recon_deltas)
#   6. Vérifications

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TENANT="${1:-laplatine2026}"
ODOO_CONTAINER="odoo_lab_laplatine2026"
ODOO_DB="laplatine2026"
DVIG_CONTAINER="dvig-core-stinger"
VAULT_DB_CONTAINER="vault-db-core-stinger"
TOKEN="${DVIG_INTERNAL_TOKEN:-dvig_internal_core-stinger_stinger}"

SCRIPT_DIR="$ROOT/tenants/laplatine2026/scripts"

echo "=== Remontée des données Linky — tenant: $TENANT ==="
echo ""

# Vérifier que les conteneurs existent
if ! docker ps --format '{{.Names}}' | grep -q "^${ODOO_CONTAINER}$"; then
  echo "ERREUR: Conteneur Odoo $ODOO_CONTAINER non trouvé."
  echo "Lancez d'abord: cd tenants/$TENANT && docker compose -f apps/odoo/lab/docker-compose.yml up -d"
  exit 1
fi

echo "1/6 — Backfill factures..."
if [ -f "$SCRIPT_DIR/backfill_all_invoices_to_vault.py" ]; then
  docker cp "$SCRIPT_DIR/backfill_all_invoices_to_vault.py" "$ODOO_CONTAINER:/tmp/backfill_inv.py"
  echo "exec(open('/tmp/backfill_inv.py').read())" | docker exec -i "$ODOO_CONTAINER" odoo shell -d "$ODOO_DB" --no-http
else
  echo "  Fichier absent: $SCRIPT_DIR/backfill_all_invoices_to_vault.py"
fi

echo ""
echo "2/6 — Backfill paiements..."
if [ -f "$SCRIPT_DIR/backfill_all_payments_to_vault.py" ]; then
  docker cp "$SCRIPT_DIR/backfill_all_payments_to_vault.py" "$ODOO_CONTAINER:/tmp/backfill_pay.py"
  echo "exec(open('/tmp/backfill_pay.py').read())" | docker exec -i "$ODOO_CONTAINER" odoo shell -d "$ODOO_DB" --no-http
else
  echo "  Fallback: backfill inline..."
  docker exec -i "$ODOO_CONTAINER" odoo shell -d "$ODOO_DB" --no-http << 'PYTHON'
Payment = env["account.payment"].sudo()
total = 0
while True:
    n = Payment.backfill_vault_todo(payment_type=None)
    total += n
    if n == 0: break
env.cr.commit()
print(f"Backfill: {total} paiements todo")
for i in range(15):
    Payment.cron_vault_send_payments()
    env.cr.commit()
    env["dorevia.dvig.service"].trigger_worker(limit=100)
    if i < 14: print(f"  Round {i+1}/15 OK")
print("Paiements envoyés.")
PYTHON
fi

echo ""
echo "3/6 — Traitement outbox DVIG (Odoo → Vault)..."
COUNT=0
while true; do
  r=$(docker exec "$DVIG_CONTAINER" curl -s -X POST \
    http://127.0.0.1:8080/internal/outbox/process \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"limit":100}' 2>/dev/null | grep -o '"processed":[0-9]*' | cut -d: -f2)
  r=${r:-0}
  [ "$r" = "0" ] && break
  echo "  Processed: $r"
  COUNT=$((COUNT + r))
  sleep 0.5
done
echo "  Outbox traitée. Total: $COUNT événements."

echo ""
echo "4/6 — Récupération preuves (pending_proof → vaulted)..."
echo "
Payment = env['account.payment'].sudo()
cfg = Payment._dvig_config()
vault_url = cfg.get('vault_url') or ''
if vault_url:
    pending = Payment.search([('dorevia_vault_status','=','pending_proof')], limit=100)
    for p in pending:
        try: p._fetch_and_apply_proof(vault_url)
        except Exception as e: print(f'  proof error {p.id}: {e}')
    env.cr.commit()
    print(f'Preuves traitées: {len(pending)}')
else:
    print('vault_url non configuré, skip preuves')
" | docker exec -i "$ODOO_CONTAINER" odoo shell -d "$ODOO_DB" --no-http 2>/dev/null || echo "  (Skip si erreur)"

echo ""
echo "5/6 — Backfill confirmation bancaire (rapprochements → financial_recon_deltas)..."
echo "
n = env['account.bank.statement.line'].backfill_reconciliation_confirmation_events(batch_size=500)
env.cr.commit()
print(f'Backfill confirmation: {n} événements envoyés')
" | docker exec -i "$ODOO_CONTAINER" odoo shell -d "$ODOO_DB" --no-http 2>/dev/null || echo "  (Skip si addon non à jour)"

# Re-traiter outbox après confirmation
echo "  Re-traitement outbox DVIG (confirmation)..."
while true; do
  r=$(docker exec "$DVIG_CONTAINER" curl -s -X POST \
    http://127.0.0.1:8080/internal/outbox/process \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"limit":100}' 2>/dev/null | grep -o '"processed":[0-9]*' | cut -d: -f2)
  r=${r:-0}
  [ "$r" = "0" ] && break
  echo "    Processed: $r"
  sleep 0.5
done

echo ""
echo "6/6 — Vérifications..."
docker exec "$VAULT_DB_CONTAINER" psql -U vault -d dorevia_vault -c "
SELECT source, COALESCE(move_type,'payment') as typ, COUNT(*) 
FROM documents 
WHERE tenant = '$TENANT' 
GROUP BY 1, 2 ORDER BY 1, 2;
" 2>/dev/null || echo "  (Vault DB non accessible)"

echo ""
echo "=== Terminé. Rafraîchissez Linky (cache ~45 s). ==="
