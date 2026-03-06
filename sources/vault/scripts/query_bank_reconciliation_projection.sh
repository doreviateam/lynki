#!/usr/bin/env bash
# ============================================
# Script : Interrogation bank_reconciliation_projection
# Chantier : Confirmation Bancaire Stricte v1.3 (web32)
# Usage : Liste les moves de la projection pour un tenant/company
# ============================================

set -euo pipefail

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Paramètres par défaut
TENANT="${TENANT:-sarl-la-platine}"
COMPANY_ID="${COMPANY_ID:-2}"
CONTAINER="${VAULT_DB_CONTAINER:-vault-db-sarl-la-platine}"

# Usage
usage() {
    echo "Usage: $0 [--tenant TENANT] [--company COMPANY_ID] [--container CONTAINER]"
    echo ""
    echo "Options:"
    echo "  --tenant     Tenant (défaut: sarl-la-platine)"
    echo "  --company    Company ID (défaut: 2 = Sweet Manihot)"
    echo "  --container  Nom du conteneur Postgres Vault (défaut: vault-db-sarl-la-platine)"
    echo ""
    echo "Variables d'environnement: TENANT, COMPANY_ID, VAULT_DB_CONTAINER, DATABASE_URL"
    echo ""
    echo "Exemples:"
    echo "  $0"
    echo "  TENANT=sarl-la-platine COMPANY_ID=2 $0"
    echo "  $0 --company 1"
}

# Parse args
while [[ $# -gt 0 ]]; do
    case "$1" in
        --tenant)     TENANT="$2"; shift 2 ;;
        --company)    COMPANY_ID="$2"; shift 2 ;;
        --container)  CONTAINER="$2"; shift 2 ;;
        -h|--help)    usage; exit 0 ;;
        *)            echo "Option inconnue: $1"; usage; exit 1 ;;
    esac
done

# Validation des paramètres (sécurité)
if [[ ! "$TENANT" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$ ]]; then
    echo -e "${RED}Tenant invalide (slug DNS attendu): ${TENANT}${NC}"
    exit 1
fi
if [[ ! "$COMPANY_ID" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}company_id invalide (entier attendu): ${COMPANY_ID}${NC}"
    exit 1
fi

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}bank_reconciliation_projection${NC}"
echo -e "${BLUE}tenant=${TENANT} company_id=${COMPANY_ID}${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Mode 1 : DATABASE_URL fourni (connexion directe psql)
if [[ -n "${DATABASE_URL:-}" ]]; then
    echo -e "${GREEN}✓ Utilisation de DATABASE_URL${NC}"
    if ! psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c "
        SELECT move_id, is_reconciled, amount, last_transition_at, account_id, company_id
        FROM bank_reconciliation_projection
        WHERE tenant = '${TENANT}' AND company_id = ${COMPANY_ID}
        ORDER BY move_id;
    "; then
        echo -e "${RED}Erreur requête (psql)${NC}"
        exit 1
    fi
    echo ""
    echo -e "${YELLOW}Résumé agrégé :${NC}"
    psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -t -A -F " | " -c "
        SELECT
            COUNT(*) AS nb_lignes,
            SUM(CASE WHEN is_reconciled THEN 1 ELSE 0 END) AS nb_rapprochees,
            SUM(CASE WHEN NOT is_reconciled THEN 1 ELSE 0 END) AS nb_non_rapprochees,
            SUM(amount) AS total_amount
        FROM bank_reconciliation_projection
        WHERE tenant = '${TENANT}' AND company_id = ${COMPANY_ID};
    "
    exit 0
fi

# Mode 2 : docker exec sur le conteneur Postgres Vault
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo -e "${GREEN}✓ Connexion via docker exec (conteneur ${CONTAINER})${NC}"
    docker exec "${CONTAINER}" psql -U vault -d dorevia_vault -v ON_ERROR_STOP=1 -c "
        SELECT move_id, is_reconciled, amount, last_transition_at, account_id, company_id
        FROM bank_reconciliation_projection
        WHERE tenant = '${TENANT}' AND company_id = ${COMPANY_ID}
        ORDER BY move_id;
    " || { echo -e "${RED}Erreur requête (docker exec)${NC}"; exit 1; }
    echo ""
    echo -e "${YELLOW}Résumé agrégé :${NC}"
    docker exec "${CONTAINER}" psql -U vault -d dorevia_vault -t -A -F " | " -c "
        SELECT
            COUNT(*) AS nb_lignes,
            SUM(CASE WHEN is_reconciled THEN 1 ELSE 0 END) AS nb_rapprochees,
            SUM(CASE WHEN NOT is_reconciled THEN 1 ELSE 0 END) AS nb_non_rapprochees,
            SUM(amount) AS total_amount
        FROM bank_reconciliation_projection
        WHERE tenant = '${TENANT}' AND company_id = ${COMPANY_ID};
    "
    exit 0
fi

echo -e "${RED}❌ Impossible de se connecter à la base Vault.${NC}"
echo "  Définissez DATABASE_URL ou assurez-vous que le conteneur '${CONTAINER}' est en cours d'exécution."
echo ""
echo "  Exemple DATABASE_URL :"
echo "  export DATABASE_URL='postgres://vault:vault_password@localhost:5432/dorevia_vault?sslmode=disable'"
echo "  (nécessite un port exposé, ex: ports: \"5432:5432\" sur vault-db)"
exit 1
