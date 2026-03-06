#!/bin/bash
# dorevia.sh - Orchestrateur de Plateforme Dorevia
# Version: 1.0
# SPEC dorevia.sh v1.0

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TENANTS_DIR="$ROOT_DIR/tenants"

# Codes d'erreur (selon SPEC)
E01=1  # paramètre invalide (env/univers/tenant)
E02=2  # invariant violé (source/token mismatch, latest en STINGER/PROD)
E03=3  # dépendance manquante (docker/compose)
E04=4  # platform down (tentative app up)
E05=5  # ressource occupée (collision noms/volumes)
E06=6  # opération destructive sans flag --purge

# Fonctions utilitaires
error() {
  echo "ERROR: $1" >&2
  exit "${2:-1}"
}

# Journalisation structurée (Phase 1)
# Format: timestamp|level|tenant|env|unit|action|message
_log_structured() {
  local level="$1"  # INFO, WARN, ERROR
  local tenant="${2:-}"
  local env="${3:-}"
  local unit="${4:-}"  # platform, app, gateway, etc.
  local action="${5:-}"  # up, down, render, apply, etc.
  local message="${6:-}"
  
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%d %H:%M:%S")
  
  # Format structuré (texte, facilement parseable)
  local log_line="${timestamp}|${level}|${tenant}|${env}|${unit}|${action}|${message}"
  
  # Écrire dans fichier log si variable d'environnement définie
  if [[ -n "${DOREVIA_LOG_FILE:-}" ]]; then
    echo "$log_line" >> "$DOREVIA_LOG_FILE"
  fi
  
  # Toujours afficher sur stdout/stderr selon le niveau
  case "$level" in
    ERROR)
      echo "ERROR: $message" >&2
      ;;
    WARN)
      echo "WARN: $message" >&2
      ;;
    INFO)
      echo "INFO: $message"
      ;;
  esac
}

# Wrappers pour faciliter l'utilisation
log_info() {
  _log_structured "INFO" "$@"
}

log_warn() {
  _log_structured "WARN" "$@"
}

log_error() {
  _log_structured "ERROR" "$@"
}

# Validation tenant (slug DNS)
validate_tenant() {
  local tenant="$1"
  # Slug DNS: [a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?
  if [[ ! "$tenant" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]]; then
    error "Tenant invalide: $tenant (E01)" "$E01"
  fi
}

# Validation env
validate_env() {
  local env="$1"
  case "$env" in
    lab|stinger|prod) ;;
    *) error "Environnement invalide: $env (doit être lab, stinger ou prod) (E01)" "$E01" ;;
  esac
}

# Validation univers (odoo, suitecrm, n8n, pos, sylius, ui)
validate_univers() {
  local univers="$1"
  case "$univers" in
    odoo|suitecrm|n8n|pos|sylius|ui) ;;
    *) error "Univers invalide: $univers (E01)" "$E01" ;;
  esac
}

# Fonctions helper pour génération de noms depuis manifest (Phase 1)
# Ces fonctions centralisent la logique de nommage déterministe

# Lire manifest (cache en mémoire pour éviter multiples lectures)
_read_manifest() {
  local tenant="$1"
  local manifest_file="$TENANTS_DIR/$tenant/state/manifest.json"
  
  if [[ ! -f "$manifest_file" ]]; then
    error "Manifest introuvable: $manifest_file (E03)" "$E03"
  fi
  
  if ! command -v jq &> /dev/null; then
    error "jq n'est pas installé. Veuillez l'installer." "$E03"
  fi
  
  cat "$manifest_file"
}

# Générer nom container platform (déterministe)
_get_platform_container_name() {
  local unit="$1"  # dvig, vault, vault-db
  local tenant="$2"
  
  case "$unit" in
    dvig) echo "dvig-$tenant" ;;
    vault) echo "vault-$tenant" ;;
    vault-db|vault_db) echo "vault-db-$tenant" ;;
    *) error "Unit platform inconnue: $unit (E01)" "$E01" ;;
  esac
}

# Générer nom container app (déterministe)
# unit = nom service (odoo, suitecrm, n8n pour l'app ; db pour la base)
_get_app_container_name() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  local unit="$4"
  
  case "$unit" in
    db) echo "${univers}_db_${env}_${tenant}" ;;
    odoo|suitecrm|n8n|pos|sylius) echo "${univers}_${env}_${tenant}" ;;
    *) error "Unit app inconnue: $unit (E01)" "$E01" ;;
  esac
}

# Générer nom DB (déterministe)
_get_db_name() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  
  echo "${univers}_${env}_${tenant}"
}

# Générer nom volume (déterministe)
_get_volume_name() {
  local type="$1"  # db, data, storage, ledger, audit, logs
  local context="$2"  # platform ou app
  local tenant="$3"
  local env="${4:-}"  # optionnel pour app
  local univers="${5:-}"  # optionnel pour app
  
  case "$context" in
    platform)
      case "$type" in
        db) echo "vault_db_${tenant}_data" ;;
        storage) echo "vault_storage_${tenant}" ;;
        ledger) echo "vault_ledger_${tenant}" ;;
        audit) echo "vault_audit_${tenant}" ;;
        logs) echo "dvig_logs_${tenant}" ;;
        *) error "Type volume platform inconnu: $type (E01)" "$E01" ;;
      esac
      ;;
    app)
      if [[ -z "$env" || -z "$univers" ]]; then
        error "env et univers requis pour volumes app (E01)" "$E01"
      fi
      case "$type" in
        db) echo "${univers}_${env}_${tenant}_db" ;;
        data) echo "${univers}_${env}_${tenant}_data" ;;
        *) error "Type volume app inconnu: $type (E01)" "$E01" ;;
      esac
      ;;
    *)
      error "Contexte volume inconnu: $context (E01)" "$E01" ;;
  esac
}

# Générer nom projet compose (déterministe)
_get_compose_project_name() {
  local context="$1"  # platform ou app
  local tenant="$2"
  local env="${3:-}"  # optionnel pour platform
  local univers="${4:-}"  # optionnel pour app
  
  case "$context" in
    platform)
      echo "dorevia_${tenant}_platform"
      ;;
    app)
      if [[ -z "$env" || -z "$univers" ]]; then
        error "env et univers requis pour projet compose app (E01)" "$E01"
      fi
      echo "dorevia_${univers}_${env}_${tenant}"
      ;;
    *)
      error "Contexte compose inconnu: $context (E01)" "$E01" ;;
  esac
}

# Générer hostname (déterministe, Phase 1 avec ENV)
_get_hostname() {
  local service="$1"  # odoo, dvig, vault
  local env="$2"
  local tenant="$3"
  local base_domain="${4:-doreviateam.com}"
  
  case "$service" in
    odoo)
      # Apps : incluent l'environnement
      echo "${service}.${env}.${tenant}.${base_domain}"
      ;;
    dvig|vault)
      # Services cœur : 1 par tenant (sans environnement)
      echo "${service}.${tenant}.${base_domain}"
      ;;
    *)
      error "Service inconnu: $service (E01)" "$E01" ;;
  esac
}

# Commande help
cmd_help() {
  cat <<EOF
dorevia.sh - Orchestrateur de Plateforme Dorevia
Version: 1.0

Usage:
  dorevia.sh <command> <subcommand> [args...] [--flags]

Commands:
  gateway up                          Démarre gateway globale (Caddy)
  gateway status                      Affiche statut gateway
  gateway down                        Stoppe gateway
  gateway reload                      Recharge configuration Caddy
  gateway aggregate [--reload]        Agrège tous les Caddyfiles dans Caddyfile global
  
  platform up <tenant>          Démarre services partagés
  platform status <tenant>       Affiche statut services partagés
  platform down <tenant>         Stoppe services partagés
  platform destroy <tenant>      Détruit services partagés (--purge requis)
  
  app up <univers> <env> <tenant>     Démarre application
  app status <univers> <env> <tenant> Affiche statut application
  app down <univers> <env> <tenant>    Stoppe application
  app reset <univers> <env> <tenant>  Reset application (--purge requis)
  app destroy <univers> <env> <tenant> Détruit application (--purge requis)
  
  token issue <univers> <env> <tenant>  Crée token DVIG
  token list <tenant>                   Liste tokens
  token revoke <tenant> <token_id>     Révoque token
  token rotate <univers> <env> <tenant> Rotation token
  
  validate <tenant>                   Valide le manifest Phase 1 (Phase 1)
  render <tenant> --env <env>         Génère tous les artefacts depuis manifest (Phase 1)
  preflight <tenant> --env <env> [--check-dns] [--intent <file>]  Vérifie prérequis avant déploiement (Phase 1/3)
  apply <tenant> --env <env> [--intent <file>] [--auto-gateway]  Déploie depuis fichiers générés ou intention (Phase 1/2)
  prompt <tenant> [--env <env>]     Capture intention via CLI interactif (Phase 2)
  production <tenant> [--phase <0|1|2|3|4|5|all>]  Processus mise en production (Phase 2)
  
  server list                         Liste serveurs configurés (Phase 3)
  server add <server_name>            Ajoute un serveur (Phase 3)
  server preflight <server_name>      Préflight serveur client (Phase 3)
  server status <server_name>         Statut serveur client (Phase 3)
  
  backup <tenant> [--server <server_name>] [--output <dir>]  Backup tenant (Phase 3)
  restore <tenant> [--server <server_name>] --from <backup_dir>  Restore tenant (Phase 3)
  
  help                                Affiche cette aide
  version                             Affiche version
  doctor                              Vérifie prérequis

EOF
}

# Commande version
cmd_version() {
  echo "dorevia.sh version 1.0"
}

# Commande doctor
cmd_doctor() {
  echo "🔍 Vérification prérequis..."
  
  # Docker
  if ! command -v docker &> /dev/null; then
    error "Docker non installé (E03)" "$E03"
  fi
  echo "✅ Docker installé"
  
  # Docker Compose
  if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    error "Docker Compose non installé (E03)" "$E03"
  fi
  echo "✅ Docker Compose installé"
  
  # Réseau Docker
  if ! docker network inspect dorevia-network &> /dev/null; then
    echo "⚠️  Réseau dorevia-network non créé (créer avec: docker network create dorevia-network)"
  else
    echo "✅ Réseau dorevia-network existe"
  fi
  
  echo "✅ Prérequis OK"
}

# Commande validate (Phase 1)
cmd_validate() {
  local tenant="${1:-}"
  
  if [[ -z "$tenant" ]]; then
    error "Usage: dorevia.sh validate <tenant> (E01)" "$E01"
  fi
  
  validate_tenant "$tenant"
  
  local manifest_file="$TENANTS_DIR/$tenant/state/manifest.json"
  
  if [[ ! -f "$manifest_file" ]]; then
    error "Manifest introuvable: $manifest_file (E03)" "$E03"
  fi
  
  # Appeler le validateur
  local validate_script="$ROOT_DIR/lib/validate.sh"
  
  if [[ ! -f "$validate_script" ]]; then
    error "Script de validation introuvable: $validate_script (E03)" "$E03"
  fi
  
  log_info "$tenant" "" "validate" "start" "Validation manifest pour tenant: $tenant"
  
  # Exécuter validation
  if "$validate_script" "$manifest_file"; then
    log_info "$tenant" "" "validate" "complete" "Manifest $tenant valide (Phase 1)"
    echo "✅ Manifest $tenant valide (Phase 1)"
    return 0
  else
    log_error "$tenant" "" "validate" "failed" "Manifest $tenant invalide"
    error "Manifest $tenant invalide (E02)" "$E02"
  fi
}

# Commande preflight (Phase 1 + Phase 3: --check-dns)
cmd_preflight() {
  local tenant="${1:-}"
  local env=""
  local check_dns=false
  local intent_file=""
  
  # Parser arguments
  shift || true
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --env)
        env="${2:-}"
        shift 2 || true
        ;;
      --check-dns)
        check_dns=true
        shift
        ;;
      --intent)
        intent_file="${2:-}"
        shift 2 || true
        ;;
      *)
        error "Option inconnue: $1 (Usage: dorevia.sh preflight <tenant> --env <env> [--check-dns] [--intent <file>]) (E01)" "$E01"
        ;;
    esac
  done
  
  if [[ -z "$tenant" ]]; then
    error "Usage: dorevia.sh preflight <tenant> --env <env> [--check-dns] [--intent <file>] (E01)" "$E01"
  fi
  
  if [[ -z "$env" ]]; then
    error "Option --env requise (Usage: dorevia.sh preflight <tenant> --env <env> [--check-dns]) (E01)" "$E01"
  fi
  
  validate_tenant "$tenant"
  validate_env "$env"
  
  # Phase 3: Validation DNS uniquement
  if [[ "$check_dns" == "true" ]]; then
    local check_dns_script="$ROOT_DIR/lib/preflight/check_dns_all.sh"
    
    if [[ ! -f "$check_dns_script" ]]; then
      error "Script check_dns_all introuvable: $check_dns_script (E03)" "$E03"
    fi
    
    # Construire arguments
    local args=("$tenant" "$env")
    if [[ -n "$intent_file" ]]; then
      args+=("--intent" "$intent_file")
    fi
    
    # Exécuter validation DNS
    if "$check_dns_script" "${args[@]}"; then
      return 0
    else
      error "Validation DNS échouée (E02)" "$E02"
    fi
  fi
  
  # Préflight standard (Phase 1)
  local preflight_script="$ROOT_DIR/lib/preflight/preflight.sh"
  
  if [[ ! -f "$preflight_script" ]]; then
    error "Script preflight introuvable: $preflight_script (E03)" "$E03"
  fi
  
  # Exécuter preflight
  if "$preflight_script" "$tenant" "$env"; then
    return 0
  else
    error "Préflight échoué (E02)" "$E02"
  fi
}

