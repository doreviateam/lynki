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

# Validation univers
validate_univers() {
  local univers="$1"
  case "$univers" in
    odoo) ;;
    *) error "Univers invalide: $univers (v1.0: odoo uniquement) (E01)" "$E01" ;;
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
  
  # Exécuter validation
  if "$validate_script" "$manifest_file"; then
    echo "✅ Manifest $tenant valide (Phase 1)"
    return 0
  else
    error "Manifest $tenant invalide (E02)" "$E02"
  fi
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
    echo "  - Services partagés: dvig.core.doreviateam.com, vault.core.doreviateam.com"
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
  
  # Containers attendus
  local containers=("dvig-$tenant" "vault-$tenant" "vault-db-$tenant")
  
  for container in "${containers[@]}"; do
    if docker ps -a --format "{{.Names}}" | grep -q "^${container}$"; then
      # Vérifier si le container appartient à un autre projet
      local inspect_project=$(docker inspect "$container" --format '{{index .Config.Labels "com.docker.compose.project"}}' 2>/dev/null || echo "")
      if [[ -n "$inspect_project" && "$inspect_project" != "dorevia_${tenant}_platform" ]]; then
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

# platform up <tenant>
cmd_platform_up() {
  local tenant="$1"
  shift || true
  validate_tenant "$tenant"
  
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  
  # Vérifier gateway (prérequis)
  check_gateway "$@"
  
  # Vérifier réseau
  check_dorevia_network
  
  # Générer docker-compose.yml si absent
  if [[ ! -f "$platform_dir/docker-compose.yml" ]]; then
    if [[ ! -f "$platform_dir/docker-compose.yml.template" ]]; then
      error "Template non trouvé: $platform_dir/docker-compose.yml.template (E03)" "$E03"
    fi
    generate_platform_compose "$tenant"
  fi
  
  # Vérifier tokens
  local tokens_file="$TENANTS_DIR/$tenant/secrets/dvig.tokens.yml"
  if [[ ! -f "$tokens_file" ]]; then
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
  
  # Utiliser project name pour isolation
  local project_name="dorevia_${tenant}_platform"
  
  echo "🚀 Démarrage platform $tenant..."
  if docker compose -p "$project_name" up -d; then
    echo "✅ Platform $tenant démarrée"
    echo ""
    echo "📊 URLs:"
    echo "  - DVIG: https://dvig.$tenant.doreviateam.com"
    echo "  - Vault: https://vault.$tenant.doreviateam.com"
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
  
  local project_name="dorevia_${tenant}_platform"
  
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
  
  local project_name="dorevia_${tenant}_platform"
  
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
check_platform_up() {
  local tenant="$1"
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  
  if [[ ! -f "$platform_dir/docker-compose.yml" ]]; then
    error "Platform $tenant non configurée. Démarrer avec: dorevia.sh platform up $tenant (E04)" "$E04"
  fi
  
  # Vérifier que les containers platform sont running
  local containers=("dvig-$tenant" "vault-$tenant")
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
  local volume_db_name="odoo_${env}_${tenant}_db"
  local volume_data_name="odoo_${env}_${tenant}_data"
  
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

# app up <univers> <env> <tenant>
cmd_app_up() {
  local univers="$1"
  local env="$2"
  local tenant="$3"
  shift 3 || true
  
  validate_univers "$univers"
  validate_env "$env"
  validate_tenant "$tenant"
  
  # Vérifier gateway (prérequis)
  check_gateway "$@"
  
  # Vérifier platform up (prérequis)
  check_platform_up "$tenant"
  
  # Vérifier réseau
  check_dorevia_network
  
  # Générer source
  local source="${univers}.${env}.${tenant}"
  
  # Générer identifiants déterministes
  local db_name="odoo_${env}_${tenant}"
  local volume_db="odoo_${env}_${tenant}_db"
  local volume_data="odoo_${env}_${tenant}_data"
  local compose_project="dorevia_${univers}_${env}_${tenant}"
  
  # Créer répertoire app
  local app_dir="$TENANTS_DIR/$tenant/apps/$univers/$env"
  mkdir -p "$app_dir"
  
  # Générer configurations depuis templates
  if [[ ! -f "$app_dir/docker-compose.yml" ]]; then
    generate_app_compose "$univers" "$env" "$tenant" "$db_name" "$volume_db" "$volume_data" "$compose_project"
  fi
  
  if [[ ! -f "$app_dir/odoo.conf" ]]; then
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
  
  local compose_project="dorevia_${univers}_${env}_${tenant}"
  local source="${univers}.${env}.${tenant}"
  local db_name="odoo_${env}_${tenant}"
  
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
  
  local compose_project="dorevia_${univers}_${env}_${tenant}"
  
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
  
  local compose_project="dorevia_${univers}_${env}_${tenant}"
  local db_name="odoo_${env}_${tenant}"
  
  echo "🔄 Reset app $univers $env $tenant (--purge activé)..."
  
  # Arrêter containers
  docker compose -p "$compose_project" down -v || true
  
  # Drop DB si container DB existe encore
  local db_container="odoo_db_${env}_${tenant}"
  if docker ps -a --format "{{.Names}}" | grep -q "^${db_container}$"; then
    echo "🗑️  Suppression DB $db_name..."
    docker exec "$db_container" psql -U odoo -c "DROP DATABASE IF EXISTS $db_name;" 2>/dev/null || true
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
  
  local compose_project="dorevia_${univers}_${env}_${tenant}"
  
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

# Main
main() {
  local command="${1:-help}"
  shift || true
  
  case "$command" in
    help) cmd_help ;;
    version) cmd_version ;;
    doctor) cmd_doctor ;;
    validate) cmd_validate "$@" ;;
    gateway) cmd_gateway "$@" ;;
    platform) cmd_platform "$@" ;;
    app) cmd_app "$@" ;;
    token) cmd_token "$@" ;;
    *) error "Commande inconnue: $command (utilisez 'help')" "$E01" ;;
  esac
}

# Exécution
main "$@"

