#!/bin/bash
# render_caddyfile.sh - Génération Caddyfile depuis manifest Phase 1/3
# Usage: render_caddyfile.sh <tenant> <env> [--intent <intent_file>]
# Phase 3: Support domaines clients (canonique + alias + fallback)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TENANTS_DIR="$ROOT_DIR/tenants"
TEMPLATE_FILE="$SCRIPT_DIR/templates/caddyfile.template"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() {
  echo -e "${RED}ERROR: ${NC}$1" >&2
  exit 1
}

info() {
  echo -e "${GREEN}INFO: ${NC}$1"
}

warn() {
  echo -e "${YELLOW}WARN: ${NC}$1"
}

# Port par univers (multi-univers : odoo, suitecrm, n8n, sylius, ui). ui : linky=3000, appsmith=80.
# Usage: get_port_for_universe <universe> [ui_unit]
get_port_for_universe() {
  local universe="$1"
  local ui_unit="${2:-appsmith}"
  case "$universe" in
    odoo)    echo "8069" ;;
    suitecrm) echo "8080" ;;
    n8n)     echo "5678" ;;
    sylius)  echo "80" ;;
    ui)      [[ "$ui_unit" == "linky" ]] && echo "3000" || echo "80" ;;
    pos)     echo "8069" ;;
    *)       echo "8069" ;;
  esac
}

# Nom du conteneur cible pour reverse_proxy (Sylius=nginx, ui=appsmith ou linky).
# Usage: get_container_for_universe <universe> <env> <tenant_id> [ui_unit]
get_container_for_universe() {
  local universe="$1"
  local env="$2"
  local tenant_id="$3"
  local ui_unit="${4:-appsmith}"
  case "$universe" in
    sylius) echo "${universe}_${env}_${tenant_id}_nginx" ;;
    ui)     [[ "$ui_unit" == "linky" ]] && echo "linky_${env}_${tenant_id}" || echo "appsmith_${env}_${tenant_id}" ;;
    *)      echo "${universe}_${env}_${tenant_id}" ;;
  esac
}

# Fonction pour construire liste hostnames (canonique + alias + fallback)
build_hostnames() {
  local canonical="$1"
  local fallback="$2"
  local aliases_json="$3"
  local service="$4"  # odoo, dvig, vault, ou "global"
  
  local hostnames=()
  
  # Ajouter canonique
  hostnames+=("$canonical")
  
  # Ajouter alias (si applicable au service)
  # Priorité: alias service > alias global
  local seen_hostnames=("$canonical")  # Pour détection collision
  
  if [[ -n "$aliases_json" ]] && [[ "$aliases_json" != "null" ]] && [[ "$aliases_json" != "{}" ]]; then
    # Alias spécifique au service (priorité haute)
    if [[ "$service" != "global" ]]; then
      local service_aliases=$(echo "$aliases_json" | jq -r ".[\"$service\"]?[]? // empty" 2>/dev/null || echo "")
      if [[ -n "$service_aliases" ]]; then
        while IFS= read -r alias; do
          if [[ -n "$alias" ]]; then
            # Détection collision
            local is_duplicate=false
            for seen in "${seen_hostnames[@]}"; do
              if [[ "$seen" == "$alias" ]]; then
                is_duplicate=true
                break
              fi
            done
            if [[ "$is_duplicate" == "false" ]]; then
              hostnames+=("$alias")
              seen_hostnames+=("$alias")
            else
              warn "Collision alias détectée: $alias (ignoré)"
            fi
          fi
        done <<< "$service_aliases"
      fi
    fi
    
    # Alias global (tous services) - priorité basse
    local global_aliases=$(echo "$aliases_json" | jq -r '.global[]? // empty' 2>/dev/null || echo "")
    if [[ -n "$global_aliases" ]]; then
      while IFS= read -r alias; do
        if [[ -n "$alias" ]]; then
          # Détection collision
          local is_duplicate=false
          for seen in "${seen_hostnames[@]}"; do
            if [[ "$seen" == "$alias" ]]; then
              is_duplicate=true
              break
            fi
          done
          if [[ "$is_duplicate" == "false" ]]; then
            hostnames+=("$alias")
            seen_hostnames+=("$alias")
          else
            warn "Collision alias détectée: $alias (ignoré)"
          fi
        fi
      done <<< "$global_aliases"
    fi
  fi
  
  # Ajouter fallback (si présent)
  if [[ -n "$fallback" ]] && [[ "$fallback" != "null" ]]; then
    # Détection collision
    local is_duplicate=false
    for seen in "${seen_hostnames[@]}"; do
      if [[ "$seen" == "$fallback" ]]; then
        is_duplicate=true
        break
      fi
    done
    if [[ "$is_duplicate" == "false" ]]; then
      hostnames+=("$fallback")
    fi
  fi
  
  # Retourner hostnames séparés par virgules (format Caddy)
  IFS=','; echo "${hostnames[*]}"
}

