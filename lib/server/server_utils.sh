#!/bin/bash
# server_utils.sh - Utilitaires pour gestion serveurs (Phase 3)
# Fonctions partagées pour commandes server

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVERS_DIR="$ROOT_DIR/servers"

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

# Lire configuration serveur
read_server_config() {
  local server_name="$1"
  local server_file="$SERVERS_DIR/${server_name}.json"
  
  if [[ ! -f "$server_file" ]]; then
    error "Serveur introuvable: $server_name (fichier: $server_file)"
    return 1
  fi
  
  if ! command -v jq &> /dev/null; then
    error "jq n'est pas installé. Veuillez l'installer."
    return 1
  fi
  
  # Valider JSON
  if ! jq empty "$server_file" 2>/dev/null; then
    error "Configuration serveur invalide (JSON invalide): $server_file"
    return 1
  fi
  
  cat "$server_file"
}

# Extraire valeur depuis configuration serveur
get_server_value() {
  local server_name="$1"
  local key="$2"
  
  local config
  config=$(read_server_config "$server_name" 2>/dev/null || echo "")
  if [[ -z "$config" ]]; then
    return 1
  fi
  
  echo "$config" | jq -r "$key // empty" 2>/dev/null || echo ""
}

# Valider format configuration serveur
validate_server_config() {
  local server_file="$1"
  
  if [[ ! -f "$server_file" ]]; then
    error "Fichier serveur introuvable: $server_file"
    return 1
  fi
  
  if ! command -v jq &> /dev/null; then
    error "jq n'est pas installé. Veuillez l'installer."
    return 1
  fi
  
  # Valider JSON
  if ! jq empty "$server_file" 2>/dev/null; then
    error "Configuration serveur invalide (JSON invalide): $server_file"
    return 1
  fi
  
  # Vérifier champs obligatoires
  local server_name=$(jq -r '.server_name // empty' "$server_file")
  local public_ip=$(jq -r '.public_ip // empty' "$server_file")
  local ssh_user=$(jq -r '.ssh.user // empty' "$server_file")
  local ssh_key=$(jq -r '.ssh.key_path // empty' "$server_file")
  
  if [[ -z "$server_name" ]]; then
    error "Champ obligatoire manquant: server_name"
    return 1
  fi
  
  if [[ -z "$public_ip" ]]; then
    error "Champ obligatoire manquant: public_ip"
    return 1
  fi
  
  if [[ -z "$ssh_user" ]]; then
    error "Champ obligatoire manquant: ssh.user"
    return 1
  fi
  
  if [[ -z "$ssh_key" ]]; then
    error "Champ obligatoire manquant: ssh.key_path"
    return 1
  fi
  
  # Valider format IP
  if [[ ! "$public_ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    error "Format IP invalide: $public_ip"
    return 1
  fi
  
  # Valider que la clé SSH existe (si chemin absolu ou ~)
  local expanded_key="${ssh_key/#\~/$HOME}"
  if [[ ! "$expanded_key" =~ ^/ ]] && [[ ! -f "$expanded_key" ]]; then
    warn "Clé SSH non trouvée: $expanded_key (vérification ignorée)"
  fi
  
  return 0
}

# Lister tous les serveurs configurés
list_servers() {
  if [[ ! -d "$SERVERS_DIR" ]]; then
    echo "Aucun serveur configuré"
    return 0
  fi
  
  local servers=()
  for server_file in "$SERVERS_DIR"/*.json; do
    if [[ -f "$server_file" ]]; then
      local server_name=$(basename "$server_file" .json)
      servers+=("$server_name")
    fi
  done
  
  if [[ ${#servers[@]} -eq 0 ]]; then
    echo "Aucun serveur configuré"
    return 0
  fi
  
  echo "Serveurs configurés (${#servers[@]}):"
  for server_name in "${servers[@]}"; do
    local public_ip=$(get_server_value "$server_name" '.public_ip' 2>/dev/null || echo "N/A")
    local description=$(get_server_value "$server_name" '.description' 2>/dev/null || echo "")
    echo "  - $server_name ($public_ip)"
    if [[ -n "$description" ]]; then
      echo "    $description"
    fi
  done
}

