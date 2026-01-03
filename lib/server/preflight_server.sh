#!/bin/bash
# preflight_server.sh - Préflight serveur client (Phase 3)
# Usage: preflight_server.sh <server_name>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVERS_DIR="$ROOT_DIR/servers"
SERVER_UTILS="$SCRIPT_DIR/server_utils.sh"

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
if [[ $# -lt 1 ]]; then
  error "Usage: $0 <server_name>"
  exit 1
fi

SERVER_NAME="$1"

# Charger utilitaires
if [[ ! -f "$SERVER_UTILS" ]]; then
  error "Script server_utils introuvable: $SERVER_UTILS"
  exit 1
fi

source "$SERVER_UTILS"

# Lire configuration serveur
CONFIG=$(read_server_config "$SERVER_NAME" 2>/dev/null || echo "")
if [[ -z "$CONFIG" ]]; then
  error "Serveur introuvable: $SERVER_NAME"
  exit 1
fi

PUBLIC_IP=$(echo "$CONFIG" | jq -r '.public_ip')
SSH_USER=$(echo "$CONFIG" | jq -r '.ssh.user')
SSH_KEY=$(echo "$CONFIG" | jq -r '.ssh.key_path')
SSH_PORT=$(echo "$CONFIG" | jq -r '.ssh.port // 22')
MIN_DISK_GB=$(echo "$CONFIG" | jq -r '.requirements.min_disk_gb // 50')

# Expansion chemin clé SSH
EXPANDED_KEY="${SSH_KEY/#\~/$HOME}"

section "🔍 Préflight serveur: $SERVER_NAME"
echo ""
info "Configuration:"
info "  IP: $PUBLIC_IP"
info "  SSH user: $SSH_USER"
info "  SSH key: $SSH_KEY"
info "  SSH port: $SSH_PORT"
echo ""

# Compteurs
CHECKS_OK=0
CHECKS_KO=0
CHECKS_WARN=0

# Fonction de vérification
check() {
  local name="$1"
  local result="$2"
  local message="${3:-}"
  
  if [[ "$result" == "0" ]]; then
    info "✅ $name"
    CHECKS_OK=$((CHECKS_OK + 1))
    return 0
  else
    error "❌ $name${message:+: $message}"
    CHECKS_KO=$((CHECKS_KO + 1))
    return 1
  fi
}

check_warn() {
  local name="$1"
  local result="$2"
  local message="${3:-}"
  
  if [[ "$result" == "0" ]]; then
    info "✅ $name"
    CHECKS_OK=$((CHECKS_OK + 1))
    return 0
  else
    warn "⚠️  $name${message:+: $message}"
    CHECKS_WARN=$((CHECKS_WARN + 1))
    return 1
  fi
}

# Fonction SSH exécution distante
ssh_exec() {
  local cmd="$1"
  ssh -i "$EXPANDED_KEY" \
      -o ConnectTimeout=10 \
      -o StrictHostKeyChecking=no \
      -o UserKnownHostsFile=/dev/null \
      -p "$SSH_PORT" \
      "${SSH_USER}@${PUBLIC_IP}" \
      "$cmd" 2>/dev/null
}

# 1. Vérifier clé SSH
section "1. Vérification clé SSH..."
if [[ -f "$EXPANDED_KEY" ]]; then
  check "Clé SSH présente" 0
  # Vérifier permissions (recommandé 600)
  local key_perms=$(stat -c "%a" "$EXPANDED_KEY" 2>/dev/null || echo "000")
  if [[ "$key_perms" == "600" ]] || [[ "$key_perms" == "400" ]]; then
    info "  Permissions: $key_perms (OK)"
  else
    warn "  Permissions: $key_perms (recommandé: 600)"
  fi
else
  check "Clé SSH présente" 1 "Clé introuvable: $EXPANDED_KEY"
fi
echo ""

# 2. Vérifier accès SSH
section "2. Vérification accès SSH..."
if ssh_exec "echo 'Connexion OK'" &>/dev/null; then
  check "Connexion SSH" 0
else
  check "Connexion SSH" 1 "Impossible de se connecter à ${SSH_USER}@${PUBLIC_IP}:${SSH_PORT}"
fi
echo ""

# 3. Vérifier user sudo
section "3. Vérification droits sudo..."
if ssh_exec "sudo -n true" &>/dev/null; then
  check "Droits sudo (sans mot de passe)" 0
elif ssh_exec "sudo -v" &>/dev/null; then
  check_warn "Droits sudo (avec mot de passe)" 0 "Mot de passe requis"
else
  check "Droits sudo" 1 "User $SSH_USER n'a pas de droits sudo"
fi
echo ""

# 4. Vérifier Docker
section "4. Vérification Docker..."
if ssh_exec "command -v docker" &>/dev/null; then
  check "Docker installé" 0
  local docker_version=$(ssh_exec "docker --version" 2>/dev/null || echo "unknown")
  info "  Version: $docker_version"
  
  # Vérifier Docker daemon accessible
  if ssh_exec "sudo docker info" &>/dev/null; then
    check "Docker daemon accessible" 0
  else
    check "Docker daemon accessible" 1 "Docker daemon non accessible"
  fi
else
  check "Docker installé" 1 "Docker non installé"
fi
echo ""

# 5. Vérifier Docker Compose
section "5. Vérification Docker Compose..."
if ssh_exec "command -v docker-compose" &>/dev/null || ssh_exec "docker compose version" &>/dev/null 2>&1; then
  check "Docker Compose installé" 0
  local compose_version=$(ssh_exec "docker-compose --version 2>/dev/null || docker compose version" 2>/dev/null || echo "unknown")
  info "  Version: $compose_version"
else
  check "Docker Compose installé" 1 "Docker Compose non installé"
fi
echo ""

# 6. Vérifier ports
section "6. Vérification ports..."
for port in 22 80 443; do
  if command -v nc &> /dev/null; then
    if nc -z -w 2 "$PUBLIC_IP" "$port" &>/dev/null; then
      check "Port $port ouvert" 0
    else
      check_warn "Port $port ouvert" 1 "Port $port non accessible depuis cette machine (peut être normal si firewall)"
    fi
  elif command -v telnet &> /dev/null; then
    if timeout 2 telnet "$PUBLIC_IP" "$port" &>/dev/null 2>&1; then
      check "Port $port ouvert" 0
    else
      check_warn "Port $port ouvert" 1 "Port $port non accessible depuis cette machine"
    fi
  else
    warn "⚠️  nc/telnet non disponible, vérification ports ignorée"
    ((CHECKS_WARN++))
    break
  fi
done
echo ""

# 7. Vérifier espace disque
section "7. Vérification espace disque..."
local disk_info=$(ssh_exec "df -h / | tail -1" 2>/dev/null || echo "")
if [[ -n "$disk_info" ]]; then
  local available_gb=$(echo "$disk_info" | awk '{print $4}' | sed 's/G//' | sed 's/[^0-9]//g')
  if [[ -n "$available_gb" ]] && [[ "$available_gb" =~ ^[0-9]+$ ]]; then
    if [[ $available_gb -ge $MIN_DISK_GB ]]; then
      check "Espace disque suffisant" 0 "Disponible: ${available_gb}GB (requis: ${MIN_DISK_GB}GB)"
    else
      check "Espace disque suffisant" 1 "Disponible: ${available_gb}GB (requis: ${MIN_DISK_GB}GB)"
    fi
  else
    check_warn "Espace disque suffisant" 1 "Impossible de déterminer l'espace disponible"
  fi
else
  check_warn "Espace disque suffisant" 1 "Impossible de vérifier l'espace disque"
fi
echo ""

# 8. Vérifier réseau Docker (optionnel)
section "8. Vérification réseau Docker..."
if ssh_exec "sudo docker network ls" &>/dev/null; then
  local network_exists=$(ssh_exec "sudo docker network inspect dorevia-network" &>/dev/null && echo "yes" || echo "no")
  if [[ "$network_exists" == "yes" ]]; then
    check_warn "Réseau dorevia-network" 0 "Réseau existe déjà"
  else
    check_warn "Réseau dorevia-network" 1 "Réseau non créé (sera créé automatiquement si nécessaire)"
  fi
else
  check_warn "Réseau dorevia-network" 1 "Docker non accessible"
fi
echo ""

# Résumé
section "📊 Résumé préflight serveur:"
echo "  ${GREEN}✅ Vérifications OK: $CHECKS_OK${NC}"
if [[ $CHECKS_WARN -gt 0 ]]; then
  echo "  ${YELLOW}⚠️  Avertissements: $CHECKS_WARN${NC}"
fi
if [[ $CHECKS_KO -gt 0 ]]; then
  echo "  ${RED}❌ Erreurs: $CHECKS_KO${NC}"
fi
echo ""

# Code de sortie
if [[ $CHECKS_KO -eq 0 ]]; then
  if [[ $CHECKS_WARN -eq 0 ]]; then
    info "✅ Préflight serveur réussi"
    exit 0
  else
    warn "⚠️  Préflight serveur réussi avec avertissements"
    exit 0
  fi
else
  error "❌ Préflight serveur échoué ($CHECKS_KO erreur(s))"
  exit 1
fi

