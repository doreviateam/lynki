#!/bin/bash
# Script de vérification DNS après migration P0.1
# Usage: ./scripts/migration_dns_verification.sh

set -uo pipefail  # Pas de -e pour continuer même en cas d'erreur

IP_SERVEUR="85.215.206.213"
TENANTS=("core" "dido" "rozas")
ENVS=("lab" "stinger" "prod")

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅${NC} $1"; }
fail() { echo -e "${RED}❌${NC} $1"; }
warn() { echo -e "${YELLOW}⚠️${NC} $1"; }

echo "🔍 Vérification DNS — Migration P0.1"
echo "============================================================"
echo "IP serveur attendue: $IP_SERVEUR"
echo ""

# Compteurs
CHECKS_OK=0
CHECKS_KO=0
CHECKS_WARN=0

# 1. Vérifier nouveaux hostnames (doivent pointer vers IP_SERVEUR)
echo "📋 1. Vérification nouveaux hostnames (dvig.<tenant>, vault.<tenant>)"
echo "----------------------------------------------------------------------"

for tenant in "${TENANTS[@]}"; do
  # DVIG
  resolved_ip=$(dig +short "dvig.$tenant.doreviateam.com" 2>/dev/null || echo "")
  if [[ -z "$resolved_ip" ]]; then
    fail "dvig.$tenant.doreviateam.com : NXDOMAIN (enregistrement non créé)"
    ((CHECKS_KO++))
  elif [[ "$resolved_ip" == "$IP_SERVEUR" ]]; then
    pass "dvig.$tenant.doreviateam.com : $resolved_ip"
    ((CHECKS_OK++))
  else
    fail "dvig.$tenant.doreviateam.com : $resolved_ip (attendu: $IP_SERVEUR)"
    ((CHECKS_KO++))
  fi

  # Vault
  resolved_ip=$(dig +short "vault.$tenant.doreviateam.com" 2>/dev/null || echo "")
  if [[ -z "$resolved_ip" ]]; then
    fail "vault.$tenant.doreviateam.com : NXDOMAIN (enregistrement non créé)"
    ((CHECKS_KO++))
  elif [[ "$resolved_ip" == "$IP_SERVEUR" ]]; then
    pass "vault.$tenant.doreviateam.com : $resolved_ip"
    ((CHECKS_OK++))
  else
    fail "vault.$tenant.doreviateam.com : $resolved_ip (attendu: $IP_SERVEUR)"
    ((CHECKS_KO++))
  fi
done

echo ""

# 2. Vérifier anciens hostnames (doivent être supprimés ou pointer vers IP_SERVEUR)
echo "📋 2. Vérification anciens hostnames (dvig.<env>.<tenant>, vault.<env>.<tenant>)"
echo "----------------------------------------------------------------------"

for tenant in "${TENANTS[@]}"; do
  for env in "${ENVS[@]}"; do
    # DVIG
    resolved_ip=$(dig +short "dvig.$env.$tenant.doreviateam.com" 2>/dev/null || echo "")
    if [[ -z "$resolved_ip" ]]; then
      pass "dvig.$env.$tenant.doreviateam.com : Supprimé (OK)"
      ((CHECKS_OK++))
    elif [[ "$resolved_ip" == "$IP_SERVEUR" ]]; then
      warn "dvig.$env.$tenant.doreviateam.com : $resolved_ip (encore actif, à supprimer)"
      ((CHECKS_WARN++))
    else
      warn "dvig.$env.$tenant.doreviateam.com : $resolved_ip (encore actif, à supprimer)"
      ((CHECKS_WARN++))
    fi

    # Vault
    resolved_ip=$(dig +short "vault.$env.$tenant.doreviateam.com" 2>/dev/null || echo "")
    if [[ -z "$resolved_ip" ]]; then
      pass "vault.$env.$tenant.doreviateam.com : Supprimé (OK)"
      ((CHECKS_OK++))
    elif [[ "$resolved_ip" == "$IP_SERVEUR" ]]; then
      warn "vault.$env.$tenant.doreviateam.com : $resolved_ip (encore actif, à supprimer)"
      ((CHECKS_WARN++))
    else
      warn "vault.$env.$tenant.doreviateam.com : $resolved_ip (encore actif, à supprimer)"
      ((CHECKS_WARN++))
    fi
  done
done

echo ""

# 3. Tests de connectivité HTTP/HTTPS
echo "📋 3. Tests de connectivité HTTP/HTTPS"
echo "----------------------------------------------------------------------"

if command -v curl &> /dev/null; then
  for tenant in "${TENANTS[@]}"; do
    # DVIG
    if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://dvig.$tenant.doreviateam.com/health" 2>/dev/null | grep -q "200\|401"; then
      pass "HTTPS dvig.$tenant.doreviateam.com/health : Accessible"
      ((CHECKS_OK++))
    else
      warn "HTTPS dvig.$tenant.doreviateam.com/health : Non accessible (peut être normal si service non démarré)"
      ((CHECKS_WARN++))
    fi

    # Vault
    if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://vault.$tenant.doreviateam.com/health" 2>/dev/null | grep -q "200\|401"; then
      pass "HTTPS vault.$tenant.doreviateam.com/health : Accessible"
      ((CHECKS_OK++))
    else
      warn "HTTPS vault.$tenant.doreviateam.com/health : Non accessible (peut être normal si service non démarré)"
      ((CHECKS_WARN++))
    fi
  done
else
  warn "curl non disponible, tests HTTP/HTTPS ignorés"
fi

echo ""
echo "============================================================"
echo "📊 Résumé"
echo "============================================================"
echo "  ✅ OK: $CHECKS_OK"
echo "  ⚠️  WARN: $CHECKS_WARN"
echo "  ❌ KO: $CHECKS_KO"
echo ""

if [[ $CHECKS_KO -eq 0 ]]; then
  if [[ $CHECKS_WARN -eq 0 ]]; then
    echo -e "${GREEN}✅ Migration DNS réussie !${NC}"
    exit 0
  else
    echo -e "${YELLOW}⚠️  Migration DNS partielle (anciens enregistrements encore actifs)${NC}"
    exit 0
  fi
else
  echo -e "${RED}❌ Migration DNS incomplète (nouveaux enregistrements manquants)${NC}"
  exit 1
fi

