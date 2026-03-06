#!/usr/bin/env bash
# Vérifie que l'URL HTTPS n8n.<env>.<tenant>.doreviateam.com répond (depuis le serveur).
# Usage: ./scripts/check_https_n8n.sh <tenant> [env]
# Exemple: ./scripts/check_https_n8n.sh core lab
# Code de sortie: 0 si HTTP 200/301/302/401 (OK), 1 sinon.

set -euo pipefail

TENANT="${1:?tenant requis}"
ENV="${2:-lab}"
URL="https://n8n.${ENV}.${TENANT}.doreviateam.com"

echo "Vérification HTTPS — $URL"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 "$URL" 2>/dev/null || echo "000")

case "$HTTP_CODE" in
  200|301|302|401)
    echo "OK  HTTP $HTTP_CODE — n8n répond (TLS OK)"
    exit 0
    ;;
  000)
    echo "KO  Pas de réponse (timeout, DNS ou SSL refusé)"
    exit 1
    ;;
  *)
    echo "KO  HTTP $HTTP_CODE"
    exit 1
    ;;
esac
