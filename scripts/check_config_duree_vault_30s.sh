#!/bin/bash
# Vérification de la config pour viser un vaultage ≤ 30 s (objectif AVIS_DUREE_PROCESSUS_VAULT §6)
# Vérifie : dorevia.dvig.internal.url, dorevia.dvig.internal.token, queue_job, et test de l'endpoint internal.
# Usage: ./scripts/check_config_duree_vault_30s.sh

set -euo pipefail

ODOO_DB="${ODOO_DB_CONTAINER:-odoo_db_stinger_sarl-la-platine}"
DB_NAME="${DB_NAME:-odoo_stinger_sarl-la-platine}"

echo "============================================================"
echo "🔧 Vérification config — objectif vaultage ≤ 30 s"
echo "============================================================"
echo ""

OK=0
KO=0

# 1) Paramètres DVIG internal (indispensables pour que job_trigger_worker appelle /internal/outbox/process)
echo "📋 1. Paramètres Odoo (DVIG internal)"
echo "------------------------------------------------------------"
DVIG_URL=$(docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -t -A -c "
  SELECT value FROM ir_config_parameter WHERE key = 'dorevia.dvig.url';
" 2>/dev/null | tr -d '\r\n ')
DVIG_INTERNAL_URL=$(docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -t -A -c "
  SELECT value FROM ir_config_parameter WHERE key = 'dorevia.dvig.internal.url';
" 2>/dev/null | tr -d '\r\n ')
DVIG_INTERNAL_TOKEN=$(docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -t -A -c "
  SELECT value FROM ir_config_parameter WHERE key = 'dorevia.dvig.internal.token';
" 2>/dev/null | tr -d '\r\n ')

if [ -n "$DVIG_URL" ]; then
  echo "   ✅ dorevia.dvig.url = ${DVIG_URL:0:50}..."
  ((OK+=1))
else
  echo "   ❌ dorevia.dvig.url = (non configuré)"
  ((KO+=1))
fi

if [ -n "$DVIG_INTERNAL_URL" ]; then
  echo "   ✅ dorevia.dvig.internal.url = ${DVIG_INTERNAL_URL:0:55}..."
  ((OK+=1))
else
  echo "   ⚠️  dorevia.dvig.internal.url = (vide — Odoo construira depuis dorevia.dvig.url + /internal/outbox/process)"
  echo "      Assurez-vous que dorevia.dvig.url pointe vers le bon DVIG."
fi

if [ -n "$DVIG_INTERNAL_TOKEN" ]; then
  echo "   ✅ dorevia.dvig.internal.token = (configuré, longueur ${#DVIG_INTERNAL_TOKEN})"
  ((OK+=1))
else
  echo "   ❌ dorevia.dvig.internal.token = (non configuré) → job n'appellera pas /internal/outbox/process"
  ((KO+=1))
fi
echo ""

# 2) Test d'atteignabilité de l'endpoint internal (si URL et token présents)
echo "📋 2. Test endpoint /internal/outbox/process"
echo "------------------------------------------------------------"
INTERNAL_URL="${DVIG_INTERNAL_URL:-}"
if [ -z "$INTERNAL_URL" ] && [ -n "$DVIG_URL" ]; then
  INTERNAL_URL="${DVIG_URL%/}/internal/outbox/process"
fi
if [ -n "$INTERNAL_URL" ] && [ -n "$DVIG_INTERNAL_TOKEN" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$INTERNAL_URL" \
    -H "Authorization: Bearer $DVIG_INTERNAL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"limit":1}' \
    --connect-timeout 5 --max-time 10 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ POST $INTERNAL_URL → HTTP $HTTP_CODE (endpoint joignable)"
    ((OK+=1))
  else
    echo "   ⚠️  POST $INTERNAL_URL → HTTP $HTTP_CODE (vérifier réseau / token / Caddy)"
    ((KO+=1))
  fi
else
  echo "   ⏭️  Ignoré (URL ou token manquant)"
fi
echo ""

# 2b) Test depuis le conteneur Odoo (même réseau que les jobs queue_job)
ODOO_APP_CONTAINER="${ODOO_APP_CONTAINER:-odoo_stinger_sarl-la-platine}"
echo "📋 2b. Test depuis le conteneur Odoo (réseau des jobs)"
echo "------------------------------------------------------------"
if [ -n "$INTERNAL_URL" ] && [ -n "$DVIG_INTERNAL_TOKEN" ]; then
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${ODOO_APP_CONTAINER}$"; then
    HTTP_FROM_ODOO=$(docker exec "$ODOO_APP_CONTAINER" curl -s -o /dev/null -w "%{http_code}" -X POST "$INTERNAL_URL" \
      -H "Authorization: Bearer $DVIG_INTERNAL_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"limit":1}' \
      --connect-timeout 5 --max-time 10 2>/dev/null || echo "000")
    if [ "$HTTP_FROM_ODOO" = "200" ]; then
      echo "   ✅ Depuis $ODOO_APP_CONTAINER → HTTP 200 (les jobs peuvent joindre DVIG)"
    else
      echo "   ⚠️  Depuis $ODOO_APP_CONTAINER → HTTP $HTTP_FROM_ODOO (les jobs peuvent échouer → délai ~40–60 s)"
    fi
  else
    echo "   ⏭️  Conteneur $ODOO_APP_CONTAINER non trouvé (test ignoré)"
  fi
else
  echo "   ⏭️  Ignoré (URL ou token manquant)"
fi
echo ""

# 3) Rappel objectif
echo "============================================================"
if [ $KO -eq 0 ] && [ $OK -ge 2 ]; then
  echo "✅ Config compatible avec un vaultage ≤ 30 s (internal outbox + token présents)."
  echo "   En conditions nominales, une nouvelle facture devrait passer en « Protégée » en moins de 30 s."
else
  echo "⚠️  Pour viser ≤ 30 s de façon fiable :"
  echo "   1. Configurer dorevia.dvig.internal.token (même valeur que DVIG_INTERNAL_TOKEN du compose DVIG)."
  echo "   2. Optionnel : dorevia.dvig.internal.url (ex. https://dvig.core-stinger.doreviateam.com/internal/outbox/process)."
  echo "   3. S'assurer que l'URL est joignable depuis le serveur où tourne Odoo (test §2 ci-dessus)."
  echo "   Voir ZeDocs/web14/AVIS_DUREE_PROCESSUS_VAULT.md §6."
fi
echo "============================================================"
