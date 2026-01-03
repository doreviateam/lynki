#!/bin/bash
# restore_remote.sh - Restore serveur client via SSH (Phase 3)
# Usage: restore_remote.sh <tenant> <server_name> <backup_dir>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVER_UTILS="$ROOT_DIR/lib/server/server_utils.sh"
DEPLOY_REMOTE="$ROOT_DIR/lib/server/deploy_remote.sh"

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
if [[ $# -lt 3 ]]; then
  error "Usage: $0 <tenant> <server_name> <backup_dir>"
  exit 1
fi

TENANT="$1"
SERVER_NAME="$2"
BACKUP_DIR="$3"

# Charger utilitaires
if [[ ! -f "$SERVER_UTILS" ]]; then
  error "Script server_utils introuvable: $SERVER_UTILS"
  exit 1
fi

if [[ ! -f "$DEPLOY_REMOTE" ]]; then
  error "Script deploy_remote introuvable: $DEPLOY_REMOTE"
  exit 1
fi

source "$SERVER_UTILS"
source "$DEPLOY_REMOTE"

# Initialiser connexion SSH
if ! init_ssh_connection "$SERVER_NAME"; then
  error "Échec initialisation connexion SSH"
  exit 1
fi

# Vérifier répertoire backup
if [[ ! -d "$BACKUP_DIR" ]]; then
  error "Répertoire backup introuvable: $BACKUP_DIR"
  exit 1
fi

section "🔄 Restore serveur client: $SERVER_NAME (tenant: $TENANT)"
echo ""

# 1. Restore volumes Vault
section "1. Restore volumes Vault..."
restore_vault_volumes_remote() {
  local tenant="$1"
  local backup_dir="$2"
  
  local volumes=("vault_storage_${tenant}" "vault_ledger_${tenant}" "vault_audit_${tenant}")
  local volume_names=("storage" "ledger" "audit")
  
  for i in "${!volumes[@]}"; do
    local volume="${volumes[$i]}"
    local name="${volume_names[$i]}"
    local archive="$backup_dir/tenants/$TENANT/platform/vault-${name}.tar.gz"
    
    if [[ ! -f "$archive" ]]; then
      warn "Archive $archive non trouvée (skip)"
      continue
    fi
    
    info "Restore volume Vault: $volume..."
    
    # Créer volume si nécessaire
    ssh_exec "sudo docker volume create $volume" true
    
    # Copier archive vers serveur distant
    local temp_archive="/tmp/vault-${name}-${tenant}-restore-$(date +%s).tar.gz"
    scp -i "$DEPLOY_SSH_KEY" \
        -o ConnectTimeout=10 \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -P "${DEPLOY_SSH_PORT:-22}" \
        "$archive" \
        "${DEPLOY_SSH_HOST}:${temp_archive}" >/dev/null 2>&1 || {
      error "Échec copie archive $archive"
      return 1
    }
    
    # Extraire archive dans volume
    ssh_exec "sudo docker run --rm -v ${volume}:/data -v /tmp:/backup alpine sh -c 'cd /data && rm -rf ./* && tar -xzf /backup/$(basename $temp_archive)'" || {
      error "Échec extraction archive dans volume $volume"
      return 1
    }
    
    # Nettoyer archive temporaire distante
    ssh_exec "rm -f $temp_archive" true
    
    info "✅ Volume $volume restauré"
  done
}

restore_vault_volumes_remote "$TENANT" "$BACKUP_DIR"
echo ""

# 2. Restore Vault DB
section "2. Restore Vault DB..."
restore_vault_db_remote() {
  local tenant="$1"
  local backup_dir="$2"
  
  local db_container="vault-db-${tenant}"
  local dump_file="$backup_dir/tenants/$TENANT/platform/vault-db.dump"
  
  if [[ ! -f "$dump_file" ]]; then
    warn "Dump DB Vault non trouvé: $dump_file (skip)"
    return 0
  fi
    
  # Vérifier si container existe
  if ! ssh_exec "sudo docker ps --format '{{.Names}}' | grep -q '^${db_container}$'" true; then
    error "Container $db_container non trouvé sur serveur distant"
    return 1
  fi
  
  info "Restore DB Vault..."
  
  # Copier dump vers serveur distant
  local temp_dump="/tmp/vault-db-${tenant}-restore-$(date +%s).dump"
  scp -i "$DEPLOY_SSH_KEY" \
      -o ConnectTimeout=10 \
      -o StrictHostKeyChecking=no \
      -o UserKnownHostsFile=/dev/null \
      -P "${DEPLOY_SSH_PORT:-22}" \
      "$dump_file" \
      "${DEPLOY_SSH_HOST}:${temp_dump}" >/dev/null 2>&1 || {
    error "Échec copie dump DB Vault"
    return 1
  }
  
  # Restaurer dump
  ssh_exec "sudo docker exec -i $db_container pg_restore -U vault -d dorevia_vault --clean --if-exists < $temp_dump" || {
    error "Échec restauration DB Vault"
    return 1
  }
  
  # Nettoyer dump temporaire distant
  ssh_exec "rm -f $temp_dump" true
  
  info "✅ DB Vault restaurée"
}

restore_vault_db_remote "$TENANT" "$BACKUP_DIR"
echo ""

# 3. Restore secrets
section "3. Restore secrets..."
restore_secrets_remote() {
  local tenant="$1"
  local backup_dir="$2"
  
  local remote_secrets_dir="/opt/dorevia-platform/tenants/$TENANT/secrets"
  local archive="$backup_dir/tenants/$TENANT/secrets/secrets.tar.gz"
  local encrypted_archive="${archive}.gpg"
  
  # Vérifier archive (chiffrée ou non)
  local archive_to_use=""
  if [[ -f "$encrypted_archive" ]]; then
    # Déchiffrer archive
    if command -v gpg &> /dev/null; then
      info "Déchiffrement archive secrets..."
      gpg --decrypt --output "$archive" "$encrypted_archive" 2>/dev/null || {
        error "Échec déchiffrement archive secrets"
        return 1
      }
      archive_to_use="$archive"
    else
      error "gpg non disponible. Impossible de déchiffrer l'archive."
      return 1
    fi
  elif [[ -f "$archive" ]]; then
    archive_to_use="$archive"
  else
    warn "Archive secrets non trouvée: $archive (skip)"
    return 0
  fi
  
  info "Restore secrets..."
  
  # Créer répertoire secrets distant
  ssh_exec "mkdir -p '$remote_secrets_dir'" true
  
  # Copier archive vers serveur distant
  local temp_archive="/tmp/secrets-${tenant}-restore-$(date +%s).tar.gz"
  scp -i "$DEPLOY_SSH_KEY" \
      -o ConnectTimeout=10 \
      -o StrictHostKeyChecking=no \
      -o UserKnownHostsFile=/dev/null \
      -P "${DEPLOY_SSH_PORT:-22}" \
      "$archive_to_use" \
      "${DEPLOY_SSH_HOST}:${temp_archive}" >/dev/null 2>&1 || {
    error "Échec copie archive secrets"
    return 1
  }
  
  # Extraire archive dans répertoire secrets
  ssh_exec "cd '$remote_secrets_dir' && rm -rf ./* && tar -xzf $temp_archive" || {
    error "Échec extraction archive secrets"
    return 1
  }
  
  # Permissions sécurisées
  ssh_exec "chmod -R 600 '$remote_secrets_dir'/*" true || ssh_exec "chmod -R 640 '$remote_secrets_dir'/*" true
  
  # Nettoyer archive temporaire distante
  ssh_exec "rm -f $temp_archive" true
  
  # Nettoyer archive déchiffrée locale si nécessaire
  if [[ -f "$encrypted_archive" ]] && [[ -f "$archive" ]]; then
    rm -f "$archive"
  fi
  
  info "✅ Secrets restaurés"
}

restore_secrets_remote "$TENANT" "$BACKUP_DIR"
echo ""

# Résumé
section "📊 Résumé restore:"
echo "  Tenant: $TENANT"
echo "  Serveur: $SERVER_NAME"
echo "  Backup: $BACKUP_DIR"
echo ""
info "✅ Restore complété"
echo ""
warn "⚠️  IMPORTANT: Vérifier les healthchecks des services après restore"