# Commande production (Phase 2)
cmd_production() {
  local tenant="${1:-}"
  local phase="all"
  
  # Parser arguments
  shift || true
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --phase)
        phase="${2:-all}"
        shift 2 || true
        ;;
      *)
        error "Option inconnue: $1 (Usage: dorevia.sh production <tenant> [--phase <0|1|2|3|4|5|all>]) (E01)" "$E01"
        ;;
    esac
  done
  
  if [[ -z "$tenant" ]]; then
    error "Usage: dorevia.sh production <tenant> [--phase <0|1|2|3|4|5|all>] (E01)" "$E01"
  fi
  
  validate_tenant "$tenant"
  
  log_info "$tenant" "prod" "production" "start" "Démarrage processus mise en production"
  
  local phase0_script="$ROOT_DIR/lib/production/phase0_preconditions.sh"
  local phase1_script="$ROOT_DIR/lib/production/phase1_gonogo.sh"
  local phase2_script="$ROOT_DIR/lib/production/phase2_preflight_prod.sh"
  
  # Phase 0 : Préconditions
  if [[ "$phase" == "0" || "$phase" == "all" ]]; then
    echo "🔍 Phase 0 : Préconditions"
    echo "============================================================"
    if [[ ! -f "$phase0_script" ]]; then
      error "Script Phase 0 introuvable: $phase0_script (E03)" "$E03"
    fi
    
    if bash "$phase0_script" "$tenant"; then
      log_info "$tenant" "prod" "production" "phase0" "Phase 0 : Préconditions validées"
      echo ""
    else
      log_error "$tenant" "prod" "production" "phase0" "Phase 0 : Préconditions échouées"
      error "Phase 0 échouée (E02)" "$E02"
    fi
  fi
  
  # Phase 1 : Go/No-Go
  if [[ "$phase" == "1" || "$phase" == "all" ]]; then
    echo "📋 Phase 1 : Go/No-Go"
    echo "============================================================"
    if [[ ! -f "$phase1_script" ]]; then
      error "Script Phase 1 introuvable: $phase1_script (E03)" "$E03"
    fi
    
    if bash "$phase1_script" "$tenant"; then
      log_info "$tenant" "prod" "production" "phase1" "Phase 1 : Go validé"
      echo ""
    else
      log_error "$tenant" "prod" "production" "phase1" "Phase 1 : No-Go"
      error "Phase 1 : No-Go (E02)" "$E02"
    fi
  fi
  
  # Phase 2 : Préflight Production
  if [[ "$phase" == "2" || "$phase" == "all" ]]; then
    echo "🔍 Phase 2 : Préflight Production"
    echo "============================================================"
    if [[ ! -f "$phase2_script" ]]; then
      error "Script Phase 2 introuvable: $phase2_script (E03)" "$E03"
    fi
    
    # Extraire serveur depuis manifest si disponible
    local manifest_file="$TENANTS_DIR/$tenant/state/manifest.json"
    local server_args=""
    if [[ -f "$manifest_file" ]] && command -v jq &> /dev/null; then
      local server_ip=$(jq -r '.prod.public_ip // ""' "$manifest_file" 2>/dev/null || echo "")
      local ssh_user=$(jq -r '.prod.ssh_user // "ubuntu"' "$manifest_file" 2>/dev/null || echo "ubuntu")
      if [[ -n "$server_ip" ]]; then
        server_args="--server $server_ip --ssh-user $ssh_user"
      fi
    fi
    
    if bash "$phase2_script" "$tenant" $server_args; then
      log_info "$tenant" "prod" "production" "phase2" "Phase 2 : Préflight Production validé"
      echo ""
    else
      log_error "$tenant" "prod" "production" "phase2" "Phase 2 : Préflight Production échoué"
      error "Phase 2 échouée (E02)" "$E02"
    fi
  fi
  
  # Phase 3 : Génération Configuration
  local phase3_script="$ROOT_DIR/lib/production/phase3_config.sh"
  if [[ "$phase" == "3" || "$phase" == "all" ]]; then
    echo "🔧 Phase 3 : Génération Configuration"
    echo "============================================================"
    if [[ ! -f "$phase3_script" ]]; then
      error "Script Phase 3 introuvable: $phase3_script (E03)" "$E03"
    fi
    
    if bash "$phase3_script" "$tenant"; then
      log_info "$tenant" "prod" "production" "phase3" "Phase 3 : Génération Configuration terminée"
      echo ""
    else
      log_error "$tenant" "prod" "production" "phase3" "Phase 3 : Génération Configuration échouée"
      error "Phase 3 échouée (E02)" "$E02"
    fi
  fi
  
  # Phase 4 : Apply Prod
  local phase4_script="$ROOT_DIR/lib/production/phase4_apply_prod.sh"
  if [[ "$phase" == "4" || "$phase" == "all" ]]; then
    echo "🚀 Phase 4 : Apply Prod"
    echo "============================================================"
    if [[ ! -f "$phase4_script" ]]; then
      error "Script Phase 4 introuvable: $phase4_script (E03)" "$E03"
    fi
    
    if bash "$phase4_script" "$tenant" --auto-gateway; then
      log_info "$tenant" "prod" "production" "phase4" "Phase 4 : Apply Prod terminé"
      echo ""
    else
      log_error "$tenant" "prod" "production" "phase4" "Phase 4 : Apply Prod échoué"
      error "Phase 4 échouée (E02)" "$E02"
    fi
  fi
  
  # Phase 5 : Validation Post-Prod
  local phase5_script="$ROOT_DIR/lib/production/phase5_validation.sh"
  if [[ "$phase" == "5" || "$phase" == "all" ]]; then
    echo "🔍 Phase 5 : Validation Post-Prod"
    echo "============================================================"
    if [[ ! -f "$phase5_script" ]]; then
      error "Script Phase 5 introuvable: $phase5_script (E03)" "$E03"
    fi
    
    if bash "$phase5_script" "$tenant"; then
      log_info "$tenant" "prod" "production" "phase5" "Phase 5 : Validation Post-Prod réussie"
      echo ""
    else
      log_error "$tenant" "prod" "production" "phase5" "Phase 5 : Validation Post-Prod échouée"
      error "Phase 5 échouée (E02)" "$E02"
    fi
  fi
  
  if [[ "$phase" == "all" ]]; then
    log_info "$tenant" "prod" "production" "complete" "Phases 0-5 complétées avec succès"
    echo "✅ Phases 0-5 : Processus de mise en production terminé"
    echo ""
    echo "📄 Rapports générés:"
    echo "   - Go/No-Go: tenants/$tenant/state/gonogo-*.md"
    echo "   - Validation: tenants/$tenant/state/prod-validation-*.md"
  fi
}

# Commande prompt (Phase 2)
cmd_prompt() {
  local tenant="${1:-}"
  local env=""
  
  # Parser arguments
  shift || true
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --env)
        env="${2:-}"
        shift 2 || true
        ;;
      *)
        error "Option inconnue: $1 (Usage: dorevia.sh prompt <tenant> [--env <env>]) (E01)" "$E01"
        ;;
    esac
  done
  
  if [[ -z "$tenant" ]]; then
    error "Usage: dorevia.sh prompt <tenant> [--env <env>] (E01)" "$E01"
  fi
  
  validate_tenant "$tenant"
  
  if [[ -n "$env" ]]; then
    validate_env "$env"
  fi
  
  local prompt_script="$ROOT_DIR/lib/prompt/prompt.py"
  
  if [[ ! -f "$prompt_script" ]]; then
    error "Script de prompt introuvable: $prompt_script (E03)" "$E03"
  fi
  
  # Vérifier Python
  if ! command -v python3 &> /dev/null; then
    error "Python3 n'est pas installé. Veuillez l'installer." "$E03"
  fi
  
  # Exécuter le script Python
  if python3 "$prompt_script" "$tenant" ${env:+--env "$env"}; then
    echo "✅ Capture d'intention terminée"
    return 0
  else
    error "Échec capture d'intention (E02)" "$E02"
  fi
}

# Fonction helper : Mettre à jour manifest depuis intention
_apply_intent_to_manifest() {
  local intent_file="$1"
  local manifest_file="$2"
  
  if [[ ! -f "$intent_file" ]]; then
    error "Fichier intention introuvable: $intent_file (E03)" "$E03"
    return 1
  fi
  
  if [[ ! -f "$manifest_file" ]]; then
    error "Manifest introuvable: $manifest_file (E03)" "$E03"
    return 1
  fi
  
  if ! command -v jq &> /dev/null; then
    error "jq n'est pas installé. Veuillez l'installer." "$E03"
    return 1
  fi
  
  # Lire intention et manifest
  local intent=$(cat "$intent_file")
  local manifest=$(cat "$manifest_file")
  
  # Extraire informations depuis intention
  local prod_mode=$(echo "$intent" | jq -r '.intention.mode // "saas"' 2>/dev/null || echo "saas")
  local server_ip=$(echo "$intent" | jq -r '.intention.server.public_ip // ""' 2>/dev/null || echo "")
  local ssh_user=$(echo "$intent" | jq -r '.intention.server.ssh_user // "ubuntu"' 2>/dev/null || echo "ubuntu")
  local env_from_intent=$(echo "$intent" | jq -r '.environment // "prod"' 2>/dev/null || echo "prod")
  
  # Mettre à jour manifest
  if [[ "$prod_mode" == "client" || "$prod_mode" == "hybrid" ]]; then
    manifest=$(echo "$manifest" | jq --arg mode "$prod_mode" --arg ip "$server_ip" --arg user "$ssh_user" \
      '.prod.target = $mode | .prod.public_ip = $ip | .prod.ssh_user = $user' 2>/dev/null || echo "$manifest")
  fi
  
  # S'assurer que l'environnement est dans la liste
  local environments=$(echo "$manifest" | jq -r '.environments[]' 2>/dev/null || echo "")
  if ! echo "$environments" | grep -q "^${env_from_intent}$"; then
    manifest=$(echo "$manifest" | jq --arg env "$env_from_intent" '.environments += [$env]' 2>/dev/null || echo "$manifest")
  fi
  
  # Sauvegarder manifest mis à jour
  echo "$manifest" | jq '.' > "$manifest_file.tmp" 2>/dev/null
  if [[ $? -eq 0 ]]; then
    mv "$manifest_file.tmp" "$manifest_file"
    log_info "" "$env_from_intent" "apply" "manifest" "Manifest mis à jour depuis intention"
    return 0
  else
    log_warn "" "$env_from_intent" "apply" "manifest" "Impossible de mettre à jour manifest (continuer quand même)"
    rm -f "$manifest_file.tmp"
    return 0  # Non bloquant
  fi
}