# Vérifier arguments
if [[ $# -lt 2 ]]; then
  error "Usage: $0 <tenant> <env> [--intent <intent_file>]"
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
      ;;
  esac
done

# Vérifier tenant
TENANT_DIR="$TENANTS_DIR/$TENANT"
if [[ ! -d "$TENANT_DIR" ]]; then
  error "Tenant introuvable: $TENANT"
fi

# Vérifier jq
if ! command -v jq &> /dev/null; then
  error "jq n'est pas installé. Veuillez l'installer."
fi

info "Génération Caddyfile pour tenant: $TENANT, env: $ENV"

# Phase 3: Lire configuration domaines depuis intent.json ou manifest.json
CANONICAL_DOMAIN="doreviateam.com"
FALLBACK_DOMAIN=""
ALIASES_JSON="null"
DOMAIN_MODE="saas"

if [[ -n "$INTENT_FILE" ]] && [[ -f "$INTENT_FILE" ]]; then
  # Lire depuis intent.json (Phase 2/3)
  info "Lecture configuration depuis intent: $INTENT_FILE"
  INTENT=$(cat "$INTENT_FILE")
  CANONICAL_DOMAIN=$(echo "$INTENT" | jq -r '.intention.domains.canonical // "doreviateam.com"')
  FALLBACK_DOMAIN=$(echo "$INTENT" | jq -r '.intention.domains.fallback // empty')
  
  # Phase 3: Transformer format alias (tableau -> objet) si nécessaire
  ALIASES_RAW=$(echo "$INTENT" | jq -c '.intention.domains.aliases // []')
  # Vérifier si c'est un tableau (format intent.json) ou un objet (format manifest.json)
  if echo "$ALIASES_RAW" | jq -e 'type == "array"' >/dev/null 2>&1; then
    # Transformer tableau en objet {global: [...], odoo: [...], dvig: [...], vault: [...]}
    ALIASES_JSON=$(echo "$ALIASES_RAW" | jq -c '
      reduce .[] as $alias ({}; 
        if $alias.service == "global" then
          .global = ((.global // []) + [$alias.hostname])
        else
          .[$alias.service] = ((.[$alias.service] // []) + [$alias.hostname])
        end
      )
    ')
  else
    # Déjà au format objet
    ALIASES_JSON="$ALIASES_RAW"
  fi
  
  DOMAIN_MODE=$(echo "$INTENT" | jq -r '.intention.mode // "saas"')
else
  # Lire depuis manifest.json (Phase 1/3)
  MANIFEST_FILE="$TENANT_DIR/state/manifest.json"
  if [[ ! -f "$MANIFEST_FILE" ]]; then
    error "Manifest introuvable: $MANIFEST_FILE (et aucun intent fourni)"
  fi
  
  MANIFEST=$(cat "$MANIFEST_FILE")
  DOMAIN_MODE=$(echo "$MANIFEST" | jq -r '.domain_mode // "saas"')
  
  # Phase 3: Lire domaines depuis manifest
  if echo "$MANIFEST" | jq -e '.domains' >/dev/null 2>&1; then
    CANONICAL_DOMAIN=$(echo "$MANIFEST" | jq -r '.domains.canonical // "doreviateam.com"')
    
    # Lire fallback (peut être booléen true ou chaîne)
    fallback_raw=$(echo "$MANIFEST" | jq -r '.domains.fallback // empty')
    if [[ "$fallback_raw" == "true" ]]; then
      # Si fallback est un booléen true, utiliser doreviateam.com
      FALLBACK_DOMAIN="doreviateam.com"
    elif [[ -n "$fallback_raw" ]] && [[ "$fallback_raw" != "false" ]] && [[ "$fallback_raw" != "null" ]]; then
      # Si fallback est une chaîne (domaine)
      FALLBACK_DOMAIN="$fallback_raw"
    else
      FALLBACK_DOMAIN=""
    fi
    
    ALIASES_JSON=$(echo "$MANIFEST" | jq -c '.domains.aliases // {}')
  fi
fi

# Extraire données tenant
if [[ -n "$INTENT_FILE" ]] && [[ -f "$INTENT_FILE" ]]; then
  TENANT_ID=$(echo "$INTENT" | jq -r '.tenant_id')
  UNIVERSES=$(echo "$INTENT" | jq -r '.intention.universes[]')
else
  TENANT_ID=$(echo "$MANIFEST" | jq -r '.tenant_id')
  UNIVERSES=$(echo "$MANIFEST" | jq -r '.universes[]')
  ENVIRONMENTS=$(echo "$MANIFEST" | jq -r '.environments[]')
  
  # Vérifier que l'env est dans la liste
  if ! echo "$ENVIRONMENTS" | grep -q "^${ENV}$"; then
    error "Environnement '$ENV' non activé pour tenant '$TENANT'"
  fi
  # Unité UI pour Caddy (linky → port 3000, appsmith → port 80)
  UI_UNIT=$(echo "$MANIFEST" | jq -r '(.units.ui // ["appsmith"])[0]')
fi
if [[ -z "${UI_UNIT:-}" ]]; then
  UI_UNIT="appsmith"
fi

# Phase 3: Déterminer fallback selon mode
if [[ "$DOMAIN_MODE" == "client" ]] || [[ "$DOMAIN_MODE" == "hybrid" ]]; then
  # Mode Client: fallback obligatoire si non défini
  if [[ -z "$FALLBACK_DOMAIN" ]] || [[ "$FALLBACK_DOMAIN" == "null" ]]; then
    FALLBACK_DOMAIN="doreviateam.com"
    warn "Fallback non défini en mode $DOMAIN_MODE, utilisation de doreviateam.com par défaut"
  fi
fi

info "Configuration domaines:"
info "  Mode: $DOMAIN_MODE"
info "  Canonique: $CANONICAL_DOMAIN"
if [[ -n "$FALLBACK_DOMAIN" ]]; then
  info "  Fallback: $FALLBACK_DOMAIN"
fi

# Créer répertoire de sortie
OUTPUT_DIR="$TENANT_DIR/rendered/$ENV/caddy"
mkdir -p "$OUTPUT_DIR"
OUTPUT_FILE="$OUTPUT_DIR/Caddyfile"

# Générer Caddyfile (Phase 3: multi-hostnames)
{
  echo "{"
  echo "  email admin@doreviateam.com"
  echo "}"
  echo ""
  
  # Générer routes pour chaque univers
  for universe in $UNIVERSES; do
    # Construire hostnames (canonique + alias + fallback)
    canonical_hostname="${universe}.${ENV}.${TENANT_ID}.${CANONICAL_DOMAIN}"
    fallback_hostname=""
    if [[ -n "$FALLBACK_DOMAIN" ]]; then
      fallback_hostname="${universe}.${ENV}.${TENANT_ID}.${FALLBACK_DOMAIN}"
    fi
    
    hostnames=$(build_hostnames "$canonical_hostname" "$fallback_hostname" "$ALIASES_JSON" "$universe")
    
    port=$(get_port_for_universe "$universe" "${UI_UNIT:-appsmith}")
    container=$(get_container_for_universe "$universe" "$ENV" "$TENANT_ID" "${UI_UNIT:-appsmith}")
    echo "# $universe - Environnements (tenant $TENANT_ID)"
    echo "$hostnames {"
    echo "  reverse_proxy ${container}:${port}"
    echo "}"
    echo ""
  done
  
  # Générer routes pour services cœur (DVIG/Vault) - 1 par tenant (sans environnement)
  # Phase 3: Support domaines clients + fallback
  echo "# Services partagés (tenant $TENANT_ID) - 1 par tenant"
  
  # DVIG
  canonical_dvig="dvig.${TENANT_ID}.${CANONICAL_DOMAIN}"
  fallback_dvig=""
  if [[ -n "$FALLBACK_DOMAIN" ]]; then
    fallback_dvig="dvig.${TENANT_ID}.${FALLBACK_DOMAIN}"
  fi
  hostnames_dvig=$(build_hostnames "$canonical_dvig" "$fallback_dvig" "$ALIASES_JSON" "dvig")
  echo "$hostnames_dvig {"
  echo "  reverse_proxy dvig-${TENANT_ID}:8080"
  echo "}"
  echo ""
  
  # Vault
  canonical_vault="vault.${TENANT_ID}.${CANONICAL_DOMAIN}"
  fallback_vault=""
  if [[ -n "$FALLBACK_DOMAIN" ]]; then
    fallback_vault="vault.${TENANT_ID}.${FALLBACK_DOMAIN}"
  fi
  hostnames_vault=$(build_hostnames "$canonical_vault" "$fallback_vault" "$ALIASES_JSON" "vault")
  echo "$hostnames_vault {"
  echo "  reverse_proxy vault-${TENANT_ID}:8080"
  echo "}"
} > "$OUTPUT_FILE"

# Phase 3: Validation format Caddyfile (basique)
if command -v caddy &> /dev/null; then
  if caddy validate --config "$OUTPUT_FILE" >/dev/null 2>&1; then
    info "✅ Caddyfile validé par Caddy"
  else
    warn "Caddyfile non validé par Caddy (caddy validate non disponible ou erreur)"
  fi
else
  # Validation basique: vérifier syntaxe basique
  if grep -q "reverse_proxy" "$OUTPUT_FILE" && grep -q "{" "$OUTPUT_FILE" && grep -q "}" "$OUTPUT_FILE"; then
    info "✅ Caddyfile généré (validation basique OK)"
  else
    error "Caddyfile invalide (structure de base manquante)"
  fi
fi

info "✅ Caddyfile généré: $OUTPUT_FILE"

