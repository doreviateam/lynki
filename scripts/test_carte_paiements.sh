#!/usr/bin/env bash
# Tests manuels Carte Paiements (SPEC v1.1)
# Prérequis : Vault et Odoo lab laplatine2026 reconstruits avec les modifications
# Usage : ./scripts/test_carte_paiements.sh [--build]

set -e
cd "$(dirname "$0")/.."
NETWORK="${DOREVIA_NETWORK:-dorevia-network}"
VAULT_HOST="${VAULT_HOST:-vault-core-stinger}"
ODOO_LAB_HOST="${ODOO_LAB_HOST:-odoo_lab_laplatine2026}"
LINKY_HOST="${LINKY_HOST:-linky_lab_laplatine2026}"

if [[ "$1" == "--build" ]]; then
  echo "=== Build Vault ==="
  docker build -t dorevia/vault:carte-paiements-test -f sources/vault/Dockerfile sources/vault
  echo "Pensez à redémarrer le conteneur Vault avec cette image."
fi

curl_cmd() {
  local url="$1"
  # Les hostnames (vault-core-stinger, etc.) ne résolvent que depuis le réseau Docker
  docker run --rm --network "$NETWORK" curlimages/curl:latest -sf --max-time 15 "$url" 2>/dev/null || true
}

echo ""
echo "=== 1. Vault GET /ui/aggregations/payments-completeness ==="
# Depuis le host, si le Vault expose un port ; sinon via réseau Docker
RESP=$(curl_cmd "http://${VAULT_HOST}:8080/ui/aggregations/payments-completeness?tenant=laplatine2026&date_from=2026-01-01&date_to=2026-01-31" 2>/dev/null || true)
if [[ -n "$RESP" ]]; then
  echo "$RESP" | head -c 500
  echo ""
  if echo "$RESP" | grep -q '"ok"'; then
    echo "→ Structure OK (champ ok présent)"
  else
    echo "→ Vérifier : l'endpoint existe ? Rebuild Vault nécessaire ?"
  fi
else
  echo "→ Échec (Vault inaccessible ou endpoint absent). Rebuild requis."
fi

echo ""
echo "=== 2. Odoo GET /dorevia/vault/linky_bank_reconciliation (payments_posted_*) ==="
RESP2=$(curl_cmd "http://${ODOO_LAB_HOST}:8069/dorevia/vault/linky_bank_reconciliation?tenant=laplatine2026&date_from=2026-01-01&date_to=2026-01-31" 2>/dev/null || true)
if [[ -n "$RESP2" ]]; then
  if echo "$RESP2" | grep -q 'payments_posted_count'; then
    echo "→ payments_posted_count et payments_posted_sum_amount_signed présents"
    echo "$RESP2" | grep -o '"payments_posted_[^"]*":[^,}]*'
  else
    echo "→ Champs payments_posted_* absents. Mise à jour Odoo requise."
  fi
else
  echo "→ Odoo inaccessible ou endpoint non disponible."
fi

echo ""
echo "=== 3. Linky GET /api/treasury (completeness_check) ==="
# Linky sur le réseau Docker (ou localhost si exposé)
LINKY_URL="${LINKY_URL:-}"
if [[ -z "$LINKY_URL" ]]; then
  RESP3=$(curl_cmd "http://${LINKY_HOST}:3000/api/treasury?tenant=laplatine2026&date_debut=2026-01-01&date_fin=2026-01-31")
else
  RESP3=$(curl -sf "${LINKY_URL}/api/treasury?tenant=laplatine2026&date_debut=2026-01-01&date_fin=2026-01-31" 2>/dev/null || true)
fi
if [[ -n "$RESP3" ]]; then
  if echo "$RESP3" | grep -q 'completeness_check'; then
    echo "→ completeness_check présent"
    echo "$RESP3" | grep -o '"completeness_check":{[^}]*}'
  else
    echo "→ completeness_check absent. Rebuild Linky requis."
  fi
else
  echo "→ Linky inaccessible. Définir LINKY_URL (ex. http://localhost:3000) ou exécuter depuis le réseau Docker."
fi

echo ""
echo "=== Fin des tests manuels ==="