# Commande apply (Phase 1 + Phase 2)
cmd_apply() {
  local tenant="${1:-}"
  local env=""
  local auto_gateway=false
  local intent_file=""
  
  # Parser arguments
  shift || true
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --env)
        env="${2:-}"
        shift 2 || true
        ;;
      --auto-gateway)
        auto_gateway=true
        shift
        ;;
      --intent)
        intent_file="${2:-}"
        shift 2 || true
        ;;
      *)
        error "Option inconnue: $1 (Usage: dorevia.sh apply <tenant> --env <env> [--intent <file>] [--auto-gateway]) (E01)" "$E01"
        ;;
    esac
  done
  
  if [[ -z "$tenant" ]]; then
    error "Usage: dorevia.sh apply <tenant> --env <env> [--intent <file>] [--auto-gateway] (E01)" "$E01"
  fi
  
  validate_tenant "$tenant"
  
  # Vérifier jq
  if ! command -v jq &> /dev/null; then
    error "jq n'est pas installé. Veuillez l'installer." "$E03"
  fi
  
  local manifest_file="$TENANTS_DIR/$tenant/state/manifest.json"
  
  # Si --intent est fourni, traiter l'intention
  if [[ -n "$intent_file" ]]; then
    log_info "$tenant" "" "apply" "intent" "Mode apply depuis intention: $intent_file"
    echo "📄 Mode apply depuis intention: $intent_file"
    echo ""
    
    # Vérifier fichier intention
    if [[ ! -f "$intent_file" ]]; then
      error "Fichier intention introuvable: $intent_file (E03)" "$E03"
    fi
    
    # Lire environnement depuis intention si non fourni
    if [[ -z "$env" ]]; then
      env=$(jq -r '.environment // "prod"' "$intent_file" 2>/dev/null || echo "prod")
      log_info "$tenant" "$env" "apply" "intent" "Environnement détecté depuis intention: $env"
    fi
    
    # Mettre à jour manifest depuis intention
    if ! _apply_intent_to_manifest "$intent_file" "$manifest_file"; then
      error "Échec mise à jour manifest depuis intention (E02)" "$E02"
    fi
    
    # Générer fichiers rendus depuis manifest mis à jour
    log_info "$tenant" "$env" "apply" "render" "Génération fichiers rendus depuis intention"
    echo "🔧 Génération fichiers rendus depuis intention..."
    if ! cmd_render "$tenant" --env "$env"; then
      error "Échec génération fichiers rendus (E02)" "$E02"
    fi
    echo ""
  else
    # Mode normal : vérifier que env est fourni
    if [[ -z "$env" ]]; then
      error "Option --env requise (Usage: dorevia.sh apply <tenant> --env <env>) (E01)" "$E01"
    fi
  fi
  
  # Vérifier manifest
  if [[ ! -f "$manifest_file" ]]; then
    error "Manifest introuvable: $manifest_file (E03)" "$E03"
  fi
  
  # Vérifier fichiers rendered
  local rendered_dir="$TENANTS_DIR/$tenant/rendered/$env"
  if [[ ! -d "$rendered_dir" ]]; then
    error "Répertoire rendered introuvable: $rendered_dir. Générer avec: dorevia.sh render $tenant --env $env (E03)" "$E03"
  fi
  
  local rendered_platform="$rendered_dir/platform/docker-compose.yml"
  local rendered_caddy="$rendered_dir/caddy/Caddyfile"
  
  if [[ ! -f "$rendered_platform" ]]; then
    error "Fichier rendered platform introuvable: $rendered_platform. Générer avec: dorevia.sh render $tenant --env $env (E03)" "$E03"
  fi
  
  log_info "$tenant" "$env" "apply" "start" "Déploiement Phase 1 pour tenant: $tenant, env: $env"
  echo "🚀 Déploiement Phase 1 pour tenant: $tenant, env: $env"
  echo ""
  
  # Lire manifest
  local manifest=$(cat "$manifest_file")
  local universes=$(echo "$manifest" | jq -r '.universes[]')
  
  # 1. Déployer platform (prérequis pour apps)
  log_info "$tenant" "$env" "apply" "platform" "Déploiement platform"
  echo "📦 Déploiement platform..."
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  mkdir -p "$platform_dir"
  
  # Copier fichier rendered vers platform_dir
  cp "$rendered_platform" "$platform_dir/docker-compose.yml"
  
  cd "$platform_dir" || error "Impossible d'accéder à $platform_dir (E03)" "$E03"
  
  local project_name="$(_get_compose_project_name "platform" "$tenant")"
  
  if docker compose -p "$project_name" up -d; then
    log_info "$tenant" "$env" "apply" "platform" "Platform déployée"
    echo "✅ Platform déployée"
  else
    log_error "$tenant" "$env" "apply" "platform" "Échec déploiement platform"
    error "Échec déploiement platform (E04)" "$E04"
  fi
  echo ""
  
  # 2. Déployer apps (pour chaque univers)
  for universe in $universes; do
    local rendered_app="$rendered_dir/$universe/docker-compose.yml"
    
    if [[ ! -f "$rendered_app" ]]; then
      log_warn "$tenant" "$env" "apply" "app" "Fichier rendered app ($universe) introuvable: $rendered_app"
      echo "⚠️  Fichier rendered app ($universe) introuvable: $rendered_app"
      echo "   Ignoré (générer avec: dorevia.sh render $tenant --env $env)"
      continue
    fi
    
    log_info "$tenant" "$env" "apply" "app" "Déploiement app ($universe)"
    echo "📦 Déploiement app ($universe)..."
    local app_dir="$TENANTS_DIR/$tenant/apps/$universe/$env"
    mkdir -p "$app_dir"
    
    # Copier fichier rendered vers app_dir
    cp "$rendered_app" "$app_dir/docker-compose.yml"
    
    # Générer odoo.conf si nécessaire (pour compatibilité)
    if [[ "$universe" == "odoo" && ! -f "$app_dir/odoo.conf" ]]; then
      local db_name="$(_get_db_name "$universe" "$env" "$tenant")"
      generate_app_odoo_conf "$universe" "$env" "$tenant" "$db_name"
    fi
    
    cd "$app_dir" || error "Impossible d'accéder à $app_dir (E03)" "$E03"
    
    local compose_project="$(_get_compose_project_name "app" "$tenant" "$env" "$universe")"
    
    if docker compose -p "$compose_project" up -d; then
      log_info "$tenant" "$env" "apply" "app" "App ($universe) déployée"
      echo "✅ App ($universe) déployée"
    else
      log_error "$tenant" "$env" "apply" "app" "Échec déploiement app ($universe)"
      error "Échec déploiement app ($universe) (E04)" "$E04"
    fi
    echo ""
  done
  
  # 3. Agrégation gateway automatique (si demandée)
  if [[ "$auto_gateway" == true ]]; then
    log_info "$tenant" "$env" "apply" "gateway" "Agrégation gateway automatique"
    echo "🌐 Agrégation gateway automatique..."
    
    # Appeler gateway aggregate avec reload
    if cmd_gateway_aggregate --reload 2>/dev/null; then
      log_info "$tenant" "$env" "apply" "gateway" "Gateway agrégée et rechargée"
      echo "✅ Gateway agrégée et rechargée"
    else
      # Ne pas faire échouer le déploiement si l'agrégation échoue
      log_warn "$tenant" "$env" "apply" "gateway" "Échec agrégation gateway (non bloquant)"
      echo "⚠️  Échec agrégation gateway (non bloquant)"
    fi
    echo ""
  elif [[ -f "$rendered_caddy" ]]; then
    # Note sur agrégation manuelle si option non activée
    log_info "$tenant" "$env" "apply" "caddyfile" "Caddyfile généré (agrégation manuelle requise)"
    echo "📝 Note: Caddyfile généré dans $rendered_caddy"
    echo "   Pour activer: dorevia.sh gateway aggregate --reload"
    echo "   Ou utiliser: dorevia.sh apply $tenant --env $env --auto-gateway"
    echo ""
  fi
  
  log_info "$tenant" "$env" "apply" "complete" "Déploiement terminé pour tenant: $tenant, env: $env"
  echo "✅ Déploiement terminé pour tenant: $tenant, env: $env"
  echo "💡 Vérifier le statut: dorevia.sh platform status $tenant"
  echo "💡 Vérifier les apps: dorevia.sh app status <univers> $env $tenant"
}

# Commande render (Phase 1)
cmd_render() {
  local tenant="${1:-}"
  local env=""
  
  # Parser arguments
  shift || true
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --env)
        env="${2:-}"
        shift 2 || true
        ;;
      *)
        error "Option inconnue: $1 (Usage: dorevia.sh render <tenant> --env <env>) (E01)" "$E01"
        ;;
    esac
  done
  
  if [[ -z "$tenant" ]]; then
    error "Usage: dorevia.sh render <tenant> --env <env> (E01)" "$E01"
  fi
  
  if [[ -z "$env" ]]; then
    error "Option --env requise (Usage: dorevia.sh render <tenant> --env <env>) (E01)" "$E01"
  fi
  
  validate_tenant "$tenant"
  
  # Vérifier manifest
  local manifest_file="$TENANTS_DIR/$tenant/state/manifest.json"
  if [[ ! -f "$manifest_file" ]]; then
    error "Manifest introuvable: $manifest_file (E03)" "$E03"
  fi
  
  # Vérifier jq
  if ! command -v jq &> /dev/null; then
    error "jq n'est pas installé. Veuillez l'installer." "$E03"
  fi
  
  echo "🎨 Génération des artefacts pour tenant: $tenant, env: $env"
  echo ""
  
  # Scripts de rendu
  local render_caddyfile="$ROOT_DIR/lib/render/render_caddyfile.sh"
  local render_platform="$ROOT_DIR/lib/render/render_platform_compose.sh"
  local render_app="$ROOT_DIR/lib/render/render_app_compose.sh"
  
  # Vérifier scripts
  if [[ ! -f "$render_caddyfile" ]]; then
    error "Script de rendu Caddyfile introuvable: $render_caddyfile (E03)" "$E03"
  fi
  if [[ ! -f "$render_platform" ]]; then
    error "Script de rendu platform introuvable: $render_platform (E03)" "$E03"
  fi
  if [[ ! -f "$render_app" ]]; then
    error "Script de rendu app introuvable: $render_app (E03)" "$E03"
  fi
  
  # Lire manifest
  local manifest=$(cat "$manifest_file")
  local universes=$(echo "$manifest" | jq -r '.universes[]')
  
  # 1. Générer Caddyfile
  log_info "$tenant" "$env" "render" "caddyfile" "Génération Caddyfile"
  echo "📝 Génération Caddyfile..."
  if "$render_caddyfile" "$tenant" "$env"; then
    log_info "$tenant" "$env" "render" "caddyfile" "Caddyfile généré"
    echo "✅ Caddyfile généré"
  else
    log_error "$tenant" "$env" "render" "caddyfile" "Échec génération Caddyfile"
    error "Échec génération Caddyfile (E02)" "$E02"
  fi
  echo ""
  
  # 2. Générer docker-compose.yml platform
  log_info "$tenant" "$env" "render" "platform" "Génération docker-compose.yml platform"
  echo "📝 Génération docker-compose.yml platform..."
  if "$render_platform" "$tenant" "$env"; then
    log_info "$tenant" "$env" "render" "platform" "docker-compose.yml platform généré"
    echo "✅ docker-compose.yml platform généré"
  else
    log_error "$tenant" "$env" "render" "platform" "Échec génération docker-compose.yml platform"
    error "Échec génération docker-compose.yml platform (E02)" "$E02"
  fi
  echo ""
  
  # 3. Générer docker-compose.yml app pour chaque univers
  for universe in $universes; do
    log_info "$tenant" "$env" "render" "app" "Génération docker-compose.yml app ($universe)"
    echo "📝 Génération docker-compose.yml app ($universe)..."
    if "$render_app" "$tenant" "$universe" "$env"; then
      log_info "$tenant" "$env" "render" "app" "docker-compose.yml app ($universe) généré"
      echo "✅ docker-compose.yml app ($universe) généré"
    else
      log_error "$tenant" "$env" "render" "app" "Échec génération docker-compose.yml app ($universe)"
      error "Échec génération docker-compose.yml app ($universe) (E02)" "$E02"
    fi
    echo ""
  done
  
  log_info "$tenant" "$env" "render" "complete" "Génération terminée pour tenant: $tenant, env: $env"
  echo "✅ Génération terminée pour tenant: $tenant, env: $env"
  echo "📁 Fichiers générés dans: tenants/$tenant/rendered/$env/"
}

# Fonction génération docker-compose depuis template
generate_platform_compose() {
  local tenant="$1"
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  local template="$platform_dir/docker-compose.yml.template"
  local output="$platform_dir/docker-compose.yml"
  
  if [[ ! -f "$template" ]]; then
    error "Template non trouvé: $template (E03)" "$E03"
  fi
  
  # Remplacer variables dans template
  sed -e "s|{{TENANT}}|$tenant|g" \
      -e "s|{{ROOT_DIR}}|$ROOT_DIR|g" \
      "$template" > "$output"
  
  echo "✅ docker-compose.yml généré pour tenant $tenant"
}

# Vérification réseau dorevia-network
check_dorevia_network() {
  if ! docker network inspect dorevia-network &> /dev/null; then
    echo "⚠️  Création réseau dorevia-network..."
    docker network create dorevia-network || error "Impossible de créer réseau dorevia-network (E03)" "$E03"
    echo "✅ Réseau dorevia-network créé"
  fi
}

# Vérification gateway (prérequis pour platform/app)
check_gateway() {
  local skip_check=false
  
  # Parser flags
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --no-gateway-check)
        skip_check=true
        ;;
      *)
        break
        ;;
    esac
    shift
  done
  
  if [[ "$skip_check" == "true" ]]; then
    return 0
  fi
  
  # Vérifier container gateway-caddy
  if ! docker ps --format "{{.Names}}" | grep -q "^gateway-caddy$"; then
    error "Gateway non démarrée. Démarrer avec: dorevia.sh gateway up (E04)" "$E04"
  fi
  
  # Vérifier réseau
  if ! docker network inspect dorevia-network &> /dev/null; then
    error "Réseau dorevia-network non trouvé (E03)" "$E03"
  fi
  
  return 0
}

# Commandes gateway
cmd_gateway() {
  local subcommand="${1:-help}"
  shift || true
  
  case "$subcommand" in
    up)
      cmd_gateway_up "$@"
      ;;
    status)
      cmd_gateway_status "$@"
      ;;
    down)
      cmd_gateway_down "$@"
      ;;
    reload)
      cmd_gateway_reload "$@"
      ;;
    aggregate)
      cmd_gateway_aggregate "$@"
      ;;
    *)
      echo "Sous-commande inconnue: $subcommand (utilisez 'help')" >&2
      exit "$E01"
      ;;
  esac
}

# gateway up
cmd_gateway_up() {
  local gateway_dir="$ROOT_DIR/units/gateway"
  
  if [[ ! -f "$gateway_dir/docker-compose.yml" ]]; then
    error "Gateway non trouvée: $gateway_dir/docker-compose.yml (E03)" "$E03"
  fi
  
  # Vérifier réseau
  check_dorevia_network
  
  cd "$gateway_dir" || error "Impossible d'accéder à $gateway_dir (E03)" "$E03"
  
  echo "🚀 Démarrage gateway globale (Caddy)..."
  if docker compose up -d; then
    echo "✅ Gateway démarrée"
    echo ""
    echo "📊 URLs routées:"
    echo "  - Services partagés: dvig.core.doreviateam.com, vault.core.doreviateam.com (1 par tenant, sans ENV)"
    echo "  - Applications: odoo.lab.core.doreviateam.com, odoo.stinger.core.doreviateam.com, odoo.prod.core.doreviateam.com"
    echo ""
    echo "💡 Vérifier le statut: dorevia.sh gateway status"
  else
    error "Échec démarrage gateway (E04)" "$E04"
  fi
}

# gateway status
cmd_gateway_status() {
  local gateway_dir="$ROOT_DIR/units/gateway"
  
  if [[ ! -f "$gateway_dir/docker-compose.yml" ]]; then
    echo "⚠️  Gateway non configurée"
    exit 0
  fi
  
  cd "$gateway_dir" || error "Impossible d'accéder à $gateway_dir (E03)" "$E03"
  
  echo "📊 Gateway globale - Statut:"
  echo ""
  
  # Statut container
  docker compose ps
  
  echo ""
  echo "🔗 Réseau:"
  if docker network inspect dorevia-network &> /dev/null; then
    echo "  ✅ dorevia-network (existe)"
    # Vérifier si gateway-caddy est connecté
    if docker network inspect dorevia-network --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | grep -q "gateway-caddy"; then
      echo "  ✅ gateway-caddy connecté"
    else
      echo "  ⚠️  gateway-caddy non connecté"
    fi
  else
    echo "  ⚠️  dorevia-network (absent)"
  fi
  
  echo ""
  echo "📋 Configuration:"
  if [[ -f "$gateway_dir/Caddyfile" ]]; then
    echo "  ✅ Caddyfile présent"
    echo "  📄 Hosts routés:"
    grep -E "^[a-z0-9.-]+\.doreviateam\.com" "$gateway_dir/Caddyfile" | sed 's/^/    - /' || echo "    (aucun host trouvé)"
  else
    echo "  ⚠️  Caddyfile absent"
  fi
}

