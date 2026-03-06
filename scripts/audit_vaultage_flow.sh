#!/bin/bash
# Audit du flux de vaultage : Odoo → DVIG → Vault
# Facture exemple : 2727 (FAC/2026/00069), event_id ad2283f7-b410-48df-9272-2148d662dcb4
#
# Usage: ./scripts/audit_vaultage_flow.sh [invoice_id]
# Exemple: ./scripts/audit_vaultage_flow.sh 2727

INVOICE_ID="${1:-2727}"
VAULT_URL="${VAULT_URL:-https://vault.core-stinger.doreviateam.com}"
DVIG_URL="${DVIG_URL:-https://dvig.core-stinger.doreviateam.com}"

echo "═══════════════════════════════════════════════════════════════"
echo "  AUDIT FLUX VAULTAGE — Facture $INVOICE_ID"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Vault — Endpoint proof existe ?
echo "1️⃣  VAULT — Vérification endpoint /api/v1/proof/account_move/$INVOICE_ID"
echo "   URL: $VAULT_URL/api/v1/proof/account_move/$INVOICE_ID"
PROOF_RESP=$(curl -s -w "\n%{http_code}" "$VAULT_URL/api/v1/proof/account_move/$INVOICE_ID" 2>/dev/null)
PROOF_BODY=$(echo "$PROOF_RESP" | head -n -1)
PROOF_CODE=$(echo "$PROOF_RESP" | tail -1)
if [ "$PROOF_CODE" = "200" ]; then
    echo "   ✅ 200 OK — Preuve trouvée"
    echo "$PROOF_BODY" | head -5
elif [ "$PROOF_CODE" = "404" ]; then
    echo "   ⚠️  404 — Preuve absente OU route inexistante"
    echo "   Corps: $(echo "$PROOF_BODY" | head -1)"
else
    echo "   ❌ HTTP $PROOF_CODE"
    echo "   Corps: $PROOF_BODY"
fi
echo ""

# 2. Vault — Endpoint invoices existe (POST)
echo "2️⃣  VAULT — Vérification endpoint POST /api/v1/invoices"
INV_OPTIONS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$VAULT_URL/api/v1/invoices" 2>/dev/null)
INV_GET=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$VAULT_URL/api/v1/invoices" 2>/dev/null)
echo "   GET /api/v1/invoices → HTTP $INV_GET (405 attendu = POST only)"
if [ "$INV_GET" = "405" ]; then
    echo "   ✅ Endpoint invoices présent (accepte POST uniquement)"
else
    echo "   ⚠️  Réponse inattendue — route peut être absente"
fi
echo ""

# 3. DVIG — Health
echo "3️⃣  DVIG — Health check"
DVIG_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$DVIG_URL/health" 2>/dev/null)
echo "   GET $DVIG_URL/health → HTTP $DVIG_HEALTH"
echo ""

# 4. Outbox DVIG (nécessite accès DB ou internal API)
echo "4️⃣  DVIG — Événement dans outbox (event_id ad2283f7...)"
echo "   → Requiert accès à la DB dorevia_vault ou endpoint /internal/vault-health"
echo "   → docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -t -c \\"
echo "     \"SELECT event_id, status, last_error, attempt_count FROM outbox_events WHERE event_id = 'ad2283f7-b410-48df-9272-2148d662dcb4';\""
echo ""

# 5. Vault DB — Document pour odoo_id 2727
echo "5️⃣  VAULT DB — Document account.move / odoo_id $INVOICE_ID"
echo "   → docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -t -c \\"
echo "     \"SELECT id, odoo_model, odoo_id, tenant, created_at FROM documents WHERE odoo_model='account.move' AND odoo_id=$INVOICE_ID;\""
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "  SYNTHÈSE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Points de défaillance possibles :"
echo "  • Vault : routes /api/v1/proof/* ou /api/v1/invoices absentes (main.go minimal)"
echo "  • DVIG : événement bloqué en accepted/failed_soft dans outbox"
echo "  • DVIG → Vault : 401/403 (auth), 404 (route), 4xx/5xx (rejet)"
echo "  • Vault : document créé mais odoo_id non renseigné (patch _patch_vault_odoo_id)"
echo ""
