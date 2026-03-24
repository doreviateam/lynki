#!/usr/bin/env bash
# ==============================================================================
# mistral_window.sh — Fenêtre de calcul Mistral (Phase 3B DIVA)
#
# Principe : démarrer Mistral, attendre que le healthcheck passe, laisser
#            le runner Diva pré-calculer les insights, puis arrêter Mistral.
#
# Usage :
#   ./mistral_window.sh              # fenêtre standard (MISTRAL_WINDOW_MINUTES)
#   ./mistral_window.sh --dry-run    # simulation sans démarrage/arrêt réel
#
# Comportement hors fenêtre :
#   - GET /diva/insights → insight depuis le store Postgres (toujours disponible)
#   - POST /diva/explain cockpit → flash dégradé déterministe (FactsPack, sans LLM)
#   - POST /diva/explain card → HTTP 503 (MISTRAL_UNAVAILABLE) — comportement documenté
#
# Variables d'environnement :
#   MISTRAL_COMPOSE_DIR        Répertoire docker-compose Mistral (défaut: détection auto)
#   MISTRAL_WINDOW_MINUTES     Durée max de la fenêtre en minutes (défaut: 60)
#   MISTRAL_HEALTH_PORT        Port healthcheck (défaut: 8000)
#   MISTRAL_HEALTH_RETRIES     Tentatives healthcheck (défaut: 40, soit ~200s)
#   MISTRAL_HEALTH_INTERVAL_S  Intervalle entre tentatives (défaut: 5s)
#   MISTRAL_CONTAINER_NAME     Nom du conteneur (défaut: mistral-llamacpp)
#   DIVA_LOG_IDLE_SECONDS      Secondes sans event=diva_gen pour arrêt anticipé (défaut: 300)
# ==============================================================================

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

MISTRAL_COMPOSE_DIR="${MISTRAL_COMPOSE_DIR:-${REPO_ROOT}/units/mistral}"
MISTRAL_WINDOW_MINUTES="${MISTRAL_WINDOW_MINUTES:-60}"
MISTRAL_HEALTH_PORT="${MISTRAL_HEALTH_PORT:-8000}"
MISTRAL_HEALTH_RETRIES="${MISTRAL_HEALTH_RETRIES:-40}"
MISTRAL_HEALTH_INTERVAL_S="${MISTRAL_HEALTH_INTERVAL_S:-5}"
MISTRAL_CONTAINER_NAME="${MISTRAL_CONTAINER_NAME:-mistral-llamacpp}"
DIVA_LOG_IDLE_SECONDS="${DIVA_LOG_IDLE_SECONDS:-300}"
DRY_RUN=false

# ── Parse args ─────────────────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
    *) echo "[WARN] Argument inconnu : $arg" ;;
  esac
done

# ── Helpers ────────────────────────────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
log_info()  { log "INFO  $*"; }
log_warn()  { log "WARN  $*"; }
log_error() { log "ERROR $*" >&2; }

run_cmd() {
  if $DRY_RUN; then
    log_info "[DRY-RUN] $*"
  else
    "$@"
  fi
}

# ── Vérifications préalables ───────────────────────────────────────────────────
if [ ! -f "${MISTRAL_COMPOSE_DIR}/docker-compose.yml" ]; then
  log_error "docker-compose.yml introuvable dans ${MISTRAL_COMPOSE_DIR}"
  exit 1
fi

log_info "=== Fenêtre Mistral — démarrage ==="
log_info "Répertoire compose : ${MISTRAL_COMPOSE_DIR}"
log_info "Durée max fenêtre  : ${MISTRAL_WINDOW_MINUTES} min"
log_info "Healthcheck        : http://localhost:${MISTRAL_HEALTH_PORT}/health"
$DRY_RUN && log_warn "Mode DRY-RUN actif — aucune action réelle"

# ── Étape 1 : RAM avant démarrage ──────────────────────────────────────────────
RAM_BEFORE=$(free -h | awk '/^Mem:/{print $7}')
log_info "RAM disponible avant démarrage : ${RAM_BEFORE}"