# gateway down
cmd_gateway_down() {
  local gateway_dir="$ROOT_DIR/units/gateway"
  
  if [[ ! -f "$gateway_dir/docker-compose.yml" ]]; then
    echo "⚠️  Gateway non configurée"
    exit 0
  fi
  
  cd "$gateway_dir" || error "Impossible d'accéder à $gateway_dir (E03)" "$E03"
  
  echo "🛑 Arrêt gateway globale..."
  if docker compose down; then
    echo "✅ Gateway arrêtée"
    echo ""
    echo "⚠️  ATTENTION: Les services platform et apps ne seront plus accessibles via HTTPS"
  else
    error "Échec arrêt gateway (E04)" "$E04"
  fi
}

# gateway reload
cmd_gateway_reload() {
  local gateway_dir="$ROOT_DIR/units/gateway"
  
  if [[ ! -f "$gateway_dir/docker-compose.yml" ]]; then
    error "Gateway non configurée: $gateway_dir/docker-compose.yml (E03)" "$E03"
  fi
  
  # Vérifier que gateway est up
  if ! docker ps --format "{{.Names}}" | grep -q "^gateway-caddy$"; then
    error "Gateway non démarrée. Démarrer avec: dorevia.sh gateway up (E04)" "$E04"
  fi
  
  echo "🔄 Rechargement configuration Caddy..."
  
  # Caddy peut recharger sa config via signal ou reload
  if docker exec gateway-caddy caddy reload --config /etc/caddy/Caddyfile 2>/dev/null; then
    echo "✅ Configuration rechargée"
  else
    # Fallback: restart container
    echo "⚠️  Reload direct échoué, redémarrage container..."
    docker restart gateway-caddy
    echo "✅ Gateway redémarrée"
  fi
}

# gateway aggregate
cmd_gateway_aggregate() {
  local reload=false
  
  # Parser arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --reload)
        reload=true
        shift
        ;;
      *)
        error "Option inconnue: $1 (Usage: dorevia.sh gateway aggregate [--reload]) (E01)" "$E01"
        ;;
    esac
  done
  
  local gateway_dir="$ROOT_DIR/units/gateway"
  local global_caddyfile="$gateway_dir/Caddyfile"
  local temp_caddyfile="${global_caddyfile}.tmp"
  
  log_info "" "" "gateway" "aggregate" "Début agrégation Caddyfile global"
  
  # Créer répertoire gateway si nécessaire
  mkdir -p "$gateway_dir"
  
  # En-tête Caddyfile global
  {
    echo "{"
    echo "  email admin@doreviateam.com"
    echo "}"
    echo ""
  } > "$temp_caddyfile"
  
  # Collecter tous les Caddyfiles générés
  local caddyfiles_found=0
  declare -A hostnames_seen  # Pour déduplication hostnames DVIG/Vault (sans env)
  
  # Parcourir tous les tenants
  for tenant_dir in "$TENANTS_DIR"/*; do
    if [[ ! -d "$tenant_dir" ]]; then
      continue
    fi
    
    local tenant=$(basename "$tenant_dir")
    
    # Parcourir tous les environnements rendus
    local rendered_dir="$tenant_dir/rendered"
    if [[ ! -d "$rendered_dir" ]]; then
      continue
    fi
    
    for env_dir in "$rendered_dir"/*; do
      if [[ ! -d "$env_dir" ]]; then
        continue
      fi
      
      local env=$(basename "$env_dir")
      local caddyfile="$env_dir/caddy/Caddyfile"
      
      if [[ ! -f "$caddyfile" ]]; then
        continue
      fi
      
      log_info "$tenant" "$env" "gateway" "aggregate" "Collecte Caddyfile: $caddyfile"
      
      # Ajouter commentaire section
      echo "# Tenant: $tenant - Environment: $env" >> "$temp_caddyfile"
      echo "" >> "$temp_caddyfile"
      
      # Copier contenu sauf en-tête global (utiliser awk pour ignorer uniquement l'en-tête)
      # La déduplication des hostnames DVIG/Vault sera faite après
      awk '
        /^\{$/ { in_header=1; next }
        /^  email / { if (in_header) next }
        /^\}$/ { if (in_header) { in_header=0; next } }
        { print }
      ' "$caddyfile" >> "$temp_caddyfile" 2>/dev/null || true
      
      caddyfiles_found=$((caddyfiles_found + 1)) || true
    done
  done
  
  if [[ $caddyfiles_found -eq 0 ]]; then
    log_warn "" "" "gateway" "aggregate" "Aucun Caddyfile trouvé dans tenants/*/rendered/*/caddy/"
    rm -f "$temp_caddyfile"
    exit 0
  fi
  
  # Dédupliquer hostnames DVIG/Vault (sans env) - ils sont identiques pour tous les environnements
  # Créer un fichier temporaire pour la déduplication
  local dedup_file="${temp_caddyfile}.dedup"
  {
    # Copier uniquement l'en-tête global (premières 4 lignes, ignorer les doublons)
    {
      echo "{"
      echo "  email admin@doreviateam.com"
      echo "}"
      echo ""
    } > "$dedup_file"
    
    # Collecter et dédupliquer les blocs
    declare -A seen_hostnames
    local in_dvig_vault_block=0
    local current_hostname=""
    local in_header_block=0
    local header_seen=0
    
    while IFS= read -r line || [[ -n "$line" ]]; do
      # Ignorer les en-têtes globaux dupliqués
      if [[ "$line" == "{" ]] && [[ $header_seen -eq 0 ]]; then
        in_header_block=1
        continue
      elif [[ "$line" =~ ^[[:space:]]*email[[:space:]]+ ]] && [[ $in_header_block -eq 1 ]]; then
        continue
      elif [[ "$line" == "}" ]] && [[ $in_header_block -eq 1 ]]; then
        in_header_block=0
        header_seen=1
        continue
      elif [[ $in_header_block -eq 1 ]]; then
        continue
      fi
      
      # Détecter début de bloc DVIG/Vault (sans env)
      if [[ "$line" =~ ^(dvig|vault)\.[a-z0-9-]+\.doreviateam\.com[[:space:]]*\{ ]]; then
        current_hostname=$(echo "$line" | awk '{print $1}')
        # Si déjà vu, ignorer ce bloc
        if [[ -n "${seen_hostnames[$current_hostname]:-}" ]]; then
          in_dvig_vault_block=1
          continue
        else
          seen_hostnames[$current_hostname]=1
          in_dvig_vault_block=0
          echo "$line" >> "$dedup_file"
        fi
      # Détecter fin de bloc
      elif [[ "$line" == "}" ]] && [[ $in_dvig_vault_block -eq 1 ]]; then
        in_dvig_vault_block=0
        continue
      # Si dans un bloc à ignorer, continuer
      elif [[ $in_dvig_vault_block -eq 1 ]]; then
        continue
      # Sinon, copier la ligne
      else
        echo "$line" >> "$dedup_file"
      fi
    done < "$temp_caddyfile"
    
    # Remplacer le fichier temporaire
    mv "$dedup_file" "$temp_caddyfile"
  }
  
  # Valider syntaxe Caddy (si caddy disponible)
  if command -v caddy &> /dev/null; then
    if caddy validate --config "$temp_caddyfile" &> /dev/null; then
      log_info "" "" "gateway" "aggregate" "Syntaxe Caddyfile validée"
    else
      log_warn "" "" "gateway" "aggregate" "Validation syntaxe échouée (continuer quand même)"
    fi
  elif docker ps --format "{{.Names}}" | grep -q "^gateway-caddy$"; then
    # Valider via container Caddy
    if docker exec gateway-caddy caddy validate --config "$temp_caddyfile" &> /dev/null; then
      log_info "" "" "gateway" "aggregate" "Syntaxe Caddyfile validée (via container)"
    else
      log_warn "" "" "gateway" "aggregate" "Validation syntaxe échouée (continuer quand même)"
    fi
  fi
  
  # Remplacer Caddyfile global
  mv "$temp_caddyfile" "$global_caddyfile"
  
  log_info "" "" "gateway" "aggregate" "Caddyfile global généré: $global_caddyfile ($caddyfiles_found fichiers agrégés)"
  echo "✅ Caddyfile global agrégé: $global_caddyfile"
  echo "   - $caddyfiles_found Caddyfile(s) collecté(s)"
  
  # Recharger si demandé
  if [[ "$reload" == true ]]; then
    if ! docker ps --format "{{.Names}}" | grep -q "^gateway-caddy$"; then
      log_warn "" "" "gateway" "aggregate" "Gateway non démarrée, impossible de recharger"
      echo "⚠️  Gateway non démarrée. Démarrer avec: dorevia.sh gateway up"
    else
      cmd_gateway_reload
    fi
  fi
}

# Commandes platform
cmd_platform() {
  local subcommand="${1:-help}"
  shift || true
  
  case "$subcommand" in
    up)
      if [[ $# -lt 1 ]]; then
        error "Usage: platform up <tenant> (E01)" "$E01"
      fi
      cmd_platform_up "$@"
      ;;
    status)
      if [[ $# -lt 1 ]]; then
        error "Usage: platform status <tenant> (E01)" "$E01"
      fi
      cmd_platform_status "$@"
      ;;
    down)
      if [[ $# -lt 1 ]]; then
        error "Usage: platform down <tenant> (E01)" "$E01"
      fi
      cmd_platform_down "$@"
      ;;
    destroy)
      if [[ $# -lt 1 ]]; then
        error "Usage: platform destroy <tenant> [--purge] (E01)" "$E01"
      fi
      cmd_platform_destroy "$@"
      ;;
    *)
      echo "Sous-commande inconnue: $subcommand (utilisez 'help')" >&2
      exit "$E01"
      ;;
  esac
}

# Vérifier conflits de containers
check_container_conflicts() {
  local tenant="$1"
  local conflicts=()
  
  # Containers attendus (générés depuis conventions déterministes)
  local containers=(
    "$(_get_platform_container_name "dvig" "$tenant")"
    "$(_get_platform_container_name "vault" "$tenant")"
    "$(_get_platform_container_name "vault-db" "$tenant")"
  )
  
  local expected_project="$(_get_compose_project_name "platform" "$tenant")"
  
  for container in "${containers[@]}"; do
    if docker ps -a --format "{{.Names}}" | grep -q "^${container}$"; then
      # Vérifier si le container appartient à un autre projet
      local inspect_project=$(docker inspect "$container" --format '{{index .Config.Labels "com.docker.compose.project"}}' 2>/dev/null || echo "")
      if [[ -n "$inspect_project" && "$inspect_project" != "$expected_project" ]]; then
        conflicts+=("$container (projet: $inspect_project)")
      elif [[ -z "$inspect_project" ]]; then
        # Container sans label (créé manuellement)
        conflicts+=("$container (créé manuellement)")
      fi
    fi
  done
  
  if [[ ${#conflicts[@]} -gt 0 ]]; then
    echo "⚠️  Containers existants détectés:"
    for conflict in "${conflicts[@]}"; do
      echo "  - $conflict"
    done
    echo ""
    echo "💡 Options:"
    echo "  1. Arrêter les containers existants: dorevia.sh platform down $tenant (si déjà géré)"
    echo "  2. Supprimer manuellement: docker stop <container> && docker rm <container>"
    echo "  3. Utiliser les containers existants (non recommandé)"
    return 1
  fi
  
  return 0
}

# platform up <tenant> [--server <server_name>]
cmd_platform_up() {
  local tenant="$1"
  shift || true
  validate_tenant "$tenant"
  
  local server_name=""
  
  # Parser flags
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --server)
        server_name="${2:-}"
        if [[ -z "$server_name" ]]; then
          error "Usage: platform up <tenant> --server <server_name> (E01)" "$E01"
        fi
        shift 2 || true
        ;;
      --no-gateway-check)
        shift
        ;;
      *)
        # Passer autres flags à check_gateway
        break
        ;;
    esac
  done
  
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  
  # Mode distant ou local
  if [[ -n "$server_name" ]]; then
    # Mode distant : déploiement sur serveur client
    _platform_up_remote "$tenant" "$server_name"
    return $?
  fi
  
  # Mode local (comportement existant)
  # Vérifier gateway (prérequis)
  check_gateway "$@"
  
  # Vérifier réseau
  check_dorevia_network
  
  # Phase 1: Utiliser fichier généré depuis manifest si disponible
  # Sinon, fallback sur template (compatibilité)
  # SPEC_DVIG_VAULT_OPTIONNELS_v1.0 : Vérifier si units.platform est vide
  local manifest_file="$TENANTS_DIR/$tenant/state/manifest.json"
  local use_rendered=false
  local env_for_platform="lab"  # Par défaut, utiliser lab (platform partagé entre ENV)
  
  if [[ -f "$manifest_file" ]] && command -v jq &> /dev/null; then
    # Vérifier si units.platform est vide (services platform optionnels)
    local units_platform=$(cat "$manifest_file" | jq -r '.units.platform[]? // empty' 2>/dev/null || echo "")
    if [[ -z "$units_platform" ]]; then
      echo "ℹ️  Tenant $tenant configuré sans services platform (units.platform: [])"
      echo "ℹ️  Aucun service platform à démarrer (DVIG/Vault optionnels selon SPEC_DVIG_VAULT_OPTIONNELS_v1.0)"
      echo "💡 Pour ajouter des services platform, modifier le manifest et exécuter à nouveau cette commande"
      return 0
    fi
    
    # Créer répertoire platform si absent (pour copie du compose rendu)
    mkdir -p "$platform_dir"
    
    # Vérifier si fichier rendered existe (utiliser premier ENV disponible)
    local first_env=$(cat "$manifest_file" | jq -r '.environments[0] // "lab"' 2>/dev/null || echo "lab")
    env_for_platform="$first_env"
    local rendered_file="$TENANTS_DIR/$tenant/rendered/$env_for_platform/platform/docker-compose.yml"
    
    if [[ -f "$rendered_file" ]]; then
      echo "ℹ️  Utilisation fichier généré depuis manifest Phase 1: $rendered_file"
      # Copier fichier rendered vers platform_dir pour docker compose
      cp "$rendered_file" "$platform_dir/docker-compose.yml"
      use_rendered=true
    fi
  fi
  
  # Générer docker-compose.yml si absent (fallback template)
  if [[ ! -f "$platform_dir/docker-compose.yml" ]]; then
    if [[ ! -f "$platform_dir/docker-compose.yml.template" ]]; then
      error "Template non trouvé: $platform_dir/docker-compose.yml.template (E03)" "$E03"
    fi
    echo "ℹ️  Utilisation template (fallback compatibilité)"
    generate_platform_compose "$tenant"
  fi
  
  # Vérifier tokens (uniquement si DVIG est dans units.platform)
  local tokens_file="$TENANTS_DIR/$tenant/secrets/dvig.tokens.yml"
  if [[ -f "$manifest_file" ]] && command -v jq &> /dev/null; then
    local has_dvig=$(cat "$manifest_file" | jq -r '.units.platform[]? | select(. == "dvig")' 2>/dev/null || echo "")
    if [[ -n "$has_dvig" ]] && [[ ! -f "$tokens_file" ]]; then
      error "Fichier tokens non trouvé: $tokens_file (requis pour DVIG) (E03)" "$E03"
    fi
  elif [[ ! -f "$tokens_file" ]]; then
    # Fallback : vérifier tokens si manifest non disponible (compatibilité)
    error "Fichier tokens non trouvé: $tokens_file (E03)" "$E03"
  fi
  
  # Vérifier conflits (avertissement seulement)
  if ! check_container_conflicts "$tenant"; then
    echo ""
    read -p "Continuer malgré les conflits ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 0
    fi
  fi
  
  # Démarrer services
  cd "$platform_dir" || error "Impossible d'accéder à $platform_dir (E03)" "$E03"
  
  # Utiliser project name pour isolation (généré depuis conventions)
  local project_name="$(_get_compose_project_name "platform" "$tenant")"
  
  echo "🚀 Démarrage platform $tenant..."
  if docker compose -p "$project_name" up -d; then
    echo "✅ Platform $tenant démarrée"
    echo ""
    echo "📊 URLs (Phase 1: avec ENV):"
    
    # Lire manifest pour obtenir les environnements activés
    local manifest_file="$TENANTS_DIR/$tenant/state/manifest.json"
    if [[ -f "$manifest_file" ]] && command -v jq &> /dev/null; then
      local envs=$(cat "$manifest_file" | jq -r '.environments[]' 2>/dev/null || echo "")
      if [[ -n "$envs" ]]; then
        # DVIG/Vault : 1 par tenant (sans environnement)
        echo "  - DVIG: https://$(_get_hostname "dvig" "" "$tenant")"
        echo "  - Vault: https://$(_get_hostname "vault" "" "$tenant")"
      else
        # Fallback si manifest non disponible
        echo "  - DVIG: https://dvig.$tenant.doreviateam.com (1 par tenant, sans ENV)"
        echo "  - Vault: https://vault.$tenant.doreviateam.com (1 par tenant, sans ENV)"
      fi
    else
      # Fallback si manifest non disponible
      echo "  - DVIG: https://dvig.<env>.$tenant.doreviateam.com (Phase 1: avec ENV)"
      echo "  - Vault: https://vault.<env>.$tenant.doreviateam.com (Phase 1: avec ENV)"
    fi
    echo ""
    echo "💡 Vérifier le statut: dorevia.sh platform status $tenant"
  else
    error "Échec démarrage platform $tenant (E04)" "$E04"
  fi
}

# platform status <tenant>
cmd_platform_status() {
  local tenant="$1"
  validate_tenant "$tenant"
  
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  
  if [[ ! -f "$platform_dir/docker-compose.yml" ]]; then
    echo "⚠️  Platform $tenant non configurée (docker-compose.yml absent)"
    echo "💡 Créer avec: dorevia.sh platform up $tenant"
    exit 0
  fi
  
  cd "$platform_dir" || error "Impossible d'accéder à $platform_dir (E03)" "$E03"
  
  local project_name="$(_get_compose_project_name "platform" "$tenant")"
  
  echo "📊 Platform $tenant - Statut:"
  echo ""
  
  # Statut conteneurs
  docker compose -p "$project_name" ps
  
  echo ""
  echo "📋 Images utilisées:"
  docker compose -p "$project_name" config 2>/dev/null | grep "image:" | sed 's/^[[:space:]]*//' | while read -r line; do
    echo "  $line"
  done
  
  echo ""
  echo "🔗 Réseau:"
  if docker network inspect dorevia-network &> /dev/null; then
    echo "  ✅ dorevia-network (existe)"
  else
    echo "  ⚠️  dorevia-network (absent)"
  fi
}

