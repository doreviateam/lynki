#!/bin/bash

# Script de test avec 3 tenants
# Usage: ./test_3_tenants.sh

API_URL="https://odoo.lab.core.doreviateam.com/api/v1/constats"
API_TOKEN="sk_test_abc123xyz789"

echo "🧪 Test avec 3 tenants - Dorevia Billing CORE"
echo "=============================================="
echo ""

# Test 1 : Tenant Premium (150 factures)
echo "📤 Test 1/3 : Tenant Premium (150 factures) - Attendu: 18,00 € TTC"
echo "-------------------------------------------------------------------"
RESPONSE1=$(curl -s -X POST "$API_URL" \
  -H "Authorization: api_key $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "constat_id": "11111111-1111-4111-8111-111111111111",
    "tenant": "tenant-premium-1",
    "period": "2026-01",
    "generated_at": "2026-02-01T00:05:23Z",
    "vault_id": "vault-test",
    "volumes": {
      "out_invoice": 150,
      "in_invoice": 0,
      "out_refund": 0,
      "in_refund": 0
    },
    "compliance": {
      "compliant": 120,
      "non_compliant_2026": 20,
      "out_of_scope": 10
    },
    "proofs": {
      "jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test",
      "ledger_hash": "premium-hash-001",
      "documents_count": 150
    }
  }')

echo "$RESPONSE1" | jq '.' 2>/dev/null || echo "$RESPONSE1"
echo ""

# Test 2 : Tenant Standard (2500 factures)
echo "📤 Test 2/3 : Tenant Standard (2500 factures) - Attendu: 300,00 € TTC"
echo "-------------------------------------------------------------------"
RESPONSE2=$(curl -s -X POST "$API_URL" \
  -H "Authorization: api_key $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "constat_id": "22222222-2222-4222-8222-222222222222",
    "tenant": "tenant-standard-1",
    "period": "2026-01",
    "generated_at": "2026-02-01T00:05:23Z",
    "vault_id": "vault-test",
    "volumes": {
      "out_invoice": 2500,
      "in_invoice": 0,
      "out_refund": 0,
      "in_refund": 0
    },
    "compliance": {
      "compliant": 2000,
      "non_compliant_2026": 400,
      "out_of_scope": 100
    },
    "proofs": {
      "jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test",
      "ledger_hash": "standard-hash-002",
      "documents_count": 2500
    }
  }')

echo "$RESPONSE2" | jq '.' 2>/dev/null || echo "$RESPONSE2"
echo ""

# Test 3 : Tenant Starter (75 factures)
echo "📤 Test 3/3 : Tenant Starter (75 factures) - Attendu: 13,50 € TTC"
echo "-------------------------------------------------------------------"
RESPONSE3=$(curl -s -X POST "$API_URL" \
  -H "Authorization: api_key $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "constat_id": "33333333-3333-4333-8333-333333333333",
    "tenant": "tenant-starter-1",
    "period": "2026-01",
    "generated_at": "2026-02-01T00:05:23Z",
    "vault_id": "vault-test",
    "volumes": {
      "out_invoice": 75,
      "in_invoice": 0,
      "out_refund": 0,
      "in_refund": 0
    },
    "compliance": {
      "compliant": 60,
      "non_compliant_2026": 10,
      "out_of_scope": 5
    },
    "proofs": {
      "jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test",
      "ledger_hash": "starter-hash-003",
      "documents_count": 75
    }
  }')

echo "$RESPONSE3" | jq '.' 2>/dev/null || echo "$RESPONSE3"
echo ""

echo "✅ Tests terminés !"
echo ""
echo "📊 Vérifiez dans Odoo :"
echo "   - Dorevia Billing → Constats : 3 constats créés"
echo "   - Comptabilité → Factures : 3 factures générées"
echo "   - Montants attendus :"
echo "     • Premium : 18,00 € TTC"
echo "     • Standard : 300,00 € TTC"
echo "     • Starter : 13,50 € TTC"

