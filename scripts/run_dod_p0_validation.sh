#!/usr/bin/env bash
# DoD P0 — Validation staging E2E
# Procédure : Odoo vierge + modules → Backfill/Seed → Job apply → Vérifications

set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "=== DoD P0 Validation E2E ==="

# 1. Postgres test (vault-test-db)
if ! docker ps --format '{{.Names}}' | grep -q vault-test-db; then
  echo "[1/6] Démarrage Postgres test..."
  docker start vault-test-db 2>/dev/null || \
  docker run -d --name vault-test-db \
    -e POSTGRES_USER=vault_test -e POSTGRES_PASSWORD=vault_test_pass \
    -e POSTGRES_DB=dorevia_vault_test -p 5433:5432 postgres:16
  sleep 3
fi

# 2. Seed + tables (via test)
echo "[2/6] Chargement dataset régression (tables + seed)..."
export TEST_DATABASE_URL="postgresql://vault_test:vault_test_pass@localhost:5433/dorevia_vault_test?sslmode=disable"
cd "$ROOT/sources/vault"
go test -run TestReplayRegression_DatasetAndDryRun ./tests/integration/... -count=1 -v 2>&1 | tail -20
cd "$ROOT"

# 3. Odoo vierge
echo "[3/6] Démarrage Odoo (lab)..."
cd "$ROOT/units/odoo"
docker compose -f docker-compose.yml up -d 2>/dev/null || true
sleep 20
echo "    Odoo: http://localhost:18069"
if [ -z "$SKIP_ODOO_PROMPT" ]; then
  read -p "    Installer dorevia_core + dorevia_adapter_odoo18 dans Odoo, puis Entrée pour continuer..."
fi

# 4. Vault
echo "[4/6] Démarrage Vault..."
# Libérer le port 8080 si une instance Vault tourne déjà
if PID=$(lsof -t -i:8080 2>/dev/null); then
  echo "    Arrêt instance existante sur 8080 (PID $PID)..."
  kill $PID 2>/dev/null || true
  sleep 2
fi
export DATABASE_URL="$TEST_DATABASE_URL"
cd "$ROOT/sources/vault"
go run ./cmd/vault &
VAULT_PID=$!
sleep 5
cd "$ROOT"

# 5. Job apply
echo "[5/6] Création job apply..."
JOB_RESP=$(curl -s -X POST http://localhost:8080/api/v1/replay/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "tenant": "regression-tenant",
    "mode": "apply",
    "range": {"from": "2026-01-01", "to": "2026-02-01"},
    "options": {"odoo_url": "http://localhost:18069", "odoo_database": "dorevia_p0", "odoo_user": "admin", "odoo_password": "admin"}
  }' 2>/dev/null || echo '{}')

JOB_ID=$(echo "$JOB_RESP" | grep -o '"job_id":"[^"]*"' | cut -d'"' -f4)
if [ -z "$JOB_ID" ]; then
  JOB_ID=$(echo "$JOB_RESP" | grep -o '"job_id": "[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$JOB_ID" ]; then
  echo "    ⚠️  Création job échouée. Réponse: $JOB_RESP"
  echo "    Vérifier: Odoo accessible, modules installés, auth admin/admin"
else
  echo "    Job créé: $JOB_ID"
  echo "    Attente traitement (Runner poll 5s)..."
  sleep 15
  echo "    Report: curl http://localhost:8080/api/v1/replay/jobs/$JOB_ID/report"
fi

# 6. Arrêt
kill $VAULT_PID 2>/dev/null || true

echo ""
echo "=== Vérifications manuelles ==="
echo "1. Odoo http://localhost:18069 : Partners (P001,P002,P003), Factures, Paiements"
echo "2. Relancer job apply → tous skipped (pas de doublon)"
echo "3. Logs + report via API"
