#!/bin/sh
set -e

POSTGRES_PASSWORD=$(printf '%s' "${POSTGRES_PASSWORD:-}" | tr -d '\r\n')
ADMIN_PASSWD=$(printf '%s' "${ADMIN_PASSWD:-}" | tr -d '\r\n')

if [ -z "$POSTGRES_PASSWORD" ]; then
  echo "[run_odoo] ERREUR: POSTGRES_PASSWORD vide"
  exit 1
fi

if [ -z "$ADMIN_PASSWD" ]; then
  echo "[run_odoo] ERREUR: ADMIN_PASSWD vide"
  exit 1
fi

python3 - <<'PY'
import os, sys

tpl_path = "/etc/odoo/odoo.conf.template"
out_path = "/tmp/odoo.conf"

with open(tpl_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("__POSTGRES_PASSWORD__", os.environ["POSTGRES_PASSWORD"])
content = content.replace("__ADMIN_PASSWD__", os.environ["ADMIN_PASSWD"])

if "__POSTGRES_PASSWORD__" in content or "__ADMIN_PASSWD__" in content:
    print("[run_odoo] ERREUR: placeholders non remplacés")
    sys.exit(1)

with open(out_path, "w", encoding="utf-8") as f:
    f.write(content)

print("[run_odoo] /tmp/odoo.conf généré")
print("[run_odoo] POSTGRES_PASSWORD length =", len(os.environ["POSTGRES_PASSWORD"]))
print("[run_odoo] ADMIN_PASSWD length =", len(os.environ["ADMIN_PASSWD"]))
PY

/mnt/custom-addons/bin/oca_flatten.sh
exec odoo -c /tmp/odoo.conf
