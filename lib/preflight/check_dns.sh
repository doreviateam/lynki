#!/bin/bash
# check_dns.sh - Validation DNS pour domaines clients (Phase 3)
# Usage: check_dns.sh <hostname> [<expected_ip>]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Vérifier arguments
if [[ $# -lt 1 ]]; then
  error "Usage: $0 <hostname> [<expected_ip>]"
  exit 1
fi

HOSTNAME="$1"
EXPECTED_IP="${2:-}"

# Vérifier que dig est installé
if ! command -v dig &> /dev/null; then
  error "dig n'est pas installé. Installez bind-utils ou dnsutils."
  exit 1
fi

info "Vérification DNS pour: $HOSTNAME"

# Résoudre hostname
RESOLVED_IP=$(dig +short "$HOSTNAME" | head -1)

if [[ -z "$RESOLVED_IP" ]]; then
  error "Impossible de résoudre $HOSTNAME (pas d'enregistrement DNS)"
  exit 1
fi

info "  Résolu vers: $RESOLVED_IP"

# Vérifier cohérence IP si attendue
if [[ -n "$EXPECTED_IP" ]]; then
  if [[ "$RESOLVED_IP" != "$EXPECTED_IP" ]]; then
    error "IP résolue ($RESOLVED_IP) ne correspond pas à l'IP attendue ($EXPECTED_IP)"
    exit 1
  fi
  info "  ✅ IP cohérente avec IP attendue"
fi

# Vérifier TTL (recommandé < 3600 secondes pour propagation rapide)
TTL=$(dig +noall +answer "$HOSTNAME" | awk '{print $2}' | head -1)
if [[ -n "$TTL" ]] && [[ "$TTL" =~ ^[0-9]+$ ]]; then
  if [[ $TTL -gt 3600 ]]; then
    warn "TTL élevé ($TTL secondes) - propagation DNS peut être lente"
  else
    info "  ✅ TTL acceptable ($TTL secondes)"
  fi
fi

info "✅ DNS valide pour $HOSTNAME"
return 0

