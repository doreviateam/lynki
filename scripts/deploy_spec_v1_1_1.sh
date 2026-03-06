#!/bin/bash
# Script de déploiement — SPEC Orchestration Temps Réel v1.1.1
# Usage: ./deploy_spec_v1_1_1.sh <database> <environment> [--dry-run]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DATABASE="${1:-}"
ENVIRONMENT="${2:-staging}"
DRY_RUN="${3:-}"

if [ -z "$DATABASE" ]; then
    echo -e "${RED}Erreur: Base de données non spécifiée${NC}"
    echo "Usage: $0 <database> <environment> [--dry-run]"
    echo "Exemple: $0 odoo_stinger_sarl-la-platine staging"
    exit 1
fi

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo -e "${RED}Erreur: Environnement doit être 'staging' ou 'production'${NC}"
    exit 1
fi

ODOO_CONF="/etc/odoo/odoo.conf"
TENANT="${DATABASE#odoo_stinger_}"
ODOO_CONTAINER="odoo_stinger_${TENANT}"
# Conteneur PostgreSQL Odoo (convention dorevia: odoo_db_<env>_<tenant>)
POSTGRES_CONTAINER="odoo_db_stinger_${TENANT}"
# Vérifier que le conteneur existe (évite de prendre un autre postgres, ex. Sylius)
if ! docker ps -a --format "{{.Names}}" | grep -q "^${POSTGRES_CONTAINER}$"; then
    echo -e "${RED}Erreur: Conteneur PostgreSQL Odoo introuvable: ${POSTGRES_CONTAINER}${NC}"
    echo "Vérifiez que l'instance Odoo stinger pour ce tenant est bien déployée."
    exit 1
fi

echo -e "${GREEN}🚀 Déploiement SPEC v1.1.1${NC}"
echo "Base de données: $DATABASE"
echo "Environnement: $ENVIRONMENT"
echo "Container Odoo: $ODOO_CONTAINER"
echo "Container PostgreSQL: $POSTGRES_CONTAINER"
if [ "$DRY_RUN" = "--dry-run" ]; then
    echo -e "${YELLOW}Mode DRY-RUN (simulation uniquement)${NC}"
fi
echo ""

# Fonction pour exécuter une commande (ou la simuler en dry-run)
run_cmd() {
    local cmd="$1"
    local desc="$2"
    
    echo -e "${YELLOW}→ $desc${NC}"
    if [ "$DRY_RUN" != "--dry-run" ]; then
        eval "$cmd"
    else
        echo "  [DRY-RUN] $cmd"
    fi
    echo ""
}

# ========== Pré-déploiement ==========

echo -e "${GREEN}📋 Pré-déploiement${NC}"

# Backup base de données
BACKUP_FILE="backup_${DATABASE}_$(date +%Y%m%d_%H%M%S).sql"
run_cmd "docker exec -e PGPASSWORD=odoo $POSTGRES_CONTAINER pg_dump -U odoo -d $DATABASE > $BACKUP_FILE" \
    "Backup base de données → $BACKUP_FILE"

