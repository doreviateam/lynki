#!/bin/bash
# Corrige le token DVIG pour o19 (401 Unauthorized sur /ingest)
# Le token doit être le secret brut, pas l'ID (tok_lab_o19_002).
# Usage: ./fix_vault_token.sh

set -euo pipefail
ROOT="/opt/dorevia-plateform"
LAB_DIR="$ROOT/tenants/o19/apps/odoo/lab"
TOKENS_FILE="$ROOT/tenants/core-stinger/secrets/dvig.tokens.yml"
DB_NAME="odoo_lab_o19"

echo "=== Correction token DVIG o19 ==="

# 1. Générer nouveau token
echo "[1/4] Génération nouveau token..."
cd "$ROOT/sources/dvig" || exit 1
OUTPUT=$(python3 -m dvig.cli.token_gen --tenant o19 --univers odoo --output token 2>&1)
TOKEN_RAW=$(echo "$OUTPUT" | grep "^TOKEN=" | cut -d'=' -f2)
TOKEN_HASH=$(echo "$OUTPUT" | grep "^HASH=" | cut -d'=' -f2)

if [[ -z "$TOKEN_RAW" || -z "$TOKEN_HASH" ]]; then
  echo "ERREUR: Échec génération token"
  exit 1
fi

# 2. Mettre à jour core-stinger tokens (remplacer tok_lab_o19_*)
echo "[2/4] Mise à jour $TOKENS_FILE..."
python3 - "$TOKENS_FILE" "$TOKEN_HASH" << 'PYEOF'
import sys, yaml
from datetime import datetime, timezone
tokens_file = sys.argv[1]
token_hash = sys.argv[2]
with open(tokens_file, "r") as f:
    data = yaml.safe_load(f)
tokens = [t for t in data.get("tokens", []) if t.get("tenant") != "o19"]
tokens.append({
    "id": "tok_lab_o19_003",
    "token_hash": token_hash,
    "tenant": "o19",
    "univers": "odoo",
    "status": "active",
    "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "comment": "LAB - odoo.lab.o19 (tenant DNS: o19) [regénéré fix 401]"
})
data["tokens"] = tokens
with open(tokens_file, "w") as f:
    yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
PYEOF

# 3. Recharger DVIG
echo "[3/4] Rechargement DVIG..."
docker restart dvig-core-stinger 2>/dev/null || true
sleep 3

# 4. Configurer Odoo
echo "[4/4] Configuration Odoo avec le nouveau token..."
docker exec -e DOREVIA_DVIG_TOKEN="$TOKEN_RAW" -i odoo_lab_o19 odoo shell -d $DB_NAME --no-http < "$LAB_DIR/configure_vault_dvig.py" 2>&1 | tail -12

# Sauvegarder le token pour reinstall_o19.sh (optionnel)
mkdir -p "$ROOT/tenants/o19/secrets"
echo "$TOKEN_RAW" > "$ROOT/tenants/o19/secrets/dvig.token"
chmod 600 "$ROOT/tenants/o19/secrets/dvig.token" 2>/dev/null || true

echo ""
echo "=== Terminé ==="
echo "Le token a été régénéré et configuré. Les factures devraient maintenant se sécuriser."
echo "Cliquez sur « Sécuriser maintenant » sur une facture en échec pour réessayer."
echo ""
echo "Token sauvegardé dans tenants/o19/secrets/dvig.token (pour reinstall_o19.sh)"
