#!/usr/bin/env bash
# Vérification que les données Odoo (paiements) sont bien vaultées pour le tenant o19.
# Usage : VAULT_URL=http://vault-core-stinger:8080 ./scripts/verifier_vaultage_o19.sh
#         Optionnel : DATE_FROM=2026-01-01 DATE_TO=2030-12-31

set -e

VAULT_URL="${VAULT_URL:-http://localhost:8080}"
TENANT="${TENANT:-o19}"
DATE_FROM="${DATE_FROM:-2026-01-01}"
DATE_TO="${DATE_TO:-2030-12-31}"
COMPANY_ID="${COMPANY_ID:-}"

BASE="${VAULT_URL%/}"
URL="${BASE}/ui/aggregations/payments-completeness?tenant=${TENANT}&date_from=${DATE_FROM}&date_to=${DATE_TO}&list_missing=1"
[[ -n "$COMPANY_ID" ]] && URL="${URL}&company_id=${COMPANY_ID}"

echo "=== Vérification vaultage Odoo → Vault (tenant=${TENANT}) ==="
echo "URL: ${URL}"
echo ""

RESP=$(curl -sS --connect-timeout 5 "$URL") || {
  echo "Erreur: impossible d'appeler le Vault (vérifier VAULT_URL et réseau)."
  exit 1
}

# Parse minimal avec grep/sed si jq absent
if command -v jq >/dev/null 2>&1; then
  OK=$(echo "$RESP" | jq -r '.ok')
  ERP_COUNT=$(echo "$RESP" | jq -r '.erp_count // "?"')
  VAULT_COUNT=$(echo "$RESP" | jq -r '.payments_count // "?"')
  ERP_SUM=$(echo "$RESP" | jq -r '.erp_sum_amount_signed // "?"')
  VAULT_SUM=$(echo "$RESP" | jq -r '.payments_sum_amount_signed // "?"')
  MISSING=$(echo "$RESP" | jq -r '.missing_odoo_ids // [] | length')
  MESSAGE=$(echo "$RESP" | jq -r '.message // ""')
else
  OK=$(echo "$RESP" | sed -n 's/.*"ok": *\(true\|false\).*/\1/p')
  ERP_COUNT=$(echo "$RESP" | sed -n 's/.*"erp_count": *\([0-9]*\).*/\1/p')
  VAULT_COUNT=$(echo "$RESP" | sed -n 's/.*"payments_count": *\([0-9]*\).*/\1/p')
  MISSING=0
  MESSAGE=""
fi

echo "Résultat contrôle complétude paiements :"
echo "  ok                  : ${OK}"
echo "  Odoo  (count)       : ${ERP_COUNT}"
echo "  Vault (count)       : ${VAULT_COUNT}"
echo "  Odoo  (sum signed)  : ${ERP_SUM}"
echo "  Vault (sum signed)  : ${VAULT_SUM}"
if command -v jq >/dev/null 2>&1 && [[ "$MISSING" != "0" ]] && [[ "$MISSING" != "?" ]]; then
  echo "  IDs manquants (Vault): ${MISSING}"
  echo "$RESP" | jq -r '.missing_odoo_ids[]?' 2>/dev/null | sed 's/^/    /'
fi
[[ -n "$MESSAGE" ]] && echo "  message              : ${MESSAGE}"
echo ""

if [[ "$OK" == "true" ]] && [[ "$ERP_COUNT" == "$VAULT_COUNT" ]]; then
  echo "✅ Les données Odoo sont bien vaultées (count Odoo = count Vault)."
  exit 0
elif [[ "$OK" != "true" ]]; then
  echo "⚠️  Contrôle indisponible ou Odoo inaccessible. Vérifier la configuration Vault (ODOO_BANK_RECONCILIATION_URL_O19) et la connectivité vers Odoo."
  exit 2
else
  echo "⚠️  Écart détecté : Odoo a ${ERP_COUNT} paiement(s), Vault a ${VAULT_COUNT}. Voir ZeDocs/web39/VERIFICATION_VAULTAGE_ODOO_O19.md pour rattrapage."
  exit 3
fi
