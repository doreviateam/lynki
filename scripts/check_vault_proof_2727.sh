#!/bin/bash
# Vérifie si le Vault a une preuve pour la facture 2727
VAULT_URL="${VAULT_URL:-https://vault.core-stinger.doreviateam.com}"

echo "=== Vérification preuve facture 2727 ==="
echo "URL: $VAULT_URL/api/v1/proof/account_move/2727"
echo ""
curl -s -w "\nHTTP %{http_code}\n" "$VAULT_URL/api/v1/proof/account_move/2727" | head -50
