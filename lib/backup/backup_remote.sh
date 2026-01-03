#!/bin/bash
# backup_remote.sh - Backup serveur client via SSH (Phase 3)
# Usage: backup_remote.sh <tenant> <server_name> <output_dir>

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
  error "Usage: $0 <tenant> <server_name> <output_dir>"
  exit 1
fi

TENANT="$1"
SERVER_NAME="$2"
OUTPUT_DIR="$3"

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

# Créer répertoire de sortie
mkdir -p "$OUTPUT_DIR/tenants/$TENANT/platform"
mkdir -p "$OUTPUT_DIR/tenants/$TENANT/secrets"

section "📦 Backup serveur client: $SERVER_NAME (tenant: $TENANT)"
echo ""

# 1. Backup volumes Vault
section "1. Backup volumes Vault..."
backup_vault_volumes_remote() {
  local tenant="$1"
  local output_dir="$2"
  
  local remote_base_dir="/opt/dorevia-platform"
  local volumes=("vault_storage_${tenant}" "vault_ledger_${tenant}" "vault_audit_${tenant}")
  local volume_names=("storage" "ledger" "audit")
  
  for i in "${!volumes[@]}"; do
    local volume="${volumes[$i]}"
    local name="${volume_names[$i]}"
    
    # Vérifier si le volume existe sur le serveur distant
    if ! ssh_exec "sudo docker volume inspect $volume" true &>/dev/null; then
      warn "Volume $volume non trouvé sur serveur distant (skip)"
      continue
    fi
    
    info "Backup volume Vault: $volume..."
    
    # Créer archive temporaire sur serveur distant
    local temp_archive="/tmp/vault-${name}-${tenant}-$(date +%s).tar.gz"
    
    # Archiver volume sur serveur distant
    ssh_exec "sudo docker run --rm -v ${volume}:/data:ro -v /tmp:/backup alpine sh -c 'cd /data && tar -czf /backup/$(basename $temp_archive) .'" || {
      error "Échec archivage volume $volume"
      return 1
    }
    
    # Copier archive vers local
    local local_archive="$output_dir/tenants/$TENANT/platform/vault-${name}.tar.gz"
    scp -i "$DEPLOY_SSH_KEY" \
        -o ConnectTimeout=10 \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -P "${DEPLOY_SSH_PORT:-22}" \
        "${DEPLOY_SSH_HOST}:${temp_archive}" \
        "$local_archive" >/dev/null 2>&1 || {
      error "Échec copie archive $volume"
      return 1
    }
    
    # Nettoyer archive temporaire distante
    ssh_exec "rm -f $temp_archive" true
    
    # Valider intégrité archive
    if ! tar -tzf "$local_archive" >/dev/null 2>&1; then
      error "Archive invalide: $local_archive"
      return 1
    fi
    
    info "✅ Volume $volume sauvegardé: $local_archive"
  done
}

backup_vault_volumes_remote "$TENANT" "$OUTPUT_DIR"
echo ""

# 2. Backup Vault DB
section "2. Backup Vault DB..."
backup_vault_db_remote() {
  local tenant="$1"
  local output_dir="$2"
  
  local remote_base_dir="/opt/dorevia-platform"
  local db_container="vault-db-${tenant}"
  
  # Vérifier si container existe
  if ! ssh_exec "sudo docker ps --format '{{.Names}}' | grep -q '^${db_container}$'" true; then
    warn "Container $db_container non trouvé sur serveur distant (skip)"
    return 0
  fi
  
  info "Backup DB Vault..."
  
  # Créer dump sur serveur distant
  local temp_dump="/tmp/vault-db-${tenant}-$(date +%s).dump"
  
  ssh_exec "sudo docker exec $db_container pg_dump -U vault -Fc dorevia_vault > $temp_dump" || {
    error "Échec dump DB Vault"
    return 1
  }
  
  # Copier dump vers local
  local local_dump="$output_dir/tenants/$TENANT/platform/vault-db.dump"
  scp -i "$DEPLOY_SSH_KEY" \
      -o ConnectTimeout=10 \
      -o StrictHostKeyChecking=no \
      -o UserKnownHostsFile=/dev/null \
      -P "${DEPLOY_SSH_PORT:-22}" \
      "${DEPLOY_SSH_HOST}:${temp_dump}" \
      "$local_dump" >/dev/null 2>&1 || {
    error "Échec copie dump DB Vault"
    return 1
  }
  
  # Nettoyer dump temporaire distant
  ssh_exec "rm -f $temp_dump" true
  
  # Valider intégrité dump
  if [[ ! -f "$local_dump" ]] || [[ ! -s "$local_dump" ]]; then
    error "Dump invalide: $local_dump"
    return 1
  fi
  
  info "✅ DB Vault sauvegardée: $local_dump"
}

