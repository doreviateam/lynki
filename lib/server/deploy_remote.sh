#!/bin/bash
# deploy_remote.sh - Utilitaires pour déploiement distant via SSH (Phase 3)
# Fonctions partagées pour déploiement sur serveur client

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
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

# Charger utilitaires serveur
if [[ ! -f "$SERVER_UTILS" ]]; then
  error "Script server_utils introuvable: $SERVER_UTILS"
  exit 1
fi

source "$SERVER_UTILS"

# Initialiser connexion SSH pour serveur
init_ssh_connection() {
  local server_name="$1"
  
  # Lire configuration serveur
  local config
  config=$(read_server_config "$server_name" 2>/dev/null || echo "")
  if [[ -z "$config" ]]; then
    error "Serveur introuvable: $server_name"
    return 1
  fi
  
  # Extraire paramètres SSH
  local public_ip=$(echo "$config" | jq -r '.public_ip')
  local ssh_user=$(echo "$config" | jq -r '.ssh.user')
  local ssh_key=$(echo "$config" | jq -r '.ssh.key_path')
  local ssh_port=$(echo "$config" | jq -r '.ssh.port // 22')
  
  # Expansion chemin clé SSH
  local expanded_key="${ssh_key/#\~/$HOME}"
  
  if [[ ! -f "$expanded_key" ]]; then
    error "Clé SSH introuvable: $expanded_key"
    return 1
  fi
  
  # Exporter variables pour utilisation dans fonctions
  export DEPLOY_SSH_HOST="${ssh_user}@${public_ip}"
  export DEPLOY_SSH_KEY="$expanded_key"
  export DEPLOY_SSH_PORT="$ssh_port"
  
  return 0
}

# Exécuter commande SSH distante
ssh_exec() {
  local cmd="$1"
  local quiet="${2:-false}"
  
  if [[ -z "${DEPLOY_SSH_HOST:-}" ]] || [[ -z "${DEPLOY_SSH_KEY:-}" ]]; then
    error "Connexion SSH non initialisée. Appeler init_ssh_connection() d'abord."
    return 1
  fi
  
  local ssh_opts=(
    -i "$DEPLOY_SSH_KEY"
    -o ConnectTimeout=10
    -o StrictHostKeyChecking=no
    -o UserKnownHostsFile=/dev/null
    -p "${DEPLOY_SSH_PORT:-22}"
  )
  
  if [[ "$quiet" == "true" ]]; then
    ssh "${ssh_opts[@]}" "$DEPLOY_SSH_HOST" "$cmd" 2>/dev/null
  else
    ssh "${ssh_opts[@]}" "$DEPLOY_SSH_HOST" "$cmd"
  fi
}

# Copier fichier vers serveur distant
ssh_copy() {
  local local_file="$1"
  local remote_path="$2"
  local remote_dir="${3:-}"
  
  if [[ -z "${DEPLOY_SSH_HOST:-}" ]] || [[ -z "${DEPLOY_SSH_KEY:-}" ]]; then
    error "Connexion SSH non initialisée. Appeler init_ssh_connection() d'abord."
    return 1
  fi
  
  if [[ ! -f "$local_file" ]]; then
    error "Fichier local introuvable: $local_file"
    return 1
  fi
  
  # Créer répertoire distant si nécessaire
  if [[ -n "$remote_dir" ]]; then
    ssh_exec "mkdir -p '$remote_dir'" true
  fi
  
  # Copier fichier via scp
  local scp_opts=(
    -i "$DEPLOY_SSH_KEY"
    -o ConnectTimeout=10
    -o StrictHostKeyChecking=no
    -o UserKnownHostsFile=/dev/null
    -P "${DEPLOY_SSH_PORT:-22}"
  )
  
  scp "${scp_opts[@]}" "$local_file" "${DEPLOY_SSH_HOST}:${remote_path}" >/dev/null 2>&1
  
  if [[ $? -eq 0 ]]; then
    info "Fichier copié: $local_file -> ${DEPLOY_SSH_HOST}:${remote_path}"
    return 0
  else
    error "Échec copie fichier: $local_file -> ${DEPLOY_SSH_HOST}:${remote_path}"
    return 1
  fi
}

