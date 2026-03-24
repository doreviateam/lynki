#!/usr/bin/env bash
# Diagnostic : "Analyse indisponible (service temporairement arrêté)"
# Ce message apparaît quand Lynki reçoit state=pending pendant ~72 s (12 polls × 6 s).
# Causes possibles : runner arrêté, pas d'insight en base pour ce contexte, Diva/Vault down.

set -e
TENANT="${1:-laplatine2026}"
COMPANY_ID="${2:-1}"

echo "=== Diagnostic Diva / Insight Lynki ==="
echo "Tenant: $TENANT  Company ID: $COMPANY_ID"
echo ""

echo "1. Conteneurs (attendu : diva, diva-runner, vault-core-stinger)"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep -E "diva|vault" || true
if ! docker ps --format "{{.Names}}" 2>/dev/null | grep -qx "diva"; then
  echo "   → diva non démarré : démarrer units/diva (docker compose up -d) avec DIVA_DATABASE_URL vers la base Vault."
fi
if ! docker ps --format "{{.Names}}" 2>/dev/null | grep -qx "diva-runner"; then
  echo "   → diva-runner non démarré : idem, et vérifier RUNNER_TENANT_CONFIG (ex. laplatine2026:1) et LINKY_URL (ex. http://linky_lab_laplatine2026:3000)."
fi
echo ""

echo "2. Diva health"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/health 2>/dev/null || true
echo " (attendu 200 si Diva exposé sur 8010)"
echo ""

echo "3. Vault gateway Diva (depuis l’hôte, si Vault sur 8080)"
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/ui/diva/insights?tenant=$TENANT&company_id=$COMPANY_ID&date_start=2025-01-01&date_end=2025-03-31" 2>/dev/null || true
echo " (attendu 200 avec state ready ou pending)"
echo ""

echo "4. Logs runner (dernières lignes)"
docker logs diva-runner 2>&1 | tail -20 || true
echo ""

echo "5. Variables runner (à vérifier manuellement)"
docker exec diva-runner env 2>/dev/null | grep -E "RUNNER_|LINKY_URL|DIVA_URL" || true
echo ""

echo "6. Base diva_insights (si accès psql Vault)"
echo "   Commande exemple : docker exec -i vault-db-core-stinger psql -U vault -d dorevia_vault -c \"SELECT tenant, company_id, date_start, date_end, status, created_at FROM diva_insights WHERE tenant = '$TENANT' ORDER BY created_at DESC LIMIT 5;\""
echo ""
echo "=== Fin diagnostic ==="