# platform down <tenant>
cmd_platform_down() {
  local tenant="$1"
  validate_tenant "$tenant"
  
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  
  if [[ ! -f "$platform_dir/docker-compose.yml" ]]; then
    echo "⚠️  Platform $tenant non configurée"
    exit 0
  fi
  
  cd "$platform_dir" || error "Impossible d'accéder à $platform_dir (E03)" "$E03"
  
  local project_name="$(_get_compose_project_name "platform" "$tenant")"
  
  echo "🛑 Arrêt platform $tenant..."
  if docker compose -p "$project_name" down; then
    echo "✅ Platform $tenant arrêtée"
  else
    error "Échec arrêt platform $tenant (E04)" "$E04"
  fi
}

# platform destroy <tenant> [--purge]
cmd_platform_destroy() {
  local tenant="$1"
  shift || true
  validate_tenant "$tenant"
  
  local purge_volumes=false
  
  # Parser flags
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --purge)
        purge_volumes=true
        ;;
      *)
        error "Flag inconnu: $1 (E01)" "$E01"
        ;;
    esac
    shift
  done
  
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  
  if [[ ! -f "$platform_dir/docker-compose.yml" ]]; then
    echo "⚠️  Platform $tenant non configurée"
    exit 0
  fi
  
  cd "$platform_dir" || error "Impossible d'accéder à $platform_dir (E03)" "$E03"
  
  local project_name="dorevia_${tenant}_platform"
  
  echo "🗑️  Destruction platform $tenant..."
  
  if [[ "$purge_volumes" == "true" ]]; then
    echo "⚠️  ATTENTION: Suppression des volumes (--purge activé)"
    if docker compose -p "$project_name" down -v; then
      echo "✅ Platform $tenant détruite (volumes supprimés)"
    else
      error "Échec destruction platform $tenant (E04)" "$E04"
    fi
  else
    echo "⚠️  Volumes conservés (utilisez --purge pour supprimer)"
    if docker compose -p "$project_name" down; then
      echo "✅ Platform $tenant détruite (volumes conservés)"
      echo "💡 Pour supprimer les volumes: dorevia.sh platform destroy $tenant --purge"
    else
      error "Échec destruction platform $tenant (E04)" "$E04"
    fi
  fi
}

# Vérification platform up (prérequis pour app)
# SPEC_DVIG_VAULT_OPTIONNELS_v1.0 : Vérification conditionnelle basée sur units.platform
check_platform_up() {
  local tenant="$1"
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  
  # Lire le manifest pour déterminer les services requis
  local manifest="$(_read_manifest "$tenant")"
  local units_platform=$(echo "$manifest" | jq -r '.units.platform[]? // empty' 2>/dev/null || echo "")
  
  # Si aucun service platform requis, skip la vérification
  if [[ -z "$units_platform" ]]; then
    return 0  # Pas de platform requise
  fi
  
  # Si docker-compose n'existe pas mais des services sont requis
  if [[ ! -f "$platform_dir/docker-compose.yml" ]]; then
    error "Platform $tenant non configurée. Démarrer avec: dorevia.sh platform up $tenant (E04)" "$E04"
  fi
  
  # Vérifier uniquement les services présents dans units.platform
  local containers=()
  if echo "$units_platform" | grep -q "^dvig$"; then
    containers+=("$(_get_platform_container_name "dvig" "$tenant")")
  fi
  if echo "$units_platform" | grep -q "^vault$"; then
    containers+=("$(_get_platform_container_name "vault" "$tenant")")
  fi
  
  # Si aucun container à vérifier, skip
  if [[ ${#containers[@]} -eq 0 ]]; then
    return 0
  fi
  
  # Vérifier que les containers requis sont running
  local all_up=true
  for container in "${containers[@]}"; do
    if ! docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
      all_up=false
      break
    fi
  done
  
  if [[ "$all_up" != "true" ]]; then
    error "Platform $tenant n'est pas démarrée. Démarrer avec: dorevia.sh platform up $tenant (E04)" "$E04"
  fi
}

# Génération docker-compose.yml pour app
generate_app_compose() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  local db_name="$4"
  local volume_db="$5"
  local volume_data="$6"
  local compose_project="$7"
  
  local app_dir="$TENANTS_DIR/$tenant/apps/$univers/$env"
  local template="$TENANTS_DIR/$tenant/apps/$univers/$env/docker-compose.yml.template"
  local output="$app_dir/docker-compose.yml"
  
  # Si template spécifique n'existe pas, utiliser template générique
  if [[ ! -f "$template" ]]; then
    # Chercher template générique dans lab (réutilisable)
    template="$TENANTS_DIR/$tenant/apps/$univers/lab/docker-compose.yml.template"
    if [[ ! -f "$template" ]]; then
      error "Template non trouvé pour $univers/$env/$tenant (E03)" "$E03"
    fi
  fi
  
  local source="${univers}.${env}.${tenant}"
  # Utiliser les noms de volumes passés en paramètres (déterministes)
  local volume_db_name="$volume_db"
  local volume_data_name="$volume_data"
  
  # Remplacer variables dans template
  sed -e "s|{{UNIVERS}}|$univers|g" \
      -e "s|{{ENV}}|$env|g" \
      -e "s|{{TENANT}}|$tenant|g" \
      -e "s|{{SOURCE}}|$source|g" \
      -e "s|{{DB_NAME}}|$db_name|g" \
      -e "s|{{COMPOSE_PROJECT}}|$compose_project|g" \
      -e "s|{{VOLUME_DB}}|$volume_db|g" \
      -e "s|{{VOLUME_DB_NAME}}|$volume_db_name|g" \
      -e "s|{{VOLUME_DATA}}|$volume_data|g" \
      -e "s|{{VOLUME_DATA_NAME}}|$volume_data_name|g" \
      -e "s|{{ROOT_DIR}}|$ROOT_DIR|g" \
      "$template" > "$output"
  
  echo "✅ docker-compose.yml généré pour $univers/$env/$tenant"
}

# Génération odoo.conf pour app
generate_app_odoo_conf() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  local db_name="$4"
  
  local app_dir="$TENANTS_DIR/$tenant/apps/$univers/$env"
  local template="$TENANTS_DIR/$tenant/apps/$univers/$env/odoo.conf.template"
  local output="$app_dir/odoo.conf"
  
  # Si template spécifique n'existe pas, utiliser template générique
  if [[ ! -f "$template" ]]; then
    template="$TENANTS_DIR/$tenant/apps/$univers/lab/odoo.conf.template"
    if [[ ! -f "$template" ]]; then
      error "Template odoo.conf non trouvé pour $univers/$env/$tenant (E03)" "$E03"
    fi
  fi
  
  local source="${univers}.${env}.${tenant}"
  
  # Remplacer variables dans template
  sed -e "s|{{UNIVERS}}|$univers|g" \
      -e "s|{{ENV}}|$env|g" \
      -e "s|{{TENANT}}|$tenant|g" \
      -e "s|{{SOURCE}}|$source|g" \
      -e "s|{{DB_NAME}}|$db_name|g" \
      "$template" > "$output"
  
  echo "✅ odoo.conf généré pour $univers/$env/$tenant"
}

# Validation version image (E02 si latest en STINGER/PROD)
validate_app_image() {
  local env="$1"
  local image="$2"
  
  if [[ "$env" == "stinger" || "$env" == "prod" ]]; then
    if [[ "$image" == *":latest" ]]; then
      error "Image 'latest' interdite en $env. Utiliser une version taggée (E02)" "$E02"
    fi
  fi
}

# Commandes app
cmd_app() {
  local subcommand="${1:-help}"
  shift || true
  
  case "$subcommand" in
    up)
      if [[ $# -lt 3 ]]; then
        error "Usage: app up <univers> <env> <tenant> (E01)" "$E01"
      fi
      cmd_app_up "$@"
      ;;
    status)
      if [[ $# -lt 3 ]]; then
        error "Usage: app status <univers> <env> <tenant> (E01)" "$E01"
      fi
      cmd_app_status "$@"
      ;;
    down)
      if [[ $# -lt 3 ]]; then
        error "Usage: app down <univers> <env> <tenant> (E01)" "$E01"
      fi
      cmd_app_down "$@"
      ;;
    reset)
      if [[ $# -lt 3 ]]; then
        error "Usage: app reset <univers> <env> <tenant> [--purge] (E01)" "$E01"
      fi
      cmd_app_reset "$@"
      ;;
    destroy)
      if [[ $# -lt 3 ]]; then
        error "Usage: app destroy <univers> <env> <tenant> [--purge] (E01)" "$E01"
      fi
      cmd_app_destroy "$@"
      ;;
    *)
      echo "Sous-commande inconnue: $subcommand (utilisez 'help')" >&2
      exit "$E01"
      ;;
  esac
}

# app up <univers> <env> <tenant> [--server <server_name>]
cmd_app_up() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  shift 3 || true
  
  validate_univers "$univers"
  validate_env "$env"
  validate_tenant "$tenant"
  
  local server_name=""
  
  # Parser flags
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --server)
        server_name="${2:-}"
        if [[ -z "$server_name" ]]; then
          error "Usage: app up <univers> <env> <tenant> --server <server_name> (E01)" "$E01"
        fi
        shift 2 || true
        ;;
      --no-gateway-check)
        shift
        ;;
      *)
        # Passer autres flags à check_gateway
        break
        ;;
    esac
  done
  
  # Mode distant ou local
  if [[ -n "$server_name" ]]; then
    # Mode distant : déploiement sur serveur client
    _app_up_remote "$univers" "$env" "$tenant" "$server_name"
    return $?
  fi
  
  # Mode local (comportement existant)
  # Vérifier gateway (prérequis)
  check_gateway "$@"
  
  # Vérifier platform up (prérequis)
  check_platform_up "$tenant"
  
  # Vérifier réseau
  check_dorevia_network
  
  # Générer source
  local source="${univers}.${env}.${tenant}"
  
  # Générer identifiants déterministes (depuis conventions)
  local db_name="$(_get_db_name "$univers" "$env" "$tenant")"
  local volume_db="$(_get_volume_name "db" "app" "$tenant" "$env" "$univers")"
  local volume_data="$(_get_volume_name "data" "app" "$tenant" "$env" "$univers")"
  local compose_project="$(_get_compose_project_name "app" "$tenant" "$env" "$univers")"
  
  # Créer répertoire app
  local app_dir="$TENANTS_DIR/$tenant/apps/$univers/$env"
  mkdir -p "$app_dir"
  
  # Phase 1: Utiliser fichier généré depuis manifest si disponible
  # Sinon, fallback sur template (compatibilité)
  local manifest_file="$TENANTS_DIR/$tenant/state/manifest.json"
  local use_rendered=false
  
  if [[ -f "$manifest_file" ]] && command -v jq &> /dev/null; then
    local rendered_file="$TENANTS_DIR/$tenant/rendered/$env/$univers/docker-compose.yml"
    
    if [[ -f "$rendered_file" ]]; then
      echo "ℹ️  Utilisation fichier généré depuis manifest Phase 1: $rendered_file"
      # Copier fichier rendered vers app_dir pour docker compose
      cp "$rendered_file" "$app_dir/docker-compose.yml"
      use_rendered=true
    fi
  fi
  
  # Générer configurations depuis templates si fichier rendered non disponible
  if [[ ! -f "$app_dir/docker-compose.yml" ]]; then
    echo "ℹ️  Utilisation template (fallback compatibilité)"
    generate_app_compose "$univers" "$env" "$tenant" "$db_name" "$volume_db" "$volume_data" "$compose_project"
  fi
  
  if [[ "$univers" == "odoo" ]] && [[ ! -f "$app_dir/odoo.conf" ]]; then
    generate_app_odoo_conf "$univers" "$env" "$tenant" "$db_name"
  fi
  
  # Validation version image (vérifier dans docker-compose.yml généré)
  local odoo_image=$(grep "image:" "$app_dir/docker-compose.yml" | grep odoo | sed 's/.*image: *//' | sed 's/ *#.*//' | tr -d ' ')
  if [[ -n "$odoo_image" ]]; then
    validate_app_image "$env" "$odoo_image"
  fi
  
  # Démarrer services
  cd "$app_dir" || error "Impossible d'accéder à $app_dir (E03)" "$E03"
  
  echo "🚀 Démarrage app $univers $env $tenant..."
  if docker compose -p "$compose_project" up -d; then
    echo "✅ App $univers $env $tenant démarrée"
    echo ""
    echo "📊 Source: $source"
    echo "📊 DB: $db_name"
    echo "📊 URL: https://$univers.$env.$tenant.doreviateam.com"
    echo ""
    echo "💡 Vérifier le statut: dorevia.sh app status $univers $env $tenant"
  else
    error "Échec démarrage app $univers $env $tenant (E04)" "$E04"
  fi
}

# app status <univers> <env> <tenant>
cmd_app_status() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  
  validate_univers "$univers"
  validate_env "$env"
  validate_tenant "$tenant"
  
  local app_dir="$TENANTS_DIR/$tenant/apps/$univers/$env"
  
  if [[ ! -f "$app_dir/docker-compose.yml" ]]; then
    echo "⚠️  App $univers $env $tenant non configurée (docker-compose.yml absent)"
    echo "💡 Créer avec: dorevia.sh app up $univers $env $tenant"
    exit 0
  fi
  
  cd "$app_dir" || error "Impossible d'accéder à $app_dir (E03)" "$E03"
  
  local compose_project="$(_get_compose_project_name "app" "$tenant" "$env" "$univers")"
  local source="${univers}.${env}.${tenant}"
  local db_name="$(_get_db_name "$univers" "$env" "$tenant")"
  
  echo "📊 App $univers $env $tenant - Statut:"
  echo ""
  
  # Statut conteneurs
  docker compose -p "$compose_project" ps
  
  echo ""
  echo "📋 Informations:"
  echo "  - Source: $source"
  echo "  - DB name: $db_name"
  echo "  - URL: https://$univers.$env.$tenant.doreviateam.com"
  
  echo ""
  echo "📋 Images utilisées:"
  docker compose -p "$compose_project" config 2>/dev/null | grep "image:" | sed 's/^[[:space:]]*//' | while read -r line; do
    echo "  $line"
  done
  
  echo ""
  echo "🔗 Réseau:"
  if docker network inspect dorevia-network &> /dev/null; then
    echo "  ✅ dorevia-network (existe)"
  else
    echo "  ⚠️  dorevia-network (absent)"
  fi
}