# Vérifier que le backup existe
if [ "$DRY_RUN" != "--dry-run" ] && [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Erreur: Backup non créé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backup créé: $BACKUP_FILE${NC}"
echo ""

# ========== Déploiement Module Odoo ==========

echo -e "${GREEN}📦 Déploiement Module Odoo${NC}"

# Arrêter Odoo pour éviter conflit de port (upgrade en one-shot)
ODOO_RUNNING=$(docker ps --format "{{.Names}}" | grep -E "^${ODOO_CONTAINER}$" || echo "")
if [ -n "$ODOO_RUNNING" ]; then
    echo -e "${YELLOW}→ Arrêt d'Odoo pour mise à jour du module${NC}"
    if [ "$DRY_RUN" != "--dry-run" ]; then
        docker stop $ODOO_CONTAINER
        sleep 2
    fi
    echo ""
fi

# Mise à jour du module en one-shot (compose run) pour éviter "Address already in use"
COMPOSE_DIR="${ROOT_DIR}/tenants/${TENANT}/apps/odoo/stinger"
if [ -f "${COMPOSE_DIR}/docker-compose.yml" ]; then
    run_cmd "cd ${COMPOSE_DIR} && docker compose run --rm odoo odoo -c $ODOO_CONF -d $DATABASE -u dorevia_vault_connector --stop-after-init" \
        "Mise à jour module dorevia_vault_connector (one-shot)"
else
    # Fallback si pas de compose (ex. container lancé à la main)
    run_cmd "docker start $ODOO_CONTAINER && sleep 3 && docker exec $ODOO_CONTAINER odoo -c $ODOO_CONF -d $DATABASE -u dorevia_vault_connector --stop-after-init" \
        "Mise à jour module dorevia_vault_connector (fallback)"
fi

# Redémarrer le conteneur Odoo (s'il était arrêté)
if [ -n "$ODOO_RUNNING" ] && [ "$DRY_RUN" != "--dry-run" ]; then
    echo -e "${YELLOW}→ Redémarrage du conteneur Odoo${NC}"
    docker start $ODOO_CONTAINER
    sleep 2
    echo ""
fi

# Vérifier les erreurs (logs du conteneur principal après redémarrage)
if [ "$DRY_RUN" != "--dry-run" ]; then
    sleep 3
    ERRORS=$(docker logs $ODOO_CONTAINER --tail 30 2>&1 | grep -i "error\|traceback\|fatal" | head -5 || true)
    if [ -n "$ERRORS" ]; then
        echo -e "${RED}⚠️  Erreurs détectées dans les logs:${NC}"
        echo "$ERRORS"
        echo ""
        read -p "Continuer malgré les erreurs ? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}Déploiement annulé${NC}"
            exit 1
        fi
    fi
fi

echo -e "${GREEN}✅ Module mis à jour${NC}"
echo ""

# ========== Configuration Paramètres Système ==========

echo -e "${GREEN}⚙️  Configuration Paramètres Système${NC}"

# Flag PROD
if [ "$ENVIRONMENT" = "production" ]; then
    DEBUG_ACTIONS="0"
    echo -e "${YELLOW}→ Configuration flag PROD: dorevia.debug.actions = 0${NC}"
else
    DEBUG_ACTIONS="1"
    echo -e "${YELLOW}→ Configuration flag DEV/STAGING: dorevia.debug.actions = 1${NC}"
fi

# Script Python pour configurer les paramètres
PYTHON_SCRIPT=$(cat <<EOF
import sys
env = sys.modules['odoo'].env
param = env['ir.config_parameter'].sudo()

# Flag PROD
param.set_param('dorevia.debug.actions', '$DEBUG_ACTIONS')
print(f"✅ dorevia.debug.actions = $DEBUG_ACTIONS")

# Seuils d'abandon (optionnel, valeurs par défaut)
param.set_param('dorevia.vault.max_attempts_proof', '20')
param.set_param('dorevia.vault.max_age_pending_proof_hours', '24')
print("✅ Seuils d'abandon configurés (20 tentatives, 24h)")

# Vérifier configuration existante
required_params = [
    'dorevia.dvig.internal.token',
    'dorevia.vault.url',
    'dorevia.vault.token',
]

for key in required_params:
    value = param.get_param(key)
    if not value:
        print(f"⚠️  {key} non configuré")
    else:
        print(f"✅ {key} configuré")
EOF
)

run_cmd "docker exec -i $ODOO_CONTAINER odoo shell -c $ODOO_CONF -d $DATABASE <<'PYTHON_EOF'
$PYTHON_SCRIPT
PYTHON_EOF" \
    "Configuration paramètres système"

echo -e "${GREEN}✅ Paramètres configurés${NC}"
echo ""

# ========== Vérification CRON Reconciler ==========

echo -e "${GREEN}⏰ Vérification CRON Reconciler${NC}"

PYTHON_SCRIPT=$(cat <<EOF
import sys
env = sys.modules['odoo'].env

cron = env['ir.cron'].search([('name', '=', 'Vault Reconciler (Addendum v1.1.1-add1)')])
if not cron.exists():
    print("❌ CRON reconciler non trouvé")
    sys.exit(1)

if not cron.active:
    print("⚠️  CRON reconciler inactif, activation...")
    cron.active = True

print(f"✅ CRON reconciler actif (intervalle: {cron.interval_number} {cron.interval_type})")

# Vérifier méthode
if not hasattr(env['account.move'], 'cron_vault_reconciler'):
    print("❌ Méthode cron_vault_reconciler non trouvée")
    sys.exit(1)

print("✅ Méthode cron_vault_reconciler trouvée")
EOF
)

run_cmd "docker exec -i $ODOO_CONTAINER odoo shell -c $ODOO_CONF -d $DATABASE <<'PYTHON_EOF'
$PYTHON_SCRIPT
PYTHON_EOF" \
    "Vérification CRON reconciler"

echo -e "${GREEN}✅ CRON reconciler vérifié${NC}"
echo ""

# ========== Vérification DVIG Scheduler ==========

echo -e "${GREEN}🔄 Vérification DVIG Scheduler${NC}"

DVIG_CONTAINER="dvig-core-stinger"

# Vérifier variables d'environnement
SCHEDULER_ENABLED=$(docker exec $DVIG_CONTAINER env 2>/dev/null | grep "DVIG_SCHEDULER_ENABLED" | cut -d'=' -f2 || echo "")
if [ "$SCHEDULER_ENABLED" != "1" ]; then
    echo -e "${YELLOW}⚠️  DVIG_SCHEDULER_ENABLED n'est pas à 1${NC}"
    echo "   Vérifiez la configuration Docker Compose"
else
    echo -e "${GREEN}✅ DVIG_SCHEDULER_ENABLED=1${NC}"
fi

# Vérifier logs scheduler
SCHEDULER_LOGS=$(docker logs $DVIG_CONTAINER --tail 50 2>&1 | grep -i "scheduler\|outbox_worker_start" | tail -3 || true)
if [ -n "$SCHEDULER_LOGS" ]; then
    echo -e "${GREEN}✅ Scheduler actif (logs détectés)${NC}"
else
    echo -e "${YELLOW}⚠️  Aucun log scheduler détecté (peut être normal si récemment démarré)${NC}"
fi

echo ""

# ========== Redémarrage Odoo ==========

echo -e "${GREEN}🔄 Redémarrage Odoo${NC}"

run_cmd "docker restart $ODOO_CONTAINER" \
    "Redémarrage container Odoo"

# Attendre que Odoo démarre
echo "⏳ Attente démarrage Odoo (10 secondes)..."
sleep 10

# Vérifier que Odoo démarre correctement
if [ "$DRY_RUN" != "--dry-run" ]; then
    ERRORS=$(docker logs $ODOO_CONTAINER --tail 50 2>&1 | grep -i "error\|traceback\|fatal" | head -5 || true)
    if [ -n "$ERRORS" ]; then
        echo -e "${RED}⚠️  Erreurs détectées après redémarrage:${NC}"
        echo "$ERRORS"
    else
        echo -e "${GREEN}✅ Odoo démarré sans erreur${NC}"
    fi
    
    # Vérifier queue_job
    JOBRUNNER_LOGS=$(docker logs $ODOO_CONTAINER --tail 100 2>&1 | grep -i "jobrunner\|queue_job" | tail -3 || true)
    if [ -n "$JOBRUNNER_LOGS" ]; then
        echo -e "${GREEN}✅ Queue_job actif${NC}"
    else
        echo -e "${YELLOW}⚠️  Aucun log jobrunner détecté${NC}"
    fi
fi

echo ""

# ========== Validation Post-Déploiement ==========

echo -e "${GREEN}✅ Validation Post-Déploiement${NC}"

PYTHON_SCRIPT=$(cat <<EOF
import sys
env = sys.modules['odoo'].env

# Vérifier flag PROD
param = env['ir.config_parameter'].sudo()
debug_actions = param.get_param('dorevia.debug.actions', '0')
expected = '0' if '$ENVIRONMENT' == 'production' else '1'

if debug_actions == expected:
    print(f"✅ Flag PROD correct: dorevia.debug.actions = {debug_actions}")
else:
    print(f"⚠️  Flag PROD incorrect: attendu {expected}, obtenu {debug_actions}")

# Vérifier CRON reconciler
cron = env['ir.cron'].search([('name', '=', 'Vault Reconciler')])
if cron.exists() and cron.active:
    print(f"✅ CRON reconciler actif")
else:
    print("❌ CRON reconciler non actif")

# Vérifier méthode
if hasattr(env['account.move'], 'cron_vault_reconciler'):
    print("✅ Méthode cron_vault_reconciler disponible")
else:
    print("❌ Méthode cron_vault_reconciler non disponible")

# Vérifier méthode _can_enqueue_proof
if hasattr(env['account.move'], '_can_enqueue_proof'):
    print("✅ Méthode _can_enqueue_proof disponible")
else:
    print("❌ Méthode _can_enqueue_proof non disponible")

# Vérifier méthode _check_abandon_thresholds
if hasattr(env['account.move'], '_check_abandon_thresholds'):
    print("✅ Méthode _check_abandon_thresholds disponible")
else:
    print("❌ Méthode _check_abandon_thresholds non disponible")
EOF
)

run_cmd "docker exec -i $ODOO_CONTAINER odoo shell -c $ODOO_CONF -d $DATABASE <<'PYTHON_EOF'
$PYTHON_SCRIPT
PYTHON_EOF" \
    "Validation post-déploiement"

echo ""

# ========== Résumé ==========

echo -e "${GREEN}📊 Résumé du Déploiement${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Module dorevia_vault_connector mis à jour"
echo "✅ Paramètres système configurés"
echo "✅ CRON reconciler vérifié"
echo "✅ DVIG scheduler vérifié"
echo "✅ Odoo redémarré"
echo ""
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo "1. Exécuter les tests fonctionnels (Phase 1)"
echo "2. Valider le fonctionnement avec une facture de test"
echo "3. Surveiller les métriques et logs pendant 24h"
echo ""
echo -e "${GREEN}✅ Déploiement terminé !${NC}"
