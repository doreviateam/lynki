#!/usr/bin/env bash
# Revue DIVA — valide le flux sur toutes les périodes (YTD + 12 mois)
# Usage : ./scripts/revue_diva_toutes_periodes.sh [ANNEE]
# Exemple : ./scripts/revue_diva_toutes_periodes.sh 2026

set -e
YEAR="${1:-$(date +%Y)}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAILED=0

echo "=== Revue DIVA — Cartes × Périodes ==="
echo "Année : $YEAR"
echo ""

# YTD
echo "--- ytd (Exercice à date) ---"
if "$ROOT/scripts/diagnostic_diva_analyse_expiree.sh" ytd "$YEAR"; then
  echo "✅ ytd OK"
else
  echo "❌ ytd FAIL"
  FAILED=$((FAILED + 1))
fi
echo ""

# Mois 1 à 12
for m in 1 2 3 4 5 6 7 8 9 10 11 12; do
  echo "--- Mois $m ---"
  if "$ROOT/scripts/diagnostic_diva_analyse_expiree.sh" "$m" "$YEAR"; then
    echo "✅ Mois $m OK"
  else
    echo "❌ Mois $m FAIL"
    FAILED=$((FAILED + 1))
  fi
  echo ""
done

echo "=== Fin revue : $FAILED période(s) en échec ==="
exit $FAILED
