#!/usr/bin/env bash
# Liste les constats décaissements (paiements outbound) dans le Vault pour un tenant et une période.
# Usage:
#   ./scripts/list_payments_out_events.sh
#   VAULT_URL=http://vault-core-stinger:8080 ./scripts/list_payments_out_events.sh  # depuis réseau Docker
#
# Réponse : agrégation + tableau events[] (source_id = ID Odoo account.payment, amount, payment_date) si le Vault déployé inclut list=1.

set -e
# Par défaut : URL publique core-stinger (accessible depuis serveur distant)
VAULT_URL="${VAULT_URL:-https://vault.core-stinger.doreviateam.com}"
TENANT="${TENANT:-sarl-la-platine}"
DATE_DEBUT="${DATE_DEBUT:-2026-01-01}"
DATE_FIN="${DATE_FIN:-2026-03-31}"

url="${VAULT_URL%/}/ui/aggregations/payments-out?tenant=${TENANT}&date_debut=${DATE_DEBUT}&date_fin=${DATE_FIN}&granularity=month&list=1"
echo "GET $url" >&2
curl -s -H "Accept: application/json" "$url" | jq .
