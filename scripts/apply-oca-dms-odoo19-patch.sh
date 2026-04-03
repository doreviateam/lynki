#!/usr/bin/env bash
# Applique le patch de compatibilité Odoo 19 sur le module OCA dms (sources/oca/dms).
# À lancer après clone / mise à jour du sous-module dms, avant install du module « dms » dans Odoo.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DMS_REPO="$ROOT/sources/oca/dms"
PATCH="$ROOT/patches/dms-odoo19-compat-wip.patch"

if [[ ! -d "$DMS_REPO/dms" ]]; then
  echo "[apply-oca-dms-odoo19] ERREUR: répertoire dms introuvable ($DMS_REPO)" >&2
  exit 1
fi
if [[ ! -f "$PATCH" ]]; then
  echo "[apply-oca-dms-odoo19] ERREUR: patch introuvable ($PATCH)" >&2
  exit 1
fi

cd "$DMS_REPO"
set +e
patch -p1 -N < "$PATCH"
rc=$?
set -e
if [[ $rc -eq 0 ]]; then
  echo "[apply-oca-dms-odoo19] OK."
else
  echo "[apply-oca-dms-odoo19] Code $rc — si « previously applied », le patch est déjà là." >&2
fi