# app down <univers> <env> <tenant>
cmd_app_down() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  
  validate_univers "$univers"
  validate_env "$env"
  validate_tenant "$tenant"
  
  local app_dir="$TENANTS_DIR/$tenant/apps/$univers/$env"
  
  if [[ ! -f "$app_dir/docker-compose.yml" ]]; then
    echo "⚠️  App $univers $env $tenant non configurée"
    exit 0
  fi
  
  cd "$app_dir" || error "Impossible d'accéder à $app_dir (E03)" "$E03"
  
  local compose_project="$(_get_compose_project_name "app" "$tenant" "$env" "$univers")"
  
  echo "🛑 Arrêt app $univers $env $tenant..."
  if docker compose -p "$compose_project" down; then
    echo "✅ App $univers $env $tenant arrêtée"
  else
    error "Échec arrêt app $univers $env $tenant (E04)" "$E04"
  fi
}

# app reset <univers> <env> <tenant> [--purge]
cmd_app_reset() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  shift 3 || true
  
  validate_univers "$univers"
  validate_env "$env"
  validate_tenant "$tenant"
  
  local purge=false
  
  # Parser flags
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --purge)
        purge=true
        ;;
      *)
        error "Flag inconnu: $1 (E01)" "$E01"
        ;;
    esac
    shift
  done
  
  if [[ "$purge" != "true" ]]; then
    error "Flag --purge requis pour reset (E06)" "$E06"
  fi
  
  local app_dir="$TENANTS_DIR/$tenant/apps/$univers/$env"
  
  if [[ ! -f "$app_dir/docker-compose.yml" ]]; then
    echo "⚠️  App $univers $env $tenant non configurée"
    exit 0
  fi
  
  cd "$app_dir" || error "Impossible d'accéder à $app_dir (E03)" "$E03"
  
  local compose_project="$(_get_compose_project_name "app" "$tenant" "$env" "$univers")"
  local db_name="$(_get_db_name "$univers" "$env" "$tenant")"
  
  echo "🔄 Reset app $univers $env $tenant (--purge activé)..."
  
  # Arrêter containers
  docker compose -p "$compose_project" down -v || true
  
  # Drop DB (Odoo uniquement : PostgreSQL). Pour suitecrm/n8n, compose down -v suffit.
  if [[ "$univers" == "odoo" ]]; then
    local db_container="$(_get_app_container_name "$univers" "$env" "$tenant" "db")"
    if docker ps -a --format "{{.Names}}" | grep -q "^${db_container}$"; then
      echo "🗑️  Suppression DB $db_name..."
      docker exec "$db_container" psql -U odoo -c "DROP DATABASE IF EXISTS $db_name;" 2>/dev/null || true
    fi
  fi
  
  echo "✅ App $univers $env $tenant resetée (DB + volumes supprimés)"
  echo "💡 Redémarrer avec: dorevia.sh app up $univers $env $tenant"
}

# app destroy <univers> <env> <tenant> [--purge]
cmd_app_destroy() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  shift 3 || true
  
  validate_univers "$univers"
  validate_env "$env"
  validate_tenant "$tenant"
  
  local purge_volumes=false
  
  # Parser flags
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --purge)
        purge_volumes=true
        ;;
      *)
        error "Flag inconnu: $1 (E01)" "$E01"
        ;;
    esac
    shift
  done
  
  local app_dir="$TENANTS_DIR/$tenant/apps/$univers/$env"
  
  if [[ ! -f "$app_dir/docker-compose.yml" ]]; then
    echo "⚠️  App $univers $env $tenant non configurée"
    exit 0
  fi
  
  cd "$app_dir" || error "Impossible d'accéder à $app_dir (E03)" "$E03"
  
  local compose_project="$(_get_compose_project_name "app" "$tenant" "$env" "$univers")"
  
  echo "🗑️  Destruction app $univers $env $tenant..."
  
  if [[ "$purge_volumes" == "true" ]]; then
    echo "⚠️  ATTENTION: Suppression des volumes (--purge activé)"
    if docker compose -p "$compose_project" down -v; then
      echo "✅ App $univers $env $tenant détruite (volumes supprimés)"
    else
      error "Échec destruction app $univers $env $tenant (E04)" "$E04"
    fi
  else
    echo "⚠️  Volumes conservés (utilisez --purge pour supprimer)"
    if docker compose -p "$compose_project" down; then
      echo "✅ App $univers $env $tenant détruite (volumes conservés)"
      echo "💡 Pour supprimer les volumes: dorevia.sh app destroy $univers $env $tenant --purge"
    else
      error "Échec destruction app $univers $env $tenant (E04)" "$E04"
    fi
  fi
}

# Fonctions utilitaires pour tokens

# Générer token_id déterministe (tok_<env>_<tenant>_<nnn>)
generate_token_id() {
  local env="$1"
  local tenant="$2"
  local tokens_file="$3"
  
  # Chercher le dernier numéro pour cet env/tenant
  local max_num=0
  if [[ -f "$tokens_file" ]]; then
    # Extraire les numéros existants (tok_<env>_<tenant>_<nnn>)
    while IFS= read -r line; do
      if [[ "$line" =~ id:.*tok_${env}_${tenant}_([0-9]+) ]]; then
        local num="${BASH_REMATCH[1]}"
        if [[ "$num" -gt "$max_num" ]]; then
          max_num="$num"
        fi
      fi
    done < <(grep -E "id:.*tok_${env}_${tenant}_" "$tokens_file" 2>/dev/null || true)
  fi
  
  # Incrémenter
  local next_num=$((max_num + 1))
  printf "tok_%s_%s_%03d" "$env" "$tenant" "$next_num"
}

# Générer token via CLI Python
generate_token_raw() {
  local tenant="$1"
  local univers="$2"
  
  # Utiliser le CLI Python existant
  local output
  output=$(cd "$ROOT_DIR/sources/dvig" && python3 -m dvig.cli.token_gen --tenant "$tenant" --univers "$univers" --output token 2>&1)
  
  if [[ $? -ne 0 ]]; then
    error "Échec génération token: $output (E03)" "$E03"
  fi
  
  # Extraire TOKEN et HASH
  local token_raw token_hash
  token_raw=$(echo "$output" | grep "^TOKEN=" | cut -d'=' -f2)
  token_hash=$(echo "$output" | grep "^HASH=" | cut -d'=' -f2)
  
  if [[ -z "$token_raw" || -z "$token_hash" ]]; then
    error "Format de sortie CLI invalide (E03)" "$E03"
  fi
  
  echo "$token_raw|$token_hash"
}

# Charger YAML tokens
load_tokens_yaml() {
  local tokens_file="$1"
  
  if [[ ! -f "$tokens_file" ]]; then
    # Créer fichier vide avec structure de base
    cat > "$tokens_file" <<EOF
version: 1
tokens: []
EOF
  fi
  
  # Vérifier que c'est un YAML valide (basique)
  if ! grep -q "^version:" "$tokens_file" 2>/dev/null; then
    error "Format YAML invalide dans $tokens_file (E03)" "$E03"
  fi
}

# Ajouter token au YAML (atomique)
add_token_to_yaml() {
  local tokens_file="$1"
  local token_id="$2"
  local token_hash="$3"
  local tenant="$4"
  local univers="$5"
  local source="$6"
  local comment="$7"
  
  local temp_file="${tokens_file}.tmp"
  
  # Charger YAML existant
  load_tokens_yaml "$tokens_file"
  
  # Créer nouvelle entrée
  local new_entry
  new_entry=$(cat <<EOF
  - id: "$token_id"
    token_hash: "$token_hash"
    tenant: "$tenant"
    univers: "$univers"
    status: "active"
    created_at: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    comment: "$comment"
EOF
)
  
  # Ajouter au YAML (après "tokens:")
  if ! grep -q "tokens:" "$tokens_file"; then
    # Créer structure complète
    cat > "$temp_file" <<EOF
version: 1
tokens:
$new_entry
EOF
  else
    # Insérer après "tokens:"
    awk -v entry="$new_entry" '
      /^tokens:/ { print; print entry; next }
      { print }
    ' "$tokens_file" > "$temp_file"
  fi
  
  # Remplacer atomiquement
  mv "$temp_file" "$tokens_file"
  
  # Permissions strictes
  chmod 0400 "$tokens_file" 2>/dev/null || chmod 0440 "$tokens_file" 2>/dev/null || true
}

