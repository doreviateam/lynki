#!/usr/bin/env bash
# Test d'intégrité post-migration AR by Partner.
# Vérifie : colonnes OK, POST residual, GET ar-by-partner.
# Usage : VAULT_URL=http://localhost:8080 [DATABASE_URL=...] ./scripts/test_ar_by_partner_integrity.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

VAULT_URL="${VAULT_URL:-http://localhost:8080}"
TENANT="${TENANT:-core}"
COMPANY_ID="${COMPANY_ID:-odoo:1}"

echo -e "${GREEN}📋 Test intégrité AR by Partner${NC}"
echo "   Vault: $VAULT_URL"
echo "   Tenant: $TENANT"
echo ""

# 1. Vérifier colonnes (si DATABASE_URL dispo)
if [ -n "${DATABASE_URL:-}" ] && command -v psql &>/dev/null; then
    echo -e "${YELLOW}▶ Vérification colonnes documents...${NC}"
    COLS=$(psql "$DATABASE_URL" -t -A -c "
        SELECT string_agg(column_name, ', ')
        FROM information_schema.columns
        WHERE table_name = 'documents'
        AND column_name IN ('amount_residual', 'invoice_date_due', 'partner_id', 'last_residual_event_at');
    " 2>/dev/null)
    if echo "$COLS" | grep -q amount_residual; then
        echo -e "${GREEN}   ✅ Colonnes AR présentes${NC}"
    else
        echo -e "${RED}   ❌ Colonnes manquantes. Exécutez run_ar_by_partner_migrations.sh${NC}"
        exit 1
    fi

    if psql "$DATABASE_URL" -t -c "SELECT 1 FROM residual_events_idempotency LIMIT 0;" &>/dev/null; then
        echo -e "${GREEN}   ✅ Table residual_events_idempotency OK${NC}"
    else
        echo -e "${RED}   ❌ Table residual_events_idempotency manquante${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}   ⚠️ DATABASE_URL non défini ou psql absent — skip vérif colonnes${NC}"
fi

# 2. Health Vault
echo ""
echo -e "${YELLOW}▶ Health Vault...${NC}"
if curl -sf "$VAULT_URL/health" >/dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Vault répond${NC}"
else
    echo -e "${RED}   ❌ Vault inaccessible ($VAULT_URL/health)${NC}"
    echo "   Démarrez le Vault ou définissez VAULT_URL."
    exit 1
fi

# 3. GET ar-by-partner (doit répondre, même vide)
echo ""
echo -e "${YELLOW}▶ GET /ui/aggregations/ar-by-partner...${NC}"
AR_RESP=$(curl -sf "$VAULT_URL/ui/aggregations/ar-by-partner?tenant=$TENANT&date_debut=2020-01-01&date_fin=2030-12-31" 2>/dev/null || echo "{}")
if echo "$AR_RESP" | grep -q '"totals"'; then
    echo -e "${GREEN}   ✅ Agrégation AR OK${NC}"
    echo "$AR_RESP" | python3 -c "
import json,sys
d=json.load(sys.stdin)
t=d.get('totals',{})
print('      totals:', 'open_amount=', t.get('open_amount',0), 'overdue_amount=', t.get('overdue_amount',0))
print('      meta.freshness:', d.get('meta',{}).get('freshness','?'))
" 2>/dev/null || echo "   (réponse reçue)"
else
    echo -e "${RED}   ❌ Réponse agrégation invalide${NC}"
    echo "$AR_RESP"
    exit 1
fi

# 4. POST residual (test avec doc inexistant → 404 attendu)
echo ""
echo -e "${YELLOW}▶ POST /api/v1/invoices/residual (doc inexistant → 404 attendu)...${NC}"
RESIDUAL_RESP=$(curl -sf -w "\n%{http_code}" -X POST "$VAULT_URL/api/v1/invoices/residual" \
  -H "Content-Type: application/json" \
  -d "{
    \"tenant\": \"$TENANT\",
    \"company_id\": \"$COMPANY_ID\",
    \"source\": {\"model\": \"account.move\", \"id\": \"999999999\"},
    \"invoice\": {\"amount_residual\": 100.50, \"invoice_date_due\": \"2025-12-31\"},
    \"partner\": {\"partner_id\": \"123\"},
    \"change\": {\"changed_at\": \"2025-02-21T12:00:00Z\"},
    \"idempotency\": {\"event_id\": \"test-integrity-$(date +%s)\"}
  }" 2>/dev/null || echo -e "\n000")
HTTP_CODE=$(echo "$RESIDUAL_RESP" | tail -1)
BODY=$(echo "$RESIDUAL_RESP" | sed '$d')
if [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}   ✅ 404 attendu (document non vaulté) — route residual OK${NC}"
elif [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
    echo -e "${YELLOW}   ⚠️ $HTTP_CODE — route accessible (auth/payload à vérifier)${NC}"
else
    echo -e "${YELLOW}   ⚠️ HTTP $HTTP_CODE — $BODY${NC}"
fi

echo ""
echo -e "${GREEN}✅ Test intégrité terminé${NC}"
echo "   Pour un test complet avec document existant :"
echo "   1. Vault une facture via invoice.posted (avec amount_residual, invoice_date_due)"
echo "   2. POST residual sur cette facture"
echo "   3. GET ar-by-partner — le partenaire doit apparaître"