# Copier répertoire vers serveur distant (tar + transfert)
ssh_copy_dir() {
  local local_dir="$1"
  local remote_dir="$2"
  
  if [[ ! -d "$local_dir" ]]; then
    error "Répertoire local introuvable: $local_dir"
    return 1
  fi
  
  # Créer archive temporaire
  local temp_tar=$(mktemp)
  trap "rm -f '$temp_tar'" EXIT
  
  # Créer archive
  tar -czf "$temp_tar" -C "$(dirname "$local_dir")" "$(basename "$local_dir")" 2>/dev/null || {
    error "Échec création archive: $local_dir"
    return 1
  }
  
  # Créer répertoire distant
  ssh_exec "mkdir -p '$remote_dir'" true
  
  # Copier archive
  ssh_copy "$temp_tar" "/tmp/$(basename "$temp_tar")" "/tmp"
  
  # Extraire archive distante
  ssh_exec "cd '$remote_dir' && tar -xzf /tmp/$(basename "$temp_tar") && rm -f /tmp/$(basename "$temp_tar")" || {
    error "Échec extraction archive distante"
    return 1
  }
  
  # Nettoyer
  rm -f "$temp_tar"
  
  return 0
}

# Vérifier Docker sur serveur distant
check_remote_docker() {
  if ! ssh_exec "command -v docker" true &>/dev/null; then
    error "Docker non installé sur serveur distant"
    return 1
  fi
  
  if ! ssh_exec "sudo docker info" true &>/dev/null; then
    error "Docker daemon non accessible sur serveur distant"
    return 1
  fi
  
  return 0
}

# Vérifier Docker Compose sur serveur distant
check_remote_docker_compose() {
  if ! ssh_exec "command -v docker-compose" true &>/dev/null && ! ssh_exec "docker compose version" true &>/dev/null 2>&1; then
    error "Docker Compose non installé sur serveur distant"
    return 1
  fi
  
  return 0
}

# Créer réseau Docker distant si nécessaire
ensure_remote_network() {
  local network_name="${1:-dorevia-network}"
  
  if ! ssh_exec "sudo docker network inspect $network_name" true &>/dev/null; then
    info "Création réseau Docker distant: $network_name"
    ssh_exec "sudo docker network create $network_name" || {
      error "Échec création réseau Docker distant: $network_name"
      return 1
    }
  else
    info "Réseau Docker distant existe déjà: $network_name"
  fi
  
  return 0
}

# Exécuter docker compose up sur serveur distant
remote_docker_compose_up() {
  local remote_dir="$1"
  local project_name="${2:-}"
  local compose_file="${3:-docker-compose.yml}"
  
  local cmd="cd '$remote_dir' && sudo docker compose -f '$compose_file'"
  if [[ -n "$project_name" ]]; then
    cmd="$cmd -p '$project_name'"
  fi
  cmd="$cmd up -d"
  
  info "Exécution docker compose up sur serveur distant..."
  ssh_exec "$cmd" || {
    error "Échec docker compose up sur serveur distant"
    return 1
  }
  
  return 0
}

# Exécuter docker compose down sur serveur distant
remote_docker_compose_down() {
  local remote_dir="$1"
  local project_name="${2:-}"
  local compose_file="${3:-docker-compose.yml}"
  
  local cmd="cd '$remote_dir' && sudo docker compose -f '$compose_file'"
  if [[ -n "$project_name" ]]; then
    cmd="$cmd -p '$project_name'"
  fi
  cmd="$cmd down"
  
  info "Exécution docker compose down sur serveur distant..."
  ssh_exec "$cmd" || {
    error "Échec docker compose down sur serveur distant"
    return 1
  }
  
  return 0
}

# Exécuter docker compose ps sur serveur distant
remote_docker_compose_ps() {
  local remote_dir="$1"
  local project_name="${2:-}"
  local compose_file="${3:-docker-compose.yml}"
  
  local cmd="cd '$remote_dir' && sudo docker compose -f '$compose_file'"
  if [[ -n "$project_name" ]]; then
    cmd="$cmd -p '$project_name'"
  fi
  cmd="$cmd ps"
  
  ssh_exec "$cmd"
}

