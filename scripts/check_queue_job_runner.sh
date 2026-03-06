#!/bin/bash
# Vérifie si le job runner queue_job apparaît dans les logs Odoo (nécessaire pour exécuter les jobs vault).
# Usage: ./scripts/check_queue_job_runner.sh [conteneur_odoo]

CONTAINER="${1:-odoo_stinger_sarl-la-platine}"

echo "============================================================"
echo "🔍 Vérification job runner queue_job"
echo "   Conteneur: $CONTAINER"
echo "============================================================"
echo ""

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "❌ Conteneur '$CONTAINER' non trouvé (pas en cours d'exécution)."
  exit 1
fi

echo "Dernières lignes contenant 'queue_job' ou 'jobrunner' dans les logs :"
echo "------------------------------------------------------------"
docker logs "$CONTAINER" 2>&1 | grep -iE "queue_job|jobrunner|queue job" | tail -20

COUNT=$(docker logs "$CONTAINER" 2>&1 | grep -ciE "queue_job|jobrunner|queue job" || true)
if [ "${COUNT:-0}" -eq 0 ]; then
  echo ""
  echo "⚠️  Aucune ligne trouvée. Le job runner ne semble pas démarrer."
  echo "   → Vérifier odoo.conf : workers >= 2, server_wide_modules contient queue_job."
  echo "   → Voir ZeDocs/web14/QUEUE_JOB_NE_FAIT_PAS_SON_BOULOT.md"
  exit 1
fi

echo ""
echo "✅ Au moins une ligne queue_job/jobrunner trouvée. Runner peut être actif."
echo "   Pour confirmer après une validation de facture :"
echo "   docker logs $CONTAINER 2>&1 | tail -200 | grep -E 'Vault|Trigger|Worker DVIG'"