backup_vault_db_remote "$TENANT" "$OUTPUT_DIR"
echo ""

# 3. Backup secrets (chiffré)
section "3. Backup secrets (chiffré)..."
backup_secrets_remote() {
  local tenant="$1"
  local output_dir="$2"
  
  local remote_secrets_dir="/opt/dorevia-platform/tenants/$TENANT/secrets"
  
  # Vérifier si répertoire secrets existe
  if ! ssh_exec "test -d '$remote_secrets_dir'" true; then
    warn "Répertoire secrets non trouvé sur serveur distant (skip)"
    return 0
  fi
  
  info "Backup secrets (chiffré)..."
  
  # Créer archive temporaire sur serveur distant
  local temp_archive="/tmp/secrets-${tenant}-$(date +%s).tar.gz"
  
  # Archiver secrets sur serveur distant
  ssh_exec "cd '$remote_secrets_dir' && tar -czf $temp_archive ." || {
    error "Échec archivage secrets"
    return 1
  }
  
  # Copier archive vers local
  local local_archive="$output_dir/tenants/$TENANT/secrets/secrets.tar.gz"
  scp -i "$DEPLOY_SSH_KEY" \
      -o ConnectTimeout=10 \
      -o StrictHostKeyChecking=no \
      -o UserKnownHostsFile=/dev/null \
      -P "${DEPLOY_SSH_PORT:-22}" \
      "${DEPLOY_SSH_HOST}:${temp_archive}" \
      "$local_archive" >/dev/null 2>&1 || {
    error "Échec copie archive secrets"
    return 1
  }
  
  # Nettoyer archive temporaire distante
  ssh_exec "rm -f $temp_archive" true
  
  # Chiffrer archive (si gpg disponible)
  if command -v gpg &> /dev/null; then
    local encrypted_archive="${local_archive}.gpg"
    # Utiliser une clé GPG si disponible, sinon demander un mot de passe
    if gpg --list-secret-keys | grep -q "dorevia"; then
      gpg --encrypt --recipient dorevia --output "$encrypted_archive" "$local_archive" 2>/dev/null || {
        warn "Échec chiffrement GPG, archive non chiffrée conservée"
      }
    else
      # Chiffrement avec mot de passe (interactif)
      warn "Aucune clé GPG 'dorevia' trouvée. Chiffrement avec mot de passe requis."
      echo "⚠️  Pour chiffrer l'archive, exécutez: gpg --symmetric $local_archive"
    fi
  else
    warn "gpg non disponible. Archive non chiffrée."
  fi
  
  # Permissions sécurisées
  chmod 600 "$local_archive" 2>/dev/null || chmod 640 "$local_archive"
  
  # Valider intégrité archive
  if ! tar -tzf "$local_archive" >/dev/null 2>&1; then
    error "Archive invalide: $local_archive"
    return 1
  fi
  
  info "✅ Secrets sauvegardés: $local_archive"
}

backup_secrets_remote "$TENANT" "$OUTPUT_DIR"
echo ""

# Résumé
section "📊 Résumé backup:"
echo "  Tenant: $TENANT"
echo "  Serveur: $SERVER_NAME"
echo "  Répertoire: $OUTPUT_DIR"
echo ""
info "✅ Backup complété"