# Vérifier si token actif existe pour source
token_exists_for_source() {
  local tokens_file="$1"
  local source="$2"
  
  if [[ ! -f "$tokens_file" ]]; then
    return 1
  fi
  
  # Chercher dans les commentaires (format actuel: "LAB - odoo.lab.core")
  if grep -q "status:.*active" "$tokens_file" && grep -q "$source" "$tokens_file"; then
    # Vérifier que c'est bien un token actif
    local in_token=false
    local token_status=""
    local token_comment=""
    
    while IFS= read -r line; do
      if [[ "$line" =~ ^[[:space:]]*-[[:space:]]*id: ]]; then
        in_token=true
        token_status=""
        token_comment=""
      elif [[ "$line" =~ ^[[:space:]]*status:[[:space:]]*\"(.*)\" ]]; then
        token_status="${BASH_REMATCH[1]}"
      elif [[ "$line" =~ ^[[:space:]]*comment:[[:space:]]*\"(.*)\" ]]; then
        token_comment="${BASH_REMATCH[1]}"
        if [[ "$token_status" == "active" && "$token_comment" == *"$source"* ]]; then
          return 0
        fi
      fi
    done < "$tokens_file"
  fi
  
  return 1
}

# Trouver token_id par source
find_token_id_by_source() {
  local tokens_file="$1"
  local source="$2"
  
  if [[ ! -f "$tokens_file" ]]; then
    return 1
  fi
  
  local in_token=false
  local token_id=""
  local token_status=""
  local token_comment=""
  
  while IFS= read -r line; do
    if [[ "$line" =~ ^[[:space:]]*-[[:space:]]*id:[[:space:]]*\"(.*)\" ]]; then
      in_token=true
      token_id="${BASH_REMATCH[1]}"
      token_status=""
      token_comment=""
    elif [[ "$line" =~ ^[[:space:]]*status:[[:space:]]*\"(.*)\" ]]; then
      token_status="${BASH_REMATCH[1]}"
    elif [[ "$line" =~ ^[[:space:]]*comment:[[:space:]]*\"(.*)\" ]]; then
      token_comment="${BASH_REMATCH[1]}"
      if [[ "$token_status" == "active" && "$token_comment" == *"$source"* ]]; then
        echo "$token_id"
        return 0
      fi
    fi
  done < "$tokens_file"
  
  return 1
}

# Révoquer token
revoke_token_in_yaml() {
  local tokens_file="$1"
  local token_id="$2"
  
  local temp_file="${tokens_file}.tmp"
  local found=false
  
  # Parser YAML et modifier
  local in_token=false
  local current_id=""
  
  while IFS= read -r line; do
    if [[ "$line" =~ ^[[:space:]]*-[[:space:]]*id:[[:space:]]*\"(.*)\" ]]; then
      in_token=true
      current_id="${BASH_REMATCH[1]}"
      echo "$line"
    elif [[ "$in_token" == "true" && "$current_id" == "$token_id" ]]; then
      if [[ "$line" =~ ^[[:space:]]*status:[[:space:]]*\"(.*)\" ]]; then
        echo "    status: \"revoked\""
        found=true
      elif [[ "$line" =~ ^[[:space:]]*revoked_at: ]]; then
        echo "$line"
      elif [[ ! "$line" =~ ^[[:space:]]*revoked_at: ]] && [[ "$line" =~ ^[[:space:]]*comment: ]]; then
        # Ajouter revoked_at avant comment
        echo "    revoked_at: \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\""
        echo "$line"
      else
        echo "$line"
      fi
    else
      echo "$line"
    fi
  done < "$tokens_file" > "$temp_file"
  
  if [[ "$found" != "true" ]]; then
    rm -f "$temp_file"
    error "Token $token_id non trouvé (E01)" "$E01"
  fi
  
  # Remplacer atomiquement
  mv "$temp_file" "$tokens_file"
  chmod 0400 "$tokens_file" 2>/dev/null || chmod 0440 "$tokens_file" 2>/dev/null || true
}

# Recharger DVIG (stratégie C : restart)
reload_dvig() {
  local tenant="$1"
  local container="dvig-${tenant}"
  
  if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
    echo "🔄 Rechargement DVIG ($container)..."
    docker restart "$container" > /dev/null 2>&1
    echo "✅ DVIG rechargé"
  else
    echo "⚠️  Container DVIG $container non trouvé (skip reload)"
  fi
}

# Commandes token
cmd_token() {
  local subcommand="${1:-help}"
  shift || true
  
  case "$subcommand" in
    issue)
      if [[ $# -lt 3 ]]; then
        error "Usage: token issue <univers> <env> <tenant> [--force] (E01)" "$E01"
      fi
      cmd_token_issue "$@"
      ;;
    list)
      if [[ $# -lt 1 ]]; then
        error "Usage: token list <tenant> (E01)" "$E01"
      fi
      cmd_token_list "$@"
      ;;
    revoke)
      if [[ $# -lt 2 ]]; then
        error "Usage: token revoke <tenant> <token_id> (E01)" "$E01"
      fi
      cmd_token_revoke "$@"
      ;;
    rotate)
      if [[ $# -lt 3 ]]; then
        error "Usage: token rotate <univers> <env> <tenant> [--revoke-old] (E01)" "$E01"
      fi
      cmd_token_rotate "$@"
      ;;
    status)
      if [[ $# -lt 3 ]]; then
        error "Usage: token status <univers> <env> <tenant> (E01)" "$E01"
      fi
      cmd_token_status "$@"
      ;;
    renew)
      if [[ $# -lt 3 ]]; then
        error "Usage: token renew <univers> <env> <tenant> [--pre-renew-days <days>] [--grace-days <days>] (E01)" "$E01"
      fi
      cmd_token_renew "$@"
      ;;
    *)
      echo "Sous-commande inconnue: $subcommand (utilisez 'help')" >&2
      exit "$E01"
      ;;
  esac
}

# token issue <univers> <env> <tenant> [--force]
cmd_token_issue() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  shift 3 || true
  
  validate_univers "$univers"
  validate_env "$env"
  validate_tenant "$tenant"
  
  local force=false
  
  # Parser flags
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --force)
        force=true
        ;;
      *)
        error "Flag inconnu: $1 (E01)" "$E01"
        ;;
    esac
    shift
  done
  
  # Générer source
  local source="${univers}.${env}.${tenant}"
  
  # Fichier tokens (source de vérité unique)
  local tokens_file="$TENANTS_DIR/$tenant/secrets/dvig.tokens.yml"
  
  # Créer répertoire si absent
  mkdir -p "$(dirname "$tokens_file")"
  
  # Vérifier si token actif existe
  if token_exists_for_source "$tokens_file" "$source"; then
    if [[ "$force" != "true" ]]; then
      error "Token actif existe déjà pour source $source. Utiliser --force pour forcer (E02)" "$E02"
    fi
    echo "⚠️  Token actif existant détecté (--force activé)"
  fi
  
  # Générer token
  echo "🔐 Génération token pour $source..."
  local token_output
  token_output=$(generate_token_raw "$tenant" "$univers")
  
  local token_raw token_hash
  token_raw=$(echo "$token_output" | cut -d'|' -f1)
  token_hash=$(echo "$token_output" | cut -d'|' -f2)
  
  # Générer token_id déterministe
  local token_id
  token_id=$(generate_token_id "$env" "$tenant" "$tokens_file")
  
  # Commentaire
  local comment="${env^^} - $source (tenant DNS: $tenant)"
  
  # Ajouter au YAML
  add_token_to_yaml "$tokens_file" "$token_id" "$token_hash" "$tenant" "$univers" "$source" "$comment"
  
  # Recharger DVIG
  reload_dvig "$tenant"
  
  # Afficher (UNE SEULE FOIS)
  echo ""
  echo "✅ Token créé: $token_id"
  echo "📋 Source: $source"
  echo ""
  echo "🔑 TOKEN (à copier maintenant, ne sera plus affiché):"
  echo "$token_raw"
  echo ""
  echo "⚠️  IMPORTANT: Ce token ne sera plus affiché. Stockez-le en sécurité."
}

# token list <tenant>
cmd_token_list() {
  local tenant="$1"
  
  validate_tenant "$tenant"
  
  local tokens_file="$TENANTS_DIR/$tenant/secrets/dvig.tokens.yml"
  
  if [[ ! -f "$tokens_file" ]]; then
    echo "⚠️  Aucun token trouvé pour tenant $tenant"
    echo "💡 Créer avec: dorevia.sh token issue <univers> <env> $tenant"
    exit 0
  fi
  
  echo "📋 Tokens pour tenant $tenant:"
  echo ""
  
  # Parser et afficher
  local in_token=false
  local token_id=""
  local token_status=""
  local token_univers=""
  local token_comment=""
  local token_created=""
  
  while IFS= read -r line; do
    if [[ "$line" =~ ^[[:space:]]*-[[:space:]]*id:[[:space:]]*\"(.*)\" ]]; then
      if [[ "$in_token" == "true" ]]; then
        # Afficher token précédent
        echo "  ID: $token_id"
        echo "    Univers: $token_univers"
        echo "    Status: $token_status"
        echo "    Source: $token_comment"
        echo "    Créé: $token_created"
        echo ""
      fi
      in_token=true
      token_id="${BASH_REMATCH[1]}"
      token_status=""
      token_univers=""
      token_comment=""
      token_created=""
    elif [[ "$line" =~ ^[[:space:]]*status:[[:space:]]*\"(.*)\" ]]; then
      token_status="${BASH_REMATCH[1]}"
    elif [[ "$line" =~ ^[[:space:]]*univers:[[:space:]]*\"(.*)\" ]]; then
      token_univers="${BASH_REMATCH[1]}"
    elif [[ "$line" =~ ^[[:space:]]*comment:[[:space:]]*\"(.*)\" ]]; then
      token_comment="${BASH_REMATCH[1]}"
    elif [[ "$line" =~ ^[[:space:]]*created_at:[[:space:]]*\"(.*)\" ]]; then
      token_created="${BASH_REMATCH[1]}"
    fi
  done < "$tokens_file"
  
  # Afficher dernier token
  if [[ "$in_token" == "true" ]]; then
    echo "  ID: $token_id"
    echo "    Univers: $token_univers"
    echo "    Status: $token_status"
    echo "    Source: $token_comment"
    echo "    Créé: $token_created"
    echo ""
  fi
}

# token revoke <tenant> <token_id>
cmd_token_revoke() {
  local tenant="$1"
  local token_id="$2"
  
  validate_tenant "$tenant"
  
  if [[ -z "$token_id" ]]; then
    error "token_id requis (E01)" "$E01"
  fi
  
  local tokens_file="$TENANTS_DIR/$tenant/secrets/dvig.tokens.yml"
  
  if [[ ! -f "$tokens_file" ]]; then
    error "Fichier tokens non trouvé: $tokens_file (E03)" "$E03"
  fi
  
  # Révoquer
  echo "🔒 Révocation token $token_id..."
  revoke_token_in_yaml "$tokens_file" "$token_id"
  
  # Recharger DVIG
  reload_dvig "$tenant"
  
  echo "✅ Token $token_id révoqué"
}

# token rotate <univers> <env> <tenant> [--revoke-old]
cmd_token_rotate() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  shift 3 || true
  
  validate_univers "$univers"
  validate_env "$env"
  validate_tenant "$tenant"
  
  local revoke_old=false
  
  # Parser flags
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --revoke-old)
        revoke_old=true
        ;;
      *)
        error "Flag inconnu: $1 (E01)" "$E01"
        ;;
    esac
    shift
  done
  
  local source="${univers}.${env}.${tenant}"
  local tokens_file="$TENANTS_DIR/$tenant/secrets/dvig.tokens.yml"
  
  # Trouver ancien token actif
  local old_token_id
  old_token_id=$(find_token_id_by_source "$tokens_file" "$source")
  
  # Générer nouveau token (réutiliser logique issue)
  echo "🔄 Rotation token pour $source..."
  
  # Générer token
  local token_output
  token_output=$(generate_token_raw "$tenant" "$univers")
  
  local token_raw token_hash
  token_raw=$(echo "$token_output" | cut -d'|' -f1)
  token_hash=$(echo "$token_output" | cut -d'|' -f2)
  
  # Générer token_id déterministe
  local new_token_id
  new_token_id=$(generate_token_id "$env" "$tenant" "$tokens_file")
  
  # Commentaire
  local comment="${env^^} - $source (tenant DNS: $tenant) [ROTATION]"
  
  # Ajouter au YAML
  add_token_to_yaml "$tokens_file" "$new_token_id" "$token_hash" "$tenant" "$univers" "$source" "$comment"
  
  # Révoquer ancien si demandé
  if [[ "$revoke_old" == "true" && -n "$old_token_id" ]]; then
    echo "🔒 Révocation ancien token $old_token_id..."
    revoke_token_in_yaml "$tokens_file" "$old_token_id"
    echo "✅ Ancien token révoqué"
  elif [[ -n "$old_token_id" ]]; then
    echo "ℹ️  Ancien token $old_token_id toujours actif (utilisez --revoke-old pour révoquer)"
  fi
  
  # Recharger DVIG
  reload_dvig "$tenant"
  
  # Afficher nouveau token (UNE SEULE FOIS)
  echo ""
  echo "✅ Rotation terminée"
  echo "📋 Nouveau token ID: $new_token_id"
  echo "📋 Source: $source"
  echo ""
  echo "🔑 NOUVEAU TOKEN (à copier maintenant, ne sera plus affiché):"
  echo "$token_raw"
  echo ""
  if [[ -n "$old_token_id" ]]; then
    echo "📋 Ancien token: $old_token_id ($([[ "$revoke_old" == "true" ]] && echo "révoqué" || echo "actif"))"
  fi
  echo ""
  echo "⚠️  IMPORTANT: Ce token ne sera plus affiché. Stockez-le en sécurité."
}

# token status <univers> <env> <tenant> (Phase 4)
cmd_token_status() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  
  validate_univers "$univers"
  validate_env "$env"
  validate_tenant "$tenant"
  
  local source="${univers}.${env}.${tenant}"
  local tokens_file="$TENANTS_DIR/$tenant/secrets/dvig.tokens.yml"
  
  if [[ ! -f "$tokens_file" ]]; then
    error "Fichier tokens non trouvé: $tokens_file (E03)" "$E03"
  fi
  
  # Trouver token actif pour cette source
  local token_id
  token_id=$(find_token_id_by_source "$tokens_file" "$source")
  
  if [[ -z "$token_id" ]]; then
    error "Aucun token actif trouvé pour source $source (E02)" "$E02"
  fi
  
  # Extraire le token brut depuis le YAML (nécessite parsing)
  # Pour l'instant, on utilise le token stocké dans le YAML
  # Note: Le token brut n'est pas stocké dans le YAML (seulement hash)
  # On doit utiliser l'API DVIG avec le token hash ou trouver une autre méthode
  
  # Construire URL DVIG
  local dvig_hostname
  dvig_hostname=$(_get_hostname "dvig" "" "$tenant")
  local dvig_url="https://${dvig_hostname}"
  
  # Pour l'instant, on affiche un message indiquant que cette fonctionnalité
  # nécessite le token brut (qui n'est pas stocké dans le YAML)
  echo "⚠️  Fonctionnalité en développement"
  echo "📋 Token ID: $token_id"
  echo "📋 Source: $source"
  echo "🌐 URL DVIG: $dvig_url"
  echo ""
  echo "💡 Pour obtenir le statut complet, utilisez directement l'API DVIG:"
  echo "   curl -H 'Authorization: Bearer <token>' $dvig_url/auth/token-status"
}

# token renew <univers> <env> <tenant> [--pre-renew-days <days>] [--grace-days <days>] (Phase 4)
cmd_token_renew() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  shift 3 || true
  
  validate_univers "$univers"
  validate_env "$env"
  validate_tenant "$tenant"
  
  local pre_renew_days=30
  local grace_days=7
  
  # Parser flags
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --pre-renew-days)
        pre_renew_days="${2:-30}"
        shift 2 || true
        ;;
      --grace-days)
        grace_days="${2:-7}"
        shift 2 || true
        ;;
      *)
        error "Flag inconnu: $1 (E01)" "$E01"
        ;;
    esac
  done
  
  local source="${univers}.${env}.${tenant}"
  local tokens_file="$TENANTS_DIR/$tenant/secrets/dvig.tokens.yml"
  
  if [[ ! -f "$tokens_file" ]]; then
    error "Fichier tokens non trouvé: $tokens_file (E03)" "$E03"
  fi
  
  # Trouver token actif pour cette source
  local token_id
  token_id=$(find_token_id_by_source "$tokens_file" "$source")
  
  if [[ -z "$token_id" ]]; then
    error "Aucun token actif trouvé pour source $source (E02)" "$E02"
  fi
  
  # Construire URL DVIG
  local dvig_hostname
  dvig_hostname=$(_get_hostname "dvig" "" "$tenant")
  local dvig_url="https://${dvig_hostname}"
  
  echo "⚠️  Fonctionnalité en développement"
  echo "📋 Token ID: $token_id"
  echo "📋 Source: $source"
  echo "🌐 URL DVIG: $dvig_url"
  echo ""
  echo "💡 Pour renouveler le token, utilisez directement l'API DVIG:"
  echo "   curl -X POST -H 'Authorization: Bearer <token>' \\"
  echo "        -H 'Content-Type: application/json' \\"
  echo "        -d '{\"pre_renew_days\": $pre_renew_days, \"grace_days\": $grace_days}' \\"
  echo "        $dvig_url/auth/renew"
  echo ""
  echo "⚠️  Note: Cette fonctionnalité nécessite le token brut (non stocké dans YAML)"
}

# Commandes server (Phase 3)
cmd_server() {
  local subcommand="${1:-help}"
  shift || true
  
  case "$subcommand" in
    list)
      cmd_server_list "$@"
      ;;
    add)
      if [[ $# -lt 1 ]]; then
        error "Usage: server add <server_name> (E01)" "$E01"
      fi
      cmd_server_add "$@"
      ;;
    preflight)
      if [[ $# -lt 1 ]]; then
        error "Usage: server preflight <server_name> (E01)" "$E01"
      fi
      cmd_server_preflight "$@"
      ;;
    status)
      if [[ $# -lt 1 ]]; then
        error "Usage: server status <server_name> (E01)" "$E01"
      fi
      cmd_server_status "$@"
      ;;
    *)
      echo "Sous-commande inconnue: $subcommand (utilisez 'help')" >&2
      echo "Sous-commandes disponibles: list, add, preflight, status" >&2
      exit "$E01"
      ;;
  esac
}

# server list
cmd_server_list() {
  local server_utils="$ROOT_DIR/lib/server/server_utils.sh"
  
  if [[ ! -f "$server_utils" ]]; then
    error "Script server_utils introuvable: $server_utils (E03)" "$E03"
  fi
  
  source "$server_utils"
  list_servers
}

# server add <server_name>
cmd_server_add() {
  local server_name="$1"
  local servers_dir="$ROOT_DIR/servers"
  local server_file="$servers_dir/${server_name}.json"
  local example_file="$servers_dir/server.example.json"
  
  # Valider nom serveur (slug DNS)
  if [[ ! "$server_name" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]]; then
    error "Nom serveur invalide (doit être un slug DNS): $server_name (E01)" "$E01"
  fi
  
  # Vérifier si serveur existe déjà
  if [[ -f "$server_file" ]]; then
    error "Serveur déjà configuré: $server_name (fichier: $server_file) (E05)" "$E05"
  fi
  
  # Créer répertoire si nécessaire
  mkdir -p "$servers_dir"
  
  # Créer fichier depuis exemple
  if [[ -f "$example_file" ]]; then
    cp "$example_file" "$server_file"
    echo "✅ Fichier configuration créé: $server_file"
    echo "📝 Éditez ce fichier avec les informations du serveur:"
    echo "   - public_ip"
    echo "   - ssh.user"
    echo "   - ssh.key_path"
    echo "   - domains.canonical"
    echo ""
    echo "💡 Valider avec: dorevia.sh server preflight $server_name"
  else
    # Créer fichier minimal
    cat > "$server_file" <<EOF
{
  "server_name": "$server_name",
  "description": "Serveur client pour tenant",
  "public_ip": "192.168.1.100",
  "ssh": {
    "user": "dorevia",
    "key_path": "~/.ssh/id_rsa_${server_name}",
    "port": 22
  },
  "domains": {
    "canonical": "client.com",
    "dns_managed_by": "client"
  },
  "requirements": {
    "docker": true,
    "docker_compose": true,
    "ports": [22, 80, 443],
    "min_disk_gb": 50
  },
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0"
}
EOF
    echo "✅ Fichier configuration créé: $server_file"
    echo "📝 Éditez ce fichier avec les informations du serveur"
  fi
}

# server preflight <server_name>
cmd_server_preflight() {
  local server_name="$1"
  local preflight_script="$ROOT_DIR/lib/server/preflight_server.sh"
  
  if [[ ! -f "$preflight_script" ]]; then
    error "Script preflight serveur introuvable: $preflight_script (E03)" "$E03"
  fi
  
  # Exécuter préflight serveur
  if bash "$preflight_script" "$server_name"; then
    return 0
  else
    error "Préflight serveur échoué (E02)" "$E02"
  fi
}

# server status <server_name>
cmd_server_status() {
  local server_name="$1"
  local server_utils="$ROOT_DIR/lib/server/server_utils.sh"
  
  if [[ ! -f "$server_utils" ]]; then
    error "Script server_utils introuvable: $server_utils (E03)" "$E03"
  fi
  
  source "$server_utils"
  
  # Lire configuration
  local config
  config=$(read_server_config "$server_name" 2>/dev/null || echo "")
  if [[ -z "$config" ]]; then
    error "Serveur introuvable: $server_name (E01)" "$E01"
  fi
  
  local public_ip=$(echo "$config" | jq -r '.public_ip')
  local ssh_user=$(echo "$config" | jq -r '.ssh.user')
  local ssh_key=$(echo "$config" | jq -r '.ssh.key_path')
  local canonical_domain=$(echo "$config" | jq -r '.domains.canonical // "N/A"')
  local description=$(echo "$config" | jq -r '.description // "N/A"')
  
  echo "📊 Serveur: $server_name"
  echo ""
  echo "Configuration:"
  echo "  Description: $description"
  echo "  IP publique: $public_ip"
  echo "  SSH user: $ssh_user"
  echo "  SSH key: $ssh_key"
  echo "  Domaine canonique: $canonical_domain"
  echo ""
  
  # Test connexion SSH (basique)
  local expanded_key="${ssh_key/#\~/$HOME}"
  if [[ -f "$expanded_key" ]]; then
    echo "Test connexion SSH..."
    if ssh -i "$expanded_key" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "${ssh_user}@${public_ip}" "echo 'Connexion OK'" 2>/dev/null; then
      info "✅ Connexion SSH OK"
    else
      warn "⚠️  Connexion SSH échouée (vérifier clé et accès)"
    fi
  else
    warn "⚠️  Clé SSH non trouvée: $expanded_key"
  fi
}

# Commandes backup (Phase 3)
cmd_backup() {
  local tenant="${1:-}"
  
  if [[ -z "$tenant" ]]; then
    error "Usage: backup <tenant> [--server <server_name>] [--output <dir>] (E01)" "$E01"
  fi
  
  validate_tenant "$tenant"
  
  local server_name=""
  local output_dir=""
  
  # Parser flags
  shift || true
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --server)
        server_name="${2:-}"
        if [[ -z "$server_name" ]]; then
          error "Usage: backup <tenant> --server <server_name> [--output <dir>] (E01)" "$E01"
        fi
        shift 2 || true
        ;;
      --output)
        output_dir="${2:-}"
        if [[ -z "$output_dir" ]]; then
          error "Usage: backup <tenant> [--server <server_name>] --output <dir> (E01)" "$E01"
        fi
        shift 2 || true
        ;;
      *)
        error "Option inconnue: $1 (Usage: backup <tenant> [--server <server_name>] [--output <dir>]) (E01)" "$E01"
        ;;
    esac
  done
  
  # Déterminer répertoire de sortie
  if [[ -z "$output_dir" ]]; then
    local timestamp=$(date -u +"%Y%m%dT%H%M%SZ")
    output_dir="$ROOT_DIR/backups/backup-${tenant}-${timestamp}"
  fi
  
  # Mode distant ou local
  if [[ -n "$server_name" ]]; then
    # Mode distant : backup sur serveur client
    local backup_script="$ROOT_DIR/lib/backup/backup_remote.sh"
    if [[ ! -f "$backup_script" ]]; then
      error "Script backup_remote introuvable: $backup_script (E03)" "$E03"
    fi
    
    if bash "$backup_script" "$tenant" "$server_name" "$output_dir"; then
      info "✅ Backup complété: $output_dir"
      return 0
    else
      error "Échec backup (E04)" "$E04"
    fi
  else
    # Mode local (à implémenter si nécessaire)
    error "Backup local non implémenté. Utilisez --server pour backup serveur client (E03)" "$E03"
  fi
}

# Commandes restore (Phase 3)
cmd_restore() {
  local tenant="${1:-}"
  
  if [[ -z "$tenant" ]]; then
    error "Usage: restore <tenant> [--server <server_name>] --from <backup_dir> (E01)" "$E01"
  fi
  
  validate_tenant "$tenant"
  
  local server_name=""
  local backup_dir=""
  
  # Parser flags
  shift || true
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --server)
        server_name="${2:-}"
        if [[ -z "$server_name" ]]; then
          error "Usage: restore <tenant> --server <server_name> --from <backup_dir> (E01)" "$E01"
        fi
        shift 2 || true
        ;;
      --from)
        backup_dir="${2:-}"
        if [[ -z "$backup_dir" ]]; then
          error "Usage: restore <tenant> [--server <server_name>] --from <backup_dir> (E01)" "$E01"
        fi
        shift 2 || true
        ;;
      *)
        error "Option inconnue: $1 (Usage: restore <tenant> [--server <server_name>] --from <backup_dir>) (E01)" "$E01"
        ;;
    esac
  done
  
  if [[ -z "$backup_dir" ]]; then
    error "Option --from requise (Usage: restore <tenant> [--server <server_name>] --from <backup_dir>) (E01)" "$E01"
  fi
  
  if [[ ! -d "$backup_dir" ]]; then
    error "Répertoire backup introuvable: $backup_dir (E01)" "$E01"
  fi
  
  # Mode distant ou local
  if [[ -n "$server_name" ]]; then
    # Mode distant : restore sur serveur client
    local restore_script="$ROOT_DIR/lib/backup/restore_remote.sh"
    if [[ ! -f "$restore_script" ]]; then
      error "Script restore_remote introuvable: $restore_script (E03)" "$E03"
    fi
    
    if bash "$restore_script" "$tenant" "$server_name" "$backup_dir"; then
      info "✅ Restore complété"
      return 0
    else
      error "Échec restore (E04)" "$E04"
    fi
  else
    # Mode local (à implémenter si nécessaire)
    error "Restore local non implémenté. Utilisez --server pour restore serveur client (E03)" "$E03"
  fi
}

# Main
main() {
  local command="${1:-help}"
  shift || true
  
  case "$command" in
    help) cmd_help ;;
    version) cmd_version ;;
    doctor) cmd_doctor ;;
    validate) cmd_validate "$@" ;;
    render) cmd_render "$@" ;;
    preflight) cmd_preflight "$@" ;;
    apply) cmd_apply "$@" ;;
    prompt) cmd_prompt "$@" ;;
    production) cmd_production "$@" ;;
    gateway) cmd_gateway "$@" ;;
    platform) cmd_platform "$@" ;;
    app) cmd_app "$@" ;;
    token) cmd_token "$@" ;;
    server) cmd_server "$@" ;;
    backup) cmd_backup "$@" ;;
    restore) cmd_restore "$@" ;;
    *) error "Commande inconnue: $command (utilisez 'help')" "$E01" ;;
  esac
}

# Exécution
main "$@"

