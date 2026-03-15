#!/usr/bin/env bash
# Première mise à disposition des données — exécute les 3 jobs de snapshot Phase 3 (ADR-0010, E2–E4).
# Remplit les tables snapshots pour que les blocs Évolution Trésorerie / Encours / BFR affichent des séries.
#
# Usage :
#   TENANT=core ./scripts/run_evolution_snapshots_first_run.sh
#   TENANT=core MODE=exercice ./scripts/run_evolution_snapshots_first_run.sh   # exercice à date
#
# Optionnel :
#   MODE=exercice        — exécute pour chaque mois de l'exercice (janvier → dernier mois clôturé)
#   YEAR=2026            — année exercice si MODE=exercice (défaut = année courante)
#   COMPANY_ID=1         — scope société (sinon consolidé)
#   AS_OF_DATE=2026-01-31 — une seule date (ignoré si MODE=exercice)

set -e

BASE="${VAULT_URL:-http://localhost:8080}"
BASE="${BASE%/}"
TENANT="${TENANT:?TENANT requis (ex: core, laplatine2026)}"
COMPANY_ID="${COMPANY_ID:-}"
MODE="${MODE:-}"
YEAR="${YEAR:-$(date +%Y)}"

# Liste des as_of_date à traiter (dernier jour calendaire de chaque mois)
get_dates_exercice() {
  local year="${1:-$(date +%Y)}"
  local end_month  # dernier mois clôturé = mois précédent
  if date -d "$(date +%Y-%m-01) -1 day" +%Y-%m &>/dev/null; then
    end_month=$(date -d "$(date +%Y-%m-01) -1 day" +%Y-%m)
  else
    end_month=$(date -v-1m +%Y-%m)
  fi
  local m=1
  while [ $m -le 12 ]; do
    local ym=$(printf "%s-%02d" "$year" "$m")
    [ "$ym" \> "$end_month" ] && break
    # dernier jour du mois
    if date -d "${ym}-01 +1 month -1 day" +%Y-%m-%d &>/dev/null; then
      date -d "${ym}-01 +1 month -1 day" +%Y-%m-%d
    else
      date -j -f "%Y-%m-%d" "${ym}-01" -v+1m -v-1d +%Y-%m-%d 2>/dev/null || true
    fi
    m=$((m + 1))
  done
}

run_job() {
  local name="$1"
  local path="$2"
  local as_of="$3"
  local q="tenant=${TENANT}&as_of_date=${as_of}"
  [ -n "$COMPANY_ID" ] && q="${q}&company_id=${COMPANY_ID}"
  if resp=$(curl -sS -w "\n%{http_code}" -X POST "${BASE}${path}?${q}" -H "Accept: application/json"); then
    code=$(echo "$resp" | tail -n1)
    body=$(echo "$resp" | sed '$d')
    if [ "$code" = "200" ]; then
      echo "  $name OK ($as_of)"
      return 0
    else
      echo "  $name ERREUR HTTP $code ($as_of)"
      return 1
    fi
  else
    echo "  $name Échec curl ($as_of)"
    return 1
  fi
}

run_one_date() {
  local as_of="$1"
  echo ""
  echo ">>> as_of_date=$as_of"
  run_job "Trésorerie" "/ui/jobs/treasury-snapshot" "$as_of" || true
  run_job "AR (Encours)" "/ui/jobs/ar-snapshot" "$as_of" || true
  run_job "AP (BFR)" "/ui/jobs/ap-snapshot" "$as_of" || true
}

if [ "$MODE" = "exercice" ]; then
  echo "=== Exercice à date — Snapshots Phase 3 ==="
  echo "VAULT_URL=$BASE"
  echo "TENANT=$TENANT"
  echo "YEAR=$YEAR"
  echo "COMPANY_ID=${COMPANY_ID:-<consolidé>}"
  DATES=$(get_dates_exercice "$YEAR")
  if [ -z "$DATES" ]; then
    echo "Aucun mois à traiter pour l'exercice $YEAR. Vérifier get_dates_exercice ou définir AS_OF_DATE à la main."
    exit 1
  fi
  echo "Dates : $DATES"
  for as_of in $DATES; do
    run_one_date "$as_of"
  done
else
  AS_OF_DATE="${AS_OF_DATE:-}"
  if [ -z "$AS_OF_DATE" ]; then
    if date -d "$(date +%Y-%m-01) -1 day" +%Y-%m-%d &>/dev/null; then
      AS_OF_DATE=$(date -d "$(date +%Y-%m-01) -1 day" +%Y-%m-%d)
    elif date -v-1m +%Y-%m-01 &>/dev/null; then
      AS_OF_DATE=$(date -j -f "%Y-%m-%d" "$(date -v-1m +%Y-%m-01)" -v+1m -v-1d +%Y-%m-%d)
    else
      echo "Définir AS_OF_DATE (ex: export AS_OF_DATE=2026-02-28) ou MODE=exercice pour l'exercice à date"
      exit 1
    fi
  fi
  echo "=== Première mise à disposition — Snapshots Phase 3 ==="
  echo "VAULT_URL=$BASE"
  echo "TENANT=$TENANT"
  echo "COMPANY_ID=${COMPANY_ID:-<consolidé>}"
  echo "AS_OF_DATE=$AS_OF_DATE"
  run_one_date "$AS_OF_DATE"
fi

echo ""
echo "=== Terminé ==="
echo "Vérifier les séries :"
echo "  GET ${BASE}/ui/aggregations/treasury-series?tenant=${TENANT}&date_debut=${YEAR:-2020}-01-01&date_fin=2030-12-31"
echo "  GET ${BASE}/ui/aggregations/ar-series?tenant=${TENANT}&date_debut=${YEAR:-2020}-01-01&date_fin=2030-12-31"
echo "  GET ${BASE}/ui/aggregations/bfr-series?tenant=${TENANT}&date_debut=${YEAR:-2020}-01-01&date_fin=2030-12-31"
