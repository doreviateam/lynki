#!/bin/bash
# Script de test pour Sprint 1 - SPEC 1
# Usage: ./tests/sprint1_test.sh

set -euo pipefail

echo "🧪 Tests Sprint 1 - SPEC 1 : Vaulting account.move posted"
echo "=========================================================="
echo ""

# Vérifier que TEST_DATABASE_URL est défini
if [ -z "${TEST_DATABASE_URL:-}" ]; then
    echo "❌ ERREUR: TEST_DATABASE_URL n'est pas défini"
    echo "   Exemple: export TEST_DATABASE_URL='postgres://user:pass@localhost/vault_test'"
    exit 1
fi

echo "✅ TEST_DATABASE_URL défini"
echo ""

# Aller dans le répertoire vault
cd sources/vault || exit 1

echo "📋 Tests unitaires - Validation account.move"
echo "--------------------------------------------"
go test -v ./tests/unit -run "TestValidateAccountMovePayload" -count=1 || {
    echo "❌ Tests unitaires échoués"
    exit 1
}

echo ""
echo "📋 Tests d'intégration - Validation et Idempotence"
echo "---------------------------------------------------"
go test -v ./tests/integration -run "TestAccountMove" -count=1 || {
    echo "❌ Tests d'intégration échoués"
    exit 1
}

echo ""
echo "✅ Tous les tests Sprint 1 sont passés !"
echo ""
echo "📊 Résumé :"
echo "  ✅ AC-1 à AC-4 : Payloads valides (out_invoice, in_invoice, out_refund, in_refund)"
echo "  ✅ AC-5 à AC-6 : États invalides rejetés (draft, cancel)"
echo "  ✅ AC-7 : move_type invalide rejeté"
echo "  ✅ AC-8 : source/move_type mismatch rejeté"
echo "  ✅ AC-9 : tenant manquant rejeté"
echo "  ✅ AC-10 : Idempotence (tenant, sha256) fonctionnelle"
