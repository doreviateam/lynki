#!/usr/bin/env bash
# Lot 5 ADR-001 (ZeDocs/web51) : vérifie qu'aucun code Linky ne référence DLP_URL ni DIVA_URL.
# À exécuter en CI (ou en local) pour éviter toute régression. Sortie 0 = conforme, 1 = régression.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Exclure build et dépendances (source seule)
HITS=$(grep -r -l -E 'DLP_URL|DIVA_URL' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' . 2>/dev/null \
  | grep -v -E '^\./\.next/|^\./node_modules/' || true)
if [ -n "$HITS" ]; then
  echo "ADR-001 régression: DLP_URL ou DIVA_URL trouvé(s) dans Linky (conformité requise)."
  echo "$HITS"
  exit 1
fi
echo "ADR-001: aucun DLP_URL/DIVA_URL dans units/dorevia-linky (conforme)."
exit 0
