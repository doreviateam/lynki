#!/bin/bash
# check_dns_all.sh - Validation DNS complète pour tenant/env (Phase 3)
# Usage: check_dns_all.sh <tenant> <env> [--intent <intent_file>]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TENANTS_DIR="$ROOT_DIR/tenants"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

error() {
  echo -e "${RED}ERROR: ${NC}$1" >&2
  return 1
}

info() {
  echo -e "${GREEN}INFO: ${NC}$1"
}

warn() {
  echo -e "${YELLOW}WARN: ${NC}$1"
}

section() {
  echo -e "${BLUE}$1${NC}"
}

# Vérifier arguments
if [[ $# -lt 2 ]]; then
  error "Usage: $0 <tenant> <env> [--intent <intent_file>]"
  exit 1
fi

TENANT="$1"
ENV="$2"
INTENT_FILE=""

# Parser arguments optionnels
shift 2
while [[ $# -gt 0 ]]; do
  case "$1" in
    --intent)
      INTENT_FILE="$2"
      shift 2
      ;;
    *)
      error "Option inconnue: $1"
      exit 1
      ;;
  esac
done

# Vérifier tenant
TENANT_DIR="$TENANTS_DIR/$TENANT"
if [[ ! -d "$TENANT_DIR" ]]; then
  error "Tenant introuvable: $TENANT"
  exit 1
fi

# Vérifier jq
if ! command -v jq &> /dev/null; then
  error "jq n'est pas installé. Veuillez l'installer."
  exit 1
fi

# Vérifier dig
if ! command -v dig &> /dev/null; then
  error "dig n'est pas installé. Installez bind-utils ou dnsutils."
  exit 1
fi

section "🔍 Validation DNS — Tenant: $TENANT, Env: $ENV"
echo ""

# Phase 3: Lire configuration domaines depuis intent.json ou manifest.json
CANONICAL_DOMAIN="doreviateam.com"
FALLBACK_DOMAIN=""
ALIASES_JSON="null"
DOMAIN_MODE="saas"
EXPECTED_IP=""
TENANT_ID=""
UNIVERSES=""

if [[ -n "$INTENT_FILE" ]] && [[ -f "$INTENT_FILE" ]]; then
  # Lire depuis intent.json (Phase 2/3)
  info "Lecture configuration depuis intent: $INTENT_FILE"
  INTENT=$(cat "$INTENT_FILE")
  TENANT_ID=$(echo "$INTENT" | jq -r '.tenant_id')
  UNIVERSES=$(echo "$INTENT" | jq -r '.intention.universes[]')
  CANONICAL_DOMAIN=$(echo "$INTENT" | jq -r '.intention.domains.canonical // "doreviateam.com"')
  FALLBACK_DOMAIN=$(echo "$INTENT" | jq -r '.intention.domains.fallback // empty')
  ALIASES_JSON=$(echo "$INTENT" | jq -c '.intention.domains.aliases // {}')
  DOMAIN_MODE=$(echo "$INTENT" | jq -r '.intention.mode // "saas"')
  
  # Extraire IP serveur si disponible
  if echo "$INTENT" | jq -e '.intention.server.public_ip' >/dev/null 2>&1; then
    EXPECTED_IP=$(echo "$INTENT" | jq -r '.intention.server.public_ip // ""')
  fi
else
  # Lire depuis manifest.json (Phase 1/3)
  MANIFEST_FILE="$TENANT_DIR/state/manifest.json"
  if [[ ! -f "$MANIFEST_FILE" ]]; then
    error "Manifest introuvable: $MANIFEST_FILE (et aucun intent fourni)"
    exit 1
  fi
  
  MANIFEST=$(cat "$MANIFEST_FILE")
  TENANT_ID=$(echo "$MANIFEST" | jq -r '.tenant_id')
  UNIVERSES=$(echo "$MANIFEST" | jq -r '.universes[]')
  DOMAIN_MODE=$(echo "$MANIFEST" | jq -r '.domain_mode // "saas"')
  
  # Phase 3: Lire domaines depuis manifest
  if echo "$MANIFEST" | jq -e '.domains' >/dev/null 2>&1; then
    CANONICAL_DOMAIN=$(echo "$MANIFEST" | jq -r '.domains.canonical // "doreviateam.com"')
    
    # Lire fallback (peut être booléen true ou chaîne)
    fallback_raw=$(echo "$MANIFEST" | jq -r '.domains.fallback // empty')
    if [[ "$fallback_raw" == "true" ]]; then
      FALLBACK_DOMAIN="doreviateam.com"
    elif [[ -n "$fallback_raw" ]] && [[ "$fallback_raw" != "false" ]] && [[ "$fallback_raw" != "null" ]]; then
      FALLBACK_DOMAIN="$fallback_raw"
    fi
    
    ALIASES_JSON=$(echo "$MANIFEST" | jq -c '.domains.aliases // {}')
  fi
  
  # Extraire IP serveur si disponible
  if echo "$MANIFEST" | jq -e '.prod.public_ip' >/dev/null 2>&1; then
    EXPECTED_IP=$(echo "$MANIFEST" | jq -r '.prod.public_ip // ""')
  fi
fi

# Phase 3: Déterminer fallback selon mode
if [[ "$DOMAIN_MODE" == "client" ]] || [[ "$DOMAIN_MODE" == "hybrid" ]]; then
  if [[ -z "$FALLBACK_DOMAIN" ]] || [[ "$FALLBACK_DOMAIN" == "null" ]]; then
    FALLBACK_DOMAIN="doreviateam.com"
  fi
fi

info "Configuration:"
info "  Mode: $DOMAIN_MODE"
info "  Domaine canonique: $CANONICAL_DOMAIN"
if [[ -n "$FALLBACK_DOMAIN" ]]; then
  info "  Fallback: $FALLBACK_DOMAIN"
fi
if [[ -n "$EXPECTED_IP" ]]; then
  info "  IP serveur attendue: $EXPECTED_IP"
fi
echo ""

# Collecter tous les hostnames à vérifier
declare -a HOSTNAMES=()
declare -A HOSTNAME_TYPES=()  # canonique, fallback, alias_global, alias_<service>

# Hostnames canoniques (univers)
for universe in $UNIVERSES; do
  hostname="${universe}.${ENV}.${TENANT_ID}.${CANONICAL_DOMAIN}"
  HOSTNAMES+=("$hostname")
  HOSTNAME_TYPES["$hostname"]="canonical"
done

# Hostnames canoniques (services cœur)
for service in dvig vault; do
  hostname="${service}.${TENANT_ID}.${CANONICAL_DOMAIN}"
  HOSTNAMES+=("$hostname")
  HOSTNAME_TYPES["$hostname"]="canonical"
done

# Hostnames fallback
if [[ -n "$FALLBACK_DOMAIN" ]]; then
  for universe in $UNIVERSES; do
    hostname="${universe}.${ENV}.${TENANT_ID}.${FALLBACK_DOMAIN}"
    HOSTNAMES+=("$hostname")
    HOSTNAME_TYPES["$hostname"]="fallback"
  done
  
  for service in dvig vault; do
    hostname="${service}.${TENANT_ID}.${FALLBACK_DOMAIN}"
    HOSTNAMES+=("$hostname")
    HOSTNAME_TYPES["$hostname"]="fallback"
  done
fi

# Hostnames alias
# Phase 3: Transformer format alias si nécessaire (tableau -> objet)
if [[ -n "$ALIASES_JSON" ]] && [[ "$ALIASES_JSON" != "null" ]] && [[ "$ALIASES_JSON" != "{}" ]] && [[ "$ALIASES_JSON" != "[]" ]]; then
  # Vérifier si c'est un tableau (format intent.json) ou un objet (format manifest.json)
  if echo "$ALIASES_JSON" | jq -e 'type == "array"' >/dev/null 2>&1; then
    # Transformer tableau en objet {global: [...], odoo: [...], dvig: [...], vault: [...]}
    ALIASES_JSON=$(echo "$ALIASES_JSON" | jq -c '
      reduce .[] as $alias ({}; 
        if $alias.service == "global" then
          .global = ((.global // []) + [$alias.hostname])
        else
          .[$alias.service] = ((.[$alias.service] // []) + [$alias.hostname])
        end
      )
    ')
  fi
  
  # Alias global
  global_aliases=$(echo "$ALIASES_JSON" | jq -r '.global[]? // empty' 2>/dev/null || echo "")
  if [[ -n "$global_aliases" ]]; then
    while IFS= read -r alias; do
      [[ -n "$alias" ]] && HOSTNAMES+=("$alias") && HOSTNAME_TYPES["$alias"]="alias_global"
    done <<< "$global_aliases"
  fi
  
  # Alias par service
  for service in odoo dvig vault; do
    service_aliases=$(echo "$ALIASES_JSON" | jq -r ".[\"$service\"]?[]? // empty" 2>/dev/null || echo "")
    if [[ -n "$service_aliases" ]]; then
      while IFS= read -r alias; do
        [[ -n "$alias" ]] && HOSTNAMES+=("$alias") && HOSTNAME_TYPES["$alias"]="alias_${service}"
      done <<< "$service_aliases"
    fi
  done
fi

# Vérifier chaque hostname
section "📋 Vérification DNS (${#HOSTNAMES[@]} hostname(s)):"
echo ""

declare -A RESOLVED_IPS=()
declare -A DNS_STATUS=()  # OK, KO, WARN
OK_COUNT=0
KO_COUNT=0
WARN_COUNT=0

for hostname in "${HOSTNAMES[@]}"; do
  type="${HOSTNAME_TYPES[$hostname]}"
  type_label=""
  case "$type" in
    canonical) type_label="[canonique]" ;;
    fallback) type_label="[fallback]" ;;
    alias_global) type_label="[alias global]" ;;
    alias_*) type_label="[alias ${type#alias_}]" ;;
  esac
  
  # Résoudre DNS
  resolved_ip=$(dig +short "$hostname" 2>/dev/null | head -1 || echo "")
  
  if [[ -z "$resolved_ip" ]]; then
    echo -e "${RED}❌${NC} $hostname $type_label : Non résolu"
    DNS_STATUS["$hostname"]="KO"
    RESOLVED_IPS["$hostname"]=""
    ((KO_COUNT++))
    continue
  fi
  
  RESOLVED_IPS["$hostname"]="$resolved_ip"
  
  # Vérifier cohérence IP si attendue
  if [[ -n "$EXPECTED_IP" ]]; then
    if [[ "$resolved_ip" == "$EXPECTED_IP" ]]; then
      echo -e "${GREEN}✅${NC} $hostname $type_label : $resolved_ip (cohérent)"
      DNS_STATUS["$hostname"]="OK"
      ((OK_COUNT++))
    else
      echo -e "${YELLOW}⚠️${NC} $hostname $type_label : $resolved_ip (attendu: $EXPECTED_IP)"
      DNS_STATUS["$hostname"]="WARN"
      ((WARN_COUNT++))
    fi
  else
    echo -e "${GREEN}✅${NC} $hostname $type_label : $resolved_ip"
    DNS_STATUS["$hostname"]="OK"
    ((OK_COUNT++))
  fi
done

echo ""

# Vérifier cohérence IP globale
section "🔍 Vérification cohérence IP:"
echo ""

if [[ ${#RESOLVED_IPS[@]} -gt 0 ]]; then
  # Collecter IPs uniques
  declare -A IP_COUNT=()
  for hostname in "${HOSTNAMES[@]}"; do
    ip="${RESOLVED_IPS[$hostname]}"
    if [[ -n "$ip" ]]; then
      IP_COUNT["$ip"]=$((${IP_COUNT[$ip]:-0} + 1))
    fi
  done
  
  if [[ ${#IP_COUNT[@]} -eq 1 ]]; then
    # Une seule IP pour tous les hostnames
    unique_ip=$(echo "${!IP_COUNT[@]}")
    info "✅ Tous les hostnames pointent vers la même IP: $unique_ip"
  elif [[ ${#IP_COUNT[@]} -gt 1 ]]; then
    # Plusieurs IPs différentes
    warn "⚠️  Plusieurs IPs différentes détectées:"
    for ip in "${!IP_COUNT[@]}"; do
      count=${IP_COUNT[$ip]}
      echo "  - $ip : $count hostname(s)"
    done
    warn "  Vérifiez que tous les hostnames pointent vers le même serveur"
  fi
else
  warn "⚠️  Aucun hostname résolu, impossible de vérifier la cohérence IP"
fi

echo ""

# Résumé
section "📊 Résumé validation DNS:"
echo "  ${GREEN}✅ OK: $OK_COUNT${NC}"
if [[ $WARN_COUNT -gt 0 ]]; then
  echo "  ${YELLOW}⚠️  Avertissements: $WARN_COUNT${NC}"
fi
if [[ $KO_COUNT -gt 0 ]]; then
  echo "  ${RED}❌ Erreurs: $KO_COUNT${NC}"
fi
echo ""

# Code de sortie
if [[ $KO_COUNT -eq 0 ]]; then
  if [[ $WARN_COUNT -eq 0 ]]; then
    info "✅ Validation DNS réussie"
    exit 0
  else
    warn "⚠️  Validation DNS réussie avec avertissements"
    exit 0
  fi
else
  error "❌ Validation DNS échouée ($KO_COUNT erreur(s))"
  exit 1
fi