# ── Étape 2 : Démarrer Mistral ─────────────────────────────────────────────────
log_info "Démarrage de ${MISTRAL_CONTAINER_NAME}..."
run_cmd docker compose -f "${MISTRAL_COMPOSE_DIR}/docker-compose.yml" up -d "${MISTRAL_CONTAINER_NAME}"

# ── Étape 3 : Attendre le healthcheck ─────────────────────────────────────────
log_info "Attente healthcheck (max ${MISTRAL_HEALTH_RETRIES} × ${MISTRAL_HEALTH_INTERVAL_S}s)..."
HEALTHY=false
for i in $(seq 1 "$MISTRAL_HEALTH_RETRIES"); do
  if $DRY_RUN; then
    HEALTHY=true
    break
  fi
  if curl -sf "http://localhost:${MISTRAL_HEALTH_PORT}/health" > /dev/null 2>&1; then
    HEALTHY=true
    log_info "Mistral healthy (tentative ${i})"
    break
  fi
  sleep "$MISTRAL_HEALTH_INTERVAL_S"
done

if ! $HEALTHY; then
  log_error "Mistral non healthy après ${MISTRAL_HEALTH_RETRIES} tentatives — abandon"
  exit 2
fi

RAM_AFTER_START=$(free -h | awk '/^Mem:/{print $7}')
log_info "RAM disponible après démarrage Mistral : ${RAM_AFTER_START}"

# ── Étape 4 : Fenêtre de calcul ───────────────────────────────────────────────
WINDOW_SECS=$(( MISTRAL_WINDOW_MINUTES * 60 ))
IDLE_CHECK_SECS="$DIVA_LOG_IDLE_SECONDS"

log_info "Fenêtre ouverte — attente max ${MISTRAL_WINDOW_MINUTES} min."
log_info "Arrêt anticipé possible si aucun event=diva_gen pendant ${IDLE_CHECK_SECS}s."
log_info "Le runner Diva pré-calcule les insights en tâche de fond."

# Surveillance de l'inactivité Mistral pour arrêt anticipé
LAST_GEN_TS=$(date +%s)
ELAPSED=0

while [ $ELAPSED -lt $WINDOW_SECS ]; do
  sleep 30
  ELAPSED=$(( ELAPSED + 30 ))

  if $DRY_RUN; then
    log_info "[DRY-RUN] Fenêtre simulée — arrêt après 30s"
    break
  fi

  # Vérifier si une inférence Mistral a eu lieu dans les IDLE_CHECK_SECS dernières secondes
  RECENT_GEN=$(docker logs "$MISTRAL_CONTAINER_NAME" --since "${IDLE_CHECK_SECS}s" 2>/dev/null | grep -c "slot" || true)
  if [ "$RECENT_GEN" -gt 0 ]; then
    LAST_GEN_TS=$(date +%s)
  fi

  IDLE_SINCE=$(( $(date +%s) - LAST_GEN_TS ))
  log_info "Fenêtre : ${ELAPSED}/${WINDOW_SECS}s — idle depuis ${IDLE_SINCE}s"

  if [ $IDLE_SINCE -ge $IDLE_CHECK_SECS ] && [ $ELAPSED -gt 120 ]; then
    log_info "Mistral inactif depuis ${IDLE_SINCE}s — arrêt anticipé de la fenêtre"
    break
  fi
done

# ── Étape 5 : Arrêter Mistral ─────────────────────────────────────────────────
log_info "Arrêt de ${MISTRAL_CONTAINER_NAME}..."
run_cmd docker compose -f "${MISTRAL_COMPOSE_DIR}/docker-compose.yml" stop "${MISTRAL_CONTAINER_NAME}"

RAM_AFTER_STOP=$(free -h | awk '/^Mem:/{print $7}')
log_info "RAM disponible après arrêt Mistral : ${RAM_AFTER_STOP}"
log_info "RAM libérée : avant_démarrage=${RAM_BEFORE} → après_arrêt=${RAM_AFTER_STOP}"

log_info "=== Fenêtre Mistral — terminée ==="
log_info "Les insights sont disponibles via le store Postgres."
log_info "Hors fenêtre : /diva/insights (store) OK · /explain cockpit (dégradé déterministe) OK · /explain card 503."
